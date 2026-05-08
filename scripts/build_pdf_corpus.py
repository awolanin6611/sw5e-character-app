from __future__ import annotations

import json
import re
from pathlib import Path

import fitz


ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "data"
CORPUS_PATH = DATA_DIR / "pdf-corpus.jsonl"
MANIFEST_PATH = DATA_DIR / "pdf-corpus-manifest.json"


def normalize_whitespace(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()


def iter_pdf_files(data_dir: Path) -> list[Path]:
    return sorted(data_dir.glob("*.pdf"))


def extract_page_text(doc: fitz.Document, page_index: int) -> str:
    page = doc.load_page(page_index)
    return normalize_whitespace(page.get_text("text"))


def build_corpus() -> tuple[list[str], dict]:
    records: list[str] = []
    manifest_entries: list[dict] = []
    record_id = 1

    for pdf_path in iter_pdf_files(DATA_DIR):
        doc = fitz.open(pdf_path)
        try:
            page_count = len(doc)
            non_empty_pages = 0

            for page_idx in range(page_count):
                text = extract_page_text(doc, page_idx)
                if not text:
                    continue

                non_empty_pages += 1
                record = {
                    "id": record_id,
                    "fileName": pdf_path.name,
                    "relativePath": str(pdf_path.relative_to(ROOT)).replace("\\", "/"),
                    "page": page_idx + 1,
                    "text": text,
                }
                records.append(json.dumps(record, ensure_ascii=False))
                record_id += 1

            manifest_entries.append(
                {
                    "fileName": pdf_path.name,
                    "relativePath": str(pdf_path.relative_to(ROOT)).replace("\\", "/"),
                    "pageCount": page_count,
                    "nonEmptyPages": non_empty_pages,
                }
            )
        finally:
            doc.close()

    manifest = {
        "sourceDir": str(DATA_DIR.relative_to(ROOT)).replace("\\", "/"),
        "pdfCount": len(manifest_entries),
        "recordCount": len(records),
        "files": manifest_entries,
    }

    return records, manifest


def main() -> None:
    records, manifest = build_corpus()

    CORPUS_PATH.write_text("\n".join(records) + ("\n" if records else ""), encoding="utf-8")
    MANIFEST_PATH.write_text(json.dumps(manifest, indent=2), encoding="utf-8")

    print(f"Wrote corpus records to {CORPUS_PATH}")
    print(f"Wrote corpus manifest to {MANIFEST_PATH}")
    print(f"Indexed {manifest['pdfCount']} PDF file(s), {manifest['recordCount']} non-empty page record(s)")


if __name__ == "__main__":
    main()
