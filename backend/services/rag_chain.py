"""RAG chain using LangChain."""
import os
from typing import Dict, List
from langchain_openai import ChatOpenAI
from langchain.prompts import ChatPromptTemplate
from langchain.schema import HumanMessage, AIMessage
from services.vector_store import VectorStoreService
from services.embeddings import EmbeddingsService
from utils.logger import setup_logger

logger = setup_logger(__name__)


class RAGChain:
    """LangChain RAG chain for video comparison."""

    def __init__(self):
        self.llm = ChatOpenAI(
            model="gpt-4o",
            api_key=os.getenv("OPENAI_API_KEY"),
            temperature=0.7,
        )
        self.vector_store = VectorStoreService()
        self.embeddings_service = EmbeddingsService()
        self.conversation_history = []

    def retrieve_context(self, query: str, top_k: int = 5) -> List[Dict]:
        """Retrieve relevant chunks from vector DB."""
        try:
            query_embedding = self.embeddings_service.embed_query(query)
            results = self.vector_store.query(query_embedding, top_k=top_k)
            logger.info(f"Retrieved {len(results)} chunks for query")
            return results
        except Exception as e:
            logger.error(f"Error retrieving context: {str(e)}")
            return []

    def generate_response(self, query: str, session_id: str) -> Dict:
        """Generate response using LLM with retrieved context."""
        try:
            # Retrieve context
            context_results = self.retrieve_context(query)
            context_text = "\n".join(
                [f"[{result['metadata'].get('video_id', 'unknown')}] {result['metadata'].get('text', '')}" for result in context_results]
            )

            # Build prompt
            system_prompt = """You are an expert video content analyst. 
Analyze the provided video transcripts and help creators understand engagement and improve their content.
Always cite which video (YouTube or Instagram) your insights come from.
Provide actionable, specific feedback based on the video content."""

            user_message = f"""
Query: {query}

Context from videos:
{context_text if context_text else "No specific context found. Provide general guidance."}

Please provide a detailed, specific response analyzing the videos."""

            # Generate response
            messages = [
                HumanMessage(content=system_prompt),
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

    def stream_response(self, query: str) -> str:
        """Generator for streaming responses."""
        try:
            context_results = self.retrieve_context(query)
            context_text = "\n".join(
                [f"[{result['metadata'].get('video_id', 'unknown')}] {result['metadata'].get('text', '')}" for result in context_results]
            )

            system_prompt = """You are an expert video content analyst.
Analyze the provided video transcripts and help creators understand engagement and improve their content."""

            user_message = f"""Query: {query}

Context from videos:
{context_text if context_text else "No specific context found."}"""

            messages = [
                HumanMessage(content=system_prompt),
                HumanMessage(content=user_message),
            ]

            # Stream response
            for chunk in self.llm.stream(messages):
                if hasattr(chunk, 'content'):
                    yield chunk.content
                    
        except Exception as e:
            logger.error(f"Error in stream_response: {str(e)}")
            yield f"Error: {str(e)}"