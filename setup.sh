#!/bin/bash

echo "🚀 Setting up Workflow Builder Application..."

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Build images
echo "📦 Building Docker images..."
docker-compose build

# Start services
echo "🔧 Starting services..."
docker-compose up -d postgres

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
sleep 10

# Run database migrations
echo "📊 Running database migrations..."
docker-compose exec -T backend alembic revision --autogenerate -m "Initial migration"
docker-compose exec -T backend alembic upgrade head

# Seed the database
echo "🌱 Seeding database with sample data..."
docker-compose exec -T backend python seed_data.py

# Install frontend dependencies and generate lock file
echo "📦 Installing frontend dependencies..."
cd frontend && npm install && cd ..

# Build frontend image to generate a proper package-lock.json
echo "📦 Building frontend image..."
docker-compose build frontend

echo "✅ Setup complete! You can now run the application with:"
echo "   ./run.sh"