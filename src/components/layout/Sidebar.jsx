import { NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  IoHomeOutline, IoHome,
  IoCompassOutline, IoCompass,
  IoFolderOpenOutline, IoFolderOpen,
  IoChatbubbleOutline, IoChatbubble,
  IoNotificationsOutline, IoNotifications,
  IoGridOutline, IoGrid,
  IoPersonOutline, IoPerson,
  IoLogOutOutline,
  IoShieldOutline,
} from 'react-icons/io5';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import Avatar from '../common/Avatar';

const navItems = [
  { to: '/', label: 'Home', Icon: IoHomeOutline, ActiveIcon: IoHome, exact: true },
  { to: '/explore', label: 'Explore', Icon: IoCompassOutline, ActiveIcon: IoCompass },
  { to: '/projects', label: 'Projects', Icon: IoFolderOpenOutline, ActiveIcon: IoFolderOpen },
  { to: '/chat', label: 'Chat', Icon: IoChatbubbleOutline, ActiveIcon: IoChatbubble },
  { to: '/notifications', label: 'Alerts', Icon: IoNotificationsOutline, ActiveIcon: IoNotifications },
  { to: '/dashboard', label: 'Dashboard', Icon: IoGridOutline, ActiveIcon: IoGrid },
];

const Sidebar = () => {
  const { user, userProfile, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 glass-dark border-r border-white/8 z-30 hidden lg:flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-white/8">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl gradient-bg flex items-center justify-center text-white font-bold text-lg">
            A
          </div>
          <span className="text-xl font-bold gradient-text">AETHER</span>
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map(({ to, label, Icon, ActiveIcon, exact }) => (
          <NavLink
            key={to}
            to={to}
            end={exact}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-primary/15 text-primary border-l-2 border-primary'
                  : 'text-white/60 hover:text-white hover:bg-white/8'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive ? <ActiveIcon size={20} /> : <Icon size={20} />}
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}

        {/* Profile */}
        <NavLink
          to={`/profile`}
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
              isActive
                ? 'bg-primary/15 text-primary border-l-2 border-primary'
                : 'text-white/60 hover:text-white hover:bg-white/8'
            }`
          }
        >
          {({ isActive }) => (
            <>
              {isActive ? <IoPerson size={20} /> : <IoPersonOutline size={20} />}
              <span>Profile</span>
            </>
          )}
        </NavLink>

        {/* Admin link */}
        {(userProfile?.role === 'admin' || userProfile?.role === 'super_admin') && (
          <a
            href="/admin"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-amber-400/80 hover:text-amber-400 hover:bg-amber-400/10 transition-all duration-200"
          >
            <IoShieldOutline size={20} />
            <span>Admin Panel</span>
          </a>
        )}
      </nav>

      {/* Bottom section */}
      <div className="p-4 border-t border-white/8 space-y-2">
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-white/60 hover:text-white hover:bg-white/8 transition-all"
        >
          <span>{isDark ? '☀️' : '🌙'}</span>
          <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>
        </button>

        {/* User profile */}
        <div
          className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/8 cursor-pointer transition-all"
          onClick={() => navigate('/profile')}
        >
          <Avatar src={userProfile?.photoURL} alt={userProfile?.displayName} size={36} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{userProfile?.displayName || 'User'}</p>
            <p className="text-xs text-white/40 truncate">@{userProfile?.username}</p>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-red-400/80 hover:text-red-400 hover:bg-red-400/10 transition-all"
        >
          <IoLogOutOutline size={18} />
          <span>Log Out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
