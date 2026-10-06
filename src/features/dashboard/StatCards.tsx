import { MessageCircle, Send, Users, Zap, type LucideIcon } from 'lucide-react';
import { useWorkspace } from '../workspace/WorkspaceProvider';
import { localDay, number } from '../../lib/format';
export function StatCards() {
  const { data } = useWorkspace();
  const today = localDay(new Date());
  const rows = data.deliveries.filter((d) => localDay(d.createdAt) === today);
  const metrics: {
    label: string;
    value: number;
    unit: string;
    icon: LucideIcon;
    note: string;
    tone: string;
  }[] = [
    {
      label: '오늘 안내 DM',
      value: rows.filter((d) => d.status !== 'failed' && d.status !== 'unknown').length,
      unit: '건',
      icon: MessageCircle,
      note: '첫 메시지 발송 성공',
      tone: 'mint',
    },
    {
      label: '오늘 자료 전달',
      value: data.deliveries.filter((d) => d.completedAt && localDay(d.completedAt) === today)
        .length,
      unit: '건',
      icon: Send,
      note: '링크 메시지 발송 완료',
      tone: 'blue',
    },
    {
      label: '팔로우 확인 대기',
      value: data.deliveries.filter((d) => d.status === 'awaiting_follow').length,
      unit: '명',
      icon: Users,
      note: '재확인을 기다리고 있어요',
      tone: 'sand',
    },
    {
      label: '실행 중인 자동화',
      value: data.automations.filter((a) => a.status === 'active').length,
      unit: '개',
      icon: Zap,
      note: `전체 ${data.automations.length}개 자동화 중`,
      tone: 'lavender',
    },
  ];
  return (
    <section className="stat-grid" aria-label="발송 요약">
      {metrics.map((metric) => (
        <article className="stat-card" key={metric.label}>
          <div className="stat-top">
            <span>{metric.label}</span>
            <span className={`stat-icon icon-${metric.tone}`}>
              <metric.icon size={18} strokeWidth={1.7} />
            </span>
          </div>
          <div className="stat-value">
            {number(metric.value)}
            <span>{metric.unit}</span>
          </div>
          <p>
            <span className="stat-note-dot" />
            {metric.note}
          </p>
        </article>
      ))}
    </section>
  );
}
