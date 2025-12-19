@echo off
setlocal enabledelayedexpansion

echo ========================================
echo Building FRY VPN Client
echo ========================================

echo.
echo Checking Node.js installation...
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo Node.js found: 
node --version

echo.
echo Checking npm installation...
npm --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: npm is not installed or not in PATH
    pause
    exit /b 1
)

echo npm found:
npm --version

echo.
echo ========================================
echo Step 1: Installing dependencies...
echo ========================================
npm install
if errorlevel 1 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo ========================================
echo Step 2: Building the application...
echo ========================================
npm run build
if errorlevel 1 (
    echo ERROR: Failed to build the application
    pause
    exit /b 1
)

echo.
echo ========================================
echo Step 3: Creating executable...
echo ========================================
npm run build:win
if errorlevel 1 (
    echo ERROR: Failed to create executable
    pause
    exit /b 1
)

echo.
echo ========================================
echo Build completed successfully!
echo ========================================
echo.
echo Check the dist-electron folder for the installer:
echo - FRY-VPN-Client-1.0.0-setup.exe
echo.
echo If the build failed, try running these commands manually:
echo 1. npm install
echo 2. npm run build
echo 3. npm run build:win
echo.
pause 