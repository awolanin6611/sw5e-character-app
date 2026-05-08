from __future__ import annotations

import json
import re
from pathlib import Path

import fitz


ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "data"

SPECIES_OUTPUT = DATA_DIR / "species-reference.json"
BACKGROUNDS_OUTPUT = DATA_DIR / "backgrounds-reference.json"
ARCHETYPES_OUTPUT = DATA_DIR / "archetypes-reference.json"
SOURCE_MAP_OUTPUT = DATA_DIR / "sheet-source-map.json"

GENERIC_TOC_NOISE = {
    "SPECIES",
    "BACKGROUNDS",
    "TABLE OF CONTENTS",
    "EXPANDED CONTENT | ARCHETYPES | TABLE OF CONTENTS",
}

ARCHETYPE_SKIP_TERMS = {
    "TABLE OF CONTENTS",
    "ARCHETYPES",
    "EXPANDED CONTENT",
    "SUPERIORITY",
    "FEATURE",
    "MANEUVERS",
    "BIOLOGY AND APPEARANCE",
    "SOCIETY AND CULTURE",
}

ARCHETYPE_HINT_WORDS = {
    "APPROACH",
    "DOCTRINE",
    "ENGINEERING",
    "FORM",
    "ORDER",
    "PATH",
    "PRACTICE",
    "PURSUIT",
    "SPECIALIST",
    "STRATEGY",
    "TRADITION",
    "WAY",
}

NAME_LINE_RE = re.compile(r"^[A-Za-z][A-Za-z'\- ]{1,50}$")


def smart_title(text: str) -> str:
    words = text.split()
    fixed = []
    for idx, word in enumerate(words):
        t = word.title()
        if idx > 0 and t in {"Of", "The", "And", "Or", "To", "A"}:
            fixed.append(t.lower())
        else:
            fixed.append(t)
    return " ".join(fixed)


def clean_line(line: str) -> str:
    return re.sub(r"\s+", " ", line).strip()


def read_page_lines(doc: fitz.Document, page_index: int) -> list[str]:
    text = doc.load_page(page_index).get_text("text")
    return [clean_line(line) for line in text.splitlines() if clean_line(line)]


def extract_toc_names_from_first_page(pdf_path: Path) -> list[str]:
    doc = fitz.open(pdf_path)
    try:
        if len(doc) == 0:
            return []
        lines = read_page_lines(doc, 0)
    finally:
        doc.close()

    names: list[str] = []
    seen = set()
    reading_names = False

    for raw in lines:
        upper = raw.upper()
        if "TABLE OF CONTENTS" in upper:
            reading_names = True
            continue
        if not reading_names:
            continue

        if upper in GENERIC_TOC_NOISE:
            continue
        if not NAME_LINE_RE.match(raw):
            continue

        title = smart_title(raw)
        if title not in seen:
            seen.add(title)
            names.append(title)

    return names


def is_upper_heading(line: str) -> bool:
    return bool(line) and line == line.upper() and bool(NAME_LINE_RE.match(line))


def extract_archetypes_from_pdf(pdf_path: Path) -> list[dict]:
    doc = fitz.open(pdf_path)
    try:
        found = {}
        for page_index in range(len(doc)):
            lines = read_page_lines(doc, page_index)
            # Most chapter/archetype headings appear near top of page
            for line in lines[:16]:
                upper = line.upper()
                if not is_upper_heading(upper):
                    continue
                if any(skip in upper for skip in ARCHETYPE_SKIP_TERMS):
                    continue
                if not any(hint in upper for hint in ARCHETYPE_HINT_WORDS):
                    continue

                name = smart_title(line)
                entry = found.setdefault(name, {"name": name, "sourcePages": []})
                entry["sourcePages"].append(page_index + 1)
                break

        results = list(found.values())
        results.sort(key=lambda item: item["name"])
        for item in results:
            item["sourcePages"] = sorted(set(item["sourcePages"]))
        return results
    finally:
        doc.close()


def find_pdf_by_keyword(keyword: str) -> Path | None:
    key = keyword.lower()
    for pdf in sorted(DATA_DIR.glob("*.pdf")):
        if key in pdf.name.lower():
            return pdf
    return None


def build_source_map(all_pdfs: list[Path]) -> dict:
    categories = {
        "coreRules": [],
        "species": [],
        "backgrounds": [],
        "archetypes": [],
        "forcePowers": [],
        "techPowers": [],
        "starships": [],
        "adventuresAndWorld": [],
    }

    for pdf in all_pdfs:
        name = pdf.name.lower()
        rel = str(pdf.relative_to(ROOT)).replace("\\", "/")

        if "player's handbook" in name:
            categories["coreRules"].append(rel)
        if "species" in name:
            categories["species"].append(rel)
        if "backgrounds" in name:
            categories["backgrounds"].append(rel)
        if "archetypes" in name:
            categories["archetypes"].append(rel)
        if "force powers" in name:
            categories["forcePowers"].append(rel)
        if "tech powers" in name:
            categories["techPowers"].append(rel)
        if "starships" in name or "shipyards" in name:
            categories["starships"].append(rel)
        if "wretched hives" in name or "scum and villainy" in name or "heretic" in name:
            categories["adventuresAndWorld"].append(rel)

    return {
        "generatedFrom": "data/*.pdf",
        "categories": categories,
    }


def main() -> None:
    all_pdfs = sorted(DATA_DIR.glob("*.pdf"))

    species_pdf = find_pdf_by_keyword("species")
    backgrounds_pdf = find_pdf_by_keyword("backgrounds")
    archetypes_pdf = find_pdf_by_keyword("archetypes")

    species_names = extract_toc_names_from_first_page(species_pdf) if species_pdf else []
    background_names = extract_toc_names_from_first_page(backgrounds_pdf) if backgrounds_pdf else []
    archetype_entries = extract_archetypes_from_pdf(archetypes_pdf) if archetypes_pdf else []

    species_output = {
        "generatedFrom": [species_pdf.name] if species_pdf else [],
        "count": len(species_names),
        "species": [{"name": name} for name in species_names],
    }
    backgrounds_output = {
        "generatedFrom": [backgrounds_pdf.name] if backgrounds_pdf else [],
        "count": len(background_names),
        "backgrounds": [{"name": name} for name in background_names],
    }
    archetypes_output = {
        "generatedFrom": [archetypes_pdf.name] if archetypes_pdf else [],
        "count": len(archetype_entries),
        "archetypes": archetype_entries,
    }

    SPECIES_OUTPUT.write_text(json.dumps(species_output, indent=2), encoding="utf-8")
    BACKGROUNDS_OUTPUT.write_text(json.dumps(backgrounds_output, indent=2), encoding="utf-8")
    ARCHETYPES_OUTPUT.write_text(json.dumps(archetypes_output, indent=2), encoding="utf-8")

    source_map = build_source_map(all_pdfs)
    SOURCE_MAP_OUTPUT.write_text(json.dumps(source_map, indent=2), encoding="utf-8")

    print(f"Wrote {SPECIES_OUTPUT} ({species_output['count']} entries)")
    print(f"Wrote {BACKGROUNDS_OUTPUT} ({backgrounds_output['count']} entries)")
    print(f"Wrote {ARCHETYPES_OUTPUT} ({archetypes_output['count']} entries)")
    print(f"Wrote {SOURCE_MAP_OUTPUT}")


if __name__ == "__main__":
    main()
