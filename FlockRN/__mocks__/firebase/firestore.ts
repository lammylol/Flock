// __mocks__/firebase/firestore.ts
// This is a comprehensive mock for Firebase Firestore

// Define mock document and query snapshots
export const mockDocumentSnapshot = {
    exists: jest.fn(() => true),
    data: jest.fn(() => ({})),
    id: 'mock-doc-id'
};

export const mockQuerySnapshot = {
    docs: [],
    forEach: jest.fn(callback => {
        mockQuerySnapshot.docs.forEach(callback);
    }),
    empty: false
};

// Create a mock for the db itself
export const db = {
    collection: jest.fn().mockReturnValue({})
};

// Mock Firestore functions
export const collection = jest.fn().mockImplementation((firestore, collectionName) => {
    // Return an object that can be used with other Firestore functions
    return {
        __collectionName: collectionName,
        __isCollection: true
    };
});

export const doc = jest.fn().mockImplementation((firestore, collectionName, ...pathSegments) => {
    // Return a document reference with the path segments
    return {
        __collectionName: collectionName,
        __pathSegments: pathSegments,
        __isDocRef: true
    };
});

export const setDoc = jest.fn().mockResolvedValue(undefined);
export const updateDoc = jest.fn().mockResolvedValue(undefined);
export const deleteDoc = jest.fn().mockResolvedValue(undefined);
export const addDoc = jest.fn();
export const getDoc = jest.fn().mockResolvedValue(mockDocumentSnapshot);
export const getDocs = jest.fn().mockResolvedValue(mockQuerySnapshot);
export const query = jest.fn().mockReturnValue({});
export const where = jest.fn().mockReturnValue({});
export const orderBy = jest.fn().mockReturnValue({});

// Mock Timestamp
export const Timestamp = {
    now: jest.fn(() => ({
        toDate: () => new Date(),
        seconds: Math.floor(Date.now() / 1000),
        nanoseconds: 0
    })),
    fromDate: jest.fn(date => ({
        toDate: () => date,
        seconds: Math.floor(date.getTime() / 1000),
        nanoseconds: 0
    }))
};

// Mock Firestore initialization
export const initializeFirestore = jest.fn().mockReturnValue(db);

// Reset all mocks
export const resetMocks = jest.fn(() => {
    collection.mockClear();
    doc.mockClear();
    setDoc.mockClear();
    updateDoc.mockClear();
    deleteDoc.mockClear();
    addDoc.mockClear();
    getDoc.mockClear();
    getDocs.mockClear();
    query.mockClear();
    where.mockClear();
    orderBy.mockClear();

    mockDocumentSnapshot.exists.mockClear();
    mockDocumentSnapshot.data.mockClear();

    Timestamp.now.mockClear();
    Timestamp.fromDate.mockClear();
});