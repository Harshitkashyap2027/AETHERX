import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IoAddOutline, IoImageOutline } from 'react-icons/io5';
import {
  collection, query, orderBy, limit, getDocs, startAfter,
  where, serverTimestamp, addDoc,
} from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';
import { db, storage } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import PostCard from '../components/posts/PostCard';
import CreatePost from '../components/posts/CreatePost';
import StoryCircle from '../components/stories/StoryCircle';
import StoryViewer from '../components/stories/StoryViewer';
import SkeletonLoader from '../components/common/SkeletonLoader';
import Avatar from '../components/common/Avatar';

const Home = () => {
  const { user, userProfile } = useAuth();
  const [posts, setPosts] = useState([]);
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [viewingStory, setViewingStory] = useState(null);
  const [tab, setTab] = useState('global'); // 'global' | 'following'
  const lastDocRef = useRef(null);
  const storyFileRef = useRef();

  const fetchPosts = async (isInitial = false) => {
    if (isInitial) setLoading(true);
    else setLoadingMore(true);
    try {
      let q;
      if (tab === 'following' && userProfile?.following?.length > 0) {
        const following = userProfile.following.slice(0, 10);
        q = query(
          collection(db, 'posts'),
          where('userId', 'in', following),
          orderBy('createdAt', 'desc'),
          limit(10)
        );
      } else {
        q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'), limit(10));
      }
      if (!isInitial && lastDocRef.current) {
        q = query(q, startAfter(lastDocRef.current));
      }
      const snap = await getDocs(q);
      const newPosts = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      lastDocRef.current = snap.docs[snap.docs.length - 1];
      if (isInitial) setPosts(newPosts);
      else setPosts((prev) => [...prev, ...newPosts]);
      setHasMore(snap.docs.length === 10);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const fetchStories = async () => {
    try {
      const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const q = query(
        collection(db, 'stories'),
        where('createdAt', '>=', cutoff),
        orderBy('createdAt', 'desc'),
        limit(20)
      );
      const snap = await getDocs(q);
      setStories(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch {}
  };

  useEffect(() => {
    lastDocRef.current = null;
    fetchPosts(true);
    fetchStories();
  }, [tab]);

  const handleAddStory = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const ext = file.name.split('.').pop();
    const storageRef = ref(storage, `stories/${user.uid}/${uuidv4()}.${ext}`);
    const task = uploadBytesResumable(storageRef, file);
    task.on('state_changed', null, null, async () => {
      const url = await getDownloadURL(task.snapshot.ref);
      await addDoc(collection(db, 'stories'), {
        userId: user.uid,
        userDisplayName: userProfile?.displayName || '',
        userUsername: userProfile?.username || '',
        userPhoto: userProfile?.photoURL || '',
        mediaUrl: url,
        mediaType: file.type.startsWith('video') ? 'video' : 'image',
        viewers: [],
        createdAt: serverTimestamp(),
      });
      fetchStories();
    });
  };

  const handlePostCreated = (newPost) => {
    setPosts((prev) => [newPost, ...prev]);
  };

  const handlePostDelete = (id) => {
    setPosts((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
      {/* Stories row */}
      <div className="bento-card p-4">
        <div className="flex gap-4 overflow-x-auto pb-1 scrollbar-none">
          {/* Add story button */}
          <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
            <button
              onClick={() => storyFileRef.current?.click()}
              className="w-14 h-14 rounded-full border-2 border-dashed border-white/20 hover:border-primary flex items-center justify-center transition-colors relative"
            >
              <Avatar src={userProfile?.photoURL} alt={userProfile?.displayName} size={52} />
              <span className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full gradient-bg flex items-center justify-center">
                <IoAddOutline size={14} className="text-white" />
              </span>
            </button>
            <span className="text-xs text-white/50">Add story</span>
            <input ref={storyFileRef} type="file" accept="image/*,video/*" onChange={handleAddStory} className="hidden" />
          </div>

          {stories.map((s) => (
            <StoryCircle
              key={s.id}
              story={s}
              onClick={() => setViewingStory(stories.indexOf(s))}
            />
          ))}
          {stories.length === 0 && (
            <div className="flex items-center justify-center flex-1 text-white/30 text-sm py-2">
              No stories yet. Be the first!
            </div>
          )}
        </div>
      </div>

      {/* Create post */}
      <div className="bento-card p-4">
        <div className="flex items-center gap-3">
          <Avatar src={userProfile?.photoURL} alt={userProfile?.displayName} size={38} />
          <button
            onClick={() => setShowCreate(true)}
            className="flex-1 text-left px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/40 text-sm hover:bg-white/8 transition-colors"
          >
            What are you building today?
          </button>
          <button
            onClick={() => setShowCreate(true)}
            className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-white/40 hover:text-white hover:bg-white/10 transition-colors"
          >
            <IoImageOutline size={20} />
          </button>
        </div>
      </div>

      {/* Feed tabs */}
      <div className="flex gap-2">
        {['global', 'following'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              tab === t ? 'gradient-bg text-white shadow-lg shadow-primary/20' : 'bg-white/5 text-white/50 hover:text-white hover:bg-white/10'
            }`}
          >
            {t === 'global' ? '🌍 Global' : '👥 Following'}
          </button>
        ))}
      </div>

      {/* Posts */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => <SkeletonLoader key={i} type="post" />)}
        </div>
      ) : posts.length === 0 ? (
        <div className="bento-card p-12 text-center">
          <div className="text-5xl mb-4">🚀</div>
          <p className="text-white font-semibold">Nothing here yet</p>
          <p className="text-white/50 text-sm mt-1">
            {tab === 'following' ? 'Follow people to see their posts here' : 'Be the first to share something!'}
          </p>
          <button onClick={() => setShowCreate(true)} className="btn-primary mt-4 max-w-xs mx-auto">
            Create First Post
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} onDelete={handlePostDelete} />
          ))}
          {hasMore && (
            <button
              onClick={() => fetchPosts(false)}
              disabled={loadingMore}
              className="w-full py-3 rounded-xl bg-white/5 text-white/50 text-sm hover:text-white hover:bg-white/8 transition-all"
            >
              {loadingMore ? 'Loading…' : 'Load more'}
            </button>
          )}
        </div>
      )}

      {/* Story viewer */}
      <AnimatePresence>
        {viewingStory !== null && (
          <StoryViewer
            stories={stories}
            startIndex={viewingStory}
            onClose={() => setViewingStory(null)}
          />
        )}
      </AnimatePresence>

      {/* Create post modal */}
      <CreatePost
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={handlePostCreated}
      />
    </div>
  );
};

export default Home;
