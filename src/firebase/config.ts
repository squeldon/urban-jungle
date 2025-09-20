// Import the functions you need from the SDKs you need
import { initializeApp, getApps } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBZ8cOwLsb1D4La158y8iOVosiHvPr7nRM",
  authDomain: "wholesale-msm.firebaseapp.com",
  projectId: "wholesale-msm",
  storageBucket: "wholesale-msm.firebasestorage.app",
  messagingSenderId: "254797101493",
  appId: "1:254797101493:web:4eb435e2fc38bad6c781fc",
  measurementId: "G-VF52CPR4RV"
};

// Initialize Firebase
let firebase_app =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export default firebase_app;
