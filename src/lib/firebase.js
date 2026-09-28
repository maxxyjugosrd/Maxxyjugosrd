import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDV35AU8W2SCEEZXcKvhYIvVJjhbm9ns18",
  authDomain: "maxxyjugos.firebaseapp.com",
  projectId: "maxxyjugos",
  storageBucket: "maxxyjugos.firebasestorage.app",
  messagingSenderId: "18494704643",
  appId: "1:18494704643:web:4fa37fa78b263c70ccd236",
  measurementId: "G-V773BY5R83"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const db = getFirestore(app);
