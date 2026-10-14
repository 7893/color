import { test } from 'node:test';
import assert from 'node:assert/strict';
import worker from '../worker/index.js';

test('the retired snapshot endpoint cannot access storage or assets', async () => {
  const env = new Proxy({}, { get() { throw Error('Unexpected binding access'); } });
  for (const method of ['GET', 'POST', 'OPTIONS']) {
    const response = await worker.fetch(new Request('https://example.test/api/snapshots', { method }), env);
    assert.equal(response.status, 404);
  }
});

test('serves the page through the assets binding', async () => {
  const response = await worker.fetch(new Request('https://example.test/'), {
    ASSETS: { fetch: async () => new Response('<html>Color</html>') },
  });
  assert.equal(response.status, 200);
  assert.equal(await response.text(), '<html>Color</html>');
});

test('unknown page paths fall back to the homepage; missing files stay missing', async () => {
  const paths = [];
  const env = { ASSETS: { fetch: async request => {
    const path = new URL(request.url).pathname;
    paths.push(path);
    return path === '/index.html' ? new Response('Color') : new Response('Not found', { status: 404 });
  } } };
  const page = await worker.fetch(new Request('https://example.test/unknown'), env);
  assert.equal(await page.text(), 'Color');
  assert.deepEqual(paths, ['/unknown', '/index.html']);
  paths.length = 0;
  const file = await worker.fetch(new Request('https://example.test/missing.js'), env);
  assert.equal(file.status, 404);
  assert.deepEqual(paths, ['/missing.js']);
});
