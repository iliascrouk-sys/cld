"""
El "contrato" de los datos: qué forma tiene exactamente una tabla de velas
en este laboratorio.

DECISIÓN CLAVE 1 — Una sola forma canónica.
Todo el laboratorio (descarga, caché, validación, motor de backtest) habla
el mismo idioma: un DataFrame de pandas con

    índice   : ts_apertura  -> DatetimeIndex en UTC, es el instante en que
                               ABRE la vela (no en el que cierra)
    columnas : open, high, low, close, volume  (todas float64)

Mantengo los nombres en inglés porque son el estándar universal en
finanzas y así el laboratorio encaja con cualquier librería externa sin
traducciones. Los comentarios y los mensajes de error van en español.

DECISIÓN CLAVE 2 — El índice es la APERTURA, siempre en UTC.
Es el punto donde más se equivoca la gente. Si etiquetas una vela con su
hora de cierre, es facilísimo acabar usando información del futuro sin
darte cuenta. Al etiquetar por apertura, la regla mental queda simple:
"la vela con marca t contiene lo que pasó entre t y t+paso, y NO se
conoce entera hasta t+paso". UTC porque el horario de verano es una
fuente inagotable de bugs silenciosos.

DECISIÓN CLAVE 3 — Solo timeframes de paso constante.
Un mes no dura siempre lo mismo (28, 29, 30 o 31 días), así que la
comprobación de "¿faltan velas?" no se puede hacer con aritmética simple.
En vez de escribir un caso especial frágil, rechazo el timeframe mensual
de forma explícita. Prefiero decirte "esto no lo soporto" a darte un
resultado dudoso.
"""

from __future__ import annotations

import datetime as dt
from dataclasses import dataclass
from typing import Iterable, Sequence

import numpy as np
import pandas as pd

from ..errores import ErrorDeConfiguracion, ErrorDeFormato

# Versión del esquema. Si algún día cambio la forma de la tabla, subo este
# número y la caché vieja se invalida sola en vez de mezclarse con la nueva.
VERSION_ESQUEMA = 1

NOMBRE_INDICE = "ts_apertura"
COLUMNAS_PRECIO: tuple[str, ...] = ("open", "high", "low", "close")
COLUMNA_VOLUMEN = "volume"
COLUMNAS: tuple[str, ...] = COLUMNAS_PRECIO + (COLUMNA_VOLUMEN,)

_MS_SEGUNDO = 1_000
_MS_MINUTO = 60 * _MS_SEGUNDO
_MS_HORA = 60 * _MS_MINUTO
_MS_DIA = 24 * _MS_HORA
_MS_SEMANA = 7 * _MS_DIA

# El 1 de enero de 1970 (época Unix) fue jueves. Las velas semanales de
# Binance abren el lunes, así que para comprobar si un timestamp semanal
# está "en su sitio" hay que anclar la rejilla al primer lunes: el 5 de
# enero de 1970. Para todo lo demás (de 1 minuto a 1 día) la época sirve
# como ancla porque los pasos dividen el día exactamente.
_ANCLA_LUNES = 4 * _MS_DIA  # 5-ene-1970 00:00 UTC


@dataclass(frozen=True)
class Timeframe:
    """Un timeframe soportado: su nombre, cuánto dura y dónde empieza su rejilla."""

    nombre: str
    paso_ms: int
    ancla_ms: int = 0

    def __str__(self) -> str:  # pragma: no cover - cosmético
        return self.nombre

    @property
    def paso(self) -> pd.Timedelta:
        return pd.Timedelta(milliseconds=self.paso_ms)


TIMEFRAMES: dict[str, Timeframe] = {
    "1m": Timeframe("1m", _MS_MINUTO),
    "3m": Timeframe("3m", 3 * _MS_MINUTO),
    "5m": Timeframe("5m", 5 * _MS_MINUTO),
    "15m": Timeframe("15m", 15 * _MS_MINUTO),
    "30m": Timeframe("30m", 30 * _MS_MINUTO),
    "1h": Timeframe("1h", _MS_HORA),
    "2h": Timeframe("2h", 2 * _MS_HORA),
    "4h": Timeframe("4h", 4 * _MS_HORA),
    "6h": Timeframe("6h", 6 * _MS_HORA),
    "8h": Timeframe("8h", 8 * _MS_HORA),
    "12h": Timeframe("12h", 12 * _MS_HORA),
    "1d": Timeframe("1d", _MS_DIA),
    "1w": Timeframe("1w", _MS_SEMANA, _ANCLA_LUNES),
}

