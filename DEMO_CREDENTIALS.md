# 🔐 Demo Credentials for Testing

## Authentication is **OPTIONAL** by Default

The system works without authentication by default. To enable authentication:

1. Create a `.env` file in the root directory (or set environment variable):
   ```env
   VITE_ENABLE_AUTH=true
   ```

2. Restart the frontend server

---

## 🆕 Sign Up / Register

**New users can create accounts with any role!**

1. **Enable authentication** (set `VITE_ENABLE_AUTH=true`)
2. On the login screen, click **"Sign Up"**
3. Fill in the registration form:
   - Full Name
   - Email
   - Phone (optional)
   - **Role** (Admin, Teacher, Student, or Parent)
   - Password (minimum 6 characters)
   - Confirm Password
4. Click **"Create Account"**
5. You'll be automatically logged in after registration

**Note:** All roles are available for self-registration. In production, you may want to restrict certain roles (like Admin) to be created only by existing admins.

---

## Demo User Accounts

All demo users have the password: **`demo123`**

### 👨‍💼 Admin User
- **Email:** `admin@school.edu`
- **Password:** `demo123`
- **Role:** Admin
- **Access:** Full system access

### 👨‍🏫 Teacher User
- **Email:** `teacher@school.edu`
- **Password:** `demo123`
- **Role:** Teacher
- **Access:** Can view and manage classes, students, marks, results

### 👨‍🎓 Student User
- **Email:** `student@school.edu`
- **Password:** `demo123`
- **Role:** Student
- **Access:** Can view own results, report cards, exam schedule

### 👨‍👩 Parent User
- **Email:** `parent@school.edu`
- **Password:** `demo123`
- **Role:** Parent
- **Access:** Can view child's results, report cards

---

## How to Test

### Option 1: With Authentication Enabled

1. Set `VITE_ENABLE_AUTH=true` in your environment
2. Start the application
3. You'll see the login page
4. Use any of the demo credentials above

### Option 2: Without Authentication (Default)

1. Don't set `VITE_ENABLE_AUTH` (or set it to `false`)
2. Start the application
3. You'll have full access without login (backward compatible)

---

## Backend API Protection

Currently, **all endpoints are PUBLIC** by default to maintain backward compatibility.

To protect endpoints, add guards to controllers:

```typescript
// Example: Protect a controller
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.TEACHER)
@Controller('api/results')
export class ResultsController { ... }
```

---

## Creating New Users

You can create new users via:

1. **API Endpoint:**
   ```bash
   POST /api/auth/register
   {
     "email": "newuser@school.edu",
     "password": "password123",
     "name": "New User",
     "role": "teacher"
   }
   ```

2. **Database:**
   ```sql
   -- Use bcrypt to hash password first
   INSERT INTO users (user_id, email, password_hash, role, name, is_active)
   VALUES (
     'USR-NEW-001',
     'newuser@school.edu',
     '$2b$10$...', -- bcrypt hash of password
     'teacher',
     'New User',
     TRUE
   );
   ```

---

## Notes

- All passwords are hashed using bcrypt (10 rounds)
- JWT tokens expire after 7 days (configurable in `JWT_EXPIRATION`)
- Users can be deactivated by setting `is_active = FALSE` in the database
- Student and Parent users can be linked to student records via `student_id`
- Teacher users can be linked to teacher records via `teacher_id`
