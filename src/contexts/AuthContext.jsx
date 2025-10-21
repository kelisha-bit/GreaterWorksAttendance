import { createContext, useContext, useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  createUserWithEmailAndPassword 
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  const login = async (email, password) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential;
  };

  const logout = async () => {
    await signOut(auth);
    setUserRole(null);
    setUserData(null);
  };

  const register = async (email, password, userInfo) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Create user document in Firestore
    await setDoc(doc(db, 'users', user.uid), {
      email: email,
      role: userInfo.role || 'viewer',
      name: userInfo.name || '',
      createdAt: new Date().toISOString()
    });
    
    return userCredential;
  };

  const refreshUserRole = async () => {
    if (!currentUser) return;
    
    try {
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        setUserRole(data.role);
        setUserData(data);
      }
    } catch (error) {
      console.error('Error refreshing user role:', error);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user) {
        // Check if token is expired
        const tokenExpirationTime = user.stsTokenManager?.expirationTime;
        const isTokenExpired = tokenExpirationTime && Date.now() >= tokenExpirationTime;
        
        if (isTokenExpired) {
          // Force token refresh
          try {
            await user.getIdToken(true);
            console.log('Auth token refreshed successfully');
          } catch (refreshError) {
            console.error('Error refreshing token:', refreshError);
            // Force logout if token refresh fails
            await signOut(auth);
            setUserRole(null);
            setUserData(null);
            setLoading(false);
            return;
          }
        }
        
        // Fetch user role from Firestore
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            setUserRole(data.role);
            setUserData(data);
          } else {
            // Create user document if it doesn't exist
            await setDoc(doc(db, 'users', user.uid), {
              email: user.email,
              role: 'viewer',
              name: user.displayName || '',
              createdAt: new Date().toISOString()
            });
            setUserRole('viewer'); // Default role
            setUserData({
              email: user.email,
              role: 'viewer',
              name: user.displayName || '',
              createdAt: new Date().toISOString()
            });
          }
        } catch (error) {
          console.error('Error fetching user role:', error);
          setUserRole('viewer');
          setUserData(null);
        }
      } else {
        setUserRole(null);
        setUserData(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userRole,
    userData,
    login,
    logout,
    register,
    refreshUserRole,
    isAdmin: userRole === 'admin',
    isLeader: userRole === 'leader' || userRole === 'admin',
    isViewer: userRole === 'viewer'
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
