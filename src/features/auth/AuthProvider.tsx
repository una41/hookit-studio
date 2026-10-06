import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db, isDemo } from '../../lib/firebase';
import type { Session } from '../../types';
import { localAuth } from './localAuth';

interface AuthState {
  session: Session | null;
  loading: boolean;
  error: string;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}
const AuthContext = createContext<AuthState | null>(null);
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(isDemo || !!auth);
  const [error, setError] = useState('');
  useEffect(() => {
    if (isDemo) {
      let active = true;
      sessionStorage.removeItem('follin.preview.auth');
      void localAuth('session')
        .then((value) => {
          if (active) setSession(value);
        })
        .catch((err: unknown) => {
          if (active)
            setError(err instanceof Error ? err.message : '로그인 상태를 확인하지 못했어요.');
        })
        .finally(() => {
          if (active) setLoading(false);
        });
      return () => {
        active = false;
      };
    }
    if (!auth || !db) return;
    let generation = 0;
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      const current = ++generation;
      setError('');
      if (!user) {
        setSession(null);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const profile = await getDoc(doc(db!, 'users', user.uid));
        if (
          !profile.exists() ||
          !profile.data().workspaceId ||
          profile.data().status !== 'active'
        ) {
          throw new Error('계정의 작업공간이 준비되지 않았어요. 최초 계정 설정을 확인해 주세요.');
        }
        if (current === generation)
          setSession({
            uid: user.uid,
            email: user.email || '',
            workspaceId: profile.data().workspaceId,
          });
      } catch (err) {
        if (current === generation) {
          setSession(null);
          setError(err instanceof Error ? err.message : '계정 정보를 확인하지 못했어요.');
        }
      } finally {
        if (current === generation) setLoading(false);
      }
    });
    return () => {
      generation++;
      unsubscribe();
    };
  }, []);
  async function login(email: string, password: string) {
    setError('');
    if (isDemo) {
      const value = await localAuth('login', { username: email, password });
      if (!value) throw new Error('로그인 상태를 확인하지 못했어요.');
      setSession(value);
      return;
    }
    if (!auth) throw new Error('Firebase 설정이 필요해요. .env.example 파일을 확인해 주세요.');
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch {
      throw new Error('로그인하지 못했어요. 이메일과 비밀번호, 네트워크 연결을 확인해 주세요.');
    }
  }
  async function logout() {
    if (isDemo) await localAuth('logout');
    else if (auth) await signOut(auth);
    setSession(null);
  }
  return (
    <AuthContext.Provider value={{ session, loading, error, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('AuthProvider is required');
  return context;
}
