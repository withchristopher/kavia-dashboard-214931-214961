import Head from 'next/head';

/**
 * PUBLIC_INTERFACE
 * SearchPage
 * Placeholder page for the repository search UI. This will be expanded in subsequent tasks.
 */
export default function SearchPage() {
  return (
    <>
      <Head>
        <title>Search | Kavia GitHub Analytics</title>
      </Head>
      <section className="card p-6">
        <h2 className="text-xl font-semibold mb-2">Repository Search</h2>
        <p className="text-sm text-slate-300">
          This is a placeholder for the search interface. The page will allow you to search for GitHub
          repositories, filter results, and view analytics.
        </p>
      </section>
    </>
  );
}
