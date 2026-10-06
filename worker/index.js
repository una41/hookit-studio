import { context } from './runtime.js';
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const configurationReady = [
      'FIREBASE_SERVICE_ACCOUNT',
      'FIREBASE_WEB_API_KEY',
      'META_APP_SECRET',
      'TOKEN_ENCRYPTION_KEY',
      'META_GRAPH_VERSION',
    ].every((name) => Boolean(env[name]));
    const reply = (text, status = 200) =>
      new Response(text, {
        status,
        headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' },
      });
    if (url.pathname === '/webhooks/instagram') {
      if (request.method === 'GET') {
        if (!env.META_WEBHOOK_VERIFY_TOKEN)
          return reply('Webhook verification secret is not configured', 503);
        if (
          url.searchParams.get('hub.mode') !== 'subscribe' ||
          url.searchParams.get('hub.verify_token') !== env.META_WEBHOOK_VERIFY_TOKEN
        )
          return reply('Forbidden', 403);
        const challenge = url.searchParams.get('hub.challenge');
        return challenge ? reply(challenge) : reply('Missing challenge', 400);
      }
      if (request.method !== 'POST') return reply('Method not allowed', 405);
      if (!env.FIREBASE_SERVICE_ACCOUNT || !env.META_APP_SECRET)
        return reply('Server configuration required', 503);
      return context.run(env, async () => (await import('./backend.js')).backend(request));
    }
    if (url.pathname === '/api/health')
      return Response.json(
        {
          webhookVerification: !!env.META_WEBHOOK_VERIFY_TOKEN,
          configurationReady,
          liveMessaging: 'requires-workspace-verification',
        },
        { headers: { 'Cache-Control': 'no-store' } },
      );
    if (url.pathname.startsWith('/api/')) {
      if (!configurationReady)
        return Response.json(
          { error: '인스타그램 서버 설정이 아직 준비되지 않았어요.' },
          { status: 503 },
        );
      return context.run(env, async () => (await import('./backend.js')).backend(request));
    }
    return env.ASSETS.fetch(request);
  },
};
