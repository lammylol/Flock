// Purpose of this code: This code snippet initializes Firebase services 
// and exports them for use in the application.

// src/firebase.ts or src/firebaseConfig.ts
import { initializeApp } from 'firebase/app';  // FirebaseApp initialization
import { getAuth } from 'firebase/auth';  // Firebase Auth

// Your Firebase configuration object
const firebaseConfig = {
  apiKey: "AIzaSyDmba3sNUEgBjGbpy2e0ayQDsFa7DJvIMg",
  authDomain: "flock-dev-cb431.firebaseapp.com",
  projectId: "flock-dev-cb431",
  storageBucket: "flock-dev-cb431.firebasestorage.app",
  messagingSenderId: "722774892392",
  appId: "1:722774892392:web:116ac42e664da3178000dd",
  measurementId: "G-498Y2Q93QY"
};

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);

// Export Firebase services
export const auth = getAuth(firebaseApp);
export default firebaseApp;