#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Starting Messenger App...${NC}"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed. Please install Node.js to continue.${NC}"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm is not installed. Please install npm to continue.${NC}"
    exit 1
fi

# Function to install dependencies
install_deps() {
    local dir=$1
    local name=$2
    
    echo -e "${YELLOW}📦 Installing $name dependencies...${NC}"
    cd "$dir"
    
    if npm install; then
        echo -e "${GREEN}✅ $name dependencies installed successfully${NC}"
    else
        echo -e "${RED}❌ Failed to install $name dependencies${NC}"
        exit 1
    fi
    
    cd ..
}

# Install root dependencies
echo -e "${YELLOW}📦 Installing root dependencies...${NC}"
if npm install; then
    echo -e "${GREEN}✅ Root dependencies installed successfully${NC}"
else
    echo -e "${RED}❌ Failed to install root dependencies${NC}"
    exit 1
fi

# Install server dependencies
install_deps "server" "server"

# Install client dependencies  
install_deps "client" "client"

echo -e "${GREEN}🎉 All dependencies installed successfully!${NC}"
echo ""
echo -e "${BLUE}Starting development servers...${NC}"
echo -e "${YELLOW}📝 Backend will run on: http://localhost:5000${NC}"
echo -e "${YELLOW}🌐 Frontend will run on: http://localhost:3000${NC}"
echo ""
echo -e "${GREEN}📱 Network Access:${NC}"
echo -e "${YELLOW}   Backend API: http://$(hostname -I | awk '{print $1}'):5000${NC}"
echo -e "${YELLOW}   Frontend: http://$(hostname -I | awk '{print $1}'):3000${NC}"
echo ""
echo -e "${BLUE}Use the network URLs above to access from other devices on your network${NC}"
echo -e "${BLUE}Press Ctrl+C to stop both servers${NC}"
echo ""

# Start both servers using npm run dev
npm run dev
