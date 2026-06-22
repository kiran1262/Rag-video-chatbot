"""RAG chain using LangChain."""
import os
from typing import Dict, List
from langchain_openai import ChatOpenAI
from langchain.prompts import ChatPromptTemplate
from langchain.schema import HumanMessage, SystemMessage
from services.vector_store import VectorStoreService
from services.embeddings import EmbeddingsService
from utils.logger import setup_logger

logger = setup_logger(__name__)

GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/openai/"


def build_llm():
    """Gemini primary, OpenAI fallback (both via the OpenAI-compatible API)."""
    clients = []
    gkey = os.getenv("GEMINI_API_KEY")
    if gkey:
        clients.append(ChatOpenAI(
            model=os.getenv("GEMINI_LLM_MODEL", "gemini-2.5-flash"),
            api_key=gkey,
            base_url=os.getenv("GEMINI_BASE_URL", GEMINI_BASE_URL),
            temperature=0.7,
        ))
    okey = os.getenv("OPENAI_API_KEY")
    if okey:
        clients.append(ChatOpenAI(
            model=os.getenv("OPENAI_LLM_MODEL", "gpt-4o"),
            api_key=okey,
            temperature=0.7,
        ))
    if not clients:
        raise RuntimeError("Set GEMINI_API_KEY or OPENAI_API_KEY for chat")
    primary, *fallbacks = clients
    return primary.with_fallbacks(fallbacks) if fallbacks else primary


class RAGChain:
    """LangChain RAG chain for video comparison."""

    def __init__(self):
        self.llm = build_llm()
        self.vector_store = VectorStoreService()
        self.embeddings_service = EmbeddingsService()
        self.conversation_history = []
        self.video_stats = ""  # engagement metrics summary, injected into every prompt

    def set_stats(self, videos: Dict) -> None:
        """Store a metrics summary so the LLM can answer engagement questions."""
        lines = []
        for v in videos.values():
            lines.append(
                f'{v.get("platform", "?").title()} — "{v.get("title", "")}" by {v.get("creator", "Unknown")} '
                f'({v.get("followers", 0)} followers): {v.get("views", 0)} views, '
                f'{v.get("likes", 0)} likes, {v.get("comments", 0)} comments, '
                f'engagement rate {v.get("engagement_rate", 0)}%.'
            )
        self.video_stats = "\n".join(lines)

    def retrieve_context(self, query: str, top_k: int = 5, session_id: str = None) -> List[Dict]:
        """Retrieve relevant chunks from vector DB, scoped to this session."""
        try:
            query_embedding = self.embeddings_service.embed_query(query)
            results = self.vector_store.query(query_embedding, top_k=top_k, session_id=session_id)
            logger.info(f"Retrieved {len(results)} chunks for query")
            return results
        except Exception as e:
            logger.error(f"Error retrieving context: {str(e)}")
            return []

    def generate_response(self, query: str, session_id: str) -> Dict:
        """Generate response using LLM with retrieved context."""
        try:
            # Retrieve context
            context_results = self.retrieve_context(query, session_id=session_id)
            context_text = "\n".join(
                [f"[{result['metadata'].get('video_id', 'unknown')}] {result['metadata'].get('text', '')}" for result in context_results]
            )

            # Build prompt
            system_prompt = """You are a video content analyst.
Answer using the video stats and transcript context below. Cite the video (YouTube or Instagram) for each claim.
Be concise: 2-4 short sentences or a few bullets — no preamble, no generic frameworks.
A metric of 0 means it wasn't available (e.g. Instagram hides view/follower counts for anonymous access) — say that rather than claiming the value is truly zero.
If neither stats nor transcript answer the question, say so in ONE sentence. Do not pad."""

            user_message = f"""Question: {query}

Video stats:
{self.video_stats or "(none)"}

Transcript context:
{context_text if context_text else "(none retrieved)"}"""

            # Generate response
            messages = [
                SystemMessage(content=system_prompt),
                HumanMessage(content=user_message),
            ]

            response = self.llm.invoke(messages)
            response_text = response.content

            # Track conversation
            self.conversation_history.append({"role": "user", "content": query})
            self.conversation_history.append({"role": "assistant", "content": response_text})

            return {
                "response": response_text,
                "sources": [
                    {
                        "video_id": result["metadata"].get("video_id"),
                        "chunk_id": result["id"],
                        "text": result["metadata"].get("text", "")[:200],
                    }
                    for result in context_results
                ],
            }
        except Exception as e:
            logger.error(f"Error generating response: {str(e)}")
            return {
                "response": f"Error: {str(e)}",
                "sources": [],
            }

    def stream_response(self, query: str, session_id: str = None) -> str:
        """Generator for streaming responses."""
        try:
            context_results = self.retrieve_context(query, session_id=session_id)
            context_text = "\n".join(
                [f"[{result['metadata'].get('video_id', 'unknown')}] {result['metadata'].get('text', '')}" for result in context_results]
            )

            system_prompt = """You are a video content analyst.
Answer using the video stats and transcript context. Cite the video (YouTube or Instagram). Be concise: 2-4 sentences or a few bullets.
A metric of 0 means it wasn't available, not a true zero. If neither answers the question, say so in one sentence."""

            user_message = f"""Question: {query}

Video stats:
{self.video_stats or "(none)"}

Transcript context:
{context_text if context_text else "(none retrieved)"}"""

            messages = [
                SystemMessage(content=system_prompt),
                HumanMessage(content=user_message),
            ]

            # Stream response
            for chunk in self.llm.stream(messages):
                if hasattr(chunk, 'content'):
                    yield chunk.content
                    
        except Exception as e:
            logger.error(f"Error in stream_response: {str(e)}")
            yield f"Error: {str(e)}"