import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, addDoc } from 'firebase/firestore';
import { GoogleAuthProvider, updateCurrentUser } from 'firebase/auth';
import  { getStorage } from 'firebase/storage';


const firebaseConfig = {
    apiKey: "AIzaSyBBwYueey93VyjcTL0HwKD5hTYYjc2uv1o",
    authDomain: "metered-billing.firebaseapp.com",
    projectId: "metered-billing",
    storageBucket: "metered-billing.appspot.com",
    messagingSenderId: "998911313798",
    appId: "1:998911313798:web:faca5c28753faa7d8f8e07"
  };

export const app = initializeApp(firebaseConfig);
export const  auth =getAuth(app);
export const db =getFirestore(app);
export const storage = getStorage(app);
export const provider = new GoogleAuthProvider( );
export { collection, addDoc };
