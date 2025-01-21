import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const serviceAccount = {
  type: "service_account",
  project_id: "YOUR_PROJECT_ID",
  private_key_id: "YOUR_PRIVATE_KEY_ID",
  private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  client_email: "YOUR_CLIENT_EMAIL",
  client_id: "YOUR_CLIENT_ID",
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: "YOUR_CLIENT_CERT_URL",
  universe_domain: "googleapis.com"
};

const app = initializeApp({
  credential: cert(serviceAccount as any)
});

export const adminDb = getFirestore(app);