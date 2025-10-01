export default {
  async fetch(request, env) {
    const response = await env.ASSETS.fetch(request);
    if (response.status !== 404) {
      return response;
    }

    const url = new URL(request.url);
    const isAsset = url.pathname.includes('.') && !url.pathname.endsWith('.html');
    if (isAsset) {
      return response;
    }

    return env.ASSETS.fetch(new Request(`${url.origin}/index.html`, request));
  },
};
