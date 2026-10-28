import json

from langchain_groq import ChatGroq

from app.core.config import Settings
from app.prompts.chat import SYSTEM_PROMPT
from app.schemas.chat import Suggestions
from app.utils.retries import retry_transient


class GroqProvider:
    def __init__(self, settings: Settings):
        model = ChatGroq(
            api_key=settings.groq_api_key,
            model=settings.groq_model,
            temperature=0.9,
            max_tokens=200,
            timeout=settings.groq_timeout_seconds,
            max_retries=0,
        )
        self.chain = model.with_structured_output(Suggestions, method="json_mode")

    async def suggest(self, interests: list[str]) -> Suggestions:
        messages = [
            ("system", SYSTEM_PROMPT),
            ("human", json.dumps({"interests": interests})),
        ]
        return await retry_transient(lambda: self.chain.ainvoke(messages))
