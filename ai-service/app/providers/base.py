from typing import Protocol

from app.schemas.chat import Suggestions


class UsernameProvider(Protocol):
    async def suggest(self, interests: list[str]) -> Suggestions: ...
