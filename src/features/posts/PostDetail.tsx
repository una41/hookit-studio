import { CreateAutomationLink } from '../automations/CreateAutomationLink';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { PostArtwork } from '../../components/ui/PostArtwork';
import { StatusBadge } from '../../components/ui/Badge';
import type { Post, Automation } from '../../types';
export function PostDetail({ post, campaigns }: { post?: Post; campaigns: Automation[] }) {
  return (
    <section className="panel post-detail">
      {post ? (
        <>
          <div className="post-detail-head">
            <PostArtwork post={post} />
            <div>
              <span className="eyebrow">SELECTED POST</span>
              <h2>{post.title}</h2>
              {post.permalink && (
                <a href={post.permalink} target="_blank" rel="noreferrer">
                  인스타그램에서 보기 ↗
                </a>
              )}
            </div>
          </div>
          <h3>이 게시물의 자동화</h3>
          {campaigns.length ? (
            campaigns.map((a) => (
              <Link className="post-campaign" key={a.id} to={`/automations/${a.id}/edit`}>
                <div>
                  <strong>{a.name}</strong>
                  <p>
                    {a.trigger === 'all' ? '모든 댓글' : a.keywords.join(', ') || '키워드 미설정'}
                  </p>
                </div>
                <StatusBadge status={a.status} />
                <ArrowRight size={16} />
              </Link>
            ))
          ) : (
            <p className="modal-description">
              아직 설정이 없어요. 댓글 조건과 첫 DM, 팔로우 안내, 전달 링크를 만들어 주세요.
            </p>
          )}
          <CreateAutomationLink className="button button-primary" state={{ post }}>
            이 게시물로 자동화 만들기
          </CreateAutomationLink>
        </>
      ) : (
        <div className="empty-state">
          <h2>게시물을 선택해 주세요</h2>
          <p>왼쪽 목록에서 설정할 콘텐츠를 선택하세요.</p>
        </div>
      )}
    </section>
  );
}
