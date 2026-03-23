// Mock Data for School Exam Management System

import {
  User,
  AcademicYear,
  Class,
  Section,
  Subject,
  Student,
  Exam,
  ExamSubject,
  Marks,
  GradeRule,
  DashboardStats,
} from '../types';

export const gradeRules: GradeRule[] = [
  { min: 90, grade: 'A+', color: '#10b981' },
  { min: 75, grade: 'A', color: '#3b82f6' },
  { min: 60, grade: 'B', color: '#8b5cf6' },
  { min: 45, grade: 'C', color: '#f59e0b' },
  { min: 35, grade: 'D', color: '#ef4444' },
  { min: 0, grade: 'F', color: '#991b1b' },
];

export const academicYears: AcademicYear[] = [
  {
    id: '2024-25',
    startDate: '2024-04-01',
    endDate: '2025-03-31',
    isActive: false,
  },
  {
    id: '2025-26',
    startDate: '2025-04-01',
    endDate: '2026-03-31',
    isActive: true,
  },
];

export const classes: Class[] = [
  { id: '1', name: 'Class 1' },
  { id: '2', name: 'Class 2' },
  { id: '3', name: 'Class 3' },
  { id: '4', name: 'Class 4' },
  { id: '5', name: 'Class 5' },
  { id: '6', name: 'Class 6' },
  { id: '7', name: 'Class 7' },
  { id: '8', name: 'Class 8' },
  { id: '9', name: 'Class 9' },
  { id: '10', name: 'Class 10' },
  { id: '11', name: 'Class 11' },
  { id: '12', name: 'Class 12' },
];

export const sections: Section[] = [
  { id: '10-A', classId: '10', name: 'A' },
  { id: '10-B', classId: '10', name: 'B' },
  { id: '10-C', classId: '10', name: 'C' },
  { id: '9-A', classId: '9', name: 'A' },
  { id: '9-B', classId: '9', name: 'B' },
  { id: '11-A', classId: '11', name: 'A' },
  { id: '11-B', classId: '11', name: 'B' },
  { id: '12-A', classId: '12', name: 'A' },
];

export const subjects: Subject[] = [
  { id: 'MATH', name: 'Mathematics', code: 'MAT', maxMarks: 100, passMarks: 35 },
  { id: 'SCI', name: 'Science', code: 'SCI', maxMarks: 100, passMarks: 35 },
  { id: 'ENG', name: 'English', code: 'ENG', maxMarks: 100, passMarks: 35 },
  { id: 'HIN', name: 'Hindi', code: 'HIN', maxMarks: 100, passMarks: 35 },
  { id: 'SST', name: 'Social Studies', code: 'SST', maxMarks: 100, passMarks: 35 },
  { id: 'CS', name: 'Computer Science', code: 'CS', maxMarks: 100, passMarks: 35 },
];

export const students: Student[] = [
  {
    studentId: 'STU001',
    name: 'Rahul Sharma',
    classId: '10',
    sectionId: '10-A',
    rollNo: 1,
    parentContact: '9876543210',
    parentEmail: 'parent.sharma@email.com',
  },
  {
    studentId: 'STU002',
    name: 'Priya Patel',
    classId: '10',
    sectionId: '10-A',
    rollNo: 2,
    parentContact: '9876543211',
    parentEmail: 'parent.patel@email.com',
  },
  {
    studentId: 'STU003',
    name: 'Amit Kumar',
    classId: '10',
    sectionId: '10-A',
    rollNo: 3,
    parentContact: '9876543212',
    parentEmail: 'parent.kumar@email.com',
  },
  {
    studentId: 'STU004',
    name: 'Sneha Reddy',
    classId: '10',
    sectionId: '10-A',
    rollNo: 4,
    parentContact: '9876543213',
    parentEmail: 'parent.reddy@email.com',
  },
  {
    studentId: 'STU005',
    name: 'Arjun Singh',
    classId: '10',
    sectionId: '10-A',
    rollNo: 5,
    parentContact: '9876543214',
    parentEmail: 'parent.singh@email.com',
  },
  {
    studentId: 'STU006',
    name: 'Neha Gupta',
    classId: '10',
    sectionId: '10-B',
    rollNo: 1,
    parentContact: '9876543215',
    parentEmail: 'parent.gupta@email.com',
  },
  {
    studentId: 'STU007',
    name: 'Vikram Joshi',
    classId: '10',
    sectionId: '10-B',
    rollNo: 2,
    parentContact: '9876543216',
    parentEmail: 'parent.joshi@email.com',
  },
  {
    studentId: 'STU008',
    name: 'Anjali Verma',
    classId: '9',
    sectionId: '9-A',
    rollNo: 1,
    parentContact: '9876543217',
    parentEmail: 'parent.verma@email.com',
  },
];

