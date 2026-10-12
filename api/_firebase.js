/**
 * Firebase Firestore Client for Serverless Functions
 * DeepFocus OS Backend
 */

import { initializeApp, getApps } from 'firebase/app';
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  getDocs 
} from 'firebase/firestore';
import { getAuth, signInAnonymously } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || 'AIzaSyAD7_8-bDvGEjfFO4jM5ejdMj0dgQvml1o',
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || 'gen-lang-client-0696138502.firebaseapp.com',
  projectId: process.env.FIREBASE_PROJECT_ID || 'gen-lang-client-0696138502',
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || 'gen-lang-client-0696138502.firebasestorage.app',
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || '496717945327',
  appId: process.env.FIREBASE_APP_ID || '1:496717945327:web:0e07107f9440aa1481be1a'
};

const DATABASE_ID = process.env.FIREBASE_DATABASE_ID || 'ai-studio-phttrinbnthn-8807863b-b799-48b6-9223-f8e98883d044';

const app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);
const db = getFirestore(app, DATABASE_ID);
const auth = getAuth(app);

export async function getDb() {
  if (auth && !auth.currentUser) {
    try {
      await signInAnonymously(auth);
    } catch (e) {
      // Anonymous sign-in fallback
    }
  }
  return db;
}

export { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs };
