"""
Tests de la aduana de datos.

La regla que comprueban todos: **ante datos sucios, la validación se queja;
nunca los arregla**. Cada test ensucia los datos de una forma concreta y
verifica dos cosas: que se detecta, y que el DataFrame de salida no ha sido
modificado a espaldas de nadie.
"""

from __future__ import annotations

import numpy as np
import pandas as pd
import pytest

from qlab.datos import validacion as V
from qlab.datos.esquema import NOMBRE_INDICE, marcas_ms, obtener_timeframe
from qlab.errores import DatosSuciosError

from conftest import MS_HORA, velas_sinteticas


def _ahora_de(df) -> int:
    """Un reloj situado justo después de que cierre la última vela."""
    return int(marcas_ms(df.index)[-1]) + MS_HORA


def test_datos_limpios_no_dan_errores(velas_limpias, tf_1h):
    informe = V.validar_ohlcv(
        velas_limpias, tf_1h, simbolo="TEST", ahora_ms=_ahora_de(velas_limpias)
    )
    assert informe.limpio, informe.resumen()
    assert informe.errores == []
    assert informe.filas == len(velas_limpias)


def test_tabla_vacia_es_error(tf_1h):
    from qlab.datos.esquema import marco_vacio

    informe = V.validar_ohlcv(marco_vacio(), tf_1h, simbolo="TEST")
    assert informe.tiene(V.COD_TABLA_VACIA)
    assert not informe.limpio


def test_faltan_columnas(tf_1h, velas_limpias):
    informe = V.validar_ohlcv(velas_limpias.drop(columns=["volume"]), tf_1h)
    assert informe.tiene(V.COD_ESTRUCTURA)


def test_indice_sin_zona_horaria_es_error(velas_limpias, tf_1h):
    sin_tz = velas_limpias.copy()
    sin_tz.index = sin_tz.index.tz_localize(None)
    informe = V.validar_ohlcv(sin_tz, tf_1h)
    assert informe.tiene(V.COD_ESTRUCTURA)
    assert not informe.limpio


def test_hueco_detectado_y_no_rellenado(velas_limpias, tf_1h):
    """Quitamos 5 velas del medio: debe detectarlo y NO inventárselas."""
    con_hueco = velas_limpias.drop(velas_limpias.index[100:105])
    informe = V.validar_ohlcv(
        con_hueco, tf_1h, simbolo="TEST", ahora_ms=_ahora_de(con_hueco)
    )
    assert informe.tiene(V.COD_HUECO)
    assert not informe.limpio
    incidencia = next(i for i in informe.errores if i.codigo == V.COD_HUECO)
    assert incidencia.detalles["n_velas_faltantes"] == 5
    assert incidencia.detalles["n_huecos"] == 1
    # Y lo esencial: la tabla sigue teniendo 495 filas, no 500.
    assert len(con_hueco) == len(velas_limpias) - 5


def test_varios_huecos_se_agrupan_en_tramos(velas_limpias, tf_1h):
    quitar = list(velas_limpias.index[50:53]) + list(velas_limpias.index[200:210])
    con_huecos = velas_limpias.drop(quitar)
    tramos = V.detectar_huecos(con_huecos.index, tf_1h)
    assert len(tramos) == 2
    assert [t["n_velas"] for t in tramos] == [3, 10]


def test_duplicados_detectados(velas_limpias, tf_1h):
    dup = pd.concat([velas_limpias, velas_limpias.iloc[[10]]]).sort_index()
    informe = V.validar_ohlcv(dup, tf_1h, ahora_ms=_ahora_de(velas_limpias))
    assert informe.tiene(V.COD_DUPLICADOS)


def test_desorden_detectado(velas_limpias, tf_1h):
    revuelto = velas_limpias.iloc[[5, 4, 3, 2, 1, 0]]
    informe = V.validar_ohlcv(revuelto, tf_1h, ahora_ms=_ahora_de(velas_limpias))
    assert informe.tiene(V.COD_DESORDEN)


def test_nulos_detectados(velas_limpias, tf_1h):
    con_nulos = velas_limpias.copy()
    con_nulos.iloc[42, con_nulos.columns.get_loc("close")] = np.nan
    informe = V.validar_ohlcv(con_nulos, tf_1h, ahora_ms=_ahora_de(velas_limpias))
    assert informe.tiene(V.COD_NULOS)
    # Y no se ha rellenado.
    assert np.isnan(con_nulos.iloc[42]["close"])


