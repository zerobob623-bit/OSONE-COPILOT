import { initializeApp, FirebaseOptions } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, collection, addDoc, query, orderBy, limit, getDocs, onSnapshot, serverTimestamp } from 'firebase/firestore';

/**
 * Firebase Configuration Logic
 * Priority: 
 * 1. Environment Variables (VITE_FIREBASE_*)
 * 2. Pre-configured JSON file (if exists)
 */

let firebaseConfig: FirebaseOptions = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const databaseId = import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID;

// Attempt to load from protected config file as a fallback in development
try {
  // @ts-ignore - This file is in .gitignore and may not exist in production/GitHub
  import('../../firebase-applet-config.json').then((config) => {
    if (!firebaseConfig.apiKey && config.default) {
      Object.assign(firebaseConfig, config.default);
    }
  });
} catch (e) {
  // Fallback silent failure if file doesn't exist
}

// Validation helper
const isConfigValid = (config: FirebaseOptions) => !!config.apiKey && !!config.projectId;

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, databaseId || (firebaseConfig as any).firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export { 
  signInWithPopup, 
  onAuthStateChanged, 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  limit, 
  getDocs, 
  onSnapshot,
  serverTimestamp 
};
export type { User };
