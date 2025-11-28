import dynamic from 'next/dynamic';

const ResponsiveContainer = dynamic(async () => (await import('recharts')).ResponsiveContainer, { ssr: false });
const ScatterChart = dynamic(async () => (await import('recharts')).ScatterChart, { ssr: false });
const Scatter = dynamic(async () => (await import('recharts')).Scatter, { ssr: false });
const XAxis = dynamic(async () => (await import('recharts')).XAxis, { ssr: false });
const YAxis = dynamic(async () => (await import('recharts')).YAxis, { ssr: false });
const CartesianGrid = dynamic(async () => (await import('recharts')).CartesianGrid, { ssr: false });
const Tooltip = dynamic(async () => (await import('recharts')).Tooltip, { ssr: false });
const Legend = dynamic(async () => (await import('recharts')).Legend, { ssr: false });

/**
 * PUBLIC_INTERFACE
 * StarsForksChart
 * Simple scatter chart plotting stargazers_count vs forks_count.
 * data: Array<{ name: string; stargazers_count: number; forks_count: number }>
 */
export default function StarsForksChart({
  data
}: {
  data: Array<{ name: string; stargazers_count: number; forks_count: number }>;
}) {
  const points = data.map((d) => ({ x: d.stargazers_count, y: d.forks_count, name: d.name }));
  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 10, right: 16, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
          <XAxis dataKey="x" name="Stars" unit="" stroke="#94a3b8" />
          <YAxis dataKey="y" name="Forks" unit="" stroke="#94a3b8" />
          <Tooltip cursor={{ strokeDasharray: '3 3' }} />
          <Legend />
          <Scatter data={points} name="Repositories" fill="#2f8aff" />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
