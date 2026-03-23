# 📌 Migration Quick Reference Card

> **Print this or keep it handy during migration!**

---

## 🎯 Three Paths, Choose One

### Path 1: Fix Empty Database (2 min)
```
Settings → Database Population Tool → Start Population → Wait → Refresh
```
**Result:** Dashboard and Results show data  
**Doc:** NO_DATA_AFTER_FIX.md

---

### Path 2: Local Development (30 min)
```bash
# 1. Install tools
brew install postgresql node

# 2. Create database
psql -U postgres
CREATE DATABASE school_exam_db;

# 3. Backend (NestJS)
npm i -g @nestjs/cli
nest new school-exam-api
cd school-exam-api
npm install @nestjs/typeorm typeorm pg @nestjs/config

# 4. Frontend
npm create vite@latest frontend -- --template react-ts
cd frontend
npm install react-router-dom lucide-react sonner recharts

# 5. Run
# Terminal 1: cd backend && npm run start:dev
# Terminal 2: cd frontend && npm run dev
```
**Result:** App running on localhost  
**Doc:** QUICK_START_LOCAL_SETUP.md

---

### Path 3: Full Production (4-8 hours)
**Steps:** Export code → Setup backend → Migrate DB → Update frontend → Deploy  
**Result:** Production-ready system on your infrastructure  
**Doc:** MIGRATION_GUIDE_FIGMA_TO_LOCAL.md

---

## 📋 Essential Commands

### Database
```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE school_exam_db;

# List databases
\l

# Connect to database
\c school_exam_db

# List tables
\dt

# Exit
\q
```

### NestJS Backend
```bash
# Install CLI
npm i -g @nestjs/cli

# Create project
nest new my-api

# Generate module
nest g module students
nest g controller students
nest g service students

# Run dev server
npm run start:dev

# Build for production
npm run build
npm run start:prod
```

### Frontend (Vite)
```bash
# Create project
npm create vite@latest . -- --template react-ts

# Install dependencies
npm install

# Run dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

---

## 🔧 Configuration Files

### Backend .env
```env
NODE_ENV=development
PORT=4000
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=school_exam_db
```

### Frontend .env
```env
VITE_API_URL=http://localhost:4000
```

### NestJS main.ts (CORS)
```typescript
app.enableCors({
  origin: 'http://localhost:3000',
  credentials: true,
});
```

---

## 📊 Database Tables

```sql
-- Students
students_2fbe5237 (studentid, name, classid, sectionid, rollno, parentcontact, parentemail, status)

-- Teachers
teachers_2fbe5237 (teacherid, name, subject, email, phone, status)

-- Exams
exams_2fbe5237 (examid, examname, academicyear, startdate, enddate, totalmarks, status)

-- Subjects
subjects_2fbe5237 (subjectid, subjectname, subjectcode, maxmarks, status)

-- Classes
classes_2fbe5237 (classid, classname, academicyearid)

-- Sections
sections_2fbe5237 (sectionid, sectionname, classid, teacherid)

-- Marks
marks_2fbe5237 (markid, studentid, examid, subjectid, marksobtained, maxmarks, grade)
```

---

## 🚀 API Endpoints

```
Base URL (Figma Make):  https://{projectId}.supabase.co/functions/v1/make-server-2fbe5237
Base URL (Local):       http://localhost:4000

Students:
  GET    /api/students          - List all
  POST   /api/students          - Create
  GET    /api/students/:id      - Get one
  PUT    /api/students/:id      - Update
  DELETE /api/students/:id      - Delete

Exams:
  GET    /api/exams
  POST   /api/exams
  GET    /api/exams/:id
  PUT    /api/exams/:id
  DELETE /api/exams/:id

Teachers:
  GET    /api/teachers
  POST   /api/teachers
  GET    /api/teachers/:id
  PUT    /api/teachers/:id
  DELETE /api/teachers/:id

Results:
  GET    /api/kv/results
  POST   /api/kv/results
  DELETE /api/kv/results/:id
  POST   /api/kv/results/calculate-ranks/:examId
```

---

## 🔍 Troubleshooting

### Port already in use
```bash
# Find process
lsof -i :4000

# Kill process
kill -9 <PID>
```

### PostgreSQL not running
```bash
# macOS
brew services start postgresql@14

