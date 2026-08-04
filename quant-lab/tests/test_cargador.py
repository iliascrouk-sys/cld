"""
Tests del cargador: la pieza que junta caché, descarga y validación.

Lo que se comprueba:
  - que descarga lo que falta y solo lo que falta,
  - que ante datos sucios PARA (y no devuelve nada usable),
  - que las políticas de huecos hacen exactamente lo que dicen,
  - y que ninguna de ellas rellena un solo dato.
"""

from __future__ import annotations

import pandas as pd
import pytest

from qlab.datos import cache as C
from qlab.datos.cargador import PoliticaHuecos, cargar_ohlcv, inspeccionar
from qlab.datos.esquema import marcas_ms
from qlab.datos.validacion import COD_HUECO
from qlab.errores import DatosSuciosError, ErrorDeCache, ErrorDeConfiguracion

from conftest import MS_HORA, ExchangeFalso, velas_sinteticas


def _ms(df, i):
    return int(marcas_ms(df.index)[i])


def test_descarga_valida_y_guarda(cache_tmp):
    velas = velas_sinteticas(300)
    ahora = _ms(velas, -1) + MS_HORA
    ex = ExchangeFalso(velas, ahora=ahora)

    datos = cargar_ohlcv(
        "BTC/USDT",
        "1h",
        _ms(velas, 0),
        _ms(velas, -1),
        cliente=ex,
        directorio_cache=cache_tmp,
        ahora_ms=ahora,
    )

    assert len(datos) == 300
    assert datos.informe.limpio
    assert datos.origen == "descarga"
    assert datos.huella == C.huella(velas)
    assert C.existe(datos.clave, cache_tmp)


def test_segunda_llamada_usa_la_cache_y_no_pide_nada(cache_tmp):
    velas = velas_sinteticas(300)
    ahora = _ms(velas, -1) + MS_HORA
    ex = ExchangeFalso(velas, ahora=ahora)
    comun = dict(
        cliente=ex, directorio_cache=cache_tmp, ahora_ms=ahora
    )

    cargar_ohlcv("BTC/USDT", "1h", _ms(velas, 0), _ms(velas, -1), **comun)
    peticiones_tras_la_primera = len(ex.peticiones)

    segunda = cargar_ohlcv("BTC/USDT", "1h", _ms(velas, 0), _ms(velas, -1), **comun)
    assert len(ex.peticiones) == peticiones_tras_la_primera  # ni una petición más
    assert segunda.origen == "cache"
    assert len(segunda) == 300


def test_descarga_incremental_solo_pide_lo_que_falta(cache_tmp):
    velas = velas_sinteticas(400)
    ahora = _ms(velas, -1) + MS_HORA
    ex = ExchangeFalso(velas, ahora=ahora)
    comun = dict(cliente=ex, directorio_cache=cache_tmp, ahora_ms=ahora)

    cargar_ohlcv("BTC/USDT", "1h", _ms(velas, 100), _ms(velas, 199), **comun)
    ex.peticiones.clear()

    # Ahora pido un rango más amplio por los dos lados.
    datos = cargar_ohlcv("BTC/USDT", "1h", _ms(velas, 0), _ms(velas, 299), **comun)
    assert len(datos) == 300
    assert datos.origen == "cache+descarga"
    # Las peticiones nuevas deben empezar fuera del tramo ya cacheado.
    inicios = [p[2] for p in ex.peticiones]
    assert min(inicios) == _ms(velas, 0)
    assert max(inicios) >= _ms(velas, 200)


def test_hueco_hace_fallar_por_defecto(cache_tmp):
    velas = velas_sinteticas(300).drop(velas_sinteticas(300).index[100:110])
    ahora = _ms(velas, -1) + MS_HORA
    ex = ExchangeFalso(velas, ahora=ahora)

    with pytest.raises(DatosSuciosError) as exc:
        cargar_ohlcv(
            "BTC/USDT",
            "1h",
            _ms(velas, 0),
            _ms(velas, -1),
            cliente=ex,
            directorio_cache=cache_tmp,
            ahora_ms=ahora,
        )
    assert exc.value.informe.tiene(COD_HUECO)
    assert "No voy a rellenar" in str(exc.value)


