import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { IoSearchOutline, IoNotificationsOutline, IoChatbubbleOutline, IoArrowBack } from 'react-icons/io5';
import { useAuth } from '../../contexts/AuthContext';
import Avatar from '../common/Avatar';

const pageTitles = {
  '/': 'Home',
  '/explore': 'Explore',
  '/projects': 'Projects',
  '/chat': 'Messages',
  '/notifications': 'Notifications',
  '/dashboard': 'Dashboard',
  '/profile': 'Profile',
};

const Header = () => {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [search, setSearch] = useState('');

  const title = pageTitles[location.pathname] || 'AETHER';
  const canGoBack = location.pathname !== '/';

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) {
      navigate(`/explore?q=${encodeURIComponent(search.trim())}`);
      setSearch('');
    }
  };

  return (
    <header className="sticky top-0 z-20 glass-dark border-b border-white/8 px-4 py-3 flex items-center gap-3">
      {/* Back button (mobile) or Page title */}
      <div className="flex items-center gap-2 flex-1 min-w-0 lg:hidden">
        {canGoBack ? (
          <button onClick={() => navigate(-1)} className="p-1.5 rounded-xl hover:bg-white/10 text-white/60 hover:text-white transition-colors">
            <IoArrowBack size={20} />
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg gradient-bg flex items-center justify-center text-white font-bold text-sm">A</div>
            <span className="font-bold gradient-text text-lg">AETHER</span>
          </div>
        )}
        <span className="font-semibold text-white text-base truncate">{canGoBack ? title : ''}</span>
      </div>

      {/* Desktop title */}
      <div className="hidden lg:block flex-1 min-w-0">
        <h1 className="text-lg font-semibold text-white">{title}</h1>
      </div>

      {/* Search bar */}
      <form onSubmit={handleSearch} className="hidden sm:flex items-center gap-2 flex-1 max-w-xs">
        <div className="relative w-full">
          <IoSearchOutline
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users, posts…"
            className="input-field pl-9 py-2 text-sm"
          />
        </div>
      </form>

      {/* Right actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => navigate('/notifications')}
          className="p-2 rounded-xl hover:bg-white/10 text-white/60 hover:text-white transition-colors relative"
        >
          <IoNotificationsOutline size={20} />
        </button>
        <button
          onClick={() => navigate('/chat')}
          className="p-2 rounded-xl hover:bg-white/10 text-white/60 hover:text-white transition-colors"
        >
          <IoChatbubbleOutline size={20} />
        </button>
        <button onClick={() => navigate('/profile')} className="ml-1">
          <Avatar src={userProfile?.photoURL} alt={userProfile?.displayName} size={32} />
        </button>
      </div>
    </header>
  );
};

export default Header;
