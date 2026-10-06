import { useState } from 'react';
import { ChevronDown, Check, Search, LoaderCircle } from 'lucide-react';
import type { Post } from '../../../types';
import { Modal } from '../../../components/ui/Modal';
import { PostArtwork } from '../../../components/ui/PostArtwork';
import { loadPosts } from '../../workspace/service';
import { useWorkspace } from '../../workspace/WorkspaceProvider';
import { errorMessage } from '../../../lib/format';
export function PostSelector({
  value,
  onChange,
}: {
  value: Post | null;
  onChange: (post: Post) => void;
}) {
  const { data } = useWorkspace();
  const [open, setOpen] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  async function show() {
    setOpen(true);
    setBusy(true);
    setError('');
    try {
      setPosts(await loadPosts());
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <button className="post-selector" onClick={() => void show()} disabled={!data.account}>
        <PostArtwork post={value} small />
        <span>
          <strong>{value ? value.title : '자동화할 게시물을 선택해 주세요'}</strong>
          <small>
            {value
              ? '게시물 변경하기'
              : data.account
                ? '내 인스타그램 게시물 · 릴스'
                : '인스타그램 계정을 먼저 연결해 주세요'}
          </small>
        </span>
        <ChevronDown size={18} />
      </button>
      {open && (
        <Modal title="게시물 선택" onClose={() => setOpen(false)} wide>
          <p className="modal-description">댓글에 답장을 보낼 게시물이나 릴스를 선택하세요.</p>
          <div className="search-field">
            <Search size={17} />
            <input
              placeholder="게시물 내용 검색"
              aria-label="게시물 검색"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {busy ? (
            <div className="page-loading">
              <LoaderCircle className="spin" />
            </div>
          ) : error ? (
            <p className="form-error">{error}</p>
          ) : (
            <div className="post-picker-grid">
              {posts
                .filter((p) => p.title.includes(search))
                .map((post) => (
                  <button
                    key={post.id}
                    className={`post-option ${value?.id === post.id ? 'post-selected' : ''}`}
                    onClick={() => {
                      onChange(post);
                      setOpen(false);
                    }}
                  >
                    <PostArtwork post={post} />
                    <span>{post.title}</span>
                    {value?.id === post.id && (
                      <i>
                        <Check size={15} />
                      </i>
                    )}
                  </button>
                ))}
            </div>
          )}
          {!busy && !error && !posts.length && (
            <p className="modal-description">
              불러올 게시물이 없어요. 인스타그램에 게시물을 등록한 뒤 다시 확인해 주세요.
            </p>
          )}
        </Modal>
      )}
    </>
  );
}
