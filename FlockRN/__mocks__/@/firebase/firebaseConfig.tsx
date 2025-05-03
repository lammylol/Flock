// __mocks__/@/firebase/firebaseConfig.tsx
// This mock replaces your actual Firebase config
// It exports the same objects that your real config does

import { collection } from 'firebase/firestore';

// Create mock db with collection method
const mockDb = {
    collection: jest.fn().mockImplementation((name) => {
        return { __collectionName: name };
    })
};

// Mock Auth object
const mockAuth = {
    currentUser: {
        uid: 'test-user-id',
        displayName: 'Test User',
        email: 'test@example.com',
    }
};

// Export the mocked db and auth objects
export const db = mockDb;
export const auth = mockAuth;

// Export mock app as default
export default { name: 'mock-app' };