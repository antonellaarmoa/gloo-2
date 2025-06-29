// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import AsyncStorage from '@react-native-async-storage/async-storage';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyB5CVT-pCDm-y4hn56_kT-NmEbHtNhUkGc",
  authDomain: "glooapp.firebaseapp.com",
  projectId: "glooapp",
  storageBucket: "glooapp.firebasestorage.app",
  messagingSenderId: "575800558765",
  appId: "1:575800558765:web:8fcab5c73d9d80ca147224",
  measurementId: "G-2TNSHDP8YN"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services with proper React Native persistence
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;