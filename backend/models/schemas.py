"""Pydantic request/response schemas."""
from pydantic import BaseModel, Field


class ProcessVideosRequest(BaseModel):
    """Payload for /api/process-videos."""

    youtube_url: str = Field(..., min_length=1)
    instagram_url: str = Field(..., min_length=1)
    session_id: str = Field(..., min_length=1)


class ChatRequest(BaseModel):
    """Payload for /api/chat."""

    session_id: str = Field(..., min_length=1)
    message: str = Field(..., min_length=1)
