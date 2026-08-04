"""Fase 1: datos. Descarga, caché y validación de velas OHLCV."""

from .cache import ClaveDataset, MetadatosCache, huella, listar
from .cargador import DatosOHLCV, PoliticaHuecos, cargar_ohlcv, inspeccionar
from .descarga import descargar_rango, fusionar
from .esquema import COLUMNAS, TIMEFRAMES, Timeframe, a_ms, de_ms, obtener_timeframe
from .exchange import ClienteCCXT, ClienteExchange
from .validacion import (
    Incidencia,
    InformeValidacion,
    Nivel,
    UmbralesValidacion,
    detectar_huecos,
    validar_ohlcv,
)

__all__ = [
    "COLUMNAS",
    "TIMEFRAMES",
    "ClaveDataset",
    "ClienteCCXT",
    "ClienteExchange",
    "DatosOHLCV",
    "Incidencia",
    "InformeValidacion",
    "MetadatosCache",
    "Nivel",
    "PoliticaHuecos",
    "Timeframe",
    "UmbralesValidacion",
    "a_ms",
    "cargar_ohlcv",
    "de_ms",
    "descargar_rango",
    "detectar_huecos",
    "fusionar",
    "huella",
    "inspeccionar",
    "listar",
    "obtener_timeframe",
    "validar_ohlcv",
]
