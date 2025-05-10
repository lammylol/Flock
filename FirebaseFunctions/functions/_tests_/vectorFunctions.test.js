import fft from 'firebase-functions-test';
import * as myFunctions from '../vectorFunctions.js';
import { config } from '../config.js'; // Import the config file

const testUid = config.testUid || ''; // test user id
const fftInstance = fft(); // required for mock tests.

// Test for findSimilarPrayers function based on query embedding.
async function testFindSimilarPrayers() {
  const testFunction = fftInstance.wrap(myFunctions.findSimilarPrayers);

  const request = {
    data: {
      sourcePrayerId: '12345', // test prayer document
      queryEmbedding: 
      [-0.018328054, -0.05464863, -0.013648, -0.014328, -0.012328, -0.015328, -0.016328, -0.017328, -0.018328, -0.019328],
      topK: 10,
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