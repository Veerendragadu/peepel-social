import { adminDb } from '../lib/firebaseAdmin';

export const verifyUser = async (uid: string) => {
  const userDoc = await adminDb.collection('users').doc(uid).get();
  return userDoc.exists;
};

export const createUserRecord = async (uid: string, data: any) => {
  await adminDb.collection('users').doc(uid).set(data);
};

export const updateUserRecord = async (uid: string, data: any) => {
  await adminDb.collection('users').doc(uid).update(data);
};

export const deleteUserRecord = async (uid: string) => {
  await adminDb.collection('users').doc(uid).delete();
};