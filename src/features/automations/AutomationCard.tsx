import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Copy, Pause, Play, MessageCircle } from 'lucide-react';
import type { Automation } from '../../types';
import { StatusBadge } from '../../components/ui/Badge';
import { PostArtwork } from '../../components/ui/PostArtwork';
import { useWorkspace } from '../workspace/WorkspaceProvider';
import { useToast } from '../../components/ui/Toast';
import { errorMessage, number } from '../../lib/format';
import { isDemo } from '../../lib/firebase';
export function AutomationCard({
  automation,
  compact = false,
}: {
  automation: Automation;
  compact?: boolean;
}) {
  const { data, changeStatus, save } = useWorkspace();
  const notify = useToast();
  const [busy, setBusy] = useState(false);
  const count = data.deliveries.filter(
    (d) => d.automationId === automation.id && d.status === 'completed',
  ).length;
  async function toggle() {
    setBusy(true);
    try {
      await changeStatus(automation.id, automation.status === 'active' ? 'paused' : 'active');
      notify(
        automation.status === 'active'
          ? '자동화를 일시정지했어요.'
          : isDemo
            ? '미리보기 자동화를 활성화했어요. 실제 DM은 발송되지 않아요.'
            : '자동화를 활성화했어요.',
      );
    } catch (e) {
      notify(errorMessage(e), true);
    } finally {
      setBusy(false);
    }
  }
  async function duplicate() {
    setBusy(true);
    try {
      await save({
        ...automation,
        id: crypto.randomUUID(),
        name: `${automation.name.slice(0, 70)} (복사)`,
        post: null,
        status: 'draft',
        createdAt: new Date().toISOString(),
      });
      notify('초안으로 복제했어요. 새 게시물을 선택해 주세요.');
    } catch (e) {
      notify(errorMessage(e), true);
    } finally {
      setBusy(false);
    }
  }
  return (
    <article className={`automation-card ${compact ? 'automation-compact' : ''}`}>
      <Link
        className="automation-art-link"
        to={`/automations/${automation.id}/edit`}
        aria-label={`${automation.name} 수정`}
      >
        <PostArtwork post={automation.post} />
      </Link>
      <div className="automation-card-body">
        <div className="automation-card-top">
          <StatusBadge status={automation.status} />
          <span className="subtle-type">댓글 → DM</span>
        </div>
        <Link className="automation-name" to={`/automations/${automation.id}/edit`}>
          {automation.name}
          <ArrowUpRight size={16} />
        </Link>
        <div className="keyword-tags">
          {automation.trigger === 'all' ? (
            <span>모든 댓글</span>
          ) : (
            automation.keywords.map((keyword) => <span key={keyword}>#{keyword}</span>)
          )}
          {!automation.post && <span className="muted">게시물 선택 필요</span>}
        </div>
        <div className="automation-card-footer">
          <Link to={`/deliveries?automation=${automation.id}`}>
            <MessageCircle size={14} />
            자료 전달 <strong>{number(count)}</strong>
          </Link>
          <div>
            <button
              aria-label={`${automation.name} 복제`}
              className="icon-button"
              disabled={busy}
              onClick={() => void duplicate()}
            >
              <Copy size={15} />
            </button>
            <button
              aria-label={`${automation.name} ${automation.status === 'active' ? '일시정지' : '활성화'}`}
              className="icon-button"
              disabled={busy}
              onClick={() => void toggle()}
            >
              {automation.status === 'active' ? <Pause size={15} /> : <Play size={15} />}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
