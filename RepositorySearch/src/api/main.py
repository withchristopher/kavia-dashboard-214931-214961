from typing import List

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import get_settings
# Import modularized routers
from .routers.search import search_router
from .routers.repositories import repos_router
from .routers.analytics import analytics_router


# Initialize settings once (cached by get_settings)
settings = get_settings()

openapi_tags = [
    {"name": "health", "description": "Service health and readiness."},
    {"name": "search", "description": "Search public GitHub repositories."},
    {"name": "repositories", "description": "Repository details and metadata."},
    {"name": "analytics", "description": "Aggregate analytics for repository search slices."},
]

app = FastAPI(
    title="Repository Search API",
    description=(
        "Backend service for GitHub repository search and analytics. "
        "Provides endpoints for search, repository details, and aggregate analytics."
    ),
    version="0.1.0",
    openapi_tags=openapi_tags,
)

# Configure CORS based on ALLOW_ORIGINS
def _parse_origins(origins: List[str]) -> List[str]:
    # If a single '*' exists, allow all
    if any(o.strip() == "*" for o in origins):
        return ["*"]
    # Flatten comma-separated inputs if provided in a single env string
    flattened: List[str] = []
    for o in origins:
        if "," in o:
            flattened.extend([p.strip() for p in o.split(",") if p.strip()])
        else:
            if o.strip():
                flattened.append(o.strip())
    return flattened or ["*"]


allow_origins = _parse_origins(settings.ALLOW_ORIGINS)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# PUBLIC_INTERFACE
@app.get("/", summary="Health Check", tags=["health"])
def health_check():
    """
    Health check endpoint for uptime monitoring.

    Returns:
        JSON object with a simple 'message' indicating the service is up.
    """
    return {"message": "Healthy"}


# Include feature routers
app.include_router(search_router)
app.include_router(repos_router)
app.include_router(analytics_router)
