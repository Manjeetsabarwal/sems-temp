# 🚀 Complete Migration Guide: Figma Make → Local Development

## 📋 Table of Contents
1. [Overview](#overview)
2. [Architecture Comparison](#architecture-comparison)
3. [Pre-Migration Checklist](#pre-migration-checklist)
4. [Step-by-Step Migration](#step-by-step-migration)
5. [Backend Options (NestJS vs Node.js)](#backend-options)
6. [Database Migration](#database-migration)
7. [Frontend Changes](#frontend-changes)
8. [Testing & Validation](#testing--validation)
9. [Deployment](#deployment)

---

## 🎯 Overview

### What You're Migrating

**FROM:** Figma Make Environment
- Frontend: React + TypeScript + Tailwind CSS
- Backend: Supabase Edge Functions (Hono server)
- Database: Supabase PostgreSQL
- Deployment: Figma Make managed

**TO:** Local Development Environment
- Frontend: React + TypeScript + Tailwind CSS ✅ (SAME)
- Backend: NestJS or Node.js/Express (NEW)
- Database: PostgreSQL (local or cloud)
- Deployment: Your own infrastructure

### Migration Time Estimate
- **Simple setup:** 2-4 hours
- **With NestJS:** 4-8 hours
- **Production-ready:** 1-2 days

---

## 📊 Architecture Comparison

### Current Figma Make Architecture
```
┌─────────────────────────────────────────────┐
│  FIGMA MAKE ENVIRONMENT                     │
├─────────────────────────────────────────────┤
│                                             │
│  ┌─────────────┐      ┌─────────────────┐  │
│  │   React     │─────▶│  Supabase Edge  │  │
│  │  Frontend   │      │   Functions     │  │
│  │ (Port 3000) │      │   (Hono API)    │  │
│  └─────────────┘      └────────┬────────┘  │
│                                 │           │
│                        ┌────────▼────────┐  │
│                        │   Supabase      │  │
│                        │   PostgreSQL    │  │
│                        └─────────────────┘  │
└─────────────────────────────────────────────┘
```

### Target Local Architecture (NestJS)
```
┌─────────────────────────────────────────────┐
│  LOCAL DEVELOPMENT ENVIRONMENT              │
├─────────────────────────────────────────────┤
│                                             │
│  ┌─────────────┐      ┌─────────────────┐  │
│  │   React     │─────▶│    NestJS       │  │
│  │  Frontend   │      │   Backend API   │  │
│  │ (Port 3000) │      │   (Port 4000)   │  │
│  └─────────────┘      └────────┬────────┘  │
│                                 │           │
│                        ┌────────▼────────┐  │
│                        │   PostgreSQL    │  │
│                        │   (Port 5432)   │  │
│                        └─────────────────┘  │
└─────────────────────────────────────────────┘
```

---

## ✅ Pre-Migration Checklist

### 1. Backup Everything
- [ ] Export all code from Figma Make
- [ ] Backup Supabase database (SQL dump)
- [ ] Save environment variables
- [ ] Document API endpoints
- [ ] Screenshot all working features

### 2. Prepare Local Environment
- [ ] Install Node.js (v18 or higher)
- [ ] Install PostgreSQL (v14 or higher)
- [ ] Install Git
- [ ] Install code editor (VS Code recommended)
- [ ] Install Postman or similar API testing tool

### 3. Export Figma Make Data
- [ ] Copy all `/src` files
- [ ] Copy all `/supabase/functions` files
- [ ] Copy `package.json` dependencies
- [ ] Export database schema
- [ ] Export sample data (CSV or SQL)

---

## 🔧 Step-by-Step Migration

### Phase 1: Export Code from Figma Make

#### Step 1.1: Download Frontend Code
I'll help you create a downloadable package. The frontend code is in:
```
/src/
├── app/
│   ├── App.tsx                 ← Main component
│   ├── components/             ← All UI components
│   ├── context/                ← React context
│   ├── data/                   ← Mock data
│   ├── services/               ← API services
│   ├── types/                  ← TypeScript types
│   └── utils/                  ← Utility functions
├── styles/                     ← CSS files
└── imports/                    ← Assets (if any)
```

**Action:** Copy all these files to your local machine.

#### Step 1.2: Note Current API Endpoints
Current Supabase Edge Function endpoints:
```
Base URL: https://{projectId}.supabase.co/functions/v1/make-server-2fbe5237

Endpoints:
GET    /api/students
POST   /api/students
PUT    /api/students/:id
DELETE /api/students/:id

GET    /api/exams
POST   /api/exams
PUT    /api/exams/:id
DELETE /api/exams/:id

GET    /api/teachers
POST   /api/teachers
PUT    /api/teachers/:id
DELETE /api/teachers/:id

GET    /api/subjects
POST   /api/subjects
PUT    /api/subjects/:id
DELETE /api/subjects/:id

GET    /api/classes
POST   /api/classes
PUT    /api/classes/:id
DELETE /api/classes/:id

GET    /api/sections
POST   /api/sections
PUT    /api/sections/:id
DELETE /api/sections/:id

GET    /api/marks
POST   /api/marks
PUT    /api/marks/:id
DELETE /api/marks/:id

GET    /api/kv/results
POST   /api/kv/results
DELETE /api/kv/results/:id
POST   /api/kv/results/calculate-ranks/:examId
```

#### Step 1.3: Export Database Schema
Run this in Supabase SQL Editor:
```sql
-- Export table structures
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name LIKE '%2fbe5237%'
ORDER BY table_name, ordinal_position;

-- Export as SQL
pg_dump -h <supabase-host> -U postgres -d postgres \
    --schema-only --no-owner --no-privileges > schema.sql

-- Export sample data
pg_dump -h <supabase-host> -U postgres -d postgres \
    --data-only --no-owner --no-privileges > data.sql
```

---

### Phase 2: Set Up Local Environment

#### Step 2.1: Initialize Local Project
```bash
# Create project directory
mkdir school-exam-system
cd school-exam-system

# Create frontend and backend folders
mkdir frontend
mkdir backend

# Initialize Git
git init
```

#### Step 2.2: Set Up Frontend
```bash
cd frontend

# Initialize React + TypeScript + Vite
npm create vite@latest . -- --template react-ts

# Install dependencies
npm install

# Install all Figma Make dependencies
npm install react-router-dom
npm install @supabase/supabase-js
npm install lucide-react
npm install sonner
npm install recharts
npm install tailwindcss@next @tailwindcss/vite@next
npm install class-variance-authority
npm install clsx tailwind-merge
npm install react-hook-form@7.55.0
npm install @radix-ui/react-checkbox
npm install @radix-ui/react-select
npm install @radix-ui/react-dialog
npm install @radix-ui/react-label
npm install @radix-ui/react-tabs
```

#### Step 2.3: Copy Figma Make Frontend Code
```bash
# Copy all source files from Figma Make to frontend/src/
# Replace the default Vite files with your Figma Make files

cp -r <figma-make-export>/src/* ./src/
cp -r <figma-make-export>/styles/* ./src/styles/
```

---

### Phase 3: Choose Backend (NestJS vs Node.js)

## 🔀 Backend Options

### Option A: NestJS (Recommended for Production)

**Pros:**
- ✅ Built-in TypeScript support
- ✅ Modular architecture (like Angular)
- ✅ Built-in validation, guards, interceptors
- ✅ Excellent for scaling
- ✅ Auto-generated API documentation (Swagger)

**Cons:**
- ⚠️ Steeper learning curve
- ⚠️ More boilerplate initially

**Best for:** Production apps, teams, long-term projects

### Option B: Node.js + Express (Simpler)

**Pros:**
- ✅ Minimal learning curve
- ✅ Faster initial setup
- ✅ Lightweight
- ✅ Flexible

**Cons:**
- ⚠️ Less structured (can become messy)
- ⚠️ Manual TypeScript setup
- ⚠️ Need to add validation, error handling manually

**Best for:** Prototypes, solo projects, quick MVPs

---

### Phase 4A: NestJS Backend Setup (RECOMMENDED)

#### Step 4A.1: Install NestJS
```bash
cd ../backend

# Install NestJS CLI
npm i -g @nestjs/cli

# Create new NestJS project
nest new school-exam-api

# Install dependencies
cd school-exam-api
npm install @nestjs/typeorm typeorm pg
npm install @nestjs/config
npm install class-validator class-transformer
npm install bcrypt
npm install @nestjs/jwt @nestjs/passport passport passport-jwt
npm install @types/bcrypt --save-dev
```

#### Step 4A.2: NestJS Project Structure
```
backend/school-exam-api/
├── src/
│   ├── students/
│   │   ├── dto/
│   │   │   ├── create-student.dto.ts
│   │   │   └── update-student.dto.ts
│   │   ├── entities/
│   │   │   └── student.entity.ts
│   │   ├── students.controller.ts
│   │   ├── students.service.ts
│   │   └── students.module.ts
│   ├── exams/
│   │   ├── dto/
│   │   ├── entities/
│   │   ├── exams.controller.ts
│   │   ├── exams.service.ts
│   │   └── exams.module.ts
│   ├── teachers/
│   ├── subjects/
│   ├── classes/
│   ├── sections/
│   ├── marks/
│   ├── results/
│   ├── database/
│   │   └── database.module.ts
│   ├── app.module.ts
│   └── main.ts
├── .env
├── package.json
└── tsconfig.json
```

#### Step 4A.3: Create Student Module (Example)

**File: `src/students/entities/student.entity.ts`**
```typescript
import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity('students_2fbe5237')
export class Student {
  @PrimaryColumn({ name: 'studentid' })
  studentId: string;

  @Column()
  name: string;

  @Column({ name: 'classid' })
  classId: string;

  @Column({ name: 'sectionid' })
  sectionId: string;

  @Column({ name: 'rollno' })
  rollNo: number;

  @Column({ name: 'parentcontact', nullable: true })
  parentContact?: string;

  @Column({ name: 'parentemail', nullable: true })
  parentEmail?: string;

  @Column({ default: 'Active' })
  status?: string;
}
```

**File: `src/students/dto/create-student.dto.ts`**
```typescript
import { IsString, IsNumber, IsOptional, IsEmail } from 'class-validator';

export class CreateStudentDto {
  @IsString()
  studentId: string;

  @IsString()
  name: string;

  @IsString()
  classId: string;

  @IsString()
  sectionId: string;

  @IsNumber()
  rollNo: number;

  @IsString()
  @IsOptional()
  parentContact?: string;

  @IsEmail()
  @IsOptional()
  parentEmail?: string;

  @IsString()
  @IsOptional()
  status?: string;
}
```

**File: `src/students/students.service.ts`**
```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Student } from './entities/student.entity';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';

@Injectable()
export class StudentsService {
  constructor(
    @InjectRepository(Student)
    private studentsRepository: Repository<Student>,
  ) {}

  async create(createStudentDto: CreateStudentDto): Promise<Student> {
    const student = this.studentsRepository.create(createStudentDto);
    return this.studentsRepository.save(student);
  }

  async findAll(): Promise<Student[]> {
    return this.studentsRepository.find({
      where: { status: 'Active' },
      order: { classId: 'ASC', rollNo: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Student> {
    const student = await this.studentsRepository.findOne({
      where: { studentId: id },
    });
    if (!student) {
      throw new NotFoundException(`Student with ID ${id} not found`);
    }
    return student;
  }

  async update(id: string, updateStudentDto: UpdateStudentDto): Promise<Student> {
    const student = await this.findOne(id);
    Object.assign(student, updateStudentDto);
    return this.studentsRepository.save(student);
  }

  async remove(id: string): Promise<void> {
    const student = await this.findOne(id);
    await this.studentsRepository.remove(student);
  }
}
```

**File: `src/students/students.controller.ts`**
```typescript
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
} from '@nestjs/common';
import { StudentsService } from './students.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';

@Controller('api/students')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Post()
  create(@Body() createStudentDto: CreateStudentDto) {
    return this.studentsService.create(createStudentDto);
  }

  @Get()
  findAll() {
    return this.studentsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.studentsService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateStudentDto: UpdateStudentDto) {
    return this.studentsService.update(id, updateStudentDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.studentsService.remove(id);
  }
}
```

**File: `src/students/students.module.ts`**
```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StudentsService } from './students.service';
import { StudentsController } from './students.controller';
import { Student } from './entities/student.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Student])],
  controllers: [StudentsController],
  providers: [StudentsService],
  exports: [StudentsService],
})
export class StudentsModule {}
```

**File: `src/app.module.ts`**
```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { StudentsModule } from './students/students.module';
import { ExamsModule } from './exams/exams.module';
import { TeachersModule } from './teachers/teachers.module';
// ... import other modules

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 5432,
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_NAME || 'school_exam_db',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: process.env.NODE_ENV !== 'production', // Only for development
      logging: true,
    }),
    StudentsModule,
    ExamsModule,
    TeachersModule,
    // ... other modules
  ],
})
export class AppModule {}
```

**File: `src/main.ts`**
```typescript
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS for frontend
  app.enableCors({
    origin: 'http://localhost:3000',
    credentials: true,
  });

  // Enable validation
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
  }));

  await app.listen(4000);
  console.log('🚀 NestJS Backend running on http://localhost:4000');
}
bootstrap();
```

**File: `.env`**
```env
NODE_ENV=development
PORT=4000

DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_NAME=school_exam_db

JWT_SECRET=your_jwt_secret_key_here
```

---

### Phase 4B: Node.js + Express Backend Setup (ALTERNATIVE)

#### Step 4B.1: Initialize Express Project
```bash
cd ../backend

# Initialize npm project
npm init -y

# Install dependencies
npm install express
npm install pg pg-hstore
npm install dotenv
npm install cors
npm install express-validator
npm install typescript @types/express @types/node --save-dev
npm install ts-node nodemon --save-dev

# Initialize TypeScript
npx tsc --init
```

#### Step 4B.2: Express Project Structure
```
backend/
├── src/
│   ├── config/
│   │   └── database.ts
│   ├── controllers/
│   │   ├── students.controller.ts
│   │   ├── exams.controller.ts
│   │   └── ...
│   ├── models/
│   │   ├── student.model.ts
│   │   └── ...
│   ├── routes/
│   │   ├── students.routes.ts
│   │   └── ...
│   ├── services/
│   │   ├── students.service.ts
│   │   └── ...
│   ├── middleware/
│   │   └── errorHandler.ts
│   └── server.ts
├── .env
├── package.json
└── tsconfig.json
```

#### Step 4B.3: Create Express Server

**File: `src/server.ts`**
```typescript
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import studentsRouter from './routes/students.routes';
import examsRouter from './routes/exams.routes';
// ... import other routes

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());

// Routes
app.use('/api/students', studentsRouter);
app.use('/api/exams', examsRouter);
// ... other routes

// Error handling
app.use((err: any, req: any, res: any, next: any) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message });
});

app.listen(PORT, () => {
  console.log(`🚀 Express Backend running on http://localhost:${PORT}`);
});
```

**File: `src/config/database.ts`**
```typescript
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

export const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'school_exam_db',
});

pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('❌ PostgreSQL connection error:', err);
  process.exit(-1);
});
```

**File: `src/services/students.service.ts`**
```typescript
import { pool } from '../config/database';

export interface Student {
  studentId: string;
  name: string;
  classId: string;
  sectionId: string;
  rollNo: number;
  parentContact?: string;
  parentEmail?: string;
  status?: string;
}

export class StudentsService {
  async findAll(): Promise<Student[]> {
    const result = await pool.query(
      'SELECT * FROM students_2fbe5237 WHERE status = $1 ORDER BY classid, rollno',
      ['Active']
    );
    return result.rows.map(this.mapRowToStudent);
  }

  async findById(id: string): Promise<Student | null> {
    const result = await pool.query(
      'SELECT * FROM students_2fbe5237 WHERE studentid = $1',
      [id]
    );
    return result.rows[0] ? this.mapRowToStudent(result.rows[0]) : null;
  }

  async create(student: Omit<Student, 'studentId'>): Promise<Student> {
    const studentId = `STU${Date.now()}`;
    const result = await pool.query(
      `INSERT INTO students_2fbe5237 
       (studentid, name, classid, sectionid, rollno, parentcontact, parentemail, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        studentId,
        student.name,
        student.classId,
        student.sectionId,
        student.rollNo,
        student.parentContact,
        student.parentEmail,
        student.status || 'Active',
      ]
    );
    return this.mapRowToStudent(result.rows[0]);
  }

  async update(id: string, student: Partial<Student>): Promise<Student | null> {
    const result = await pool.query(
      `UPDATE students_2fbe5237 
       SET name = COALESCE($1, name),
           classid = COALESCE($2, classid),
           sectionid = COALESCE($3, sectionid),
           rollno = COALESCE($4, rollno),
           parentcontact = COALESCE($5, parentcontact),
           parentemail = COALESCE($6, parentemail),
           status = COALESCE($7, status)
       WHERE studentid = $8
       RETURNING *`,
      [
        student.name,
        student.classId,
        student.sectionId,
        student.rollNo,
        student.parentContact,
        student.parentEmail,
        student.status,
        id,
      ]
    );
    return result.rows[0] ? this.mapRowToStudent(result.rows[0]) : null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await pool.query(
      'DELETE FROM students_2fbe5237 WHERE studentid = $1',
      [id]
    );
    return result.rowCount !== null && result.rowCount > 0;
  }

  private mapRowToStudent(row: any): Student {
    return {
      studentId: row.studentid,
      name: row.name,
      classId: row.classid,
      sectionId: row.sectionid,
      rollNo: row.rollno,
      parentContact: row.parentcontact,
      parentEmail: row.parentemail,
      status: row.status,
    };
  }
}
```

**File: `src/controllers/students.controller.ts`**
```typescript
import { Request, Response } from 'express';
import { StudentsService } from '../services/students.service';

const studentsService = new StudentsService();

export class StudentsController {
  async getAll(req: Request, res: Response) {
    try {
      const students = await studentsService.findAll();
      res.json(students);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const student = await studentsService.findById(req.params.id);
      if (!student) {
        return res.status(404).json({ error: 'Student not found' });
      }
      res.json(student);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async create(req: Request, res: Response) {
    try {
      const student = await studentsService.create(req.body);
      res.status(201).json(student);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const student = await studentsService.update(req.params.id, req.body);
      if (!student) {
        return res.status(404).json({ error: 'Student not found' });
      }
      res.json(student);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const deleted = await studentsService.delete(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: 'Student not found' });
      }
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}
```

**File: `src/routes/students.routes.ts`**
```typescript
import { Router } from 'express';
import { StudentsController } from '../controllers/students.controller';

const router = Router();
const controller = new StudentsController();

router.get('/', (req, res) => controller.getAll(req, res));
router.get('/:id', (req, res) => controller.getById(req, res));
router.post('/', (req, res) => controller.create(req, res));
router.put('/:id', (req, res) => controller.update(req, res));
router.delete('/:id', (req, res) => controller.delete(req, res));

export default router;
```

**File: `package.json` (add scripts)**
```json
{
  "scripts": {
    "dev": "nodemon --watch src --exec ts-node src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js"
  }
}
```

---

### Phase 5: Database Migration

#### Step 5.1: Install PostgreSQL Locally
```bash
# macOS (using Homebrew)
brew install postgresql@14
brew services start postgresql@14

# Ubuntu/Debian
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql

# Windows
# Download from https://www.postgresql.org/download/windows/
```

#### Step 5.2: Create Local Database
```bash
# Connect to PostgreSQL
psql -U postgres

# In psql prompt:
CREATE DATABASE school_exam_db;

# Connect to new database
\c school_exam_db

# Create tables (copy from your schema export)
```

#### Step 5.3: Import Schema
```sql
-- Create all tables with exact same structure
CREATE TABLE students_2fbe5237 (
    studentid VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    classid VARCHAR(50) NOT NULL,
    sectionid VARCHAR(50) NOT NULL,
    rollno INTEGER NOT NULL,
    parentcontact VARCHAR(20),
    parentemail VARCHAR(255),
    status VARCHAR(20) DEFAULT 'Active'
);

CREATE TABLE teachers_2fbe5237 (
    teacherid VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    subject VARCHAR(100),
    email VARCHAR(255),
    phone VARCHAR(20),
    status VARCHAR(20) DEFAULT 'Active'
);

-- Add all other tables...
-- (Copy from your Supabase schema)
```

#### Step 5.4: Import Data
```bash
# If you have SQL dump
psql -U postgres -d school_exam_db < data.sql

# Or import CSV
\copy students_2fbe5237 FROM 'students.csv' DELIMITER ',' CSV HEADER;
```

---

### Phase 6: Update Frontend to Use New Backend

#### Step 6.1: Update API Configuration

**File: `frontend/src/config/api.ts`** (CREATE NEW FILE)
```typescript
// API Configuration
export const API_CONFIG = {
  // Development (local backend)
  development: {
    baseURL: 'http://localhost:4000',
  },
  // Production (deploy backend URL)
  production: {
    baseURL: 'https://your-api.com',
  },
};

const ENV = import.meta.env.MODE || 'development';

export const API_BASE_URL = API_CONFIG[ENV as keyof typeof API_CONFIG].baseURL;
```

#### Step 6.2: Update Service Files

**File: `frontend/src/services/students.service.ts`**
```typescript
import { API_BASE_URL } from '../config/api';
import type { Student } from '../types';

export const studentsService = {
  async getAll(): Promise<Student[]> {
    const response = await fetch(`${API_BASE_URL}/api/students`);
    if (!response.ok) throw new Error('Failed to fetch students');
    return response.json();
  },

  async getById(id: string): Promise<Student> {
    const response = await fetch(`${API_BASE_URL}/api/students/${id}`);
    if (!response.ok) throw new Error('Student not found');
    return response.json();
  },

  async create(student: Omit<Student, 'studentId'>): Promise<Student> {
    const response = await fetch(`${API_BASE_URL}/api/students`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(student),
    });
    if (!response.ok) throw new Error('Failed to create student');
    return response.json();
  },

  async update(id: string, student: Partial<Student>): Promise<Student> {
    const response = await fetch(`${API_BASE_URL}/api/students/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(student),
    });
    if (!response.ok) throw new Error('Failed to update student');
    return response.json();
  },

  async delete(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/students/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete student');
  },
};
```

**Do the same for all other services:**
- `exams.service.ts`
- `teachers.service.ts`
- `subjects.service.ts`
- `classes.service.ts`
- `sections.service.ts`
- `marks.service.ts`
- `results.service.ts`

#### Step 6.3: Remove Supabase Dependencies

**File: `frontend/package.json`**
```json
// REMOVE these lines:
"@supabase/supabase-js": "^2.x.x",

// KEEP everything else (React, Tailwind, Lucide, etc.)
```

#### Step 6.4: Update Component Imports
Search and replace in all component files:
```typescript
// REMOVE:
import { projectId, publicAnonKey } from '/utils/supabase/info';
const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-2fbe5237`;

// REPLACE WITH:
import { API_BASE_URL } from '../config/api';
const API_BASE = API_BASE_URL;
```

---

### Phase 7: Testing

#### Step 7.1: Start Backend
```bash
# NestJS
cd backend/school-exam-api
npm run start:dev

# Express
cd backend
npm run dev
```

#### Step 7.2: Start Frontend
```bash
cd frontend
npm run dev
```

#### Step 7.3: Test All Features
- [ ] Students CRUD
- [ ] Exams CRUD
- [ ] Teachers CRUD
- [ ] Subjects CRUD
- [ ] Classes & Sections CRUD
- [ ] Marks Entry
- [ ] Results Generation
- [ ] Report Cards
- [ ] Dashboard

#### Step 7.4: Check API Endpoints
Use Postman or curl:
```bash
# Test GET
curl http://localhost:4000/api/students

# Test POST
curl -X POST http://localhost:4000/api/students \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Student",
    "classId": "10",
    "sectionId": "10-A",
    "rollNo": 1,
    "parentContact": "1234567890",
    "parentEmail": "test@example.com"
  }'
```

---

### Phase 8: Production Deployment

#### Step 8.1: Build Frontend
```bash
cd frontend
npm run build

# Output will be in frontend/dist/
```

#### Step 8.2: Deploy Backend

**Option 1: Heroku**
```bash
# Install Heroku CLI
npm install -g heroku

# Login and create app
heroku login
heroku create school-exam-api

# Add PostgreSQL
heroku addons:create heroku-postgresql:hobby-dev

# Deploy
git push heroku main

# Set environment variables
heroku config:set NODE_ENV=production
```

**Option 2: Railway**
1. Go to https://railway.app
2. Create new project
3. Connect GitHub repo
4. Add PostgreSQL database
5. Deploy automatically

**Option 3: DigitalOcean/AWS/Azure**
- Use Docker container
- Set up PostgreSQL database
- Configure environment variables
- Deploy using CI/CD

#### Step 8.3: Deploy Frontend

**Option 1: Vercel**
```bash
npm install -g vercel
cd frontend
vercel

# Set environment variable in Vercel dashboard:
# VITE_API_BASE_URL=https://your-api.herokuapp.com
```

**Option 2: Netlify**
```bash
npm install -g netlify-cli
cd frontend
netlify deploy
```

**Option 3: GitHub Pages**
```bash
# Add to package.json
"homepage": "https://yourusername.github.io/school-exam-system"

# Build and deploy
npm run build
npx gh-pages -d dist
```

---

## 📊 Complete Checklist

### Pre-Migration
- [ ] Backup Figma Make code
- [ ] Export database schema
- [ ] Export sample data
- [ ] Document API endpoints
- [ ] Screenshot working app

### Local Setup
- [ ] Install Node.js, PostgreSQL
- [ ] Create project folders
- [ ] Initialize Git repository
- [ ] Set up frontend (copy Figma Make code)
- [ ] Install frontend dependencies

### Backend Setup
- [ ] Choose NestJS or Express
- [ ] Initialize backend project
- [ ] Install dependencies
- [ ] Create database connection
- [ ] Implement all modules (Students, Exams, etc.)
- [ ] Add CORS configuration
- [ ] Test API endpoints

### Database
- [ ] Create local PostgreSQL database
- [ ] Import schema
- [ ] Import sample data
- [ ] Verify data integrity

### Frontend Updates
- [ ] Create API configuration file
- [ ] Update all service files
- [ ] Remove Supabase imports
- [ ] Update API calls to use local backend
- [ ] Test all components

### Testing
- [ ] Backend API tests (Postman)
- [ ] Frontend integration tests
- [ ] End-to-end user flow tests
- [ ] Cross-browser testing

### Deployment
- [ ] Build frontend for production
- [ ] Deploy backend to cloud
- [ ] Deploy frontend to hosting
- [ ] Configure production database
- [ ] Set environment variables
- [ ] Test production deployment

---

## 🆘 Troubleshooting

### CORS Errors
```typescript
// NestJS: main.ts
app.enableCors({
  origin: ['http://localhost:3000', 'https://your-frontend.com'],
  credentials: true,
});

// Express: server.ts
app.use(cors({
  origin: ['http://localhost:3000', 'https://your-frontend.com'],
  credentials: true,
}));
```

### Database Connection Errors
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Check connection details
psql -U postgres -d school_exam_db

# Reset password if needed
ALTER USER postgres WITH PASSWORD 'newpassword';
```

### Port Already in Use
```bash
# Find process using port
lsof -i :4000

# Kill process
kill -9 <PID>
```

### Build Errors
```bash
# Clear cache
rm -rf node_modules
rm package-lock.json
npm install

# Or use yarn
yarn cache clean
yarn install
```

---

## 📚 Next Steps After Migration

1. **Add Authentication**
   - Implement JWT-based auth
   - Add login/signup pages
   - Protect routes

2. **Add Logging**
   - Winston or Pino for backend logging
   - Error tracking (Sentry)

3. **Add Tests**
   - Jest for unit tests
   - Supertest for API tests
   - Cypress for E2E tests

4. **Performance Optimization**
   - Add Redis caching
   - Optimize database queries
   - Add pagination

5. **DevOps**
   - Docker containerization
   - CI/CD pipeline (GitHub Actions)
   - Monitoring (New Relic, DataDog)

---

## 🎉 Congratulations!

You've successfully migrated from Figma Make to a local development environment!

**Your new stack:**
- ✅ React + TypeScript frontend (unchanged)
- ✅ NestJS/Express backend (your choice)
- ✅ PostgreSQL database
- ✅ Full control and scalability

Now you can:
- Develop locally
- Deploy anywhere
- Scale independently
- Add custom features
- Own your infrastructure

**Happy coding! 🚀**
