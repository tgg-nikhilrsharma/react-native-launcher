const reactNativeLauncher = require('./react-native-launcher');
const launcherConfig = require('./launcher.json');

module.exports = {
    ...reactNativeLauncher,
    launcherConfig
};