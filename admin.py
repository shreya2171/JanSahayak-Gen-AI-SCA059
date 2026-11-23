"""Administrator-only routes: scheme CRUD and PDF document management."""
import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile

from config import settings
from database.db import get_conn, now, rows
from models.schemas import SchemeIn
from rag import pipeline, vector_store
from services.security import require_admin

router = APIRouter(prefix="/api/admin", tags=["admin"])

SCHEME_COLS = ["name", "category", "target_group", "min_age", "max_age", "income_max_lakh", "state", "gender",
               "description", "benefits", "eligibility", "documents", "application_process", "official_website",
               "source_url", "last_verified", "verification_status", "verification_notes"]


def _reindex_schemes_safely():
    try:
        pipeline.index_schemes()
    except Exception:  # embedding model may be unavailable; scheme CRUD must still work
        pass


@router.post("/schemes", status_code=201)
def add_scheme(body: SchemeIn, _: dict = Depends(require_admin)):
    d = body.model_dump()
    with get_conn() as conn:
        cur = conn.execute(f"INSERT INTO schemes ({','.join(SCHEME_COLS)}, created_at) VALUES ({','.join('?' * len(SCHEME_COLS))}, ?)",
                           [d[c] for c in SCHEME_COLS] + [now()])
    _reindex_schemes_safely()
    return {"id": cur.lastrowid}


@router.put("/schemes/{scheme_id}")
def edit_scheme(scheme_id: int, body: SchemeIn, _: dict = Depends(require_admin)):
    d = body.model_dump()
    with get_conn() as conn:
        cur = conn.execute(f"UPDATE schemes SET {', '.join(c + '=?' for c in SCHEME_COLS)} WHERE id=?",
                           [d[c] for c in SCHEME_COLS] + [scheme_id])
        if cur.rowcount == 0:
            raise HTTPException(404, "Scheme not found.")
    _reindex_schemes_safely()
    return {"ok": True}


@router.delete("/schemes/{scheme_id}")
def delete_scheme(scheme_id: int, _: dict = Depends(require_admin)):
    with get_conn() as conn:
        cur = conn.execute("DELETE FROM schemes WHERE id=?", (scheme_id,))
        if cur.rowcount == 0:
            raise HTTPException(404, "Scheme not found.")
    _reindex_schemes_safely()
    return {"ok": True}


@router.post("/documents", status_code=201)
async def upload_document(file: UploadFile = File(...), source_url: str = Form(""), scheme_id: int | None = Form(None),
                          admin: dict = Depends(require_admin)):
    # --- secure upload validation ---
    original = Path(file.filename or "").name
    if not original.lower().endswith(".pdf"):
        raise HTTPException(400, "Only .pdf files are accepted.")
    data = await file.read(settings.MAX_UPLOAD_MB * 1024 * 1024 + 1)
    if len(data) > settings.MAX_UPLOAD_MB * 1024 * 1024:
        raise HTTPException(413, f"File is larger than {settings.MAX_UPLOAD_MB} MB.")
    if not data.startswith(b"%PDF-"):
        raise HTTPException(400, "File content is not a valid PDF.")
    if source_url and not source_url.startswith(("http://", "https://")):
        raise HTTPException(400, "Source URL must start with http:// or https://")

    settings.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    stored = f"{uuid.uuid4().hex}.pdf"          # random name: user-supplied name never touches the file system
    path = settings.UPLOAD_DIR / stored
    path.write_bytes(data)

    with get_conn() as conn:
        cur = conn.execute("INSERT INTO documents (filename, stored_name, uploaded_by, scheme_id, source_url, status, uploaded_at) VALUES (?,?,?,?,?,?,?)",
                           (original, stored, admin["id"], scheme_id, source_url or None, "processing", now()))
        doc_id = cur.lastrowid
    try:
        info = pipeline.index_pdf(path, doc_id, original, source_url)
    except Exception as exc:
        path.unlink(missing_ok=True)
        with get_conn() as conn:
            conn.execute("DELETE FROM documents WHERE id=?", (doc_id,))
        raise HTTPException(422, f"Could not process this PDF: {exc}")
    with get_conn() as conn:
        conn.execute("UPDATE documents SET pages=?, chunks=?, flagged_chunks=?, status='indexed' WHERE id=?",
                     (info["pages"], info["chunks"], info["flagged_chunks"], doc_id))
    return {"id": doc_id, "filename": original, **info}


@router.get("/documents")
def list_documents(_: dict = Depends(require_admin)):
    with get_conn() as conn:
        return rows(conn.execute("SELECT id, filename, source_url, pages, chunks, flagged_chunks, status, uploaded_at FROM documents ORDER BY id DESC"))


@router.delete("/documents/{doc_id}")
def delete_document(doc_id: int, _: dict = Depends(require_admin)):
    with get_conn() as conn:
        row = conn.execute("SELECT stored_name FROM documents WHERE id=?", (doc_id,)).fetchone()
        if row is None:
            raise HTTPException(404, "Document not found.")
        conn.execute("DELETE FROM documents WHERE id=?", (doc_id,))
    vector_store.delete_source(f"doc-{doc_id}")
    (settings.UPLOAD_DIR / row["stored_name"]).unlink(missing_ok=True)
    return {"ok": True}


@router.post("/reindex")
def reindex(_: dict = Depends(require_admin)):
    return {"scheme_chunks_indexed": pipeline.index_schemes()}
