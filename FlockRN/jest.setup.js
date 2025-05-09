// jest.setup.js
import '@testing-library/jest-native/extend-expect';

// Set up common mocks that all tests will need

// Mock React Native components
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  RN.Animated = {
    ...RN.Animated,
    timing: jest.fn(() => ({
      start: jest.fn(cb => cb && cb()),
      reset: jest.fn(),
    })),
    spring: jest.fn(() => ({
      start: jest.fn(cb => cb && cb()),
      reset: jest.fn(),
    })),
    Value: jest.fn(() => ({
      setValue: jest.fn(),
      interpolate: jest.fn(() => ({
        __getValue: jest.fn(),
      })),
    })),
  };
  
  RN.LayoutAnimation = {
    ...RN.LayoutAnimation,
    configureNext: jest.fn(),
    create: jest.fn(),
    easeInEaseOut: jest.fn(),
  };
  
  return RN;
});

// Mock NavigationContainer - this is critical for the tests to work
jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native');
  return {
    ...actualNav,
    NavigationContainer: ({ children }) => children,
  };
});

// Mock Expo modules that might be used across tests
jest.mock('@expo/vector-icons', () => {
  const mockIcon = () => 'Icon';
  mockIcon.propTypes = {};
  
  return {
    Feather: mockIcon,
    FontAwesome: mockIcon,
    Ionicons: mockIcon,
    MaterialIcons: mockIcon,
    MaterialCommunityIcons: mockIcon,
    AntDesign: mockIcon,
  };
});

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(() => Promise.resolve()),
  clear: jest.fn(() => Promise.resolve()),
}));

// Global afterEach to clean up after each test
afterEach(() => {
  jest.clearAllMocks();
});

// Increase timeout for async tests
jest.setTimeout(10000);

// Silence console warnings/errors during tests
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

console.error = (...args) => {
  // Filter out React warnings
  if (args[0]?.includes?.('Warning:')) return;
  originalConsoleError(...args);
};

console.warn = (...args) => {
  // Filter out specific warnings
  if (
    args[0]?.includes?.('componentWillReceiveProps') ||
    args[0]?.includes?.('componentWillMount') ||
    args[0]?.includes?.('componentWillUpdate')
  ) {
    return;
  }
  originalConsoleWarn(...args);
};