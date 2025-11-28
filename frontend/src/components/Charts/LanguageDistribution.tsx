import dynamic from 'next/dynamic';

const ResponsiveContainer = dynamic(async () => (await import('recharts')).ResponsiveContainer, { ssr: false });
const PieChart = dynamic(async () => (await import('recharts')).PieChart, { ssr: false });
const Pie = dynamic(async () => (await import('recharts')).Pie, { ssr: false });
const Cell = dynamic(async () => (await import('recharts')).Cell, { ssr: false });
const Tooltip = dynamic(async () => (await import('recharts')).Tooltip, { ssr: false });
const Legend = dynamic(async () => (await import('recharts')).Legend, { ssr: false });

const COLORS = ['#2f8aff', '#57a9ff', '#89c6ff', '#b8dcff', '#0e56f0', '#0e46c5', '#123c9b'];

/**
 * PUBLIC_INTERFACE
 * LanguageDistribution
 * Renders a pie chart showing percentage distribution for languages.
 */
export default function LanguageDistribution({
  data
}: {
  data: Array<{ language: string; count: number }>;
}) {
  const total = data.reduce((acc, d) => acc + d.count, 0) || 1;
  const withPct = data.map((d) => ({ ...d, pct: Math.round((d.count / total) * 100) }));

  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={withPct} dataKey="count" nameKey="language" cx="50%" cy="50%" outerRadius="80%">
            {withPct.map((_, i) => (
              <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