def test_politica_recortar_descarta_pero_no_rellena(cache_tmp, caplog):
    completas = velas_sinteticas(300)
    velas = completas.drop(completas.index[50:60])  # hueco de 10 velas
    ahora = _ms(velas, -1) + MS_HORA
    ex = ExchangeFalso(velas, ahora=ahora)

    datos = cargar_ohlcv(
        "BTC/USDT",
        "1h",
        _ms(velas, 0),
        _ms(velas, -1),
        cliente=ex,
        directorio_cache=cache_tmp,
        ahora_ms=ahora,
        politica_huecos=PoliticaHuecos.RECORTAR,
    )

    # Se queda con el tramo largo (240 velas), NO con 300 rellenadas.
    assert len(datos) == 240
    assert datos.informe.limpio
    assert any("tramo continuo más largo" in n for n in datos.notas)
    assert any("RECORTE DE DATOS" in r.message for r in caplog.records)
    # Y los precios que quedan son exactamente los originales.
    pd.testing.assert_frame_equal(datos.velas, completas.iloc[60:])


def test_politica_permitir_deja_pasar_pero_avisa(cache_tmp, caplog):
    completas = velas_sinteticas(300)
    velas = completas.drop(completas.index[100:110])
    ahora = _ms(velas, -1) + MS_HORA
    ex = ExchangeFalso(velas, ahora=ahora)

    datos = cargar_ohlcv(
        "BTC/USDT",
        "1h",
        _ms(velas, 0),
        _ms(velas, -1),
        cliente=ex,
        directorio_cache=cache_tmp,
        ahora_ms=ahora,
        politica_huecos="permitir",
    )
    assert len(datos) == 290  # las 10 que faltan siguen faltando
    assert datos.informe.tiene(COD_HUECO)
    assert datos.informe.limpio  # degradado a aviso
    assert any("NO son aptos" in n for n in datos.notas)


def test_ninguna_politica_inventa_velas(cache_tmp):
    """
    Comprobación transversal: sea cual sea la política, el número de velas
    devuelto nunca es mayor que el número de velas reales.
    """
    completas = velas_sinteticas(300)
    velas = completas.drop(completas.index[100:110])
    ahora = _ms(velas, -1) + MS_HORA

    for politica in ("recortar", "permitir"):
        ex = ExchangeFalso(velas, ahora=ahora)
        datos = cargar_ohlcv(
            "BTC/USDT",
            "1h",
            _ms(velas, 0),
            _ms(velas, -1),
            cliente=ex,
            directorio_cache=cache_tmp / politica,
            ahora_ms=ahora,
            politica_huecos=politica,
        )
        assert len(datos) <= len(velas)
        # Todas las velas devueltas existen tal cual en el origen.
        comun = velas.loc[datos.velas.index]
        pd.testing.assert_frame_equal(datos.velas, comun)


def test_sin_red_trabaja_solo_con_la_cache(cache_tmp):
    velas = velas_sinteticas(300)
    ahora = _ms(velas, -1) + MS_HORA
    ex = ExchangeFalso(velas, ahora=ahora)
    cargar_ohlcv(
        "BTC/USDT",
        "1h",
        _ms(velas, 0),
        _ms(velas, -1),
        cliente=ex,
        directorio_cache=cache_tmp,
        ahora_ms=ahora,
    )

    datos = cargar_ohlcv(
        "BTC/USDT",
        "1h",
        _ms(velas, 0),
        _ms(velas, -1),
        directorio_cache=cache_tmp,
        permitir_descarga=False,
        ahora_ms=ahora,
    )
    assert len(datos) == 300  # no ha hecho falta cliente ninguno


