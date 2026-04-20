module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: ['react-native-reanimated/plugin'],
  api.cache.using(() => process.env.NODE_ENV);
  const isTest = process.env.NODE_ENV === 'test';
  // babel-preset-expo is bundled inside the expo package, not installed at the top level.
  // Resolve it explicitly so it works in both Expo CLI and Jest contexts.
  const expoPreset = require.resolve('expo/node_modules/babel-preset-expo');
  return {
    presets: [
      [
        expoPreset,
        // Disable the worklets/reanimated Babel plugins in Jest (they require native
        // peer packages that are not present in a Node test environment).
        isTest ? { worklets: false, reanimated: false } : {},
      ],
    ],
  };
};
