"""
Cache utilities: In-memory LRU with per-key TTL and simple decorators.

This module provides a threadsafe, unit-test-friendly cache implementation
intended to reduce redundant calls to external services (e.g. GitHub API)
for:
- search query results
- repository details

Configuration
- TTL defaults to Settings.CACHE_TTL_SECONDS
- No external deps: uses Python stdlib only

Usage
- Use Cache instance directly:
    cache = LruTtlCache(capacity=1024, default_ttl_seconds=60)
    value = cache.get(key)
    cache.set(key, value, ttl_seconds=120)

- Use decorators for simple function memoization with TTL and LRU:
    @cacheable(key_builder=lambda *a, **k: f"search:{a[0]}:{k.get('page',1)}",
               ttl_seconds=300)
    def fetch_search_results(query: str, page: int = 1): ...

Notes
- Keys must be hashable (str recommended).
- Entries expire lazily upon access or during maintenance.
- The cache is process-local; not shared across processes or machines.
"""

from __future__ import annotations

import threading
import time
from collections import OrderedDict
from dataclasses import dataclass
from typing import Any, Callable, Optional, TypeVar, Generic

from .config import get_settings

T = TypeVar("T")


@dataclass
class _Entry(Generic[T]):
    value: T
    expires_at: float


class LruTtlCache(Generic[T]):
    """
    An in-memory LRU cache with per-key TTL.

    - Thread-safe via a single lock.
    - LRU eviction when capacity is exceeded.
    - TTL-based expiration performed lazily and in a periodic maintenance sweep.

    Parameters:
        capacity: Maximum number of items before evicting least recently used.
        default_ttl_seconds: Default time-to-live for entries.
        maintenance_interval: Seconds between background maintenance runs.
    """

    def __init__(
        self,
        capacity: int = 1024,
        default_ttl_seconds: int = 300,
        maintenance_interval: int = 60,
    ) -> None:
        self.capacity = max(1, int(capacity))
        self.default_ttl_seconds = max(1, int(default_ttl_seconds))
        self._lock = threading.RLock()
        self._store: "OrderedDict[Any, _Entry[T]]" = OrderedDict()
        self._stop_event = threading.Event()
        self._maintenance_interval = max(5, int(maintenance_interval))
        self._maintenance_thread = threading.Thread(
            target=self._maintenance_loop, name="LruTtlCacheMaintenance", daemon=True
        )
        self._maintenance_thread.start()

    def _now(self) -> float:
        return time.time()

    def _is_expired(self, entry: _Entry[T]) -> bool:
        return entry.expires_at <= self._now()

    def _evict_if_needed(self) -> None:
        while len(self._store) > self.capacity:
            # Popitem(last=False) pops the least recently used
            self._store.popitem(last=False)

    def _maintenance_loop(self) -> None:
        # Periodically purge expired entries to keep memory bounded.
        try:
            while not self._stop_event.wait(self._maintenance_interval):
                self._purge_expired()
        except Exception:
            # Never raise exceptions from daemon thread.
            pass

    def _purge_expired(self) -> None:
        with self._lock:
            to_delete = []
            now = self._now()
            for k, entry in self._store.items():
                if entry.expires_at <= now:
                    to_delete.append(k)
            for k in to_delete:
                self._store.pop(k, None)

    # PUBLIC_INTERFACE
    def get(self, key: Any) -> Optional[T]:
        """Get a value by key if present and not expired; otherwise return None."""
        with self._lock:
            entry = self._store.get(key)
            if entry is None:
                return None
            if self._is_expired(entry):
                # Remove expired entry
                self._store.pop(key, None)
                return None
            # Mark as recently used
            self._store.move_to_end(key, last=True)
            return entry.value

    # PUBLIC_INTERFACE
    def set(self, key: Any, value: T, ttl_seconds: Optional[int] = None) -> None:
        """Set a value by key with optional TTL override."""
        ttl = self.default_ttl_seconds if ttl_seconds is None else int(ttl_seconds)
        expires_at = self._now() + max(1, ttl)
        with self._lock:
            self._store[key] = _Entry(value=value, expires_at=expires_at)
            self._store.move_to_end(key, last=True)
            self._evict_if_needed()

    # PUBLIC_INTERFACE
    def delete(self, key: Any) -> None:
        """Delete a key if present."""
        with self._lock:
            self._store.pop(key, None)

    # PUBLIC_INTERFACE
    def clear(self) -> None:
        """Clear the entire cache."""
        with self._lock:
            self._store.clear()

    # PUBLIC_INTERFACE
    def stop(self) -> None:
        """Stop maintenance thread (useful for unit tests)."""
        self._stop_event.set()
        # Do not join forever; daemon thread will end on process shutdown.
        self._maintenance_thread.join(timeout=1.0)


# Global cache singleton suitable for app-level usage.
_settings = get_settings()
GLOBAL_CACHE = LruTtlCache(
    capacity=2048,
    default_ttl_seconds=_settings.CACHE_TTL_SECONDS,
    maintenance_interval=60,
)


def _default_key_builder(func: Callable[..., Any], args: tuple, kwargs: dict) -> str:
    return f"{func.__module__}.{func.__qualname__}:{args!r}:{sorted(kwargs.items())!r}"


# PUBLIC_INTERFACE
def cacheable(
    key_builder: Optional[Callable[..., str]] = None,
    ttl_seconds: Optional[int] = None,
    cache: LruTtlCache = GLOBAL_CACHE,
) -> Callable[[Callable[..., T]], Callable[..., T]]:
    """
    Decorator: cache function return values using LRU/TTL.

    Args:
        key_builder: Function that builds a str key from *args and **kwargs.
                     Defaults to module+qualname+args representation.
        ttl_seconds: Optional TTL override for this function. Falls back to cache default.
        cache: Cache instance (defaults to GLOBAL_CACHE).

    Example:
        @cacheable(key_builder=lambda q, **k: f"search:{q}:{k.get('page', 1)}", ttl_seconds=300)
        def search_github(q: str, page: int = 1) -> dict: ...
    """
    def decorator(func: Callable[..., T]) -> Callable[..., T]:
        kb = key_builder

        def wrapper(*args: Any, **kwargs: Any) -> T:
            key = kb(*args, **kwargs) if kb else _default_key_builder(func, args, kwargs)
            hit = cache.get(key)
            if hit is not None:
                return hit  # type: ignore[return-value]
            result = func(*args, **kwargs)
            # Allow caching of falsy values but not None (avoid confusion)
            if result is not None:
                cache.set(key, result, ttl_seconds=ttl_seconds)
            return result

        # Preserve metadata for debuggability
        try:
            wrapper.__name__ = func.__name__  # type: ignore[attr-defined]
            wrapper.__doc__ = func.__doc__    # type: ignore[attr-defined]
            wrapper.__qualname__ = func.__qualname__  # type: ignore[attr-defined]
        except Exception:
            pass
        return wrapper
    return decorator


# PUBLIC_INTERFACE
def get_cached(cache_key: str, default: Any = None, cache: LruTtlCache = GLOBAL_CACHE) -> Any:
    """Convenience helper: get a cached value or default."""
    val = cache.get(cache_key)
    return default if val is None else val


# PUBLIC_INTERFACE
def set_cached(cache_key: str, value: Any, ttl_seconds: Optional[int] = None, cache: LruTtlCache = GLOBAL_CACHE) -> None:
    """Convenience helper: set a cached value with optional TTL."""
    cache.set(cache_key, value, ttl_seconds=ttl_seconds)
