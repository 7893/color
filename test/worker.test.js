import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import worker, { SECURITY_HEADERS } from '../worker/index.js';

function assertSecurityHeaders(response) {
  for (const [name, expected] of Object.entries(SECURITY_HEADERS)) {
    assert.equal(
      response.headers.get(name),
      expected,
      `Missing or mismatched header ${name}`
    );
  }
  assert.equal(response.headers.get('X-XSS-Protection'), null);
}

test('the retired snapshot endpoint cannot access storage or assets', async () => {
  const env = new Proxy({}, { get() { throw Error('Unexpected binding access'); } });

  for (const method of ['GET', 'HEAD']) {
    const response = await worker.fetch(new Request('https://example.test/api/snapshots', { method }), env);
    assert.equal(response.status, 404);
    assert.equal(response.headers.get('Cache-Control'), 'no-store');
    assertSecurityHeaders(response);
    if (method === 'HEAD') {
      assert.equal(await response.text(), '');
    }
  }

  for (const method of ['POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']) {
    const response = await worker.fetch(new Request('https://example.test/api/snapshots', { method }), env);
    assert.equal(response.status, 405);
    assert.equal(response.headers.get('Allow'), 'GET, HEAD');
    assert.equal(response.headers.get('Cache-Control'), 'no-store');
    assertSecurityHeaders(response);
  }
});

test('non-GET/HEAD requests are rejected with 405 and Allow header on all paths', async () => {
  const env = new Proxy({}, { get() { throw Error('Unexpected binding access'); } });
  for (const method of ['POST', 'PUT', 'DELETE', 'OPTIONS']) {
    const response = await worker.fetch(new Request('https://example.test/', { method }), env);
    assert.equal(response.status, 405);
    assert.equal(response.headers.get('Allow'), 'GET, HEAD');
    assertSecurityHeaders(response);
  }
});

test('serves GET and HEAD pages through assets binding with full security headers', async () => {
  const env = {
    ASSETS: {
      fetch: async () => new Response('<html>Color</html>', {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'X-XSS-Protection': '1; mode=block',
        },
      }),
    },
  };

  const getRes = await worker.fetch(new Request('https://example.test/'), env);
  assert.equal(getRes.status, 200);
  assert.equal(await getRes.text(), '<html>Color</html>');
  assertSecurityHeaders(getRes);

  const headRes = await worker.fetch(new Request('https://example.test/', { method: 'HEAD' }), env);
  assert.equal(headRes.status, 200);
  assert.equal(await headRes.text(), '');
  assertSecurityHeaders(headRes);
});

test('unknown paths and missing assets return proper 404 with security headers (no soft-404)', async () => {
  const paths = [];
  const env = {
    ASSETS: {
      fetch: async (request) => {
        const path = new URL(request.url).pathname;
        paths.push(path);
        return new Response('Not found', { status: 404 });
      },
    },
  };

  const page = await worker.fetch(new Request('https://example.test/unknown'), env);
  assert.equal(page.status, 404);
  assert.equal(page.headers.get('Cache-Control'), 'no-store');
  assertSecurityHeaders(page);
  assert.deepEqual(paths, ['/unknown']);

  paths.length = 0;
  const file = await worker.fetch(new Request('https://example.test/missing.js'), env);
  assert.equal(file.status, 404);
  assert.equal(file.headers.get('Cache-Control'), 'no-store');
  assertSecurityHeaders(file);
  assert.deepEqual(paths, ['/missing.js']);

  const headMissing = await worker.fetch(new Request('https://example.test/unknown', { method: 'HEAD' }), env);
  assert.equal(headMissing.status, 404);
  assert.equal(await headMissing.text(), '');
  assertSecurityHeaders(headMissing);
});

test('public/_headers defines full security headers and explicit cache rules', () => {
  const raw = readFileSync(new URL('../public/_headers', import.meta.url), 'utf8');
  const sections = new Map();
  let currentPath = null;

  for (const rawLine of raw.split(/\r?\n/)) {
    const line = rawLine.trimEnd();
    if (!line.trim() || line.trim().startsWith('#')) continue;
    if (!/^\s/.test(line)) {
      currentPath = line.trim();
      sections.set(currentPath, new Map());
    } else if (currentPath) {
      const idx = line.indexOf(':');
      assert.ok(idx > 0, `Invalid header line: ${line}`);
      const name = line.slice(0, idx).trim();
      const value = line.slice(idx + 1).trim();
      sections.get(currentPath).set(name, value);
    }
  }

  const globalHeaders = sections.get('/*');
  assert.ok(globalHeaders, 'Missing /* section in public/_headers');
  for (const [name, expected] of Object.entries(SECURITY_HEADERS)) {
    assert.equal(globalHeaders.get(name), expected, `public/_headers mismatch for ${name}`);
  }
  assert.equal(globalHeaders.has('X-XSS-Protection'), false);

  assert.equal(sections.get('/')?.get('Cache-Control'), 'public, max-age=0, must-revalidate');
  assert.equal(sections.get('/*.html')?.get('Cache-Control'), 'public, max-age=0, must-revalidate');
  assert.equal(sections.get('/assets/*')?.get('Cache-Control'), 'public, max-age=31536000, immutable');
});

test('wrangler.toml avoids duplicate build and keeps compatible workerd date', () => {
  const toml = readFileSync(new URL('../wrangler.toml', import.meta.url), 'utf8');
  assert.doesNotMatch(toml, /^\[build\]/m);
  const match = toml.match(/compatibility_date\s*=\s*"(\d{4}-\d{2}-\d{2})"/);
  assert.ok(match, 'Missing compatibility_date in wrangler.toml');
  assert.ok(match[1] <= '2026-08-04', `compatibility_date ${match[1]} exceeds pinned workerd`);
});
