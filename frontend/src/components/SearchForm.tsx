import { useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';

/**
 * PUBLIC_INTERFACE
 * SearchForm
 * A controlled search form with query input, language select, min stars filter, and submit/reset buttons.
 * Props:
 * - defaultQuery: initial query string
 * - defaultLanguage: initial language selection
 * - defaultMinStars: initial minimum stars
 * - onSubmit: callback invoked with { q, language, minStars } when user submits
 * - isLoading: whether the parent is in loading state (disables inputs and shows spinner on button)
 */
export interface SearchFormValues {
  q: string;
  language: string;
  minStars: number | '';
}
export function parseNumberSafe(v: string): number | '' {
  if (v.trim() === '') return '';
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : '';
}

// PUBLIC_INTERFACE
export default function SearchForm({
  defaultQuery = '',
  defaultLanguage = '',
  defaultMinStars = '',
  onSubmit,
  isLoading
}: {
  defaultQuery?: string;
  defaultLanguage?: string;
  defaultMinStars?: number | '';
  onSubmit: (values: SearchFormValues) => void;
  isLoading?: boolean;
}) {
  const [q, setQ] = useState(defaultQuery);
  const [language, setLanguage] = useState(defaultLanguage);
  const [minStars, setMinStars] = useState<number | ''>(defaultMinStars);

  useEffect(() => {
    setQ(defaultQuery);
  }, [defaultQuery]);
  useEffect(() => {
    setLanguage(defaultLanguage);
  }, [defaultLanguage]);
  useEffect(() => {
    setMinStars(defaultMinStars);
  }, [defaultMinStars]);

  const isDisabled = !!isLoading;
  const isValid = useMemo(() => q.trim().length > 0, [q]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid) return;
    onSubmit({ q: q.trim(), language: language.trim(), minStars });
  }

  function handleReset() {
    setQ('');
    setLanguage('');
    setMinStars('');
    onSubmit({ q: '', language: '', minStars: '' });
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-3 md:grid-cols-[1fr_200px_160px_auto] items-end">
      <div className="flex flex-col">
        <label htmlFor="q" className="text-xs text-slate-400 mb-1">
          Repository keywords
        </label>
        <input
          id="q"
          name="q"
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="e.g. nextjs tailwind template"
          className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 outline-none focus:ring-2 focus:ring-primary-600"
          disabled={isDisabled}
        />
      </div>
      <div className="flex flex-col">
        <label htmlFor="language" className="text-xs text-slate-400 mb-1">
          Language
        </label>
        <select
          id="language"
          name="language"
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 outline-none focus:ring-2 focus:ring-primary-600"
          disabled={isDisabled}
        >
          <option value="">Any</option>
          <option value="TypeScript">TypeScript</option>
          <option value="JavaScript">JavaScript</option>
          <option value="Python">Python</option>
          <option value="Go">Go</option>
          <option value="Java">Java</option>
          <option value="Rust">Rust</option>
        </select>
      </div>
      <div className="flex flex-col">
        <label htmlFor="minStars" className="text-xs text-slate-400 mb-1">
          Min stars
        </label>
        <input
          id="minStars"
          name="minStars"
          type="number"
          min={0}
          value={minStars}
          onChange={(e) => setMinStars(parseNumberSafe(e.target.value))}
          placeholder="e.g. 100"
          className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 outline-none focus:ring-2 focus:ring-primary-600"
          disabled={isDisabled}
        />
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          className={clsx('btn', 'w-full md:w-auto', !isValid && 'opacity-60 cursor-not-allowed')}
          disabled={!isValid || isDisabled}
          aria-disabled={!isValid || isDisabled}
        >
          {isLoading ? (
            <span className="inline-flex items-center gap-2">
              <Spinner /> Searching...
            </span>
          ) : (
            'Search'
          )}
        </button>
        <button
          type="button"
          onClick={handleReset}
          className="inline-flex items-center gap-2 rounded-md border border-slate-700 bg-slate-900 hover:bg-slate-800 px-4 py-2 transition-colors"
          disabled={isDisabled}
        >
          Reset
        </button>
      </div>
    </form>
  );
}

function Spinner() {
  return (
    <svg
      className="h-4 w-4 animate-spin text-white"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
      />
    </svg>
  );
}
