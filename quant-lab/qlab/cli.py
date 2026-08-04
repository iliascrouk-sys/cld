"""
Línea de comandos, para no tener que escribir Python cada vez.

    python -m qlab.cli descargar BTC/USDT 1h --desde 2023-01-01 --hasta 2023-12-31
    python -m qlab.cli revisar   BTC/USDT 1h
    python -m qlab.cli listar

Los códigos de salida importan: 0 = todo bien, 1 = datos sucios, 2 = error de
uso o de conexión. Así se puede encadenar en un script sin leer la salida.
"""

from __future__ import annotations

import argparse
import logging
import sys

from .datos import cache as _cache
from .datos.cargador import PoliticaHuecos, cargar_ohlcv, inspeccionar
from .datos.cache import ClaveDataset
from .errores import DatosSuciosError, ErrorQLab


def _configurar_log(verboso: bool) -> None:
    logging.basicConfig(
        level=logging.DEBUG if verboso else logging.INFO,
        format="%(levelname)s %(message)s",
    )


def construir_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(
        prog="qlab",
        description="Laboratorio de backtesting — Fase 1: datos.",
    )
    p.add_argument("-v", "--verboso", action="store_true")
    sub = p.add_subparsers(dest="comando", required=True)

    d = sub.add_parser("descargar", help="descarga y valida un rango de velas")
    d.add_argument("simbolo", help="por ejemplo BTC/USDT")
    d.add_argument("timeframe", help="por ejemplo 1h")
    d.add_argument("--desde", required=True, help="fecha inicial (UTC)")
    d.add_argument("--hasta", default=None, help="fecha final (UTC); por defecto, ahora")
    d.add_argument("--exchange", default="binance")
    d.add_argument("--mercado", default="spot", choices=("spot", "perp"))
    d.add_argument("--cache", default=None, help="carpeta de caché")
    d.add_argument(
        "--huecos",
        default="fallar",
        choices=[p.value for p in PoliticaHuecos],
        help="qué hacer si faltan velas (por defecto: fallar)",
    )
    d.add_argument("--forzar", action="store_true", help="ignora la caché y redescarga")
    d.add_argument(
        "--sin-red",
        action="store_true",
        help="no descarga nada; trabaja solo con lo que hay en disco",
    )

    r = sub.add_parser("revisar", help="valida lo que hay en caché sin descargar")
    r.add_argument("simbolo")
    r.add_argument("timeframe")
    r.add_argument("--exchange", default="binance")
    r.add_argument("--mercado", default="spot", choices=("spot", "perp"))
    r.add_argument("--cache", default=None)

    l = sub.add_parser("listar", help="qué datasets hay guardados")
    l.add_argument("--cache", default=None)

    b = sub.add_parser("borrar", help="borra un dataset de la caché")
    b.add_argument("simbolo")
    b.add_argument("timeframe")
    b.add_argument("--exchange", default="binance")
    b.add_argument("--mercado", default="spot", choices=("spot", "perp"))
    b.add_argument("--cache", default=None)
    return p


def main(argv: list[str] | None = None) -> int:
    args = construir_parser().parse_args(argv)
    _configurar_log(args.verboso)

    try:
        if args.comando == "descargar":
            datos = cargar_ohlcv(
                args.simbolo,
                args.timeframe,
                args.desde,
                args.hasta,
                exchange=args.exchange,
                mercado=args.mercado,
                directorio_cache=args.cache,
                politica_huecos=args.huecos,
                forzar_redescarga=args.forzar,
                permitir_descarga=not args.sin_red,
            )
            print(datos.resumen())
            return 0

        if args.comando == "revisar":
            informe = inspeccionar(
                args.simbolo,
                args.timeframe,
                exchange=args.exchange,
                mercado=args.mercado,
                directorio_cache=args.cache,
            )
            print(informe.resumen())
            return 0 if informe.limpio else 1

        if args.comando == "listar":
            metas = _cache.listar(args.cache)
            if not metas:
                print("No hay nada en la caché.")
                return 0
            for m in metas:
                print(
                    f"{m.exchange:10s} {m.mercado:5s} {m.simbolo:14s} "
                    f"{m.timeframe:4s} {m.filas:>9d} velas  "
                    f"{m.desde} -> {m.hasta}  sha256:{m.sha256[:12]}…"
                )
            return 0

        if args.comando == "borrar":
            clave = ClaveDataset(
                args.exchange, args.mercado, args.simbolo, args.timeframe
            )
            _cache.borrar(clave, args.cache)
            print(f"Borrado {clave}.")
            return 0

    except DatosSuciosError as exc:
        print(f"\nDATOS SUCIOS — no se van a usar.\n{exc}", file=sys.stderr)
        return 1
    except ErrorQLab as exc:
        print(f"\nERROR: {exc}", file=sys.stderr)
        return 2

    return 2  # pragma: no cover


if __name__ == "__main__":  # pragma: no cover
    raise SystemExit(main())
