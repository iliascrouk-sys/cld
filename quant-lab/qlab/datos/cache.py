"""
Caché local en parquet.

Para qué sirve: descargar años de velas de 1 minuto tarda mucho y castiga el
API del exchange. Se descarga una vez, se guarda en disco y las siguientes
veces se lee en un segundo.

DECISIÓN CLAVE — Junto a cada fichero de datos guardo un fichero de metadatos
con la huella (sha256) del contenido.

Suena a paranoia y no lo es. En un laboratorio de backtesting, la pregunta
"¿con qué datos exactamente saqué este resultado?" tiene que tener respuesta.
La huella permite:
  1. Detectar que un fichero se ha corrompido o se escribió a medias.
  2. Detectar que alguien (tú, dentro de seis meses) ha editado los datos a
     mano para que "cuadren".
  3. Poder escribir en el informe del backtest la huella exacta del dataset.

La huella se calcula sobre los NÚMEROS, no sobre los bytes del parquet: dos
versiones distintas de pyarrow pueden comprimir el mismo contenido de forma
diferente, y no quiero falsos positivos por eso.

DECISIÓN CLAVE — Escritura atómica.
Escribo en un fichero temporal y luego lo renombro. Si el proceso se muere a
mitad de la escritura, te quedas con la versión anterior íntegra en vez de
con un parquet truncado.
"""

from __future__ import annotations

import datetime as dt
import hashlib
import json
import os
import re
from dataclasses import dataclass, asdict
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd

from ..errores import ErrorDeCache
from .esquema import COLUMNAS, NOMBRE_INDICE, VERSION_ESQUEMA, marcas_ms, normalizar

# Carpeta por defecto. Se puede cambiar con la variable de entorno QLAB_CACHE
# o pasando `directorio` a las funciones.
DIRECTORIO_POR_DEFECTO = Path(
    os.environ.get("QLAB_CACHE", Path(__file__).resolve().parents[2] / "datos_cache")
)

_NO_SEGURO = re.compile(r"[^A-Za-z0-9_.-]")


def _sanear(texto: str) -> str:
    """'BTC/USDT' -> 'BTC_USDT'. Los símbolos llevan barras y las barras son
    separadores de carpeta: si no lo saneo, acabo creando directorios raros."""
    return _NO_SEGURO.sub("_", texto)


@dataclass(frozen=True)
class ClaveDataset:
    """Identifica de forma única un conjunto de velas."""

    exchange: str
    mercado: str  # "spot" o "perp"
    simbolo: str
    timeframe: str

    def ruta_base(self, directorio: Path | str | None = None) -> Path:
        d = Path(directorio) if directorio is not None else DIRECTORIO_POR_DEFECTO
        return (
            d
            / _sanear(self.exchange)
            / _sanear(self.mercado)
            / _sanear(self.simbolo)
            / _sanear(self.timeframe)
        )

    def ruta_parquet(self, directorio: Path | str | None = None) -> Path:
        return self.ruta_base(directorio).with_suffix(".parquet")

    def ruta_meta(self, directorio: Path | str | None = None) -> Path:
        return self.ruta_base(directorio).with_suffix(".meta.json")

    def __str__(self) -> str:
        return f"{self.exchange}:{self.mercado}:{self.simbolo}:{self.timeframe}"


@dataclass
class MetadatosCache:
    """Lo que se guarda al lado de los datos."""

    version_esquema: int
    exchange: str
    mercado: str
    simbolo: str
    timeframe: str
    filas: int
    desde: str | None
    hasta: str | None
    sha256: str
    escrito_en: str
    fuente: str
    informe_validacion: dict[str, Any] | None = None

    def a_dict(self) -> dict[str, Any]:
        return asdict(self)


def huella(df: pd.DataFrame) -> str:
    """
    Huella sha256 del contenido de la tabla.

    Se calcula sobre los bytes crudos de: las marcas de tiempo (int64) y las
    cinco columnas en orden fijo (float64). Eso la hace estable entre
    versiones de pandas/pyarrow y entre máquinas.
    """
    h = hashlib.sha256()
    h.update(f"qlab-v{VERSION_ESQUEMA}".encode())
    marcas = marcas_ms(df.index)
    h.update(np.ascontiguousarray(marcas).tobytes())
    for col in COLUMNAS:
        valores = np.ascontiguousarray(df[col].to_numpy(dtype="float64"))
        h.update(col.encode())
        h.update(valores.tobytes())
    return h.hexdigest()


