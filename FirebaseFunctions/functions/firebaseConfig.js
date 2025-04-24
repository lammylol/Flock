// filepath: /Users/lammylol/LocalRepos/Flock/FirebaseFunctions/functions/firebaseConfig.js
// This is separate from the firebaseConfig.js file from FlockRN.

import admin from 'firebase-admin';

// Initialize Firebase Admin SDK if not already initialized
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
}

// Export Firestore database instance
export const db = admin.firestore();