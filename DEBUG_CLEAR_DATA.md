# 🔍 Clear Data Debugging Guide

## How to Verify Clear Data Function Works

### Step 1: Open Browser Console
- Press `F12` (or right-click → Inspect)
- Go to **Console** tab
- Keep it open during the clear operation

### Step 2: Click "Clear All Data"
- Navigate to Database module
- Click the red "Clear All Data" button
- Confirm twice

### Step 3: Check Console Logs

You should see logs like:

```
🗑️🗑️🗑️ CLEARING ALL DATA FROM SYSTEM...
Fetching entries for prefix: teacher:
Found X entries for teacher:
Deleting X keys from teacher:
✅ Deleted X entries from teacher:
Fetching entries for prefix: class:
Found X entries for class:
...
Clearing Postgres tables...
✅ Cleared students table
✅ Cleared marks table
✅✅✅ CLEARED ALL DATA: X KV entries + Postgres tables
```

### Step 4: Verify Data is Gone

Check each module:

| Module | What to Check | Expected Result |
|--------|---------------|-----------------|
| Students | Navigate to Students page | "No students found" or empty list |
| Academic Year | Navigate to Academic Year | Empty grid/list |
| Classes | Navigate to Classes & Sections | No classes shown |
| Sections | Navigate to Classes & Sections | No sections shown |
| Teachers | Navigate to Teachers | Empty list |
| Subjects | Navigate to Subjects | Empty list |
| Exams | Navigate to Exams | Empty list |
| Marks Entry | Try to load marks | No data found |
| Results | Navigate to Results | Empty list |
| Report Cards | Navigate to Report Cards | Empty list |
| Timetable | Navigate to Timetable | Empty calendar |

---

## Common Console Messages Explained

### Success Messages:
- `✅ Deleted X entries from [prefix]` - KV store data cleared
- `✅ Cleared students table` - Postgres students cleared
- `✅ Cleared marks table` - Postgres marks cleared
- `✅✅✅ CLEARED ALL DATA` - Operation complete

### Error Messages:
- `Error clearing prefix [name]` - Specific prefix failed
- `Error clearing students` - Postgres students table error
- `Error clearing marks` - Postgres marks table error
- `Could not construct key for entry` - Key reconstruction issue

---

## If Clear Doesn't Work Completely

### Problem: Students still showing
**Debug:**
1. Check console for: `✅ Cleared students table`
2. If missing, there was a Postgres error
3. Refresh the Students page
4. Try clearing again

### Problem: Subjects/Exams/Academic Years still showing
**Debug:**
1. Check console for: `Found X entries for sems:subject:` or similar
2. Look for: `✅ Deleted X entries from sems:subject:`
3. If you see "Found X" but not "Deleted X", the key construction failed
4. Check the console for: `Could not construct key for entry`

### Problem: Teachers/Classes still showing
**Debug:**
1. Check console for: `Found X entries for teacher:` or `class:`
2. Look for successful deletion message
3. Refresh the page

---

## Manual Verification Steps

After clearing, do this:

1. **Open Network Tab** (F12 → Network)
2. **Navigate to Students**
   - Look for API call to `/api/students`
   - Check response - should be empty array `[]`
3. **Navigate to Exams**
   - Look for API call to `/api/kv/exams`
   - Check response - should be empty array `[]`
4. **Navigate to Academic Year**
   - Look for API call to `/api/kv/academic-years`
   - Check response - should be empty array `[]`

---

## Testing the Clear Function

### Quick Test:
1. Create 1 academic year
2. Create 1 class
3. Create 1 section
4. Create 1 student
5. Create 1 subject
6. Create 1 exam
7. **Clear All Data**
8. Check if all 6 items are gone

### Full Test:
1. Use the Data Populator to create sample data
2. Verify data exists in all modules
3. **Clear All Data**
4. Verify all modules show empty

---

## API Endpoint Details

The clear endpoint: `DELETE /api/data/clear-everything`

**What it clears:**

**KV Store Prefixes:**
- `teacher:` - Teachers
- `class:` - Classes
- `section:` - Sections
- `sems:subject:` - Subjects
- `sems:exam:` - Exams
- `sems:timetable:` - Timetable entries
- `sems:academicyear:` - Academic years
- `sems:mark:` - Marks (if stored in KV)
- `sems:result:` - Results
- `sems:reportcard:` - Report cards

**Postgres Tables:**
- `students_2fbe5237` - All students
- `marks_2fbe5237` - All marks

---

## Expected Console Output (Example)

```javascript
🗑️🗑️🗑️ CLEARING ALL DATA FROM SYSTEM...
Fetching entries for prefix: teacher:
Found 5 entries for teacher:
Deleting 5 keys from teacher: ['teacher:TCH-001', 'teacher:TCH-002', 'teacher:TCH-003']
✅ Deleted 5 entries from teacher:

Fetching entries for prefix: class:
Found 3 entries for class:
Deleting 3 keys from class: ['class:CLASS-8', 'class:CLASS-9', 'class:CLASS-10']
✅ Deleted 3 entries from class:

Fetching entries for prefix: section:
Found 6 entries for section:
✅ Deleted 6 entries from section:

Fetching entries for prefix: sems:subject:
Found 15 entries for sems:subject:
✅ Deleted 15 entries from sems:subject:

Fetching entries for prefix: sems:exam:
Found 2 entries for sems:exam:
✅ Deleted 2 entries from sems:exam:

Fetching entries for prefix: sems:timetable:
Found 0 entries for sems:timetable:

Fetching entries for prefix: sems:academicyear:
Found 2 entries for sems:academicyear:
✅ Deleted 2 entries from sems:academicyear:

Fetching entries for prefix: sems:mark:
Found 0 entries for sems:mark:

Fetching entries for prefix: sems:result:
Found 20 entries for sems:result:
✅ Deleted 20 entries from sems:result:

Fetching entries for prefix: sems:reportcard:
Found 0 entries for sems:reportcard:

Clearing Postgres tables...
✅ Cleared students table
✅ Cleared marks table

✅✅✅ CLEARED ALL DATA: 53 KV entries + Postgres tables
```

---

## What to Report if Clear Fails

If the clear function doesn't work, provide:

1. **Full console output** (copy all messages)
2. **Which modules still have data** (list them)
3. **Network tab screenshot** of the DELETE request
4. **Response from the API** (check Network → Response tab)

This will help identify exactly where the issue is!

---

**Need Help?** Check the console logs first - they tell the whole story!
