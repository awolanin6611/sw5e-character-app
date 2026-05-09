from __future__ import annotations

import json
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "data"
ARCHETYPES_PATH = DATA_DIR / "archetypes-reference.json"
CORPUS_PATH = DATA_DIR / "pdf-corpus.jsonl"
OUTPUT_PATH = DATA_DIR / "archetype-casting-overrides.json"
CURATION_PATH = DATA_DIR / "archetype-casting-curation.json"

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

FORCE_PATTERNS = [
    re.compile(r"forcecasting", re.IGNORECASE),
    re.compile(r"learn(?:ed|s)?\s+\w+\s+force power", re.IGNORECASE),
    re.compile(r"learn(?:ed|s)?\s+one\s+force\s+power", re.IGNORECASE),
    re.compile(r"force powers known", re.IGNORECASE),
]

TECH_PATTERNS = [
    re.compile(r"techcasting", re.IGNORECASE),
    re.compile(r"learn(?:ed|s)?\s+\w+\s+tech power", re.IGNORECASE),
    re.compile(r"learn(?:ed|s)?\s+one\s+tech\s+power", re.IGNORECASE),
    re.compile(r"tech powers known", re.IGNORECASE),
]


def infer_class_key_for_archetype(name: str) -> str | None:
    normalized = str(name or "").strip().lower()
    if not normalized:
        return None

    for class_key, hints in CLASS_ARCHETYPE_HINTS.items():
        for hint in hints:
            if re.search(rf"\b{re.escape(hint)}\b", normalized):
                return class_key

    return None


def load_archetypes() -> list[dict]:
    if not ARCHETYPES_PATH.exists():
        return []
    raw = json.loads(ARCHETYPES_PATH.read_text(encoding="utf-8"))
    entries = raw.get("archetypes", []) if isinstance(raw, dict) else []
    return entries if isinstance(entries, list) else []


def load_corpus_records() -> list[dict]:
    if not CORPUS_PATH.exists():
        return []

    records: list[dict] = []
    for line in CORPUS_PATH.read_text(encoding="utf-8").splitlines():
        stripped = line.strip()
        if not stripped:
            continue
        try:
            parsed = json.loads(stripped)
            if isinstance(parsed, dict):
                records.append(parsed)
        except json.JSONDecodeError:
            continue

    return records


def load_curation() -> dict:
    if not CURATION_PATH.exists():
        return {"allow": {"force": [], "tech": []}, "deny": {"force": [], "tech": []}}

    try:
        raw = json.loads(CURATION_PATH.read_text(encoding="utf-8"))
    except Exception:
        return {"allow": {"force": [], "tech": []}, "deny": {"force": [], "tech": []}}

    return {
        "allow": {
            "force": raw.get("allow", {}).get("force", []) if isinstance(raw.get("allow"), dict) else [],
            "tech": raw.get("allow", {}).get("tech", []) if isinstance(raw.get("allow"), dict) else [],
        },
        "deny": {
            "force": raw.get("deny", {}).get("force", []) if isinstance(raw.get("deny"), dict) else [],
            "tech": raw.get("deny", {}).get("tech", []) if isinstance(raw.get("deny"), dict) else [],
        },
    }


def row_key(row: dict) -> str:
    class_key = str(row.get("classKey", "")).strip().lower()
    archetype_name = str(row.get("archetypeName", "")).strip().lower()
    return f"{class_key}::{archetype_name}"


def curation_matches_row(rule: dict, row: dict) -> bool:
    rule_class = str(rule.get("classKey", "")).strip().lower()
    row_class = str(row.get("classKey", "")).strip().lower()
    if rule_class and rule_class != row_class:
        return False

    tokens = [str(token or "").strip().lower() for token in (rule.get("archetypeIncludes") or []) if str(token or "").strip()]
    if not tokens:
        return bool(rule_class)

    row_name = str(row.get("archetypeName", "")).strip().lower()
    row_includes = [str(token or "").strip().lower() for token in (row.get("archetypeIncludes") or [])]
    row_blob = " ".join([row_name] + row_includes)
    return any(token in row_blob for token in tokens)


