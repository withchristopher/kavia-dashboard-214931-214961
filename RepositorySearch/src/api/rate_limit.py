"""
Rate limiting utilities with a token bucket and GitHub-aware backoff.

This module provides:
- TokenBucket: per-route or global limiter with refill rate and capacity.
- GitHubRateLimiter: wrapper that adjusts delays based on GitHub X-RateLimit headers.

Design goals:
- stdlib only (threading/time)
- test-friendly: deterministic sleeps via injectable sleep function
- ease of use with HTTP clients (httpx/requests). The module does not depend on them.

Typical usage:
    bucket = TokenBucket(rate_per_sec=2, capacity=10)  # allow 2 req/s, burst 10
    gh_limiter = GitHubRateLimiter(bucket=bucket)

    # before making an API call:
    gh_limiter.acquire()

    # after response:
    gh_limiter.update_from_headers(response.headers)

Environment:
- This module does not read env directly. Configure buckets at integration points.
"""

from __future__ import annotations

import threading
import time
from typing import Callable, Mapping


class TokenBucket:
    """
    Token bucket implementation to rate limit actions.

    Attributes:
        rate_per_sec: tokens added per second.
        capacity: maximum number of tokens.
        _tokens: current available tokens.
        _last_refill: last refill timestamp.
    """

    def __init__(
        self,
        rate_per_sec: float,
        capacity: int,
        time_fn: Callable[[], float] = time.monotonic,
        sleep_fn: Callable[[float], None] = time.sleep,
    ) -> None:
        if rate_per_sec <= 0:
            raise ValueError("rate_per_sec must be > 0")
        if capacity <= 0:
            raise ValueError("capacity must be > 0")

        self.rate_per_sec = float(rate_per_sec)
        self.capacity = int(capacity)
        self._tokens = float(capacity)
        self._last_refill = time_fn()
        self._lock = threading.Lock()
        self._time = time_fn
        self._sleep = sleep_fn

    def _refill(self) -> None:
        now = self._time()
        elapsed = max(0.0, now - self._last_refill)
        add = elapsed * self.rate_per_sec
        if add > 0:
            self._tokens = min(self.capacity, self._tokens + add)
            self._last_refill = now

    # PUBLIC_INTERFACE
    def acquire(self) -> None:
        """
        Acquire one token, blocking until available.
        """
        while True:
            with self._lock:
                self._refill()
                if self._tokens >= 1.0:
                    self._tokens -= 1.0
                    return
                # Compute wait time for next token
                deficit = 1.0 - self._tokens
                wait = max(0.0, deficit / self.rate_per_sec)
            self._sleep(wait)


class GitHubRateLimiter:
    """
    Adjusts rate limiting behavior according to GitHub REST API headers.

    Relevant headers:
        X-RateLimit-Limit: total requests allowed in the window
        X-RateLimit-Remaining: remaining requests
        X-RateLimit-Reset: epoch seconds when window resets

    Behavior:
    - If Remaining is low, attempts to back off until reset time.
    - If headers are missing, falls back to token bucket only.
    - Provides a simple exponential backoff helper for HTTP 429/403 abuse rate limits.

    Instantiate with an existing TokenBucket:
        gh = GitHubRateLimiter(TokenBucket(rate_per_sec=2, capacity=10))

    Call acquire() before requests and update_from_headers() after responses.
    """

    def __init__(
        self,
        bucket: TokenBucket,
        sleep_fn: Callable[[float], None] = time.sleep,
        time_fn: Callable[[], float] = time.time,
    ) -> None:
        self._bucket = bucket
        self._sleep = sleep_fn
        self._time = time_fn
        self._consecutive_backoffs = 0

    # PUBLIC_INTERFACE
    def acquire(self) -> None:
        """Acquire permission to proceed with a request."""
        self._bucket.acquire()

    # PUBLIC_INTERFACE
    def update_from_headers(self, headers: Mapping[str, str]) -> None:
        """
        Adjusts pacing based on GitHub rate limit headers.

        If Remaining <= 1 and Reset is in the future, sleeps until just after reset.
        This is a conservative approach to avoid hitting hard limits.
        """
        try:
            remaining = int(headers.get("X-RateLimit-Remaining", "-1"))
            reset_at = int(headers.get("X-RateLimit-Reset", "0"))
        except ValueError:
            # On malformed headers, do nothing.
            return

        if remaining <= 1 and reset_at > 0:
            now = int(self._time())
            delta = max(0, reset_at - now) + 1  # add 1s safety buffer
            if delta > 0:
                self._sleep(delta)
                # Reset backoff counter after a reset sleep
                self._consecutive_backoffs = 0

    # PUBLIC_INTERFACE
    def backoff_on_throttle(self, base_delay: float = 1.0, max_delay: float = 30.0) -> None:
        """
        Call when you receive a 429 or secondary rate limit (403 with abuse limit).
        Applies exponential backoff with jitter capped at max_delay.
        """
        self._consecutive_backoffs += 1
        delay = min(max_delay, base_delay * (2 ** (self._consecutive_backoffs - 1)))
        # Add a small random-less jitter by +/-10% based on timestamp parity to keep stdlib-only
        if int(self._time()) % 2 == 0:
            delay *= 1.1
        else:
            delay *= 0.9
        self._sleep(delay)

    # PUBLIC_INTERFACE
    def reset_backoff(self) -> None:
        """Reset backoff state (call on successful requests)."""
        self._consecutive_backoffs = 0
