import type { AutomationStatus, DeliveryStatus } from '../../types';
const automationLabels = { active: '실행 중', draft: '초안', paused: '일시정지' };
const deliveryLabels = {
  opening_sent: '안내 DM 발송',
  awaiting_follow: '팔로우 대기',
  completed: '자료 발송 완료',
  failed: '발송 실패',
  unknown: '결과 확인 필요',
};
export function StatusBadge({ status }: { status: AutomationStatus | DeliveryStatus }) {
  const label = { ...automationLabels, ...deliveryLabels }[status];
  return (
    <span className={`status-badge status-${status}`}>
      <span />
      {label}
    </span>
  );
}