export const exams: Exam[] = [
  {
    examId: 'MIDTERM-2025',
    name: 'Mid Term Examination',
    academicYear: '2025-26',
    weightage: 40,
    type: 'midterm',
    status: 'completed',
  },
  {
    examId: 'FINAL-2025',
    name: 'Final Examination',
    academicYear: '2025-26',
    weightage: 60,
    type: 'final',
    status: 'upcoming',
  },
  {
    examId: 'UNIT-1-2025',
    name: 'Unit Test 1',
    academicYear: '2025-26',
    weightage: 20,
    type: 'unit-test',
    status: 'completed',
  },
];

export const examSubjects: ExamSubject[] = [
  // Midterm Exam
  {
    examId: 'MIDTERM-2025',
    subjectId: 'MATH',
    examDate: '2025-09-10',
    startTime: '10:00',
    endTime: '13:00',
    classId: '10',
  },
  {
    examId: 'MIDTERM-2025',
    subjectId: 'SCI',
    examDate: '2025-09-12',
    startTime: '10:00',
    endTime: '13:00',
    classId: '10',
  },
  {
    examId: 'MIDTERM-2025',
    subjectId: 'ENG',
    examDate: '2025-09-14',
    startTime: '10:00',
    endTime: '13:00',
    classId: '10',
  },
  {
    examId: 'MIDTERM-2025',
    subjectId: 'HIN',
    examDate: '2025-09-16',
    startTime: '10:00',
    endTime: '13:00',
    classId: '10',
  },
  {
    examId: 'MIDTERM-2025',
    subjectId: 'SST',
    examDate: '2025-09-18',
    startTime: '10:00',
    endTime: '13:00',
    classId: '10',
  },
  {
    examId: 'MIDTERM-2025',
    subjectId: 'CS',
    examDate: '2025-09-20',
    startTime: '10:00',
    endTime: '13:00',
    classId: '10',
  },
  // Final Exam
  {
    examId: 'FINAL-2025',
    subjectId: 'MATH',
    examDate: '2026-02-10',
    startTime: '10:00',
    endTime: '13:00',
    classId: '10',
  },
  {
    examId: 'FINAL-2025',
    subjectId: 'SCI',
    examDate: '2026-02-12',
    startTime: '10:00',
    endTime: '13:00',
    classId: '10',
  },
  {
    examId: 'FINAL-2025',
    subjectId: 'ENG',
    examDate: '2026-02-14',
    startTime: '10:00',
    endTime: '13:00',
    classId: '10',
  },
];

