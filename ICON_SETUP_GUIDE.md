# FRY VPN Client - Icon Setup Guide

## Overview
This guide will help you change the application and installer icons to use the FRY logo.

## Current Configuration
The application is already configured to use icons from:
- **Application Icon**: `resources/icon.ico`
- **Installer Icon**: `resources/icon.ico` (configured in `electron-builder.yml`)

## Steps to Change the Icon

### Step 1: Convert SVG to ICO
The FRY logo is located at: `src/renderer/src/assets/logo.svg`

You have several options to convert it to ICO format:

#### Option A: Online Converters (Recommended)
1. Open the SVG file in a web browser: `src/renderer/src/assets/logo.svg`
2. Take a screenshot or save as PNG (256x256 pixels recommended)
3. Use an online converter:
   - https://convertio.co/png-ico/
   - https://www.icoconverter.com/
   - https://favicon.io/favicon-converter/

#### Option B: ImageMagick (Command Line)
If you have ImageMagick installed:
```bash
magick convert src/renderer/src/assets/logo.svg -resize 256x256 resources/icon.ico
```

#### Option C: Using Node.js Script
Run the provided conversion script:
```bash
node convert-icon.js
```

### Step 2: Replace the Icon File
1. Save the converted ICO file as `resources/icon.ico`
2. Make sure the file is 256x256 pixels for best quality

### Step 3: Verify Configuration
The icon is configured in these files:
- `electron-builder.yml` (lines 35-36):
  ```yaml
  installerIcon: resources/icon.ico
  uninstallerIcon: resources/icon.ico
  ```

### Step 4: Test the Icon
1. Build the application:
   ```bash
   npm run build:win
   ```
2. Check that the installer and application show the FRY logo

## Icon Requirements
- **Format**: ICO (Windows icon format)
- **Size**: 256x256 pixels (recommended)
- **Location**: `resources/icon.ico`
- **Transparency**: Supported (if your logo has transparent background)

## Troubleshooting

### Icon Not Showing
1. Make sure the ICO file is in the correct location: `resources/icon.ico`
2. Verify the file is a valid ICO format
3. Try clearing the build cache: `rm -rf out/ dist/`

### Icon Quality Issues
1. Use 256x256 resolution for best quality
2. Ensure the original SVG is high quality
3. Avoid excessive compression during conversion

### Build Errors
1. Check that the ICO file path is correct
2. Verify the electron-builder.yml configuration
3. Make sure the file is not corrupted

## Additional Notes
- The icon will be used for both the installer and the installed application
- Windows will automatically scale the icon for different display contexts
- The same icon is used for both installer and uninstaller
- For macOS, you would need a .icns file instead of .ico

## Quick Commands
```bash
# Build with new icon
npm run build:win

# Check if icon file exists
ls -la resources/icon.ico

# Run conversion helper
node convert-icon.js
```

## Support
If you encounter issues:
1. Check the electron-builder documentation
2. Verify the ICO file format
3. Ensure the file path is correct in the configuration 