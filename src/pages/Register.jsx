import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FcGoogle } from 'react-icons/fc';
import {
  IoPersonOutline, IoMailOutline, IoLockClosedOutline,
  IoAtOutline, IoEyeOutline, IoEyeOffOutline, IoCheckmarkCircle, IoCloseCircle,
} from 'react-icons/io5';
import { toast } from 'react-toastify';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';

const Register = () => {
  const { register, googleLogin } = useAuth();
  const [form, setForm] = useState({ displayName: '', username: '', email: '', password: '', confirm: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState(null); // 'checking' | 'available' | 'taken'
  const [usernameTimer, setUsernameTimer] = useState(null);

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    if (key === 'username') {
      clearTimeout(usernameTimer);
      setUsernameStatus('checking');
      const val = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '');
      setForm((f) => ({ ...f, username: val }));
      if (val.length >= 3) {
        const t = setTimeout(() => checkUsername(val), 600);
        setUsernameTimer(t);
      } else {
        setUsernameStatus(null);
      }
    }
  };

  const checkUsername = async (uname) => {
    try {
      const snap = await getDoc(doc(db, 'usernames', uname));
      setUsernameStatus(snap.exists() ? 'taken' : 'available');
    } catch {
      setUsernameStatus(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { displayName, username, email, password, confirm } = form;
    if (!displayName || !username || !email || !password) return toast.error('All fields are required');
    if (username.length < 3) return toast.error('Username must be at least 3 characters');
    if (usernameStatus === 'taken') return toast.error('Username is already taken');
    if (password !== confirm) return toast.error('Passwords do not match');
    if (password.length < 6) return toast.error('Password must be at least 6 characters');
    setLoading(true);
    try {
      await register(email, password, username.toLowerCase(), displayName);
    } catch (err) {
      toast.error(err.message?.replace('Firebase: ', '') || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    try {
      await googleLogin();
    } catch {
      toast.error('Google sign-in failed');
    }
  };

  const UsernameIcon = () => {
    if (usernameStatus === 'checking') return <div className="w-4 h-4 border-2 border-white/30 border-t-white/80 rounded-full animate-spin" />;
    if (usernameStatus === 'available') return <IoCheckmarkCircle size={18} className="text-green-400" />;
    if (usernameStatus === 'taken') return <IoCloseCircle size={18} className="text-red-400" />;
    return null;
  };

  return (
    <div className="min-h-screen bg-dark flex items-center justify-center p-4 relative overflow-hidden">
      <div className="orb orb-purple" style={{ width: 400, height: 400, top: -100, left: -100 }} />
      <div className="orb orb-pink" style={{ width: 350, height: 350, bottom: -80, right: -80 }} />

      <motion.div
        className="relative z-10 w-full max-w-md"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl gradient-bg mb-3 shadow-xl shadow-primary/30">
            <span className="text-white text-2xl font-bold">A</span>
          </div>
          <h1 className="text-2xl font-bold gradient-text">Join AETHER</h1>
          <p className="text-white/50 text-sm mt-1">Build. Connect. Grow.</p>
        </div>

        <div className="bento-card p-7">
          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Display Name */}
            <div className="relative">
              <IoPersonOutline size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
              <input
                type="text"
                placeholder="Full Name"
                value={form.displayName}
                onChange={set('displayName')}
                className="input-field pl-9"
              />
            </div>

            {/* Username */}
            <div className="relative">
              <IoAtOutline size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
              <input
                type="text"
                placeholder="username"
                value={form.username}
                onChange={set('username')}
                className="input-field pl-9 pr-10"
                autoComplete="username"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2">
                <UsernameIcon />
              </span>
            </div>

            {/* Email */}
            <div className="relative">
              <IoMailOutline size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
              <input
                type="email"
                placeholder="Email address"
                value={form.email}
                onChange={set('email')}
                className="input-field pl-9"
              />
            </div>

            {/* Password */}
            <div className="relative">
              <IoLockClosedOutline size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
              <input
                type={showPass ? 'text' : 'password'}
                placeholder="Password (min 6 chars)"
                value={form.password}
                onChange={set('password')}
                className="input-field pl-9 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
              >
                {showPass ? <IoEyeOffOutline size={17} /> : <IoEyeOutline size={17} />}
              </button>
            </div>

            {/* Confirm Password */}
            <div className="relative">
              <IoLockClosedOutline size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
              <input
                type="password"
                placeholder="Confirm password"
                value={form.confirm}
                onChange={set('confirm')}
                className="input-field pl-9"
              />
            </div>

            <button type="submit" disabled={loading} className="btn-primary mt-1">
              {loading ? 'Creating account…' : 'Create Account'}
            </button>
          </form>

          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-white/30 text-xs">or</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          <button onClick={handleGoogle} className="btn-secondary flex items-center justify-center gap-3">
            <FcGoogle size={20} />
            <span>Continue with Google</span>
          </button>

          <p className="text-center text-sm text-white/40 mt-5">
            Already have an account?{' '}
            <Link to="/login" className="text-primary hover:text-primary/80 font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Register;
