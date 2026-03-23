# ⚡ Quick Start: Figma Make → Local Setup (30 Minutes)

## 🎯 Goal
Get your School Exam Management System running locally in **30 minutes**.

---

## 📦 Prerequisites (5 min)

Install these tools:
```bash
# 1. Node.js (v18+)
node --version  # Should show v18 or higher

# 2. PostgreSQL (v14+)
psql --version  # Should show v14 or higher

# 3. Git
git --version

# 4. Code editor (VS Code recommended)
```

**Don't have them?**
- Node.js: https://nodejs.org
- PostgreSQL: https://www.postgresql.org/download/
- Git: https://git-scm.com/downloads

---

## 🚀 Setup Steps

### Step 1: Create Project (2 min)

```bash
# Create directory
mkdir school-exam-system
cd school-exam-system

# Create frontend and backend folders
mkdir frontend backend

# Initialize Git
git init
```

---

### Step 2: Set Up Frontend (5 min)

```bash
cd frontend

# Create Vite React app
npm create vite@latest . -- --template react-ts

# Install dependencies
npm install

# Install Figma Make dependencies (copy-paste all at once)
npm install react-router-dom lucide-react sonner recharts tailwindcss@next @tailwindcss/vite@next class-variance-authority clsx tailwind-merge react-hook-form@7.55.0 @radix-ui/react-checkbox @radix-ui/react-select @radix-ui/react-dialog @radix-ui/react-label @radix-ui/react-tabs
```

**Copy Figma Make Files:**
```bash
# Copy all files from Figma Make /src/ to frontend/src/
# You can download them by copying each file content
```

**Create API config file:**
```bash
# frontend/src/config/api.ts
mkdir src/config
```

Create `frontend/src/config/api.ts`:
```typescript
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';
```

---

### Step 3: Set Up Backend - NestJS (10 min)

```bash
cd ../backend

# Install NestJS CLI globally
npm i -g @nestjs/cli

# Create NestJS project
nest new school-exam-api
cd school-exam-api

# Install dependencies
npm install @nestjs/typeorm typeorm pg @nestjs/config class-validator class-transformer
```

**Create `.env` file:**
```env
NODE_ENV=development
PORT=4000
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=school_exam_db
```

**Update `src/main.ts`:**
```typescript
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.enableCors({
    origin: 'http://localhost:3000',
    credentials: true,
  });

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
  }));

  await app.listen(4000);
  console.log('🚀 Backend running on http://localhost:4000');
}
bootstrap();
```

**Update `src/app.module.ts`:**
```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      autoLoadEntities: true,
      synchronize: true, // Only for development!
    }),
  ],
})
export class AppModule {}
```

---

### Step 4: Set Up Database (5 min)

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE school_exam_db;

# Exit
\q
```

**Create tables - Run this SQL:**
```sql
-- Connect to database
psql -U postgres -d school_exam_db

-- Create students table
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

-- Create teachers table
CREATE TABLE teachers_2fbe5237 (
    teacherid VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    subject VARCHAR(100),
    email VARCHAR(255),
    phone VARCHAR(20),
    status VARCHAR(20) DEFAULT 'Active'
);

-- Create exams table
CREATE TABLE exams_2fbe5237 (
    examid VARCHAR(50) PRIMARY KEY,
    examname VARCHAR(255) NOT NULL,
    academicyear VARCHAR(50),
    startdate DATE,
    enddate DATE,
    totalmarks INTEGER,
    status VARCHAR(20) DEFAULT 'Upcoming'
);

-- Create subjects table
CREATE TABLE subjects_2fbe5237 (
    subjectid VARCHAR(50) PRIMARY KEY,
    subjectname VARCHAR(255) NOT NULL,
    subjectcode VARCHAR(50),
    maxmarks INTEGER,
    status VARCHAR(20) DEFAULT 'Active'
);

-- Create classes table
CREATE TABLE classes_2fbe5237 (
    classid VARCHAR(50) PRIMARY KEY,
    classname VARCHAR(100) NOT NULL,
    academicyearid VARCHAR(50)
);

-- Create sections table
CREATE TABLE sections_2fbe5237 (
    sectionid VARCHAR(50) PRIMARY KEY,
    sectionname VARCHAR(100) NOT NULL,
    classid VARCHAR(50),
    teacherid VARCHAR(50)
);

-- Create marks table
CREATE TABLE marks_2fbe5237 (
    markid VARCHAR(50) PRIMARY KEY,
    studentid VARCHAR(50) REFERENCES students_2fbe5237(studentid),
    examid VARCHAR(50),
    subjectid VARCHAR(50),
    marksobtained NUMERIC(5,2),
    maxmarks INTEGER,
    grade VARCHAR(10)
);

-- Insert sample data
INSERT INTO students_2fbe5237 (studentid, name, classid, sectionid, rollno, parentcontact, parentemail, status)
VALUES
  ('STU001', 'Rahul Sharma', '10', '10-A', 1, '9876543210', 'parent1@email.com', 'Active'),
  ('STU002', 'Priya Patel', '10', '10-A', 2, '9876543211', 'parent2@email.com', 'Active'),
  ('STU003', 'Amit Kumar', '10', '10-A', 3, '9876543212', 'parent3@email.com', 'Active');

