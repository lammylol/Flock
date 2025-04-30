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