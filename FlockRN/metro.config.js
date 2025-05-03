const {
  wrapWithReanimatedMetroConfig,
} = require('react-native-reanimated/metro-config');

// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const config = getDefaultConfig(__dirname);

module.exports = wrapWithReanimatedMetroConfig(config);
