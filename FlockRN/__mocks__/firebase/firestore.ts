// __mocks__/firebase/firestore.ts

const mockCollection = jest.fn();
const mockDoc = jest.fn();
const mockSetDoc = jest.fn();
const mockUpdateDoc = jest.fn();
const mockDeleteDoc = jest.fn();
const mockAddDoc = jest.fn();
const mockGetDoc = jest.fn();
const mockGetDocs = jest.fn();
const mockWhere = jest.fn();
const mockOrderBy = jest.fn();
const mockQuery = jest.fn();
const mockOnSnapshot = jest.fn();

// Firestore data converter mock
const mockWithConverter = jest.fn();

// Mock document snapshot
const mockDocumentSnapshot = {
    exists: jest.fn(),
    data: jest.fn(),
    id: 'mock-doc-id'
};

// Mock query snapshot
const mockQuerySnapshot = {
    docs: [],
    forEach: jest.fn(callback => {
        mockQuerySnapshot.docs.forEach(callback);
    }),
    empty: false
};

// Reset all mocks between tests
const resetMocks = () => {
    mockCollection.mockReset();
    mockDoc.mockReset();
    mockSetDoc.mockReset();
    mockUpdateDoc.mockReset();
    mockDeleteDoc.mockReset();
    mockAddDoc.mockReset();
    mockGetDoc.mockReset();
    mockGetDocs.mockReset();
    mockWhere.mockReset();
    mockOrderBy.mockReset();
    mockQuery.mockReset();
    mockOnSnapshot.mockReset();
    mockWithConverter.mockReset();

    // Configure default behaviors
    mockCollection.mockReturnValue({
        doc: mockDoc,
        withConverter: mockWithConverter,
        add: jest.fn()
    });

    mockDoc.mockReturnValue({
        set: mockSetDoc,
        update: mockUpdateDoc,
        delete: mockDeleteDoc,
        get: mockGetDoc,
        onSnapshot: mockOnSnapshot
    });

    mockWithConverter.mockReturnThis();

    mockGetDoc.mockResolvedValue(mockDocumentSnapshot);
    mockGetDocs.mockResolvedValue(mockQuerySnapshot);

    mockQuery.mockReturnThis();
    mockWhere.mockReturnThis();
    mockOrderBy.mockReturnThis();
};

// Initialize mocks with default behaviors
resetMocks();

// Export mock functions
export {
    mockCollection as collection,
    mockDoc as doc,
    mockSetDoc as setDoc,
    mockUpdateDoc as updateDoc,
    mockDeleteDoc as deleteDoc,
    mockAddDoc as addDoc,
    mockGetDoc as getDoc,
    mockGetDocs as getDocs,
    mockWhere as where,
    mockOrderBy as orderBy,
    mockQuery as query,
    mockOnSnapshot as onSnapshot,
    mockDocumentSnapshot,
    mockQuerySnapshot,
    resetMocks
};

// Create a mock Firestore instance
export const db = {
    collection: mockCollection
};

// Mock Firestore types for testing
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