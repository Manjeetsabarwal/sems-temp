# 🚀 Quick Start Guide - End-to-End Setup

## Get the complete system running in 30 minutes

---

## Prerequisites

```bash
# Check you have these installed
node --version   # v18+ required
npm --version    # v9+ required
psql --version   # PostgreSQL 14+ required
```

---

## Part 1: Database Setup (5 minutes)

### Step 1: Create Database

```bash
# Login to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE school_exam_db;

# Connect to database
\c school_exam_db

# Run the schema from BACKEND_SETUP_GUIDE.md
# Copy the entire schema.sql content and paste it here

# Exit psql
\q
```

### Step 2: Seed Initial Data

Create `seed.sql`:

```sql
-- Insert Academic Years
INSERT INTO academic_years (id, start_date, end_date, is_active) VALUES
('2024-25', '2024-04-01', '2025-03-31', false),
('2025-26', '2025-04-01', '2026-03-31', true);

-- Insert Classes
INSERT INTO classes (id, name) VALUES
('1', 'Class 1'), ('2', 'Class 2'), ('3', 'Class 3'),
('4', 'Class 4'), ('5', 'Class 5'), ('6', 'Class 6'),
('7', 'Class 7'), ('8', 'Class 8'), ('9', 'Class 9'),
('10', 'Class 10'), ('11', 'Class 11'), ('12', 'Class 12');

-- Insert Sections
INSERT INTO sections (id, class_id, name) VALUES
('9-A', '9', 'A'), ('9-B', '9', 'B'),
('10-A', '10', 'A'), ('10-B', '10', 'B'), ('10-C', '10', 'C'),
('11-A', '11', 'A'), ('11-B', '11', 'B'),
('12-A', '12', 'A');

-- Insert Subjects
INSERT INTO subjects (id, name, code, max_marks, pass_marks) VALUES
('MATH', 'Mathematics', 'MAT', 100, 35),
('SCI', 'Science', 'SCI', 100, 35),
('ENG', 'English', 'ENG', 100, 35),
('HIN', 'Hindi', 'HIN', 100, 35),
('SST', 'Social Studies', 'SST', 100, 35),
('CS', 'Computer Science', 'CS', 100, 35);

-- Insert Grade Rules
INSERT INTO grade_rules (min_percentage, grade, color) VALUES
(90, 'A+', '#10b981'),
(75, 'A', '#3b82f6'),
(60, 'B', '#8b5cf6'),
(45, 'C', '#f59e0b'),
(35, 'D', '#ef4444'),
(0, 'F', '#991b1b');

-- Insert Admin User (password: admin123)
-- Note: You'll need to hash this password properly in production
INSERT INTO users (email, password, name, role, is_active) VALUES
('admin@school.edu', '$2b$10$YourHashedPasswordHere', 'Dr. Rajesh Kumar', 'admin', true);

-- Insert Sample Students
INSERT INTO students (student_id, name, class_id, section_id, roll_no, parent_contact, parent_email) VALUES
('STU001', 'Rahul Sharma', '10', '10-A', 1, '9876543210', 'parent.sharma@email.com'),
('STU002', 'Priya Patel', '10', '10-A', 2, '9876543211', 'parent.patel@email.com'),
('STU003', 'Amit Kumar', '10', '10-A', 3, '9876543212', 'parent.kumar@email.com'),
('STU004', 'Sneha Reddy', '10', '10-A', 4, '9876543213', 'parent.reddy@email.com'),
('STU005', 'Arjun Singh', '10', '10-A', 5, '9876543214', 'parent.singh@email.com');

-- Insert Exam
INSERT INTO exams (exam_id, name, academic_year, weightage, type, status) VALUES
('MIDTERM-2025', 'Mid Term Examination', '2025-26', 40, 'midterm', 'completed'),
('FINAL-2025', 'Final Examination', '2025-26', 60, 'final', 'upcoming');

-- Insert Exam Timetable
INSERT INTO exam_subjects (exam_id, subject_id, class_id, exam_date, start_time, end_time) VALUES
('MIDTERM-2025', 'MATH', '10', '2025-09-10', '10:00:00', '13:00:00'),
('MIDTERM-2025', 'SCI', '10', '2025-09-12', '10:00:00', '13:00:00'),
('MIDTERM-2025', 'ENG', '10', '2025-09-14', '10:00:00', '13:00:00'),
('MIDTERM-2025', 'HIN', '10', '2025-09-16', '10:00:00', '13:00:00'),
('MIDTERM-2025', 'SST', '10', '2025-09-18', '10:00:00', '13:00:00'),
('MIDTERM-2025', 'CS', '10', '2025-09-20', '10:00:00', '13:00:00');

-- Insert Sample Marks
INSERT INTO marks (student_id, exam_id, subject_id, marks_obtained, is_absent) VALUES
('STU001', 'MIDTERM-2025', 'MATH', 95, false),
('STU001', 'MIDTERM-2025', 'SCI', 92, false),
('STU001', 'MIDTERM-2025', 'ENG', 88, false),
('STU001', 'MIDTERM-2025', 'HIN', 85, false),
('STU001', 'MIDTERM-2025', 'SST', 90, false),
('STU001', 'MIDTERM-2025', 'CS', 94, false);
```

