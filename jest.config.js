module.exports = {
  preset: '@react-native/jest-preset',
  setupFiles: ['react-native-gesture-handler/jestSetup.js'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|@react-navigation|react-native-reanimated|react-native-worklets|react-native-gesture-handler|react-native-safe-area-context|react-native-screens|lucide-react-native|react-native-svg)/)',
  ],
};
