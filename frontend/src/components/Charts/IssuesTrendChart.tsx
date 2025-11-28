import dynamic from 'next/dynamic';

const ResponsiveContainer = dynamic(async () => (await import('recharts')).ResponsiveContainer, { ssr: false });
const LineChart = dynamic(async () => (await import('recharts')).LineChart, { ssr: false });
const Line = dynamic(async () => (await import('recharts')).Line, { ssr: false });
const XAxis = dynamic(async () => (await import('recharts')).XAxis, { ssr: false });
const YAxis = dynamic(async () => (await import('recharts')).YAxis, { ssr: false });
const CartesianGrid = dynamic(async () => (await import('recharts')).CartesianGrid, { ssr: false });
const Tooltip = dynamic(async () => (await import('recharts')).Tooltip, { ssr: false });
const Legend = dynamic(async () => (await import('recharts')).Legend, { ssr: false });

/**
 * PUBLIC_INTERFACE
 * IssuesTrendChart
 * Renders a line chart of issues over time. Expects array of { date: string, open: number }.
 */
export default function IssuesTrendChart({ data }: { data: Array<{ date: string; open: number }> }) {
  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 16, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
          <XAxis dataKey="date" stroke="#94a3b8" />
          <YAxis stroke="#94a3b8" />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="open" name="Open issues" stroke="#57a9ff" strokeWidth={2} dot={{ r: 2 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
