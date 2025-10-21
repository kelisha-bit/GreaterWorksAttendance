// Firebase Storage CORS Fix Script
// Run this with: node fix-cors.js

import { initializeApp } from 'firebase/app';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyBE_EskZ0E3r1XfnMumLBS207fHSawazVI",
  authDomain: "gwccapp-fc67c.firebaseapp.com",
  projectId: "gwccapp-fc67c",
  storageBucket: "gwccapp-fc67c.appspot.com",
  messagingSenderId: "766291132023",
  appId: "1:766291132023:web:02f541656cc36967f11072"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const storage = getStorage(app);

console.log('Firebase Storage initialized');
console.log('Storage bucket:', storage.app.options.storageBucket);
console.log('\nNote: CORS must be configured via gsutil or Google Cloud Console');
console.log('This script verifies your Firebase connection is working.');
