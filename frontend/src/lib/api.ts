import { getApiBaseUrl } from "./config";
import type {
  ApiError,
  RepositoryDetail,
  RepositorySummary,
  SearchParams,
  PaginatedResponse,
  AnalyticsSummary
} from "./types";

/**
 * Internal utility: serialize query parameters while skipping null/undefined/empty.
 */
function buildQuery(params: Record<string, unknown>): string {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null) return;
    if (typeof v === "string" && v.trim() === "") return;
    // booleans and numbers are accepted
    sp.set(k, String(v));
  });
  const s = sp.toString();
  return s ? `?${s}` : "";
}

/**
 * Internal utility: map backend error payloads to ApiError.
 */
async function toApiError(r: Response): Promise<ApiError> {
  let payload: any = null;
  try {
    payload = await r.json();
  } catch {
    // ignore parse error, fall back to status text
  }
  const message =
    (payload && (payload.detail || payload.message)) ||
    r.statusText ||
    "Request failed";
  const code = payload?.code || undefined;
  const details = payload?.details || payload?.errors || undefined;
  return {
    status: r.status,
    code,
    message: String(message),
    details
  };
}

/**
 * Internal fetch wrapper adding timeout via AbortController and base URL.
 */
async function request<T>(
  path: string,
  init?: RequestInit & { timeoutMs?: number }
): Promise<T> {
  const base = getApiBaseUrl();
  if (!base) {
    // If not configured, throw a consistent error to allow callers to fallback to mocks
    const err: ApiError = {
      message:
        "API base URL is not configured. Set NEXT_PUBLIC_API_BASE_URL in .env.local.",
      code: "NO_API_BASE"
    };
    throw err;
  }

  const url = `${base.replace(/\/+$/, "")}${path.startsWith("/") ? "" : "/"}${path}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), init?.timeoutMs ?? 15000);

  try {
    const res = await fetch(url, {
      ...init,
      signal: controller.signal,
      headers: {
        "content-type": "application/json",
        ...(init?.headers || {})
      }
    });

    if (!res.ok) {
      throw await toApiError(res);
    }
    // Try json; allow empty 204
    if (res.status === 204) {
      return undefined as unknown as T;
    }
    return (await res.json()) as T;
  } catch (e: any) {
    if (e?.name === "AbortError") {
      const err: ApiError = { message: "Request timed out", code: "TIMEOUT" };
      throw err;
    }
    // If already ApiError, rethrow
    if (e && typeof e === "object" && "message" in e && ("code" in e || "status" in e)) {
      throw e as ApiError;
    }
    const err: ApiError = {
      message: e?.message || "Network error",
      code: "NETWORK_ERROR"
    };
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Map SearchParams to backend query string keys.
 * Backend naming convention (aligns with current Search page query):
 * - q
 * - language
 * - min_stars
 * - sort_by
 * - sort_dir
 * - page
 * - page_size
 * - has_issues
 * - has_license
 * - archived
 */
function searchParamsToQuery(p: SearchParams): string {
  const query = buildQuery({
    q: p.q,
    language: p.language,
    min_stars: typeof p.minStars === "number" ? p.minStars : undefined,
    sort_by: p.sortBy,
    sort_dir: p.sortDir,
    page: p.page,
    page_size: p.pageSize,
    has_issues: p.hasIssues ? "true" : undefined,
    has_license: p.hasLicense ? "true" : undefined,
    archived: p.archived ? "true" : undefined
  });
  return query;
}

// PUBLIC_INTERFACE
export async function searchRepositories(
  params: SearchParams
): Promise<PaginatedResponse<RepositorySummary>> {
  /**
   * Searches repositories based on params.
   * Uses GET /search with query parameters.
   */
  const q = searchParamsToQuery(params);
  return await request<PaginatedResponse<RepositorySummary>>(`/search${q}`, {
    method: "GET",
    timeoutMs: 15000
  });
}

// PUBLIC_INTERFACE
export async function getRepository(fullName: string): Promise<RepositoryDetail> {
  /**
   * Fetch repository detail.
   * Expects GET /repositories/{fullName}
   */
  const safe = encodeURIComponent(fullName);
  return await request<RepositoryDetail>(`/repositories/${safe}`, {
    method: "GET",
    timeoutMs: 15000
  });
}

// PUBLIC_INTERFACE
export async function getAnalytics(params: SearchParams): Promise<AnalyticsSummary> {
  /**
   * Returns aggregate analytics for a given search slice.
   * Uses GET /analytics with same SearchParams keys as /search.
   */
  const q = searchParamsToQuery(params);
  return await request<AnalyticsSummary>(`/analytics${q}`, {
    method: "GET",
    timeoutMs: 20000
  });
}
