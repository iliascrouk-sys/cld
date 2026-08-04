"""
La aduana de los datos.

Aquí vive la regla número uno de la Fase 1: **esta capa nunca arregla nada,
solo se queja**. No rellena huecos, no interpola, no corrige velas raras, no
reordena. Si los datos están sucios, lo dice a gritos y el proceso se para.

Por qué es tan importante: un backtest sobre datos rellenados con la vela
anterior te da una curva de resultados preciosa que no existió jamás. El
relleno silencioso es una de las formas más habituales de mentirse a uno
mismo con números. Prefiero que el laboratorio se niegue a funcionar antes
que darte un Sharpe bonito construido sobre precios inventados.

Cómo funciona:
- Cada comprobación produce cero o más `Incidencia`.
- Una incidencia es de nivel ERROR (invalida el backtest) o AVISO (hay que
  mirarlo, pero no es necesariamente fatal).
- Todas las incidencias se juntan en un `InformeValidacion`. El informe se
  guarda junto a los datos en la caché, para que meses después puedas saber
  con qué datos exactos corriste aquel backtest.
- `informe.exigir_limpio()` lanza `DatosSuciosError` si hay algún ERROR.

Nota sobre por qué se ejecutan TODAS las comprobaciones antes de fallar:
si me parase en el primer error, arreglarías un problema, volverías a
lanzar, encontrarías el siguiente, y así diez veces. Prefiero darte la
lista completa de una vez.
"""

from __future__ import annotations

import datetime as dt
from dataclasses import dataclass, field
from enum import Enum
from typing import Any

import numpy as np
import pandas as pd

from ..errores import DatosSuciosError, ErrorDeConfiguracion
from .esquema import (
    COLUMNAS,
    COLUMNAS_PRECIO,
    COLUMNA_VOLUMEN,
    NOMBRE_INDICE,
    Timeframe,
    de_ms,
    marcas_ms,
    rejilla_esperada,
)


class Nivel(str, Enum):
    ERROR = "ERROR"
    AVISO = "AVISO"


# Códigos de incidencia. Son constantes con nombre para que los tests puedan
# comprobar "ha detectado un HUECO" sin depender del texto del mensaje.
COD_TABLA_VACIA = "TABLA_VACIA"
COD_ESTRUCTURA = "ESTRUCTURA"
COD_DESORDEN = "DESORDEN"
COD_DUPLICADOS = "DUPLICADOS"
COD_NULOS = "NULOS"
COD_NO_FINITOS = "NO_FINITOS"
COD_DESALINEADO = "DESALINEADO"
COD_HUECO = "HUECO"
COD_OHLC_INCOHERENTE = "OHLC_INCOHERENTE"
COD_PRECIO_NO_POSITIVO = "PRECIO_NO_POSITIVO"
COD_VOLUMEN_NEGATIVO = "VOLUMEN_NEGATIVO"
COD_SALTO_ENTRE_VELAS = "SALTO_ENTRE_VELAS"
COD_RETORNO_EXTREMO = "RETORNO_EXTREMO"
COD_VOLUMEN_CERO = "VOLUMEN_CERO"
COD_VELA_SIN_CERRAR = "VELA_SIN_CERRAR"
COD_COBERTURA_PARCIAL = "COBERTURA_PARCIAL"


@dataclass(frozen=True)
class Incidencia:
    nivel: Nivel
    codigo: str
    mensaje: str
    detalles: dict[str, Any] = field(default_factory=dict)

    def __str__(self) -> str:
        return f"[{self.nivel.value}] {self.codigo}: {self.mensaje}"

    def a_dict(self) -> dict[str, Any]:
        return {
            "nivel": self.nivel.value,
            "codigo": self.codigo,
            "mensaje": self.mensaje,
            "detalles": self.detalles,
        }


