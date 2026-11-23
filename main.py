"""JanSahayak AI - FastAPI application entry point.

Run from the backend folder:   uvicorn main:app --reload --port 8000
"""
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from database import db

log = logging.getLogger("jansahayak")


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings.validate()
    db.init_db()
    seeded = db.seed_schemes()
    db.ensure_admin()
    if seeded:
        log.info("Seeded %s starter schemes", seeded)
    try:                                        # index scheme records for the chatbot
        from rag import pipeline, vector_store
        if vector_store.count() == 0:
            pipeline.index_schemes()
    except Exception as exc:                    # e.g. embedding model not downloaded yet
        log.warning("Scheme indexing skipped: %s", exc)
    yield


app = FastAPI(title="JanSahayak AI API", version="1.0.0", lifespan=lifespan,
              description="Informational assistant for Indian government schemes. Not an official eligibility decision system.")

app.add_middleware(CORSMiddleware, allow_origins=settings.CORS_ORIGINS, allow_credentials=True,
                   allow_methods=["*"], allow_headers=["*"])

from routes import admin, auth, chat, dashboard, feedback, schemes  # noqa: E402

for r in (auth.router, schemes.router, chat.router, feedback.router, dashboard.router, admin.router):
    app.include_router(r)


@app.get("/api/health")
def health():
    return {"status": "ok"}
