import { apiBase, auth } from './firebase';

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  if (!apiBase || !auth?.currentUser) throw new Error('Firebase와 서버 연결을 먼저 설정해 주세요.');
  const token = await auth.currentUser.getIdToken();
  const response = await fetch(`${apiBase}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok)
    throw new Error(data.error || '요청을 처리하지 못했어요. 잠시 후 다시 시도해 주세요.');
  return data as T;
}
