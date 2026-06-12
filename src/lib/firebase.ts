import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDPWY3cORXA2CF2KdJBEzWapwLtPrFXx8Y",
  authDomain: "tablero-de-guardias.firebaseapp.com",
  projectId: "tablero-de-guardias",
  storageBucket: "tablero-de-guardias.firebasestorage.app",
  messagingSenderId: "302173195361",
  appId: "1:302173195361:web:7c6fc2592098652912ee20"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth();
