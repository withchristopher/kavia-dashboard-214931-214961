from __future__ import annotations

from typing import Generic, List, Optional, Sequence, TypeVar

from pydantic import BaseModel, Field, HttpUrl

T = TypeVar("T")


# PUBLIC_INTERFACE
class RepositorySummary(BaseModel):
    """Summary information for a repository listing item."""

    id: int | str = Field(..., description="Unique repository identifier.")
    name: str = Field(..., description="Repository name.")
    full_name: str = Field(..., description="Repository full name (owner/name).")
    html_url: HttpUrl = Field(..., description="GitHub HTML URL for the repository.")
    description: Optional[str] = Field(None, description="Repository description.")
    stargazers_count: int = Field(..., description="Number of stars.")
    forks_count: int = Field(..., description="Number of forks.")
    open_issues_count: int = Field(..., description="Number of open issues.")
    watchers_count: Optional[int] = Field(None, description="Number of watchers.")
    language: Optional[str] = Field(None, description="Primary language.")
    license: Optional[dict] = Field(
        None, description="License information as returned by GitHub API (key/name)."
    )
    updated_at: Optional[str] = Field(None, description="ISO timestamp of last update.")
    archived: Optional[bool] = Field(False, description="Whether the repository is archived.")


# PUBLIC_INTERFACE
class RepositoryDetail(RepositorySummary):
    """Detailed repository information including optional analytics fields."""

    topics: Optional[List[str]] = Field(default=None, description="List of repository topics.")
    owner: Optional[dict] = Field(
        default=None,
        description="Owner object minimally including login/avatar_url/html_url.",
    )
    contributors_count: Optional[int] = Field(
        default=None, description="Computed contributors count (optional)."
    )
    releases_count: Optional[int] = Field(default=None, description="Computed releases count (optional).")


# PUBLIC_INTERFACE
class SearchQuery(BaseModel):
    """Incoming search query parameters for GitHub repository search."""

    q: str = Field(..., description="Free-form GitHub search query (keywords).")
    language: Optional[str] = Field(None, description="Language filter.")
    min_stars: Optional[int] = Field(None, ge=0, description="Minimum stars filter.")
    has_issues: Optional[bool] = Field(None, description="Filter repositories that have issues enabled.")
    has_license: Optional[bool] = Field(None, description="Filter repositories that have a license.")
    archived: Optional[bool] = Field(None, description="Filter for archived repositories.")
    sort_by: Optional[str] = Field(
        default="stars",
        description="Sort field: stars | forks | updated | name (name handled client-side if needed).",
    )
    sort_dir: Optional[str] = Field(default="desc", description="Sort order: asc | desc.")
    page: int = Field(default=1, ge=1, description="Page number (1-based).")
    page_size: int = Field(default=20, ge=1, description="Page size.")


# PUBLIC_INTERFACE
class PaginatedResponse(BaseModel, Generic[T]):
    """Standard pagination envelope for list/search responses."""

    items: Sequence[T] = Field(..., description="Items for the current page.")
    total: int = Field(..., description="Total number of items available.")
    page: int = Field(..., description="Current page number (1-based).")
    page_size: int = Field(..., description="Page size used.")


# PUBLIC_INTERFACE
class AnalyticsSummary(BaseModel):
    """Aggregate analytics data for a given search."""

    total_repositories: int = Field(..., description="Total repositories in result set.")
    total_stars: int = Field(..., description="Sum of stars across repositories.")
    total_forks: int = Field(..., description="Sum of forks across repositories.")
    language_breakdown: List[dict] = Field(
        ..., description="List of { language, count } pairs representing distribution."
    )
    issues_trend: Optional[List[dict]] = Field(
        default=None,
        description="Optional time series [{date: str, open: int}] for open issues trend.",
    )
