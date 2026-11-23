from fastapi import APIRouter, Depends, HTTPException

from database.db import get_conn, now, rows
from models.schemas import FeedbackIn, FeedbackStatusIn
from services.security import get_current_user, require_admin

router = APIRouter(prefix="/api/feedback", tags=["feedback"])


@router.post("", status_code=201)
def submit(body: FeedbackIn, user: dict = Depends(get_current_user)):
    if body.kind == "rating" and body.rating is None:
        raise HTTPException(422, "A rating from 1 to 5 is required.")
    if body.kind == "report" and not body.comment:
        raise HTTPException(422, "Please describe what is incorrect or outdated.")
    with get_conn() as conn:
        if body.message_id is not None:
            owner = conn.execute("SELECT user_id FROM chat_messages WHERE id=?", (body.message_id,)).fetchone()
            if owner is None or owner["user_id"] != user["id"]:
                raise HTTPException(404, "Message not found.")
        if body.scheme_id is not None and conn.execute("SELECT id FROM schemes WHERE id=?", (body.scheme_id,)).fetchone() is None:
            raise HTTPException(404, "Scheme not found.")
        cur = conn.execute(
            "INSERT INTO feedback (user_id, message_id, scheme_id, kind, rating, comment, created_at) VALUES (?,?,?,?,?,?,?)",
            (user["id"], body.message_id, body.scheme_id, body.kind, body.rating, body.comment, now()))
    return {"id": cur.lastrowid}


@router.get("")
def list_feedback(_: dict = Depends(require_admin)):
    with get_conn() as conn:
        return rows(conn.execute("""
            SELECT f.*, u.email AS user_email, s.name AS scheme_name
            FROM feedback f JOIN users u ON u.id=f.user_id LEFT JOIN schemes s ON s.id=f.scheme_id
            ORDER BY f.id DESC LIMIT 500"""))


@router.patch("/{feedback_id}")
def set_status(feedback_id: int, body: FeedbackStatusIn, _: dict = Depends(require_admin)):
    with get_conn() as conn:
        cur = conn.execute("UPDATE feedback SET status=? WHERE id=?", (body.status, feedback_id))
        if cur.rowcount == 0:
            raise HTTPException(404, "Feedback not found.")
    return {"ok": True}
