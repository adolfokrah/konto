module.exports = {
  project: {
    ios: {},
    android: {}, // disable Android platform auto linking
  },
  dependencies: {
    'expo-modules-core': {
      platforms: {
        android: {
          sourceDir: '../node_modules/expo-modules-core/android',
          packageImportPath: 'expo.core.ExpoModulesPackage',
        },
      },
    },
  },
};
