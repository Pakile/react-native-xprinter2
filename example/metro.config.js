const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const path = require('path');

const root = path.resolve(__dirname, '..');
const pak = require('../package.json');
const modules = Object.keys({
  ...pak.peerDependencies,
});

const config = {
  watchFolders: [root],
  resolver: {
    blockList: modules.map(
      (m) =>
        new RegExp(
          `^${path.join(root, 'node_modules', m).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/.*$`
        )
    ),
    extraNodeModules: {
      ...modules.reduce((acc, name) => {
        acc[name] = path.join(__dirname, 'node_modules', name);
        return acc;
      }, {}),
      [pak.name]: root,
    },
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
