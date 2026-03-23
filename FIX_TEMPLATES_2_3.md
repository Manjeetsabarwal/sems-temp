# Fix Report Card Templates 2 and 3 - Missing Values Issue

## Problem Identified
Report card templates 2 and 3 are not showing values because:

1. **Database Issue**: Mark breakdown fields (`internalMarks`, `externalMarks`, `unitTestMarks`, `assignmentMarks`, `attendanceMarks`) have `select: false` in the entity, so they're not fetched by default
2. **Data Structure Mismatch**: Templates expect specific data formats that may not exist in the database
3. **Complex Fallback Logic**: The template functions have complex logic that fails silently

## Solution Steps

### Step 1: Fix Mark Entity (Immediate Fix)
Update the Mark entity to include breakdown fields in default queries:

```typescript
// In backend/src/modules/marks/mark.entity.ts
// Change lines 56, 59, 62, 65, 68, 71, 72
// Remove "select: false" from these columns:

@Column({ name: 'internal_marks', type: 'decimal', precision: 5, scale: 2, nullable: true, default: 0 })
internalMarks?: number;

@Column({ name: 'external_marks', type: 'decimal', precision: 5, scale: 2, nullable: true, default: 0 })
externalMarks?: number;

@Column({ name: 'unit_test_marks', type: 'decimal', precision: 5, scale: 2, nullable: true, default: 0 })
unitTestMarks?: number;

@Column({ name: 'assignment_marks', type: 'decimal', precision: 5, scale: 2, nullable: true, default: 0 })
assignmentMarks?: number;

@Column({ name: 'attendance_marks', type: 'decimal', precision: 5, scale: 2, nullable: true, default: 0 })
attendanceMarks?: number;

@Column({ name: 'marks_type', nullable: true, default: 'Final' })
marksType?: 'Unit Test' | 'Final' | 'Periodic Test' | 'Notebook' | 'Subject Enrichment' | 'Mid-Term';
```

### Step 2: Update Frontend Template Functions (Robust Fallback)
The template functions need better error handling and fallback logic.

### Step 3: Add Data Migration (If Needed)
If breakdown fields don't exist in database, run migration to add them.

### Step 4: Test Data Verification
Ensure sample data exists with proper breakdown fields.

## Quick Test to Verify Issue
Run this query to check if breakdown fields exist in your database:

```sql
SELECT mark_id, internal_marks, external_marks, unit_test_marks, assignment_marks, attendance_marks, marks_type 
FROM marks 
LIMIT 5;
```

If these columns return NULL or don't exist, that's the issue.

## Expected Behavior After Fix
- Template 2 (CBSE): Should show PT, NB, SE, HY/Annual marks properly
- Template 3 (Two Pages): Should show Assessment/Written marks for both terms
- Fallback to simple marks if breakdown data doesn't exist
- No more empty tables in templates

## Priority: HIGH - This affects core functionality
