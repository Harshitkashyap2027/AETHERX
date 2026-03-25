import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { IoSearchOutline, IoPersonOutline, IoDocumentTextOutline, IoFolderOpenOutline } from 'react-icons/io5';
import {
  collection, query, where, getDocs, orderBy, limit,
} from 'firebase/firestore';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import Avatar from '../components/common/Avatar';
import PostCard from '../components/posts/PostCard';
import SkeletonLoader from '../components/common/SkeletonLoader';

const Explore = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('q') || '');
  const [tab, setTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [trending, setTrending] = useState([]);

  useEffect(() => {
    loadTrending();
  }, []);

  useEffect(() => {
    if (searchParams.get('q')) {
      setSearch(searchParams.get('q'));
      doSearch(searchParams.get('q'));
    }
  }, [searchParams]);

  const loadTrending = async () => {
    try {
      const snap = await getDocs(
        query(collection(db, 'posts'), orderBy('createdAt', 'desc'), limit(10))
      );
      setPosts(snap.docs.map((d) => ({ id: d.id, ...d.data() })));

      const usnap = await getDocs(
        query(collection(db, 'users'), limit(8))
      );
      setUsers(usnap.docs.map((d) => ({ id: d.id, ...d.data() })).filter((u) => u.uid !== user?.uid));
    } catch {}
  };

  const doSearch = async (val) => {
    if (!val.trim()) return;
    setLoading(true);
    try {
      // Search users
      const uq = query(
        collection(db, 'users'),
        where('username', '>=', val.toLowerCase()),
        where('username', '<=', val.toLowerCase() + '\uf8ff'),
        limit(10)
      );
      const usnap = await getDocs(uq);
      setUsers(usnap.docs.map((d) => ({ id: d.id, ...d.data() })));

      // Search projects
      const pq = query(
        collection(db, 'projects'),
        where('isPublic', '==', true),
        orderBy('createdAt', 'desc'),
        limit(10)
      );
      const psnap = await getDocs(pq);
      const projs = psnap.docs.map((d) => ({ id: d.id, ...d.data() }))
        .filter((p) => p.title?.toLowerCase().includes(val.toLowerCase()) || p.description?.toLowerCase().includes(val.toLowerCase()));
      setProjects(projs);
    } catch {}
    setLoading(false);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    doSearch(search);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
      {/* Search */}
      <form onSubmit={handleSearch} className="relative">
        <IoSearchOutline size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search users, projects, posts…"
          className="input-field pl-11 py-3"
        />
        <button
          type="submit"
          className="absolute right-3 top-1/2 -translate-y-1/2 px-4 py-1.5 rounded-lg gradient-bg text-white text-sm font-medium"
        >
          Search
        </button>
      </form>

      {/* Tabs */}
      <div className="flex gap-2">
        {[
          { key: 'users', icon: IoPersonOutline, label: 'People' },
          { key: 'posts', icon: IoDocumentTextOutline, label: 'Posts' },
          { key: 'projects', icon: IoFolderOpenOutline, label: 'Projects' },
        ].map(({ key, icon: Icon, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              tab === key ? 'gradient-bg text-white' : 'bg-white/5 text-white/50 hover:text-white hover:bg-white/10'
            }`}
          >
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map((i) => <SkeletonLoader key={i} type="user" />)}
        </div>
      ) : (
        <>
          {/* Users */}
          {tab === 'users' && (
            users.length === 0 ? (
              <div className="bento-card p-12 text-center">
                <p className="text-white/40">No users found</p>
              </div>
            ) : (
              <div className="bento-card overflow-hidden divide-y divide-white/5">
                {users.map((u, i) => (
                  <motion.button
                    key={u.uid || u.id}
                    onClick={() => navigate(`/profile/${u.username}`)}
                    className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-white/5 transition-colors text-left"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                  >
                    <Avatar src={u.photoURL} alt={u.displayName} size={46} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-semibold text-white">{u.displayName}</p>
                        {u.isVerified && <span className="text-primary text-xs">✓</span>}
                      </div>
                      <p className="text-xs text-white/40">@{u.username}</p>
                      {u.bio && <p className="text-xs text-white/50 mt-0.5 truncate">{u.bio}</p>}
                      {u.skills?.length > 0 && (
                        <div className="flex gap-1 mt-1.5 flex-wrap">
                          {u.skills.slice(0, 3).map((s) => (
                            <span key={s} className="tag-chip text-xs py-0.5">{s}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs text-white/30">{u.followers?.length || 0} followers</p>
                    </div>
                  </motion.button>
                ))}
              </div>
            )
          )}

          {/* Posts */}
          {tab === 'posts' && (
            posts.length === 0 ? (
              <div className="bento-card p-12 text-center">
                <p className="text-white/40">No posts found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {posts.map((p) => <PostCard key={p.id} post={p} />)}
              </div>
            )
          )}

          {/* Projects */}
          {tab === 'projects' && (
            projects.length === 0 ? (
              <div className="bento-card p-12 text-center">
                <p className="text-white/40">No projects found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {projects.map((proj, i) => (
                  <motion.div
                    key={proj.id}
                    className="bento-card overflow-hidden"
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    {proj.previewUrl && (
                      <img src={proj.previewUrl} alt={proj.title} className="w-full h-32 object-cover" />
                    )}
                    <div className="p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <Avatar src={proj.ownerPhoto} alt={proj.ownerDisplayName} size={24} />
                        <span className="text-xs text-white/50">@{proj.ownerUsername}</span>
                      </div>
                      <h3 className="text-sm font-semibold text-white">{proj.title}</h3>
                      <p className="text-xs text-white/50 mt-1 line-clamp-2">{proj.description}</p>
                      {proj.tags?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {proj.tags.slice(0, 3).map((t) => <span key={t} className="tag-chip text-xs">{t}</span>)}
                        </div>
                      )}
                      <div className="flex gap-2 mt-3">
                        {proj.repoUrl && (
                          <a href={proj.repoUrl} target="_blank" rel="noopener noreferrer"
                            className="text-xs px-2.5 py-1 rounded-lg bg-white/10 text-white/70 hover:text-white transition-colors"
                            onClick={(e) => e.stopPropagation()}>
                            GitHub ↗
                          </a>
                        )}
                        <span className="text-xs text-white/30 ml-auto">⭐ {proj.stars?.length || 0}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )
          )}
        </>
      )}
    </div>
  );
};

export default Explore;
