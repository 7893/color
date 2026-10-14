export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    if (url.pathname.startsWith('/api/')) {
      return new Response('Not found', { status: 404 });
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
