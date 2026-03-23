# 📋 **School Exam Management System (SEMS) - End-to-End Testing Guide**

## 🎯 **Objective**
Test the complete SEMS system with real, production-like data. Follow this sequence to create a fully functional school management system from scratch.

---

## 🚀 **Prerequisites**

### Step 0: Clear All Existing Data (IMPORTANT!)
1. Navigate to **Database** module (left sidebar)
2. Click **"Clear All Data"** button (RED button)
3. Confirm the deletion **twice**
4. Wait for success message
5. **Verify data is cleared:**
   - Go to Students module → Should show "No students found"
   - Go to Academic Year → Should show empty list
   - Go to Exams → Should show empty list
   - Go to Subjects → Should show empty list
   - Go to Classes → Should show empty list
6. **Check browser console (F12)** for clear operation logs
7. **Now you have a clean slate!**

---

## 📝 **Testing Sequence (Follow in Order)**

### 🔹 **Phase 1: Foundation Setup**

#### 1️⃣ **Academic Year Module** 
Navigate to: `Academic Year` (sidebar)

**Create Record:**
- Click `+ Add Academic Year`
- Fill in:
  - Academic Year ID: `AY-2025-26`
  - Year Name: `2025-2026`
  - Start Date: `2025-04-01`
  - End Date: `2026-03-31`
  - Is Current: ✅ (Toggle ON)
- Click `Save`

**Test LIST:**
- Verify the academic year appears in both Grid and List views
- Use filter dropdowns
- Search by year name

---

#### 2️⃣ **Classes & Sections Module**
Navigate to: `Classes & Sections` (sidebar)

**Create Class:**
- Click `+ Add Class`
- Fill in:
  - Class ID: `CLASS-11`
  - Name: `11`
  - Description: `Class 11 - Science Stream`
  - Capacity: `100`
  - Status: Active
- Click `Create Class`

**Create Sections:**
For each section (A, B, C):
- Click `+ Add Section`
- Fill in:
  - Section ID: `SEC-11A` (then 11B, 11C)
  - Class: `CLASS-11`
  - Name: `A` (then B, C)
  - Capacity: `35`
  - Room Number: `Room 101` (102, 103)
  - Status: Active
- Click `Create Section`

**Test CRUD:**
- **Create**: Done above ✅
- **Read**: Click eye icon to view details
- **Update**: Click edit icon, change capacity to 40, save
- **Delete**: Create a test section, then delete it
- **List**: Toggle between Grid and List views
- **Filter**: Filter by class, search by name

---

#### 3️⃣ **Teachers Module**
Navigate to: `Teachers` (sidebar)

**Create Teachers** (Create at least 5):
1. Teacher 1:
   - Teacher ID: `TCH-2025-001`
   - Name: `Mr. Amit Sharma`
   - Email: `amit.sharma@school.edu`
   - Phone: `+91-9876543210`
   - Subject: `Physics`
   - Qualification: `M.Sc. Physics, B.Ed.`
   - Experience: `10` years
   - Joining Date: `2015-06-01`
   - Status: Active

2. Teacher 2:
   - Teacher ID: `TCH-2025-002`
   - Name: `Mrs. Priya Verma`
   - Email: `priya.verma@school.edu`
   - Phone: `+91-9876543211`
   - Subject: `Mathematics`
   - Qualification: `M.Sc. Mathematics`
   - Experience: `8` years
   - Joining Date: `2017-07-15`
   - Status: Active

3-5. Create 3 more teachers for: Chemistry, English, Computer Science

**Test CRUD:**
- View teacher details
- Edit a teacher's phone number
- Search by name
- Filter by status
- Toggle Grid/List views

---

#### 4️⃣ **Subjects Module**
Navigate to: `Subjects` (sidebar)

**Create Subjects** (Create 5 subjects):
1. Physics:
   - Subject ID: `SUB-PHY-11`
   - Name: `Physics`
   - Code: `PHY`
   - Class: `CLASS-11`
   - Description: `Physics for Class 11`
   - Credits: `5`
   - Hours/Week: `6`
   - Status: Active

2. Mathematics:
   - Subject ID: `SUB-MATH-11`
   - Name: `Mathematics`
   - Code: `MATH`
   - Class: `CLASS-11`
   - Credits: `5`
   - Hours/Week: `6`

3-5. Create: Chemistry, English, Computer Science

**Test:**
- Filter by class
- Search by subject name
- Edit subject credits
- View subject details

---

#### 5️⃣ **Students Module**
Navigate to: `Students` (sidebar)

