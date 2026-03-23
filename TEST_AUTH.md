# 🧪 Testing Authentication & RBAC

## Quick Test Guide

### Step 1: Verify Backend is Running

```bash
cd backend
npm run start:dev
```

You should see:
```
🚀 School Exam Management API is running on: http://localhost:3000
📚 Available endpoints:
   🔐 Authentication:
   - POST /api/auth/login
   - POST /api/auth/register
   - GET  /api/auth/me
```

### Step 2: Test Login API (Optional - Direct API Test)

```bash
# Test login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@school.edu","password":"demo123"}'

# Expected response:
# {
#   "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
#   "user": {
#     "userId": "USR-ADMIN-001",
#     "email": "admin@school.edu",
#     "name": "System Administrator",
#     "role": "admin"
#   }
# }

# Test protected endpoint (requires token)
curl http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer <token-from-above>"
```

### Step 3: Test Frontend (Without Auth - Default)

1. **Start frontend:**
   ```bash
   npm run dev
   ```

2. **Access:** `http://localhost:5173`
   - Should work normally (no login required)
   - All features accessible
   - Header shows "Demo Admin"

### Step 4: Test Frontend (With Auth Enabled)

1. **Enable authentication:**
   ```bash
   # Create .env file in root or set:
   export VITE_ENABLE_AUTH=true
   npm run dev
   ```

2. **Access:** `http://localhost:5173`
   - Should show login page
   - Try demo credentials:
     - `admin@school.edu` / `demo123`
     - `teacher@school.edu` / `demo123`
     - `student@school.edu` / `demo123`
     - `parent@school.edu` / `demo123`

3. **After login:**
   - Should see main dashboard
   - Header shows logged-in user
   - Logout button available

### Step 5: Test Role-Based Access

1. **Login as Admin:**
   - Full access to all modules
   - Can switch roles in header

2. **Login as Teacher:**
   - Access to classes, students, marks, results
   - Dashboard shows teacher view

3. **Login as Student:**
   - Access to own results, report cards
   - Dashboard shows student view

4. **Login as Parent:**
   - Access to child's results, report cards
   - Dashboard shows parent view

---

## Demo Credentials Quick Reference

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@school.edu` | `demo123` |
| Teacher | `teacher@school.edu` | `demo123` |
| Student | `student@school.edu` | `demo123` |
| Parent | `parent@school.edu` | `demo123` |

---

## Troubleshooting

### Issue: "Invalid credentials"
- ✅ Check email/password spelling
- ✅ Verify user exists in database: `SELECT * FROM users;`
- ✅ Check password hash is correct

### Issue: "No authentication token found"
- ✅ Make sure you logged in successfully
- ✅ Check `localStorage.getItem('access_token')` in browser console
- ✅ Token should be present after login

### Issue: "401 Unauthorized"
- ✅ Token might be expired (7 days default)
- ✅ Try logging in again
- ✅ Check backend JWT_SECRET matches

### Issue: Login page not showing
- ✅ Check `VITE_ENABLE_AUTH=true` is set
- ✅ Restart frontend server
- ✅ Check browser console for errors

### Issue: Can't access endpoints
- ✅ By default, all endpoints are PUBLIC (no auth required)
- ✅ Only `/api/users` and `/api/auth/me` require auth
- ✅ Other endpoints work without login

---

## Database Verification

```sql
-- Check users table
SELECT user_id, email, role, name, is_active FROM users;

-- Expected output:
-- user_id        | email              | role    | name                  | is_active
-- USR-ADMIN-001  | admin@school.edu   | admin   | System Administrator  | true
-- USR-TEACHER-001| teacher@school.edu | teacher | Dr. Sample Teacher    | true
-- USR-STUDENT-001| student@school.edu | student | Sample Student        | true
-- USR-PARENT-001 | parent@school.edu  | parent  | Sample Parent         | true
```

---

## Next Steps

Once authentication is working:

1. **Enable endpoint protection** (optional):
   - Add `@UseGuards(JwtAuthGuard)` to controllers
   - Add `@Roles()` for role-based access

2. **Test result publishing notifications** (Phase 2)

3. **Create student/parent portals** (Phase 3)

---

## Success Criteria ✅

- [x] Can login with demo credentials
- [x] JWT token is stored after login
- [x] Token is sent with API requests
- [x] Can access `/api/auth/me` with token
- [x] Can logout and clear token
- [x] System works without auth (backward compatible)
- [x] System works with auth enabled (feature flag)
