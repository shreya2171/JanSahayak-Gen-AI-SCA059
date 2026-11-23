"""Password hashing, JWT creation and the FastAPI dependencies that protect routes."""
from datetime import datetime, timedelta, timezone

import bcrypt
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from config import settings
from database.db import get_conn

bearer = HTTPBearer(auto_error=False)


def hash_password(password: str) -> str:
    # bcrypt adds a random salt automatically; only the hash is stored.
    return bcrypt.hashpw(password.encode("utf-8")[:72], bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode("utf-8")[:72], hashed.encode("utf-8"))
    except ValueError:
        return False


def create_token(user_id: int, role: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_MINUTES)
    return jwt.encode({"sub": str(user_id), "role": role, "exp": expire}, settings.SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def _load_user(credentials: HTTPAuthorizationCredentials | None):
    if credentials is None:
        return None
    try:
        payload = jwt.decode(credentials.credentials, settings.SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        user_id = int(payload["sub"])
    except (jwt.PyJWTError, KeyError, ValueError):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid or expired token. Please log in again.")
    with get_conn() as conn:
        row = conn.execute("SELECT id, name, email, role, language FROM users WHERE id = ?", (user_id,)).fetchone()
    if row is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "User no longer exists.")
    return dict(row)


def get_current_user(credentials: HTTPAuthorizationCredentials | None = Depends(bearer)) -> dict:
    user = _load_user(credentials)
    if user is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Authentication required.")
    return user


def get_optional_user(credentials: HTTPAuthorizationCredentials | None = Depends(bearer)) -> dict | None:
    return _load_user(credentials)


def require_admin(user: dict = Depends(get_current_user)) -> dict:
    # Role is re-read from the database on every request, not trusted from the token.
    if user["role"] != "admin":
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Administrator access required.")
    return user