def escribir(
    df: pd.DataFrame,
    clave: ClaveDataset,
    *,
    directorio: Path | str | None = None,
    fuente: str = "desconocida",
    informe_validacion: dict[str, Any] | None = None,
) -> MetadatosCache:
    """Guarda la tabla en parquet + su fichero de metadatos, de forma atómica."""
    df = normalizar(df)
    ruta = clave.ruta_parquet(directorio)
    ruta.parent.mkdir(parents=True, exist_ok=True)

    meta = MetadatosCache(
        version_esquema=VERSION_ESQUEMA,
        exchange=clave.exchange,
        mercado=clave.mercado,
        simbolo=clave.simbolo,
        timeframe=clave.timeframe,
        filas=len(df),
        desde=None if df.empty else df.index[0].isoformat(),
        hasta=None if df.empty else df.index[-1].isoformat(),
        sha256=huella(df),
        escrito_en=dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds"),
        fuente=fuente,
        informe_validacion=informe_validacion,
    )

    tmp_datos = ruta.with_suffix(".parquet.tmp")
    df.to_parquet(tmp_datos, engine="pyarrow", compression="zstd", index=True)
    os.replace(tmp_datos, ruta)

    ruta_meta = clave.ruta_meta(directorio)
    tmp_meta = ruta_meta.with_suffix(".json.tmp")
    tmp_meta.write_text(
        json.dumps(meta.a_dict(), indent=2, ensure_ascii=False), encoding="utf-8"
    )
    os.replace(tmp_meta, ruta_meta)
    return meta


def existe(clave: ClaveDataset, directorio: Path | str | None = None) -> bool:
    return clave.ruta_parquet(directorio).exists()


def leer_metadatos(
    clave: ClaveDataset, directorio: Path | str | None = None
) -> MetadatosCache:
    ruta = clave.ruta_meta(directorio)
    if not ruta.exists():
        raise ErrorDeCache(
            f"No encuentro los metadatos de {clave} en {ruta}. Si el .parquet "
            "existe pero el .meta.json no, la caché está incompleta: bórrala y "
            "vuelve a descargar."
        )
    datos = json.loads(ruta.read_text(encoding="utf-8"))
    campos = {f for f in MetadatosCache.__dataclass_fields__}
    return MetadatosCache(**{k: v for k, v in datos.items() if k in campos})


def leer(
    clave: ClaveDataset,
    *,
    directorio: Path | str | None = None,
    comprobar_huella: bool = True,
) -> tuple[pd.DataFrame, MetadatosCache]:
    """
    Lee la tabla de la caché y comprueba que no la ha tocado nadie.

    `comprobar_huella=False` solo para casos muy concretos (por ejemplo,
    inspeccionar a mano un fichero que sabes que has editado). Por defecto va
    activado y va activado a propósito.
    """
    ruta = clave.ruta_parquet(directorio)
    if not ruta.exists():
        raise ErrorDeCache(f"No hay caché para {clave} en {ruta}.")

    meta = leer_metadatos(clave, directorio)
    if meta.version_esquema != VERSION_ESQUEMA:
        raise ErrorDeCache(
            f"La caché de {clave} se escribió con el esquema v{meta.version_esquema} "
            f"y ahora estamos en v{VERSION_ESQUEMA}. Bórrala y vuelve a descargar "
            "en vez de mezclar formatos."
        )

    df = pd.read_parquet(ruta, engine="pyarrow")
    df = normalizar(df)
    df.index.name = NOMBRE_INDICE

    if comprobar_huella:
        actual = huella(df)
        if actual != meta.sha256:
            raise ErrorDeCache(
                f"La huella de los datos de {clave} no coincide con la que se "
                f"guardó al escribirlos.\n  esperada: {meta.sha256}\n  actual:   "
                f"{actual}\nO el fichero está corrupto, o alguien lo ha editado. "
                "En ambos casos no me fío: bórralo y vuelve a descargar."
            )
    return df, meta


def borrar(clave: ClaveDataset, directorio: Path | str | None = None) -> None:
    """Borra datos y metadatos de un dataset. Útil para forzar una redescarga."""
    for ruta in (clave.ruta_parquet(directorio), clave.ruta_meta(directorio)):
        if ruta.exists():
            ruta.unlink()


def listar(directorio: Path | str | None = None) -> list[MetadatosCache]:
    """Todo lo que hay guardado, para poder ver de un vistazo qué tienes."""
    d = Path(directorio) if directorio is not None else DIRECTORIO_POR_DEFECTO
    if not d.exists():
        return []
    salida: list[MetadatosCache] = []
    for ruta in sorted(d.rglob("*.meta.json")):
        try:
            datos = json.loads(ruta.read_text(encoding="utf-8"))
            campos = {f for f in MetadatosCache.__dataclass_fields__}
            salida.append(
                MetadatosCache(**{k: v for k, v in datos.items() if k in campos})
            )
        except (json.JSONDecodeError, TypeError) as exc:  # pragma: no cover
            raise ErrorDeCache(f"Metadatos ilegibles en {ruta}: {exc}") from exc
    return salida
