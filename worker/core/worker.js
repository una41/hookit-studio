import { db } from './db.js';
import { digest } from './security.js';
import { accountToken, graph, buttonMessage, MetaError } from './instagram.js';
import { automationSchema, matchesComment } from './schema.js';
function messageFailure(error) {
    return {
        status: error instanceof MetaError && error.uncertain ? 'unknown' : 'failed',
        error: error instanceof MetaError
            ? error.message
            : '처리 중 오류가 발생했어요. 연결 상태와 서버 설정을 확인해 주세요.',
    };
}
async function enabled(workspaceId) {
    const [workspace, config] = await Promise.all([
        db.doc(`workspaces/${workspaceId}`).get(),
        db.doc(`workspaces/${workspaceId}/privateConfig/automation`).get(),
    ]);
    return workspace.data()?.status === 'active' && config.data()?.enabled === true;
}
async function stillActive(workspaceId, accountId, automationId) {
    const [account, automation] = await Promise.all([
        db.doc(`privateAccounts/${workspaceId}`).get(),
        db.doc(`workspaces/${workspaceId}/automations/${automationId}`).get(),
    ]);
    return ((await enabled(workspaceId)) &&
        account.data()?.accountId === accountId &&
        account.data()?.status === 'connected' &&
        automation.data()?.status === 'active');
}
const postback = (title, id) => ({
    type: 'postback',
    title,
    payload: `follin:${id}:check`,
});
async function send(account, recipient, message) {
    const result = await graph(`${account.id}/messages`, account.token, {}, { recipient, message });
    if (typeof result.message_id !== 'string' || !result.message_id) {
        throw new MetaError(true, 502, '발송 확인 ID를 받지 못했어요. 중복 방지를 위해 자동 재발송하지 않습니다.');
    }
    return result;
}
export async function processEvent(ref, event) {
    // Reserving the event prevents duplicate external effects after trigger redelivery.
    const claimed = await db.runTransaction(async (tx) => {
        if ((await tx.get(ref)).data()?.status !== 'pending')
            return false;
        tx.update(ref, { status: 'processing', startedAt: new Date().toISOString() });
        return true;
    });
    if (!claimed)
        return;
    try {
        if (!(await enabled(event.workspaceId))) {
            await ref.update({ status: 'disabled' });
            return;
        }
        const account = await accountToken(event.workspaceId);
        if (account.id !== event.accountId) {
            await ref.update({ status: 'stale_account' });
            return;
        }
        if (event.kind === 'comment')
            await processComment(event, account);
        else if (event.kind === 'postback')
            await processPostback(event, account);
        await ref.update({ status: 'processed', finishedAt: new Date().toISOString() });
    }
    catch (error) {
        await ref.update({ ...messageFailure(error), finishedAt: new Date().toISOString() });
    }
}
async function processComment(event, account) {
    const { workspaceId, body } = event;
    const commentId = String(body.id || '');
    const senderId = String(body.from?.id || '');
    const mediaId = String(body.media?.id || '');
    if (!/^\d+$/.test(commentId) ||
        !/^\d+$/.test(senderId) ||
        !/^\d+$/.test(mediaId) ||
        senderId === account.id ||
        body.parent_id ||
        typeof body.text !== 'string')
        return;
    if (!Number.isFinite(event.timestamp) ||
        event.timestamp > Date.now() + 300_000 ||
        Date.now() - event.timestamp > 7 * 24 * 60 * 60_000)
        return;
    const root = `workspaces/${workspaceId}`;
    const campaigns = await db
        .collection(`${root}/automations`)
        .where('status', '==', 'active')
        .get();
    const match = campaigns.docs.find((d) => d.data().post?.id === mediaId && matchesComment(d.data(), body.text));
    if (!match || Date.parse(match.data().createdAt) > event.timestamp)
        return;
    const campaign = automationSchema.parse(match.data());
    const id = digest(`${workspaceId}:${account.id}:${campaign.id}:${senderId}`);
    const delivery = db.doc(`${root}/deliveries/${id}`);
    const participant = db.doc(`${root}/participants/${id}`);
    const reserved = await db.runTransaction(async (tx) => {
        if ((await tx.get(participant)).exists)
            return false;
        tx.create(participant, {
            senderId,
            accountId: account.id,
            automationId: campaign.id,
            campaign,
            openingState: 'reserved',
            linkState: 'pending',
            checking: false,
        });
        tx.create(delivery, {
            automationId: campaign.id,
            automationName: campaign.name,
            username: String(body.from?.username || senderId),
            comment: body.text.slice(0, 2000),
            status: 'unknown',
            createdAt: new Date().toISOString(),
            replySent: false,
            links: campaign.links,
            error: '첫 DM 발송 결과 확인 중',
        });
        return true;
    });
    if (!reserved)
        return;
    if (!(await stillActive(workspaceId, account.id, campaign.id))) {
        await delivery.update({ status: 'failed', error: '발송 전에 자동화 또는 연결이 중지됐어요.' });
        return;
    }
    let opening;
    try {
        opening = await send(account, { comment_id: commentId }, buttonMessage(campaign.openingMessage, [postback(campaign.openingButton, id)]));
    }
    catch (error) {
        await delivery.update(messageFailure(error));
        await participant.update({ openingState: 'failed' });
        return;
    }
    await participant.update({ openingState: 'sent' });
    await delivery.update({
        status: 'opening_sent',
        openingMessageId: opening.message_id || null,
        openingSentAt: new Date().toISOString(),
        error: '',
    });
    // The public reply is independent; its failure must never resend the private DM.
    try {
        if (!(await stillActive(workspaceId, account.id, campaign.id)))
            return;
        const reply = await graph(`${commentId}/replies`, account.token, {}, { message: campaign.commentReply });
        await delivery.update({ replySent: true, replyId: reply.id || null });
    }
    catch {
        await delivery.update({
            replyError: '공개 대댓글을 발송하지 못했어요. 첫 DM은 다시 보내지 않습니다.',
        });
    }
}
async function processPostback(event, account) {
    const senderId = String(event.body.sender?.id || '');
    const match = String(event.body.postback?.payload || '').match(/^follin:([a-f0-9]{64}):check$/);
    if (!match ||
        !senderId ||
        !Number.isFinite(event.timestamp) ||
        event.timestamp > Date.now() + 300_000 ||
        Date.now() - event.timestamp > 24 * 60 * 60_000)
        return;
    const root = `workspaces/${event.workspaceId}`;
    const participant = db.doc(`${root}/participants/${match[1]}`);
    const delivery = db.doc(`${root}/deliveries/${match[1]}`);
    const state = await db.runTransaction(async (tx) => {
        const current = (await tx.get(participant)).data();
        if (!current ||
            current.senderId !== senderId ||
            current.accountId !== account.id ||
            current.openingState !== 'sent' ||
            current.linkState !== 'pending' ||
            current.checking ||
            Date.now() - (current.lastCheck || 0) < 5000)
            return null;
        tx.update(participant, { checking: true, lastCheck: Date.now() });
        return current;
    });
    if (!state)
        return;
    try {
        if (!(await stillActive(event.workspaceId, account.id, state.automationId)))
            return;
        await checkAndSend(event, account, match[1], participant, delivery, state);
    }
    finally {
        await participant.update({ checking: false });
    }
}
async function checkAndSend(event, account, id, participant, delivery, state) {
    const campaign = state.campaign;
    let follows;
    try {
        const result = await graph(String(state.senderId), account.token, { fields: 'is_user_follow_business' });
        if (typeof result.is_user_follow_business !== 'boolean')
            throw new Error('Follow status unavailable');
        follows = result.is_user_follow_business;
        await delivery.update({ lastFollowCheck: new Date().toISOString(), follows });
    }
    catch {
        await delivery.update({
            error: '팔로우 상태를 확인하지 못했어요. 미팔로우로 간주하지 않습니다.',
        });
        await send(account, { id: state.senderId }, buttonMessage('지금은 팔로우 상태를 확인하지 못했어요. 잠시 후 다시 확인해 주세요.', [
            postback('다시 확인', id),
        ]));
        return;
    }
    if (!(await stillActive(event.workspaceId, account.id, campaign.id)))
        return;
    if (!follows) {
        await send(account, { id: state.senderId }, buttonMessage(campaign.followMessage, [postback(campaign.recheckButton, id)]));
        await delivery.update({ status: 'awaiting_follow', error: '' });
        return;
    }
    await participant.update({ linkState: 'sending' });
    try {
        const result = await send(account, { id: state.senderId }, buttonMessage(campaign.deliveryMessage, campaign.links.map((link) => ({ type: 'web_url', title: link.label, url: link.url }))));
        await participant.update({ linkState: 'sent' });
        await delivery.update({
            status: 'completed',
            completedAt: new Date().toISOString(),
            linkMessageId: result.message_id || null,
            error: '',
        });
    }
    catch (error) {
        await participant.update({
            linkState: error instanceof MetaError && !error.uncertain ? 'pending' : 'unknown',
        });
        await delivery.update(messageFailure(error));
    }
}
