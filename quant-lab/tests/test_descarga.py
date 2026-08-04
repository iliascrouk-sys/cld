"""
Tests del paginador de descarga.

Aquí se comprueban los errores clásicos de encadenar peticiones a un
exchange. Cada test corresponde a una avería real que se ha visto en
producción en algún momento por alguien:

  - solapes que duplican velas,
  - exchanges que no avanzan y provocan bucles infinitos,
  - respuestas vacías a mitad de un rango,
  - y sobre todo: la vela a medio formar colándose en el dataset.
"""

from __future__ import annotations

import pandas as pd
import pytest

from qlab.datos.descarga import descargar_rango, fusionar
from qlab.datos.esquema import marcas_ms
from qlab.errores import ErrorDeDescarga

from conftest import MS_HORA, ExchangeFalso, velas_sinteticas


def _rango(df):
    marcas = marcas_ms(df.index)
    return int(marcas[0]), int(marcas[-1])


def test_descarga_completa_en_una_peticion(tf_1h):
    velas = velas_sinteticas(100)
    ex = ExchangeFalso(velas)
    desde, hasta = _rango(velas)
    res = descargar_rango(ex, "BTC/USDT", tf_1h, desde, hasta)
    pd.testing.assert_frame_equal(res.velas, velas)
    assert res.peticiones == 1


def test_paginacion_encadena_bien(tf_1h):
    """El servidor solo da 50 velas por vez; hay que pedir 1000."""
    velas = velas_sinteticas(1000)
    ex = ExchangeFalso(velas, limite_servidor=50)
    desde, hasta = _rango(velas)
    res = descargar_rango(ex, "BTC/USDT", tf_1h, desde, hasta)
    assert len(res.velas) == 1000
    assert res.peticiones >= 20
    pd.testing.assert_frame_equal(res.velas, velas)
    assert res.velas.index.is_monotonic_increasing
    assert not res.velas.index.has_duplicates


def test_solape_de_paginacion_no_deja_duplicados(tf_1h):
    """
    El servidor devuelve una vela repetida al principio de cada página.
    Es el fallo más habitual y el más silencioso: sin esta limpieza, el
    dataset tendría velas dobles y el backtest contaría operaciones de más.
    """
    velas = velas_sinteticas(300)
    ex = ExchangeFalso(velas, limite_servidor=50, solapar=True)
    desde, hasta = _rango(velas)
    res = descargar_rango(ex, "BTC/USDT", tf_1h, desde, hasta)
    assert not res.velas.index.has_duplicates
    assert len(res.velas) == 300
    assert res.duplicados_exactos_eliminados > 0
    assert any("duplicados exactos" in n for n in res.notas)


def test_exchange_que_no_avanza_no_cuelga_el_proceso(tf_1h):
    """Sin la comprobación de progreso, esto sería un bucle infinito."""
    velas = velas_sinteticas(300)
    ex = ExchangeFalso(velas, limite_servidor=10, estancado=True)
    desde, hasta = _rango(velas)
    with pytest.raises(ErrorDeDescarga, match="no avanza"):
        descargar_rango(ex, "BTC/USDT", tf_1h, desde, hasta)


def test_respuesta_vacia_corta_la_descarga_sin_inventar_nada(tf_1h):
    velas = velas_sinteticas(300)
    marcas = marcas_ms(velas.index)
    corte = int(marcas[150])
    ex = ExchangeFalso(velas, limite_servidor=50, vacio_desde_ms=corte)
    desde, hasta = _rango(velas)
    res = descargar_rango(ex, "BTC/USDT", tf_1h, desde, hasta)
    assert len(res.velas) == 150
    assert any("no devuelve más velas" in n for n in res.notas)


def test_la_vela_en_formacion_nunca_se_descarga(tf_1h):
    """
    DEFENSA ANTI-LOOK-AHEAD NÚMERO 1.

    El exchange ofrece 200 velas, pero el reloj está a mitad de la última.
    Esa vela todavía puede cambiar de valores, así que no debe entrar.
    """
    velas = velas_sinteticas(200)
    marcas = marcas_ms(velas.index)
    ahora = int(marcas[-1]) + MS_HORA // 2  # última vela a medio formar
    ex = ExchangeFalso(velas, ahora=ahora)
    res = descargar_rango(ex, "BTC/USDT", tf_1h, int(marcas[0]), int(marcas[-1]))
    assert len(res.velas) == 199
    assert int(marcas_ms(res.velas.index)[-1]) == int(marcas[-2])
    assert any("no han cerrado" in n or "no habían cerrado" in n for n in res.notas)


def test_pedir_solo_el_futuro_devuelve_vacio(tf_1h):
    velas = velas_sinteticas(50)
    marcas = marcas_ms(velas.index)
    ahora = int(marcas[-1]) + MS_HORA
    ex = ExchangeFalso(velas, ahora=ahora)
    res = descargar_rango(
        ex, "BTC/USDT", tf_1h, ahora + 10 * MS_HORA, ahora + 20 * MS_HORA
    )
    assert res.velas.empty
    assert res.peticiones == 0


def test_rango_invertido_es_error(tf_1h):
    velas = velas_sinteticas(10)
    ex = ExchangeFalso(velas)
    desde, hasta = _rango(velas)
    with pytest.raises(ErrorDeDescarga, match="invertido"):
        descargar_rango(ex, "BTC/USDT", tf_1h, hasta, desde)


def test_recorta_al_rango_pedido(tf_1h):
    velas = velas_sinteticas(500)
    marcas = marcas_ms(velas.index)
    ex = ExchangeFalso(velas, limite_servidor=100)
    res = descargar_rango(
        ex, "BTC/USDT", tf_1h, int(marcas[100]), int(marcas[199])
    )
    assert len(res.velas) == 100
    assert int(marcas_ms(res.velas.index)[0]) == int(marcas[100])
    assert int(marcas_ms(res.velas.index)[-1]) == int(marcas[199])


# --------------------------------------------------------------------------
# Fusión de datos viejos y nuevos
# --------------------------------------------------------------------------


def test_fusion_normal():
    velas = velas_sinteticas(100)
    unido = fusionar(velas.iloc[:60], velas.iloc[60:])
    pd.testing.assert_frame_equal(unido, velas)


def test_fusion_con_solape_identico():
    velas = velas_sinteticas(100)
    unido = fusionar(velas.iloc[:60], velas.iloc[40:])
    pd.testing.assert_frame_equal(unido, velas)


def test_fusion_con_valores_contradictorios_falla():
    """
    Si el histórico que ya tenías y el que acabas de descargar no coinciden,
    eso es una noticia importante, no un detalle a resolver a la brava
    quedándose con uno de los dos.
    """
    velas = velas_sinteticas(100)
    nuevo = velas.iloc[40:].copy()
    nuevo.iloc[0, nuevo.columns.get_loc("close")] *= 1.5
    with pytest.raises(ErrorDeDescarga, match="DISTINTOS"):
        fusionar(velas.iloc[:60], nuevo, contexto="test")


def test_fusion_tolera_ruido_de_coma_flotante():
    """Un bit de diferencia al ir y volver de JSON no es un conflicto real."""
    velas = velas_sinteticas(100)
    nuevo = velas.iloc[40:].copy()
    nuevo.iloc[0, nuevo.columns.get_loc("close")] *= 1 + 1e-15
    unido = fusionar(velas.iloc[:60], nuevo, contexto="test")
    assert len(unido) == 100
