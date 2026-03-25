import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';

import MainLayout from './components/layout/MainLayout';
import Login from './pages/Login';
import Register from './pages/Register';
import Onboarding from './pages/Onboarding';
import Home from './pages/Home';
import Profile from './pages/Profile';
import Projects from './pages/Projects';
import Chat from './pages/Chat';
import Notifications from './pages/Notifications';
import Dashboard from './pages/Dashboard';
import AdminPanel from './pages/AdminPanel';
import Explore from './pages/Explore';
import Stories from './pages/Stories';

const ProtectedRoute = ({ children }) => {
  const { user, userProfile } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (!userProfile?.username) return <Navigate to="/onboarding" replace />;
  return children;
};

const AdminRoute = ({ children }) => {
  const { user, userProfile } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  const isAdmin = userProfile?.role === 'admin' || userProfile?.role === 'super_admin';
  if (!isAdmin) return <Navigate to="/" replace />;
  return children;
};

const PublicRoute = ({ children }) => {
  const { user, userProfile } = useAuth();
  if (user && userProfile?.username) return <Navigate to="/" replace />;
  return children;
};

const AppRoutes = () => (
  <Routes>
    <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
    <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
    <Route path="/onboarding" element={<Onboarding />} />

    <Route path="/" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
      <Route index element={<Home />} />
      <Route path="explore" element={<Explore />} />
      <Route path="stories" element={<Stories />} />
      <Route path="profile" element={<Profile />} />
      <Route path="profile/:username" element={<Profile />} />
      <Route path="projects" element={<Projects />} />
      <Route path="chat" element={<Chat />} />
      <Route path="chat/:chatId" element={<Chat />} />
      <Route path="notifications" element={<Notifications />} />
      <Route path="dashboard" element={<Dashboard />} />
    </Route>

    <Route path="/admin" element={<AdminRoute><AdminPanel /></AdminRoute>} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

function App() {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <AppRoutes />
          <ToastContainer
            position="bottom-center"
            autoClose={3000}
            hideProgressBar
            theme="dark"
            toastStyle={{
              background: '#12121A',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '14px',
              color: '#fff',
              fontSize: '14px',
            }}
          />
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;
