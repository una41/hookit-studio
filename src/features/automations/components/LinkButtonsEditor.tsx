import { Plus, Trash2, Link2 } from 'lucide-react';
import type { Automation } from '../../../types';
import { Field } from '../../../components/ui/Field';
import { Button } from '../../../components/ui/Button';
export function LinkButtonsEditor({
  value,
  onChange,
}: {
  value: Automation;
  onChange: (patch: Partial<Automation>) => void;
}) {
  function update(id: string, field: 'label' | 'url', text: string) {
    onChange({
      links: value.links.map((link) => (link.id === id ? { ...link, [field]: text } : link)),
    });
  }
  return (
    <>
      <Field label="자료 전달 메시지" required>
        {(id) => (
          <textarea
            id={id}
            rows={3}
            maxLength={600}
            value={value.deliveryMessage}
            onChange={(e) => onChange({ deliveryMessage: e.target.value })}
          />
        )}
      </Field>
      {value.links.map((link, i) => (
        <div className="link-editor" key={link.id}>
          <div className="link-editor-heading">
            <span>
              <Link2 size={15} />
              링크 버튼 {i + 1}
            </span>
            {value.links.length > 1 && (
              <button
                className="icon-button"
                aria-label={`링크 버튼 ${i + 1} 삭제`}
                onClick={() => onChange({ links: value.links.filter((l) => l.id !== link.id) })}
              >
                <Trash2 size={15} />
              </button>
            )}
          </div>
          <Field label={`버튼 ${i + 1} 이름`}>
            {(id) => (
              <input
                id={id}
                maxLength={20}
                placeholder="예: 자료 확인하기"
                value={link.label}
                onChange={(e) => update(link.id, 'label', e.target.value)}
              />
            )}
          </Field>
          <Field label={`링크 ${i + 1} 주소`}>
            {(id) => (
              <input
                id={id}
                type="url"
                placeholder="https://"
                value={link.url}
                onChange={(e) => update(link.id, 'url', e.target.value)}
              />
            )}
          </Field>
        </div>
      ))}
      {value.links.length < 2 && (
        <Button
          variant="secondary"
          onClick={() =>
            onChange({ links: [...value.links, { id: crypto.randomUUID(), label: '', url: '' }] })
          }
        >
          <Plus size={16} />
          링크 버튼 추가
        </Button>
      )}
    </>
  );
}
