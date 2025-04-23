import functions from 'firebase-functions';
import OpenAI from "openai";
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { db } from './firebaseConfig.js';

// Define __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load the .env from FlockRN
dotenv.config({ path: path.resolve(__dirname, './.env') });
const apiKey = process.env.OPENAI_API_KEY

const initializeOpenAI = async () => {
  // Initialize openAI with the API key
  return new OpenAI({
    apiKey: apiKey // fetched from .env
  });
}

// Create the exports function for openAI.
export const getVectorEmbeddings = functions.https.onRequest(
  async (req, res) => {
    console.log('Request body:', req.query);
    let input = req.query.input || req.body?.data?.input || "";
    
    // logic to manage formatting for testing vs. prod.
    try {
      if (req.query.input) {
            input = req.query.input;
        } else if (req.body?.data?.input) {
            input = req.body.data.input;
        }
    } catch (error) {
        console.error('Error parsing input:', error);
        return res.status(400).json({
            error: 'Invalid "input" format.',
        });
    }

    if (typeof input !== 'string') {
      console.error('Invalid input:', req.body);
      return res.status(400).json({
        error: 'Invalid input. Please provide a valid string as input.',
      });
    }

    try {
      const openAI = await initializeOpenAI();

      console.log(`openAIinput: ${input}`);

      const response = await openAI.embeddings.create({
            model: 'text-embedding-3-small',
            input: input,
            encoding_format: 'float'
      });
      
      // Accessing the response correctly
      const vectorEmbeddings = response.data[0]?.embedding || "No response from AI.";
      console.log(vectorEmbeddings);  // Logs the response text

      // Send a 200 response with the result.
      console.log('Vectors generated:', vectorEmbeddings);
      res.status(200).json({
        result: vectorEmbeddings,
      });
    } catch (error) {
      // Send a 500 error for an internal server issue.
      console.error('Error occurred:', error);
      res.status(500).json({
        error: error.message || 'Failure: the process failed on the server.',
      });
    }
  });

export const findSimilarPrayers = functions.https.onCall(
  async (request) => {
    const { queryEmbedding, topK, userId } = request.data;

    // Check if the function is called by an authenticated user
    if (!request.auth) {
      console.error('Unauthenticated request:', context);
      throw new functions.https.HttpsError('unauthenticated', 'The function must be called while authenticated.');
    }

    console.log('Request data:', request.data);

    // Validate the input
    if (!queryEmbedding || !Array.isArray(queryEmbedding) || queryEmbedding.length === 0) {
      throw new functions.https.HttpsError('invalid-argument', 'Invalid query embedding.');
    }
    
    try {
      const querySnapshot = await db.collection('prayerPoints')
        .where('embedding', '!=', null)
        .where('isOrigin', '==', true)
        .where('authorId', '==', userId)
        .get();
      
      const prayerPoints = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
  
      // Compute cosine similarity
      const cosineSimilarity = (a, b) => {
        const dotProduct = a.reduce((sum, ai, i) => sum + ai * b[i], 0);
        const magnitudeA = Math.sqrt(a.reduce((sum, ai) => sum + ai * ai, 0));
        const magnitudeB = Math.sqrt(b.reduce((sum, bi) => sum + bi * bi, 0));
        return dotProduct / (magnitudeA * magnitudeB);
      };
  
      const results = prayerPoints
        .map((prayer) => ({
          id: prayer.id,
          title: prayer.title,
          type: prayer.type,
          similarity: cosineSimilarity(queryEmbedding, prayer.embedding),
        }))
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, topK || 5);
  
      console.log('Similar prayers found:', results);
      return { result: results };
    } catch (error) {
      // Throw an HttpsError for an internal server issue.
      console.error('Error occurred:', error);
      throw new functions.https.HttpsError('internal', error.message || 'Failure: the process failed on the server.');
    }
  });