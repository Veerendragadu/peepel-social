import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';
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

// Initialize services
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Initialize persistence
if (typeof window !== 'undefined') {
  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn('Multiple tabs open, persistence can only be enabled in one tab at a time.');
    } else if (err.code === 'unimplemented') {
      console.warn('Browser doesn\'t support IndexedDB persistence');
    }
  });
}

export { app as default, auth, db, storage };