export const SECURITY_HEADERS = Object.freeze({
  'Strict-Transport-Security': 'max-age=31536000',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'no-referrer',
  'Content-Security-Policy':
    "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
});

export default {
  async fetch(request, env) {
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return addSecurityHeaders(
        new Response('Method Not Allowed', {
          status: 405,
          headers: {
            Allow: 'GET, HEAD',
            'Content-Type': 'text/plain; charset=utf-8',
            'Cache-Control': 'no-store',
          },
        })
      );
    }

    const url = new URL(request.url);

    if (url.pathname.startsWith('/api/')) {
      return createNotFoundResponse(request.method);
    }

    const response = await env.ASSETS.fetch(request);

    if (response.status === 404) {
      return createNotFoundResponse(request.method);
    }

    return addSecurityHeaders(response, request.method === 'HEAD');
  },
};

function createNotFoundResponse(method) {
  return addSecurityHeaders(
    new Response(method === 'HEAD' ? null : 'Not Found', {
      status: 404,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-store',
      },
    })
  );
}

function addSecurityHeaders(response, emptyBody = false) {
  const headers = new Headers(response.headers);
  headers.delete('X-XSS-Protection');
  for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
    headers.set(name, value);
  }
  return new Response(emptyBody ? null : response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
