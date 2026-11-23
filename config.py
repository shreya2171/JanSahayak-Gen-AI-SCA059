"""Central configuration. Every setting is read from environment variables
(see .env.example). Nothing secret is hard-coded in the source code."""
import os
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent
ROOT_DIR = BASE_DIR.parent

# Load backend/.env first, then the project-root .env (first one found wins)
load_dotenv(BASE_DIR / ".env")
load_dotenv(ROOT_DIR / ".env")


def _get(name: str, default: str | None = None) -> str | None:
    value = os.getenv(name)
    return value if value not in (None, "") else default


class Settings:
    # --- security ---
    SECRET_KEY = _get("SECRET_KEY")
    JWT_ALGORITHM = "HS256"
    ACCESS_TOKEN_MINUTES = int(_get("ACCESS_TOKEN_MINUTES", "120"))
    ADMIN_EMAIL = _get("ADMIN_EMAIL")          # first administrator, created at start-up
    ADMIN_PASSWORD = _get("ADMIN_PASSWORD")
    CORS_ORIGINS = [o.strip() for o in _get("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173").split(",")]

    # --- storage ---
    DATA_DIR = Path(_get("DATA_DIR", str(ROOT_DIR / "data")))
    DATABASE_PATH = Path(_get("DATABASE_PATH", str(DATA_DIR / "jansahayak.db")))
    UPLOAD_DIR = Path(_get("UPLOAD_DIR", str(DATA_DIR / "uploads")))
    CHROMA_DIR = Path(_get("CHROMA_DIR", str(DATA_DIR / "chroma")))
    SCHEMES_JSON = Path(_get("SCHEMES_JSON", str(DATA_DIR / "schemes.json")))
    MAX_UPLOAD_MB = int(_get("MAX_UPLOAD_MB", "10"))

    # --- LLM (Ollama) ---
    OLLAMA_URL = _get("OLLAMA_URL", "http://localhost:11434")
    OLLAMA_MODEL = _get("OLLAMA_MODEL", "llama3.2")
    LLM_TEMPERATURE = float(_get("LLM_TEMPERATURE", "0.2"))
    LLM_TIMEOUT_SECONDS = int(_get("LLM_TIMEOUT_SECONDS", "120"))

    # --- RAG ---
    # "sentence-transformers" (default, real semantic model) or "hashing"
    # (small offline fallback used by automated tests only).
    EMBEDDING_BACKEND = _get("EMBEDDING_BACKEND", "sentence-transformers")
    EMBEDDING_MODEL = _get("EMBEDDING_MODEL", "paraphrase-multilingual-MiniLM-L12-v2")
    CHUNK_WORDS = int(_get("CHUNK_WORDS", "180"))
    CHUNK_OVERLAP_WORDS = int(_get("CHUNK_OVERLAP_WORDS", "40"))
    TOP_K = int(_get("TOP_K", "4"))
    MIN_SIMILARITY = float(_get("MIN_SIMILARITY", "0.30"))

    def validate(self) -> None:
        if not self.SECRET_KEY or len(self.SECRET_KEY) < 16:
            raise RuntimeError(
                "SECRET_KEY is missing or too short. Copy .env.example to backend/.env and set "
                "SECRET_KEY to a long random value (see README, 'Environment configuration')."
            )


settings = Settings()
