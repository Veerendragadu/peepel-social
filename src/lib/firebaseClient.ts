import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, initializeFirestore, persistentLocalCache, persistentSingleTabManager } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyCcWnS2BK53ggbIj3kU77aYH9lK7bF5Ftk",
  authDomain: "peepel-social-f4039.firebaseapp.com",
  projectId: "peepel-social-f4039",
  storageBucket: "peepel-social-f4039.firebasestorage.app",
  messagingSenderId: "92474380668",
  appId: "1:92474380668:web:319e203acee5b4e67a14f9",
  measurementId: "G-3BNC8KRESX"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize auth and storage
const auth = getAuth(app);
const storage = getStorage(app);

// Initialize Firestore with persistence
const db = initializeFirestore(app, {
  localCache: persistentLocalCache(
    // Use single tab persistence to avoid conflicts
    { tabManager: persistentSingleTabManager() }
  )
});

export { app as default, auth, db, storage };