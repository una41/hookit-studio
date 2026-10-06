import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes, createHmac } from 'node:crypto';
import { encodeToken, decodeToken, verifySignature } from './security';

test('webhook signature rejects modified bodies and malformed signatures', () => {
  const body = Buffer.from('{"entry":[]}');
  const secret = 'test-app-secret';
  const signature = 'sha256=' + createHmac('sha256', secret).update(body).digest('hex');
  assert.equal(verifySignature(body, signature, secret), true);
  assert.equal(verifySignature(Buffer.from('{}'), signature, secret), false);
  assert.equal(verifySignature(body, 'sha256=invalid', secret), false);
  assert.equal(verifySignature(body, undefined, secret), false);
});
test('encrypted tokens round trip and reject tampering', () => {
  const key = randomBytes(32).toString('base64');
  const encrypted = encodeToken('not-a-real-token', key);
  assert.equal(decodeToken(encrypted, key), 'not-a-real-token');
  assert.notEqual(encodeToken('not-a-real-token', key).ciphertext, encrypted.ciphertext);
  assert.throws(() => decodeToken({ ...encrypted, tag: randomBytes(16).toString('base64') }, key));
  assert.throws(() => decodeToken(encrypted, randomBytes(32).toString('base64')));
});