def test_infinitos_detectados(velas_limpias, tf_1h):
    con_inf = velas_limpias.copy()
    con_inf.iloc[7, con_inf.columns.get_loc("high")] = np.inf
    informe = V.validar_ohlcv(con_inf, tf_1h, ahora_ms=_ahora_de(velas_limpias))
    assert informe.tiene(V.COD_NO_FINITOS)


def test_velas_desalineadas(velas_limpias, tf_1h):
    movidas = velas_limpias.copy()
    movidas.index = movidas.index + pd.Timedelta(minutes=7)
    informe = V.validar_ohlcv(movidas, tf_1h, ahora_ms=_ahora_de(movidas))
    assert informe.tiene(V.COD_DESALINEADO)


def test_ohlc_incoherente(velas_limpias, tf_1h):
    """Una vela donde el 'máximo' es menor que el cierre: imposible."""
    mala = velas_limpias.copy()
    fila = 33
    mala.iloc[fila, mala.columns.get_loc("high")] = (
        mala.iloc[fila]["low"] * 0.5
    )
    informe = V.validar_ohlcv(mala, tf_1h, ahora_ms=_ahora_de(velas_limpias))
    assert informe.tiene(V.COD_OHLC_INCOHERENTE)


def test_precio_cero(velas_limpias, tf_1h):
    mala = velas_limpias.copy()
    mala.iloc[12, mala.columns.get_loc("low")] = 0.0
    informe = V.validar_ohlcv(mala, tf_1h, ahora_ms=_ahora_de(velas_limpias))
    assert informe.tiene(V.COD_PRECIO_NO_POSITIVO)


def test_volumen_negativo(velas_limpias, tf_1h):
    mala = velas_limpias.copy()
    mala.iloc[3, mala.columns.get_loc("volume")] = -1.0
    informe = V.validar_ohlcv(mala, tf_1h, ahora_ms=_ahora_de(velas_limpias))
    assert informe.tiene(V.COD_VOLUMEN_NEGATIVO)


def test_volumen_cero_puntual_es_aviso(velas_limpias, tf_1h):
    mala = velas_limpias.copy()
    mala.iloc[3, mala.columns.get_loc("volume")] = 0.0
    informe = V.validar_ohlcv(mala, tf_1h, ahora_ms=_ahora_de(velas_limpias))
    assert informe.tiene(V.COD_VOLUMEN_CERO)
    assert informe.limpio  # 1 de 500 velas: aviso, no error


def test_volumen_cero_masivo_es_error(velas_limpias, tf_1h):
    mala = velas_limpias.copy()
    mala.iloc[:100, mala.columns.get_loc("volume")] = 0.0
    informe = V.validar_ohlcv(mala, tf_1h, ahora_ms=_ahora_de(velas_limpias))
    assert not informe.limpio
    assert informe.tiene(V.COD_VOLUMEN_CERO)


def test_salto_gigante_entre_velas_es_error(velas_limpias, tf_1h):
    """
    Simula una redenominación de token (el 'split' del mundo cripto):
    a partir de la vela 200 los precios se dividen entre 10.
    """
    mala = velas_limpias.copy()
    cols = ["open", "high", "low", "close"]
    mala.iloc[200:, [mala.columns.get_loc(c) for c in cols]] /= 10.0
    informe = V.validar_ohlcv(mala, tf_1h, ahora_ms=_ahora_de(velas_limpias))
    assert informe.tiene(V.COD_SALTO_ENTRE_VELAS)
    assert not informe.limpio


def test_movimiento_extremo_es_solo_aviso(velas_limpias, tf_1h):
    """
    Un flash crash dentro de una vela puede ser real. Se avisa, no se
    bloquea: la decisión de si ese dato vale es tuya, no mía.
    """
    mala = velas_limpias.copy()
    i = 300
    factor = 0.5
    for c in ("open", "high", "low", "close"):
        mala.iloc[i:, mala.columns.get_loc(c)] *= factor
    # Recompongo la continuidad cierre->apertura para aislar el efecto.
    mala.iloc[i, mala.columns.get_loc("open")] = mala.iloc[i - 1]["close"]
    mala.iloc[i, mala.columns.get_loc("high")] = max(
        mala.iloc[i]["open"], mala.iloc[i]["close"]
    )
    mala.iloc[i, mala.columns.get_loc("low")] = min(
        mala.iloc[i]["open"], mala.iloc[i]["close"]
    )
    informe = V.validar_ohlcv(mala, tf_1h, ahora_ms=_ahora_de(velas_limpias))
    assert informe.tiene(V.COD_RETORNO_EXTREMO)


