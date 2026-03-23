# 🔧 How to Debug the Clear Data Issue

## **STEP-BY-STEP Instructions**

### **Step 1: Run the Diagnostic Tool**

1. Navigate to **Database** module (left sidebar)
2. You'll see TWO tools side by side:
   - **Left**: Database Diagnostic Tool (Purple)
   - **Right**: Database Population Tool (Blue)
3. Click **"Run Diagnostic"** button (purple)
4. Wait for it to complete

### **Step 2: Review the Diagnostic Results**

The diagnostic will show you:

**KV Store Data** (Blue section):
- Lists all prefixes (teacher:, class:, sems:subject:, etc.)
- Shows count for each prefix
- Green (0) = No data ✅
- Blue (X number) = Data exists 🔵

**Postgres Tables** (Green section):
- Shows student count
- Shows marks count

### **Step 3: Expand Sample Entries**

For any module that shows data (Blue number > 0):
1. Click **"View sample entry structure"**
2. You'll see the actual JSON structure
3. **MOST IMPORTANT**: Look at the "All entries ID fields" section
4. Check if these fields are present:
   - `hasKey: true/false` - Does the entry have a 'key' property?
   - `keys: [...]` - What properties does the entry have?
   - `idFields: {...}` - What ID fields are available?

### **Step 4: Share the Results with Me**

Please copy and paste the following:

1. **Screenshot or copy** the diagnostic results
2. **Expand at least one module** that shows data
3. **Copy the JSON** from "View sample entry structure"
4. **Share it here**

Example of what to share:
```
sems:academicyear: - 2 entries

Sample entry:
{
  "academicYearId": "AY-2024-25",
  "yearName": "2024-2025",
  "startDate": "2024-04-01",
  ...
}

All entries ID fields:
[
  {
    "hasKey": false,
    "keys": ["academicYearId", "yearName", "startDate", ...],
    "idFields": {
      "academicYearId": "AY-2024-25",
      "teacherId": undefined,
      "classId": undefined,
      ...
    }
  }
]
```

---

## **What I Need to See**

For EACH module that has data, I need to know:
1. **Does `hasKey` = true or false?**
   - If false, the entry doesn't have a `key` property
   - This means we need to construct the key from ID fields

2. **Which ID field is populated?**
   - `academicYearId`? `subjectId`? `examId`?
   - This tells me how to construct the deletion key

3. **What is the actual structure?**
   - The sample entry shows me the full object
   - This helps me verify the key construction logic

---

## **Quick Example**

If you see this for `sems:subject:`:
```json
{
  "hasKey": false,
  "keys": ["subjectId", "subjectName", "code", ...],
  "idFields": {
    "subjectId": "SUB-001",
    "teacherId": null,
    "classId": null,
    ...
  }
}
```

This tells me:
- ✅ Entry doesn't have a `key` property
- ✅ It has `subjectId` = "SUB-001"
- ✅ The deletion key should be: `sems:subject:SUB-001`

---

## **Why This Helps**

The diagnostic tool shows me **exactly** how data is stored in your database. Once I see the actual structure, I can fix the clear function to properly construct the deletion keys.

The issue is likely:
1. The `entry.key` property doesn't exist (so `hasKey` is false)
2. The clear function isn't correctly constructing keys from ID fields
3. The ID field name doesn't match what I expected

---

## **Next Steps After Sharing**

Once you share the diagnostic results:
1. I'll see the actual data structure
2. I'll fix the clear function to properly construct keys
3. We'll test the clear function again
4. It should work! 🎉

---

**Please run the diagnostic and share the results!**
