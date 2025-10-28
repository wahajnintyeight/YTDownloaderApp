module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    // other plugins can go here
    'react-native-reanimated/plugin', // MUST be last
  ],
};
