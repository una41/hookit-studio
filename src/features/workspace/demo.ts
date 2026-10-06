import type { Automation, Delivery, Post, WorkspaceData } from '../../types';
import { newAutomation } from '../automations/model';

export const demoPosts: Post[] = [
  {
    id: 'post-guide',
    title: '작은 루틴이 만드는 큰 변화. 나만의 루틴 노트를 만나보세요.',
    kind: 'CAROUSEL_ALBUM',
    theme: 'sage',
  },
  {
    id: 'post-notion',
    title: '복잡한 하루를 가볍게 정리하는 노션 템플릿',
    kind: 'IMAGE',
    theme: 'sand',
  },
  {
    id: 'post-weekend',
    title: '이번 주말, 나에게 조금 더 다정해지는 방법',
    kind: 'VIDEO',
    theme: 'rose',
  },
  { id: 'post-studio', title: '나만의 작업 공간을 만드는 체크리스트', kind: 'IMAGE', theme: 'ink' },
];
function daysAgo(days: number, hours = 12) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(hours, 12, 0, 0);
  return date.toISOString();
}
export function seedDemo(): WorkspaceData {
  const names = ['데일리 루틴 노트 공유', '노션 플래너 템플릿', '주말 리셋 체크리스트'];
  const keywords = [['루틴', '노트'], ['템플릿', '노션'], ['주말']];
  const automations: Automation[] = names.map((name, i) => ({
    ...newAutomation(),
    id: `automation-${i + 1}`,
    name,
    post: demoPosts[i],
    keywords: keywords[i],
    status: i === 2 ? 'draft' : 'active',
    createdAt: daysAgo(10 - i),
    updatedAt: daysAgo(i),
    links: [
      {
        id: `link-${i}`,
        label: i === 0 ? '루틴 노트 받기' : '템플릿 받기',
        url: 'https://example.com/sample-resource',
      },
    ],
  }));
  const users = [
    'jiyoon.daily',
    'slow.monday',
    'dear.soo',
    'mood.archive',
    'on.our.day',
    'minji.notes',
    'hello.yoon',
  ];
  const deliveries: Delivery[] = Array.from({ length: 32 }, (_, i) => {
    const automation = automations[i % 2];
    const day = Math.floor(i / 5);
    const status = i === 3 ? 'failed' : i % 7 === 0 ? 'awaiting_follow' : 'completed';
    return {
      id: `delivery-${i}`,
      automationId: automation.id,
      automationName: automation.name,
      username: users[i % users.length],
      comment: automation.keywords[0] + ' 부탁드려요 🌿',
      status,
      createdAt: daysAgo(day, 9 + (i % 8)),
      ...(status === 'completed' ? { completedAt: daysAgo(day, 9 + (i % 8)) } : {}),
      replySent: status !== 'failed',
      links: automation.links,
      ...(status === 'failed'
        ? { error: '수신자의 메시지 설정으로 전송하지 못했어요. (예시)' }
        : {}),
    };
  });
  return {
    automations,
    deliveries: deliveries.sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    account: {
      id: 'demo-instagram',
      username: 'your.daily.studio',
      name: '데일리 스튜디오',
      connectedAt: daysAgo(12),
      status: 'connected',
    },
  };
}
