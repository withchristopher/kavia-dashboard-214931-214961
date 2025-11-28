#!/usr/bin/env node
/**
 * E2E quick check script (node)
 * - Verifies NEXT_PUBLIC_API_BASE_URL presence (from process.env)
 * - Exercises backend endpoints /search, /repositories/{id}, /analytics with sample params
 * - Prints summary and exit code 0/1
 *
 * Usage:
 *   node scripts/e2e_check.js
 *
 * Note: This is not a browser E2E, but helps validate integration surface quickly.
 */
const http = require('node:http');
const https = require('node:https');
const { URL } = require('node:url');

function getEnvBase() {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL || '';
  return (base || '').replace(/\/+$/, '');
}

function httpFetch(urlStr, opts = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlStr);
    const lib = url.protocol === 'https:' ? https : http;
    const req = lib.request(
      url,
      { method: opts.method || 'GET', headers: { 'content-type': 'application/json', ...(opts.headers || {}) } },
      (res) => {
        let data = '';
        res.on('data', (d) => (data += d));
        res.on('end', () => {
          try {
            const json = data ? JSON.parse(data) : null;
            resolve({ status: res.statusCode, json });
          } catch {
            resolve({ status: res.statusCode, text: data });
          }
        });
      }
    );
    req.on('error', reject);
    if (opts.body) req.write(JSON.stringify(opts.body));
    req.end();
  });
}

(async function main() {
  const base = getEnvBase();
  if (!base) {
    console.log('NO_API_BASE: Set NEXT_PUBLIC_API_BASE_URL for a live backend check.');
    process.exit(0);
  }

  let ok = true;
  try {
    const health = await httpFetch(`${base}/`);
    console.log('Health:', health.status, health.json || health.text);

    const search = await httpFetch(
      `${base}/search?q=react&sort_by=stars&sort_dir=desc&page=1&page_size=10`
    );
    console.log('Search:', search.status, Array.isArray(search.json?.items) ? `items=${search.json.items.length}` : search.json);

    // Try to pick a repo id or full_name from search for details
    let repoKey = null;
    if (Array.isArray(search.json?.items) && search.json.items.length > 0) {
      const first = search.json.items[0];
      repoKey = first.full_name || first.id;
    }

    if (repoKey) {
      const details = await httpFetch(`${base}/repositories/${encodeURIComponent(repoKey)}`);
      console.log('Details:', details.status, details.json?.full_name || details.json);
    } else {
      console.log('Details: skipped (no search result)');
    }

    const analytics = await httpFetch(`${base}/analytics?q=react&page_size=20`);
    console.log('Analytics:', analytics.status, analytics.json ? 'OK' : analytics.text);

    if (
      health.status !== 200 ||
      search.status !== 200 ||
      (analytics.status !== 200 && analytics.status !== 204)
    ) {
      ok = false;
    }
  } catch (e) {
    console.error('E2E check error:', e?.message || e);
    ok = false;
  }
  process.exit(ok ? 0 : 1);
})();
