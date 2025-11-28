from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field

from ..github_client import GitHubClient, get_github_client
from ..schemas import AnalyticsSummary, SearchQuery

# Define a local ErrorResponse for documented responses
class ErrorResponse(BaseModel):
    """Standard error response payload."""
    detail: str = Field(..., description="Human-readable error message.")
    code: Optional[str] = Field(default=None, description="Optional application error code.")

# Feature-scoped router
analytics_router = APIRouter(prefix="/analytics", tags=["analytics"])


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
