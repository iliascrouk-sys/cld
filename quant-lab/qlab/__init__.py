"""
qlab — laboratorio de backtesting.

Estado del proyecto:
  FASE 1 (datos) ................ implementada
  FASE 2 (motor de backtest) .... pendiente
  FASE 3 (métricas) ............. pendiente
  FASE 4 (anti-sobreajuste) ..... pendiente

Este paquete NO ejecuta órdenes reales ni se conecta a ninguna cuenta con
dinero. Solo lee datos históricos públicos. Cualquier paso hacia operar en
real exige antes, como mínimo: validación fuera de muestra y un periodo de
paper trading con resultados registrados.
"""

from .errores import (
    DatosSuciosError,
    ErrorDeCache,
    ErrorDeConfiguracion,
    ErrorDeDescarga,
    ErrorDeFormato,
    ErrorQLab,
)

__version__ = "0.1.0"

__all__ = [
    "DatosSuciosError",
    "ErrorDeCache",
    "ErrorDeConfiguracion",
    "ErrorDeDescarga",
    "ErrorDeFormato",
    "ErrorQLab",
    "__version__",
]
