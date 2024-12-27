// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore"; // Add this for Firestore
import { getStorage } from "firebase/storage"; // Add this for Storage
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCmGdLOZfGtU1P500ItBOFh0RZkt5utFeM",
  authDomain: "code-switching-asr.firebaseapp.com",
  projectId: "code-switching-asr",
  storageBucket: "code-switching-asr.firebasestorage.app",
  messagingSenderId: "129330864729",
  appId: "1:129330864729:web:03b46c13d22bad7db9c748",
  measurementId: "G-YPBVX5185M"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// firebase의 firestore 인스턴스를 변수에 저장
const firestore = getFirestore(app)

// firebase의 firestore 인스턴스를 변수에 저장
const db = getFirestore(app)
const storage = getStorage(app);
const analytics = getAnalytics(app);

// Export the initialized instances
export { db, storage, analytics };