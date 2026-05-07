import json
from pathlib import Path

try:
    import fitz
except Exception as exc:
    print(f"FITZ_IMPORT_ERROR: {exc}")
    raise

root = Path(__file__).resolve().parents[1]
force_path = root / "data" / "force-powers.json"
pdf_path = root / "data" / "SW5e - Player's Handbook.pdf"

force_data = json.loads(force_path.read_text(encoding="utf-8"))
print("force_count", len(force_data))

doc = fitz.open(pdf_path)
toc = doc.get_toc(simple=True)
matches = [entry for entry in toc if "TECH POWERS" in entry[1].upper() or "FORCE POWERS" in entry[1].upper()]
print("toc_matches", len(matches))
print("toc_sample", matches[:20])
