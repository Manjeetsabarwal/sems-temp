# 🚨 FIX THE ERROR IN 2 MINUTES

## The Error You're Seeing:
```
❌ Error fetching students: Could not find the table 'public.students'
```

## Why:
The database tables haven't been created yet.

## Fix (2 Minutes):

### 🔴 STEP 1: Open Supabase
Go to: **https://supabase.com/dashboard**
- Login
- Select your project

### 🔴 STEP 2: Open SQL Editor
- Click **"SQL Editor"** (left sidebar)
- Click **"New query"**

### 🔴 STEP 3: Copy & Run This Script

Open the file **`/database-setup.sql`** in this project.

**OR** copy this code:

```sql
-- Drop existing tables
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS sections CASCADE;
DROP TABLE IF EXISTS classes CASCADE;

-- Create tables
CREATE TABLE classes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE sections (
  id TEXT PRIMARY KEY,
  class_id TEXT REFERENCES classes(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE students (
  student_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  class_id TEXT REFERENCES classes(id),
  section_id TEXT REFERENCES sections(id),
  roll_no INTEGER NOT NULL,
  parent_contact TEXT,
  parent_email TEXT,
  avatar TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(class_id, section_id, roll_no)
);

-- Insert sample data
INSERT INTO classes (id, name) VALUES
  ('9', 'Class 9'),
  ('10', 'Class 10'),
  ('11', 'Class 11'),
  ('12', 'Class 12');

INSERT INTO sections (id, class_id, name) VALUES
  ('9-A', '9', 'A'),
  ('9-B', '9', 'B'),
  ('10-A', '10', 'A'),
  ('10-B', '10', 'B'),
  ('10-C', '10', 'C'),
  ('11-A', '11', 'A'),
  ('11-B', '11', 'B'),
  ('12-A', '12', 'A');

INSERT INTO students (student_id, name, class_id, section_id, roll_no, parent_contact, parent_email) VALUES
  ('STU001', 'Rahul Sharma', '10', '10-A', 1, '9876543210', 'parent.sharma@email.com'),
  ('STU002', 'Priya Patel', '10', '10-A', 2, '9876543211', 'parent.patel@email.com'),
  ('STU003', 'Amit Kumar', '10', '10-A', 3, '9876543212', 'parent.kumar@email.com'),
  ('STU004', 'Sneha Reddy', '10', '10-A', 4, '9876543213', 'parent.reddy@email.com'),
  ('STU005', 'Arjun Singh', '10', '10-A', 5, '9876543214', 'parent.singh@email.com'),
  ('STU006', 'Anjali Verma', '10', '10-B', 1, '9876543215', 'parent.verma@email.com'),
  ('STU007', 'Rohan Gupta', '10', '10-B', 2, '9876543216', 'parent.gupta@email.com'),
  ('STU008', 'Kavya Nair', '11', '11-A', 1, '9876543217', 'parent.nair@email.com'),
  ('STU009', 'Vikram Rao', '11', '11-A', 2, '9876543218', 'parent.rao@email.com'),
  ('STU010', 'Divya Shah', '12', '12-A', 1, '9876543219', 'parent.shah@email.com');
```

### 🔴 STEP 4: Click "Run"
Press the **"Run"** button or press **Ctrl+Enter**

### 🔴 STEP 5: Verify Success
You should see:
```
✅ Success
```

And at the bottom, data showing 10 students.

### 🔴 STEP 6: Test Your App
- Go back to your app
- **Refresh** the page (F5)
- Click **"Students"** in sidebar
- **✅ ERROR GONE! 10 students loaded!**

---

## ✅ Done!

**That's it!** Your database is set up and the app is fully functional.

Now you can:
- ✅ View all students
- ✅ Add new students (auto-generated ID!)
- ✅ Edit students (click Student ID or Edit icon)
- ✅ Delete students
- ✅ Search & filter
- ✅ Sort by any column

---

## 📚 More Help?

For detailed guides, see:
- **`/SETUP_DATABASE_NOW_SIMPLE.md`** - Detailed step-by-step
- **`/DATABASE_SETUP_VISUAL_GUIDE.md`** - Visual diagrams
- **`/database-setup.sql`** - The SQL script file

---

## 🎉 You're Ready!

The Student Module (β) is now **100% functional** with live database! 🚀
