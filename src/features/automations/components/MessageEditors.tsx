import type { Automation } from '../../../types';
import { Field } from '../../../components/ui/Field';
type Props = { value: Automation; onChange: (patch: Partial<Automation>) => void };
export function OpeningDmEditor({ value, onChange }: Props) {
  return (
    <>
      <Field label="첫 DM 메시지" required>
        {(id) => (
          <textarea
            id={id}
            rows={4}
            maxLength={600}
            value={value.openingMessage}
            onChange={(e) => onChange({ openingMessage: e.target.value })}
          />
        )}
      </Field>
      <Field label="자료 받기 버튼 이름" required>
        {(id) => (
          <input
            id={id}
            maxLength={20}
            value={value.openingButton}
            onChange={(e) => onChange({ openingButton: e.target.value })}
          />
        )}
      </Field>
      <p className="inline-note">사용자가 이 버튼을 누르면 팔로우 여부를 확인해요.</p>
    </>
  );
}
export function FollowPromptEditor({ value, onChange }: Props) {
  return (
    <>
      <Field label="팔로우 안내 메시지" required>
        {(id) => (
          <textarea
            id={id}
            rows={4}
            maxLength={600}
            value={value.followMessage}
            onChange={(e) => onChange({ followMessage: e.target.value })}
          />
        )}
      </Field>
      <Field label="재확인 버튼 이름">
        {(id) => (
          <input
            id={id}
            maxLength={20}
            value={value.recheckButton}
            onChange={(e) => onChange({ recheckButton: e.target.value })}
          />
        )}
      </Field>
      <p className="inline-note">
        팔로우 후 재확인 버튼을 누르면 실제 팔로우 상태를 다시 조회해요.
      </p>
    </>
  );
}
export function CommentReplyEditor({ value, onChange }: Props) {
  return (
    <>
      <Field label="자동 대댓글 문구" required>
        {(id) => (
          <textarea
            id={id}
            rows={3}
            maxLength={500}
            value={value.commentReply}
            onChange={(e) => onChange({ commentReply: e.target.value })}
          />
        )}
      </Field>
      <p className="inline-note">첫 DM 발송이 성공한 경우에만 원래 댓글에 답글을 남겨요.</p>
    </>
  );
}
