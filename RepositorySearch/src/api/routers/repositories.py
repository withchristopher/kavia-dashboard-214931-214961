from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Path
from pydantic import BaseModel, Field

from ..github_client import GitHubClient, get_github_client
from ..schemas import RepositoryDetail

# Define a local ErrorResponse for documented responses
class ErrorResponse(BaseModel):
    """Standard error response payload."""
    detail: str = Field(..., description="Human-readable error message.")
    code: Optional[str] = Field(default=None, description="Optional application error code.")

# Feature-scoped router
repos_router = APIRouter(prefix="/repositories", tags=["repositories"])


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
