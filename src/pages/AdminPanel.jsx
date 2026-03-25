import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  collection, query, getDocs, updateDoc, deleteDoc, doc,
  orderBy, limit, addDoc, serverTimestamp, where,
} from 'firebase/firestore';
import {
  IoShieldOutline, IoPeopleOutline, IoDocumentTextOutline,
  IoFolderOpenOutline, IoFlagOutline, IoArrowBackOutline,
  IoTrashOutline, IoBanOutline, IoCheckmarkCircleOutline,
  IoStatsChartOutline, IoSettingsOutline,
} from 'react-icons/io5';
import { toast } from 'react-toastify';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import Avatar from '../components/common/Avatar';

const tabs = [
  { key: 'overview', label: 'Overview', icon: IoStatsChartOutline },
  { key: 'users', label: 'Users', icon: IoPeopleOutline },
  { key: 'posts', label: 'Posts', icon: IoDocumentTextOutline },
  { key: 'projects', label: 'Projects', icon: IoFolderOpenOutline },
  { key: 'reports', label: 'Reports', icon: IoFlagOutline },
];

const AdminPanel = () => {
  const { userProfile, logout } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('overview');
  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [projects, setProjects] = useState([]);
  const [reports, setReports] = useState([]);
  const [stats, setStats] = useState({ users: 0, posts: 0, projects: 0, reports: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [usnap, psnap, projsnap, rsnap] = await Promise.all([
        getDocs(query(collection(db, 'users'), orderBy('createdAt', 'desc'), limit(50))),
        getDocs(query(collection(db, 'posts'), orderBy('createdAt', 'desc'), limit(50))),
        getDocs(query(collection(db, 'projects'), orderBy('createdAt', 'desc'), limit(50))),
        getDocs(query(collection(db, 'reports'), orderBy('createdAt', 'desc'), limit(50))),
      ]);
      setUsers(usnap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setPosts(psnap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setProjects(projsnap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setReports(rsnap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setStats({ users: usnap.size, posts: psnap.size, projects: projsnap.size, reports: rsnap.size });
    } catch {}
    setLoading(false);
  };

  const banUser = async (userId, isBanned) => {
    try {
      await updateDoc(doc(db, 'users', userId), { isBanned: !isBanned });
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, isBanned: !isBanned } : u));
      await addDoc(collection(db, 'logs'), {
        action: isBanned ? 'UNBAN_USER' : 'BAN_USER',
        adminId: userProfile?.uid,
        targetUserId: userId,
        timestamp: serverTimestamp(),
      });
      toast.success(isBanned ? 'User unbanned' : 'User banned');
    } catch {
      toast.error('Action failed');
    }
  };

  const changeRole = async (userId, newRole) => {
    try {
      await updateDoc(doc(db, 'users', userId), { role: newRole });
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, role: newRole } : u));
      await addDoc(collection(db, 'logs'), {
        action: 'CHANGE_ROLE',
        adminId: userProfile?.uid,
        targetUserId: userId,
        newRole,
        timestamp: serverTimestamp(),
      });
      toast.success(`Role changed to ${newRole}`);
    } catch {
      toast.error('Failed to change role');
    }
  };

  const deletePost = async (postId) => {
    if (!window.confirm('Delete this post?')) return;
    try {
      await deleteDoc(doc(db, 'posts', postId));
      setPosts((prev) => prev.filter((p) => p.id !== postId));
      await addDoc(collection(db, 'logs'), {
        action: 'DELETE_POST',
        adminId: userProfile?.uid,
        postId,
        timestamp: serverTimestamp(),
      });
      toast.success('Post deleted');
    } catch {
      toast.error('Failed to delete post');
    }
  };

  const deleteProject = async (projId) => {
    if (!window.confirm('Delete this project?')) return;
    try {
      await deleteDoc(doc(db, 'projects', projId));
      setProjects((prev) => prev.filter((p) => p.id !== projId));
      toast.success('Project deleted');
    } catch {
      toast.error('Failed');
    }
  };

  const resolveReport = async (reportId) => {
    try {
      await updateDoc(doc(db, 'reports', reportId), { status: 'resolved' });
      setReports((prev) => prev.map((r) => r.id === reportId ? { ...r, status: 'resolved' } : r));
      toast.success('Report resolved');
    } catch {
      toast.error('Failed');
    }
  };

  const overviewCards = [
    { icon: IoPeopleOutline, label: 'Total Users', value: stats.users, color: 'bg-blue-500/20 text-blue-400' },
    { icon: IoDocumentTextOutline, label: 'Total Posts', value: stats.posts, color: 'bg-purple-500/20 text-purple-400' },
    { icon: IoFolderOpenOutline, label: 'Projects', value: stats.projects, color: 'bg-green-500/20 text-green-400' },
    { icon: IoFlagOutline, label: 'Reports', value: stats.reports, color: 'bg-red-500/20 text-red-400' },
  ];

  return (
    <div className="min-h-screen bg-dark text-white flex">
      {/* Background orbs */}
      <div className="orb orb-purple" style={{ width: 400, height: 400, top: -100, left: -100 }} />
      <div className="orb orb-pink" style={{ width: 300, height: 300, bottom: -80, right: -80 }} />

      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-screen w-60 glass-dark border-r border-white/8 z-30 hidden md:flex flex-col">
        {/* Logo */}
        <div className="p-5 border-b border-white/8">
          <div className="flex items-center gap-2 mb-1">
            <IoShieldOutline size={20} className="text-amber-400" />
            <span className="font-bold gradient-text">Admin Panel</span>
          </div>
          <p className="text-xs text-white/30">AETHER Control Tower</p>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {tabs.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                tab === key
                  ? 'gradient-bg text-white shadow-md'
                  : 'text-white/60 hover:text-white hover:bg-white/8'
              }`}
            >
              <Icon size={18} />{label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-white/8 space-y-2">
          <button
            onClick={() => navigate('/')}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-white/50 hover:text-white hover:bg-white/8 transition-all"
          >
            <IoArrowBackOutline size={16} /> Back to App
          </button>
          <div className="flex items-center gap-2 px-3 py-2">
            <Avatar src={userProfile?.photoURL} alt={userProfile?.displayName} size={28} />
            <div className="min-w-0">
              <p className="text-xs font-medium text-white truncate">{userProfile?.displayName}</p>
              <p className="text-xs text-amber-400">{userProfile?.role}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 md:ml-60 p-6 relative z-10">
        {/* Mobile tab bar */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-5 md:hidden">
          {tabs.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium flex-shrink-0 transition-all ${
                tab === key ? 'gradient-bg text-white' : 'bg-white/10 text-white/60'
              }`}
            >
              <Icon size={14} />{label}
            </button>
          ))}
        </div>

        {/* OVERVIEW */}
        {tab === 'overview' && (
          <div className="space-y-5">
            <h1 className="text-xl font-bold text-white">Mission Control 🚀</h1>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {overviewCards.map((card, i) => (
                <motion.div
                  key={i}
                  className="bento-card p-5"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${card.color.split(' ')[0]}`}>
                    <card.icon size={20} className={card.color.split(' ')[1]} />
                  </div>
                  <p className="text-3xl font-bold text-white">{card.value}</p>
                  <p className="text-sm text-white/50 mt-0.5">{card.label}</p>
                </motion.div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Recent users */}
              <div className="bento-card p-5">
                <h2 className="text-base font-semibold text-white mb-3">Recent Users</h2>
                <div className="space-y-2">
                  {users.slice(0, 5).map((u) => (
                    <div key={u.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5">
                      <Avatar src={u.photoURL} alt={u.displayName} size={34} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white truncate">{u.displayName}</p>
                        <p className="text-xs text-white/40">@{u.username}</p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        u.role === 'admin' ? 'bg-amber-500/15 text-amber-400' :
                        u.role === 'super_admin' ? 'bg-red-500/15 text-red-400' :
                        'bg-white/10 text-white/50'
                      }`}>{u.role || 'user'}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent posts */}
              <div className="bento-card p-5">
                <h2 className="text-base font-semibold text-white mb-3">Recent Posts</h2>
                <div className="space-y-2">
                  {posts.slice(0, 5).map((p) => (
                    <div key={p.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5">
                      {p.mediaUrl && (
                        <img src={p.mediaUrl} alt="" className="w-9 h-9 rounded-lg object-cover flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white truncate">{p.caption || 'No caption'}</p>
                        <p className="text-xs text-white/40">❤️ {p.likes?.length || 0} · @{p.userUsername}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* USERS */}
        {tab === 'users' && (
          <div className="space-y-4">
            <h1 className="text-xl font-bold text-white">User Management</h1>
            <div className="bento-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/8 text-white/40 text-xs">
                      <th className="text-left px-4 py-3 font-medium">User</th>
                      <th className="text-left px-4 py-3 font-medium">Role</th>
                      <th className="text-left px-4 py-3 font-medium">Status</th>
                      <th className="text-right px-4 py-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <Avatar src={u.photoURL} alt={u.displayName} size={34} />
                            <div>
                              <p className="text-white font-medium">{u.displayName}</p>
                              <p className="text-white/40 text-xs">@{u.username}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <select
                            value={u.role || 'user'}
                            onChange={(e) => changeRole(u.id, e.target.value)}
                            className="bg-transparent border border-white/10 rounded-lg px-2 py-1 text-xs text-white cursor-pointer"
                          >
                            <option value="user">User</option>
                            <option value="moderator">Moderator</option>
                            <option value="admin">Admin</option>
                            <option value="super_admin">Super Admin</option>
                          </select>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs ${u.isBanned ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                            {u.isBanned ? 'Banned' : 'Active'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => banUser(u.id, u.isBanned)}
                            className={`p-1.5 rounded-lg text-xs transition-colors ${u.isBanned ? 'text-green-400 hover:bg-green-400/10' : 'text-red-400 hover:bg-red-400/10'}`}
                            title={u.isBanned ? 'Unban' : 'Ban'}
                          >
                            <IoBanOutline size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* POSTS */}
        {tab === 'posts' && (
          <div className="space-y-4">
            <h1 className="text-xl font-bold text-white">Content Moderation – Posts</h1>
            <div className="bento-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/8 text-white/40 text-xs">
                      <th className="text-left px-4 py-3 font-medium">Post</th>
                      <th className="text-left px-4 py-3 font-medium">Author</th>
                      <th className="text-left px-4 py-3 font-medium">Likes</th>
                      <th className="text-right px-4 py-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {posts.map((p) => (
                      <tr key={p.id} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {p.mediaUrl && <img src={p.mediaUrl} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />}
                            <p className="text-white text-xs max-w-[200px] truncate">{p.caption || '—'}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-white/60 text-xs">@{p.userUsername}</td>
                        <td className="px-4 py-3 text-white/60 text-xs">{p.likes?.length || 0}</td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => deletePost(p.id)}
                            className="p-1.5 rounded-lg text-red-400 hover:bg-red-400/10 transition-colors"
                          >
                            <IoTrashOutline size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* PROJECTS */}
        {tab === 'projects' && (
          <div className="space-y-4">
            <h1 className="text-xl font-bold text-white">Projects Management</h1>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((proj) => (
                <div key={proj.id} className="bento-card overflow-hidden">
                  {proj.previewUrl && <img src={proj.previewUrl} alt="" className="w-full h-28 object-cover" />}
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="text-sm font-semibold text-white">{proj.title}</h3>
                        <p className="text-xs text-white/40">@{proj.ownerUsername}</p>
                      </div>
                      <button
                        onClick={() => deleteProject(proj.id)}
                        className="p-1.5 rounded-lg text-red-400 hover:bg-red-400/10 transition-colors flex-shrink-0"
                      >
                        <IoTrashOutline size={15} />
                      </button>
                    </div>
                    <span className={`mt-2 inline-block text-xs px-2 py-0.5 rounded-full ${proj.isPublic ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'}`}>
                      {proj.isPublic ? 'Public' : 'Private'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* REPORTS */}
        {tab === 'reports' && (
          <div className="space-y-4">
            <h1 className="text-xl font-bold text-white">Reports</h1>
            {reports.length === 0 ? (
              <div className="bento-card p-12 text-center">
                <IoFlagOutline size={40} className="text-white/20 mx-auto mb-3" />
                <p className="text-white/40">No reports</p>
              </div>
            ) : (
              <div className="bento-card divide-y divide-white/5 overflow-hidden">
                {reports.map((r) => (
                  <div key={r.id} className="flex items-center justify-between px-4 py-3.5">
                    <div>
                      <p className="text-sm text-white">{r.reason || 'No reason given'}</p>
                      <p className="text-xs text-white/40 mt-0.5">
                        Type: {r.type} · Status:{' '}
                        <span className={r.status === 'resolved' ? 'text-green-400' : 'text-amber-400'}>
                          {r.status || 'pending'}
                        </span>
                      </p>
                    </div>
                    {r.status !== 'resolved' && (
                      <button
                        onClick={() => resolveReport(r.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-green-400 hover:bg-green-400/10 transition-colors"
                      >
                        <IoCheckmarkCircleOutline size={15} /> Resolve
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
