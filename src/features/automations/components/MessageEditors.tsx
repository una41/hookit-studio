import { useRef } from 'react';
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
  const inputs = useRef<(HTMLTextAreaElement | null)[]>([]);
  const active = useRef(0);
  const examples = [
    '안내 DM을 보냈어요 💌 메시지 요청함도 확인해 주세요!',
    '댓글 감사합니다 😊 요청하신 내용을 DM으로 보내드렸어요!',
    '자료 안내를 DM으로 전달했어요 ✨ 도착한 메시지를 확인해 주세요!',
  ];
  const replies = value.commentReplies ?? [value.commentReply];
  function insertExample(example: string) {
    const index = Math.min(active.current, replies.length - 1);
    const input = inputs.current[index];
    const current = replies[index];
    const start = input?.selectionStart ?? current.length;
    const end = input?.selectionEnd ?? start;
    const available = 500 - (current.length - (end - start));
    const inserted = example.slice(0, Math.max(0, available));
    update(
      replies.map((text, i) =>
        i === index ? text.slice(0, start) + inserted + text.slice(end) : text,
      ),
    );
    requestAnimationFrame(() => {
      input?.focus();
      input?.setSelectionRange(start + inserted.length, start + inserted.length);
    });
  }
  function update(replies: string[]) {
    onChange({ commentReplies: replies, commentReply: replies[0] || '' });
  }
  return (
    <>
      <div className="reply-examples" role="group" aria-label="대댓글 예시 문구">
        <p className="inline-note">
          입력칸을 선택한 뒤 예시를 누르면 커서 위치에 들어가요. 선택한 글자는 예시로 바뀝니다.
        </p>
        {examples.map((example) => (
          <button
            key={example}
            type="button"
            className="button button-secondary"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => insertExample(example)}
          >
            {example}
          </button>
        ))}
      </div>
      {replies.map((reply, index) => (
        <div key={index}>
          <Field label={`자동 대댓글 문구 ${index + 1}`} required>
            {(id) => (
              <textarea
                id={id}
                rows={3}
                maxLength={500}
                ref={(element) => {
                  inputs.current[index] = element;
                }}
                onFocus={() => {
                  active.current = index;
                }}
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
              onClick={() => {
                if (active.current > index) active.current--;
                else if (active.current === index) active.current = Math.max(0, index - 1);
                update(replies.filter((_, i) => i !== index));
              }}
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
