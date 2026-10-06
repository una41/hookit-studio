import { CreateAutomationLink } from '../features/automations/CreateAutomationLink';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUpRight, Plus, Zap, MessageCircle, Send, Instagram } from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';
import { StatCards } from '../features/dashboard/StatCards';
import { ActivityChart } from '../features/dashboard/ActivityChart';
import { ConnectionCard } from '../features/dashboard/ConnectionCard';
import { AutomationCard } from '../features/automations/AutomationCard';
import { useWorkspace } from '../features/workspace/WorkspaceProvider';
import { EmptyState } from '../components/ui/EmptyState';
import { StatusBadge } from '../components/ui/Badge';
import { dateTime } from '../lib/format';
export function DashboardPage() {
  const { data } = useWorkspace();
  return (
    <>
      <PageHeader
        eyebrow="OVERVIEW"
        title="오늘도, 자연스럽게 연결해요"
        description="반복되는 일은 줄이고, 소중한 연결에 집중하세요."
        action={
          <CreateAutomationLink className="button button-primary">
            <Plus size={17} />새 자동화 만들기
          </CreateAutomationLink>
        }
      />
      {data.account?.status !== 'connected' && (
        <div className="setup-alert">
          <Instagram size={21} />
          <div>
            <strong>먼저 인스타그램을 연결해 주세요.</strong>
            <p>계정을 연결하면 내 게시물을 불러와 자동화를 만들 수 있어요.</p>
          </div>
          <Link to="/settings/instagram" className="button button-primary">
            인스타그램 연결하기
            <ArrowUpRight size={15} />
          </Link>
        </div>
      )}
      <section className="welcome-banner">
        <div>
          <span className="welcome-kicker">
            <span />
            YOUR LITTLE AUTOMATION PARTNER
          </span>
          <h2>댓글이 대화가 되는 순간.</h2>
          <p>팔로우 확인부터 자료 전달까지, HOOKIT STUDIO가 함께할게요.</p>
          <Link to="/automations">
            내 자동화 살펴보기 <ArrowRight size={16} />
          </Link>
        </div>
        <div className="welcome-art" aria-hidden="true">
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <div className="art-node node-comment">
            <MessageCircle size={24} />
          </div>
          <div className="art-node node-zap">
            <Zap size={32} fill="currentColor" />
          </div>
          <div className="art-node node-send">
            <Send size={24} />
          </div>
          <span className="art-star star-one">✳</span>
          <span className="art-star star-two">✳</span>
          <span className="art-caption">
            a little less work.
            <br />a little more connection.
          </span>
        </div>
      </section>
      <StatCards />
      <div className="dashboard-middle">
        <ActivityChart />
        <ConnectionCard />
      </div>
      <section className="dashboard-automations">
        <div className="section-heading">
          <div>
            <h2>
              나의 자동화 <span className="count-label">{data.automations.length}</span>
            </h2>
            <p>콘텐츠마다 어울리는 연결을 만들어 보세요.</p>
          </div>
          <Link to="/automations">
            전체 보기 <ArrowUpRight size={16} />
          </Link>
        </div>
        {data.automations.length ? (
          <div className="automation-grid">
            {data.automations.slice(0, 3).map((a) => (
              <AutomationCard key={a.id} automation={a} compact />
            ))}
          </div>
        ) : (
          <div className="panel">
            <EmptyState
              title="첫 번째 자동화를 만들어 볼까요?"
              description="게시물을 선택하고 댓글에 답할 메시지를 준비해 주세요."
              action={
                <CreateAutomationLink className="button button-primary">
                  <Plus size={16} />
                  자동화 만들기
                </CreateAutomationLink>
              }
            />
          </div>
        )}
      </section>
      <section className="panel recent-panel">
        <div className="panel-heading">
          <h2>최근 발송 내역</h2>
          <Link to="/deliveries" className="text-link">
            전체 보기 <ArrowUpRight size={15} />
          </Link>
        </div>
        {data.deliveries.length ? (
          <div className="recent-list">
            {data.deliveries.slice(0, 4).map((d) => (
              <Link key={d.id} to={`/deliveries?delivery=${d.id}`} className="recent-row">
                <span className="user-avatar">{d.username[0].toUpperCase()}</span>
                <div>
                  <strong>@{d.username}</strong>
                  <span>{d.automationName}</span>
                </div>
                <StatusBadge status={d.status} />
                <time>{dateTime(d.createdAt)}</time>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState
            title="아직 발송 내역이 없어요"
            description="자동화를 시작하면 이곳에서 확인할 수 있어요."
          />
        )}
      </section>
    </>
  );
}
