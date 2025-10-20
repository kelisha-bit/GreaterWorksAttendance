@echo off
echo ========================================
echo  Greater Works Attendance Tracker
echo  Deployment Script
echo ========================================
echo.

echo Step 1: Building application...
echo.
call npm run build

if %errorlevel% neq 0 (
    echo.
    echo ERROR: Build failed!
    echo Please fix the errors and try again.
    pause
    exit /b 1
)

echo.
echo ========================================
echo Build successful!
echo ========================================
echo.

echo Step 2: Deploying to Firebase...
echo.
call firebase deploy

if %errorlevel% neq 0 (
    echo.
    echo ERROR: Deployment failed!
    echo Please check your Firebase configuration.
    pause
    exit /b 1
)

echo.
echo ========================================
echo Deployment Complete!
echo ========================================
echo.
echo Your app is now live at:
echo https://gwccapp-fc67c.web.app
echo.
echo Press any key to exit...
pause > nul
