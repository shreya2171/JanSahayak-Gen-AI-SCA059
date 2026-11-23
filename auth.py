import sqlite3
from fastapi import APIRouter, Depends, HTTPException, status

from database.db import get_conn, now, rows
from models.schemas import LoginIn, ProfileIn, RegisterIn
from services.security import create_token, get_current_user, hash_password, verify_password

router = APIRouter(prefix="/api/auth", tags=["auth"])

PROFILE_FIELDS = ["age_group", "state", "occupation", "category", "income_range", "gender"]


@router.post("/register", status_code=201)
def register(body: RegisterIn):
    email = body.email.lower()
    try:
        with get_conn() as conn:
            cur = conn.execute(
                "INSERT INTO users (name, email, password_hash, role, language, created_at) VALUES (?,?,?,?,?,?)",
                (body.name, email, hash_password(body.password), "user", body.language, now()))
            user_id = cur.lastrowid
            conn.execute("INSERT INTO profiles (user_id) VALUES (?)", (user_id,))
    except sqlite3.IntegrityError:
        raise HTTPException(status.HTTP_409_CONFLICT, "An account with this email already exists.")
    return {"token": create_token(user_id, "user"),
            "user": {"id": user_id, "name": body.name, "email": email, "role": "user", "language": body.language}}


@router.post("/login")
def login(body: LoginIn):
    with get_conn() as conn:
        row = conn.execute("SELECT * FROM users WHERE email = ?", (body.email.lower(),)).fetchone()
    # same message for unknown email and wrong password (does not reveal which accounts exist)
    if row is None or not verify_password(body.password, row["password_hash"]):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Incorrect email or password.")
    return {"token": create_token(row["id"], row["role"]),
            "user": {"id": row["id"], "name": row["name"], "email": row["email"], "role": row["role"], "language": row["language"]}}


def _profile(user_id: int) -> dict:
    with get_conn() as conn:
        row = conn.execute("SELECT * FROM profiles WHERE user_id = ?", (user_id,)).fetchone()
    return {k: (dict(row).get(k) if row else None) for k in PROFILE_FIELDS}


@router.get("/me")
def me(user: dict = Depends(get_current_user)):
    return {"user": user, "profile": _profile(user["id"])}


@router.put("/me")
def update_me(body: ProfileIn, user: dict = Depends(get_current_user)):
    data = body.model_dump(exclude_unset=True)
    with get_conn() as conn:
        if "name" in data and data["name"]:
            conn.execute("UPDATE users SET name=? WHERE id=?", (data["name"], user["id"]))
        if "language" in data and data["language"]:
            conn.execute("UPDATE users SET language=? WHERE id=?", (data["language"], user["id"]))
        prof = {k: data[k] for k in PROFILE_FIELDS if k in data}
        if prof:
            conn.execute("INSERT OR IGNORE INTO profiles (user_id) VALUES (?)", (user["id"],))
            sets = ", ".join(f"{k}=?" for k in prof)
            conn.execute(f"UPDATE profiles SET {sets} WHERE user_id=?", [*prof.values(), user["id"]])
    return me(get_current_user_refresh(user["id"]))


def get_current_user_refresh(user_id: int) -> dict:
    with get_conn() as conn:
        row = conn.execute("SELECT id, name, email, role, language FROM users WHERE id=?", (user_id,)).fetchone()
    return dict(row)
