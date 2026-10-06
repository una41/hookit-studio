import { test } from 'node:test';
import assert from 'node:assert/strict';
import { automationSchema, matchesComment, selectCommentReply } from './schema';
const draft = {
  id: 'example-id',
  name: '테스트',
  post: null,
  status: 'draft',
  trigger: 'keyword',
  match: 'contains',
  keywords: [],
  openingMessage: '',
  openingButton: '',
  followMessage: '',
  profileButton: '',
  recheckButton: '',
  deliveryMessage: '',
  links: [{ id: 'link-one', label: '', url: '' }],
  commentReply: '',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};
test('server schema accepts drafts but requires a complete active flow', () => {
  assert.equal(automationSchema.safeParse(draft).success, true);
  assert.equal(automationSchema.safeParse({ ...draft, status: 'active' }).success, false);
});
test('server rejects ownership injection and document path traversal', () => {
  assert.equal(automationSchema.safeParse({ ...draft, workspaceId: 'other-user' }).success, false);
  assert.equal(automationSchema.safeParse({ ...draft, id: '../other-user' }).success, false);
  assert.equal(automationSchema.safeParse({ ...draft, status: 'unsupported' }).success, false);
});
test('server does not match drafts regardless of trigger type', () => {
  const value = automationSchema.parse({ ...draft, trigger: 'all' });
  assert.equal(matchesComment(value, '자료'), false);
});

test('reply variants support legacy data, cap five and select across the full list', () => {
  assert.equal(
    selectCommentReply({ commentReply: '기존 문구' }, () => 0),
    '기존 문구',
  );
  const commentReplies = ['하나', '둘', '셋', '넷', '다섯'];
  for (let i = 0; i < 5; i++)
    assert.equal(
      selectCommentReply({ commentReply: '기존', commentReplies }, () => (i + 0.5) / 5),
      commentReplies[i],
    );
  assert.equal(automationSchema.safeParse({ ...draft, commentReplies }).success, true);
  assert.equal(
    automationSchema.safeParse({ ...draft, commentReplies: [...commentReplies, '여섯'] }).success,
    false,
  );
  assert.equal(automationSchema.safeParse({ ...draft, commentReplies: [] }).success, false);
  assert.throws(() => selectCommentReply({ commentReply: '', commentReplies: [' '] }));
});
