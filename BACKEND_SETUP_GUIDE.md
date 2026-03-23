# 🚀 Complete Backend Setup Guide - NestJS + PostgreSQL

## School Exam Management System - End-to-End Implementation

---

## 📦 Phase 1: Backend Setup

### Step 1: Create NestJS Project

```bash
# Install NestJS CLI
npm i -g @nestjs/cli

# Create new project
nest new school-exam-backend
cd school-exam-backend

# Install required dependencies
npm install @nestjs/typeorm typeorm pg
npm install @nestjs/config
npm install @nestjs/passport passport passport-jwt
npm install @nestjs/jwt bcrypt
npm install class-validator class-transformer

# Install dev dependencies
npm install -D @types/bcrypt @types/passport-jwt
```

---

### Step 2: Project Structure

```
school-exam-backend/
├── src/
│   ├── modules/
│   │   ├── auth/
│   │   ├── users/
│   │   ├── students/
│   │   ├── teachers/
│   │   ├── classes/
│   │   ├── subjects/
│   │   ├── exams/
│   │   ├── marks/
│   │   ├── results/
│   │   └── academic-years/
│   ├── common/
│   │   ├── decorators/
│   │   ├── guards/
│   │   ├── interceptors/
│   │   └── filters/
│   ├── config/
│   │   └── database.config.ts
│   ├── app.module.ts
│   └── main.ts
├── .env
├── package.json
└── tsconfig.json
```

---

### Step 3: Environment Configuration

Create `.env` file:

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_DATABASE=school_exam_db

# JWT
JWT_SECRET=your_super_secret_jwt_key_change_this
JWT_EXPIRATION=1d

