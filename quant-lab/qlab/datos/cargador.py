"""
La puerta de entrada a los datos. Es la única función que usarás tú:

    from qlab.datos import cargar_ohlcv
    datos = cargar_ohlcv("BTC/USDT", "1h", "2023-01-01", "2023-12-31")
    datos.velas      # el DataFrame
    datos.informe    # qué se ha comprobado y qué ha salido
    datos.huella     # sha256 exacto de esos datos

Qué hace, en orden:
  1. Mira si ya tiene esos datos en la caché.
  2. Descarga SOLO lo que falta (por delante o por detrás del rango cacheado).
  3. Fusiona, detectando contradicciones entre lo viejo y lo nuevo.
  4. Valida el resultado entero.
  5. Si está limpio, lo guarda y te lo devuelve. Si no, PARA.

DECISIÓN CLAVE — Se valida SIEMPRE, también al leer de caché.
Podría fiarme de que lo que guardé un día estaba limpio y ahorrarme el
trabajo. No lo hago: validar cuesta milisegundos y el coste de un backtest
hecho sobre datos corruptos es días de trabajo tirados a la basura y, peor,
conclusiones falsas en las que confías.

DECISIÓN CLAVE — La política ante huecos es explícita y por defecto es fallar.
Hay tres opciones y ninguna rellena datos:
  - FALLAR (por defecto): hay huecos -> error, tú decides.
  - RECORTAR: se queda con el tramo continuo más largo. Se avisa por consola
    y queda registrado en el informe. Nunca en silencio.
  - PERMITIR: sigue adelante con los huecos, degradándolos a aviso. Solo
    debería usarse para inspeccionar, jamás para sacar conclusiones.
"""

from __future__ import annotations

import datetime as dt
import logging
from dataclasses import dataclass, field
from enum import Enum
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd

from ..errores import ErrorDeCache, ErrorDeConfiguracion
from . import cache as _cache
from .cache import ClaveDataset, MetadatosCache
from .descarga import ResultadoDescarga, descargar_rango, fusionar
from .esquema import (
    Timeframe,
    a_ms,
    alinear_hacia_abajo,
    de_ms,
    marcas_ms,
    marco_vacio,
    obtener_timeframe,
)
from .exchange import MERCADOS, ClienteCCXT, ClienteExchange
from .validacion import (
    COD_HUECO,
    InformeValidacion,
    Nivel,
    UmbralesValidacion,
    detectar_huecos,
    validar_ohlcv,
)

log = logging.getLogger(__name__)


class PoliticaHuecos(str, Enum):
    FALLAR = "fallar"
    RECORTAR = "recortar"
    PERMITIR = "permitir"


@dataclass
class DatosOHLCV:
    """Lo que te devuelve el cargador: los datos y su historial clínico."""

    velas: pd.DataFrame
    informe: InformeValidacion
    clave: ClaveDataset
    huella: str
    origen: str  # "cache", "descarga" o "cache+descarga"
    descarga: ResultadoDescarga | None = None
    metadatos: MetadatosCache | None = None
    notas: list[str] = field(default_factory=list)

    def __len__(self) -> int:
        return len(self.velas)

    def resumen(self) -> str:
        lineas = [
            f"{self.clave}  ({self.origen})",
            f"  velas : {len(self.velas)}",
            f"  rango : {self.informe.desde} -> {self.informe.hasta}",
            f"  huella: {self.huella[:16]}…",
        ]
        for nota in self.notas:
            lineas.append(f"  nota  : {nota}")
        lineas.append(self.informe.resumen())
        return "\n".join(lineas)


