import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Loader2, Database, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { projectId, publicAnonKey } from '/utils/supabase/info';

const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-2fbe5237`;

interface PopulationStatus {
  step: string;
  status: 'pending' | 'loading' | 'success' | 'error';
  message?: string;
  count?: number;
}

export function DataPopulator() {
  const [isPopulating, setIsPopulating] = useState(false);
  const [statuses, setStatuses] = useState<PopulationStatus[]>([]);
  const [isClearing, setIsClearing] = useState(false);

  const updateStatus = (step: string, status: 'pending' | 'loading' | 'success' | 'error', message?: string, count?: number) => {
    setStatuses(prev => {
      const existing = prev.find(s => s.step === step);
      if (existing) {
        return prev.map(s => s.step === step ? { step, status, message, count } : s);
      }
      return [...prev, { step, status, message, count }];
    });
  };

  const populateData = async () => {
    setIsPopulating(true);
    setStatuses([]);

    try {
      // Step 1: Populate Academic Years
      updateStatus('Academic Years', 'loading');
      const academicYears = [
        {
          academic_year_id: 'AY-2024-25',
          year_name: '2024-2025',
          start_date: '2024-04-01',
          end_date: '2025-03-31',
          is_current: true,
        },
        {
          academic_year_id: 'AY-2023-24',
          year_name: '2023-2024',
          start_date: '2023-04-01',
          end_date: '2024-03-31',
          is_current: false,
        },
      ];

      for (const ay of academicYears) {
        await fetch(`${API_BASE}/api/kv/academic-years`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify(ay),
        });
      }
      updateStatus('Academic Years', 'success', 'Created academic years', academicYears.length);

      // Step 2: Populate Classes
      updateStatus('Classes', 'loading');
      const classes = [
        {
          class_id: 'CLASS-8',
          class_name: '8',
          class_teacher_id: null,
          academic_year_id: 'AY-2024-25',
        },
        {
          class_id: 'CLASS-9',
          class_name: '9',
          class_teacher_id: null,
          academic_year_id: 'AY-2024-25',
        },
        {
          class_id: 'CLASS-10',
          class_name: '10',
          class_teacher_id: null,
          academic_year_id: 'AY-2024-25',
        },
      ];

      for (const cls of classes) {
        // Create in KV store for API
        await fetch(`${API_BASE}/api/kv/classes`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify(cls),
        });
      }
      updateStatus('Classes', 'success', 'Created classes', classes.length);

      // Step 3: Populate Sections
      updateStatus('Sections', 'loading');
      const sections = [
        { section_id: 'SEC-8A', section_name: 'A', class_id: 'CLASS-8', capacity: 40 },
        { section_id: 'SEC-8B', section_name: 'B', class_id: 'CLASS-8', capacity: 40 },
        { section_id: 'SEC-9A', section_name: 'A', class_id: 'CLASS-9', capacity: 40 },
        { section_id: 'SEC-9B', section_name: 'B', class_id: 'CLASS-9', capacity: 40 },
        { section_id: 'SEC-10A', section_name: 'A', class_id: 'CLASS-10', capacity: 40 },
        { section_id: 'SEC-10B', section_name: 'B', class_id: 'CLASS-10', capacity: 40 },
      ];

      for (const sec of sections) {
        // Create in KV store for API
        await fetch(`${API_BASE}/api/kv/sections`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify(sec),
        });
      }
      updateStatus('Sections', 'success', 'Created sections', sections.length);

      // Step 4: Populate Teachers
      updateStatus('Teachers', 'loading');
      const teachers = [
        {
          teacher_id: 'T-001',
          name: 'Dr. Rajesh Kumar',
          email: 'rajesh.kumar@school.edu',
          phone: '+91-9876543210',
          subject: 'Mathematics',
          qualification: 'M.Sc., Ph.D. in Mathematics',
          experience_years: 15,
          joining_date: '2010-06-15',
          status: 'Active',
        },
        {
          teacher_id: 'T-002',
          name: 'Mrs. Priya Sharma',
          email: 'priya.sharma@school.edu',
          phone: '+91-9876543211',
          subject: 'Science',
          qualification: 'M.Sc. in Physics',
          experience_years: 12,
          joining_date: '2012-07-01',
          status: 'Active',
        },
        {
          teacher_id: 'T-003',
          name: 'Mr. Amit Patel',
          email: 'amit.patel@school.edu',
          phone: '+91-9876543212',
          subject: 'English',
          qualification: 'M.A. in English Literature',
          experience_years: 10,
          joining_date: '2014-08-10',
          status: 'Active',
        },
        {
          teacher_id: 'T-004',
          name: 'Ms. Sneha Reddy',
          email: 'sneha.reddy@school.edu',
          phone: '+91-9876543213',
          subject: 'Social Studies',
          qualification: 'M.A. in History',
          experience_years: 8,
          joining_date: '2016-06-20',
          status: 'Active',
        },
        {
          teacher_id: 'T-005',
          name: 'Mr. Arjun Singh',
          email: 'arjun.singh@school.edu',
          phone: '+91-9876543214',
          subject: 'Hindi',
          qualification: 'M.A. in Hindi',
          experience_years: 7,
          joining_date: '2017-07-15',
          status: 'Active',
        },
      ];

      for (const teacher of teachers) {
        await fetch(`${API_BASE}/api/kv/teachers`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify(teacher),
        });
      }
      updateStatus('Teachers', 'success', 'Created teachers', teachers.length);

      // Step 5: Populate Subjects
      updateStatus('Subjects', 'loading');
      const subjects = [
        { subject_id: 'SUB-MATH', subject_name: 'Mathematics', subject_code: 'MATH', class_id: 'CLASS-10', teacher_id: 'T-001', total_marks: 100 },
        { subject_id: 'SUB-SCI', subject_name: 'Science', subject_code: 'SCI', class_id: 'CLASS-10', teacher_id: 'T-002', total_marks: 100 },
        { subject_id: 'SUB-ENG', subject_name: 'English', subject_code: 'ENG', class_id: 'CLASS-10', teacher_id: 'T-003', total_marks: 100 },
        { subject_id: 'SUB-SST', subject_name: 'Social Studies', subject_code: 'SST', class_id: 'CLASS-10', teacher_id: 'T-004', total_marks: 100 },
        { subject_id: 'SUB-HIN', subject_name: 'Hindi', subject_code: 'HIN', class_id: 'CLASS-10', teacher_id: 'T-005', total_marks: 100 },
        
        { subject_id: 'SUB-MATH-9', subject_name: 'Mathematics', subject_code: 'MATH', class_id: 'CLASS-9', teacher_id: 'T-001', total_marks: 100 },
        { subject_id: 'SUB-SCI-9', subject_name: 'Science', subject_code: 'SCI', class_id: 'CLASS-9', teacher_id: 'T-002', total_marks: 100 },
        { subject_id: 'SUB-ENG-9', subject_name: 'English', subject_code: 'ENG', class_id: 'CLASS-9', teacher_id: 'T-003', total_marks: 100 },
        { subject_id: 'SUB-SST-9', subject_name: 'Social Studies', subject_code: 'SST', class_id: 'CLASS-9', teacher_id: 'T-004', total_marks: 100 },
        { subject_id: 'SUB-HIN-9', subject_name: 'Hindi', subject_code: 'HIN', class_id: 'CLASS-9', teacher_id: 'T-005', total_marks: 100 },
      ];

      for (const subject of subjects) {
        await fetch(`${API_BASE}/api/kv/subjects`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify(subject),
        });
      }
      updateStatus('Subjects', 'success', 'Created subjects', subjects.length);

      // Step 6: Populate Students
      updateStatus('Students', 'loading');
      const studentNames = [
        'Aarav Sharma', 'Vivaan Kumar', 'Aditya Singh', 'Vihaan Patel', 'Arjun Reddy',
        'Sai Gupta', 'Arnav Verma', 'Dhruv Joshi', 'Krishna Mehta', 'Shaurya Iyer',
        'Aadhya Nair', 'Ananya Desai', 'Diya Rao', 'Isha Agarwal', 'Navya Shah',
        'Saanvi Kapoor', 'Sara Malhotra', 'Kiara Bose', 'Myra Chatterjee', 'Aanya Banerjee',
      ];

      let studentCount = 0;
      for (const cls of ['8', '9', '10']) {
        for (const sec of ['A', 'B']) {
          for (let i = 0; i < 10; i++) {
            const rollNo = i + 1;
            const studentId = `STU-${cls}${sec}-${String(rollNo).padStart(3, '0')}`;
            const classId = `CLASS-${cls}`;
            const sectionId = `SEC-${cls}${sec}`;
            
            const student = {
              student_id: studentId,
              name: studentNames[studentCount % studentNames.length],
              class_id: classId,
              section_id: sectionId,
              roll_no: rollNo,
              date_of_birth: `200${8 - parseInt(cls)}-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`,
              gender: i % 2 === 0 ? 'Male' : 'Female',
              email: `${studentId.toLowerCase()}@student.edu`,
              phone: `+91-98765${String(43210 + studentCount).slice(-5)}`,
              parent_name: `Parent of ${studentNames[studentCount % studentNames.length]}`,
              parent_phone: `+91-98765${String(50000 + studentCount).slice(-5)}`,
              address: `House ${rollNo}, Sector ${cls}, New Delhi`,
              status: 'Active',
            };

            const response = await fetch(`${API_BASE}/api/students`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${publicAnonKey}`,
              },
              body: JSON.stringify(student),
            });

            if (!response.ok) {
              console.error('Failed to create student:', await response.text());
            }
            studentCount++;
          }
        }
      }
      updateStatus('Students', 'success', 'Created students', studentCount);

      // Step 7: Populate Exams
      updateStatus('Exams', 'loading');
      const exams = [
        {
          exam_id: 'EXAM-10-MID-2024',
          exam_name: 'Class 10 - Mid Term Exam 2024',
          exam_type: 'Mid Term',
          class_id: 'CLASS-10',
          academic_year_id: 'AY-2024-25',
          start_date: '2024-09-15',
          end_date: '2024-09-25',
          total_marks: 500,
          passing_marks: 200,
          status: 'Published',
        },
        {
          exam_id: 'EXAM-9-MID-2024',
          exam_name: 'Class 9 - Mid Term Exam 2024',
          exam_type: 'Mid Term',
          class_id: 'CLASS-9',
          academic_year_id: 'AY-2024-25',
          start_date: '2024-09-15',
          end_date: '2024-09-25',
          total_marks: 500,
          passing_marks: 200,
          status: 'Published',
        },
        {
          exam_id: 'EXAM-10-FINAL-2024',
          exam_name: 'Class 10 - Final Exam 2024',
          exam_type: 'Final',
          class_id: 'CLASS-10',
          academic_year_id: 'AY-2024-25',
          start_date: '2025-03-01',
          end_date: '2025-03-15',
          total_marks: 500,
          passing_marks: 200,
          status: 'Draft',
        },
      ];

      for (const exam of exams) {
        await fetch(`${API_BASE}/api/kv/exams`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify(exam),
        });
      }
      updateStatus('Exams', 'success', 'Created exams', exams.length);

      // Step 8: Populate Marks
      updateStatus('Marks Entry', 'loading');
      let marksCount = 0;

      // Get all students for Class 10
      const studentsRes = await fetch(`${API_BASE}/api/students?classId=CLASS-10`, {
        headers: { Authorization: `Bearer ${publicAnonKey}` },
      });
      const class10Students = await studentsRes.json();

      // Create marks for Class 10 Mid Term
      for (const student of class10Students) {
        const subjectMarks = [
          { subject_id: 'SUB-MATH', marks: Math.floor(Math.random() * 30) + 70 },
          { subject_id: 'SUB-SCI', marks: Math.floor(Math.random() * 30) + 65 },
          { subject_id: 'SUB-ENG', marks: Math.floor(Math.random() * 25) + 70 },
          { subject_id: 'SUB-SST', marks: Math.floor(Math.random() * 25) + 68 },
          { subject_id: 'SUB-HIN', marks: Math.floor(Math.random() * 25) + 72 },
        ];

        for (const mark of subjectMarks) {
          const markEntry = {
            mark_id: `MARK-${student.student_id}-EXAM-10-MID-2024-${mark.subject_id}`,
            student_id: student.student_id,
            exam_id: 'EXAM-10-MID-2024',
            subject_id: mark.subject_id,
            marks_obtained: mark.marks,
            total_marks: 100,
            remarks: mark.marks >= 90 ? 'Excellent' : mark.marks >= 75 ? 'Very Good' : 'Good',
          };

          await fetch(`${API_BASE}/api/kv/marks`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${publicAnonKey}`,
            },
            body: JSON.stringify(markEntry),
          });
          marksCount++;
        }
      }
      updateStatus('Marks Entry', 'success', 'Created marks entries', marksCount);

      // Step 9: Generate Results
      updateStatus('Results', 'loading');
      let resultsCount = 0;

      for (const student of class10Students) {
        // Get all marks for this student in the exam
        const marksRes = await fetch(
          `${API_BASE}/api/kv/marks?studentId=${student.student_id}&examId=EXAM-10-MID-2024`,
          { headers: { Authorization: `Bearer ${publicAnonKey}` } }
        );
        const studentMarks = await marksRes.json();

        if (studentMarks && studentMarks.length > 0) {
          const totalObtained = studentMarks.reduce((sum: number, m: any) => sum + m.marks_obtained, 0);
          const totalMax = studentMarks.length * 100;
          const percentage = (totalObtained / totalMax) * 100;

          let grade = 'F';
          if (percentage >= 90) grade = 'A+';
          else if (percentage >= 80) grade = 'A';
          else if (percentage >= 70) grade = 'B';
          else if (percentage >= 60) grade = 'C';
          else if (percentage >= 50) grade = 'D';
          else if (percentage >= 40) grade = 'E';

          const result = {
            result_id: `RESULT-${student.student_id}-EXAM-10-MID-2024`,
            student_id: student.student_id,
            student_name: student.name,
            exam_id: 'EXAM-10-MID-2024',
            exam_name: 'Class 10 - Mid Term Exam 2024',
            class_id: 'CLASS-10',
            section_id: student.section_id,
            total_marks_obtained: totalObtained,
            total_max_marks: totalMax,
            percentage: percentage,
            grade: grade,
            is_passed: percentage >= 40,
            status: 'Published',
            remarks: percentage >= 75 ? 'Excellent performance' : percentage >= 60 ? 'Good performance' : 'Needs improvement',
          };

          await fetch(`${API_BASE}/api/kv/results`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${publicAnonKey}`,
            },
            body: JSON.stringify(result),
          });
          resultsCount++;
        }
      }

      // Calculate ranks
      await fetch(`${API_BASE}/api/kv/results/calculate-ranks/EXAM-10-MID-2024`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${publicAnonKey}` },
      });

      updateStatus('Results', 'success', 'Generated results with ranks', resultsCount);

      toast.success('All data populated successfully!');
    } catch (error: any) {
      console.error('Population error:', error);
      toast.error(error.message || 'Failed to populate data');
    } finally {
      setIsPopulating(false);
    }
  };

  const clearAllData = async () => {
    if (!confirm('⚠️ WARNING: This will delete ALL data from the system! Are you absolutely sure?')) {
      return;
    }

    if (!confirm('This action cannot be undone. Type YES to confirm deletion.')) {
      return;
    }

    try {
      setIsClearing(true);
      console.log('🗑️ CLEAR ALL DATA: Starting deletion process...');
      console.log(`📡 API URL: ${API_BASE}/api/data/clear-everything`);
      
      const response = await fetch(`${API_BASE}/api/data/clear-everything`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${publicAnonKey}` },
      });

      console.log('📡 Response status:', response.status);
      console.log('📡 Response ok:', response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Server error response:', errorText);
        throw new Error(`Failed to clear data: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ Data cleared successfully:', result);
      console.log('📊 Deletion details:', {
        kvDeleted: result.kvDeleted,
        studentsDeleted: result.studentsDeleted,
        marksDeleted: result.marksDeleted
      });
      
      toast.success(`Successfully cleared all data! (${result.kvDeleted} KV entries from ${result.storage || 'Postgres KV Store'})`);
      setStatuses([]);
    } catch (error: any) {
      console.error('❌ CLEAR ALL DATA ERROR:', error);
      console.error('Error stack:', error.stack);
      toast.error(error.message || 'Failed to clear data');
    } finally {
      setIsClearing(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'loading':
        return <Loader2 className="w-5 h-5 animate-spin text-blue-600" />;
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-400" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="w-6 h-6 text-blue-600" />
          Database Population Tool
        </CardTitle>
        <p className="text-sm text-gray-600">
          Populate the database with sample data for all modules
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          onClick={populateData}
          disabled={isPopulating}
          className="w-full bg-blue-600 hover:bg-blue-700"
        >
          {isPopulating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Populating Data...
            </>
          ) : (
            <>
              <Database className="w-4 h-4 mr-2" />
              Populate All Data
            </>
          )}
        </Button>

        <Button
          onClick={clearAllData}
          disabled={isClearing || isPopulating}
          variant="destructive"
          className="w-full"
        >
          {isClearing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Clearing All Data...
            </>
          ) : (
            <>
              <XCircle className="w-4 h-4 mr-2" />
              Clear All Data
            </>
          )}
        </Button>

        {statuses.length > 0 && (
          <div className="space-y-2 mt-4">
            <h3 className="font-semibold text-sm">Population Progress:</h3>
            {statuses.map((status, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  {getStatusIcon(status.status)}
                  <div>
                    <p className="font-medium text-sm">{status.step}</p>
                    {status.message && (
                      <p className="text-xs text-gray-600">{status.message}</p>
                    )}
                  </div>
                </div>
                {status.count !== undefined && (
                  <span className="text-sm font-semibold text-gray-700">
                    {status.count}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="font-semibold text-sm mb-2 text-blue-900">
            What will be created:
          </h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• 2 Academic Years (2023-24, 2024-25)</li>
            <li>• 3 Classes (8, 9, 10)</li>
            <li>• 6 Sections (A & B for each class)</li>
            <li>• 5 Teachers with different subjects</li>
            <li>• 10 Subjects (5 per class)</li>
            <li>• 60 Students (10 per section)</li>
            <li>• 3 Exams (Mid Term & Final)</li>
            <li>• 100 Marks entries for Class 10</li>
            <li>• 20 Results with grades and ranks</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}