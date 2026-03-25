import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { IoImageOutline, IoCloseOutline, IoSendOutline } from 'react-icons/io5';
import { toast } from 'react-toastify';
import { collection, addDoc, serverTimestamp, doc, updateDoc, increment } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';
import { db, storage } from '../../firebase/config';
import { useAuth } from '../../contexts/AuthContext';
import Avatar from '../common/Avatar';
import Modal from '../common/Modal';

const CreatePost = ({ isOpen, onClose, onCreated }) => {
  const { user, userProfile } = useAuth();
  const [caption, setCaption] = useState('');
  const [hashtags, setHashtags] = useState('');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef();

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    if (f.size > 20 * 1024 * 1024) return toast.error('File size must be under 20 MB');
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const removeFile = () => {
    setFile(null);
    setPreview(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!caption.trim() && !file) return toast.error('Add a caption or media');
    setLoading(true);
    try {
      let mediaUrl = '';
      let mediaType = '';
      if (file) {
        const ext = file.name.split('.').pop();
        const storageRef = ref(storage, `posts/${user.uid}/${uuidv4()}.${ext}`);
        const task = uploadBytesResumable(storageRef, file);
        await new Promise((resolve, reject) => {
          task.on('state_changed',
            (snap) => setProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100)),
            reject,
            async () => {
              mediaUrl = await getDownloadURL(task.snapshot.ref);
              resolve();
            }
          );
        });
        mediaType = file.type.startsWith('video') ? 'video' : 'image';
      }

      const tags = hashtags.match(/#?(\w+)/g)?.map((t) => t.replace('#', '')) || [];
      const postData = {
        userId: user.uid,
        userDisplayName: userProfile?.displayName || '',
        userUsername: userProfile?.username || '',
        userPhoto: userProfile?.photoURL || '',
        caption: caption.trim(),
        hashtags: tags,
        mediaUrl,
        mediaType,
        likes: [],
        comments: [],
        saves: [],
        createdAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, 'posts'), postData);
      await updateDoc(doc(db, 'users', user.uid), { postCount: increment(1) });

      onCreated?.({ id: docRef.id, ...postData, createdAt: new Date() });
      toast.success('Post shared!');
      setCaption('');
      setHashtags('');
      removeFile();
      setProgress(0);
      onClose();
    } catch (err) {
      toast.error('Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Post">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex gap-3">
          <Avatar src={userProfile?.photoURL} alt={userProfile?.displayName} size={38} />
          <div className="flex-1">
            <p className="text-sm font-medium text-white">{userProfile?.displayName}</p>
            <p className="text-xs text-white/40">@{userProfile?.username}</p>
          </div>
        </div>

        <textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="What's on your mind? Share code, ideas, updates…"
          rows={4}
          className="input-field resize-none"
          maxLength={500}
        />

        <input
          value={hashtags}
          onChange={(e) => setHashtags(e.target.value)}
          placeholder="#react #javascript #webdev"
          className="input-field text-sm"
        />

        {/* Preview */}
        {preview && (
          <div className="relative rounded-xl overflow-hidden bg-darkCard">
            {file?.type.startsWith('video') ? (
              <video src={preview} className="w-full max-h-48 object-cover" controls />
            ) : (
              <img src={preview} alt="Preview" className="w-full max-h-48 object-cover" />
            )}
            <button
              type="button"
              onClick={removeFile}
              className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
            >
              <IoCloseOutline size={18} />
            </button>
          </div>
        )}

        {/* Upload progress */}
        {loading && progress > 0 && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-white/50">
              <span>Uploading…</span><span>{progress}%</span>
            </div>
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                className="h-full gradient-bg rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-white/60 hover:text-white hover:bg-white/8 transition-all text-sm"
          >
            <IoImageOutline size={20} />
            <span>Photo / Video</span>
          </button>
          <input ref={fileRef} type="file" accept="image/*,video/*" onChange={handleFile} className="hidden" />

          <button
            type="submit"
            disabled={loading || (!caption.trim() && !file)}
            className="flex items-center gap-2 px-5 py-2 rounded-xl gradient-bg text-white text-sm font-semibold disabled:opacity-50 transition-all"
          >
            <IoSendOutline size={16} />
            <span>{loading ? 'Posting…' : 'Share'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default CreatePost;