def test_forzar_redescarga_vacia_la_cache(cache_tmp):
    velas = velas_sinteticas(200)
    ahora = _ms(velas, -1) + MS_HORA
    ex = ExchangeFalso(velas, ahora=ahora)
    comun = dict(cliente=ex, directorio_cache=cache_tmp, ahora_ms=ahora)

    cargar_ohlcv("BTC/USDT", "1h", _ms(velas, 0), _ms(velas, -1), **comun)
    ex.peticiones.clear()
    datos = cargar_ohlcv(
        "BTC/USDT", "1h", _ms(velas, 0), _ms(velas, -1), forzar_redescarga=True, **comun
    )
    assert ex.peticiones  # ha vuelto a pedir
    assert len(datos) == 200


def test_fechas_al_reves(cache_tmp):
    with pytest.raises(ErrorDeConfiguracion, match="al revés"):
        cargar_ohlcv(
            "BTC/USDT", "1h", "2023-06-01", "2023-01-01", directorio_cache=cache_tmp
        )


def test_timeframe_desconocido(cache_tmp):
    with pytest.raises(ErrorDeConfiguracion, match="desconocido"):
        cargar_ohlcv("BTC/USDT", "7h", "2023-01-01", "2023-02-01")


def test_timeframe_mensual_rechazado_con_motivo(cache_tmp):
    with pytest.raises(ErrorDeConfiguracion, match="no dura siempre lo mismo"):
        cargar_ohlcv("BTC/USDT", "1M", "2023-01-01", "2023-02-01")