# Ubuntu
sudo systemctl start postgresql

# Windows
net start postgresql-x64-14
```

### CORS error
```typescript
// Add to main.ts (NestJS) or server.ts (Express)
app.enableCors({
  origin: 'http://localhost:3000',
  credentials: true,
});
```

### Database connection failed
```bash
# Check credentials in .env
# Reset password if needed
psql -U postgres
ALTER USER postgres WITH PASSWORD 'postgres';
```

---

## 📦 Dependencies

### Frontend
```json
{
  "react": "^18.x",
  "react-router-dom": "^6.x",
  "lucide-react": "latest",
  "sonner": "latest",
  "recharts": "^2.x",
  "tailwindcss": "next",
  "react-hook-form": "7.55.0",
  "@radix-ui/react-*": "latest"
}
```

### Backend (NestJS)
```json
{
  "@nestjs/core": "^10.x",
  "@nestjs/typeorm": "^10.x",
  "typeorm": "^0.3.x",
  "pg": "^8.x",
  "@nestjs/config": "^3.x",
  "class-validator": "^0.14.x",
  "class-transformer": "^0.5.x"
}
```

---

## 🎯 Testing Checklist

### Frontend
- [ ] App loads without errors
- [ ] Students page displays
- [ ] Can create student
- [ ] Can edit student
- [ ] Can delete student
- [ ] Dashboard shows data
- [ ] No console errors

### Backend
- [ ] Server starts on port 4000
- [ ] GET /api/students returns data
- [ ] POST /api/students creates record
- [ ] PUT /api/students/:id updates
- [ ] DELETE /api/students/:id removes
- [ ] Database queries work
- [ ] No CORS errors

### Database
- [ ] PostgreSQL running
- [ ] Database exists
- [ ] Tables created
- [ ] Sample data inserted
- [ ] Queries work
- [ ] Foreign keys valid

---

## 📞 Quick Links

| Resource | Link |
|----------|------|
| **Quick Start** | QUICK_START_LOCAL_SETUP.md |
| **Full Guide** | MIGRATION_GUIDE_FIGMA_TO_LOCAL.md |
| **Fix Empty DB** | NO_DATA_AFTER_FIX.md |
| **NestJS Docs** | https://docs.nestjs.com |
| **PostgreSQL** | https://www.postgresql.org/docs/ |
| **Vite Docs** | https://vitejs.dev |

---

## 🎓 Key Concepts

### Project Structure
```
school-exam-system/
├── frontend/           # React app
│   ├── src/
│   │   ├── components/
│   │   ├── services/   # API calls
│   │   ├── types/
│   │   └── config/     # API_BASE_URL
│   └── package.json
│
├── backend/            # NestJS/Express
│   ├── src/
│   │   ├── students/
│   │   ├── exams/
│   │   ├── teachers/
│   │   └── main.ts
│   └── package.json
│
└── README.md
```

### Data Flow
```
User Action (Frontend)
    ↓
React Component
    ↓
Service File (fetch API)
    ↓
HTTP Request
    ↓
Backend API (NestJS/Express)
    ↓
Database Query (TypeORM/pg)
    ↓
PostgreSQL Database
    ↓
Response ← ← ← ← ← ← ← ←
    ↓
Frontend Updates
```

---

## ✅ Success Criteria

### You're done when:
- ✅ Backend runs on localhost:4000
- ✅ Frontend runs on localhost:3000
- ✅ Database has all tables
- ✅ Students CRUD works
- ✅ No CORS errors
- ✅ No console errors
- ✅ Dashboard shows data

---

## 🚀 Deployment Quick Reference

### Frontend (Vercel)
```bash
npm install -g vercel
cd frontend
vercel
```

### Backend (Heroku)
```bash
npm install -g heroku
heroku login
heroku create my-api
git push heroku main
```

### Database (ElephantSQL/Heroku)
```bash
# Heroku
heroku addons:create heroku-postgresql:hobby-dev

# ElephantSQL
# Go to https://www.elephantsql.com
# Create free instance
# Copy connection string to .env
```

---

**🎉 You're ready to migrate! Good luck! 🚀**

*Print this card or save it for quick reference during your migration.*
