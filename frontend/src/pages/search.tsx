import Head from 'next/head';
import { useCallback, useEffect, useMemo, useState } from 'react';
import SearchForm, { SearchFormValues } from '@components/SearchForm';
import SortControl, { SortBy, SortDir } from '@components/SortControl';
import Filters, { FilterValues } from '@components/Filters';
import RepoTable, { RepoItem } from '@components/RepoTable';
import Pagination, { PageChange } from '@components/Pagination';
import { getApiBaseUrl } from '@lib/config';

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

  // Fetch function: integrates with backend (placeholder endpoint for now)
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
      // NOTE:
      // Backend search endpoint is not yet specified; we mock a request to /api/search if available.
      // If the backend is not ready, we provide a client-side fallback with fake data filtered locally.
      const base = apiBase || '';
      const url = new URL((base || '') + '/search');
      url.searchParams.set('q', requestParams.q);
      if (requestParams.language) url.searchParams.set('language', requestParams.language);
      if (requestParams.minStars !== '' && typeof requestParams.minStars === 'number') {
        url.searchParams.set('min_stars', String(requestParams.minStars));
      }
      url.searchParams.set('sort_by', requestParams.sortBy);
      url.searchParams.set('sort_dir', requestParams.sortDir);
      url.searchParams.set('page', String(requestParams.page));
      url.searchParams.set('page_size', String(requestParams.pageSize));
      if (requestParams.hasIssues) url.searchParams.set('has_issues', 'true');
      if (requestParams.hasLicense) url.searchParams.set('has_license', 'true');
      if (requestParams.archived) url.searchParams.set('archived', 'true');

      let usedFallback = false;
      let data: { items: RepoItem[]; total: number } | null = null;

      if (base) {
        try {
          const r = await fetch(url.toString());
          if (r.ok) {
            data = (await r.json()) as { items: RepoItem[]; total: number };
          } else {
            usedFallback = true;
          }
        } catch {
          usedFallback = true;
        }
      } else {
        usedFallback = true;
      }

      if (usedFallback) {
        // Simple client-side fallback: generate mock items and apply basic filters/sort/paginate
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
              return ((new Date(a.updated_at || 0).getTime() - new Date(b.updated_at || 0).getTime()) * dir);
            case 'stars':
            default:
              return (a.stargazers_count - b.stargazers_count) * dir;
          }
        });

        const totalFiltered = sorted.length;
        const start = (requestParams.page - 1) * requestParams.pageSize;
        const end = start + requestParams.pageSize;
        data = { items: sorted.slice(start, end), total: totalFiltered };
      }

      setItems(data?.items ?? []);
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
