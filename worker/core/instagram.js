import { settings } from '../runtime.js';
import { defineSecret } from '../runtime.js';
import { db } from './db.js';
import { decodeToken } from './security.js';
import { HttpError } from './auth.js';
export const metaSecret = defineSecret('META_APP_SECRET');
export const encryptionKey = defineSecret('TOKEN_ENCRYPTION_KEY');
export const verifyToken = defineSecret('META_WEBHOOK_VERIFY_TOKEN');
export class MetaError extends Error {
    uncertain;
    code;
    constructor(uncertain, code, message) {
        super(message);
        this.uncertain = uncertain;
        this.code = code;
    }
}
export function graphVersion() {
    const value = settings().META_GRAPH_VERSION;
    if (!value || !/^v\d+\.\d+$/.test(value))
        throw new HttpError(503, '인스타그램 API 버전 설정이 필요해요.');
    return value;
}
export async function metaRequest(url, options = {}) {
    let response;
    try {
        response = await fetch(url, { ...options, signal: AbortSignal.timeout(15000) });
    }
    catch {
        throw new MetaError(true, 0, 'Meta 요청 결과를 확인하지 못했어요. 중복 방지를 위해 자동 재발송하지 않습니다.');
    }
    const body = (await response.json().catch(() => null));
    if (!response.ok || !body || body.error)
        throw new MetaError(response.status >= 500 || !body, response.status, '인스타그램 요청을 완료하지 못했어요. 권한·연결 상태를 확인해 주세요.');
    return body;
}
export async function accountToken(workspaceId) {
    const account = (await db.doc(`privateAccounts/${workspaceId}`).get()).data();
    if (!account || account.status !== 'connected')
        throw new HttpError(409, '인스타그램을 먼저 연결해 주세요.');
    if (account.expiresAt <= Date.now()) {
        await db.doc(`workspaces/${workspaceId}/connections/instagram`).update({ status: 'reconnect' });
        throw new HttpError(409, '인스타그램 재연결이 필요해요.');
    }
    return {
        id: account.accountId,
        username: account.username,
        token: decodeToken(account.token, encryptionKey.value()),
    };
}
export async function graph(path, token, parameters = {}, payload) {
    const url = new URL(`https://graph.instagram.com/${graphVersion()}/${path}`);
    for (const [key, value] of Object.entries(parameters))
        url.searchParams.set(key, value);
    return metaRequest(url.toString(), {
        method: payload ? 'POST' : 'GET',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        ...(payload ? { body: JSON.stringify(payload) } : {}),
    });
}
export function buttonMessage(text, buttons) {
    return { attachment: { type: 'template', payload: { template_type: 'button', text, buttons } } };
}
