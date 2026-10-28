from typing import Annotated

from fastapi import APIRouter, Depends

from app.schemas.chat import Interests, Suggestions
from app.services.ai_service import AIService, get_ai_service

router = APIRouter(tags=["Username suggestions"])


@router.post(
    "/api/suggest-username",
    response_model=Suggestions,
    responses={
        422: {"description": "Malformed interests"},
        502: {"description": "Groq unavailable or invalid output"},
        503: {"description": "Groq API key not configured"},
    },
)
async def suggest_username(body: Interests, service: Annotated[AIService, Depends(get_ai_service)]):
    """Generate three creative usernames. Suggestions are not reserved or guaranteed available."""
    return await service.suggest_usernames(body.interests)
