const { FusesPlugin } = require('@electron-forge/plugin-fuses');
const { FuseV1Options, FuseVersion } = require('@electron/fuses');

module.exports = {
  packagerConfig: {
    asar: true,
    name: 'Faez PM',
    executableName: 'faezpm',
    appBundleId: 'com.faez.faezpm',
    appCategoryType: 'public.app-category.productivity',
    icon: './public/icon', // Assumes you have icon files (icon.icns for macOS)
    osxSign: false, // Set to true if you have code signing certificates
    osxNotarize: false, // Set to true if you want to notarize for distribution
    // Include the Next.js build output as extra resource (outside asar)
    extraResource: [
      './out'
    ],
    // Exclude unnecessary files
    ignore: [
      /^\/src/,     // Don't include source files
      /^\/\.next/,  // Don't include Next.js dev build
      /^\/out/,     // Don't include in asar (we're using extraResource)
      /^\/node_modules\/\.cache/, // Don't include cache
      /\.git/,      // Don't include git
      /\.DS_Store/, // Don't include macOS files
    ]
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {},
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin'],
      config: {
        name: 'faezpm-macos'
      }
    },
    {
      name: '@electron-forge/maker-dmg',
      platforms: ['darwin'],
      config: {
        name: 'Faez PM',
        title: 'Faez PM Installer'
      }
    },
    {
      name: '@electron-forge/maker-deb',
      config: {},
    },
    {
      name: '@electron-forge/maker-rpm',
      config: {},
    },
  ],
  plugins: [
    {
      name: '@electron-forge/plugin-auto-unpack-natives',
      config: {},
    },
    // Fuses are used to enable/disable various Electron functionality
    // at package time, before code signing the application
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
};
