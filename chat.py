import json

from fastapi import APIRouter, Depends

from database.db import get_conn, now, rows
from models.schemas import ChatIn
from rag import pipeline
from services import i18n, llm
from services.security import get_current_user

router = APIRouter(prefix="/api/chat", tags=["chat"])


@router.post("")
def ask(body: ChatIn, user: dict = Depends(get_current_user)):
    result = pipeline.answer_question(body.question, body.language)
    with get_conn() as conn:
        conn.execute("INSERT INTO chat_messages (user_id, role, content, language, created_at) VALUES (?,?,?,?,?)",
                     (user["id"], "user", body.question, body.language, now()))
        cur = conn.execute(
            "INSERT INTO chat_messages (user_id, role, content, sources, language, answered, created_at) VALUES (?,?,?,?,?,?,?)",
            (user["id"], "assistant", result["answer"], json.dumps(result["sources"]), body.language,
             1 if result["answered"] else 0, now()))
    return {**result, "message_id": cur.lastrowid, "disclaimer": i18n.DISCLAIMER[body.language]}


@router.get("/history")
def history(user: dict = Depends(get_current_user)):
    with get_conn() as conn:
        data = rows(conn.execute("SELECT * FROM chat_messages WHERE user_id=? ORDER BY id DESC LIMIT 100", (user["id"],)))
    for m in data:
        m["sources"] = json.loads(m["sources"]) if m["sources"] else []
    return list(reversed(data))


@router.delete("/history")
def clear_history(user: dict = Depends(get_current_user)):
    with get_conn() as conn:
        conn.execute("DELETE FROM chat_messages WHERE user_id=?", (user["id"],))
    return {"ok": True}


@router.get("/status")
def status():
    """Lets the frontend show whether the LLM is reachable."""
    from rag import vector_store
    return {"llm_available": llm.is_available(), "model": __import__("config").settings.OLLAMA_MODEL,
            "indexed_chunks": vector_store.count()}
