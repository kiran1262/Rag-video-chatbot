"""Transcript cleaning and sentence splitting."""
import re

_WS = re.compile(r"\s+")
# Split after . ! ? followed by whitespace. Good enough without an NLP dependency.
_SENT = re.compile(r"(?<=[.!?])\s+")
# Bracketed cues like [Music], (applause)
_CUES = re.compile(r"[\[(][^\])]*[\])]")


def clean_transcript(text: str) -> str:
    """Normalize whitespace and strip caption cues."""
    if not text:
        return ""
    text = _CUES.sub(" ", text)
    text = _WS.sub(" ", text)
    return text.strip()


def split_into_sentences(text: str) -> list[str]:
    """Split cleaned text into sentences."""
    if not text:
        return []
    parts = _SENT.split(text)
    return [p.strip() for p in parts if p.strip()]
