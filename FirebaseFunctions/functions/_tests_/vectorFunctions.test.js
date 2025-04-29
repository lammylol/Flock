import fft from 'firebase-functions-test';
import * as myFunctions from '../vectorFunctions.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Define __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load the .env from FlockRN
const env = dotenv.config({ path: path.resolve(__dirname, '../.env') });

if (env.error) {
  throw new Error('Failed to load .env file');
}

const testUid = env.parsed?.TEST_UID_KEY || '' // update with valid test uid.
const fftInstance = fft(); // required for mock tests.

// Test for findSimilarPrayers function based on query embedding.
async function testFindSimilarPrayers() {
  const testFunction = fftInstance.wrap(myFunctions.findSimilarPrayers);

  const request = {
    data: {
      queryEmbedding: [-0.03835538, 0.0023366269, -0.046881247],
      topK: 5,
      userId: testUid,
    },
    auth: {
      uid: testUid, // test user id
    },
  };

  try {
    console.log('Sending request: ', request);
    const response = await testFunction(request);

    const data = response;
    console.log('Response:', data);
  } catch (error) {
    console.error('Error:', error);
  }
}

testFindSimilarPrayers();