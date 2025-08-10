import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from 'firebase/storage';


// Your web app's Firebase configuration
const firebaseConfig = {
  // apiKey: "AIzaSyBfzm2PMxv6l9IQA2lqXuDag7EcJQDeARA",
  // authDomain: "loklagbe-cfcfd.firebaseapp.com",
  // projectId: "loklagbe-cfcfd",
  // storageBucket: "loklagbe-cfcfd.appspot.com",
  // messagingSenderId: "106935080483",
  // appId: "1:106935080483:web:bb0d13ec04dd66b4bfc396",
  // measurementId: "G-T8K4PK0V7V"
  apiKey: "AIzaSyDGwnEn-_hKiLDQIlddTTvI2Qe9OFq7Y4U",
  authDomain: "lok-lagbe-f77de.firebaseapp.com",
  projectId: "lok-lagbe-f77de",
  storageBucket: "lok-lagbe-f77de.firebasestorage.app",
  messagingSenderId: "774490137442",
  appId: "1:774490137442:web:601ac1b7163e497718823b"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);



export { auth, db, app, storage};
