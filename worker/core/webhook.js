import { processEvent } from './worker.js';
import { db } from './db.js';
import { digest, verifySignature } from './security.js';
import { metaSecret, verifyToken } from './instagram.js';
export async function receiveWebhook(req, res) {
    if (req.method === 'GET') {
        if (req.query['hub.mode'] === 'subscribe' &&
            req.query['hub.verify_token'] === verifyToken.value())
            res.status(200).send(String(req.query['hub.challenge'] || ''));
        else
            res.status(403).send('Verification failed');
        return;
    }
    if (req.method !== 'POST') {
        res.status(405).end();
        return;
    }
    if (!req.rawBody ||
        !verifySignature(req.rawBody, req.header('x-hub-signature-256'), metaSecret.value())) {
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
            if (!/^\d+$/.test(String(entry.id)))
                continue;
            const registry = (await db.doc(`instagramAccounts/${entry.id}`).get()).data();
            if (!registry)
                continue;
            const events = [
                ...(Array.isArray(entry.changes)
                    ? entry.changes
                        .filter((change) => change.field === 'comments')
                        .map((change) => ({
                        kind: 'comment',
                        body: change.value,
                        timestamp: Number(entry.time) * 1000,
                    }))
                    : []),
                ...(Array.isArray(entry.messaging)
                    ? entry.messaging
                        .filter((message) => message.postback)
                        .map((message) => ({
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
                }
                catch (error) {
                    if (error.code !== 6)
                        throw error;
                }
                const saved = await db.doc('eventQueue/' + key).get();
                await processEvent(saved.ref, saved.data());
            }
        }
        res.status(200).send('EVENT_RECEIVED');
    }
    catch {
        res.status(503).send('RETRY');
    }
}
