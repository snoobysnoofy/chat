#!/bin/bash

echo "🏗️  Building Messenger App for Production..."

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "client" ] || [ ! -d "server" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm run install:all

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

# Build client
echo "🔨 Building React client for production..."
cd client
NODE_ENV=production npm run build

if [ $? -ne 0 ]; then
    echo "❌ Failed to build client"
    exit 1
fi

cd ..

echo "✅ Build complete!"
echo ""
echo "📁 Client build files are in: client/build/"
echo "🚀 Ready for deployment!"
echo ""
echo "Next steps:"
echo "1. Set up your production environment variables"
echo "2. Deploy the entire project to your hosting service"
echo "3. Make sure to set NODE_ENV=production on your server"
echo ""
echo "For Docker deployment:"
echo "  docker build -t messenger-app ."
echo "  docker run -p 5000:5000 messenger-app"
