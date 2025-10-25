const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('metro-config').MetroConfig}
 */
const config = {
  // Enable console logs in terminal
  server: {
    enhanceMiddleware: (middleware) => {
      return (req, res, next) => {
        // Log requests
        if (req.url.includes('symbolicate')) {
          console.log('📍 Symbolicating stack trace...');
        }
        return middleware(req, res, next);
      };
    },
  },
  // Enable source maps for better debugging
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true,
      },
    }),
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);