@dataclass
class UmbralesValidacion:
    """
    Los números que deciden qué es "raro".

    Los pongo en un objeto y no escondidos en el código para que se vean, se
    puedan discutir y se guarden en el informe. Un umbral escondido es un
    parámetro que nadie audita.

    - `salto_entre_velas_aviso/grave`: el cripto cotiza 24/7, así que el
      cierre de una vela y la apertura de la siguiente deberían ser
      prácticamente el mismo precio. Una discontinuidad grande significa casi
      siempre datos malos, un cambio de ticker o una redenominación del token
      (el equivalente en cripto a un split de acciones). En bolsa tradicional
      esto sería normal por el hueco de la noche; aquí no.
    - `retorno_extremo_aviso`: movimiento de cierre a cierre absurdamente
      grande dentro de una sola vela. Puede ser real (un flash crash) o puede
      ser una vela corrupta. Por eso es AVISO y no ERROR: te obliga a mirarlo
      a ti, no decide por ti.
    - `ratio_volumen_cero_aviso`: proporción de velas sin ni una sola
      operación. Si es alta, el activo es demasiado ilíquido para que un
      backtest signifique algo.

    Los valores por defecto son opiniones razonables, no verdades. Si los
    cambias para que un dataset "pase", estás haciendo trampas a sabiendas.
    """

    salto_entre_velas_aviso: float = 0.05  # 5% de discontinuidad cierre->apertura
    salto_entre_velas_grave: float = 0.30  # 30%: casi seguro dato malo/redenominación
    retorno_extremo_aviso: float = 0.35  # ~35% de cierre a cierre en una vela
    ratio_volumen_cero_aviso: float = 0.01  # 1% de velas sin operaciones
    max_ejemplos: int = 10  # cuántos casos concretos listar en cada incidencia

    def a_dict(self) -> dict[str, Any]:
        return {
            "salto_entre_velas_aviso": self.salto_entre_velas_aviso,
            "salto_entre_velas_grave": self.salto_entre_velas_grave,
            "retorno_extremo_aviso": self.retorno_extremo_aviso,
            "ratio_volumen_cero_aviso": self.ratio_volumen_cero_aviso,
        }


@dataclass
class InformeValidacion:
    """El resultado de pasar los datos por la aduana."""

    simbolo: str
    timeframe: str
    filas: int
    desde: pd.Timestamp | None
    hasta: pd.Timestamp | None
    incidencias: list[Incidencia] = field(default_factory=list)
    umbrales: UmbralesValidacion = field(default_factory=UmbralesValidacion)

    # -- consulta ----------------------------------------------------------
    @property
    def errores(self) -> list[Incidencia]:
        return [i for i in self.incidencias if i.nivel is Nivel.ERROR]

    @property
    def avisos(self) -> list[Incidencia]:
        return [i for i in self.incidencias if i.nivel is Nivel.AVISO]

    @property
    def limpio(self) -> bool:
        """Limpio = sin errores. Puede tener avisos y seguir siendo usable."""
        return not self.errores

    def codigos(self) -> set[str]:
        return {i.codigo for i in self.incidencias}

    def tiene(self, codigo: str) -> bool:
        return any(i.codigo == codigo for i in self.incidencias)

    # -- construcción ------------------------------------------------------
    def añadir(
        self, nivel: Nivel, codigo: str, mensaje: str, **detalles: Any
    ) -> None:
        self.incidencias.append(Incidencia(nivel, codigo, mensaje, detalles))

    def error(self, codigo: str, mensaje: str, **detalles: Any) -> None:
        self.añadir(Nivel.ERROR, codigo, mensaje, **detalles)

    def aviso(self, codigo: str, mensaje: str, **detalles: Any) -> None:
        self.añadir(Nivel.AVISO, codigo, mensaje, **detalles)

    # -- salida ------------------------------------------------------------
    def resumen(self) -> str:
        """Informe en texto plano, pensado para leerlo en la terminal."""
        rango = "sin datos"
        if self.desde is not None and self.hasta is not None:
            rango = f"{self.desde} -> {self.hasta}"
        cabecera = (
            f"Validación de {self.simbolo} {self.timeframe}: "
            f"{self.filas} velas, {rango}"
        )
        if not self.incidencias:
            return cabecera + "\n  Sin incidencias."
        lineas = [cabecera]
        for inc in self.incidencias:
            lineas.append(f"  {inc}")
        lineas.append(
            f"  TOTAL: {len(self.errores)} errores, {len(self.avisos)} avisos."
        )
        return "\n".join(lineas)

    def exigir_limpio(self) -> None:
        """
        Si hay errores, para el proceso. Esta es la puerta que impide que
        datos sucios lleguen al motor de backtest.
        """
        if self.errores:
            raise DatosSuciosError(
                "Los datos no pasan la validación y NO se van a usar.\n"
                + self.resumen()
                + "\n\nNo voy a rellenar ni corregir nada por mi cuenta: "
                "decide tú qué hacer (cambiar el rango de fechas, cambiar de "
                "símbolo, o aceptar explícitamente una política de huecos).",
                informe=self,
            )

    def a_dict(self) -> dict[str, Any]:
        return {
            "simbolo": self.simbolo,
            "timeframe": self.timeframe,
            "filas": self.filas,
            "desde": None if self.desde is None else self.desde.isoformat(),
            "hasta": None if self.hasta is None else self.hasta.isoformat(),
            "limpio": self.limpio,
            "n_errores": len(self.errores),
            "n_avisos": len(self.avisos),
            "umbrales": self.umbrales.a_dict(),
            "incidencias": [i.a_dict() for i in self.incidencias],
        }


