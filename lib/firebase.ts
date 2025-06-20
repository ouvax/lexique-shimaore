// lib/firebase.ts
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// ✅ Configuration de ton projet Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDgRi7et35moEGfs1OPmPVeBOu_jTOCklU",
  authDomain: "lexique-shimaore.firebaseapp.com",
  projectId: "lexique-shimaore",
  storageBucket: "lexique-shimaore.appspot.com", // corrigé ici (c'était .firebasestorage.app)
  messagingSenderId: "842167679041",
  appId: "1:842167679041:web:a73c12a66e02a590c9eec0",
  measurementId: "G-EM5QKTWTN8"
};

// ✅ Initialisation de Firebase
const app = initializeApp(firebaseConfig);

// ✅ Export des modules utiles
export const auth = getAuth(app);
export const db = getFirestore(app);
// (analytics inutile en React Native)

