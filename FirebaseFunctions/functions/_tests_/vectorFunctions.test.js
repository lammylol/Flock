import fetch from 'node-fetch';

import admin from 'firebase-admin';

// Initialize Firebase Admin SDK if not already initialized
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
}

// test functions.
const testFunction = async () => {
  const url = 'http://127.0.0.1:5001/flock-dev-cb431/us-central1/findSimilarPrayers';

  // Generate a custom token for testing
  const customToken = await admin.auth().createCustomToken('test-user-id');

  // Exchange the custom token for an ID token
  const idTokenResponse = await fetch('http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=fake-api-key', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      token: customToken,
      returnSecureToken: true,
    }),
  });

  const idTokenData = await idTokenResponse.json();
  const idToken = idTokenData.idToken;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify({
      data: {
        queryEmbedding: [0.1, 0.2, 0.3], // Example embedding array
        topK: 5, // Number of similar prayers to return
      },
    }),
  });

  const result = await response.json();
  console.log('Response:', result);
};

testFunction();