import { ArrowUpRight, Check, Instagram, Link2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useWorkspace } from '../workspace/WorkspaceProvider';
export function ConnectionCard() {
  const { data } = useWorkspace();
  const connected = data.account?.status === 'connected';
  return (
    <section className="panel connection-card">
      <div className="panel-heading">
        <h2>나의 인스타그램</h2>
        <Instagram size={19} />
      </div>
      <div className="account-portrait">
        <span>{data.account?.name.slice(0, 1) || <Instagram size={30} />}</span>
        {connected && (
          <i>
            <Check size={12} />
          </i>
        )}
      </div>
      <h3>{data.account ? `@${data.account.username}` : '아직 연결된 계정이 없어요'}</h3>
      <p>{data.account?.name || '계정을 연결하고 자동화를 시작하세요.'}</p>
      <span className={`connection-pill ${connected ? '' : 'connection-off'}`}>
        <span />
        {connected ? '계정 연결됨' : data.account ? '재연결 필요' : '연결 대기'}
      </span>
      <div className="connection-divider" />
      <div className="connection-tip">
        <Link2 size={15} />
        <span>
          {connected
            ? '내 게시물로 새로운 대화를 시작해 보세요.'
            : '인스타그램 공식 인증으로 연결해요.'}
        </span>
      </div>
      <Link className="button button-secondary" to="/settings/instagram">
        {connected ? '연결 관리' : '인스타그램 연결하기'}
        <ArrowUpRight size={16} />
      </Link>
    </section>
  );
}
