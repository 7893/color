export default {
  async fetch(request) {
    return new Response(
      JSON.stringify({ message: "Color worker online", path: new URL(request.url).pathname }),
      {
        headers: {
          "content-type": "application/json; charset=utf-8",
          "cache-control": "no-store",
        },
      },
    );
  },
};
