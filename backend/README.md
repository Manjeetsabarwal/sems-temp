# School Exam Management System - Backend

NestJS + PostgreSQL + Docker backend for the School Exam Management System.

## Prerequisites

- Node.js 18+ (for local development)
- Docker & Docker Compose (for containerized deployment)
- PostgreSQL 15+ (if running locally without Docker)

## Quick Start with Docker

### 1. Start all services (PostgreSQL + NestJS API)

```bash
# From the project root directory
docker-compose up -d
```

This will:
- Start PostgreSQL database on port 5432
- Initialize database with sample data
- Start NestJS API on port 3000

### 2. Verify services are running

```bash
# Check containers
docker-compose ps

# Check API health
curl http://localhost:3000/api/students
```

### 3. Stop services

```bash
docker-compose down

# To also remove volumes (database data)
docker-compose down -v
```

## Local Development (without Docker)

### 1. Install dependencies

```bash
cd backend
npm install
```

### 2. Set up environment variables

Create a `.env` file in the backend directory:

```env
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=school_exam_db
NODE_ENV=development
PORT=3000
```

### 3. Set up PostgreSQL database

Make sure PostgreSQL is running locally, then:

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE school_exam_db;

# Exit psql
\q

# Run the initialization script
psql -U postgres -d school_exam_db -f src/database/init.sql
```

### 4. Start the development server

```bash
npm run start:dev
```

The API will be available at `http://localhost:3000`

## API Endpoints

### Academic Years
- `GET /api/academic-years` - List all academic years
- `GET /api/academic-years/current` - Get current academic year
- `GET /api/academic-years/:id` - Get single academic year
- `POST /api/academic-years` - Create academic year
- `PATCH /api/academic-years/:id` - Update academic year
- `DELETE /api/academic-years/:id` - Delete academic year

### Classes
- `GET /api/classes` - List all classes
- `GET /api/classes/dropdown` - Get classes for dropdown
- `GET /api/classes/:id` - Get single class
- `POST /api/classes` - Create class
- `POST /api/classes/bulk-delete` - Bulk delete classes
- `PATCH /api/classes/:id` - Update class
- `DELETE /api/classes/:id` - Delete class

### Sections
- `GET /api/sections` - List all sections
- `GET /api/sections/dropdown` - Get sections for dropdown
- `GET /api/sections/by-class/:classId` - Get sections by class
- `GET /api/sections/:id` - Get single section
- `POST /api/sections` - Create section
- `PATCH /api/sections/:id` - Update section
- `DELETE /api/sections/:id` - Delete section

### Teachers
- `GET /api/teachers` - List all teachers
- `GET /api/teachers/dropdown` - Get teachers for dropdown
- `GET /api/teachers/:id` - Get single teacher
- `POST /api/teachers` - Create teacher
- `POST /api/teachers/bulk-delete` - Bulk delete teachers
- `PATCH /api/teachers/:id` - Update teacher
- `DELETE /api/teachers/:id` - Delete teacher

### Students
- `GET /api/students` - List all students
- `GET /api/students/by-class-section` - Get students by class and section
- `GET /api/students/:id` - Get single student
- `POST /api/students` - Create student
- `POST /api/students/bulk-delete` - Bulk delete students
- `PATCH /api/students/:id` - Update student
- `DELETE /api/students/:id` - Delete student

### Subjects
- `GET /api/subjects` - List all subjects
- `GET /api/subjects/dropdown` - Get subjects for dropdown
- `GET /api/subjects/by-class/:classId` - Get subjects by class
- `GET /api/subjects/:id` - Get single subject
- `POST /api/subjects` - Create subject
- `POST /api/subjects/bulk-delete` - Bulk delete subjects
- `PATCH /api/subjects/:id` - Update subject
- `DELETE /api/subjects/:id` - Delete subject

### Exams
- `GET /api/exams` - List all exams
- `GET /api/exams/dropdown` - Get exams for dropdown
- `GET /api/exams/by-class/:classId` - Get exams by class
- `GET /api/exams/:id` - Get single exam
- `POST /api/exams` - Create exam
- `POST /api/exams/bulk-delete` - Bulk delete exams
- `PATCH /api/exams/:id` - Update exam
- `DELETE /api/exams/:id` - Delete exam

### Marks
- `GET /api/marks` - List all marks
- `GET /api/marks/by-student/:studentId` - Get marks by student
- `GET /api/marks/by-exam/:examId` - Get marks by exam
- `GET /api/marks/by-student-exam` - Get marks by student and exam
- `GET /api/marks/:id` - Get single mark
- `POST /api/marks` - Create mark
- `POST /api/marks/bulk-delete` - Bulk delete marks
- `PATCH /api/marks/:id` - Update mark
- `DELETE /api/marks/:id` - Delete mark

## Query Parameters

Most list endpoints support the following query parameters:

- `status` - Filter by status (e.g., "Active", "Inactive")
- `search` - Search by name or ID
- `classId` - Filter by class ID
- `sectionId` - Filter by section ID

Example:
```
GET /api/students?classId=10&sectionId=10-A&search=rahul
```

## Database Schema

The database consists of 8 main tables:
- `academic_years` - Academic year records
- `classes` - Class/grade levels
- `sections` - Sections within classes
- `teachers` - Teacher records
- `students` - Student records
- `subjects` - Subject/course records
- `exams` - Exam records
- `marks` - Student marks/scores

See `src/database/init.sql` for the complete schema.

## Project Structure

```
backend/
├── src/
│   ├── config/
│   │   └── database.config.ts
│   ├── database/
│   │   └── init.sql
│   ├── modules/
│   │   ├── academic-years/
│   │   ├── classes/
│   │   ├── sections/
│   │   ├── teachers/
│   │   ├── students/
│   │   ├── subjects/
│   │   ├── exams/
│   │   └── marks/
│   ├── app.module.ts
│   └── main.ts
├── Dockerfile
├── package.json
└── tsconfig.json
```

## Troubleshooting

### Database connection failed
- Make sure PostgreSQL is running
- Check the connection settings in `.env`
- Verify the database exists

### Port already in use
- Change the PORT in `.env`
- Or stop the process using the port

### Docker issues
```bash
# View logs
docker-compose logs -f

# Rebuild containers
docker-compose up --build

# Reset everything
docker-compose down -v
docker-compose up -d
```
