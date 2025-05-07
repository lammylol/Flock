// 5/2/25 Ramon Jiang
// set up testing files

// jest.setup.js
// No need to import the problematic libraries here anymore

// Mock Expo modules
jest.mock('expo-status-bar', () => ({
    StatusBar: () => 'StatusBar',
}));

jest.mock('expo-linking', () => ({
    createURL: jest.fn(),
    openURL: jest.fn(),
}));

jest.mock('expo-router', () => ({
    useRouter: () => ({
        replace: jest.fn(),
        push: jest.fn(),
        back: jest.fn(),
    }),
    useLocalSearchParams: jest.fn().mockReturnValue({}),
    Link: ({ children }) => children,
    Stack: {
        Screen: ({ children }) => children,
    },
    router: {
        back: jest.fn(),
        replace: jest.fn(),
        dismissAll: jest.fn(),
    },
}));

// Common enums to avoid import issues
global.PrayerEntityType = {
    Prayer: 'prayer',
    PrayerPoint: 'prayerPoint',
    PrayerTopic: 'prayerTopic'
  };

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
    setItem: jest.fn(() => Promise.resolve()),
    getItem: jest.fn(() => Promise.resolve()),
    removeItem: jest.fn(() => Promise.resolve()),
    clear: jest.fn(() => Promise.resolve()),
}));

// Instead of mocking NativeAnimatedHelper (which may be causing the error),
// mock the entire Animated module as needed
jest.mock('react-native', () => {
    const reactNative = jest.requireActual('react-native');

    // Mock the Animated module
    reactNative.Animated = {
        ...reactNative.Animated,
        timing: jest.fn(() => ({
            start: jest.fn(),
        })),
        // Add other methods as needed
        Value: jest.fn(() => ({
            setValue: jest.fn(),
            interpolate: jest.fn(() => ({
                __getValue: jest.fn(),
            })),
        })),
    };

    return reactNative;
});

// Mock the react-native-reanimated
jest.mock('react-native-reanimated', () => {
    const Reanimated = require('react-native-reanimated/mock');
    Reanimated.default.call = () => { };
    return Reanimated;
});

// Mock react-native-gesture-handler
jest.mock('react-native-gesture-handler', () => { });

// Mock any native modules or third-party libraries that cause issues in tests
jest.mock('react-native/Libraries/EventEmitter/NativeEventEmitter', () => {
    const { EventEmitter } = require('events');
    return EventEmitter;
});

// Mock OpenAI
jest.mock('openai', () => {
    return {
        __esModule: true,
        default: jest.fn().mockImplementation(() => ({
            chat: {
                completions: {
                    create: jest.fn().mockResolvedValue({
                        choices: [{ message: { content: '{"title":"Test Title","tags":["prayer","faith"],"prayerPoints":[{"title":"Test Point","type":"request","content":"Test content"}]}' } }]
                    })
                }
            },
            embeddings: {
                create: jest.fn().mockResolvedValue({
                    data: [{ embedding: [0.1, 0.2, 0.3] }]
                })
            }
        })),
        APIError: class APIError extends Error {
            constructor(message, status) {
                super(message);
                this.status = status;
            }
        }
    };
});

// Global setup
global.fetch = jest.fn();