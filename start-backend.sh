#!/bin/bash

# School Exam Management System - Backend Startup Script

echo "🏫 School Exam Management System - Backend Setup"
echo "================================================"

# Check if we're in the right directory
if [ ! -d "backend" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Check for Docker
if command -v docker &> /dev/null; then
    echo "✅ Docker found"
    
    # Try docker compose (v2)
    if docker compose version &> /dev/null; then
        echo "✅ Docker Compose v2 found"
        COMPOSE_CMD="docker compose"
    # Try docker-compose (v1)
    elif command -v docker-compose &> /dev/null; then
        echo "✅ Docker Compose v1 found"
        COMPOSE_CMD="docker-compose"
    else
        echo "⚠️  Docker Compose not found, will try manual setup"
        COMPOSE_CMD=""
    fi
    
    if [ -n "$COMPOSE_CMD" ]; then
        echo ""
        echo "🚀 Starting services with Docker..."
        $COMPOSE_CMD up -d
        
        if [ $? -eq 0 ]; then
            echo ""
            echo "✅ Services started successfully!"
            echo ""
            echo "📡 API available at: http://localhost:3000"
            echo "🗄️  Database running on port: 5432"
            echo ""
            echo "To view logs: $COMPOSE_CMD logs -f"
            echo "To stop: $COMPOSE_CMD down"
            exit 0
        else
            echo "❌ Failed to start with Docker, trying manual setup..."
        fi
    fi
fi

# Manual setup without Docker
echo ""
echo "🔧 Setting up manually..."

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js 18+"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d 'v' -f 2 | cut -d '.' -f 1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js 18+ required. Found: $(node -v)"
    exit 1
fi
echo "✅ Node.js $(node -v) found"

# Check PostgreSQL
if command -v psql &> /dev/null; then
    echo "✅ PostgreSQL client found"
else
    echo "⚠️  PostgreSQL client not found. Make sure PostgreSQL is installed and running."
fi

# Install backend dependencies
echo ""
echo "📦 Installing backend dependencies..."
cd backend
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

# Create .env if not exists
if [ ! -f ".env" ]; then
    echo ""
    echo "📝 Creating .env file..."
    cat > .env << EOF
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=school_exam_db
NODE_ENV=development
PORT=3000
EOF
    echo "✅ Created .env file"
fi

echo ""
echo "🚀 Starting NestJS server..."
echo "   Make sure PostgreSQL is running and the database is set up!"
echo ""
echo "   To set up the database manually:"
echo "   1. psql -U postgres -c 'CREATE DATABASE school_exam_db;'"
echo "   2. psql -U postgres -d school_exam_db -f src/database/init.sql"
echo ""

npm run start:dev
