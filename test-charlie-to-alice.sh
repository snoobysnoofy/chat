#!/bin/bash

# Clean test for new user message scenario
echo "🧪 Testing: New user sends message to existing user..."

BASE_URL="http://localhost:5000/api"

# Use existing users (from previous test) - Alice (ID: 5) and Bob (ID: 6)
# Login alice
ALICE_LOGIN=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice@test.com",
    "password": "password123"
  }')

ALICE_TOKEN=$(echo "$ALICE_LOGIN" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
ALICE_ID=$(echo "$ALICE_LOGIN" | grep -o '"id":[0-9]*' | cut -d':' -f2)

echo "Alice ID: $ALICE_ID"

# Login bob
BOB_LOGIN=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "bob@test.com",
    "password": "password123"
  }')

BOB_TOKEN=$(echo "$BOB_LOGIN" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
BOB_ID=$(echo "$BOB_LOGIN" | grep -o '"id":[0-9]*' | cut -d':' -f2)

echo "Bob ID: $BOB_ID"

# Create a third user (Charlie) who will send a message to Alice
echo "Creating Charlie..."
CHARLIE_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "charlie_test",
    "email": "charlie@test.com", 
    "password": "password123"
  }')

CHARLIE_TOKEN=$(echo "$CHARLIE_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
CHARLIE_ID=$(echo "$CHARLIE_RESPONSE" | grep -o '"id":[0-9]*' | cut -d':' -f2)

echo "Charlie ID: $CHARLIE_ID"

echo ""
echo "🎯 Scenario: Charlie (new user) sends first message to Alice"
echo "   Expected: Alice should see the message in real-time without refresh"

echo ""
echo "Step 1: Charlie creates conversation with Alice..."

CONVERSATION_RESPONSE=$(curl -s -X POST "$BASE_URL/messages/conversations" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $CHARLIE_TOKEN" \
  -d "{\"otherUserId\": $ALICE_ID}")

CONV_ID=$(echo "$CONVERSATION_RESPONSE" | grep -o '"id":[0-9]*' | cut -d':' -f2)
echo "New conversation ID: $CONV_ID"

echo ""
echo "Step 2: Charlie sends first message..."

MESSAGE_RESPONSE=$(curl -s -X POST "$BASE_URL/messages/conversations/$CONV_ID/messages" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $CHARLIE_TOKEN" \
  -d '{"content": "Hi Alice! This is Charlie. You should see this message appear in real-time!"}')

echo "Message sent: $MESSAGE_RESPONSE"

echo ""
echo "✅ Test completed!"
echo ""
echo "👀 Check the browser where Alice is logged in:"
echo "   - The conversation with Charlie should appear automatically"
echo "   - The message should be visible without refreshing"
echo ""
echo "📊 Check server logs for:"
echo "   - 'Message sent to user X personal room' messages"
echo "   - 'newConversation' event broadcasts"
