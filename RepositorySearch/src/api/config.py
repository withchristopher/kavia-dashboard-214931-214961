from functools import lru_cache
from typing import List, Optional

from pydantic import AnyHttpUrl, Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Application settings loaded from environment variables or .env file.

    This module centralizes configuration for the FastAPI backend so that
    configuration can be changed per-environment without code changes.
    """

    # GitHub API related
    GITHUB_TOKEN: Optional[str] = Field(
        default=None,
        description="Personal access token used for authenticated requests to GitHub API.",
    )
    GITHUB_API_BASE: AnyHttpUrl = Field(
        default="https://api.github.com",
        description="Base URL for GitHub REST API.",
    )

    # HTTP behavior
    REQUEST_TIMEOUT: int = Field(
        default=15, description="Default outbound request timeout in seconds."
    )

    # Pagination defaults
    MAX_PAGE_SIZE: int = Field(
        default=100, description="Maximum allowed page size for list endpoints."
    )
    DEFAULT_PAGE_SIZE: int = Field(
        default=20, description="Default page size for list endpoints."
    )

    # CORS
    ALLOW_ORIGINS: List[str] = Field(
        default=["*"],
        description="Comma-separated list of allowed origins. Use '*' for all.",
    )

    # Caching
    CACHE_TTL_SECONDS: int = Field(
        default=300, description="Default TTL for cache entries in seconds."
    )

    model_config = SettingsConfigDict(
        env_file=".env",
        env_prefix="",
        case_sensitive=False,
        extra="ignore",
    )


# PUBLIC_INTERFACE
@lru_cache()
def get_settings() -> Settings:
    """Return a cached Settings instance loaded from environment and .env file."""
    return Settings()
