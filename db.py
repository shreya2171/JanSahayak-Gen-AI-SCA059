"""SQLite database layer.

SQLite was chosen because it needs no separate server, is a single file, ships
with Python, and is more than enough for a single-machine academic prototype.
We use the standard-library sqlite3 module with parameterised queries (which
prevents SQL injection) instead of an ORM, to keep the code easy to follow.
"""
import json
import sqlite3
from contextlib import contextmanager
from datetime import datetime, timezone

from config import settings

SCHEMA = """
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user',
    language TEXT NOT NULL DEFAULT 'en',
    created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS profiles (
    user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    age_group TEXT, state TEXT, occupation TEXT, category TEXT,
    income_range TEXT, gender TEXT, notes TEXT
);
CREATE TABLE IF NOT EXISTS schemes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT UNIQUE,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    target_group TEXT, min_age INTEGER, max_age INTEGER, income_max_lakh REAL,
    state TEXT, gender TEXT DEFAULT 'any',
    description TEXT, benefits TEXT, eligibility TEXT, documents TEXT,
    application_process TEXT, official_website TEXT, source_url TEXT,
    last_verified TEXT, verification_status TEXT DEFAULT 'unverified',
    verification_notes TEXT,
    created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename TEXT NOT NULL,
    stored_name TEXT NOT NULL,
    uploaded_by INTEGER REFERENCES users(id),
    scheme_id INTEGER REFERENCES schemes(id) ON DELETE SET NULL,
    source_url TEXT,
    pages INTEGER DEFAULT 0,
    chunks INTEGER DEFAULT 0,
    flagged_chunks INTEGER DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'indexed',
    uploaded_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS chat_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    sources TEXT,
    language TEXT,
    answered INTEGER DEFAULT 1,
    created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS feedback (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message_id INTEGER REFERENCES chat_messages(id) ON DELETE SET NULL,
    scheme_id INTEGER REFERENCES schemes(id) ON DELETE SET NULL,
    kind TEXT NOT NULL,            -- 'rating' or 'report'
    rating INTEGER,
    comment TEXT,
    status TEXT NOT NULL DEFAULT 'open',
    created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS recent_views (
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    scheme_id INTEGER NOT NULL REFERENCES schemes(id) ON DELETE CASCADE,
    viewed_at TEXT NOT NULL,
    PRIMARY KEY (user_id, scheme_id)
);
"""


def now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


@contextmanager
def get_conn():
    settings.DATABASE_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(settings.DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def rows(cursor) -> list[dict]:
    return [dict(r) for r in cursor.fetchall()]


def init_db() -> None:
    with get_conn() as conn:
        conn.executescript(SCHEMA)


def seed_schemes() -> int:
    """Insert the starter schemes from data/schemes.json if the table is empty."""
    path = settings.SCHEMES_JSON
    if not path.exists():
        return 0
    with get_conn() as conn:
        if conn.execute("SELECT COUNT(*) FROM schemes").fetchone()[0] > 0:
            return 0
        data = json.loads(path.read_text(encoding="utf-8"))
        cols = ["slug", "name", "category", "target_group", "min_age", "max_age", "income_max_lakh", "state",
                "gender", "description", "benefits", "eligibility", "documents", "application_process",
                "official_website", "source_url", "last_verified", "verification_status", "verification_notes"]
        for s in data["schemes"]:
            conn.execute(
                f"INSERT INTO schemes ({','.join(cols)}, created_at) VALUES ({','.join('?' * len(cols))}, ?)",
                [s.get(c) for c in cols] + [now()],
            )
        return len(data["schemes"])


def ensure_admin() -> None:
    """Create the first administrator from ADMIN_EMAIL / ADMIN_PASSWORD (environment variables)."""
    from services.security import hash_password
    if not (settings.ADMIN_EMAIL and settings.ADMIN_PASSWORD):
        return
    with get_conn() as conn:
        exists = conn.execute("SELECT id FROM users WHERE email = ?", (settings.ADMIN_EMAIL.lower(),)).fetchone()
        if not exists:
            conn.execute(
                "INSERT INTO users (name, email, password_hash, role, created_at) VALUES (?,?,?,?,?)",
                ("Administrator", settings.ADMIN_EMAIL.lower(), hash_password(settings.ADMIN_PASSWORD), "admin", now()),
            )
