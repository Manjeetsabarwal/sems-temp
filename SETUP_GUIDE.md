# School Exam Management System - Complete Setup Guide

This guide will help you set up the complete School Exam Management System with NestJS backend, PostgreSQL database, and React frontend.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    School Exam Management System             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────┐     ┌─────────────────┐              │
│  │                 │     │                 │              │
│  │  React Frontend │────▶│  NestJS Backend │              │
│  │  (Port 5173)    │     │  (Port 3000)    │              │
│  │                 │     │                 │              │
│  └─────────────────┘     └────────┬────────┘              │
│                                   │                        │
│                                   ▼                        │
│                          ┌─────────────────┐              │
│                          │                 │              │
│                          │   PostgreSQL    │              │
│                          │   (Port 5432)   │              │
│                          │                 │              │
│                          └─────────────────┘              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Prerequisites

- **Node.js** v18 or higher
- **Docker** and **Docker Compose** (recommended)
- **npm** or **pnpm**

## Quick Start (Recommended)

### Step 1: Start the Backend with Docker

```bash
# From the project root directory
docker-compose up -d
```

This command will:
1. Start PostgreSQL database on port 5432
2. Initialize the database with sample data (15 students, 5 teachers, 15 subjects, 3 exams)
3. Start the NestJS API server on port 3000

### Step 2: Verify Backend is Running

```bash
# Check if containers are running
docker-compose ps

# Test the API
curl http://localhost:3000/api/students
```

You should see a JSON response with student data.

### Step 3: Start the Frontend

```bash
# Install frontend dependencies (if not already done)
npm install

# Start the development server
npm run dev
```

The frontend will be available at `http://localhost:5173`

### Step 4: Access the Application

Open your browser and go to:
- **Frontend:** http://localhost:5173
- **API:** http://localhost:3000/api

## Manual Setup (Without Docker)

### Backend Setup

1. **Install PostgreSQL** on your system

2. **Create the database:**
   ```bash
   psql -U postgres
   CREATE DATABASE school_exam_db;
   \q
   ```

3. **Run the initialization script:**
   ```bash
   psql -U postgres -d school_exam_db -f backend/src/database/init.sql
   ```

4. **Install backend dependencies:**
   ```bash
   cd backend
   npm install
   ```

5. **Create environment file:**
   ```bash
   cp env.example .env
   # Edit .env with your database credentials
   ```

6. **Start the backend:**
   ```bash
   npm run start:dev
   ```

### Frontend Setup

1. **Install dependencies:**
   ```bash
   # From project root
   npm install
   ```

2. **Start development server:**
   ```bash
   npm run dev
   ```

## Environment Configuration

### Backend (.env)

```env
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=school_exam_db
NODE_ENV=development
PORT=3000
```

### Frontend (optional)

Create `vite.config.ts` or use environment variables:

```env
VITE_API_URL=http://localhost:3000
```

## Available Commands

### Docker Commands

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Reset database
docker-compose down -v
docker-compose up -d
```

### Backend Commands

```bash
cd backend

# Development mode (with hot reload)
npm run start:dev

# Production mode
npm run build
npm run start:prod
```

### Frontend Commands

```bash
# Development mode
npm run dev

# Production build
npm run build
```

## Sample Data

The system comes pre-loaded with sample data:

### Academic Years
- 2024-2025 (Current)
- 2025-2026 (Upcoming)

### Classes
- Class 9, 10, 11, 12

### Sections
- 10-A, 10-B, 11-A, 11-B, 12-A, 9-A

### Teachers
- 5 teachers with different subjects

### Students
- 15 students across different classes

### Subjects
- 15 subjects (5 per class for grades 10, 11, 12)

### Exams
- 3 exams with marks data

## Troubleshooting

### "Cannot connect to database"
1. Make sure PostgreSQL is running
2. Check database credentials in `.env`
3. Verify the database exists

### "Port already in use"
```bash
# Find process using the port
lsof -i :3000
# or
netstat -tulpn | grep 3000

# Kill the process
kill -9 <PID>
```

### "CORS error"
The backend is configured to allow requests from:
- http://localhost:5173
- http://localhost:3001
- http://127.0.0.1:5173

If your frontend runs on a different port, update `src/main.ts` in the backend.

### "Docker containers not starting"
```bash
# Check logs
docker-compose logs

# Rebuild containers
docker-compose build --no-cache
docker-compose up -d
```

## API Testing

You can test the API endpoints using curl or any API client:

```bash
# Get all students
curl http://localhost:3000/api/students

# Get students filtered by class
curl "http://localhost:3000/api/students?classId=10"

# Create a new student
curl -X POST http://localhost:3000/api/students \
  -H "Content-Type: application/json" \
  -d '{
    "studentId": "STU100",
    "name": "Test Student",
    "classId": "10",
    "sectionId": "10-A",
    "rollNo": 50
  }'

# Update a student
curl -X PATCH http://localhost:3000/api/students/STU100 \
  -H "Content-Type: application/json" \
  -d '{"name": "Updated Name"}'

# Delete a student
curl -X DELETE http://localhost:3000/api/students/STU100
```

## Support

For issues and questions:
1. Check the troubleshooting section above
2. Review the logs: `docker-compose logs -f`
3. Check the backend README: `backend/README.md`
