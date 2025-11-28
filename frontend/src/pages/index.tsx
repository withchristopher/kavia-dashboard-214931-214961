import Head from 'next/head';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useCallback } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Recharts requires window; dynamically import to avoid SSR issues on first load
const ResponsiveContainer = dynamic(
  async () => (await import('recharts')).ResponsiveContainer,
  { ssr: false }
);
const LineChart = dynamic(async () => (await import('recharts')).LineChart, {
  ssr: false
});
const Line = dynamic(async () => (await import('recharts')).Line, {
  ssr: false
});
const CartesianGrid = dynamic(
  async () => (await import('recharts')).CartesianGrid,
  { ssr: false }
);
const XAxis = dynamic(async () => (await import('recharts')).XAxis, {
  ssr: false
});
const YAxis = dynamic(async () => (await import('recharts')).YAxis, {
  ssr: false
});
const Tooltip = dynamic(async () => (await import('recharts')).Tooltip, {
  ssr: false
});
const Legend = dynamic(async () => (await import('recharts')).Legend, {
  ssr: false
});

const sampleData = [
  { name: 'Mon', stars: 12 },
  { name: 'Tue', stars: 18 },
  { name: 'Wed', stars: 9 },
  { name: 'Thu', stars: 22 },
  { name: 'Fri', stars: 17 },
  { name: 'Sat', stars: 25 },
  { name: 'Sun', stars: 14 }
];

/**
 * PUBLIC_INTERFACE
 * HomePage
 * Landing page that introduces the dashboard and provides a link to the repository search page.
 * It also includes a small demo chart and a PDF export button to validate core dependencies.
 */
export default function HomePage() {
  const handleExportPdf = useCallback(() => {
    const doc = new jsPDF();
    doc.text('Kavia GitHub Analytics - Sample Export', 14, 16);
    autoTable(doc, {
      startY: 22,
      head: [['Day', 'Stars']],
      body: sampleData.map((d) => [d.name, String(d.stars)])
    });
    doc.save('sample-report.pdf');
  }, []);

  return (
    <>
      <Head>
        <title>Kavia GitHub Analytics Dashboard</title>
      </Head>

      <section className="grid gap-6 md:grid-cols-2">
        <div className="card p-6">
          <h2 className="text-xl font-semibold mb-2">Welcome</h2>
          <p className="text-sm text-slate-300 mb-4">
            Explore public GitHub repositories, visualize metrics, and export reports to PDF.
            Use the Search page to get started.
          </p>
          <div className="flex items-center gap-3">
            <Link href="/search" className="btn">
              Go to Search
            </Link>
            <button type="button" className="btn" onClick={handleExportPdf}>
              Export Sample PDF
            </button>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="text-xl font-semibold mb-4">Sample Stars Trend</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sampleData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="stars" stroke="#2f8aff" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-slate-400 mt-3">
            This chart validates that Recharts works with Next.js (via dynamic imports).
          </p>
        </div>
      </section>

      <section className="card p-6 mt-6">
        <h3 className="font-semibold mb-2">Configuration</h3>
        <p className="text-sm text-slate-300">
          Backend API base URL is read from NEXT_PUBLIC_API_BASE_URL. Configure it in your .env.local file.
        </p>
      </section>
    </>
  );
}
