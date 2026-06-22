"""Vector store service.

Uses Pinecone when PINECONE_API_KEY is set; otherwise falls back to a simple
in-memory cosine-similarity store so the app runs locally with no external infra.
"""
import os
from typing import Dict, List

import numpy as np

from utils.logger import setup_logger

logger = setup_logger(__name__)

# OpenAI text-embedding-3-small=1536; Gemini gemini-embedding-001=3072. Override for Pinecone.
EMBED_DIM = int(os.getenv("EMBED_DIM", "1536"))

# Shared across all instances so the processor's upserts are visible to RAG queries
# (the in-memory store has no external backing like Pinecone).
_MEM_STORE: List[Dict] = []


class VectorStoreService:
    """Thin wrapper over Pinecone with an in-memory fallback."""

    def __init__(self):
        self.index_name = os.getenv("PINECONE_INDEX_NAME", "video-chunks")
        self.api_key = os.getenv("PINECONE_API_KEY")
        self.region = os.getenv("PINECONE_ENVIRONMENT", "us-east-1")
        self._index = None
        self._mem: List[Dict] = _MEM_STORE  # shared in-memory fallback: {id, values, metadata}

        if self.api_key:
            try:
                self._init_pinecone()
            except Exception as e:  # noqa: BLE001
                logger.error(f"Pinecone init failed, using in-memory store: {e}")
                self._index = None
        else:
            logger.warning("PINECONE_API_KEY not set — using in-memory vector store")

    def _init_pinecone(self):
        from pinecone import Pinecone, ServerlessSpec

        pc = Pinecone(api_key=self.api_key)
        existing = {i["name"] for i in pc.list_indexes()}
        if self.index_name not in existing:
            logger.info(f"Creating Pinecone index '{self.index_name}'")
            pc.create_index(
                name=self.index_name,
                dimension=EMBED_DIM,
                metric="cosine",
                spec=ServerlessSpec(cloud="aws", region=self.region),
            )
        self._index = pc.Index(self.index_name)
        logger.info(f"Connected to Pinecone index '{self.index_name}'")

    def upsert(self, items: List[Dict]) -> None:
        """Upsert vectors. Each item: {id, values, metadata}."""
        if not items:
            return
        if self._index is not None:
            self._index.upsert(vectors=items)
        else:
            ids = {i["id"] for i in items}
            self._mem[:] = [m for m in self._mem if m["id"] not in ids]  # in-place to keep shared ref
            self._mem.extend(items)
        logger.info(f"Upserted {len(items)} vectors")

    def query(self, query_embedding: List[float], top_k: int = 5, session_id: str = None) -> List[Dict]:
        """Return top_k matches as {id, score, metadata}, scoped to session_id if given."""
        if self._index is not None:
            flt = {"session_id": session_id} if session_id else None
            res = self._index.query(
                vector=query_embedding, top_k=top_k, include_metadata=True, filter=flt
            )
            return [
                {"id": m["id"], "score": m["score"], "metadata": m.get("metadata", {})}
                for m in res.get("matches", [])
            ]

        # in-memory: filter to this session's vectors (video_id is "<session_id>:<platform>")
        prefix = f"{session_id}:" if session_id else None
        pool = [m for m in self._mem
                if not prefix or str(m.get("metadata", {}).get("video_id", "")).startswith(prefix)]
        if not pool:
            return []
        q = np.asarray(query_embedding, dtype=np.float32)
        qn = np.linalg.norm(q) or 1.0
        scored = []
        for item in pool:
            v = np.asarray(item["values"], dtype=np.float32)
            vn = np.linalg.norm(v) or 1.0
            scored.append((float(np.dot(q, v) / (qn * vn)), item))
        scored.sort(key=lambda x: x[0], reverse=True)
        return [
            {"id": item["id"], "score": s, "metadata": item.get("metadata", {})}
            for s, item in scored[:top_k]
        ]
