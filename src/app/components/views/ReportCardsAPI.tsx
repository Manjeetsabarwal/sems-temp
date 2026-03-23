import React, { useState, useEffect } from 'react';
import {
  Search,
  Loader2,
  Download,
  RefreshCw,
  Printer,
  FileText,
  Grid3x3,
  List,
  Filter,
  Award,
  Trophy,
  FileSpreadsheet,
  Eye,
  Share2,
  Calendar,
  User,
  BookOpen,
  Mail,
  Phone,
  MapPin,
  ArrowLeft,
  ChevronRight,
  TrendingUp,
  Edit,
  Save,
  X,
  MessageCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { toast } from 'sonner';
import { resultsService } from '../../services/results.service';
import { examsService } from '../../services/exams.service';
import { classesService } from '../../services/classes.service';
import { reportCardTemplatesService } from '../../services/report-card-templates.service';
import { reportCardOverridesService } from '../../services/report-card-overrides.service';
import { marksService } from '../../services/marks.service';
import { studentsService } from '../../services/students.service';
import { studentHabitsService, type CreateStudentHabitDto } from '../../services/student-habits.service';
import { generateResultPDF, generateTemplate2PDF, generateTemplate3PDF } from '../../utils/pdfGenerator';
import { shareViaWhatsApp, shareViaEmail } from '../../utils/shareUtils';
import { calculatePromotion, type PromotionResult } from '../../utils/promotionCalculator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';

type ViewMode = 'grid' | 'table';

interface ReportCardSummary {
  resultId: string;
  studentId: string;
  studentName: string;
  rollNo: number;
  examId: string;
  examName: string;
  classId: string;
  className?: string;
  percentage: number;
  grade: string;
  rank: number | string;
  status: string;
  isPassed: boolean;
  publishedAt?: string;
}

interface ReportCardDetails {
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
    parentName?: string;
    fatherName?: string;
    motherName?: string;
    address?: string;
    avatar?: string;
  };
  exam: {
    examId: string;
    examName: string;
    examType: string;
    academicYear: string;
    startDate: string;
    endDate: string;
    totalMarks: number;
    passingMarks: number;
    term?: string;
  };
  subjects: Array<{
    subjectId: string;
    subjectName: string;
    subjectCode: string;
    marksObtained: number;
    internalMarks?: number;
    externalMarks?: number;
    maxMarks?: number;
    totalMarks: number;
    percentage: string;
    grade: string;
    isPassed: boolean;
    remarks: string;
    breakdown?: {
      unitTest: number;
      assignment: number;
      attendance: number;
      external: number;
    };
  }>;
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

// Template 2 Data Interface (CBSE Style - Term 1 + Term 2)
interface Template2SubjectData {
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  term1: {
    periodicTest: number; // unitTestMarks
    noteBook: number; // assignmentMarks (N.B.)
    subEnrichment: number; // attendanceMarks (S.E.)
    halfYearly: number; // externalMarks
    total: number;
    grade: string;
  };
  term2: {
    periodicTest: number;
    noteBook: number;
    subEnrichment: number;
    annual: number; // externalMarks
    total: number;
    grade: string;
  };
  grandTotal: number;
  finalGrade: string;
}

interface CoScholasticArea {
  area: string;
  term1Grade: string;
  term2Grade: string;
}

interface Template2Data {
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
    parentName?: string;
    motherName?: string;
    fatherName?: string;
    address?: string;
  };
  academicYear: string;
  subjects: Template2SubjectData[];
  coScholasticAreas: CoScholasticArea[];
  term1Total: number;
  term2Total: number;
  grandTotal: number;
  term1Percentage: number;
  term2Percentage: number;
  overallPercentage: number;
  overallGrade: string;
  result: string;
  remarks: string;
  schoolName: string;
  schoolAddress: string;
  generatedAt: string;
}

interface Template3SubjectData {
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  // Term 1 (1st Term)
  term1Assessment: number; // 20 marks (internal)
  term1Written: number; // 80 marks (external)
  term1Total: number; // 100 marks
  term1Percentage: number;
  // Term 2 (Final Term)
  term2Assessment: number; // 20 marks (internal)
  term2Written: number; // 80 marks (external)
  term2Total: number; // 100 marks
  term2Percentage: number;
  // Final Aggregate
  finalAggregateTotal: number; // Sum of term1 + term2
  finalAggregatePercentage: number; // Average percentage
  finalGrade: string;
}

interface Template3Habit {
  habitId?: string;
  habitName: string;
  term1Grade: 'A' | 'B' | 'C' | 'D' | 'E' | '';
  term2Grade: 'A' | 'B' | 'C' | 'D' | 'E' | '';
}

interface Template3Data {
  student: {
    studentId: string;
    name: string;
    std: string; // Standard/Class number
    classSection: string; // Class/Section
    rollNo: number;
    dateOfBirth?: string;
    gender?: string;
    motherName?: string;
    fatherName?: string;
    address?: string;
  };
  academicYear: string;
  subjects: Template3SubjectData[];
  habits: Template3Habit[];
  // Overall totals
  term1TotalMarks: number;
  term2TotalMarks: number;
  term1TotalPercentage: number;
  term2TotalPercentage: number;
  finalAggregateTotal: number;
  finalAggregatePercentage: number;
  // Attendance
  term1Attendance?: { present: number; total: number; percentage: number };
  term2Attendance?: { present: number; total: number; percentage: number };
  overallAttendance?: { present: number; total: number; percentage: number };
  // Remarks
  term1Remarks?: string;
  term2Remarks?: string;
  // Promotion
  promotion: PromotionResult;
  // School info
  schoolName: string;
  schoolAddress: string;
  schoolPhone?: string;
  schoolEmail?: string;
  schoolWebsite?: string;
  generatedAt: string;
}

