const fs = require('fs');
const path = require('path');

const launcherConfig = {
    "ios": {
        "icon": "app/assets/icons/logo.png"
    },
    "android": {
        "icon": "app/assets/icons/logo.png"
    }
};

const launcherConfigPath = path.resolve(process.cwd(), 'launcher.json');

// Check if launcher.json already exists
if (!fs.existsSync(launcherConfigPath)) {
    // Write the launcherConfig to launcher.json
    fs.writeFileSync(launcherConfigPath, JSON.stringify(launcherConfig, null, 2));
    console.log('launcher.json file created successfully.');
} else {
    console.log('launcher.json file already exists. Skipping creation.');
}
