"""Step 3: split text into smaller overlapping chunks.

Why chunk? An embedding represents the meaning of a short passage well; a whole
document would blur many topics together. Why overlap? A fact that sits on a
chunk boundary would otherwise be cut in half.
"""
import re


def chunk_pages(pages: list[tuple[int, str]], size_words: int = 180, overlap_words: int = 40) -> list[dict]:
    if overlap_words >= size_words:
        raise ValueError("overlap must be smaller than chunk size")
    chunks = []
    step = size_words - overlap_words
    index = 0
    for page_no, text in pages:
        words = re.findall(r"\S+", text)
        if not words:
            continue
        start = 0
        while start < len(words):
            piece = words[start:start + size_words]
            chunks.append({"text": " ".join(piece), "page": page_no, "chunk_index": index})
            index += 1
            if start + size_words >= len(words):
                break
            start += step
    return chunks
