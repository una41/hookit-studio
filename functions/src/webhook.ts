import type { Request, Response } from 'express';
import { db } from './db';
import { digest, verifySignature } from './security';
import { metaSecret, verifyToken } from './instagram';

export async function receiveWebhook(req: Request & { rawBody?: Buffer }, res: Response) {
  if (req.method === 'GET') {
    if (
      req.query['hub.mode'] === 'subscribe' &&
      req.query['hub.verify_token'] === verifyToken.value()
    )
      res.status(200).send(String(req.query['hub.challenge'] || ''));
    else res.status(403).send('Verification failed');
    return;
  }
  if (req.method !== 'POST') {
    res.status(405).end();
    return;
  }
  if (
    !req.rawBody ||
    !verifySignature(req.rawBody, req.header('x-hub-signature-256'), metaSecret.value())
  ) {
    res.status(401).end();
    return;
  }
  if (req.rawBody.length > 256 * 1024) {
    res.status(413).end();
    return;
  }
  if (req.body?.object !== 'instagram' || !Array.isArray(req.body.entry)) {
    res.status(200).send('IGNORED');
    return;
  }
  try {
    for (const entry of req.body.entry) {
      if (!/^\d+$/.test(String(entry.id))) continue;
      const registry = (await db.doc(`instagramAccounts/${entry.id}`).get()).data();
      if (!registry) continue;
      const events = [
        ...(Array.isArray(entry.changes)
          ? entry.changes
              .filter((change: { field: string }) => change.field === 'comments')
              .map((change: { value: unknown }) => ({
                kind: 'comment',
                body: change.value,
                timestamp: Number(entry.time) * 1000,
              }))
          : []),
        ...(Array.isArray(entry.messaging)
          ? entry.messaging
              .filter((message: { postback?: unknown }) => message.postback)
              .map((message: { timestamp?: number }) => ({
                kind: 'postback',
                body: message,
                timestamp: Number(message.timestamp),
              }))
          : []),
      ];
      for (const event of events) {
        const key = digest(`${entry.id}:${event.kind}:${JSON.stringify(event.body)}`);
        try {
          await db.doc(`eventQueue/${key}`).create({
            ...event,
            accountId: String(entry.id),
            workspaceId: registry.workspaceId,
            status: 'pending',
            receivedAt: new Date().toISOString(),
          });
        } catch (error) {
          if ((error as { code?: number }).code !== 6) throw error;
        }
      }
    }
    res.status(200).send('EVENT_RECEIVED');
  } catch {
    res.status(503).send('RETRY');
  }
}
