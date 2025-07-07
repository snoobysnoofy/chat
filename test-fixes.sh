#!/bin/bash

echo "==================================="
echo "  TESTING MESSENGER APP FIXES"
echo "==================================="
echo

echo "Testing Backend API Health..."
curl -s http://localhost:5000/api/health | jq .

echo
echo "Testing Network Access..."
curl -s http://192.168.72.109:5000/api/health | jq .

echo
echo "Testing CORS Configuration..."
echo "CORS Headers:"
curl -H "Origin: http://192.168.72.109:3000" -s -I http://192.168.72.109:5000/api/health | grep -i "access-control"

echo
echo "Current Time: $(date -Iseconds)"
echo

echo "Key Fixes Applied:"
echo "✅ Socket connections now update is_online status in database"
echo "✅ All timestamps now use ISO format (instead of SQLite CURRENT_TIMESTAMP)"
echo "✅ Real-time online/offline status updates via socket events"
echo "✅ Frontend listens for userOnline/userOffline events"
echo "✅ Proper timezone handling for timestamps"
echo "✅ CORS configuration fixed for network access"

echo
echo "To test the fixes:"
echo "1. Open http://192.168.72.109:3000 in two browsers"
echo "2. Login with different accounts"
echo "3. Check online status indicators"
echo "4. Send messages and verify timestamps are correct"
echo "5. Close one browser and check if user goes offline"

echo
echo "==================================="
