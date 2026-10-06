import { createHash, randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { promisify } from 'node:util';
import type { Plugin } from 'vite';

const deriveKey = promisify(scrypt);
const cookieName = 'hookit_local_session';
const sessionLifetime = 8 * 60 * 60 * 1000;
const attemptWindow = 5 * 60 * 1000;
interface Credentials {
  salt: string;
  usernameHash: string;
  passwordHash: string;
}
const localSession = {
  uid: 'preview-owner',
  email: 'owner@hookit-studio.local',
  workspaceId: 'preview',
};

export function createLocalAuth(credentials: Credentials | null, now = Date.now) {
  const sessions = new Map<string, number>();
  let attempts = 0;
  let resetAt = 0;
  return async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
    const path = req.url?.split('?')[0];
    if (!path?.startsWith('/api/local-auth/')) return next();
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    const reply = (status: number, body: unknown) => {
      res.statusCode = status;
      res.end(JSON.stringify(body));
    };
    const address = req.socket.remoteAddress || '';
    const host = req.headers.host || '';
    if (
      !['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(address) ||
      !/^(127\.0\.0\.1|localhost|\[::1\])(?::\d+)?$/.test(host)
    )
      return reply(403, { error: '로컬에서만 사용할 수 있는 로그인입니다.' });
    if (!credentials) return reply(503, { error: '로컬 로그인 계정 설정이 필요해요.' });
    for (const [token, expiry] of sessions) if (expiry <= now()) sessions.delete(token);
    const token = (req.headers.cookie || '')
      .split(';')
      .map((item) => item.trim())
      .find((item) => item.startsWith(`${cookieName}=`))
      ?.slice(cookieName.length + 1);
    if (path === '/api/local-auth/session' && req.method === 'GET') {
      return reply(200, { session: token && sessions.has(token) ? localSession : null });
    }
    if (req.method !== 'POST') return reply(405, { error: '허용되지 않은 요청입니다.' });
    if (req.headers.origin !== `http://${host}` || req.headers['sec-fetch-site'] === 'cross-site') {
      return reply(403, { error: '요청 출처를 확인하지 못했어요.' });
    }
    if (path === '/api/local-auth/logout') {
      if (token) sessions.delete(token);
      res.setHeader('Set-Cookie', `${cookieName}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0`);
      return reply(200, { session: null });
    }
    if (path !== '/api/local-auth/login') return reply(404, { error: '요청을 찾을 수 없어요.' });
    if (now() >= resetAt) {
      attempts = 0;
      resetAt = now() + attemptWindow;
    }
    if (attempts >= 5) {
      res.setHeader('Retry-After', String(Math.ceil((resetAt - now()) / 1000)));
      return reply(429, { error: '로그인 시도가 많아요. 5분 뒤 다시 시도해 주세요.' });
    }
    attempts++;
    if (!req.headers['content-type']?.startsWith('application/json')) {
      return reply(415, { error: '요청 형식을 확인해 주세요.' });
    }
    try {
      let body = '';
      for await (const chunk of req) {
        body += chunk.toString();
        if (Buffer.byteLength(body) > 4096)
          return reply(413, { error: '입력 내용이 너무 길어요.' });
      }
      const { username, password } = JSON.parse(body);
      if (
        typeof username !== 'string' ||
        typeof password !== 'string' ||
        username.length > 128 ||
        password.length > 256
      ) {
        return reply(400, { error: '아이디와 비밀번호를 입력해 주세요.' });
      }
      const usernameHash = createHash('sha256')
        .update(credentials.salt + username)
        .digest();
      const passwordHash = (await deriveKey(password, credentials.salt, 64)) as Buffer;
      const usernameValid = timingSafeEqual(
        usernameHash,
        Buffer.from(credentials.usernameHash, 'hex'),
      );
      const passwordValid = timingSafeEqual(
        passwordHash,
        Buffer.from(credentials.passwordHash, 'hex'),
      );
      if (!usernameValid || !passwordValid)
        return reply(401, { error: '아이디 또는 비밀번호가 올바르지 않아요.' });
      attempts = 0;
      if (token) sessions.delete(token);
      // A single-owner local site needs only a small number of concurrent sessions.
      if (sessions.size >= 10) sessions.delete(sessions.keys().next().value!);
      const newToken = randomBytes(32).toString('hex');
      sessions.set(newToken, now() + sessionLifetime);
      res.setHeader(
        'Set-Cookie',
        `${cookieName}=${newToken}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${sessionLifetime / 1000}`,
      );
      return reply(200, { session: localSession });
    } catch {
      return reply(400, { error: '로그인 요청을 처리하지 못했어요.' });
    }
  };
}

export function localAuthPlugin(): Plugin {
  return {
    name: 'hookit-local-auth',
    apply: 'serve',
    configureServer(server) {
      let credentials: Credentials | null = null;
      try {
        const value = JSON.parse(
          readFileSync(resolve(server.config.root, '.local/auth.json'), 'utf8'),
        );
        if (
          /^[a-f0-9]{64}$/.test(value.salt) &&
          /^[a-f0-9]{64}$/.test(value.usernameHash) &&
          /^[a-f0-9]{128}$/.test(value.passwordHash)
        )
          credentials = value;
      } catch {
        /* Missing credentials fail closed; never create a default account. */
      }
      server.middlewares.use(createLocalAuth(credentials));
    },
  };
}
