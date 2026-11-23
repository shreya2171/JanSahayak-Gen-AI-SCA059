from fastapi import APIRouter, Depends

from database.db import get_conn, rows
from routes.auth import _profile
from routes.schemes import categories
from services.recommend import recommend
from services.security import get_current_user

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("")
def dashboard(user: dict = Depends(get_current_user)):
    with get_conn() as conn:
        total = conn.execute("SELECT COUNT(*) FROM schemes").fetchone()[0]
        schemes = rows(conn.execute("SELECT * FROM schemes"))
        recent = rows(conn.execute("SELECT id, name, category FROM schemes ORDER BY id DESC LIMIT 5"))
        viewed = rows(conn.execute("""SELECT s.id, s.name, s.category FROM recent_views v JOIN schemes s ON s.id=v.scheme_id
                                      WHERE v.user_id=? ORDER BY v.viewed_at DESC LIMIT 5""", (user["id"],)))
    recs = recommend(_profile(user["id"]), schemes, limit=4)
    return {"total_schemes": total, "categories": categories(), "recently_added": recent,
            "recommended": [{"id": r["id"], "name": r["name"], "category": r["category"], "reason": r["reason"]} for r in recs],
            "recently_viewed": viewed}
