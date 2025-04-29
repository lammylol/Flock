This is the app for firebase cloud functions.

### Setup  
1. To deploy functions, run emulators, user needs Firebase CLI installed globally. As of 4/28/25, only Node.js version 18 is compatible.

   ```bash
   yarn add -g firebase-tools
   nvm use 18
   ```

2. Install packages in FlockRN/FirebaseFunctions/functions

   ```bash
   cd FirebaseFunctions/functions
   yarn install
   ```

3. Setup local firebaseCredentials.json
   - Fetch firebaseCredentials from firebase console -> settings -> adminSDK (generate private key per user).
   - Save the file and rename as firebaseCredentials.json and place it in FirebaseFunctions/functions/firebaseCredentials.json.
   - This enables user to sign as a client when running tests.

4. Setup local .env file. This is loaded in functions/config.js and must be imported into each file referencing it.
   - Add .env file with:

      ```bash
      OPENAI_API_KEY='xxxxx'
      TEST_UID_KEY='{yourTestAccountUserID}'
      ```

3. Running Function Tests:

   ```bash
   firebase emulators:start #easy initial test of functions.js
   firebase emulators:exec "node _tests_/vectorFunctions.test.js" #this runs the test file locally
   ```

4. Deploying Functions

   ```bash
   firebase deploy --only functions:{INSERTFUNCTIONNAME}
   ```

Good luck!

