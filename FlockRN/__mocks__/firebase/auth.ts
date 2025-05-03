// __mocks__/firebase/auth.ts
// Mock Firebase Auth

// Mock user
export const mockUser = {
  uid: 'test-user-id',
  email: 'test@example.com',
  displayName: 'Test User',
  photoURL: 'https://example.com/photo.jpg',
  emailVerified: true,
};

// Auth state observer
let authStateObserver = null;
let currentUser = mockUser; // Start with logged in user

// Mock auth functions
export const signInWithEmailAndPassword = jest
  .fn()
  .mockResolvedValue({ user: mockUser });
export const createUserWithEmailAndPassword = jest
  .fn()
  .mockResolvedValue({ user: mockUser });
export const signOut = jest.fn().mockResolvedValue(undefined);
export const sendPasswordResetEmail = jest.fn().mockResolvedValue(undefined);
export const sendEmailVerification = jest.fn().mockResolvedValue(undefined);
export const updateProfile = jest.fn().mockResolvedValue(undefined);
export const updateEmail = jest.fn().mockResolvedValue(undefined);
export const updatePassword = jest.fn().mockResolvedValue(undefined);
export const deleteUser = jest.fn().mockResolvedValue(undefined);

// Mock onAuthStateChanged
export const onAuthStateChanged = jest.fn((auth, callback) => {
  authStateObserver = callback;
  // Immediately call with current value
  if (callback) {
    callback(currentUser);
  }

  // Return unsubscribe function
  return () => {
    authStateObserver = null;
  };
});

// Mock Auth initialization functions
export const getReactNativePersistence = jest.fn().mockReturnValue({});
export const initializeAuth = jest.fn().mockReturnValue({
  currentUser,
  onAuthStateChanged: (callback) => onAuthStateChanged(auth, callback),
});

// Simulate sign in/out for testing
export const simulateSignIn = (user = mockUser) => {
  currentUser = user;
  if (authStateObserver) {
    authStateObserver(currentUser);
  }
};

export const simulateSignOut = () => {
  currentUser = null;
  if (authStateObserver) {
    authStateObserver(null);
  }
};

// Reset mocks for testing
export const resetMocks = () => {
  jest.clearAllMocks();
  currentUser = mockUser;
};

// Export auth instance
export const auth = {
  currentUser,
  onAuthStateChanged: (callback) => onAuthStateChanged(auth, callback),
};
