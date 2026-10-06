import { randomBytes } from 'node:crypto';
import { db } from './db';
import { digest, encodeToken } from './security';
import { encryptionKey, graph, metaRequest, metaSecret } from './instagram';
import { HttpError } from './auth';
export function appOrigin() {
  const value = process.env.APP_ORIGIN;
  if (!value || new URL(value).protocol !== 'https:')
    throw new HttpError(503, '서비스 주소 설정이 필요해요.');
  return new URL(value).origin;
}
function redirectUri() {
  const base = process.env.API_BASE_URL;
  if (!base || new URL(base).protocol !== 'https:' || !process.env.META_APP_ID)
    throw new HttpError(503, '인스타그램 연결 설정이 필요해요.');
  return `${base.replace(/\/$/, '')}/instagram/callback`;
}
export async function beginConnection(uid: string, workspaceId: string) {
  const state = randomBytes(32).toString('hex');
  const redirect = redirectUri();
  await db
    .doc(`oauthStates/${digest(state)}`)
    .set({ uid, workspaceId, expiresAt: Date.now() + 10 * 60_000 });
  const url = new URL('https://www.instagram.com/oauth/authorize');
  Object.entries({
    client_id: process.env.META_APP_ID!,
    redirect_uri: redirect,
    response_type: 'code',
    state,
    enable_fb_login: '0',
    force_authentication: '1',
    scope:
      'instagram_business_basic,instagram_business_manage_comments,instagram_business_manage_messages',
  }).forEach(([k, v]) => url.searchParams.set(k, v));
  return url.toString();
}
export async function finishConnection(state: string, code: string) {
  if (!/^[0-9a-f]{64}$/.test(state) || !code || code.length > 4096)
    throw new HttpError(400, '잘못된 연결 응답입니다.');
  const stateRef = db.doc(`oauthStates/${digest(state)}`);
  const workspaceId = await db.runTransaction(async (tx) => {
    const stateData = (await tx.get(stateRef)).data();
    if (!stateData || stateData.expiresAt < Date.now())
      throw new HttpError(400, '연결 요청이 만료됐어요.');
    const user = (await tx.get(db.doc(`users/${stateData.uid}`))).data();
    const workspace = (await tx.get(db.doc(`workspaces/${stateData.workspaceId}`))).data();
    if (
      user?.status !== 'active' ||
      user.workspaceId !== stateData.workspaceId ||
      workspace?.status !== 'active'
    )
      throw new HttpError(403, '연결 권한이 없어요.');
    tx.delete(stateRef);
    return stateData.workspaceId as string;
  });
  const body = new URLSearchParams({
    client_id: process.env.META_APP_ID!,
    client_secret: metaSecret.value(),
    grant_type: 'authorization_code',
    redirect_uri: redirectUri(),
    code,
  });
  const short = await metaRequest<{ access_token: string; user_id: string }>(
    'https://api.instagram.com/oauth/access_token',
    { method: 'POST', body },
  );
  const longUrl = new URL('https://graph.instagram.com/access_token');
  longUrl.search = new URLSearchParams({
    grant_type: 'ig_exchange_token',
    client_secret: metaSecret.value(),
    access_token: short.access_token,
  }).toString();
  const long = await metaRequest<{ access_token: string; expires_in: number }>(longUrl.toString());
  const profile = await graph<{ user_id?: string; id?: string; username: string }>(
    'me',
    long.access_token,
    { fields: 'user_id,username' },
  );
  const accountId = String(profile.user_id || profile.id || short.user_id);
  if (!/^\d+$/.test(accountId) || !profile.username || !long.access_token || !long.expires_in)
    throw new HttpError(502, '계정 정보를 확인하지 못했어요.');
  await db.runTransaction(async (tx) => {
    const registry = db.doc(`instagramAccounts/${accountId}`);
    const existing = (await tx.get(registry)).data();
    const previous = (await tx.get(db.doc(`privateAccounts/${workspaceId}`))).data();
    if (existing && existing.workspaceId !== workspaceId)
      throw new HttpError(409, '다른 작업공간에 연결된 계정입니다.');
    if (previous && previous.accountId !== accountId)
      throw new HttpError(409, '기존 계정을 먼저 연결 해제해 주세요.');
    tx.set(registry, { workspaceId });
    tx.set(db.doc(`privateAccounts/${workspaceId}`), {
      accountId,
      username: profile.username,
      status: 'connected',
      token: encodeToken(long.access_token, encryptionKey.value()),
      expiresAt: Date.now() + long.expires_in * 1000,
    });
    tx.set(db.doc(`workspaces/${workspaceId}/connections/instagram`), {
      id: accountId,
      username: profile.username,
      name: profile.username,
      status: 'connected',
      connectedAt: new Date().toISOString(),
    });
  });
  // Subscribe this connected account to the events used by the workflow.
  try {
    await graph(
      `${accountId}/subscribed_apps`,
      long.access_token,
      {},
      { subscribed_fields: ['comments', 'messages', 'messaging_postbacks'] },
    );
  } catch (error) {
    const batch = db.batch();
    batch.update(db.doc(`privateAccounts/${workspaceId}`), { status: 'reconnect' });
    batch.update(db.doc(`workspaces/${workspaceId}/connections/instagram`), {
      status: 'reconnect',
    });
    await batch.commit();
    throw error;
  }
}
