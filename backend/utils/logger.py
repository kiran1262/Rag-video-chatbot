"""Logging setup."""
import logging
import os
import sys

_LEVEL = os.getenv("LOG_LEVEL", "INFO").upper()


def setup_logger(name: str) -> logging.Logger:
    """Return a configured logger; idempotent per name."""
    logger = logging.getLogger(name)
    if logger.handlers:
        return logger

    logger.setLevel(getattr(logging, _LEVEL, logging.INFO))
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(
        logging.Formatter("%(asctime)s - %(name)s - %(levelname)s - %(message)s")
    )
    logger.addHandler(handler)
    logger.propagate = False
    return logger
