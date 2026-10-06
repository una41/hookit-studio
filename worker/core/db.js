import { settings } from '../runtime.js';
let cached;
const b64 = (value) => Buffer.from(value).toString('base64url');
export function encode(value) {
  if (value === null) return { nullValue: null };
  if (typeof value === 'string') return { stringValue: value };
  if (typeof value === 'boolean') return { booleanValue: value };
  if (typeof value === 'number')
    return Number.isInteger(value) ? { integerValue: String(value) } : { doubleValue: value };
  if (Array.isArray(value)) return { arrayValue: { values: value.map(encode) } };
  if (value && typeof value === 'object') return { mapValue: { fields: fields(value) } };
  throw Error('Unsupported Firestore value');
}
const fields = (value) => Object.fromEntries(Object.entries(value).map(([k, v]) => [k, encode(v)]));
export function decode(value) {
  if ('nullValue' in value) return null;
  if ('stringValue' in value) return value.stringValue;
  if ('booleanValue' in value) return value.booleanValue;
  if ('integerValue' in value) return Number(value.integerValue);
  if ('doubleValue' in value) return value.doubleValue;
  if ('timestampValue' in value) return value.timestampValue;
  if ('arrayValue' in value) return (value.arrayValue.values || []).map(decode);
  if ('mapValue' in value)
    return Object.fromEntries(
      Object.entries(value.mapValue.fields || {}).map(([k, v]) => [k, decode(v)]),
    );
  throw Error('Unsupported Firestore response');
}
async function accessToken() {
  const env = settings();
  if (!env.FIREBASE_SERVICE_ACCOUNT) throw Error('FIREBASE_SERVICE_ACCOUNT is required');
  const service = JSON.parse(env.FIREBASE_SERVICE_ACCOUNT);
  if (service.project_id !== env.FIREBASE_PROJECT_ID) throw Error('Firebase project mismatch');
  const identity = service.client_email + service.private_key_id;
  if (cached?.identity === identity && cached.expires > Date.now() + 60000) return cached.token;
  const now = Math.floor(Date.now() / 1000);
  const unsigned =
    b64(JSON.stringify({ alg: 'RS256', typ: 'JWT' })) +
    '.' +
    b64(
      JSON.stringify({
        iss: service.client_email,
        scope: 'https://www.googleapis.com/auth/datastore',
        aud: 'https://oauth2.googleapis.com/token',
        iat: now,
        exp: now + 3600,
      }),
    );
  const pem = service.private_key.replace(/-----[^-]+-----/g, '').replace(/\s/g, '');
  const key = await crypto.subtle.importKey(
    'pkcs8',
    Buffer.from(pem, 'base64'),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    key,
    new TextEncoder().encode(unsigned),
  );
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: unsigned + '.' + b64(sig),
    }),
    signal: AbortSignal.timeout(10000),
  });
  const data = await response.json();
  if (!response.ok || !data.access_token) throw Error('Firebase service authentication failed');
  cached = {
    identity,
    token: data.access_token,
    expires: Date.now() + Number(data.expires_in) * 1000,
  };
  return cached.token;
}
function root() {
  const id = settings().FIREBASE_PROJECT_ID;
  if (!/^[a-z][a-z0-9-]+$/.test(id)) throw Error('Invalid project');
  return `projects/${id}/databases/(default)/documents`;
}
async function request(suffix, method = 'POST', body) {
  const token = await accessToken();
  const response = await fetch('https://firestore.googleapis.com/v1/' + root() + suffix, {
    method,
    headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
    ...(body ? { body: JSON.stringify(body) } : {}),
    signal: AbortSignal.timeout(15000),
  });
  const result = await response.json();
  if (!response.ok) {
    const error = new Error('Firestore request failed');
    error.code =
      result.error?.status === 'ALREADY_EXISTS'
        ? 6
        : result.error?.status === 'ABORTED'
          ? 10
          : response.status;
    throw error;
  }
  return result;
}
function snapshot(ref, document) {
  return {
    ref,
    id: ref.id,
    exists: !!document?.name,
    data: () =>
      document?.name ? decode({ mapValue: { fields: document.fields || {} } }) : undefined,
  };
}
class Ref {
  constructor(path) {
    if (
      !path ||
      path.split('/').length % 2 ||
      path.split('/').some((p) => !p || p === '.' || p === '..')
    )
      throw Error('Invalid document path');
    this.path = path;
    this.id = path.split('/').at(-1);
  }
  async get(transaction) {
    if (transaction) {
      const result = await request(':batchGet', 'POST', {
        documents: [root() + '/' + this.path],
        transaction,
      });
      return snapshot(this, result[0]?.found);
    }
    try {
      return snapshot(this, await request('/' + this.path, 'GET'));
    } catch (e) {
      if (e.code === 404) return snapshot(this);
      throw e;
    }
  }
  async set(data) {
    await new Batch().set(this, data).commit();
  }
  async update(data) {
    await new Batch().update(this, data).commit();
  }
  async create(data) {
    await new Batch().create(this, data).commit();
  }
  async delete() {
    await new Batch().delete(this).commit();
  }
}
class Query {
  constructor(path, filters = []) {
    this.path = path;
    this.filters = filters;
  }
  where(field, op, value) {
    if (op !== '==') throw Error('Unsupported query');
    return new Query(this.path, [
      ...this.filters,
      { fieldFilter: { field: { fieldPath: field }, op: 'EQUAL', value: encode(value) } },
    ]);
  }
  async get(transaction) {
    const parts = this.path.split('/');
    const collectionId = parts.pop();
    const parent = parts.length ? '/' + parts.join('/') : '';
    const query = { from: [{ collectionId }] };
    if (this.filters.length)
      query.where =
        this.filters.length === 1
          ? this.filters[0]
          : { compositeFilter: { op: 'AND', filters: this.filters } };
    const rows = await request(parent + ':runQuery', 'POST', {
      structuredQuery: query,
      ...(transaction ? { transaction } : {}),
    });
    return {
      docs: rows
        .filter((r) => r.document)
        .map((r) => snapshot(new Ref(r.document.name.slice(root().length + 1)), r.document)),
    };
  }
}
class Batch {
  constructor(transaction) {
    this.transaction = transaction;
    this.writes = [];
  }
  set(ref, data) {
    this.writes.push({ update: { name: root() + '/' + ref.path, fields: fields(data) } });
    return this;
  }
  update(ref, data) {
    this.writes.push({
      update: { name: root() + '/' + ref.path, fields: fields(data) },
      updateMask: { fieldPaths: Object.keys(data) },
      currentDocument: { exists: true },
    });
    return this;
  }
  create(ref, data) {
    this.writes.push({
      update: { name: root() + '/' + ref.path, fields: fields(data) },
      currentDocument: { exists: false },
    });
    return this;
  }
  delete(ref) {
    this.writes.push({ delete: root() + '/' + ref.path });
    return this;
  }
  get(ref) {
    return ref.get(this.transaction);
  }
  async commit() {
    if (!this.transaction && !this.writes.length) return;
    return request(':commit', 'POST', {
      writes: this.writes,
      ...(this.transaction ? { transaction: this.transaction } : {}),
    });
  }
}
export const db = {
  doc: (path) => new Ref(path),
  collection: (path) => new Query(path),
  batch: () => new Batch(),
  async runTransaction(fn) {
    for (let attempt = 0; attempt < 3; attempt++) {
      const { transaction } = await request(':beginTransaction', 'POST', {
        options: { readWrite: {} },
      });
      try {
        const tx = new Batch(transaction);
        const result = await fn(tx);
        await tx.commit();
        return result;
      } catch (error) {
        await request(':rollback', 'POST', { transaction }).catch(() => {});
        if (error.code !== 10 || attempt === 2) throw error;
      }
    }
  },
};
