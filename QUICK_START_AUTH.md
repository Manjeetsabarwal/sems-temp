# 🚀 Quick Start: Authentication & RBAC

## ✅ Implementation Complete!

Phase 1 (Authentication & RBAC) has been successfully implemented without breaking any existing features.

---

## 🎯 Demo Credentials

**All users have password: `demo123`**

| Role | Email | Access Level |
|------|-------|--------------|
| 👨‍💼 **Admin** | `admin@school.edu` | Full system access |
| 👨‍🏫 **Teacher** | `teacher@school.edu` | Classes, Students, Marks, Results |
| 👨‍🎓 **Student** | `student@school.edu` | Own results, Report cards |
| 👨‍👩 **Parent** | `parent@school.edu` | Child's results, Report cards |

---

## 🚀 Quick Test (3 Steps)

### Step 1: Start Backend
```bash
cd backend
npm run start:dev
```

**Expected output:**
```
🚀 School Exam Management API is running on: http://localhost:3000
📚 Available endpoints:
   🔐 Authentication:
   - POST /api/auth/login
   - POST /api/auth/register
   - GET  /api/auth/me
```

### Step 2: Start Frontend

**Option A: Without Auth (Default - Works as Before)**
```bash
npm run dev
```
- ✅ No login required
- ✅ All features accessible
- ✅ Backward compatible

**Option B: With Auth Enabled**
```bash
# Set environment variable
export VITE_ENABLE_AUTH=true
npm run dev
```
- ✅ Login page appears
- ✅ Use demo credentials
- ✅ Full access after login

### Step 3: Test Login

**Via Browser:**
1. Go to `http://localhost:5173`
2. If auth enabled, see login page
3. Enter: `admin@school.edu` / `demo123`
4. Click "Sign In"
5. ✅ Should see dashboard

**Via API (curl):**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@school.edu","password":"demo123"}'
```

**Expected Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "userId": "USR-ADMIN-001",
    "email": "admin@school.edu",
    "name": "System Administrator",
    "role": "admin"
  }
}
```

---

## 📋 What's Working

### ✅ Backend
- [x] Users table created and seeded
- [x] Auth endpoints working (`/api/auth/login`, `/api/auth/register`, `/api/auth/me`)
- [x] JWT token generation and validation
- [x] RBAC guards and decorators ready
- [x] Password hashing (bcrypt)

### ✅ Frontend
- [x] Auth service created
- [x] Login component with demo credentials
- [x] Token auto-injection in API calls
- [x] Auth context integrated
- [x] Optional authentication (feature flag)
- [x] Logout functionality

### ✅ Database
- [x] Users table migrated
- [x] 4 demo users seeded
- [x] All passwords: `demo123`

---

## 🔧 Configuration

### Enable Authentication (Optional)

**Frontend:**
```bash
# In root directory, create .env or set:
VITE_ENABLE_AUTH=true
```

**Backend:**
```bash
# In backend/.env:
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRATION=7d
```

### Protect Endpoints (Optional)

Add guards to controllers:
```typescript
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('api/results')
export class ResultsController { ... }
```

**Note:** Currently all endpoints are PUBLIC (backward compatible)

---

## 🧪 Test Different Roles

1. **Login as Admin:**
   - Email: `admin@school.edu`
   - Password: `demo123`
   - ✅ Full access to all modules

2. **Login as Teacher:**
   - Email: `teacher@school.edu`
   - Password: `demo123`
   - ✅ Access to classes, students, marks, results

3. **Login as Student:**
   - Email: `student@school.edu`
   - Password: `demo123`
   - ✅ Access to own results, report cards

4. **Login as Parent:**
   - Email: `parent@school.edu`
   - Password: `demo123`
   - ✅ Access to child's results, report cards

---

## 📝 API Examples

### Login
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@school.edu",
  "password": "demo123"
}
```

### Get Current User (Protected)
```bash
GET /api/auth/me
Authorization: Bearer <token>
```

### Register New User
```bash
POST /api/auth/register
Content-Type: application/json

{
  "email": "newuser@school.edu",
  "password": "password123",
  "name": "New User",
  "role": "teacher"
}
```

---

## 🎉 Success!

**Phase 1 is complete and working!**

- ✅ Authentication implemented
- ✅ RBAC infrastructure ready
- ✅ Demo users available
- ✅ No breaking changes
- ✅ Backward compatible

**Ready for Phase 2: Result Publishing Notifications!** 🚀
