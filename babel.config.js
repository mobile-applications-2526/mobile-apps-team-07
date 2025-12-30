module.exports = function (api) {
  api.cache(true);
  return {
    presets: [['babel-preset-expo', { jsxImportSource: 'nativewind' }], 'nativewind/babel'],
    // Provide a safe default for worklets plugin options. Previously the
    // variable `workletsPluginOptions` was referenced but not defined which
    // caused Metro to crash with a ReferenceError during bundling.
    plugins: [
      // Provide unique names for each plugin instance to avoid Babel
      // "Duplicate plugin/preset detected" errors when both worklets and
      // reanimated plugins are present.
      ['react-native-worklets/plugin', {}, 'react-native-worklets'],
      // react-native-reanimated plugin must be last in the plugins array
      ['react-native-reanimated/plugin', {}, 'react-native-reanimated'],
    ],
  };
};
