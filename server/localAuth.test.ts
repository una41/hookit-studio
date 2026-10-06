import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createHash, scryptSync } from 'node:crypto';
import { createServer, type Server } from 'node:http';
import { createLocalAuth } from './localAuth';

// Test-only credentials; the actual local account never enters source or fixtures.
const salt = 'a'.repeat(64);
const credentials = {
  salt,
  usernameHash: createHash('sha256')
    .update(salt + 'fixture-owner')
    .digest('hex'),
  passwordHash: scryptSync('fixture-password', salt, 64).toString('hex'),
};
describe('local server authentication', () => {
  let server: Server;
  let origin: string;
  let now: number;
  beforeEach(async () => {
    now = Date.now();
    const handler = createLocalAuth(credentials, () => now);
    server = createServer((req, res) => {
      void handler(req, res, () => {
        res.statusCode = 404;
        res.end();
      });
    });
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    const address = server.address();
    if (!address || typeof address === 'string') throw new Error('Server did not start');
    origin = `http://127.0.0.1:${address.port}`;
  });
  afterEach(async () => {
    server.closeAllConnections();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });
  function login(password = 'fixture-password', username = 'fixture-owner') {
    return fetch(`${origin}/api/local-auth/login`, {
      method: 'POST',
      headers: { Origin: origin, 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
  }
  it('rejects wrong credentials and forged sessions', async () => {
    expect((await login('incorrect')).status).toBe(401);
    expect((await login('fixture-password', 'unknown')).status).toBe(401);
    const response = await fetch(`${origin}/api/local-auth/session`, {
      headers: { Cookie: 'hookit_local_session=forged' },
    });
    expect(await response.json()).toEqual({ session: null });
  });
  it('restores a server session and revokes it on logout', async () => {
    const response = await login();
    expect(response.status).toBe(200);
    const header = response.headers.get('set-cookie')!;
    expect(header).toContain('HttpOnly');
    expect(header).toContain('SameSite=Strict');
    expect(response.headers.get('cache-control')).toBe('no-store');
    const Cookie = header.split(';')[0];
    const session = await fetch(`${origin}/api/local-auth/session`, { headers: { Cookie } });
    expect((await session.json()).session.workspaceId).toBe('preview');
    expect(
      (
        await fetch(`${origin}/api/local-auth/logout`, {
          method: 'POST',
          headers: { Cookie, Origin: origin },
        })
      ).status,
    ).toBe(200);
    const revoked = await fetch(`${origin}/api/local-auth/session`, { headers: { Cookie } });
    expect((await revoked.json()).session).toBeNull();
  });
  it('expires sessions after eight hours', async () => {
    const response = await login();
    const Cookie = response.headers.get('set-cookie')!.split(';')[0];
    now += 8 * 60 * 60 * 1000;
    const expired = await fetch(`${origin}/api/local-auth/session`, { headers: { Cookie } });
    expect((await expired.json()).session).toBeNull();
  });
  it('blocks cross-origin logins', async () => {
    const response = await fetch(`${origin}/api/local-auth/login`, {
      method: 'POST',
      headers: { Origin: 'https://untrusted.example', 'Content-Type': 'application/json' },
      body: '{}',
    });
    expect(response.status).toBe(403);
  });
  it('limits repeated failures and allows login after the cooldown', async () => {
    for (let i = 0; i < 5; i++) expect((await login('incorrect')).status).toBe(401);
    expect((await login()).status).toBe(429);
    now += 5 * 60 * 1000;
    expect((await login()).status).toBe(200);
  });
});