# --------------------------------------------------------------------------
# La validación en sí
# --------------------------------------------------------------------------


def _muestra(indice: pd.DatetimeIndex, n: int) -> list[str]:
    """Primeros n timestamps como texto, para meterlos en el mensaje de error."""
    return [str(t) for t in indice[:n]]


def validar_ohlcv(
    df: pd.DataFrame,
    tf: Timeframe,
    *,
    simbolo: str = "?",
    umbrales: UmbralesValidacion | None = None,
    ahora_ms: int | None = None,
    rango_pedido: tuple[int, int] | None = None,
) -> InformeValidacion:
    """
    Pasa la tabla de velas por todas las comprobaciones.

    `ahora_ms` se puede inyectar para poder testear la comprobación de "la
    última vela todavía no ha cerrado" sin depender del reloj real. Es una
    de esas cosas que parecen manía y luego te ahorran un bug de los caros.

    `rango_pedido` es el rango que TÚ pediste. Sirve para avisarte de que has
    pedido desde 2017 pero el símbolo no existía hasta 2019: el dataset será
    válido, pero no cubre lo que creías.
    """
    umbrales = umbrales or UmbralesValidacion()
    if ahora_ms is None:
        ahora_ms = int(dt.datetime.now(dt.timezone.utc).timestamp() * 1000)

    informe = InformeValidacion(
        simbolo=simbolo,
        timeframe=tf.nombre,
        filas=len(df),
        desde=None,
        hasta=None,
        umbrales=umbrales,
    )

    # --- 1. Estructura --------------------------------------------------
    # Si la tabla ni siquiera tiene la forma correcta, el resto de
    # comprobaciones fallarían con errores crípticos de pandas. Salgo pronto.
    faltan = [c for c in COLUMNAS if c not in df.columns]
    if faltan:
        informe.error(
            COD_ESTRUCTURA,
            f"Faltan columnas obligatorias: {faltan}",
            columnas_esperadas=list(COLUMNAS),
            columnas_encontradas=[str(c) for c in df.columns],
        )
        return informe

    if not isinstance(df.index, pd.DatetimeIndex):
        informe.error(
            COD_ESTRUCTURA,
            f"El índice debe ser de tipo fecha/hora y es {type(df.index).__name__}",
        )
        return informe

    if df.index.tz is None:
        informe.error(
            COD_ESTRUCTURA,
            "El índice no tiene zona horaria. Debe ser UTC explícito: sin zona "
            "horaria no hay forma de saber a qué momento real corresponde una vela.",
        )
        return informe

    if str(df.index.tz) != "UTC":
        informe.error(
            COD_ESTRUCTURA,
            f"El índice está en {df.index.tz} y debe estar en UTC.",
        )
        return informe

    if df.index.name != NOMBRE_INDICE:
        informe.aviso(
            COD_ESTRUCTURA,
            f"El índice se llama {df.index.name!r} y debería llamarse "
            f"{NOMBRE_INDICE!r}.",
        )

    # --- 2. Tabla vacía --------------------------------------------------
    if len(df) == 0:
        informe.error(
            COD_TABLA_VACIA,
            "No hay ni una sola vela. Revisa el símbolo, el timeframe y las "
            "fechas: puede que el par no existiera todavía en ese periodo.",
        )
        return informe

    informe.desde = df.index[0]
    informe.hasta = df.index[-1]

    # La conversión a milisegundos puede fallar si el índice trae precisión
    # por debajo del milisegundo. Aquí no se lanza excepción: esta función
    # informa, no interrumpe. Así el informe puede seguir recogiendo el resto
    # de problemas y te los enseña todos juntos.
    try:
        marcas = marcas_ms(df.index)
    except ErrorDeConfiguracion as exc:
        informe.error(COD_ESTRUCTURA, str(exc))
        return informe

    # --- 3. Orden --------------------------------------------------------
    # No ordeno yo: si vienen desordenadas es que algo va mal en la descarga,
    # y quiero enterarme.
    if not df.index.is_monotonic_increasing:
        n_bajadas = int((np.diff(marcas) < 0).sum())
        informe.error(
            COD_DESORDEN,
            f"Las velas no están ordenadas en el tiempo ({n_bajadas} saltos "
            "hacia atrás). No las reordeno por mi cuenta porque el desorden "
            "suele ser síntoma de un problema en el ensamblado de la descarga.",
            n_saltos_atras=n_bajadas,
        )

    # --- 4. Duplicados ---------------------------------------------------
    dup = df.index.duplicated(keep=False)
    if dup.any():
        idx_dup = df.index[dup].unique()
        informe.error(
            COD_DUPLICADOS,
            f"{len(idx_dup)} marcas de tiempo aparecen más de una vez "
            f"({int(dup.sum())} filas afectadas). Ejemplos: "
            f"{_muestra(idx_dup, umbrales.max_ejemplos)}",
            n_marcas_duplicadas=len(idx_dup),
            n_filas=int(dup.sum()),
            ejemplos=_muestra(idx_dup, umbrales.max_ejemplos),
        )

    # --- 5. Nulos y valores no finitos ----------------------------------
    valores = df.loc[:, list(COLUMNAS)]
    nulos = valores.isna()
    if nulos.any().any():
        por_columna = {c: int(nulos[c].sum()) for c in COLUMNAS if nulos[c].any()}
        filas_nulas = df.index[nulos.any(axis=1)]
        informe.error(
            COD_NULOS,
            f"Hay valores nulos (NaN): {por_columna}. Ejemplos: "
            f"{_muestra(filas_nulas, umbrales.max_ejemplos)}. "
            "NO los relleno: una vela sin precio es una vela que no existe.",
            por_columna=por_columna,
            ejemplos=_muestra(filas_nulas, umbrales.max_ejemplos),
        )

    finitos = np.isfinite(valores.to_numpy(dtype="float64"))
    no_finitos = ~finitos & ~nulos.to_numpy()
    if no_finitos.any():
        filas_inf = df.index[no_finitos.any(axis=1)]
        informe.error(
            COD_NO_FINITOS,
            f"Hay valores infinitos en {int(no_finitos.sum())} celdas. "
            f"Ejemplos: {_muestra(filas_inf, umbrales.max_ejemplos)}",
            n_celdas=int(no_finitos.sum()),
        )

    # --- 6. Alineación con la rejilla del timeframe ----------------------
    # Una vela de 1h debe abrir en punto. Si abre a las 10:07 es que el
    # timeframe que crees que tienes no es el que tienes.
    desalineadas = (marcas - tf.ancla_ms) % tf.paso_ms != 0
    if desalineadas.any():
        idx_mal = df.index[desalineadas]
        informe.error(
            COD_DESALINEADO,
            f"{int(desalineadas.sum())} velas no caen en la rejilla de "
            f"{tf.nombre}. Ejemplos: {_muestra(idx_mal, umbrales.max_ejemplos)}",
            n_velas=int(desalineadas.sum()),
            ejemplos=_muestra(idx_mal, umbrales.max_ejemplos),
        )

    # --- 7. Huecos --------------------------------------------------------
    # Solo tiene sentido buscar huecos si el índice está ordenado, alineado y
    # sin duplicados; si no, el resultado sería ruido sobre ruido.
    if (
        df.index.is_monotonic_increasing
        and not dup.any()
        and not desalineadas.any()
    ):
        tramos = detectar_huecos(df.index, tf)
        if tramos:
            faltantes = sum(t["n_velas"] for t in tramos)
            informe.error(
                COD_HUECO,
                f"Faltan {faltantes} velas repartidas en {len(tramos)} huecos. "
                f"Primeros huecos: {tramos[: umbrales.max_ejemplos]}. "
                "No los relleno. Un hueco puede ser una parada del exchange, "
                "un problema de la descarga o un periodo en el que el par no "
                "cotizaba; cada caso se trata distinto y esa decisión es tuya.",
                n_velas_faltantes=faltantes,
                n_huecos=len(tramos),
                huecos=tramos[: umbrales.max_ejemplos],
            )

    # --- 8. Coherencia interna de cada vela ------------------------------
    # high tiene que ser el máximo y low el mínimo. Si no lo son, la vela es
    # imposible, y una vela imposible hace que un backtest que use máximos y
    # mínimos (stops, por ejemplo) devuelva fantasías.
    o, h, l, c = (df[x].to_numpy() for x in ("open", "high", "low", "close"))
    con_datos = ~np.isnan(o) & ~np.isnan(h) & ~np.isnan(l) & ~np.isnan(c)
    incoherentes = con_datos & (
        (h < l) | (h < np.maximum(o, c)) | (l > np.minimum(o, c))
    )
    if incoherentes.any():
        idx_inc = df.index[incoherentes]
        informe.error(
            COD_OHLC_INCOHERENTE,
            f"{int(incoherentes.sum())} velas son imposibles (el máximo no es "
            f"el mayor de los cuatro precios, o el mínimo no es el menor). "
            f"Ejemplos: {_muestra(idx_inc, umbrales.max_ejemplos)}",
            n_velas=int(incoherentes.sum()),
            ejemplos=_muestra(idx_inc, umbrales.max_ejemplos),
        )

    # --- 9. Precios no positivos y volumen negativo ----------------------
    precios = df.loc[:, list(COLUMNAS_PRECIO)].to_numpy()
    no_positivos = np.nan_to_num(precios, nan=1.0) <= 0
    if no_positivos.any():
        idx_np = df.index[no_positivos.any(axis=1)]
        informe.error(
            COD_PRECIO_NO_POSITIVO,
            f"Hay precios menores o iguales a cero en {int(no_positivos.sum())} "
            f"celdas. Ejemplos: {_muestra(idx_np, umbrales.max_ejemplos)}",
            n_celdas=int(no_positivos.sum()),
        )

    vol = df[COLUMNA_VOLUMEN].to_numpy()
    negativos = np.nan_to_num(vol, nan=0.0) < 0
    if negativos.any():
        informe.error(
            COD_VOLUMEN_NEGATIVO,
            f"{int(negativos.sum())} velas tienen volumen negativo.",
            n_velas=int(negativos.sum()),
        )

    # --- 10. Volumen cero -------------------------------------------------
    ceros = np.nan_to_num(vol, nan=-1.0) == 0
    if ceros.any():
        ratio = float(ceros.sum()) / len(df)
        nivel = (
            Nivel.AVISO
            if ratio <= umbrales.ratio_volumen_cero_aviso
            else Nivel.ERROR
        )
        informe.añadir(
            nivel,
            COD_VOLUMEN_CERO,
            f"{int(ceros.sum())} velas ({ratio:.2%}) no tuvieron ni una sola "
            "operación. En esas velas el precio no es un precio real de "
            "mercado: nadie compró ni vendió. Si la proporción es alta, el "
            "activo es demasiado ilíquido para fiarse del backtest.",
            n_velas=int(ceros.sum()),
            ratio=ratio,
        )

    # --- 11. Discontinuidades (el equivalente cripto de un split) ---------
    # Comparo el cierre de cada vela con la apertura de la siguiente. En un
    # mercado 24/7 deberían coincidir casi exactamente.
    if len(df) > 1 and df.index.is_monotonic_increasing:
        cierre_prev = c[:-1]
        apertura_sig = o[1:]
        valido = (
            np.isfinite(cierre_prev)
            & np.isfinite(apertura_sig)
            & (cierre_prev > 0)
            & (apertura_sig > 0)
        )
        salto = np.zeros_like(cierre_prev)
        salto[valido] = np.abs(apertura_sig[valido] / cierre_prev[valido] - 1.0)

        graves = valido & (salto > umbrales.salto_entre_velas_grave)
        if graves.any():
            idx_g = df.index[1:][graves]
            informe.error(
                COD_SALTO_ENTRE_VELAS,
                f"{int(graves.sum())} discontinuidades enormes entre el cierre "
                f"de una vela y la apertura de la siguiente (>"
                f"{umbrales.salto_entre_velas_grave:.0%}). En un mercado que "
                "cotiza 24/7 esto no debería pasar: apunta a datos corruptos, "
                "a un cambio de ticker o a una redenominación del token. "
                f"Ejemplos: {_muestra(idx_g, umbrales.max_ejemplos)}",
                n_casos=int(graves.sum()),
                ejemplos=_muestra(idx_g, umbrales.max_ejemplos),
                salto_maximo=float(salto[valido].max()) if valido.any() else 0.0,
            )
        leves = valido & (salto > umbrales.salto_entre_velas_aviso) & ~graves
        if leves.any():
            idx_l = df.index[1:][leves]
            informe.aviso(
                COD_SALTO_ENTRE_VELAS,
                f"{int(leves.sum())} discontinuidades moderadas cierre->apertura "
                f"(>{umbrales.salto_entre_velas_aviso:.0%}). Míralas: pueden ser "
                "movimientos reales muy violentos o velas de baja calidad.",
                n_casos=int(leves.sum()),
                ejemplos=_muestra(idx_l, umbrales.max_ejemplos),
            )

        # Movimiento dentro de una misma vela (cierre a cierre).
        with np.errstate(divide="ignore", invalid="ignore"):
            ret = np.abs(c[1:] / c[:-1] - 1.0)
        extremos = np.isfinite(ret) & (ret > umbrales.retorno_extremo_aviso)
        if extremos.any():
            idx_e = df.index[1:][extremos]
            informe.aviso(
                COD_RETORNO_EXTREMO,
                f"{int(extremos.sum())} velas con un movimiento de cierre a "
                f"cierre superior al {umbrales.retorno_extremo_aviso:.0%}. "
                "Puede ser real (flash crash) o puede ser una vela corrupta. "
                f"Ejemplos: {_muestra(idx_e, umbrales.max_ejemplos)}",
                n_casos=int(extremos.sum()),
                ejemplos=_muestra(idx_e, umbrales.max_ejemplos),
            )

    # --- 12. La última vela tiene que estar CERRADA -----------------------
    # Primera defensa contra el look-ahead, y empieza aquí, en los datos, no
    # en el motor. Una vela en formación cambia de valores mientras la miras:
    # si el backtest la usa, está usando información que en ese momento nadie
    # tenía.
    ultima_ms = int(marcas[-1])
    if ultima_ms + tf.paso_ms > ahora_ms:
        informe.error(
            COD_VELA_SIN_CERRAR,
            f"La última vela ({de_ms(ultima_ms)}) todavía no ha cerrado: "
            f"cerraría en {de_ms(ultima_ms + tf.paso_ms)} y ahora son "
            f"{de_ms(ahora_ms)}. Una vela en formación cambia mientras la "
            "miras, así que usarla es mirar el futuro. Se descarta siempre.",
            ultima_vela=str(de_ms(ultima_ms)),
            cierra_en=str(de_ms(ultima_ms + tf.paso_ms)),
        )

    # --- 13. ¿Cubre lo que pediste? ---------------------------------------
    if rango_pedido is not None:
        pedido_desde, pedido_hasta = rango_pedido
        primera_esperada = rejilla_esperada(pedido_desde, pedido_desde, tf)
        ultima_esperada = rejilla_esperada(pedido_hasta, pedido_hasta, tf)
        falta_inicio = len(primera_esperada) > 0 and df.index[0] > primera_esperada[0]
        falta_final = len(ultima_esperada) > 0 and df.index[-1] < ultima_esperada[0]
        if falta_inicio or falta_final:
            informe.aviso(
                COD_COBERTURA_PARCIAL,
                "El dataset no cubre todo el periodo que pediste "
                f"({de_ms(pedido_desde)} -> {de_ms(pedido_hasta)}); lo que hay "
                f"va de {df.index[0]} a {df.index[-1]}. Lo más habitual es que "
                "el par no existiera todavía, o que la última vela aún no haya "
                "cerrado. Ten cuidado al comparar estrategias sobre periodos "
                "que en realidad no son el mismo.",
                pedido_desde=str(de_ms(pedido_desde)),
                pedido_hasta=str(de_ms(pedido_hasta)),
                real_desde=str(df.index[0]),
                real_hasta=str(df.index[-1]),
            )

    return informe


def detectar_huecos(indice: pd.DatetimeIndex, tf: Timeframe) -> list[dict[str, Any]]:
    """
    Devuelve la lista de tramos que faltan.

    Cada tramo es un diccionario con la primera vela que falta, la última y
    cuántas son. Lo devuelvo agrupado en tramos y no como lista suelta de
    timestamps porque "faltan 4.320 velas" no dice nada, y "falta el 12 de
    marzo entero" sí.
    """
    if len(indice) < 2:
        return []
    marcas = marcas_ms(indice)
    diffs = np.diff(marcas)
    tramos: list[dict[str, Any]] = []
    for pos in np.nonzero(diffs > tf.paso_ms)[0]:
        inicio_falta = int(marcas[pos]) + tf.paso_ms
        fin_falta = int(marcas[pos + 1]) - tf.paso_ms
        n = (fin_falta - inicio_falta) // tf.paso_ms + 1
        tramos.append(
            {
                "desde": str(de_ms(inicio_falta)),
                "hasta": str(de_ms(fin_falta)),
                "n_velas": int(n),
            }
        )
    return tramos
