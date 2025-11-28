# Kavia GitHub Analytics Dashboard

Full-stack app with:
- Backend: FastAPI (RepositorySearch) for GitHub search and analytics
- Frontend: Next.js for dashboard UI with charts and PDF export

## Quick Start (Local Development)

1. Backend (port 3001):
   - cd kavia-dashboard-214931-214961/RepositorySearch
   - cp .env.example .env
   - Ensure ALLOW_ORIGINS includes http://localhost:3000
   - pip install -r requirements.txt
   - uvicorn src.api.main:app --host 0.0.0.0 --port 3001 --reload

   API docs: http://localhost:3001/docs

2. Frontend (port 3000):
   - cd kavia-dashboard-214931-214961/frontend
   - cp .env.local.example .env.local
   - Set NEXT_PUBLIC_API_BASE_URL=http://localhost:3001
   - npm install
   - npm run dev

   Visit: http://localhost:3000

3. Verify end-to-end:
   - Go to /search, run a query (e.g., "nextjs")
   - Open a repository detail page
   - View charts and use "Export PDF"

## Notes

- Do not commit secrets. NEXT_PUBLIC_ variables are exposed to the browser.
- If deploying frontend to a different origin, add that URL to backend ALLOW_ORIGINS (comma-separated).
