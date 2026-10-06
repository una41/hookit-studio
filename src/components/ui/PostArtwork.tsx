import { Film, Layers, ArrowUpRight, Leaf } from 'lucide-react';
import type { Post } from '../../types';
export function PostArtwork({ post, small = false }: { post: Post | null; small?: boolean }) {
  return (
    <div className={`post-art theme-${post?.theme || 'sage'} ${small ? 'post-art-small' : ''}`}>
      {post?.mediaUrl ? (
        <img src={post.mediaUrl} alt={post.title} loading="lazy" referrerPolicy="no-referrer" />
      ) : (
        <>
          <div className="art-grain" />
          <span className="art-kicker">DAILY STUDIO / NOTES</span>
          <span className="art-title">
            {post?.theme === 'sand' ? (
              <>
                a little
                <br />
                <i>organized.</i>
              </>
            ) : post?.theme === 'rose' ? (
              <>
                weekend
                <br />
                <i>reset.</i>
              </>
            ) : post?.theme === 'ink' ? (
              <>
                make
                <br />
                <i>room.</i>
              </>
            ) : (
              <>
                small steps,
                <br />
                <i>better days.</i>
              </>
            )}
          </span>
          <span className="art-bottom">
            <Leaf size={small ? 14 : 24} strokeWidth={1} />
            <span>A GUIDE FOR YOUR EVERYDAY</span>
            <ArrowUpRight size={small ? 12 : 20} />
          </span>
        </>
      )}
      {!small && (
        <span className="post-kind">
          {post?.kind === 'VIDEO' ? <Film size={13} /> : <Layers size={13} />}
          {post?.kind === 'VIDEO' ? '릴스' : '게시물'}
        </span>
      )}
    </div>
  );
}
