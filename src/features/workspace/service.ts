import { collection, doc, getDoc, getDocs, limit, orderBy, query } from 'firebase/firestore';
import { db, isDemo } from '../../lib/firebase';
import { api } from '../../lib/api';
import type { Automation, WorkspaceData, Post } from '../../types';
import { demoPosts, seedDemo } from './demo';

const storageKey = 'follin.preview.workspace.v1';
export async function loadWorkspace(workspaceId: string): Promise<WorkspaceData> {
  if (isDemo) {
    const raw = localStorage.getItem(storageKey);
    if (raw) {
      try {
        const data = JSON.parse(raw) as WorkspaceData;
        if (!Array.isArray(data.automations) || !Array.isArray(data.deliveries)) throw new Error();
        return data;
      } catch {
        throw new Error(
          '미리보기 저장 데이터를 읽지 못했어요. 브라우저의 이 사이트 저장 데이터를 초기화해 주세요.',
        );
      }
    }
    const data = seedDemo();
    localStorage.setItem(storageKey, JSON.stringify(data));
    return data;
  }
  if (!db) throw new Error('Firebase 환경변수 설정이 필요해요.');
  const root = `workspaces/${workspaceId}`;
  const [automations, deliveries, account] = await Promise.all([
    getDocs(query(collection(db, `${root}/automations`), orderBy('updatedAt', 'desc'), limit(200))),
    getDocs(query(collection(db, `${root}/deliveries`), orderBy('createdAt', 'desc'), limit(500))),
    getDoc(doc(db, `${root}/connections/instagram`)),
  ]);
  return {
    automations: automations.docs.map((d) => ({ ...d.data(), id: d.id }) as Automation),
    deliveries: deliveries.docs.map(
      (d) => ({ ...d.data(), id: d.id }) as WorkspaceData['deliveries'][number],
    ),
    account: account.exists() ? (account.data() as WorkspaceData['account']) : null,
  };
}
export function persistPreview(data: WorkspaceData) {
  localStorage.setItem(storageKey, JSON.stringify(data));
}
export async function saveAutomation(automation: Automation) {
  if (!isDemo) await api('/automations', { method: 'POST', body: JSON.stringify(automation) });
}
export async function loadPosts(): Promise<Post[]> {
  return isDemo ? demoPosts : (await api<{ posts: Post[] }>('/instagram/media')).posts;
}
export async function startInstagramConnection() {
  const result = await api<{ url: string }>('/instagram/connect', { method: 'POST' });
  const url = new URL(result.url);
  if (url.protocol !== 'https:' || !['www.instagram.com', 'instagram.com'].includes(url.hostname))
    throw new Error('연결 주소를 확인하지 못했어요.');
  window.location.assign(url.toString());
}
export async function disconnectInstagram() {
  if (!isDemo) await api('/instagram/disconnect', { method: 'POST' });
}
