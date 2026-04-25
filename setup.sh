#!/bin/bash
# Quick Setup Script for AI Doctor Recommendation System
# Run this to get everything started in one go!

set -e

echo "═══════════════════════════════════════════════════════════"
echo "🏥 AI Doctor Recommendation System - Quick Setup"
echo "═══════════════════════════════════════════════════════════"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_info() {
    echo -e "${YELLOW}ℹ${NC} $1"
}

# Check Python installation
echo ""
echo "Checking Python installation..."
if ! command -v python &> /dev/null; then
    echo -e "${RED}✗${NC} Python not found! Please install Python 3.9+"
    exit 1
fi
print_status "Python found: $(python --version)"

# Check Node.js installation
echo ""
echo "Checking Node.js installation..."
if ! command -v node &> /dev/null; then
    echo -e "${RED}✗${NC} Node.js not found! Please install Node.js 16+"
    exit 1
fi
print_status "Node.js found: $(node --version)"

# Setup Python AI Service
echo ""
echo "Setting up Python AI Service..."
cd backend/ai

if [ ! -d "venv" ]; then
    print_info "Creating virtual environment..."
    python -m venv venv
fi

# Activate virtual environment
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    print_info "Windows detected - using Windows activation"
    source venv/Scripts/activate
else
    print_info "Unix-like system detected - using Unix activation"
    source venv/bin/activate
fi

print_status "Virtual environment activated"

print_info "Installing Python dependencies (this may take a few minutes)..."
pip install -q -r requirements.txt
print_status "Python dependencies installed"

cd ../..

# Setup Node.js Backend
echo ""
echo "Setting up Node.js Backend..."
cd backend

if [ ! -d "node_modules" ]; then
    print_info "Installing Node.js dependencies..."
    npm install -q
    print_status "Node.js dependencies installed"
else
    print_status "Node.js dependencies already installed"
fi

cd ..

# Setup Frontend
echo ""
echo "Setting up Frontend..."
cd frontend

if [ ! -d "node_modules" ]; then
    print_info "Installing frontend dependencies..."
    npm install -q
    print_status "Frontend dependencies installed"
else
    print_status "Frontend dependencies already installed"
fi

cd ..

# Setup Admin Panel
echo ""
echo "Setting up Admin Panel..."
cd admin

if [ ! -d "node_modules" ]; then
    print_info "Installing admin dependencies..."
    npm install -q
    print_status "Admin dependencies installed"
else
    print_status "Admin dependencies already installed"
fi

cd ..

# Summary
echo ""
echo "═══════════════════════════════════════════════════════════"
echo -e "${GREEN}✓ Setup Complete!${NC}"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "Next steps - run these in separate terminals:"
echo ""
echo "Terminal 1 - Start Python AI Service:"
echo -e "  ${YELLOW}cd backend/ai && source venv/bin/activate && python app.py${NC}"
echo ""
echo "Terminal 2 - Start Node.js Backend:"
echo -e "  ${YELLOW}cd backend && npm start${NC}"
echo ""
echo "Terminal 3 - Start React Frontend:"
echo -e "  ${YELLOW}cd frontend && npm run dev${NC}"
echo ""
echo "Terminal 4 - Start Admin Panel:"
echo -e "  ${YELLOW}cd admin && npm run dev${NC}"
echo ""
echo "Then open:"
echo "  🌐 Patient Portal: http://localhost:5173"
echo "  🔧 Admin Panel: http://localhost:5174"
echo "  💻 Backend API: http://localhost:4000"
echo "  🤖 AI Service: http://localhost:5000"
echo ""
echo "═══════════════════════════════════════════════════════════"
