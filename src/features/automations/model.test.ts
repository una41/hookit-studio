import { describe, it, expect } from 'vitest';
import { newAutomation, validateAutomation, matchesComment, isSafeUrl } from './model';

function readyAutomation() {
  return {
    ...newAutomation(),
    name: '자료 공유',
    status: 'active' as const,
    post: { id: 'post-1', title: '자료 게시물', kind: 'IMAGE' as const, theme: 'sage' as const },
    keywords: ['자료', 'NOTE'],
    links: [{ id: 'one', label: '자료 보기', url: 'https://example.com/guide' }],
  };
}
describe('activation validation', () => {
  it('allows incomplete drafts but rejects incomplete active flows', () => {
    const draft = { ...newAutomation(), name: '나중에 완성할 초안' };
    expect(validateAutomation(draft, 'draft')).toEqual([]);
    expect(validateAutomation(draft, 'active')).toEqual(
      expect.arrayContaining([
        '게시물을 선택해 주세요.',
        '키워드를 하나 이상 추가해 주세요.',
        '링크 버튼 이름과 올바른 HTTPS 주소를 입력해 주세요.',
      ]),
    );
  });
  it('validates one or two HTTPS resource buttons', () => {
    const value = readyAutomation();
    expect(validateAutomation(value, 'active')).toEqual([]);
    value.links.push({ id: 'two', label: '추가 자료', url: 'https://example.com/extra' });
    expect(validateAutomation(value, 'active')).toEqual([]);
    value.links.push({ id: 'three', label: '세 번째', url: 'https://example.com/third' });
    expect(validateAutomation(value, 'active')).toContain('링크 버튼은 1~2개로 구성해 주세요.');
  });
  it('rejects missing follow prompts and unsafe resource URLs', () => {
    const value = readyAutomation();
    value.followMessage = '  ';
    expect(validateAutomation(value, 'active')).toContain(
      '메시지와 버튼 문구를 모두 입력해 주세요.',
    );
    expect(isSafeUrl('https://user:password@example.com')).toBe(false);
    expect(isSafeUrl('javascript:alert(1)')).toBe(false);
    expect(isSafeUrl('http://example.com')).toBe(false);
  });
});
describe('comment matching', () => {
  it('normalizes case and full-width characters without removing inner spaces', () => {
    const value = readyAutomation();
    expect(matchesComment(value, '  ｎｏｔｅ 부탁해요 ')).toBe(true);
    expect(matchesComment(value, '자 료')).toBe(false);
  });
  it('distinguishes contains, exact, and all modes', () => {
    const value = readyAutomation();
    expect(matchesComment(value, '자료 부탁해요')).toBe(true);
    expect(matchesComment({ ...value, match: 'exact' }, '자료 부탁해요')).toBe(false);
    expect(matchesComment({ ...value, match: 'exact' }, ' 자료 ')).toBe(true);
    expect(matchesComment({ ...value, trigger: 'all' }, '🌿')).toBe(true);
  });
  it('does not send for paused campaigns or blank keywords', () => {
    const value = readyAutomation();
    expect(matchesComment({ ...value, status: 'paused' }, '자료')).toBe(false);
    expect(matchesComment({ ...value, keywords: [' '] }, 'hello')).toBe(false);
  });
});
