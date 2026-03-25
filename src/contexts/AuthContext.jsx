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

  const googleLogin = async () => {
    const result = await signInWithPopup(auth, new GoogleAuthProvider());
    const firebaseUser = result.user;
    const userSnap = await getDoc(doc(db, 'users', firebaseUser.uid));
    if (!userSnap.exists()) {
      const MIN_USERNAME_LENGTH = 3;
      const MAX_USERNAME_ATTEMPTS = 10;

      // Derive a base username from the Google email prefix, keeping only valid characters
      let base = (firebaseUser.email?.split('@')[0] || 'user')
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, '');
      if (base.length < MIN_USERNAME_LENGTH) base = (base + 'user').slice(0, 15);

      // Find a unique username by appending a counter if necessary
      let username = base;
      let counter = 1;
      while (
        counter <= MAX_USERNAME_ATTEMPTS &&
        (await getDoc(doc(db, 'usernames', username))).exists()
      ) {
        username = `${base}${counter}`;
        counter += 1;
      }

      const data = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        username,
        displayName: firebaseUser.displayName || username,
        bio: '',
        photoURL: firebaseUser.photoURL || '',
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
        onboardingDone: false,
        createdAt: serverTimestamp(),
      };

      await setDoc(doc(db, 'users', firebaseUser.uid), data);
      await setDoc(doc(db, 'usernames', username), { uid: firebaseUser.uid });
      setUserProfile(data);
    }
    return result;
  };

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
