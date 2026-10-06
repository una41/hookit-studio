import { Search, LoaderCircle } from 'lucide-react';
import { PostArtwork } from '../../components/ui/PostArtwork';
import type { Post, Automation } from '../../types';
export function PostList({
  username,
  posts,
  automations,
  search,
  setSearch,
  selected,
  setSelected,
  busy,
  error,
}: {
  username?: string;
  posts: Post[];
  automations: Automation[];
  search: string;
  setSearch: (value: string) => void;
  selected: string;
  setSelected: (value: string) => void;
  busy: boolean;
  error: string;
}) {
  return (
    <section className="panel posts-list">
      <header>
        <strong>@{username}</strong>
        <span>{busy && !posts.length ? '불러오는 중…' : `콘텐츠 ${posts.length}개`}</span>
      </header>
      <div className="search-field">
        <Search size={16} />
        <input
          aria-label="게시물 검색"
          placeholder="게시물 내용 검색"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      {busy && (
        <p className="modal-description" role="status" aria-live="polite">
          <LoaderCircle className="spin" size={18} aria-hidden="true" /> 게시물을 불러오는 중입니다
        </p>
      )}
      {!busy && !error && !posts.length && (
        <p className="modal-description">불러올 게시물이 없어요.</p>
      )}
      {posts
        .filter((p) => p.title.toLowerCase().includes(search.toLowerCase()))
        .map((p) => (
          <button
            key={p.id}
            className={`post-list-item ${p.id === selected ? 'selected' : ''}`}
            aria-pressed={p.id === selected}
            onClick={() => setSelected(p.id)}
          >
            <PostArtwork post={p} small />
            <span>
              <strong>{p.title}</strong>
              <small>
                {p.kind === 'VIDEO' ? '동영상 · 릴스' : '게시물'} · 설정{' '}
                {automations.filter((a) => a.post?.id === p.id).length}개
              </small>
            </span>
          </button>
        ))}
      <p className="posts-limit">최근 게시물 최대 50개를 불러옵니다.</p>
    </section>
  );
}
