import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import {
  IoTrendingUpOutline, IoHeartOutline, IoPeopleOutline,
  IoEyeOutline, IoFolderOpenOutline, IoDocumentTextOutline,
} from 'react-icons/io5';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';

const StatCard = ({ icon: Icon, label, value, color, subtext }) => (
  <motion.div
    className="bento-card p-5"
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    whileHover={{ y: -3 }}
  >
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${color}`}>
      <Icon size={20} className="text-white" />
    </div>
    <p className="text-3xl font-bold text-white mb-1">{value}</p>
    <p className="text-sm text-white/60">{label}</p>
    {subtext && <p className="text-xs text-white/35 mt-1">{subtext}</p>}
  </motion.div>
);

const Dashboard = () => {
  const { user, userProfile } = useAuth();
  const [stats, setStats] = useState({
    posts: 0,
    projects: 0,
    totalLikes: 0,
    followers: 0,
    following: 0,
    profileViews: 0,
    recentPosts: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, [user]);

  const fetchStats = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Fetch posts
      const postsQ = query(
        collection(db, 'posts'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc'),
        limit(5)
      );
      const postsSnap = await getDocs(postsQ);
      const posts = postsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      const totalLikes = posts.reduce((sum, p) => sum + (p.likes?.length || 0), 0);

      // Fetch projects
      const projQ = query(collection(db, 'projects'), where('ownerId', '==', user.uid));
      const projSnap = await getDocs(projQ);

      setStats({
        posts: posts.length,
        projects: projSnap.size,
        totalLikes,
        followers: userProfile?.followers?.length || 0,
        following: userProfile?.following?.length || 0,
        profileViews: userProfile?.profileViews || 0,
        recentPosts: posts,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { icon: IoDocumentTextOutline, label: 'Total Posts', value: stats.posts, color: 'bg-blue-500/20', subtext: 'All time' },
    { icon: IoFolderOpenOutline, label: 'Projects', value: stats.projects, color: 'bg-purple-500/20', subtext: 'Published' },
    { icon: IoHeartOutline, label: 'Total Likes', value: stats.totalLikes, color: 'bg-red-500/20', subtext: 'Across all posts' },
    { icon: IoPeopleOutline, label: 'Followers', value: stats.followers, color: 'bg-green-500/20', subtext: `Following ${stats.following}` },
    { icon: IoEyeOutline, label: 'Profile Views', value: stats.profileViews, color: 'bg-amber-500/20', subtext: 'All time' },
    { icon: IoTrendingUpOutline, label: 'Engagement', value: `${stats.posts > 0 ? Math.round((stats.totalLikes / stats.posts) * 10) / 10 : 0}`, color: 'bg-primary/20', subtext: 'Avg likes/post' },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white">Dashboard</h1>
        <p className="text-white/50 text-sm mt-0.5">Welcome back, {userProfile?.displayName?.split(' ')[0]}!</p>
      </div>

      {/* Bento stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((card, i) => (
          <StatCard key={i} {...card} />
        ))}
      </div>

      {/* Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent posts */}
        <div className="bento-card p-5">
          <h2 className="text-base font-semibold text-white mb-4">Recent Posts</h2>
          {stats.recentPosts.length === 0 ? (
            <p className="text-white/40 text-sm">No posts yet</p>
          ) : (
            <div className="space-y-3">
              {stats.recentPosts.map((post) => (
                <div key={post.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
                  {post.mediaUrl && (
                    <img src={post.mediaUrl} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{post.caption || 'No caption'}</p>
                    <p className="text-xs text-white/40 mt-0.5">❤️ {post.likes?.length || 0} likes</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Profile overview */}
        <div className="bento-card p-5 space-y-4">
          <h2 className="text-base font-semibold text-white">Profile Overview</h2>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/60">Account type</span>
              <span className={`text-sm font-medium px-2.5 py-0.5 rounded-full ${
                userProfile?.role === 'admin' ? 'bg-amber-500/15 text-amber-400' : 'bg-primary/15 text-primary'
              }`}>
                {userProfile?.role || 'User'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/60">Visibility</span>
              <span className="text-sm font-medium text-white">{userProfile?.isPrivate ? '🔒 Private' : '🌍 Public'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/60">Verified</span>
              <span className="text-sm font-medium text-white">{userProfile?.isVerified ? '✅ Yes' : '—'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/60">Skills</span>
              <span className="text-sm font-medium text-white">{userProfile?.skills?.length || 0} added</span>
            </div>
          </div>

          {/* Skills bar */}
          {userProfile?.skills?.length > 0 && (
            <div>
              <p className="text-xs text-white/40 mb-2">Top skills</p>
              <div className="flex flex-wrap gap-1.5">
                {userProfile.skills.slice(0, 6).map((s) => (
                  <span key={s} className="tag-chip text-xs">{s}</span>
                ))}
                {userProfile.skills.length > 6 && (
                  <span className="tag-chip text-xs">+{userProfile.skills.length - 6}</span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Growth graph placeholder */}
      <div className="bento-card p-5">
        <h2 className="text-base font-semibold text-white mb-4">Activity (Last 7 days)</h2>
        <div className="flex items-end gap-2 h-32">
          {[30, 55, 40, 70, 50, 85, 60].map((h, i) => (
            <motion.div
              key={i}
              className="flex-1 gradient-bg rounded-t-md opacity-70 hover:opacity-100 transition-opacity"
              style={{ height: `${h}%` }}
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ delay: i * 0.05, duration: 0.4 }}
            />
          ))}
        </div>
        <div className="flex justify-between mt-2">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
            <span key={d} className="text-xs text-white/30 flex-1 text-center">{d}</span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
