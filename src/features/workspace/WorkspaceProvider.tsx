import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { Automation, AutomationStatus, WorkspaceData } from '../../types';
import { useAuth } from '../auth/AuthProvider';
import { isDemo } from '../../lib/firebase';
import { errorMessage } from '../../lib/format';
import { loadWorkspace, persistPreview, saveAutomation, disconnectInstagram } from './service';
import { seedDemo } from './demo';
import { validateAutomation } from '../automations/model';

interface WorkspaceState {
  data: WorkspaceData;
  loading: boolean;
  error: string;
  refreshedAt: Date | null;
  refresh: () => Promise<void>;
  save: (automation: Automation) => Promise<void>;
  changeStatus: (id: string, status: AutomationStatus) => Promise<void>;
  disconnect: () => Promise<void>;
  connectPreview: () => void;
}
const Context = createContext<WorkspaceState | null>(null);
const empty: WorkspaceData = { automations: [], deliveries: [], account: null };
export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const [data, setData] = useState<WorkspaceData>(empty);
  const latest = useRef(data);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshedAt, setRefreshedAt] = useState<Date | null>(null);
  const requestId = useRef(0);
  function commit(next: WorkspaceData) {
    if (isDemo) persistPreview(next);
    latest.current = next;
    setData(next);
  }
  const refresh = useCallback(async () => {
    if (!session) return;
    const current = ++requestId.current;
    setLoading(true);
    setError('');
    try {
      const next = await loadWorkspace(session.workspaceId);
      if (current === requestId.current) {
        latest.current = next;
        setData(next);
        setRefreshedAt(new Date());
      }
    } catch (err) {
      if (current === requestId.current) setError(errorMessage(err));
    } finally {
      if (current === requestId.current) setLoading(false);
    }
  }, [session?.workspaceId]);
  useEffect(() => {
    void refresh();
    return () => {
      requestId.current++;
    };
  }, [refresh]);
  async function save(automation: Automation) {
    const issues = validateAutomation(automation, automation.status);
    if (issues.length) throw new Error(issues[0]);
    if (automation.status === 'active') {
      if (latest.current.account?.status !== 'connected')
        throw new Error('인스타그램 계정을 먼저 연결해 주세요.');
      if (
        latest.current.automations.some(
          (a) =>
            a.id !== automation.id && a.status === 'active' && a.post?.id === automation.post?.id,
        )
      ) {
        throw new Error('이 게시물에 이미 실행 중인 자동화가 있어요. 기존 자동화를 중지해 주세요.');
      }
    }
    const next = { ...automation, updatedAt: new Date().toISOString() };
    await saveAutomation(next);
    commit({
      ...latest.current,
      automations: [next, ...latest.current.automations.filter((a) => a.id !== next.id)],
    });
  }
  async function changeStatus(id: string, status: AutomationStatus) {
    const automation = latest.current.automations.find((a) => a.id === id);
    if (!automation) throw new Error('자동화를 찾지 못했어요.');
    await save({ ...automation, status });
  }
  async function disconnect() {
    await disconnectInstagram();
    commit({
      ...latest.current,
      account: null,
      automations: latest.current.automations.map((a) =>
        a.status === 'active' ? { ...a, status: 'paused' } : a,
      ),
    });
  }
  function connectPreview() {
    if (!isDemo) return;
    commit({ ...latest.current, account: seedDemo().account });
  }
  return (
    <Context.Provider
      value={{
        data,
        loading,
        error,
        refreshedAt,
        refresh,
        save,
        changeStatus,
        disconnect,
        connectPreview,
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useWorkspace() {
  const value = useContext(Context);
  if (!value) throw new Error('WorkspaceProvider is required');
  return value;
}
