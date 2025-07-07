#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}🌐 Messenger App Network Access Information${NC}"
echo ""
echo -e "${BLUE}Local Access:${NC}"
echo -e "${YELLOW}   Frontend: http://localhost:3000${NC}"
echo -e "${YELLOW}   Backend:  http://localhost:5000${NC}"
echo ""
echo -e "${BLUE}Network Access (for other devices):${NC}"

# Get all non-internal IPv4 addresses
ip addr show | grep -oP '(?<=inet\s)\d+(\.\d+){3}' | grep -v 127.0.0.1 | while read ip; do
    echo -e "${YELLOW}   Frontend: http://$ip:3000${NC}"
    echo -e "${YELLOW}   Backend:  http://$ip:5000${NC}"
    echo ""
done

echo -e "${BLUE}📱 To access from other devices:${NC}"
echo -e "1. Connect your device to the same WiFi network"
echo -e "2. Use one of the network URLs above"
echo -e "3. Register/login on the device"
echo -e "4. Start chatting in real-time!"
