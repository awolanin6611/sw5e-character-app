#!/usr/bin/env python3
"""
Extract lightsaber and blaster builder rules from modular system PDFs.
Reads the two equipment-specific PDFs and extracts builder schemas.
"""

import json
import os
import sys
from pathlib import Path

try:
    import pdfplumber
except ImportError:
    print("ERROR: pdfplumber not installed. Installing...")
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "pdfplumber"])
    import pdfplumber

# Paths
REPO_ROOT = Path(__file__).parent.parent
DATA_DIR = REPO_ROOT / "data"
LIGHTSABER_PDF = DATA_DIR / "lightsaber_modular_system_full_player_v3 (2).pdf"
BLASTER_PDF = DATA_DIR / "blaster_modular_system_complete (1).pdf"

def extract_text_from_pdf(pdf_path, max_pages=None):
    """Extract all text from PDF for analysis."""
    if not pdf_path.exists():
        print(f"ERROR: PDF not found: {pdf_path}")
        return None
    
    text_content = []
    with pdfplumber.open(pdf_path) as pdf:
        pages = pdf.pages if max_pages is None else pdf.pages[:max_pages]
        for i, page in enumerate(pages, 1):
            text = page.extract_text()
            if text:
                text_content.append({"page": i, "text": text})
    return text_content

def analyze_lightsaber_pdf():
    """Extract lightsaber builder structure from PDF."""
    print("=" * 60)
    print("LIGHTSABER BUILDER EXTRACTION")
    print("=" * 60)
    
    content = extract_text_from_pdf(LIGHTSABER_PDF)
    if not content:
        return None
    
    print(f"Total pages: {len(content)}")
    print("\n[FULL PDF CONTENT - First 50 pages]:\n")
    
    for page_info in content[:50]:
        print(f"\n--- PAGE {page_info['page']} ---")
        print(page_info['text'][:500])  # First 500 chars per page
        if len(page_info['text']) > 500:
            print(f"... [truncated - total {len(page_info['text'])} chars]")
    
    return content

def analyze_blaster_pdf():
    """Extract blaster builder structure from PDF."""
    print("\n" + "=" * 60)
    print("BLASTER BUILDER EXTRACTION")
    print("=" * 60)
    
    content = extract_text_from_pdf(BLASTER_PDF)
    if not content:
        return None
    
    print(f"Total pages: {len(content)}")
    print("\n[FULL PDF CONTENT - First 50 pages]:\n")
    
    for page_info in content[:50]:
        print(f"\n--- PAGE {page_info['page']} ---")
        print(page_info['text'][:500])  # First 500 chars per page
        if len(page_info['text']) > 500:
            print(f"... [truncated - total {len(page_info['text'])} chars]")
    
    return content

if __name__ == "__main__":
    print("Extracting equipment builder rules from modular system PDFs...\n")
    
    light_content = analyze_lightsaber_pdf()
    blaster_content = analyze_blaster_pdf()
    
    # Save raw extractions for review
    if light_content or blaster_content:
        extraction_data = {
            "lightsaber": light_content,
            "blaster": blaster_content,
            "extraction_date": str(Path.cwd())
        }
        output_path = DATA_DIR / "equipment_pdf_extraction.json"
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(extraction_data, f, indent=2, ensure_ascii=False)
        print(f"\n\nFull extraction saved to: {output_path}")
