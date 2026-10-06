import { Link, useParams, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { ArrowLeft, Save, Play, Pause, AlertCircle } from 'lucide-react';
import { useWorkspace } from '../features/workspace/WorkspaceProvider';
import { newAutomation } from '../features/automations/model';
import { useAutomationForm } from '../features/automations/useAutomationForm';
import { EditorSection } from '../features/automations/components/EditorSection';
import { PostSelector } from '../features/automations/components/PostSelector';
import { TriggerEditor } from '../features/automations/components/TriggerEditor';
import {
  OpeningDmEditor,
  FollowPromptEditor,
  CommentReplyEditor,
} from '../features/automations/components/MessageEditors';
import { LinkButtonsEditor } from '../features/automations/components/LinkButtonsEditor';
import { DmPreview } from '../features/automations/components/DmPreview';
import { Field } from '../components/ui/Field';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { StatusBadge } from '../components/ui/Badge';
import type { Automation, Post } from '../types';
export function AutomationEditorPage() {
  const { id } = useParams();
  const { data } = useWorkspace();
  const location = useLocation();
  const [empty] = useState(() => {
    const draft = newAutomation();
    const post = (location.state as { post?: Post } | null)?.post;
    return post ? { ...draft, post, name: post.title.slice(0, 60) } : draft;
  });
  const initial = id ? data.automations.find((a) => a.id === id) : empty;
  if (!id && data.account?.status !== 'connected') {
    return (
      <div className="panel empty-state">
        <h2>인스타그램을 먼저 연결해 주세요</h2>
        <p>계정을 연결한 후 게시물을 선택해 새 자동화를 만들 수 있어요.</p>
        <Link className="button button-primary" to="/settings/instagram">
          인스타그램 연결하기
        </Link>
      </div>
    );
  }
  if (!initial)
    return (
      <div className="empty-state">
        <h2>자동화를 찾을 수 없어요</h2>
        <Link to="/automations">목록으로 돌아가기</Link>
      </div>
    );
  return <EditorForm key={id || 'new'} initial={initial} isNew={!id} />;
}
function EditorForm({ initial, isNew }: { initial: Automation; isNew: boolean }) {
  const { value, update, busy, dirty, errors, submit, blocker } = useAutomationForm(initial, isNew);
  const [mobileTab, setMobileTab] = useState('edit');
  const saveActions = (
    <div className="editor-save-actions">
      <Button
        variant="secondary"
        loading={busy}
        onClick={() => void submit(value.status === 'active' ? 'active' : value.status)}
      >
        <Save size={16} />
        {value.status === 'draft' ? '초안 저장' : '저장'}
      </Button>
      <Button
        loading={busy}
        variant={value.status === 'active' ? 'secondary' : 'primary'}
        onClick={() => void submit(value.status === 'active' ? 'paused' : 'active')}
      >
        {value.status === 'active' ? (
          <>
            <Pause size={16} />
            일시정지
          </>
        ) : (
          <>
            <Play size={16} />
            활성화
          </>
        )}
      </Button>
    </div>
  );
  return (
    <>
      <div className="editor-heading">
        <div>
          <Link className="back-link" to="/automations">
            <ArrowLeft size={15} />
            자동화 목록
          </Link>
          <div className="editor-title">
            <h1>{isNew ? '새 자동화 만들기' : '자동화 설정'}</h1>
            <StatusBadge status={value.status} />
            {dirty && <span className="unsaved-label">저장하지 않은 변경</span>}
          </div>
          <p>댓글부터 자료 전달까지, 나만의 흐름을 만들어 보세요.</p>
        </div>
        {saveActions}
      </div>
      <div className="editor-mobile-tabs">
        <button
          className={mobileTab === 'edit' ? 'selected' : ''}
          onClick={() => setMobileTab('edit')}
        >
          설정
        </button>
        <button
          className={mobileTab === 'preview' ? 'selected' : ''}
          onClick={() => setMobileTab('preview')}
        >
          DM 미리보기
        </button>
      </div>
      <div id="editor-errors">
        {errors.length > 0 && (
          <div role="alert" className="validation-errors">
            <AlertCircle size={19} />
            <div>
              <strong>설정을 조금 더 확인해 주세요.</strong>
              <ul>
                {errors.map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
      <div className={`editor-layout editor-tab-${mobileTab}`}>
        <div className="editor-form">
          <EditorSection
            number={1}
            title="어떤 게시물에 연결할까요?"
            description="자동화 이름을 정하고 내 콘텐츠를 선택하세요."
          >
            <Field label="자동화 이름" required>
              {(id) => (
                <input
                  id={id}
                  placeholder="예: 데일리 루틴 노트 공유"
                  maxLength={80}
                  value={value.name}
                  onChange={(e) => update({ name: e.target.value })}
                />
              )}
            </Field>
            <PostSelector
              value={value.post}
              onChange={(post) => {
                if (value.post?.id === post.id) return;
                const defaults = newAutomation();
                update({
                  ...defaults,
                  id: value.id,
                  createdAt: value.createdAt,
                  post,
                  name: post.title.slice(0, 60),
                  commentReplies: [defaults.commentReply],
                });
              }}
            />
          </EditorSection>
          <EditorSection
            number={2}
            title="어떤 댓글에 답할까요?"
            description="자동화를 시작할 댓글 조건을 설정하세요."
          >
            <TriggerEditor value={value} onChange={update} />
          </EditorSection>
          <EditorSection
            number={3}
            title="첫 인사를 건네세요"
            description="댓글을 남긴 사람에게 보낼 첫 번째 DM이에요."
          >
            <OpeningDmEditor value={value} onChange={update} />
          </EditorSection>
          <EditorSection
            number={4}
            title="팔로우하고, 더 가까워지도록"
            description="아직 팔로워가 아니라면 이렇게 안내해요."
          >
            <FollowPromptEditor value={value} onChange={update} />
          </EditorSection>
          <EditorSection
            number={5}
            title="약속한 자료를 전달하세요"
            description="팔로우를 확인한 뒤 메시지와 링크를 보내요."
          >
            <LinkButtonsEditor value={value} onChange={update} />
          </EditorSection>
          <EditorSection
            number={6}
            title="댓글에도 한마디 남겨요"
            description="DM을 놓치지 않도록 발송 사실을 알려주세요."
          >
            <CommentReplyEditor value={value} onChange={update} />
          </EditorSection>
        </div>
        <DmPreview key={value.post?.id || 'no-post'} value={value} />
      </div>
      <div className="editor-bottom-actions">{saveActions}</div>
      {blocker.state === 'blocked' && (
        <Modal title="변경 사항을 저장하지 않았어요" onClose={() => blocker.reset()}>
          <p className="modal-description">지금 이동하면 저장하지 않은 설정은 사라져요.</p>
          <div className="modal-actions">
            <Button variant="secondary" onClick={() => blocker.reset()}>
              계속 편집
            </Button>
            <Button variant="danger" onClick={() => blocker.proceed()}>
              저장하지 않고 이동
            </Button>
          </div>
        </Modal>
      )}
    </>
  );
}
