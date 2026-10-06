import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPairSync } from 'node:crypto';
import { context } from './runtime.js';
import { db, encode, decode } from './core/db.js';
import { authorize } from './core/auth.js';

test('Firestore adapter preserves values and retries aborted transactions without dropping preconditions', async () => {
  const value = { a: '한글', b: false, c: 0, d: null, e: [1, { ok: true }], f: {} };
  assert.deepEqual(decode(encode(value)), value);
  const { privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
  const env = {
    FIREBASE_PROJECT_ID: 'fixture-project',
    FIREBASE_SERVICE_ACCOUNT: JSON.stringify({
      project_id: 'fixture-project',
      client_email: 'fixture@example.test',
      private_key_id: 'fixture',
      private_key: privateKey.export({ type: 'pkcs8', format: 'pem' }),
    }),
  };
  const original = globalThis.fetch;
  let commits = 0,
    rollbacks = 0,
    begins = 0;
  const prefix = 'projects/fixture-project/databases/(default)/documents';
  globalThis.fetch = async (url, options) => {
    if (String(url).includes('oauth2.googleapis.com'))
      return Response.json({ access_token: 'fixture', expires_in: 3600 });
    const body = options.body ? JSON.parse(options.body) : {};
    if (String(url).endsWith(':beginTransaction'))
      return Response.json({ transaction: 'tx' + ++begins });
    if (String(url).endsWith(':batchGet')) {
      assert.equal(body.transaction, 'tx' + begins);
      return Response.json([
        { found: { name: prefix + '/items/one', fields: { count: { integerValue: '2' } } } },
      ]);
    }
    if (String(url).endsWith(':rollback')) {
      rollbacks++;
      return Response.json({});
    }
    if (String(url).endsWith(':commit')) {
      commits++;
      assert.equal(body.transaction, 'tx' + begins);
      assert.equal(body.writes[0].currentDocument.exists, true);
      assert.equal(body.writes[0].update.fields.count.integerValue, '3');
      assert.deepEqual(body.writes[0].updateMask.fieldPaths, ['count']);
      assert.equal(body.writes[1].currentDocument.exists, false);
      return commits === 1
        ? Response.json({ error: { status: 'ABORTED' } }, { status: 409 })
        : Response.json({});
    }
    return Response.json({ error: { status: 'NOT_FOUND' } }, { status: 404 });
  };
  try {
    await context.run(env, async () => {
      assert.equal((await db.doc('items/missing').get()).exists, false);
      await db.runTransaction(async (tx) => {
        const ref = db.doc('items/one');
        const snap = await tx.get(ref);
        tx.update(ref, { count: snap.data().count + 1 });
        tx.create(db.doc('items/two'), value);
      });
    });
    assert.equal(commits, 2);
    assert.equal(rollbacks, 1);
  } finally {
    globalThis.fetch = original;
  }
});

test('authorization rejects tokens from a different Firebase project before reading data', async () => {
  const original = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => {
    calls++;
    return Response.json({ users: [{ localId: 'owner' }] });
  };
  const token =
    'header.' +
    Buffer.from(
      JSON.stringify({
        aud: 'wrong',
        iss: 'https://securetoken.google.com/wrong',
        sub: 'owner',
        exp: Date.now() / 1000 + 300,
      }),
    ).toString('base64url') +
    '.signature';
  try {
    await context.run(
      { FIREBASE_WEB_API_KEY: 'fixture', FIREBASE_PROJECT_ID: 'fixture-project' },
      async () => {
        await assert.rejects(
          authorize({ headers: { authorization: 'Bearer ' + token } }),
          (e) => e.status === 401,
        );
      },
    );
    assert.equal(calls, 1);
  } finally {
    globalThis.fetch = original;
  }
});
