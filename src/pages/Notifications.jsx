import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  collection, query, where, orderBy, getDocs, onSnapshot,
  updateDoc, doc, writeBatch,
} from 'firebase/firestore';
import { IoNotificationsOutline, IoCheckmarkDoneOutline } from 'react-icons/io5';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import NotificationItem from '../components/notifications/NotificationItem';
import SkeletonLoader from '../components/common/SkeletonLoader';

const Notifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
    const unsub = onSnapshot(q, (snap) => {
      setNotifications(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, [user]);

  const markAllRead = async () => {
    const unread = notifications.filter((n) => !n.read);
    if (unread.length === 0) return;
    const batch = writeBatch(db);
    unread.forEach((n) => batch.update(doc(db, 'notifications', n.id), { read: true }));
    await batch.commit();
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleAction = async (action, notification) => {
    const { fromUid, id } = notification;
    try {
      if (action === 'accept') {
        await updateDoc(doc(db, 'users', user.uid), {
          followers: [...([] || []), fromUid],
        });
        await updateDoc(doc(db, 'users', fromUid), {
          following: [...([] || []), user.uid],
        });
      }
      await updateDoc(doc(db, 'notifications', id), { handled: true, read: true });
      setNotifications((prev) =>
        prev.map((n) => n.id === id ? { ...n, handled: true, read: true } : n)
      );
    } catch {}
  };

  const filtered = notifications.filter((n) => {
    if (filter === 'unread') return !n.read;
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-white">Notifications</h1>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 rounded-full gradient-bg text-white text-xs font-bold">
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors"
          >
            <IoCheckmarkDoneOutline size={18} />
            Mark all read
          </button>
        )}
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {['all', 'unread'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-xl text-sm font-medium transition-all capitalize ${
              filter === f ? 'gradient-bg text-white' : 'bg-white/5 text-white/50 hover:text-white hover:bg-white/10'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="bento-card divide-y divide-white/5 overflow-hidden">
          {[1, 2, 3, 4].map((i) => <SkeletonLoader key={i} type="user" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bento-card p-14 text-center">
          <IoNotificationsOutline size={48} className="text-white/20 mx-auto mb-3" />
          <p className="text-white font-semibold">No notifications</p>
          <p className="text-white/40 text-sm mt-1">You're all caught up!</p>
        </div>
      ) : (
        <div className="bento-card overflow-hidden divide-y divide-white/5">
          {filtered.map((notif, i) => (
            <motion.div
              key={notif.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <NotificationItem notification={notif} onAction={handleAction} />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Notifications;