# Timeframes que rechazo a propósito, con el motivo. Mejor un "no" claro
# que un "sí" a medias.
TIMEFRAMES_RECHAZADOS: dict[str, str] = {
    "1M": "el mes no dura siempre lo mismo, así que no puedo comprobar huecos con fiabilidad",
    "1s": "velas de 1 segundo: el volumen de datos y el ruido de microestructura "
    "no encajan con el tipo de estrategias que vamos a probar",
}


def obtener_timeframe(nombre: str) -> Timeframe:
    """Traduce '1h' al objeto Timeframe, o explica por qué no se puede."""
    if nombre in TIMEFRAMES:
        return TIMEFRAMES[nombre]
    if nombre in TIMEFRAMES_RECHAZADOS:
        raise ErrorDeConfiguracion(
            f"Timeframe '{nombre}' no soportado a propósito: "
            f"{TIMEFRAMES_RECHAZADOS[nombre]}."
        )
    raise ErrorDeConfiguracion(
        f"Timeframe '{nombre}' desconocido. Soportados: "
        f"{', '.join(sorted(TIMEFRAMES, key=lambda k: TIMEFRAMES[k].paso_ms))}."
    )


# --------------------------------------------------------------------------
# Conversión de fechas
# --------------------------------------------------------------------------
# Todo se mueve internamente en milisegundos desde 1970 (enteros), porque
# es lo que habla el API de Binance y porque con enteros no hay errores de
# redondeo. Las fechas legibles ("2023-01-01") solo aparecen en los bordes.


