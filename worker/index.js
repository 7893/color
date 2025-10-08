const RATE_LIMIT = { requests: 2, window: 1000 };
const MAX_PAYLOAD_SIZE = 10240;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    if (url.pathname.startsWith('/api/')) {
      return handleAPI(request, env, url);
    }

    const response = await env.ASSETS.fetch(request);
    if (response.status !== 404) return response;

    const isAsset = url.pathname.includes('.') && !url.pathname.endsWith('.html');
    if (isAsset) return response;

    return env.ASSETS.fetch(new Request(`${url.origin}/index.html`, request));
  },
};

async function handleAPI(request, env, url) {
  if (url.pathname === '/api/snapshots' && request.method === 'POST') {
    try {
      const clientIP = request.headers.get('CF-Connecting-IP') || 'unknown';
      const userAgent = request.headers.get('User-Agent') || 'unknown';
      const referer = request.headers.get('Referer') || 'unknown';

      const contentLength = request.headers.get('content-length');
      if (contentLength && parseInt(contentLength) > MAX_PAYLOAD_SIZE) {
        return jsonResponse({ error: 'Payload too large' }, 413);
      }

      const data = await request.json();
      const validated = validateSnapshot(data);
      
      if (!validated.valid) {
        return jsonResponse({ error: validated.error }, 400);
      }

      const rateLimitKey = validated.data.userId || clientIP;

      if (!(await checkRateLimit(env, rateLimitKey))) {
        return jsonResponse({ error: 'Rate limit exceeded' }, 429);
      }

      const newId = crypto.randomUUID();
      const createdAt = new Date().toISOString();

      await env.DB.prepare(
        'INSERT INTO color_snapshots (id, user_id, colors, positions, device_type, created_at, user_agent, referer) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
      ).bind(
        newId,
        validated.data.userId,
        validated.data.colors,
        validated.data.positions,
        validated.data.deviceType,
        createdAt,
        userAgent,
        referer
      ).run();

      return jsonResponse({ success: true, id: newId });
    } catch (error) {
      console.error('API error:', error);
      return jsonResponse({ error: 'Internal server error' }, 500);
    }
  }

  return jsonResponse({ error: 'Not found' }, 404);
}

function validateSnapshot(data) {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Invalid data format' };
  }

  const { userId, colors, positions, deviceType } = data;

  if (!userId || typeof userId !== 'string' || userId.length > 100) {
    return { valid: false, error: 'Invalid userId' };
  }

  if (!colors || typeof colors !== 'string' || colors.length > 2000) {
    return { valid: false, error: 'Invalid colors' };
  }

  if (!positions || typeof positions !== 'string' || positions.length > 5000) {
    return { valid: false, error: 'Invalid positions' };
  }

  if (!deviceType || typeof deviceType !== 'string' || deviceType.length > 50) {
    return { valid: false, error: 'Invalid deviceType' };
  }

  return {
    valid: true,
    data: { userId, colors, positions, deviceType }
  };
}

async function checkRateLimit(env, userKey) {
  const now = Date.now();
  const stored = await env.DB.prepare('SELECT created_at FROM color_snapshots WHERE user_id = ? AND created_at > ?')
    .bind(userKey, new Date(now - RATE_LIMIT.window).toISOString())
    .all();
  
  return stored.results.length < RATE_LIMIT.requests;
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}
