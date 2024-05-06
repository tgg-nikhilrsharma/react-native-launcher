const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');


// Function to check if yarn is available
function isYarnAvailable() {
    try {
        execSync('yarn --version', { stdio: 'ignore' });
        return true;
    } catch (err) {
        return false;
    }
}

// Function to check if a package is installed
function isPackageInstalled(packageName) {
    try {
        if (isYarnAvailable()) {
            execSync(`yarn info --name-only ${packageName}`);
        } else {
            execSync(`npm list ${packageName}`);
        }
        return true;
    } catch (err) {
        return false;
    }
}

// Function to install a package if not already installed
function installPackageIfNotInstalled(packageName) {
    if (!isPackageInstalled(packageName)) {
        console.log(`Installing ${packageName}...`);
        try {
            if (isYarnAvailable()) {
                execSync(`yarn add ${packageName}`);
            } else {
                execSync(`npm install ${packageName}`);
            }
            console.log(`${packageName} installed successfully.`);
        } catch (err) {
            console.error(`Error installing ${packageName}:`, err);
        }
    } else {
        console.log(`${packageName} is already installed.`);
    }
}

// Function to install a package if not already installed
function unInstallPackageIfNotInstalled(packageName) {
    if (isPackageInstalled(packageName)) {
        console.log(`Uninstalling ${packageName}...`);
        try {
            if (isYarnAvailable()) {
                execSync(`yarn remove ${packageName}`);
            } else {
                execSync(`npm uninstall ${packageName}`);
            }
            console.log(`${packageName} uninstalled successfully.`);
        } catch (err) {
            console.error(`Error uninstalling ${packageName}:`, err);
        }
    } else {
        console.log(`${packageName} is already uninstalled.`);
    }
}

// Install required dependencies if not already installed
installPackageIfNotInstalled('sharp');
installPackageIfNotInstalled('fs-extra');
installPackageIfNotInstalled('xml2js');

// Read package.json to get appName
const sharp = require('sharp');
const xml2js = require('xml2js');
const packageJson = require('./package.json');
const appName = packageJson.name;

const { ios, android } = require('./launcher.json');

// Input directories
const logoPathAndroid = android.icon;
const logoPathIos = ios.icon;
const androidManifestPath = `android/app/src/main/AndroidManifest.xml`;
const iosIconFolder = `ios/${appName}/Images.xcassets/AppIcon.appiconset`;

// Output directories
const mipmapOutputDir = `android/app/src/main/res`;

// Icon sizes for mipmap
const iconSizes = [
    { name: 'mipmap-mdpi', size: 48 },
    { name: 'mipmap-hdpi', size: 72 },
    { name: 'mipmap-xhdpi', size: 96 },
    { name: 'mipmap-xxhdpi', size: 144 },
    { name: 'mipmap-xxxhdpi', size: 192 },
];

// Icon sizes for iOS app icon
const iosIconSizes = [
    { size: 20, scale: 2, idiom: 'iphone' },
    { size: 20, scale: 3, idiom: 'iphone' },
    { size: 29, scale: 2, idiom: 'iphone' },
    { size: 29, scale: 1, idiom: 'iphone' },
    { size: 29, scale: 3, idiom: 'iphone' },
    { size: 40, scale: 2, idiom: 'iphone' },
    { size: 40, scale: 3, idiom: 'iphone' },
    { size: 57, scale: 1, idiom: 'iphone' },
    { size: 57, scale: 2, idiom: 'iphone' },
    { size: 60, scale: 2, idiom: 'iphone' },
    { size: 60, scale: 3, idiom: 'iphone' },
    { size: 1024, scale: 1, idiom: 'iphone' },
    { size: 20, scale: 1, idiom: 'ipad' },
    { size: 20, scale: 2, idiom: 'ipad' },
    { size: 29, scale: 1, idiom: 'ipad' },
    { size: 29, scale: 2, idiom: 'ipad' },
    { size: 40, scale: 1, idiom: 'ipad' },
    { size: 40, scale: 2, idiom: 'ipad' },
    { size: 50, scale: 1, idiom: 'ipad' },
    { size: 50, scale: 2, idiom: 'ipad' },
    { size: 72, scale: 1, idiom: 'ipad' },
    { size: 72, scale: 2, idiom: 'ipad' },
    { size: 76, scale: 2, idiom: 'ipad' },
    { size: 76, scale: 1, idiom: 'ipad' },
    { size: 83.5, scale: 2, idiom: 'ipad' },
];

