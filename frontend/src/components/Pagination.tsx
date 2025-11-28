import clsx from 'clsx';

/**
 * PUBLIC_INTERFACE
 * Pagination
 * Displays page controls with previous/next and current page indicator.
 * Props:
 * - page: current page (1-based)
 * - pageSize: items per page
 * - total: total items count
 * - onChange: callback with next { page, pageSize }
 * - disabled: disable interactions
 */
export interface PageChange {
  page: number;
  pageSize: number;
}

// PUBLIC_INTERFACE
export default function Pagination({
  page,
  pageSize,
  total,
  onChange,
  disabled
}: {
  page: number;
  pageSize: number;
  total: number;
  onChange: (next: PageChange) => void;
  disabled?: boolean;
}) {
  const totalPages = Math.max(1, Math.ceil(total / Math.max(1, pageSize)));
  const canPrev = page > 1;
  const canNext = page < totalPages;

  function setPage(p: number) {
    const bounded = Math.min(Math.max(1, p), totalPages);
    onChange({ page: bounded, pageSize });
  }

  function setPageSize(ps: number) {
    const nextTotalPages = Math.max(1, Math.ceil(total / Math.max(1, ps)));
    const nextPage = Math.min(page, nextTotalPages);
    onChange({ page: nextPage, pageSize: ps });
  }

  return (
    <div className={clsx('flex flex-wrap items-center justify-between gap-3', disabled && 'opacity-60')}>
      <div className="text-xs text-slate-400">
        Page {page} of {totalPages} • {total} results
      </div>
      <div className="flex items-center gap-2">
        <label className="text-xs text-slate-400">Rows per page</label>
        <select
          value={pageSize}
          onChange={(e) => setPageSize(Number(e.target.value))}
          disabled={disabled}
          className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1 outline-none focus:ring-2 focus:ring-primary-600"
        >
          {[10, 20, 30, 50, 100].map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
        <div className="flex items-center gap-2 ml-2">
          <button
            type="button"
            onClick={() => setPage(page - 1)}
            disabled={disabled || !canPrev}
            className="px-3 py-1 rounded-md border border-slate-700 bg-slate-900 hover:bg-slate-800 disabled:opacity-50"
            aria-label="Previous page"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => setPage(page + 1)}
            disabled={disabled || !canNext}
            className="px-3 py-1 rounded-md border border-slate-700 bg-slate-900 hover:bg-slate-800 disabled:opacity-50"
            aria-label="Next page"
          >
            ›
          </button>
        </div>
      </div>
    </div>
  );
}
