import { useState } from 'react';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import {
  IoHeartOutline, IoHeart, IoChatbubbleOutline, IoShareOutline,
  IoBookmarkOutline, IoBookmark, IoEllipsisHorizontal,
} from 'react-icons/io5';
import { doc, updateDoc, arrayUnion, arrayRemove, deleteDoc } from 'firebase/firestore';
import { toast } from 'react-toastify';
import { db } from '../../firebase/config';
import { useAuth } from '../../contexts/AuthContext';
import Avatar from '../common/Avatar';

const PostCard = ({ post, onDelete }) => {
  const { user } = useAuth();
  const [liked, setLiked] = useState(post.likes?.includes(user?.uid));
  const [likeCount, setLikeCount] = useState(post.likes?.length || 0);
  const [saved, setSaved] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showComment, setShowComment] = useState(false);
  const [comment, setComment] = useState('');

  const toggleLike = async () => {
    if (!user) return;
    const ref = doc(db, 'posts', post.id);
    try {
      if (liked) {
        await updateDoc(ref, { likes: arrayRemove(user.uid) });
        setLikeCount((c) => c - 1);
      } else {
        await updateDoc(ref, { likes: arrayUnion(user.uid) });
        setLikeCount((c) => c + 1);
        // Notify post owner
        if (post.userId !== user.uid) {
          await updateDoc(doc(db, 'users', post.userId), {
            notifications: arrayUnion({
              type: 'like',
              fromUid: user.uid,
              postId: post.id,
              createdAt: new Date().toISOString(),
              read: false,
            }),
          });
        }
      }
      setLiked((l) => !l);
    } catch {
      toast.error('Failed to update like');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this post?')) return;
    try {
      await deleteDoc(doc(db, 'posts', post.id));
      onDelete?.(post.id);
      toast.success('Post deleted');
    } catch {
      toast.error('Failed to delete post');
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({ title: 'AETHER Post', text: post.caption });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied!');
    }
  };

  const createdAt = post.createdAt?.toDate?.() || new Date(post.createdAt);

  return (
    <motion.div
      className="bento-card overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3">
        <div className="flex items-center gap-3">
          <Avatar src={post.userPhoto} alt={post.userDisplayName} size={38} ring />
          <div>
            <p className="text-sm font-semibold text-white">{post.userDisplayName || 'Unknown'}</p>
            <p className="text-xs text-white/40">
              @{post.userUsername} · {formatDistanceToNow(createdAt, { addSuffix: true })}
            </p>
          </div>
        </div>

        {/* Menu */}
        <div className="relative">
          <button
            onClick={() => setShowMenu((s) => !s)}
            className="p-1.5 rounded-xl hover:bg-white/10 text-white/40 hover:text-white transition-colors"
          >
            <IoEllipsisHorizontal size={20} />
          </button>
          {showMenu && (
            <div className="absolute right-0 top-8 z-20 bento-card p-1 min-w-[140px]">
              <button
                onClick={handleShare}
                className="w-full text-left px-3 py-2 text-sm text-white/70 hover:text-white hover:bg-white/8 rounded-lg transition-colors"
              >
                Share post
              </button>
              {post.userId === user?.uid && (
                <button
                  onClick={handleDelete}
                  className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                >
                  Delete post
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Media */}
      {post.mediaUrl && (
        <div className="mx-4 rounded-xl overflow-hidden bg-darkCard">
          {post.mediaType === 'video' ? (
            <video src={post.mediaUrl} controls className="w-full max-h-80 object-cover" />
          ) : (
            <img
              src={post.mediaUrl}
              alt="Post"
              className="w-full max-h-80 object-cover"
              loading="lazy"
            />
          )}
        </div>
      )}

      {/* Caption */}
      {post.caption && (
        <div className="px-4 pt-3">
          <p className="text-sm text-white/90 leading-relaxed">
            {post.caption}
            {post.hashtags?.map((tag) => (
              <span key={tag} className="text-primary ml-1">#{tag}</span>
            ))}
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-1 px-3 py-3">
        <button
          onClick={toggleLike}
          className={`post-action-btn ${liked ? 'liked' : ''}`}
        >
          {liked ? <IoHeart size={20} /> : <IoHeartOutline size={20} />}
          <span>{likeCount}</span>
        </button>

        <button
          onClick={() => setShowComment((s) => !s)}
          className="post-action-btn"
        >
          <IoChatbubbleOutline size={20} />
          <span>{post.comments?.length || 0}</span>
        </button>

        <button onClick={handleShare} className="post-action-btn">
          <IoShareOutline size={20} />
        </button>

        <button
          onClick={() => setSaved((s) => !s)}
          className={`post-action-btn ml-auto ${saved ? 'text-primary' : ''}`}
        >
          {saved ? <IoBookmark size={20} /> : <IoBookmarkOutline size={20} />}
        </button>
      </div>

      {/* Comment input */}
      {showComment && (
        <div className="px-4 pb-4 flex gap-2">
          <input
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Add a comment…"
            className="input-field text-sm py-2"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && comment.trim()) {
                toast.info('Comments coming soon!');
                setComment('');
              }
            }}
          />
        </div>
      )}
    </motion.div>
  );
};

export default PostCard;
