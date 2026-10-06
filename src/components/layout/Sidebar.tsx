import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Zap,
  Send,
  Instagram,
  ArrowUpRight,
  CircleHelp,
  X,
  Leaf,
} from 'lucide-react';
import { Brand } from './Brand';
import { useWorkspace } from '../../features/workspace/WorkspaceProvider';
const nav = [
  { to: '/dashboard', label: '대시보드', icon: LayoutDashboard },
  { to: '/posts', label: '게시물 · 자동 DM', icon: Instagram },
  { to: '/automations', label: '자동화', icon: Zap },
  { to: '/deliveries', label: '발송 내역', icon: Send },
  { to: '/settings/instagram', label: '인스타그램 연결', icon: Instagram },
];
export function Sidebar({
  open,
  onClose,
  onHelp,
}: {
  open: boolean;
  onClose: () => void;
  onHelp: () => void;
}) {
  const { data } = useWorkspace();
  const active = data.automations.filter((a) => a.status === 'active').length;
  return (
    <>
      {open && <button className="sidebar-scrim" aria-label="메뉴 닫기" onClick={onClose} />}
      <aside className={`sidebar ${open ? 'sidebar-open' : ''}`}>
        <div className="sidebar-brand">
          <NavLink to="/dashboard" onClick={onClose} aria-label="HOOKIT STUDIO 대시보드">
            <Brand />
          </NavLink>
          <button className="icon-button mobile-only" aria-label="메뉴 닫기" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <div className="workspace-label">
          <span className="workspace-avatar">D</span>
          <div>
            <strong>내 작업공간</strong>
            <span>Instagram workspace</span>
          </div>
          <span className="workspace-dot" />
        </div>
        <div className="nav-caption">WORKSPACE</div>
        <nav aria-label="메인 메뉴">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              className={({ isActive }) => `nav-item ${isActive ? 'nav-active' : ''}`}
            >
              <item.icon size={19} strokeWidth={1.8} />
              <span>{item.label}</span>
              {item.to === '/automations' && active > 0 && (
                <span className="nav-count">{active}</span>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-note">
            <Leaf size={23} strokeWidth={1.4} />
            <strong>연결에 집중하세요.</strong>
            <p>
              반복되는 DM은 HOOKIT STUDIO에게
              <br />
              맡겨두면 되니까요.
            </p>
            <NavLink to="/automations/new" onClick={onClose}>
              새 자동화 만들기 <ArrowUpRight size={15} />
            </NavLink>
          </div>
          <button className="nav-item help-button" onClick={onHelp}>
            <CircleHelp size={19} />
            <span>사용 가이드</span>
            <ArrowUpRight size={15} />
          </button>
          <div className="sidebar-copyright">
            © {new Date().getFullYear()} HOOKIT STUDIO <span>Made for connection.</span>
          </div>
        </div>
      </aside>
    </>
  );
}
