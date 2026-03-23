# School Exam Management System

A comprehensive school examination management system built with React, TypeScript, NestJS, and PostgreSQL. This system supports multi-language interfaces (English, Sanskrit, Hindi, Spanish) and provides complete functionality for managing students, teachers, classes, exams, marks, and results.

**Original Design:** [Figma Design](https://www.figma.com/design/MgpRjUSdKrJ3TSHuaXCnVi/School-Exam-Management-System)

## Features

- 🎓 **Complete Student Management** - Manage student records, classes, and sections
- 👨‍🏫 **Teacher Management** - Handle teacher assignments and subject allocations
- 📚 **Subject & Exam Management** - Create and manage subjects, exams, and timetables
- 📊 **Marks & Results** - Enter marks with internal/external breakdown (V2 system)
- 📄 **Report Cards** - Generate and download PDF report cards
- 🌍 **Multi-Language Support** - English, Sanskrit (संस्कृतम्), Hindi (हिन्दी), Spanish (Español)
- 🔐 **Authentication & RBAC** - Role-based access control (Admin, Teacher, Student, Parent)
- 📧 **Email Notifications** - Automated email notifications for result publishing
- 📱 **Responsive Design** - Modern, mobile-friendly UI

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling
- **Radix UI** - Component library
- **Sonner** - Toast notifications
- **jsPDF** - PDF generation

### Backend
- **NestJS** - Node.js framework
- **TypeORM** - ORM for PostgreSQL
- **PostgreSQL** - Database
- **JWT** - Authentication
- **Nodemailer** - Email service

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **npm** or **pnpm** or **yarn**
- **PostgreSQL** (v12 or higher)
- **Git**

## Installation & Setup

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd "School Exam Management System"
```

### 2. Install Dependencies

#### Frontend Dependencies
```bash
npm install
```

#### Backend Dependencies
```bash
cd backend
npm install
cd ..
```

### 3. Database Setup

#### Install PostgreSQL

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

**macOS:**
```bash
brew install postgresql
brew services start postgresql
```

**Windows:**
Download and install from [PostgreSQL Official Website](https://www.postgresql.org/download/windows/)

#### Create Database

```bash
# Login to PostgreSQL
sudo -u postgres psql

# Create database and user
CREATE DATABASE school_exam_db;
CREATE USER postgres WITH PASSWORD 'postgres';
ALTER USER postgres CREATEDB;
GRANT ALL PRIVILEGES ON DATABASE school_exam_db TO postgres;
\q
```

#### Run Database Migrations

```bash
cd backend
# The database tables will be created automatically by TypeORM on first run
# Or you can run the SQL scripts manually from backend/src/database/
```

### 4. Environment Variables Setup

#### Backend Environment Variables

```bash
cd backend
cp env.example .env
```

Edit `backend/.env` with your configuration:

```env
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=your_postgres_password
DATABASE_NAME=school_exam_db
NODE_ENV=development
PORT=3000

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRATION=7d

# Email Configuration (Gmail)
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-gmail-app-password
EMAIL_FROM=your-email@gmail.com
EMAIL_FROM_NAME=School Exam Management System
```

**Note:** For Gmail, you need to:
1. Enable 2-Factor Authentication
2. Generate an App Password: [Google App Passwords](https://myaccount.google.com/apppasswords)
3. Use the App Password in `EMAIL_PASS`

#### Frontend Environment Variables

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# API Configuration
VITE_API_URL=http://localhost:3000

# Authentication (Optional - set to 'true' to enable authentication)
VITE_ENABLE_AUTH=false
```

### 5. Run the Application

#### Start Backend Server

```bash
cd backend
npm run start:dev
```

The backend will run on `http://localhost:3000`

#### Start Frontend Development Server

```bash
# From the root directory
npm run dev
```

The frontend will run on `http://localhost:5173` (or the port shown in terminal)

### 6. Access the Application

Open your browser and navigate to:
```
http://localhost:5173
```

## Default Demo Credentials

If authentication is enabled (`VITE_ENABLE_AUTH=true`), you can use these demo accounts:

### Admin
- **Email:** `admin@school.edu`
- **Password:** `admin123`

### Teacher
- **Email:** `teacher@school.edu`
- **Password:** `teacher123`

### Student
- **Email:** `student@school.edu`
- **Password:** `student123`

### Parent
- **Email:** `parent@school.edu`
- **Password:** `parent123`

## Available Scripts

### Frontend Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Backend Scripts

```bash
cd backend

# Start development server (with hot reload)
npm run start:dev

# Start production server
npm run start:prod

# Build the project
npm run build

# Run database migrations (if any)
npm run migration:run
```

## Project Structure

```
School Exam Management System/
├── backend/                 # NestJS backend
│   ├── src/
│   │   ├── modules/         # Feature modules
│   │   │   ├── auth/        # Authentication
│   │   │   ├── users/       # User management
│   │   │   ├── students/    # Student management
│   │   │   ├── teachers/    # Teacher management
│   │   │   ├── classes/    # Class management
│   │   │   ├── sections/    # Section management
│   │   │   ├── subjects/   # Subject management
│   │   │   ├── exams/      # Exam management
│   │   │   ├── marks/      # Marks management
│   │   │   ├── results/    # Results management
│   │   │   └── notifications/ # Email notifications
│   │   ├── database/       # Database scripts
│   │   └── config/         # Configuration files
│   ├── env.example          # Backend environment template
│   └── package.json
├── src/                     # React frontend
│   ├── app/
│   │   ├── components/      # React components
│   │   ├── services/       # API services
│   │   ├── context/        # React context
│   │   ├── i18n/           # Multi-language support
│   │   │   └── translations/ # Translation files
│   │   ├── types/          # TypeScript types
│   │   └── utils/          # Utility functions
│   └── main.tsx
├── .env.example             # Frontend environment template
├── .gitignore              # Git ignore rules
└── README.md              # This file
```

## Multi-Language Support

The application supports 4 languages:
- **English** (en) - Default
- **Sanskrit** (sa) - संस्कृतम्
- **Hindi** (hi) - हिन्दी
- **Spanish** (es) - Español

Users can switch languages using the language selector in the header. The preference is saved in localStorage.

## Key Features Explained

### Marks Entry System (V2)

The system supports two types of marks entry:

1. **Unit Test Entry** - Simple marks entry (Marks Obtained / Total Marks)
2. **Final Exam Entry** - Detailed breakdown:
   - **Internal Marks (20%)**:
     - Unit Test: 10 marks (average/highest of all unit tests)
     - Assignment: 5 marks
     - Attendance: 5 marks
   - **External Marks (80%)**:
     - Final Exam: 80 marks (can be entered scaled from 100 or directly)

### Report Cards

- Generate PDF report cards for individual students
- Bulk PDF generation for notice boards
- Support for V2 internal/external marks breakdown
- Print-friendly format

### Sample Data Generation

The Settings page includes options to:
- Generate end-to-end sample data (Scaled Entry)
- Generate end-to-end sample data (Direct Entry)
- Generate single test student for verification
- Bulk delete all transactional data

## Troubleshooting

### Database Connection Issues

```bash
# Check PostgreSQL is running
sudo systemctl status postgresql  # Linux
brew services list                 # macOS

# Test connection
psql -U postgres -d school_exam_db -h localhost
```

### Port Already in Use

```bash
# Kill process on port 3000 (backend)
lsof -ti:3000 | xargs kill -9

# Kill process on port 5173 (frontend)
lsof -ti:5173 | xargs kill -9
```

### Environment Variables Not Loading

- Ensure `.env` files are in the correct directories (root for frontend, `backend/` for backend)
- Restart the development servers after changing `.env` files
- Check that variable names match exactly (case-sensitive)

### Email Not Sending

- Verify Gmail App Password is correct
- Check that 2FA is enabled on Gmail account
- Ensure `EMAIL_USER` and `EMAIL_FROM` match your Gmail address

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Support

For issues, questions, or contributions, please open an issue on GitHub.

## Acknowledgments

- Original design from [Figma](https://www.figma.com/design/MgpRjUSdKrJ3TSHuaXCnVi/School-Exam-Management-System)
- Built with React, NestJS, and PostgreSQL

---

**Happy Coding! 🚀**
