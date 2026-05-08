from __future__ import annotations

import json
import re
from pathlib import Path

import fitz


ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "data"
OUTPUT_PATH = DATA_DIR / "pdf-sources-index.json"
MAX_PREVIEW_CHARS = 1200


def normalize_whitespace(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()


def extract_outline(doc: fitz.Document) -> list[dict]:
    return [
        {"level": level, "title": title.strip(), "page": page}
        for level, title, page in doc.get_toc(simple=True)
    ]


def extract_preview(doc: fitz.Document) -> str:
    parts: list[str] = []
    page_count = min(3, len(doc))
    for i in range(page_count):
        page_text = doc.load_page(i).get_text("text")
        cleaned = normalize_whitespace(page_text)
        if cleaned:
            parts.append(cleaned)
        if sum(len(part) for part in parts) >= MAX_PREVIEW_CHARS:
            break

    joined = " ".join(parts)
    return joined[:MAX_PREVIEW_CHARS]


def summarize_pdf(pdf_path: Path) -> dict:
    doc = fitz.open(pdf_path)
    try:
        metadata = doc.metadata or {}
        return {
            "fileName": pdf_path.name,
            "relativePath": str(pdf_path.relative_to(ROOT)).replace("\\", "/"),
            "pageCount": len(doc),
            "title": (metadata.get("title") or "").strip(),
            "author": (metadata.get("author") or "").strip(),
            "subject": (metadata.get("subject") or "").strip(),
            "keywords": (metadata.get("keywords") or "").strip(),
            "outline": extract_outline(doc),
            "previewText": extract_preview(doc),
        }
    finally:
        doc.close()


def build_pdf_index(data_dir: Path) -> dict:
    pdf_files = sorted(data_dir.glob("*.pdf"))
    entries = [summarize_pdf(pdf_path) for pdf_path in pdf_files]

    return {
        "generatedFrom": [str(data_dir.relative_to(ROOT)).replace("\\", "/")],
        "pdfCount": len(entries),
        "pdfs": entries,
    }


def main() -> None:
    output = build_pdf_index(DATA_DIR)
    OUTPUT_PATH.write_text(json.dumps(output, indent=2), encoding="utf-8")
    print(f"Indexed {output['pdfCount']} PDF file(s) into {OUTPUT_PATH}")
    for pdf in output["pdfs"]:
        print(f"- {pdf['fileName']} ({pdf['pageCount']} pages)")


if __name__ == "__main__":
    main()