**Create Students** (Create 10-15 students):

Student 1:
- Student ID: `STU-11A-001`
- Name: `Rahul Kapoor`
- Class: `CLASS-11`
- Section: `SEC-11A`
- Roll No: `1`
- DOB: `2009-05-15`
- Gender: Male
- Email: `rahul.kapoor@student.edu`
- Phone: `+91-9800000001`
- Parent Name: `Mr. Suresh Kapoor`
- Parent Phone: `+91-9800000011`
- Parent Email: `suresh.kapoor@parent.com`
- Address: `123 MG Road, Delhi`
- Status: Active

Student 2-10: Create more students in sections A and B

**Test CRUD:**
- Create, Read, Update, Delete students
- Filter by class and section
- Search by name or student ID
- Toggle Grid/List views
- Edit student details

---

### 🔹 **Phase 2: Examination Setup**

#### 6️⃣ **Exams Module**
Navigate to: `Exams` (sidebar)

**Create Exam:**
- Click `+ Add Exam`
- Fill in:
  - Exam ID: `EXAM-11-HALF-2025`
  - Exam Name: `Class 11 - Half Yearly Exam 2025`
  - Exam Type: `Mid-Term`
  - Academic Year: `AY-2025-26`
  - Class: `CLASS-11`
  - Term: `Term 1`
  - Start Date: `2025-09-15`
  - End Date: `2025-09-25`
  - Total Marks: `500`
  - Passing Marks: `200`
  - Status: Scheduled

**Add Subjects to Exam:**
In the exam form, add all 5 subjects with:
- Max Marks: 100 each
- Passing Marks: 35 each
- Exam Date: Various dates between start and end
- Duration: 180 minutes

**Test:**
- View exam details
- Edit exam dates
- Change exam status
- Filter by class and academic year

---

#### 7️⃣ **Exam Timetable Module**
Navigate to: `Exam Timetable` (sidebar)

**Create Timetable Entries** (For each subject):

Entry 1 - Physics:
- Timetable ID: `TT-001`
- Exam: `EXAM-11-HALF-2025`
- Class: `CLASS-11`
- Subject: `Physics`
- Date: `2025-09-15`
- Start Time: `09:00`
- End Time: `12:00`
- Duration: 180 (auto-calculated)
- Room: `Exam Hall 1`
- Invigilator: `Mr. Amit Sharma`
- Max Marks: `100`
- Status: Scheduled

Repeat for other 4 subjects with different dates.

**Test:**
- **Calendar View**: Check if entries appear on correct dates
- **Grid View**: Verify all details
- **List View**: Sort by date/time
- Edit timetable entry
- Delete and recreate an entry
- Filter by exam and class

---

### 🔹 **Phase 3: Evaluation**

#### 8️⃣ **Marks Entry Module**
Navigate to: `Marks Entry` (sidebar)

**Enter Marks:**
1. Select:
   - Exam: `EXAM-11-HALF-2025`
   - Class: `CLASS-11`
   - Section: `SEC-11A`
   - Subject: `Physics`

2. The system will load all students in that section

3. Enter marks for each student (0-100):
   - Student 1: 85
   - Student 2: 92
   - Student 3: 78
   - etc.

4. Add remarks (optional)

5. Click `Save All Marks`

**Repeat for all 5 subjects**

**Test:**
- Validation: Try entering 105 (should show error)
- Bulk entry workflow
- Edit marks after saving
- Filter and search functionality

---

#### 9️⃣ **Results Module**
Navigate to: `Results` (sidebar)

**Generate Results:**
1. Filter by Exam: `EXAM-11-HALF-2025`
2. Click `Calculate Results` (if auto-generate is off)
3. System will:
   - Calculate total marks
   - Calculate percentage
   - Assign grades
   - Calculate ranks

**Publish Results:**
1. Select results to publish
2. Click `Publish Selected`
3. Students can now view results

**Test:**
- View individual student results
- Check grade assignment (A+, A, B, etc.)
- Verify rank calculation
- Filter by class/section
- Search by student name
- Export results (if feature exists)

---

#### 🔟 **Report Cards Module**
Navigate to: `Report Cards` (sidebar)

**Generate Report Cards:**
1. Filter by:
   - Exam: `EXAM-11-HALF-2025`
   - Class: `CLASS-11`

2. System loads all report cards

3. Click on a report card to view:
   - Student details
   - Subject-wise marks
   - Total and percentage
   - Grade and rank
   - Teacher remarks

4. Test Print functionality

**Test:**
- View multiple report cards
- Print preview
- Download as PDF (if available)
- Filter and search
- Verify all calculated data is correct

