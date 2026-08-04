"""
Tests del cliente real de ccxt.

No tocan la red: se sustituye el método de ccxt que hace la petición por uno
falso que se comporta como queremos. Lo que se comprueba es la política de
reintentos, que es donde está la lógica propia:

  - un fallo de RED se reintenta con espera creciente,
  - un error del exchange (símbolo que no existe) NO se reintenta,
  - si se agotan los intentos, el error final dice cuántos hubo.
"""

from __future__ import annotations

import pytest

from qlab.datos.exchange import ClienteCCXT
from qlab.errores import ErrorDeConfiguracion, ErrorDeDescarga

ccxt = pytest.importorskip("ccxt")


@pytest.fixture
def cliente():
    """Cliente real de ccxt, pero que no duerme de verdad entre reintentos."""
    esperas: list[float] = []
    c = ClienteCCXT("binance", "spot", reintentos=3, espera_inicial=2.0,
                    dormir=esperas.append)
    c.esperas = esperas  # type: ignore[attr-defined]
    return c


def test_mercado_desconocido():
    with pytest.raises(ErrorDeConfiguracion, match="Mercado"):
        ClienteCCXT("binance", "cfd")


def test_exchange_desconocido():
    with pytest.raises(ErrorDeConfiguracion, match="no conoce"):
        ClienteCCXT("mercadona")


def test_perp_configura_el_mercado_de_futuros():
    c = ClienteCCXT("binance", "perp")
    assert c._ex.options["defaultType"] == "future"


def test_reintenta_ante_fallo_de_red_y_acaba_bien(cliente, monkeypatch):
    intentos = {"n": 0}

    def flaky(*args, **kwargs):
        intentos["n"] += 1
        if intentos["n"] < 3:
            raise ccxt.NetworkError("conexión perdida")
        return [[1, 2, 3, 4, 5, 6]]

    monkeypatch.setattr(cliente._ex, "fetch_ohlcv", flaky)
    filas = cliente.obtener_ohlcv("BTC/USDT", "1h", 0, 10)
    assert filas == [[1, 2, 3, 4, 5, 6]]
    assert intentos["n"] == 3
    # Espera creciente: 2s y luego 4s.
    assert cliente.esperas == [2.0, 4.0]


def test_se_rinde_tras_agotar_los_intentos(cliente, monkeypatch):
    def siempre_falla(*args, **kwargs):
        raise ccxt.NetworkError("sin red")

    monkeypatch.setattr(cliente._ex, "fetch_ohlcv", siempre_falla)
    with pytest.raises(ErrorDeDescarga, match="3 intentos"):
        cliente.obtener_ohlcv("BTC/USDT", "1h", 0, 10)
    assert len(cliente.esperas) == 2  # duerme entre intentos, no tras el último


def test_error_del_exchange_no_se_reintenta(cliente, monkeypatch):
    """
    Pedir un símbolo que no existe está mal pidas las veces que lo pidas.
    Reintentarlo solo hace que tardes más en enterarte.
    """

    def simbolo_malo(*args, **kwargs):
        raise ccxt.BadSymbol("PEPITO/USDT no existe")

    monkeypatch.setattr(cliente._ex, "fetch_ohlcv", simbolo_malo)
    with pytest.raises(ErrorDeDescarga, match="rechazado"):
        cliente.obtener_ohlcv("PEPITO/USDT", "1h", 0, 10)
    assert cliente.esperas == []  # ni un reintento


def test_la_hora_viene_del_exchange(cliente, monkeypatch):
    monkeypatch.setattr(cliente._ex, "fetch_time", lambda: 1_700_000_000_000)
    assert cliente.ahora_ms() == 1_700_000_000_000


def test_si_el_exchange_no_da_la_hora_se_avisa(cliente, monkeypatch, caplog):
    """
    El reloj de referencia debe ser el del exchange. Si no está disponible se
    usa el local, pero avisando: un reloj local adelantado haría pasar por
    'cerrada' una vela que todavía se está formando.
    """

    def sin_hora():
        raise ccxt.NetworkError("no responde")

    monkeypatch.setattr(cliente._ex, "fetch_time", sin_hora)
    with caplog.at_level("WARNING"):
        marca = cliente.ahora_ms()
    assert marca > 1_600_000_000_000
    assert any("reloj local" in r.message for r in caplog.records)
