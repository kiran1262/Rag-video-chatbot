"""Embedding and chunking service."""
import os
from typing import List, Tuple
from langchain_openai import OpenAIEmbeddings
from utils.transcript_parser import clean_transcript, split_into_sentences
from utils.logger import setup_logger

logger = setup_logger(__name__)


class EmbeddingsService:
    """Handle embeddings and chunking."""

    def __init__(
        self,
        model_name: str = "text-embedding-3-small",
        chunk_size: int = 300,
        overlap: int = 50,
    ):
        self.model_name = model_name
        self.chunk_size = chunk_size
        self.overlap = overlap
        self.embeddings = OpenAIEmbeddings(
            model=model_name,
            api_key=os.getenv("OPENAI_API_KEY"),
        )
        logger.info(f"Initialized EmbeddingsService with {model_name}")

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
        """Embed text chunks using OpenAI embeddings."""
        try:
            embeddings = self.embeddings.embed_documents(chunks)
            logger.info(f"Embedded {len(chunks)} chunks")
            return embeddings
        except Exception as e:
            logger.error(f"Error embedding: {str(e)}")
            raise

    def embed_query(self, query: str) -> List[float]:
        """Embed a single query."""
        try:
            embedding = self.embeddings.embed_query(query)
            return embedding
        except Exception as e:
            logger.error(f"Error embedding query: {str(e)}")
            raise