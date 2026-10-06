import type { ReactNode } from 'react';
export function EditorSection({
  number,
  title,
  description,
  children,
}: {
  number: number;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="panel editor-section" id={`step-${number}`}>
      <div className="editor-section-header">
        <span className="step-number">{String(number).padStart(2, '0')}</span>
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
      </div>
      <div className="editor-section-body">{children}</div>
    </section>
  );
}
