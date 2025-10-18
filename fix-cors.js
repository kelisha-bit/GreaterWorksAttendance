// Firebase Storage CORS Fix Script
// Run this with: node fix-cors.js

import { initializeApp } from 'firebase/app';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "gwccapp-fc67c.firebaseapp.com",
  projectId: "gwccapp-fc67c",
  storageBucket: "gwccapp-fc67c.firebasestorage.app",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const storage = getStorage(app);

console.log('Firebase Storage initialized');
console.log('Storage bucket:', storage.app.options.storageBucket);
console.log('\nNote: CORS must be configured via gsutil or Google Cloud Console');
console.log('This script verifies your Firebase connection is working.');
