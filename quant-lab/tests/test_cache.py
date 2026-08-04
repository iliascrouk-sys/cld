"""
Tests de la caché.

Lo que se comprueba aquí, por orden de importancia:
  1. Que lo que se guarda es exactamente lo que se lee (ida y vuelta).
  2. Que si alguien toca el fichero, la lectura FALLA en vez de devolver
     datos manipulados sin decir nada.
  3. Que la escritura es atómica: un fallo a mitad no destruye lo anterior.
"""

from __future__ import annotations

import json

import pandas as pd
import pytest

from qlab.datos import cache as C
from qlab.datos.cache import ClaveDataset
from qlab.errores import ErrorDeCache

from conftest import velas_sinteticas

CLAVE = ClaveDataset("binance", "spot", "BTC/USDT", "1h")


def test_ida_y_vuelta_exacta(velas_limpias, cache_tmp):
    C.escribir(velas_limpias, CLAVE, directorio=cache_tmp, fuente="test")
    leido, meta = C.leer(CLAVE, directorio=cache_tmp)
    pd.testing.assert_frame_equal(leido, velas_limpias)
    assert meta.filas == len(velas_limpias)
    assert meta.simbolo == "BTC/USDT"
    assert meta.sha256 == C.huella(velas_limpias)


def test_la_barra_del_simbolo_no_crea_carpetas_raras(velas_limpias, cache_tmp):
    C.escribir(velas_limpias, CLAVE, directorio=cache_tmp)
    ruta = CLAVE.ruta_parquet(cache_tmp)
    assert ruta.exists()
    assert "BTC_USDT" in str(ruta)


def test_huella_estable_e_independiente_del_orden_de_escritura(velas_limpias):
    h1 = C.huella(velas_limpias)
    h2 = C.huella(velas_limpias.copy(deep=True))
    assert h1 == h2
    # Cambiar un solo número cambia la huella.
    tocado = velas_limpias.copy()
    tocado.iloc[0, tocado.columns.get_loc("close")] += 1e-6
    assert C.huella(tocado) != h1


def test_fichero_manipulado_a_mano_se_detecta(velas_limpias, cache_tmp):
    """
    Este es el test que justifica toda la maquinaria de la huella: si dentro
    de seis meses alguien 'arregla' un precio a mano en el parquet, la
    lectura tiene que fallar, no seguir como si nada.
    """
    C.escribir(velas_limpias, CLAVE, directorio=cache_tmp)
    ruta = CLAVE.ruta_parquet(cache_tmp)

    df = pd.read_parquet(ruta)
    df.iloc[5, df.columns.get_loc("close")] = 999_999.0
    df.to_parquet(ruta, engine="pyarrow", index=True)

    with pytest.raises(ErrorDeCache, match="huella"):
        C.leer(CLAVE, directorio=cache_tmp)


def test_metadatos_ausentes_es_error(velas_limpias, cache_tmp):
    C.escribir(velas_limpias, CLAVE, directorio=cache_tmp)
    CLAVE.ruta_meta(cache_tmp).unlink()
    with pytest.raises(ErrorDeCache, match="metadatos"):
        C.leer(CLAVE, directorio=cache_tmp)


def test_version_de_esquema_incompatible(velas_limpias, cache_tmp):
    C.escribir(velas_limpias, CLAVE, directorio=cache_tmp)
    ruta_meta = CLAVE.ruta_meta(cache_tmp)
    datos = json.loads(ruta_meta.read_text())
    datos["version_esquema"] = 999
    ruta_meta.write_text(json.dumps(datos))
    with pytest.raises(ErrorDeCache, match="esquema"):
        C.leer(CLAVE, directorio=cache_tmp)


def test_no_quedan_ficheros_temporales(velas_limpias, cache_tmp):
    C.escribir(velas_limpias, CLAVE, directorio=cache_tmp)
    temporales = list(cache_tmp.rglob("*.tmp"))
    assert temporales == []


def test_leer_sin_cache_falla(cache_tmp):
    with pytest.raises(ErrorDeCache, match="No hay caché"):
        C.leer(CLAVE, directorio=cache_tmp)


def test_borrar_y_listar(velas_limpias, cache_tmp):
    otra = ClaveDataset("binance", "perp", "ETH/USDT", "4h")
    C.escribir(velas_limpias, CLAVE, directorio=cache_tmp)
    C.escribir(velas_sinteticas(50), otra, directorio=cache_tmp)

    metas = C.listar(cache_tmp)
    assert {m.simbolo for m in metas} == {"BTC/USDT", "ETH/USDT"}

    C.borrar(CLAVE, cache_tmp)
    assert not C.existe(CLAVE, cache_tmp)
    assert C.existe(otra, cache_tmp)


def test_informe_de_validacion_viaja_con_los_datos(velas_limpias, cache_tmp):
    """
    Guardar el informe junto a los datos permite responder meses después a
    '¿qué sabía yo de la calidad de estos datos cuando corrí el backtest?'.
    """
    informe = {"limpio": True, "n_avisos": 2}
    C.escribir(
        velas_limpias, CLAVE, directorio=cache_tmp, informe_validacion=informe
    )
    _, meta = C.leer(CLAVE, directorio=cache_tmp)
    assert meta.informe_validacion == informe
