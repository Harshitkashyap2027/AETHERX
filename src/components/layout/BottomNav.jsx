import { NavLink } from 'react-router-dom';
import {
  IoHomeOutline, IoHome,
  IoCompassOutline, IoCompass,
  IoFolderOpenOutline, IoFolderOpen,
  IoChatbubbleOutline, IoChatbubble,
  IoPersonOutline, IoPerson,
} from 'react-icons/io5';

const tabs = [
  { to: '/', Icon: IoHomeOutline, ActiveIcon: IoHome, label: 'Home', exact: true },
  { to: '/explore', Icon: IoCompassOutline, ActiveIcon: IoCompass, label: 'Explore' },
  { to: '/projects', Icon: IoFolderOpenOutline, ActiveIcon: IoFolderOpen, label: 'Projects' },
  { to: '/chat', Icon: IoChatbubbleOutline, ActiveIcon: IoChatbubble, label: 'Chat' },
  { to: '/profile', Icon: IoPersonOutline, ActiveIcon: IoPerson, label: 'Profile' },
];

const BottomNav = () => (
  <nav className="tab-bar fixed bottom-0 left-0 right-0 z-30 flex lg:hidden safe-area-bottom">
    {tabs.map(({ to, Icon, ActiveIcon, label, exact }) => (
      <NavLink
        key={to}
        to={to}
        end={exact}
        className="flex-1 flex flex-col items-center justify-center py-3 gap-0.5"
      >
        {({ isActive }) => (
          <>
            <span className={isActive ? 'text-primary' : 'text-white/50'}>
              {isActive ? <ActiveIcon size={22} /> : <Icon size={22} />}
            </span>
            <span className={`text-[10px] font-medium ${isActive ? 'text-primary' : 'text-white/40'}`}>
              {label}
            </span>
            {isActive && (
              <span className="absolute bottom-1.5 w-1 h-1 rounded-full bg-primary" />
            )}
          </>
        )}
      </NavLink>
    ))}
  </nav>
);

export default BottomNav;
