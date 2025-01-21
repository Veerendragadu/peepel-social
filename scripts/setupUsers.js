import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCQDdZen0qOYBgt6Lf_Zf9TOrBAgM57930",
  authDomain: "peepel-social.firebaseapp.com",
  projectId: "peepel-social",
  storageBucket: "peepel-social.firebasestorage.app",
  messagingSenderId: "911063586413",
  appId: "1:911063586413:web:c897002440faaa6fb7d164",
  measurementId: "G-G6MC1JRYG2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const sampleUsers = [
  {
    email: 'admin@peepel.com',
    password: 'Admin123!',
    username: 'admin',
    name: 'Admin User',
    isAdmin: true,
    isBanned: false
  },
  {
    email: 'user@peepel.com',
    password: 'User123!',
    username: 'regularuser',
    name: 'Regular User',
    isAdmin: false,
    isBanned: false
  },
  {
    email: 'creator@peepel.com',
    password: 'Creator123!',
    username: 'contentcreator',
    name: 'Content Creator',
    isAdmin: false,
    isBanned: false
  },
  {
    email: 'mod@peepel.com',
    password: 'Mod123!',
    username: 'moderator',
    name: 'Moderator',
    isAdmin: true,
    isBanned: false
  }
];

async function setupSampleUsers() {
  console.log('Starting user setup...');
  
  for (const user of sampleUsers) {
    try {
      console.log(`\nProcessing user: ${user.email}`);
      
      // Check if user already exists in Auth
      try {
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          user.email,
          user.password
        );
        console.log(`Created auth user: ${userCredential.user.uid}`);

        // Check if Firestore document already exists
        const userDocRef = doc(db, 'users', userCredential.user.uid);
        const userDoc = await getDoc(userDocRef);

        if (!userDoc.exists()) {
          // Create user document in Firestore
          await setDoc(userDocRef, {
            email: user.email,
            username: user.username,
            name: user.name,
            isAdmin: user.isAdmin,
            isBanned: user.isBanned,
            createdAt: new Date().toISOString(),
            avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${user.username}`,
            walletBalance: 0
          });
          console.log(`Created Firestore document for: ${user.email}`);
        } else {
          console.log(`Firestore document already exists for: ${user.email}`);
        }

        // Sign out after creating each user
        await signOut(auth);
        console.log(`Signed out after creating: ${user.email}`);

      } catch (error) {
        if (error.code === 'auth/email-already-in-use') {
          console.log(`User ${user.email} already exists in Auth`);
        } else {
          throw error;
        }
      }
    } catch (error) {
      console.error(`\nError processing ${user.email}:`, error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
    }
  }
  
  console.log('\nSetup complete!');
  process.exit(0);
}

setupSampleUsers().catch(error => {
  console.error('\nSetup failed:', error);
  process.exit(1);
});