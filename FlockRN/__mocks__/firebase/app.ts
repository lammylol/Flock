// __mocks__/firebase/app.ts
// Mock Firebase app initialization

// Create a mock app instance
const mockApp = {
  name: 'mock-firebase-app',
  options: {},
  automaticDataCollectionEnabled: false,
};

// Export initialization functions
export const initializeApp = jest.fn().mockReturnValue(mockApp);
export const getApp = jest.fn().mockReturnValue(mockApp);
export const deleteApp = jest.fn().mockResolvedValue(undefined);
export const getApps = jest.fn().mockReturnValue([mockApp]);

// Export the mock app as default
export default mockApp;
