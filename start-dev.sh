#!/bin/bash

# Development server quick start script

echo "🚀 Starting PHP File Manager Development Environment"
echo ""

# Check if dist/filemanager.php exists
if [ ! -f "dist/filemanager.php" ]; then
    echo "📦 Building project for the first time..."
    node build.js
    echo ""
fi

# Start PHP built-in server
echo "🌐 Starting PHP development server at http://localhost:8000"
echo "📝 Default credentials: admin / admin"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

cd dist && php -S localhost:8000 filemanager.php
