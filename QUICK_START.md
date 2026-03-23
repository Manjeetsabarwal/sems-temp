# Quick Start Guide

## 🚀 Quick Setup Commands

### 1. Clone & Install

```bash
# Clone repository
git clone <your-repo-url>
cd "School Exam Management System"

# Install frontend dependencies
npm install

# Install backend dependencies
cd backend && npm install && cd ..
```

### 2. Database Setup

```bash
# Start PostgreSQL (Linux)
sudo systemctl start postgresql

# Start PostgreSQL (macOS)
brew services start postgresql

# Create database
sudo -u postgres psql
CREATE DATABASE school_exam_db;
\q
```

### 3. Environment Setup

```bash
# Frontend
cp .env.example .env
# Edit .env with: VITE_API_URL=http://localhost:3000

# Backend
cd backend
cp env.example .env
# Edit .env with your database credentials
cd ..
```

### 4. Run Application

```bash
# Terminal 1 - Backend
cd backend
npm run start:dev

# Terminal 2 - Frontend
npm run dev
```

### 5. Access Application

Open browser: `http://localhost:5173`

## 📋 All Available Commands

### Frontend Commands

```bash
npm install          # Install dependencies
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
```

### Backend Commands

```bash
cd backend
npm install          # Install dependencies
npm run start:dev    # Start development server (hot reload)
npm run start:prod   # Start production server
npm run build        # Build the project
npm run migration:run # Run database migrations
```

### Git Commands

```bash
git init                                    # Initialize repository
git add .                                   # Stage all changes
git commit -m "Your message"                # Commit changes
git remote add origin <repo-url>           # Add remote
git push -u origin main                    # Push to GitHub
git status                                 # Check status
git log                                    # View commit history
```

### Database Commands

```bash
# Connect to PostgreSQL
psql -U postgres -d school_exam_db

# Common SQL commands
\l                    # List databases
\c school_exam_db     # Connect to database
\dt                   # List tables
\d table_name         # Describe table
\q                    # Quit
```

## 🔧 Troubleshooting Commands

```bash
# Kill process on port 3000 (backend)
lsof -ti:3000 | xargs kill -9

# Kill process on port 5173 (frontend)
lsof -ti:5173 | xargs kill -9

# Check PostgreSQL status
sudo systemctl status postgresql    # Linux
brew services list                  # macOS

# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

## 📝 Environment Variables Checklist

### Frontend (.env)
- [ ] `VITE_API_URL=http://localhost:3000`
- [ ] `VITE_ENABLE_AUTH=false` (or `true` to enable auth)

### Backend (backend/.env)
- [ ] `DATABASE_HOST=localhost`
- [ ] `DATABASE_PORT=5432`
- [ ] `DATABASE_USER=postgres`
- [ ] `DATABASE_PASSWORD=your_password`
- [ ] `DATABASE_NAME=school_exam_db`
- [ ] `PORT=3000`
- [ ] `JWT_SECRET=your-secret-key`
- [ ] `EMAIL_USER=your-email@gmail.com`
- [ ] `EMAIL_PASS=your-app-password`

## 🎯 Next Steps After Setup

1. ✅ Database is running
2. ✅ Environment variables are set
3. ✅ Dependencies are installed
4. ✅ Backend server is running (port 3000)
5. ✅ Frontend server is running (port 5173)
6. ✅ Open http://localhost:5173 in browser
7. ✅ Generate sample data from Settings page
8. ✅ Start using the application!

---

**Need help?** Check `README.md` for detailed documentation.
