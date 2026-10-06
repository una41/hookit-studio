import { onRequest } from 'firebase-functions/v2/https';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { app } from './api';
import { encryptionKey, metaSecret, verifyToken } from './instagram';
import { receiveWebhook } from './webhook';
import { processEvent } from './worker';

export const api = onRequest(
  { region: 'asia-northeast3', maxInstances: 2, secrets: [metaSecret, encryptionKey] },
  app,
);
export const instagramWebhook = onRequest(
  { region: 'asia-northeast3', maxInstances: 2, secrets: [metaSecret, verifyToken] },
  receiveWebhook,
);
export const processInstagramEvent = onDocumentCreated(
  {
    document: 'eventQueue/{eventId}',
    region: 'asia-northeast3',
    maxInstances: 1,
    concurrency: 1,
    secrets: [encryptionKey],
    retry: false,
  },
  async (event) => {
    if (!event.data) return;
    await processEvent(event.data.ref, event.data.data() as Parameters<typeof processEvent>[1]);
  },
);
