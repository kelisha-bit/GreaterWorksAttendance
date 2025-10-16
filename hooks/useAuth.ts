import { useState, useEffect } from 'react';
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import { firebaseConfig } from '../firebaseConfig';
import { User, UserRole } from '../types';

// Initialize Firebase if it hasn't been already
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const firestore = firebase.firestore();
const googleProvider = new firebase.auth.GoogleAuthProvider();

// Mock user roles for demonstration. In a real app, this data would be in your Firestore 'users' collection.
const MOCK_USER_ROLES: { [email: string]: UserRole } = {
    'admin@gwcc.com': UserRole.Admin,
    'leader@gwcc.com': UserRole.Leader,
    'viewer@gwcc.com': UserRole.Viewer,
};


async function getUserRole(uid: string, email: string | null): Promise<UserRole> {
    // In a real application, we would fetch from Firestore.
    // For now, we simulate this with mock data.
    if (email && MOCK_USER_ROLES[email]) {
        return MOCK_USER_ROLES[email];
    }
    
    // Firestore implementation would look like this:
    /*
    try {
        const userDoc = await firestore.collection('users').doc(uid).get();
        if (userDoc.exists) {
            return userDoc.data()?.role || UserRole.Viewer;
        } else {
            // Optional: create a new user document with a default role
            await firestore.collection('users').doc(uid).set({ email, role: UserRole.Viewer });
            return UserRole.Viewer;
        }
    } catch (error) {
        console.error("Error fetching user role:", error);
        return UserRole.Viewer; // Default to least privileged role on error
    }
    */
   
   // Default role if not in mock data
   return UserRole.Viewer;
}


export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        const role = await getUserRole(firebaseUser.uid, firebaseUser.email);
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          role: role,
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithEmail = async (email: string, password: string) => {
    setError(null);
    try {
      await auth.signInWithEmailAndPassword(email, password);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const signInWithGoogle = async () => {
    setError(null);
    try {
      await auth.signInWithPopup(googleProvider);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const signOut = async () => {
    try {
      await auth.signOut();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return { user, loading, error, signInWithEmail, signInWithGoogle, signOut };
}
