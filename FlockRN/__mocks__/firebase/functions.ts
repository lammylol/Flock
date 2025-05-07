// __mocks__/firebase/functions.ts
// Mock Firebase Cloud Functions

export const getFunctions = jest.fn().mockReturnValue({
  region: jest.fn().mockReturnThis(),
});

export const httpsCallable = jest.fn().mockImplementation(() => {
  return jest.fn().mockResolvedValue({
    data: {
      result: [
        {
          id: 'mock-similar-prayer-1',
          similarity: '0.85',
          title: 'Mock Similar Prayer 1',
          prayerType: 'request',
          entityType: 'prayerPoint',
        },
        {
          id: 'mock-similar-prayer-2',
          similarity: '0.75',
          title: 'Mock Similar Prayer 2',
          prayerType: 'praise',
          entityType: 'prayerTopic',
        },
      ],
    },
  });
});

export const connectFunctionsEmulator = jest.fn();
