// Learn more: https://docs.expo.dev/guides/customizing-metro/
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Firebase JS SDK (v11+) quebra com o "package exports" do Metro que o Expo SDK 53+
// liga por padrao. Sem isto o app builda mas CRASHA ao abrir com
// "Component auth has not been registered yet".
// https://github.com/expo/expo/issues/36588
config.resolver.sourceExts.push('cjs');
config.resolver.unstable_enablePackageExports = false;

module.exports = config;
