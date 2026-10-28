import asyncio
from collections.abc import Awaitable, Callable
from typing import TypeVar

from groq import APIConnectionError, APITimeoutError, InternalServerError, RateLimitError

T = TypeVar("T")


async def retry_transient(operation: Callable[[], Awaitable[T]]) -> T:
    """Retry a transient provider failure once; never retry bad input or parsing."""
    try:
        return await operation()
    except (APIConnectionError, APITimeoutError, InternalServerError, RateLimitError):
        await asyncio.sleep(0.5)
        return await operation()
