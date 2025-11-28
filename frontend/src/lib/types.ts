//
// Shared frontend types for API integration
//

/**
 * PUBLIC_INTERFACE
 * ApiError
 * Standardized error shape returned by API client when requests fail.
 */
export interface ApiError {
  /** HTTP status code when available */
  status?: number;
  /** Error code from backend */
  code?: string;
  /** Human-readable message */
  message: string;
  /** Validation or field-level errors (if any) */
  details?: unknown;
}

/**
 * PUBLIC_INTERFACE
 * PaginatedResponse<T>
 * Standard pagination envelope for list/search responses.
 */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}

/**
 * PUBLIC_INTERFACE
 * RepositorySummary
 * Summary item for repositories list/search table.
 */
export interface RepositorySummary {
  id: string | number;
  name: string;
  full_name: string;
  html_url: string;
  description?: string;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  watchers_count?: number;
  language?: string;
  license?: { key?: string; name?: string } | null;
  updated_at?: string;
  archived?: boolean;
}

/**
 * PUBLIC_INTERFACE
 * RepositoryDetail
 * Detailed repository information for the detail page.
 */
export interface RepositoryDetail extends RepositorySummary {
  topics?: string[];
  owner?: { login?: string; avatar_url?: string; html_url?: string };
  // additional optional analytics fields for the detail view
  contributors_count?: number;
  releases_count?: number;
}

/**
 * PUBLIC_INTERFACE
 * SearchParams
 * Parameters accepted by the search and analytics endpoints.
 */
export interface SearchParams {
  q: string;
  language?: string;
  minStars?: number | "";
  hasIssues?: boolean;
  hasLicense?: boolean;
  archived?: boolean;
  sortBy?: "stars" | "forks" | "updated" | "name";
  sortDir?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}

/**
 * PUBLIC_INTERFACE
 * AnalyticsSummary
 * Aggregate analytics data for a given search or slice.
 */
export interface AnalyticsSummary {
  total_repositories: number;
  total_stars: number;
  total_forks: number;
  language_breakdown: Array<{ language: string; count: number }>;
  issues_trend?: Array<{ date: string; open: number }>;
}
