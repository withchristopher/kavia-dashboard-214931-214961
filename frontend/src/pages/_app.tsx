import type { AppProps } from 'next/app';
import Head from 'next/head';
import '../styles/globals.css';

/**
 * PUBLIC_INTERFACE
 * KaviaDashboardApp
 * This is the Next.js custom App component. It:
 * - Injects global metadata (title, description, viewport).
 * - Loads Tailwind global styles.
 * - Provides a simple container layout wrapper for all pages.
 */
export default function KaviaDashboardApp({ Component, pageProps }: AppProps) {
  const title = 'Kavia GitHub Analytics Dashboard';
  const description =
    'Visualize, search, and export analytics of GitHub repositories with charts and PDF export.';

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="min-h-screen">
        <header className="border-b border-slate-800 bg-slate-950/70 backdrop-blur sticky top-0 z-10">
          <div className="container-page py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-primary-600 text-white font-bold">
                K
              </span>
              <div>
                <h1 className="text-lg font-semibold">Kavia GitHub Analytics</h1>
                <p className="text-xs text-slate-400">
                  Repository search, insights, and exports
                </p>
              </div>
            </div>
            <nav className="text-sm">
              <a href="/" className="link mr-4">Home</a>
              <a href="/search" className="link">Search</a>
            </nav>
          </div>
        </header>
        <div className="container-page py-8">
          <Component {...pageProps} />
        </div>
        <footer className="mt-12 border-t border-slate-800 py-6 text-center text-sm text-slate-400">
          Built with Next.js, Tailwind CSS, Recharts, and jsPDF
        </footer>
      </main>
    </>
  );
}
