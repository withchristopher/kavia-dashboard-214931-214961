from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Path, Query
from pydantic import BaseModel, Field

from .github_client import GitHubClient, get_github_client
from .schemas import (
    AnalyticsSummary,
    PaginatedResponse,
    RepositoryDetail,
    RepositorySummary,
    SearchQuery,
)

# Router instances grouped by feature tags for OpenAPI
search_router = APIRouter(prefix="/search", tags=["search"])
repos_router = APIRouter(prefix="/repositories", tags=["repositories"])
analytics_router = APIRouter(prefix="/analytics", tags=["analytics"])


class ErrorResponse(BaseModel):
    """Standard error response payload."""
    detail: str = Field(..., description="Human-readable error message.")
    code: Optional[str] = Field(default=None, description="Optional application error code.")


# PUBLIC_INTERFACE
@search_router.get(
    "",
    summary="Search repositories",
    response_model=PaginatedResponse[RepositorySummary],
    responses={
        200: {"description": "Successful search results"},
        400: {"model": ErrorResponse, "description": "Invalid query parameters"},
        502: {"model": ErrorResponse, "description": "Upstream (GitHub) error"},
    },
)
async def search_repositories_endpoint(
    q: str = Query(..., description="Free-form GitHub search query (keywords)."),
    language: Optional[str] = Query(None, description="Language filter."),
    min_stars: Optional[int] = Query(None, ge=0, description="Minimum stars filter."),
    has_issues: Optional[bool] = Query(None, description="Filter repositories that have issues enabled."),
    has_license: Optional[bool] = Query(None, description="Filter repositories that have a license."),
    archived: Optional[bool] = Query(None, description="Filter for archived repositories."),
    sort_by: Optional[str] = Query("stars", description="Sort field: stars | forks | updated"),
    sort_dir: Optional[str] = Query("desc", description="Sort order: asc | desc"),
    page: int = Query(1, ge=1, description="Page number (1-based)."),
    page_size: int = Query(20, ge=1, description="Page size."),
    client: GitHubClient = Depends(get_github_client),
):
    """
    Search repositories using GitHub Search API.

    This endpoint proxies a subset of GitHub's search qualifiers and returns a paginated list
    of RepositorySummary items, normalized for the frontend.

    Parameters:
        q: Free-form keywords.
        language: Optional language filter.
        min_stars: Minimum stargazers count.
        has_issues: Filter for issue-enabled repositories.
        has_license: Filter for repositories with a license.
        archived: Include only archived (true) or only non-archived (false) repositories.
        sort_by: One of stars | forks | updated.
        sort_dir: asc | desc.
        page: Page number starting at 1.
        page_size: Page size.

    Returns:
        PaginatedResponse[RepositorySummary]
    """
    try:
        payload = await client.search_repositories(
            SearchQuery(
                q=q,
                language=language,
                min_stars=min_stars,
                has_issues=has_issues,
                has_license=has_license,
                archived=archived,
                sort_by=sort_by,
                sort_dir=sort_dir,
                page=page,
                page_size=page_size,
            )
        )
        return payload
    except Exception as e:
        # In a real service, we would distinguish 4xx vs 5xx from upstream.
        raise HTTPException(status_code=502, detail=f"GitHub search failed: {e}") from e


# PUBLIC_INTERFACE
@repos_router.get(
    "/{full_name_or_id}",
    summary="Get repository detail",
    response_model=RepositoryDetail,
    responses={
        200: {"description": "Repository found"},
        404: {"model": ErrorResponse, "description": "Repository not found"},
        502: {"model": ErrorResponse, "description": "Upstream (GitHub) error"},
    },
)
async def get_repository_endpoint(
    full_name_or_id: str = Path(..., description="Repository 'owner/name' or numeric repository ID."),
    client: GitHubClient = Depends(get_github_client),
):
    """
    Retrieve a single repository by full name (owner/name) or numeric ID.

    Parameters:
        full_name_or_id: 'owner/name' or numeric ID.

    Returns:
        RepositoryDetail
    """
    try:
        detail = await client.get_repository(full_name_or_id)
        if not detail:
            raise HTTPException(status_code=404, detail="Repository not found")
        return detail
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"GitHub repository fetch failed: {e}") from e


# PUBLIC_INTERFACE
@analytics_router.get(
    "",
    summary="Get aggregate analytics for a search slice",
    response_model=AnalyticsSummary,
    responses={
        200: {"description": "Aggregated analytics for the given search parameters"},
        400: {"model": ErrorResponse, "description": "Invalid query parameters"},
        502: {"model": ErrorResponse, "description": "Upstream (GitHub) error"},
    },
)
async def get_analytics_endpoint(
    q: str = Query(..., description="Free-form GitHub search query (keywords)."),
    language: Optional[str] = Query(None, description="Language filter."),
    min_stars: Optional[int] = Query(None, ge=0, description="Minimum stars filter."),
    has_issues: Optional[bool] = Query(None, description="Filter repositories that have issues enabled."),
    has_license: Optional[bool] = Query(None, description="Filter repositories that have a license."),
    archived: Optional[bool] = Query(None, description="Filter for archived repositories."),
    sort_by: Optional[str] = Query("stars", description="Sort field: stars | forks | updated"),
    sort_dir: Optional[str] = Query("desc", description="Sort order: asc | desc"),
    page_size: int = Query(20, ge=1, description="Page size used to compute analytics window."),
    client: GitHubClient = Depends(get_github_client),
):
    """
    Returns aggregate analytics for the provided search parameters.

    Strategy:
    - Uses the first page of results (with page_size) to compute totals and language distribution.
    - Results are cached in-memory for subsequent requests with identical parameters.

    Parameters:
        q, language, min_stars, has_issues, has_license, archived, sort_by, sort_dir, page_size

    Returns:
        AnalyticsSummary
    """
    try:
        analytics = await client.get_analytics(
            SearchQuery(
                q=q,
                language=language,
                min_stars=min_stars,
                has_issues=has_issues,
                has_license=has_license,
                archived=archived,
                sort_by=sort_by,
                sort_dir=sort_dir,
                page=1,  # always first page for analytics aggregation baseline
                page_size=page_size,
            )
        )
        return analytics
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"GitHub analytics computation failed: {e}") from e
