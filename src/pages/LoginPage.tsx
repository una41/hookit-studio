import { useState, type FormEvent } from 'react';
import { Navigate } from 'react-router-dom';
import { ArrowRight, Check, Instagram, MessageCircle, Send, Eye, EyeOff } from 'lucide-react';
import { Brand } from '../components/layout/Brand';
import { Button } from '../components/ui/Button';
import { Field } from '../components/ui/Field';
import { useAuth } from '../features/auth/AuthProvider';
import { firebaseConfigured, isDemo } from '../lib/firebase';
import { errorMessage } from '../lib/format';
export function LoginPage() {
  const { session, loading, login, error: authError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  if (session) return <Navigate to="/dashboard" replace />;
  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await login(email.trim(), password);
      setPassword('');
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="login-page">
      <section className="login-form-side">
        <Brand />
        <div className="login-form-wrap">
          <span className="eyebrow">YOUR CONNECTION STARTS HERE</span>
          <h1>
            반가워요.
            <br />
            오늘도 연결을 시작해 볼까요?
          </h1>
          <p className="login-subtitle">내 인스타그램을 위한 작은 자동화, HOOKIT STUDIO.</p>
          <form onSubmit={submit}>
            {
              <>
                <Field label={isDemo ? '아이디' : '이메일'}>
                  {(id) => (
                    <input
                      id={id}
                      type={isDemo ? 'text' : 'email'}
                      autoComplete="username"
                      placeholder={isDemo ? '아이디를 입력해 주세요' : '이메일을 입력해 주세요'}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  )}
                </Field>
                <Field label="비밀번호">
                  {(id) => (
                    <div className="password-field">
                      <input
                        id={id}
                        type={show ? 'text' : 'password'}
                        autoComplete="current-password"
                        placeholder="비밀번호를 입력해 주세요"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        aria-label={show ? '비밀번호 숨기기' : '비밀번호 보기'}
                        onClick={() => setShow(!show)}
                      >
                        {show ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  )}
                </Field>
              </>
            }
            {(error || authError) && (
              <p className="form-error" role="alert">
                {error || authError}
              </p>
            )}
            {!isDemo && !firebaseConfigured && (
              <p className="form-error">
                Firebase 설정이 아직 없어요. 프로젝트의 .env.example을 확인해 주세요.
              </p>
            )}
            <Button
              type="submit"
              className="login-submit"
              loading={busy || loading}
              disabled={!isDemo && !firebaseConfigured}
            >
              로그인 하기
              <ArrowRight size={18} />
            </Button>
          </form>
          <p className="login-footnote">
            나의 콘텐츠에 더 많은 시간을.
            <br />
            반복되는 일은 HOOKIT STUDIO가 도와드릴게요.
          </p>
        </div>
        <small>© {new Date().getFullYear()} HOOKIT STUDIO. All connections matter.</small>
      </section>
      <section className="login-visual">
        <div className="login-visual-heading">
          <span className="pill">Less routine, more connection.</span>
          <h2>
            댓글 하나에서
            <br />
            <span>시작되는 가능성.</span>
          </h2>
          <p>
            관심을 대화로, 대화를 새로운 연결로.
            <br />내 콘텐츠에 반응한 사람들을 놓치지 마세요.
          </p>
        </div>
        <div className="floating-conversation">
          <div className="conversation-card">
            <span className="conversation-icon">
              <MessageCircle size={22} />
            </span>
            <div>
              <small>새로운 댓글</small>
              <strong>“루틴 노트 받아보고 싶어요 🌿”</strong>
            </div>
          </div>
          <div className="connection-line">
            <span />
            <span />
            <span />
          </div>
          <div className="conversation-card card-offset">
            <span className="conversation-icon lime">
              <Send size={22} />
            </span>
            <div>
              <small>자동 DM</small>
              <strong>팔로우를 확인하고 자료를 전달해요.</strong>
            </div>
            <span className="check-mark">
              <Check size={15} />
            </span>
          </div>
          <div className="login-instagram">
            <Instagram size={16} /> Built for your Instagram
          </div>
        </div>
        <div className="login-visual-bottom">
          <span>CREATE. CONNECT. GROW.</span>
          <span>↗</span>
        </div>
      </section>
    </div>
  );
}
