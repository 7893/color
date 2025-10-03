export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    // Handle API routes
    if (url.pathname.startsWith('/api/')) {
      return handleAPI(request, env, url);
    }

    // Serve static assets
    const response = await env.ASSETS.fetch(request);
    if (response.status !== 404) {
      return response;
    }

    // Skip SPA fallback for asset files
    const isAsset = url.pathname.includes('.') && !url.pathname.endsWith('.html');
    if (isAsset) {
      return response;
    }

    // SPA fallback to index.html
    return env.ASSETS.fetch(new Request(`${url.origin}/index.html`, request));
  },
};

async function handleAPI(request, env, url) {
  if (url.pathname === '/api/snapshots' && request.method === 'POST') {
    try {
      const data = await request.json();
      
      const result = await env.DB.prepare(`
        INSERT INTO color_snapshots (id, user_id, colors, positions, device_type, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).bind(
        data.id,
        data.userId,
        data.colors,
        data.positions,
        data.deviceType,
        data.createdAt
      ).run();

      return new Response(JSON.stringify({ success: true, id: data.id }), {
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  return new Response('Not Found', { status: 404 });
}
