#!/bin/bash

# Quick Start Script for Tic-Tac-Toe Multiplayer Game
# This script sets up and runs the entire application

set -e

echo "🎮 Tic-Tac-Toe Multiplayer Game - Quick Start"
echo "=============================================="
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    echo "   Visit: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    echo "   Visit: https://docs.docker.com/compose/install/"
    exit 1
fi

echo "✅ Docker and Docker Compose are installed"
echo ""

# Build Nakama modules
echo "📦 Building Nakama server modules..."
cd nakama/data/modules

if ! command -v npm &> /dev/null; then
    echo "⚠️  npm is not installed. Skipping module build."
    echo "   Please install Node.js 18+ and run: npm install && npm run build"
    echo "   in the nakama/data/modules directory"
else
    npm install
    npm run build
    echo "✅ Nakama modules built successfully"
fi

cd ../../..
echo ""

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cp .env.example .env
    echo "✅ .env file created"
fi

echo ""
echo "🐳 Starting Docker containers..."
echo ""

# Start Docker Compose
docker-compose up -d

echo ""
echo "⏳ Waiting for services to be ready..."
sleep 10

# Check if services are running
if docker-compose ps | grep -q "Up"; then
    echo ""
    echo "✅ All services are running!"
    echo ""
    echo "📱 Access the application:"
    echo "   🎮 Game Frontend:  http://localhost"
    echo "   🎛️  Nakama Console: http://localhost:7351"
    echo "      Username: admin"
    echo "      Password: password"
    echo ""
    echo "🧪 To test multiplayer:"
    echo "   1. Open http://localhost in two browser windows"
    echo "   2. Select the same game mode in both windows"
    echo "   3. Click 'Find Match' in both windows"
    echo "   4. Play against yourself!"
    echo ""
    echo "📊 View logs:"
    echo "   docker-compose logs -f"
    echo ""
    echo "🛑 Stop the application:"
    echo "   docker-compose down"
    echo ""
    echo "🎉 Happy gaming!"
else
    echo ""
    echo "❌ Some services failed to start. Check logs with:"
    echo "   docker-compose logs"
    echo ""
    exit 1
fi
