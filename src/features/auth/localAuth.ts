import type { Session } from '../../types';

export async function localAuth(
  action: 'session' | 'login' | 'logout',
  credentials?: { username: string; password: string },
) {
  const response = await fetch(`/api/local-auth/${action}`, {
    method: action === 'session' ? 'GET' : 'POST',
    credentials: 'same-origin',
    cache: 'no-store',
    headers: { 'Content-Type': 'application/json' },
    ...(credentials ? { body: JSON.stringify(credentials) } : {}),
  });
  if (!response.headers.get('content-type')?.includes('application/json')) {
    throw new Error('로컬 로그인 서버에 연결할 수 없어요. 개발 서버 실행 상태를 확인해 주세요.');
  }
  const data = (await response.json()) as { session?: Session | null; error?: string };
  if (!response.ok) throw new Error(data.error || '로그인 요청에 실패했어요.');
  return data.session ?? null;
}
