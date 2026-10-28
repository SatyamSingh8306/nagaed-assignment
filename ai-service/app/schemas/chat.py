from typing import Annotated

from pydantic import BaseModel, ConfigDict, Field, StringConstraints, field_validator

Interest = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=50)]
Username = Annotated[str, StringConstraints(pattern=r"^[A-Za-z0-9_]{3,30}$")]


class Interests(BaseModel):
    model_config = ConfigDict(extra="forbid")
    interests: list[Interest] = Field(
        min_length=1, max_length=10, description="One to ten interests, each up to 50 characters"
    )


class Suggestions(BaseModel):
    suggestions: list[Username] = Field(min_length=3, max_length=3)

    @field_validator("suggestions")
    @classmethod
    def unique(cls, values):
        if len({v.lower() for v in values}) != 3:
            raise ValueError("Three unique usernames are required")
        return values