def cargar_ohlcv(
    simbolo: str,
    timeframe: str,
    desde: str | dt.datetime | int,
    hasta: str | dt.datetime | int | None = None,
    *,
    exchange: str = "binance",
    mercado: str = "spot",
    directorio_cache: Path | str | None = None,
    cliente: ClienteExchange | None = None,
    permitir_descarga: bool = True,
    politica_huecos: PoliticaHuecos | str = PoliticaHuecos.FALLAR,
    umbrales: UmbralesValidacion | None = None,
    forzar_redescarga: bool = False,
    ahora_ms: int | None = None,
) -> DatosOHLCV:
    """
    Carga velas listas para usar en un backtest, o falla explicando por qué no.

    Parámetros que conviene entender:

    - `permitir_descarga=False`: trabaja solo con lo que hay en disco. Útil
      cuando estás iterando sobre una estrategia y quieres asegurarte de que
      no cambian los datos bajo tus pies.
    - `forzar_redescarga=True`: tira la caché y baja todo otra vez. Es lo
      primero que hay que probar si la huella no cuadra.
    - `ahora_ms`: reloj de referencia; sirve para los tests y para reproducir
      una carga tal y como era en una fecha concreta.
    """
    tf = obtener_timeframe(timeframe)
    politica = PoliticaHuecos(politica_huecos)
    if mercado not in MERCADOS:
        raise ErrorDeConfiguracion(
            f"Mercado '{mercado}' desconocido. Opciones: {MERCADOS}."
        )

    desde_ms = a_ms(desde)
    hasta_ms = (
        a_ms(hasta)
        if hasta is not None
        else int(dt.datetime.now(dt.timezone.utc).timestamp() * 1000)
    )
    if hasta_ms < desde_ms:
        raise ErrorDeConfiguracion(
            f"Las fechas están al revés: desde={de_ms(desde_ms)} es posterior a "
            f"hasta={de_ms(hasta_ms)}."
        )

    clave = ClaveDataset(exchange, mercado, simbolo, tf.nombre)
    notas: list[str] = []

    if forzar_redescarga:
        _cache.borrar(clave, directorio_cache)
        notas.append("Caché borrada a petición (forzar_redescarga=True).")

    # --- 1. Lo que ya tenemos --------------------------------------------
    cacheado = marco_vacio()
    meta_previa: MetadatosCache | None = None
    if _cache.existe(clave, directorio_cache):
        cacheado, meta_previa = _cache.leer(clave, directorio=directorio_cache)
        log.info("Caché encontrada para %s: %d velas.", clave, len(cacheado))

    # --- 2. Lo que falta --------------------------------------------------
    df = cacheado
    resultado_descarga: ResultadoDescarga | None = None
    origen = "cache" if not cacheado.empty else "descarga"

    faltantes = _tramos_a_descargar(cacheado, desde_ms, hasta_ms, tf)
    if faltantes and permitir_descarga:
        if cliente is None:
            cliente = ClienteCCXT(exchange=exchange, mercado=mercado)
        reloj = ahora_ms if ahora_ms is not None else cliente.ahora_ms()
        acumulado = ResultadoDescarga(velas=marco_vacio())
        for tramo_desde, tramo_hasta in faltantes:
            log.info(
                "Descargando %s de %s a %s…",
                clave,
                de_ms(tramo_desde),
                de_ms(tramo_hasta),
            )
            parcial = descargar_rango(
                cliente, simbolo, tf, tramo_desde, tramo_hasta, ahora_ms=reloj
            )
            df = fusionar(df, parcial.velas, contexto=str(clave))
            acumulado.peticiones += parcial.peticiones
            acumulado.duplicados_exactos_eliminados += (
                parcial.duplicados_exactos_eliminados
            )
            acumulado.velas_sin_cerrar_descartadas += (
                parcial.velas_sin_cerrar_descartadas
            )
            acumulado.notas.extend(parcial.notas)
        acumulado.velas = df
        resultado_descarga = acumulado
        origen = "cache+descarga" if not cacheado.empty else "descarga"
    elif faltantes and not permitir_descarga:
        notas.append(
            f"Faltan {len(faltantes)} tramos por descargar pero la descarga está "
            "desactivada (permitir_descarga=False). Trabajo solo con la caché."
        )

    if ahora_ms is None:
        ahora_ms = int(dt.datetime.now(dt.timezone.utc).timestamp() * 1000)

    # --- 3. Guardar el histórico completo antes de recortar --------------
    # La caché guarda TODO lo que se ha llegado a descargar de este símbolo,
    # no solo el trozo que has pedido hoy. Así la próxima petición de un
    # rango distinto reaprovecha lo que ya hay.
    # Ojo: se guarda incluso si tiene defectos, y a propósito. La caché es un
    # registro de "esto es lo que el exchange me dio", no una colección de
    # datos ya bendecidos. El informe de validación se guarda al lado, y la
    # comprobación de calidad se vuelve a hacer en cada carga.
    if resultado_descarga is not None and not df.empty:
        informe_completo = validar_ohlcv(
            df, tf, simbolo=simbolo, umbrales=umbrales, ahora_ms=ahora_ms
        )
        meta_previa = _cache.escribir(
            df,
            clave,
            directorio=directorio_cache,
            fuente=f"{exchange}/{mercado} vía ccxt",
            informe_validacion=informe_completo.a_dict(),
        )

    # --- 4. Recorte al rango pedido --------------------------------------
    inicio = alinear_hacia_abajo(desde_ms, tf)
    fin = alinear_hacia_abajo(hasta_ms, tf)
    if not df.empty:
        marcas = marcas_ms(df.index)
        df = df.loc[(marcas >= inicio) & (marcas <= fin)]

    # --- 5. Política de huecos -------------------------------------------
    if politica is PoliticaHuecos.RECORTAR and not df.empty:
        df, recorte = _recortar_al_tramo_continuo_mas_largo(df, tf)
        if recorte:
            log.warning("RECORTE DE DATOS: %s", recorte)
            notas.append(recorte)

    # --- 6. Validación ----------------------------------------------------
    informe = validar_ohlcv(
        df,
        tf,
        simbolo=simbolo,
        umbrales=umbrales,
        ahora_ms=ahora_ms,
        rango_pedido=(inicio, fin),
    )

    if politica is PoliticaHuecos.PERMITIR:
        informe = _degradar_huecos_a_aviso(informe)
        if informe.tiene(COD_HUECO):
            log.warning(
                "Sigues adelante CON HUECOS en los datos por decisión explícita "
                "(politica_huecos='permitir'). Cualquier resultado de backtest "
                "sobre estos datos es sospechoso."
            )
            notas.append(
                "Datos con huecos aceptados explícitamente: NO son aptos para "
                "sacar conclusiones."
            )

    informe.exigir_limpio()

    return DatosOHLCV(
        velas=df,
        informe=informe,
        clave=clave,
        huella=_cache.huella(df),
        origen=origen,
        descarga=resultado_descarga,
        metadatos=meta_previa,
        notas=notas + (resultado_descarga.notas if resultado_descarga else []),
    )


