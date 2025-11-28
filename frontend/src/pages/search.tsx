import Head from 'next/head';
import { useCallback, useEffect, useMemo, useState } from 'react';
import SearchForm, { SearchFormValues } from '@components/SearchForm';
import SortControl, { SortBy, SortDir } from '@components/SortControl';
import Filters, { FilterValues } from '@components/Filters';
import RepoTable, { RepoItem } from '@components/RepoTable';
import Pagination, { PageChange } from '@components/Pagination';
import { getApiBaseUrl } from '@lib/config';
import { searchRepositories } from '@lib/api';
import type { SearchParams, PaginatedResponse, RepositorySummary } from '@lib/types';

/**
 * PUBLIC_INTERFACE
 * SearchPage
 * Full search experience for GitHub repositories:
 * - Query input, filters, and sorting controls
 * - Paginated results table with loading and error states
 * - Responsive layout using Tailwind utility classes
 */
export default function SearchPage() {
  // Query/filters state
  const [query, setQuery] = useState('');
  const [language, setLanguage] = useState('');
  const [minStars, setMinStars] = useState<number | ''>('');
  const [filters, setFilters] = useState<FilterValues>({
    hasIssues: false,
    hasLicense: false,
    archived: false
  });
  const [sortBy, setSortBy] = useState<SortBy>('stars');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  // Pagination state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Results state
  const [items, setItems] = useState<RepoItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const apiBase = getApiBaseUrl();

  function handleSubmit(values: SearchFormValues) {
    setQuery(values.q);
    setLanguage(values.language);
    setMinStars(values.minStars);
    setPage(1);
  }

  const handleSortChange = useCallback(
    (next: { sortBy: SortBy; sortDir: SortDir }) => {
      setSortBy(next.sortBy);
      setSortDir(next.sortDir);
      setPage(1);
    },
    []
  );

  const handlePageChange = useCallback((next: PageChange) => {
    setPage(next.page);
    setPageSize(next.pageSize);
  }, []);

  const requestParams = useMemo(() => {
    return {
      q: query,
      language,
      minStars,
      hasIssues: filters.hasIssues,
      hasLicense: filters.hasLicense,
      archived: filters.archived,
      sortBy,
      sortDir,
      page,
      pageSize
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, language, minStars, filters, sortBy, sortDir, page, pageSize]);

  // Fetch function: uses API client when configured; falls back to mock generation otherwise
  const fetchResults = useCallback(async () => {
    if (!requestParams.q) {
      setItems([]);
      setTotal(0);
      setErrorMsg(null);
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    try {
      let data: PaginatedResponse<RepositorySummary> | null = null;
      const baseConfigured = !!apiBase;

      if (baseConfigured) {
        const params: SearchParams = {
          q: requestParams.q,
          language: requestParams.language || undefined,
          minStars:
            requestParams.minStars !== '' && typeof requestParams.minStars === 'number'
              ? requestParams.minStars
              : undefined,
          hasIssues: requestParams.hasIssues || undefined,
          hasLicense: requestParams.hasLicense || undefined,
          archived: requestParams.archived || undefined,
          sortBy: requestParams.sortBy,
          sortDir: requestParams.sortDir,
          page: requestParams.page,
          pageSize: requestParams.pageSize
        };
        try {
          data = await searchRepositories(params);
        } catch (apiErr: any) {
          // If API request fails, fall back to mock
          data = null;
        }
      }

      if (!data) {
        // Client-side fallback: generate mock items and apply basic filters/sort/paginate
        const mock: RepoItem[] = Array.from({ length: 120 }).map((_, i) => {
          const langList = ['TypeScript', 'JavaScript', 'Python', 'Go', 'Rust', 'Java'];
          const lang = langList[i % langList.length];
          const stars = Math.floor(Math.random() * 5000);
          const forks = Math.floor(stars * 0.3);
          const issues = Math.floor(Math.random() * 200);
          const hasLicense = i % 3 !== 0;
          const archived = i % 10 === 0;
          return {
            id: i,
            name: `repo-${i}`,
            full_name: `owner/repo-${i}`,
            html_url: `https://github.com/owner/repo-${i}`,
            description: `Sample repository number ${i} in ${lang}.`,
            stargazers_count: stars,
            forks_count: forks,
            open_issues_count: issues,
            watchers_count: Math.floor(stars * 0.8),
            language: lang,
            license: hasLicense ? { name: 'MIT' } : null,
            updated_at: new Date(Date.now() - i * 86400000).toISOString(),
            archived
          };
        });

        let filtered = mock.filter((m) => m.full_name.toLowerCase().includes(requestParams.q.toLowerCase()));
        if (requestParams.language) filtered = filtered.filter((m) => m.language === requestParams.language);
        if (typeof requestParams.minStars === 'number')
          filtered = filtered.filter((m) => m.stargazers_count >= requestParams.minStars);
        if (requestParams.hasIssues) filtered = filtered.filter((m) => m.open_issues_count > 0);
        if (requestParams.hasLicense) filtered = filtered.filter((m) => !!m.license);
        if (requestParams.archived) filtered = filtered.filter((m) => m.archived);

        const sorted = [...filtered].sort((a, b) => {
          const dir = requestParams.sortDir === 'asc' ? 1 : -1;
          switch (requestParams.sortBy) {
            case 'name':
              return a.full_name.localeCompare(b.full_name) * dir;
            case 'forks':
              return (a.forks_count - b.forks_count) * dir;
            case 'updated':
              return new Date(a.updated_at || 0).getTime() - new Date(b.updated_at || 0).getTime();
            case 'stars':
            default:
              return (a.stargazers_count - b.stargazers_count) * dir;
          }
        });

        const totalFiltered = sorted.length;
        const start = (requestParams.page - 1) * requestParams.pageSize;
        const end = start + requestParams.pageSize;
        data = {
          items: sorted.slice(start, end),
          total: totalFiltered,
          page: requestParams.page,
          page_size: requestParams.pageSize
        };
      }

      setItems((data?.items as unknown as RepoItem[]) ?? []);
      setTotal(data?.total ?? 0);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Unexpected error during search.');
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [apiBase, requestParams]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  const hasSearched = query.trim().length > 0;

  return (
    <>
      <Head>
        <title>Search | Kavia GitHub Analytics</title>
      </Head>

      <section className="card p-6">
        <h2 className="text-xl font-semibold mb-4">Repository Search</h2>

        <div className="grid gap-4 md:grid-cols-[2fr_1fr]">
          {/* Left column: Search & Sort */}
          <div className="space-y-4">
            <SearchForm
              defaultQuery={query}
              defaultLanguage={language}
              defaultMinStars={minStars}
              onSubmit={handleSubmit}
              isLoading={loading}
            />
            <div className="flex flex-wrap items-center justify-between gap-3">
              <SortControl
                sortBy={sortBy}
                sortDir={sortDir}
                onChange={handleSortChange}
                disabled={loading || !hasSearched}
              />
              <div className="text-xs text-slate-400">
                Backend: {apiBase ? <code>{apiBase}</code> : <span className="italic">not configured</span>}
              </div>
            </div>
          </div>

          {/* Right column: Filter Pills */}
          <div className="space-y-2">
            <p className="text-xs text-slate-400">Quick Filters</p>
            <Filters values={filters} onChange={setFilters} disabled={loading || !hasSearched} />
          </div>
        </div>
      </section>

      <section className="card p-6 mt-6">
        <div className="mb-4">
          <Pagination
            page={page}
            pageSize={pageSize}
            total={total}
            onChange={({ page, pageSize }) => {
              setPage(page);
              setPageSize(pageSize);
            }}
            disabled={loading || !hasSearched}
          />
        </div>
        <RepoTable items={items} isLoading={loading && hasSearched} error={errorMsg} />
      </section>
    </>
  );
}
