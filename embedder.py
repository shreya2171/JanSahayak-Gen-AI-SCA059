"""Step 4/6: turn text into embedding vectors.

Default: Sentence Transformers (a real semantic model, multilingual so that
Hindi / Kannada questions can match English text).

Fallback ("hashing"): a tiny deterministic bag-of-words embedder with NO
semantic understanding. It exists only so that automated tests can run on a
machine without internet access. Do not use it for the real application.
"""
import hashlib
import math
import re
from functools import lru_cache

from config import settings

DIM_HASH = 384


class HashingEmbedder:
    name = "hashing-test-fallback"

    def encode(self, texts: list[str]) -> list[list[float]]:
        out = []
        for t in texts:
            vec = [0.0] * DIM_HASH
            for tok in re.findall(r"\w+", t.lower()):
                if len(tok) < 3:
                    continue
                h = int(hashlib.md5(tok.encode()).hexdigest(), 16)
                vec[h % DIM_HASH] += 1.0
            norm = math.sqrt(sum(v * v for v in vec)) or 1.0
            out.append([v / norm for v in vec])
        return out


class SentenceTransformerEmbedder:
    def __init__(self, model_name: str):
        from sentence_transformers import SentenceTransformer  # imported lazily: heavy
        self.name = model_name
        self.model = SentenceTransformer(model_name)

    def encode(self, texts: list[str]) -> list[list[float]]:
        return self.model.encode(texts, normalize_embeddings=True, show_progress_bar=False).tolist()


@lru_cache(maxsize=1)
def get_embedder():
    if settings.EMBEDDING_BACKEND == "hashing":
        return HashingEmbedder()
    return SentenceTransformerEmbedder(settings.EMBEDDING_MODEL)
