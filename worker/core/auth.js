import { settings } from '../runtime.js';
import { db } from './db.js';
export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
export async function authorize(req) {
  const match = req.headers.authorization?.match(/^Bearer (.+)$/);
  if (!match) throw new HttpError(401, '로그인이 필요해요.');
  const env = settings();
  if (!env.FIREBASE_WEB_API_KEY) throw new HttpError(503, 'Firebase 서버 설정이 필요해요.');
  const result = await fetch(
    'https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=' +
      encodeURIComponent(env.FIREBASE_WEB_API_KEY),
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken: match[1] }),
      signal: AbortSignal.timeout(10000),
    },
  );
  const data = await result.json();
  const account = data.users?.[0];
  if (!result.ok || !account || account.disabled)
    throw new HttpError(401, '로그인이 만료됐어요. 다시 로그인해 주세요.');
  // Bind the validated ID token to this Firebase project as well as its account.
  let claims;
  try {
    claims = JSON.parse(Buffer.from(match[1].split('.')[1], 'base64url').toString());
  } catch {
    throw new HttpError(401, '인증 정보를 확인해 주세요.');
  }
  if (
    claims.aud !== env.FIREBASE_PROJECT_ID ||
    claims.iss !== 'https://securetoken.google.com/' + env.FIREBASE_PROJECT_ID ||
    claims.sub !== account.localId ||
    claims.exp * 1000 <= Date.now() ||
    Number(account.validSince || 0) > claims.auth_time
  )
    throw new HttpError(401, '로그인이 만료됐어요.');
  const uid = account.localId;
  const user = (await db.doc('users/' + uid).get()).data();
  if (!user || user.status !== 'active' || !/^[-\w]+$/.test(user.workspaceId))
    throw new HttpError(403, '작업공간 접근 권한이 없어요.');
  if ((await db.doc('workspaces/' + user.workspaceId).get()).data()?.status !== 'active')
    throw new HttpError(403, '작업공간이 중지되어 있어요.');
  return { uid, workspaceId: user.workspaceId };
}
