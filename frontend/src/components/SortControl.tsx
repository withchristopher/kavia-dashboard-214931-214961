import clsx from 'clsx';

/**
 * PUBLIC_INTERFACE
 * SortControl
 * A small control to select sort field and order for repository results.
 * Props:
 * - sortBy: 'stars' | 'forks' | 'updated' | 'name'
 * - sortDir: 'desc' | 'asc'
 * - onChange: callback with next { sortBy, sortDir }
 */
export type SortBy = 'stars' | 'forks' | 'updated' | 'name';
export type SortDir = 'desc' | 'asc';

// PUBLIC_INTERFACE
export default function SortControl({
  sortBy,
  sortDir,
  onChange,
  disabled
}: {
  sortBy: SortBy;
  sortDir: SortDir;
  onChange: (next: { sortBy: SortBy; sortDir: SortDir }) => void;
  disabled?: boolean;
}) {
  return (
    <div className={clsx('flex flex-wrap items-end gap-3', disabled && 'opacity-60')}>
      <div className="flex flex-col">
        <label className="text-xs text-slate-400 mb-1" htmlFor="sortBy">
          Sort by
        </label>
        <select
          id="sortBy"
          className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 outline-none focus:ring-2 focus:ring-primary-600"
          value={sortBy}
          onChange={(e) => onChange({ sortBy: e.target.value as SortBy, sortDir })}
          disabled={disabled}
        >
          <option value="stars">Stars</option>
          <option value="forks">Forks</option>
          <option value="updated">Last updated</option>
          <option value="name">Name</option>
        </select>
      </div>
      <div className="flex flex-col">
        <label className="text-xs text-slate-400 mb-1" htmlFor="sortDir">
          Order
        </label>
        <select
          id="sortDir"
          className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 outline-none focus:ring-2 focus:ring-primary-600"
          value={sortDir}
          onChange={(e) => onChange({ sortBy, sortDir: e.target.value as SortDir })}
          disabled={disabled}
        >
          <option value="desc">Desc</option>
          <option value="asc">Asc</option>
        </select>
      </div>
    </div>
  );
}
