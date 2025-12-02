const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('metro-config').MetroConfig}
 */
const config = {
  resolver: {
    sourceExts: ['js', 'jsx', 'json', 'ts', 'tsx', 'cjs', 'mjs'],
    assetExts: ['glb', 'gltf', 'png', 'jpg', 'jpeg', 'ttf', 'otf', 'mp4', 'webm'],
    resolveRequest: (context, moduleName, platform) => {
      if (moduleName === 'lucide-react-native') {
        // Force resolution to CJS entry point to avoid ESM resolution issues in Metro
        return {
          filePath: require.resolve('lucide-react-native/dist/cjs/lucide-react-native.js'),
          type: 'sourceFile',
        };
      }
      // Ensure we forward to the default resolver for everything else
      return context.resolveRequest(context, moduleName, platform);
    },
  },
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