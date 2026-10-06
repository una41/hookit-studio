import { settings } from '../runtime.js';
import express from 'express';
import { authorize, HttpError } from './auth.js';
import { db } from './db.js';
import { automationSchema } from './schema.js';
import { accountToken, graph, MetaError } from './instagram.js';
import { appOrigin, beginConnection, finishConnection } from './oauth.js';
import { digest } from './security.js';
export const app = express();
app.disable('x-powered-by');
app.use((req, res, next) => {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Referrer-Policy', 'no-referrer');
    const origin = req.headers.origin;
    if (origin && origin !== settings().APP_ORIGIN) {
        res.status(403).json({ error: '허용되지 않은 요청 출처입니다.' });
        return;
    }
    if (origin) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Vary', 'Origin');
    }
    res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    if (req.method === 'OPTIONS') {
        res.status(204).end();
        return;
    }
    next();
});
app.use(express.json({ limit: '64kb' }));
function route(fn) {
    return (req, res) => {
        void fn(req, res).catch((error) => {
            const status = error instanceof HttpError ? error.status : error instanceof MetaError ? 502 : 500;
            res.status(status).json({
                error: error instanceof HttpError || error instanceof MetaError
                    ? error.message
                    : '요청을 처리하지 못했어요. 서버 설정과 연결 상태를 확인해 주세요.',
            });
        });
    };
}
app.post('/instagram/connect', route(async (req, res) => {
    const { uid, workspaceId } = await authorize(req);
    res.json({ url: await beginConnection(uid, workspaceId) });
}));
app.get('/instagram/callback', route(async (req, res) => {
    const target = `${appOrigin()}/settings/instagram`;
    try {
        if (req.query.error)
            throw new Error();
        await finishConnection(String(req.query.state || ''), String(req.query.code || ''));
        res.redirect(`${target}?connection=success`);
    }
    catch {
        res.redirect(`${target}?connection=failed`);
    }
}));
app.get('/instagram/media', route(async (req, res) => {
    const { workspaceId } = await authorize(req);
    const account = await accountToken(workspaceId);
    const response = await graph(`${account.id}/media`, account.token, {
        fields: 'id,caption,media_type,media_url,thumbnail_url,permalink',
        limit: '50',
    });
    const posts = response.data.map((item, i) => ({
        id: item.id,
        title: (item.caption || '제목 없는 게시물').slice(0, 2400),
        kind: item.media_type,
        theme: ['sage', 'sand', 'rose', 'ink'][i % 4],
        ...(item.thumbnail_url || item.media_url
            ? { mediaUrl: item.thumbnail_url || item.media_url }
            : {}),
        ...(item.permalink ? { permalink: item.permalink } : {}),
    }));
    const batch = db.batch();
    for (const post of posts)
        batch.set(db.doc(`privateMedia/${workspaceId}/items/${post.id}`), {
            ...post,
            accountId: account.id,
        });
    await batch.commit();
    res.json({ posts });
}));
app.post('/instagram/disconnect', route(async (req, res) => {
    const { workspaceId } = await authorize(req);
    await db.runTransaction(async (tx) => {
        const privateRef = db.doc(`privateAccounts/${workspaceId}`);
        const account = (await tx.get(privateRef)).data();
        const campaigns = await tx.get(db.collection(`workspaces/${workspaceId}/automations`));
        for (const campaign of campaigns.docs) {
            if (campaign.data().status === 'active')
                tx.update(campaign.ref, { status: 'paused', updatedAt: new Date().toISOString() });
            if (campaign.data().post)
                tx.delete(db.doc(`workspaces/${workspaceId}/postLocks/${digest(String(campaign.data().post.id))}`));
        }
        tx.delete(privateRef);
        tx.delete(db.doc(`workspaces/${workspaceId}/connections/instagram`));
        if (account)
            tx.delete(db.doc(`instagramAccounts/${account.accountId}`));
    });
    res.json({ ok: true });
}));
app.post('/automations', route(async (req, res) => {
    const { workspaceId } = await authorize(req);
    const parsed = automationSchema.safeParse(req.body);
    if (!parsed.success)
        throw new HttpError(400, parsed.error.issues[0]?.message || '설정을 확인해 주세요.');
    const automation = parsed.data;
    const root = `workspaces/${workspaceId}`;
    const target = db.doc(`${root}/automations/${automation.id}`);
    await db.runTransaction(async (tx) => {
        const old = (await tx.get(target)).data();
        const account = (await tx.get(db.doc(`privateAccounts/${workspaceId}`))).data();
        const verification = (await tx.get(db.doc(`${root}/privateConfig/automation`))).data();
        const lock = automation.post
            ? db.doc(`${root}/postLocks/${digest(automation.post.id)}`)
            : null;
        const lockData = lock ? (await tx.get(lock)).data() : null;
        const media = automation.post
            ? (await tx.get(db.doc(`privateMedia/${workspaceId}/items/${automation.post.id}`))).data()
            : null;
        if (automation.status === 'active') {
            if (!verification?.enabled)
                throw new HttpError(409, '실제 발송 연동 검증이 아직 완료되지 않았어요. 초안으로 저장해 주세요.');
            if (!account || account.status !== 'connected' || account.expiresAt <= Date.now())
                throw new HttpError(409, '인스타그램을 연결하거나 재연결해 주세요.');
            if (!media || media.accountId !== account.accountId)
                throw new HttpError(400, '연결된 계정의 게시물을 다시 선택해 주세요.');
            if (lockData && lockData.automationId !== automation.id)
                throw new HttpError(409, '이 게시물에 실행 중인 자동화가 있어요.');
        }
        if (old?.post && (old.post.id !== automation.post?.id || automation.status !== 'active')) {
            const oldLock = db.doc(`${root}/postLocks/${digest(String(old.post.id))}`);
            const oldLockData = (await tx.get(oldLock)).data();
            if (oldLockData?.automationId === automation.id)
                tx.delete(oldLock);
        }
        if (automation.status === 'active' && lock)
            tx.set(lock, { automationId: automation.id });
        const now = new Date().toISOString();
        tx.set(target, { ...automation, createdAt: old?.createdAt || now, updatedAt: now });
    });
    res.json({ ok: true });
}));
app.use((_req, res) => {
    res.status(404).json({ error: '요청한 기능을 찾을 수 없어요.' });
});
