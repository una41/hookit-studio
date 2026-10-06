export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const reply = (text, status = 200) => new Response(text, { status, headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' } });
    if (url.pathname === '/webhooks/instagram') {
      if (request.method === 'GET') {
        if (!env.META_WEBHOOK_VERIFY_TOKEN) return reply('Webhook verification secret is not configured', 503);
        if (url.searchParams.get('hub.mode') !== 'subscribe' || url.searchParams.get('hub.verify_token') !== env.META_WEBHOOK_VERIFY_TOKEN) return reply('Forbidden', 403);
        const challenge = url.searchParams.get('hub.challenge');
        return challenge ? reply(challenge) : reply('Missing challenge', 400);
      }
      if (request.method !== 'POST') return reply('Method not allowed', 405);
      // Never acknowledge and discard live events while the processing backend is unfinished.
      return reply('Event processing is not enabled yet', 503);
    }
    if (url.pathname === '/api/health') return Response.json({ webhookVerification: !!env.META_WEBHOOK_VERIFY_TOKEN, messagingEnabled: false }, { headers: { 'Cache-Control': 'no-store' } });
    if (url.pathname.startsWith('/api/')) return reply('Instagram backend migration is not complete', 503);
    return env.ASSETS.fetch(request);
  }
};
