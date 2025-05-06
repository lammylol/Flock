# Flock  

**Purpose:**  
To inspire and empower people to pray more consistently, deepen their daily prayer habits, and cultivate a meaningful prayer life. 

**Mission:**  
To become a centralized hub for prayer, inspiring the act of prayer across the globe among both big and small communities.  

---  

## Key Features  
- Add posts and share prayer requests with select privacy settings.  
- Provide updates to existing prayers.  
- Add real friends and receive updates through a feed.  
- Track prayers and prayer requests for family & friends who aren't using the app.  
- Record and send a prayer directly to someone.  
- Group functionality for small groups and communities.  
- Analytics on trends and historical insights.  

For more information on the project, see [Notion](https://www.notion.so/7a20c472b3bc4b50b79d57fdfdf22f73?v=8703808a97b34242a8b2a00cb1456be9&pvs=4).  

---  

<img src="https://github.com/lammylol/Prayer-Calendar/assets/44993071/669810be-6829-4dfd-b5fd-41297521480b" alt="Screenshot 2023-11-02 at 8:23 AM" width="800">  

---  

### Testing
Built on Jest framework.
1. yarn install
2. yarn test

**Configuration files**
1. jest.setup.js
2. package.json -> "jest"

**Mocks**
   Our testing uses Jest's built-in Mocking capabilities for functions, modules, dependencies, etc.

**Test Structure**
   Tests are organized in the following directories:

tests/
├── unit/        # Pure function tests
├── components/  # Component tests
├── services/    # Service tests
├── hooks/       # Hook tests
└── e2e/         # End-to-end tests

### Setup  
1. Navigate to FlockRN
2. Run setup script
```bash
   chmod +x setup.sh
   ./setup.sh
```
3. Install packages
```bash
yarn install
```

Install pods to run developer build (ios only). 
This project uses **expo-dev-client** because it has native dependencies. You **must** install expo-dev-client for it to work properly.
```bash
cd ios
pod install
```
```bash
npx expo install expo-dev-client
```

### Set up emulators
1. IOS
   - ensure xcode and ios simulator are installed
2. Android
   - [Install Andoird Studio](https://developer.android.com/studio)
   - [Check you have an emulator](https://docs.expo.dev/workflow/android-studio-emulator/)

### Running React Native (Expo)
```bash
yarn start
```


### Linking Firebase  
1. **Ask for Database Access:**  
   - Prod DB access: Contact Matt  
   - Dev DB access: Contact Preston  

2. **Download the Firebase configuration file:**  
   - `GoogleService-info.plist`  

3. **Move the configuration files to the appropriate directories:**  
   - Dev plist: `Flock/Flock/dev/Firebase`  
   - Prod plist: `Flock/Flock/prod/Firebase`

4. **Run Firebase Cloud Functions and Tests:**
   - See ReadMe in 'Flock/FirebaseFunctions'

## Deprecated
Flockv1
- swift based 
