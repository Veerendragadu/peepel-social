import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyCcWnS2BK53ggbIj3kU77aYH9lK7bF5Ftk",
  authDomain: "peepel-social-f4039.firebaseapp.com",
  projectId: "peepel-social-f4039",
  storageBucket: "peepel-social-f4039.appspot.com",
  messagingSenderId: "92474380668",
  appId: "1:92474380668:web:319e203acee5b4e67a14f9",
  measurementId: "G-3BNC8KRESX"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Get Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;