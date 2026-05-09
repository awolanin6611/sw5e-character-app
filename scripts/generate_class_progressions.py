from __future__ import annotations

import json
import re
from pathlib import Path

import fitz


ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "data"
OUTPUT_PATH = DATA_DIR / "class-progressions.json"
ARCHETYPES_PATH = DATA_DIR / "archetypes-reference.json"

CLASS_NAMES = [
    "Berserker",
    "Consular",
    "Engineer",
    "Fighter",
    "Guardian",
    "Monk",
    "Operative",
    "Scholar",
    "Scout",
    "Sentinel",
]

DISPLAY_BY_UPPER = {name.upper(): name for name in CLASS_NAMES}
STOP_WORDS = {"Of", "The", "And", "Or", "To", "A"}
LEVEL_RE = re.compile(r"^(?:[1-9]|1[0-9]|20)(?:st|nd|rd|th)?$")
PB_RE = re.compile(r"^[+-]\d+$")
RESOURCE_RE = re.compile(r"^(?:[+-]\d+|\d+|—|Unlimited|At-will|(?:[1-9]|1[0-9]|20)(?:st|nd|rd|th))$")
DICE_RE = re.compile(r"^d(?:4|6|8|10|12)$", re.IGNORECASE)

CLASS_ARCHETYPE_HINTS = {
    "berserker": ["approach"],
    "consular": ["way", "tradition"],
    "engineer": ["engineering"],
    "fighter": ["specialist"],
    "guardian": ["form"],
    "monk": ["order"],
    "operative": ["practice"],
    "scholar": ["pursuit"],
    "scout": ["technique"],
    "sentinel": ["path"],
}


def find_handbook_pdf(data_dir: Path) -> Path:
    pdf_files = sorted(data_dir.glob("*.pdf"))
    if not pdf_files:
        raise FileNotFoundError(f"No PDF files found in {data_dir}")

    # Prefer files that look like the SW5e player's handbook.
    preferred = []
    for pdf_file in pdf_files:
        name = pdf_file.name.lower()
        if "handbook" in name and "player" in name:
            preferred.append(pdf_file)

    if preferred:
        return preferred[0]

    return pdf_files[0]


def smart_title(text: str) -> str:
    titled = text.title()
    words = titled.split()
    fixed = []
    for index, word in enumerate(words):
        if index and word in STOP_WORDS:
            fixed.append(word.lower())
        else:
            fixed.append(word)
    return " ".join(fixed)


def normalize_feature_key(text: str) -> str:
    return re.sub(r"[^a-z0-9]+", "", text.lower())


def normalize_level_label(text: str) -> str:
    match = re.match(r"^(\d+)", text)
    if not match:
        raise ValueError(f"Invalid level label: {text}")
    return match.group(1)


def is_resource_token(token: str) -> bool:
    return bool(RESOURCE_RE.match(token) or DICE_RE.match(token))


def cluster_row_words(words: list[tuple[float, float, str]]) -> list[list[tuple[float, str]]]:
    rows: list[dict] = []
    for x0, y0, word in sorted(words, key=lambda item: (item[1], item[0])):
        if not rows or abs(rows[-1]["y"] - y0) > 3:
            rows.append({"y": y0, "words": [(x0, word)]})
        else:
            rows[-1]["words"].append((x0, word))
    return [row["words"] for row in rows]


def clean_page_text(text: str) -> str:
    cleaned_lines = []
    for raw_line in text.splitlines():
        line = raw_line.strip()
        if not line:
            cleaned_lines.append("")
            continue
        if line.startswith("CHAPTER "):
            continue
        if line.isdigit():
            continue
        cleaned_lines.append(line)
    return "\n".join(cleaned_lines)


def get_outline_entries(doc: fitz.Document) -> list[tuple[int, str, int]]:
    return [(level, title.strip(), page) for level, title, page in doc.get_toc(simple=True)]


def build_class_sections(outline_entries: list[tuple[int, str, int]]) -> list[dict]:
    class_sections: list[dict] = []
    current_section: dict | None = None

    for level, title, page in outline_entries:
        upper_title = title.upper()
        if level == 2 and upper_title in DISPLAY_BY_UPPER:
            current_section = {
                "name": DISPLAY_BY_UPPER[upper_title],
                "startPage": page,
                "subclasses": [],
            }
            class_sections.append(current_section)
            continue

        if level == 3 and current_section is not None:
            current_section["subclasses"].append({
                "name": smart_title(title),
                "page": page,
            })

    for index, section in enumerate(class_sections):
        next_start = class_sections[index + 1]["startPage"] if index + 1 < len(class_sections) else None
        section["endPage"] = (next_start - 1) if next_start else None
        first_subclass_page = section["subclasses"][0]["page"] if section["subclasses"] else None
        section["baseEndPage"] = (first_subclass_page - 1) if first_subclass_page else section["endPage"]

    return class_sections


def extract_text_range(doc: fitz.Document, start_page: int, end_page: int | None) -> str:
    final_page = end_page or len(doc)
    parts = []
    for page_number in range(start_page, final_page + 1):
        page_text = doc.load_page(page_number - 1).get_text("text")
        parts.append(clean_page_text(page_text))
    return "\n".join(parts)


