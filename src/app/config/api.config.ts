// API Configuration for NestJS Backend
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

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
};

// Helper function to make API calls
export async function apiCall<T>(
  url: string,
  options: RequestInit = {},
): Promise<T> {

  const token = localStorage.getItem('access_token');

  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}`;
    try {
      const err = await response.json();
      errorMessage = err.message || errorMessage;
    } catch {}
    throw new Error(errorMessage);
  }

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
