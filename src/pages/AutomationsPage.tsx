import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';
import { AutomationCard } from '../features/automations/AutomationCard';
import { useWorkspace } from '../features/workspace/WorkspaceProvider';
import { EmptyState } from '../components/ui/EmptyState';
export function AutomationsPage() {
  const { data } = useWorkspace();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const items = data.automations.filter(
    (a) =>
      (status === 'all' || a.status === status) &&
      `${a.name} ${a.keywords.join(' ')}`.toLowerCase().includes(search.toLowerCase()),
  );
  return (
    <>
      <PageHeader
        eyebrow="AUTOMATIONS"
        title="나의 자동화"
        description="게시물의 작은 관심을, 의미 있는 대화로 이어보세요."
        action={
          <Link className="button button-primary" to="/automations/new">
            <Plus size={17} />새 자동화 만들기
          </Link>
        }
      />
      <div className="list-toolbar">
        <div className="filter-tabs" role="group" aria-label="자동화 상태 필터">
          {[
            ['all', '전체'],
            ['active', '실행 중'],
            ['draft', '초안'],
            ['paused', '일시정지'],
          ].map(([value, label]) => (
            <button
              key={value}
              aria-pressed={status === value}
              className={status === value ? 'selected' : ''}
              onClick={() => setStatus(value)}
            >
              {label}
              <span>
                {data.automations.filter((a) => value === 'all' || a.status === value).length}
              </span>
            </button>
          ))}
        </div>
        <div className="search-field">
          <Search size={17} />
          <input
            aria-label="자동화 검색"
            placeholder="자동화 이름, 키워드 검색"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>
      {items.length ? (
        <div className="automation-grid automation-full-grid">
          {items.map((a) => (
            <AutomationCard key={a.id} automation={a} />
          ))}
          <Link className="new-automation-card" to="/automations/new">
            <span>
              <Plus size={24} />
            </span>
            <strong>새로운 연결 만들기</strong>
            <p>다음 게시물도 HOOKIT STUDIO와 함께하세요.</p>
          </Link>
        </div>
      ) : (
        <div className="panel">
          <EmptyState
            title={data.automations.length ? '검색 결과가 없어요' : '아직 자동화가 없어요'}
            description={
              data.automations.length
                ? '다른 이름이나 상태로 다시 찾아보세요.'
                : '첫 번째 게시물의 자동화를 만들어 주세요.'
            }
            action={
              !data.automations.length && (
                <Link to="/automations/new" className="button button-primary">
                  자동화 만들기
                </Link>
              )
            }
          />
        </div>
      )}
    </>
  );
}
