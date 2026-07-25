import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBRmxCLMHTzalNdJLElMr_2-DZ3-IA9xnU",
  authDomain: "np-handover.firebaseapp.com",
  projectId: "np-handover",
  storageBucket: "np-handover.firebasestorage.app",
  messagingSenderId: "858345106709",
  appId: "1:858345106709:web:85ad6feb9edf53ce6f0d1c",
};

export const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const firebaseAuth = getAuth(firebaseApp);
export const firestore = getFirestore(firebaseApp);
export const initialAdminEmail = "k89150@gmail.com";
