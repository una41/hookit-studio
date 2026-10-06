import { CheckCircle2, Circle, ExternalLink, AlertCircle } from 'lucide-react';
import type { Delivery } from '../../types';
import { Modal } from '../../components/ui/Modal';
import { StatusBadge } from '../../components/ui/Badge';
import { dateTime } from '../../lib/format';
import { isSafeUrl } from '../automations/model';
export function DeliveryDetailPanel({
  delivery,
  onClose,
}: {
  delivery: Delivery;
  onClose: () => void;
}) {
  const complete = delivery.status === 'completed';
  const failed = delivery.status === 'failed';
  return (
    <Modal title="발송 상세" onClose={onClose}>
      <div className="delivery-detail-user">
        <span className="user-avatar">{delivery.username[0].toUpperCase()}</span>
        <div>
          <strong>@{delivery.username}</strong>
          <p>{delivery.automationName}</p>
        </div>
        <StatusBadge status={delivery.status} />
      </div>
      <blockquote className="comment-quote">
        “{delivery.comment}”<span>{dateTime(delivery.createdAt)}</span>
      </blockquote>
      <div className="delivery-timeline">
        <div>
          <CheckCircle2 size={18} />
          <section>
            <strong>댓글 수신</strong>
            <p>{dateTime(delivery.createdAt)}</p>
          </section>
        </div>
        <div>
          {failed ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
          <section>
            <strong>{failed ? '첫 DM 발송 실패' : '첫 안내 DM 발송'}</strong>
            <p>{failed ? delivery.error : '자료 받기 버튼과 함께 안내했어요.'}</p>
          </section>
        </div>
        <div>
          {complete ? <CheckCircle2 size={18} /> : <Circle size={18} />}
          <section>
            <strong>{complete ? '팔로우 확인 · 자료 전달 완료' : '자료 전달 대기'}</strong>
            <p>
              {delivery.completedAt
                ? dateTime(delivery.completedAt)
                : '팔로우 확인과 사용자 응답을 기다리고 있어요.'}
            </p>
          </section>
        </div>
        <div>
          {delivery.replySent ? <CheckCircle2 size={18} /> : <Circle size={18} />}
          <section>
            <strong>공개 대댓글 {delivery.replySent ? '발송' : '미발송'}</strong>
          </section>
        </div>
      </div>
      {complete && (
        <div className="detail-links">
          <h3>전달한 자료</h3>
          {delivery.links.map((link) =>
            isSafeUrl(link.url) ? (
              <a href={link.url} key={link.id} target="_blank" rel="noreferrer">
                {link.label}
                <ExternalLink size={15} />
              </a>
            ) : (
              <span key={link.id}>{link.label} (유효하지 않은 주소)</span>
            ),
          )}
        </div>
      )}
      <p className="field-hint">
        발송 성공은 메시지 전송 요청의 성공이며, 상대의 열람 여부는 포함하지 않아요.
      </p>
    </Modal>
  );
}
