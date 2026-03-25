import { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase/config';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        try {
          const snap = await getDoc(doc(db, 'users', firebaseUser.uid));
          setUserProfile(snap.exists() ? snap.data() : null);
        } catch {
          setUserProfile(null);
        }
      } else {
        setUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const login = (email, password) =>
    signInWithEmailAndPassword(auth, email, password);

  const register = async (email, password, username, displayName) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName });
    const data = {
      uid: cred.user.uid,
      email,
      username,
      displayName,
      bio: '',
      photoURL: '',
      coverURL: '',
      skills: [],
      techStack: [],
      interests: [],
      followers: [],
      following: [],
      followRequests: [],
      isPrivate: false,
      isVerified: false,
      role: 'user',
      postCount: 0,
      projectCount: 0,
      createdAt: serverTimestamp(),
    };
    await setDoc(doc(db, 'users', cred.user.uid), data);
    await setDoc(doc(db, 'usernames', username), { uid: cred.user.uid });
    setUserProfile(data);
    return cred;
  };

  const googleLogin = () => signInWithPopup(auth, new GoogleAuthProvider());

  const logout = () => signOut(auth);

  const refreshProfile = async () => {
    if (!user) return;
    const snap = await getDoc(doc(db, 'users', user.uid));
    if (snap.exists()) setUserProfile(snap.data());
  };

  return (
    <AuthContext.Provider
      value={{ user, userProfile, loading, login, register, googleLogin, logout, refreshProfile }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};
