"""
La conexión con el exchange.

DECISIÓN CLAVE — El resto del laboratorio no conoce ccxt.

Todo lo que necesita el laboratorio de un exchange son dos cosas: "dame velas
desde este instante" y "qué hora es". Eso es lo que define el protocolo
`ClienteExchange`. `ClienteCCXT` es la implementación real contra Binance, y
en los tests se enchufa un cliente falso.

Esto no es arquitectura por gusto. Tiene tres consecuencias prácticas:
  1. Los tests corren sin red y en milisegundos, así que se ejecutan siempre.
  2. Puedo simular fallos del exchange (respuestas vacías, datos repetidos,
     caídas) que en la vida real pasan y son imposibles de provocar a mano.
  3. El reloj es inyectable, así que la comprobación de "esta vela aún no ha
     cerrado" se puede testear sin esperar una hora.

AVISO IMPORTANTE sobre este repositorio: en el entorno donde se ha escrito
este código, la red hacia `api.binance.com` está bloqueada por política de
proxy. `ClienteCCXT` está escrito con cuidado pero NO se ha podido ejecutar
contra el API real. La primera vez que lo lances en tu máquina, hazlo con un
rango pequeño (por ejemplo un día de velas de 1h) y comprueba el resultado
antes de descargarte cinco años.
"""

from __future__ import annotations

import datetime as dt
import logging
import time
from typing import Any, Protocol, Sequence, runtime_checkable

from ..errores import ErrorDeConfiguracion, ErrorDeDescarga

log = logging.getLogger(__name__)

MERCADOS = ("spot", "perp")


@runtime_checkable
class ClienteExchange(Protocol):
    """
    Lo mínimo que el laboratorio necesita de un exchange.

    `obtener_ohlcv` devuelve filas `[ts_ms, open, high, low, close, volume]`
    ordenadas de más antigua a más nueva, empezando en `desde_ms`.
    """

    def obtener_ohlcv(
        self, simbolo: str, timeframe: str, desde_ms: int, limite: int
    ) -> list[Sequence[Any]]: ...

    def ahora_ms(self) -> int: ...


class ClienteCCXT:
    """
    Implementación real sobre ccxt.

    Detalles que importan:

    - `enableRateLimit=True`: ccxt espera solo entre peticiones para no
      superar el límite del exchange. Sin esto te banean la IP.
    - Reintentos con espera creciente (2s, 4s, 8s...) solo ante errores de
      RED. Un error de "símbolo inexistente" no se reintenta: reintentar algo
      que está mal no lo arregla, solo tarda más en decírtelo.
    - `mercado="perp"` cambia el tipo de mercado a futuros perpetuos, que es
      donde luego habrá que aplicar el coste de funding.
    """

    def __init__(
        self,
        exchange: str = "binance",
        mercado: str = "spot",
        *,
        reintentos: int = 4,
        espera_inicial: float = 2.0,
        dormir=time.sleep,
    ):
        if mercado not in MERCADOS:
            raise ErrorDeConfiguracion(
                f"Mercado '{mercado}' desconocido. Opciones: {MERCADOS}."
            )
        try:
            import ccxt  # import perezoso: los tests no necesitan ccxt
        except ImportError as exc:  # pragma: no cover
            raise ErrorDeConfiguracion(
                "ccxt no está instalado. Instálalo con: pip install ccxt"
            ) from exc

        if not hasattr(ccxt, exchange):
            raise ErrorDeConfiguracion(f"ccxt no conoce el exchange '{exchange}'.")

        self.ccxt = ccxt
        self.nombre = exchange
        self.mercado = mercado
        self.reintentos = reintentos
        self.espera_inicial = espera_inicial
        self._dormir = dormir
        self._ex = getattr(ccxt, exchange)(
            {
                "enableRateLimit": True,
                "options": {"defaultType": "future" if mercado == "perp" else "spot"},
            }
        )

    # -- protocolo ---------------------------------------------------------
    def obtener_ohlcv(
        self, simbolo: str, timeframe: str, desde_ms: int, limite: int
    ) -> list[Sequence[Any]]:
        return self._con_reintentos(
            lambda: self._ex.fetch_ohlcv(
                simbolo, timeframe=timeframe, since=int(desde_ms), limit=int(limite)
            ),
            descripcion=f"velas de {simbolo} {timeframe} desde {desde_ms}",
        )

    def ahora_ms(self) -> int:
        """
        El reloj de referencia es el del EXCHANGE, no el de tu ordenador.

        Si tu portátil va tres minutos adelantado, con el reloj local
        aceptarías como "cerrada" una vela que aún está formándose. Si el
        exchange no da la hora, caigo al reloj local pero lo aviso.
        """
        try:
            marca = self._con_reintentos(
                self._ex.fetch_time, descripcion="hora del exchange"
            )
            if marca:
                return int(marca)
        except (ErrorDeDescarga, AttributeError, NotImplementedError) as exc:
            log.warning(
                "No he podido leer la hora del exchange (%s). Uso el reloj local: "
                "si tu reloj está desajustado, la comprobación de 'vela cerrada' "
                "pierde precisión.",
                exc,
            )
        return int(dt.datetime.now(dt.timezone.utc).timestamp() * 1000)

    # -- interno -----------------------------------------------------------
    def _con_reintentos(self, funcion, *, descripcion: str):
        errores_red = (
            self.ccxt.NetworkError,
            self.ccxt.ExchangeNotAvailable,
            self.ccxt.RequestTimeout,
        )
        espera = self.espera_inicial
        ultimo: Exception | None = None
        for intento in range(1, self.reintentos + 1):
            try:
                return funcion()
            except errores_red as exc:
                ultimo = exc
                if intento == self.reintentos:
                    break
                log.warning(
                    "Fallo de red pidiendo %s (intento %d/%d): %s. Reintento en %.0fs.",
                    descripcion,
                    intento,
                    self.reintentos,
                    exc,
                    espera,
                )
                self._dormir(espera)
                espera *= 2
            except self.ccxt.BaseError as exc:
                # Error del exchange que no es de red: símbolo que no existe,
                # timeframe no soportado, parámetros mal. Reintentar no ayuda.
                raise ErrorDeDescarga(
                    f"El exchange ha rechazado la petición de {descripcion}: {exc}"
                ) from exc
        raise ErrorDeDescarga(
            f"No he conseguido {descripcion} tras {self.reintentos} intentos. "
            f"Último error: {ultimo}"
        ) from ultimo
