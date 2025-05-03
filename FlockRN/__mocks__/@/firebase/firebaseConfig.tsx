// __mocks__/@/firebase/firebaseConfig.tsx
// This mock replaces your actual Firebase config
// It exports the same objects that your real config does

// Mock db
const mockDb = {
  collection: jest.fn().mockImplementation((name) => {
    return { __collectionName: name };
  }),
};

// Mock Auth object
const mockAuth = {
  currentUser: {
    uid: 'test-user-id',
    displayName: 'Test User',
    email: 'test@example.com',
  },
  onAuthStateChanged: jest.fn((callback) => {
    callback({
      uid: 'test-user-id',
      displayName: 'Test User',
      email: 'test@example.com',
    });
    return jest.fn(); // return unsubscribe function
  }),
  signOut: jest.fn(() => Promise.resolve()),
};

// Mock Firestore
const mockFirestore = jest.fn(() => mockDb);

// Export the mocked db and auth objects
export const db = mockDb;
export const auth = mockAuth;
export const firestore = mockFirestore;

// Export mock app as default
export default { name: 'mock-app' };