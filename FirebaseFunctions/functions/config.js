import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Define __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load the .env from FlockRN
const env = dotenv.config({ path: path.resolve(__dirname, './.env') });
if (env.error) {
  throw new Error('Failed to load .env file');
}

export const config = {
    apiKey: env.parsed?.OPENAI_API_KEY || '',
    testUid: env.parsed?.TEST_UID_KEY || '',
};