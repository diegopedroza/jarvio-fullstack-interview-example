#!/bin/bash

echo "🚀 Starting Workflow Builder Application..."

# Check if setup has been run
if [ ! -d "frontend/node_modules" ]; then
    echo "❌ Please run setup first: ./setup.sh"
    exit 1
fi

# Start all services
echo "🔧 Starting all services..."
docker-compose up -d

echo "✅ Application is starting up!"
echo ""
echo "🌐 Frontend: http://localhost:3000"
echo "🔧 Backend API: http://localhost:8080"
echo "📚 API Documentation: http://localhost:8080/docs"
echo ""
echo "💡 Demo credentials:"
echo "   Email: demo@example.com"
echo "   Password: demo123"
echo ""
echo "📋 To stop the application, run: docker-compose down"