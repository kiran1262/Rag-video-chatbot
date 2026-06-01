"""FastAPI backend server."""
import os
import json
from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from models.schemas import ProcessVideosRequest, ChatRequest
from services.video_processor import VideoProcessor
from services.rag_chain import RAGChain
from utils.logger import setup_logger

# Load environment variables
load_dotenv()

# Setup logger
logger = setup_logger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="RAG Video Chatbot API",
    description="Analyze and compare social media videos using RAG",
    version="1.0.0",
)

# CORS middleware
origins = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://localhost:3001").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global instances
video_processor = VideoProcessor()
rag_chains = {}  # Store RAG chains by session_id


@app.get("/")
async def root():
    """Health check endpoint."""
    return {"status": "ok", "message": "RAG Video Chatbot API"}


@app.post("/api/process-videos")
async def process_videos(request: ProcessVideosRequest):
    """Process two video URLs and ingest into vector DB."""
    try:
        logger.info(f"Processing videos for session {request.session_id}")
        
        result = video_processor.process_videos(
            youtube_url=str(request.youtube_url),
            instagram_url=str(request.instagram_url),
            session_id=request.session_id,
        )
        
        # Initialize RAG chain for this session
        rag_chains[request.session_id] = RAGChain()
        
        return result
    except Exception as e:
        logger.error(f"Error processing videos: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/chat")
async def chat(request: ChatRequest):
    """Chat endpoint with streaming response."""
    try:
        logger.info(f"Chat request for session {request.session_id}: {request.message}")
        
        # Get or create RAG chain for session
        if request.session_id not in rag_chains:
            rag_chains[request.session_id] = RAGChain()
        
        rag_chain = rag_chains[request.session_id]
        
        # Generate response
        response = rag_chain.generate_response(request.message, request.session_id)
        
        return response
    except Exception as e:
        logger.error(f"Error in chat: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/chat/stream/{session_id}")
async def chat_stream(session_id: str, query: str):
    """Streaming chat endpoint (Server-Sent Events)."""
    try:
        logger.info(f"Stream chat for session {session_id}: {query}")
        
        if session_id not in rag_chains:
            rag_chains[session_id] = RAGChain()
        
        rag_chain = rag_chains[session_id]
        
        def generate():
            for chunk in rag_chain.stream_response(query):
                yield f"data: {json.dumps({'chunk': chunk})}\n\n"
        
        return StreamingResponse(generate(), media_type="text/event-stream")
    except Exception as e:
        logger.error(f"Error in stream: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/metrics/{session_id}")
async def get_metrics(session_id: str):
    """Get engagement metrics for a session."""
    try:
        if session_id not in rag_chains:
            raise HTTPException(status_code=404, detail="Session not found")
        
        # Return conversation history and metrics
        rag_chain = rag_chains[session_id]
        return {
            "session_id": session_id,
            "conversation_turns": len(rag_chain.conversation_history),
            "history": rag_chain.conversation_history[-10:],  # Last 10 messages
        }
    except Exception as e:
        logger.error(f"Error getting metrics: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/clear-session/{session_id}")
async def clear_session(session_id: str):
    """Clear session data."""
    try:
        if session_id in rag_chains:
            del rag_chains[session_id]
        return {"status": "ok", "message": f"Session {session_id} cleared"}
    except Exception as e:
        logger.error(f"Error clearing session: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app,
        host=os.getenv("HOST", "0.0.0.0"),
        port=int(os.getenv("PORT", "8000")),
        reload=os.getenv("ENVIRONMENT") == "development",
    )