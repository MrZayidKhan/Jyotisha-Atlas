"""Generate the brightness-limited HYG v4.1 subset (CC BY-SA 4.0)."""
import csv
import json
from pathlib import Path

root = Path(__file__).resolve().parents[1]
with (root / "outputs/hygdata_v41.csv").open(encoding="utf-8", newline="") as source:
    stars = [
        [round(float(row["ra"]), 5), round(float(row["dec"]), 4),
         round(float(row["mag"]), 2), round(float(row["ci"]), 2) if row["ci"] else None]
        for row in csv.DictReader(source)
        if row["id"] != "0" and row["mag"] and float(row["mag"]) <= 4.8
    ]
stars.sort(key=lambda star: star[2], reverse=True)
(root / "public/hyg-stars.json").write_text(json.dumps(stars, separators=(",", ":")) + "\n", encoding="utf-8")
print(f"{len(stars)} stars")