Run the seed:

```bash
psql -U postgres -d school_exam_db -f seed.sql
```

---

## Part 2: Backend Setup (10 minutes)

```bash
# Create NestJS project
nest new school-exam-backend
cd school-exam-backend

# Install dependencies
npm install @nestjs/typeorm typeorm pg @nestjs/config @nestjs/passport passport passport-jwt @nestjs/jwt bcrypt class-validator class-transformer
npm install -D @types/bcrypt @types/passport-jwt

# Create .env file (use content from BACKEND_SETUP_GUIDE.md)
# Update with your database credentials

# Generate modules
nest g module modules/students
nest g controller modules/students
nest g service modules/students

# Repeat for: teachers, classes, subjects, exams, marks, results, auth

# Copy entity, DTO, service, and controller code from guides

# Start development server
npm run start:dev

# Backend should be running on http://localhost:3000
```

---

## Part 3: Frontend Setup (5 minutes)

```bash
# In this current project directory

# Install axios
npm install axios

# Create .env file
echo "VITE_API_URL=http://localhost:3000/api" > .env

# Create API service files (from FRONTEND_API_INTEGRATION.md)
# - src/app/services/api.ts
# - src/app/services/students.service.ts
# - src/app/services/exams.service.ts
# etc.

# Start frontend
npm run dev

# Frontend should be running on http://localhost:5173
```

---

## Part 4: Testing (10 minutes)

### Test Backend APIs with curl

```bash
# Test health
curl http://localhost:3000

# Test students endpoint (requires auth token)
curl http://localhost:3000/api/students \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Login to get token
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@school.edu","password":"admin123"}'
```

### Test with Postman

1. Import collection from `postman_collection.json` (create this)
2. Test all endpoints:
   - Auth: Login, Register
   - Students: CRUD operations
   - Exams: CRUD operations
   - Marks: Create, Read
   - Results: Get results

---

## Common Issues & Solutions

### Issue 1: Database Connection Failed

```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Verify credentials in .env
# Make sure DB_PASSWORD is correct
```

### Issue 2: CORS Error

```typescript
// In main.ts, ensure CORS is enabled
app.enableCors({
  origin: 'http://localhost:5173',
  credentials: true,
});
```

### Issue 3: Port Already in Use

```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port in .env
PORT=3001
```

### Issue 4: TypeORM Sync Issues

```typescript
// For development, use synchronize: true in database config
// For production, use migrations
synchronize: process.env.NODE_ENV === 'development',
```

---

## Project Structure Overview

```
school-exam-management/
├── school-exam-backend/          # NestJS Backend
│   ├── src/
│   │   ├── modules/
│   │   │   ├── students/
│   │   │   ├── exams/
│   │   │   ├── marks/
│   │   │   └── ...
│   │   ├── app.module.ts
│   │   └── main.ts
│   ├── .env
│   └── package.json
│
└── school-exam-frontend/         # React Frontend (current)
    ├── src/
    │   ├── app/
    │   │   ├── components/
    │   │   ├── services/
    │   │   ├── hooks/
    │   │   └── types/
    │   └── ...
    ├── .env
    └── package.json
```

---

## Next Steps After Setup

1. **Authentication**: Implement full JWT auth flow
2. **Validation**: Add proper form validation
3. **Error Handling**: Improve error messages
4. **Loading States**: Add skeleton loaders
5. **Testing**: Write unit and integration tests
6. **Deployment**: Deploy to production

---

## Deployment Checklist

### Backend (Railway/Heroku/AWS)

- [ ] Set environment variables
- [ ] Use production database (not local)
- [ ] Enable HTTPS
- [ ] Set up monitoring
- [ ] Configure logging
- [ ] Set up backup strategy

### Frontend (Vercel/Netlify)

- [ ] Update API URL to production
- [ ] Enable HTTPS
- [ ] Configure build settings
- [ ] Set up CDN
- [ ] Enable gzip compression

---

## Useful Commands

```bash
# Backend
npm run start:dev          # Development
npm run start:prod         # Production
npm run build             # Build
npm run test              # Run tests

# Frontend
npm run dev               # Development
npm run build             # Build
npm run preview           # Preview build

# Database
psql -U postgres -d school_exam_db    # Connect to DB
\dt                                   # List tables
\d students                           # Describe table
```

---

## Support & Documentation

- NestJS: https://docs.nestjs.com
- TypeORM: https://typeorm.io
- React: https://react.dev
- PostgreSQL: https://www.postgresql.org/docs

---

## 🎉 You're All Set!

Your School Exam Management System should now be running with:
- ✅ Full CRUD operations on all entities
- ✅ Role-based access control
- ✅ Real-time data from PostgreSQL
- ✅ RESTful API backend
- ✅ Modern React frontend
- ✅ Production-ready architecture

**Login Credentials (Demo):**
- Email: admin@school.edu
- Password: admin123

Happy coding! 🚀
