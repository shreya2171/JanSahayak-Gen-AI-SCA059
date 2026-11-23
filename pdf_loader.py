"""Step 2 of the RAG workflow: extract text from a PDF, page by page.

Page numbers are kept so that every answer can say *which page* it came from.
"""
from pathlib import Path
from pypdf import PdfReader


def extract_pages(path: Path) -> list[tuple[int, str]]:
    """Return [(page_number, text), ...] with page numbers starting at 1."""
    reader = PdfReader(str(path))
    pages = []
    for number, page in enumerate(reader.pages, start=1):
        text = (page.extract_text() or "").strip()
        if text:
            pages.append((number, text))
    return pages
