# Kavia GitHub Analytics Dashboard (Frontend)

A Next.js (TypeScript) dashboard for visualizing, searching, and exporting analytics of GitHub repositories. This frontend consumes the FastAPI backend (RepositorySearch) and provides charts and PDF export.

## Tech Stack

- Next.js 14 (React 18, TypeScript)
- Tailwind CSS
- Recharts (charts)
- jsPDF + jspdf-autotable (PDF export)

## Prerequisites

- Node.js >= 18.18.0
- npm or yarn

## Getting Started

1. Install dependencies:

   npm install

2. Configure environment:

   - Copy .env.local.example to .env.local
   - Set NEXT_PUBLIC_API_BASE_URL to your backend base URL (e.g., http://localhost:3001)

3. Run development server:

   npm run dev

   Open http://localhost:3000 in your browser.

4. Build for production:

   npm run build

5. Start production server:

   npm start

## Project Structure

- src/pages/_app.tsx — App entry with global styles and layout.
- src/pages/index.tsx — Landing page with link to /search and sample chart/PDF export.
- src/pages/repositories/[id].tsx — Repository detail page with charts and PDF export.
- src/components/Charts/* — Recharts-based chart components used across pages.
- src/components/PDFExportButton.tsx — Button to export current view as a PDF using jsPDF.
- src/lib/pdf.ts — Utility to assemble PDF with stats and embedded chart images.
- src/styles/globals.css — Tailwind base styles and theme.
- tailwind.config.ts — Tailwind configuration.
- postcss.config.js — PostCSS configuration.
- next.config.js — Next.js configuration.
- .env.local.example — Environment variables template.

## Environment Variables

- NEXT_PUBLIC_API_BASE_URL: Public base URL for the backend (FastAPI RepositorySearch).

Note: Public (NEXT_PUBLIC_) variables are exposed to the browser. Do not place secrets here.

## Linting and Formatting

- Lint: npm run lint
- Format: npm run format

## Notes

- The favicon currently uses a placeholder file at public/favicon.ico. Replace with your own ICO file as needed.
- Recharts components are loaded with dynamic imports to avoid SSR issues.

## License

MIT
