@echo off
REM Quick Start Script for PWA LET Backend (Windows)
REM This script sets up and starts the backend server

echo.
echo 🚀 PWA LET Backend - Quick Start
echo ==================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js is not installed. Please install from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if npm is installed
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ npm is not installed.
    pause
    exit /b 1
)

echo ✅ Node.js found: 
node --version

echo ✅ npm found:
npm --version

echo.

REM Check if backend directory exists
if not exist "backend" (
    echo ❌ Backend directory not found!
    pause
    exit /b 1
)

cd backend

REM Install dependencies
echo.
echo 📦 Installing dependencies...
call npm install

if %ERRORLEVEL% NEQ 0 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)

echo ✅ Dependencies installed

REM Create .env if it doesn't exist
if not exist ".env" (
    echo.
    echo 📝 Creating .env file from template...
    copy .env.example .env >nul
    echo ✅ .env created (update database credentials if needed)
)

REM Create uploads directory
if not exist "uploads" mkdir uploads

REM Start the server
echo.
echo 🔥 Starting server...
echo ==================================
echo 📍 Server will run on http://localhost:5000
echo 📡 API: http://localhost:5000/api/v1
echo ==================================
echo.

call npm run dev

pause
