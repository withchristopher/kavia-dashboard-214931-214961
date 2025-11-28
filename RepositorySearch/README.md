# RepositorySearch (FastAPI Backend)

Backend service for GitHub repository search and analytics.

## Quick start

1. Create environment file from example and configure CORS for your frontend (default Next.js dev at 3000):

   cp .env.example .env

   Ensure ALLOW_ORIGINS includes your frontend origin, e.g.:
   ALLOW_ORIGINS=http://localhost:3000

   Note: If your frontend runs on a different host/port (e.g., Vercel preview), add it too:
   ALLOW_ORIGINS=http://localhost:3000,https://your-preview.vercel.app

2. Install dependencies:

   pip install -r requirements.txt

3. Run the server (port 3001 recommended):

   uvicorn src.api.main:app --host 0.0.0.0 --port 3001 --reload

   Pairing for local dev:
   - Frontend: http://localhost:3000
   - Backend:  http://localhost:3001

4. API docs:

   http://localhost:3001/docs

## Environment variables

See .env.example for all variables.

- ALLOW_ORIGINS: Comma-separated list of allowed origins for CORS (e.g., http://localhost:3000)
- GITHUB_TOKEN: Optional GitHub token for higher rate limits
- CACHE_TTL_SECONDS, REQUEST_TIMEOUT, etc.

