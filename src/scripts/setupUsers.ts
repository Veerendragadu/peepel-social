import { auth, db } from '../lib/firebaseClient';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

const sampleUsers = [
  {
    email: 'admin@peepel.com',
    password: 'Admin123!',
    username: 'admin',
    name: 'Admin User',
    isAdmin: true,
    isBanned: false,
    bio: 'Platform administrator',
    following_count: 0,
    followers_count: 0
  },
  {
    email: 'user@peepel.com',
    password: 'User123!',
    username: 'regularuser',
    name: 'Regular User',
    isAdmin: false,
    isBanned: false,
    bio: 'Just a regular user',
    following_count: 42,
    followers_count: 123
  },
  {
    email: 'creator@peepel.com',
    password: 'Creator123!',
    username: 'contentcreator',
    name: 'Content Creator',
    isAdmin: false,
    isBanned: false,
    bio: 'Creating awesome content',
    following_count: 156,
    followers_count: 892
  },
  {
    email: 'mod@peepel.com',
    password: 'Mod123!',
    username: 'moderator',
    name: 'Moderator',
    isAdmin: true,
    isBanned: false,
    bio: 'Keeping the community safe',
    following_count: 89,
    followers_count: 245
  }
];

async function setupSampleUsers() {
  console.log('Starting user setup...');
  
  for (const user of sampleUsers) {
    try {
      console.log(`\nProcessing user: ${user.email}`);
      
      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        user.email,
        user.password
      );

      // Create user document in Firestore
      const userData = {
        email: user.email,
        username: user.username,
        name: user.name,
        isAdmin: user.isAdmin,
        isBanned: user.isBanned,
        createdAt: new Date().toISOString(),
        avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${user.username}`,
        walletBalance: 0,
        bio: user.bio,
        following_count: user.following_count,
        followers_count: user.followers_count
      };

      const userDocRef = doc(db, 'users', userCredential.user.uid);
      await setDoc(userDocRef, userData);
      
      console.log(`Created user: ${user.email}`);
    } catch (error) {
      console.error(`\nError processing ${user.email}:`, error);
    }
  }
  
  console.log('\nSetup complete!');
  process.exit(0);
}

setupSampleUsers().catch(error => {
  console.error('\nSetup failed:', error);
  process.exit(1);
});