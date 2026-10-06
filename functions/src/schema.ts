import { z } from 'zod';
const id = z
  .string()
  .min(1)
  .max(100)
  .regex(/^[\w-]+$/);
const text = (max: number) => z.string().max(max);
const post = z
  .object({
    id,
    title: text(2400),
    kind: z.enum(['IMAGE', 'VIDEO', 'CAROUSEL_ALBUM']),
    theme: z.enum(['sage', 'sand', 'rose', 'ink']),
    mediaUrl: z.string().url().optional(),
    permalink: z.string().url().optional(),
  })
  .strict();
export const automationSchema = z
  .object({
    id,
    name: z.string().trim().min(1).max(80),
    post: post.nullable(),
    status: z.enum(['draft', 'active', 'paused']),
    trigger: z.enum(['keyword', 'all']),
    match: z.enum(['contains', 'exact']),
    keywords: z.array(z.string().trim().min(1).max(60)).max(30),
    openingMessage: text(600),
    openingButton: text(20),
    followMessage: text(600),
    // Retain legacy saved fields, but no longer render or send this button.
    profileButton: text(20).default(''),
    recheckButton: text(20),
    deliveryMessage: text(600),
    links: z
      .array(z.object({ id, label: text(20), url: text(2048) }).strict())
      .min(1)
      .max(2),
    commentReply: text(500),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (value.status !== 'active') return;
    if (!value.post) ctx.addIssue({ code: 'custom', message: '게시물을 선택해 주세요.' });
    if (value.trigger === 'keyword' && !value.keywords.length)
      ctx.addIssue({ code: 'custom', message: '키워드를 추가해 주세요.' });
    if (
      [
        value.openingMessage,
        value.openingButton,
        value.followMessage,
        value.recheckButton,
        value.deliveryMessage,
        value.commentReply,
      ].some((v) => !v.trim())
    )
      ctx.addIssue({ code: 'custom', message: '필수 문구를 입력해 주세요.' });
    for (const link of value.links) {
      try {
        const url = new URL(link.url);
        if (url.protocol !== 'https:' || url.username || url.password || !link.label.trim())
          throw new Error();
      } catch {
        ctx.addIssue({ code: 'custom', message: '올바른 HTTPS 링크와 버튼 이름을 입력해 주세요.' });
      }
    }
  });
export type Automation = z.infer<typeof automationSchema>;
export function matchesComment(automation: Automation, comment: string) {
  if (automation.status !== 'active') return false;
  if (automation.trigger === 'all') return true;
  const normalize = (value: string) => value.trim().normalize('NFKC').toLowerCase();
  const text = normalize(comment);
  return automation.keywords.some((k) =>
    automation.match === 'exact' ? normalize(k) === text : text.includes(normalize(k)),
  );
}
