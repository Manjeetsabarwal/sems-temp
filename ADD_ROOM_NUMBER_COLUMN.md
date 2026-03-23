# Fix: Add room_number Column to Sections Table

## Problem
Sections API is returning 500 error because the `room_number` column doesn't exist in the database.

## Solution

### Option 1: Using pgAdmin (Recommended)

1. Open **pgAdmin**
2. Connect to your PostgreSQL server
3. Navigate to: **Databases** → **school_exam_db** → **Schemas** → **public** → **Tables** → **sections**
4. Right-click on **sections** → **Query Tool**
5. Run this SQL:

```sql
ALTER TABLE sections ADD COLUMN IF NOT EXISTS room_number TEXT;
```

6. Click **Execute** (F5)

### Option 2: Using psql Command Line

```bash
sudo -u postgres psql -d school_exam_db -c "ALTER TABLE sections ADD COLUMN IF NOT EXISTS room_number TEXT;"
```

Or if you have a different PostgreSQL user:

```bash
psql -U your_username -d school_exam_db -c "ALTER TABLE sections ADD COLUMN IF NOT EXISTS room_number TEXT;"
```

### Option 3: Re-run Database Setup (if you don't have data to preserve)

If you don't have important data in the sections table, you can re-run the init script:

```bash
cd "/home/ratxen/Downloads/School Exam Management System/backend/src/database"
psql -U postgres -d school_exam_db -f init.sql
```

**⚠️ WARNING:** This will delete all existing data!

---

## After Adding the Column

1. **Restart the backend:**
```bash
cd "/home/ratxen/Downloads/School Exam Management System/backend"
npm run start:dev
```

2. **Test the API:**
```bash
curl http://localhost:3000/api/sections
```

3. **Refresh the frontend** - sections should now load correctly.

---

## Verify the Column Was Added

Run this in pgAdmin Query Tool:

```sql
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'sections' AND column_name = 'room_number';
```

You should see:
```
column_name  | data_type | is_nullable
-------------|-----------|-------------
room_number  | text      | YES
```
