@echo off
setlocal
cd /d %~dp0

echo ======================================================
echo   Patient Chart System - Build and Preview (Prod)
echo ======================================================

where node >nul 2>nul
if errorlevel 1 (
  echo [!] Node.js not found. Install Node.js 18+ and retry.
  pause
  exit /b 1
)

git config --global --add safe.directory "%cd%" >nul 2>nul

if not exist node_modules (
  echo [*] Installing dependencies...
  call npm ci
  if errorlevel 1 (
    echo [!] npm install failed.
    pause
    exit /b 1
  )
)

echo [*] Building production bundle...
call npm run build
if errorlevel 1 (
  echo [!] Build failed.
  pause
  exit /b 1
)

echo [*] Starting preview server...
call npm run preview

endlocal
