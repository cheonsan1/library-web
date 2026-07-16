import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBUNHNSyu_ci4cjj81exmUjHBl2gddtEns",
  authDomain: "dicr-e1b35.firebaseapp.com",
  projectId: "dicr-e1b35",
  storageBucket: "dicr-e1b35.firebasestorage.app",
  messagingSenderId: "801888155880",
  appId: "1:801888155880:web:178f258bfec6411d1eb15d",
  measurementId: "G-RHFDSPNNP0"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
export const db = getFirestore(app);
export const storage = getStorage(app);
