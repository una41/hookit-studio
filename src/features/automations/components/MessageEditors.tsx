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
  const replies = value.commentReplies ?? [value.commentReply];
  function update(replies: string[]) {
    onChange({ commentReplies: replies, commentReply: replies[0] || '' });
  }
  return (
    <>
      {replies.map((reply, index) => (
        <div key={index}>
          <Field label={`자동 대댓글 문구 ${index + 1}`} required>
            {(id) => (
              <textarea
                id={id}
                rows={3}
                maxLength={500}
                value={reply}
                onChange={(e) =>
                  update(replies.map((text, i) => (i === index ? e.target.value : text)))
                }
              />
            )}
          </Field>
          {replies.length > 1 && (
            <button
              type="button"
              className="button button-secondary"
              aria-label={`대댓글 문구 ${index + 1} 삭제`}
              onClick={() => update(replies.filter((_, i) => i !== index))}
            >
              삭제
            </button>
          )}
        </div>
      ))}
      <button
        type="button"
        className="button button-secondary"
        disabled={replies.length >= 5}
        onClick={() => update([...replies, ''])}
      >
        문구 추가 ({replies.length}/5)
      </button>
      <p className="inline-note">
        첫 DM 발송 성공 후 등록한 문구 중 하나를 무작위로 골라 대댓글을 남겨요. 같은 문구가 연속
        선택될 수 있어요.
      </p>
    </>
  );
}