def test_ultima_vela_sin_cerrar_es_error(velas_limpias, tf_1h):
    """
    LA DEFENSA ANTI-LOOK-AHEAD EN LA CAPA DE DATOS.

    Si el reloj indica que la última vela todavía se está formando, los
    datos NO son utilizables: sus valores aún pueden cambiar.
    """
    ultima_ms = int(marcas_ms(velas_limpias.index)[-1])
    # Reloj situado a mitad de la última vela.
    informe = V.validar_ohlcv(
        velas_limpias, tf_1h, ahora_ms=ultima_ms + MS_HORA // 2
    )
    assert informe.tiene(V.COD_VELA_SIN_CERRAR)
    assert not informe.limpio

    # Justo en el instante de cierre, ya vale.
    informe_ok = V.validar_ohlcv(velas_limpias, tf_1h, ahora_ms=ultima_ms + MS_HORA)
    assert not informe_ok.tiene(V.COD_VELA_SIN_CERRAR)


def test_cobertura_parcial_es_aviso(velas_limpias, tf_1h):
    primera = int(marcas_ms(velas_limpias.index)[0])
    ultima = int(marcas_ms(velas_limpias.index)[-1])
    informe = V.validar_ohlcv(
        velas_limpias,
        tf_1h,
        ahora_ms=ultima + MS_HORA,
        rango_pedido=(primera - 100 * MS_HORA, ultima),
    )
    assert informe.tiene(V.COD_COBERTURA_PARCIAL)
    assert informe.limpio  # es un aviso, no invalida los datos


def test_exigir_limpio_lanza_y_lleva_el_informe(velas_limpias, tf_1h):
    con_hueco = velas_limpias.drop(velas_limpias.index[10:20])
    informe = V.validar_ohlcv(con_hueco, tf_1h, ahora_ms=_ahora_de(con_hueco))
    with pytest.raises(DatosSuciosError) as exc:
        informe.exigir_limpio()
    assert exc.value.informe is informe
    assert "HUECO" in str(exc.value)


def test_se_reportan_todos_los_problemas_a_la_vez(velas_limpias, tf_1h):
    """No quiero arreglar un problema, relanzar, y descubrir el siguiente."""
    mala = velas_limpias.drop(velas_limpias.index[100:105]).copy()
    mala.iloc[7, mala.columns.get_loc("close")] = np.nan
    mala.iloc[9, mala.columns.get_loc("volume")] = -5.0
    informe = V.validar_ohlcv(mala, tf_1h, ahora_ms=_ahora_de(mala))
    codigos = informe.codigos()
    assert {V.COD_HUECO, V.COD_NULOS, V.COD_VOLUMEN_NEGATIVO} <= codigos


def test_informe_serializable(velas_limpias, tf_1h):
    """El informe se guarda en JSON junto a los datos: debe ser serializable."""
    import json

    con_hueco = velas_limpias.drop(velas_limpias.index[10:20])
    informe = V.validar_ohlcv(
        con_hueco, tf_1h, simbolo="TEST", ahora_ms=_ahora_de(con_hueco)
    )
    texto = json.dumps(informe.a_dict(), ensure_ascii=False)
    assert "HUECO" in texto


def test_validacion_no_modifica_los_datos(velas_limpias, tf_1h):
    """Comprobación explícita de la regla: la aduana mira, no toca."""
    copia = velas_limpias.copy(deep=True)
    V.validar_ohlcv(velas_limpias, tf_1h, ahora_ms=_ahora_de(velas_limpias))
    pd.testing.assert_frame_equal(velas_limpias, copia)


def test_semanal_alineado_al_lunes():
    """
    La rejilla semanal se ancla al lunes, no a la época Unix (que era jueves).
    Si esto se rompiera, todas las velas semanales darían 'desalineado'.
    """
    tf = obtener_timeframe("1w")
    # 6 de enero de 2020 fue lunes.
    lunes = pd.Timestamp("2020-01-06", tz="UTC")
    df = velas_sinteticas(
        10, inicio_ms=int(lunes.value // 1_000_000), paso_ms=7 * 24 * MS_HORA
    )
    informe = V.validar_ohlcv(
        df,
        tf,
        ahora_ms=int(marcas_ms(df.index)[-1]) + 7 * 24 * MS_HORA,
    )
    assert not informe.tiene(V.COD_DESALINEADO)
    assert informe.limpio, informe.resumen()
