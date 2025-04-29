import functions from 'firebase-functions';
import OpenAI from "openai";
import { db } from './firebaseConfig.js';
import { config } from './config.js';

const apiKey = config.apiKey || ''; // OpenAI API key

const MAX_EMBEDDING_LENGTH = 1536; // Set embedding limit based on openAI vector limit.
const MAX_TOP_K = 10; // Set max limit for returned searches.

const initializeOpenAI = async () => {
  // Initialize openAI with the API key
  return new OpenAI({
    apiKey: apiKey // fetched from .env
  });
}

// Create the exports function for openAI. Not in use as of April 24.
// Vectorization is done through client.
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

      console.log(`openAIinput: ${input}`); // swap for analytics

      const response = await openAI.embeddings.create({
            model: 'text-embedding-3-small',
            input: input,
            encoding_format: 'float'
      });
      
      // Accessing the response correctly
      const vectorEmbeddings = response.data[0]?.embedding || "No response from AI.";

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

export const findSimilarPrayersV2 = functions.https.onCall(
  async (request) => {
    const { queryEmbedding, topK, userId } = request.data;

    // Check if the function is called by an authenticated user
    if (!request.auth) {
      console.error('Unauthenticated request');
      throw new functions.https.HttpsError('unauthenticated', 'The function must be called while authenticated.');
    }

    console.log('Received request data:', { queryEmbeddingLength: queryEmbedding?.length, topK, userId });

    // Validate the input
    if (!queryEmbedding || !Array.isArray(queryEmbedding) || queryEmbedding.length === 0) {
      console.error('Invalid query embedding');
      throw new functions.https.HttpsError('invalid-argument', 'Invalid query embedding.');
    }

    // Limit the size of the query embedding
    if (queryEmbedding.length > MAX_EMBEDDING_LENGTH) {
      console.error(`Query embedding exceeds maximum length of ${MAX_EMBEDDING_LENGTH}`);
      throw new functions.https.HttpsError('invalid-argument', `Query embedding exceeds maximum length of ${MAX_EMBEDDING_LENGTH}.`);
    }

    // Limit the maximum number of results
    const effectiveTopK = Math.min(topK || 5, MAX_TOP_K);

    try {
      // Query prayer points. Prayer points have a prayerType.
      const querySnapshotPP = await db.collection('prayerPoints')
        .where('embedding', '!=', null)
        .where('authorId', '==', userId)
        .select('embedding', 'title', 'prayerType', 'entityType')
        .get();
      
      const prayerPoints = querySnapshotPP.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Query prayer topics. Prayer Topics do not have a prayerType.
      const querySnapshotPT = await db.collection('prayerTopics')
        .where('embedding', '!=', null)
        .where('authorId', '==', userId)
        .select('embedding', 'title', 'entityType')
        .get();
    
      const prayerTopics = querySnapshotPT.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      
      const prayerPointsAndTopics = [...prayerPoints, ...prayerTopics];

      if (prayerPointsAndTopics.length === 0) {
        console.log('No prayer points or topics found');
        return { result: [] };
      } else {
        console.log(`Found ${prayerPoints?.length || 0} prayer points and ${prayerTopics?.length || 0} prayer topics`);
      }
    
      // Compute cosine similarity
      const cosineSimilarity = (a, b) => {
        const dotProduct = a.reduce((sum, ai, i) => sum + ai * b[i], 0);
        const magnitudeA = Math.sqrt(a.reduce((sum, ai) => sum + ai * ai, 0));
        const magnitudeB = Math.sqrt(b.reduce((sum, bi) => sum + bi * bi, 0));
        return dotProduct / (magnitudeA * magnitudeB);
      };
  
      const results = prayerPointsAndTopics
        .map((prayer) => ({
          id: prayer.id,
          title: prayer.title,
          prayerType: prayer.prayerType || null,
          entityType: prayer.entityType,
          similarity: cosineSimilarity(queryEmbedding, prayer.embedding),
        }))
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, effectiveTopK);
  
      console.log(`Found ${results.length} similar prayers`);
      return { result: results };
    } catch (error) {
      console.error('Error processing request:', error.message);
      throw new functions.https.HttpsError('internal', error.message || 'Failure: the process failed on the server.');
    }
  });

// TO BE DEPRECATED. Leaving functionality in place for testing.
export const findSimilarPrayers = functions.https.onCall(
  async (request) => {
    const { queryEmbedding, topK, userId } = request.data;

    // Check if the function is called by an authenticated user
    if (!request.auth) {
      console.error('Unauthenticated request:', request);
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