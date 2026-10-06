import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Instagram,
  ArrowUpRight,
  Check,
  ShieldCheck,
  Link2,
  Unplug,
  RefreshCw,
  CircleCheck,
  Info,
} from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { useWorkspace } from '../features/workspace/WorkspaceProvider';
import { startInstagramConnection } from '../features/workspace/service';
import { useToast } from '../components/ui/Toast';
import { errorMessage, dateTime } from '../lib/format';
import { isDemo } from '../lib/firebase';
export function InstagramSettingsPage() {
  const { data, refresh, disconnect, connectPreview } = useWorkspace();
  const notify = useToast();
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [demoConnect, setDemoConnect] = useState(false);
  const [params, setParams] = useSearchParams();
  useEffect(() => {
    const status = params.get('connection');
    if (!status) return;
    notify(
      status === 'success'
        ? '인스타그램 계정을 연결했어요.'
        : '계정 연결을 완료하지 못했어요. 다시 시도해 주세요.',
      status !== 'success',
    );
    setParams({}, { replace: true });
    void refresh();
  }, [params, setParams, refresh, notify]);
  async function connect() {
    if (isDemo) {
      setDemoConnect(true);
      return;
    }
    setBusy(true);
    try {
      await startInstagramConnection();
    } catch (e) {
      notify(errorMessage(e), true);
    } finally {
      setBusy(false);
    }
  }
  async function unlink() {
    setBusy(true);
    try {
      await disconnect();
      setConfirm(false);
      notify('연결을 해제하고 실행 중인 자동화를 중지했어요.');
    } catch (e) {
      notify(errorMessage(e), true);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <PageHeader
        eyebrow="INSTAGRAM CONNECTION"
        title="인스타그램 연결"
        description="내 계정을 연결하고, 댓글에서 시작되는 대화를 준비하세요."
      />
      <div className="settings-layout">
        <section className="panel instagram-settings-card">
          <div className="settings-card-header">
            <span className="instagram-logo">
              <Instagram size={27} />
            </span>
            <div>
              <h2>내 인스타그램 계정</h2>
              <p>공식 인증으로 안전하게 연결해요.</p>
            </div>
            {data.account && (
              <span className="connection-pill">
                <span />
                {data.account.status === 'connected' ? '연결됨' : '재연결 필요'}
              </span>
            )}
          </div>
          {data.account ? (
            <>
              <div className="connected-profile">
                <span className="large-avatar">
                  {data.account.name[0]}
                  <i>
                    <Check size={12} />
                  </i>
                </span>
                <div>
                  <h3>@{data.account.username}</h3>
                  <p>{data.account.name}</p>
                  <small>
                    {dateTime(data.account.connectedAt)} 연결{isDemo ? ' · 샘플 계정' : ''}
                  </small>
                </div>
              </div>
              <div className="settings-status">
                <CircleCheck size={19} />
                <div>
                  <strong>
                    {isDemo ? '미리보기 계정이 연결되어 있어요' : '계정 인증이 완료되었어요'}
                  </strong>
                  <p>
                    {isDemo
                      ? '실제 계정과 연결되지 않은 예시입니다. 자동화 화면을 자유롭게 확인하세요.'
                      : '게시물을 불러와 자동화 초안을 만들 수 있어요. 실제 발송은 서버의 연동 검증 후 활성화할 수 있습니다.'}
                  </p>
                </div>
              </div>
              <div className="settings-actions">
                {data.account.status === 'connected' && (
                  <Link className="button button-primary" to="/posts">
                    게시물 불러와 설정하기
                  </Link>
                )}
                <Button variant="secondary" onClick={() => void connect()} loading={busy}>
                  <RefreshCw size={16} />
                  다시 연결
                </Button>
                <button className="disconnect-link" onClick={() => setConfirm(true)}>
                  <Unplug size={15} />
                  연결 해제
                </button>
              </div>
            </>
          ) : (
            <div className="connect-empty">
              <div className="connect-orbit">
                <Instagram size={42} strokeWidth={1.3} />
                <span>
                  <Link2 size={16} />
                </span>
              </div>
              <h3>나의 인스타그램과 연결하세요</h3>
              <p>
                게시물을 선택하고, 댓글을 남긴 사람들에게
                <br />
                자동으로 DM을 보낼 준비를 시작해요.
              </p>
              <Button onClick={() => void connect()} loading={busy}>
                <Instagram size={17} />
                인스타그램 연결하기
                <ArrowUpRight size={17} />
              </Button>
            </div>
          )}
          <div className="settings-security">
            <ShieldCheck size={17} />
            <span>인스타그램 비밀번호를 HOOKIT STUDIO에 저장하지 않아요.</span>
          </div>
        </section>
        <aside className="settings-help">
          <span className="eyebrow">BEFORE YOU CONNECT</span>
          <h2>연결 전에 확인해 주세요</h2>
          <div>
            <span>01</span>
            <section>
              <h3>프로페셔널 계정</h3>
              <p>비즈니스 또는 크리에이터 계정으로 준비해 주세요.</p>
            </section>
          </div>
          <div>
            <span>02</span>
            <section>
              <h3>필요한 권한 허용</h3>
              <p>공식 인증 화면에서 게시물·댓글·메시지 관련 권한을 허용해 주세요.</p>
            </section>
          </div>
          <div>
            <span>03</span>
            <section>
              <h3>나만의 자동화 시작</h3>
              <p>계정 연결 후 게시물을 골라 첫 자동화를 만들 수 있어요.</p>
            </section>
          </div>
          <p className="settings-help-note">
            <Info size={16} />
            연결을 해제하면 자동화가 중지돼요. 기존 설정과 발송 기록은 유지됩니다.
          </p>
        </aside>
      </div>
      {confirm && (
        <Modal title="인스타그램 연결을 해제할까요?" onClose={() => !busy && setConfirm(false)}>
          <p className="modal-description">
            실행 중인 자동화가 모두 일시정지됩니다. 설정과 발송 기록은 남아 있어요.
          </p>
          <div className="modal-actions">
            <Button variant="secondary" disabled={busy} onClick={() => setConfirm(false)}>
              취소
            </Button>
            <Button variant="danger" loading={busy} onClick={() => void unlink()}>
              연결 해제
            </Button>
          </div>
        </Modal>
      )}
      {demoConnect && (
        <Modal title="미리보기 계정 연결" onClose={() => setDemoConnect(false)}>
          <p className="modal-description">
            현재는 화면을 확인하는 미리보기 모드예요. 샘플 계정을 연결하면 예시 게시물로 자동화를
            설정할 수 있어요. 실제 인스타그램 인증은 실행되지 않습니다.
          </p>
          <div className="modal-actions">
            <Button variant="secondary" onClick={() => setDemoConnect(false)}>
              취소
            </Button>
            <Button
              onClick={() => {
                connectPreview();
                setDemoConnect(false);
                notify('샘플 계정을 연결했어요.');
              }}
            >
              샘플 계정 연결
            </Button>
          </div>
        </Modal>
      )}
    </>
  );
}
