import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from './firebase';
import { UserData } from '../types';

interface AuthContextType {
  user: User | null;
  userData: UserData | null;
  isAdmin: boolean;
  loading: boolean;
  error: string | null;
  loginWithGoogle: () => Promise<void>;
  loginAsDemo: () => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        console.log("%c[AUTH] Authenticated User UID:", "color: #2563eb; font-weight: bold; font-size: 14px;", user.uid);
        
        const isHardcodedAdmin = user.email === 'louise.catala24@gmail.com';
        let adminStatus = isHardcodedAdmin;

        // Fetch User Profile
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data() as UserData;
            setUserData({ ...data, uid: user.uid });
            console.log("[AUTH] Successfully fetched user document from /users path:", data);
            if ((data as any).isAdmin === true) {
              adminStatus = true;
            }
          } else {
            console.warn("[AUTH] Profile document does not exist in /users matching UID:", user.uid);
            setUserData({
              uid: user.uid,
              email: user.email || '',
              mobile: '',
              category: 'Others',
              fullName: user.displayName || 'Support Officer'
            });
          }
        } catch (err) {
          console.warn("[AUTH] Profile fetch from /users collection restricted or pending:", err);
          setUserData({
            uid: user.uid,
            email: user.email || '',
            mobile: '',
            category: 'Others',
            fullName: user.displayName || 'Support Officer'
          });
        }

        // Fetch Admin Verification Doc
        try {
          const adminDoc = await getDoc(doc(db, 'admins', user.uid));
          if (adminDoc.exists()) {
            adminStatus = true;
          }
        } catch (err) {
          console.warn("[AUTH] Admin status check from /admins failed:", err);
        }

        setIsAdmin(adminStatus);
      } else {
        setUserData(null);
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    setError(null);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      console.error("Login failed:", err);
      if (err.code === 'auth/unauthorized-domain') {
        const currentDomain = window.location.hostname;
        setError(`Unauthorized Domain: ${currentDomain}. Please add this domain to your Firebase Console > Authentication > Settings > Authorized Domains.`);
        console.error(`[AUTH_ERROR] Unauthorized domain: ${currentDomain}. Add this to your Firebase whitelist.`);
      } else if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-by-user' || err.code === 'auth/cancelled-popup-request' || (err.message && err.message.includes('cancelled-popup-request'))) {
        // User closed or cancelled the popup, do not set/show error message
        console.log("[AUTH] Sign-in popup closed or request cancelled by user.");
      } else if (err.code === 'auth/popup-blocked') {
        setError("Sign-in popup was blocked. Please enable popups or open the app in a new tab.");
      } else {
        setError(err.message || "An unexpected error occurred during sign-in.");
      }
    }
  };

  const loginAsDemo = () => {
    setError(null);
    const mockUser = {
      uid: 'demo_admin',
      email: 'louise.catala24@gmail.com',
      displayName: 'Support Admin',
      photoURL: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=128&h=128&fit=crop'
    };
    setUser(mockUser as any);
    setUserData({
      uid: 'demo_admin',
      email: 'louise.catala24@gmail.com',
      mobile: '09170001122',
      category: 'Others',
      fullName: 'Support Admin'
    });
    setIsAdmin(true);
    setLoading(false);
  };

  const logout = async () => {
    try {
      setUser(null);
      setUserData(null);
      setIsAdmin(false);
      await signOut(auth);
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  return (
    <AuthContext.Provider value={{ user, userData, isAdmin, loading, error, loginWithGoogle, loginAsDemo, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
