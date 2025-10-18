import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// TODO: Replace with your Firebase project configuration
// Get these values from Firebase Console > Project Settings > General > Your apps
const firebaseConfig = {
  apiKey: "AIzaSyBE_EskZ0E3r1XfnMumLBS207fHSawazVI",
  authDomain: "gwccapp-fc67c.firebaseapp.com",
  projectId: "gwccapp-fc67c",
  storageBucket: "gwccapp-fc67c.firebasestorage.app",
  messagingSenderId: "766291132023",
  appId: "1:766291132023:web:02f541656cc36967f11072"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
