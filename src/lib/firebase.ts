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

// Validation helper
const isConfigValid = (config: FirebaseOptions) => 
  !!config.apiKey && config.apiKey !== 'undefined' && !!config.projectId;

// Safe initialization
export let isFirebaseEnabled = isConfigValid(firebaseConfig);

let app;
let db: any;
let auth: any;
let googleProvider: any;

if (isFirebaseEnabled) {
  try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app, databaseId || (firebaseConfig as any).firestoreDatabaseId);
    auth = getAuth(app);
    googleProvider = new GoogleAuthProvider();
  } catch (error) {
    console.error("Firebase initialization failed:", error);
    isFirebaseEnabled = false;
  }
}

export { app, db, auth, googleProvider };

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
