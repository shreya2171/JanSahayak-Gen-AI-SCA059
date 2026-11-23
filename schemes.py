from fastapi import APIRouter, Depends, HTTPException, Query

from database.db import get_conn, now, rows
from services.recommend import recommend
from services.security import get_current_user, get_optional_user
from routes.auth import _profile

router = APIRouter(prefix="/api/schemes", tags=["schemes"])

CATEGORIES = ["Education and Scholarships", "Agriculture and Farmers", "Women Empowerment", "Healthcare", "Housing",
              "Employment", "Entrepreneurship", "Senior Citizens", "Social Welfare"]


@router.get("/categories")
def categories():
    with get_conn() as conn:
        counts = {r["category"]: r["n"] for r in conn.execute("SELECT category, COUNT(*) n FROM schemes GROUP BY category")}
    names = list(CATEGORIES) + [c for c in counts if c not in CATEGORIES]
    return [{"name": n, "count": counts.get(n, 0)} for n in names]


@router.get("")
def list_schemes(q: str = Query("", max_length=100), category: str = Query("", max_length=80)):
    sql, args = "SELECT * FROM schemes WHERE 1=1", []
    if q.strip():
        like = f"%{q.strip()}%"
        sql += " AND (name LIKE ? OR description LIKE ? OR benefits LIKE ? OR eligibility LIKE ?)"
        args += [like] * 4
    if category:
        sql += " AND category = ?"
        args.append(category)
    with get_conn() as conn:
        return rows(conn.execute(sql + " ORDER BY name", args))


@router.get("/recommendations")
def recommendations(user: dict = Depends(get_current_user)):
    with get_conn() as conn:
        schemes = rows(conn.execute("SELECT * FROM schemes"))
    profile = _profile(user["id"])
    filled = [k for k, v in profile.items() if v]
    return {"profile_complete": bool(filled),
            "disclaimer": "These are suggestions only. Eligibility is not guaranteed and must be confirmed with the official authority.",
            "results": recommend(profile, schemes)}


@router.get("/compare")
def compare(ids: str = Query(..., description="comma separated scheme ids, 2 to 4")):
    try:
        id_list = [int(i) for i in ids.split(",") if i.strip()]
    except ValueError:
        raise HTTPException(400, "ids must be numbers separated by commas.")
    if not 2 <= len(id_list) <= 4:
        raise HTTPException(400, "Select between 2 and 4 schemes to compare.")
    with get_conn() as conn:
        found = rows(conn.execute(f"SELECT * FROM schemes WHERE id IN ({','.join('?' * len(id_list))})", id_list))
    if len(found) != len(set(id_list)):
        raise HTTPException(404, "One or more schemes were not found.")
    return found


@router.get("/{scheme_id}")
def get_scheme(scheme_id: int, user: dict | None = Depends(get_optional_user)):
    with get_conn() as conn:
        row = conn.execute("SELECT * FROM schemes WHERE id = ?", (scheme_id,)).fetchone()
        if row is None:
            raise HTTPException(404, "Scheme not found.")
        if user:
            conn.execute("INSERT OR REPLACE INTO recent_views (user_id, scheme_id, viewed_at) VALUES (?,?,?)",
                         (user["id"], scheme_id, now()))
    return dict(row)
