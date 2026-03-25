import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import Header from './Header';

const MainLayout = () => {
  return (
    <div className="min-h-screen bg-dark text-white flex">
      {/* Background orbs */}
      <div className="orb orb-purple" style={{ width: 500, height: 500, top: -100, left: -100 }} />
      <div className="orb orb-pink" style={{ width: 400, height: 400, bottom: -100, right: -100 }} />

      {/* Sidebar (desktop) */}
      <Sidebar />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen lg:ml-64">
        <Header />
        <main className="flex-1 overflow-y-auto pb-20 lg:pb-0 relative z-10">
          <Outlet />
        </main>
      </div>

      {/* Bottom nav (mobile) */}
      <BottomNav />
    </div>
  );
};

export default MainLayout;
