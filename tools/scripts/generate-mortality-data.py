"""
Genere les tables de mortalite utilisees par le moteur PER transfert.

Sources :
- CASdatasets, fichiers freTGF05/freTGH05/freTPRV93/freTPG93full.

Prerequis Python :
    pip install pyreadr

Usage :
    python tools/scripts/generate-mortality-data.py
"""

from __future__ import annotations

import json
import sys
import urllib.request
from pathlib import Path
from typing import Any

try:
    import pyreadr
except ImportError as exc:  # pragma: no cover - message operateur
    raise SystemExit("pyreadr est requis pour lire les tables CASdatasets.") from exc


ROOT = Path(__file__).resolve().parents[2]
MORTALITY_DIR = ROOT / "src" / "data" / "mortality"
TMP_DIR = ROOT / ".tmp" / "mortality-data"

CASDATASETS_RAW = "https://raw.githubusercontent.com/dutangc/CASdatasets/master/data"
MORTALITY_FILES = {
    "tprv93": ("freTPRV93.rda", "freTPRV93"),
    "tgf05": ("freTGF05.rda", "freTGF05"),
    "tgh05": ("freTGH05.rda", "freTGH05"),
    "tpg93": ("freTPG93full.rda", "freTPG93full"),
}


def ts_json(value: Any) -> str:
    return json.dumps(value, ensure_ascii=False, separators=(",", ":"))


def download(url: str, path: Path) -> None:
    if path.exists():
        return
    path.parent.mkdir(parents=True, exist_ok=True)
    urllib.request.urlretrieve(url, path)


def dataframe_to_table(code: str, rda_name: str, object_name: str) -> dict[str, Any]:
    rda_path = TMP_DIR / rda_name
    download(f"{CASDATASETS_RAW}/{rda_name}", rda_path)
    result = pyreadr.read_r(str(rda_path))
    frame = result[object_name]

    ages = [int(age) for age in frame["x"].tolist()]
    base = 100000
    if code == "TPRV93":
        return {
            "code": code,
            "type": "single",
            "base": base,
            "minAge": min(ages),
            "maxAge": max(ages),
            "lx": [int(round(value)) for value in frame["lx"].tolist()],
        }

    generations: dict[str, list[int]] = {}
    for column in frame.columns:
        if not str(column).startswith("lx"):
            continue
        year = str(column)[2:]
        values = [int(round(value)) for value in frame[column].tolist()]
        generations[year] = values

    return {
        "code": code,
        "type": "generation",
        "base": base,
        "minAge": min(ages),
        "maxAge": max(ages),
        "generations": generations,
    }


def write_mortality_table(filename: str, const_name: str, table: dict[str, Any]) -> None:
    MORTALITY_DIR.mkdir(parents=True, exist_ok=True)
    body = ts_json(table)
    path = MORTALITY_DIR / filename
    path.write_text(
        "\n".join(
            [
                "/* Fichier genere par tools/scripts/generate-mortality-data.py. */",
                "/* Source : CASdatasets, donnees freMortTables. */",
                "import type { MortalityTable } from './types';",
                "",
                f"export const {const_name} = {body} satisfies MortalityTable;",
                "",
            ]
        ),
        encoding="utf-8",
    )


def write_mortality() -> None:
    tables = {
        "TPRV93": dataframe_to_table("TPRV93", *MORTALITY_FILES["tprv93"]),
        "TGF05": dataframe_to_table("TGF05", *MORTALITY_FILES["tgf05"]),
        "TGH05": dataframe_to_table("TGH05", *MORTALITY_FILES["tgh05"]),
        "TPG93": dataframe_to_table("TPG93", *MORTALITY_FILES["tpg93"]),
    }
    write_mortality_table("tprv93.generated.ts", "TPRV93", tables["TPRV93"])
    write_mortality_table("tgf05.generated.ts", "TGF05", tables["TGF05"])
    write_mortality_table("tgh05.generated.ts", "TGH05", tables["TGH05"])
    write_mortality_table("tpg93.generated.ts", "TPG93", tables["TPG93"])


def main() -> int:
    write_mortality()
    print("Tables mortalite : TPRV93, TGF05, TGH05, TPG93")
    return 0


if __name__ == "__main__":
    sys.exit(main())
