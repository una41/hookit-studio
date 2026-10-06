import { getAuth } from 'firebase-admin/auth';
import type { Request } from 'express';
import { db } from './db';
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export async function authorize(req: Request) {
  const match = req.headers.authorization?.match(/^Bearer (.+)$/);
  if (!match) throw new HttpError(401, '로그인이 필요해요.');
  let uid: string;
  try {
    uid = (await getAuth().verifyIdToken(match[1], true)).uid;
  } catch {
    throw new HttpError(401, '로그인이 만료됐어요. 다시 로그인해 주세요.');
  }
  const user = (await db.doc(`users/${uid}`).get()).data();
  if (
    !user ||
    user.status !== 'active' ||
    typeof user.workspaceId !== 'string' ||
    !/^[\w-]+$/.test(user.workspaceId)
  )
    throw new HttpError(403, '작업공간 접근 권한이 없어요.');
  const workspace = (await db.doc(`workspaces/${user.workspaceId}`).get()).data();
  if (workspace?.status !== 'active') throw new HttpError(403, '작업공간이 중지되어 있어요.');
  return { uid, workspaceId: user.workspaceId as string };
}
