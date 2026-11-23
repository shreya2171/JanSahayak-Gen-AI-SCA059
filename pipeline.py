"""The complete RAG workflow in one place.

Indexing : PDF -> pages -> sanitise -> chunks -> embeddings -> ChromaDB
Answering: question -> embedding -> top-k search -> threshold check
           -> prompt -> Ollama LLM -> answer + sources
"""
import json
from pathlib import Path

from config import settings
from database.db import get_conn, rows
from rag import vector_store
from rag.chunker import chunk_pages
from rag.pdf_loader import extract_pages
from rag.sanitizer import sanitize
from services import i18n, llm
from services.prompts import build_messages


# ----------------------------- indexing -----------------------------
def index_pdf(path: Path, doc_id: int, display_name: str, source_url: str = "") -> dict:
    pages = extract_pages(path)
    if not pages:
        raise ValueError("No extractable text found. Scanned (image-only) PDFs are not supported in this version.")
    flagged = 0
    clean_pages = []
    for number, text in pages:
        clean, n = sanitize(text)
        flagged += n
        if clean:
            clean_pages.append((number, clean))
    chunks = chunk_pages(clean_pages, settings.CHUNK_WORDS, settings.CHUNK_OVERLAP_WORDS)
    stored = vector_store.add_chunks(f"doc-{doc_id}", display_name, chunks, source_url, kind="document")
    return {"pages": len(pages), "chunks": stored, "flagged_chunks": flagged}


def _scheme_text(s: dict) -> str:
    return (f"Scheme: {s['name']}. Category: {s['category']}. Description: {s['description']} "
            f"Benefits: {s['benefits']} Eligibility: {s['eligibility']} Documents required: {s['documents']} "
            f"How to apply: {s['application_process']} Official website: {s['official_website']}. "
            f"Verification status: {s.get('verification_status')}.")


def index_schemes() -> int:
    """Index the structured scheme records so the chatbot can answer from them too."""
    vector_store.delete_kind("scheme")
    with get_conn() as conn:
        schemes = rows(conn.execute("SELECT * FROM schemes"))
    total = 0
    for s in schemes:
        text, _ = sanitize(_scheme_text(s))
        chunks = chunk_pages([(0, text)], settings.CHUNK_WORDS, settings.CHUNK_OVERLAP_WORDS)
        total += vector_store.add_chunks(f"scheme-{s['id']}", s["name"], chunks, s.get("source_url") or "", kind="scheme")
    return total


# ----------------------------- answering -----------------------------
def retrieve(question: str) -> list[dict]:
    hits = vector_store.search(question, settings.TOP_K)
    return [h for h in hits if h["similarity"] >= settings.MIN_SIMILARITY]


def _source_view(h: dict) -> dict:
    return {"name": h["source_name"], "page": h["page"] if h.get("kind") == "document" else None,
            "kind": h.get("kind"), "url": h.get("source_url") or None,
            "similarity": h["similarity"], "excerpt": h["text"][:300]}


def answer_question(question: str, language: str) -> dict:
    hits = retrieve(question)
    if not hits:
        return {"answer": i18n.NOT_FOUND[language], "sources": [], "answered": False, "llm_used": False}
    sources = [_source_view(h) for h in hits]
    try:
        text = llm.chat(build_messages(question, hits, language))
    except llm.LLMUnavailable as exc:
        return {"answer": i18n.LLM_DOWN[language], "sources": sources, "answered": False,
                "llm_used": False, "error": str(exc)}
    if "INSUFFICIENT_INFORMATION" in text:
        return {"answer": i18n.NOT_FOUND[language], "sources": [], "answered": False, "llm_used": True}
    return {"answer": text, "sources": sources, "answered": True, "llm_used": True}
