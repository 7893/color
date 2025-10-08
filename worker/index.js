const RATE_LIMIT = { 
  requests: 3, 
  window: 1000,
  dailyLimit: 1000,
  unknownIPDailyLimit: 10000
};
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
  const origin = request.headers.get('Origin');
  const allowedOrigins = env.ALLOWED_ORIGINS ? env.ALLOWED_ORIGINS.split(',') : [];
  
  if (url.pathname === '/api/snapshots' && request.method === 'POST') {
    try {
      if (!isAllowedOrigin(origin, url.origin, allowedOrigins)) {
        console.warn('Forbidden access attempt:', { origin, ip: request.headers.get('CF-Connecting-IP') });
        return jsonResponse({ error: 'Forbidden' }, 403);
      }

      const clientIP = request.headers.get('CF-Connecting-IP') || 'unknown';
      const userAgent = request.headers.get('User-Agent') || 'unknown';
      const referer = request.headers.get('Referer') || 'unknown';

      const contentLength = request.headers.get('content-length');
      if (contentLength && parseInt(contentLength) > MAX_PAYLOAD_SIZE) {
        return jsonResponse({ error: 'Payload too large' }, 413, origin);
      }

      let data;
      try {
        data = await request.json();
      } catch (e) {
        return jsonResponse({ error: 'Invalid JSON' }, 400, origin);
      }

      const validated = validateSnapshot(data);
      
      if (!validated.valid) {
        return jsonResponse({ error: validated.error }, 400, origin);
      }

      const rateLimitCheck = await checkRateLimit(env, clientIP, userAgent);
      if (!rateLimitCheck.allowed) {
        console.warn('Rate limit exceeded:', { ip: clientIP, ua: userAgent.substring(0, 50) });
        return jsonResponse({ 
          error: 'Rate limit exceeded',
          retryAfter: rateLimitCheck.retryAfter 
        }, 429, origin);
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

      return jsonResponse({ success: true, id: newId }, 200, origin);
    } catch (error) {
      console.error('API error:', error);
      return jsonResponse({ error: 'Internal server error' }, 500, origin);
    }
  }

  if (request.method === 'OPTIONS') {
    return handleCORS(request, env);
  }

  return jsonResponse({ error: 'Not found' }, 404);
}

function isAllowedOrigin(origin, requestOrigin, allowedOrigins) {
  if (!origin) return false;
  if (allowedOrigins.includes(origin)) return true;
  if (origin === requestOrigin) return true;
  return false;
}

function handleCORS(request, env) {
  const origin = request.headers.get('Origin');
  const allowedOrigins = env.ALLOWED_ORIGINS ? env.ALLOWED_ORIGINS.split(',') : [];
  const headers = {
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400'
  };
  
  if (isAllowedOrigin(origin, new URL(request.url).origin, allowedOrigins)) {
    headers['Access-Control-Allow-Origin'] = origin;
  }
  
  return new Response(null, { status: 204, headers });
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
  const { x, y, color, rotation } = pos;
  if (typeof x !== 'number' || typeof y !== 'number' || !isValidHexColor(color)) {
    return false;
  }
  if (!Number.isFinite(x) || !Number.isFinite(y) || x < -10000 || x > 10000 || y < -10000 || y > 10000) {
    return false;
  }
  if (rotation !== undefined && (typeof rotation !== 'number' || !Number.isFinite(rotation))) {
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

async function checkRateLimit(env, clientIP, userAgent) {
  const now = Date.now();
  const windowStart = new Date(now - RATE_LIMIT.window).toISOString();
  const dayStart = new Date(now - 86400000).toISOString();
  
  const dailyLimit = clientIP === 'unknown' ? RATE_LIMIT.unknownIPDailyLimit : RATE_LIMIT.dailyLimit;
  
  let recentQuery, dailyQuery;
  
  if (clientIP === 'unknown') {
    const uaHash = userAgent.substring(0, 50);
    recentQuery = env.DB.prepare('SELECT COUNT(*) as count FROM color_snapshots WHERE client_ip = ? AND user_agent = ? AND created_at > ?')
      .bind(clientIP, uaHash, windowStart);
    dailyQuery = env.DB.prepare('SELECT COUNT(*) as count FROM color_snapshots WHERE client_ip = ? AND user_agent = ? AND created_at > ?')
      .bind(clientIP, uaHash, dayStart);
  } else {
    recentQuery = env.DB.prepare('SELECT COUNT(*) as count FROM color_snapshots WHERE client_ip = ? AND created_at > ?')
      .bind(clientIP, windowStart);
    dailyQuery = env.DB.prepare('SELECT COUNT(*) as count FROM color_snapshots WHERE client_ip = ? AND created_at > ?')
      .bind(clientIP, dayStart);
  }
  
  const [recentRequests, dailyRequests] = await Promise.all([
    recentQuery.first(),
    dailyQuery.first()
  ]);
  
  if (dailyRequests.count >= dailyLimit) {
    return { 
      allowed: false, 
      retryAfter: Math.ceil((86400000 - (now - new Date(dayStart).getTime())) / 1000)
    };
  }
  
  if (recentRequests.count >= RATE_LIMIT.requests) {
    return { 
      allowed: false, 
      retryAfter: Math.ceil(RATE_LIMIT.window / 1000)
    };
  }
  
  return { allowed: true };
}

function jsonResponse(data, status = 200, origin = null) {
  const headers = { 'Content-Type': 'application/json' };
  
  if (origin) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Access-Control-Allow-Methods'] = 'POST, OPTIONS';
  }
  
  return new Response(JSON.stringify(data), { status, headers });
}
