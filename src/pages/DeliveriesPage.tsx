import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Send,
  Clock3,
  AlertCircle,
} from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { DeliveryTable } from '../features/deliveries/DeliveryTable';
import { DeliveryDetailPanel } from '../features/deliveries/DeliveryDetailPanel';
import { useWorkspace } from '../features/workspace/WorkspaceProvider';
import { localDay, number } from '../lib/format';
import { isDemo } from '../lib/firebase';
export function DeliveriesPage() {
  const { data, refresh, refreshedAt } = useWorkspace();
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [days, setDays] = useState('all');
  const [page, setPage] = useState(1);
  const automationId = params.get('automation') || 'all';
  const selected = data.deliveries.find((d) => d.id === params.get('delivery'));
  const filtered = useMemo(
    () =>
      data.deliveries.filter((d) => {
        const start = new Date();
        start.setDate(start.getDate() - (Number(days) - 1));
        return (
          (status === 'all' || d.status === status) &&
          (automationId === 'all' || d.automationId === automationId) &&
          d.username.toLowerCase().includes(search.toLowerCase()) &&
          (days === 'all' || localDay(d.createdAt) >= localDay(start))
        );
      }),
    [data.deliveries, search, status, automationId, days],
  );
  const pageSize = 10;
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const current = Math.min(page, pageCount);
  const rows = filtered.slice((current - 1) * pageSize, current * pageSize);
  function selectDelivery(id: string | null) {
    const next = new URLSearchParams(params);
    if (id) next.set('delivery', id);
    else next.delete('delivery');
    setParams(next, { replace: true });
  }
  return (
    <>
      <PageHeader
        eyebrow="DELIVERY HISTORY"
        title="발송 내역"
        description="누구에게 어떤 이야기를 전했는지, 한곳에서 확인하세요."
        action={
          <Button variant="secondary" onClick={() => void refresh()}>
            <RefreshCw size={16} />
            새로고침
          </Button>
        }
      />
      <div className="delivery-summary">
        {[
          {
            icon: Send,
            label: '자료 발송 완료',
            value: data.deliveries.filter((d) => d.status === 'completed').length,
            color: 'mint',
          },
          {
            icon: Clock3,
            label: '팔로우 확인 대기',
            value: data.deliveries.filter((d) => d.status === 'awaiting_follow').length,
            color: 'sand',
          },
          {
            icon: AlertCircle,
            label: '발송 실패 · 확인 필요',
            value: data.deliveries.filter((d) => d.status === 'failed' || d.status === 'unknown')
              .length,
            color: 'rose',
          },
        ].map((item) => (
          <div key={item.label}>
            <span className={`stat-icon icon-${item.color}`}>
              <item.icon size={19} />
            </span>
            <span>{item.label}</span>
            <strong>
              {number(item.value)}
              <small>건</small>
            </strong>
          </div>
        ))}
      </div>
      <section className="panel delivery-panel">
        <div className="delivery-filters">
          <div className="search-field">
            <Search size={17} />
            <input
              aria-label="수신자 검색"
              placeholder="인스타그램 아이디 검색"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <select
            aria-label="자동화 필터"
            value={automationId}
            onChange={(e) => {
              const next = new URLSearchParams(params);
              e.target.value === 'all'
                ? next.delete('automation')
                : next.set('automation', e.target.value);
              setParams(next);
              setPage(1);
            }}
          >
            <option value="all">모든 자동화</option>
            {data.automations.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
          <select
            aria-label="발송 상태 필터"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
          >
            <option value="all">모든 상태</option>
            <option value="completed">자료 발송 완료</option>
            <option value="awaiting_follow">팔로우 대기</option>
            <option value="opening_sent">안내 DM 발송</option>
            <option value="failed">발송 실패</option>
            <option value="unknown">결과 확인 필요</option>
          </select>
          <select
            aria-label="발송 기간 필터"
            value={days}
            onChange={(e) => {
              setDays(e.target.value);
              setPage(1);
            }}
          >
            <option value="all">전체 기간</option>
            <option value="1">오늘</option>
            <option value="7">최근 7일</option>
            <option value="30">최근 30일</option>
          </select>
        </div>
        <div className="table-caption">
          <span>
            총 <strong>{number(filtered.length)}</strong>건
          </span>
          <small>
            {isDemo ? '미리보기 샘플 기록' : '최근 기록 최대 500건 기준'} ·{' '}
            {refreshedAt?.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })} 조회
          </small>
        </div>
        {rows.length ? (
          <DeliveryTable deliveries={rows} onSelect={(d) => selectDelivery(d.id)} />
        ) : (
          <EmptyState
            title="해당하는 발송 내역이 없어요"
            description="검색 조건을 바꾸거나 자동화가 시작된 후 다시 확인해 주세요."
          />
        )}
        <div className="pagination">
          <span>
            {filtered.length
              ? `${(current - 1) * pageSize + 1}–${Math.min(current * pageSize, filtered.length)}`
              : '0'}{' '}
            / {filtered.length}건
          </span>
          <div>
            <button
              className="icon-button"
              aria-label="이전 페이지"
              disabled={current === 1}
              onClick={() => setPage(current - 1)}
            >
              <ChevronLeft size={17} />
            </button>
            <span>
              {current} / {pageCount}
            </span>
            <button
              className="icon-button"
              aria-label="다음 페이지"
              disabled={current === pageCount}
              onClick={() => setPage(current + 1)}
            >
              <ChevronRight size={17} />
            </button>
          </div>
        </div>
      </section>
      {selected && <DeliveryDetailPanel delivery={selected} onClose={() => selectDelivery(null)} />}
    </>
  );
}
