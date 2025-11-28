import { exportReportPDF, PdfChartImage } from '@lib/pdf';
import clsx from 'clsx';

export default function PDFExportButton({
  title,
  description,
  stats,
  getChartImages,
  fileName,
  disabled
}: {
  title: string;
  description?: string;
  stats?: Array<{ key: string; value: string | number }>;
  getChartImages: () => PdfChartImage[];
  fileName?: string;
  disabled?: boolean;
}) {
  function onClick() {
    if (disabled) return;
    const charts = getChartImages ? getChartImages() : [];
    exportReportPDF({
      title,
      description,
      stats,
      charts,
      fileName
    });
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={clsx(
        'px-3 py-2 rounded-md border border-slate-700 bg-slate-900 hover:bg-slate-800 text-sm',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
      aria-label="Export PDF"
      title="Export current view as PDF"
    >
      Export PDF
    </button>
  );
}
