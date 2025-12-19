@echo off
echo FRY VPN Client - Logo Change Helper
echo ===================================
echo.
echo Current logo files in resources folder:
dir resources\*.ico resources\*.png 2>nul
echo.
echo To change the logo:
echo 1. Replace resources/icon.ico with your new logo
echo 2. Or replace resources/logo.png and update the config
echo 3. Run: npm run build:win
echo.
echo Press any key to continue...
pause >nul 