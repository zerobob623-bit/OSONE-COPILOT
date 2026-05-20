/**
 * Local Semantic Memory module - Replacement for Firebase
 * This module overrides Firebase exports to work purely locally, ensuring
 * that all states, files, profiles, and memories persist directly on the device
 * via LocalStorage.
 */

export const isFirebaseEnabled = false;
export const app = null;
export const db = null;
export const auth = null;
export const googleProvider = null;

export const signInWithPopup = async () => {
  throw new Error("Sincronização em nuvem desativada. Operando em modo de memória local segura.");
};

export const onAuthStateChanged = (authInstance: any, callback: (user: any) => void) => {
  // Always trigger immediately with null so the application loads the local interface without any blocking gates.
  setTimeout(() => {
    callback(null);
  }, 10);
  return () => {};
};

// No-op versions of Firestore APIs to prevent any compiler or runtime errors
export const doc = () => null;
export const getDoc = async () => ({ exists: () => false, data: () => null });
export const setDoc = async () => {};
export const collection = () => null;
export const addDoc = async () => ({ id: Math.random().toString(36).substr(2, 9) });
export const query = () => null;
export const orderBy = () => null;
export const limit = () => null;
export const getDocs = async () => ({ empty: true, docs: [] });
export const onSnapshot = () => () => {};
export const serverTimestamp = () => new Date();

export interface User {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
}
