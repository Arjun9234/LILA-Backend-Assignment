@echo off
REM Quick Start Script for Tic-Tac-Toe Multiplayer Game (Windows)
REM This script sets up and runs the entire application

echo.
echo 🎮 Tic-Tac-Toe Multiplayer Game - Quick Start
echo ==============================================
echo.

REM Check if Docker is installed
docker --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker is not installed. Please install Docker Desktop first.
    echo    Visit: https://docs.docker.com/desktop/install/windows-install/
    pause
    exit /b 1
)

REM Check if Docker Compose is installed
docker-compose --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker Compose is not installed. Please install Docker Compose first.
    pause
    exit /b 1
)

echo ✅ Docker and Docker Compose are installed
echo.

REM Build Nakama modules
echo 📦 Building Nakama server modules...
cd nakama\data\modules

npm --version >nul 2>&1
if errorlevel 1 (
    echo ⚠️  npm is not installed. Skipping module build.
    echo    Please install Node.js 18+ and run: npm install ^&^& npm run build
    echo    in the nakama\data\modules directory
) else (
    call npm install
    call npm run build
    echo ✅ Nakama modules built successfully
)

cd ..\..\..
echo.

REM Create .env file if it doesn't exist
if not exist .env (
    echo 📝 Creating .env file...
    copy .env.example .env >nul
    echo ✅ .env file created
)

echo.
echo 🐳 Starting Docker containers...
echo.

REM Start Docker Compose
docker-compose up -d

echo.
echo ⏳ Waiting for services to be ready...
timeout /t 10 /nobreak >nul

echo.
echo ✅ Services should be running!
echo.
echo 📱 Access the application:
echo    🎮 Game Frontend:  http://localhost
echo    🎛️  Nakama Console: http://localhost:7351
echo       Username: admin
echo       Password: password
echo.
echo 🧪 To test multiplayer:
echo    1. Open http://localhost in two browser windows
echo    2. Select the same game mode in both windows
echo    3. Click 'Find Match' in both windows
echo    4. Play against yourself!
echo.
echo 📊 View logs:
echo    docker-compose logs -f
echo.
echo 🛑 Stop the application:
echo    docker-compose down
echo.
echo 🎉 Happy gaming!
echo.
pause
