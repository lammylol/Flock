import fs from 'fs';
import 'dotenv/config';

const filePath = process.env.GOOGLE_SERVICE_INFO_PATH || './firebase/GoogleService-Info.plist';

if (!process.env.GOOGLE_SERVICE_INFO) {
  console.error('GOOGLE_SERVICE_INFO is missing from .env');
  process.exit(1);
}

const plistContent = process.env.GOOGLE_SERVICE_INFO.replace(/\\n/g, '\n'); // Convert escaped newlines back to real newlines

fs.writeFileSync(filePath, plistContent);
console.log(`✅ GoogleService-Info.plist written to ${filePath}`);