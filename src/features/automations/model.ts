import type { Automation, AutomationStatus } from '../../types';

export function newAutomation(): Automation {
  return {
    id: crypto.randomUUID(),
    name: '',
    post: null,
    status: 'draft',
    trigger: 'keyword',
    match: 'contains',
    keywords: [],
    openingMessage: '안녕하세요! 요청하신 자료를 준비했어요. 아래 버튼을 눌러 받아보세요 😊',
    openingButton: '자료 받기',
    followMessage:
      '자료는 팔로워분들께 드리고 있어요. 계정을 팔로우한 뒤 아래 버튼을 눌러주세요 🌿',
    profileButton: '',
    recheckButton: '팔로우했어요',
    deliveryMessage: '기다려 주셔서 감사해요! 아래에서 자료를 확인해 주세요 ✨',
    links: [{ id: crypto.randomUUID(), label: '자료 확인하기', url: '' }],
    commentReply: '안내 DM을 보냈어요 💌 메시지 요청함도 확인해 주세요!',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}
export function isSafeUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password;
  } catch {
    return false;
  }
}
export function validateAutomation(value: Automation, status: AutomationStatus): string[] {
  const errors: string[] = [];
  if (!value.name.trim()) errors.push('자동화 이름을 입력해 주세요.');
  if (value.name.length > 80) errors.push('자동화 이름은 80자 이내로 입력해 주세요.');
  if (value.keywords.length > 30) errors.push('키워드는 최대 30개까지 등록할 수 있어요.');
  if (value.keywords.some((keyword) => keyword.length > 60 || !keyword.trim()))
    errors.push('키워드는 빈 값 없이 60자 이내로 입력해 주세요.');
  if (
    [value.openingButton, value.recheckButton, ...value.links.map((link) => link.label)].some(
      (text) => text.length > 20,
    )
  )
    errors.push('버튼 이름은 20자 이내로 입력해 주세요.');
  if (
    [value.openingMessage, value.followMessage, value.deliveryMessage].some(
      (text) => text.length > 600,
    ) ||
    value.commentReply.length > 500
  )
    errors.push('메시지 길이 제한을 확인해 주세요.');
  if (status !== 'active') return errors;
  if (!value.post) errors.push('게시물을 선택해 주세요.');
  if (value.trigger === 'keyword' && !value.keywords.some((k) => k.trim()))
    errors.push('키워드를 하나 이상 추가해 주세요.');
  const required = [
    value.openingMessage,
    value.openingButton,
    value.followMessage,
    value.recheckButton,
    value.deliveryMessage,
    value.commentReply,
  ];
  if (required.some((text) => !text.trim()))
    errors.push('메시지와 버튼 문구를 모두 입력해 주세요.');
  if (value.links.length < 1 || value.links.length > 2)
    errors.push('링크 버튼은 1~2개로 구성해 주세요.');
  if (value.links.some((link) => !link.label.trim() || !isSafeUrl(link.url)))
    errors.push('링크 버튼 이름과 올바른 HTTPS 주소를 입력해 주세요.');
  return errors;
}
export function matchesComment(automation: Automation, comment: string) {
  if (automation.status !== 'active') return false;
  if (automation.trigger === 'all') return true;
  const normalize = (text: string) => text.trim().normalize('NFKC').toLocaleLowerCase();
  const text = normalize(comment);
  return automation.keywords.some(
    (keyword) =>
      normalize(keyword) &&
      (automation.match === 'exact'
        ? text === normalize(keyword)
        : text.includes(normalize(keyword))),
  );
}