INSERT INTO teachers_2fbe5237 (teacherid, name, subject, email, phone, status)
VALUES
  ('TCH001', 'Dr. Meena Sharma', 'Mathematics', 'meena@school.com', '9876543210', 'Active'),
  ('TCH002', 'Prof. Rajesh Kumar', 'Physics', 'rajesh@school.com', '9876543211', 'Active');

\q
```

---

### Step 5: Create Students Module (5 min)

```bash
cd backend/school-exam-api

# Generate students module
nest g module students
nest g controller students
nest g service students
```

**Create `src/students/entities/student.entity.ts`:**
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

**Update `src/students/students.service.ts`:**
```typescript
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Student } from './entities/student.entity';

@Injectable()
export class StudentsService {
  constructor(
    @InjectRepository(Student)
    private studentsRepository: Repository<Student>,
  ) {}

  findAll(): Promise<Student[]> {
    return this.studentsRepository.find({
      where: { status: 'Active' },
      order: { classId: 'ASC', rollNo: 'ASC' },
    });
  }

  findOne(id: string): Promise<Student> {
    return this.studentsRepository.findOne({
      where: { studentId: id },
    });
  }

  create(student: Partial<Student>): Promise<Student> {
    const newStudent = this.studentsRepository.create(student);
    return this.studentsRepository.save(newStudent);
  }

  async update(id: string, student: Partial<Student>): Promise<Student> {
    await this.studentsRepository.update({ studentId: id }, student);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.studentsRepository.delete({ studentId: id });
  }
}
```

**Update `src/students/students.controller.ts`:**
```typescript
import { Controller, Get, Post, Body, Param, Delete, Put } from '@nestjs/common';
import { StudentsService } from './students.service';
import { Student } from './entities/student.entity';

@Controller('api/students')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Post()
  create(@Body() student: Partial<Student>) {
    return this.studentsService.create(student);
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
  update(@Param('id') id: string, @Body() student: Partial<Student>) {
    return this.studentsService.update(id, student);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.studentsService.remove(id);
  }
}
```

**Update `src/students/students.module.ts`:**
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
})
export class StudentsModule {}
```

**Import in `src/app.module.ts`:**
```typescript
import { StudentsModule } from './students/students.module';

@Module({
  imports: [
    // ... existing imports
    StudentsModule,
  ],
})
export class AppModule {}
```

---

### Step 6: Update Frontend Services (3 min)

**Update `frontend/src/services/students.service.ts`:**
```typescript
import { API_BASE_URL } from '../config/api';
import type { Student } from '../types';

export const studentsService = {
  async getAll(): Promise<Student[]> {
    const response = await fetch(`${API_BASE_URL}/api/students`);
    if (!response.ok) throw new Error('Failed to fetch students');
    return response.json();
  },

  async create(student: Partial<Student>): Promise<Student> {
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

**Remove Supabase imports from all components:**
- Search: `import.*supabase`
- Replace with: API_BASE_URL imports

---

### Step 7: Run Everything (2 min)

**Terminal 1 - Backend:**
```bash
cd backend/school-exam-api
npm run start:dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

**Open browser:**
```
http://localhost:3000
```

---

## ✅ Verification Checklist

- [ ] Backend running on http://localhost:4000
- [ ] Frontend running on http://localhost:3000
- [ ] No CORS errors in browser console
- [ ] Students page loads
- [ ] Can create a new student
- [ ] Can view student list
- [ ] Can edit a student
- [ ] Can delete a student

---

## 🎯 You're Done!

**What's working:**
- ✅ React frontend (same as Figma Make)
- ✅ NestJS backend API
- ✅ PostgreSQL database
- ✅ Students module (CRUD operations)

**Next steps:**
1. Repeat Step 5 for other modules (Exams, Teachers, etc.)
2. Follow full migration guide for complete setup
3. Add authentication (JWT)
4. Deploy to production

---

## 🆘 Common Issues

### Port 4000 already in use
```bash
# Kill process
lsof -i :4000
kill -9 <PID>
```

### CORS error
```typescript
// Check main.ts has:
app.enableCors({
  origin: 'http://localhost:3000',
  credentials: true,
});
```

### Database connection failed
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Or on macOS:
brew services list
```

### Can't connect to database
```bash
# Reset password
psql -U postgres
ALTER USER postgres WITH PASSWORD 'postgres';
\q
```

---

## 📚 Full Documentation

For complete migration guide:
- [`MIGRATION_GUIDE_FIGMA_TO_LOCAL.md`](/MIGRATION_GUIDE_FIGMA_TO_LOCAL.md)

For current system fixes:
- [`NO_DATA_AFTER_FIX.md`](/NO_DATA_AFTER_FIX.md)
- [`COMPLETE_FIX_SUMMARY.md`](/COMPLETE_FIX_SUMMARY.md)

---

**Happy coding! 🚀**
