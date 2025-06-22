// firebase.ts
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyDgRi7et35moEGfs1OPmPVeBOu_jTOCklU',
  authDomain: 'lexique-shimaore.firebaseapp.com',
  projectId: 'lexique-shimaore',
  storageBucket: 'lexique-shimaore.appspot.com',
  messagingSenderId: '842167679041',
  appId: '1:842167679041:web:a73c12a66e02a590c9eec0',
};
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app); // 👈 cette ligne
