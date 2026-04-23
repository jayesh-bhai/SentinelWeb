@echo off
echo ========================================
echo SentinelWeb Frontend Agent Build Script
echo ========================================
echo.

echo [1/2] Building frontend-agent...
cd agents\frontend-agent
call npm run build
if %errorlevel% neq 0 (
    echo ERROR: Build failed!
    pause
    exit /b %errorlevel%
)
cd ..\..

echo.
echo [2/2] Copying bundle to sandbox-v2...
copy /Y agents\frontend-agent\dist\index.umd.js sandbox-v2\public\sentinel-frontend-agent.js
if %errorlevel% neq 0 (
    echo ERROR: Copy failed!
    pause
    exit /b %errorlevel%
)

echo.
echo ========================================
echo Build Complete!
echo ========================================
echo Agent bundle updated at:
echo   sandbox-v2\public\sentinel-frontend-agent.js
echo.
echo You can now test at: http://localhost:3000
pause