def normalize_manual_row(rule: dict, casting_type: str) -> dict | None:
    class_key = str(rule.get("classKey", "")).strip().lower()
    archetype_name = str(rule.get("archetypeName", "")).strip()
    if not class_key or not archetype_name:
        return None

    includes = rule.get("archetypeIncludes")
    if isinstance(includes, list) and includes:
        archetype_includes = [str(item).strip().lower() for item in includes if str(item).strip()]
    else:
        archetype_includes = [archetype_name.lower()]

    reason = str(rule.get("reason", "")).strip() or "manual curation"
    return {
        "classKey": class_key,
        "archetypeIncludes": archetype_includes,
        "archetypeName": archetype_name,
        "evidence": [
            {
                "fileName": CURATION_PATH.name,
                "page": 0,
                "snippet": f"{casting_type} allow: {reason}",
            }
        ],
        "source": "manual",
    }


def find_evidence_for_archetype(name: str, corpus: list[dict]) -> tuple[bool, bool, list[dict]]:
    normalized_name = str(name or "").strip().lower()
    if not normalized_name:
        return False, False, []

    candidates = []
    for record in corpus:
        text = str(record.get("text", ""))
        lower_text = text.lower()
        if normalized_name in lower_text:
            candidates.append(record)

    if not candidates:
        return False, False, []

    force_hit = False
    tech_hit = False
    evidence: list[dict] = []

    for record in candidates[:12]:
        text = str(record.get("text", ""))
        has_force = any(pattern.search(text) for pattern in FORCE_PATTERNS)
        has_tech = any(pattern.search(text) for pattern in TECH_PATTERNS)

        if not has_force and not has_tech:
            continue

        force_hit = force_hit or has_force
        tech_hit = tech_hit or has_tech
        evidence.append(
            {
                "fileName": record.get("fileName", ""),
                "page": record.get("page", 0),
                "snippet": text[:240],
            }
        )

    return force_hit, tech_hit, evidence


def build_overrides() -> dict:
    archetypes = load_archetypes()
    corpus = load_corpus_records()
    curation = load_curation()

    force_rows = []
    tech_rows = []

    for archetype in archetypes:
        name = str((archetype or {}).get("name", "")).strip()
        if not name:
            continue

        class_key = infer_class_key_for_archetype(name)
        if not class_key:
            continue

        has_force, has_tech, evidence = find_evidence_for_archetype(name, corpus)
        if not has_force and not has_tech:
            continue

        row = {
            "classKey": class_key,
            "archetypeIncludes": [name.lower()],
            "archetypeName": name,
            "evidence": evidence,
        }

        if has_force:
            force_rows.append(row)
        if has_tech:
            tech_rows.append(row)

    auto_rows = {
        "force": force_rows,
        "tech": tech_rows,
    }

    curated_rows: dict[str, list[dict]] = {"force": [], "tech": []}
    applied_curation = {
        "allow": {"force": 0, "tech": 0},
        "deny": {"force": 0, "tech": 0},
    }

    for casting_type in ("force", "tech"):
        rows_by_key = {row_key(row): row for row in auto_rows[casting_type]}

        for deny_rule in curation.get("deny", {}).get(casting_type, []):
            deny_matches = [key for key, row in rows_by_key.items() if curation_matches_row(deny_rule, row)]
            for key in deny_matches:
                rows_by_key.pop(key, None)
            if deny_matches:
                applied_curation["deny"][casting_type] += len(deny_matches)

        for allow_rule in curation.get("allow", {}).get(casting_type, []):
            manual_row = normalize_manual_row(allow_rule, casting_type)
            if manual_row is None:
                continue
            rows_by_key[row_key(manual_row)] = manual_row
            applied_curation["allow"][casting_type] += 1

        curated_rows[casting_type] = sorted(
            rows_by_key.values(),
            key=lambda item: (item["classKey"], item["archetypeName"]),
        )

    return {
        "generatedFrom": [ARCHETYPES_PATH.name, CORPUS_PATH.name, CURATION_PATH.name],
        "appliedCuration": applied_curation,
        "overrides": {
            "force": curated_rows["force"],
            "tech": curated_rows["tech"],
        },
    }


def main() -> None:
    output = build_overrides()
    OUTPUT_PATH.write_text(json.dumps(output, indent=2), encoding="utf-8")
    print(f"Wrote {OUTPUT_PATH}")
    print(f"Force overrides: {len(output['overrides']['force'])}")
    print(f"Tech overrides: {len(output['overrides']['tech'])}")


if __name__ == "__main__":
    main()
