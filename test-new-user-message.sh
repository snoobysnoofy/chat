#!/bin/bash

# Test script to simulate new user sending a message
# This tests the fix for: "when a new user sends me a message, i dont see the message until i refresh the page"

echo "🧪 Testing new user message scenario..."

# Base URL
BASE_URL="http://localhost:5000/api"

echo "1. Creating test users..."

# Create first user (alice)
ALICE_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "alice_test",
    "email": "alice@test.com", 
    "password": "password123"
  }')

echo "Alice registration: $ALICE_RESPONSE"

# Create second user (bob)
BOB_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "bob_test",
    "email": "bob@test.com",
    "password": "password123"
  }')

echo "Bob registration: $BOB_RESPONSE"

# Login alice
ALICE_LOGIN=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice@test.com",
    "password": "password123"
  }')

ALICE_TOKEN=$(echo "$ALICE_LOGIN" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
ALICE_ID=$(echo "$ALICE_LOGIN" | grep -o '"id":[0-9]*' | cut -d':' -f2)

echo "Alice logged in, token: ${ALICE_TOKEN:0:20}..."

# Login bob
BOB_LOGIN=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "bob@test.com",
    "password": "password123"
  }')

BOB_TOKEN=$(echo "$BOB_LOGIN" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
BOB_ID=$(echo "$BOB_LOGIN" | grep -o '"id":[0-9]*' | cut -d':' -f2)

echo "Bob logged in, token: ${BOB_TOKEN:0:20}..."

echo ""
echo "2. Bob creates a conversation with Alice..."

# Bob creates conversation with Alice
CONVERSATION_RESPONSE=$(curl -s -X POST "$BASE_URL/messages/conversations" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $BOB_TOKEN" \
  -d "{\"otherUserId\": $ALICE_ID}")

echo "Conversation creation: $CONVERSATION_RESPONSE"

CONV_ID=$(echo "$CONVERSATION_RESPONSE" | grep -o '"id":[0-9]*' | cut -d':' -f2)

echo "Conversation ID: $CONV_ID"

echo ""
echo "3. Bob sends first message to Alice..."

# Bob sends message to Alice
MESSAGE_RESPONSE=$(curl -s -X POST "$BASE_URL/messages/conversations/$CONV_ID/messages" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $BOB_TOKEN" \
  -d '{"content": "Hey Alice! This is Bob sending you a message. You should see this in real-time!"}')

echo "Message sent: $MESSAGE_RESPONSE"

echo ""
echo "4. Checking Alice's conversations..."

# Check Alice's conversations
ALICE_CONVERSATIONS=$(curl -s -X GET "$BASE_URL/messages/conversations" \
  -H "Authorization: Bearer $ALICE_TOKEN")

echo "Alice's conversations: $ALICE_CONVERSATIONS"

echo ""
echo "5. Checking messages in the conversation..."

# Check messages in conversation
MESSAGES=$(curl -s -X GET "$BASE_URL/messages/conversations/$CONV_ID/messages" \
  -H "Authorization: Bearer $ALICE_TOKEN")

echo "Messages: $MESSAGES"

echo ""
echo "✅ Test complete!"
echo ""
echo "📝 What to check:"
echo "   1. In the browser (logged in as Alice), you should see the new conversation appear without refresh"
echo "   2. The message from Bob should appear in real-time"
echo "   3. Alice should be able to reply and Bob should see it immediately"
echo ""
echo "🔧 If messages don't appear in real-time, the socket broadcasting fix needs adjustment"
