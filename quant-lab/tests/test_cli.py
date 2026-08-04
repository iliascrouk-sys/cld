"""
Tests de la línea de comandos.

Lo importante aquí son los códigos de salida: 0 todo bien, 1 datos sucios,
2 error de uso. Así se puede meter en un script y que se pare solo si algo
huele mal, sin tener que leer la salida a ojo.
"""

from __future__ import annotations

from qlab.cli import main
from qlab.datos import cache as C
from qlab.datos.cache import ClaveDataset

from conftest import MS_HORA, velas_sinteticas

CLAVE = ClaveDataset("binance", "spot", "BTC/USDT", "1h")


def test_listar_vacio(cache_tmp, capsys):
    assert main(["listar", "--cache", str(cache_tmp)]) == 0
    assert "No hay nada" in capsys.readouterr().out


def test_listar_con_contenido(cache_tmp, capsys):
    C.escribir(velas_sinteticas(100), CLAVE, directorio=cache_tmp)
    assert main(["listar", "--cache", str(cache_tmp)]) == 0
    salida = capsys.readouterr().out
    assert "BTC/USDT" in salida
    assert "100 velas" in salida


def test_revisar_datos_limpios_sale_cero(cache_tmp, capsys):
    velas = velas_sinteticas(100)
    C.escribir(velas, CLAVE, directorio=cache_tmp)
    codigo = main(["revisar", "BTC/USDT", "1h", "--cache", str(cache_tmp)])
    # Puede salir 1 si la última vela aún no ha cerrado según el reloj real;
    # las velas sintéticas son de 2020, así que aquí sale limpio.
    assert codigo == 0
    assert "Sin incidencias" in capsys.readouterr().out


def test_revisar_datos_sucios_sale_uno(cache_tmp, capsys):
    completas = velas_sinteticas(100)
    C.escribir(completas.drop(completas.index[40:45]), CLAVE, directorio=cache_tmp)
    assert main(["revisar", "BTC/USDT", "1h", "--cache", str(cache_tmp)]) == 1
    assert "HUECO" in capsys.readouterr().out


def test_borrar(cache_tmp, capsys):
    C.escribir(velas_sinteticas(10), CLAVE, directorio=cache_tmp)
    assert main(
        ["borrar", "BTC/USDT", "1h", "--cache", str(cache_tmp)]
    ) == 0
    assert not C.existe(CLAVE, cache_tmp)


def test_error_de_uso_sale_dos(cache_tmp, capsys):
    """Timeframe inexistente: no es culpa de los datos, es culpa de la orden."""
    codigo = main(
        [
            "descargar",
            "BTC/USDT",
            "7h",
            "--desde",
            "2023-01-01",
            "--cache",
            str(cache_tmp),
            "--sin-red",
        ]
    )
    assert codigo == 2
    assert "ERROR" in capsys.readouterr().err


def test_descargar_sin_red_y_sin_cache_sale_uno(cache_tmp, capsys):
    """Sin datos y sin permiso para bajarlos: datos vacíos = datos sucios."""
    codigo = main(
        [
            "descargar",
            "BTC/USDT",
            "1h",
            "--desde",
            "2023-01-01",
            "--hasta",
            "2023-01-05",
            "--cache",
            str(cache_tmp),
            "--sin-red",
        ]
    )
    assert codigo == 1
    assert "DATOS SUCIOS" in capsys.readouterr().err
