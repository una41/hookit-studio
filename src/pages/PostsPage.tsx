import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { RefreshCw, Instagram, ArrowRight } from 'lucide-react';
import { useWorkspace } from '../features/workspace/WorkspaceProvider';
import { loadPosts } from '../features/workspace/service';
import { PageHeader } from '../components/ui/PageHeader';
import { Button } from '../components/ui/Button';
import { PostList } from '../features/posts/PostList';
import { PostDetail } from '../features/posts/PostDetail';
import { errorMessage } from '../lib/format';
import type { Post } from '../types';
export function PostsPage() {
  const { data } = useWorkspace();
  const [posts, setPosts] = useState<Post[]>([]);
  const [selected, setSelected] = useState('');
  const [search, setSearch] = useState('');
  const [busy, setBusy] = useState(data.account?.status === 'connected');
  const [error, setError] = useState('');
  const connected = data.account?.status === 'connected';
  async function reload() {
    setBusy(true);
    setError('');
    try {
      const result = await loadPosts();
      setPosts(result);
      setSelected((current) =>
        result.some((p) => p.id === current) ? current : result[0]?.id || '',
      );
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    if (connected) void reload();
    else {
      setPosts([]);
      setSelected('');
    }
  }, [data.account?.id, connected]);
  const post = posts.find((p) => p.id === selected);
  const campaigns = data.automations.filter((a) => a.post?.id === selected);
  return (
    <>
      <PageHeader
        eyebrow="INSTAGRAM CONTENTS"
        title="게시물별 자동 DM"
        description="인스타그램을 연결하고, 게시물을 골라 댓글과 DM을 설정하세요."
        action={
          <Button onClick={() => void reload()} loading={busy} disabled={!connected}>
            <RefreshCw size={16} />
            {busy ? '불러오는 중입니다' : '게시물 불러오기'}
          </Button>
        }
      />
      <div className="post-flow">
        <span>1. 인스타그램 연결</span>
        <ArrowRight size={14} />
        <span>2. 게시물 선택</span>
        <ArrowRight size={14} />
        <span>3. 댓글 · DM 설정</span>
      </div>
      {!connected ? (
        <div className="panel empty-state">
          <Instagram size={32} />
          <h2>인스타그램 계정을 먼저 연결하세요</h2>
          <p>공식 로그인으로 본인 계정을 연결하면 게시물과 릴스를 불러올 수 있어요.</p>
          <Link className="button button-primary" to="/settings/instagram">
            인스타그램 연결하기
          </Link>
        </div>
      ) : (
        <div className="posts-workspace">
          <PostList
            username={data.account?.username}
            posts={posts}
            automations={data.automations}
            search={search}
            setSearch={setSearch}
            selected={selected}
            setSelected={setSelected}
            busy={busy}
            error={error}
          />
          <PostDetail post={post} campaigns={campaigns} busy={busy} />
        </div>
      )}
    </>
  );
}
