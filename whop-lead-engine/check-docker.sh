#!/bin/bash

echo "Checking Docker status..."

max_attempts=30
attempt=1

while [ $attempt -le $max_attempts ]; do
    if docker info >/dev/null 2>&1; then
        echo "✅ Docker is running!"
        echo ""
        echo "You can now run the demo:"
        echo "./quick-demo.sh"
        exit 0
    fi
    
    echo "⏳ Waiting for Docker to start... (attempt $attempt/$max_attempts)"
    sleep 3
    ((attempt++))
done

echo "❌ Docker failed to start within expected time"
echo "Please manually start Docker Desktop and try again"
exit 1