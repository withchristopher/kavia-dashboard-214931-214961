import { useCallback } from 'react';
import { exportReportPDF, PdfChartImage } from '@lib/pdf';

/**
 * PUBLIC_INTERFACE
 * PDFExportButton
 * A button that collects provided chart images and metadata, then exports a PDF.
 */
export default function PDFExportButton({
  title,
  description,
  stats,
  getChartImages,
  fileName,
  className
}: {
  /** PDF title and file name base */
  title: string;
  /** Optional description to appear under title */
  description?: string;
  /** Optional key/value summary stats */
  stats?: Array<{ key: string; value: string | number }>;
  /** Function to retrieve chart images (as data URLs) at export time */
  getChartImages: () => PdfChartImage[];
  /** Optional custom file name (no extension) */
  fileName?: string;
  /** Optional className for styling overrides */
  className?: string;
}) {
  const onExport = useCallback(() => {
    const charts = getChartImages();
    exportReportPDF({
      title,
      description,
      stats,
      charts,
      fileName
    });
  }, [title, description, stats, getChartImages, fileName]);

  return (
    <button type="button" className={className || 'btn'} onClick={onExport} aria-label="Export PDF">
      Export PDF
    </button>
  );
}
```

Explanation: Add Stars vs Forks scatter chart component
````write file="kavia-dashboard-214931-214961/frontend/src/components/Charts/StarsForksChart.tsx"
import dynamic from 'next/dynamic';
import { useMemo } from 'react';

const ResponsiveContainer = dynamic(async () => (await import('recharts')).ResponsiveContainer, { ssr: false });
const ScatterChart = dynamic(async () => (await import('recharts')).ScatterChart, { ssr: false });
const Scatter = dynamic(async () => (await import('recharts')).Scatter, { ssr: false });
const XAxis = dynamic(async () => (await import('recharts')).XAxis, { ssr: false });
const YAxis = dynamic(async () => (await import('recharts')).YAxis, { ssr: false });
const CartesianGrid = dynamic(async () => (await import('recharts')).CartesianGrid, { ssr: false });
const Tooltip = dynamic(async () => (await import('recharts')).Tooltip, { ssr: false });

/**
 * PUBLIC_INTERFACE
 * StarsForksChart
 * Renders a scatter chart of stargazers_count vs forks_count with optional labels.
 */
export default function StarsForksChart({
  data
}: {
  data: Array<{ name: string; stargazers_count: number; forks_count: number }>;
}) {
  const points = useMemo(
    () =>
      data.map((d) => ({
        x: d.stargazers_count,
        y: d.forks_count,
        name: d.name
      })),
    [data]
  );

  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
          <XAxis type="number" dataKey="x" name="Stars" stroke="#94a3b8" />
          <YAxis type="number" dataKey="y" name="Forks" stroke="#94a3b8" />
          <Tooltip cursor={{ strokeDasharray: '3 3' }} />
          <Scatter data={points} fill="#2f8aff" />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
