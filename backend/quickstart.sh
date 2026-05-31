#!/bin/bash
# Quick Start Script for PWA LET Backend
# This script sets up and starts the backend server

echo "🚀 PWA LET Backend - Quick Start"
echo "=================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install from https://nodejs.org/"
    exit 1
fi

# Check if MySQL is installed
if ! command -v mysql &> /dev/null; then
    echo "❌ MySQL is not installed. Please install from https://dev.mysql.com/"
    exit 1
fi

echo "✅ Node.js found: $(node --version)"
echo "✅ MySQL found: $(mysql --version)"

# Navigate to backend directory
if [ ! -d "backend" ]; then
    echo "❌ Backend directory not found!"
    exit 1
fi

cd backend

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

if [ $? -eq 0 ]; then
    echo "✅ Dependencies installed"
else
    echo "❌ Failed to install dependencies"
    exit 1
fi

# Create .env if it doesn't exist
if [ ! -f ".env" ]; then
    echo ""
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "✅ .env created (update database credentials if needed)"
fi

# Create uploads directory
mkdir -p uploads

# Start the server
echo ""
echo "🔥 Starting server..."
echo "=================================="
echo "📍 Server will run on http://localhost:5000"
echo "📡 API: http://localhost:5000/api/v1"
echo "=================================="
echo ""

npm run dev
