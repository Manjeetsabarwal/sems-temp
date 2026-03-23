// API Configuration for NestJS Backend
export const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3000';

// API endpoints
export const API_ENDPOINTS = {
  // Authentication
  authLogin: `${API_BASE_URL}/api/auth/login`,
  authRegister: `${API_BASE_URL}/api/auth/register`,
  authMe: `${API_BASE_URL}/api/auth/me`,
  
  // Academic Years
  academicYears: `${API_BASE_URL}/api/academic-years`,
  
  // Classes
  classes: `${API_BASE_URL}/api/classes`,
  classesDropdown: `${API_BASE_URL}/api/classes/dropdown`,
  
  // Sections
  sections: `${API_BASE_URL}/api/sections`,
  sectionsDropdown: `${API_BASE_URL}/api/sections/dropdown`,
  sectionsByClass: (classId: string) => `${API_BASE_URL}/api/sections/by-class/${classId}`,
  
  // Teachers
  teachers: `${API_BASE_URL}/api/teachers`,
  teachersDropdown: `${API_BASE_URL}/api/teachers/dropdown`,
  
  // Students
  students: `${API_BASE_URL}/api/students`,
  studentsByClassSection: `${API_BASE_URL}/api/students/by-class-section`,
  
  // Subjects
  subjects: `${API_BASE_URL}/api/subjects`,
  subjectsDropdown: `${API_BASE_URL}/api/subjects/dropdown`,
  subjectsByClass: (classId: string) => `${API_BASE_URL}/api/subjects/by-class/${classId}`,
  
  // Exams
  exams: `${API_BASE_URL}/api/exams`,
  examsDropdown: `${API_BASE_URL}/api/exams/dropdown`,
  examsByClass: (classId: string) => `${API_BASE_URL}/api/exams/by-class/${classId}`,
  
  // Exam Papers (Version 3)
  examPapers: `${API_BASE_URL}/api/exam-papers`,
  examPaperById: (paperId: string) => `${API_BASE_URL}/api/exam-papers/${paperId}`,
  examPapersByExam: (examId: string) => `${API_BASE_URL}/api/exam-papers/by-exam/${examId}`,
  examPapersBulkDelete: `${API_BASE_URL}/api/exam-papers/bulk-delete`,
  
  // Paper Rules (Version 3 - Step 2)
  paperRules: `${API_BASE_URL}/api/paper-rules`,
  paperRuleById: (ruleId: string) => `${API_BASE_URL}/api/paper-rules/${ruleId}`,
  paperRuleByPaper: (paperId: string) => `${API_BASE_URL}/api/paper-rules/by-paper/${paperId}`,
  paperRuleEvaluate: (paperId: string) => `${API_BASE_URL}/api/paper-rules/${paperId}/evaluate`,
  
  // Questions (Version 3 - Step 3)
  questions: `${API_BASE_URL}/api/questions`,
  questionById: (questionId: string) => `${API_BASE_URL}/api/questions/${questionId}`,
  questionsByPaper: (paperId: string) => `${API_BASE_URL}/api/questions/by-paper/${paperId}`,
  questionsByPaperAndType: (paperId: string, questionType: string) => `${API_BASE_URL}/api/questions/by-paper/${paperId}/by-type/${questionType}`,
  questionsBulkDelete: `${API_BASE_URL}/api/questions/bulk-delete`,
  questionsReorder: `${API_BASE_URL}/api/questions/reorder`,
  questionsStatistics: (paperId: string) => `${API_BASE_URL}/api/questions/statistics/${paperId}`,
  
  // Question Options (Version 3 - Step 4)
  questionOptions: `${API_BASE_URL}/api/question-options`,
  questionOptionById: (optionId: string) => `${API_BASE_URL}/api/question-options/${optionId}`,
  questionOptionsByQuestion: (questionId: string) => `${API_BASE_URL}/api/question-options/by-question/${questionId}`,
  questionOptionsCorrect: (questionId: string) => `${API_BASE_URL}/api/question-options/by-question/${questionId}/correct`,
  questionOptionsBulk: `${API_BASE_URL}/api/question-options/bulk`,
  questionOptionsBulkDelete: `${API_BASE_URL}/api/question-options/bulk-delete`,
  questionOptionsReorder: `${API_BASE_URL}/api/question-options/reorder`,
  questionOptionsValidate: (questionId: string) => `${API_BASE_URL}/api/question-options/validate/${questionId}`,
  
  // Student Attempts (Version 3 - Step 5)
  studentAttempts: `${API_BASE_URL}/api/student-attempts`,
  studentAttemptById: (attemptId: string) => `${API_BASE_URL}/api/student-attempts/${attemptId}`,
  studentAttemptsByStudentAndPaper: (studentId: string, paperId: string) => `${API_BASE_URL}/api/student-attempts/by-student/${studentId}/paper/${paperId}`,
  studentAttemptActive: (studentId: string, paperId: string) => `${API_BASE_URL}/api/student-attempts/active/${studentId}/${paperId}`,
  studentAttemptSubmit: (attemptId: string) => `${API_BASE_URL}/api/student-attempts/${attemptId}/submit`,
  studentAttemptAbandon: (attemptId: string) => `${API_BASE_URL}/api/student-attempts/${attemptId}/abandon`,
  studentAttemptUpdateTime: (attemptId: string) => `${API_BASE_URL}/api/student-attempts/${attemptId}/time`,
  studentAttemptStatistics: (paperId: string) => `${API_BASE_URL}/api/student-attempts/statistics/${paperId}`,
  
  // Student Responses (Version 3 - Step 6)
  studentResponses: `${API_BASE_URL}/api/student-responses`,
  studentResponseById: (responseId: string) => `${API_BASE_URL}/api/student-responses/${responseId}`,
  studentResponsesByAttempt: (attemptId: string) => `${API_BASE_URL}/api/student-responses/by-attempt/${attemptId}`,
  studentResponsesByQuestion: (questionId: string) => `${API_BASE_URL}/api/student-responses/by-question/${questionId}`,
  studentResponseCreateOrUpdate: `${API_BASE_URL}/api/student-responses/create-or-update`,
  studentResponseEvaluate: (responseId: string) => `${API_BASE_URL}/api/student-responses/${responseId}/evaluate`,
  studentResponsesBulkEvaluate: `${API_BASE_URL}/api/student-responses/bulk-evaluate`,
  studentResponseStatistics: (attemptId: string) => `${API_BASE_URL}/api/student-responses/statistics/${attemptId}`,
  
  // Marks
  marks: `${API_BASE_URL}/api/marks`,
  marksByStudent: (studentId: string) => `${API_BASE_URL}/api/marks/by-student/${studentId}`,
  marksByExam: (examId: string) => `${API_BASE_URL}/api/marks/by-exam/${examId}`,
  marksByStudentExam: `${API_BASE_URL}/api/marks/by-student-exam`,
  
  // Results
  results: `${API_BASE_URL}/api/results`,
  resultsByStudent: (studentId: string) => `${API_BASE_URL}/api/results/by-student/${studentId}`,
  resultsByExam: (examId: string) => `${API_BASE_URL}/api/results/by-exam/${examId}`,
  calculateResult: (studentId: string, examId: string) => `${API_BASE_URL}/api/results/calculate/${studentId}/${examId}`,
  calculateRanks: (examId: string) => `${API_BASE_URL}/api/results/calculate-ranks/${examId}`,
  publishResult: (resultId: string) => `${API_BASE_URL}/api/results/${resultId}/publish`,
  unpublishResult: (resultId: string) => `${API_BASE_URL}/api/results/${resultId}/unpublish`,
  
  // Report Cards (generated from Results)
  reportCards: `${API_BASE_URL}/api/results/report-cards`,
  reportCard: (studentId: string, examId: string) => `${API_BASE_URL}/api/results/report-card/${studentId}/${examId}`,
  
  // Student Habits (Template 3)
  studentHabits: `${API_BASE_URL}/api/student-habits`,
  studentHabitsByStudentAndYear: (studentId: string, academicYear: string) => `${API_BASE_URL}/api/student-habits/student/${studentId}/year/${academicYear}`,

  // Courses (Coaching Management)
  courses: `${API_BASE_URL}/api/courses`,
  coursesDropdown: `${API_BASE_URL}/api/courses/dropdown`,

  // Batches (Coaching Management)
  batches: `${API_BASE_URL}/api/batches`,
  batchesDropdown: `${API_BASE_URL}/api/batches/dropdown`,
  batchesByCourse: (courseId: number) => `${API_BASE_URL}/api/batches/by-course/${courseId}`,
  batchTeachers: (batchId: number) => `${API_BASE_URL}/api/batches/${batchId}/teachers`,
  batchStudents: (batchId: number) => `${API_BASE_URL}/api/batches/${batchId}/students`,
  batchRemoveTeacher: (batchId: number, teacherId: string) => `${API_BASE_URL}/api/batches/${batchId}/teachers/${teacherId}`,
  batchRemoveStudent: (batchId: number, studentId: string) => `${API_BASE_URL}/api/batches/${batchId}/students/${studentId}`,

  // Lectures (Coaching Management)
  lectures: `${API_BASE_URL}/api/lectures`,
  lecturesByBatch: (batchId: number) => `${API_BASE_URL}/api/lectures/by-batch/${batchId}`,
  lecturesByTeacher: (teacherId: string) => `${API_BASE_URL}/api/lectures/by-teacher/${teacherId}`,

  // Attendance (Coaching Management)
  attendance: `${API_BASE_URL}/api/attendance`,
  attendanceByLecture: (lectureId: number) => `${API_BASE_URL}/api/attendance/by-lecture/${lectureId}`,
  attendanceByStudent: (studentId: string) => `${API_BASE_URL}/api/attendance/by-student/${studentId}`,
  attendanceBulkMark: `${API_BASE_URL}/api/attendance/bulk-mark`,
  attendanceReport: `${API_BASE_URL}/api/attendance/report`,

  // Phase 2: Financial
  enrollments: `${API_BASE_URL}/api/enrollments`,
  paidStudentFees: `${API_BASE_URL}/api/paid-student-fees`,
  paidStudentFeesByEnrollment: (enrollmentId: number) => `${API_BASE_URL}/api/paid-student-fees/by-enrollment/${enrollmentId}`,
  teacherPayouts: `${API_BASE_URL}/api/teacher-payouts`,
  teacherPayoutsByBatch: (batchId: number) => `${API_BASE_URL}/api/teacher-payouts/by-batch/${batchId}`,
  teacherPayoutsByTeacher: (teacherId: string) => `${API_BASE_URL}/api/teacher-payouts/by-teacher/${teacherId}`,

  // Phase 3: Broadcast + WhatsApp
  broadcasts: `${API_BASE_URL}/api/broadcasts`,
  broadcastMessages: (id: number) => `${API_BASE_URL}/api/broadcasts/${id}/messages`,
  broadcastStats: (id: number) => `${API_BASE_URL}/api/broadcasts/${id}/stats`,
  broadcastSend: (id: number) => `${API_BASE_URL}/api/broadcasts/${id}/send`,
  broadcastRetry: (id: number) => `${API_BASE_URL}/api/broadcasts/${id}/retry`,
  broadcastWithRecipients: `${API_BASE_URL}/api/broadcasts/with-recipients`,
  whatsappTemplates: `${API_BASE_URL}/api/whatsapp-templates`,
  whatsappTemplatesDropdown: `${API_BASE_URL}/api/whatsapp-templates/dropdown`,
  whatsappTemplatesMeta: `${API_BASE_URL}/api/broadcasts/whatsapp/templates`,

  // Payment Reminders
  paymentReminders: `${API_BASE_URL}/api/payment-reminders`,
  paymentReminderSend: `${API_BASE_URL}/api/payment-reminders/send`,
  paymentReminderSendBulk: `${API_BASE_URL}/api/payment-reminders/send-bulk`,
  paymentReminderStats: `${API_BASE_URL}/api/payment-reminders/stats`,
  paymentReminderCheckPayment: (id: number) => `${API_BASE_URL}/api/payment-reminders/${id}/check-payment`,

  // Phase 4: Report card templates
  reportCardTemplates: `${API_BASE_URL}/api/report-card-templates`,
  reportCardTemplatesDropdown: `${API_BASE_URL}/api/report-card-templates/dropdown`,

  // License (Razorpay)
  license: `${API_BASE_URL}/api/license`,
  licenseConfig: `${API_BASE_URL}/api/license/config`,
  licenseCurrent: `${API_BASE_URL}/api/license/current`,
  licensePlans: `${API_BASE_URL}/api/license/plans`,
  licenseOrder: `${API_BASE_URL}/api/license/order`,
  licenseVerify: `${API_BASE_URL}/api/license/verify`,

  // Attachments (File Upload)
  attachments: `${API_BASE_URL}/api/attachments`,
  attachmentUpload: `${API_BASE_URL}/api/attachments/upload`,
  attachmentById: (id: number) => `${API_BASE_URL}/api/attachments/${id}`,
  attachmentDownload: (id: number) => `${API_BASE_URL}/api/attachments/${id}/download`,
  attachmentPreview: (id: number) => `${API_BASE_URL}/api/attachments/${id}/preview`,
  attachmentStorageInfo: `${API_BASE_URL}/api/attachments/storage/info`,
  
  // Report Card Overrides
  reportCardOverrides: `${API_BASE_URL}/api/report-card-overrides`,
};

// Helper function to make API calls
export async function apiCall<T>(
  url: string,
  options: RequestInit = {},
): Promise<T> {
  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Add auth token if available
  const token = localStorage.getItem('access_token');
  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

// Build query string from filters
export function buildQueryString(params: Record<string, string | undefined>): string {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      searchParams.append(key, value);
    }
  });
  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
}
