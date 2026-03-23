# 🔍 Academic Year Deletion Test

## **THE CORE ISSUE DISCOVERED:**

The `getByPrefix()` function in `kv_store.tsx` returns:
```typescript
return data?.map((d) => d.value) ?? [];
```

This means it **ONLY returns the value**, NOT the key! So `entry.key` is always `undefined`.

Our deletion code tries to:
1. First check if `entry.key` exists (it never does!)
2. Then construct the key from ID fields like `entry.academicYearId`

## **THE PROBLEM:**

If academic years aren't deleting, it means ONE of these:

### **Option A: Field Name Mismatch**
- Data is stored with field name: `academic_year_id` (snake_case)
- Code tries to access: `entry.academicYearId` (camelCase)
- **Result:** Key construction fails, returns `null`, gets filtered out

### **Option B: Field Doesn't Exist**
- The entry doesn't have `academicYearId` field at all
- **Result:** Key construction fails, returns `null`, gets filtered out

### **Option C: Prefix Mismatch**
- Data is stored with different prefix
- Code looks for: `sems:academicyear:`
- But data is stored as: `academic_year:` or `academicYear:` or something else

## **HOW TO DEBUG:**

1. **Run the Diagnostic Tool** (purple button)
2. **Expand the `sems:academicyear:` section**
3. **Look at the sample entry structure:**

```json
{
  "academicYearId": "AY-2024-25",    // ✅ GOOD - camelCase
  "yearName": "2024-2025",
  ...
}
```

OR

```json
{
  "academic_year_id": "AY-2024-25",  // ❌ BAD - snake_case
  "year_name": "2024-2025",
  ...
}
```

4. **Check the console logs** after clicking "Clear All Data"
   - Look for: `Sample entry for sems:academicyear:`
   - Look for: `Constructing academic year key from ID ...`
   - Look for: `❌ Could not construct key for sems:academicyear: entry:`

## **LIKELY FIXES:**

### **If field is snake_case:**
Update the clear logic to check both:
```typescript
if (prefix === 'sems:academicyear:' && (entry.academicYearId || entry.academic_year_id)) {
  const id = entry.academicYearId || entry.academic_year_id;
  return `${prefix}${id}`;
}
```

### **If prefix is wrong:**
Check what prefix the data was actually stored with and update the prefixes array.

## **ACTION ITEMS:**

1. ✅ Run Diagnostic Tool
2. ✅ Expand `sems:academicyear:` section
3. ✅ Copy the sample entry JSON
4. ✅ Share it here
5. ✅ Try "Clear All Data" and check console
6. ✅ Copy any error/warning messages from console
7. ✅ Share those too

Then I can fix it immediately!
