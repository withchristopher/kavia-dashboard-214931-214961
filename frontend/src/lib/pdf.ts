import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * PUBLIC_INTERFACE
 * exportReportPDF
 * Exports a PDF report for a repository view.
 * Accepts a title, optional description, a table of key/value stats, and an array of canvas images (charts).
 */
export interface PdfChartImage {
  /** Base64-encoded PNG data URL for the chart image (e.g., canvas.toDataURL('image/png', 1.0)) */
  dataUrl: string;
  /** Optional caption printed under the chart */
  caption?: string;
  /** Optional width in PDF units (default keeps aspect ratio and fits to page width) */
  width?: number;
  /** Optional height in PDF units (default calculated to maintain aspect ratio) */
  height?: number;
}

export interface ExportReportOptions {
  /** Main title (e.g., repository full name) */
  title: string;
  /** Optional description to include under the title */
  description?: string;
  /** Optional key-value stats to render as a table */
  stats?: Array<{ key: string; value: string | number }>;
  /** Chart images to embed, ordered top-to-bottom */
  charts?: PdfChartImage[];
  /** Optional file name (without extension); defaults to sanitized title */
  fileName?: string;
}

// PUBLIC_INTERFACE
export function exportReportPDF(opts: ExportReportOptions) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const marginX = 40;
  const lineHeight = 16;
  const pageWidth = doc.internal.pageSize.getWidth();
  const usableWidth = pageWidth - marginX * 2;
  let cursorY = 48;

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text(opts.title || 'Repository Report', marginX, cursorY);
  cursorY += 20;

  // Description
  if (opts.description) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    const lines = doc.splitTextToSize(opts.description, usableWidth);
    doc.text(lines, marginX, cursorY);
    cursorY += lines.length * lineHeight + 6;
  }

  // Stats table
  if (opts.stats && opts.stats.length > 0) {
    autoTable(doc, {
      startY: cursorY,
      margin: { left: marginX, right: marginX },
      head: [['Metric', 'Value']],
      body: opts.stats.map((s) => [String(s.key), String(s.value)]),
      styles: { fontSize: 10, cellPadding: 6 },
      headStyles: { fillColor: [23, 107, 255] }
    });
    cursorY = (doc as any).lastAutoTable.finalY + 16;
  }

  // Charts
  if (opts.charts && opts.charts.length > 0) {
    for (const chart of opts.charts) {
      const maxWidth = Math.min(usableWidth, chart.width || usableWidth);
      const defaultHeight = 260;
      const height = chart.height || defaultHeight;

      // Add new page if not enough space
      if (cursorY + height + 60 > doc.internal.pageSize.getHeight()) {
        doc.addPage();
        cursorY = 48;
      }

      // Render image
      try {
        doc.addImage(chart.dataUrl, 'PNG', marginX, cursorY, maxWidth, height, undefined, 'FAST');
        cursorY += height + 8;

        if (chart.caption) {
          doc.setFont('helvetica', 'italic');
          doc.setFontSize(10);
          const capLines = doc.splitTextToSize(chart.caption, usableWidth);
          doc.text(capLines, marginX, cursorY);
          cursorY += capLines.length * lineHeight;
        }
        cursorY += 12;
      } catch {
        // If addImage fails, skip image and note error
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text('Failed to render chart image.', marginX, cursorY);
        cursorY += 24;
      }
    }
  }

  const safeName = (opts.fileName || opts.title || 'report')
    .replace(/[^\w\-]+/g, '-')
    .replace(/-+/g, '-')
    .toLowerCase();

  doc.save(`${safeName}.pdf`);
}
