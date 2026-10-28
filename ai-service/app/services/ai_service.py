import asyncio
import logging
from functools import lru_cache

from groq import APIError, NotFoundError
from langchain_core.exceptions import OutputParserException
from pydantic import ValidationError

from app.core.config import get_settings
from app.core.exceptions import AIServiceError
from app.providers.base import UsernameProvider
from app.providers.groq import GroqProvider
from app.schemas.chat import Suggestions

logger = logging.getLogger(__name__)


class AIService:
    def __init__(self, provider: UsernameProvider | None):
        self.provider = provider

    async def suggest_usernames(self, interests: list[str]) -> Suggestions:
        if self.provider is None:
            raise AIServiceError(
                503,
                "Username suggestions need a GROQ_API_KEY. You can still choose your own username.",
            )
        try:
            async with asyncio.timeout(19):
                result = await self.provider.suggest(interests)
            return Suggestions.model_validate(result)
        except NotFoundError as exc:
            logger.warning("Configured Groq model was not found or is inaccessible")
            raise AIServiceError(
                503,
                "The configured AI model is unavailable. Check GROQ_MODEL and your Groq model access.",
            ) from exc
        except (APIError, OutputParserException, ValidationError, ValueError, TimeoutError) as exc:
            logger.warning("Username provider failed: %s", type(exc).__name__)
            raise AIServiceError(
                502, "Username suggestions are unavailable. Please try again or choose your own."
            ) from exc


@lru_cache
def get_ai_service() -> AIService:
    settings = get_settings()
    if not settings.groq_api_key.get_secret_value().strip():
        return AIService(None)
    return AIService(GroqProvider(settings))
