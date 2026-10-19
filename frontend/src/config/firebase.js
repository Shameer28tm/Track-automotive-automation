import { initializeApp, getApps, getApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyChziaIvm_zXiAqL_qZW3nIgPRhFekaW1Q",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "track-automotive.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "track-automotive",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "track-automotive.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "453391582798",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:453391582798:web:b3ba3b8ce1b77d0be0651f",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-EMW1FW88K0"
};

// Initialize Firebase App (singleton pattern)
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Analytics (safely check browser support)
export let analytics = null;
if (typeof window !== "undefined") {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  }).catch(() => {
    // Analytics not supported in this environment
  });
}

// Initialize Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

/**
 * Trigger Firebase Google Sign-In with popup
 * @returns {Promise<{user: object, idToken: string, credential: string, accessToken: string|null, email: string, name: string, picture: string|null, sub: string}>}
 */
export const signInWithGoogle = async () => {
  const result = await signInWithPopup(auth, googleProvider);
  const user = result.user;
  const idToken = await user.getIdToken();
  const credential = GoogleAuthProvider.credentialFromResult(result);

  return {
    user,
    idToken,
    credential: credential?.idToken || idToken,
    accessToken: credential?.accessToken || null,
    email: user.email,
    name: user.displayName || user.email?.split("@")[0] || "User",
    picture: user.photoURL || null,
    sub: user.uid,
  };
};

/**
 * Sign out of Firebase Auth
 */
export const logoutFirebase = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.warn("Firebase sign out warning:", error);
  }
};
