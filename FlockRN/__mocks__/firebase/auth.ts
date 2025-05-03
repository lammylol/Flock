// __mocks__/firebase/auth.ts
export const getReactNativePersistence = jest.fn(() => ({
  type: 'reactNative',
}));

export const initializeAuth = jest.fn(() => ({
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
}));

export const getAuth = jest.fn(() => ({
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
    return jest.fn();
  }),
  signOut: jest.fn(() => Promise.resolve()),
}));

export const signInWithEmailAndPassword = jest.fn(() =>
  Promise.resolve({
    user: {
      uid: 'test-user-id',
      displayName: 'Test User',
      email: 'test@example.com',
    },
  }),
);

export const createUserWithEmailAndPassword = jest.fn(() =>
  Promise.resolve({
    user: {
      uid: 'new-test-user-id',
      email: 'new-test@example.com',
    },
  }),
);
