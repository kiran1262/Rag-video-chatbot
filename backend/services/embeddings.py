"""Embedding and chunking service."""
import os
from typing import List, Tuple
from langchain_openai import OpenAIEmbeddings
from utils.transcript_parser import clean_transcript, split_into_sentences
from utils.logger import setup_logger

logger = setup_logger(__name__)

GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/openai/"


class EmbeddingsService:
    """Handle embeddings and chunking.

    Embeds via Gemini (primary) with an OpenAI fallback, both through the
    OpenAI-compatible API. The provider is locked to whichever first succeeds so
    document and query vectors always share the same dimension within a session.
    """

    def __init__(
        self,
        model_name: str = "text-embedding-3-small",
        chunk_size: int = 300,
        overlap: int = 50,
    ):
        self.model_name = model_name  # kept for backward-compat; per-provider models come from env
        self.chunk_size = chunk_size
        self.overlap = overlap
        self._candidates = None  # list of (name, OpenAIEmbeddings)
        self._idx = 0            # active provider index
        self._locked = False     # True once a provider has embedded successfully

    def _candidate_list(self):
        if self._candidates is None:
            cands = []
            gkey = os.getenv("GEMINI_API_KEY")
            if gkey:
                cands.append(("gemini", OpenAIEmbeddings(
                    model=os.getenv("GEMINI_EMBEDDING_MODEL", "gemini-embedding-001"),
                    api_key=gkey,
                    base_url=os.getenv("GEMINI_BASE_URL", GEMINI_BASE_URL),
                    check_embedding_ctx_length=False,  # skip tiktoken token-splitting (OpenAI-only)
                )))
            okey = os.getenv("OPENAI_API_KEY")
            if okey:
                cands.append(("openai", OpenAIEmbeddings(
                    model=os.getenv("OPENAI_EMBEDDING_MODEL", self.model_name),
                    api_key=okey,
                )))
            if not cands:
                raise RuntimeError("Set GEMINI_API_KEY or OPENAI_API_KEY for embeddings")
            self._candidates = cands
        return self._candidates

    def _run(self, fn_name: str, arg):
        cands = self._candidate_list()
        if self._locked:
            # Stay on the locked provider — switching would mix vector dimensions.
            return getattr(cands[self._idx][1], fn_name)(arg)
        last = None
        for i, (name, client) in enumerate(cands):
            try:
                result = getattr(client, fn_name)(arg)
                self._idx, self._locked = i, True
                logger.info(f"Embeddings provider: {name}" + (" (fallback)" if i else ""))
                return result
            except Exception as e:  # noqa: BLE001
                last = e
                logger.error(f"Embedding provider '{name}' failed: {e}")
        raise last

    def chunk_transcript(self, transcript: str, video_id: str) -> List[Tuple[str, dict]]:
        """Chunk transcript into semantically meaningful pieces."""
        transcript = clean_transcript(transcript)
        sentences = split_into_sentences(transcript)
        chunks = []
        current_chunk = []
        current_tokens = 0

        for sentence in sentences:
            sentence_tokens = len(sentence.split())
            if current_tokens + sentence_tokens > self.chunk_size and current_chunk:
                chunk_text = " ".join(current_chunk)
                chunks.append((chunk_text, {"video_id": video_id}))
                current_chunk = current_chunk[-int(self.overlap / 10):]
                current_tokens = sum(len(s.split()) for s in current_chunk)
            current_chunk.append(sentence)
            current_tokens += sentence_tokens

        if current_chunk:
            chunk_text = " ".join(current_chunk)
            chunks.append((chunk_text, {"video_id": video_id}))

        logger.info(f"Created {len(chunks)} chunks for {video_id}")
        return chunks

    def embed_chunks(self, chunks: List[str]) -> List[List[float]]:
        """Embed text chunks (Gemini primary, OpenAI fallback)."""
        embeddings = self._run("embed_documents", chunks)
        logger.info(f"Embedded {len(chunks)} chunks")
        return embeddings

    def embed_query(self, query: str) -> List[float]:
        """Embed a single query using the locked provider."""
        return self._run("embed_query", query)