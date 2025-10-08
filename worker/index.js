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

      if (!(await checkRateLimit(env, clientIP))) {
        return jsonResponse({ error: 'Rate limit exceeded' }, 429);
      }

      const newId = crypto.randomUUID();
      const createdAt = new Date().toISOString();

      await env.DB.prepare(
        'INSERT INTO color_snapshots (id, user_id, client_ip, colors, positions, device_type, created_at, user_agent, referer) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
      ).bind(
        newId,
        validated.data.userId,
        clientIP,
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

function isValidHexColor(hex) {
  if (typeof hex !== 'string' || !/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(hex)) {
    return false;
  }
  return true;
}

function isValidPosition(pos) {
  if (typeof pos !== 'object' || pos === null) {
    return false;
  }
  const { x, y, color } = pos;
  if (typeof x !== 'number' || typeof y !== 'number' || !isValidHexColor(color)) {
    return false;
  }
  return true;
}

function validateSnapshot(data) {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Invalid data format' };
  }

  const { userId, colors, positions, deviceType } = data;

  if (!userId || typeof userId !== 'string' || userId.length > 100 || !/^user_\d+_[a-z0-9]+$/.test(userId)) {
    return { valid: false, error: 'Invalid userId' };
  }

  if (!deviceType || !['mobile', 'tablet', 'desktop'].includes(deviceType)) {
    return { valid: false, error: 'Invalid deviceType' };
  }

  if (!colors || typeof colors !== 'string' || colors.length > 2000) {
    return { valid: false, error: 'Invalid colors' };
  }
  let parsedColors;
  try {
    parsedColors = JSON.parse(colors);
    if (!Array.isArray(parsedColors) || parsedColors.length === 0 || parsedColors.length > 50 || !parsedColors.every(isValidHexColor)) {
      return { valid: false, error: 'Invalid colors array format or content' };
    }
  } catch (e) {
    return { valid: false, error: 'Colors is not a valid JSON array' };
  }

  if (!positions || typeof positions !== 'string' || positions.length > 5000) {
    return { valid: false, error: 'Invalid positions' };
  }
  let parsedPositions;
  try {
    parsedPositions = JSON.parse(positions);
    if (!Array.isArray(parsedPositions) || parsedPositions.length === 0 || parsedPositions.length > 50 || !parsedPositions.every(isValidPosition)) {
      return { valid: false, error: 'Invalid positions array format or content' };
    }
  } catch (e) {
    return { valid: false, error: 'Positions is not a valid JSON array' };
  }

  return {
    valid: true,
    data: { userId, colors: JSON.stringify(parsedColors), positions: JSON.stringify(parsedPositions), deviceType }
  };
}

async function checkRateLimit(env, clientIP) {
  const now = Date.now();
  const windowStart = new Date(now - RATE_LIMIT.window).toISOString();
  const stored = await env.DB.prepare('SELECT created_at FROM color_snapshots WHERE client_ip = ? AND created_at > ?')
    .bind(clientIP, windowStart)
    .all();
  
  return stored.results.length < RATE_LIMIT.requests;
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}
