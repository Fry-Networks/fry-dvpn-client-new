# FRY VPN Client - Build Guide

## Prerequisites

1. **Node.js** (v16 or higher)
   - Download from: https://nodejs.org/
   - Verify installation: `node --version`

2. **npm** (comes with Node.js)
   - Verify installation: `npm --version`

3. **Git** (optional, for cloning)
   - Download from: https://git-scm.com/

## Build Methods

### Method 1: Automated Build Scripts

#### Windows Batch Script
```bash
# Double-click or run in Command Prompt
build.bat
```

#### PowerShell Script
```powershell
# Right-click and "Run with PowerShell" or run in PowerShell
.\build.ps1
```

### Method 2: Manual Commands

Open Command Prompt or PowerShell in the project directory and run:

```bash
# Step 1: Install dependencies
npm install

# Step 2: Build the application
npm run build

# Step 3: Create Windows executable
npm run build:win
```

### Method 3: All Platforms

```bash
# Build for all platforms (Windows, macOS, Linux)
npm run dist
```

## Build Output

After successful build, you'll find the installer in:
- **Windows**: `dist-electron/FRY-VPN-Client-1.0.0-setup.exe`
- **macOS**: `dist-electron/FRY-VPN-Client-1.0.0.dmg`
- **Linux**: `dist-electron/FRY-VPN-Client-1.0.0.AppImage`

## Troubleshooting

### Common Issues

#### 1. "Node.js is not recognized"
- **Solution**: Install Node.js from https://nodejs.org/
- **Verify**: Run `node --version` in Command Prompt

#### 2. "npm is not recognized"
- **Solution**: Reinstall Node.js (npm comes with it)
- **Verify**: Run `npm --version` in Command Prompt

#### 3. Build fails with dependency errors
```bash
# Clear npm cache and reinstall
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

#### 4. Electron download fails
```bash
# Set Electron mirror (for China/Asia)
npm config set electron_mirror https://npmmirror.com/mirrors/electron/
npm install
```

#### 5. Permission errors on Windows
- Run Command Prompt as Administrator
- Or use PowerShell with elevated privileges

#### 6. Build script not working
- Try running commands manually (Method 2)
- Check if you're in the correct directory
- Ensure all files are present

### Manual Build Steps

If automated scripts fail, follow these steps manually:

1. **Open Command Prompt as Administrator**

2. **Navigate to project directory**
   ```bash
   cd path\to\fry-vpn-client
   ```

3. **Install dependencies**
   ```bash
   npm install
   ```

4. **Build the application**
   ```bash
   npm run build
   ```

5. **Create executable**
   ```bash
   npm run build:win
   ```

6. **Check output**
   - Look for `dist-electron` folder
   - Find `FRY-VPN-Client-1.0.0-setup.exe`

### Debug Information

To get more detailed error information:

```bash
# Verbose npm install
npm install --verbose

# Verbose build
npm run build --verbose

# Verbose electron-builder
npm run build:win --verbose
```

## File Structure After Build

```
fry-vpn-client/
├── dist-electron/           # Build output
│   ├── FRY-VPN-Client-1.0.0-setup.exe
│   ├── win-unpacked/       # Unpacked Windows app
│   └── ...
├── out/                    # Electron build
├── dist/                   # React build
└── ...
```

## Distribution

The generated `FRY-VPN-Client-1.0.0-setup.exe` is a complete installer that:
- Installs the application
- Creates desktop shortcuts
- Adds to Start Menu
- Includes WireGuard binaries
- Provides uninstaller

## Support

If you encounter issues:
1. Check this troubleshooting guide
2. Try manual build steps
3. Check console output for specific errors
4. Ensure all prerequisites are installed 