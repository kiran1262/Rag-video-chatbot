"""Video ingestion: extract metadata + transcript, embed, store in vector DB.

Best-effort extraction with graceful degradation so the endpoint never hard-fails:
if a transcript or metadata field is unavailable, sensible defaults are used.
"""
import os
import re
from typing import Dict, Optional

from services.embeddings import EmbeddingsService
from services.vector_store import VectorStoreService
from utils.logger import setup_logger

logger = setup_logger(__name__)

_YT_ID = re.compile(r"(?:v=|youtu\.be/|shorts/|embed/)([A-Za-z0-9_-]{11})")


def _engagement_rate(likes: int, comments: int, views: int) -> float:
    if not views:
        return 0.0
    return round((likes + comments) / views * 100, 2)


class VideoProcessor:
    """Process YouTube + Instagram videos into the vector store."""

    def __init__(self):
        # Kept light: services are created lazily so the server boots without keys.
        self._embeddings: Optional[EmbeddingsService] = None
        self._store: Optional[VectorStoreService] = None

    # ----- lazy services -------------------------------------------------
    @property
    def store(self) -> VectorStoreService:
        if self._store is None:
            self._store = VectorStoreService()
        return self._store

    @property
    def embeddings(self) -> EmbeddingsService:
        # Safe without a key — the OpenAI client is only built on embed calls.
        if self._embeddings is None:
            self._embeddings = EmbeddingsService(
                model_name=os.getenv("OPENAI_EMBEDDING_MODEL", "text-embedding-3-small")
            )
        return self._embeddings

    # ----- extraction ----------------------------------------------------
    @staticmethod
    def _ydl_info(url: str, platform: str = "") -> Dict:
        try:
            import yt_dlp

            opts = {"quiet": True, "skip_download": True, "no_warnings": True}
            # Instagram requires login; pass a Netscape cookies.txt if provided.
            cookies = os.getenv("INSTAGRAM_COOKIES_FILE")
            if platform == "instagram" and cookies and os.path.exists(cookies):
                opts["cookiefile"] = cookies
            with yt_dlp.YoutubeDL(opts) as ydl:
                return ydl.extract_info(url, download=False) or {}
        except Exception as e:  # noqa: BLE001
            logger.error(f"yt-dlp failed for {url}: {e}")
            return {}

    @staticmethod
    def _youtube_transcript(url: str) -> str:
        m = _YT_ID.search(url)
        if not m:
            return ""
        try:
            from youtube_transcript_api import YouTubeTranscriptApi

            segs = YouTubeTranscriptApi.get_transcript(m.group(1))
            return " ".join(s["text"] for s in segs)
        except Exception as e:  # noqa: BLE001
            logger.warning(f"No YouTube transcript for {url}: {e}")
            return ""

    def _build_video(self, url: str, platform: str) -> Dict:
        info = self._ydl_info(url, platform)
        views = int(info.get("view_count") or 0)
        likes = int(info.get("like_count") or 0)
        comments = int(info.get("comment_count") or 0)

        if platform == "youtube":
            transcript = self._youtube_transcript(url) or (info.get("description") or "")
        else:
            transcript = info.get("description") or ""

        return {
            "platform": platform,
            "title": info.get("title") or f"{platform.title()} video",
            "views": views,
            "likes": likes,
            "comments": comments,
            "creator": info.get("uploader") or info.get("channel") or "Unknown",
            "followers": int(info.get("channel_follower_count") or 0),
            "engagement_rate": _engagement_rate(likes, comments, views),
            "_transcript": transcript,
        }

    # ----- public --------------------------------------------------------
    def process_videos(
        self, youtube_url: str, instagram_url: str, session_id: str
    ) -> Dict:
        videos = {
            "youtube": self._build_video(youtube_url, "youtube"),
            "instagram": self._build_video(instagram_url, "instagram"),
        }
        has_key = bool(os.getenv("GEMINI_API_KEY") or os.getenv("OPENAI_API_KEY"))

        for key, video in videos.items():
            transcript = video.pop("_transcript", "")
            video_id = f"{session_id}:{key}"
            count = 0
            if transcript:
                # Chunking is offline; only embedding needs an API key.
                chunks = self.embeddings.chunk_transcript(transcript, video_id)
                count = len(chunks)

                if has_key and chunks:
                    try:
                        texts = [c for c, _ in chunks]
                        vectors = self.embeddings.embed_chunks(texts)
                        items = [
                            {
                                "id": f"{video_id}:{i}",
                                "values": vec,
                                "metadata": {
                                    "video_id": video_id,
                                    "session_id": session_id,
                                    "platform": key,
                                    "text": texts[i],
                                },
                            }
                            for i, vec in enumerate(vectors)
                        ]
                        self.store.upsert(items)
                    except Exception as e:  # noqa: BLE001
                        logger.error(f"Embedding/upsert failed for {video_id}: {e}")
                elif not has_key:
                    logger.warning("No GEMINI_API_KEY/OPENAI_API_KEY set — skipping embedding")
            video["transcript_chunks"] = count

        logger.info(f"Processed videos for session {session_id}")
        return {"status": "success", "session_id": session_id, "videos": videos}
