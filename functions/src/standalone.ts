import { createHttpServer } from './httpServer';
import { app } from './api';
import { db } from './db';
import { receiveWebhook } from './webhook';
import { processEvent } from './worker';

// The free web service owns both HTTP and the serial queue consumer.
// Firestore persists pending events across service restarts; no Functions trigger is needed.
let ready = false;
let stopping = false;
let tail = Promise.resolve();
const scheduled = new Set<string>();

for (const name of [
  'APP_ORIGIN',
  'META_APP_ID',
  'META_GRAPH_VERSION',
  'META_APP_SECRET',
  'META_WEBHOOK_VERIFY_TOKEN',
  'TOKEN_ENCRYPTION_KEY',
]) {
  if (!process.env[name]) throw new Error(`Missing server setting: ${name}`);
}
if (!process.env.API_BASE_URL && process.env.RENDER_EXTERNAL_URL) {
  process.env.API_BASE_URL = `${process.env.RENDER_EXTERNAL_URL}/api`;
}
if (
  !process.env.API_BASE_URL ||
  new URL(process.env.API_BASE_URL).protocol !== 'https:' ||
  new URL(process.env.APP_ORIGIN!).protocol !== 'https:'
) {
  throw new Error('APP_ORIGIN and API_BASE_URL must be HTTPS URLs');
}
if (Buffer.from(process.env.TOKEN_ENCRYPTION_KEY!, 'base64').length !== 32) {
  throw new Error('TOKEN_ENCRYPTION_KEY must contain 32 bytes encoded as base64');
}

const server = createHttpServer(app, receiveWebhook, () => ready && !stopping);

const unsubscribe = db
  .collection('eventQueue')
  .where('status', '==', 'pending')
  .limit(20)
  .onSnapshot(
    (snapshot) => {
      ready = true;
      for (const doc of snapshot.docs) {
        if (stopping || scheduled.has(doc.id)) continue;
        scheduled.add(doc.id);
        tail = tail
          .then(async () => {
            if (!stopping)
              await processEvent(doc.ref, doc.data() as Parameters<typeof processEvent>[1]);
          })
          .catch(() => {
            // Do not log tokens, webhook bodies or credentials, or blindly retry uncertain sends.
            console.error('Queue processing failed; inspect event status before retrying.');
            void shutdown(1);
          })
          .finally(() => {
            scheduled.delete(doc.id);
          });
      }
    },
    () => {
      ready = false;
      console.error(
        'Firestore queue connection failed. Check server credentials and database access.',
      );
      void shutdown(1);
    },
  );
const listener = server.listen(Number(process.env.PORT || 10000), '0.0.0.0', () => {
  console.log('HOOKIT STUDIO HTTP server started.');
});
async function shutdown(code: number) {
  if (stopping) return;
  stopping = true;
  ready = false;
  unsubscribe();
  listener.close();
  const deadline = setTimeout(() => process.exit(code), 25000);
  deadline.unref();
  await tail;
  await db.terminate();
  process.exit(code);
}
process.on('SIGTERM', () => {
  void shutdown(0);
});
process.on('SIGINT', () => {
  void shutdown(0);
});
