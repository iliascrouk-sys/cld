"""
Errores propios del laboratorio.

Por qué tener errores propios en vez de usar `ValueError` a secas:
cuando algo falla queremos poder distinguir "los datos están sucios" de
"el exchange no responde" de "has pedido algo imposible". Cada uno se
arregla de una forma distinta, y mezclarlos hace que el mensaje de error
no te diga qué hacer.

Todos heredan de `ErrorQLab`, así que si quieres capturarlos todos de
golpe puedes hacer `except ErrorQLab`.
"""

from __future__ import annotations


class ErrorQLab(Exception):
    """Error base. Todo lo que lanza este laboratorio hereda de aquí."""


class ErrorDeConfiguracion(ErrorQLab):
    """Has pedido algo que no tiene sentido: un timeframe inexistente,
    un rango de fechas invertido, un mercado desconocido..."""


class ErrorDeDescarga(ErrorQLab):
    """El exchange no ha respondido, ha respondido mal, o se ha quedado
    atascado. No es culpa de los datos: es culpa de la conexión o del API."""


class ErrorDeFormato(ErrorDeDescarga):
    """El exchange ha respondido, pero con una forma que no reconozco
    (campos de menos, valores que no son números...)."""


class DatosSuciosError(ErrorQLab):
    """
    Los datos no pasan la validación.

    Este es el error más importante de la Fase 1. Se lanza cuando el
    conjunto de velas tiene algún defecto que invalidaría un backtest:
    huecos, duplicados, nulos, velas incoherentes, etc.

    Lleva el informe completo dentro (`.informe`) para que puedas
    inspeccionarlo desde código en vez de tener que leer el texto.
    """

    def __init__(self, mensaje: str, informe=None):
        super().__init__(mensaje)
        self.informe = informe


class ErrorDeCache(ErrorQLab):
    """El fichero de caché no existe, está corrupto, o su contenido no
    coincide con la huella que guardamos al escribirlo (alguien lo ha
    tocado a mano o se ha escrito a medias)."""