---

### 🔹 **Phase 4: System Configuration**

#### 1️⃣1️⃣ **Settings Module**
Navigate to: `Settings` (sidebar)

**Configure System:**

**General Tab:**
- School Name: `Your School Name`
- Address: `Full School Address`
- Phone: `School Contact`
- Email: `info@school.edu`
- Website: `www.yourschool.edu`
- Principal Name: `Dr. Principal Name`
- Academic Year dates

**Grading Tab:**
- Set passing marks: `40%`
- Configure grade rules:
  - 90-100: A+ (GPA 10)
  - 80-89: A (GPA 9)
  - 70-79: B+ (GPA 8)
  - 60-69: B (GPA 7)
  - 50-59: C (GPA 6)
  - 40-49: D (GPA 5)
  - 0-39: F (GPA 0)

**Preferences Tab:**
- Theme: Light/Dark
- Sidebar Position: Left/Right
- Date Format: YYYY-MM-DD
- Time Format: 24h

**System Tab:**
- Enable/Disable features
- Set permissions for students/parents

**Test:**
- Save each tab
- Verify changes apply immediately (esp. sidebar position)
- Test grade calculation with new rules

---

## ✅ **Verification Checklist**

After completing all steps, verify:

### Data Integrity:
- [ ] All classes have sections
- [ ] All sections have students
- [ ] All subjects have teachers assigned
- [ ] All exams have timetable entries
- [ ] All students have marks for all subjects
- [ ] All results are calculated correctly
- [ ] All report cards display accurately

### CRUD Operations:
- [ ] Create new records in all modules
- [ ] Read/View details for all record types
- [ ] Update existing records
- [ ] Delete test records
- [ ] Search functionality works
- [ ] Filters apply correctly

### Views:
- [ ] Grid view displays correctly
- [ ] List view shows all columns
- [ ] Calendar view (Timetable) works
- [ ] Toggle between views smooth

### Data Flow:
- [ ] Classes → Sections → Students (hierarchy works)
- [ ] Exams → Timetable → Marks → Results → Report Cards (flow works)
- [ ] Filters update dependent dropdowns
- [ ] Calculations are accurate

---

## 🐛 **Common Issues & Solutions**

### Issue: "No classes available" in dropdown
**Solution**: Create classes first in Classes & Sections module

### Issue: Can't select section
**Solution**: Make sure class is selected first, sections are class-dependent

### Issue: Marks not saving
**Solution**: Verify exam, class, section, and subject are all selected

### Issue: Results not showing grades
**Solution**: Check Settings → Grading tab for grade rules configuration

### Issue: Report card shows 0 marks
**Solution**: Ensure marks are entered AND results are published

### Issue: Clear All Data doesn't work completely
**Solution**: 
1. Open browser console (F12) and check for error messages
2. Look for which prefixes failed to clear
3. Try refreshing the page and clearing again
4. If specific modules aren't clearing, check the console logs to see which keys are being targeted
5. The clear operation logs each step - verify in console

### Issue: Some data persists after clearing
**Solution**:
1. Students & Marks are in Postgres - check console for "Cleared students table" and "Cleared marks table" messages
2. Other modules are in KV store - check for "Deleted X entries from [prefix]" messages
3. Refresh the modules to verify data is gone
4. If data still shows, try manually deleting from that specific module

---

## 📊 **Sample Test Data Set**

For quick testing, create:
- 1 Academic Year
- 2 Classes (Class 11 & 12)
- 4 Sections (2 per class: A, B)
- 10 Teachers
- 10 Subjects (5 per class)
- 40 Students (10 per section)
- 2 Exams (Mid-term, Final)
- 10 Timetable entries (5 per exam)
- 200 Marks entries (40 students × 5 subjects)
- 40 Results (auto-generated)
- 40 Report Cards (auto-generated)

---

## 🎯 **Success Criteria**

Your system is working correctly if:
1. You can navigate through all modules without errors
2. Data created in one module appears in related modules
3. Calculations (marks, grades, ranks) are accurate
4. Filters and search work across all modules
5. CRUD operations succeed in all modules
6. Views (Grid/List/Calendar) display correctly
7. Settings apply system-wide
8. Report cards show complete, accurate information

---

## 📞 **Support**

If you encounter any issues:
1. Check browser console for errors (F12)
2. Verify data sequence (create foundation before exams)
3. Clear browser cache if UI doesn't update
4. Use "Clear All Data" to start fresh if needed

---

**🎉 Happy Testing! Your SEMS system is production-ready!**