from collections import defaultdict
from time import time

from fastapi import HTTPException, status

from app.config import settings


class RateLimiter:
    def __init__(self, max_requests: int, window_seconds: int) -> None:
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self._hits: dict[str, list[float]] = defaultdict(list)

    def check(self, key: str) -> None:
        now = time()
        window_start = now - self.window_seconds
        self._hits[key] = [timestamp for timestamp in self._hits[key] if timestamp > window_start]

        if len(self._hits[key]) >= self.max_requests:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=(
                    f"Rate limit exceeded: max {self.max_requests} requests "
                    f"per {self.window_seconds} seconds"
                ),
            )

        self._hits[key].append(now)

    def reset(self) -> None:
        self._hits.clear()


analyze_rate_limiter = RateLimiter(
    max_requests=settings.rate_limit_requests,
    window_seconds=settings.rate_limit_window_seconds,
)
