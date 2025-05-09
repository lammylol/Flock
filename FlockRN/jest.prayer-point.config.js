// jest.prayer-point.config.js
module.exports = {
    // Use regular preset
    preset: "jest-expo",
    
    // Skip the problematic setup
    setupFiles: [],
    
    // Add our custom setup
    setupFilesAfterEnv: [
      "./jest.prayer-point.setup.js"
    ],
    
    transformIgnorePatterns: [
      "node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|react-native-reanimated|react-native-gesture-handler)"
    ],
    moduleNameMapper: {
      "^firebase/(.*)$": "<rootDir>/__mocks__/firebase/$1",
      "^@/(.*)$": "<rootDir>/$1"
    },
    testEnvironment: "node"
  };