// Function to generate mipmap icons
async function generateMipmapIcons(inputPath, outputPath, isRound = false) {
    try {
        // Ensure output directory exists
        await fs.ensureDir(outputPath);

        // Loop through each icon size and resize the input image
        await Promise.all(iconSizes.map(async (icon) => {
            // Resize image
            const image = sharp(inputPath)
                .resize(icon.size, icon.size);

            // Apply rounding if specified
            if (isRound) {
                // Create rounded mask
                const mask = Buffer.from(
                    `<svg><rect x="0" y="0" width="${icon.size}" height="${icon.size}" rx="${icon.size * 0.1}" ry="${icon.size * 0.1}"/></svg>`
                );

                // Apply rounded mask
                image.composite([{ input: mask, blend: 'dest-in' }]);
            }

            // Save icon
            await image.png().toFile(path.join(outputPath, icon.name, isRound ? 'ic_launcher_round.png' : 'ic_launcher.png'));
        }));

        console.log(`${isRound ? 'Rounded' : 'Regular'} mipmap icons generated successfully.`);
    } catch (err) {
        console.error(`Error generating ${isRound ? 'rounded' : 'regular'} mipmap icons:`, err);
    }
}

// Function to generate iOS app icons
async function generateiOSIcons(inputPath, outputFolder) {
    try {
        // Ensure output directory exists
        await fs.ensureDir(outputFolder);

        // Create Contents.json
        const contentsJson = {
            "images": [],
            "info": {
                "version": 1,
                "author": "xcode"
            }
        };

        // Loop through each icon size and scale the input image
        await Promise.all(iosIconSizes.map(async (icon) => {
            const filename = `${Math.ceil(icon.size * icon.scale)}.png`;
            const filepath = path.join(outputFolder, filename);
            const sizeObj = {
                size: `${Math.ceil(icon.size * icon.scale)}x${Math.ceil(icon.size * icon.scale)}`,
                idiom: icon.idiom,
                filename: filename,
                scale: `${icon.scale}x`
            };

            // Resize image
            await sharp(inputPath)
                .resize(Math.ceil(icon.size * icon.scale))
                .toFile(filepath);

            // Add to Contents.json
            contentsJson.images.push(sizeObj);
        }));

        // Write Contents.json
        await fs.writeFile(path.join(outputFolder, 'Contents.json'), JSON.stringify(contentsJson, null, 2));

        console.log('iOS icons generated successfully.');
    } catch (err) {
        console.error('Error generating iOS icons:', err);
    }
}

// Function to update AndroidManifest.xml
function updateAndroidManifest(androidManifestPath, newIconName, isRound = false) {
    fs.readFile(androidManifestPath, 'utf8', (err, data) => {
        if (err) {
            console.error("Error reading AndroidManifest.xml:", err);
            return;
        }

        // Parse XML data
        xml2js.parseString(data, (err, result) => {
            if (err) {
                console.error("Error parsing AndroidManifest.xml:", err);
                return;
            }

            // Update icon attribute
            result['manifest']['application'][0]['$']['android:icon'] = `@mipmap/${newIconName}`;

            // Convert JSON back to XML
            const builder = new xml2js.Builder();
            const xml = builder.buildObject(result);

            // Write updated XML to file
            fs.writeFile(androidManifestPath, xml, (err) => {
                if (err) {
                    console.error("Error writing to AndroidManifest.xml:", err);
                    return;
                }
                console.log(`AndroidManifest.xml updated successfully with ${isRound ? 'rounded' : 'regular'} icon.`);
            });
        });
    });
}

// Execute functions
(async () => {
    // Generate regular mipmap icons
    await generateMipmapIcons(logoPathAndroid, mipmapOutputDir);

    // Generate rounded mipmap icons
    await generateMipmapIcons(logoPathAndroid, mipmapOutputDir, true);

    // Generate iOS icons
    await generateiOSIcons(logoPathIos, iosIconFolder);

    // Update AndroidManifest.xml with new icon names
    const newIconName = 'ic_launcher';
    const newRoundIconName = 'ic_launcher_round';
    updateAndroidManifest(androidManifestPath, newIconName);
    updateAndroidManifest(androidManifestPath, newRoundIconName, true);

    // uninstall required dependencies if not already installed
    setTimeout(() => {
        unInstallPackageIfNotInstalled('xml2js');
        unInstallPackageIfNotInstalled('fs-extra');
        unInstallPackageIfNotInstalled('sharp');
    }, 8000);
})();
