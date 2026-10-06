import { useState } from 'react';
import { Hash, MessageCircle, X, Plus } from 'lucide-react';
import type { Automation } from '../../../types';
import { Field } from '../../../components/ui/Field';
export function TriggerEditor({
  value,
  onChange,
}: {
  value: Automation;
  onChange: (patch: Partial<Automation>) => void;
}) {
  const [keyword, setKeyword] = useState('');
  function add() {
    const clean = keyword.trim();
    if (clean && !value.keywords.some((k) => k.toLowerCase() === clean.toLowerCase()))
      onChange({ keywords: [...value.keywords, clean] });
    setKeyword('');
  }
  return (
    <>
      <div className="trigger-options">
        <button
          className={value.trigger === 'keyword' ? 'selected' : ''}
          aria-pressed={value.trigger === 'keyword'}
          onClick={() => onChange({ trigger: 'keyword' })}
        >
          <Hash size={20} />
          <strong>특정 단어가 있을 때</strong>
          <span>설정한 키워드에만 반응해요</span>
        </button>
        <button
          className={value.trigger === 'all' ? 'selected' : ''}
          aria-pressed={value.trigger === 'all'}
          onClick={() => onChange({ trigger: 'all' })}
        >
          <MessageCircle size={20} />
          <strong>모든 댓글에</strong>
          <span>어떤 댓글이든 대화를 시작해요</span>
        </button>
      </div>
      {value.trigger === 'keyword' && (
        <>
          <Field label="댓글 키워드" hint="여러 단어 중 하나만 일치해도 시작해요.">
            {(id) => (
              <div className="keyword-entry">
                <input
                  id={id}
                  value={keyword}
                  maxLength={60}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="예: 자료, 루틴, 템플릿"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
                      e.preventDefault();
                      add();
                    }
                  }}
                />
                <button
                  className="button button-secondary"
                  onClick={add}
                  disabled={!keyword.trim()}
                >
                  <Plus size={16} />
                  추가
                </button>
              </div>
            )}
          </Field>
          <div className="editable-tags">
            {value.keywords.map((k) => (
              <span key={k}>
                #{k}
                <button
                  aria-label={`${k} 키워드 삭제`}
                  onClick={() =>
                    onChange({ keywords: value.keywords.filter((item) => item !== k) })
                  }
                >
                  <X size={13} />
                </button>
              </span>
            ))}
          </div>
          <Field label="일치 방식">
            {(id) => (
              <select
                id={id}
                value={value.match}
                onChange={(e) => onChange({ match: e.target.value as Automation['match'] })}
              >
                <option value="contains">키워드 포함 — “자료 주세요”도 반응</option>
                <option value="exact">전체 일치 — “자료”에만 반응</option>
              </select>
            )}
          </Field>
        </>
      )}
    </>
  );
}
