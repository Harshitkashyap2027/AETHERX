import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  doc, getDoc, collection, query, where, getDocs, orderBy,
  updateDoc, arrayUnion, arrayRemove, serverTimestamp, addDoc,
} from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { toast } from 'react-toastify';
import { IoGridOutline, IoFolderOpenOutline, IoSettingsOutline, IoCameraOutline, IoCheckmarkCircle } from 'react-icons/io5';
import { db, storage } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import Avatar from '../components/common/Avatar';
import PostCard from '../components/posts/PostCard';
import SkeletonLoader from '../components/common/SkeletonLoader';

const Profile = () => {
  const { username } = useParams();
  const { user, userProfile, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('posts');
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({});
  const [saving, setSaving] = useState(false);
  const [photoFile, setPhotoFile] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);

  const isOwn = !username || username === userProfile?.username;

  useEffect(() => {
    loadProfile();
  }, [username, userProfile]);

  const loadProfile = async () => {
    setLoading(true);
    try {
      let uid;
      if (isOwn) {
        uid = user?.uid;
        setProfile(userProfile);
      } else {
        const unameSnap = await getDoc(doc(db, 'usernames', username));
        if (!unameSnap.exists()) { toast.error('User not found'); navigate('/'); return; }
        uid = unameSnap.data().uid;
        const profSnap = await getDoc(doc(db, 'users', uid));
        if (profSnap.exists()) setProfile(profSnap.data());
      }
      if (!uid) return;
      setIsFollowing(userProfile?.following?.includes(uid));

      // Fetch posts
      const pq = query(
        collection(db, 'posts'),
        where('userId', '==', uid),
        orderBy('createdAt', 'desc')
      );
      const ps = await getDocs(pq);
      setPosts(ps.docs.map((d) => ({ id: d.id, ...d.data() })));

      // Fetch projects
      const projq = query(
        collection(db, 'projects'),
        where('ownerId', '==', uid),
        orderBy('createdAt', 'desc')
      );
      const projs = await getDocs(projq);
      setProjects(projs.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async () => {
    if (!profile) return;
    setFollowLoading(true);
    try {
      const targetUid = profile.uid;
      if (isFollowing) {
        await updateDoc(doc(db, 'users', user.uid), { following: arrayRemove(targetUid) });
        await updateDoc(doc(db, 'users', targetUid), { followers: arrayRemove(user.uid) });
        setIsFollowing(false);
      } else {
        if (profile.isPrivate) {
          await updateDoc(doc(db, 'users', targetUid), { followRequests: arrayUnion(user.uid) });
          await addDoc(collection(db, 'notifications'), {
            userId: targetUid,
            type: 'follow_request',
            fromUid: user.uid,
            fromName: userProfile?.displayName,
            fromPhoto: userProfile?.photoURL,
            read: false,
            handled: false,
            createdAt: serverTimestamp(),
          });
          toast.info('Follow request sent');
        } else {
          await updateDoc(doc(db, 'users', user.uid), { following: arrayUnion(targetUid) });
          await updateDoc(doc(db, 'users', targetUid), { followers: arrayUnion(user.uid) });
          setIsFollowing(true);
          await addDoc(collection(db, 'notifications'), {
            userId: targetUid,
            type: 'follow',
            fromUid: user.uid,
            fromName: userProfile?.displayName,
            fromPhoto: userProfile?.photoURL,
            read: false,
            createdAt: serverTimestamp(),
          });
        }
      }
      await refreshProfile();
    } catch {
      toast.error('Failed to update follow status');
    } finally {
      setFollowLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      let updates = { ...editData };
      if (photoFile) {
        const r = ref(storage, `avatars/${user.uid}`);
        const t = uploadBytesResumable(r, photoFile);
        await new Promise((res, rej) => t.on('state_changed', null, rej, async () => {
          updates.photoURL = await getDownloadURL(t.snapshot.ref);
          res();
        }));
      }
      if (coverFile) {
        const r = ref(storage, `covers/${user.uid}`);
        const t = uploadBytesResumable(r, coverFile);
        await new Promise((res, rej) => t.on('state_changed', null, rej, async () => {
          updates.coverURL = await getDownloadURL(t.snapshot.ref);
          res();
        }));
      }
      await updateDoc(doc(db, 'users', user.uid), updates);
      await refreshProfile();
      setEditMode(false);
      setPhotoFile(null); setCoverFile(null);
      setPhotoPreview(null); setCoverPreview(null);
      toast.success('Profile updated!');
      loadProfile();
    } catch {
      toast.error('Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      <SkeletonLoader type="profile" />
    </div>
  );

  if (!profile) return null;

  const displayPhoto = photoPreview || profile.photoURL;
  const displayCover = coverPreview || profile.coverURL;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      {/* Profile card */}
      <div className="bento-card overflow-hidden">
        {/* Cover */}
        <div
          className="relative h-36 bg-gradient-to-br from-primary/30 to-secondary/30"
          style={displayCover ? { backgroundImage: `url(${displayCover})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
        >
          {editMode && (
            <label className="absolute inset-0 flex items-center justify-center bg-black/40 cursor-pointer">
              <IoCameraOutline size={28} className="text-white/80" />
              <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                setCoverFile(e.target.files[0]);
                setCoverPreview(URL.createObjectURL(e.target.files[0]));
              }} />
            </label>
          )}
        </div>

        <div className="px-5 pb-5">
          {/* Avatar */}
          <div className="relative w-20 h-20 -mt-10 mb-3">
            <Avatar src={displayPhoto} alt={profile.displayName} size={80} ring={!editMode} />
            {editMode && (
              <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full cursor-pointer">
                <IoCameraOutline size={20} className="text-white" />
                <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                  setPhotoFile(e.target.files[0]);
                  setPhotoPreview(URL.createObjectURL(e.target.files[0]));
                }} />
              </label>
            )}
          </div>

          {/* Info */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-white">{profile.displayName}</h1>
                {profile.isVerified && <IoCheckmarkCircle className="text-primary flex-shrink-0" size={18} />}
              </div>
              <p className="text-white/50 text-sm">@{profile.username}</p>
              {editMode ? (
                <textarea
                  value={editData.bio ?? profile.bio}
                  onChange={(e) => setEditData((d) => ({ ...d, bio: e.target.value }))}
                  className="input-field mt-2 text-sm resize-none"
                  rows={3}
                  placeholder="Your bio…"
                />
              ) : (
                profile.bio && <p className="text-white/80 text-sm mt-2 leading-relaxed">{profile.bio}</p>
              )}
            </div>

            {/* Actions */}
            <div className="flex-shrink-0">
              {isOwn ? (
                editMode ? (
                  <div className="flex gap-2">
                    <button onClick={() => setEditMode(false)} className="px-3 py-1.5 rounded-xl bg-white/10 text-white text-sm">
                      Cancel
                    </button>
                    <button onClick={handleSave} disabled={saving} className="px-3 py-1.5 rounded-xl gradient-bg text-white text-sm font-semibold">
                      {saving ? 'Saving…' : 'Save'}
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => { setEditMode(true); setEditData({}); }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 text-white text-sm hover:bg-white/15 transition-colors"
                  >
                    <IoSettingsOutline size={15} />
                    Edit
                  </button>
                )
              ) : (
                <button
                  onClick={handleFollow}
                  disabled={followLoading}
                  className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all ${
                    isFollowing
                      ? 'bg-white/10 text-white hover:bg-white/15'
                      : 'gradient-bg text-white shadow-lg shadow-primary/20'
                  }`}
                >
                  {followLoading ? '…' : isFollowing ? 'Following' : profile.isPrivate ? 'Request' : 'Follow'}
                </button>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="flex gap-6 mt-4 pt-4 border-t border-white/8">
            <div className="text-center">
              <p className="text-lg font-bold text-white">{posts.length}</p>
              <p className="text-xs text-white/40">Posts</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-white">{profile.followers?.length || 0}</p>
              <p className="text-xs text-white/40">Followers</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-white">{profile.following?.length || 0}</p>
              <p className="text-xs text-white/40">Following</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-white">{projects.length}</p>
              <p className="text-xs text-white/40">Projects</p>
            </div>
          </div>

          {/* Skills */}
          {profile.skills?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-4">
              {profile.skills.map((s) => (
                <span key={s} className="tag-chip">{s}</span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1">
        <button
          onClick={() => setTab('posts')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all ${
            tab === 'posts' ? 'gradient-bg text-white' : 'bg-white/5 text-white/50 hover:text-white hover:bg-white/10'
          }`}
        >
          <IoGridOutline size={16} /> Posts
        </button>
        <button
          onClick={() => setTab('projects')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all ${
            tab === 'projects' ? 'gradient-bg text-white' : 'bg-white/5 text-white/50 hover:text-white hover:bg-white/10'
          }`}
        >
          <IoFolderOpenOutline size={16} /> Projects
        </button>
      </div>

      {/* Content */}
      {tab === 'posts' ? (
        posts.length === 0 ? (
          <div className="bento-card p-10 text-center">
            <p className="text-white/40 text-sm">No posts yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((p) => <PostCard key={p.id} post={p} onDelete={(id) => setPosts((prev) => prev.filter((x) => x.id !== id))} />)}
          </div>
        )
      ) : (
        projects.length === 0 ? (
          <div className="bento-card p-10 text-center">
            <p className="text-white/40 text-sm">No projects yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {projects.map((proj) => (
              <div key={proj.id} className="bento-card p-4">
                {proj.previewUrl && (
                  <img src={proj.previewUrl} alt={proj.title} className="w-full h-32 object-cover rounded-xl mb-3" />
                )}
                <h3 className="text-white font-semibold text-sm">{proj.title}</h3>
                <p className="text-white/50 text-xs mt-1 line-clamp-2">{proj.description}</p>
                <div className="flex gap-2 mt-3">
                  {proj.repoUrl && (
                    <a href={proj.repoUrl} target="_blank" rel="noopener noreferrer"
                      className="text-xs px-2.5 py-1 rounded-lg bg-white/10 text-white/70 hover:text-white transition-colors">
                      GitHub
                    </a>
                  )}
                  <span className={`text-xs px-2.5 py-1 rounded-lg ${proj.isPublic ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'}`}>
                    {proj.isPublic ? 'Public' : 'Private'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
};

export default Profile;
