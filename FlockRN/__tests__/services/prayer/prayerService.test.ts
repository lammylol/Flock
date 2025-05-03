// __tests__/services/prayer/prayerService.test.ts
import { jest } from '@jest/globals';
import {
    collection,
    doc,
    setDoc,
    updateDoc,
    deleteDoc,
    addDoc,
    getDoc,
    getDocs,
    query,
    where,
    orderBy,
    Timestamp,
    mockDocumentSnapshot,
    mockQuerySnapshot,
    resetMocks
} from 'firebase/firestore';

// Mock the firebase config
jest.mock('../../../firebase/firebaseConfig', () => ({
    db: {
        collection: jest.fn().mockImplementation((name) => collection(null, name))
    },
    auth: {
        currentUser: {
            uid: 'test-user-id',
            displayName: 'Test User'
        }
    }
}));

// Mock the Firebase functions
jest.mock('firebase/functions', () => ({
    getFunctions: jest.fn(),
    httpsCallable: jest.fn().mockImplementation(() => {
        return jest.fn().mockResolvedValue({
            data: {
                result: [
                    {
                        id: 'mock-similar-prayer-1',
                        similarity: '0.85',
                        title: 'Mock Similar Prayer 1',
                        prayerType: 'request',
                        entityType: 'prayerPoint',
                    }
                ]
            }
        });
    })
}));

// Mock firebase/app
jest.mock('firebase/app', () => ({
    getApp: jest.fn().mockReturnValue({})
}));

// Import the service after mocking
import { prayerService } from '../../../services/prayer/prayerService';
import { PrayerEntityType } from '../../../types/PrayerSubtypes';

describe('PrayerService', () => {
    beforeEach(() => {
        resetMocks();
        jest.clearAllMocks();

        // Mock Timestamp.now
        (Timestamp.now as jest.Mock).mockReturnValue({
            toDate: () => new Date(),
            seconds: Math.floor(Date.now() / 1000),
            nanoseconds: 0
        });
    });

    describe('createPrayer', () => {
        it('should create a new prayer document', async () => {
            // Mock data
            const prayerData = {
                authorId: 'test-user-id',
                authorName: 'Test User',
                content: 'This is a test prayer',
                privacy: 'private',
            };

            // Mock the document reference
            const mockDocRef = {
                id: 'new-prayer-id',
            };
            addDoc.mockResolvedValueOnce(mockDocRef);

            // Call the function
            const result = await prayerService.createPrayer(prayerData);

            // Assertions
            expect(collection).toHaveBeenCalledWith(expect.anything(), 'prayers');
            expect(addDoc).toHaveBeenCalled();
            expect(updateDoc).toHaveBeenCalledWith(mockDocRef, { id: 'new-prayer-id' });
            expect(result).toBe('new-prayer-id');
        });

        it('should add to feed when privacy is public', async () => {
            // Mock data
            const prayerData = {
                authorId: 'test-user-id',
                authorName: 'Test User',
                content: 'This is a test prayer',
                privacy: 'public',
            };

            // Mock document reference
            const mockDocRef = {
                id: 'new-prayer-id',
            };
            addDoc.mockResolvedValueOnce(mockDocRef);

            // Call the function
            await prayerService.createPrayer(prayerData);

            // Assertions for feed
            expect(doc).toHaveBeenCalledWith(
                expect.anything(),
                'feed',
                'test-user-id',
                'prayers',
                'new-prayer-id'
            );
            expect(setDoc).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({
                    prayerId: 'new-prayer-id',
                    addedAt: expect.anything()
                })
            );
        });
    });

    describe('getPrayer', () => {
        it('should retrieve a prayer by ID', async () => {
            // Mock data
            const prayerId = 'test-prayer-id';
            const mockPrayerData = {
                id: prayerId,
                authorId: 'test-user-id',
                authorName: 'Test User',
                content: 'Test prayer content',
                privacy: 'private',
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now(),
                prayerPoints: ['point1', 'point2'],
                entityType: PrayerEntityType.Prayer
            };

            // Mock exists and data
            mockDocumentSnapshot.exists.mockReturnValueOnce(true);
            mockDocumentSnapshot.data.mockReturnValueOnce(mockPrayerData);
            getDoc.mockResolvedValueOnce(mockDocumentSnapshot);

            // Call the function
            const result = await prayerService.getPrayer(prayerId);

            // Assertions
            expect(doc).toHaveBeenCalledWith(expect.anything(), 'prayers', prayerId);
            expect(getDoc).toHaveBeenCalled();
            expect(result).toEqual(expect.objectContaining({
                id: prayerId,
                content: 'Test prayer content'
            }));
        });

        it('should return null when prayer does not exist', async () => {
            // Mock non-existent document
            mockDocumentSnapshot.exists.mockReturnValueOnce(false);
            getDoc.mockResolvedValueOnce(mockDocumentSnapshot);

            // Call the function
            const result = await prayerService.getPrayer('non-existent-id');

            // Assertions
            expect(result).toBeNull();
        });
    });
});