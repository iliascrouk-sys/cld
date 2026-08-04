"""
Herramientas compartidas por los tests.

Lo importante de este fichero: el `ExchangeFalso`. Gracias a él, TODOS los
tests de la Fase 1 corren sin conexión a internet, en menos de un segundo y
con resultados idénticos siempre. Un test que depende de la red es un test
que un día falla por motivos que no tienen nada que ver con tu código, y que
acabas ignorando: en cuanto empiezas a ignorar tests, ya no tienes tests.

Además el exchange falso permite provocar averías que en producción existen
y en un test manual son imposibles de reproducir: respuestas vacías, velas
repetidas, velas que no avanzan, valores contradictorios.
"""

from __future__ import annotations

from typing import Any, Sequence

import numpy as np
import pandas as pd
import pytest

from qlab.datos.esquema import COLUMNAS, NOMBRE_INDICE, marcas_ms, obtener_timeframe

MS_HORA = 3_600_000


def velas_sinteticas(
    n: int,
    *,
    inicio_ms: int = 1_600_000_000_000 - (1_600_000_000_000 % MS_HORA),
    paso_ms: int = MS_HORA,
    precio_inicial: float = 100.0,
    semilla: int = 7,
) -> pd.DataFrame:
    """
    Genera velas coherentes y sin huecos.

    Son un paseo aleatorio suave. NO sirven para evaluar estrategias (no
    tienen ninguna estructura de mercado real); sirven para comprobar que la
    maquinaria hace lo que dice.
    """
    rng = np.random.default_rng(semilla)
    retornos = rng.normal(0, 0.004, size=n)
    cierres = precio_inicial * np.exp(np.cumsum(retornos))
    aperturas = np.concatenate([[precio_inicial], cierres[:-1]])
    ruido_alto = np.abs(rng.normal(0, 0.002, size=n))
    ruido_bajo = np.abs(rng.normal(0, 0.002, size=n))
    maximos = np.maximum(aperturas, cierres) * (1 + ruido_alto)
    minimos = np.minimum(aperturas, cierres) * (1 - ruido_bajo)
    volumen = np.abs(rng.normal(1_000, 200, size=n)) + 1.0

    marcas = np.arange(inicio_ms, inicio_ms + n * paso_ms, paso_ms, dtype="int64")
    df = pd.DataFrame(
        {
            "open": aperturas,
            "high": maximos,
            "low": minimos,
            "close": cierres,
            "volume": volumen,
        },
        index=pd.DatetimeIndex(
            pd.to_datetime(marcas, unit="ms", utc=True), name=NOMBRE_INDICE
        ),
    )
    return df.loc[:, list(COLUMNAS)].astype("float64")


def a_filas_ccxt(df: pd.DataFrame) -> list[list[Any]]:
    """La tabla canónica de vuelta al formato crudo de ccxt."""
    marcas = marcas_ms(df.index)
    return [
        [int(ts), *[float(v) for v in fila]]
        for ts, fila in zip(marcas, df.loc[:, list(COLUMNAS)].to_numpy())
    ]


class ExchangeFalso:
    """
    Exchange de mentira con el mismo contrato que el de verdad.

    Parámetros de avería:
    - `limite_servidor`: cuántas velas devuelve como máximo por petición.
    - `solapar`: devuelve una vela de más al principio de cada respuesta,
      imitando el solape típico de la paginación real.
    - `estancado`: devuelve siempre el mismo primer trozo (simula un
      exchange que no avanza y provocaría un bucle infinito).
    - `vacio_desde_ms`: a partir de ese instante contesta con lista vacía.
    """

    def __init__(
        self,
        velas: pd.DataFrame,
        *,
        ahora: int | None = None,
        limite_servidor: int = 1000,
        solapar: bool = False,
        estancado: bool = False,
        vacio_desde_ms: int | None = None,
    ):
        self.velas = velas
        self.marcas = marcas_ms(velas.index)
        self._ahora = (
            ahora if ahora is not None else int(self.marcas[-1]) + MS_HORA
        )
        self.limite_servidor = limite_servidor
        self.solapar = solapar
        self.estancado = estancado
        self.vacio_desde_ms = vacio_desde_ms
        self.peticiones: list[tuple[str, str, int, int]] = []

    def obtener_ohlcv(
        self, simbolo: str, timeframe: str, desde_ms: int, limite: int
    ) -> list[Sequence[Any]]:
        self.peticiones.append((simbolo, timeframe, int(desde_ms), int(limite)))
        if self.vacio_desde_ms is not None and desde_ms >= self.vacio_desde_ms:
            return []
        arranque = 0 if self.estancado else int(np.searchsorted(self.marcas, desde_ms))
        if self.solapar and arranque > 0:
            arranque -= 1
        tope = min(limite, self.limite_servidor)
        trozo = self.velas.iloc[arranque : arranque + tope]
        return a_filas_ccxt(trozo)

    def ahora_ms(self) -> int:
        return self._ahora


@pytest.fixture
def tf_1h():
    return obtener_timeframe("1h")


@pytest.fixture
def velas_limpias():
    return velas_sinteticas(500)


@pytest.fixture
def cache_tmp(tmp_path):
    return tmp_path / "cache"
