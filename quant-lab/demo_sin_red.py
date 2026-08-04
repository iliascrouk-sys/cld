"""
Demostración de la Fase 1 SIN conexión a internet.

Para qué existe: en el entorno donde se escribió este código, la red hacia
Binance está bloqueada. Y, en general, poder enseñar que el laboratorio
funciona sin depender de que un servidor ajeno esté de buenas es una virtud,
no un apaño.

Se usa un exchange simulado que devuelve velas inventadas pero coherentes.
Los precios NO significan nada: lo que se demuestra es la maquinaria.

    python demo_sin_red.py
"""

from __future__ import annotations

import sys
import tempfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
sys.path.insert(0, str(Path(__file__).parent / "tests"))

from conftest import MS_HORA, ExchangeFalso, velas_sinteticas  # noqa: E402

from qlab.datos import cargar_ohlcv  # noqa: E402
from qlab.datos.esquema import marcas_ms  # noqa: E402
from qlab.errores import DatosSuciosError  # noqa: E402


def titulo(texto: str) -> None:
    print(f"\n{'=' * 72}\n{texto}\n{'=' * 72}")


def main() -> int:
    velas = velas_sinteticas(500)
    marcas = marcas_ms(velas.index)
    desde, hasta = int(marcas[0]), int(marcas[-1])
    ahora = hasta + MS_HORA  # la última vela acaba de cerrar

    with tempfile.TemporaryDirectory() as tmp:
        cache = Path(tmp) / "cache"

        # ------------------------------------------------------------------
        titulo("1. Descarga normal: datos limpios")
        ex = ExchangeFalso(velas, ahora=ahora, limite_servidor=100)
        datos = cargar_ohlcv(
            "DEMO/USDT", "1h", desde, hasta,
            cliente=ex, directorio_cache=cache, ahora_ms=ahora,
        )
        print(datos.resumen())
        print(f"\n  -> {len(ex.peticiones)} peticiones al exchange (paginando de 100 en 100)")

        # ------------------------------------------------------------------
        titulo("2. Segunda vez: sale de la caché, sin tocar el exchange")
        antes = len(ex.peticiones)
        datos2 = cargar_ohlcv(
            "DEMO/USDT", "1h", desde, hasta,
            cliente=ex, directorio_cache=cache, ahora_ms=ahora,
        )
        print(f"  peticiones nuevas al exchange: {len(ex.peticiones) - antes}")
        print(f"  origen de los datos          : {datos2.origen}")
        print(f"  misma huella que antes       : {datos2.huella == datos.huella}")

        # ------------------------------------------------------------------
        titulo("3. La vela en formación NO entra (defensa anti look-ahead)")
        ahora_a_medias = hasta + MS_HORA // 2  # la última vela sigue abierta
        ex3 = ExchangeFalso(velas, ahora=ahora_a_medias)
        datos3 = cargar_ohlcv(
            "DEMO2/USDT", "1h", desde, hasta,
            cliente=ex3, directorio_cache=cache, ahora_ms=ahora_a_medias,
        )
        print(f"  el exchange ofrece      : {len(velas)} velas")
        print(f"  el laboratorio acepta   : {len(datos3)} velas")
        print(f"  última vela aceptada    : {datos3.velas.index[-1]}")
        print("  (la última del exchange todavía se estaba formando)")

        # ------------------------------------------------------------------
        titulo("4. Datos con un hueco: el laboratorio se PARA")
        con_hueco = velas.drop(velas.index[200:210])
        ex4 = ExchangeFalso(con_hueco, ahora=ahora)
        try:
            cargar_ohlcv(
                "ROTO/USDT", "1h", desde, hasta,
                cliente=ex4, directorio_cache=cache, ahora_ms=ahora,
            )
            print("  ERROR: debería haber fallado y no lo ha hecho.")
            return 1
        except DatosSuciosError as exc:
            print(exc)

        # ------------------------------------------------------------------
        titulo("5. Con 'recortar': descarta velas, NO las inventa")
        datos5 = cargar_ohlcv(
            "ROTO2/USDT", "1h", desde, hasta,
            cliente=ExchangeFalso(con_hueco, ahora=ahora),
            directorio_cache=cache, ahora_ms=ahora,
            politica_huecos="recortar",
        )
        print(f"  velas disponibles : {len(con_hueco)}")
        print(f"  velas devueltas   : {len(datos5)}  <-- menos, nunca más")
        for nota in datos5.notas:
            print(f"  nota: {nota}")

        # ------------------------------------------------------------------
        titulo("6. Fichero de caché manipulado a mano: se detecta")
        import pandas as pd

        from qlab.datos import cache as C

        ruta = datos.clave.ruta_parquet(cache)
        tabla = pd.read_parquet(ruta)
        tabla.iloc[5, tabla.columns.get_loc("close")] = 999_999.0
        tabla.to_parquet(ruta, engine="pyarrow", index=True)
        try:
            C.leer(datos.clave, directorio=cache)
            print("  ERROR: debería haber detectado la manipulación.")
            return 1
        except Exception as exc:
            print(f"  {exc}")

    print("\nDemo completada.\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