# --------------------------------------------------------------------------
# Piezas internas
# --------------------------------------------------------------------------


def _tramos_a_descargar(
    cacheado: pd.DataFrame, desde_ms: int, hasta_ms: int, tf: Timeframe
) -> list[tuple[int, int]]:
    """
    Qué trozos hay que pedirle al exchange: lo que falta por delante, por
    detrás, y también los huecos que haya EN MEDIO de lo ya guardado.

    Lo de los huecos interiores merece explicación. Un hueco en la caché
    puede tener dos causas muy distintas:

      a) El exchange no tiene esos datos (paró el mercado, el par no cotizaba).
      b) La descarga se cortó a mitad aquel día que se te fue el wifi.

    Desde fuera son indistinguibles. Si diera por buena la caché sin más, el
    caso (b) se quedaría cicatrizado para siempre y tendrías que acordarte de
    forzar una redescarga a mano. Así que reintento los huecos: cuesta una
    petición pequeña por hueco, y si el hueco es real (caso a) el exchange
    devuelve vacío, la validación lo sigue detectando y tú te enteras igual.
    Prefiero gastar una petición de más a arrastrar un agujero invisible.
    """
    inicio = alinear_hacia_abajo(desde_ms, tf)
    fin = alinear_hacia_abajo(hasta_ms, tf)
    if cacheado.empty:
        return [(inicio, fin)]

    marcas = marcas_ms(cacheado.index)
    cache_ini, cache_fin = int(marcas[0]), int(marcas[-1])

    tramos: list[tuple[int, int]] = []
    if inicio < cache_ini:
        tramos.append((inicio, min(fin, cache_ini - tf.paso_ms)))

    # Huecos interiores, recortados a lo que realmente has pedido hoy.
    for pos in np.nonzero(np.diff(marcas) > tf.paso_ms)[0]:
        hueco_ini = int(marcas[pos]) + tf.paso_ms
        hueco_fin = int(marcas[pos + 1]) - tf.paso_ms
        a, b = max(hueco_ini, inicio), min(hueco_fin, fin)
        if a <= b:
            tramos.append((a, b))

    if fin > cache_fin:
        tramos.append((max(inicio, cache_fin + tf.paso_ms), fin))

    return [t for t in tramos if t[0] <= t[1]]


