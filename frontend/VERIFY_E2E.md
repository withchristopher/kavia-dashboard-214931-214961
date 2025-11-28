# E2E Verification Guide (Frontend ↔ Backend)

This guide helps you verify the UI-level integration between the Next.js frontend and the FastAPI backend.

Prereqs:
- Backend (FastAPI) running on http://localhost:3001 with CORS allowed for http://localhost:3000
- Frontend (Next.js) running on http://localhost:3000 with NEXT_PUBLIC_API_BASE_URL set to http://localhost:3001

1) Validate environment configuration
- Backend:
  - File: kavia-dashboard-214931-214961/RepositorySearch/.env
  - Ensure ALLOW_ORIGINS includes http://localhost:3000, e.g.:
    ALLOW_ORIGINS=http://localhost:3000
- Frontend:
  - File: kavia-dashboard-214931-214961/frontend/.env.local
  - Ensure:
    NEXT_PUBLIC_API_BASE_URL=http://localhost:3001

2) Start services
- Backend:
  cd kavia-dashboard-214931-214961/RepositorySearch
  pip install -r requirements.txt
  uvicorn src.api.main:app --host 0.0.0.0 --port 3001 --reload
  Visit http://localhost:3001/docs to confirm.

- Frontend:
  cd kavia-dashboard-214931-214961/frontend
  npm install
  npm run dev
  Visit http://localhost:3000 to confirm.

3) Exercise /search flow
- Navigate to http://localhost:3000/search
- Enter a query like "react" and submit.
- Confirm:
  - A table renders with repository items.
  - Pagination controls update page and "Page X of Y • N results".
  - Sorting:
    - Change "Sort by" to Stars/Forks/Last updated/Name; change "Order" to Asc/Desc and verify reordered results.
  - Filters:
    - Toggle "Has issues", "Has license", "Archived" and verify row set updates.
- If backend is unavailable or returns an error:
  - The page uses a local mock fallback and still renders items with pagination/sorting/filters.
  - An error message may show briefly if the fetch fails, then the mock will populate.

4) Click into a repository row
- Click a row link to GitHub to open repo externally — additionally:
- Manually navigate to http://localhost:3000/repositories/owner/repo (or use an ID if your backend supports it).
- Confirm detail page shows:
  - Basic stats (Stars, Forks, Open issues, Watchers, Language, License, Updated).
  - Charts:
    - Stars vs Forks comparison (visible Recharts).
    - Issues Trend (visible Recharts, mock data if backend trend not provided).
    - Language Distribution (visible Recharts, mock data if backend distribution not provided).
  - PDF export:
    - Click "Export PDF". A PDF file should download containing title, description (if any), stats table, and chart images.

5) Error/loading states
- Missing API base:
  - Temporarily remove/rename NEXT_PUBLIC_API_BASE_URL from .env.local and restart frontend dev server.
  - Visit /search — header area shows "not configured — set NEXT_PUBLIC_API_BASE_URL..." and the page uses mock data.
  - Visit /repositories/[id] — shows a backend not configured message near the PDF button; mock details and charts still render.
- 404 from backend:
  - Try a nonexistent repository id on /repositories/<nonexistent> (e.g., a random string).
  - Expect a friendly error banner; if the fetch fails the page will fallback to mock repository details for a consistent demo experience.

6) Report mismatches
- If the backend response structure differs from frontend expectations, note the fields and endpoints:
  - /search → expects PaginatedResponse with items[], total, page, page_size; items[] of RepositorySummary.
  - /repositories/{id} → expects RepositoryDetail with counts and metadata.
  - /analytics → expects AnalyticsSummary with totals and language_breakdown, optional issues_trend.

Record any mismatches in a QA note with:
- Endpoint called
- Request params
- Actual response (shape and status code)
- Expected behavior in UI
- Suggested fix (frontend mapping, backend shape alignment, or error handling)
