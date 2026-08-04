"""
Descarga paginada de velas.

Binance devuelve como mucho ~1000 velas por petición, así que para bajar un
año de velas de 1 hora hay que pedirlas por trozos e ir encadenando. Parece
trivial y es donde se esconden los bugs clásicos:

  - Pedir el siguiente trozo desde el último timestamp recibido en vez de
    desde el siguiente => la última vela de cada trozo se duplica.
  - Que el exchange devuelva siempre lo mismo => bucle infinito.
  - Que el exchange devuelva velas anteriores a lo que pediste => se cuelan
    duplicados desordenados.
  - Quedarte la última vela, que está a medio formar => look-ahead.

Esta capa se ocupa de las cuatro cosas, y de ninguna más. En particular:
no valida (eso es de `validacion.py`) y no guarda nada (eso es de `cache.py`).

DECISIÓN CLAVE — Descarto SIEMPRE la vela en formación.
Una vela solo entra si `apertura + paso <= ahora`. Es la primera de las tres
barreras contra el look-ahead del proyecto (las otras dos van en el motor de
la Fase 2 y en el test automático que lo comprueba).

DECISIÓN CLAVE — Duplicados exactos sí se eliminan; contradictorios no.
Si dos peticiones solapadas devuelven la misma vela con los mismos valores,
es ruido de paginación y la quito (dejando constancia en los avisos). Si
devuelven la misma vela con valores DISTINTOS, eso es un problema serio de
los datos y paro: elegir una de las dos por mi cuenta sería inventarme el
histórico.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass, field
from typing import Any

import numpy as np
import pandas as pd

from ..errores import ErrorDeDescarga
from .esquema import (
    COLUMNAS,
    Timeframe,
    alinear_hacia_abajo,
    de_ms,
    desde_filas_ccxt,
    marcas_ms,
    marco_vacio,
)
from .exchange import ClienteExchange

log = logging.getLogger(__name__)

LIMITE_POR_PETICION = 1000
# Tope de seguridad: si hacen falta más peticiones que esto, algo va mal
# (bucle, timeframe equivocado, rango absurdo). Prefiero parar a quemar el
# rate limit durante media hora.
MAX_PETICIONES = 20_000


@dataclass
class ResultadoDescarga:
    velas: pd.DataFrame
    peticiones: int = 0
    duplicados_exactos_eliminados: int = 0
    velas_sin_cerrar_descartadas: int = 0
    notas: list[str] = field(default_factory=list)

    def a_dict(self) -> dict[str, Any]:
        return {
            "peticiones": self.peticiones,
            "duplicados_exactos_eliminados": self.duplicados_exactos_eliminados,
            "velas_sin_cerrar_descartadas": self.velas_sin_cerrar_descartadas,
            "notas": list(self.notas),
        }


def descargar_rango(
    cliente: ClienteExchange,
    simbolo: str,
    tf: Timeframe,
    desde_ms: int,
    hasta_ms: int,
    *,
    limite: int = LIMITE_POR_PETICION,
    ahora_ms: int | None = None,
) -> ResultadoDescarga:
    """
    Baja todas las velas CERRADAS entre `desde_ms` y `hasta_ms` (ambos
    incluidos, alineados a la rejilla del timeframe).
    """
    if hasta_ms < desde_ms:
        raise ErrorDeDescarga(
            f"Rango invertido: me pides desde {de_ms(desde_ms)} hasta "
            f"{de_ms(hasta_ms)}."
        )

    if ahora_ms is None:
        ahora_ms = cliente.ahora_ms()

    inicio = alinear_hacia_abajo(desde_ms, tf)
    fin = alinear_hacia_abajo(hasta_ms, tf)
    # Última vela que ya ha cerrado a día de hoy.
    ultima_cerrada = alinear_hacia_abajo(ahora_ms, tf) - tf.paso_ms

    resultado = ResultadoDescarga(velas=marco_vacio())

    if fin > ultima_cerrada:
        resultado.notas.append(
            f"Recorto el final de {de_ms(fin)} a {de_ms(ultima_cerrada)}: "
            "las velas posteriores no han cerrado todavía."
        )
        fin = ultima_cerrada

    if fin < inicio:
        resultado.notas.append(
            "No hay ninguna vela cerrada en el rango pedido; devuelvo tabla vacía."
        )
        return resultado

    trozos: list[pd.DataFrame] = []
    cursor = inicio

    while cursor <= fin:
        if resultado.peticiones >= MAX_PETICIONES:
            raise ErrorDeDescarga(
                f"He hecho {MAX_PETICIONES} peticiones y sigo sin terminar. "
                "Paro por seguridad: revisa el rango de fechas y el timeframe."
            )

        filas = cliente.obtener_ohlcv(simbolo, tf.nombre, cursor, limite)
        resultado.peticiones += 1

        if not filas:
            # El exchange dice que no hay nada más. Puede ser el final real
            # de los datos o un hueco. No invento nada: corto aquí y que lo
            # decida la validación al ver el conjunto completo.
            resultado.notas.append(
                f"El exchange no devuelve más velas a partir de {de_ms(cursor)}."
            )
            break

        trozo = desde_filas_ccxt(filas)
        trozos.append(trozo)

        ultimo_ms = int(marcas_ms(trozo.index)[-1])
        if ultimo_ms < cursor:
            # El exchange nos devuelve velas más antiguas de las pedidas y no
            # avanza. Sin esta comprobación, bucle infinito.
            raise ErrorDeDescarga(
                f"El exchange no avanza: he pedido velas desde {de_ms(cursor)} "
                f"y la más reciente que devuelve es {de_ms(ultimo_ms)}. "
                "Corto para no entrar en un bucle infinito."
            )
        cursor = ultimo_ms + tf.paso_ms

    if not trozos:
        return resultado

    df = pd.concat(trozos)

    # 1) Recorte al rango pedido y a lo que ya ha cerrado.
    marcas = marcas_ms(df.index)
    dentro = (marcas >= inicio) & (marcas <= fin)
    sin_cerrar = marcas > ultima_cerrada
    resultado.velas_sin_cerrar_descartadas = int(sin_cerrar.sum())
    if resultado.velas_sin_cerrar_descartadas:
        resultado.notas.append(
            f"Descartadas {resultado.velas_sin_cerrar_descartadas} velas que "
            "todavía no habían cerrado (defensa contra look-ahead)."
        )
    df = df.loc[dentro]

    # 2) Orden estable y limpieza de solapes de paginación.
    df = df.sort_index(kind="stable")
    df, eliminados = _quitar_duplicados_exactos(df, contexto=f"{simbolo} {tf.nombre}")
    resultado.duplicados_exactos_eliminados = eliminados
    if eliminados:
        resultado.notas.append(
            f"Eliminados {eliminados} duplicados exactos procedentes del solape "
            "entre peticiones consecutivas (mismos valores, misma vela)."
        )

    resultado.velas = df
    return resultado


def _quitar_duplicados_exactos(
    df: pd.DataFrame, *, contexto: str
) -> tuple[pd.DataFrame, int]:
    """
    Quita filas repetidas idénticas. Si dos filas comparten timestamp pero
    NO comparten valores, lanza error.

    El motivo de no "quedarse con la última" es simple: si el exchange te da
    dos versiones distintas de la misma vela, no sabes cuál es la buena, y
    elegir una al azar es exactamente el tipo de decisión invisible que
    convierte un backtest en ficción.
    """
    if df.empty:
        return df, 0

    marcado = df.index.duplicated(keep=False)
    if not marcado.any():
        return df, 0

    sospechosas = df.loc[marcado]
    # Dos filas cuentan como "la misma vela" si sus números coinciden dentro
    # de una tolerancia relativa mínima. Uso tolerancia y no igualdad exacta
    # porque un mismo número puede volver del JSON del exchange con el último
    # bit distinto, y eso no es un conflicto real de datos.
    conflictivas: list[str] = []
    for ts, grupo in sospechosas.groupby(level=0):
        valores = grupo.loc[:, list(COLUMNAS)].to_numpy(dtype="float64")
        referencia = valores[0]
        iguales = np.isclose(
            valores, referencia, rtol=1e-9, atol=0.0, equal_nan=True
        ).all()
        if not iguales:
            conflictivas.append(str(ts))

    if conflictivas:
        raise ErrorDeDescarga(
            f"[{contexto}] El exchange ha devuelto valores DISTINTOS para la "
            f"misma vela en {len(conflictivas)} marcas de tiempo "
            f"(ejemplos: {conflictivas[:10]}). No elijo yo cuál es la buena: "
            "vuelve a descargar el rango y, si persiste, desconfía de esos datos."
        )

    antes = len(df)
    limpio = df[~df.index.duplicated(keep="first")]
    return limpio, antes - len(limpio)


def fusionar(
    viejo: pd.DataFrame, nuevo: pd.DataFrame, *, contexto: str = ""
) -> pd.DataFrame:
    """
    Une lo que ya había en la caché con lo recién descargado.

    Misma regla que arriba: si una vela aparece en ambos con valores
    distintos, error. Que el histórico cambie bajo tus pies es una noticia,
    no un detalle a resolver en silencio.
    """
    if viejo.empty:
        return nuevo.sort_index(kind="stable")
    if nuevo.empty:
        return viejo.sort_index(kind="stable")

    juntos = pd.concat([viejo, nuevo]).sort_index(kind="stable")
    juntos, _ = _quitar_duplicados_exactos(juntos, contexto=contexto or "fusión")
    return juntos
