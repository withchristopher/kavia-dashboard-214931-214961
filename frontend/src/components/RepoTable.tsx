import clsx from 'clsx';

/**
 * PUBLIC_INTERFACE
 * RepoTable
 * Displays a table of repositories with key metadata.
 * Props:
 * - items: array of repositories
 * - isLoading: whether data is loading (shows skeleton rows)
 * - error: optional error string to display
 */
export interface RepoItem {
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

function formatDate(s?: string) {
  if (!s) return '—';
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return s;
  return d.toLocaleDateString();
}

// PUBLIC_INTERFACE
export default function RepoTable({
  items,
  isLoading,
  error
}: {
  items: RepoItem[];
  isLoading?: boolean;
  error?: string | null;
}) {
  if (error) {
    return (
      <div className="p-4 rounded-md border border-red-800 bg-red-950/50 text-red-200">
        {error}
      </div>
    );
  }

  if (!isLoading && items.length === 0) {
    return (
      <div className="p-6 text-sm text-slate-400">
        No repositories found. Try adjusting your search or filters.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="text-left text-slate-400 border-b border-slate-800">
            <th className="py-3 pr-4">Repository</th>
            <th className="py-3 px-4">Stars</th>
            <th className="py-3 px-4">Forks</th>
            <th className="py-3 px-4">Issues</th>
            <th className="py-3 px-4">Lang</th>
            <th className="py-3 px-4">License</th>
            <th className="py-3 px-4">Updated</th>
          </tr>
        </thead>
        <tbody>
          {isLoading
            ? Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
            : items.map((r) => (
                <tr key={r.id} className="border-b border-slate-800/60">
                  <td className="py-3 pr-4">
                    <a
                      href={r.html_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary-400 hover:text-primary-300 underline underline-offset-2"
                    >
                      {r.full_name || r.name}
                    </a>
                    {r.archived && (
                      <span className="ml-2 text-xs rounded px-1.5 py-0.5 border border-amber-700 bg-amber-900/30 text-amber-200">
                        archived
                      </span>
                    )}
                    <p className="text-slate-400 text-xs mt-1 line-clamp-2">{r.description || '—'}</p>
                  </td>
                  <td className="py-3 px-4">{r.stargazers_count}</td>
                  <td className="py-3 px-4">{r.forks_count}</td>
                  <td className="py-3 px-4">{r.open_issues_count}</td>
                  <td className="py-3 px-4">{r.language || '—'}</td>
                  <td className="py-3 px-4">{r.license?.name || '—'}</td>
                  <td className="py-3 px-4 whitespace-nowrap">{formatDate(r.updated_at)}</td>
                </tr>
              ))}
        </tbody>
      </table>
    </div>
  );
}

function SkeletonRow() {
  return (
    <tr className="border-b border-slate-800/60">
      {Array.from({ length: 7 }).map((_, i) => (
        <td key={i} className="py-3 px-4">
          <div className={clsx('h-4 w-full bg-slate-800 animate-pulse rounded', i === 0 && 'w-2/3')}></div>
        </td>
      ))}
    </tr>
  );
}
