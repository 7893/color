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

    // Auto-record page visit
    if (url.pathname === '/' || url.pathname === '/index.html') {
      console.log('Page visit detected:', url.pathname);
      const clientIP = request.headers.get('CF-Connecting-IP') || 'unknown';
      const userAgent = request.headers.get('User-Agent') || 'unknown';
      const userAgentHash = userAgent.substring(0, 50);
      
      console.log('Client IP:', clientIP, 'UA:', userAgentHash);
      
      // Check rate limit: max 3 records per second per IP
      const rateLimitCheck = await checkVisitRateLimit(env, clientIP, userAgentHash);
      
      console.log('Rate limit check:', rateLimitCheck);
      
      if (rateLimitCheck.allowed) {
        // Record visit synchronously for testing
        try {
          console.log('Recording visit...');
          await recordVisit(env, clientIP, userAgentHash, request);
          console.log('Visit recorded successfully');
        } catch (error) {
          console.error('Failed to record visit:', error);
        }
      } else {
        console.log('Rate limit exceeded, skipping record');
      }
    }

    const response = await env.ASSETS.fetch(request);
    
    if (response.status !== 404) {
      return addSecurityHeaders(response);
    }

    const isAsset = url.pathname.includes('.') && !url.pathname.endsWith('.html');
    if (isAsset) return response;

    const htmlResponse = await env.ASSETS.fetch(new Request(`${url.origin}/index.html`, request));
    return addSecurityHeaders(htmlResponse);
  },
};

function addSecurityHeaders(response) {
  const newResponse = new Response(response.body, response);
  newResponse.headers.set('X-Content-Type-Options', 'nosniff');
  newResponse.headers.set('X-Frame-Options', 'DENY');
  newResponse.headers.set('X-XSS-Protection', '1; mode=block');
  newResponse.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  return newResponse;
}

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
      const userAgentHash = userAgent.substring(0, 50);
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

      const rateLimitCheck = await checkRateLimit(env, clientIP, userAgentHash);
      if (!rateLimitCheck.allowed) {
        console.warn('Rate limit exceeded:', { ip: clientIP, ua: userAgentHash });
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
        userAgentHash,
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

  if (parsedColors.length !== parsedPositions.length) {
    return { valid: false, error: 'Colors and positions array length mismatch' };
  }

  return {
    valid: true,
    data: { userId, colors: JSON.stringify(parsedColors), positions: JSON.stringify(parsedPositions), deviceType }
  };
}

async function checkRateLimit(env, clientIP, userAgentHash) {
  const now = Date.now();
  const windowStart = new Date(now - RATE_LIMIT.window).toISOString();
  const dayStart = new Date(now - 86400000).toISOString();
  
  const dailyLimit = clientIP === 'unknown' ? RATE_LIMIT.unknownIPDailyLimit : RATE_LIMIT.dailyLimit;
  
  let recentQuery, dailyQuery;
  
  if (clientIP === 'unknown') {
    recentQuery = env.DB.prepare('SELECT COUNT(*) as count FROM color_snapshots WHERE client_ip = ? AND user_agent = ? AND created_at > ?')
      .bind(clientIP, userAgentHash, windowStart);
    dailyQuery = env.DB.prepare('SELECT COUNT(*) as count FROM color_snapshots WHERE client_ip = ? AND user_agent = ? AND created_at > ?')
      .bind(clientIP, userAgentHash, dayStart);
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
    const retryAfter = Math.max(1, Math.ceil((86400000 - (now - new Date(dayStart).getTime())) / 1000));
    return { allowed: false, retryAfter };
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

async function checkVisitRateLimit(env, clientIP, userAgentHash) {
  const now = Date.now();
  const windowStart = new Date(now - 1000).toISOString(); // 1 second window
  
  const query = env.DB.prepare(
    'SELECT COUNT(*) as count FROM color_snapshots WHERE client_ip = ? AND created_at > ?'
  ).bind(clientIP, windowStart);
  
  const result = await query.first();
  
  if (result.count >= 3) {
    return { allowed: false };
  }
  
  return { allowed: true };
}

async function recordVisit(env, clientIP, userAgentHash, request) {
  try {
    const newId = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    const referer = request.headers.get('Referer') || 'direct';
    
    // Generate random colors for auto-visit
    const colors = generateRandomColors(25);
    const positions = generateRandomPositions(colors);
    
    await env.DB.prepare(
      'INSERT INTO color_snapshots (id, user_id, client_ip, colors, positions, device_type, created_at, user_agent, referer) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).bind(
      newId,
      `auto_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      clientIP,
      JSON.stringify(colors),
      JSON.stringify(positions),
      'desktop',
      createdAt,
      userAgentHash,
      referer
    ).run();
  } catch (error) {
    console.error('Failed to record visit:', error);
  }
}

function generateRandomColors(count) {
  const colors = [];
  for (let i = 0; i < count; i++) {
    const r = Math.floor(Math.random() * 256).toString(16).padStart(2, '0');
    const g = Math.floor(Math.random() * 256).toString(16).padStart(2, '0');
    const b = Math.floor(Math.random() * 256).toString(16).padStart(2, '0');
    colors.push(`#${r}${g}${b}`);
  }
  return colors;
}

function generateRandomPositions(colors) {
  return colors.map(color => ({
    x: Math.random() * 1600,
    y: Math.random() * 800,
    rotation: Math.random() * 360,
    color
  }));
}
