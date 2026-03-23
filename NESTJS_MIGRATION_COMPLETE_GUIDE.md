# 🎓 SEMS - NestJS + PostgreSQL Local Setup Guide

## Complete Migration from Figma Make (Supabase) to NestJS Backend

This guide provides **everything** you need to run your School Exam Management System locally with NestJS backend and PostgreSQL database, maintaining **exact same functionality, design, and behavior**.

---

## 📋 Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Prerequisites](#prerequisites)
3. [Project Structure](#project-structure)
4. [Backend Setup (NestJS)](#backend-setup-nestjs)
5. [Database Setup (PostgreSQL)](#database-setup-postgresql)
6. [Frontend Migration](#frontend-migration)
7. [Running the Application](#running-the-application)
8. [Feature Mapping](#feature-mapping)
9. [Testing Guide](#testing-guide)

---

## 🏗️ Architecture Overview

### Current Architecture (Figma Make)
```
Frontend (React + Vite) → Supabase Edge Functions → Supabase PostgreSQL
```

### New Architecture (Local)
```
Frontend (React + Vite) → NestJS REST API → PostgreSQL
```

### Key Changes
- **Supabase Client** → **Axios HTTP Client**
- **Supabase Edge Functions** → **NestJS Controllers/Services**
- **Supabase Auth** → **JWT Authentication (NestJS Passport)**
- **Real-time Subscriptions** → **Polling or WebSockets (optional)**

---

## 🔧 Prerequisites

### Required Software
```bash
# Node.js (v18 or higher)
node --version  # Should be >= 18.0.0

# PostgreSQL (v14 or higher)
psql --version  # Should be >= 14.0

# npm or yarn
npm --version   # Should be >= 8.0.0
```

### Install PostgreSQL
```bash
# macOS (using Homebrew)
brew install postgresql@14
brew services start postgresql@14

# Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql

# Windows
# Download from: https://www.postgresql.org/download/windows/
```

---

## 📁 Project Structure

```
sems-local/
├── backend/                    # NestJS Backend
│   ├── src/
│   │   ├── modules/
│   │   │   ├── academic-years/
│   │   │   ├── classes/
│   │   │   ├── sections/
│   │   │   ├── students/
│   │   │   ├── teachers/
│   │   │   ├── subjects/
│   │   │   ├── exams/
│   │   │   └── marks/
│   │   ├── config/
│   │   ├── database/
│   │   ├── auth/
│   │   └── main.ts
│   ├── package.json
│   └── .env
│
└── frontend/                   # React Frontend
    ├── src/
    │   ├── app/
    │   │   ├── components/
    │   │   ├── services/       # Updated to use Axios
    │   │   ├── hooks/
    │   │   └── App.tsx
    │   └── styles/
    ├── package.json
    └── .env
```

---

## 🚀 Backend Setup (NestJS)

### Step 1: Create NestJS Project

```bash
# Create backend directory
mkdir sems-local && cd sems-local

# Install NestJS CLI globally
npm install -g @nestjs/cli

# Create new NestJS project
nest new backend

# Choose npm as package manager
# cd into backend directory
cd backend
```

### Step 2: Install Dependencies

```bash
# Database & ORM
npm install @nestjs/typeorm typeorm pg

# Authentication
npm install @nestjs/passport passport passport-jwt @nestjs/jwt bcrypt
npm install --save-dev @types/passport-jwt @types/bcrypt

# Validation
npm install class-validator class-transformer

# Configuration
npm install @nestjs/config

# CORS & Security
npm install helmet

# Utilities
npm install uuid
npm install --save-dev @types/uuid
```

### Step 3: Environment Configuration

Create `backend/.env`:
```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password_here
DB_NAME=sems_db

# Application
PORT=3001
NODE_ENV=development

# JWT Authentication
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRATION=7d

# CORS
CORS_ORIGIN=http://localhost:5173
```

### Step 4: Database Configuration

Create `backend/src/config/database.config.ts`:
```typescript
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

export const getDatabaseConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => ({
  type: 'postgres',
  host: configService.get('DB_HOST'),
  port: configService.get('DB_PORT'),
  username: configService.get('DB_USERNAME'),
  password: configService.get('DB_PASSWORD'),
  database: configService.get('DB_NAME'),
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  synchronize: false, // We'll use migrations
  logging: true,
});
```

### Step 5: Main Application Setup

Update `backend/src/main.ts`:
```typescript
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Security
  app.use(helmet());

  // CORS
  app.enableCors({
    origin: configService.get('CORS_ORIGIN'),
    credentials: true,
  });

  // Global validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // API prefix
  app.setGlobalPrefix('api');

  const port = configService.get('PORT') || 3001;
  await app.listen(port);
  
  console.log(`🚀 SEMS Backend running on http://localhost:${port}`);
  console.log(`📊 Database: ${configService.get('DB_NAME')}`);
}

bootstrap();
```

---

## 💾 Database Setup (PostgreSQL)

### Step 1: Create Database

```bash
# Login to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE sems_db;

# Connect to database
\c sems_db

# Exit
\q
```

### Step 2: Run Database Schema

The SQL schema is already perfect in your `DATABASE_SETUP_FRESH.sql`. We just need to remove the `_2fbe5237` suffix for local development.

Create `backend/database/schema.sql`:
```sql
-- ============================================
-- SEMS - School Exam Management System
-- Local PostgreSQL Setup
-- ============================================

-- Clean slate
DROP TABLE IF EXISTS marks CASCADE;
DROP TABLE IF EXISTS subjects CASCADE;
DROP TABLE IF EXISTS exams CASCADE;
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS teachers CASCADE;
DROP TABLE IF EXISTS sections CASCADE;
DROP TABLE IF EXISTS classes CASCADE;
DROP TABLE IF EXISTS academic_years CASCADE;

-- 1. ACADEMIC YEARS TABLE
CREATE TABLE academic_years (
  id TEXT PRIMARY KEY,
  year_name TEXT NOT NULL UNIQUE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_current BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Completed', 'Upcoming')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. CLASSES TABLE
CREATE TABLE classes (
  class_id TEXT PRIMARY KEY,
  class_name TEXT NOT NULL,
  academic_year_id TEXT,
  class_teacher_id TEXT,
  total_students INTEGER DEFAULT 0,
  status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (academic_year_id) REFERENCES academic_years(id) ON DELETE SET NULL
);

-- 3. SECTIONS TABLE
CREATE TABLE sections (
  section_id TEXT PRIMARY KEY,
  section_name TEXT NOT NULL,
  class_id TEXT NOT NULL,
  capacity INTEGER DEFAULT 40,
  current_strength INTEGER DEFAULT 0,
  status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (class_id) REFERENCES classes(class_id) ON DELETE CASCADE,
  UNIQUE(class_id, section_name)
);

-- 4. TEACHERS TABLE
CREATE TABLE teachers (
  teacher_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  subjects TEXT[] DEFAULT '{}',
  classes TEXT[] DEFAULT '{}',
  qualification TEXT,
  experience INTEGER DEFAULT 0,
  joining_date DATE,
  status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive', 'On Leave')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 5. STUDENTS TABLE
CREATE TABLE students (
  student_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  class_id TEXT NOT NULL,
  section_id TEXT NOT NULL,
  roll_no INTEGER NOT NULL,
  date_of_birth DATE,
  gender TEXT CHECK (gender IN ('Male', 'Female', 'Other')),
  email TEXT,
  phone TEXT,
  parent_name TEXT,
  parent_phone TEXT,
  parent_email TEXT,
  address TEXT,
  admission_date DATE DEFAULT CURRENT_DATE,
  status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive', 'Graduated', 'Transferred')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (class_id) REFERENCES classes(class_id) ON DELETE RESTRICT,
  FOREIGN KEY (section_id) REFERENCES sections(section_id) ON DELETE RESTRICT,
  UNIQUE(class_id, section_id, roll_no)
);

-- 6. SUBJECTS TABLE
CREATE TABLE subjects (
  subject_id TEXT PRIMARY KEY,
  subject_name TEXT NOT NULL,
  subject_code TEXT NOT NULL UNIQUE,
  class_id TEXT NOT NULL,
  teacher_id TEXT,
  description TEXT,
  credits INTEGER DEFAULT 1,
  hours_per_week INTEGER DEFAULT 4,
  status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (class_id) REFERENCES classes(class_id) ON DELETE CASCADE,
  FOREIGN KEY (teacher_id) REFERENCES teachers(teacher_id) ON DELETE SET NULL
);

-- 7. EXAMS TABLE
CREATE TABLE exams (
  exam_id TEXT PRIMARY KEY,
  exam_name TEXT NOT NULL,
  exam_type TEXT NOT NULL CHECK (exam_type IN ('Mid-Term', 'Final', 'Unit Test', 'Quarterly', 'Half-Yearly', 'Annual')),
  academic_year TEXT NOT NULL,
  class_id TEXT NOT NULL,
  term TEXT NOT NULL CHECK (term IN ('Term 1', 'Term 2', 'Term 3')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_marks INTEGER DEFAULT 100,
  passing_marks INTEGER DEFAULT 40,
  subjects JSONB DEFAULT '[]'::jsonb,
  description TEXT,
  status TEXT DEFAULT 'Scheduled' CHECK (status IN ('Scheduled', 'Ongoing', 'Completed', 'Cancelled')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (class_id) REFERENCES classes(class_id) ON DELETE CASCADE,
  CHECK (end_date >= start_date)
);

-- 8. MARKS TABLE
CREATE TABLE marks (
  mark_id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL,
  exam_id TEXT NOT NULL,
  subject_id TEXT NOT NULL,
  marks_obtained NUMERIC(5,2) NOT NULL CHECK (marks_obtained >= 0),
  total_marks INTEGER DEFAULT 100 CHECK (total_marks > 0),
  percentage NUMERIC(5,2) GENERATED ALWAYS AS ((marks_obtained / total_marks) * 100) STORED,
  grade TEXT,
  remarks TEXT,
  is_absent BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'Draft' CHECK (status IN ('Draft', 'Published')),
  entered_by TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE,
  FOREIGN KEY (exam_id) REFERENCES exams(exam_id) ON DELETE CASCADE,
  FOREIGN KEY (subject_id) REFERENCES subjects(subject_id) ON DELETE CASCADE,
  UNIQUE(student_id, exam_id, subject_id),
  CHECK (marks_obtained <= total_marks)
);

-- INDEXES FOR PERFORMANCE
CREATE INDEX idx_students_class ON students(class_id);
CREATE INDEX idx_students_section ON students(section_id);
CREATE INDEX idx_students_name ON students(name);
CREATE INDEX idx_students_status ON students(status);

CREATE INDEX idx_exams_class ON exams(class_id);
CREATE INDEX idx_exams_status ON exams(status);
CREATE INDEX idx_exams_start_date ON exams(start_date);
CREATE INDEX idx_exams_academic_year ON exams(academic_year);

CREATE INDEX idx_marks_student ON marks(student_id);
CREATE INDEX idx_marks_exam ON marks(exam_id);
CREATE INDEX idx_marks_subject ON marks(subject_id);
CREATE INDEX idx_marks_status ON marks(status);

CREATE INDEX idx_subjects_class ON subjects(class_id);
CREATE INDEX idx_subjects_teacher ON subjects(teacher_id);

CREATE INDEX idx_teachers_name ON teachers(name);
CREATE INDEX idx_teachers_email ON teachers(email);
CREATE INDEX idx_teachers_status ON teachers(status);

CREATE INDEX idx_sections_class ON sections(class_id);

-- TRIGGERS FOR AUTO-UPDATE timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_teachers_updated_at BEFORE UPDATE ON teachers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_classes_updated_at BEFORE UPDATE ON classes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sections_updated_at BEFORE UPDATE ON sections FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subjects_updated_at BEFORE UPDATE ON subjects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_exams_updated_at BEFORE UPDATE ON exams FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_marks_updated_at BEFORE UPDATE ON marks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_academic_years_updated_at BEFORE UPDATE ON academic_years FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### Step 3: Load Sample Data

Create `backend/database/seed.sql` with the sample data from your `DATABASE_SETUP_FRESH.sql` (lines 212-362).

### Step 4: Run Database Scripts

```bash
# Run schema
psql -U postgres -d sems_db -f backend/database/schema.sql

# Run seed data
psql -U postgres -d sems_db -f backend/database/seed.sql
```

---

## 📦 NestJS Modules Setup

I'll create all the necessary NestJS modules. Let me create the complete module structure in the next section.

---

## 🔄 API Endpoints Mapping

All your existing Supabase queries will be replaced with REST API calls:

### Academic Years
- `GET /api/academic-years` - List all
- `GET /api/academic-years/:id` - Get one
- `POST /api/academic-years` - Create
- `PUT /api/academic-years/:id` - Update
- `DELETE /api/academic-years/:id` - Delete

### Classes
- `GET /api/classes` - List all
- `GET /api/classes/:id` - Get one
- `POST /api/classes` - Create
- `PUT /api/classes/:id` - Update
- `DELETE /api/classes/:id` - Delete

### Sections
- `GET /api/sections` - List all
- `GET /api/sections/class/:classId` - Get by class
- `POST /api/sections` - Create
- `PUT /api/sections/:id` - Update
- `DELETE /api/sections/:id` - Delete

### Students
- `GET /api/students` - List all (with filters)
- `GET /api/students/:id` - Get one with full details
- `GET /api/students/next-roll/:classId/:sectionId` - Get next roll number
- `POST /api/students` - Create
- `PUT /api/students/:id` - Update
- `DELETE /api/students/:id` - Delete

### Teachers
- `GET /api/teachers` - List all
- `GET /api/teachers/:id` - Get one
- `POST /api/teachers` - Create
- `PUT /api/teachers/:id` - Update
- `DELETE /api/teachers/:id` - Delete

### Subjects
- `GET /api/subjects` - List all
- `GET /api/subjects/class/:classId` - Get by class
- `POST /api/subjects` - Create
- `PUT /api/subjects/:id` - Update
- `DELETE /api/subjects/:id` - Delete

### Exams
- `GET /api/exams` - List all (with filters)
- `GET /api/exams/:id` - Get one
- `POST /api/exams` - Create
- `PUT /api/exams/:id` - Update
- `DELETE /api/exams/:id` - Delete

### Marks
- `GET /api/marks` - List all
- `GET /api/marks/exam/:examId` - Get by exam
- `GET /api/marks/student/:studentId` - Get by student
- `POST /api/marks` - Create
- `POST /api/marks/bulk` - Bulk create
- `PUT /api/marks/:id` - Update
- `DELETE /api/marks/:id` - Delete

---

## 🎨 Frontend Migration

### Step 1: Create API Service Layer

Create `frontend/src/app/services/api.service.ts`:
```typescript
import axios, { AxiosInstance } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor for auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('auth_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('auth_token');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  async get<T>(url: string, params?: any): Promise<T> {
    const response = await this.client.get(url, { params });
    return response.data;
  }

  async post<T>(url: string, data?: any): Promise<T> {
    const response = await this.client.post(url, data);
    return response.data;
  }

  async put<T>(url: string, data?: any): Promise<T> {
    const response = await this.client.put(url, data);
    return response.data;
  }

  async delete<T>(url: string): Promise<T> {
    const response = await this.client.delete(url);
    return response.data;
  }
}

export const apiService = new ApiService();
```

### Step 2: Update Environment Variables

Create `frontend/.env`:
```env
VITE_API_URL=http://localhost:3001/api
```

### Step 3: Install Axios

```bash
cd frontend
npm install axios
```

---

## 🏃 Running the Application

### Terminal 1: Start PostgreSQL
```bash
# macOS
brew services start postgresql@14

# Ubuntu
sudo systemctl start postgresql
```

### Terminal 2: Start Backend
```bash
cd backend
npm run start:dev
```

### Terminal 3: Start Frontend
```bash
cd frontend
npm run dev
```

Access the application at `http://localhost:5173`

---

## ✅ Verification Checklist

- [ ] PostgreSQL is running
- [ ] Database `sems_db` is created
- [ ] All 8 tables are created
- [ ] Sample data is loaded (67 records total)
- [ ] Backend is running on port 3001
- [ ] Frontend is running on port 5173
- [ ] API calls are working
- [ ] All CRUD operations functional
- [ ] Dual views (grid/list) working
- [ ] Excel-like action partitions working
- [ ] Roll number auto-suggestion working

---

## 📚 Next Steps

After completing this guide, you'll need the complete NestJS module files. Would you like me to:

1. **Create all NestJS Entity files** (8 entities)
2. **Create all NestJS Service files** (8 services)
3. **Create all NestJS Controller files** (8 controllers)
4. **Create all NestJS DTO files** (Create, Update DTOs)
5. **Update all Frontend Service files** (Replace Supabase with Axios)
6. **Create Migration Script** (Automated conversion tool)

Let me know which files you'd like me to generate first!
