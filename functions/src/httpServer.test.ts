import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import express from 'express';
import { createHttpServer } from './httpServer';
import { verifySignature } from './security';

test('standalone HTTP preserves webhook bytes, limits payloads and mounts the API', async () => {
  let ready = false;
  const api = express();
  api.get('/example', (_req, res) => {
    res.json({ ok: true });
  });
  const app = createHttpServer(
    api,
    async (req, res) => {
      if (req.method === 'GET') {
        res.send('verified');
        return;
      }
      const valid =
        !!req.rawBody &&
        verifySignature(req.rawBody, req.header('x-hub-signature-256'), 'fixture-secret');
      res.status(valid ? 200 : 401).end();
    },
    () => ready,
  );
  const listener = app.listen(0, '127.0.0.1');
  await new Promise<void>((resolve) => listener.once('listening', resolve));
  const address = listener.address();
  assert(address && typeof address !== 'string');
  const base = `http://127.0.0.1:${address.port}`;
  try {
    assert.equal((await fetch(`${base}/healthz`)).status, 503);
    ready = true;
    assert.equal((await fetch(`${base}/healthz`)).status, 200);
    assert.deepEqual(await (await fetch(`${base}/api/example`)).json(), { ok: true });
    assert.equal(await (await fetch(`${base}/webhooks/instagram`)).text(), 'verified');
    const body = '{ "object" : "instagram", "entry": [] }';
    const signature = 'sha256=' + createHmac('sha256', 'fixture-secret').update(body).digest('hex');
    const post = (payload: string) =>
      fetch(`${base}/webhooks/instagram`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-hub-signature-256': signature },
        body: payload,
      });
    assert.equal((await post(body)).status, 200);
    assert.equal((await post(body.replace('[]', '[1]'))).status, 401);
    assert.equal((await post('{invalid')).status, 400);
    assert.equal((await post(JSON.stringify({ value: 'x'.repeat(260 * 1024) }))).status, 413);
  } finally {
    listener.closeAllConnections();
    await new Promise<void>((resolve) => listener.close(() => resolve()));
  }
});
