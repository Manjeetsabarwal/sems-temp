# Debug Exam Subjects Issue

## Problem
Exam subjects are not being saved correctly. They appear as `[[], [], [], [], []]` in the database.

## Investigation Steps

1. Check the frontend form submission
2. Check the backend create method
3. Check the database column type
4. Check the JSONB serialization

## Current Findings
- Database shows subjects as array of empty arrays
- Frontend appears to be sending correct data
- Backend has extensive logging for subjects

## Possible Causes
1. JSONB serialization issue
2. Subjects being overwritten during save
3. Form submission sending empty subjects

## Next Steps
1. Add more logging to track the exact data flow
2. Check the exam entity configuration
3. Verify the subjects are properly formatted before save
