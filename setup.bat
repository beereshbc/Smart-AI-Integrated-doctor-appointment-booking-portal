@echo off
REM Quick Setup Script for AI Doctor Recommendation System (Windows)
REM Run this to get everything started in one go!

setlocal enabledelayedexpansion

cls
echo.
echo ===========================================================
echo  Horse AI Doctor Recommendation System - Quick Setup
echo ===========================================================
echo.

REM Check Python installation
echo Checking Python installation...
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python not found! Please install Python 3.9+
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('python --version') do set PYTHON_VERSION=%%i
echo [OK] %PYTHON_VERSION%

REM Check Node.js installation
echo Checking Node.js installation...
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js not found! Please install Node.js 16+
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo [OK] Node.js %NODE_VERSION%

REM Setup Python AI Service
echo.
echo Setting up Python AI Service...
cd backend\ai

if not exist "venv" (
    echo Creating virtual environment...
    python -m venv venv
)

echo [OK] Virtual environment ready

echo Installing Python dependencies...
call venv\Scripts\activate.bat
pip install -q -r requirements.txt
echo [OK] Python dependencies installed

cd ..\..

REM Setup Node.js Backend
echo.
echo Setting up Node.js Backend...
cd backend

if not exist "node_modules" (
    echo Installing Node.js dependencies...
    call npm install -q
    echo [OK] Backend dependencies installed
) else (
    echo [OK] Backend dependencies already installed
)

cd ..

REM Setup Frontend
echo.
echo Setting up Frontend...
cd frontend

if not exist "node_modules" (
    echo Installing frontend dependencies...
    call npm install -q
    echo [OK] Frontend dependencies installed
) else (
    echo [OK] Frontend dependencies already installed
)

cd ..

REM Setup Admin Panel
echo.
echo Setting up Admin Panel...
cd admin

if not exist "node_modules" (
    echo Installing admin dependencies...
    call npm install -q
    echo [OK] Admin dependencies installed
) else (
    echo [OK] Admin dependencies already installed
)

cd ..

REM Summary
cls
echo.
echo ===========================================================
echo  SETUP COMPLETE!
echo ===========================================================
echo.
echo Next steps - run these in separate terminals (Command Prompt or PowerShell):
echo.
echo Terminal 1 - Start Python AI Service:
echo   cd backend\ai
echo   venv\Scripts\activate
echo   python app.py
echo.
echo Terminal 2 - Start Node.js Backend:
echo   cd backend
echo   npm start
echo.
echo Terminal 3 - Start React Frontend:
echo   cd frontend
echo   npm run dev
echo.
echo Terminal 4 - Start Admin Panel:
echo   cd admin
echo   npm run dev
echo.
echo Then open in your browser:
echo   Patient Portal: http://localhost:5173
echo   Admin Panel: http://localhost:5174
echo   Backend API: http://localhost:4000
echo   AI Service: http://localhost:5000
echo.
echo ===========================================================
echo.
pause