export function ReportCardsAPI() {
  const [reportCards, setReportCards] = useState<ReportCardSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedExam, setSelectedExam] = useState<string>('all');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [selectedReportCard, setSelectedReportCard] = useState<ReportCardDetails | null>(null);
  const [viewingReportCard, setViewingReportCard] = useState(false);
  const [reportCardVersion] = useState<'v2'>('v2'); // V2 is now the final version
  const [unitTestMethod, setUnitTestMethod] = useState<'average' | 'highest'>('average');
  const [selectedTemplate, setSelectedTemplate] = useState<'template1' | 'template2' | 'template3' | 'template4'>('template1'); // Template selection (template4 = Offline, same as template1)
  const [template2Data, setTemplate2Data] = useState<Template2Data | null>(null); // Template 2 data (Term 1 + Term 2)
  const [template3Data, setTemplate3Data] = useState<Template3Data | null>(null); // Template 3 data (Two pages)
  const [editablePromotionDate, setEditablePromotionDate] = useState<string>(''); // Editable promotion date
  const [gradingLegend, setGradingLegend] = useState<string>(''); // Grading system legend/abbreviations
  const [shareDialog, setShareDialog] = useState<{ open: boolean }>({ open: false });
  const [term1MainExamId, setTerm1MainExamId] = useState<string | null>(null);
  const [term2MainExamId, setTerm2MainExamId] = useState<string | null>(null);

  // Re-fetch template data when selections change
  useEffect(() => {
    if (viewingReportCard && selectedReportCard) {
      if (selectedTemplate === 'template2') {
        fetchTemplate2Data(selectedReportCard.student.studentId, selectedReportCard.exam.academicYear || '2024-2025');
      } else if (selectedTemplate === 'template3') {
        fetchTemplate3Data(selectedReportCard.student.studentId, selectedReportCard.exam.academicYear || '2024-2025');
      }
    }
  }, [term1MainExamId, term2MainExamId]);

  const [isEditingScholastic, setIsEditingScholastic] = useState(false);
  const [isEditingT2, setIsEditingT2] = useState(false);
  const [dbOverride, setDbOverride] = useState<any>(null);
  const [scholasticBackup, setScholasticBackup] = useState<any>(null);

  const [isEditingHabits, setIsEditingHabits] = useState(false);
  const [habitsSaving, setHabitsSaving] = useState(false);
  const [habitsBackup, setHabitsBackup] = useState<Template3Habit[] | null>(null);

  // Dropdown data
  const [exams, setExams] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);

  // Fetch dropdown data
  useEffect(() => {
    fetchExams();
    fetchClasses();
  }, []);

  // Fetch report cards when filters change
  useEffect(() => {
    fetchReportCards();
  }, [selectedExam, selectedClass]);

  const fetchExams = async () => {
    try {
      const data = await examsService.getAll();
      setExams(data);
    } catch (error) {
      console.error('Error fetching exams:', error);
    }
  };

  const generateStudentHabitId = (studentId: string, academicYear: string, habitName: string) => {
    const safeHabit = habitName.replace(/[^a-zA-Z0-9]+/g, '_').toUpperCase();
    const safeYear = academicYear.replace(/[^a-zA-Z0-9]+/g, '_').toUpperCase();
    return `HAB_${studentId}_${safeYear}_${safeHabit}`;
  };


  const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

  const recomputeTemplate3Data = (data: Template3Data, subjects: Template3SubjectData[]) => {
    const updatedSubjects = subjects.map((s: Template3SubjectData) => {
      const term1Assessment = clamp(Number(s.term1Assessment || 0), 0, 20);
      const term1Written = clamp(Number(s.term1Written || 0), 0, 80);
      const term2Assessment = clamp(Number(s.term2Assessment || 0), 0, 20);
      const term2Written = clamp(Number(s.term2Written || 0), 0, 80);

      const term1Total = term1Assessment + term1Written;
      const term2Total = term2Assessment + term2Written;
      const term1Percentage = term1Total > 0 ? (term1Total / 100) * 100 : 0;
      const term2Percentage = term2Total > 0 ? (term2Total / 100) * 100 : 0;

      const finalAggregateTotal = term1Total + term2Total;
      const finalAggregatePercentage = finalAggregateTotal > 0 ? (finalAggregateTotal / 200) * 100 : 0;
      const finalGrade = calculateGrade(finalAggregatePercentage);

      return {
        ...s,
        term1Assessment,
        term1Written,
        term1Total,
        term1Percentage,
        term2Assessment,
        term2Written,
        term2Total,
        term2Percentage,
        finalAggregateTotal,
        finalAggregatePercentage,
        finalGrade,
      };
    });

    const term1TotalMarks = updatedSubjects.reduce((sum, s: Template3SubjectData) => sum + s.term1Total, 0);
    const term2TotalMarks = updatedSubjects.reduce((sum, s: Template3SubjectData) => sum + s.term2Total, 0);
    const finalAggregateTotal = term1TotalMarks + term2TotalMarks;
    const numSubjects = updatedSubjects.length || 1;
    const maxMarksPerTerm = numSubjects * 100;
    const maxTotalMarks = maxMarksPerTerm * 2;
    const term1TotalPercentage = maxMarksPerTerm > 0 ? (term1TotalMarks / maxMarksPerTerm) * 100 : 0;
    const term2TotalPercentage = maxMarksPerTerm > 0 ? (term2TotalMarks / maxMarksPerTerm) * 100 : 0;
    const finalAggregatePercentage = maxTotalMarks > 0 ? (finalAggregateTotal / maxTotalMarks) * 100 : 0;

    const englishSubject = updatedSubjects.find((s: any) => s.subjectName.toLowerCase().includes('english'));
    const englishPassed = englishSubject ? englishSubject.finalAggregatePercentage >= 33 : true;
    const attendancePercentage = data.overallAttendance?.percentage || 0;

    const promotion = calculatePromotion({
      overallPercentage: finalAggregatePercentage,
      englishPassed,
      attendancePercentage,
      minimumAttendanceRequired: 75,
      minimumPercentageRequired: 33,
    });

    return {
      ...data,
      subjects: updatedSubjects,
      term1TotalMarks,
      term2TotalMarks,
      term1TotalPercentage,
      term2TotalPercentage,
      finalAggregateTotal,
      finalAggregatePercentage,
      term1Remarks: term1TotalPercentage >= 50 ? 'Good Performance' : 'Needs Improvement',
      term2Remarks: term2TotalPercentage >= 50 ? 'Good Performance' : 'Needs Improvement',
      promotion,
    };
  };

  const startEditingScholastic = () => {
    if (!template3Data) return;
    setScholasticBackup(template3Data.subjects.map((s: Template3SubjectData) => ({ ...s })));
    setIsEditingScholastic(true);
  };

  const cancelEditingScholastic = () => {
    if (!template3Data) return;
    if (scholasticBackup) {
      const next = recomputeTemplate3Data(template3Data, scholasticBackup.map((s) => ({ ...s })));
      setTemplate3Data(next);
    }
    setScholasticBackup(null);
    setIsEditingScholastic(false);
  };

  const saveScholasticOverrides = async () => {
    if (!template3Data) return;

    const overrides: Record<string, any> = {};
    template3Data.subjects.forEach((s) => {
      overrides[s.subjectId] = {
        term1Assessment: s.term1Assessment,
        term1Written: s.term1Written,
        term2Assessment: s.term2Assessment,
        term2Written: s.term2Written,
      };
    });

    try {
      await reportCardOverridesService.upsertOverride({
        studentId: template3Data.student.studentId,
        academicYear: template3Data.academicYear,
        templateId: 'template3',
        overrides
      });
      setScholasticBackup(null);
      setIsEditingScholastic(false);
      toast.success('Scholastic overrides saved to database');
    } catch (error: any) {
      toast.error('Failed to save overrides: ' + error.message);
    }
  };

  const updateScholasticCell = (
    subjectIndex: number,
    field: 'term1Assessment' | 'term1Written' | 'term2Assessment' | 'term2Written',
    value: string,
  ) => {
    if (!template3Data) return;
    const raw = value === '' ? 0 : Number(value);
    const numeric = Number.isFinite(raw) ? raw : 0;

    const nextSubjects = template3Data.subjects.map((s, idx) => {
      if (idx !== subjectIndex) return s;
      return {
        ...s,
        [field]: numeric,
      } as Template3SubjectData;
    });

    setTemplate3Data(recomputeTemplate3Data(template3Data, nextSubjects));
  };

  const startEditingHabits = () => {
    if (!template3Data) return;
    setHabitsBackup(template3Data.habits.map(h => ({ ...h })));
    setIsEditingHabits(true);
  };

  const cancelEditingHabits = () => {
    if (!template3Data) return;
    if (habitsBackup) {
      setTemplate3Data({
        ...template3Data,
        habits: habitsBackup.map(h => ({ ...h })),
      });
    }
    setHabitsBackup(null);
    setIsEditingHabits(false);
  };

  const saveHabits = async () => {
    if (!template3Data) return;
    setHabitsSaving(true);
    try {
      const createDtos: CreateStudentHabitDto[] = template3Data.habits.map((h) => {
        const habitId = h.habitId || generateStudentHabitId(template3Data.student.studentId, template3Data.academicYear, h.habitName);
        return {
          habitId,
          studentId: template3Data.student.studentId,
          academicYear: template3Data.academicYear,
          habitName: h.habitName as any,
          term1Grade: (h.term1Grade ? h.term1Grade : undefined) as any,
          term2Grade: (h.term2Grade ? h.term2Grade : undefined) as any,
        };
      });

      const saved = await studentHabitsService.bulkCreate(createDtos);

      const habits = template3Data.habits.map((h) => {
        const savedHabit = saved.find((s: any) => s.habitName === h.habitName);
        return {
          ...h,
          habitId: savedHabit?.habitId || h.habitId,
          term1Grade: (savedHabit?.term1Grade as any) || h.term1Grade,
          term2Grade: (savedHabit?.term2Grade as any) || h.term2Grade,
        };
      });

      setTemplate3Data({
        ...template3Data,
        habits,
      });

      setHabitsBackup(null);
      setIsEditingHabits(false);
      toast.success('Habits saved');
    } catch (error: any) {
      console.error('Error saving student habits:', error);
      toast.error(error.message || 'Failed to save habits');
    } finally {
      setHabitsSaving(false);
    }
  };

  const fetchClasses = async () => {
    try {
      const data = await classesService.getAll();
      setClasses(data);
    } catch (error) {
      console.error('Error fetching classes:', error);
    }
  };

  const fetchReportCards = async () => {
    try {
      setLoading(true);
      const filters: any = {};
      if (selectedExam !== 'all') filters.examId = selectedExam;
      if (selectedClass !== 'all') filters.classId = selectedClass;

      const data = await resultsService.getReportCardsList(filters);
      setReportCards(data);
    } catch (error: any) {
      console.error('Error fetching report cards:', error);
      toast.error(error.message || 'Failed to load report cards');
    } finally {
      setLoading(false);
    }
  };

  const viewReportCard = async (studentId: string, examId: string, version: 'v2' = 'v2') => {
    try {
      setLoading(true);
      
      // Fetch grading settings for legend
      const gradingSettings = await fetchGradingSettings();
      setGradingLegend(gradingSettings.gradingLegend || '');
      
      const data = await resultsService.getReportCard(studentId, examId, version, unitTestMethod);
      setSelectedReportCard(data);
      setViewingReportCard(true);
      // V2 is the only version now
    } catch (error: any) {
      console.error('Error fetching report card:', error);
      toast.error(error.message || 'Failed to load report card');
    } finally {
      setLoading(false);
    }
  };

  // Version toggle removed - V2 is the final version

  // Function to calculate grade based on percentage
  const calculateGrade = (percentage: number): string => {
    if (percentage >= 91) return 'A1';
    if (percentage >= 81) return 'A2';
    if (percentage >= 71) return 'B1';
    if (percentage >= 61) return 'B2';
    if (percentage >= 51) return 'C1';
    if (percentage >= 41) return 'C2';
    if (percentage >= 33) return 'D';
    return 'E';
  };

  // Function to fetch school settings - use localStorage as primary source
  const fetchSchoolSettings = async () => {
    try {
      // First check localStorage for settings (saved from Settings page)
      const savedSettings = localStorage.getItem('schoolSettings');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        if (parsed.schoolName && parsed.schoolAddress) {
          console.log('🏫 Using settings from localStorage:', parsed);
          return {
            schoolName: parsed.schoolName,
            schoolAddress: parsed.schoolAddress,
            schoolPhone: parsed.schoolPhone,
            schoolEmail: parsed.schoolEmail,
            schoolWebsite: parsed.schoolWebsite,
          };
        }
      }
      
      // Default settings if nothing is saved
      return {
        schoolName: 'Demo School',
        schoolAddress: '123 Education Street',
        schoolPhone: '',
        schoolEmail: '',
        schoolWebsite: '',
      };
    } catch (error) {
      console.error('Error fetching school settings:', error);
      return {
        schoolName: 'Demo School',
        schoolAddress: '123 Education Street',
        schoolPhone: '',
        schoolEmail: '',
        schoolWebsite: '',
      };
    }
  };

  // Function to fetch grading settings - use localStorage as primary source
  const fetchGradingSettings = async () => {
    try {
      const savedGrading = localStorage.getItem('gradingSettings');
      if (savedGrading) {
        const parsed = JSON.parse(savedGrading);
        return {
          gradingLegend: parsed.gradingLegend || 'A+ (90-100): Outstanding | A (80-89): Excellent | B+ (70-79): Very Good | B (60-69): Good | C (50-59): Average | D (40-49): Below Average | F (0-39): Fail',
          gradeRules: parsed.gradeRules || [],
        };
      }
      
      // Default grading legend
      return {
        gradingLegend: 'A+ (90-100): Outstanding | A (80-89): Excellent | B+ (70-79): Very Good | B (60-69): Good | C (50-59): Average | D (40-49): Below Average | F (0-39): Fail',
        gradeRules: [],
      };
    } catch (error) {
      console.error('Error fetching grading settings:', error);
      return {
        gradingLegend: 'A+ (90-100): Outstanding | A (80-89): Excellent | B+ (70-79): Very Good | B (60-69): Good | C (50-59): Average | D (40-49): Below Average | F (0-39): Fail',
        gradeRules: [],
      };
    }
  };

  // Function to fetch and aggregate Template 2 data (Term 1 + Term 2)
  const fetchTemplate2Data = async (studentId: string, academicYear: string) => {
    try {
      setLoading(true);
      
      // Fetch DB overrides first
      const overrideRecord = await reportCardOverridesService.getOverride(studentId, academicYear, 'template2');
      setDbOverride(overrideRecord);
      const manualOverrides = overrideRecord?.overrides || {};

      console.log('📊 Fetching Template 2 data for student:', studentId, 'AY:', academicYear);
      
      // Fetch school settings
      const schoolSettings = await fetchSchoolSettings();
      console.log('🏫 School settings fetched:', schoolSettings);
      
      // Get student details first (needed for classId)
      const student = await studentsService.getById(studentId);
      console.log('👤 Student details:', student);
      
      // Get all marks for the student - Include breakdown fields explicitly
      const allMarks = await marksService.getAll({ studentId });
      console.log('📝 All marks for student:', allMarks.length, allMarks);
      
      // Enhanced logging to see what fields we actually have
      if (allMarks.length > 0) {
        console.log('📋 Sample mark structure:', {
          markId: allMarks[0].markId,
          hasInternalMarks: allMarks[0].internalMarks !== undefined && allMarks[0].internalMarks !== null,
          hasExternalMarks: allMarks[0].externalMarks !== undefined && allMarks[0].externalMarks !== null,
          hasUnitTestMarks: allMarks[0].unitTestMarks !== undefined && allMarks[0].unitTestMarks !== null,
          hasAssignmentMarks: allMarks[0].assignmentMarks !== undefined && allMarks[0].assignmentMarks !== null,
          hasAttendanceMarks: allMarks[0].attendanceMarks !== undefined && allMarks[0].attendanceMarks !== null,
          marksType: allMarks[0].marksType,
          marksObtained: allMarks[0].marksObtained,
          totalMarks: allMarks[0].totalMarks,
        });
      }
      
      // Get all exams - try multiple strategies to find exams
      let allExams = await examsService.getAll({ academicYear });
      console.log('📋 All exams fetched (by AY):', allExams.length, allExams);
      
      // If no exams found by academic year, try fetching by classId
      if (allExams.length === 0 && student.classId) {
        console.log('🔄 No exams found by academic year, trying by classId:', student.classId);
        allExams = await examsService.getAll({ classId: student.classId });
        console.log('📋 All exams fetched (by classId):', allExams.length, allExams);
      }
      
      // If still no exams, try fetching all exams (no filter)
      if (allExams.length === 0) {
        console.log('🔄 No exams found by classId, trying all exams');
        allExams = await examsService.getAll({});
        console.log('📋 All exams fetched (no filter):', allExams.length, allExams);
      }
      
      // Create a map of examId -> exam for quick lookup
      const examMap = new Map<string, any>();
      allExams.forEach((exam: any) => {
        examMap.set(exam.examId, exam);
      });

      const isUnitTestMark = (mark: any) => {
        const exam = examMap.get(mark.examId);
        const examType = exam?.examType;
        const examName = exam?.examName;
        const isUnitTestLike = (v: any) => {
          const s = String(v || '').toLowerCase().trim();
          if (!s) return false;
          return (
            s.includes('unit test') ||
            s.includes('unittest') ||
            s.includes('periodic test') ||
            s.includes('periodic') ||
            s === 'pt' ||
            s.startsWith('pt') ||
            s.startsWith('ut')
          );
        };
        return isUnitTestLike(mark?.marksType) || isUnitTestLike(examType) || isUnitTestLike(examName);
      };

      const scaleToPT10 = (scoreRaw: any, totalRaw: any) => {
        const score = Number(scoreRaw);
        const total = Number(totalRaw);
        if (!Number.isFinite(score)) return 0;
        if (Number.isFinite(total) && total > 0) {
          return Math.min(10, Math.max(0, (score / total) * 10));
        }
        // Heuristic if total is unknown
        if (score <= 10) return Math.min(10, Math.max(0, score));
        return Math.min(10, Math.max(0, (score / 100) * 10));
      };
      
      // Fetch individual exams for marks that don't have their exam in allExams
      const markExamIds = new Set(allMarks.map((m: any) => m.examId));
      const missingExamIds = Array.from(markExamIds).filter((examId: string) => !examMap.has(examId));
      if (missingExamIds.length > 0) {
        console.warn('⚠️ Some marks reference exams not found in allExams, fetching individually:', missingExamIds);
        for (const examId of missingExamIds) {
          try {
            const exam = await examsService.getById(examId);
            examMap.set(examId, exam);
            allExams.push(exam);
            console.log(`✅ Fetched exam ${examId}:`, exam);
          } catch (error: any) {
            console.error(`❌ Failed to fetch exam ${examId}:`, error);
          }
        }
      }
      
      // Helper function to determine term from exam (with fallback based on exam type or mark type)
      const getExamTerm = (examId: string, mark?: any): string | null => {
        // PRIORITY: If this exam ID is explicitly selected for a term, return that term immediately!
        if (term1MainExamId && examId === term1MainExamId) return 'Term 1';
        if (term2MainExamId && examId === term2MainExamId) return 'Term 2';

        const exam = examMap.get(examId);
        const normalize = (v: any) => String(v || '').toLowerCase().trim();
        const isTerm1Like = (v: any) => {
          const s = normalize(v);
          if (!s) return false;
          return (
            s.includes('mid') ||
            s.includes('half') ||
            s.includes('unit test') ||
            s.includes('unittest') ||
            s.includes('periodic test') ||
            s.includes('periodic') ||
            s.startsWith('pt') ||
            s.startsWith('ut')
          );
        };
        const isTerm2Like = (v: any) => {
          const s = normalize(v);
          if (!s) return false;
          return s.includes('final') || s.includes('annual');
        };
        if (exam) {
          // If term is explicitly set, use it
          if (exam.term === 'Term 1' || exam.term === 'Term 2') {
            return exam.term;
          }
          // Fallback: infer term from exam type
          if (isTerm1Like(exam.examType) || isTerm1Like(exam.examName)) {
            return 'Term 1';
          }
          if (isTerm2Like(exam.examType) || isTerm2Like(exam.examName)) {
            return 'Term 2';
          }
        }
        
        // If exam not found, try to infer from mark's marksType
        if (mark && mark.marksType) {
          if (isTerm1Like(mark.marksType)) {
            return 'Term 1';
          }
          if (isTerm2Like(mark.marksType)) {
            return 'Term 2';
          }
        }
        
        return null;
      };
      
      // Separate exams by term
      const term1Exams = allExams.filter((e: any) => e.term === 'Term 1');
      const term2Exams = allExams.filter((e: any) => e.term === 'Term 2');
      console.log('📅 Term 1 exams:', term1Exams.length, 'Term 2 exams:', term2Exams.length);
      console.log('📋 All exams with terms:', allExams.map((e: any) => ({
        examId: e.examId,
        examName: e.examName,
        examType: e.examType,
        term: e.term
      })));
      
      // If no term-specific exams found, use all exams and split by exam type
      // Or use all marks directly grouped by subject
      const useAllMarks = term1Exams.length === 0 && term2Exams.length === 0;
      console.log('🔄 Using all marks directly:', useAllMarks);
      
      // Get unique subjects from marks
      const subjectMap = new Map<string, any>();
      allMarks.forEach((mark: any) => {
        if (!subjectMap.has(mark.subjectId)) {
          subjectMap.set(mark.subjectId, {
            subjectId: mark.subjectId,
            subjectName: mark.subjectName || mark.subject?.name || 'Unknown',
            subjectCode: mark.subjectCode || mark.subject?.code || '-',
          });
        }
      });
      console.log('📚 Unique subjects found:', subjectMap.size);
      
      // Check if we have any breakdown data at all
      const hasAnyBreakdownData = allMarks.some((m: any) => 
        (m.unitTestMarks !== null && m.unitTestMarks !== undefined && m.unitTestMarks > 0) ||
        (m.assignmentMarks !== null && m.assignmentMarks !== undefined && m.assignmentMarks > 0) ||
        (m.attendanceMarks !== null && m.attendanceMarks !== undefined && m.attendanceMarks > 0) ||
        (m.internalMarks !== null && m.internalMarks !== undefined && m.internalMarks > 0)
      );
      
      console.log('🔍 Has breakdown data:', hasAnyBreakdownData);
      
      // Aggregate marks by subject and term
      const subjects: Template2SubjectData[] = [];
      
      subjectMap.forEach((subject, subjectId) => {
        // Get all marks for this subject
        const subjectMarks = allMarks.filter((m: any) => m.subjectId === subjectId);
        console.log(`📖 Subject ${subject.subjectName}: Total marks=${subjectMarks.length}`);
        console.log(`📖 All marks for ${subject.subjectName}:`, subjectMarks.map((m: any) => ({
          markId: m.markId,
          examId: m.examId,
          examTerm: examMap.get(m.examId)?.term || 'Unknown',
          marksType: m.marksType,
          totalMarks: m.totalMarks,
          marksObtained: m.marksObtained,
          unitTestMarks: m.unitTestMarks,
          assignmentMarks: m.assignmentMarks,
          attendanceMarks: m.attendanceMarks,
          externalMarks: m.externalMarks,
        })));
        
        // ========== TERM 1 AGGREGATION ==========
        // Find marks linked to ANY Term 1 exam
        // If useAllMarks is true, also check exam's term from examMap
        const term1ExamIds = term1Exams.map((e: any) => e.examId);
        const term1SubjectMarks = subjectMarks.filter((m: any) => {
          if (term1ExamIds.includes(m.examId)) return true;
          // Fallback: check exam's term from examMap if available
          const examTerm = getExamTerm(m.examId, m);
          return examTerm === 'Term 1';
        });
        console.log(`  📊 Term 1 marks found: ${term1SubjectMarks.length}`);
        console.log(`  📊 Term 1 marks data:`, term1SubjectMarks.map((m: any) => ({
          markId: m.markId,
          examId: m.examId,
          marksType: m.marksType,
          marksObtained: m.marksObtained,
          unitTestMarks: m.unitTestMarks,
          assignmentMarks: m.assignmentMarks,
          attendanceMarks: m.attendanceMarks,
          externalMarks: m.externalMarks,
        })));
        
        let term1Data = { periodicTest: 0, noteBook: 0, subEnrichment: 0, halfYearly: 0, total: 0, grade: '-' };
        // Calculate PT from unit test averages (Term 1)
        // Find all unit test marks for Term 1
        const term1UnitTestMarks = term1SubjectMarks.filter((m: any) => isUnitTestMark(m));
        
        let term1PT = 0;
        if (term1UnitTestMarks.length > 0) {
          const ptScores = term1UnitTestMarks
            .map((m: any) => {
              const score = m.unitTestMarks ?? m.internalMarks ?? m.marksObtained ?? 0;
              return scaleToPT10(score, m.totalMarks);
            })
            .filter((n: number) => Number.isFinite(n) && n > 0);

          if (ptScores.length > 0) {
            term1PT =
              unitTestMethod === 'highest'
                ? Math.max(...ptScores)
                : ptScores.reduce((sum: number, n: number) => sum + n, 0) / ptScores.length;
          }
        }
        console.log(`  📊 Term 1 Unit Tests: ${term1UnitTestMarks.length} found, Average: ${term1PT.toFixed(2)} (scaled to 10)`);
        
        // Find the combined mark for Term 1 (Mid-Term/Final exam mark with breakdown)
        // Template 2: Look for marks with breakdown fields (unitTestMarks, assignmentMarks, etc.)
        // PRIORITY: If a specific exam is selected for Term 1, use it!
        let term1CombinedMark = term1MainExamId 
          ? term1SubjectMarks.find((m: any) => m.examId === term1MainExamId)
          : null;

        if (!term1CombinedMark) {
          term1CombinedMark = term1SubjectMarks.find((m: any) => 
            m.marksType !== 'Unit Test' && 
            (m.marksType === 'Mid-Term' || m.marksType === 'Final') &&
            (m.unitTestMarks != null || m.assignmentMarks != null || m.attendanceMarks != null) &&
            m.externalMarks != null
          ) || term1SubjectMarks.find((m: any) => 
            m.marksType !== 'Unit Test' && 
            (m.unitTestMarks != null || m.assignmentMarks != null || m.attendanceMarks != null)
          );
        }
        
        if (term1CombinedMark) {
          console.log(`  ✅ Found Term 1 Template 2 combined mark:`, term1CombinedMark.markId);
          console.log(`  📋 Term 1 mark breakdown fields:`, {
            unitTestMarks: term1CombinedMark.unitTestMarks,
            assignmentMarks: term1CombinedMark.assignmentMarks,
            attendanceMarks: term1CombinedMark.attendanceMarks,
            externalMarks: term1CombinedMark.externalMarks,
            internalMarks: term1CombinedMark.internalMarks,
          });
          // Prefer PT from combined mark if available
          if (term1CombinedMark.unitTestMarks != null) {
            const raw = Number(term1CombinedMark.unitTestMarks);
            const ptFromCombined = Number.isFinite(raw)
              ? (raw <= 10 ? Math.min(10, Math.max(0, raw)) : scaleToPT10(raw, 100))
              : 0;
            if (ptFromCombined > 0) {
              term1PT = ptFromCombined;
            }
          }
          // Extract NB, SE, and HY from combined mark
          const nb = term1CombinedMark.assignmentMarks != null ? Number(term1CombinedMark.assignmentMarks) : 0;
          const se = term1CombinedMark.attendanceMarks != null ? Number(term1CombinedMark.attendanceMarks) : 0;
          const hy = term1CombinedMark.externalMarks != null ? Number(term1CombinedMark.externalMarks) : 0;
          
          term1Data.noteBook = Math.min(5, Math.max(0, isNaN(nb) ? 0 : nb));
          term1Data.subEnrichment = Math.min(5, Math.max(0, isNaN(se) ? 0 : se));
          term1Data.halfYearly = Math.min(80, Math.max(0, isNaN(hy) ? 0 : hy));
          console.log(`  ✅ Extracted Term 1: NB=${term1Data.noteBook}, SE=${term1Data.subEnrichment}, HY=${term1Data.halfYearly}`);
        } else {
          console.warn(`  ⚠️ No Term 1 Template 2 combined mark found for ${subject.subjectName}`);
          console.warn(`  📋 Available Term 1 marks:`, term1SubjectMarks.map((m: any) => ({
            markId: m.markId,
            marksType: m.marksType,
            hasBreakdown: !!(m.unitTestMarks != null || m.assignmentMarks != null || m.attendanceMarks != null),
            hasInternalExternal: !!(m.internalMarks != null && m.externalMarks != null),
          })));
        }
        
        // Use calculated PT
        term1Data.periodicTest = term1PT;
        
        term1Data.total = term1Data.periodicTest + term1Data.noteBook + term1Data.subEnrichment + term1Data.halfYearly;
        term1Data.grade = calculateGrade(term1Data.total);
        console.log(`  📊 Term 1 FINAL: PT=${term1Data.periodicTest}, NB=${term1Data.noteBook}, SE=${term1Data.subEnrichment}, HY=${term1Data.halfYearly}, Total=${term1Data.total}`);
        
        // ========== TERM 2 AGGREGATION ==========
        // Find marks linked to ANY Term 2 exam
        // If useAllMarks is true, also check exam's term from examMap
        const term2ExamIds = term2Exams.map((e: any) => e.examId);
        const term2SubjectMarks = subjectMarks.filter((m: any) => {
          if (term2ExamIds.includes(m.examId)) return true;
          // Fallback: check exam's term from examMap if available
          const examTerm = getExamTerm(m.examId, m);
          return examTerm === 'Term 2';
        });
        console.log(`  📊 Term 2 marks found: ${term2SubjectMarks.length}`);
        console.log(`  📊 Term 2 marks data:`, term2SubjectMarks.map((m: any) => ({
          markId: m.markId,
          examId: m.examId,
          marksType: m.marksType,
          marksObtained: m.marksObtained,
          unitTestMarks: m.unitTestMarks,
          assignmentMarks: m.assignmentMarks,
          attendanceMarks: m.attendanceMarks,
          externalMarks: m.externalMarks,
        })));
        
        let term2Data = { periodicTest: 0, noteBook: 0, subEnrichment: 0, annual: 0, total: 0, grade: '-' };
        // Calculate PT from unit test averages (Term 2)
        // Find all unit test marks for Term 2
        const term2UnitTestMarks = term2SubjectMarks.filter((m: any) => isUnitTestMark(m));
        
        let term2PT = 0;
        if (term2UnitTestMarks.length > 0) {
          const ptScores = term2UnitTestMarks
            .map((m: any) => {
              const score = m.unitTestMarks ?? m.internalMarks ?? m.marksObtained ?? 0;
              return scaleToPT10(score, m.totalMarks);
            })
            .filter((n: number) => Number.isFinite(n) && n > 0);

          if (ptScores.length > 0) {
            term2PT =
              unitTestMethod === 'highest'
                ? Math.max(...ptScores)
                : ptScores.reduce((sum: number, n: number) => sum + n, 0) / ptScores.length;
          }
        }
        console.log(`  📊 Term 2 Unit Tests: ${term2UnitTestMarks.length} found, Average: ${term2PT.toFixed(2)} (scaled to 10)`);
        
        // Find the combined mark for Term 2 (Final/Annual exam mark with breakdown)
        // Template 2: Look for marks with breakdown fields (unitTestMarks, assignmentMarks, etc.)
        // PRIORITY: If a specific exam is selected for Term 2, use it!
        let term2CombinedMark = term2MainExamId 
          ? term2SubjectMarks.find((m: any) => m.examId === term2MainExamId)
          : null;

        if (!term2CombinedMark) {
          term2CombinedMark = term2SubjectMarks.find((m: any) => 
            m.marksType !== 'Unit Test' && 
            (m.marksType === 'Final' || m.marksType === 'Annual') &&
            (m.unitTestMarks != null || m.assignmentMarks != null || m.attendanceMarks != null) &&
            m.externalMarks != null
          ) || term2SubjectMarks.find((m: any) => 
            m.marksType !== 'Unit Test' && 
            (m.unitTestMarks != null || m.assignmentMarks != null || m.attendanceMarks != null)
          );
        }
        
        if (term2CombinedMark) {
          console.log(`  ✅ Found Term 2 Template 2 combined mark:`, term2CombinedMark.markId);
          console.log(`  📋 Term 2 mark breakdown fields:`, {
            unitTestMarks: term2CombinedMark.unitTestMarks,
            assignmentMarks: term2CombinedMark.assignmentMarks,
            attendanceMarks: term2CombinedMark.attendanceMarks,
            externalMarks: term2CombinedMark.externalMarks,
            internalMarks: term2CombinedMark.internalMarks,
          });
          // Prefer PT from combined mark if available
          if (term2CombinedMark.unitTestMarks != null) {
            const raw = Number(term2CombinedMark.unitTestMarks);
            const ptFromCombined = Number.isFinite(raw)
              ? (raw <= 10 ? Math.min(10, Math.max(0, raw)) : scaleToPT10(raw, 100))
              : 0;
            if (ptFromCombined > 0) {
              term2PT = ptFromCombined;
            }
          }
          // Extract NB, SE, and Annual from combined mark
          const nb = term2CombinedMark.assignmentMarks != null ? Number(term2CombinedMark.assignmentMarks) : 0;
          const se = term2CombinedMark.attendanceMarks != null ? Number(term2CombinedMark.attendanceMarks) : 0;
          const annual = term2CombinedMark.externalMarks != null ? Number(term2CombinedMark.externalMarks) : 0;
          
          term2Data.noteBook = Math.min(5, Math.max(0, isNaN(nb) ? 0 : nb));
          term2Data.subEnrichment = Math.min(5, Math.max(0, isNaN(se) ? 0 : se));
          term2Data.annual = Math.min(80, Math.max(0, isNaN(annual) ? 0 : annual));
          console.log(`  ✅ Extracted Term 2: NB=${term2Data.noteBook}, SE=${term2Data.subEnrichment}, Annual=${term2Data.annual}`);
        } else {
          console.warn(`  ⚠️ No Term 2 Template 2 combined mark found for ${subject.subjectName}`);
          console.warn(`  📋 Available Term 2 marks:`, term2SubjectMarks.map((m: any) => ({
            markId: m.markId,
            marksType: m.marksType,
            hasBreakdown: !!(m.unitTestMarks != null || m.assignmentMarks != null || m.attendanceMarks != null),
            hasInternalExternal: !!(m.internalMarks != null && m.externalMarks != null),
          })));
        }
        
        // Use calculated PT
        term2Data.periodicTest = term2PT;
        
        term2Data.total = term2Data.periodicTest + term2Data.noteBook + term2Data.subEnrichment + term2Data.annual;
        term2Data.grade = calculateGrade(term2Data.total);
        console.log(`  📊 Term 2 FINAL: PT=${term2Data.periodicTest}, NB=${term2Data.noteBook}, SE=${term2Data.subEnrichment}, Annual=${term2Data.annual}, Total=${term2Data.total}`);
        
        const grandTotal = term1Data.total + term2Data.total;
        const finalGrade = calculateGrade(grandTotal > 0 ? grandTotal / 2 : 0); // Average of both terms
        
        console.log(`  ➡️ Term1 total: ${term1Data.total}, Term2 total: ${term2Data.total}, Grand: ${grandTotal}`);
        
        subjects.push({
          subjectId,
          subjectName: subject.subjectName,
          subjectCode: subject.subjectCode,
          term1: term1Data,
          term2: term2Data,
          grandTotal,
          finalGrade,
        });
      });
      
      // Apply manual overrides (if any)
      const subjectsWithOverrides = subjects.map(s => {
        const o = manualOverrides[s.subjectId];
        if (!o) return s;
        
        const term1 = {
          periodicTest: o.term1?.periodicTest ?? s.term1.periodicTest,
          noteBook: o.term1?.noteBook ?? s.term1.noteBook,
          subEnrichment: o.term1?.subEnrichment ?? s.term1.subEnrichment,
          halfYearly: o.term1?.halfYearly ?? s.term1.halfYearly,
        };
        const term1Total = term1.periodicTest + term1.noteBook + term1.subEnrichment + term1.halfYearly;
        
        const term2 = {
          periodicTest: o.term2?.periodicTest ?? s.term2.periodicTest,
          noteBook: o.term2?.noteBook ?? s.term2.noteBook,
          subEnrichment: o.term2?.subEnrichment ?? s.term2.subEnrichment,
          annual: o.term2?.annual ?? s.term2.annual,
        };
        const term2Total = term2.periodicTest + term2.noteBook + term2.subEnrichment + term2.annual;
        
        const grandTotal = term1Total + term2Total;
        // Use average for final grade as per the previous calculation
        const finalGrade = calculateGrade(grandTotal / 2);
        
        return {
          ...s,
          term1: { ...term1, total: term1Total },
          term2: { ...term2, total: term2Total },
          grandTotal,
          finalGrade,
        };
      });

      // Calculate totals
      const term1Total = subjectsWithOverrides.reduce((sum, s) => sum + s.term1.total, 0);
      const term2Total = subjectsWithOverrides.reduce((sum, s) => sum + s.term2.total, 0);
      const grandTotal = term1Total + term2Total;
      const numSubjects = subjectsWithOverrides.length || 1;
      // Max marks per subject per term = 100 (10+5+5+80), Total per term = numSubjects * 100
      const maxMarksPerTerm = numSubjects * 100;
      const maxTotalMarks = maxMarksPerTerm * 2; // Both terms combined
      
      // Calculate percentage properly
      const term1Percentage = maxMarksPerTerm > 0 ? (term1Total / maxMarksPerTerm) * 100 : 0;
      const term2Percentage = maxMarksPerTerm > 0 ? (term2Total / maxMarksPerTerm) * 100 : 0;
      const overallPercentage = maxTotalMarks > 0 ? (grandTotal / maxTotalMarks) * 100 : 0;
      
      console.log(`📈 Percentage calc: Term1=${term1Total}/${maxMarksPerTerm}=${term1Percentage.toFixed(1)}%, Term2=${term2Total}/${maxMarksPerTerm}=${term2Percentage.toFixed(1)}%, Overall=${grandTotal}/${maxTotalMarks}=${overallPercentage.toFixed(1)}%`);
      
      console.log('📊 Totals - Term1:', term1Total, 'Term2:', term2Total, 'Grand:', grandTotal);
      
      // Get class name from class ID
      let className = (student as any).className || '';
      let sectionName = (student as any).sectionName || '';
      if (student.classId && !className) {
        try {
          const classData = await classesService.getById(student.classId);
          className = classData?.name || student.classId;
        } catch (e) {
          console.warn('Could not fetch class name:', e);
          className = student.classId;
        }
      }
      
      // Co-Scholastic Areas
      const defaultCoScholastic = [
        { area: 'Art Education', term1Grade: 'A', term2Grade: 'A' },
        { area: 'Health & Physical Education', term1Grade: 'A', term2Grade: 'A' },
        { area: 'Work Education', term1Grade: 'A', term2Grade: 'A' },
        { area: 'Discipline', term1Grade: 'A', term2Grade: 'A' },
      ];

      const coScholasticOverrides = manualOverrides.coScholastic || {};
      const coScholasticAreas: CoScholasticArea[] = defaultCoScholastic.map(area => ({
        ...area,
        term1Grade: coScholasticOverrides[area.area]?.term1Grade ?? area.term1Grade,
        term2Grade: coScholasticOverrides[area.area]?.term2Grade ?? area.term2Grade,
      }));
      
      const template2: Template2Data = {
        student: {
          studentId: student.studentId,
          name: student.name,
          rollNo: student.rollNo || 0,
          classId: student.classId || '',
          className: className,
          sectionId: student.sectionId || '',
          sectionName: sectionName,
          dateOfBirth: student.dateOfBirth,
          gender: student.gender,
          parentName: student.parentName,
          fatherName: student.fatherName || student.parentName || '-',
          motherName: student.motherName || student.parentName || '-',
          address: student.address,
        },
        academicYear,
        subjects,
        coScholasticAreas,
        term1Total,
        term2Total,
        grandTotal,
        term1Percentage,
        term2Percentage,
        overallPercentage,
        overallGrade: calculateGrade(overallPercentage),
        result: overallPercentage >= 33 || grandTotal > 0 ? 'PASS' : 'FAIL',
        remarks: overallPercentage >= 75 ? 'Excellent Performance' : overallPercentage >= 60 ? 'Good Performance' : overallPercentage >= 33 ? 'Satisfactory' : grandTotal > 0 ? 'Needs Improvement' : 'No Data Available',
        schoolName: schoolSettings.schoolName,
        schoolAddress: schoolSettings.schoolAddress,
        generatedAt: new Date().toISOString(),
      };
      
      console.log('✅ Template 2 data ready:', template2);
      
      setTemplate2Data(template2);
      return template2;
    } catch (error: any) {
      console.error('Error fetching Template 2 data:', error);
      toast.error(error.message || 'Failed to load Template 2 data');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Function to fetch and aggregate Template 3 data (Two pages: Descriptive marks + Signatures)
  const fetchTemplate3Data = async (studentId: string, academicYear: string) => {
    try {
      setLoading(true);

      // Fetch DB overrides first
      const overrideRecord = await reportCardOverridesService.getOverride(studentId, academicYear, 'template3');
      setDbOverride(overrideRecord);
      const manualOverrides = overrideRecord?.overrides || {};
      
      console.log('📊 Fetching Template 3 data for student:', studentId, 'AY:', academicYear);
      
      // Fetch school settings
      const schoolSettings = await fetchSchoolSettings();
      console.log('🏫 School settings fetched:', schoolSettings);
      
      // Get student details first (needed for classId)
      const student = await studentsService.getById(studentId);
      console.log('👤 Student details:', student);
      
      // Get class details to extract standard number
      let std = '';
      let classSection = '';
      if (student.classId) {
        try {
          const classData = await classesService.getById(student.classId);
          std = classData?.name?.replace(/[^0-9]/g, '') || classData?.name || '';
          classSection = `${classData?.name || ''}${student.sectionName ? `-${student.sectionName}` : ''}`;
        } catch (e) {
          console.warn('Could not fetch class name:', e);
          std = student.classId;
          classSection = student.classId;
        }
      }
      
      // Get all marks for the student
      const allMarks = await marksService.getAll({ studentId });
      console.log('📝 All marks for student:', allMarks.length);
      
      // Enhanced logging to see what fields we actually have
      if (allMarks.length > 0) {
        console.log('📋 Template 3 - Sample mark structure:', {
          markId: allMarks[0].markId,
          hasInternalMarks: allMarks[0].internalMarks !== undefined && allMarks[0].internalMarks !== null,
          hasExternalMarks: allMarks[0].externalMarks !== undefined && allMarks[0].externalMarks !== null,
          hasUnitTestMarks: allMarks[0].unitTestMarks !== undefined && allMarks[0].unitTestMarks !== null,
          hasAssignmentMarks: allMarks[0].assignmentMarks !== undefined && allMarks[0].assignmentMarks !== null,
          hasAttendanceMarks: allMarks[0].attendanceMarks !== undefined && allMarks[0].attendanceMarks !== null,
          marksType: allMarks[0].marksType,
          marksObtained: allMarks[0].marksObtained,
          totalMarks: allMarks[0].totalMarks,
        });
      }
      
      // Get all exams - try multiple strategies to find exams
      let allExams = await examsService.getAll({ academicYear });
      console.log('📋 All exams fetched (by AY):', allExams.length);
      
      // If no exams found by academic year, try fetching by classId
      if (allExams.length === 0 && student.classId) {
        console.log('🔄 No exams found by academic year, trying by classId:', student.classId);
        allExams = await examsService.getAll({ classId: student.classId });
        console.log('📋 All exams fetched (by classId):', allExams.length);
      }
      
      // If still no exams, try fetching all exams (no filter)
      if (allExams.length === 0) {
        console.log('🔄 No exams found by classId, trying all exams');
        allExams = await examsService.getAll({});
        console.log('📋 All exams fetched (no filter):', allExams.length);
      }
      
      // Create a map of examId -> exam for quick lookup
      const examMap = new Map<string, any>();
      allExams.forEach((exam: any) => {
        examMap.set(exam.examId, exam);
      });

      const isUnitTestMark = (mark: any) => {
        const examType = examMap.get(mark.examId)?.examType;
        return mark?.marksType === 'Unit Test' || examType === 'Unit Test';
      };
      
      // Fetch individual exams for marks that don't have their exam in allExams
      const markExamIds = new Set(allMarks.map((m: any) => m.examId));
      const missingExamIds = Array.from(markExamIds).filter((examId: string) => !examMap.has(examId));
      if (missingExamIds.length > 0) {
        console.warn('⚠️ Template 3 - Some marks reference exams not found in allExams, fetching individually:', missingExamIds);
        for (const examId of missingExamIds) {
          try {
            const exam = await examsService.getById(examId);
            examMap.set(examId, exam);
            allExams.push(exam);
            console.log(`✅ Template 3 - Fetched exam ${examId}:`, exam);
          } catch (error: any) {
            console.error(`❌ Template 3 - Failed to fetch exam ${examId}:`, error);
          }
        }
      }
      
      // Helper function to determine term from exam (with fallback based on exam type or mark type)
      const getExamTerm = (examId: string, mark?: any): string | null => {
        // PRIORITY: If this exam ID is explicitly selected for a term, return that term immediately!
        if (term1MainExamId && examId === term1MainExamId) return 'Term 1';
        if (term2MainExamId && examId === term2MainExamId) return 'Term 2';

        const exam = examMap.get(examId);
        if (exam) {
          // If term is explicitly set, use it
          if (exam.term === 'Term 1' || exam.term === 'Term 2') {
            return exam.term;
          }
          // Fallback: infer term from exam type
          if (exam.examType === 'Mid-Term' || exam.examType === 'Unit Test' || exam.examType === 'Half-Yearly') {
            return 'Term 1';
          }
          if (exam.examType === 'Final' || exam.examType === 'Annual') {
            return 'Term 2';
          }
        }
        
        // If exam not found, try to infer from mark's marksType
        if (mark && mark.marksType) {
          if (mark.marksType === 'Mid-Term' || mark.marksType === 'Unit Test' || mark.marksType === 'Half-Yearly') {
            return 'Term 1';
          }
          if (mark.marksType === 'Final' || mark.marksType === 'Annual') {
            return 'Term 2';
          }
        }
        
        return null;
      };
      
      // Separate exams by term
      const term1Exams = allExams.filter((e: any) => e.term === 'Term 1');
      const term2Exams = allExams.filter((e: any) => e.term === 'Term 2');
      console.log('📅 Template 3 - Term 1 exams:', term1Exams.length, 'Term 2 exams:', term2Exams.length);
      console.log('📋 Template 3 - All exams with terms:', allExams.map((e: any) => ({
        examId: e.examId,
        examName: e.examName,
        examType: e.examType,
        term: e.term
      })));
      
      // Get unique subjects from marks
      const subjectMap = new Map<string, any>();
      allMarks.forEach((mark: any) => {
        if (!subjectMap.has(mark.subjectId)) {
          subjectMap.set(mark.subjectId, {
            subjectId: mark.subjectId,
            subjectName: mark.subjectName || mark.subject?.name || 'Unknown',
            subjectCode: mark.subjectCode || mark.subject?.code || '-',
          });
        }
      });
      console.log('📚 Unique subjects found:', subjectMap.size);
      
      // Aggregate marks by subject and term for Template 3
      const subjects: Template3SubjectData[] = [];
      
      subjectMap.forEach((subject, subjectId) => {
        // Get all marks for this subject
        const subjectMarks = allMarks.filter((m: any) => m.subjectId === subjectId);
        
        // ========== TERM 1 (1st Term) ==========
        const term1ExamIds = term1Exams.map((e: any) => e.examId);
        const term1SubjectMarks = subjectMarks.filter((m: any) => {
          if (term1ExamIds.includes(m.examId)) return true;
          // Fallback: check exam's term from examMap if available
          const examTerm = getExamTerm(m.examId, m);
          return examTerm === 'Term 1';
        });
        
        console.log(`  📊 Template 3 - Term 1 marks for ${subject.subjectName}:`, term1SubjectMarks.map((m: any) => ({
          markId: m.markId,
          examId: m.examId,
          marksType: m.marksType,
          internalMarks: m.internalMarks,
          externalMarks: m.externalMarks,
          marksObtained: m.marksObtained,
        })));
        
        let term1Assessment = 0; // Internal marks (20) - Assessment
        let term1Written = 0; // External marks (80) - Written
        
        // Helper function to detect template type
        function detectTemplate(mark: any): 'template1' | 'template2' | 'template3' {
          if (!mark) return 'template1';
          
          console.log(`    🔍 detectTemplate for mark ${mark.markId}:`, {
            internalMarks: mark.internalMarks,
            externalMarks: mark.externalMarks,
            unitTestMarks: mark.unitTestMarks,
            assignmentMarks: mark.assignmentMarks,
            attendanceMarks: mark.attendanceMarks,
            marksObtained: mark.marksObtained
          });
          
          // Template 3: Has internal and external marks, but no breakdown
          const hasInternalExternal = mark.internalMarks != null && mark.externalMarks != null;
          const hasBreakdown =
            Number(mark.unitTestMarks || 0) > 0 ||
            Number(mark.assignmentMarks || 0) > 0 ||
            Number(mark.attendanceMarks || 0) > 0;
          
          console.log(`    -> hasInternalExternal: ${hasInternalExternal}, hasBreakdown: ${hasBreakdown}`);
          
          if (hasInternalExternal && !hasBreakdown) {
            console.log(`    -> Detected as Template 3`);
            return 'template3';
          }
          
          // Template 2: Has breakdown fields
          if (hasBreakdown) {
            console.log(`    -> Detected as Template 2`);
            return 'template2';
          }
          
          // Template 1: Simple marks
          console.log(`    -> Detected as Template 1`);
          return 'template1';
        }
        
        // Determine which template was used for Term 1 and extract marks accordingly
        console.log(`  🔍 Analyzing Term 1 marks for ${subject.subjectName}:`, {
          totalMarks: term1SubjectMarks.length,
          allMarks: term1SubjectMarks.map(m => ({
            markId: m.markId,
            examId: m.examId,
            marksType: m.marksType,
            internalMarks: m.internalMarks,
            externalMarks: m.externalMarks,
            unitTestMarks: m.unitTestMarks,
            assignmentMarks: m.assignmentMarks,
            attendanceMarks: m.attendanceMarks,
            marksObtained: m.marksObtained,
            template: detectTemplate(m)
          }))
        });
        
        // Find the main exam mark (non-unit test) for Term 1
        // PRIORITY: If a specific exam is selected for Term 1, use it!
        let term1MainMark = term1MainExamId 
          ? term1SubjectMarks.find((m: any) => m.examId === term1MainExamId)
          : null;

        if (!term1MainMark) {
          term1MainMark =
            term1SubjectMarks.find((m: any) => {
              if (isUnitTestMark(m)) return false;
              const examType = examMap.get(m.examId)?.examType;
              return (
                examType === 'Half-Yearly' ||
                examType === 'Mid-Term' ||
                m.marksType === 'Half-Yearly' ||
                m.marksType === 'Mid-Term'
              );
            }) ||
            term1SubjectMarks.find((m: any) => {
              if (isUnitTestMark(m)) return false;
              const examType = examMap.get(m.examId)?.examType;
              // Never allow Annual/Final marks to be used for Term 1
              if (examType === 'Annual' || examType === 'Final') return false;
              if (m.marksType === 'Annual' || m.marksType === 'Final') return false;
              return true;
            });
        }
        
        // Detect template and extract marks based on template type
        let term1Template = 'template1';
        
        if (term1MainMark) {
          term1Template = detectTemplate(term1MainMark);
          
          if (term1Template === 'template3') {
            // Template 3: Assessment (internalMarks) + Written (externalMarks)
            term1Assessment = term1MainMark.internalMarks != null ? Math.min(20, Math.max(0, Number(term1MainMark.internalMarks))) : 0;
            term1Written = term1MainMark.externalMarks != null ? Math.min(80, Math.max(0, Number(term1MainMark.externalMarks))) : 0;
            console.log(`  ✅ Term 1 Template 3 - Assessment: ${term1Assessment} (from ${term1MainMark.internalMarks}), Written: ${term1Written} (from ${term1MainMark.externalMarks})`);
          } else if (term1Template === 'template2') {
            // Template 2: PT (unitTest) + NB (assignment) + SE (attendance) + External
            const pt = term1MainMark.unitTestMarks != null ? Math.min(10, Math.max(0, Number(term1MainMark.unitTestMarks))) : 0;
            const nb = term1MainMark.assignmentMarks != null ? Math.min(5, Math.max(0, Number(term1MainMark.assignmentMarks))) : 0;
            const se = term1MainMark.attendanceMarks != null ? Math.min(5, Math.max(0, Number(term1MainMark.attendanceMarks))) : 0;
            term1Assessment = pt + nb + se; // Total internal = 20
            term1Written = term1MainMark.externalMarks != null ? Math.min(80, Math.max(0, Number(term1MainMark.externalMarks))) : 0;
            console.log(`  ✅ Term 1 Template 2 - PT: ${pt}, NB: ${nb}, SE: ${se} -> Assessment: ${term1Assessment}, Written: ${term1Written}`);
          } else {
            // Template 1: Simple marks - need to split into assessment and written
            const total = term1MainMark.marksObtained != null ? Number(term1MainMark.marksObtained) : 0;
            // For Template 1, assume 20% is assessment (max 20) and 80% is written (max 80)
            term1Assessment = Math.min(20, Math.max(0, total * 0.2));
            term1Written = Math.min(80, Math.max(0, total * 0.8));
            console.log(`  ✅ Term 1 Template 1 - Total: ${total} -> Assessment: ${term1Assessment}, Written: ${term1Written}`);
          }
        } else {
          console.warn(`  ⚠️ No main mark found for Term 1 for subject ${subject.subjectName}`);
        }
        
        // Find unit test marks for Term 1 (only for Template 2 where PT is calculated from unit tests)
        // Note: For Template 3, assessment is directly entered, not calculated from unit tests
        
        const term1Total = term1Assessment + term1Written;
        const term1Percentage = term1Total > 0 ? (term1Total / 100) * 100 : 0;
        // ========== TERM 2 (Final Term) ==========
        const term2ExamIds = term2Exams.map((e: any) => e.examId);
        const term2SubjectMarks = subjectMarks.filter((m: any) => {
          if (term2ExamIds.includes(m.examId)) return true;
          // Fallback: check exam's term from examMap if available
          const examTerm = getExamTerm(m.examId, m);
          return examTerm === 'Term 2';
        });
        
        console.log(`  📊 Template 3 - Term 2 marks for ${subject.subjectName}:`, term2SubjectMarks.map((m: any) => ({
          markId: m.markId,
          examId: m.examId,
          marksType: m.marksType,
          internalMarks: m.internalMarks,
          externalMarks: m.externalMarks,
          marksObtained: m.marksObtained,
        })));
        
        let term2Assessment = 0; // Internal marks (20) - Assessment
        let term2Written = 0; // External marks (80) - Written
        
        // Determine which template was used for Term 2 and extract marks accordingly
        console.log(`  🔍 Analyzing Term 2 marks for ${subject.subjectName}:`, {
          totalMarks: term2SubjectMarks.length,
          allMarks: term2SubjectMarks.map(m => ({
            markId: m.markId,
            examId: m.examId,
            marksType: m.marksType,
            internalMarks: m.internalMarks,
            externalMarks: m.externalMarks,
            unitTestMarks: m.unitTestMarks,
            assignmentMarks: m.assignmentMarks,
            attendanceMarks: m.attendanceMarks,
            marksObtained: m.marksObtained,
            template: detectTemplate(m)
          }))
        });
        
        // Find the main exam mark (non-unit test) for Term 2
        // PRIORITY: If a specific exam is selected for Term 2, use it!
        let term2MainMark = term2MainExamId 
          ? term2SubjectMarks.find((m: any) => m.examId === term2MainExamId)
          : null;

        if (!term2MainMark) {
          term2MainMark =
            term2SubjectMarks.find((m: any) => {
              if (isUnitTestMark(m)) return false;
              const examType = examMap.get(m.examId)?.examType;
              return (
                examType === 'Annual' ||
                examType === 'Final' ||
                m.marksType === 'Annual' ||
                m.marksType === 'Final'
              );
            }) ||
            term2SubjectMarks.find((m: any) => {
              if (isUnitTestMark(m)) return false;
              const examType = examMap.get(m.examId)?.examType;
              // Never allow Half-Yearly/Mid-Term marks to be used for Term 2
              if (examType === 'Half-Yearly' || examType === 'Mid-Term') return false;
              if (m.marksType === 'Half-Yearly' || m.marksType === 'Mid-Term') return false;
              return true;
            });
        }
        
        // Detect template and extract marks based on template type
        let term2Template = 'template1';
        
        if (term2MainMark) {
          term2Template = detectTemplate(term2MainMark);
          
          if (term2Template === 'template3') {
            // Template 3: Assessment (internalMarks) + Written (externalMarks)
            term2Assessment = term2MainMark.internalMarks != null ? Math.min(20, Math.max(0, Number(term2MainMark.internalMarks))) : 0;
            term2Written = term2MainMark.externalMarks != null ? Math.min(80, Math.max(0, Number(term2MainMark.externalMarks))) : 0;
            console.log(`  ✅ Term 2 Template 3 - Assessment: ${term2Assessment} (from ${term2MainMark.internalMarks}), Written: ${term2Written} (from ${term2MainMark.externalMarks})`);
          } else if (term2Template === 'template2') {
            // Template 2: PT (unitTest) + NB (assignment) + SE (attendance) + External
            const pt = term2MainMark.unitTestMarks != null ? Math.min(10, Math.max(0, Number(term2MainMark.unitTestMarks))) : 0;
            const nb = term2MainMark.assignmentMarks != null ? Math.min(5, Math.max(0, Number(term2MainMark.assignmentMarks))) : 0;
            const se = term2MainMark.attendanceMarks != null ? Math.min(5, Math.max(0, Number(term2MainMark.attendanceMarks))) : 0;
            term2Assessment = pt + nb + se; // Total internal = 20
            term2Written = term2MainMark.externalMarks != null ? Math.min(80, Math.max(0, Number(term2MainMark.externalMarks))) : 0;
            console.log(`  ✅ Term 2 Template 2 - PT: ${pt}, NB: ${nb}, SE: ${se} -> Assessment: ${term2Assessment}, Written: ${term2Written}`);
          } else {
            // Template 1: Simple marks - need to split into assessment and written
            const total = term2MainMark.marksObtained != null ? Number(term2MainMark.marksObtained) : 0;
            // For Template 1, assume 20% is assessment (max 20) and 80% is written (max 80)
            term2Assessment = Math.min(20, Math.max(0, total * 0.2));
            term2Written = Math.min(80, Math.max(0, total * 0.8));
            console.log(`  ✅ Term 2 Template 1 - Total: ${total} -> Assessment: ${term2Assessment}, Written: ${term2Written}`);
          }
        } else {
          console.warn(`  ⚠️ No main mark found for Term 2 for subject ${subject.subjectName}`);
        }
        const term2Total = term2Assessment + term2Written;
        const term2Percentage = term2Total > 0 ? (term2Total / 100) * 100 : 0;
        
        // Final Aggregate
        const finalAggregateTotal = term1Total + term2Total;
        const finalAggregatePercentage = finalAggregateTotal > 0 ? (finalAggregateTotal / 200) * 100 : 0;
        const finalGrade = calculateGrade(finalAggregatePercentage);
        
        subjects.push({
          subjectId,
          subjectName: subject.subjectName,
          subjectCode: subject.subjectCode,
          term1Assessment,
          term1Written,
          term1Total,
          term1Percentage,
          term2Assessment,
          term2Written,
          term2Total,
          term2Percentage,
          finalAggregateTotal,
          finalAggregatePercentage,
          finalGrade,
        });
      });
      
      // Apply manual overrides from DB
      let subjectsWithOverrides = subjects;
      if (manualOverrides && typeof manualOverrides === 'object') {
        subjectsWithOverrides = subjects.map((s) => {
          const o = manualOverrides[s.subjectId];
          if (!o) return s;
          return {
            ...s,
            term1Assessment: o.term1Assessment ?? s.term1Assessment,
            term1Written: o.term1Written ?? s.term1Written,
            term2Assessment: o.term2Assessment ?? s.term2Assessment,
            term2Written: o.term2Written ?? s.term2Written,
          };
        });
      }

      // Calculate overall totals (after overrides)
      const term1TotalMarks = subjectsWithOverrides.reduce((sum, s) => sum + (s.term1Assessment + s.term1Written), 0);
      const term2TotalMarks = subjectsWithOverrides.reduce((sum, s) => sum + (s.term2Assessment + s.term2Written), 0);
      const finalAggregateTotal = term1TotalMarks + term2TotalMarks;
      const numSubjects = subjectsWithOverrides.length || 1;
      const maxMarksPerTerm = numSubjects * 100;
      const maxTotalMarks = maxMarksPerTerm * 2;
      
      const term1TotalPercentage = maxMarksPerTerm > 0 ? (term1TotalMarks / maxMarksPerTerm) * 100 : 0;
      const term2TotalPercentage = maxMarksPerTerm > 0 ? (term2TotalMarks / maxMarksPerTerm) * 100 : 0;
      const finalAggregatePercentage = maxTotalMarks > 0 ? (finalAggregateTotal / maxTotalMarks) * 100 : 0;
      
      // Fetch student habits
      let habits: Template3Habit[] = [];
      try {
        const habitsData = await studentHabitsService.getByStudentAndYear(studentId, academicYear);
        const habitNames = ['Courteous', 'Art/Craft', 'Responsibility', 'Systematic', 'Sports', 'Elocution', 'Gen.Knowledge', 'Cultural Activities', 'Cleanliness', 'Hindi Oral', 'English Oral'];
        
        habitNames.forEach(habitName => {
          const habit = habitsData.find((h: any) => h.habitName === habitName);
          habits.push({
            habitId: habit?.habitId,
            habitName,
            term1Grade: (habit?.term1Grade as any) || '',
            term2Grade: (habit?.term2Grade as any) || '',
          });
        });
      } catch (error: any) {
        console.warn('Could not fetch student habits:', error);
        // Use default empty habits
        habits = [
          { habitName: 'Courteous', term1Grade: '', term2Grade: '' },
          { habitName: 'Art/Craft', term1Grade: '', term2Grade: '' },
          { habitName: 'Responsibility', term1Grade: '', term2Grade: '' },
          { habitName: 'Systematic', term1Grade: '', term2Grade: '' },
          { habitName: 'Sports', term1Grade: '', term2Grade: '' },
          { habitName: 'Elocution', term1Grade: '', term2Grade: '' },
          { habitName: 'Gen.Knowledge', term1Grade: '', term2Grade: '' },
          { habitName: 'Cultural Activities', term1Grade: '', term2Grade: '' },
          { habitName: 'Cleanliness', term1Grade: '', term2Grade: '' },
          { habitName: 'Hindi Oral', term1Grade: '', term2Grade: '' },
          { habitName: 'English Oral', term1Grade: '', term2Grade: '' },
        ];
      }
      
      // Check if English is passed (for promotion calculation)
      const englishSubject = subjects.find((s: any) => 
        s.subjectName.toLowerCase().includes('english')
      );
      const englishPassed = englishSubject ? englishSubject.finalAggregatePercentage >= 33 : true;
      
      // Calculate attendance (placeholder - would need actual attendance data)
      const term1Attendance = { present: 102, total: 109, percentage: 93.6 };
      const term2Attendance = { present: 75, total: 102, percentage: 73.5 };
      const overallAttendance = {
        present: term1Attendance.present + term2Attendance.present,
        total: term1Attendance.total + term2Attendance.total,
        percentage: ((term1Attendance.present + term2Attendance.present) / (term1Attendance.total + term2Attendance.total)) * 100,
      };
      
      // Calculate promotion status
      const promotion = calculatePromotion({
        overallPercentage: finalAggregatePercentage,
        englishPassed,
        attendancePercentage: overallAttendance.percentage,
        minimumAttendanceRequired: 75,
        minimumPercentageRequired: 33,
      });
      
      const template3: Template3Data = {
        student: {
          studentId: student.studentId,
          name: student.name,
          std: std,
          classSection: classSection,
          rollNo: student.rollNo || 0,
          dateOfBirth: student.dateOfBirth,
          gender: student.gender,
          motherName: student.motherName || student.parentName || '-',
          fatherName: student.fatherName || student.parentName || '-',
          address: student.address,
        },
        academicYear,
        subjects: subjectsWithOverrides,
        habits,
        term1TotalMarks,
        term2TotalMarks,
        term1TotalPercentage,
        term2TotalPercentage,
        finalAggregateTotal,
        finalAggregatePercentage,
        term1Attendance,
        term2Attendance,
        overallAttendance,
        term1Remarks: term1TotalPercentage >= 50 ? 'Good Performance' : 'Needs Improvement',
        term2Remarks: term2TotalPercentage >= 50 ? 'Good Performance' : 'Needs Improvement',
        promotion,
        schoolName: schoolSettings.schoolName,
        schoolAddress: schoolSettings.schoolAddress,
        generatedAt: new Date().toISOString(),
      };

      // Ensure derived fields align with overrides
      const template3Final = recomputeTemplate3Data(template3, subjectsWithOverrides);
      
      console.log('✅ Template 3 data ready:', template3Final);
      
      setTemplate3Data(template3Final);
      // Initialize promotion date with current date
      setEditablePromotionDate(new Date().toLocaleDateString());
      return template3Final;
    } catch (error: any) {
      console.error('Error fetching Template 3 data:', error);
      toast.error(error.message || 'Failed to load Template 3 data');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const handleT2MarkChange = (subjectId: string, term: 'term1' | 'term2', field: string, value: string) => {
    if (!template2Data) return;
    const numValue = parseFloat(value) || 0;
    const nextSubjects = template2Data.subjects.map(s => {
      if (s.subjectId !== subjectId) return s;
      
      const newTermData = { ...s[term], [field]: numValue } as any;
      // Re-calculate total for that term
      const total = (newTermData.periodicTest || 0) + 
                    (newTermData.noteBook || 0) + 
                    (newTermData.subEnrichment || 0) + 
                    (newTermData.halfYearly || newTermData.annual || 0);
      
      const updatedS = { ...s, [term]: { ...newTermData, total } };
      
      // Re-calculate grand total and grade
      const grandTotal = updatedS.term1.total + updatedS.term2.total;
      const finalGrade = calculateGrade(grandTotal / 2);
      
      return { ...updatedS, grandTotal, finalGrade };
    });
    
    // Re-calculate overall totals
    const term1Total = nextSubjects.reduce((sum, s) => sum + s.term1.total, 0);
    const term2Total = nextSubjects.reduce((sum, s) => sum + s.term2.total, 0);
    const grandTotal = term1Total + term2Total;
    const numSubjects = nextSubjects.length || 1;
    const maxTotalMarks = numSubjects * 200;
    const overallPercentage = maxTotalMarks > 0 ? (grandTotal / maxTotalMarks) * 100 : 0;
    const overallGrade = calculateGrade(overallPercentage);
    
    setTemplate2Data({
      ...template2Data,
      subjects: nextSubjects,
      term1Total,
      term2Total,
      grandTotal,
      overallPercentage,
      overallGrade
    });
  };

  const handleT2CoScholasticChange = (areaName: string, term: 'term1Grade' | 'term2Grade', value: string) => {
    if (!template2Data) return;
    const nextCoScholastic = template2Data.coScholasticAreas.map(area => 
      area.area === areaName ? { ...area, [term]: value } : area
    );
    setTemplate2Data({ ...template2Data, coScholasticAreas: nextCoScholastic });
  };

  const handleSaveT2Overrides = async () => {
    if (!template2Data || !selectedReportCard) return;
    setLoading(true);
    try {
      const studentId = selectedReportCard.student.studentId;
      const academicYear = selectedReportCard.exam.academicYear || '2024-2025';
      
      // Construct overrides object
      const scholasticOverrides: Record<string, any> = {};
      template2Data.subjects.forEach(s => {
        scholasticOverrides[s.subjectId] = {
          term1: {
            periodicTest: s.term1.periodicTest,
            noteBook: s.term1.noteBook,
            subEnrichment: s.term1.subEnrichment,
            halfYearly: s.term1.halfYearly
          },
          term2: {
            periodicTest: s.term2.periodicTest,
            noteBook: s.term2.noteBook,
            subEnrichment: s.term2.subEnrichment,
            annual: s.term2.annual
          }
        };
      });
      
      const coScholasticOverrides: Record<string, any> = {};
      template2Data.coScholasticAreas.forEach(area => {
        coScholasticOverrides[area.area] = {
          term1Grade: area.term1Grade,
          term2Grade: area.term2Grade
        };
      });
      
      const payload = {
        studentId,
        academicYear,
        templateId: 'template2',
        overrides: {
          ...scholasticOverrides,
          coScholastic: coScholasticOverrides
        }
      };
      
      await reportCardOverridesService.upsertOverride(payload);
      toast.success('Overrides saved successfully');
      setIsEditingT2(false);
      // Re-fetch to be safe and ensure everything is synced
      fetchTemplate2Data(studentId, academicYear);
    } catch (error: any) {
      toast.error('Failed to save overrides: ' + error?.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelT2Edit = () => {
    if (!selectedReportCard) return;
    setIsEditingT2(false);
    // Re-fetch original data
    fetchTemplate2Data(selectedReportCard.student.studentId, selectedReportCard.exam.academicYear || '2024-2025');
  };

  // View report card with template selection
  const viewReportCardWithTemplate = async (studentId: string, examId: string, template: 'template1' | 'template2' | 'template3' | 'template4' = 'template1') => {
    setSelectedTemplate(template);
    
    // Fetch grading settings for legend
    const gradingSettings = await fetchGradingSettings();
    setGradingLegend(gradingSettings.gradingLegend || '');
    
    if (template === 'template2') {
      // Get exam to find academic year
      const exam = exams.find((e: any) => e.examId === examId);
      const academicYear = exam?.academicYear || '2024-2025';
      await fetchTemplate2Data(studentId, academicYear);
      setViewingReportCard(true);
    } else if (template === 'template3') {
      // Get exam to find academic year
      const exam = exams.find((e: any) => e.examId === examId);
      const academicYear = exam?.academicYear || '2024-2025';
      await fetchTemplate3Data(studentId, academicYear);
      setViewingReportCard(true);
    } else {
      await viewReportCard(studentId, examId, 'v2');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    const printArea = document.getElementById('report-card-print-area');
    if (!printArea) {
      toast.error('Report card content not found');
      return;
    }

    // For Template 2 and 3 use html2canvas to capture exact UI
    if (selectedTemplate === 'template2' || selectedTemplate === 'template3') {
      try {
        // Use html2canvas-pro which supports modern CSS colors (oklch/oklab) used by Tailwind v4
        const html2canvasPro = (await import('html2canvas-pro')).default;
        const { default: jsPDF } = await import('jspdf');

        const canvas = await html2canvasPro(printArea, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
          logging: false,
        });

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('portrait', 'mm', 'a4');
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const margin = 5;

        const imgWidth = pageWidth - margin * 2;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        // Split across pages if content is taller than one page
        let heightLeft = imgHeight;
        let position = margin;
        pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight);
        heightLeft -= pageHeight - margin * 2;

        while (heightLeft > 0) {
          position = heightLeft - imgHeight + margin;
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight);
          heightLeft -= pageHeight - margin * 2;
        }

        const studentName = selectedReportCard?.student?.name?.replace(/\s+/g, '_') || 'Student';
        const academicYear = selectedReportCard?.exam?.academicYear?.replace(/[^a-zA-Z0-9]/g, '_') || 'AY';
        pdf.save(`ReportCard_${selectedTemplate}_${studentName}_${academicYear}.pdf`);
        toast.success('PDF downloaded successfully!');
      } catch (error: any) {
        console.error('Error generating PDF:', error);
        toast.error('Failed to generate PDF: ' + error.message);
      }
      return;
    }

    // Template 1 & 4: use jsPDF text-based generation
    try {
      if (selectedReportCard) {
        const resultForPDF: any = {
          resultId: selectedReportCard.result.resultId,
          studentId: selectedReportCard.student.studentId,
          studentName: selectedReportCard.student.name,
          examId: selectedReportCard.exam.examId,
          examName: selectedReportCard.exam.examName,
          classId: selectedReportCard.student.classId,
          totalMarksObtained: selectedReportCard.result.totalMarksObtained,
          totalMaxMarks: selectedReportCard.result.totalMaxMarks,
          percentage: selectedReportCard.result.percentage,
          grade: selectedReportCard.result.grade,
          isPassed: selectedReportCard.result.isPassed,
          rank: selectedReportCard.result.rank,
          status: selectedReportCard.result.status,
          remarks: selectedReportCard.remarks?.teacher,
          subjects: selectedReportCard.subjects.map((subj: any) => ({
            subjectId: subj.subjectId,
            subjectName: subj.subjectName,
            subjectCode: subj.subjectCode,
            marksObtained: subj.marksObtained,
            maxMarks: subj.maxMarks || 100,
            totalMarks: subj.maxMarks || 100,
            internalMarks: subj.internalMarks,
            externalMarks: subj.externalMarks,
            breakdown: subj.breakdown,
            grade: subj.grade,
            isPassed: subj.isPassed,
            remarks: subj.remarks,
          })),
        };
        generateResultPDF(resultForPDF, 'School Exam Management System', reportCardVersion);
        toast.success('PDF generated successfully!');
      } else {
        toast.error('No report card data available');
      }
    } catch (error: any) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF: ' + error.message);
    }
  };

  // Handle share via WhatsApp
  const handleShareWhatsApp = () => {
    try {
      handleDownloadPDF();
      // Create a result object for sharing
      if (selectedReportCard) {
        const resultForShare: any = {
          studentName: selectedReportCard.student.name,
          examName: selectedReportCard.exam.examName,
          classId: selectedReportCard.student.classId,
          totalMarksObtained: selectedReportCard.result.totalMarksObtained,
          totalMaxMarks: selectedReportCard.result.totalMaxMarks,
          percentage: selectedReportCard.result.percentage,
          grade: selectedReportCard.result.grade,
          isPassed: selectedReportCard.result.isPassed,
          rank: selectedReportCard.result.rank,
        };
        shareViaWhatsApp(resultForShare);
        toast.success('Opening WhatsApp... Please attach the downloaded PDF');
        setShareDialog({ open: false });
      } else if (template2Data) {
        const resultForShare: any = {
          studentName: template2Data.student.name,
          examName: 'Report Card',
          classId: template2Data.student.classId,
          totalMarksObtained: template2Data.grandTotal,
          totalMaxMarks: 200,
          percentage: template2Data.overallPercentage,
          grade: template2Data.overallGrade || 'N/A',
          isPassed: template2Data.overallPercentage >= 40,
        };
        shareViaWhatsApp(resultForShare);
        toast.success('Opening WhatsApp... Please attach the downloaded PDF');
        setShareDialog({ open: false });
      } else if (template3Data) {
        const resultForShare: any = {
          studentName: template3Data.student.name,
          examName: 'Report Card',
          classId: template3Data.student.classSection,
          totalMarksObtained: template3Data.finalAggregateTotal,
          totalMaxMarks: 200,
          percentage: template3Data.finalAggregatePercentage,
          grade: calculateGrade(template3Data.finalAggregatePercentage) || 'N/A',
          isPassed: template3Data.finalAggregatePercentage >= 40,
        };
        shareViaWhatsApp(resultForShare);
        toast.success('Opening WhatsApp... Please attach the downloaded PDF');
        setShareDialog({ open: false });
      }
    } catch (error: any) {
      console.error('Error sharing via WhatsApp:', error);
      toast.error('Failed to share via WhatsApp');
    }
  };

  // Handle share via Email
  const handleShareEmail = () => {
    try {
      handleDownloadPDF();
      // Create a result object for sharing
      if (selectedReportCard) {
        const resultForShare: any = {
          studentName: selectedReportCard.student.name,
          examName: selectedReportCard.exam.examName,
          classId: selectedReportCard.student.classId,
          totalMarksObtained: selectedReportCard.result.totalMarksObtained,
          totalMaxMarks: selectedReportCard.result.totalMaxMarks,
          percentage: selectedReportCard.result.percentage,
          grade: selectedReportCard.result.grade,
          isPassed: selectedReportCard.result.isPassed,
          rank: selectedReportCard.result.rank,
        };
        shareViaEmail(resultForShare);
        toast.success('Opening email client... Please attach the downloaded PDF');
        setShareDialog({ open: false });
      } else if (template2Data) {
        const resultForShare: any = {
          studentName: template2Data.student.name,
          examName: 'Report Card',
          classId: template2Data.student.classId,
          totalMarksObtained: template2Data.grandTotal,
          totalMaxMarks: 200,
          percentage: template2Data.overallPercentage,
          grade: template2Data.overallGrade || 'N/A',
          isPassed: template2Data.overallPercentage >= 40,
        };
        shareViaEmail(resultForShare);
        toast.success('Opening email client... Please attach the downloaded PDF');
        setShareDialog({ open: false });
      } else if (template3Data) {
        const resultForShare: any = {
          studentName: template3Data.student.name,
          examName: 'Report Card',
          classId: template3Data.student.classSection,
          totalMarksObtained: template3Data.finalAggregateTotal,
          totalMaxMarks: 200,
          percentage: template3Data.finalAggregatePercentage,
          grade: calculateGrade(template3Data.finalAggregatePercentage) || 'N/A',
          isPassed: template3Data.finalAggregatePercentage >= 40,
        };
        shareViaEmail(resultForShare);
        toast.success('Opening email client... Please attach the downloaded PDF');
        setShareDialog({ open: false });
      }
    } catch (error: any) {
      console.error('Error sharing via email:', error);
      toast.error('Failed to share via email');
    }
  };

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A+':
        return 'bg-green-600';
      case 'A':
        return 'bg-green-500';
      case 'B+':
        return 'bg-blue-600';
      case 'B':
        return 'bg-blue-500';
      case 'C':
        return 'bg-yellow-500';
      case 'D':
        return 'bg-orange-500';
      case 'F':
        return 'bg-red-600';
      default:
        return 'bg-gray-500';
    }
  };

  // Filter report cards based on search
  const filteredReportCards = reportCards.filter(
    (rc) =>
      rc.studentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rc.studentId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rc.examName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (viewingReportCard && (selectedReportCard || template2Data || template3Data)) {
    return (
      <div className="space-y-6">
        {/* Print Header - Hidden on screen, shown on print */}
        <style>
          {`
            @media print {
              body * {
                visibility: hidden;
              }
              #report-card-print-area,
              #report-card-print-area * {
                visibility: visible;
              }
              #report-card-print-area {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
              }
              .no-print {
                display: none !important;
              }
            }
          `}
        </style>

        {/* Action Bar - No Print */}
        <div className="flex items-center justify-between no-print">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setViewingReportCard(false);
                setTemplate2Data(null);
                setTemplate3Data(null);
                setTerm1MainExamId(null);
                setTerm2MainExamId(null);
              }}
            >
              ← Back to Report Cards
            </Button>
            {/* Template Selection */}
            <Select value={selectedTemplate} onValueChange={(value: 'template1' | 'template2' | 'template3' | 'template4') => {
              setSelectedTemplate(value);
              if (value === 'template2' && selectedReportCard) {
                fetchTemplate2Data(selectedReportCard.student.studentId, selectedReportCard.exam.academicYear || '2024-2025');
              } else if (value === 'template3' && selectedReportCard) {
                fetchTemplate3Data(selectedReportCard.student.studentId, selectedReportCard.exam.academicYear || '2024-2025');
              }
            }}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select Template" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="template1">Template 1 (Original)</SelectItem>
                <SelectItem value="template2">Template 2 (CBSE)</SelectItem>
                <SelectItem value="template3">Template 3 (Two Pages)</SelectItem>
                <SelectItem value="template4">Template 4 (Offline)</SelectItem>
              </SelectContent>
            </Select>
            {(selectedTemplate === 'template1' || selectedTemplate === 'template4') && (
              <Select value={unitTestMethod} onValueChange={(value: 'average' | 'highest') => {
                setUnitTestMethod(value);
                if (selectedReportCard) {
                  viewReportCard(selectedReportCard.student.studentId, selectedReportCard.exam.examId, 'v2');
                }
              }}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="average">Average</SelectItem>
                  <SelectItem value="highest">Highest</SelectItem>
                </SelectContent>
              </Select>
            )}
            {/* Term Selectors for Template 2/3 */}
            {(selectedTemplate === 'template2' || selectedTemplate === 'template3') && selectedReportCard && (
              <div className="flex items-center gap-2 border-l pl-2 border-gray-300">
                <div className="flex flex-col">
                  <span className="text-[10px] text-gray-500 font-medium px-1">T1 Main Exam</span>
                  <Select 
                    value={term1MainExamId || 'auto'} 
                    onValueChange={(val) => {
                      setTerm1MainExamId(val === 'auto' ? null : val);
                    }}
                  >
                    <SelectTrigger className="w-40 h-8 text-xs">
                      <SelectValue placeholder="Auto-detect" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">Auto-detect</SelectItem>
                      {exams
                        .filter(e => e.classId === selectedReportCard.student.classId)
                        .map(e => (
                          <SelectItem key={e.examId} value={e.examId}>{e.examName}</SelectItem>
                        ))
                      }
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-gray-500 font-medium px-1">T2 Main Exam</span>
                  <Select 
                    value={term2MainExamId || 'auto'} 
                    onValueChange={(val) => {
                      setTerm2MainExamId(val === 'auto' ? null : val);
                    }}
                  >
                    <SelectTrigger className="w-40 h-8 text-xs">
                      <SelectValue placeholder="Auto-detect" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">Auto-detect</SelectItem>
                      {exams
                        .filter(e => e.classId === selectedReportCard.student.classId)
                        .map(e => (
                          <SelectItem key={e.examId} value={e.examId}>{e.examName}</SelectItem>
                        ))
                      }
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            {selectedTemplate === 'template2' && !isEditingT2 && (
              <Button variant="outline" className="gap-2" onClick={() => setIsEditingT2(true)}>
                <Edit className="w-4 h-4" />
                Edit Overrides
              </Button>
            )}

            {selectedTemplate === 'template3' && !isEditingScholastic && (
              <Button variant="outline" className="gap-2" onClick={() => setIsEditingScholastic(true)}>
                <Edit className="w-4 h-4" />
                Edit Marks
              </Button>
            )}

            {isEditingT2 && (
              <>
                <Button className="gap-2" onClick={handleSaveT2Overrides}>
                  <Save className="w-4 h-4" />
                  Save Changes
                </Button>
                <Button variant="outline" className="gap-2" onClick={handleCancelT2Edit}>
                  <X className="w-4 h-4" />
                  Cancel
                </Button>
              </>
            )}

            {isEditingScholastic && (
              <>
                <Button className="gap-2" onClick={saveScholasticOverrides}>
                  <Save className="w-4 h-4" />
                  Save Marks
                </Button>
                <Button variant="outline" className="gap-2" onClick={cancelEditingScholastic}>
                  <X className="w-4 h-4" />
                  Cancel
                </Button>
              </>
            )}
            <Button variant="outline" className="gap-2" onClick={handlePrint}>
              <Printer className="w-4 h-4" />
              Print
            </Button>
            <Button variant="outline" className="gap-2" onClick={() => setShareDialog({ open: true })}>
              <Share2 className="w-4 h-4" />
              Share
            </Button>
            <Button className="gap-2" onClick={handleDownloadPDF}>
              <Download className="w-4 h-4" />
              Download PDF
            </Button>
          </div>
        </div>

        {/* Report Card - Template Selection */}
        <div id="report-card-print-area">
          {/* Template 2 - CBSE Style Report Card */}
          {selectedTemplate === 'template2' && template2Data && (
            <Card className="max-w-5xl mx-auto">
              <CardContent className="p-6">
                {/* CBSE Header */}
                <div className="text-center border-2 border-gray-800 p-4 mb-4">
                  <h1 className="text-2xl font-bold text-gray-900">{template2Data.schoolName}</h1>
                  <p className="text-sm text-gray-600">{template2Data.schoolAddress}</p>
                  <h2 className="text-xl font-bold text-blue-800 mt-2">REPORT CARD</h2>
                  <p className="text-sm">Academic Year: {template2Data.academicYear}</p>
                </div>

                {/* Student Details */}
                <div className="grid grid-cols-2 gap-4 mb-4 p-3 border border-gray-300 rounded">
                  <div className="space-y-1">
                    <p className="text-sm"><span className="font-semibold">Student Name:</span> {template2Data.student.name}</p>
                    <p className="text-sm"><span className="font-semibold">Class:</span> {template2Data.student.className} - {template2Data.student.sectionName}</p>
                    <p className="text-sm"><span className="font-semibold">Roll No:</span> {template2Data.student.rollNo}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm"><span className="font-semibold">Date of Birth:</span> {template2Data.student.dateOfBirth || '-'}</p>
                    <p className="text-sm"><span className="font-semibold">Mother's Name:</span> {template2Data.student.motherName || '-'}</p>
                    <p className="text-sm"><span className="font-semibold">Father's Name:</span> {template2Data.student.fatherName || '-'}</p>
                  </div>
                </div>

                {/* Part I: Scholastic Areas */}
                <div className="mb-4">
                  <div className="flex items-center justify-between bg-blue-100 p-2 mb-2">
                    <h3 className="text-lg font-bold text-center flex-1 ml-10">Part I: Scholastic Areas</h3>
                    {!isEditingT2 ? (
                      <Button variant="outline" size="sm" className="gap-1 h-7 text-[10px] bg-white hover:bg-gray-100" onClick={() => setIsEditingT2(true)}>
                        <Edit className="w-3 h-3" />
                        Edit Marks
                      </Button>
                    ) : (
                      <div className="flex gap-2">
                        <Button size="sm" className="gap-1 h-7 text-[10px]" onClick={handleSaveT2Overrides}>
                          <Save className="w-3 h-3" />
                          Save
                        </Button>
                        <Button variant="outline" size="sm" className="gap-1 h-7 text-[10px] bg-white" onClick={handleCancelT2Edit}>
                          <X className="w-3 h-3" />
                          Cancel
                        </Button>
                      </div>
                    )}
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-xs">
                      <thead>
                        <tr className="bg-gray-100">
                          <th rowSpan={2} className="border border-gray-400 px-2 py-1 text-left">Subject</th>
                          <th colSpan={5} className="border border-gray-400 px-2 py-1 text-center bg-blue-50">Term 1 (100 Marks)</th>
                          <th colSpan={5} className="border border-gray-400 px-2 py-1 text-center bg-green-50">Term 2 (100 Marks)</th>
                          <th rowSpan={2} className="border border-gray-400 px-2 py-1 text-center">Grand Total (200)</th>
                          <th rowSpan={2} className="border border-gray-400 px-2 py-1 text-center">Final Grade</th>
                        </tr>
                        <tr className="bg-gray-50">
                          <th className="border border-gray-400 px-1 py-1 text-center text-[10px]">P.T. (10)</th>
                          <th className="border border-gray-400 px-1 py-1 text-center text-[10px]">N.B. (5)</th>
                          <th className="border border-gray-400 px-1 py-1 text-center text-[10px]">S.E. (5)</th>
                          <th className="border border-gray-400 px-1 py-1 text-center text-[10px]">H.Y. (80)</th>
                          <th className="border border-gray-400 px-1 py-1 text-center text-[10px]">Total</th>
                          <th className="border border-gray-400 px-1 py-1 text-center text-[10px]">P.T. (10)</th>
                          <th className="border border-gray-400 px-1 py-1 text-center text-[10px]">N.B. (5)</th>
                          <th className="border border-gray-400 px-1 py-1 text-center text-[10px]">S.E. (5)</th>
                          <th className="border border-gray-400 px-1 py-1 text-center text-[10px]">Annual (80)</th>
                          <th className="border border-gray-400 px-1 py-1 text-center text-[10px]">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {template2Data.subjects.map((subject, index) => (
                          <tr key={subject.subjectId} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="border border-gray-400 px-2 py-1 font-medium">{subject.subjectName}</td>
                            {/* Term 1 */}
                            <td className="border border-gray-400 px-1 py-1 text-center">
                              {isEditingT2 ? (
                                <Input 
                                  className="h-6 w-12 text-center p-0 mx-auto" 
                                  type="number" 
                                  value={subject.term1.periodicTest} 
                                  onChange={(e) => handleT2MarkChange(subject.subjectId, 'term1', 'periodicTest', e.target.value)} 
                                />
                              ) : subject.term1.periodicTest.toFixed(1)}
                            </td>
                            <td className="border border-gray-400 px-1 py-1 text-center">
                              {isEditingT2 ? (
                                <Input 
                                  className="h-6 w-12 text-center p-0 mx-auto" 
                                  type="number" 
                                  value={subject.term1.noteBook} 
                                  onChange={(e) => handleT2MarkChange(subject.subjectId, 'term1', 'noteBook', e.target.value)} 
                                />
                              ) : subject.term1.noteBook.toFixed(1)}
                            </td>
                            <td className="border border-gray-400 px-1 py-1 text-center">
                              {isEditingT2 ? (
                                <Input 
                                  className="h-6 w-12 text-center p-0 mx-auto" 
                                  type="number" 
                                  value={subject.term1.subEnrichment} 
                                  onChange={(e) => handleT2MarkChange(subject.subjectId, 'term1', 'subEnrichment', e.target.value)} 
                                />
                              ) : subject.term1.subEnrichment.toFixed(1)}
                            </td>
                            <td className="border border-gray-400 px-1 py-1 text-center">
                              {isEditingT2 ? (
                                <Input 
                                  className="h-6 w-12 text-center p-0 mx-auto" 
                                  type="number" 
                                  value={subject.term1.halfYearly} 
                                  onChange={(e) => handleT2MarkChange(subject.subjectId, 'term1', 'halfYearly', e.target.value)} 
                                />
                              ) : subject.term1.halfYearly.toFixed(1)}
                            </td>
                            <td className="border border-gray-400 px-1 py-1 text-center font-semibold bg-blue-50">{subject.term1.total.toFixed(1)}</td>
                            {/* Term 2 */}
                            <td className="border border-gray-400 px-1 py-1 text-center">
                              {isEditingT2 ? (
                                <Input 
                                  className="h-6 w-12 text-center p-0 mx-auto" 
                                  type="number" 
                                  value={subject.term2.periodicTest} 
                                  onChange={(e) => handleT2MarkChange(subject.subjectId, 'term2', 'periodicTest', e.target.value)} 
                                />
                              ) : subject.term2.periodicTest.toFixed(1)}
                            </td>
                            <td className="border border-gray-400 px-1 py-1 text-center">
                              {isEditingT2 ? (
                                <Input 
                                  className="h-6 w-12 text-center p-0 mx-auto" 
                                  type="number" 
                                  value={subject.term2.noteBook} 
                                  onChange={(e) => handleT2MarkChange(subject.subjectId, 'term2', 'noteBook', e.target.value)} 
                                />
                              ) : subject.term2.noteBook.toFixed(1)}
                            </td>
                            <td className="border border-gray-400 px-1 py-1 text-center">
                              {isEditingT2 ? (
                                <Input 
                                  className="h-6 w-12 text-center p-0 mx-auto" 
                                  type="number" 
                                  value={subject.term2.subEnrichment} 
                                  onChange={(e) => handleT2MarkChange(subject.subjectId, 'term2', 'subEnrichment', e.target.value)} 
                                />
                              ) : subject.term2.subEnrichment.toFixed(1)}
                            </td>
                            <td className="border border-gray-400 px-1 py-1 text-center">
                              {isEditingT2 ? (
                                <Input 
                                  className="h-6 w-12 text-center p-0 mx-auto" 
                                  type="number" 
                                  value={subject.term2.annual} 
                                  onChange={(e) => handleT2MarkChange(subject.subjectId, 'term2', 'annual', e.target.value)} 
                                />
                              ) : subject.term2.annual.toFixed(1)}
                            </td>
                            <td className="border border-gray-400 px-1 py-1 text-center font-semibold bg-green-50">{subject.term2.total.toFixed(1)}</td>
                            {/* Grand Total & Grade */}
                            <td className="border border-gray-400 px-1 py-1 text-center font-bold bg-yellow-50">{subject.grandTotal.toFixed(1)}</td>
                            <td className="border border-gray-400 px-1 py-1 text-center font-bold">{subject.finalGrade}</td>
                          </tr>
                        ))}
                        {/* Total Row */}
                        <tr className="bg-gray-200 font-bold">
                          <td className="border border-gray-400 px-2 py-1">TOTAL</td>
                          <td colSpan={4} className="border border-gray-400"></td>
                          <td className="border border-gray-400 px-1 py-1 text-center bg-blue-100">{template2Data.term1Total.toFixed(1)}</td>
                          <td colSpan={4} className="border border-gray-400"></td>
                          <td className="border border-gray-400 px-1 py-1 text-center bg-green-100">{template2Data.term2Total.toFixed(1)}</td>
                          <td className="border border-gray-400 px-1 py-1 text-center bg-yellow-100">{template2Data.grandTotal.toFixed(1)}</td>
                          <td className="border border-gray-400 px-1 py-1 text-center">{template2Data.overallGrade}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Part II: Co-Scholastic Areas */}
                <div className="mb-4">
                  <div className="flex items-center justify-between bg-green-100 p-2 mb-2">
                    <h3 className="text-lg font-bold text-center flex-1 ml-10">Part II: Co-Scholastic Areas</h3>
                    {!isEditingT2 ? (
                      <Button variant="outline" size="sm" className="gap-1 h-7 text-[10px] bg-white hover:bg-gray-100" onClick={() => setIsEditingT2(true)}>
                        <Edit className="w-3 h-3" />
                        Edit Grades
                      </Button>
                    ) : (
                      <div className="flex gap-2">
                        <Button size="sm" className="gap-1 h-7 text-[10px]" onClick={handleSaveT2Overrides}>
                          <Save className="w-3 h-3" />
                          Save
                        </Button>
                        <Button variant="outline" size="sm" className="gap-1 h-7 text-[10px] bg-white" onClick={handleCancelT2Edit}>
                          <X className="w-3 h-3" />
                          Cancel
                        </Button>
                      </div>
                    )}
                  </div>
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-gray-400 px-3 py-2 text-left">Area</th>
                        <th className="border border-gray-400 px-3 py-2 text-center">Term 1 Grade</th>
                        <th className="border border-gray-400 px-3 py-2 text-center">Term 2 Grade</th>
                      </tr>
                    </thead>
                    <tbody>
                      {template2Data.coScholasticAreas.map((area, index) => (
                        <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="border border-gray-400 px-3 py-2">{area.area}</td>
                          <td className="border border-gray-400 px-3 py-2 text-center">
                            {isEditingT2 ? (
                              <Select value={area.term1Grade} onValueChange={(val) => handleT2CoScholasticChange(area.area, 'term1Grade', val)}>
                                <SelectTrigger className="h-7 text-xs w-20 mx-auto">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="A">A</SelectItem>
                                  <SelectItem value="B">B</SelectItem>
                                  <SelectItem value="C">C</SelectItem>
                                  <SelectItem value="D">D</SelectItem>
                                  <SelectItem value="E">E</SelectItem>
                                </SelectContent>
                              </Select>
                            ) : area.term1Grade}
                          </td>
                          <td className="border border-gray-400 px-3 py-2 text-center">
                            {isEditingT2 ? (
                              <Select value={area.term2Grade} onValueChange={(val) => handleT2CoScholasticChange(area.area, 'term2Grade', val)}>
                                <SelectTrigger className="h-7 text-xs w-20 mx-auto">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="A">A</SelectItem>
                                  <SelectItem value="B">B</SelectItem>
                                  <SelectItem value="C">C</SelectItem>
                                  <SelectItem value="D">D</SelectItem>
                                  <SelectItem value="E">E</SelectItem>
                                </SelectContent>
                              </Select>
                            ) : area.term2Grade}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Summary & Result */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="p-3 border border-gray-300 rounded bg-blue-50">
                    <h4 className="font-bold mb-2">Summary</h4>
                    <p className="text-sm">Term 1 Total: <span className="font-semibold">{template2Data.term1Total.toFixed(1)}</span> ({template2Data.term1Percentage.toFixed(1)}%)</p>
                    <p className="text-sm">Term 2 Total: <span className="font-semibold">{template2Data.term2Total.toFixed(1)}</span> ({template2Data.term2Percentage.toFixed(1)}%)</p>
                    <p className="text-sm">Grand Total: <span className="font-semibold">{template2Data.grandTotal.toFixed(1)}</span></p>
                    <p className="text-sm">Overall Percentage: <span className="font-semibold">{template2Data.overallPercentage.toFixed(1)}%</span></p>
                  </div>
                  <div className="p-3 border border-gray-300 rounded bg-green-50">
                    <h4 className="font-bold mb-2">Result</h4>
                    <p className="text-2xl font-bold text-center mt-2">{template2Data.result}</p>
                    <p className="text-sm text-center mt-2">Grade: <span className="font-semibold text-lg">{template2Data.overallGrade}</span></p>
                    <p className="text-sm text-center mt-1">{template2Data.remarks}</p>
                  </div>
                </div>

                {/* Grading System Legend */}
                {gradingLegend && (
                  <div className="mb-4 p-2 border border-gray-300 rounded text-xs bg-gray-50">
                    <h4 className="font-bold mb-1">Grading System:</h4>
                    <p>{gradingLegend}</p>
                  </div>
                )}

                {/* Signatures */}
                <div className="grid grid-cols-3 gap-8 mt-8 pt-4 border-t border-gray-400">
                  <div className="text-center">
                    <div className="border-t border-gray-400 pt-2 mt-8">
                      <p className="text-sm font-medium">Class Teacher</p>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="border-t border-gray-400 pt-2 mt-8">
                      <p className="text-sm font-medium">Principal</p>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="border-t border-gray-400 pt-2 mt-8">
                      <p className="text-sm font-medium">Parent's Signature</p>
                    </div>
                  </div>
                </div>

                <div className="text-center mt-4 text-xs text-gray-500">
                  <p>Generated on: {new Date(template2Data.generatedAt).toLocaleDateString()}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Template 3 - Two Pages: Descriptive Marks + Signatures */}
          {selectedTemplate === 'template3' && template3Data && (
            <>
              {/* PAGE 1: Descriptive Marks */}
              <Card className="max-w-5xl mx-auto mb-8" style={{ pageBreakAfter: 'always' }}>
                <CardContent className="p-6">
                  {/* School Header */}
                  <div className="text-center border-2 border-gray-800 p-4 mb-4">
                    <h1 className="text-2xl font-bold text-gray-900">{template3Data.schoolName}</h1>
                    <p className="text-sm text-gray-600">{template3Data.schoolAddress}</p>
                    {template3Data.schoolPhone && <p className="text-xs text-gray-500">Phone: {template3Data.schoolPhone}</p>}
                    {template3Data.schoolEmail && <p className="text-xs text-gray-500">Email: {template3Data.schoolEmail}</p>}
                    {template3Data.schoolWebsite && <p className="text-xs text-gray-500">Website: {template3Data.schoolWebsite}</p>}
                    <h2 className="text-xl font-bold text-gray-800 mt-2 bg-gray-200 py-2">PROGRESS REPORT</h2>
                    <p className="text-sm mt-1">SESSION: {template3Data.academicYear}</p>
                  </div>

                  {/* Student Details */}
                  <div className="grid grid-cols-2 gap-4 mb-4 p-3 border border-gray-300 rounded">
                    <div className="space-y-1">
                      <p className="text-sm"><span className="font-semibold">Name:</span> {template3Data.student.name}</p>
                      <p className="text-sm"><span className="font-semibold">Std:</span> {template3Data.student.std}</p>
                      <p className="text-sm"><span className="font-semibold">Class/Sec:</span> {template3Data.student.classSection}</p>
                      <p className="text-sm"><span className="font-semibold">Roll No:</span> {template3Data.student.rollNo}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm"><span className="font-semibold">Date of Birth:</span> {template3Data.student.dateOfBirth || '-'}</p>
                      <p className="text-sm"><span className="font-semibold">Mother's Name:</span> {template3Data.student.motherName || '-'}</p>
                      <p className="text-sm"><span className="font-semibold">Father's Name:</span> {template3Data.student.fatherName || '-'}</p>
                      <p className="text-sm"><span className="font-semibold">Address:</span> {template3Data.student.address || '-'}</p>
                    </div>
                  </div>

                  {/* Main Academic Performance Table */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between bg-gray-200 p-2 mb-2">
                      <h3 className="text-lg font-bold text-center flex-1">SCHOLASTIC AREAS</h3>
                      <div className="flex items-center gap-2">
                        {!isEditingScholastic ? (
                          <Button variant="outline" size="sm" onClick={startEditingScholastic}>
                            Edit
                          </Button>
                        ) : (
                          <>
                            <Button size="sm" onClick={saveScholasticOverrides}>
                              Save
                            </Button>
                            <Button variant="outline" size="sm" onClick={cancelEditingScholastic}>
                              Cancel
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse text-xs border border-gray-400">
                        <thead>
                          <tr className="bg-gray-100">
                            <th rowSpan={2} className="border border-gray-400 px-2 py-1 text-left">Subject's Name</th>
                            <th colSpan={3} className="border border-gray-400 px-2 py-1 text-center bg-blue-50">1st Term</th>
                            <th colSpan={3} className="border border-gray-400 px-2 py-1 text-center bg-green-50">Final Term</th>
                            <th colSpan={2} className="border border-gray-400 px-2 py-1 text-center bg-yellow-50">Final Aggregate</th>
                            <th rowSpan={2} className="border border-gray-400 px-2 py-1 text-center">Highest %</th>
                          </tr>
                          <tr className="bg-gray-50">
                            <th className="border border-gray-400 px-1 py-1 text-center text-[10px]">Assessment (20)</th>
                            <th className="border border-gray-400 px-1 py-1 text-center text-[10px]">Written (80)</th>
                            <th className="border border-gray-400 px-1 py-1 text-center text-[10px]">Percentage % (100)</th>
                            <th className="border border-gray-400 px-1 py-1 text-center text-[10px]">Assessment (20)</th>
                            <th className="border border-gray-400 px-1 py-1 text-center text-[10px]">Written (80)</th>
                            <th className="border border-gray-400 px-1 py-1 text-center text-[10px]">Percentage % (100)</th>
                            <th className="border border-gray-400 px-1 py-1 text-center text-[10px]">Total</th>
                            <th className="border border-gray-400 px-1 py-1 text-center text-[10px]">%</th>
                          </tr>
                        </thead>
                        <tbody>
                          {template3Data.subjects.map((subject, index) => (
                            <tr key={subject.subjectId} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                              <td className="border border-gray-400 px-2 py-1 font-medium">{subject.subjectName}</td>
                              {/* Term 1 */}
                              <td className="border border-gray-400 px-1 py-1 text-center">
                                {!isEditingScholastic ? (
                                  subject.term1Assessment.toFixed(1)
                                ) : (
                                  <Input
                                    type="number"
                                    min={0}
                                    max={20}
                                    step={0.1}
                                    className="h-7 text-xs text-center"
                                    value={Number(subject.term1Assessment || 0)}
                                    onChange={(e) => updateScholasticCell(index, 'term1Assessment', e.target.value)}
                                  />
                                )}
                              </td>
                              <td className="border border-gray-400 px-1 py-1 text-center">
                                {!isEditingScholastic ? (
                                  subject.term1Written.toFixed(1)
                                ) : (
                                  <Input
                                    type="number"
                                    min={0}
                                    max={80}
                                    step={0.1}
                                    className="h-7 text-xs text-center"
                                    value={Number(subject.term1Written || 0)}
                                    onChange={(e) => updateScholasticCell(index, 'term1Written', e.target.value)}
                                  />
                                )}
                              </td>
                              <td className="border border-gray-400 px-1 py-1 text-center font-semibold bg-blue-50">{subject.term1Percentage.toFixed(1)}</td>
                              {/* Term 2 */}
                              <td className="border border-gray-400 px-1 py-1 text-center">
                                {!isEditingScholastic ? (
                                  subject.term2Assessment.toFixed(1)
                                ) : (
                                  <Input
                                    type="number"
                                    min={0}
                                    max={20}
                                    step={0.1}
                                    className="h-7 text-xs text-center"
                                    value={Number(subject.term2Assessment || 0)}
                                    onChange={(e) => updateScholasticCell(index, 'term2Assessment', e.target.value)}
                                  />
                                )}
                              </td>
                              <td className="border border-gray-400 px-1 py-1 text-center">
                                {!isEditingScholastic ? (
                                  subject.term2Written.toFixed(1)
                                ) : (
                                  <Input
                                    type="number"
                                    min={0}
                                    max={80}
                                    step={0.1}
                                    className="h-7 text-xs text-center"
                                    value={Number(subject.term2Written || 0)}
                                    onChange={(e) => updateScholasticCell(index, 'term2Written', e.target.value)}
                                  />
                                )}
                              </td>
                              <td className="border border-gray-400 px-1 py-1 text-center font-semibold bg-green-50">{subject.term2Percentage.toFixed(1)}</td>
                              {/* Final Aggregate */}
                              <td className="border border-gray-400 px-1 py-1 text-center font-bold bg-yellow-50">{subject.finalAggregateTotal.toFixed(1)}</td>
                              <td className="border border-gray-400 px-1 py-1 text-center font-bold bg-yellow-50">{subject.finalAggregatePercentage.toFixed(1)}</td>
                              <td className="border border-gray-400 px-1 py-1 text-center">-</td>
                            </tr>
                          ))}
                          {/* Total Row */}
                          <tr className="bg-gray-200 font-bold">
                            <td className="border border-gray-400 px-2 py-1">TOTAL</td>
                            <td className="border border-gray-400 px-1 py-1 text-center bg-blue-100">
                              {template3Data.subjects.reduce((sum, s) => sum + s.term1Assessment, 0).toFixed(1)}
                            </td>
                            <td className="border border-gray-400 px-1 py-1 text-center bg-blue-100">
                              {template3Data.subjects.reduce((sum, s) => sum + s.term1Written, 0).toFixed(1)}
                            </td>
                            <td className="border border-gray-400 px-1 py-1 text-center bg-blue-100">
                              {template3Data.term1TotalPercentage.toFixed(1)}
                            </td>
                            <td className="border border-gray-400 px-1 py-1 text-center bg-green-100">
                              {template3Data.subjects.reduce((sum, s) => sum + s.term2Assessment, 0).toFixed(1)}
                            </td>
                            <td className="border border-gray-400 px-1 py-1 text-center bg-green-100">
                              {template3Data.subjects.reduce((sum, s) => sum + s.term2Written, 0).toFixed(1)}
                            </td>
                            <td className="border border-gray-400 px-1 py-1 text-center bg-green-100">
                              {template3Data.term2TotalPercentage.toFixed(1)}
                            </td>
                            <td className="border border-gray-400 px-1 py-1 text-center bg-yellow-100">
                              {template3Data.finalAggregateTotal.toFixed(1)}
                            </td>
                            <td className="border border-gray-400 px-1 py-1 text-center bg-yellow-100">
                              {template3Data.finalAggregatePercentage.toFixed(2)}
                            </td>
                            <td className="border border-gray-400 px-1 py-1 text-center">-</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Personal/Social/Work Habits */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between bg-gray-200 p-2 mb-2">
                      <h3 className="text-lg font-bold text-center flex-1">Personal/Social/Work Habits</h3>
                      <div className="flex items-center gap-2">
                        {!isEditingHabits ? (
                          <Button variant="outline" size="sm" onClick={startEditingHabits}>
                            Edit
                          </Button>
                        ) : (
                          <>
                            <Button size="sm" onClick={saveHabits} disabled={habitsSaving}>
                              {habitsSaving ? 'Saving...' : 'Save'}
                            </Button>
                            <Button variant="outline" size="sm" onClick={cancelEditingHabits} disabled={habitsSaving}>
                              Cancel
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                    <table className="w-full border-collapse text-xs border border-gray-400">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="border border-gray-400 px-2 py-1 text-left">Activity</th>
                          <th className="border border-gray-400 px-2 py-1 text-center">1st Term</th>
                          <th className="border border-gray-400 px-2 py-1 text-center">Final Term</th>
                        </tr>
                      </thead>
                      <tbody>
                        {template3Data.habits.map((habit, index) => (
                          <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="border border-gray-400 px-2 py-1">{habit.habitName}</td>
                            <td className="border border-gray-400 px-2 py-1 text-center">
                              {!isEditingHabits ? (
                                habit.term1Grade || '-'
                              ) : (
                                <Select
                                  value={(habit.term1Grade ? habit.term1Grade : '__EMPTY__') as any}
                                  onValueChange={(value) => {
                                    if (!template3Data) return;
                                    const next = template3Data.habits.map((h, idx) =>
                                      idx === index
                                        ? {
                                            ...h,
                                            term1Grade: (value === '__EMPTY__' ? '' : (value as any)) as any,
                                          }
                                        : h,
                                    );
                                    setTemplate3Data({ ...template3Data, habits: next });
                                  }}
                                >
                                  <SelectTrigger className="h-7 text-xs">
                                    <SelectValue placeholder="-" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="__EMPTY__">-</SelectItem>
                                    <SelectItem value="A">A</SelectItem>
                                    <SelectItem value="B">B</SelectItem>
                                    <SelectItem value="C">C</SelectItem>
                                    <SelectItem value="D">D</SelectItem>
                                    <SelectItem value="E">E</SelectItem>
                                  </SelectContent>
                                </Select>
                              )}
                            </td>
                            <td className="border border-gray-400 px-2 py-1 text-center">
                              {!isEditingHabits ? (
                                habit.term2Grade || '-'
                              ) : (
                                <Select
                                  value={(habit.term2Grade ? habit.term2Grade : '__EMPTY__') as any}
                                  onValueChange={(value) => {
                                    if (!template3Data) return;
                                    const next = template3Data.habits.map((h, idx) =>
                                      idx === index
                                        ? {
                                            ...h,
                                            term2Grade: (value === '__EMPTY__' ? '' : (value as any)) as any,
                                          }
                                        : h,
                                    );
                                    setTemplate3Data({ ...template3Data, habits: next });
                                  }}
                                >
                                  <SelectTrigger className="h-7 text-xs">
                                    <SelectValue placeholder="-" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="__EMPTY__">-</SelectItem>
                                    <SelectItem value="A">A</SelectItem>
                                    <SelectItem value="B">B</SelectItem>
                                    <SelectItem value="C">C</SelectItem>
                                    <SelectItem value="D">D</SelectItem>
                                    <SelectItem value="E">E</SelectItem>
                                  </SelectContent>
                                </Select>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Remarks */}
                  <div className="mb-4 grid grid-cols-2 gap-4">
                    <div className="p-2 border border-gray-300 rounded">
                      <p className="text-xs font-semibold mb-1">1st Term:</p>
                      <p className="text-xs">{template3Data.term1Remarks || 'No remarks'}</p>
                    </div>
                    <div className="p-2 border border-gray-300 rounded">
                      <p className="text-xs font-semibold mb-1">Annual:</p>
                      <p className="text-xs">{template3Data.term2Remarks || 'No remarks'}</p>
                    </div>
                  </div>

                  {/* Attendance & Overall Totals */}
                  <div className="mb-4 grid grid-cols-2 gap-4">
                    <div className="p-2 border border-gray-300 rounded">
                      <p className="text-xs font-semibold mb-1">Attendance (75% Minimum Required):</p>
                      <p className="text-xs">1st Term: {template3Data.term1Attendance?.present || 0} / {template3Data.term1Attendance?.total || 0}</p>
                      <p className="text-xs">Final Term: {template3Data.term2Attendance?.present || 0} / {template3Data.term2Attendance?.total || 0}</p>
                      <p className="text-xs">Overall: {template3Data.overallAttendance?.present || 0} / {template3Data.overallAttendance?.total || 0} ({template3Data.overallAttendance?.percentage.toFixed(1) || 0}%)</p>
                    </div>
                    <div className="p-2 border border-gray-300 rounded">
                      <p className="text-xs font-semibold mb-1">Overall Totals:</p>
                      <p className="text-xs">Full Marks: {template3Data.subjects.length * 100}</p>
                      <p className="text-xs">1st Term: {template3Data.term1TotalMarks.toFixed(1)} ({template3Data.term1TotalPercentage.toFixed(1)}%)</p>
                      <p className="text-xs">Final Term: {template3Data.term2TotalMarks.toFixed(1)} ({template3Data.term2TotalPercentage.toFixed(1)}%)</p>
                      <p className="text-xs">Annual: {template3Data.finalAggregateTotal.toFixed(1)} / {template3Data.subjects.length * 200} ({template3Data.finalAggregatePercentage.toFixed(2)}%)</p>
                    </div>
                  </div>

                  {/* Grading System Legend */}
                  {gradingLegend && (
                    <div className="mb-4 p-2 border border-gray-300 rounded text-xs bg-gray-50">
                      <h4 className="font-bold mb-1">Grading System:</h4>
                      <p>{gradingLegend}</p>
                    </div>
                  )}

                  {/* Signatures (Page 1) */}
                  <div className="grid grid-cols-2 gap-8 mt-8 pt-4 border-t border-gray-400">
                    <div className="text-center">
                      <div className="border-t border-gray-400 pt-2 mt-8">
                        <p className="text-xs font-medium">Sign Teacher</p>
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="border-t border-gray-400 pt-2 mt-8">
                        <p className="text-xs font-medium">Sign Parent/Guardian</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* PAGE 2: Promotion Status and Signatures */}
              <Card className="max-w-5xl mx-auto" style={{ pageBreakBefore: 'always' }}>
                <CardContent className="p-6">
                  {/* School Header */}
                  <div className="text-center border-2 border-gray-800 p-4 mb-4">
                    <h1 className="text-2xl font-bold text-gray-900">{template3Data.schoolName}</h1>
                    <p className="text-sm text-gray-600">{template3Data.schoolAddress}</p>
                    {template3Data.schoolPhone && <p className="text-xs text-gray-500">Phone: {template3Data.schoolPhone}</p>}
                    {template3Data.schoolEmail && <p className="text-xs text-gray-500">Email: {template3Data.schoolEmail}</p>}
                    {template3Data.schoolWebsite && <p className="text-xs text-gray-500">Website: {template3Data.schoolWebsite}</p>}
                    <h2 className="text-xl font-bold text-gray-800 mt-2 bg-gray-200 py-2">PROGRESS REPORT</h2>
                  </div>

                  {/* Student Details */}
                  <div className="mb-6 p-3 border border-gray-300 rounded">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm"><span className="font-semibold">Name:</span> {template3Data.student.name}</p>
                        <p className="text-sm"><span className="font-semibold">Std./Section:</span> {template3Data.student.classSection}</p>
                        <p className="text-sm"><span className="font-semibold">Roll No.:</span> {template3Data.student.rollNo}</p>
                      </div>
                      <div>
                        <p className="text-sm"><span className="font-semibold">Year:</span> {template3Data.academicYear}</p>
                        <p className="text-sm"><span className="font-semibold">Registration No:</span> _______________</p>
                      </div>
                    </div>
                  </div>

                  {/* Requirements for Promotions */}
                  <div className="mb-6 p-3 border border-gray-300 rounded">
                    <h3 className="font-bold mb-2">Requirements for Promotions:</h3>
                    <ol className="list-decimal list-inside space-y-1 text-sm">
                      <li>Individual promotion is based on the child's ability to cope with the next educational step.</li>
                      <li>Average marks from examinations and regular assessments are the basis for promotion.</li>
                      <li>Failing in English will disqualify a student's promotion.</li>
                      <li>75% attendance is the minimum requirement.</li>
                      <li>The school authorities' decision regarding promotion is final.</li>
                    </ol>
                  </div>

                  {/* Promotion Status - Editable */}
                  <div className="mb-6 p-4 border-2 border-gray-400 rounded bg-gray-50">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-bold">Promotion Status:</h3>
                      <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">Editable - Can Override</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="promotion"
                          checked={template3Data.promotion.status === 'Promotion Granted'}
                          onChange={() => {
                            setTemplate3Data({
                              ...template3Data,
                              promotion: {
                                ...template3Data.promotion,
                                status: 'Promotion Granted',
                              },
                            });
                          }}
                          className="w-4 h-4 cursor-pointer"
                        />
                        <label className="text-sm font-semibold cursor-pointer">Promotion Granted</label>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="promotion"
                          checked={template3Data.promotion.status === 'Promotion Not Granted'}
                          onChange={() => {
                            setTemplate3Data({
                              ...template3Data,
                              promotion: {
                                ...template3Data.promotion,
                                status: 'Promotion Not Granted',
                              },
                            });
                          }}
                          className="w-4 h-4 cursor-pointer"
                        />
                        <label className="text-sm font-semibold cursor-pointer">Promotion Not Granted</label>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="promotion"
                          checked={template3Data.promotion.status === 'On Trial'}
                          onChange={() => {
                            setTemplate3Data({
                              ...template3Data,
                              promotion: {
                                ...template3Data.promotion,
                                status: 'On Trial',
                              },
                            });
                          }}
                          className="w-4 h-4 cursor-pointer"
                        />
                        <label className="text-sm font-semibold cursor-pointer">On Trial</label>
                      </div>
                    </div>
                    {template3Data.promotion.retestRequired && (
                      <div className="mt-3 p-2 bg-yellow-100 border border-yellow-400 rounded">
                        <p className="text-sm font-semibold mb-1">Retest in:</p>
                        <p className="text-sm">On .......... at ..........</p>
                        {template3Data.promotion.retestSubjects && template3Data.promotion.retestSubjects.length > 0 && (
                          <p className="text-xs mt-1">Subjects: {template3Data.promotion.retestSubjects.join(', ')}</p>
                        )}
                      </div>
                    )}
                    <div className="mt-3">
                      <label className="text-sm font-semibold">Date:</label>
                      <input
                        type="text"
                        value={editablePromotionDate}
                        onChange={(e) => setEditablePromotionDate(e.target.value)}
                        placeholder="Enter date (e.g., DD/MM/YYYY)"
                        className="ml-2 px-2 py-1 border border-gray-300 rounded text-sm w-48 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">Override the promotion status and date as needed before printing</p>
                    </div>
                  </div>

                  {/* Remarks - Editable */}
                  <div className="mb-6 p-3 border border-gray-300 rounded">
                    <p className="text-sm font-semibold mb-1">Remarks:</p>
                    <textarea
                      value={template3Data.promotion.remarks}
                      onChange={(e) => {
                        setTemplate3Data({
                          ...template3Data,
                          promotion: {
                            ...template3Data.promotion,
                            remarks: e.target.value,
                          },
                        });
                      }}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm min-h-[60px]"
                      placeholder="Enter remarks..."
                    />
                  </div>

                  {/* Signatures */}
                  <div className="grid grid-cols-2 gap-8 mt-12 pt-6 border-t-2 border-gray-400">
                    <div className="text-center">
                      <div className="border-t-2 border-gray-400 pt-2 mt-12">
                        <p className="text-sm font-medium">Class Teacher</p>
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="border-t-2 border-gray-400 pt-2 mt-12">
                        <p className="text-sm font-medium">Principal/Vice Principal</p>
                      </div>
                    </div>
                  </div>

                  {/* Important Note */}
                  <div className="mt-6 p-2 bg-yellow-50 border border-yellow-300 rounded">
                    <p className="text-xs font-semibold">N.B Please Sign and return the Report Card</p>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {/* Template 1 - Original Report Card */}
          {(selectedTemplate === 'template1' || selectedTemplate === 'template4') && selectedReportCard && (
          <Card className="max-w-4xl mx-auto">
            <CardContent className="p-8">
              {/* Header */}
              <div className="text-center border-b-2 border-gray-300 pb-6 mb-6">
                <h2 className="text-3xl font-bold text-gray-900">
                  School Exam Management System
                </h2>
                <p className="text-gray-600 mt-2">Academic Excellence</p>
                <h3 className="text-xl font-semibold text-blue-600 mt-4">
                  STUDENT REPORT CARD
                </h3>
              </div>

              {/* Student Info */}
              <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600">Student Name</p>
                  <p className="font-semibold text-gray-900">{selectedReportCard.student.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Student ID</p>
                  <p className="font-semibold text-gray-900">{selectedReportCard.student.studentId}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Class / Section</p>
                  <p className="font-semibold text-gray-900">
                    {selectedReportCard.student.className} / {selectedReportCard.student.sectionName}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Roll Number</p>
                  <p className="font-semibold text-gray-900">{selectedReportCard.student.rollNo}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Date of Birth</p>
                  <p className="font-semibold text-gray-900">{selectedReportCard.student.dateOfBirth || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Father's Name</p>
                  <p className="font-semibold text-gray-900">{selectedReportCard.student.fatherName || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Mother's Name</p>
                  <p className="font-semibold text-gray-900">{selectedReportCard.student.motherName || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Examination</p>
                  <p className="font-semibold text-gray-900">{selectedReportCard.exam.examName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Exam Type</p>
                  <p className="font-semibold text-gray-900">{selectedReportCard.exam.examType}</p>
                </div>
              </div>

              {/* Marks Table - V2 (Final Version) */}
              <div className="mb-6">
                {selectedReportCard.subjects.some(s => s.breakdown) ? (
                  // Version 2: Internal/External Breakdown with Max Marks
                  <table className="w-full border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-gray-300 px-4 py-3 text-left">Subject</th>
                        <th className="border border-gray-300 px-4 py-3 text-center">
                          Internal Marks<br />
                          <span className="text-xs font-normal text-gray-600">Obtained</span>
                        </th>
                        <th className="border border-gray-300 px-4 py-3 text-center">
                          Internal Max<br />
                          <span className="text-xs font-normal text-gray-600">(20 marks)</span>
                        </th>
                        <th className="border border-gray-300 px-4 py-3 text-center">
                          External/Main Marks<br />
                          <span className="text-xs font-normal text-gray-600">Obtained</span>
                        </th>
                        <th className="border border-gray-300 px-4 py-3 text-center">
                          Total Marks<br />
                          <span className="text-xs font-normal text-gray-600">Obtained</span>
                        </th>
                        <th className="border border-gray-300 px-4 py-3 text-center">
                          Max Marks<br />
                          <span className="text-xs font-normal text-gray-600">(100 marks)</span>
                        </th>
                        <th className="border border-gray-300 px-4 py-3 text-center">Grade</th>
                        <th className="border border-gray-300 px-4 py-3 text-center">Result</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedReportCard.subjects.map((subject) => {
                        const breakdown = subject.breakdown || {
                          unitTest: 0,
                          assignment: 0,
                          attendance: 0,
                          external: subject.externalMarks || 0,
                        };
                        const internalTotal = (breakdown.unitTest || 0) + (breakdown.assignment || 0) + (breakdown.attendance || 0);
                        const externalTotal = breakdown.external || subject.externalMarks || 0;
                        const totalMarks = internalTotal + externalTotal;
                        const maxMarks = subject.maxMarks || subject.totalMarks || 100;
                        const internalMaxMarks = 20; // Internal marks are always out of 20
                        
                        return (
                          <tr key={subject.subjectId}>
                            <td className="border border-gray-300 px-4 py-3 font-medium">
                              {subject.subjectName}
                              <span className="text-xs text-gray-500 ml-2">
                                ({subject.subjectCode})
                              </span>
                            </td>
                            <td className="border border-gray-300 px-4 py-3 text-center font-medium bg-blue-50">
                              <div className="text-lg font-bold text-blue-700">
                                {internalTotal.toFixed(2)}
                              </div>
                              <div className="text-xs text-gray-600 mt-1">
                                Unit: {breakdown.unitTest?.toFixed(2) || '0.00'} | 
                                Assign: {breakdown.assignment?.toFixed(2) || '0.00'} | 
                                Attend: {breakdown.attendance?.toFixed(2) || '0.00'}
                              </div>
                            </td>
                            <td className="border border-gray-300 px-4 py-3 text-center font-medium bg-blue-100">
                              <div className="text-lg font-bold text-blue-900">
                                {internalMaxMarks}
                              </div>
                            </td>
                            <td className="border border-gray-300 px-4 py-3 text-center font-medium bg-green-50">
                              <div className="text-lg font-bold text-green-700">
                                {externalTotal.toFixed(2)}
                              </div>
                            </td>
                            <td className="border border-gray-300 px-4 py-3 text-center font-bold bg-gray-50">
                              <div className="text-lg">
                                {totalMarks.toFixed(2)}
                              </div>
                              <div className="text-xs text-gray-600 mt-1">
                                {subject.percentage}%
                              </div>
                            </td>
                            <td className="border border-gray-300 px-4 py-3 text-center font-medium bg-yellow-50">
                              <div className="text-lg font-bold text-gray-700">
                                {maxMarks}
                              </div>
                            </td>
                            <td className="border border-gray-300 px-4 py-3 text-center">
                              <span
                                className={`px-3 py-1 rounded-full font-medium text-white text-sm ${getGradeColor(
                                  subject.grade
                                )}`}
                              >
                                {subject.grade}
                              </span>
                            </td>
                            <td className="border border-gray-300 px-4 py-3 text-center">
                              <span
                                className={`font-medium ${
                                  subject.isPassed ? 'text-green-600' : 'text-red-600'
                                }`}
                              >
                                {subject.isPassed ? 'PASS' : 'FAIL'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                      <tr className="bg-gray-100 font-bold">
                        <td className="border border-gray-300 px-4 py-3">TOTAL</td>
                        <td className="border border-gray-300 px-4 py-3 text-center bg-blue-100">
                          {selectedReportCard.subjects.reduce((sum, s) => {
                            const b = s.breakdown || { unitTest: 0, assignment: 0, attendance: 0 };
                            return sum + (b.unitTest || 0) + (b.assignment || 0) + (b.attendance || 0);
                          }, 0).toFixed(2)}
                        </td>
                        <td className="border border-gray-300 px-4 py-3 text-center bg-blue-200">
                          {selectedReportCard.subjects.length * 20}
                        </td>
                        <td className="border border-gray-300 px-4 py-3 text-center bg-green-100">
                          {selectedReportCard.subjects.reduce((sum, s) => {
                            const b = s.breakdown || { external: 0 };
                            return sum + (b.external || s.externalMarks || 0);
                          }, 0).toFixed(2)}
                        </td>
                        <td className="border border-gray-300 px-4 py-3 text-center bg-gray-200">
                          {selectedReportCard.result.totalMarksObtained.toFixed(2)}
                        </td>
                        <td className="border border-gray-300 px-4 py-3 text-center bg-yellow-100">
                          {selectedReportCard.result.totalMaxMarks.toFixed(2)}
                        </td>
                        <td className="border border-gray-300 px-4 py-3 text-center">-</td>
                        <td className="border border-gray-300 px-4 py-3 text-center">-</td>
                      </tr>
                    </tbody>
                  </table>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No marks data available. Please ensure marks are entered with internal/external breakdown.
                  </div>
                )}
              </div>

              {/* Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="p-4 bg-blue-50 rounded-lg text-center">
                  <p className="text-sm text-gray-600">Percentage</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {selectedReportCard.result.percentage.toFixed(1)}%
                  </p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg text-center">
                  <p className="text-sm text-gray-600">Overall Grade</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {selectedReportCard.result.grade}
                  </p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg text-center">
                  <p className="text-sm text-gray-600">Class Rank</p>
                  <p className="text-2xl font-bold text-green-600">
                    {selectedReportCard.result.rank}
                  </p>
                </div>
                <div className="p-4 bg-orange-50 rounded-lg text-center">
                  <p className="text-sm text-gray-600">Result</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {selectedReportCard.result.isPassed ? 'PASS' : 'FAIL'}
                  </p>
                </div>
              </div>

              {/* Remarks */}
              <div className="p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded mb-6">
                <p className="font-semibold text-gray-900 mb-2">Teacher's Remarks:</p>
                <p className="text-gray-700">{selectedReportCard.remarks.teacher || 'No remarks provided.'}</p>
                {selectedReportCard.remarks.custom && (
                  <p className="text-gray-700 mt-2 italic">
                    "{selectedReportCard.remarks.custom}"
                  </p>
                )}
              </div>

              {/* Grading System Legend */}
              {gradingLegend && (
                <div className="p-3 bg-gray-50 border border-gray-300 rounded mb-6">
                  <p className="text-xs font-semibold text-gray-700 mb-1">Grading System:</p>
                  <p className="text-xs text-gray-600">{gradingLegend}</p>
                </div>
              )}

              {/* Footer */}
              <div className="grid grid-cols-3 gap-8 mt-12 pt-6 border-t-2 border-gray-300">
                <div className="text-center">
                  <div className="border-t-2 border-gray-400 pt-2 mt-12">
                    <p className="text-sm text-gray-600">Class Teacher</p>
                  </div>
                </div>
                <div className="text-center">
                  <div className="border-t-2 border-gray-400 pt-2 mt-12">
                    <p className="text-sm text-gray-600">Principal</p>
                  </div>
                </div>
                <div className="text-center">
                  <div className="border-t-2 border-gray-400 pt-2 mt-12">
                    <p className="text-sm text-gray-600">Parent's Signature</p>
                  </div>
                </div>
              </div>

              {/* Issue Date */}
              <div className="text-center mt-6 text-sm text-gray-500">
                <p>Issued on: {selectedReportCard?.issueDate}</p>
              </div>
            </CardContent>
          </Card>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="py-6 space-y-6">
      {/* Sticky Header with Excel-like Action Groups */}
      <div className="sticky top-0 z-10 bg-gray-50 pb-4 border-b border-gray-200">
        {/* Title */}
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-gray-900">Report Cards</h1>
          <p className="text-gray-500 mt-1">
            Generate and view student report cards for exams
          </p>
        </div>

        {/* Action Groups */}
        <div className="flex flex-wrap gap-6 items-start">
          {/* Database Group */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Database
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={fetchReportCards}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                Refresh
              </Button>
            </div>
          </div>

          {/* Data Group */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Data
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="gap-2">
                <FileSpreadsheet className="w-4 h-4" />
                Export
              </Button>
            </div>
          </div>

          {/* View Group */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              View
            </span>
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                className="gap-2"
                onClick={() => setViewMode('grid')}
              >
                <Grid3x3 className="w-4 h-4" />
                Grid
              </Button>
              <Button
                variant={viewMode === 'table' ? 'default' : 'outline'}
                size="sm"
                className="gap-2"
                onClick={() => setViewMode('table')}
              >
                <List className="w-4 h-4" />
                List
              </Button>
            </div>
          </div>

          {/* Filters Group */}
          <div className="flex flex-col gap-2 flex-1">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Filters
            </span>
            <div className="flex gap-2 flex-wrap">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Search by student or exam..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-9"
                />
              </div>
              <Select value={selectedExam} onValueChange={setSelectedExam}>
                <SelectTrigger className="w-[200px] h-9">
                  <SelectValue placeholder="All Exams" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Exams</SelectItem>
                  {exams.map((exam) => (
                    <SelectItem key={exam.examId} value={exam.examId}>
                      {exam.examName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger className="w-[150px] h-9">
                  <SelectValue placeholder="All Classes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classes</SelectItem>
                  {classes.map((cls) => (
                    <SelectItem key={cls.classId} value={cls.classId}>
                      {cls.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredReportCards.length}</div>
            <p className="text-xs text-muted-foreground">Available report cards</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Passed</CardTitle>
            <Trophy className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {filteredReportCards.filter((rc) => rc.isPassed).length}
            </div>
            <p className="text-xs text-muted-foreground">Students passed</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
            <Award className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {filteredReportCards.filter((rc) => !rc.isPassed).length}
            </div>
            <p className="text-xs text-muted-foreground">Students failed</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Percentage</CardTitle>
            <Award className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {filteredReportCards.length > 0
                ? (
                    filteredReportCards.reduce((acc, rc) => acc + rc.percentage, 0) /
                    filteredReportCards.length
                  ).toFixed(1)
                : 0}
              %
            </div>
            <p className="text-xs text-muted-foreground">Class average</p>
          </CardContent>
        </Card>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredReportCards.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="w-12 h-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No Report Cards Found
            </h3>
            <p className="text-gray-500 text-center max-w-md">
              No report cards available. Make sure results have been created for the
              selected exam and class.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Grid View */}
      {!loading && viewMode === 'grid' && filteredReportCards.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredReportCards.map((reportCard) => (
            <Card
              key={reportCard.resultId}
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => viewReportCardWithTemplate(reportCard.studentId, reportCard.examId, 'template1')}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{reportCard.studentName}</CardTitle>
                    <p className="text-sm text-gray-500 mt-1">
                      Roll No: {reportCard.rollNo}
                    </p>
                  </div>
                  <Badge
                    variant={reportCard.isPassed ? 'default' : 'destructive'}
                    className="ml-2"
                  >
                    {reportCard.isPassed ? 'PASS' : 'FAIL'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Exam</p>
                  <p className="font-medium text-gray-900">{reportCard.examName}</p>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <p className="text-xs text-gray-600">Percentage</p>
                    <p className="font-semibold text-blue-600">
                      {reportCard.percentage.toFixed(1)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Grade</p>
                    <Badge className={getGradeColor(reportCard.grade)}>
                      {reportCard.grade}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Rank</p>
                    <p className="font-semibold text-green-600">{reportCard.rank}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    className="flex-1 gap-1" 
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      viewReportCardWithTemplate(reportCard.studentId, reportCard.examId, 'template1');
                    }}
                  >
                    <Eye className="w-3 h-3" />
                    Template 1
                  </Button>
                  <Button 
                    variant="default" 
                    className="flex-1 gap-1" 
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      viewReportCardWithTemplate(reportCard.studentId, reportCard.examId, 'template2');
                    }}
                  >
                    <Eye className="w-3 h-3" />
                    CBSE
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Table View */}
      {!loading && viewMode === 'table' && filteredReportCards.length > 0 && (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Exam
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Class
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Percentage
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Grade
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rank
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Result
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredReportCards.map((reportCard) => (
                    <tr key={reportCard.resultId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <button
                            onClick={() => viewReportCardWithTemplate(reportCard.studentId, reportCard.examId, 'template1')}
                            className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
                          >
                            {reportCard.studentName}
                          </button>
                          <div className="text-sm text-gray-500">
                            Roll: {reportCard.rollNo}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => viewReportCardWithTemplate(reportCard.studentId, reportCard.examId, 'template1')}
                          className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          {reportCard.examName}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {reportCard.className || reportCard.classId}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="text-sm font-semibold text-blue-600">
                          {reportCard.percentage.toFixed(1)}%
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <Badge className={getGradeColor(reportCard.grade)}>
                          {reportCard.grade}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="text-sm font-semibold text-green-600">
                          {reportCard.rank}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <Badge
                          variant={reportCard.isPassed ? 'default' : 'destructive'}
                        >
                          {reportCard.isPassed ? 'PASS' : 'FAIL'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex gap-1 justify-center">
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1"
                            onClick={() =>
                              viewReportCardWithTemplate(reportCard.studentId, reportCard.examId, 'template1')
                            }
                          >
                            <Eye className="w-3 h-3" />
                            T1
                          </Button>
                          <Button
                            variant="default"
                            size="sm"
                            className="gap-1"
                            onClick={() =>
                              viewReportCardWithTemplate(reportCard.studentId, reportCard.examId, 'template2')
                            }
                          >
                            <Eye className="w-3 h-3" />
                            CBSE
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Share Dialog */}
      <Dialog open={shareDialog.open} onOpenChange={(open) => setShareDialog({ open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Report Card PDF</DialogTitle>
            <DialogDescription>
              Share the report card PDF via WhatsApp or Email
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-3">
            <Button
              onClick={handleShareWhatsApp}
              className="w-full bg-green-600 hover:bg-green-700 text-white gap-2"
            >
              <MessageCircle className="w-5 h-5" />
              Share via WhatsApp
            </Button>
            <Button
              onClick={handleShareEmail}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white gap-2"
            >
              <Mail className="w-5 h-5" />
              Share via Email
            </Button>
            <p className="text-xs text-gray-500 text-center mt-4">
              Note: The PDF will be downloaded automatically. Please attach it when sharing.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShareDialog({ open: false })}
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