def a_ms(momento: str | dt.datetime | dt.date | pd.Timestamp | int) -> int:
    """
    Convierte cualquier forma razonable de escribir una fecha a milisegundos UTC.

    Si escribes una fecha sin zona horaria (lo normal), asumo UTC y te lo
    digo en la documentación en vez de adivinar tu zona local: dos personas
    ejecutando el mismo backtest en países distintos deben obtener el mismo
    resultado.
    """
    if isinstance(momento, bool):  # bool es subclase de int; evita sorpresas
        raise ErrorDeConfiguracion("Una fecha no puede ser un booleano.")
    if isinstance(momento, (int, np.integer)):
        return int(momento)

    ts = pd.Timestamp(momento)
    if ts.tzinfo is None:
        ts = ts.tz_localize("UTC")
    else:
        ts = ts.tz_convert("UTC")
    if pd.isna(ts):
        raise ErrorDeConfiguracion(f"No entiendo la fecha: {momento!r}")
    return int(ts.value // 1_000_000)


def de_ms(ms: int) -> pd.Timestamp:
    """Milisegundos UTC -> Timestamp de pandas con zona horaria explícita."""
    return pd.Timestamp(int(ms), unit="ms", tz="UTC")


def marcas_ms(indice) -> np.ndarray:
    """
    Pasa un índice de fechas a un array de milisegundos UTC (enteros).

    Parece una tontería y es una trampa de las gordas: pandas guarda las
    fechas internamente con la resolución que le parece (segundos,
    milisegundos, microsegundos o nanosegundos según cómo se hayan
    construido). Si conviertes a entero dando por hecho una resolución
    concreta, obtienes números que están mal por un factor de mil o de un
    millón, sin que salte ningún error. Todo el laboratorio pasa por aquí
    para que ese fallo no pueda ocurrir en un solo sitio olvidado.

    Además, si el índice tuviera precisión por debajo del milisegundo,
    reduce a milisegundos perdería información: en vez de truncar en
    silencio, aviso. Binance trabaja en milisegundos, así que esto no
    debería pasar nunca; si pasa, es que los datos no vienen de donde
    creemos.
    """
    idx = pd.DatetimeIndex(indice)
    en_ms = idx.as_unit("ms")
    if len(idx) and not (en_ms.as_unit(idx.unit) == idx).all():
        raise ErrorDeConfiguracion(
            "El índice tiene precisión por debajo del milisegundo y pasarlo a "
            "milisegundos perdería información. No trunco por mi cuenta: revisa "
            "de dónde salen esos datos."
        )
    return np.asarray(en_ms.asi8, dtype="int64")


def alinear_hacia_abajo(ms: int, tf: Timeframe) -> int:
    """Lleva un instante al comienzo de la vela que lo contiene."""
    return ms - ((ms - tf.ancla_ms) % tf.paso_ms)


def rejilla_esperada(desde_ms: int, hasta_ms: int, tf: Timeframe) -> pd.DatetimeIndex:
    """
    La lista completa de velas que DEBERÍA existir entre dos instantes.

    Es la herramienta con la que detecto huecos: comparo lo que hay con lo
    que debería haber. Ambos extremos incluidos.
    """
    inicio = alinear_hacia_abajo(desde_ms, tf)
    fin = alinear_hacia_abajo(hasta_ms, tf)
    if fin < inicio:
        return pd.DatetimeIndex([], tz="UTC", name=NOMBRE_INDICE)
    marcas = np.arange(inicio, fin + 1, tf.paso_ms, dtype="int64")
    return pd.DatetimeIndex(
        pd.to_datetime(marcas, unit="ms", utc=True), name=NOMBRE_INDICE
    )


# --------------------------------------------------------------------------
# Construcción de la tabla canónica
# --------------------------------------------------------------------------


def marco_vacio() -> pd.DataFrame:
    """Una tabla de velas vacía pero con la forma correcta."""
    df = pd.DataFrame(
        {c: pd.Series(dtype="float64") for c in COLUMNAS},
        index=pd.DatetimeIndex([], tz="UTC", name=NOMBRE_INDICE).as_unit("ms"),
    )
    return df


def desde_filas_ccxt(filas: Iterable[Sequence]) -> pd.DataFrame:
    """
    Convierte lo que devuelve ccxt en la tabla canónica.

    ccxt entrega listas `[timestamp_ms, open, high, low, close, volume]`.
    Aquí no se limpia nada ni se corrige nada: solo se cambia de formato.
    La limpieza es responsabilidad de la validación, y la validación no
    limpia: se queja. Mezclar ambas cosas es cómo se cuelan los datos
    inventados en un backtest.
    """
    filas = list(filas)
    if not filas:
        return marco_vacio()

    for i, fila in enumerate(filas):
        if len(fila) < 6:
            raise ErrorDeFormato(
                f"La fila {i} devuelta por el exchange tiene {len(fila)} campos "
                f"y esperaba al menos 6 [ts, open, high, low, close, volume]: {fila!r}"
            )

    datos = np.array([list(f[:6]) for f in filas], dtype="object")
    try:
        marcas = datos[:, 0].astype("int64")
        valores = datos[:, 1:6].astype("float64")
    except (TypeError, ValueError) as exc:
        raise ErrorDeFormato(
            f"El exchange ha devuelto valores no numéricos en las velas: {exc}"
        ) from exc

    df = pd.DataFrame(valores, columns=list(COLUMNAS))
    df.index = pd.DatetimeIndex(
        pd.to_datetime(marcas, unit="ms", utc=True), name=NOMBRE_INDICE
    )
    return df


def normalizar(df: pd.DataFrame) -> pd.DataFrame:
    """
    Fuerza una tabla cualquiera a la forma canónica: columnas correctas,
    float64, índice UTC con nombre.

    OJO: esto NO ordena ni elimina duplicados. Ordenar por debajo de la mesa
    escondería que el exchange te está devolviendo datos desordenados, que
    es justo la clase de síntoma que quiero ver.
    """
    faltan = [c for c in COLUMNAS if c not in df.columns]
    if faltan:
        raise ErrorDeConfiguracion(
            f"A la tabla le faltan columnas obligatorias: {faltan}. "
            f"Esperaba {list(COLUMNAS)}."
        )
    out = df.loc[:, list(COLUMNAS)].astype("float64")
    idx = pd.DatetimeIndex(df.index)
    if idx.tz is None:
        idx = idx.tz_localize("UTC")
    else:
        idx = idx.tz_convert("UTC")
    # Resolución fija en milisegundos: así la huella sha256 de unos mismos
    # datos sale igual vengan de donde vengan (parquet, ccxt, un CSV...).
    marcas_ms(idx)  # comprueba que no se pierde precisión al reducir
    out.index = idx.as_unit("ms").rename(NOMBRE_INDICE)
    return out