def _recortar_al_tramo_continuo_mas_largo(
    df: pd.DataFrame, tf: Timeframe
) -> tuple[pd.DataFrame, str | None]:
    """
    Se queda con el trozo más largo sin huecos.

    Ojo con lo que esto significa: no arregla los datos, tira datos. Es
    preferible a rellenar (que sería inventarlos), pero también cambia el
    periodo que estás analizando, y eso hay que tenerlo presente al comparar
    dos estrategias.
    """
    if len(df) < 2:
        return df, None
    marcas = marcas_ms(df.index)
    cortes = np.nonzero(np.diff(marcas) > tf.paso_ms)[0]
    if len(cortes) == 0:
        return df, None

    limites = [0, *(cortes + 1), len(df)]
    mejor = max(
        ((limites[i], limites[i + 1]) for i in range(len(limites) - 1)),
        key=lambda par: par[1] - par[0],
    )
    ini, fin = mejor
    recortado = df.iloc[ini:fin]
    nota = (
        f"Había {len(cortes)} huecos. Me quedo con el tramo continuo más largo: "
        f"{recortado.index[0]} -> {recortado.index[-1]} ({len(recortado)} velas "
        f"de {len(df)}). Se han DESCARTADO {len(df) - len(recortado)} velas; no "
        "se ha rellenado ninguna."
    )
    return recortado, nota


def _degradar_huecos_a_aviso(informe: InformeValidacion) -> InformeValidacion:
    """Convierte el error de huecos en aviso, dejando el texto original."""
    nuevas = []
    for inc in informe.incidencias:
        if inc.codigo == COD_HUECO and inc.nivel is Nivel.ERROR:
            nuevas.append(
                type(inc)(
                    Nivel.AVISO,
                    inc.codigo,
                    inc.mensaje + " [degradado a aviso por decisión explícita tuya]",
                    inc.detalles,
                )
            )
        else:
            nuevas.append(inc)
    informe.incidencias = nuevas
    return informe


def inspeccionar(
    simbolo: str,
    timeframe: str,
    *,
    exchange: str = "binance",
    mercado: str = "spot",
    directorio_cache: Path | str | None = None,
    umbrales: UmbralesValidacion | None = None,
    ahora_ms: int | None = None,
) -> InformeValidacion:
    """
    Valida lo que hay en caché sin descargar nada y SIN lanzar excepción.

    Sirve para mirar el estado de un dataset y sus huecos sin que el proceso
    se pare. Es la herramienta de diagnóstico; `cargar_ohlcv` es la que se
    usa para trabajar.
    """
    tf = obtener_timeframe(timeframe)
    clave = ClaveDataset(exchange, mercado, simbolo, tf.nombre)
    if not _cache.existe(clave, directorio_cache):
        raise ErrorDeCache(f"No hay nada en caché para {clave}.")
    df, _ = _cache.leer(clave, directorio=directorio_cache)
    return validar_ohlcv(
        df, tf, simbolo=simbolo, umbrales=umbrales, ahora_ms=ahora_ms
    )


def huecos_de(
    df: pd.DataFrame, timeframe: str
) -> list[dict[str, Any]]:  # pragma: no cover - utilidad
    """Atajo para ver los huecos de una tabla desde un notebook."""
    return detectar_huecos(df.index, obtener_timeframe(timeframe))