def test_fechas_en_texto_se_interpretan_en_utc(cache_tmp):
    velas = velas_sinteticas(
        200, inicio_ms=int(pd.Timestamp("2023-01-01", tz="UTC").value // 1_000_000)
    )
    ahora = _ms(velas, -1) + MS_HORA
    ex = ExchangeFalso(velas, ahora=ahora)
    datos = cargar_ohlcv(
        "BTC/USDT",
        "1h",
        "2023-01-01",
        "2023-01-05",
        cliente=ex,
        directorio_cache=cache_tmp,
        ahora_ms=ahora,
    )
    assert datos.velas.index[0] == pd.Timestamp("2023-01-01 00:00", tz="UTC")
    assert datos.velas.index[-1] == pd.Timestamp("2023-01-05 00:00", tz="UTC")


def test_inspeccionar_no_lanza_con_datos_sucios(cache_tmp):
    completas = velas_sinteticas(300)
    sucias = completas.drop(completas.index[100:110])
    clave_dir = cache_tmp
    from qlab.datos.cache import ClaveDataset

    C.escribir(sucias, ClaveDataset("binance", "spot", "X/USDT", "1h"), directorio=clave_dir)

    informe = inspeccionar(
        "X/USDT",
        "1h",
        directorio_cache=clave_dir,
        ahora_ms=_ms(sucias, -1) + MS_HORA,
    )
    assert not informe.limpio
    assert informe.tiene(COD_HUECO)


def test_inspeccionar_sin_cache_es_error(cache_tmp):
    with pytest.raises(ErrorDeCache, match="No hay nada en caché"):
        inspeccionar("NADA/USDT", "1h", directorio_cache=cache_tmp)


def test_la_huella_identifica_el_dataset(cache_tmp):
    velas = velas_sinteticas(200)
    ahora = _ms(velas, -1) + MS_HORA
    ex = ExchangeFalso(velas, ahora=ahora)
    comun = dict(cliente=ex, directorio_cache=cache_tmp, ahora_ms=ahora)

    a = cargar_ohlcv("BTC/USDT", "1h", _ms(velas, 0), _ms(velas, 99), **comun)
    b = cargar_ohlcv("BTC/USDT", "1h", _ms(velas, 0), _ms(velas, 99), **comun)
    c = cargar_ohlcv("BTC/USDT", "1h", _ms(velas, 0), _ms(velas, 150), **comun)

    assert a.huella == b.huella  # mismo periodo, misma huella
    assert a.huella != c.huella  # periodo distinto, huella distinta


def test_la_vela_en_formacion_tampoco_llega_al_cargador(cache_tmp):
    """
    DEFENSA ANTI-LOOK-AHEAD, comprobada de punta a punta.

    El exchange tiene 200 velas pero la última se está formando ahora mismo.
    Lo que sale del cargador tiene que ser 199, y la última tiene que ser la
    anterior. Si este test se pusiera en rojo, todo backtest hecho con este
    laboratorio estaría contaminado.
    """
    velas = velas_sinteticas(200)
    ahora = _ms(velas, -1) + MS_HORA // 2  # a mitad de la última vela
    ex = ExchangeFalso(velas, ahora=ahora)

    datos = cargar_ohlcv(
        "BTC/USDT",
        "1h",
        _ms(velas, 0),
        _ms(velas, -1),
        cliente=ex,
        directorio_cache=cache_tmp,
        ahora_ms=ahora,
    )
    assert len(datos) == 199
    assert datos.velas.index[-1] == velas.index[-2]
    assert datos.informe.limpio


def test_un_hueco_en_la_cache_se_reintenta(cache_tmp):
    """
    Escenario real: se cortó la descarga y la caché quedó con un agujero.
    A la siguiente carga hay que volver a pedir ESE tramo, no dar la caché
    por buena para siempre.
    """
    from qlab.datos.cache import ClaveDataset

    completas = velas_sinteticas(300)
    con_hueco = completas.drop(completas.index[100:110])
    clave = ClaveDataset("binance", "spot", "BTC/USDT", "1h")
    C.escribir(con_hueco, clave, directorio=cache_tmp, fuente="descarga interrumpida")

    ahora = _ms(completas, -1) + MS_HORA
    ex = ExchangeFalso(completas, ahora=ahora)  # el exchange sí tiene todo
    datos = cargar_ohlcv(
        "BTC/USDT",
        "1h",
        _ms(completas, 0),
        _ms(completas, -1),
        cliente=ex,
        directorio_cache=cache_tmp,
        ahora_ms=ahora,
    )

    assert len(datos) == 300
    assert datos.informe.limpio
    # Y las velas recuperadas son las del exchange, no inventadas.
    pd.testing.assert_frame_equal(datos.velas, completas)


def test_hueco_real_del_exchange_sigue_fallando(cache_tmp):
    """
    La otra cara: si el hueco existe de verdad en el exchange, reintentar no
    lo arregla y la carga tiene que seguir fallando. Reintentar no puede
    convertirse en una forma silenciosa de tragarse un agujero.
    """
    completas = velas_sinteticas(300)
    con_hueco = completas.drop(completas.index[100:110])
    ahora = _ms(completas, -1) + MS_HORA
    ex = ExchangeFalso(con_hueco, ahora=ahora)  # al exchange también le faltan

    with pytest.raises(DatosSuciosError) as exc:
        cargar_ohlcv(
            "BTC/USDT",
            "1h",
            _ms(completas, 0),
            _ms(completas, -1),
            cliente=ex,
            directorio_cache=cache_tmp,
            ahora_ms=ahora,
        )
    assert exc.value.informe.tiene(COD_HUECO)


def test_no_se_piden_tramos_fuera_del_rango_solicitado(cache_tmp):
    """La descarga incremental no debe salirse de lo que has pedido."""
    velas = velas_sinteticas(400)
    ahora = _ms(velas, -1) + MS_HORA
    ex = ExchangeFalso(velas, ahora=ahora)
    comun = dict(cliente=ex, directorio_cache=cache_tmp, ahora_ms=ahora)

    cargar_ohlcv("BTC/USDT", "1h", _ms(velas, 200), _ms(velas, 299), **comun)
    ex.peticiones.clear()

    # Pido un rango anterior y disjunto del que ya está en caché.
    datos = cargar_ohlcv("BTC/USDT", "1h", _ms(velas, 0), _ms(velas, 99), **comun)
    assert len(datos) == 100
    for _, _, desde, _ in ex.peticiones:
        assert desde <= _ms(velas, 199)
