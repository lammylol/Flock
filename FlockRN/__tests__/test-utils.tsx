// __tests__/test-utils.tsx
import React, { ReactElement } from 'react';
import { render as rtlRender, RenderOptions } from '@testing-library/react-native';

// Import auth related modules after the mock
// The key fix here is to declare a mockCurrentUser object directly
const mockCurrentUser = {
    uid: 'test-user-id',
    displayName: 'Test User'
};

// Mock the auth hook
jest.mock('../hooks/useAuth', () => ({
    __esModule: true,
    default: () => ({
        // Use mock object directly instead of referencing auth
        user: mockCurrentUser,
        loading: false,
        error: null,
        signIn: jest.fn(),
        signOut: jest.fn(),
        signUp: jest.fn(),
    }),
}));

// Mock the PrayerCollectionContext
jest.mock('../context/PrayerCollectionContext', () => ({
    usePrayerCollection: jest.fn().mockReturnValue({
        userPrayers: [],
        userPrayerPoints: [],
        filteredUserPrayers: [],
        filteredUserPrayerPoints: [],
        loadAll: jest.fn(),
        searchPrayers: jest.fn(),
        updateCollection: jest.fn(),
        removeFromCollection: jest.fn(),
    }),
    PrayerCollectionProvider: ({ children }) => children,
}));

// Mock the OpenAIService
jest.mock('../services/ai/openAIService', () => ({
    __esModule: true,
    default: {
        getInstance: jest.fn().mockReturnValue({
            analyzePrayerContent: jest.fn().mockResolvedValue({
                title: 'Test Title',
                tags: ['prayer', 'faith'],
                prayerPoints: [
                    {
                        title: 'Test Point',
                        type: 'request',
                        content: 'Test content',
                    },
                ],
            }),
            getVectorEmbeddings: jest.fn().mockResolvedValue([0.1, 0.2, 0.3]),
            analyzePrayerWithEmbeddings: jest.fn().mockResolvedValue({
                title: 'Test Title',
                tags: ['prayer', 'faith'],
                prayerPoints: [
                    {
                        title: 'Test Point',
                        type: 'request',
                        content: 'Test content',
                    },
                ],
                embedding: [0.1, 0.2, 0.3],
            }),
        }),
    },
}));

// Create a wrapper that includes common providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
    return <>{children}</>;
};

// Custom render function that includes providers
const customRender = (
    ui: ReactElement,
    options?: Omit<RenderOptions, 'wrapper'>
) => rtlRender(ui, { wrapper: AllTheProviders, ...options });

// Re-export everything from testing-library
export * from '@testing-library/react-native';

// Override render method with custom render that includes providers
export { customRender as render, mockCurrentUser };

// Add a simple test to prevent "Your test suite must contain at least one test" error
describe('Test utilities', () => {
    it('should provide a custom render function', () => {
        expect(typeof customRender).toBe('function');
    });
});