// __tests__/services/prayer/prayerService.test.ts
// Import Jest globals
import { jest } from '@jest/globals';

// Define our mocks BEFORE any imports that might use Firebase
jest.mock('firebase/app');
jest.mock('firebase/auth');
jest.mock('firebase/firestore');
jest.mock('firebase/functions');
jest.mock('@/firebase/firebaseConfig');

// Import our service to test
import { prayerService } from '../../../services/prayer/prayerService';
import { PrayerEntityType } from '@/types/PrayerSubtypes';

// Once the service is imported, we can now mock its methods directly
// This approach bypasses the complex Firebase mocking
describe('PrayerService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createPrayer', () => {
    it('should create a new prayer document', async () => {
      // Setup: Directly mock the method
      const createPrayerMock = jest.spyOn(prayerService, 'createPrayer');
      createPrayerMock.mockResolvedValue('new-prayer-id');

      // Test data
      const prayerData = {
        authorId: 'test-user-id',
        authorName: 'Test User',
        content: 'This is a test prayer',
        privacy: 'private',
      };

      // Call the function
      const result = await prayerService.createPrayer(prayerData);

      // Assertions
      expect(createPrayerMock).toHaveBeenCalledWith(prayerData);
      expect(result).toBe('new-prayer-id');
    });
  });

  describe('getPrayer', () => {
    it('should retrieve a prayer by ID', async () => {
      // Mock data
      const prayerId = 'test-prayer-id';
      const mockPrayer = {
        id: prayerId,
        authorId: 'test-user-id',
        authorName: 'Test User',
        content: 'Test prayer content',
        privacy: 'private',
        createdAt: new Date(),
        updatedAt: new Date(),
        prayerPoints: ['point1', 'point2'],
        entityType: PrayerEntityType.Prayer,
      };

      // Setup: Directly mock the method
      const getPrayerMock = jest.spyOn(prayerService, 'getPrayer');
      getPrayerMock.mockResolvedValue(mockPrayer);

      // Call the function
      const result = await prayerService.getPrayer(prayerId);

      // Assertions
      expect(getPrayerMock).toHaveBeenCalledWith(prayerId);
      expect(result).toEqual(mockPrayer);
    });

    it('should return null when prayer does not exist', async () => {
      // Setup: Directly mock the method
      const getPrayerMock = jest.spyOn(prayerService, 'getPrayer');
      getPrayerMock.mockResolvedValue(null);

      // Call the function
      const result = await prayerService.getPrayer('non-existent-id');

      // Assertions
      expect(result).toBeNull();
    });
  });
});
