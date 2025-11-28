import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect, useMemo, useRef, useState } from 'react';
import StarsForksChart from '@components/Charts/StarsForksChart';
import IssuesTrendChart from '@components/Charts/IssuesTrendChart';
import LanguageDistribution from '@components/Charts/LanguageDistribution';
import PDFExportButton from '@components/PDFExportButton';
import { getApiBaseUrl } from '@lib/config';

type RepoDetails = {
  id: number | string;
  full_name: string;
  name: string;
  description?: string;
  html_url: string;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  watchers_count?: number;
  language?: string;
  license?: { key?: string; name?: string } | null;
  topics?: string[];
  updated_at?: string;
  owner?: { login?: string };
};

function formatDate(s?: string) {
  if (!s) return '—';
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return s;
  return d.toLocaleString();
}

/**
 * PUBLIC_INTERFACE
 * RepositoryDetailPage
 * Shows details of a single repository, including overview stats and charts.
 * Includes loading and error states and a PDF export button that captures current charts.
 */
export default function RepositoryDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const apiBase = getApiBaseUrl();

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [repo, setRepo] = useState<RepoDetails | null>(null);

  // Mock/fallback trends and language data if API isn't available
  const [issuesTrend, setIssuesTrend] = useState<Array<{ date: string; open: number }>>([]);
  const [languages, setLanguages] = useState<Array<{ language: string; count: number }>>([]);

  // Canvas refs for exporting charts
  const starsForksCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const issuesCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const langCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Capture chart canvases using query from containers
  useEffect(() => {
    // Recharts renders <svg>, but for PDF image export we can snapshot the container as a canvas.
    // For simplicity we rely on <canvas> overlays that mirror data via custom rendering.
    // To keep it simple and robust for CI, we'll draw lightweight static canvases that represent the charts.
    // The visible charts are SVG via Recharts; these canvases are hidden but used to export.
    function drawStarsForks() {
      const c = starsForksCanvasRef.current;
      if (!c || !repo) return;
      const ctx = c.getContext('2d');
      if (!ctx) return;
      const w = (c.width = 800);
      const h = (c.height = 320);
      ctx.fillStyle = '#0b1220';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#e5e7eb';
      ctx.font = '16px sans-serif';
      ctx.fillText('Stars vs Forks', 16, 24);

      // Draw axes
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(50, h - 40);
      ctx.lineTo(w - 20, h - 40);
      ctx.moveTo(50, 40);
      ctx.lineTo(50, h - 40);
      ctx.stroke();

      // Plot a single point for this repo
      const maxStars = Math.max(10, repo.stargazers_count);
      const maxForks = Math.max(10, repo.forks_count);
      const x = 50 + ((w - 80) * repo.stargazers_count) / maxStars;
      const y = h - 40 - ((h - 80) * repo.forks_count) / maxForks;

      ctx.fillStyle = '#2f8aff';
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#94a3b8';
      ctx.font = '12px sans-serif';
      ctx.fillText(`Stars: ${repo.stargazers_count}`, 60, h - 18);
      ctx.fillText(`Forks: ${repo.forks_count}`, 160, h - 18);
    }

    function drawIssues() {
      const c = issuesCanvasRef.current;
      if (!c || issuesTrend.length === 0) return;
      const ctx = c.getContext('2d');
      if (!ctx) return;
      const w = (c.width = 800);
      const h = (c.height = 320);
      ctx.fillStyle = '#0b1220';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#e5e7eb';
      ctx.font = '16px sans-serif';
      ctx.fillText('Issues Trend', 16, 24);

      // Axes
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(50, h - 40);
      ctx.lineTo(w - 20, h - 40);
      ctx.moveTo(50, 40);
      ctx.lineTo(50, h - 40);
      ctx.stroke();

      const maxVal = Math.max(...issuesTrend.map((d) => d.open), 10);
      const stepX = (w - 80) / Math.max(1, issuesTrend.length - 1);

      ctx.strokeStyle = '#57a9ff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      issuesTrend.forEach((d, i) => {
        const x = 50 + i * stepX;
        const y = h - 40 - ((h - 80) * d.open) / maxVal;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
    }

    function drawLanguages() {
      const c = langCanvasRef.current;
      if (!c || languages.length === 0) return;
      const ctx = c.getContext('2d');
      if (!ctx) return;
      const w = (c.width = 800);
      const h = (c.height = 320);
      ctx.fillStyle = '#0b1220';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#e5e7eb';
      ctx.font = '16px sans-serif';
      ctx.fillText('Language Distribution', 16, 24);

      // Draw simple stacked bars
      const total = languages.reduce((acc, d) => acc + d.count, 0) || 1;
      let x = 50;
      const y = h / 2;
      const barHeight = 28;
      languages.forEach((d, i) => {
        const wSeg = ((w - 100) * d.count) / total;
        ctx.fillStyle = ['#2f8aff', '#57a9ff', '#89c6ff', '#b8dcff', '#0e56f0', '#0e46c5', '#123c9b'][i % 7];
        ctx.fillRect(x, y, wSeg, barHeight);
        x += wSeg + 1;
      });

      // Legend
      ctx.font = '12px sans-serif';
      let lx = 50;
      let ly = y + barHeight + 24;
      languages.forEach((d, i) => {
        ctx.fillStyle = ['#2f8aff', '#57a9ff', '#89c6ff', '#b8dcff', '#0e56f0', '#0e46c5', '#123c9b'][i % 7];
        ctx.fillRect(lx, ly - 10, 12, 12);
        ctx.fillStyle = '#cbd5e1';
        ctx.fillText(`${d.language} (${Math.round((d.count / total) * 100)}%)`, lx + 18, ly);
        lx += 180;
        if (lx > w - 160) {
          lx = 50;
          ly += 18;
        }
      });
    }

    drawStarsForks();
    drawIssues();
    drawLanguages();
  }, [repo, issuesTrend, languages]);

  // Fetch repository details
  useEffect(() => {
    async function load() {
      if (!id) return;
      setLoading(true);
      setErrorMsg(null);
      try {
        // Backend endpoint example: /repositories/{id}
        // Since API is not defined in this template, we use fallback mock data.
        let fetched: RepoDetails | null = null;
        if (apiBase) {
          try {
            const url = `${apiBase}/repositories/${id}`;
            const r = await fetch(url);
            if (r.ok) {
              fetched = (await r.json()) as RepoDetails;
            }
          } catch {
            // swallow to fallback
          }
        }
        if (!fetched) {
          // Fallback mock
          const num = Number(id) || 1;
          fetched = {
            id: id as string,
            name: `repo-${id}`,
            full_name: `owner/repo-${id}`,
            html_url: `https://github.com/owner/repo-${id}`,
            description: `This is a mock repository for id ${id}.`,
            stargazers_count: 300 + (num % 200),
            forks_count: 80 + (num % 120),
            open_issues_count: 12 + (num % 30),
            watchers_count: 250 + (num % 150),
            language: ['TypeScript', 'JavaScript', 'Python', 'Go', 'Rust'][num % 5],
            license: { name: 'MIT' },
            updated_at: new Date().toISOString(),
            owner: { login: 'owner' },
            topics: ['template', 'analytics', 'dashboard']
          };
        }
        setRepo(fetched);

        // Mock trend data for issues (last 10 weeks)
        const trend = Array.from({ length: 10 }).map((_, i) => ({
          date: new Date(Date.now() - (9 - i) * 7 * 86400000).toLocaleDateString(),
          open: Math.max(0, Math.round((fetched!.open_issues_count || 0) * (0.6 + Math.random() * 0.8)))
        }));
        setIssuesTrend(trend);

        // Mock language distribution (if API not provided)
        const langs = [
          { language: 'TypeScript', count: 45 },
          { language: 'JavaScript', count: 25 },
          { language: 'Python', count: 15 },
          { language: 'Go', count: 8 },
          { language: 'Other', count: 7 }
        ];
        setLanguages(langs);
      } catch (err: any) {
        setErrorMsg(err?.message || 'Failed to load repository details.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, apiBase]);

  const stats = useMemo(
    () =>
      repo
        ? [
            { key: 'Repository', value: repo.full_name },
            { key: 'Stars', value: repo.stargazers_count },
            { key: 'Forks', value: repo.forks_count },
            { key: 'Open issues', value: repo.open_issues_count },
            { key: 'Watchers', value: repo.watchers_count ?? '—' },
            { key: 'Language', value: repo.language || '—' },
            { key: 'License', value: repo.license?.name || '—' },
            { key: 'Updated', value: formatDate(repo.updated_at) }
          ]
        : [],
    [repo]
  );

  const getChartImages = () => {
    // Convert canvases to base64 PNG for PDF
    const images = [];
    if (starsForksCanvasRef.current) {
      images.push({ dataUrl: starsForksCanvasRef.current.toDataURL('image/png', 1.0), caption: 'Stars vs Forks' });
    }
    if (issuesCanvasRef.current) {
      images.push({ dataUrl: issuesCanvasRef.current.toDataURL('image/png', 1.0), caption: 'Issues Trend' });
    }
    if (langCanvasRef.current) {
      images.push({ dataUrl: langCanvasRef.current.toDataURL('image/png', 1.0), caption: 'Language Distribution' });
    }
    return images;
  };

  return (
    <>
      <Head>
        <title>
          {repo ? `${repo.full_name} | Repository | Kavia Analytics` : 'Repository | Kavia Analytics'}
        </title>
      </Head>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Repository Details</h2>
        <PDFExportButton
          title={repo?.full_name || 'Repository'}
          description={repo?.description}
          stats={stats}
          getChartImages={getChartImages}
          fileName={repo?.full_name || 'repository'}
        />
      </div>

      {loading && (
        <div className="p-4 rounded-md border border-slate-700 bg-slate-900/60 animate-pulse">Loading repository...</div>
      )}
      {errorMsg && (
        <div className="p-4 rounded-md border border-red-800 bg-red-950/50 text-red-200">{errorMsg}</div>
      )}
      {!loading && !errorMsg && repo && (
        <>
          <section className="card p-6">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold">
                  <a href={repo.html_url} target="_blank" rel="noreferrer" className="link">
                    {repo.full_name}
                  </a>
                </h3>
                <p className="text-sm text-slate-300 mt-1">{repo.description || '—'}</p>
                {repo.topics && repo.topics.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {repo.topics.map((t) => (
                      <span
                        key={t}
                        className="text-xs rounded px-2 py-0.5 border border-slate-700 bg-slate-900 text-slate-300"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm md:text-base md:grid-cols-4">
                <Metric label="Stars" value={repo.stargazers_count} />
                <Metric label="Forks" value={repo.forks_count} />
                <Metric label="Open issues" value={repo.open_issues_count} />
                <Metric label="Watchers" value={repo.watchers_count ?? '—'} />
              </div>
            </div>
            <div className="mt-4 grid gap-3 text-sm md:grid-cols-3">
              <div>
                <span className="text-slate-400">Language</span>
                <div>{repo.language || '—'}</div>
              </div>
              <div>
                <span className="text-slate-400">License</span>
                <div>{repo.license?.name || '—'}</div>
              </div>
              <div>
                <span className="text-slate-400">Last updated</span>
                <div>{formatDate(repo.updated_at)}</div>
              </div>
            </div>
          </section>

          <section className="grid gap-6 mt-6 lg:grid-cols-2">
            <div className="card p-6">
              <h4 className="font-semibold mb-3">Stars vs Forks</h4>
              <StarsForksChart
                data={[
                  {
                    name: repo.name,
                    stargazers_count: repo.stargazers_count,
                    forks_count: repo.forks_count
                  }
                ]}
              />
            </div>
            <div className="card p-6">
              <h4 className="font-semibold mb-3">Issues Over Time</h4>
              <IssuesTrendChart data={issuesTrend} />
            </div>
            <div className="card p-6 lg:col-span-2">
              <h4 className="font-semibold mb-3">Language Distribution</h4>
              <LanguageDistribution data={languages} />
            </div>
          </section>

          {/* Hidden canvases used exclusively for PDF export snapshots to ensure consistent PDF images */}
          <div className="sr-only" aria-hidden="true">
            <canvas ref={starsForksCanvasRef} />
            <canvas ref={issuesCanvasRef} />
            <canvas ref={langCanvasRef} />
          </div>
        </>
      )}
    </>
  );
}

function Metric({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-md border border-slate-800 bg-slate-900/50 p-3 text-center">
      <div className="text-xs text-slate-400">{label}</div>
      <div className="text-lg font-semibold">{value}</div>
    </div>
  );
}
