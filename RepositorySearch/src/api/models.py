from __future__ import annotations

from typing import Any, Dict, Optional

from .schemas import RepositoryDetail, RepositorySummary


def _pick_license(raw: Optional[dict]) -> Optional[dict]:
    if not raw or not isinstance(raw, dict):
        return None
    # Keep only common fields to keep response slim
    return {k: v for k, v in raw.items() if k in {"key", "name", "spdx_id"}}


def to_repository_summary(item: Dict[str, Any]) -> RepositorySummary:
    """Map a raw GitHub repository item to our RepositorySummary."""
    return RepositorySummary(
        id=item.get("id"),
        name=item.get("name") or "",
        full_name=item.get("full_name") or "",
        html_url=item.get("html_url") or "",
        description=item.get("description"),
        stargazers_count=int(item.get("stargazers_count") or 0),
        forks_count=int(item.get("forks_count") or 0),
        open_issues_count=int(item.get("open_issues_count") or 0),
        watchers_count=item.get("watchers_count"),
        language=item.get("language"),
        license=_pick_license(item.get("license")),
        updated_at=item.get("updated_at"),
        archived=bool(item.get("archived") or False),
    )


def to_repository_detail(item: Dict[str, Any]) -> RepositoryDetail:
    """Map a raw GitHub repository item to our RepositoryDetail."""
    base = to_repository_summary(item)
    owner = item.get("owner") if isinstance(item.get("owner"), dict) else None
    topics = item.get("topics") if isinstance(item.get("topics"), list) else None
    return RepositoryDetail(
        **base.model_dump(),
        owner={
            "login": owner.get("login") if owner else None,
            "avatar_url": owner.get("avatar_url") if owner else None,
            "html_url": owner.get("html_url") if owner else None,
        }
        if owner
        else None,
        topics=topics,
    )
