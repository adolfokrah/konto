const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Add the monorepo paths
const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '..');

config.watchFolders = [monorepoRoot];
config.resolver.platforms = [...config.resolver.platforms, 'native', 'android', 'ios'];

// Configure node_modules resolution
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

// Ensure expo-modules-core is resolved correctly
config.resolver.alias = {
  ...config.resolver.alias,
  'expo-modules-core': path.resolve(projectRoot, 'node_modules/expo-modules-core'),
};

module.exports = config;
