# FRY VPN Client Build Script (PowerShell)
Write-Host "========================================" -ForegroundColor Green
Write-Host "Building FRY VPN Client" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green

# Check Node.js installation
Write-Host "`nChecking Node.js installation..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "Node.js found: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Node.js is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install Node.js from https://nodejs.org/" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Check npm installation
Write-Host "`nChecking npm installation..." -ForegroundColor Yellow
try {
    $npmVersion = npm --version
    Write-Host "npm found: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "ERROR: npm is not installed or not in PATH" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Step 1: Install dependencies
Write-Host "`n========================================" -ForegroundColor Green
Write-Host "Step 1: Installing dependencies..." -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
try {
    npm install
    if ($LASTEXITCODE -ne 0) {
        throw "npm install failed"
    }
} catch {
    Write-Host "ERROR: Failed to install dependencies" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Step 2: Build the application
Write-Host "`n========================================" -ForegroundColor Green
Write-Host "Step 2: Building the application..." -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
try {
    npm run build
    if ($LASTEXITCODE -ne 0) {
        throw "npm run build failed"
    }
} catch {
    Write-Host "ERROR: Failed to build the application" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Step 3: Create executable
Write-Host "`n========================================" -ForegroundColor Green
Write-Host "Step 3: Creating executable..." -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
try {
    npm run build:win
    if ($LASTEXITCODE -ne 0) {
        throw "npm run build:win failed"
    }
} catch {
    Write-Host "ERROR: Failed to create executable" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Success message
Write-Host "`n========================================" -ForegroundColor Green
Write-Host "Build completed successfully!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Check the dist-electron folder for the installer:" -ForegroundColor Cyan
Write-Host "- FRY-VPN-Client-1.0.0-setup.exe" -ForegroundColor Cyan
Write-Host ""
Write-Host "If the build failed, try running these commands manually:" -ForegroundColor Yellow
Write-Host "1. npm install" -ForegroundColor Yellow
Write-Host "2. npm run build" -ForegroundColor Yellow
Write-Host "3. npm run build:win" -ForegroundColor Yellow
Write-Host ""

Read-Host "Press Enter to exit" 