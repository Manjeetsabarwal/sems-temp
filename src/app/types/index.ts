// Core Types for School Exam Management System

export type UserRole = 'admin' | 'teacher' | 'student' | 'parent';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  email: string;
  avatar?: string;
  studentId?: string | null;
  teacherId?: string | null;
}

export interface AcademicYear {
  id: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

export interface Class {
  id: string;
  name: string;
}

export interface Section {
  id: string;
  classId: string;
  name: string;
}

export interface ClassExtended {
  classId: string;
  name: string;
  description?: string;
  capacity?: number; // Total student capacity
  currentStrength?: number; // Current number of students
  status: 'Active' | 'Inactive';
  createdAt?: string;
  updatedAt?: string;
}

export interface SectionExtended {
  sectionId: string;
  classId?: string | null; // Now optional - sections are independent
  className?: string | null; // For display
  name: string;
  capacity?: number; // Section student capacity
  currentStrength?: number; // Current number of students
  roomNumber?: string;
  classes?: Array<{ classId: string; className: string; status: string }>; // Many-to-many
  status: 'Active' | 'Inactive';
  createdAt?: string;
  updatedAt?: string;
}

export interface Teacher {
  teacherId: string;
  name: string;
  email: string;
  phone: string;
  subjects: string[]; // Array of subject IDs (deprecated - use subject_teachers)
  subjectDetails?: Array<{ // Add this for detailed subject information
    subjectId: string;
    subjectName: string;
    subjectCode: string;
    isPrimary: boolean;
  }>;
  classes: string[]; // Array of class IDs (deprecated - use teacher_assignments)
  qualification?: string;
  experience?: number; // years
  joiningDate?: string;
  address?: string;
  status: 'Active' | 'Inactive';
  createdAt?: string;
  updatedAt?: string;
}

export interface TeacherAssignment {
  id: number;
  teacherId: string;
  teacherName?: string;
  classId: string;
  className?: string;
  sectionId: string;
  sectionName?: string;
  subjectId: string;
  subjectName?: string;
  isDefault: boolean;
  academicYear?: string;
  startDate?: string;
  endDate?: string;
  status: 'Active' | 'Inactive' | 'Completed';
  createdAt?: string;
  updatedAt?: string;
}

export interface SubjectTeacher {
  teacherId: string;
  name: string;
  email?: string;
  isPrimary: boolean;
}

export interface Subject {
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  classId?: string | null; // Now optional - subjects are independent
  description?: string;
  credits?: number;
  hoursPerWeek?: number;
  teacherId?: string | null; // Primary teacher ID (backward compatible)
  teacherName?: string | null; // Primary teacher name
  teachers?: SubjectTeacher[]; // Many-to-many teachers
  status: 'Active' | 'Inactive';
  createdAt?: string;
  updatedAt?: string;
}

// Legacy type for backward compatibility
export interface OldSubject {
  id: string;
  name: string;
  maxMarks: number;
  passMarks: number;
  code: string;
}

export interface ExamSubject {
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  maxMarks: number;
  passingMarks: number;
  examDate: string;
  duration: number; // in minutes
}

export interface Student {
  studentId: string;
  name: string;
  classId?: string | null; // Optional - can be assigned later
  sectionId?: string | null; // Optional - can be assigned later
  className?: string;
  sectionName?: string;
  rollNo?: number | null; // Optional - can be assigned later
  parentContact: string; // Map to parentPhone
  parentPhone?: string;
  parentEmail: string;
  parentName?: string;
  fatherName?: string;
  motherName?: string;
  dateOfBirth?: string;
  gender?: string;
  email?: string;
  phone?: string;
  address?: string;
  admissionDate?: string;
  avatar?: string;
  examRegistrationFees?: number | null; // Exam registration fees
  status?: 'Active' | 'Inactive' | 'Deleted'; // Optional status field for filtering
  createdAt?: string;
  updatedAt?: string;
  section?: string; // Legacy field for sectionId
}

export interface Exam {
  examId: string;
  examName: string;
  examType: 'Mid-Term' | 'Final' | 'Unit Test' | 'Quarterly' | 'PT';
  academicYear: string;
  classId: string;
  term: 'Term 1' | 'Term 2';
  startDate: string;
  endDate: string;
  totalMarks: number;
  passingMarks: number;
  subjects: ExamSubject[];
  status: 'Scheduled' | 'Ongoing' | 'Completed';
  createdAt?: string;
  updatedAt?: string;
}

// Version 3: Exam Paper Interface
export interface ExamPaper {
  paperId: string;
  examId: string;
  paperTitle: string;
  paperCode?: string;
  durationMinutes: number;
  totalMarks: number;
  isOnline: boolean; // true = online exam, false = manual exam
  displayOrder: number;
  instructions?: string;
  status: 'Draft' | 'Published' | 'Archived';
  createdAt?: string;
  updatedAt?: string;
  exam?: Exam; // Optional relation
}

// Version 3: Paper Rule Interface
export interface PaperRule {
  ruleId: string;
  paperId: string;
  minMarksToPass: number;
  minPercentage: number;
  sectionWisePassRequired: boolean;
  mustAttemptPercentage: number;
  evaluationMode: 'AUTO' | 'MANUAL' | 'MIXED';
  negativeMarkingEnabled: boolean;
  negativeMarkingPerQuestion: number;
  graceMarks: number;
  createdAt?: string;
  updatedAt?: string;
  paper?: ExamPaper; // Optional relation
}

// Version 3: Question Interface
export interface Question {
  questionId: string;
  paperId: string;
  sectionId?: string;
  questionType: 'MCQ' | 'THEORY' | 'DESCRIPTIVE';
  questionText: string;
  questionImageUrl?: string;
  marks: number;
  negativeMarks: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  displayOrder: number;
  isRequired: boolean;
  correctAnswerText?: string;
  solutionText?: string;
  solutionImageUrl?: string;
  meta?: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
  paper?: ExamPaper; // Optional relation
}

// Version 3: Question Option Interface (for MCQs)
export interface QuestionOption {
  optionId: string;
  questionId: string;
  optionText: string;
  optionImageUrl?: string;
  isCorrect: boolean;
  displayOrder: number;
  explanation?: string;
  createdAt?: string;
  updatedAt?: string;
  question?: Question; // Optional relation
}

// Version 3: Student Attempt Interface
export interface StudentAttempt {
  attemptId: string;
  studentId: string;
  paperId: string;
  startedAt: string;
  submittedAt?: string;
  completedAt?: string;
  status: 'IN_PROGRESS' | 'SUBMITTED' | 'EVALUATED' | 'ABANDONED';
  timeSpentMinutes: number;
  totalMarksObtained: number;
  totalMarksAvailable?: number;
  percentage?: number;
  isPassed?: boolean;
  autoSubmitted: boolean;
  ipAddress?: string;
  userAgent?: string;
  meta?: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
  student?: Student; // Optional relation
  paper?: ExamPaper; // Optional relation
}

// Version 3: Student Response Interface
export interface StudentResponse {
  responseId: string;
  attemptId: string;
  questionId: string;
  selectedOptionId?: string;
  answerText?: string;
  answerImageUrl?: string;
  marksAwarded: number;
  isCorrect?: boolean;
  isEvaluated: boolean;
  evaluatedBy?: string;
  evaluatedAt?: string;
  feedback?: string;
  timeSpentSeconds: number;
  meta?: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
  attempt?: StudentAttempt; // Optional relation
  question?: Question; // Optional relation
  selectedOption?: QuestionOption; // Optional relation
}

export interface Marks {
  studentId: string;
  examId: string;
  subjectId: string;
  marksObtained: number;
  isAbsent: boolean;
}

// Enhanced Mark interface for Marks/Evaluation Module
export interface Mark {
  markId: string;          // MRK001, MRK002, etc.
  studentId: string;       // References Student
  studentName?: string;    // Denormalized for display
  examId: string;          // References Exam
  examName?: string;       // Denormalized for display
  subjectId: string;       // References Subject
  subjectName?: string;    // Denormalized for display
  subjectCode?: string;    // Denormalized for display
  classId: string;         // For filtering
  marksObtained: number;   // Actual marks scored
  totalMarks: number;      // Maximum marks possible
  grade?: string;          // A+, A, B+, B, C, D, F
  percentage?: number;     // Calculated percentage
  remarks?: string;        // Teacher's remarks
  isAbsent?: boolean;
  status: 'Draft' | 'Published';
  enteredBy?: string;
  createdAt?: string;
  updatedAt?: string;
  // Version 2: Internal/External Marks Breakdown
  internalMarks?: number;
  externalMarks?: number;
  unitTestMarks?: number;      // 10 marks (10%)
  assignmentMarks?: number;   // 5 marks (5%)
  attendanceMarks?: number;     // 5 marks (5%)
  marksType?: 'Unit Test' | 'Final';
}

export interface GradeRule {
  min: number;
  grade: string;
  color: string;
}

export interface StudentResult {
  studentId: string;
  examId: string;
  totalMarks: number;
  maxMarks: number;
  percentage: number;
  grade: string;
  rank: number;
  subjects: SubjectResult[];
  isPassed: boolean;
}

export interface SubjectResult {
  subjectId: string;
  subjectName: string;
  marksObtained: number;
  maxMarks: number;
  grade: string;
  isPassed: boolean;
  // Version 2: Internal/External Marks Breakdown
  internalMarks?: number;
  externalMarks?: number;
  breakdown?: {
    unitTest: number;      // 10 marks (10%)
    assignment: number;    // 5 marks (5%)
    attendance: number;    // 5 marks (5%)
    external: number;      // 80 marks (80%)
  };
}

// Enhanced Result interface for Results Module
export interface Result {
  resultId: string;
  studentId: string;
  studentName: string;
  examId: string;
  examName: string;
  classId: string;
  totalMarksObtained: number;
  totalMaxMarks: number;
  percentage: number;
  grade: string;
  isPassed: boolean;
  subjects: SubjectResult[];
  rank: number | null;
  status: 'Draft' | 'Published';
  dateOfBirth?: string;
  fatherName?: string;
  motherName?: string;
  remarks?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface DashboardStats {
  totalStudents: number;
  totalTeachers: number;
  upcomingExams: number;
  completedExams: number;
  averageAttendance: number;
  passPercentage: number;
}

// Report Card Types
export interface ReportCardSubject {
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  marksObtained: number;
  totalMarks: number;
  percentage: string;
  grade: string;
  isPassed: boolean;
  remarks: string;
  // Version 2: Internal/External Marks Breakdown
  internalMarks?: number;
  externalMarks?: number;
  breakdown?: {
    unitTest: number;      // 10 marks (10%)
    assignment: number;    // 5 marks (5%)
    attendance: number;    // 5 marks (5%)
    external: number;      // 80 marks (80%)
  };
}

export interface ReportCard {
  version?: 'v1' | 'v2'; // Version indicator
  student: {
    studentId: string;
    name: string;
    rollNo: number;
    classId: string;
    className: string;
    sectionId: string;
    sectionName: string;
    dateOfBirth?: string;
    gender?: string;
    email?: string;
    phone?: string;
    motherName?: string;
    fatherName?: string;
    avatar?: string;
  };
  exam: {
    examId: string;
    examName: string;
    examType: string;
    academicYearId: string;
    startDate: string;
    endDate: string;
    totalMarks: number;
    passingMarks: number;
  };
  subjects: ReportCardSubject[];
  result: {
    resultId: string;
    totalMarksObtained: number;
    totalMaxMarks: number;
    percentage: number;
    grade: string;
    rank: number | string;
    status: string;
    isPassed: boolean;
    publishedAt?: string;
  };
  remarks: {
    teacher: string;
    custom: string;
  };
  generatedAt: string;
  issueDate: string;
}

// ==========================================
// Coaching Management Types (Phase 1)
// ==========================================

export interface Course {
  id: number;
  title: string;
  description?: string | null;
  durationDays?: number | null;
  class?: string | null;
  sem?: string | null;
  stream?: string | null;
  year?: string | null;
  semester?: string | null;
  education?: string | null;
  isDeleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
  courseSubjects?: CourseSubject[];
  batches?: CourseBatch[];
}

export interface CourseSubject {
  id: number;
  courseId: number;
  subjectId: string;
}

export interface CourseBatch {
  id: number;
  courseId: number;
  classId?: string | null;
  sectionId?: string | null;
  title: string;
  description?: string | null;
  durationDays: number;
  startDate: string;
  endDate: string;
  totalRevenue?: number;
  teacherSharePercent?: number;
  institutionSharePercent?: number;
  isCompleted?: boolean;
  isDeleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
  course?: Course;
  batchTeachers?: BatchTeacher[];
  batchStudents?: BatchStudent[];
  lectures?: Lecture[];
}

export interface BatchTeacher {
  id: number;
  batchId: number;
  teacherId: string;
  shareAmount?: number | null;
  createdAt?: string;
}

export interface BatchStudent {
  id: number;
  batchId: number;
  studentId: string;
  createdAt?: string;
}

export interface Lecture {
  id: number;
  batchId: number;
  teacherId: string;
  subjectId: string;
  dateTime: string;
  durationMinutes: number;
  topic: string;
  createdAt?: string;
  updatedAt?: string;
  batch?: CourseBatch;
  attendance?: AttendanceRecord[];
}

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

export interface AttendanceRecord {
  id: number;
  lectureId: number;
  studentId: string;
  status: AttendanceStatus;
  notes?: string | null;
  date: string;
  createdAt?: string;
  lecture?: Lecture;
}

export interface AttendanceReportEntry {
  studentId: string;
  total: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
  percentage: string;
}

// Phase 2: Financial
export interface StudentEnrollment {
  id: number;
  studentId: string;
  batchId: number;
  courseId: number;
  courseFee: number;
  registrationFee: number;
  discount: number;
  totalAmount: number;
  enrollmentStatus: string;
  paymentStatus: string;
  notes?: string | null;
  createdAt?: string;
  updatedAt?: string;
  batch?: CourseBatch;
  course?: Course;
  payments?: PaidStudentFee[];
}

export interface PaidStudentFee {
  id: number;
  enrollmentId: number;
  amount: number;
  payType: string;
  payMode: string;
  upiId?: string | null;
  acNumber?: string | null;
  transactionId?: string | null;
  notes?: string | null;
  createdAt?: string;
  enrollment?: StudentEnrollment;
}

export interface TeacherPayout {
  id: number;
  batchId: number;
  teacherId: string;
  payoutAmount: number;
  payoutCycle: string;
  status: string;
  payoutDate?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

// Phase 3: Broadcast
export interface Broadcast {
  id: number;
  name: string;
  templateId: string;
  templateName: string;
  templateLanguage: string;
  templateParams?: Record<string, any>;
  targetType?: string;
  targetId?: string | null;
  totalRecipients: number;
  status: string;
  createdBy?: number | null;
  createdAt?: string;
  completedAt?: string | null;
  messages?: BroadcastMessage[];
}

export interface BroadcastMessage {
  id: number;
  broadcastId: number;
  studentId: string;
  phoneNumber: string;
  templateId: string;
  templateName: string;
  templateLanguage: string;
  templateParams?: Record<string, any>;
  status: string;
  providerMessageId?: string | null;
  errorMessage?: string | null;
  sentAt?: string | null;
  deliveredAt?: string | null;
  readAt?: string | null;
  failedAt?: string | null;
  createdAt?: string;
}

export interface WhatsAppTemplate {
  id: number | string;
  name: string;
  language: string;
  status: string;
  category: string;
  components?: any[];
  createdAt?: string;
  updatedAt?: string;
}

// Phase 4: Report card templates
export interface ReportCardTemplate {
  id: number;
  code: string;
  displayName: string;
  description?: string | null;
  isActive: boolean;
  configJson?: Record<string, any> | null;
  createdAt?: string;
  updatedAt?: string;
}

// Timetable Types
export interface TimetableEntry {
  timetableId: string;
  examId: string;
  examName: string;
  classId: string;
  className: string;
  subjectId: string;
  subjectName: string;
  subjectCode?: string;
  date: string; // YYYY-MM-DD format
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  duration: number; // in minutes
  room?: string; // Room number or venue
  invigilator?: string; // Teacher name
  maxMarks: number;
  instructions?: string;
  status: 'Scheduled' | 'Ongoing' | 'Completed' | 'Cancelled';
  createdAt?: string;
  updatedAt?: string;
}