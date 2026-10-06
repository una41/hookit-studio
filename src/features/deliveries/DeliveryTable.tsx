import type { Delivery } from '../../types';
import { StatusBadge } from '../../components/ui/Badge';
import { dateTime } from '../../lib/format';
import { ChevronRight } from 'lucide-react';
export function DeliveryTable({
  deliveries,
  onSelect,
}: {
  deliveries: Delivery[];
  onSelect: (delivery: Delivery) => void;
}) {
  return (
    <div className="table-scroll">
      <table className="delivery-table">
        <thead>
          <tr>
            <th>수신자</th>
            <th>자동화 · 댓글</th>
            <th>상태</th>
            <th>시작 시각</th>
            <th>
              <span className="sr-only">상세</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {deliveries.map((d) => (
            <tr key={d.id}>
              <td>
                <button className="table-user" onClick={() => onSelect(d)}>
                  <span className="user-avatar">{d.username[0].toUpperCase()}</span>
                  <strong>@{d.username}</strong>
                </button>
              </td>
              <td>
                <strong>{d.automationName}</strong>
                <span>{d.comment}</span>
              </td>
              <td>
                <StatusBadge status={d.status} />
              </td>
              <td className="table-time">{dateTime(d.createdAt)}</td>
              <td>
                <button
                  className="icon-button"
                  aria-label={`@${d.username} 발송 상세`}
                  onClick={() => onSelect(d)}
                >
                  <ChevronRight size={17} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
