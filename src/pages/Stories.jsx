import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IoAddOutline, IoImageOutline } from 'react-icons/io5';
import {
  collection, query, where, orderBy, getDocs, addDoc, serverTimestamp,
} from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'react-toastify';
import { db, storage } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import StoryCircle from '../components/stories/StoryCircle';
import StoryViewer from '../components/stories/StoryViewer';

const Stories = () => {
  const { user, userProfile } = useAuth();
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewingIndex, setViewingIndex] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileRef = useRef();

  const fetchStories = async () => {
    setLoading(true);
    try {
      const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const q = query(
        collection(db, 'stories'),
        where('createdAt', '>=', cutoff),
        orderBy('createdAt', 'desc')
      );
      const snap = await getDocs(q);
      setStories(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStories(); }, []);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) { toast.error('File must be under 50MB'); return; }
    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const r = ref(storage, `stories/${user.uid}/${uuidv4()}.${ext}`);
      const task = uploadBytesResumable(r, file);
      await new Promise((res, rej) => {
        task.on('state_changed',
          (s) => setProgress(Math.round((s.bytesTransferred / s.totalBytes) * 100)),
          rej,
          async () => {
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
            res();
          }
        );
      });
      toast.success('Story added!');
      setProgress(0);
      fetchStories();
    } catch {
      toast.error('Failed to upload story');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  // Group stories by user
  const grouped = stories.reduce((acc, story) => {
    const uid = story.userId;
    if (!acc[uid]) acc[uid] = [];
    acc[uid].push(story);
    return acc;
  }, {});
  const grouped_keys = Object.keys(grouped);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">Stories</h1>
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl gradient-bg text-white text-sm font-semibold shadow-lg shadow-primary/20"
        >
          {uploading ? (
            <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> {progress}%</>
          ) : (
            <><IoAddOutline size={18} /> Add Story</>
          )}
        </button>
        <input ref={fileRef} type="file" accept="image/*,video/*" onChange={handleUpload} className="hidden" />
      </div>

      {/* Your story */}
      <div className="bento-card p-5">
        <h2 className="text-sm font-semibold text-white/60 mb-3">Your Story</h2>
        <div className="flex items-center gap-3">
          <button onClick={() => fileRef.current?.click()} className="relative">
            <div
              className="w-16 h-16 rounded-full border-2 border-dashed border-white/20 hover:border-primary flex items-center justify-center transition-colors bg-white/5"
              style={userProfile?.photoURL ? { backgroundImage: `url(${userProfile.photoURL})`, backgroundSize: 'cover' } : {}}
            >
              {!userProfile?.photoURL && <IoImageOutline size={24} className="text-white/40" />}
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-6 h-6 rounded-full gradient-bg flex items-center justify-center">
              <IoAddOutline size={14} className="text-white" />
            </span>
          </button>
          <div>
            <p className="text-sm font-medium text-white">{userProfile?.displayName}</p>
            <p className="text-xs text-white/40">Tap to add a story · expires in 24h</p>
          </div>
        </div>
      </div>

      {/* All stories */}
      {loading ? (
        <div className="bento-card p-4">
          <div className="flex gap-4">
            {[1,2,3,4,5].map((i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <div className="skeleton w-16 h-16 rounded-full" />
                <div className="skeleton h-2 w-12 rounded" />
              </div>
            ))}
          </div>
        </div>
      ) : grouped_keys.length === 0 ? (
        <div className="bento-card p-12 text-center">
          <div className="text-5xl mb-4">📖</div>
          <p className="text-white font-semibold">No stories</p>
          <p className="text-white/50 text-sm mt-1">Stories expire after 24 hours</p>
        </div>
      ) : (
        <div className="bento-card p-5">
          <h2 className="text-sm font-semibold text-white/60 mb-4">Recent Stories</h2>
          <div className="flex gap-4 overflow-x-auto pb-1">
            {grouped_keys.map((uid, i) => {
              const userStories = grouped[uid];
              const first = userStories[0];
              const flatIndex = stories.findIndex((s) => s.id === first.id);
              return (
                <StoryCircle
                  key={uid}
                  story={first}
                  onClick={() => setViewingIndex(flatIndex >= 0 ? flatIndex : 0)}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Grid of story thumbnails */}
      {stories.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {stories.map((s, i) => (
            <button
              key={s.id}
              onClick={() => setViewingIndex(i)}
              className="relative aspect-square rounded-2xl overflow-hidden bg-darkCard hover:ring-2 hover:ring-primary transition-all"
            >
              {s.mediaType === 'video' ? (
                <video src={s.mediaUrl} className="w-full h-full object-cover" />
              ) : (
                <img src={s.mediaUrl} alt="" className="w-full h-full object-cover" />
              )}
              <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80">
                <p className="text-xs text-white truncate">{s.userDisplayName}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Story viewer */}
      <AnimatePresence>
        {viewingIndex !== null && (
          <StoryViewer
            stories={stories}
            startIndex={viewingIndex}
            onClose={() => setViewingIndex(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Stories;
