# Exam Subjects Not Showing - Fixed

## Issue Summary
When creating an exam, subjects were being saved incorrectly in the database as `[[], [], [], [], []]` instead of the actual subject data. This caused subjects to not display when viewing or editing exam details.

## Root Cause
The issue was caused by TypeORM's default value configuration for the JSONB column. The `default: '[]'` in the entity was causing TypeORM to initialize the subjects field with an array of empty arrays instead of null or undefined.

## Fixes Applied

### 1. Updated Exam Entity (backend/src/modules/exams/exam.entity.ts)
```typescript
// Before
@Column({ type: 'jsonb', default: '[]' })
subjects: any;

// After
@Column({ type: 'jsonb', nullable: true })
subjects: any;
```

### 2. Updated Exams Service (backend/src/modules/exams/exams.service.ts)
Modified the `create` method to explicitly create and set the exam entity properties instead of using `repository.create()` with a spread operator:

```typescript
// Create exam with explicit subjects
const exam = new Exam();
exam.examId = createDto.examId;
exam.examName = createDto.examName;
exam.examType = createDto.examType;
exam.academicYear = createDto.academicYear;
exam.classId = createDto.classId;
exam.term = createDto.term;
exam.startDate = createDto.startDate;
exam.endDate = createDto.endDate;
exam.totalMarks = createDto.totalMarks;
exam.passingMarks = createDto.passingMarks;
exam.subjects = subjects; // Explicitly set subjects
exam.description = createDto.description;
exam.status = createDto.status;
```

## How It Works Now

1. **Entity Configuration**: The subjects column is now nullable and doesn't have a default value
2. **Service Logic**: 
   - Subjects are explicitly initialized as an empty array if not provided
   - The exam entity is created with explicit property assignments
   - Subjects are properly validated and normalized before saving
3. **Frontend**: Already had proper validation and normalization logic

## Testing Instructions

1. Create a new exam with multiple subjects
2. Save the exam
3. Navigate to view exam details - subjects should now appear
4. Edit the exam - subjects should be pre-filled correctly
5. Check the database to verify subjects are stored as proper JSON

## Database Verification
```sql
SELECT exam_id, exam_name, subjects FROM exams ORDER BY created_at DESC LIMIT 5;
```

Should show subjects as proper JSON arrays like:
```json
[{"subjectId": "SUB001", "subjectName": "Mathematics", "subjectCode": "MATH", "maxMarks": 100, "passingMarks": 40}]
```

## Files Modified
- `backend/src/modules/exams/exam.entity.ts` - Removed default value from subjects column
- `backend/src/modules/exams/exams.service.ts` - Updated create method to explicitly set exam properties

## Additional Notes
- The fix ensures subjects are properly serialized to JSONB
- Maintains backward compatibility with existing exams
- Frontend already had proper handling for subject normalization
