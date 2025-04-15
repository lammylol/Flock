import functions from 'firebase-functions';
import admin from 'firebase-admin';
import OpenAI from "openai";
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Setup for __dirname in ESM (since you're using "type": "module")
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load the .env from FlockRN
dotenv.config({ path: path.resolve(__dirname, '../../FlockRN/.env') });
const apiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY

// Initialize Firebase Admin SDK
admin.initializeApp();

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