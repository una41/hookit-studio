import { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { Menu, ChevronRight, LogOut, Instagram, FlaskConical, LoaderCircle } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { useAuth } from '../../features/auth/AuthProvider';
import { useWorkspace } from '../../features/workspace/WorkspaceProvider';
import { isDemo } from '../../lib/firebase';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { useToast } from '../ui/Toast';
import { errorMessage } from '../../lib/format';
export function AppLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const { logout } = useAuth();
  const { data, loading, error, refresh } = useWorkspace();
  const location = useLocation();
  const notify = useToast();
  const title = location.pathname.startsWith('/posts')
    ? '게시물 · 자동 DM'
    : location.pathname.startsWith('/automations')
      ? '자동화'
      : location.pathname.startsWith('/deliveries')
        ? '발송 내역'
        : location.pathname.startsWith('/settings')
          ? '인스타그램 연결'
          : '대시보드';
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        본문으로 이동
      </a>
      <Sidebar
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        onHelp={() => {
          setMenuOpen(false);
          setHelpOpen(true);
        }}
      />
      <div className="app-main">
        <div className="topbar">
          <div className="breadcrumbs">
            <button
              className="icon-button mobile-only"
              aria-label="메뉴 열기"
              onClick={() => setMenuOpen(true)}
            >
              <Menu size={20} />
            </button>
            <span>내 작업공간</span>
            <ChevronRight size={14} />
            <strong>{title}</strong>
          </div>
          <div className="topbar-right">
            {isDemo && (
              <span className="preview-chip">
                <FlaskConical size={13} />
                미리보기
              </span>
            )}
            <Link to="/settings/instagram" className="topbar-account">
              <span
                className={data.account?.status === 'connected' ? 'online-dot' : 'offline-dot'}
              />
              <Instagram size={15} />
              {data.account ? `@${data.account.username}` : '계정 연결하기'}
            </Link>
            <button
              className="icon-button logout"
              title="로그아웃"
              aria-label="로그아웃"
              onClick={() => void logout().catch((e) => notify(errorMessage(e), true))}
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
        {isDemo && (
          <div className="preview-banner">
            <FlaskConical size={14} />
            <span>
              샘플 데이터로 둘러보는 미리보기입니다. 설정은 이 브라우저에 저장되며 실제 DM은
              발송되지 않아요.
            </span>
          </div>
        )}
        <main id="main-content" className="page-container">
          {loading ? (
            <div className="page-loading">
              <LoaderCircle className="spin" />
              <span>작업공간을 불러오고 있어요</span>
            </div>
          ) : error ? (
            <div className="error-panel">
              <h2>데이터를 불러오지 못했어요</h2>
              <p>{error}</p>
              <Button onClick={() => void refresh()}>다시 시도</Button>
            </div>
          ) : (
            <Outlet />
          )}
        </main>
        <footer className="page-footer">
          <span>작은 댓글 하나가, 새로운 연결의 시작.</span>
          <span>HOOKIT STUDIO workspace</span>
        </footer>
      </div>
      {helpOpen && (
        <Modal title="HOOKIT STUDIO 시작 가이드" onClose={() => setHelpOpen(false)}>
          <div className="guide-steps">
            {[
              [
                '인스타그램 연결하기',
                '인스타그램 연결 메뉴에서 공식 인증으로 내 계정을 연결하세요.',
              ],
              [
                '자동화 만들기',
                '게시물과 댓글 조건을 고르고, 각 단계의 메시지와 자료 링크를 입력하세요.',
              ],
              [
                '확인하고 활성화하기',
                'DM 미리보기로 흐름을 확인한 뒤 활성화하세요. 저장만으로는 발송이 시작되지 않아요.',
              ],
              ['발송 내역 확인하기', '안내 DM, 팔로우 대기, 자료 발송 완료 상태를 확인하세요.'],
            ].map(([heading, text], i) => (
              <div key={heading}>
                <span>{i + 1}</span>
                <section>
                  <h3>{heading}</h3>
                  <p>{text}</p>
                </section>
              </div>
            ))}
          </div>
        </Modal>
      )}
    </div>
  );
}
