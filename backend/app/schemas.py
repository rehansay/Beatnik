from typing import Any

from pydantic import BaseModel, ConfigDict, Field, field_validator


class TrackInput(BaseModel):
    model_config = ConfigDict(extra="allow")

    id: int | str
    title: str = Field(min_length=1, max_length=512)
    provider: str = Field(default="deezer", min_length=1, max_length=32)
    artist: dict[str, Any] | None = None
    album: dict[str, Any] | None = None
    preview: str | None = Field(default=None, max_length=2048)

    @field_validator("provider")
    @classmethod
    def normalize_provider(cls, value: str) -> str:
        return value.strip().lower()


class PlaylistInput(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    description: str | None = Field(default=None, max_length=500)

    @field_validator("name")
    @classmethod
    def normalize_name(cls, value: str) -> str:
        normalized = value.strip()
        if not normalized:
            raise ValueError("Playlist name cannot be empty.")
        return normalized

    @field_validator("description")
    @classmethod
    def normalize_description(cls, value: str | None) -> str | None:
        return value.strip() or None if value is not None else None

