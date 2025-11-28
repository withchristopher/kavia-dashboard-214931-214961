from __future__ import annotations

from typing import Any, Dict, List

import httpx

from .cache import get_cached, set_cached
from .config import get_settings
from .models import to_repository_detail, to_repository_summary
from .rate_limit import GitHubRateLimiter, TokenBucket
from .schemas import AnalyticsSummary, PaginatedResponse, RepositoryDetail, RepositorySummary, SearchQuery


class _HttpClientFactory:
    """Factory that returns a configured AsyncClient."""

    @staticmethod
    def build() -> httpx.AsyncClient:
        settings = get_settings()
        headers: Dict[str, str] = {
            "Accept": "application/vnd.github+json",
            "User-Agent": "Kavia-RepoSearch/0.1",
        }
        # Attach Authorization if token configured
        if settings.GITHUB_TOKEN:
            headers["Authorization"] = f"Bearer {settings.GITHUB_TOKEN}"

        return httpx.AsyncClient(
            base_url=str(settings.GITHUB_API_BASE),
            headers=headers,
            timeout=httpx.Timeout(settings.REQUEST_TIMEOUT),
            follow_redirects=True,
        )


class GitHubClient:
    """
    Async GitHub REST API client with:
    - httpx.AsyncClient
    - Configurable auth via Settings.GITHUB_TOKEN
    - TokenBucket + GitHubRateLimiter pacing
    - Simple in-memory caching for read endpoints via GLOBAL_CACHE
    """

    def __init__(self) -> None:
        self._settings = get_settings()
        # Allow ~2 req/s with a small burst; GitHub allows more with auth, but we stay conservative.
        self._limiter = GitHubRateLimiter(TokenBucket(rate_per_sec=2.0, capacity=10))
        self._client = _HttpClientFactory.build()

    async def _request(self, method: str, url: str, **kwargs: Any) -> httpx.Response:
        """Perform a single HTTP request with rate limiting and backoff logic."""
        # Acquire rate limit slot
        self._limiter.acquire()
        try:
            resp = await self._client.request(method, url, **kwargs)
        except httpx.ReadTimeout:
            # Backoff and raise
            self._limiter.backoff_on_throttle()
            raise
        except httpx.ConnectError:
            self._limiter.backoff_on_throttle()
            raise

        # Update pacing from headers
        self._limiter.update_from_headers(resp.headers)

        if resp.status_code in (429,):  # Too Many Requests
            self._limiter.backoff_on_throttle()
        elif resp.status_code == 403 and "abuse" in (resp.text or "").lower():
            # Secondary rate limit
            self._limiter.backoff_on_throttle()

        if resp.is_success:
            # Reset exponential backoff on success
            self._limiter.reset_backoff()
        return resp

    async def aclose(self) -> None:
        """Close underlying httpx client."""
        await self._client.aclose()

    # PUBLIC_INTERFACE
    async def search_repositories(self, q: SearchQuery) -> PaginatedResponse[RepositorySummary]:
        """
        Search repositories using GitHub Search API.

        Builds a GitHub query string composed from SearchQuery fields, applies caching, and maps the
        response to PaginatedResponse[RepositorySummary].

        Caching:
          - cache key: f"gh:search:{...serialized...}"
          - TTL configured via GLOBAL_CACHE default
        """
        # Build GitHub search query
        gh_q = self._build_github_query(q)
        sort = q.sort_by if q.sort_by in {"stars", "forks", "updated"} else "stars"
        order = q.sort_dir if q.sort_dir in {"asc", "desc"} else "desc"

        per_page = max(1, min(self._settings.MAX_PAGE_SIZE, q.page_size or self._settings.DEFAULT_PAGE_SIZE))
        page = max(1, q.page or 1)

        cache_key = f"gh:search:{gh_q}:{sort}:{order}:{per_page}:{page}"
        cached = get_cached(cache_key)
        if cached is not None:
            return cached  # type: ignore[return-value]

        params = {"q": gh_q, "sort": sort, "order": order, "per_page": per_page, "page": page}

        resp = await self._request("GET", "/search/repositories", params=params)
        resp.raise_for_status()
        data = resp.json()

        items_raw = data.get("items") or []
        total_count = int(data.get("total_count") or 0)
        items = [to_repository_summary(it) for it in items_raw]

        payload = PaginatedResponse[RepositorySummary](
            items=items, total=total_count, page=page, page_size=per_page
        )
        set_cached(cache_key, payload)
        return payload

    # PUBLIC_INTERFACE
    async def get_repository(self, full_name_or_id: str) -> RepositoryDetail:
        """
        Retrieve repository by 'owner/name' or repository ID.

        Applies caching using GLOBAL_CACHE.
        """
        cache_key = f"gh:repo:{full_name_or_id}"
        cached = get_cached(cache_key)
        if cached is not None:
            return cached  # type: ignore[return-value]

        # If value looks like numeric ID, GitHub API supports GET /repositories/{id}
        path: str
        if full_name_or_id.isdigit():
            path = f"/repositories/{full_name_or_id}"
        else:
            # Assume owner/name
            path = f"/repos/{full_name_or_id}"

        resp = await self._request("GET", path)
        resp.raise_for_status()
        data = resp.json()

        detail = to_repository_detail(data)
        set_cached(cache_key, detail)
        return detail

    # PUBLIC_INTERFACE
    async def get_analytics(self, q: SearchQuery) -> AnalyticsSummary:
        """
        Compute aggregate analytics for a given search slice.

        Strategy:
        - Use the same GitHub search as search_repositories but fetch up to first N pages
          to compute aggregates such as total stars, forks, and language breakdown.
        - Respect page_size limits and rate-limiting; use caching per normalized query.
        """
        norm = self._build_github_query(q)
        cache_key = f"gh:analytics:{norm}:{q.sort_by}:{q.sort_dir}:{q.page_size}"
        cached = get_cached(cache_key)
        if cached is not None:
            return cached  # type: ignore[return-value]

        # We'll fetch the first page only for performance by default and compute analytics on it.
        # This can be extended later to paginate across multiple pages with careful rate limiting.
        first_page = await self.search_repositories(
            SearchQuery(
                q=q.q,
                language=q.language,
                min_stars=q.min_stars,
                has_issues=q.has_issues,
                has_license=q.has_license,
                archived=q.archived,
                sort_by=q.sort_by,
                sort_dir=q.sort_dir,
                page=1,
                page_size=min(100, q.page_size or self._settings.DEFAULT_PAGE_SIZE),
            )
        )

        items = list(first_page.items)
        total_repos = first_page.total
        total_stars = sum(int(r.stargazers_count or 0) for r in items)
        total_forks = sum(int(r.forks_count or 0) for r in items)

        lang_counts: Dict[str, int] = {}
        for r in items:
            lang = r.language or "Other"
            lang_counts[lang] = lang_counts.get(lang, 0) + 1

        language_breakdown = [{"language": k, "count": v} for k, v in sorted(lang_counts.items(), key=lambda x: -x[1])]

        analytics = AnalyticsSummary(
            total_repositories=total_repos,
            total_stars=total_stars,
            total_forks=total_forks,
            language_breakdown=language_breakdown,
            issues_trend=None,  # Optional; can be populated by additional endpoints if desired
        )
        set_cached(cache_key, analytics)
        return analytics

    def _build_github_query(self, q: SearchQuery) -> str:
        """
        Convert SearchQuery to a GitHub 'q' string for /search/repositories.
        Includes qualifiers such as language, stars, archived, license, and issues.
        """
        parts: List[str] = []
        base = (q.q or "").strip()
        if base:
            parts.append(base)

        if q.language:
            parts.append(f"language:{q.language}")

        if isinstance(q.min_stars, int) and q.min_stars >= 0:
            parts.append(f"stars:>={q.min_stars}")

        if q.has_issues is True:
            parts.append("is:issue-enabled")

        # GitHub doesn't have 'has_license' as boolean; approximate by requiring a license field.
        if q.has_license is True:
            parts.append("license:>0")  # heuristic; many repos will include a license id

        if q.archived is True:
            parts.append("archived:true")
        elif q.archived is False:
            parts.append("archived:false")

        # Ensure we search public repos only (optional safeguard)
        parts.append("is:public")

        return " ".join(parts).strip()


# Convenience factory
# PUBLIC_INTERFACE
def get_github_client() -> GitHubClient:
    """Return a ready-to-use GitHubClient. Caller should aclose() on shutdown."""
    return GitHubClient()
