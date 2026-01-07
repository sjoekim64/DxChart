@echo off
setlocal

:: Change to script directory
cd /d %~dp0

:: Title
echo ======================================================
echo   Patient Chart System - One Click Start (Dev)
echo ======================================================

:: Check Node
where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo [!] Node.js not found. Please install Node.js 18+ from:
  echo     https://nodejs.org/en/download
  echo After installation, run this script again.
  pause
  exit /b 1
)

:: Mark this folder as safe for Git (first run only)
git config --global --add safe.directory "%cd%" >nul 2>nul

:: Install deps only if node_modules missing
if not exist node_modules (
  echo.
  echo [*] Installing dependencies (first run only)...
  call npm ci
  if errorlevel 1 (
    echo.
    echo [!] npm install failed. Check your internet connection and try again.
    pause
    exit /b 1
  )
)

:: Start dev server
echo.
echo [*] Starting dev server...
call npm run dev

endlocal
