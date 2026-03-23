# 🧪 Phase 3: Portals Testing Guide

## ✅ Setup Complete

Demo users have been linked to students and teachers:
- **Student User** (`student@school.edu`) → Linked to **STU001 (Manish Rao)**
- **Parent User** (`parent@school.edu`) → Linked to **STU001 (Manish Rao)**
- **Teacher User** (`teacher@school.edu`) → Linked to **TCH001 (Riya Bansal)**

---

## 🧪 Testing Steps

### Test 1: Student Portal

1. **Login:**
   - Email: `student@school.edu`
   - Password: `demo123`

2. **Expected:**
   - ✅ See Student Portal dashboard
   - ✅ Welcome message: "Welcome, Sample Student!"
   - ✅ Statistics cards showing:
     - Published Results count
     - Passed Exams count
     - Average Percentage
     - Best Grade
   - ✅ "My Results" section (if results published for STU001)
   - ✅ "Upcoming Exams" section

3. **Actions:**
   - Click on any result to see details modal
   - View subject-wise marks
   - Click "View Report Card" button

### Test 2: Parent Portal

1. **Login:**
   - Email: `parent@school.edu`
   - Password: `demo123`

2. **Expected:**
   - ✅ See Parent Portal dashboard
   - ✅ Welcome message: "Welcome, Sample Parent! Viewing results for Manish Rao"
   - ✅ Statistics cards (same as student)
   - ✅ "Manish Rao's Results" section
   - ✅ "Upcoming Exams" section

3. **Actions:**
   - Click on any result to see child's details
   - View subject-wise performance
   - Click "View Report Card" button

### Test 3: Teacher Portal

1. **Login:**
   - Email: `teacher@school.edu`
   - Password: `demo123`

2. **Expected:**
   - ✅ See Teacher Portal dashboard
   - ✅ Welcome message: "Welcome, Dr. Sample Teacher!"
   - ✅ Class selector buttons
   - ✅ Statistics cards:
     - Total Students
     - Results Published
     - Average %
     - Pass Rate
   - ✅ Class Results list
   - ✅ Grade Distribution chart
   - ✅ Upcoming Exams grid

3. **Actions:**
   - Click different class buttons to filter results
   - View student-wise results
   - See grade distribution visualization

### Test 4: Admin Dashboard (Unchanged)

1. **Login:**
   - Email: `admin@school.edu`
   - Password: `demo123`

2. **Expected:**
   - ✅ See Admin Dashboard (unchanged)
   - ✅ Full system statistics
   - ✅ All modules accessible

---

## 🔗 Linking New Users

### Link Student User to Student Record

```sql
UPDATE users 
SET student_id = 'STU001'  -- Replace with actual student ID
WHERE user_id = 'USR-STUDENT-001';
```

### Link Parent User to Child's Student Record

```sql
UPDATE users 
SET student_id = 'STU001'  -- Replace with child's student ID
WHERE user_id = 'USR-PARENT-001';
```

### Link Teacher User to Teacher Record

```sql
UPDATE users 
SET teacher_id = 'TCH001'  -- Replace with actual teacher ID
WHERE user_id = 'USR-TEACHER-001';
```

### During Registration

When registering a new user, include `studentId` or `teacherId`:

```json
{
  "email": "newstudent@school.edu",
  "password": "password123",
  "name": "New Student",
  "role": "student",
  "studentId": "STU001"  // Link to student record
}
```

---

## 📊 Portal Data Requirements

### For Student Portal to Work:

1. **User must have `studentId` linked:**
   ```sql
   SELECT user_id, student_id FROM users WHERE role = 'student';
   ```

2. **Student record must exist:**
   ```sql
   SELECT student_id, name FROM students WHERE student_id = 'STU001';
   ```

3. **Published results must exist:**
   ```sql
   SELECT * FROM results 
   WHERE student_id = 'STU001' 
   AND status = 'Published';
   ```

### For Parent Portal to Work:

1. **User must have `studentId` linked (child's ID):**
   ```sql
   SELECT user_id, student_id FROM users WHERE role = 'parent';
   ```

2. **Child's student record must exist**

3. **Published results for child must exist**

### For Teacher Portal to Work:

1. **User can have `teacherId` linked (optional):**
   - Portal works without teacherId
   - Shows all classes and results
   - Can be filtered by teacher assignments later

2. **Published results must exist:**
   ```sql
   SELECT * FROM results WHERE status = 'Published';
   ```

---

## 🐛 Troubleshooting

### Issue: "Student ID not found"

**Cause:** User doesn't have `studentId` linked

**Fix:**
```sql
UPDATE users 
SET student_id = 'STU001'  -- Use actual student ID
WHERE user_id = 'USR-STUDENT-001';
```

### Issue: "No published results available"

**Cause:** No results published for the student

**Fix:**
1. Create marks for the student
2. Calculate result from marks
3. Publish the result

### Issue: Portal shows wrong data

**Cause:** User linked to wrong student/teacher

**Fix:**
```sql
-- Check current link
SELECT u.user_id, u.student_id, s.name 
FROM users u 
LEFT JOIN students s ON u.student_id = s.student_id 
WHERE u.user_id = 'USR-STUDENT-001';

-- Update to correct student
UPDATE users 
SET student_id = 'STU002'  -- Correct student ID
WHERE user_id = 'USR-STUDENT-001';
```

### Issue: Parent sees "No Child Linked"

**Cause:** Parent user doesn't have `studentId` linked

**Fix:**
```sql
UPDATE users 
SET student_id = 'STU001'  -- Child's student ID
WHERE user_id = 'USR-PARENT-001';
```

---

## ✅ Verification Checklist

- [ ] Student user has `studentId` linked
- [ ] Parent user has `studentId` linked (child's ID)
- [ ] Teacher user has `teacherId` linked (optional)
- [ ] Student record exists for linked `studentId`
- [ ] Published results exist for student
- [ ] Portals load without errors
- [ ] Statistics display correctly
- [ ] Results list shows data
- [ ] Result details modal works
- [ ] Upcoming exams display
- [ ] Report card link works

---

## 🎉 Success!

If all tests pass, Phase 3 is working correctly!

**Portals are ready for use!** 🚀
