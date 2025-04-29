// filepath: /Users/lammylol/LocalRepos/Flock/FirebaseFunctions/functions/firebaseConfig.js
// This is separate from the firebaseConfig.js file from FlockRN.

import admin from 'firebase-admin';
import path from 'path';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';

// Get local firebaseCredentials.json. Fetch from Firebase console via AdminSDK and rename as firebaseCredentials.json.
// This enables local testing of Firebase functions.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const serviceAccountPath = path.resolve(__dirname, 'firebaseCredentials.json');

const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));

// Initialize Firebase Admin SDK if not already initialized
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

// Export Firestore database instance
export const db = admin.firestore();
// Export Firebase Admin SDK
export { admin };
// Export Firebase Admin Auth
export const auth = admin.auth();