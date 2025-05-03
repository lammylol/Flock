// __mocks__/firebase/auth.ts
// Mock user
const mockUser = {
    uid: 'test-user-123',
    email: 'test@example.com',
    displayName: 'Test User',
    photoURL: 'https://example.com/photo.jpg',
    emailVerified: true
};

// Auth state observer
let authStateObserver = null;
let currentUser = mockUser;  // Start with logged in user for easier testing

// Mock sign in functions
const mockSignInWithEmailAndPassword = jest.fn();
const mockCreateUserWithEmailAndPassword = jest.fn();
const mockSignOut = jest.fn();
const mockSendPasswordResetEmail = jest.fn();
const mockSendEmailVerification = jest.fn();
const mockUpdateProfile = jest.fn();
const mockUpdateEmail = jest.fn();
const mockUpdatePassword = jest.fn();
const mockDeleteUser = jest.fn();
const mockGetReactNativePersistence = jest.fn();
const mockInitializeAuth = jest.fn();

// onAuthStateChanged mock that calls the observer with the current user
const mockOnAuthStateChanged = jest.fn((auth, callback) => {
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

// Function to simulate sign in
const simulateSignIn = (user = mockUser) => {
    currentUser = user;
    if (authStateObserver) {
        authStateObserver(currentUser);
    }
};

// Function to simulate sign out
const simulateSignOut = () => {
    currentUser = null;
    if (authStateObserver) {
        authStateObserver(null);
    }
};

// Reset all mocks between tests
const resetMocks = () => {
    mockSignInWithEmailAndPassword.mockReset();
    mockCreateUserWithEmailAndPassword.mockReset();
    mockSignOut.mockReset();
    mockSendPasswordResetEmail.mockReset();
    mockSendEmailVerification.mockReset();
    mockUpdateProfile.mockReset();
    mockUpdateEmail.mockReset();
    mockUpdatePassword.mockReset();
    mockDeleteUser.mockReset();
    mockOnAuthStateChanged.mockReset();

    // Set default implementations
    mockSignInWithEmailAndPassword.mockImplementation((auth, email, password) => {
        return Promise.resolve({ user: mockUser });
    });

    mockCreateUserWithEmailAndPassword.mockImplementation((auth, email, password) => {
        return Promise.resolve({ user: mockUser });
    });

    mockSignOut.mockImplementation((auth) => {
        simulateSignOut();
        return Promise.resolve();
    });

    mockInitializeAuth.mockReturnValue({
        currentUser: mockUser,
        onAuthStateChanged: mockOnAuthStateChanged
    });

    currentUser = mockUser;
};

// Initialize with default implementations
resetMocks();

// Export auth functions
export const signInWithEmailAndPassword = mockSignInWithEmailAndPassword;
export const createUserWithEmailAndPassword = mockCreateUserWithEmailAndPassword;
export const signOut = mockSignOut;
export const sendPasswordResetEmail = mockSendPasswordResetEmail;
export const sendEmailVerification = mockSendEmailVerification;
export const updateProfile = mockUpdateProfile;
export const updateEmail = mockUpdateEmail;
export const updatePassword = mockUpdatePassword;
export const deleteUser = mockDeleteUser;
export const onAuthStateChanged = mockOnAuthStateChanged;
export const getReactNativePersistence = mockGetReactNativePersistence;
export const initializeAuth = mockInitializeAuth;

// Auth instance
export const auth = {
    currentUser,
    onAuthStateChanged: (callback) => mockOnAuthStateChanged(auth, callback)
};

// Export testing utilities
export const testUtils = {
    simulateSignIn,
    simulateSignOut,
    resetMocks
};