import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import {
  ChevronLeft,
  Phone,
  Video,
  Info,
  Camera,
  Smile,
  Heart,
  RotateCcw,
  ExternalLink,
} from 'lucide-react';
import type { Automation } from '../../../types';
import { useWorkspace } from '../../workspace/WorkspaceProvider';
export function DmPreview({ value, actions }: { value: Automation; actions?: ReactNode }) {
  const { data } = useWorkspace();
  const [follower, setFollower] = useState(true);
  const [step, setStep] = useState(1);
  const contentRef = useRef<HTMLDivElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const content = contentRef.current;
    if (!content) return;
    const result = resultRef.current;
    content.scrollTop =
      step > 0 && result
        ? content.scrollTop +
          result.getBoundingClientRect().top -
          content.getBoundingClientRect().top -
          16
        : 0;
  }, [follower, step]);
  return (
    <aside className="preview-column">
      <div className="preview-save-actions">{actions}</div>
      <div className="preview-title">
        <span>DM 미리보기</span>
        <button onClick={() => setStep(0)} className="icon-button" aria-label="미리보기 처음으로">
          <RotateCcw size={15} />
        </button>
      </div>
      <div className="preview-toggle">
        <button
          aria-pressed={follower}
          className={follower ? 'selected' : ''}
          onClick={() => {
            setFollower(true);
            setStep(1);
          }}
        >
          이미 팔로워
        </button>
        <button
          aria-pressed={!follower}
          className={!follower ? 'selected' : ''}
          onClick={() => {
            setFollower(false);
            setStep(1);
          }}
        >
          미팔로워
        </button>
      </div>
      <div className="phone-frame">
        <div className="phone-status">
          <strong>9:41</strong>
          <span>● ▰</span>
        </div>
        <div className="dm-header">
          <ChevronLeft size={21} />
          <span className="dm-avatar">d.</span>
          <div>
            <strong>{data.account?.username || 'your.instagram'}</strong>
            <small>Instagram</small>
          </div>
          <Phone size={17} />
          <Video size={18} />
        </div>
        <div className="dm-content" ref={contentRef}>
          <div className="dm-day">오늘</div>
          <div className="dm-profile">
            <span className="dm-profile-avatar">d.</span>
            <strong>{data.account?.username || 'your.instagram'}</strong>
            <small>나누고 싶은 이야기가 있는 곳</small>
          </div>
          <div className="dm-bubble">{value.openingMessage || '첫 DM 메시지를 입력해 주세요.'}</div>
          <button className="dm-action" onClick={() => setStep(1)}>
            {value.openingButton || '자료 받기'}
          </button>
          {step > 0 && (
            <>
              <div className="dm-outgoing" ref={resultRef}>
                {value.openingButton || '자료 받기'}
              </div>
              {!follower && step === 1 ? (
                <>
                  <div className="dm-bubble">{value.followMessage}</div>
                  <button className="dm-action" onClick={() => setStep(2)}>
                    {value.recheckButton}
                  </button>
                </>
              ) : (
                <>
                  <div className="dm-bubble">{value.deliveryMessage}</div>
                  {value.links.map((link, i) => (
                    <div className="dm-action dm-display-action" key={link.id}>
                      {link.label || `링크 ${i + 1}`}
                      <ExternalLink size={12} />
                    </div>
                  ))}
                </>
              )}
            </>
          )}
        </div>
        <div className="dm-composer">
          <Camera size={20} />
          <span>메시지 보내기...</span>
          <Smile size={19} />
          <Heart size={19} />
        </div>
        <div className="phone-home" />
      </div>
      <p className="preview-explainer">
        <Info size={14} />
        탭을 선택하면 팔로우 확인 후의 메시지를 보여줘요.
        <br />
        처음부터 보려면 초기화 버튼을 누르세요. 재확인은 팔로우 성공 예시이며 실제 메시지를 보내지
        않아요.
      </p>
    </aside>
  );
}