export const marks: Marks[] = [
  // Student 1 - Rahul Sharma (Rank 1)
  { studentId: 'STU001', examId: 'MIDTERM-2025', subjectId: 'MATH', marksObtained: 95, isAbsent: false },
  { studentId: 'STU001', examId: 'MIDTERM-2025', subjectId: 'SCI', marksObtained: 92, isAbsent: false },
  { studentId: 'STU001', examId: 'MIDTERM-2025', subjectId: 'ENG', marksObtained: 88, isAbsent: false },
  { studentId: 'STU001', examId: 'MIDTERM-2025', subjectId: 'HIN', marksObtained: 85, isAbsent: false },
  { studentId: 'STU001', examId: 'MIDTERM-2025', subjectId: 'SST', marksObtained: 90, isAbsent: false },
  { studentId: 'STU001', examId: 'MIDTERM-2025', subjectId: 'CS', marksObtained: 94, isAbsent: false },

  // Student 2 - Priya Patel (Rank 2)
  { studentId: 'STU002', examId: 'MIDTERM-2025', subjectId: 'MATH', marksObtained: 90, isAbsent: false },
  { studentId: 'STU002', examId: 'MIDTERM-2025', subjectId: 'SCI', marksObtained: 88, isAbsent: false },
  { studentId: 'STU002', examId: 'MIDTERM-2025', subjectId: 'ENG', marksObtained: 92, isAbsent: false },
  { studentId: 'STU002', examId: 'MIDTERM-2025', subjectId: 'HIN', marksObtained: 87, isAbsent: false },
  { studentId: 'STU002', examId: 'MIDTERM-2025', subjectId: 'SST', marksObtained: 85, isAbsent: false },
  { studentId: 'STU002', examId: 'MIDTERM-2025', subjectId: 'CS', marksObtained: 91, isAbsent: false },

  // Student 3 - Amit Kumar (Rank 3)
  { studentId: 'STU003', examId: 'MIDTERM-2025', subjectId: 'MATH', marksObtained: 78, isAbsent: false },
  { studentId: 'STU003', examId: 'MIDTERM-2025', subjectId: 'SCI', marksObtained: 82, isAbsent: false },
  { studentId: 'STU003', examId: 'MIDTERM-2025', subjectId: 'ENG', marksObtained: 75, isAbsent: false },
  { studentId: 'STU003', examId: 'MIDTERM-2025', subjectId: 'HIN', marksObtained: 80, isAbsent: false },
  { studentId: 'STU003', examId: 'MIDTERM-2025', subjectId: 'SST', marksObtained: 79, isAbsent: false },
  { studentId: 'STU003', examId: 'MIDTERM-2025', subjectId: 'CS', marksObtained: 85, isAbsent: false },

  // Student 4 - Sneha Reddy (Rank 4)
  { studentId: 'STU004', examId: 'MIDTERM-2025', subjectId: 'MATH', marksObtained: 72, isAbsent: false },
  { studentId: 'STU004', examId: 'MIDTERM-2025', subjectId: 'SCI', marksObtained: 68, isAbsent: false },
  { studentId: 'STU004', examId: 'MIDTERM-2025', subjectId: 'ENG', marksObtained: 76, isAbsent: false },
  { studentId: 'STU004', examId: 'MIDTERM-2025', subjectId: 'HIN', marksObtained: 70, isAbsent: false },
  { studentId: 'STU004', examId: 'MIDTERM-2025', subjectId: 'SST', marksObtained: 74, isAbsent: false },
  { studentId: 'STU004', examId: 'MIDTERM-2025', subjectId: 'CS', marksObtained: 78, isAbsent: false },

  // Student 5 - Arjun Singh (Rank 5)
  { studentId: 'STU005', examId: 'MIDTERM-2025', subjectId: 'MATH', marksObtained: 65, isAbsent: false },
  { studentId: 'STU005', examId: 'MIDTERM-2025', subjectId: 'SCI', marksObtained: 62, isAbsent: false },
  { studentId: 'STU005', examId: 'MIDTERM-2025', subjectId: 'ENG', marksObtained: 68, isAbsent: false },
  { studentId: 'STU005', examId: 'MIDTERM-2025', subjectId: 'HIN', marksObtained: 70, isAbsent: false },
  { studentId: 'STU005', examId: 'MIDTERM-2025', subjectId: 'SST', marksObtained: 66, isAbsent: false },
  { studentId: 'STU005', examId: 'MIDTERM-2025', subjectId: 'CS', marksObtained: 72, isAbsent: false },
];

export const users: User[] = [
  {
    id: 'admin-001',
    name: 'Dr. Rajesh Kumar',
    role: 'admin',
    email: 'admin@school.edu',
  },
  {
    id: 'teacher-001',
    name: 'Prof. Meena Sharma',
    role: 'teacher',
    email: 'meena.sharma@school.edu',
  },
  {
    id: 'STU001',
    name: 'Rahul Sharma',
    role: 'student',
    email: 'rahul.sharma@school.edu',
  },
  {
    id: 'parent-001',
    name: 'Mr. Vijay Sharma',
    role: 'parent',
    email: 'parent.sharma@email.com',
  },
];

export const dashboardStats: DashboardStats = {
  totalStudents: 847,
  totalTeachers: 56,
  upcomingExams: 12,
  completedExams: 8,
  averageAttendance: 94.5,
  passPercentage: 92.3,
};
