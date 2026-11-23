"""Step 5/7: store embeddings in ChromaDB and run semantic (nearest-neighbour) search."""
import chromadb

from config import settings
from rag.embedder import get_embedder

COLLECTION = "jansahayak_knowledge"
_client = None


def _collection():
    global _client
    if _client is None:
        settings.CHROMA_DIR.mkdir(parents=True, exist_ok=True)
        _client = chromadb.PersistentClient(path=str(settings.CHROMA_DIR))
    # cosine distance -> similarity = 1 - distance
    return _client.get_or_create_collection(COLLECTION, metadata={"hnsw:space": "cosine"})


def reset_client() -> None:
    """Used by tests to point at a fresh directory."""
    global _client
    _client = None


def add_chunks(source_id: str, source_name: str, chunks: list[dict], source_url: str = "", kind: str = "document") -> int:
    if not chunks:
        return 0
    col = _collection()
    embeddings = get_embedder().encode([c["text"] for c in chunks])
    col.upsert(
        ids=[f"{source_id}:{c['chunk_index']}" for c in chunks],
        documents=[c["text"] for c in chunks],
        embeddings=embeddings,
        metadatas=[{"source_id": source_id, "source_name": source_name, "page": c["page"],
                    "chunk_index": c["chunk_index"], "source_url": source_url, "kind": kind} for c in chunks],
    )
    return len(chunks)


def delete_source(source_id: str) -> None:
    _collection().delete(where={"source_id": source_id})


def delete_kind(kind: str) -> None:
    _collection().delete(where={"kind": kind})


def count() -> int:
    return _collection().count()


def search(question: str, k: int) -> list[dict]:
    col = _collection()
    if col.count() == 0:
        return []
    q_vec = get_embedder().encode([question])
    res = col.query(query_embeddings=q_vec, n_results=min(k, col.count()))
    hits = []
    for text, meta, dist in zip(res["documents"][0], res["metadatas"][0], res["distances"][0]):
        hits.append({"text": text, "similarity": round(1.0 - float(dist), 4), **meta})
    return hits