# App
PORT=3000
NODE_ENV=development

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173
```

---

### Step 4: Database Schema (PostgreSQL)

Create `schema.sql`:

```sql
-- Users table (for authentication)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'teacher', 'student', 'parent')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Academic Years
CREATE TABLE academic_years (
  id VARCHAR(20) PRIMARY KEY,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Classes
CREATE TABLE classes (
  id VARCHAR(20) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Sections
CREATE TABLE sections (
  id VARCHAR(20) PRIMARY KEY,
  class_id VARCHAR(20) REFERENCES classes(id) ON DELETE CASCADE,
  name VARCHAR(10) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Subjects
CREATE TABLE subjects (
  id VARCHAR(20) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(20) NOT NULL UNIQUE,
  max_marks INTEGER NOT NULL DEFAULT 100,
  pass_marks INTEGER NOT NULL DEFAULT 35,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Students
CREATE TABLE students (
  student_id VARCHAR(20) PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  class_id VARCHAR(20) REFERENCES classes(id),
  section_id VARCHAR(20) REFERENCES sections(id),
  roll_no INTEGER NOT NULL,
  parent_contact VARCHAR(20),
  parent_email VARCHAR(255),
  avatar VARCHAR(500),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(class_id, section_id, roll_no)
);

-- Teachers
CREATE TABLE teachers (
  teacher_id VARCHAR(20) PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  subject_id VARCHAR(20) REFERENCES subjects(id),
  experience VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Exams
CREATE TABLE exams (
  exam_id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  academic_year VARCHAR(20) REFERENCES academic_years(id),
  weightage INTEGER NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('midterm', 'final', 'unit-test', 'monthly')),
  status VARCHAR(50) NOT NULL CHECK (status IN ('upcoming', 'ongoing', 'completed')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Exam Subjects (Timetable)
CREATE TABLE exam_subjects (
  id SERIAL PRIMARY KEY,
  exam_id VARCHAR(50) REFERENCES exams(exam_id) ON DELETE CASCADE,
  subject_id VARCHAR(20) REFERENCES subjects(id),
  class_id VARCHAR(20) REFERENCES classes(id),
  exam_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(exam_id, subject_id, class_id)
);

-- Marks
CREATE TABLE marks (
  id SERIAL PRIMARY KEY,
  student_id VARCHAR(20) REFERENCES students(student_id) ON DELETE CASCADE,
  exam_id VARCHAR(50) REFERENCES exams(exam_id) ON DELETE CASCADE,
  subject_id VARCHAR(20) REFERENCES subjects(id),
  marks_obtained INTEGER NOT NULL,
  is_absent BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(student_id, exam_id, subject_id)
);

-- Grade Rules
CREATE TABLE grade_rules (
  id SERIAL PRIMARY KEY,
  min_percentage NUMERIC(5,2) NOT NULL,
  grade VARCHAR(5) NOT NULL,
  color VARCHAR(20) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_students_class ON students(class_id, section_id);
CREATE INDEX idx_marks_student ON marks(student_id, exam_id);
CREATE INDEX idx_exam_subjects_exam ON exam_subjects(exam_id, class_id);
```

---

### Step 5: TypeORM Entities

Create entities for each table. Example for `students/entities/student.entity.ts`:

```typescript
import {
  Entity,
  Column,
  PrimaryColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Class } from '../../classes/entities/class.entity';
import { Section } from '../../sections/entities/section.entity';

@Entity('students')
export class Student {
  @PrimaryColumn({ name: 'student_id' })
  studentId: string;

  @Column({ name: 'user_id', nullable: true })
  userId: string;

  @Column()
  name: string;

  @Column({ name: 'class_id' })
  classId: string;

  @Column({ name: 'section_id' })
  sectionId: string;

  @Column({ name: 'roll_no' })
  rollNo: number;

  @Column({ name: 'parent_contact', nullable: true })
  parentContact: string;

  @Column({ name: 'parent_email', nullable: true })
  parentEmail: string;

  @Column({ nullable: true })
  avatar: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Class)
  @JoinColumn({ name: 'class_id' })
  class: Class;

  @ManyToOne(() => Section)
  @JoinColumn({ name: 'section_id' })
  section: Section;
}
```

---

### Step 6: DTOs (Data Transfer Objects)

Create DTOs for validation. Example `students/dto/create-student.dto.ts`:

```typescript
import {
  IsString,
  IsNotEmpty,
  IsEmail,
  IsNumber,
  IsOptional,
  MaxLength,
} from 'class-validator';

export class CreateStudentDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  studentId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @IsString()
  @IsNotEmpty()
  classId: string;

  @IsString()
  @IsNotEmpty()
  sectionId: string;

  @IsNumber()
  @IsNotEmpty()
  rollNo: number;

  @IsString()
  @IsOptional()
  parentContact?: string;

  @IsEmail()
  @IsOptional()
  parentEmail?: string;

  @IsString()
  @IsOptional()
  avatar?: string;
}

export class UpdateStudentDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  classId?: string;

  @IsString()
  @IsOptional()
  sectionId?: string;

  @IsNumber()
  @IsOptional()
  rollNo?: number;

  @IsString()
  @IsOptional()
  parentContact?: string;

  @IsEmail()
  @IsOptional()
  parentEmail?: string;

  @IsString()
  @IsOptional()
  avatar?: string;
}
```

---

### Step 7: Service Layer (Business Logic)

Example `students/students.service.ts`:

```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Student } from './entities/student.entity';
import { CreateStudentDto, UpdateStudentDto } from './dto';

@Injectable()
export class StudentsService {
  constructor(
    @InjectRepository(Student)
    private studentsRepository: Repository<Student>,
  ) {}

  // CREATE
  async create(createStudentDto: CreateStudentDto): Promise<Student> {
    const student = this.studentsRepository.create(createStudentDto);
    return await this.studentsRepository.save(student);
  }

  // READ - List all
  async findAll(filters?: {
    classId?: string;
    sectionId?: string;
    search?: string;
  }): Promise<Student[]> {
    const query = this.studentsRepository.createQueryBuilder('student')
      .leftJoinAndSelect('student.class', 'class')
      .leftJoinAndSelect('student.section', 'section');

    if (filters?.classId) {
      query.andWhere('student.classId = :classId', { classId: filters.classId });
    }

    if (filters?.sectionId) {
      query.andWhere('student.sectionId = :sectionId', { sectionId: filters.sectionId });
    }

    if (filters?.search) {
      query.andWhere(
        '(student.name ILIKE :search OR student.studentId ILIKE :search)',
        { search: `%${filters.search}%` }
      );
    }

    return await query.getMany();
  }

  // READ - Get one by ID
  async findOne(studentId: string): Promise<Student> {
    const student = await this.studentsRepository.findOne({
      where: { studentId },
      relations: ['class', 'section'],
    });

    if (!student) {
      throw new NotFoundException(`Student with ID ${studentId} not found`);
    }

    return student;
  }

  // UPDATE
  async update(
    studentId: string,
    updateStudentDto: UpdateStudentDto,
  ): Promise<Student> {
    const student = await this.findOne(studentId);
    Object.assign(student, updateStudentDto);
    return await this.studentsRepository.save(student);
  }

  // DELETE
  async remove(studentId: string): Promise<void> {
    const student = await this.findOne(studentId);
    await this.studentsRepository.remove(student);
  }
}
```

---

### Step 8: Controller Layer (API Endpoints)

Example `students/students.controller.ts`:

```typescript
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { StudentsService } from './students.service';
import { CreateStudentDto, UpdateStudentDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('api/students')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  // POST /api/students - Create new student
  @Post()
  @Roles('admin', 'teacher')
  create(@Body() createStudentDto: CreateStudentDto) {
    return this.studentsService.create(createStudentDto);
  }

  // GET /api/students - List all students
  @Get()
  @Roles('admin', 'teacher')
  findAll(
    @Query('classId') classId?: string,
    @Query('sectionId') sectionId?: string,
    @Query('search') search?: string,
  ) {
    return this.studentsService.findAll({ classId, sectionId, search });
  }

  // GET /api/students/:id - Get student details
  @Get(':id')
  @Roles('admin', 'teacher', 'student', 'parent')
  findOne(@Param('id') id: string) {
    return this.studentsService.findOne(id);
  }

  // PATCH /api/students/:id - Update student
  @Patch(':id')
  @Roles('admin', 'teacher')
  update(@Param('id') id: string, @Body() updateStudentDto: UpdateStudentDto) {
    return this.studentsService.update(id, updateStudentDto);
  }

  // DELETE /api/students/:id - Delete student
  @Delete(':id')
  @Roles('admin')
  remove(@Param('id') id: string) {
    return this.studentsService.remove(id);
  }
}
```

---

### Step 9: Module Configuration

Example `students/students.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StudentsController } from './students.controller';
import { StudentsService } from './students.service';
import { Student } from './entities/student.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Student])],
  controllers: [StudentsController],
  providers: [StudentsService],
  exports: [StudentsService],
})
export class StudentsModule {}
```

---

### Step 10: Main App Configuration

Update `app.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { StudentsModule } from './modules/students/students.module';
import { TeachersModule } from './modules/teachers/teachers.module';
import { ClassesModule } from './modules/classes/classes.module';
import { SubjectsModule } from './modules/subjects/subjects.module';
import { ExamsModule } from './modules/exams/exams.module';
import { MarksModule } from './modules/marks/marks.module';
import { ResultsModule } from './modules/results/results.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DB_HOST'),
        port: config.get('DB_PORT'),
        username: config.get('DB_USERNAME'),
        password: config.get('DB_PASSWORD'),
        database: config.get('DB_DATABASE'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: config.get('NODE_ENV') === 'development',
        logging: true,
      }),
    }),
    AuthModule,
    UsersModule,
    StudentsModule,
    TeachersModule,
    ClassesModule,
    SubjectsModule,
    ExamsModule,
    MarksModule,
    ResultsModule,
  ],
})
export class AppModule {}
```

Update `main.ts`:

```typescript
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`🚀 Server running on http://localhost:${port}`);
}
bootstrap();
```

---

## ✅ API Endpoints Structure

### Students Module
```
POST   /api/students           - Create student
GET    /api/students           - List all students (with filters)
GET    /api/students/:id       - Get student details
PATCH  /api/students/:id       - Update student
DELETE /api/students/:id       - Delete student
```

### Similar structure for all modules:
- `/api/teachers`
- `/api/classes`
- `/api/sections`
- `/api/subjects`
- `/api/exams`
- `/api/exam-subjects`
- `/api/marks`
- `/api/results`
- `/api/academic-years`

---

## 🔐 Authentication Endpoints
```
POST /api/auth/register        - Register new user
POST /api/auth/login           - Login (returns JWT)
GET  /api/auth/me              - Get current user
POST /api/auth/logout          - Logout
```

---

## 📝 Next Steps:

1. Run database migrations
2. Seed initial data
3. Test APIs with Postman/Insomnia
4. Connect frontend to backend
5. Implement authentication flow

Would you like me to:
1. Create the authentication module code?
2. Provide frontend API integration code?
3. Create seed data scripts?
4. Show you the complete file structure with all modules?