def parse_progression_table(doc: fitz.Document, table_page_number: int, class_name: str) -> dict[str, dict]:
    page = doc.load_page(table_page_number - 1)
    tables = page.find_tables().tables
    if not tables:
        raise ValueError(f"Could not locate progression table for {class_name}")

    primary_table = max(tables, key=lambda table: len(table.extract()))
    x0, y0, x1, y1 = primary_table.bbox
    words = []
    for word in page.get_text("words"):
        wx0, wy0, wx1, wy1, token, *_ = word
        if x0 - 30 <= wx0 <= x1 + 4 and y0 - 20 <= wy0 <= y1 + 4:
            words.append((wx0, wy0, token.strip()))

    rows = cluster_row_words(words)
    progression: dict[str, dict] = {}
    for row_words in rows:
        tokens = [token for _, token in sorted(row_words, key=lambda item: item[0]) if token]
        if len(tokens) < 3:
            continue
        if not LEVEL_RE.match(tokens[0]):
            continue

        level = normalize_level_label(tokens[0])

        if not PB_RE.match(tokens[1]):
            continue
        proficiency_bonus = tokens[1]

        feature_tokens = []
        for token in tokens[2:]:
            if feature_tokens and is_resource_token(token):
                break
            feature_tokens.append(token)

        feature_text = " ".join(feature_tokens).strip()
        if feature_text == "—":
            features = []
        else:
            features = [part.strip() for part in feature_text.split(",") if part.strip()]

        progression[level] = {
            "proficiencyBonus": proficiency_bonus,
            "features": features,
        }

    return progression


def is_feature_heading(line: str, next_line: str, class_name: str) -> bool:
    if not line or len(line) > 80:
        return False
    if line != line.upper():
        return False
    if next_line.lower().startswith(f"{class_name.lower()}:"):
        return True
    return False


def parse_feature_descriptions(text: str, class_name: str) -> dict[str, str]:
    lines = [line.strip() for line in text.splitlines()]
    descriptions: dict[str, str] = {}
    index = 0

    while index < len(lines) - 1:
        line = lines[index]
        next_line = lines[index + 1]
        if not is_feature_heading(line, next_line, class_name):
            index += 1
            continue

        feature_name = smart_title(line)
        description_lines = []
        index += 2
        while index < len(lines):
            current = lines[index]
            lookahead = lines[index + 1] if index + 1 < len(lines) else ""
            if is_feature_heading(current, lookahead, class_name):
                break
            if current:
                description_lines.append(current)
            index += 1

        description = " ".join(description_lines).strip()
        if description:
            descriptions[normalize_feature_key(feature_name)] = description

    return descriptions


def build_output() -> dict:
    handbook_pdf = find_handbook_pdf(DATA_DIR)
    doc = fitz.open(handbook_pdf)
    outline_entries = get_outline_entries(doc)
    sections = build_class_sections(outline_entries)

    classes = {}
    for section in sections:
        class_name = section["name"]
        class_key = class_name.lower()
        class_text = extract_text_range(doc, section["startPage"], section["baseEndPage"])
        progression = parse_progression_table(doc, section["startPage"] + 1, class_name)
        feature_descriptions = parse_feature_descriptions(class_text, class_name)

        classes[class_key] = {
            "name": class_name,
            "startPage": section["startPage"],
            "endPage": section["endPage"],
            "baseEndPage": section["baseEndPage"],
            "subclasses": section["subclasses"],
            "progression": progression,
            "featureDescriptions": feature_descriptions,
        }

    augment_subclasses_with_expanded_archetypes(classes)

    return {
        "generatedFrom": [handbook_pdf.name],
        "classes": classes,
    }


def infer_class_key_for_archetype(name: str) -> str | None:
    normalized = str(name or "").strip().lower()
    if not normalized:
        return None

    for class_key, hints in CLASS_ARCHETYPE_HINTS.items():
        for hint in hints:
            if re.search(rf"\b{re.escape(hint)}\b", normalized):
                return class_key

    return None


def augment_subclasses_with_expanded_archetypes(classes: dict) -> None:
    if not ARCHETYPES_PATH.exists():
        return

    try:
        raw = json.loads(ARCHETYPES_PATH.read_text(encoding="utf-8"))
    except Exception:
        return

    archetype_entries = raw.get("archetypes", []) if isinstance(raw, dict) else []
    if not isinstance(archetype_entries, list):
        return

    by_class: dict[str, list[dict]] = {key: [] for key in classes.keys()}
    for archetype in archetype_entries:
        name = str((archetype or {}).get("name", "")).strip()
        if not name:
            continue

        class_key = infer_class_key_for_archetype(name)
        if not class_key or class_key not in by_class:
            continue

        source_pages = (archetype or {}).get("sourcePages", [])
        page = source_pages[0] if isinstance(source_pages, list) and source_pages else None
        if page is None:
            continue

        by_class[class_key].append({"name": name, "page": page})

    for class_key, additions in by_class.items():
        if not additions:
            continue

        existing = classes[class_key].get("subclasses", [])
        seen = {str(item.get("name", "")).strip().lower() for item in existing}
        for entry in additions:
            normalized_name = str(entry.get("name", "")).strip().lower()
            if normalized_name in seen:
                continue
            existing.append(entry)
            seen.add(normalized_name)

        existing.sort(key=lambda item: str(item.get("name", "")))
        classes[class_key]["subclasses"] = existing


def main() -> None:
    output = build_output()
    OUTPUT_PATH.write_text(json.dumps(output, indent=2), encoding="utf-8")
    print(f"Wrote {OUTPUT_PATH}")
    for class_key, class_data in output["classes"].items():
        print(f"{class_key}: {len(class_data['progression'])} levels, {len(class_data['featureDescriptions'])} features")


if __name__ == "__main__":
    main()