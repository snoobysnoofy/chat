#!/bin/bash

echo "🚀 Starting Messenger App in Production Mode..."

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "server" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Check if client is built
if [ ! -d "client/build" ]; then
    echo "⚠️  Client not built. Building now..."
    ./build-prod.sh
fi

# Set production environment
export NODE_ENV=production

# Check if .env.production exists
if [ ! -f "server/.env.production" ]; then
    echo "⚠️  Production environment file not found"
    echo "📝 Creating from example..."
    cp server/.env.example server/.env.production
    echo "✏️  Please edit server/.env.production with your production values"
    read -p "Press Enter to continue after editing the file..."
fi

echo "🔧 Loading production environment..."
export $(grep -v '^#' server/.env.production | xargs)

echo "🌐 Starting server on port ${PORT:-5000}..."
cd server && npm start
