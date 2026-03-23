import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Save,
  RefreshCw,
  School,
  Award,
  Palette,
  Sliders,
  Download,
  Upload,
  Plus,
  Trash2,
  Loader2,
  Database,
  Play,
  CheckCircle,
  XCircle,
  AlertCircle,
  Sparkles,
  ArrowRight,
  Users,
  GraduationCap,
  BookOpen,
  FileText,
  Calendar,
  ClipboardCheck,
  Trophy,
  FileBarChart,
  Monitor,
  HelpCircle,
  CheckSquare,
  Heart,
  CreditCard,
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Switch } from '../ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { toast } from 'sonner';
import { useApp } from '../../context/AppContext';

// Import all services for end-to-end data creation (using NestJS backend only)
import { classesService } from '../../services/classes.service';
import { sectionsService } from '../../services/sections.service';
import { teachersService } from '../../services/teachers.service';
import { subjectsService } from '../../services/subjects.service';
import { studentsService } from '../../services/students.service';
import { examsService } from '../../services/exams.service';
import { marksService, calculateGrade } from '../../services/marks.service';
import { resultsService } from '../../services/results.service';
import { academicYearsService } from '../../services/academic-years.service';
// V3: Online Exams Module Services
import { examPapersService } from '../../services/exam-papers.service';
import { paperRulesService } from '../../services/paper-rules.service';
import { questionsService } from '../../services/questions.service';
import { questionOptionsService } from '../../services/question-options.service';
import { studentAttemptsService } from '../../services/student-attempts.service';
import { studentResponsesService } from '../../services/student-responses.service';
import { studentHabitsService } from '../../services/student-habits.service';
import { licenseService, type License as LicenseType, type LicensePlan } from '../../services/license.service';

interface GradeRule {
  min: number;
  max: number;
  grade: string;
  gpa: number;
  color: string;
  abbreviation?: string; // Short description/abbreviation for the grade
}

interface GeneralSettings {
  category: string;
  schoolName: string;
  schoolAddress: string;
  schoolPhone: string;
  schoolEmail: string;
  schoolWebsite: string;
  principalName: string;
  academicYearStart: string;
  academicYearEnd: string;
}

interface GradingSettings {
  category: string;
  passingMarks: number;
  gradeRules: GradeRule[];
  gradingLegend?: string; // Full grading system legend/abbreviations
}

interface PreferencesSettings {
  category: string;
  theme: string;
  sidebarPosition: string;
  dateFormat: string;
  timeFormat: string;
  language: string;
}

interface SystemSettings {
  category: string;
  defaultExamTypes: string[];
  defaultTerms: string[];
  enableNotifications: boolean;
  enableEmailReports: boolean;
  autoPublishResults: boolean;
  allowStudentViewMarks: boolean;
  allowParentViewMarks: boolean;
}

interface SampleDataStep {
  id: string;
  name: string;
  icon: React.ElementType;
  status: 'pending' | 'running' | 'success' | 'error';
  message?: string;
  data?: any;
}

export function SettingsAPI() {
  const { setSidebarPosition, getPendingRecordId, clearPendingRecordId } = useApp();
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Open Sample Data tab when navigating from Dashboard or elsewhere with tab=sample-data
  useEffect(() => {
    const tab = getPendingRecordId('settings');
    if (tab === 'sample-data') {
      setActiveTab('sample-data');
      clearPendingRecordId('settings');
    }
  }, [getPendingRecordId, clearPendingRecordId]);

  // Sample Data Generation State
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationVersion, setGenerationVersion] = useState<'v1' | 'v2'>('v1');
  const [generationSteps, setGenerationSteps] = useState<SampleDataStep[]>([
    { id: 'academic-year', name: 'Academic Year', icon: Calendar, status: 'pending' },
    { id: 'class', name: 'Class', icon: Users, status: 'pending' },
    { id: 'section', name: 'Section', icon: Users, status: 'pending' },
    { id: 'class-section', name: 'Class-Section Link', icon: ArrowRight, status: 'pending' },
    { id: 'teacher', name: 'Teacher', icon: GraduationCap, status: 'pending' },
    { id: 'subjects', name: 'Subjects (3)', icon: BookOpen, status: 'pending' },
    { id: 'student', name: 'Students (20)', icon: GraduationCap, status: 'pending' },
    { id: 'exam', name: 'Exams (2)', icon: FileText, status: 'pending' },
    { id: 'timetable', name: 'Exam Timetable', icon: Calendar, status: 'pending' },
    { id: 'marks', name: 'Marks Entry (All Students)', icon: ClipboardCheck, status: 'pending' },
    { id: 'result', name: 'Results (All Students)', icon: Trophy, status: 'pending' },
    { id: 'report-card', name: 'Report Cards', icon: FileBarChart, status: 'pending' },
  ]);
  const [generatedData, setGeneratedData] = useState<any>(null);

  // Bulk Delete State
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteProgress, setDeleteProgress] = useState<{ module: string; status: 'pending' | 'running' | 'success' | 'error'; count?: number }[]>([]);

  // License (Razorpay) State
  const [licenseCurrent, setLicenseCurrent] = useState<LicenseType | null>(null);
  const [licensePlans, setLicensePlans] = useState<LicensePlan[]>([]);
  const [licenseConfig, setLicenseConfig] = useState<{ razorpayConfigured: boolean }>({ razorpayConfigured: false });
  const [licenseLoading, setLicenseLoading] = useState(false);
  const [licensePaying, setLicensePaying] = useState<string | null>(null);

  // Settings states
  const [generalSettings, setGeneralSettings] = useState<GeneralSettings>({
    category: 'general',
    schoolName: 'Demo School',
    schoolAddress: '123 Education Street',
    schoolPhone: '+1234567890',
    schoolEmail: 'info@demoschool.edu',
    schoolWebsite: 'www.demoschool.edu',
    principalName: 'Dr. Principal',
    academicYearStart: '04-01',
    academicYearEnd: '03-31',
  });

  const [gradingSettings, setGradingSettings] = useState<GradingSettings>({
    category: 'grading',
    passingMarks: 40,
    gradeRules: [
      { min: 90, max: 100, grade: 'A+', gpa: 4.0, color: '#22c55e', abbreviation: 'Outstanding' },
      { min: 80, max: 89, grade: 'A', gpa: 3.7, color: '#84cc16', abbreviation: 'Excellent' },
      { min: 70, max: 79, grade: 'B+', gpa: 3.3, color: '#eab308', abbreviation: 'Very Good' },
      { min: 60, max: 69, grade: 'B', gpa: 3.0, color: '#f97316', abbreviation: 'Good' },
      { min: 50, max: 59, grade: 'C', gpa: 2.5, color: '#ef4444', abbreviation: 'Average' },
      { min: 40, max: 49, grade: 'D', gpa: 2.0, color: '#dc2626', abbreviation: 'Below Average' },
      { min: 0, max: 39, grade: 'F', gpa: 0, color: '#7f1d1d', abbreviation: 'Fail' },
    ],
    gradingLegend: 'A+ (90-100): Outstanding | A (80-89): Excellent | B+ (70-79): Very Good | B (60-69): Good | C (50-59): Average | D (40-49): Below Average | F (0-39): Fail',
  });

  const [preferencesSettings, setPreferencesSettings] = useState<PreferencesSettings>({
    category: 'preferences',
    theme: 'light',
    sidebarPosition: 'left',
    dateFormat: 'YYYY-MM-DD',
    timeFormat: '24h',
    language: 'en',
  });

  const [systemSettings, setSystemSettings] = useState<SystemSettings>({
    category: 'system',
    defaultExamTypes: ['Mid-Term', 'Final', 'Unit Test', 'Quarterly'],
    defaultTerms: ['Term 1', 'Term 2'],
    enableNotifications: true,
    enableEmailReports: true,
    autoPublishResults: false,
    allowStudentViewMarks: true,
    allowParentViewMarks: true,
  });

  // Load license data when License tab is active
  const loadLicenseData = async () => {
    setLicenseLoading(true);
    try {
      const [config, current, plans] = await Promise.all([
        licenseService.getConfig(),
        licenseService.getCurrent(),
        licenseService.getPlans(),
      ]);
      setLicenseConfig(config);
      setLicenseCurrent(current);
      setLicensePlans(plans);
    } catch (e) {
      toast.error('Failed to load license info');
    } finally {
      setLicenseLoading(false);
    }
  };
  useEffect(() => {
    if (activeTab === 'license') {
      loadLicenseData();
      const hash = window.location.hash || '';
      const search = window.location.search || '';
      const q = hash + search;
      if (q.includes('payu=success')) {
        toast.success('Payment successful! License activated.');
        window.history.replaceState(null, '', window.location.pathname + (window.location.search || ''));
      } else if (q.includes('payu=failed') || q.includes('payu=invalid')) {
        toast.error('Payment failed or could not be verified.');
      }
    }
  }, [activeTab]);

  const payWithRazorpay = async (plan: LicensePlan) => {
    if (!licenseConfig.razorpayConfigured) {
      toast.error('Razorpay is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in backend .env');
      return;
    }
    setLicensePaying(plan.plan);
    try {
      const order = await licenseService.createOrder(plan.plan, plan.amount, { currency: plan.currency, gateway: 'razorpay' });
      if (order.gateway !== 'razorpay') {
        setLicensePaying(null);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      document.body.appendChild(script);
      script.onload = () => {
        const Razorpay = (window as any).Razorpay;
        if (!Razorpay) {
          toast.error('Razorpay checkout failed to load');
          setLicensePaying(null);
          return;
        }
        const options = {
          key: order.keyId,
          amount: order.amount,
          currency: order.currency,
          name: 'School Exam Management',
          description: plan.plan,
          order_id: order.orderId,
          handler: async (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => {
            try {
              await licenseService.verifyPayment(
                response.razorpay_order_id,
                response.razorpay_payment_id,
                response.razorpay_signature,
                plan.plan,
                plan.amount,
                plan.currency,
              );
              toast.success('Payment successful! License activated.');
              loadLicenseData();
            } catch (err: any) {
              toast.error(err.message || 'Verification failed');
            } finally {
              setLicensePaying(null);
            }
          },
          modal: { ondismiss: () => setLicensePaying(null) },
        };
        const rzp = new Razorpay(options);
        rzp.open();
      };
    } catch (e: any) {
      toast.error(e.message || 'Failed to create order');
      setLicensePaying(null);
    }
  };

  const payWithPayU = async (plan: LicensePlan) => {
    if (!licenseConfig.payuConfigured) {
      toast.error('PayU is not configured. Set PAYU_KEY and PAYU_SALT in backend .env');
      return;
    }
    setLicensePaying(plan.plan);
    try {
      const order = await licenseService.createOrder(plan.plan, plan.amount, {
        currency: plan.currency,
        gateway: 'payu',
        firstname: 'School Admin',
        email: 'admin@school.edu',
        phone: '9999999999',
      });
      if (order.gateway !== 'payu') {
        setLicensePaying(null);
        return;
      }
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = order.action;
      form.style.display = 'none';
      const fields: Array<[string, string]> = [
        ['key', order.key],
        ['txnid', order.txnid],
        ['amount', order.amount],
        ['productinfo', order.productinfo],
        ['firstname', order.firstname],
        ['email', order.email],
        ['phone', order.phone],
        ['surl', order.surl],
        ['furl', order.furl],
        ['hash', order.hash],
      ];
      fields.forEach(([name, value]) => {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = name;
        input.value = value;
        form.appendChild(input);
      });
      document.body.appendChild(form);
      form.submit();
      setLicensePaying(null);
    } catch (e: any) {
      toast.error(e.message || 'Failed to create PayU order');
      setLicensePaying(null);
    }
  };

  // Load settings from localStorage on mount
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem('schoolSettings');
      if (savedSettings) {
        const data = JSON.parse(savedSettings);
        setGeneralSettings({
          category: 'general',
          schoolName: data.schoolName || 'Demo School',
          schoolAddress: data.schoolAddress || '123 Education Street',
          schoolPhone: data.schoolPhone || '+1234567890',
          schoolEmail: data.schoolEmail || 'info@demoschool.edu',
          schoolWebsite: data.schoolWebsite || 'www.demoschool.edu',
          principalName: data.principalName || 'Dr. Principal',
          academicYearStart: data.academicYearStart || '04-01',
          academicYearEnd: data.academicYearEnd || '03-31',
        });
        console.log('✅ Loaded settings from localStorage:', data);
      }
    } catch (error) {
      console.error('Error loading settings from localStorage:', error);
    }
  }, []);

  const handleSaveGeneral = async () => {
    try {
      setSaving(true);
      
      // Save to localStorage (primary storage)
      localStorage.setItem('schoolSettings', JSON.stringify(generalSettings));
      console.log('✅ Settings saved to localStorage:', generalSettings);
      
      toast.success('Settings saved successfully!');
    } catch (error: any) {
      console.error('Error saving settings:', error);
      toast.error(error.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };
  const handleSaveGrading = () => {
    toast.success('Grading settings saved (local only - no backend)');
  };
  const handleSavePreferences = () => {
    setSidebarPosition(preferencesSettings.sidebarPosition as 'left' | 'right');
    toast.success('Preferences saved!');
  };
  const handleSaveSystem = () => {
    toast.success('System settings saved (local only - no backend)');
  };

  const addGradeRule = () => {
    setGradingSettings({
      ...gradingSettings,
      gradeRules: [
        ...gradingSettings.gradeRules,
        { min: 0, max: 0, grade: '', gpa: 0, color: '#6b7280' },
      ],
    });
  };

  const removeGradeRule = (index: number) => {
    setGradingSettings({
      ...gradingSettings,
      gradeRules: gradingSettings.gradeRules.filter((_, i) => i !== index),
    });
  };

  const updateGradeRule = (index: number, field: keyof GradeRule, value: any) => {
    const updatedRules = [...gradingSettings.gradeRules];
    updatedRules[index] = { ...updatedRules[index], [field]: value };
    setGradingSettings({ ...gradingSettings, gradeRules: updatedRules });
  };

  // Update step status helper
  const updateStepStatus = (stepId: string, status: SampleDataStep['status'], message?: string, data?: any) => {
    setGenerationSteps(prev => prev.map(step => 
      step.id === stepId ? { ...step, status, message, data } : step
    ));
  };

  // Reset all steps to pending
  const resetSteps = (version: 'v1' | 'v2' = 'v1') => {
    setGenerationVersion(version);
    if (version === 'v2') {
      // V2 steps include unit tests, final exams, and V3 online exams
      setGenerationSteps([
        { id: 'academic-year', name: 'Academic Year', icon: Calendar, status: 'pending' },
        { id: 'class', name: 'Class', icon: Users, status: 'pending' },
        { id: 'section', name: 'Section', icon: Users, status: 'pending' },
        { id: 'class-section', name: 'Class-Section Link', icon: ArrowRight, status: 'pending' },
        { id: 'teacher', name: 'Teacher', icon: GraduationCap, status: 'pending' },
        { id: 'subjects', name: 'Subjects (3)', icon: BookOpen, status: 'pending' },
        { id: 'student', name: 'Students (20)', icon: GraduationCap, status: 'pending' },
        { id: 'unit-tests', name: 'Unit Test Exams (5)', icon: FileText, status: 'pending' },
        { id: 'final-exams', name: 'Final Exams (2)', icon: FileText, status: 'pending' },
        { id: 'unit-test-marks', name: 'Unit Test Marks', icon: ClipboardCheck, status: 'pending' },
        { id: 'final-exam-marks', name: 'Template 2 Marks (CBSE)', icon: ClipboardCheck, status: 'pending' },
        { id: 'template1-marks', name: 'Template 1 Marks (Original)', icon: ClipboardCheck, status: 'pending' },
        { id: 'template3-marks', name: 'Template 3 Marks (Assessment/Written)', icon: ClipboardCheck, status: 'pending' },
        { id: 'student-habits', name: 'Student Habits (Template 3)', icon: Heart, status: 'pending' },
        { id: 'result', name: 'Results (V2 Breakdown)', icon: Trophy, status: 'pending' },
        { id: 'report-card', name: 'Report Cards V2', icon: FileBarChart, status: 'pending' },
        // V3: Online Exams Module
        { id: 'online-exam', name: 'Online Exam Paper', icon: Monitor, status: 'pending' },
        { id: 'paper-rules', name: 'Paper Rules', icon: FileText, status: 'pending' },
        { id: 'questions', name: 'Questions (MCQ+Theory)', icon: HelpCircle, status: 'pending' },
        { id: 'student-attempts', name: 'Student Attempts', icon: GraduationCap, status: 'pending' },
        { id: 'student-responses', name: 'Student Responses', icon: CheckSquare, status: 'pending' },
      ]);
    } else {
      // V1 steps (original)
      setGenerationSteps([
        { id: 'academic-year', name: 'Academic Year', icon: Calendar, status: 'pending' },
        { id: 'class', name: 'Class', icon: Users, status: 'pending' },
        { id: 'section', name: 'Section', icon: Users, status: 'pending' },
        { id: 'class-section', name: 'Class-Section Link', icon: ArrowRight, status: 'pending' },
        { id: 'teacher', name: 'Teacher', icon: GraduationCap, status: 'pending' },
        { id: 'subjects', name: 'Subjects (3)', icon: BookOpen, status: 'pending' },
        { id: 'student', name: 'Students (20)', icon: GraduationCap, status: 'pending' },
        { id: 'exam', name: 'Exams (2)', icon: FileText, status: 'pending' },
        { id: 'timetable', name: 'Exam Timetable', icon: Calendar, status: 'pending' },
        { id: 'marks', name: 'Marks Entry (All Students)', icon: ClipboardCheck, status: 'pending' },
        { id: 'result', name: 'Results (All Students)', icon: Trophy, status: 'pending' },
        { id: 'report-card', name: 'Report Cards', icon: FileBarChart, status: 'pending' },
      ]);
    }
    setGeneratedData(null);
  };

  // Generate unique IDs
  const generateId = (prefix: string) => {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 6);
    return `${prefix}-${timestamp}-${random}`.toUpperCase();
  };

  // Helper function to generate random marks based on performance level
  const generateRandomMarks = (performanceLevel: 'excellent' | 'good' | 'average' | 'poor' | 'failing'): number[] => {
    const baseMarks: Record<string, [number, number]> = {
      excellent: [85, 95],   // 85-95%
      good: [70, 84],        // 70-84%
      average: [50, 69],     // 50-69%
      poor: [30, 49],        // 30-49%
      failing: [15, 29],     // 15-29%
    };
    
    const [min, max] = baseMarks[performanceLevel];
    const numSubjects = 3;
    const marks: number[] = [];
    
    for (let i = 0; i < numSubjects; i++) {
      // Add some variation between subjects (±5%)
      const variation = (Math.random() - 0.5) * 10;
      const mark = Math.max(0, Math.min(100, min + Math.random() * (max - min) + variation));
      marks.push(Math.round(mark));
    }
    
    return marks;
  };

  // MAIN: Generate End-to-End Sample Data with Multiple Students (V1)
  const generateEndToEndSampleData = async () => {
    setIsGenerating(true);
    resetSteps('v1');

    const createdData: any = {
      academicYear: null,
      class: null,
      section: null,
      teacher: null,
      subjects: [],
      students: [],
      exams: [],
      timetable: [],
      marks: [],
      results: [],
    };

    // Student names for variety
    const studentNames = [
      'Aarav Sharma', 'Priya Patel', 'Rohan Kumar', 'Ananya Singh', 'Vikram Mehta',
      'Sneha Reddy', 'Arjun Nair', 'Kavya Iyer', 'Aditya Joshi', 'Meera Desai',
      'Rahul Gupta', 'Divya Agarwal', 'Karan Malhotra', 'Pooja Shah', 'Nikhil Verma',
      'Shreya Kapoor', 'Aman Tiwari', 'Isha Choudhury', 'Ravi Menon', 'Neha Krishnan'
    ];

    // Performance distribution: 20% excellent, 30% good, 30% average, 15% poor, 5% failing
    const performanceLevels: Array<'excellent' | 'good' | 'average' | 'poor' | 'failing'> = [
      ...Array(4).fill('excellent'),
      ...Array(6).fill('good'),
      ...Array(6).fill('average'),
      ...Array(3).fill('poor'),
      ...Array(1).fill('failing'),
    ];

    try {
      // Step 1: Create Academic Year
      updateStepStatus('academic-year', 'running');
      try {
        const currentYear = new Date().getFullYear();
        const academicYearId = `${currentYear}-${currentYear + 1}`;
        
        const existingYears = await academicYearsService.getAll();
        let academicYear = existingYears.find(y => y.academicYearId === academicYearId);
        
        if (!academicYear) {
          academicYear = await academicYearsService.create({
            academicYearId,
            startDate: `${currentYear}-06-01`,
            endDate: `${currentYear + 1}-05-31`,
            status: 'Active',
          });
        }
        createdData.academicYear = academicYear;
        updateStepStatus('academic-year', 'success', `Created: ${academicYearId}`, academicYear);
      } catch (error: any) {
        updateStepStatus('academic-year', 'error', error.message);
        throw error;
      }

      // Step 2: Create Class
      updateStepStatus('class', 'running');
      try {
        const classId = `CLS-SAMPLE-${Date.now().toString(36).toUpperCase()}`;
        const newClass = await classesService.create({
          classId,
          name: 'Class 10-A',
          description: 'Sample class for comprehensive data generation',
          capacity: 40,
          status: 'Active',
        });
        createdData.class = newClass;
        updateStepStatus('class', 'success', `Created: ${newClass.name}`, newClass);
      } catch (error: any) {
        updateStepStatus('class', 'error', error.message);
        throw error;
      }

      // Step 3: Create Section
      updateStepStatus('section', 'running');
      try {
        const sectionId = `SEC-SAMPLE-${Date.now().toString(36).toUpperCase()}`;
        const newSection = await sectionsService.create({
          sectionId,
          name: 'Section A',
          capacity: 40,
          roomNumber: 'Room 101',
          status: 'Active',
        });
        createdData.section = newSection;
        updateStepStatus('section', 'success', `Created: ${newSection.name}`, newSection);
      } catch (error: any) {
        updateStepStatus('section', 'error', error.message);
        throw error;
      }

      // Step 4: Link Class-Section
      updateStepStatus('class-section', 'running');
      try {
        await classesService.addSectionToClass(createdData.class.classId, createdData.section.sectionId);
        updateStepStatus('class-section', 'success', `Linked: ${createdData.class.classId} ↔ ${createdData.section.sectionId}`);
      } catch (error: any) {
        updateStepStatus('class-section', 'success', `Link exists or created`);
      }

      // Step 5: Create Teacher
      updateStepStatus('teacher', 'running');
      try {
        const teacherId = `TCH-SAMPLE-${Date.now().toString(36).toUpperCase()}`;
        const newTeacher = await teachersService.create({
          teacherId,
          name: 'Dr. Sample Teacher',
          email: `sample.teacher.${Date.now()}@school.edu`,
          phone: '+1234567890',
          department: 'Science',
          designation: 'Senior Teacher',
          qualification: 'Ph.D. in Education',
          experience: 10,
          joiningDate: new Date().toISOString().split('T')[0],
          status: 'Active',
        });
        createdData.teacher = newTeacher;
        updateStepStatus('teacher', 'success', `Created: ${newTeacher.name}`, newTeacher);
      } catch (error: any) {
        updateStepStatus('teacher', 'error', error.message);
        throw error;
      }

      // Step 6: Create 3 Subjects
      updateStepStatus('subjects', 'running');
      try {
        const subjectNames = [
          { name: 'Mathematics', code: 'MATH' },
          { name: 'Physics', code: 'PHY' },
          { name: 'Chemistry', code: 'CHEM' },
        ];
        
        for (const subj of subjectNames) {
          const subjectId = `SUB-${subj.code}-${Date.now().toString(36).toUpperCase()}`;
          const newSubject = await subjectsService.create({
            subjectId,
            subjectName: subj.name,
            subjectCode: `${subj.code}-${Date.now().toString(36).slice(-4).toUpperCase()}`,
            classId: createdData.class.classId,
            teacherId: createdData.teacher.teacherId,
            teacherIds: [createdData.teacher.teacherId],
            description: `${subj.name} for sample class`,
            credits: 4,
            hoursPerWeek: 5,
            status: 'Active',
          });
          createdData.subjects.push(newSubject);
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        updateStepStatus('subjects', 'success', `Created: ${createdData.subjects.length} subjects`, createdData.subjects);
      } catch (error: any) {
        updateStepStatus('subjects', 'error', error.message);
        throw error;
      }

      // Step 7: Create 20 Students with varied names
      updateStepStatus('student', 'running');
      try {
        const studentsCreated: any[] = [];
        for (let i = 0; i < 20; i++) {
          const studentId = `STU-SAMPLE-${Date.now()}-${i}`.toUpperCase();
          const timestamp = Date.now();
          const newStudent = await studentsService.create({
            studentId,
            name: studentNames[i] || `Student ${i + 1}`,
            email: `student${i + 1}.${timestamp}@school.edu`,
            phone: `+1234567${String(i).padStart(3, '0')}`,
            dateOfBirth: `2008-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`,
            gender: i % 2 === 0 ? 'Male' : 'Female',
            address: `${i + 1} Student Lane, Education City`,
            classId: createdData.class.classId,
            sectionId: createdData.section.sectionId,
            rollNo: i + 1,
            parentName: `Parent of ${studentNames[i] || `Student ${i + 1}`}`,
            parentContact: `+1234567${String(i + 100).padStart(3, '0')}`,
            parentEmail: `parent${i + 1}.${timestamp}@school.edu`,
            admissionDate: new Date().toISOString().split('T')[0],
            status: 'Active',
          });
          studentsCreated.push(newStudent);
          await new Promise(resolve => setTimeout(resolve, 50));
        }
        createdData.students = studentsCreated;
        updateStepStatus('student', 'success', `Created: ${studentsCreated.length} students`, studentsCreated);
      } catch (error: any) {
        updateStepStatus('student', 'error', error.message);
        throw error;
      }

      // Step 8: Create 2 Exams
      updateStepStatus('exam', 'running');
      try {
        const examNames = [
          { name: 'Mid-Term Examination', type: 'Mid-Term', term: 'Term 1' },
          { name: 'Final Examination', type: 'Final', term: 'Term 2' },
        ];
        const examsCreated: any[] = [];

        for (let examIdx = 0; examIdx < 2; examIdx++) {
          const examId = `EXM-SAMPLE-${Date.now()}-${examIdx}`.toUpperCase();
          const startDate = new Date();
          startDate.setDate(startDate.getDate() + (examIdx * 30) + 7);
          const endDate = new Date(startDate);
          endDate.setDate(endDate.getDate() + 5);

          const examSubjects = createdData.subjects.map((subj: any, idx: number) => ({
            subjectId: subj.subjectId,
            subjectName: subj.subjectName || subj.name,
            subjectCode: subj.subjectCode || subj.code,
            maxMarks: 100,
            passingMarks: 40,
            examDate: new Date(startDate.getTime() + idx * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            duration: 180,
          }));

          const newExam = await examsService.create({
            examId,
            examName: examNames[examIdx].name,
            examType: examNames[examIdx].type,
            academicYear: createdData.academicYear.academicYearId,
            classId: createdData.class.classId,
            term: examNames[examIdx].term,
            startDate: startDate.toISOString().split('T')[0],
            endDate: endDate.toISOString().split('T')[0],
            totalMarks: 300,
            passingMarks: 120,
            subjects: examSubjects,
            status: 'Scheduled',
          });
          examsCreated.push(newExam);
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        createdData.exams = examsCreated;
        updateStepStatus('exam', 'success', `Created: ${examsCreated.length} exams`, examsCreated);
      } catch (error: any) {
        updateStepStatus('exam', 'error', error.message);
        throw error;
      }

      // Step 9: Create Exam Timetable
      updateStepStatus('timetable', 'running');
      try {
        const timetableEntries: any[] = [];
        for (const exam of createdData.exams) {
          const startDate = new Date(exam.startDate);
          for (let i = 0; i < createdData.subjects.length; i++) {
            const subj = createdData.subjects[i];
            const examDate = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
            
            const entry = {
              timetableId: `TT-${Date.now()}-${exam.examId}-${i}`.toUpperCase(),
              examId: exam.examId,
              examName: exam.examName,
              classId: createdData.class.classId,
              className: createdData.class.name,
              subjectId: subj.subjectId,
              subjectName: subj.subjectName || subj.name,
              subjectCode: subj.subjectCode || subj.code,
              date: examDate.toISOString().split('T')[0],
              startTime: '09:00',
              endTime: '12:00',
              duration: 180,
              room: `Room ${101 + i}`,
              invigilator: createdData.teacher.name,
              maxMarks: 100,
              instructions: 'Bring calculator and writing materials.',
              status: 'Scheduled',
            };
            timetableEntries.push(entry);
          }
        }

        const existingTimetable = JSON.parse(localStorage.getItem('exam_timetable') || '[]');
        localStorage.setItem('exam_timetable', JSON.stringify([...existingTimetable, ...timetableEntries]));
        
        createdData.timetable = timetableEntries;
        updateStepStatus('timetable', 'success', `Created: ${timetableEntries.length} timetable entries`, timetableEntries);
      } catch (error: any) {
        updateStepStatus('timetable', 'error', error.message);
        throw error;
      }

      // Step 10: Create Marks for all students and exams
      updateStepStatus('marks', 'running');
      try {
        const marksEntries: any[] = [];
        let markCounter = 0;

        // Shuffle performance levels for randomness
        const shuffledLevels = [...performanceLevels].sort(() => Math.random() - 0.5);

        for (const exam of createdData.exams) {
          for (let studentIdx = 0; studentIdx < createdData.students.length; studentIdx++) {
            const student = createdData.students[studentIdx];
            const performanceLevel = shuffledLevels[studentIdx] || 'average';
            const subjectMarks = generateRandomMarks(performanceLevel);

            for (let subjIdx = 0; subjIdx < createdData.subjects.length; subjIdx++) {
              const subj = createdData.subjects[subjIdx];
              const markId = `MRK-${Date.now()}-${markCounter++}`.toUpperCase();
              const marksObtained = subjectMarks[subjIdx];
              const percentage = (marksObtained / 100) * 100;

              const newMark = await marksService.create({
                markId,
                studentId: student.studentId,
                examId: exam.examId,
                subjectId: subj.subjectId,
                marksObtained,
                totalMarks: 100,
                grade: calculateGrade(percentage),
                remarks: marksObtained >= 80 ? 'Excellent performance' : marksObtained >= 60 ? 'Good performance' : marksObtained >= 40 ? 'Satisfactory' : 'Needs improvement',
                isAbsent: false,
                status: 'Published',
                enteredBy: 'System',
              });
              marksEntries.push(newMark);
              await new Promise(resolve => setTimeout(resolve, 30));
            }
          }
        }

        createdData.marks = marksEntries;
        const avgMarks = marksEntries.reduce((sum, m) => sum + (m.marksObtained || 0), 0) / marksEntries.length;
        updateStepStatus('marks', 'success', `Created: ${marksEntries.length} mark entries (Avg: ${Math.round(avgMarks)}%)`, marksEntries);
      } catch (error: any) {
        updateStepStatus('marks', 'error', error.message);
        throw error;
      }

      // Step 11: Create Results for all students and exams
      updateStepStatus('result', 'running');
      try {
        const resultsCreated: any[] = [];
        let resultCounter = 0;

        for (const exam of createdData.exams) {
          const studentResults: any[] = [];

          for (const student of createdData.students) {
            const studentMarks = createdData.marks.filter(
              (m: any) => m.studentId === student.studentId && m.examId === exam.examId
            );

            if (studentMarks.length === 0) continue;

            const totalMarks = studentMarks.reduce((sum: number, m: any) => sum + (m.marksObtained || 0), 0);
            const totalMaxMarks = studentMarks.length * 100;
            const percentage = (totalMarks / totalMaxMarks) * 100;
            const overallGrade = calculateGrade(percentage);
            const isPassed = percentage >= 40;

            const resultId = `RES-${Date.now()}-${resultCounter++}`.toUpperCase();
            const subjectResults = studentMarks.map((mark: any, idx: number) => {
              const maxMarks = mark.totalMarks || 100;
              const marksObtained = mark.marksObtained;
              const pct = (marksObtained / maxMarks) * 100;
              const passed = pct >= 40;
              return {
                subjectId: mark.subjectId,
                subjectName: createdData.subjects[idx]?.subjectName || createdData.subjects[idx]?.name || 'Subject',
                maxMarks,
                marksObtained,
                grade: mark.grade,
                isPassed: passed,
              };
            });

            const newResult = await resultsService.create({
              resultId,
              studentId: student.studentId,
              studentName: student.name,
              examId: exam.examId,
              examName: exam.examName,
              classId: createdData.class.classId,
              subjects: subjectResults,
              totalMaxMarks,
              totalMarksObtained: totalMarks,
              percentage: Math.round(percentage * 100) / 100,
              grade: overallGrade,
              rank: 0, // Will be calculated after all results are created
              isPassed,
              status: 'Published',
              remarks: isPassed ? 'Congratulations on passing the examination!' : 'Please work harder to improve.',
            });

            studentResults.push({ result: newResult, percentage });
            resultsCreated.push(newResult);

            // Publish the result
            try {
              await resultsService.publish(resultId);
            } catch (publishError: any) {
              console.warn(`Failed to publish result ${resultId}:`, publishError);
            }

            await new Promise(resolve => setTimeout(resolve, 50));
          }

          // Calculate and update ranks for this exam
          studentResults.sort((a, b) => b.percentage - a.percentage);
          for (let rank = 0; rank < studentResults.length; rank++) {
            const result = studentResults[rank].result;
            // Note: Rank update would require a separate API call if supported
            // For now, results are created with rank 0
          }
        }

        createdData.results = resultsCreated;
        const passedCount = resultsCreated.filter((r: any) => r.isPassed).length;
        const avgPercentage = resultsCreated.reduce((sum: number, r: any) => sum + (r.percentage || 0), 0) / resultsCreated.length;
        updateStepStatus('result', 'success', `Created & Published: ${resultsCreated.length} results (${passedCount} passed, Avg: ${avgPercentage.toFixed(1)}%)`, resultsCreated);
      } catch (error: any) {
        updateStepStatus('result', 'error', error.message);
        throw error;
      }

      // Step 12: Create Student Habits (Template 3) for all students
      updateStepStatus('student-habits', 'running');
      try {
        if (createdData.students && createdData.students.length > 0 && createdData.academicYear) {
          const habitNames = ['Courteous', 'Art/Craft', 'Responsibility', 'Systematic', 'Sports', 'Elocution', 'Gen.Knowledge', 'Cultural Activities', 'Cleanliness', 'Hindi Oral', 'English Oral'];
          let totalHabitsCreated = 0;
          
          const getRandomGrade = (): 'A' | 'B' | 'C' => {
            const rand = Math.random();
            if (rand > 0.6) return 'A';
            if (rand > 0.3) return 'B';
            return 'C';
          };
          
          for (const student of createdData.students) {
            for (const habitName of habitNames) {
              try {
                const habitId = `HABIT-${student.studentId}-${habitName}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`.toUpperCase();
                await studentHabitsService.create({
                  habitId,
                  studentId: student.studentId,
                  academicYear: createdData.academicYear,
                  habitName: habitName as any,
                  term1Grade: getRandomGrade(),
                  term2Grade: getRandomGrade(),
                });
                totalHabitsCreated++;
                await new Promise(resolve => setTimeout(resolve, 20));
              } catch (error: any) {
                console.warn(`Failed to create habit ${habitName} for ${student.name}:`, error);
                // Continue with next habit
              }
            }
          }
          
          log.push({ step: 'Student Habits', status: 'created' });
          updateStepStatus('student-habits', 'success', `Created: ${totalHabitsCreated} habits for ${createdData.students.length} students`);
        } else {
          updateStepStatus('student-habits', 'success', `Skipped - No students or academic year`);
        }
      } catch (error: any) {
        log.push({ step: 'Student Habits', status: 'failed', reason: error.message });
        updateStepStatus('student-habits', 'error', error.message);
      }

      // Step 13: Report Card
      updateStepStatus('report-card', 'running');
      try {
        if (createdData.results && createdData.results.length > 0) {
          const resultCount = createdData.results.length;
          const avgPercentage = createdData.results.reduce((sum: number, r: any) => sum + (r.percentage || 0), 0) / resultCount;
          
          updateStepStatus('report-card', 'success', `Ready: ${resultCount} report cards available (Avg: ${avgPercentage.toFixed(1)}%)`, {
            totalResults: resultCount,
            averagePercentage: avgPercentage.toFixed(1),
            note: 'Report cards are generated dynamically from results in the NestJS backend',
          });
        } else {
          updateStepStatus('report-card', 'success', `Report cards will be available once results are created`);
        }
      } catch (error: any) {
        updateStepStatus('report-card', 'success', `Report cards can be generated from results in Report Cards module`);
      }

      setGeneratedData(createdData);
      toast.success('🎉 Comprehensive Sample Data Generated Successfully!', {
        description: `Created ${createdData.students.length} students, ${createdData.exams.length} exams, and ${createdData.results.length} results with varied performance levels for realistic charts!`,
        duration: 10000,
      });

    } catch (error: any) {
      console.error('Error generating sample data:', error);
      toast.error('Failed to generate sample data', {
        description: error.message,
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // V2: Generate End-to-End Sample Data with Internal/External Marks System (Direct Entry - 80 marks)
  const generateEndToEndSampleDataV2Direct = async () => {
    setIsGenerating(true);
    resetSteps('v2');

    const createdData: any = {
      academicYear: null,
      class: null,
      section: null,
      teacher: null,
      subjects: [],
      students: [],
      unitTestExams: [],
      finalExams: [],
      timetable: [],
      unitTestMarks: [],
      finalExamMarks: [],
      results: [],
      // V3: Online Exams
      onlinePaper: null,
      paperRule: null,
      questions: [],
      attempts: [],
      responses: [],
    };

    // Student names for variety
    const studentNames = [
      'Aarav Sharma', 'Priya Patel', 'Rohan Kumar', 'Ananya Singh', 'Vikram Mehta',
      'Sneha Reddy', 'Arjun Nair', 'Kavya Iyer', 'Aditya Joshi', 'Meera Desai',
      'Rahul Gupta', 'Divya Agarwal', 'Karan Malhotra', 'Pooja Shah', 'Nikhil Verma',
      'Shreya Kapoor', 'Aman Tiwari', 'Isha Choudhury', 'Ravi Menon', 'Neha Krishnan'
    ];

    // Performance distribution: 20% excellent, 30% good, 30% average, 15% poor, 5% failing
    const performanceLevels: Array<'excellent' | 'good' | 'average' | 'poor' | 'failing'> = [
      ...Array(4).fill('excellent'),
      ...Array(6).fill('good'),
      ...Array(6).fill('average'),
      ...Array(3).fill('poor'),
      ...Array(1).fill('failing'),
    ];

    try {
      // Step 1: Get or Create Academic Year
      updateStepStatus('academic-year', 'running');
      try {
        const currentYear = new Date().getFullYear();
        const academicYearId = `${currentYear}-${currentYear + 1}`;
        const startDate = `${currentYear}-06-01`;
        const endDate = `${currentYear + 1}-05-31`;
        
        let academicYear;
        
        // First, try to find existing academic year by fetching all and matching by date range
        try {
          const allAcademicYears = await academicYearsService.getAll();
          const existingYear = allAcademicYears.find(
            (ay) => ay.startDate === startDate && ay.endDate === endDate
          );
          
          if (existingYear) {
            academicYear = existingYear;
            updateStepStatus('academic-year', 'success', `Using existing: ${academicYear.academicYearId || academicYearId}`);
          } else {
            // Not found, try to create
            try {
              academicYear = await academicYearsService.create({
                academicYearId,
                startDate,
                endDate,
                status: 'Active',
              });
              updateStepStatus('academic-year', 'success', `Created: ${academicYear.academicYearId || academicYearId}`);
            } catch (createError: any) {
              if (createError.message?.includes('already exists')) {
                // Creation failed but says it exists, try to find it again
                const allYearsRetry = await academicYearsService.getAll();
                const foundYear = allYearsRetry.find(
                  (ay) => ay.startDate === startDate && ay.endDate === endDate
                );
                
                if (foundYear) {
                  academicYear = foundYear;
                  updateStepStatus('academic-year', 'success', `Found after conflict: ${academicYear.academicYearId || academicYearId}`);
                } else {
                  // Still not found, but creation said it exists - use the ID we tried
                  const anyYear = allYearsRetry.find(
                    (ay) => ay.academicYearId === academicYearId
                  );
                  if (anyYear) {
                    academicYear = anyYear;
                    updateStepStatus('academic-year', 'success', `Found by ID: ${academicYear.academicYearId}`);
                  } else {
                    throw createError;
                  }
                }
              } else {
                throw createError;
              }
            }
          }
        } catch (error: any) {
          // If getAll fails, try to create directly
          try {
            academicYear = await academicYearsService.create({
              academicYearId,
              startDate,
              endDate,
              status: 'Active',
            });
            updateStepStatus('academic-year', 'success', `Created: ${academicYear.academicYearId || academicYearId}`);
          } catch (createError: any) {
            if (createError.message?.includes('already exists')) {
              // Try one more time to get it
              const allYearsRetry = await academicYearsService.getAll();
              const foundYear = allYearsRetry.find(
                (ay) => (ay.startDate === startDate && ay.endDate === endDate) || ay.academicYearId === academicYearId
              );
              if (foundYear) {
                academicYear = foundYear;
                updateStepStatus('academic-year', 'success', `Found: ${academicYear.academicYearId || academicYearId}`);
              } else {
                updateStepStatus('academic-year', 'error', createError.message);
                throw createError;
              }
            } else {
              updateStepStatus('academic-year', 'error', createError.message);
              throw createError;
            }
          }
        }
        
        createdData.academicYear = academicYear;
      } catch (error: any) {
        updateStepStatus('academic-year', 'error', error.message);
        throw error;
      }

      // Step 2: Create Class
      updateStepStatus('class', 'running');
      try {
        const classId = `CLS-V2-DIRECT-${Date.now().toString(36).toUpperCase()}`;
        const newClass = await classesService.create({
          classId,
          name: 'Class 10-C (Direct Entry)',
          description: 'Sample class for V2 direct entry (80 marks) system',
          capacity: 40,
          status: 'Active',
        });
        createdData.class = newClass;
        updateStepStatus('class', 'success', `Created: ${newClass.name}`, newClass);
      } catch (error: any) {
        updateStepStatus('class', 'error', error.message);
        throw error;
      }

      // Step 3: Create Section
      updateStepStatus('section', 'running');
      try {
        const sectionId = `SEC-V2-DIRECT-${Date.now().toString(36).toUpperCase()}`;
        const newSection = await sectionsService.create({
          sectionId,
          name: 'Section C',
          capacity: 40,
          roomNumber: 'Room 103',
          status: 'Active',
        });
        createdData.section = newSection;
        updateStepStatus('section', 'success', `Created: ${newSection.name}`, newSection);
      } catch (error: any) {
        updateStepStatus('section', 'error', error.message);
        throw error;
      }

      // Step 4: Link Class-Section
      updateStepStatus('class-section', 'running');
      try {
        await classesService.addSectionToClass(createdData.class.classId, createdData.section.sectionId);
        updateStepStatus('class-section', 'success', 'Linked class and section');
      } catch (error: any) {
        updateStepStatus('class-section', 'error', error.message);
        // Don't throw - this might already be linked, continue anyway
        console.warn('Class-section link may already exist:', error.message);
      }

      // Step 5: Create Teacher
      updateStepStatus('teacher', 'running');
      try {
        const teacherId = `TCH-V2-DIRECT-${Date.now().toString(36).toUpperCase()}`;
        const newTeacher = await teachersService.create({
          teacherId,
          name: 'Dr. Direct Entry Teacher',
          email: `direct.teacher.${Date.now()}@school.edu`,
          phone: '+1234567890',
          department: 'Science',
          qualification: 'Ph.D. in Education',
          experience: 15,
          status: 'Active',
        });
        createdData.teacher = newTeacher;
        updateStepStatus('teacher', 'success', `Created: ${newTeacher.name}`, newTeacher);
      } catch (error: any) {
        updateStepStatus('teacher', 'error', error.message);
        throw error;
      }

      // Step 6: Create Subjects
      updateStepStatus('subjects', 'running');
      try {
        const subjectNames = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English'];
        const subjectCodes = ['MATH', 'PHY', 'CHEM', 'BIO', 'ENG'];
        
        for (let i = 0; i < subjectNames.length; i++) {
          const subjectId = `SUB-V2-DIRECT-${subjectCodes[i]}-${Date.now().toString(36).toUpperCase()}`;
          const subjectCode = `${subjectCodes[i]}-DIRECT-${Date.now().toString(36).toUpperCase()}`;
          
          // Check if subject already exists
          const existingSubjects = await subjectsService.getAll({ classId: createdData.class.classId });
          let existingSubject = existingSubjects.find(s => s.subjectCode === subjectCode || s.subjectName === subjectNames[i]);
          
          if (!existingSubject) {
            const newSubject = await subjectsService.create({
              subjectId,
              subjectName: subjectNames[i],
              subjectCode,
              classId: createdData.class.classId,
              teacherId: createdData.teacher.teacherId,
              credits: 4,
              status: 'Active',
            });
            createdData.subjects.push(newSubject);
          } else {
            createdData.subjects.push(existingSubject);
          }
        }
        updateStepStatus('subjects', 'success', `Created ${createdData.subjects.length} subjects`);
      } catch (error: any) {
        updateStepStatus('subjects', 'error', error.message);
        throw error;
      }

      // Step 7: Create Students
      updateStepStatus('students', 'running');
      try {
        for (let i = 0; i < 20; i++) {
          const studentId = `STU-V2-DIRECT-${Date.now()}-${i}`;
          const name = studentNames[i % studentNames.length];
          const performance = performanceLevels[i % performanceLevels.length];
          
          const newStudent = await studentsService.create({
            studentId,
            name,
            classId: createdData.class.classId,
            sectionId: createdData.section.sectionId,
            rollNo: i + 1,
            dateOfBirth: `2008-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`,
            gender: Math.random() > 0.5 ? 'Male' : 'Female',
            email: `${name.toLowerCase().replace(/\s+/g, '.')}.${Date.now()}@school.edu`,
            phone: `+123456789${i}`,
            parentName: `Parent of ${name}`,
            parentPhone: `+123456789${i + 100}`,
            parentEmail: `parent.${name.toLowerCase().replace(/\s+/g, '.')}.${Date.now()}@school.edu`,
            address: `${i + 1} Student Street, Education City`,
            admissionDate: `${new Date().getFullYear()}-01-15`,
            status: 'Active',
          });
          createdData.students.push({ ...newStudent, performance });
        }
        updateStepStatus('students', 'success', `Created ${createdData.students.length} students`);
      } catch (error: any) {
        updateStepStatus('students', 'error', error.message);
        throw error;
      }

      // Step 8: Create Unit Test Exams - 3 for Term 1, 3 for Term 2
      updateStepStatus('unit-test-exams', 'running');
      try {
        // Term 1: Unit Tests 1, 2, 3
        for (let i = 1; i <= 3; i++) {
          const examId = `EXM-UT-T1-${i}-${Date.now().toString(36).toUpperCase()}`;
          const newExam = await examsService.create({
            examId,
            examName: `Unit Test ${i} (Term 1)`,
            examType: 'Unit Test',
            academicYear: createdData.academicYear.academicYearId,
            classId: createdData.class.classId,
            term: 'Term 1',
            startDate: `${new Date().getFullYear()}-${String(6 + i).padStart(2, '0')}-${String(15 + i).padStart(2, '0')}`,
            endDate: `${new Date().getFullYear()}-${String(6 + i).padStart(2, '0')}-${String(15 + i).padStart(2, '0')}`,
            totalMarks: 100,
            passingMarks: 40,
            status: 'Completed',
          });
          createdData.unitTestExams.push(newExam);
        }
        
        // Term 2: Unit Tests 4, 5, 6
        for (let i = 4; i <= 6; i++) {
          const examId = `EXM-UT-T2-${i}-${Date.now().toString(36).toUpperCase()}`;
          const newExam = await examsService.create({
            examId,
            examName: `Unit Test ${i} (Term 2)`,
            examType: 'Unit Test',
            academicYear: createdData.academicYear.academicYearId,
            classId: createdData.class.classId,
            term: 'Term 2',
            startDate: `${new Date().getFullYear()}-${String(9 + (i - 3)).padStart(2, '0')}-${String(15 + (i - 3)).padStart(2, '0')}`,
            endDate: `${new Date().getFullYear()}-${String(9 + (i - 3)).padStart(2, '0')}-${String(15 + (i - 3)).padStart(2, '0')}`,
            totalMarks: 100,
            passingMarks: 40,
            status: 'Completed',
          });
          createdData.unitTestExams.push(newExam);
        }
        
        updateStepStatus('unit-test-exams', 'success', `Created ${createdData.unitTestExams.length} unit test exams (3 Term 1 + 3 Term 2)`);
      } catch (error: any) {
        updateStepStatus('unit-test-exams', 'error', error.message);
        throw error;
      }

      // Step 9: Create Final Exams (2 final exams)
      updateStepStatus('final-exams', 'running');
      try {
        const finalExamNames = ['Mid-Term Examination', 'Final Examination'];
        for (let i = 0; i < 2; i++) {
          const examId = `EXM-FINAL-DIRECT-${i + 1}-${Date.now().toString(36).toUpperCase()}`;
          const newExam = await examsService.create({
            examId,
            examName: finalExamNames[i],
            examType: i === 0 ? 'Mid-Term' : 'Final',
            academicYear: createdData.academicYear.academicYearId,
            classId: createdData.class.classId,
            term: i === 0 ? 'Term 1' : 'Term 2',
            startDate: `${new Date().getFullYear()}-${i === 0 ? '09' : '12'}-01`,
            endDate: `${new Date().getFullYear()}-${i === 0 ? '09' : '12'}-15`,
            totalMarks: 100,
            passingMarks: 40,
            status: 'Scheduled',
          });
          createdData.finalExams.push(newExam);
        }
        updateStepStatus('final-exams', 'success', `Created ${createdData.finalExams.length} final exams`);
      } catch (error: any) {
        updateStepStatus('final-exams', 'error', error.message);
        throw error;
      }

      // Step 10: Generate Unit Test Marks for Term 1 and Term 2
      updateStepStatus('unit-test-marks', 'running');
      try {
        let markCounter = 0;
        const unitTestMarksCreated: any[] = [];

        // Generate unit test marks for each student and subject
        for (const unitTestExam of createdData.unitTestExams) {
          const isTerm1 = unitTestExam.term === 'Term 1';
          const utIndex = isTerm1 ? parseInt(unitTestExam.examName.match(/\d+/)?.[0] || '1') - 1 : parseInt(unitTestExam.examName.match(/\d+/)?.[0] || '4') - 4;

          for (const student of createdData.students) {
            // Generate marks based on performance
            let marksObtained = 75;
            switch (student.performance) {
              case 'excellent': marksObtained = 85 + Math.random() * 10; break;
              case 'good': marksObtained = 75 + Math.random() * 10; break;
              case 'average': marksObtained = 60 + Math.random() * 10; break;
              case 'poor': marksObtained = 45 + Math.random() * 10; break;
              case 'failing': marksObtained = 30 + Math.random() * 10; break;
            }
            marksObtained = Math.min(100, Math.max(0, marksObtained));

            for (const subject of createdData.subjects) {
              const uniqueId = `${Date.now()}-${markCounter++}-${Math.random().toString(36).substr(2, 5)}`;
              const markId = `MRK-UT-${isTerm1 ? 'T1' : 'T2'}-${utIndex + 1}-${uniqueId}`.toUpperCase();

              try {
                const markData: any = {
                  markId,
                  studentId: student.studentId,
                  examId: unitTestExam.examId,
                  subjectId: subject.subjectId,
                  marksObtained,
                  totalMarks: 100,
                  grade: calculateGrade((marksObtained / 100) * 100),
                  remarks: `Unit Test ${utIndex + 1} (${isTerm1 ? 'Term 1' : 'Term 2'})`,
                  isAbsent: false,
                  status: 'Published',
                  enteredBy: 'System',
                  marksType: 'Unit Test',
                };
                if (student.classId) markData.classId = student.classId;
                
                const newMark = await marksService.create(markData);
                unitTestMarksCreated.push(newMark);
                await new Promise(resolve => setTimeout(resolve, 30));
              } catch (error: any) {
                console.error(`Failed to create unit test mark:`, error);
              }
            }
          }
        }

        createdData.unitTestMarks = unitTestMarksCreated;
        updateStepStatus('unit-test-marks', 'success', `Created ${unitTestMarksCreated.length} unit test marks`);
      } catch (error: any) {
        updateStepStatus('unit-test-marks', 'error', error.message);
        throw error;
      }

      // Step 11: Create PT, NB, SE, and Exam entries separately for Term 1 and Term 2
      updateStepStatus('final-exam-marks', 'running');
      try {
        let markCounter = 0;
        const allMarksCreated: any[] = [];

        // Get Term 1 and Term 2 exams
        const term1Exam = createdData.finalExams.find((e: any) => e.term === 'Term 1');
        const term2Exam = createdData.finalExams.find((e: any) => e.term === 'Term 2');

        if (!term1Exam || !term2Exam) {
          throw new Error('Term 1 or Term 2 exam not found');
        }

        for (const student of createdData.students) {
          for (const subject of createdData.subjects) {
            // ========== TERM 1 ==========
            
            // 1. Calculate PT from Unit Test averages (Term 1)
            const term1UnitTests = createdData.unitTestMarks.filter((m: any) => {
              const exam = createdData.unitTestExams.find((e: any) => e.examId === m.examId);
              return exam && exam.term === 'Term 1' && m.studentId === student.studentId && m.subjectId === subject.subjectId;
            });
            
            let term1PT = 0;
            if (term1UnitTests.length > 0) {
              const avgUnitTest = term1UnitTests.reduce((sum: number, m: any) => sum + (parseFloat(m.marksObtained) || 0), 0) / term1UnitTests.length;
              term1PT = Math.min(10, Math.max(0, (avgUnitTest / 100) * 10)); // Scale to 10
            } else {
              // Default based on performance
              switch (student.performance) {
                case 'excellent': term1PT = 8 + Math.random() * 2; break;
                case 'good': term1PT = 7 + Math.random() * 1.5; break;
                case 'average': term1PT = 5.5 + Math.random() * 1.5; break;
                case 'poor': term1PT = 4 + Math.random() * 1; break;
                case 'failing': term1PT = 2 + Math.random() * 2; break;
              }
              term1PT = Math.min(10, Math.max(0, term1PT));
            }

            // Generate NB and SE for Term 1
            let term1NB = 0;
            switch (student.performance) {
              case 'excellent': term1NB = 4 + Math.random() * 1; break;
              case 'good': term1NB = 3.5 + Math.random() * 1; break;
              case 'average': term1NB = 2.5 + Math.random() * 1; break;
              case 'poor': term1NB = 2 + Math.random() * 0.5; break;
              case 'failing': term1NB = 1 + Math.random() * 1; break;
            }
            term1NB = Math.min(5, Math.max(0, term1NB));

            let term1SE = 0;
            switch (student.performance) {
              case 'excellent': term1SE = 4.5 + Math.random() * 0.5; break;
              case 'good': term1SE = 3.5 + Math.random() * 1; break;
              case 'average': term1SE = 3 + Math.random() * 1; break;
              case 'poor': term1SE = 2.5 + Math.random() * 0.5; break;
              case 'failing': term1SE = 1.5 + Math.random() * 1; break;
            }
            term1SE = Math.min(5, Math.max(0, term1SE));

            // Generate Mid-Term external marks (80 marks)
            let term1External = 0;
            switch (student.performance) {
              case 'excellent': term1External = 70 + Math.random() * 8; break;
              case 'good': term1External = 58 + Math.random() * 10; break;
              case 'average': term1External = 45 + Math.random() * 12; break;
              case 'poor': term1External = 32 + Math.random() * 10; break;
              case 'failing': term1External = 18 + Math.random() * 12; break;
            }
            term1External = Math.min(80, Math.max(0, term1External));

            // Create PT entry for Term 1
            try {
              const uniqueId = `${Date.now()}-${markCounter++}-${Math.random().toString(36).substr(2, 5)}`;
              const ptMarkId = `MRK-T1-PT-${uniqueId}`.toUpperCase();
              const ptMarkData: any = {
                markId: ptMarkId,
                studentId: student.studentId,
                examId: term1Exam.examId,
                subjectId: subject.subjectId,
                marksObtained: term1PT,
                totalMarks: 10,
                grade: calculateGrade((term1PT / 10) * 100),
                remarks: `Periodic Test (Term 1) - Average of ${term1UnitTests.length} unit tests`,
                isAbsent: false,
                status: 'Published',
                enteredBy: 'System',
                marksType: 'Periodic Test',
                unitTestMarks: term1PT,
              };
              if (student.classId) ptMarkData.classId = student.classId;
              await marksService.create(ptMarkData);
              allMarksCreated.push(ptMarkData);
              await new Promise(resolve => setTimeout(resolve, 30));
            } catch (error: any) {
              console.error(`Failed to create PT for Term 1:`, error);
            }

            // Create NB entry for Term 1
            try {
              const uniqueId = `${Date.now()}-${markCounter++}-${Math.random().toString(36).substr(2, 5)}`;
              const nbMarkId = `MRK-T1-NB-${uniqueId}`.toUpperCase();
              const nbMarkData: any = {
                markId: nbMarkId,
                studentId: student.studentId,
                examId: term1Exam.examId,
                subjectId: subject.subjectId,
                marksObtained: term1NB,
                totalMarks: 5,
                grade: calculateGrade((term1NB / 5) * 100),
                remarks: 'Notebook (Term 1)',
                isAbsent: false,
                status: 'Published',
                enteredBy: 'System',
                marksType: 'Notebook',
                assignmentMarks: term1NB,
              };
              if (student.classId) nbMarkData.classId = student.classId;
              await marksService.create(nbMarkData);
              allMarksCreated.push(nbMarkData);
              await new Promise(resolve => setTimeout(resolve, 30));
            } catch (error: any) {
              console.error(`Failed to create NB for Term 1:`, error);
            }

            // Create SE entry for Term 1
            try {
              const uniqueId = `${Date.now()}-${markCounter++}-${Math.random().toString(36).substr(2, 5)}`;
              const seMarkId = `MRK-T1-SE-${uniqueId}`.toUpperCase();
              const seMarkData: any = {
                markId: seMarkId,
                studentId: student.studentId,
                examId: term1Exam.examId,
                subjectId: subject.subjectId,
                marksObtained: term1SE,
                totalMarks: 5,
                grade: calculateGrade((term1SE / 5) * 100),
                remarks: 'Subject Enrichment (Term 1)',
                isAbsent: false,
                status: 'Published',
                enteredBy: 'System',
                marksType: 'Subject Enrichment',
                attendanceMarks: term1SE,
              };
              if (student.classId) seMarkData.classId = student.classId;
              await marksService.create(seMarkData);
              allMarksCreated.push(seMarkData);
              await new Promise(resolve => setTimeout(resolve, 30));
            } catch (error: any) {
              console.error(`Failed to create SE for Term 1:`, error);
            }

            // Create Mid-Term Exam entry (80 marks external)
            try {
              const uniqueId = `${Date.now()}-${markCounter++}-${Math.random().toString(36).substr(2, 5)}`;
              const midTermMarkId = `MRK-T1-MID-${uniqueId}`.toUpperCase();
              const midTermMarkData: any = {
                markId: midTermMarkId,
                studentId: student.studentId,
                examId: term1Exam.examId,
                subjectId: subject.subjectId,
                marksObtained: term1External,
                totalMarks: 80,
                grade: calculateGrade((term1External / 80) * 100),
                remarks: 'Mid-Term Examination (Half Yearly) - 80 marks',
                isAbsent: false,
                status: 'Published',
                enteredBy: 'System',
                marksType: 'Mid-Term',
                externalMarks: term1External,
              };
              if (student.classId) midTermMarkData.classId = student.classId;
              await marksService.create(midTermMarkData);
              allMarksCreated.push(midTermMarkData);
              await new Promise(resolve => setTimeout(resolve, 30));
            } catch (error: any) {
              console.error(`Failed to create Mid-Term:`, error);
            }

            // ========== TERM 2 ==========
            
            // 1. Calculate PT from Unit Test averages (Term 2)
            const term2UnitTests = createdData.unitTestMarks.filter((m: any) => {
              const exam = createdData.unitTestExams.find((e: any) => e.examId === m.examId);
              return exam && exam.term === 'Term 2' && m.studentId === student.studentId && m.subjectId === subject.subjectId;
            });
            
            let term2PT = 0;
            if (term2UnitTests.length > 0) {
              const avgUnitTest = term2UnitTests.reduce((sum: number, m: any) => sum + (parseFloat(m.marksObtained) || 0), 0) / term2UnitTests.length;
              term2PT = Math.min(10, Math.max(0, (avgUnitTest / 100) * 10)); // Scale to 10
            } else {
              // Default based on performance
              switch (student.performance) {
                case 'excellent': term2PT = 9 + Math.random() * 1; break;
                case 'good': term2PT = 8 + Math.random() * 1.5; break;
                case 'average': term2PT = 6.5 + Math.random() * 1.5; break;
                case 'poor': term2PT = 5 + Math.random() * 1; break;
                case 'failing': term2PT = 3 + Math.random() * 2; break;
              }
              term2PT = Math.min(10, Math.max(0, term2PT));
            }

            // Generate NB and SE for Term 2
            let term2NB = 0;
            switch (student.performance) {
              case 'excellent': term2NB = 4.5 + Math.random() * 0.5; break;
              case 'good': term2NB = 4 + Math.random() * 1; break;
              case 'average': term2NB = 3 + Math.random() * 1; break;
              case 'poor': term2NB = 2.5 + Math.random() * 0.5; break;
              case 'failing': term2NB = 1.5 + Math.random() * 1; break;
            }
            term2NB = Math.min(5, Math.max(0, term2NB));

            let term2SE = 0;
            switch (student.performance) {
              case 'excellent': term2SE = 5; break;
              case 'good': term2SE = 4 + Math.random() * 1; break;
              case 'average': term2SE = 3.5 + Math.random() * 1; break;
              case 'poor': term2SE = 3 + Math.random() * 0.5; break;
              case 'failing': term2SE = 2 + Math.random() * 1; break;
            }
            term2SE = Math.min(5, Math.max(0, term2SE));

            // Generate Final external marks (80 marks)
            let term2External = 0;
            switch (student.performance) {
              case 'excellent': term2External = 72 + Math.random() * 6; break;
              case 'good': term2External = 60 + Math.random() * 10; break;
              case 'average': term2External = 47 + Math.random() * 12; break;
              case 'poor': term2External = 34 + Math.random() * 10; break;
              case 'failing': term2External = 20 + Math.random() * 12; break;
            }
            term2External = Math.min(80, Math.max(0, term2External));

            // Create PT entry for Term 2
            try {
              const uniqueId = `${Date.now()}-${markCounter++}-${Math.random().toString(36).substr(2, 5)}`;
              const ptMarkId = `MRK-T2-PT-${uniqueId}`.toUpperCase();
              const ptMarkData: any = {
                markId: ptMarkId,
                studentId: student.studentId,
                examId: term2Exam.examId,
                subjectId: subject.subjectId,
                marksObtained: term2PT,
                totalMarks: 10,
                grade: calculateGrade((term2PT / 10) * 100),
                remarks: `Periodic Test (Term 2) - Average of ${term2UnitTests.length} unit tests`,
                isAbsent: false,
                status: 'Published',
                enteredBy: 'System',
                marksType: 'Periodic Test',
                unitTestMarks: term2PT,
              };
              if (student.classId) ptMarkData.classId = student.classId;
              await marksService.create(ptMarkData);
              allMarksCreated.push(ptMarkData);
              await new Promise(resolve => setTimeout(resolve, 30));
            } catch (error: any) {
              console.error(`Failed to create PT for Term 2:`, error);
            }

            // Create NB entry for Term 2
            try {
              const uniqueId = `${Date.now()}-${markCounter++}-${Math.random().toString(36).substr(2, 5)}`;
              const nbMarkId = `MRK-T2-NB-${uniqueId}`.toUpperCase();
              const nbMarkData: any = {
                markId: nbMarkId,
                studentId: student.studentId,
                examId: term2Exam.examId,
                subjectId: subject.subjectId,
                marksObtained: term2NB,
                totalMarks: 5,
                grade: calculateGrade((term2NB / 5) * 100),
                remarks: 'Notebook (Term 2)',
                isAbsent: false,
                status: 'Published',
                enteredBy: 'System',
                marksType: 'Notebook',
                assignmentMarks: term2NB,
              };
              if (student.classId) nbMarkData.classId = student.classId;
              await marksService.create(nbMarkData);
              allMarksCreated.push(nbMarkData);
              await new Promise(resolve => setTimeout(resolve, 30));
            } catch (error: any) {
              console.error(`Failed to create NB for Term 2:`, error);
            }

            // Create SE entry for Term 2
            try {
              const uniqueId = `${Date.now()}-${markCounter++}-${Math.random().toString(36).substr(2, 5)}`;
              const seMarkId = `MRK-T2-SE-${uniqueId}`.toUpperCase();
              const seMarkData: any = {
                markId: seMarkId,
                studentId: student.studentId,
                examId: term2Exam.examId,
                subjectId: subject.subjectId,
                marksObtained: term2SE,
                totalMarks: 5,
                grade: calculateGrade((term2SE / 5) * 100),
                remarks: 'Subject Enrichment (Term 2)',
                isAbsent: false,
                status: 'Published',
                enteredBy: 'System',
                marksType: 'Subject Enrichment',
                attendanceMarks: term2SE,
              };
              if (student.classId) seMarkData.classId = student.classId;
              await marksService.create(seMarkData);
              allMarksCreated.push(seMarkData);
              await new Promise(resolve => setTimeout(resolve, 30));
            } catch (error: any) {
              console.error(`Failed to create SE for Term 2:`, error);
            }

            // Create Final Exam entry (80 marks external)
            try {
              const uniqueId = `${Date.now()}-${markCounter++}-${Math.random().toString(36).substr(2, 5)}`;
              const finalMarkId = `MRK-T2-FINAL-${uniqueId}`.toUpperCase();
              const finalMarkData: any = {
                markId: finalMarkId,
                studentId: student.studentId,
                examId: term2Exam.examId,
                subjectId: subject.subjectId,
                marksObtained: term2External,
                totalMarks: 80,
                grade: calculateGrade((term2External / 80) * 100),
                remarks: 'Final Examination (Annual) - 80 marks',
                isAbsent: false,
                status: 'Published',
                enteredBy: 'System',
                marksType: 'Final',
                externalMarks: term2External,
              };
              if (student.classId) finalMarkData.classId = student.classId;
              await marksService.create(finalMarkData);
              allMarksCreated.push(finalMarkData);
              await new Promise(resolve => setTimeout(resolve, 30));
            } catch (error: any) {
              console.error(`Failed to create Final Exam:`, error);
            }
          }
        }

        createdData.finalExamMarks = allMarksCreated;
        updateStepStatus('final-exam-marks', 'success', `Created ${allMarksCreated.length} marks (PT, NB, SE, Exams for Term 1 & Term 2)`);
      } catch (error: any) {
        updateStepStatus('final-exam-marks', 'error', error.message);
        throw error;
      }

      // Step 12: Calculate Results for BOTH Term 1 and Term 2
      updateStepStatus('results', 'running');
      try {
        if (createdData.finalExams && createdData.finalExams.length > 0) {
          if (!createdData.results) {
            createdData.results = [];
          }
          
          // Calculate results for each exam (Term 1 and Term 2)
          for (const finalExam of createdData.finalExams) {
            for (const student of createdData.students || []) {
              try {
                const result = await resultsService.calculateFromMarks(
                  student.studentId,
                  finalExam.examId,
                  createdData.class.classId,
                  true, // useVersion2
                  'average' // unitTestMethod
                );
                createdData.results.push(result);
                
                // Small delay to avoid race conditions
                await new Promise(resolve => setTimeout(resolve, 100));
              } catch (error: any) {
                console.error(`Error calculating result for ${student.studentId} - ${finalExam.examName}:`, error);
                // Continue with next student/exam instead of stopping
              }
            }
          }
          
          updateStepStatus('results', 'success', `Calculated ${createdData.results.length} results (Term 1 & Term 2)`);
        } else {
          updateStepStatus('results', 'success', 'Skipped - No final exams available');
        }
      } catch (error: any) {
        updateStepStatus('results', 'error', error.message);
        // Don't throw - allow V3 steps to run even if results fail
        console.error('Results calculation failed, but continuing with V3 steps:', error);
      }

      // ========== V3: ONLINE EXAMS MODULE (Direct Entry) ==========
      // Always attempt V3 steps even if previous steps had issues
      
      // Step 13: Create Online Exam Paper
      updateStepStatus('online-exam', 'running');
      try {
        // Find any available exam to link to
        let baseExam = null;
        
        if (createdData.finalExams && createdData.finalExams.length > 0) {
          baseExam = createdData.finalExams[0];
        } else if (createdData.unitTestExams && createdData.unitTestExams.length > 0) {
          baseExam = createdData.unitTestExams[0];
        } else if (createdData.finalExams && createdData.finalExams.length > 0) {
          baseExam = createdData.finalExams[createdData.finalExams.length - 1];
        }
        
        if (!baseExam || !baseExam.examId) {
          // Try to get any exam from the service as last resort
          try {
            const allExams = await examsService.getAll({});
            if (allExams && allExams.length > 0) {
              baseExam = allExams[0];
              console.log('Using existing exam from database:', baseExam.examId);
            } else {
              throw new Error('No exams found in system. Please create an exam first.');
            }
          } catch (fetchError: any) {
            throw new Error(`No exams available: ${fetchError.message}`);
          }
        }
        
        console.log('Creating online paper linked to exam:', baseExam.examId);
        const paperId = `PAPER-DIRECT-${Date.now().toString(36).toUpperCase()}`;
        
        const onlinePaper = await examPapersService.create({
          paperId,
          examId: baseExam.examId,
          paperTitle: 'Online Quiz - Direct Entry Test',
          paperCode: 'OQ-DIRECT-01',
          durationMinutes: 45,
          totalMarks: 30,
          isOnline: true,
          displayOrder: 1,
          instructions: 'Quick online quiz with MCQ and short answers.',
          status: 'Published',
        });
        
        createdData.onlinePaper = onlinePaper;
        console.log('✅ Online paper created successfully:', onlinePaper.paperId);
        updateStepStatus('online-exam', 'success', `Created: ${onlinePaper.paperTitle} (${onlinePaper.paperId})`, onlinePaper);
      } catch (error: any) {
        const errorMsg = error.message || 'Failed to create online paper';
        updateStepStatus('online-exam', 'error', errorMsg);
        console.error('❌ Failed to create online paper:', error);
        toast.error('V3: Failed to create online paper', { 
          description: errorMsg,
          duration: 5000,
        });
      }
      
      // Step 14: Create Paper Rules
      updateStepStatus('paper-rules', 'running');
      try {
        if (createdData.onlinePaper) {
          const ruleId = `RULE-DIRECT-${Date.now().toString(36).toUpperCase()}`;
          const paperRule = await paperRulesService.create({
            ruleId,
            paperId: createdData.onlinePaper.paperId,
            minMarksToPass: 12,
            minPercentage: 40,
            sectionWisePassRequired: false,
            mustAttemptPercentage: 100,
            evaluationMode: 'AUTO',
            negativeMarkingEnabled: false,
            negativeMarkingPerQuestion: 0,
            graceMarks: 0,
          });
          
          createdData.paperRule = paperRule;
          updateStepStatus('paper-rules', 'success', `Created rules: Pass >= 40%`, paperRule);
        } else {
          updateStepStatus('paper-rules', 'success', `Skipped - No online paper`);
        }
      } catch (error: any) {
        updateStepStatus('paper-rules', 'error', error.message);
      }

      // Step 15: Create MCQ Questions
      updateStepStatus('questions', 'running');
      try {
        if (createdData.onlinePaper) {
          const questionsCreated: any[] = [];
          const mcqQuestions = [
            { text: 'What is 5 x 5?', options: ['20', '25', '30', '35'], correct: 1 },
            { text: 'Capital of India?', options: ['Mumbai', 'Delhi', 'Kolkata', 'Chennai'], correct: 1 },
            { text: 'H2O is commonly called?', options: ['Salt', 'Sugar', 'Water', 'Air'], correct: 2 },
          ];

          for (let i = 0; i < mcqQuestions.length; i++) {
            const mcq = mcqQuestions[i];
            const questionId = `Q-DIRECT-MCQ-${Date.now()}-${i}`.toUpperCase();
            
            const question = await questionsService.create({
              questionId,
              paperId: createdData.onlinePaper.paperId,
              questionType: 'MCQ',
              questionText: mcq.text,
              marks: 10,
              negativeMarks: 0,
              difficulty: 'Easy',
              displayOrder: i + 1,
              isRequired: true,
            });
            
            const optionIds: string[] = [];
            for (let j = 0; j < mcq.options.length; j++) {
              const optionId = `OPT-DIRECT-${Date.now()}-${i}-${j}`.toUpperCase();
              optionIds.push(optionId);
              await questionOptionsService.create({
                optionId,
                questionId,
                optionText: mcq.options[j],
                isCorrect: j === mcq.correct,
                displayOrder: j + 1,
              });
              await new Promise(resolve => setTimeout(resolve, 20));
            }
            
            questionsCreated.push({ ...question, optionIds });
            await new Promise(resolve => setTimeout(resolve, 30));
          }

          createdData.questions = questionsCreated;
          updateStepStatus('questions', 'success', `Created: ${questionsCreated.length} MCQ questions`, questionsCreated);
        } else {
          updateStepStatus('questions', 'success', `Skipped - No online paper`);
        }
      } catch (error: any) {
        updateStepStatus('questions', 'error', error.message);
      }

      // Step 16: Create Student Attempts
      updateStepStatus('student-attempts', 'running');
      try {
        if (createdData.onlinePaper && createdData.questions && createdData.students.length > 0) {
          const attemptsCreated: any[] = [];
          const studentsToAttempt = createdData.students.slice(0, 3);
          
          for (const student of studentsToAttempt) {
            const attemptId = `ATT-DIRECT-${Date.now()}-${student.studentId.slice(-4)}`.toUpperCase();
            
            const attempt = await studentAttemptsService.create({
              attemptId,
              studentId: student.studentId,
              paperId: createdData.onlinePaper.paperId,
              status: 'SUBMITTED',
              startedAt: new Date(Date.now() - 30 * 60000).toISOString(),
              submittedAt: new Date().toISOString(),
              timeSpentMinutes: Math.floor(Math.random() * 20) + 10,
              totalMarksObtained: 0,
              autoSubmitted: false,
            });
            
            attemptsCreated.push(attempt);
            await new Promise(resolve => setTimeout(resolve, 30));
          }
          
          createdData.attempts = attemptsCreated;
          updateStepStatus('student-attempts', 'success', `Created: ${attemptsCreated.length} attempts`, attemptsCreated);
        } else {
          updateStepStatus('student-attempts', 'success', `Skipped - Prerequisites not available`);
        }
      } catch (error: any) {
        updateStepStatus('student-attempts', 'error', error.message);
      }

      // Step 17: Create Student Responses
      updateStepStatus('student-responses', 'running');
      try {
        if (createdData.attempts && createdData.questions) {
          const responsesCreated: any[] = [];
          
          for (const attempt of createdData.attempts) {
            for (const question of createdData.questions) {
              const responseId = `RESP-DIRECT-${Date.now()}-${Math.random().toString(36).slice(-4)}`.toUpperCase();
              
              const isCorrect = Math.random() < 0.8; // 80% correct
              const selectedIndex = isCorrect ? 0 : Math.floor(Math.random() * 3) + 1;
              
              const responseData = {
                responseId,
                attemptId: attempt.attemptId,
                questionId: question.questionId,
                selectedOptionId: question.optionIds?.[Math.min(selectedIndex, question.optionIds.length - 1)],
                marksAwarded: isCorrect ? question.marks : 0,
                isEvaluated: true,
                timeSpentSeconds: Math.floor(Math.random() * 60) + 20,
              };
              
              try {
                const response = await studentResponsesService.createOrUpdate(responseData);
                responsesCreated.push(response);
              } catch (err) {
                console.error('Failed to create response:', err);
              }
              
              await new Promise(resolve => setTimeout(resolve, 20));
            }
          }
          
          createdData.responses = responsesCreated;
          updateStepStatus('student-responses', 'success', `Created: ${responsesCreated.length} responses`, responsesCreated);
        } else {
          updateStepStatus('student-responses', 'success', `Skipped`);
        }
      } catch (error: any) {
        updateStepStatus('student-responses', 'error', error.message);
      }

      // ========== END V3 ==========

      setIsGenerating(false);
      const v3Info = createdData.onlinePaper 
        ? ` + Online Quiz: ${createdData.questions?.length || 0} questions, ${createdData.attempts?.length || 0} attempts` 
        : ' (V3 steps attempted but may have had issues - check progress)';
      toast.success(`✅ Generated V2 + V3 sample data with DIRECT ENTRY mode!${v3Info}`, {
        duration: 10000,
      });
      
      // Log V3 status for debugging
      if (createdData.onlinePaper) {
        console.log('✅ V3 Online Exams created:', {
          paper: createdData.onlinePaper.paperTitle,
          questions: createdData.questions?.length || 0,
          attempts: createdData.attempts?.length || 0,
          responses: createdData.responses?.length || 0,
        });
      } else {
        console.warn('⚠️ V3 Online Exams not created. Check step statuses above.');
      }
    } catch (error: any) {
      setIsGenerating(false);
      updateStepStatus('error', 'error', error.message);
      toast.error(`Failed to generate sample data: ${error.message}`);
      console.error('Full error:', error);
    }
  };

  // V2: Generate End-to-End Sample Data with Internal/External Marks System (Scaled Entry - 100 marks)
  const generateEndToEndSampleDataV2 = async () => {
    setIsGenerating(true);
    resetSteps('v2');

    const createdData: any = {
      academicYear: null,
      class: null,
      section: null,
      teacher: null,
      subjects: [],
      students: [],
      unitTestExams: [],
      finalExams: [],
      timetable: [],
      unitTestMarks: [],
      finalExamMarks: [],
      results: [],
    };

    // Student names for variety
    const studentNames = [
      'Aarav Sharma', 'Priya Patel', 'Rohan Kumar', 'Ananya Singh', 'Vikram Mehta',
      'Sneha Reddy', 'Arjun Nair', 'Kavya Iyer', 'Aditya Joshi', 'Meera Desai',
      'Rahul Gupta', 'Divya Agarwal', 'Karan Malhotra', 'Pooja Shah', 'Nikhil Verma',
      'Shreya Kapoor', 'Aman Tiwari', 'Isha Choudhury', 'Ravi Menon', 'Neha Krishnan'
    ];

    // Performance distribution: 20% excellent, 30% good, 30% average, 15% poor, 5% failing
    const performanceLevels: Array<'excellent' | 'good' | 'average' | 'poor' | 'failing'> = [
      ...Array(4).fill('excellent'),
      ...Array(6).fill('good'),
      ...Array(6).fill('average'),
      ...Array(3).fill('poor'),
      ...Array(1).fill('failing'),
    ];

    try {
      // Step 1: Get or Create Academic Year
      updateStepStatus('academic-year', 'running');
      try {
        const currentYear = new Date().getFullYear();
        const academicYearId = `${currentYear}-${currentYear + 1}`;
        const startDate = `${currentYear}-06-01`;
        const endDate = `${currentYear + 1}-05-31`;
        
        let academicYear;
        
        // First, try to find existing academic year by fetching all and matching by date range
        try {
          const allAcademicYears = await academicYearsService.getAll();
          const existingYear = allAcademicYears.find(
            (ay) => ay.startDate === startDate && ay.endDate === endDate
          );
          
          if (existingYear) {
            academicYear = existingYear;
            updateStepStatus('academic-year', 'success', `Using existing: ${academicYear.academicYearId || academicYearId}`);
          } else {
            // Not found, try to create
            try {
              academicYear = await academicYearsService.create({
                academicYearId,
                startDate,
                endDate,
                status: 'Active',
              });
              updateStepStatus('academic-year', 'success', `Created: ${academicYear.academicYearId || academicYearId}`);
            } catch (createError: any) {
              if (createError.message?.includes('already exists')) {
                // Creation failed but says it exists, try to find it again
                const allYearsRetry = await academicYearsService.getAll();
                const foundYear = allYearsRetry.find(
                  (ay) => ay.startDate === startDate && ay.endDate === endDate
                );
                
                if (foundYear) {
                  academicYear = foundYear;
                  updateStepStatus('academic-year', 'success', `Found after conflict: ${academicYear.academicYearId || academicYearId}`);
                } else {
                  // Still not found, but creation said it exists - use the ID we tried
                  const anyYear = allYearsRetry.find(
                    (ay) => ay.academicYearId === academicYearId
                  );
                  if (anyYear) {
                    academicYear = anyYear;
                    updateStepStatus('academic-year', 'success', `Found by ID: ${academicYear.academicYearId}`);
                  } else {
                    throw createError;
                  }
                }
              } else {
                throw createError;
              }
            }
          }
        } catch (error: any) {
          // If getAll fails, try to create directly
          try {
            academicYear = await academicYearsService.create({
              academicYearId,
              startDate,
              endDate,
              status: 'Active',
            });
            updateStepStatus('academic-year', 'success', `Created: ${academicYear.academicYearId || academicYearId}`);
          } catch (createError: any) {
            if (createError.message?.includes('already exists')) {
              // Try one more time to get it
              const allYearsRetry = await academicYearsService.getAll();
              const foundYear = allYearsRetry.find(
                (ay) => (ay.startDate === startDate && ay.endDate === endDate) || ay.academicYearId === academicYearId
              );
              if (foundYear) {
                academicYear = foundYear;
                updateStepStatus('academic-year', 'success', `Found: ${academicYear.academicYearId || academicYearId}`);
              } else {
                updateStepStatus('academic-year', 'error', createError.message);
                throw createError;
              }
            } else {
              updateStepStatus('academic-year', 'error', createError.message);
              throw createError;
            }
          }
        }
        
        createdData.academicYear = academicYear;
      } catch (error: any) {
        updateStepStatus('academic-year', 'error', error.message);
        throw error;
      }

      // Step 2: Create Class
      updateStepStatus('class', 'running');
      try {
        const classId = `CLS-V2-${Date.now().toString(36).toUpperCase()}`;
        const newClass = await classesService.create({
          classId,
          name: 'Class 10-B',
          description: 'Sample class for V2 internal/external marks system',
          capacity: 40,
          status: 'Active',
        });
        createdData.class = newClass;
        updateStepStatus('class', 'success', `Created: ${newClass.name}`, newClass);
      } catch (error: any) {
        updateStepStatus('class', 'error', error.message);
        throw error;
      }

      // Step 3: Create Section
      updateStepStatus('section', 'running');
      try {
        const sectionId = `SEC-V2-${Date.now().toString(36).toUpperCase()}`;
        const newSection = await sectionsService.create({
          sectionId,
          name: 'Section B',
          capacity: 40,
          roomNumber: 'Room 102',
          status: 'Active',
        });
        createdData.section = newSection;
        updateStepStatus('section', 'success', `Created: ${newSection.name}`, newSection);
      } catch (error: any) {
        updateStepStatus('section', 'error', error.message);
        throw error;
      }

      // Step 4: Link Class-Section
      updateStepStatus('class-section', 'running');
      try {
        await classesService.addSectionToClass(createdData.class.classId, createdData.section.sectionId);
        updateStepStatus('class-section', 'success', `Linked: ${createdData.class.classId} ↔ ${createdData.section.sectionId}`);
      } catch (error: any) {
        updateStepStatus('class-section', 'success', `Link exists or created`);
      }

      // Step 5: Create Teacher
      updateStepStatus('teacher', 'running');
      try {
        const teacherId = `TCH-V2-${Date.now().toString(36).toUpperCase()}`;
        const newTeacher = await teachersService.create({
          teacherId,
          name: 'Dr. V2 Sample Teacher',
          email: `v2.teacher.${Date.now()}@school.edu`,
          phone: '+1234567891',
          department: 'Science',
          designation: 'Senior Teacher',
          qualification: 'Ph.D. in Education',
          experience: 12,
          joiningDate: new Date().toISOString().split('T')[0],
          status: 'Active',
        });
        createdData.teacher = newTeacher;
        updateStepStatus('teacher', 'success', `Created: ${newTeacher.name}`, newTeacher);
      } catch (error: any) {
        updateStepStatus('teacher', 'error', error.message);
        throw error;
      }

      // Step 6: Create 3 Subjects
      updateStepStatus('subjects', 'running');
      try {
        const subjectNames = [
          { name: 'Mathematics', code: 'MATH' },
          { name: 'Physics', code: 'PHY' },
          { name: 'Chemistry', code: 'CHEM' },
        ];
        
        for (const subj of subjectNames) {
          const subjectId = `SUB-V2-${subj.code}-${Date.now().toString(36).toUpperCase()}`;
          const newSubject = await subjectsService.create({
            subjectId,
            subjectName: subj.name,
            subjectCode: `${subj.code}-V2-${Date.now().toString(36).slice(-4).toUpperCase()}`,
            classId: createdData.class.classId,
            teacherId: createdData.teacher.teacherId,
            teacherIds: [createdData.teacher.teacherId],
            description: `${subj.name} for V2 sample class`,
            credits: 4,
            hoursPerWeek: 5,
            status: 'Active',
          });
          createdData.subjects.push(newSubject);
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        updateStepStatus('subjects', 'success', `Created: ${createdData.subjects.length} subjects`, createdData.subjects);
      } catch (error: any) {
        updateStepStatus('subjects', 'error', error.message);
        throw error;
      }

      // Step 7: Create 20 Students
      updateStepStatus('student', 'running');
      try {
        const studentsCreated: any[] = [];
        for (let i = 0; i < 20; i++) {
          const studentId = `STU-V2-${Date.now()}-${i}`.toUpperCase();
          const timestamp = Date.now();
          const newStudent = await studentsService.create({
            studentId,
            name: studentNames[i] || `Student ${i + 1}`,
            email: `v2.student${i + 1}.${timestamp}@school.edu`,
            phone: `+1234568${String(i).padStart(3, '0')}`,
            dateOfBirth: `2008-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`,
            gender: i % 2 === 0 ? 'Male' : 'Female',
            address: `${i + 1} Student Lane, Education City`,
            classId: createdData.class.classId,
            sectionId: createdData.section.sectionId,
            rollNo: i + 1,
            parentName: `Parent of ${studentNames[i] || `Student ${i + 1}`}`,
            parentContact: `+1234568${String(i + 100).padStart(3, '0')}`,
            parentEmail: `v2.parent${i + 1}.${timestamp}@school.edu`,
            admissionDate: new Date().toISOString().split('T')[0],
            status: 'Active',
          });
          studentsCreated.push(newStudent);
          await new Promise(resolve => setTimeout(resolve, 50));
        }
        createdData.students = studentsCreated;
        updateStepStatus('student', 'success', `Created: ${studentsCreated.length} students`, studentsCreated);
      } catch (error: any) {
        updateStepStatus('student', 'error', error.message);
        throw error;
      }

      // Step 8: Create 4-5 Unit Test Exams
      updateStepStatus('unit-tests', 'running');
      try {
        const unitTestNames = [
          'Unit Test 1 - Chapters 1-3',
          'Unit Test 2 - Chapters 4-6',
          'Unit Test 3 - Chapters 7-9',
          'Unit Test 4 - Chapters 10-12',
          'Unit Test 5 - Chapters 13-15',
        ];
        const unitTestExamsCreated: any[] = [];

        for (let utIdx = 0; utIdx < 5; utIdx++) {
          const examId = `EXM-UT-V2-${Date.now()}-${utIdx}`.toUpperCase();
          const startDate = new Date();
          startDate.setDate(startDate.getDate() - (90 - utIdx * 15)); // Spread over 3 months
          const endDate = new Date(startDate);
          endDate.setDate(endDate.getDate() + 2);

          const examSubjects = createdData.subjects.map((subj: any, idx: number) => ({
            subjectId: subj.subjectId,
            subjectName: subj.subjectName || subj.name,
            subjectCode: subj.subjectCode || subj.code,
            maxMarks: 100,
            passingMarks: 40,
            examDate: new Date(startDate.getTime() + idx * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            duration: 90,
          }));

          const newExam = await examsService.create({
            examId,
            examName: unitTestNames[utIdx],
            examType: 'Unit Test',
            academicYear: createdData.academicYear.academicYearId,
            classId: createdData.class.classId,
            term: 'Term 1',
            startDate: startDate.toISOString().split('T')[0],
            endDate: endDate.toISOString().split('T')[0],
            totalMarks: 300,
            passingMarks: 120,
            subjects: examSubjects,
            status: 'Completed',
          });
          unitTestExamsCreated.push(newExam);
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        createdData.unitTestExams = unitTestExamsCreated;
        updateStepStatus('unit-tests', 'success', `Created: ${unitTestExamsCreated.length} unit test exams`, unitTestExamsCreated);
      } catch (error: any) {
        updateStepStatus('unit-tests', 'error', error.message);
        throw error;
      }

      // Step 9: Create 2 Final Exams
      updateStepStatus('final-exams', 'running');
      try {
        const finalExamNames = [
          { name: 'Mid-Term Examination', type: 'Mid-Term', term: 'Term 1' },
          { name: 'Final Examination', type: 'Final', term: 'Term 2' },
        ];
        const finalExamsCreated: any[] = [];

        for (let examIdx = 0; examIdx < 2; examIdx++) {
          const examId = `EXM-FINAL-V2-${Date.now()}-${examIdx}`.toUpperCase();
          const startDate = new Date();
          startDate.setDate(startDate.getDate() + (examIdx * 60) + 30);
          const endDate = new Date(startDate);
          endDate.setDate(endDate.getDate() + 5);

          const examSubjects = createdData.subjects.map((subj: any, idx: number) => ({
            subjectId: subj.subjectId,
            subjectName: subj.subjectName || subj.name,
            subjectCode: subj.subjectCode || subj.code,
            maxMarks: 100,
            passingMarks: 40,
            examDate: new Date(startDate.getTime() + idx * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            duration: 180,
          }));

          const newExam = await examsService.create({
            examId,
            examName: finalExamNames[examIdx].name,
            examType: finalExamNames[examIdx].type,
            academicYear: createdData.academicYear.academicYearId,
            classId: createdData.class.classId,
            term: finalExamNames[examIdx].term,
            startDate: startDate.toISOString().split('T')[0],
            endDate: endDate.toISOString().split('T')[0],
            totalMarks: 300,
            passingMarks: 120,
            subjects: examSubjects,
            status: 'Scheduled',
          });
          finalExamsCreated.push(newExam);
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        createdData.finalExams = finalExamsCreated;
        updateStepStatus('final-exams', 'success', `Created: ${finalExamsCreated.length} final exams`, finalExamsCreated);
      } catch (error: any) {
        updateStepStatus('final-exams', 'error', error.message);
        throw error;
      }

      // Step 10: Create Unit Test Marks (for internal marks calculation)
      updateStepStatus('unit-test-marks', 'running');
      try {
        const unitTestMarksEntries: any[] = [];
        let markCounter = 0;
        const shuffledLevels = [...performanceLevels].sort(() => Math.random() - 0.5);

        for (const unitTestExam of createdData.unitTestExams) {
          for (let studentIdx = 0; studentIdx < createdData.students.length; studentIdx++) {
            const student = createdData.students[studentIdx];
            const performanceLevel = shuffledLevels[studentIdx] || 'average';
            const subjectMarks = generateRandomMarks(performanceLevel);

            for (let subjIdx = 0; subjIdx < createdData.subjects.length; subjIdx++) {
              const subj = createdData.subjects[subjIdx];
              const markId = `MRK-UT-V2-${Date.now()}-${markCounter++}`.toUpperCase();
              const marksObtained = subjectMarks[subjIdx];
              const percentage = (marksObtained / 100) * 100;

              const newMark = await marksService.create({
                markId,
                studentId: student.studentId,
                examId: unitTestExam.examId,
                subjectId: subj.subjectId,
                marksObtained,
                totalMarks: 100,
                grade: calculateGrade(percentage),
                remarks: `Unit test performance: ${marksObtained >= 80 ? 'Excellent' : marksObtained >= 60 ? 'Good' : 'Needs improvement'}`,
                isAbsent: false,
                status: 'Published',
                enteredBy: 'System',
                marksType: 'Unit Test', // V2: Mark as unit test
              });
              unitTestMarksEntries.push(newMark);
              await new Promise(resolve => setTimeout(resolve, 20));
            }
          }
        }

        createdData.unitTestMarks = unitTestMarksEntries;
        updateStepStatus('unit-test-marks', 'success', `Created: ${unitTestMarksEntries.length} unit test marks`, unitTestMarksEntries);
      } catch (error: any) {
        updateStepStatus('unit-test-marks', 'error', error.message);
        throw error;
      }

      // Step 11: Create Final Exam Marks with Internal/External Breakdown
      updateStepStatus('final-exam-marks', 'running');
      try {
        const finalExamMarksEntries: any[] = [];
        let markCounter = 0;
        const shuffledLevels = [...performanceLevels].sort(() => Math.random() - 0.5);

        for (const finalExam of createdData.finalExams) {
          for (let studentIdx = 0; studentIdx < createdData.students.length; studentIdx++) {
            const student = createdData.students[studentIdx];
            const performanceLevel = shuffledLevels[studentIdx] || 'average';
            const subjectMarks = generateRandomMarks(performanceLevel);

            for (let subjIdx = 0; subjIdx < createdData.subjects.length; subjIdx++) {
              const subj = createdData.subjects[subjIdx];
              const markId = `MRK-FINAL-V2-${Date.now()}-${markCounter++}`.toUpperCase();
              
              // External marks (80 marks) - from final exam
              const externalMarksRaw = subjectMarks[subjIdx];
              const scaledExternalMarks = (externalMarksRaw / 100) * 80;

              // Internal marks components (20 marks total)
              // Unit test marks (10 marks) - will be calculated from unit tests
              // For now, generate random unit test average (will be calculated properly in results)
              const unitTestAvg = externalMarksRaw * 0.9 + (Math.random() - 0.5) * 10; // Slightly lower than final
              const unitTestMarks = Math.min((unitTestAvg / 100) * 10, 10);

              // Assignment marks (5 marks) - random between 3-5
              const assignmentMarks = 3 + Math.random() * 2;

              // Attendance marks (5 marks) - random between 4-5
              const attendanceMarks = 4 + Math.random() * 1;

              // Total internal marks
              const internalMarks = unitTestMarks + assignmentMarks + attendanceMarks;

              // Total marks (internal + external)
              const totalMarks = internalMarks + scaledExternalMarks;
              const percentage = (totalMarks / 100) * 100;

              const newMark = await marksService.create({
                markId,
                studentId: student.studentId,
                examId: finalExam.examId,
                subjectId: subj.subjectId,
                marksObtained: totalMarks, // Total marks (internal + external)
                totalMarks: 100,
                grade: calculateGrade(percentage),
                remarks: `Final exam: External ${scaledExternalMarks.toFixed(1)}/80, Internal ${internalMarks.toFixed(1)}/20`,
                isAbsent: false,
                status: 'Published',
                enteredBy: 'System',
                marksType: 'Final', // V2: Mark as final exam
                // V2: Internal/External breakdown
                internalMarks: internalMarks,
                externalMarks: scaledExternalMarks,
                unitTestMarks: unitTestMarks,
                assignmentMarks: assignmentMarks,
                attendanceMarks: attendanceMarks,
              });
              finalExamMarksEntries.push(newMark);
              await new Promise(resolve => setTimeout(resolve, 30));
            }
          }
        }

        createdData.finalExamMarks = finalExamMarksEntries;
        const avgMarks = finalExamMarksEntries.reduce((sum, m) => sum + (m.marksObtained || 0), 0) / finalExamMarksEntries.length;
        updateStepStatus('final-exam-marks', 'success', `Created: ${finalExamMarksEntries.length} final exam marks with breakdown (Avg: ${Math.round(avgMarks)}%)`, finalExamMarksEntries);
      } catch (error: any) {
        updateStepStatus('final-exam-marks', 'error', error.message);
        throw error;
      }

      // Step 12: Create Results with V2 calculation (internal/external breakdown)
      updateStepStatus('result', 'running');
      try {
        const resultsCreated: any[] = [];
        let resultCounter = 0;

        for (const finalExam of createdData.finalExams) {
          const studentResults: any[] = [];

          for (const student of createdData.students) {
            const studentMarks = createdData.finalExamMarks.filter(
              (m: any) => m.studentId === student.studentId && m.examId === finalExam.examId
            );

            if (studentMarks.length === 0) continue;

            const totalMarks = studentMarks.reduce((sum: number, m: any) => sum + (m.marksObtained || 0), 0);
            const totalMaxMarks = studentMarks.length * 100;
            const percentage = (totalMarks / totalMaxMarks) * 100;
            const overallGrade = calculateGrade(percentage);
            const isPassed = percentage >= 40;

            const resultId = `RES-V2-${Date.now()}-${resultCounter++}`.toUpperCase();
            const subjectResults = studentMarks.map((mark: any, idx: number) => {
              const maxMarks = mark.totalMarks || 100;
              const marksObtained = mark.marksObtained;
              const pct = (marksObtained / maxMarks) * 100;
              const passed = pct >= 40;
              return {
                subjectId: mark.subjectId,
                subjectName: createdData.subjects[idx]?.subjectName || createdData.subjects[idx]?.name || 'Subject',
                maxMarks,
                marksObtained,
                // V2: Include internal/external breakdown
                internalMarks: mark.internalMarks || 0,
                externalMarks: mark.externalMarks || 0,
                breakdown: {
                  unitTest: mark.unitTestMarks || 0,
                  assignment: mark.assignmentMarks || 0,
                  attendance: mark.attendanceMarks || 0,
                  external: mark.externalMarks || 0,
                },
                grade: mark.grade,
                isPassed: passed,
              };
            });

            const newResult = await resultsService.create({
              resultId,
              studentId: student.studentId,
              studentName: student.name,
              examId: finalExam.examId,
              examName: finalExam.examName,
              classId: createdData.class.classId,
              subjects: subjectResults,
              totalMaxMarks,
              totalMarksObtained: totalMarks,
              percentage: Math.round(percentage * 100) / 100,
              grade: overallGrade,
              rank: 0,
              isPassed,
              status: 'Published',
              remarks: isPassed ? 'Congratulations! V2 marks system with internal/external breakdown.' : 'Please work harder to improve.',
            });

            studentResults.push({ result: newResult, percentage });
            resultsCreated.push(newResult);

            // Publish the result
            try {
              await resultsService.publish(resultId);
            } catch (publishError: any) {
              console.warn(`Failed to publish result ${resultId}:`, publishError);
            }

            await new Promise(resolve => setTimeout(resolve, 50));
          }
        }

        createdData.results = resultsCreated;
        const passedCount = resultsCreated.filter((r: any) => r.isPassed).length;
        const avgPercentage = resultsCreated.reduce((sum: number, r: any) => sum + (r.percentage || 0), 0) / resultsCreated.length;
        updateStepStatus('result', 'success', `Created & Published: ${resultsCreated.length} V2 results with breakdown (${passedCount} passed, Avg: ${avgPercentage.toFixed(1)}%)`, resultsCreated);
      } catch (error: any) {
        updateStepStatus('result', 'error', error.message);
        throw error;
      }

      // Step 13: Report Card V2
      updateStepStatus('report-card', 'running');
      try {
        if (createdData.results && createdData.results.length > 0) {
          const resultCount = createdData.results.length;
          const avgPercentage = createdData.results.reduce((sum: number, r: any) => sum + (r.percentage || 0), 0) / resultCount;
          
          updateStepStatus('report-card', 'success', `V2 Ready: ${resultCount} report cards with internal/external breakdown (Avg: ${avgPercentage.toFixed(1)}%)`, {
            totalResults: resultCount,
            averagePercentage: avgPercentage.toFixed(1),
            note: 'V2 Report cards include internal (20) and external (80) marks breakdown',
            version: 'v2',
          });
        } else {
          updateStepStatus('report-card', 'success', `V2 Report cards will be available once results are created`);
        }
      } catch (error: any) {
        updateStepStatus('report-card', 'success', `V2 Report cards can be generated from results in Report Cards module`);
      }

      // ========== V3: ONLINE EXAMS MODULE ==========
      
      // Step 14: Create Online Exam Paper
      updateStepStatus('online-exam', 'running');
      try {
        // Use the first final exam as the base for online paper
        const baseExam = createdData.finalExams[0];
        const paperId = `PAPER-V3-${Date.now().toString(36).toUpperCase()}`;
        
        const onlinePaper = await examPapersService.create({
          paperId,
          examId: baseExam.examId,
          paperTitle: 'Online Assessment - Mathematics & Science',
          paperCode: 'OA-MATHS-SCI-01',
          durationMinutes: 60,
          totalMarks: 50,
          isOnline: true,
          displayOrder: 1,
          instructions: 'This is a sample online exam. Read all questions carefully. Time will start as soon as you begin.',
          status: 'Published',
        });
        
        createdData.onlinePaper = onlinePaper;
        updateStepStatus('online-exam', 'success', `Created: ${onlinePaper.paperTitle}`, onlinePaper);
      } catch (error: any) {
        updateStepStatus('online-exam', 'error', error.message);
        // Don't throw - continue with remaining steps
        console.error('Failed to create online paper:', error);
      }
      
      // Step 15: Create Paper Rules
      updateStepStatus('paper-rules', 'running');
      try {
        if (createdData.onlinePaper) {
          const ruleId = `RULE-V3-${Date.now().toString(36).toUpperCase()}`;
          const paperRule = await paperRulesService.create({
            ruleId,
            paperId: createdData.onlinePaper.paperId,
            minMarksToPass: 20,
            minPercentage: 40,
            sectionWisePassRequired: false,
            mustAttemptPercentage: 80,
            evaluationMode: 'MIXED',
            negativeMarkingEnabled: true,
            negativeMarkingPerQuestion: 0.25,
            graceMarks: 0,
          });
          
          createdData.paperRule = paperRule;
          updateStepStatus('paper-rules', 'success', `Created rules: Pass >= 40%, Negative marking: -0.25`, paperRule);
        } else {
          updateStepStatus('paper-rules', 'success', `Skipped - No online paper available`);
        }
      } catch (error: any) {
        updateStepStatus('paper-rules', 'error', error.message);
        console.error('Failed to create paper rules:', error);
      }

      // Step 16: Create Questions (MCQ + Theory)
      updateStepStatus('questions', 'running');
      try {
        if (createdData.onlinePaper) {
          const questionsCreated: any[] = [];
          const mcqQuestions = [
            { text: 'What is 2 + 2?', options: ['3', '4', '5', '6'], correct: 1 },
            { text: 'Which planet is closest to the Sun?', options: ['Venus', 'Mercury', 'Earth', 'Mars'], correct: 1 },
            { text: 'What is the chemical symbol for water?', options: ['H2O', 'CO2', 'O2', 'NaCl'], correct: 0 },
            { text: 'What is the square root of 144?', options: ['10', '11', '12', '13'], correct: 2 },
            { text: 'Who discovered gravity?', options: ['Einstein', 'Newton', 'Galileo', 'Archimedes'], correct: 1 },
          ];

          // Create MCQ Questions
          for (let i = 0; i < mcqQuestions.length; i++) {
            const mcq = mcqQuestions[i];
            const questionId = `Q-MCQ-${Date.now()}-${i}`.toUpperCase();
            
            const question = await questionsService.create({
              questionId,
              paperId: createdData.onlinePaper.paperId,
              questionType: 'MCQ',
              questionText: mcq.text,
              marks: 5,
              negativeMarks: 0.25,
              difficulty: i < 2 ? 'Easy' : i < 4 ? 'Medium' : 'Hard',
              displayOrder: i + 1,
              isRequired: true,
            });
            
            // Create options for MCQ
            const optionIds: string[] = [];
            for (let j = 0; j < mcq.options.length; j++) {
              const optionId = `OPT-${Date.now()}-${i}-${j}`.toUpperCase();
              optionIds.push(optionId);
              await questionOptionsService.create({
                optionId,
                questionId,
                optionText: mcq.options[j],
                isCorrect: j === mcq.correct,
                displayOrder: j + 1,
              });
              await new Promise(resolve => setTimeout(resolve, 30));
            }
            
            questionsCreated.push({ ...question, optionIds });
            await new Promise(resolve => setTimeout(resolve, 50));
          }

          // Create 2 Theory Questions
          const theoryQuestions = [
            { text: 'Explain the process of photosynthesis in plants.', difficulty: 'Medium', marks: 10 },
            { text: 'Describe the water cycle and its importance.', difficulty: 'Easy', marks: 15 },
          ];
          
          for (let i = 0; i < theoryQuestions.length; i++) {
            const theory = theoryQuestions[i];
            const questionId = `Q-THEORY-${Date.now()}-${i}`.toUpperCase();
            
            const question = await questionsService.create({
              questionId,
              paperId: createdData.onlinePaper.paperId,
              questionType: 'DESCRIPTIVE',
              questionText: theory.text,
              marks: theory.marks,
              negativeMarks: 0,
              difficulty: theory.difficulty as any,
              displayOrder: mcqQuestions.length + i + 1,
              isRequired: true,
              correctAnswerText: `Sample expected answer for: ${theory.text}`,
            });
            
            questionsCreated.push(question);
            await new Promise(resolve => setTimeout(resolve, 50));
          }

          createdData.questions = questionsCreated;
          updateStepStatus('questions', 'success', `Created: ${mcqQuestions.length} MCQs + ${theoryQuestions.length} Theory = ${questionsCreated.length} total`, questionsCreated);
        } else {
          updateStepStatus('questions', 'success', `Skipped - No online paper available`);
        }
      } catch (error: any) {
        updateStepStatus('questions', 'error', error.message);
        console.error('Failed to create questions:', error);
      }

      // Step 17: Create Student Attempts (for 5 students)
      updateStepStatus('student-attempts', 'running');
      try {
        if (createdData.onlinePaper && createdData.questions && createdData.students.length > 0) {
          const attemptsCreated: any[] = [];
          const studentsToAttempt = createdData.students.slice(0, 5); // First 5 students
          
          for (const student of studentsToAttempt) {
            const attemptId = `ATT-${Date.now()}-${student.studentId.slice(-4)}`.toUpperCase();
            const startTime = new Date();
            startTime.setMinutes(startTime.getMinutes() - Math.floor(Math.random() * 50)); // Random start time within last 50 mins
            
            const attempt = await studentAttemptsService.create({
              attemptId,
              studentId: student.studentId,
              paperId: createdData.onlinePaper.paperId,
              status: 'SUBMITTED',
              startedAt: startTime.toISOString(),
              submittedAt: new Date().toISOString(),
              timeSpentMinutes: Math.floor(Math.random() * 40) + 20, // 20-60 mins
              totalMarksObtained: 0, // Will be calculated after evaluation
              autoSubmitted: false,
            });
            
            attemptsCreated.push(attempt);
            await new Promise(resolve => setTimeout(resolve, 50));
          }
          
          createdData.attempts = attemptsCreated;
          updateStepStatus('student-attempts', 'success', `Created: ${attemptsCreated.length} student attempts`, attemptsCreated);
        } else {
          updateStepStatus('student-attempts', 'success', `Skipped - Prerequisites not available`);
        }
      } catch (error: any) {
        updateStepStatus('student-attempts', 'error', error.message);
        console.error('Failed to create student attempts:', error);
      }

      // Step 18: Create Student Responses
      updateStepStatus('student-responses', 'running');
      try {
        if (createdData.attempts && createdData.questions) {
          const responsesCreated: any[] = [];
          
          for (const attempt of createdData.attempts) {
            for (const question of createdData.questions) {
              const responseId = `RESP-${Date.now()}-${Math.random().toString(36).slice(-4)}`.toUpperCase();
              
              let responseData: any = {
                responseId,
                attemptId: attempt.attemptId,
                questionId: question.questionId,
                marksAwarded: 0,
                isEvaluated: false,
                timeSpentSeconds: Math.floor(Math.random() * 180) + 30, // 30-210 seconds
              };

              if (question.questionType === 'MCQ' && question.optionIds) {
                // For MCQ, randomly select an option (70% chance of correct)
                const correctOptionIndex = question.optionIds.findIndex((id: string, idx: number) => idx === 0); // First option is usually marked correct
                const isCorrect = Math.random() < 0.7;
                const selectedIndex = isCorrect ? 0 : Math.floor(Math.random() * 3) + 1; // Select correct or random wrong
                responseData.selectedOptionId = question.optionIds[Math.min(selectedIndex, question.optionIds.length - 1)];
                
                // Auto-evaluate MCQ
                responseData.isEvaluated = true;
                responseData.marksAwarded = isCorrect ? question.marks : 0;
              } else {
                // For theory/descriptive, add random text answer
                responseData.answerText = `Sample answer for question: ${question.questionText.slice(0, 50)}... This is a test response that would be manually evaluated.`;
                // Theory questions need manual evaluation
                responseData.isEvaluated = false;
              }
              
              try {
                const response = await studentResponsesService.createOrUpdate(responseData);
                responsesCreated.push(response);
              } catch (err) {
                console.error('Failed to create response:', err);
              }
              
              await new Promise(resolve => setTimeout(resolve, 20));
            }
          }
          
          createdData.responses = responsesCreated;
          updateStepStatus('student-responses', 'success', `Created: ${responsesCreated.length} responses for ${createdData.attempts.length} attempts`, responsesCreated);
        } else {
          updateStepStatus('student-responses', 'success', `Skipped - Prerequisites not available`);
        }
      } catch (error: any) {
        updateStepStatus('student-responses', 'error', error.message);
        console.error('Failed to create student responses:', error);
      }

      // ========== END V3: ONLINE EXAMS MODULE ==========

      setGeneratedData(createdData);
      const v3Info = createdData.onlinePaper ? ` + Online Exam with ${createdData.questions?.length || 0} questions` : '';
      toast.success('🎉 V2 + V3 Sample Data Generated Successfully!', {
        description: `Created ${createdData.students.length} students, ${createdData.unitTestExams.length} unit tests, ${createdData.finalExams.length} final exams, ${createdData.results.length} results${v3Info}!`,
        duration: 10000,
      });

    } catch (error: any) {
      console.error('Error generating V2 sample data:', error);
      toast.error('Failed to generate V2 sample data', {
        description: error.message,
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Generate Single Test Student with V2 Data
  const generateSingleTestStudent = async (entryMode: 'mixed' | 'direct' = 'mixed') => {
    setIsGenerating(true);
    const testStudentName = `Test Student ${Date.now().toString(36).toUpperCase()}`;
    let createdStudentName = '';

    // Track what was created, skipped, or failed
    const log: { step: string; status: 'created' | 'skipped' | 'failed'; reason?: string }[] = [];

    try {
      // Reset steps
      setGenerationSteps(prev => prev.map(s => ({ ...s, status: 'pending' as const, message: undefined, data: undefined })));

      const createdData: any = {
        academicYear: null,
        class: null,
        section: null,
        teacher: null,
        subjects: [],
        student: null,
        unitTestExams: [],
        finalExams: [],
        unitTestMarks: [],
        finalExamMarks: [],
        results: [],
        // V3: Online Exams
        onlinePaper: null,
        paperRule: null,
        questions: [],
        attempts: [],
        responses: [],
      };

      // Step 1: Get or Create Academic Year
      updateStepStatus('academic-year', 'running');
      try {
        const currentYear = new Date().getFullYear();
        const academicYearId = `AY-${currentYear}-${currentYear + 1}`;
        const startDate = `${currentYear}-06-01`;
        const endDate = `${currentYear + 1}-05-31`;
        
        let academicYear;
        
        // First, try to find existing academic year by fetching all and matching by date range
        try {
          const allAcademicYears = await academicYearsService.getAll();
          const existingYear = allAcademicYears.find(
            (ay) => ay.startDate === startDate && ay.endDate === endDate
          );
          
          if (existingYear) {
            academicYear = existingYear;
            log.push({ step: 'Academic Year', status: 'skipped', reason: 'Already exists (found by date range)' });
            updateStepStatus('academic-year', 'success', `Using existing: ${academicYear.academicYearId || academicYearId}`);
          } else {
            // Not found, try to create
            try {
              academicYear = await academicYearsService.create({
                academicYearId,
                startDate,
                endDate,
                status: 'Active',
              });
              log.push({ step: 'Academic Year', status: 'created' });
              updateStepStatus('academic-year', 'success', `Created: ${academicYear.academicYearId || academicYearId}`);
            } catch (createError: any) {
              if (createError.message?.includes('already exists')) {
                // Creation failed but says it exists, try to find it again
                const allYearsRetry = await academicYearsService.getAll();
                const foundYear = allYearsRetry.find(
                  (ay) => ay.startDate === startDate && ay.endDate === endDate
                );
                
                if (foundYear) {
                  academicYear = foundYear;
                  log.push({ step: 'Academic Year', status: 'skipped', reason: 'Already exists (found after creation conflict)' });
                  updateStepStatus('academic-year', 'success', `Using existing: ${academicYear.academicYearId || academicYearId}`);
                } else {
                  // Still not found, use current year if available
                  const currentYearData = await academicYearsService.getCurrent();
                  if (currentYearData) {
                    academicYear = currentYearData;
                    log.push({ step: 'Academic Year', status: 'skipped', reason: 'Using current academic year' });
                    updateStepStatus('academic-year', 'success', `Using current: ${academicYear.academicYearId}`);
                  } else {
                    log.push({ step: 'Academic Year', status: 'failed', reason: createError.message });
                    updateStepStatus('academic-year', 'error', createError.message);
                    throw createError;
                  }
                }
              } else {
                log.push({ step: 'Academic Year', status: 'failed', reason: createError.message });
                updateStepStatus('academic-year', 'error', createError.message);
                throw createError;
              }
            }
          }
        } catch (fetchError: any) {
          // If getAll fails, try to create directly
          try {
            academicYear = await academicYearsService.create({
              academicYearId,
              startDate,
              endDate,
              status: 'Active',
            });
            log.push({ step: 'Academic Year', status: 'created' });
            updateStepStatus('academic-year', 'success', `Created: ${academicYear.academicYearId || academicYearId}`);
          } catch (createError: any) {
            log.push({ step: 'Academic Year', status: 'failed', reason: createError.message });
            updateStepStatus('academic-year', 'error', createError.message);
            throw createError;
          }
        }
        
        createdData.academicYear = academicYear;
      } catch (error: any) {
        updateStepStatus('academic-year', 'error', error.message);
        throw error;
      }

      // Step 2: Create Class
      updateStepStatus('class', 'running');
      try {
        const classId = `CLS-TEST-${Date.now().toString(36).toUpperCase()}`;
        try {
          const existingClass = await classesService.getById(classId);
          createdData.class = existingClass;
          log.push({ step: 'Class', status: 'skipped', reason: 'Already exists' });
          updateStepStatus('class', 'success', `Using existing: ${existingClass.name}`);
        } catch {
          try {
            const newClass = await classesService.create({
              classId,
              name: 'Test Class 10',
              description: 'Test class for single student V2 verification',
              capacity: 40,
              status: 'Active',
            });
            createdData.class = newClass;
            log.push({ step: 'Class', status: 'created' });
            updateStepStatus('class', 'success', `Created: ${newClass.name}`);
          } catch (createError: any) {
            if (createError.message?.includes('already exists')) {
              try {
                const existingClass = await classesService.getById(classId);
                createdData.class = existingClass;
                log.push({ step: 'Class', status: 'skipped', reason: 'Already exists' });
                updateStepStatus('class', 'success', `Using existing: ${existingClass.name}`);
              } catch {
                log.push({ step: 'Class', status: 'failed', reason: createError.message });
                updateStepStatus('class', 'error', createError.message);
                throw createError;
              }
            } else {
              log.push({ step: 'Class', status: 'failed', reason: createError.message });
              updateStepStatus('class', 'error', createError.message);
              throw createError;
            }
          }
        }
      } catch (error: any) {
        updateStepStatus('class', 'error', error.message);
        throw error;
      }

      // Step 3: Create Section
      updateStepStatus('section', 'running');
      try {
        const sectionId = `SEC-TEST-${Date.now().toString(36).toUpperCase()}`;
        try {
          const existingSection = await sectionsService.getById(sectionId);
          createdData.section = existingSection;
          log.push({ step: 'Section', status: 'skipped', reason: 'Already exists' });
          updateStepStatus('section', 'success', `Using existing: ${existingSection.name}`);
        } catch {
          try {
            const newSection = await sectionsService.create({
              sectionId,
              name: 'Test Section A',
              capacity: 40,
              roomNumber: 'Room TEST-101',
              status: 'Active',
            });
            createdData.section = newSection;
            log.push({ step: 'Section', status: 'created' });
            updateStepStatus('section', 'success', `Created: ${newSection.name}`);
          } catch (createError: any) {
            if (createError.message?.includes('already exists')) {
              try {
                const existingSection = await sectionsService.getById(sectionId);
                createdData.section = existingSection;
                log.push({ step: 'Section', status: 'skipped', reason: 'Already exists' });
                updateStepStatus('section', 'success', `Using existing: ${existingSection.name}`);
              } catch {
                log.push({ step: 'Section', status: 'failed', reason: createError.message });
                updateStepStatus('section', 'error', createError.message);
                throw createError;
              }
            } else {
              log.push({ step: 'Section', status: 'failed', reason: createError.message });
              updateStepStatus('section', 'error', createError.message);
              throw createError;
            }
          }
        }
      } catch (error: any) {
        updateStepStatus('section', 'error', error.message);
        throw error;
      }

      // Step 4: Link Class-Section
      updateStepStatus('class-section', 'running');
      try {
        await classesService.addSectionToClass(createdData.class.classId, createdData.section.sectionId);
        log.push({ step: 'Class-Section Link', status: 'created' });
        updateStepStatus('class-section', 'success', `Linked`);
      } catch (error: any) {
        if (error.message?.includes('already') || error.message?.includes('exists')) {
          log.push({ step: 'Class-Section Link', status: 'skipped', reason: 'Link already exists' });
          updateStepStatus('class-section', 'success', `Link exists`);
        } else {
          log.push({ step: 'Class-Section Link', status: 'failed', reason: error.message });
          updateStepStatus('class-section', 'success', `Link exists (or error ignored)`);
        }
      }

      // Step 5: Create Teacher
      updateStepStatus('teacher', 'running');
      try {
        const teacherId = `TCH-TEST-${Date.now().toString(36).toUpperCase()}`;
        try {
          const existingTeacher = await teachersService.getById(teacherId);
          createdData.teacher = existingTeacher;
          log.push({ step: 'Teacher', status: 'skipped', reason: 'Already exists' });
          updateStepStatus('teacher', 'success', `Using existing: ${existingTeacher.name}`);
        } catch {
          try {
            const newTeacher = await teachersService.create({
              teacherId,
              name: 'Dr. Test Teacher',
              email: `test.teacher.${Date.now()}@school.edu`,
              phone: '+1234567890',
              department: 'Science',
              designation: 'Senior Teacher',
              qualification: 'Ph.D.',
              experience: 10,
              joiningDate: new Date().toISOString().split('T')[0],
              status: 'Active',
            });
            createdData.teacher = newTeacher;
            log.push({ step: 'Teacher', status: 'created' });
            updateStepStatus('teacher', 'success', `Created: ${newTeacher.name}`);
          } catch (createError: any) {
            if (createError.message?.includes('already exists')) {
              try {
                const existingTeacher = await teachersService.getById(teacherId);
                createdData.teacher = existingTeacher;
                log.push({ step: 'Teacher', status: 'skipped', reason: 'Already exists' });
                updateStepStatus('teacher', 'success', `Using existing: ${existingTeacher.name}`);
              } catch {
                log.push({ step: 'Teacher', status: 'failed', reason: createError.message });
                updateStepStatus('teacher', 'error', createError.message);
                throw createError;
              }
            } else {
              log.push({ step: 'Teacher', status: 'failed', reason: createError.message });
              updateStepStatus('teacher', 'error', createError.message);
              throw createError;
            }
          }
        }
      } catch (error: any) {
        updateStepStatus('teacher', 'error', error.message);
        throw error;
      }

      // Step 6: Create 3 Subjects
      updateStepStatus('subjects', 'running');
      try {
        const subjectNames = [
          { name: 'Mathematics', code: 'MATH' },
          { name: 'Physics', code: 'PHY' },
          { name: 'Chemistry', code: 'CHEM' },
        ];
        
        // Use unique subject codes with timestamp to avoid conflicts
        const timestamp = Date.now().toString(36).toUpperCase();
        
        for (const subj of subjectNames) {
          // Use unique subject code with timestamp to avoid conflicts
          const subjectCode = `${subj.code}-TEST-${timestamp}`;
          const subjectId = `SUB-TEST-${subj.code}-${timestamp}`;
          
          try {
            const newSubject = await subjectsService.create({
              subjectId,
              subjectName: subj.name,
              subjectCode: subjectCode,
              classId: createdData.class.classId,
              teacherId: createdData.teacher.teacherId,
              teacherIds: [createdData.teacher.teacherId],
              description: `${subj.name} for test`,
              credits: 4,
              hoursPerWeek: 5,
              status: 'Active',
            });
            createdData.subjects.push(newSubject);
            log.push({ step: `Subject: ${subj.name}`, status: 'created' });
          } catch (createError: any) {
            if (createError.message?.includes('already exists')) {
              // Subject with this code already exists, try to find it by code
              try {
                const allSubjects = await subjectsService.getAll({ search: subjectCode });
                const foundSubject = allSubjects.find((s) => s.subjectCode === subjectCode);
                
                if (foundSubject) {
                  createdData.subjects.push(foundSubject);
                  log.push({ step: `Subject: ${subj.name}`, status: 'skipped', reason: 'Already exists (found by code)' });
                } else {
                  // Try to find by name for this class
                  const classSubjects = await subjectsService.getAll({ classId: createdData.class.classId });
                  const foundByName = classSubjects.find((s) => s.subjectName === subj.name);
                  
                  if (foundByName) {
                    createdData.subjects.push(foundByName);
                    log.push({ step: `Subject: ${subj.name}`, status: 'skipped', reason: 'Already exists (found by name for class)' });
                  } else {
                    // Use any existing subject with this name (subjects can be shared)
                    const allSubjectsByName = await subjectsService.getAll({ search: subj.name });
                    const foundByNameGlobal = allSubjectsByName.find((s) => s.subjectName === subj.name);
                    
                    if (foundByNameGlobal) {
                      createdData.subjects.push(foundByNameGlobal);
                      log.push({ step: `Subject: ${subj.name}`, status: 'skipped', reason: 'Using existing subject with same name' });
                    } else {
                      log.push({ step: `Subject: ${subj.name}`, status: 'failed', reason: 'Could not find or create subject' });
                      console.warn(`Could not create or find subject: ${subj.name}`);
                    }
                  }
                }
              } catch (retryError) {
                log.push({ step: `Subject: ${subj.name}`, status: 'failed', reason: createError.message });
                console.warn(`Failed to create subject ${subj.name}:`, createError);
                // Continue with other subjects
              }
            } else {
              log.push({ step: `Subject: ${subj.name}`, status: 'failed', reason: createError.message });
              console.warn(`Failed to create subject ${subj.name}:`, createError);
              // Continue with other subjects
            }
          }
        }
        
        if (createdData.subjects.length === 0) {
          throw new Error('Failed to create or find any subjects');
        }
        updateStepStatus('subjects', 'success', `Created/Found: ${createdData.subjects.length} subjects`);
      } catch (error: any) {
        updateStepStatus('subjects', 'error', error.message);
        throw error;
      }

      // Step 7: Create 1 Test Student
      updateStepStatus('student', 'running');
      try {
        const studentId = `STU-TEST-${Date.now()}`.toUpperCase();
        const timestamp = Date.now();
        const newStudent = await studentsService.create({
          studentId,
          name: testStudentName,
          email: `test.student.${timestamp}@school.edu`,
          phone: '+1234567890',
          dateOfBirth: '2008-05-15',
          gender: 'Male',
          address: 'Test Student Lane, Education City',
          classId: createdData.class.classId,
          sectionId: createdData.section.sectionId,
          rollNo: 1,
          parentName: `Parent of ${testStudentName}`,
          parentContact: '+1234567891',
          parentEmail: `test.parent.${timestamp}@school.edu`,
          admissionDate: new Date().toISOString().split('T')[0],
          status: 'Active',
        });
        createdData.student = newStudent;
        createdStudentName = newStudent.name;
        updateStepStatus('student', 'success', `Created: ${newStudent.name}`);
      } catch (error: any) {
        updateStepStatus('student', 'error', error.message);
        throw error;
      }

      // Step 8: Create Unit Test Exams - 3 for Term 1, 3 for Term 2
      updateStepStatus('unit-tests', 'running');
      try {
        // Validate required data
        if (!createdData.academicYear || !createdData.academicYear.academicYearId) {
          throw new Error('Academic Year not found. Please ensure academic year is created first.');
        }
        if (!createdData.class || !createdData.class.classId) {
          throw new Error('Class not found. Please ensure class is created first.');
        }
        
        const unitTestExamsCreated: any[] = [];
        
        // Term 1: Unit Tests 1, 2, 3
        for (let i = 1; i <= 3; i++) {
          const timestamp = Date.now();
          const randomSuffix = Math.random().toString(36).substr(2, 5).toUpperCase();
          const examId = `EXM-UT-T1-${i}-${timestamp}-${randomSuffix}`.toUpperCase();
          const baseDate = new Date();
          const startDate = new Date(baseDate);
          startDate.setDate(startDate.getDate() + (i - 1) * 7); // 7 days apart
          const endDate = new Date(startDate);
          endDate.setDate(endDate.getDate() + 1); // 1 day duration
          
          try {
            console.log(`Creating Unit Test ${i} (Term 1) with examId: ${examId}`);
            console.log(`Academic Year: ${createdData.academicYear.academicYearId}, Class: ${createdData.class.classId}`);
            
            const newExam = await examsService.create({
              examId,
              examName: `Unit Test ${i} (Term 1)`,
              examType: 'Unit Test',
              academicYear: createdData.academicYear.academicYearId,
              classId: createdData.class.classId,
              term: 'Term 1',
              startDate: startDate.toISOString().split('T')[0],
              endDate: endDate.toISOString().split('T')[0],
              totalMarks: 100,
              passingMarks: 40,
              status: 'Completed',
            });
            unitTestExamsCreated.push(newExam);
            log.push({ step: `Unit Test ${i} (Term 1)`, status: 'created' });
            
            // Small delay to avoid race conditions
            await new Promise(resolve => setTimeout(resolve, 50));
          } catch (examError: any) {
            console.error(`❌ Failed to create Unit Test ${i} (Term 1):`, examError);
            console.error(`Error details:`, {
              examId,
              academicYear: createdData.academicYear?.academicYearId,
              classId: createdData.class?.classId,
              startDate: startDate.toISOString().split('T')[0],
              endDate: endDate.toISOString().split('T')[0],
            });
            log.push({ step: `Unit Test ${i} (Term 1)`, status: 'failed', reason: examError.message || examError.toString() });
            // Continue with next exam instead of throwing
          }
        }
        
        // Term 2: Unit Tests 4, 5, 6
        for (let i = 4; i <= 6; i++) {
          const timestamp = Date.now();
          const randomSuffix = Math.random().toString(36).substr(2, 5).toUpperCase();
          const examId = `EXM-UT-T2-${i}-${timestamp}-${randomSuffix}`.toUpperCase();
          const utIndex = i - 3; // Index within Term 2 (1, 2, 3)
          const baseDate = new Date();
          baseDate.setMonth(baseDate.getMonth() + 4); // Start Term 2 exams 4 months later
          const startDate = new Date(baseDate);
          startDate.setDate(startDate.getDate() + (utIndex - 1) * 7); // 7 days apart
          const endDate = new Date(startDate);
          endDate.setDate(endDate.getDate() + 1); // 1 day duration
          
          try {
            console.log(`Creating Unit Test ${i} (Term 2) with examId: ${examId}`);
            console.log(`Academic Year: ${createdData.academicYear.academicYearId}, Class: ${createdData.class.classId}`);
            
            const newExam = await examsService.create({
              examId,
              examName: `Unit Test ${i} (Term 2)`,
              examType: 'Unit Test',
              academicYear: createdData.academicYear.academicYearId,
              classId: createdData.class.classId,
              term: 'Term 2',
              startDate: startDate.toISOString().split('T')[0],
              endDate: endDate.toISOString().split('T')[0],
              totalMarks: 100,
              passingMarks: 40,
              status: 'Completed',
            });
            unitTestExamsCreated.push(newExam);
            log.push({ step: `Unit Test ${i} (Term 2)`, status: 'created' });
            
            // Small delay to avoid race conditions
            await new Promise(resolve => setTimeout(resolve, 50));
          } catch (examError: any) {
            console.error(`❌ Failed to create Unit Test ${i} (Term 2):`, examError);
            console.error(`Error details:`, {
              examId,
              academicYear: createdData.academicYear?.academicYearId,
              classId: createdData.class?.classId,
              startDate: startDate.toISOString().split('T')[0],
              endDate: endDate.toISOString().split('T')[0],
            });
            log.push({ step: `Unit Test ${i} (Term 2)`, status: 'failed', reason: examError.message || examError.toString() });
            // Continue with next exam instead of throwing
          }
        }
        
        createdData.unitTestExams = unitTestExamsCreated;
        updateStepStatus('unit-tests', 'success', `Created: ${unitTestExamsCreated.length} unit tests (3 Term 1 + 3 Term 2)`);
      } catch (error: any) {
        updateStepStatus('unit-tests', 'error', error.message);
        throw error;
      }

      // Step 9: Create Term 1 (Mid-Term) and Term 2 (Final) Exams for CBSE Format
      updateStepStatus('exam', 'running');
      try {
        const finalExamsCreated: any[] = [];
        
        // Term 1: Mid-Term Examination (Half Yearly)
        const term1ExamId = `EXM-T1-TEST-${Date.now()}`.toUpperCase();
        const term1Exam = await examsService.create({
          examId: term1ExamId,
          examName: 'Mid-Term Examination (Half Yearly)',
          examType: 'Mid-Term',
          academicYear: createdData.academicYear.academicYearId,
          classId: createdData.class.classId,
          term: 'Term 1',
          startDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          endDate: new Date(Date.now() + 95 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          totalMarks: 300,
          passingMarks: 120,
          status: 'Completed',
        });
        finalExamsCreated.push(term1Exam);
        log.push({ step: 'Term 1 Exam (Mid-Term)', status: 'created' });
        
        // Term 2: Final Examination (Annual)
        const term2ExamId = `EXM-T2-TEST-${Date.now()}`.toUpperCase();
        const term2Exam = await examsService.create({
          examId: term2ExamId,
          examName: 'Final Examination (Annual)',
          examType: 'Final',
          academicYear: createdData.academicYear.academicYearId,
          classId: createdData.class.classId,
          term: 'Term 2',
          startDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          endDate: new Date(Date.now() + 185 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          totalMarks: 300,
          passingMarks: 120,
          status: 'Completed',
        });
        finalExamsCreated.push(term2Exam);
        log.push({ step: 'Term 2 Exam (Final)', status: 'created' });
        
        createdData.finalExams = finalExamsCreated;
        updateStepStatus('exam', 'success', `Created: ${finalExamsCreated.length} exams (Term 1 & Term 2)`);
      } catch (error: any) {
        updateStepStatus('exam', 'error', error.message);
        throw error;
      }

      // Step 10: Create Unit Test Marks for Term 1 and Term 2
      updateStepStatus('unit-test-marks', 'running');
      try {
        const unitTestMarksEntries: any[] = [];
        let markCounter = 0;

        // Generate unit test marks for each subject
        // Term 1: UT1, UT2, UT3 scores (will be averaged for PT)
        // Term 2: UT4, UT5, UT6 scores (will be averaged for PT)
        const term1UnitTestScores = [75, 80, 85]; // Scores for UT1, UT2, UT3
        const term2UnitTestScores = [82, 88, 90]; // Scores for UT4, UT5, UT6

        for (let i = 0; i < createdData.unitTestExams.length; i++) {
          const unitTestExam = createdData.unitTestExams[i];
          const isTerm1 = unitTestExam.term === 'Term 1';
          const utIndex = isTerm1 ? i : i - 3; // Index within term (0-2 for Term 1, 0-2 for Term 2)
          const scores = isTerm1 ? term1UnitTestScores : term2UnitTestScores;
          const marksObtained = scores[utIndex] || 75;

          for (const subj of createdData.subjects) {
            const uniqueId = `${Date.now()}-${markCounter++}-${Math.random().toString(36).substr(2, 5)}`;
            const markId = `MRK-UT-${isTerm1 ? 'T1' : 'T2'}-${utIndex + 1}-${uniqueId}`.toUpperCase();
            const percentage = (marksObtained / 100) * 100;

            try {
              const markData: any = {
                markId,
                studentId: createdData.student.studentId,
                examId: unitTestExam.examId,
                subjectId: subj.subjectId,
                marksObtained,
                totalMarks: 100,
                grade: calculateGrade(percentage),
                remarks: `Unit Test ${utIndex + 1} (${isTerm1 ? 'Term 1' : 'Term 2'})`,
                isAbsent: false,
                status: 'Published',
                enteredBy: 'System',
                marksType: 'Unit Test',
                // Unit test marks map to internalMarks for Template 1 & 3
                internalMarks: marksObtained,
              };
              
              if (createdData.student.classId) {
                markData.classId = createdData.student.classId;
              }
              
              const newMark = await marksService.create(markData);
              unitTestMarksEntries.push(newMark);
              
              await new Promise(resolve => setTimeout(resolve, 50));
            } catch (markError: any) {
              console.error(`Failed to create unit test mark ${utIndex + 1} for ${subj.subjectName}:`, markError);
              // Continue with next mark
            }
          }
        }

        createdData.unitTestMarks = unitTestMarksEntries;
        updateStepStatus('unit-test-marks', 'success', `Created: ${unitTestMarksEntries.length} unit test marks (Term 1 & Term 2)`);
      } catch (error: any) {
        updateStepStatus('unit-test-marks', 'error', error.message);
        throw error;
      }

      // Step 11: Create COMBINED marks for Term 1 and Term 2 (one mark per subject per term with all breakdown fields)
      updateStepStatus('final-exam-marks', 'running');
      try {
        const allMarksEntries: any[] = [];
        let markCounter = 0;

        // Get Term 1 and Term 2 exams
        const term1Exam = createdData.finalExams.find((e: any) => e.term === 'Term 1');
        const term2Exam = createdData.finalExams.find((e: any) => e.term === 'Term 2');

        if (!term1Exam || !term2Exam) {
          throw new Error('Term 1 or Term 2 exam not found');
        }

        // Subject-wise data for NB, SE, and External marks
        const subjectData = [
          { name: 'Mathematics', term1: { nb: 4.5, se: 4.5, external: 72 }, term2: { nb: 5, se: 5, external: 75 } },
          { name: 'Physics', term1: { nb: 4, se: 4, external: 68 }, term2: { nb: 4.5, se: 4.5, external: 70 } },
          { name: 'Chemistry', term1: { nb: 5, se: 5, external: 74 }, term2: { nb: 5, se: 5, external: 76 } },
        ];

        for (let idx = 0; idx < createdData.subjects.length; idx++) {
          const subj = createdData.subjects[idx];
          const data = subjectData[idx] || subjectData[0];

          // ========== TERM 1 COMBINED MARK ==========
          
          // Calculate PT from Unit Test averages (Term 1)
          const term1UnitTests = createdData.unitTestMarks.filter((m: any) => {
            const exam = createdData.unitTestExams.find((e: any) => e.examId === m.examId);
            return exam && exam.term === 'Term 1' && m.subjectId === subj.subjectId;
          });
          
          let term1PT = 0;
          if (term1UnitTests.length > 0) {
            const avgUnitTest = term1UnitTests.reduce((sum: number, m: any) => sum + (parseFloat(m.marksObtained) || 0), 0) / term1UnitTests.length;
            term1PT = Math.min(10, Math.max(0, (avgUnitTest / 100) * 10)); // Scale to 10
          } else {
            term1PT = 8.0; // Default if no unit tests
          }

          // Create ONE combined mark for Term 1 with ALL breakdown fields
          try {
            const uniqueId = `${Date.now()}-${markCounter++}-${Math.random().toString(36).substr(2, 5)}`;
            const term1MarkId = `MRK-T1-CBSE-${uniqueId}`.toUpperCase();
            
            // Total = PT(10) + NB(5) + SE(5) + External(80) = 100
            const term1Total = term1PT + data.term1.nb + data.term1.se + data.term1.external;
            
            const term1MarkData: any = {
              markId: term1MarkId,
              studentId: createdData.student.studentId,
              examId: term1Exam.examId,
              subjectId: subj.subjectId,
              marksObtained: term1Total,
              totalMarks: 100,
              grade: calculateGrade(term1Total),
              remarks: `Term 1 Combined: PT=${term1PT.toFixed(1)}, NB=${data.term1.nb}, SE=${data.term1.se}, HY=${data.term1.external}`,
              isAbsent: false,
              status: 'Published',
              enteredBy: 'System',
              marksType: 'Final',
              // ALL breakdown fields in one mark entry - ensure they're numbers
              unitTestMarks: parseFloat(term1PT.toFixed(2)) || 0,
              assignmentMarks: parseFloat(data.term1.nb.toFixed(2)) || 0,
              attendanceMarks: parseFloat(data.term1.se.toFixed(2)) || 0,
              externalMarks: parseFloat(data.term1.external.toFixed(2)) || 0,
              internalMarks: parseFloat((term1PT + data.term1.nb + data.term1.se).toFixed(2)) || 0, // PT + NB + SE = internal (20)
            };
            if (createdData.student.classId) term1MarkData.classId = createdData.student.classId;
            
            console.log(`📝 Creating Term 1 combined mark for ${subj.subjectName}:`, term1MarkData);
            const term1Mark = await marksService.create(term1MarkData);
            allMarksEntries.push(term1Mark);
            await new Promise(resolve => setTimeout(resolve, 50));
          } catch (error: any) {
            console.error(`Failed to create Term 1 combined mark for ${subj.subjectName}:`, error);
          }

          // ========== TERM 2 COMBINED MARK ==========
          
          // Calculate PT from Unit Test averages (Term 2)
          const term2UnitTests = createdData.unitTestMarks.filter((m: any) => {
            const exam = createdData.unitTestExams.find((e: any) => e.examId === m.examId);
            return exam && exam.term === 'Term 2' && m.subjectId === subj.subjectId;
          });
          
          let term2PT = 0;
          if (term2UnitTests.length > 0) {
            const avgUnitTest = term2UnitTests.reduce((sum: number, m: any) => sum + (parseFloat(m.marksObtained) || 0), 0) / term2UnitTests.length;
            term2PT = Math.min(10, Math.max(0, (avgUnitTest / 100) * 10)); // Scale to 10
          } else {
            term2PT = 9.0; // Default if no unit tests
          }

          // Create ONE combined mark for Term 2 with ALL breakdown fields
          try {
            const uniqueId = `${Date.now()}-${markCounter++}-${Math.random().toString(36).substr(2, 5)}`;
            const term2MarkId = `MRK-T2-CBSE-${uniqueId}`.toUpperCase();
            
            // Total = PT(10) + NB(5) + SE(5) + External(80) = 100
            const term2Total = term2PT + data.term2.nb + data.term2.se + data.term2.external;
            
            const term2MarkData: any = {
              markId: term2MarkId,
              studentId: createdData.student.studentId,
              examId: term2Exam.examId,
              subjectId: subj.subjectId,
              marksObtained: term2Total,
              totalMarks: 100,
              grade: calculateGrade(term2Total),
              remarks: `Term 2 Combined: PT=${term2PT.toFixed(1)}, NB=${data.term2.nb}, SE=${data.term2.se}, Annual=${data.term2.external}`,
              isAbsent: false,
              status: 'Published',
              enteredBy: 'System',
              marksType: 'Final',
              // ALL breakdown fields in one mark entry - ensure they're numbers
              unitTestMarks: parseFloat(term2PT.toFixed(2)) || 0,
              assignmentMarks: parseFloat(data.term2.nb.toFixed(2)) || 0,
              attendanceMarks: parseFloat(data.term2.se.toFixed(2)) || 0,
              externalMarks: parseFloat(data.term2.external.toFixed(2)) || 0,
              internalMarks: parseFloat((term2PT + data.term2.nb + data.term2.se).toFixed(2)) || 0, // PT + NB + SE = internal (20)
            };
            if (createdData.student.classId) term2MarkData.classId = createdData.student.classId;
            
            console.log(`📝 Creating Term 2 combined mark for ${subj.subjectName}:`, term2MarkData);
            const term2Mark = await marksService.create(term2MarkData);
            allMarksEntries.push(term2Mark);
            await new Promise(resolve => setTimeout(resolve, 50));
          } catch (error: any) {
            console.error(`Failed to create Term 2 combined mark for ${subj.subjectName}:`, error);
          }
        }

        createdData.finalExamMarks = allMarksEntries;
        updateStepStatus('final-exam-marks', 'success', `Created: ${allMarksEntries.length} Template 2 marks (Term 1 & Term 2)`);
      } catch (error: any) {
        updateStepStatus('final-exam-marks', 'error', error.message);
        throw error;
      }

      // Step 11b: Create Template 1 marks (Simple marks for Original template)
      updateStepStatus('template1-marks', 'running');
      try {
        const template1Marks: any[] = [];
        let markCounter = 0;

        const term1Exam = createdData.finalExams.find((e: any) => e.term === 'Term 1');
        const term2Exam = createdData.finalExams.find((e: any) => e.term === 'Term 2');

        if (term1Exam && term2Exam) {
          // Subject-wise simple marks for Template 1
          const template1Scores = [
            { name: 'Mathematics', term1: 85, term2: 88 },
            { name: 'Physics', term1: 78, term2: 82 },
            { name: 'Chemistry', term1: 82, term2: 85 },
          ];

          for (let idx = 0; idx < createdData.subjects.length; idx++) {
            const subj = createdData.subjects[idx];
            const scores = template1Scores[idx] || template1Scores[0];

            // Term 1 Template 1 mark
            try {
              const uniqueId = `${Date.now()}-${markCounter++}-${Math.random().toString(36).substr(2, 5)}`;
              const term1MarkId = `MRK-T1-T1-${uniqueId}`.toUpperCase();
              
              const term1MarkData: any = {
                markId: term1MarkId,
                studentId: createdData.student.studentId,
                examId: term1Exam.examId,
                subjectId: subj.subjectId,
                marksObtained: scores.term1,
                totalMarks: 100,
                grade: calculateGrade(scores.term1),
                remarks: `Term 1 - Template 1 (Simple)`,
                isAbsent: false,
                status: 'Published',
                enteredBy: 'System',
                marksType: 'Mid-Term',
              };
              if (createdData.student.classId) term1MarkData.classId = createdData.student.classId;
              
              const term1Mark = await marksService.create(term1MarkData);
              template1Marks.push(term1Mark);
              await new Promise(resolve => setTimeout(resolve, 50));
            } catch (error: any) {
              console.error(`Failed to create Term 1 Template 1 mark for ${subj.subjectName}:`, error);
            }

            // Term 2 Template 1 mark
            try {
              const uniqueId = `${Date.now()}-${markCounter++}-${Math.random().toString(36).substr(2, 5)}`;
              const term2MarkId = `MRK-T2-T1-${uniqueId}`.toUpperCase();
              
              const term2MarkData: any = {
                markId: term2MarkId,
                studentId: createdData.student.studentId,
                examId: term2Exam.examId,
                subjectId: subj.subjectId,
                marksObtained: scores.term2,
                totalMarks: 100,
                grade: calculateGrade(scores.term2),
                remarks: `Term 2 - Template 1 (Simple)`,
                isAbsent: false,
                status: 'Published',
                enteredBy: 'System',
                marksType: 'Final',
              };
              if (createdData.student.classId) term2MarkData.classId = createdData.student.classId;
              
              const term2Mark = await marksService.create(term2MarkData);
              template1Marks.push(term2Mark);
              await new Promise(resolve => setTimeout(resolve, 50));
            } catch (error: any) {
              console.error(`Failed to create Term 2 Template 1 mark for ${subj.subjectName}:`, error);
            }
          }
        }

        updateStepStatus('template1-marks', 'success', `Created: ${template1Marks.length} Template 1 marks (Term 1 & Term 2)`);
      } catch (error: any) {
        updateStepStatus('template1-marks', 'error', error.message);
        // Don't throw - continue with Template 3
      }

      // Step 11c: Create Template 3 marks (Assessment 20 + Written 80)
      updateStepStatus('template3-marks', 'running');
      try {
        const template3Marks: any[] = [];
        let markCounter = 0;

        const term1Exam = createdData.finalExams.find((e: any) => e.term === 'Term 1');
        const term2Exam = createdData.finalExams.find((e: any) => e.term === 'Term 2');

        if (term1Exam && term2Exam) {
          // Subject-wise Assessment and Written marks for Template 3
          const template3Scores = [
            { name: 'Mathematics', term1: { assessment: 18, written: 70 }, term2: { assessment: 19, written: 72 } },
            { name: 'Physics', term1: { assessment: 17, written: 65 }, term2: { assessment: 18, written: 68 } },
            { name: 'Chemistry', term1: { assessment: 19, written: 68 }, term2: { assessment: 19, written: 70 } },
          ];

          for (let idx = 0; idx < createdData.subjects.length; idx++) {
            const subj = createdData.subjects[idx];
            const scores = template3Scores[idx] || template3Scores[0];

            // Term 1 Template 3 mark
            try {
              const uniqueId = `${Date.now()}-${markCounter++}-${Math.random().toString(36).substr(2, 5)}`;
              const term1MarkId = `MRK-T1-T3-${uniqueId}`.toUpperCase();
              
              const term1Total = scores.term1.assessment + scores.term1.written;
              
              const term1MarkData: any = {
                markId: term1MarkId,
                studentId: createdData.student.studentId,
                examId: term1Exam.examId,
                subjectId: subj.subjectId,
                marksObtained: term1Total,
                totalMarks: 100,
                grade: calculateGrade(term1Total),
                remarks: `Term 1 - Template 3: Assessment=${scores.term1.assessment}, Written=${scores.term1.written}`,
                isAbsent: false,
                status: 'Published',
                enteredBy: 'System',
                marksType: 'Mid-Term',
                // Template 3: Assessment (20) = internalMarks, Written (80) = externalMarks
                internalMarks: parseFloat(scores.term1.assessment.toFixed(2)),
                externalMarks: parseFloat(scores.term1.written.toFixed(2)),
              };
              if (createdData.student.classId) term1MarkData.classId = createdData.student.classId;
              
              const term1Mark = await marksService.create(term1MarkData);
              template3Marks.push(term1Mark);
              await new Promise(resolve => setTimeout(resolve, 50));
            } catch (error: any) {
              console.error(`Failed to create Term 1 Template 3 mark for ${subj.subjectName}:`, error);
            }

            // Term 2 Template 3 mark
            try {
              const uniqueId = `${Date.now()}-${markCounter++}-${Math.random().toString(36).substr(2, 5)}`;
              const term2MarkId = `MRK-T2-T3-${uniqueId}`.toUpperCase();
              
              const term2Total = scores.term2.assessment + scores.term2.written;
              
              const term2MarkData: any = {
                markId: term2MarkId,
                studentId: createdData.student.studentId,
                examId: term2Exam.examId,
                subjectId: subj.subjectId,
                marksObtained: term2Total,
                totalMarks: 100,
                grade: calculateGrade(term2Total),
                remarks: `Term 2 - Template 3: Assessment=${scores.term2.assessment}, Written=${scores.term2.written}`,
                isAbsent: false,
                status: 'Published',
                enteredBy: 'System',
                marksType: 'Final',
                // Template 3: Assessment (20) = internalMarks, Written (80) = externalMarks
                internalMarks: parseFloat(scores.term2.assessment.toFixed(2)),
                externalMarks: parseFloat(scores.term2.written.toFixed(2)),
              };
              if (createdData.student.classId) term2MarkData.classId = createdData.student.classId;
              
              const term2Mark = await marksService.create(term2MarkData);
              template3Marks.push(term2Mark);
              await new Promise(resolve => setTimeout(resolve, 50));
            } catch (error: any) {
              console.error(`Failed to create Term 2 Template 3 mark for ${subj.subjectName}:`, error);
            }
          }
        }

        updateStepStatus('template3-marks', 'success', `Created: ${template3Marks.length} Template 3 marks (Term 1 & Term 2)`);
      } catch (error: any) {
        updateStepStatus('template3-marks', 'error', error.message);
        // Don't throw - continue with results
      }

      // Step 12: Create Results for BOTH Term 1 and Term 2 (using Template 2 marks)
      updateStepStatus('result', 'running');
      try {
        const resultsCreated: any[] = [];
        
        // Calculate results for each exam (Term 1 and Term 2)
        for (const finalExam of createdData.finalExams) {
          const isTerm1 = finalExam.term === 'Term 1';
          const termLabel = isTerm1 ? 'Term 1 (Mid-Term)' : 'Term 2 (Final)';
          
          // Get marks for this exam only
          const examMarks = createdData.finalExamMarks.filter((m: any) => m.examId === finalExam.examId);
          
          // Skip if no marks were created for this exam
          if (examMarks.length === 0) {
            log.push({ step: `Result - ${termLabel}`, status: 'skipped', reason: 'No marks available' });
            continue;
          }
          
          const subjectResults = examMarks.map((mark: any) => {
            const subj = createdData.subjects.find((s: any) => s.subjectId === mark.subjectId);
            const marksObtained = parseFloat(mark.marksObtained) || 0;
            const maxMarks = 100;
            // Calculate percentage: marks obtained out of max marks
            const percentage = maxMarks > 0 ? (marksObtained / maxMarks) * 100 : 0;
            const passed = marksObtained >= 40;

            return {
              subjectId: subj?.subjectId || mark.subjectId,
              subjectName: subj?.subjectName || 'Unknown',
              maxMarks: maxMarks,
              marksObtained: marksObtained,
              internalMarks: parseFloat(mark.internalMarks) || 0,
              externalMarks: parseFloat(mark.externalMarks) || 0,
              breakdown: {
                unitTest: parseFloat(mark.unitTestMarks) || 0,
                assignment: parseFloat(mark.assignmentMarks) || 0,
                attendance: parseFloat(mark.attendanceMarks) || 0,
                external: parseFloat(mark.externalMarks) || 0,
              },
              grade: calculateGrade(percentage),
              isPassed: passed,
            };
          });

          const totalMarks = subjectResults.reduce((sum: number, s: any) => sum + s.marksObtained, 0);
          const totalMaxMarks = subjectResults.length * 100;
          // Ensure percentage is a valid number between 0-100
          const percentage = totalMaxMarks > 0 ? Math.min(100, Math.max(0, (totalMarks / totalMaxMarks) * 100)) : 0;
          const overallGrade = calculateGrade(percentage);
          const isPassed = percentage >= 40;

          // Ensure percentage is a valid number
          if (isNaN(percentage) || !isFinite(percentage)) {
            console.error(`Invalid percentage calculated: ${percentage} for exam ${finalExam.examId}`);
            log.push({ step: `Result - ${termLabel}`, status: 'failed', reason: 'Invalid percentage calculation' });
            continue;
          }

          const resultId = `RES-${isTerm1 ? 'T1' : 'T2'}-TEST-${Date.now()}`.toUpperCase();
          
          try {
            const newResult = await resultsService.create({
              resultId,
              studentId: createdData.student.studentId,
              studentName: createdData.student.name,
              examId: finalExam.examId,
              examName: finalExam.examName,
              classId: createdData.class.classId,
              subjects: subjectResults,
              totalMaxMarks,
              totalMarksObtained: totalMarks,
              percentage: parseFloat(percentage.toFixed(2)), // Ensure it's a valid number
              grade: overallGrade,
              rank: 0,
              isPassed,
              status: 'Published',
              remarks: `${termLabel} - CBSE Format: PT/NB/SE/Exam breakdown. Total: ${totalMarks.toFixed(2)}/${totalMaxMarks} (${percentage.toFixed(2)}%)`,
            });

            // Publish the result
            try {
              await resultsService.publish(resultId);
            } catch (publishError: any) {
              console.warn(`Failed to publish result ${resultId}:`, publishError);
            }

            resultsCreated.push(newResult);
            log.push({ step: `Result - ${termLabel}`, status: 'created' });
          } catch (resultError: any) {
            console.error(`Failed to create result for ${termLabel}:`, resultError);
            log.push({ step: `Result - ${termLabel}`, status: 'failed', reason: resultError.message || 'Unknown error' });
            // Continue with next exam instead of throwing
          }
        }

        createdData.results = resultsCreated;
        if (resultsCreated.length > 0) {
          updateStepStatus('result', 'success', `Created & Published: ${resultsCreated.length} results (Term 1 & Term 2)`);
        } else {
          updateStepStatus('result', 'error', 'No results created - check mark creation errors');
        }
      } catch (error: any) {
        updateStepStatus('result', 'error', error.message);
        // Don't throw - allow other steps to continue
        console.error('Results creation failed:', error);
      }

      // Step 12d: Create Student Habits (for Template 3)
      updateStepStatus('student-habits', 'running');
      try {
        if (createdData.student && createdData.academicYear) {
          const habitNames = ['Courteous', 'Art/Craft', 'Responsibility', 'Systematic', 'Sports', 'Elocution', 'Gen.Knowledge', 'Cultural Activities', 'Cleanliness', 'Hindi Oral', 'English Oral'];
          const grades = ['A', 'B', 'C'];
          let totalHabitsCreated = 0;
          
          for (const habitName of habitNames) {
            try {
              const habitId = `HABIT-${createdData.student.studentId}-${habitName}-${Date.now()}`.toUpperCase();
              const term1Grade = grades[Math.floor(Math.random() * grades.length)];
              const term2Grade = grades[Math.floor(Math.random() * grades.length)];
              
              await studentHabitsService.create({
                habitId,
                studentId: createdData.student.studentId,
                academicYear: createdData.academicYear.academicYearId,
                habitName: habitName as any,
                term1Grade: term1Grade as any,
                term2Grade: term2Grade as any,
                remarks: `Generated for test student`,
              });
              
              totalHabitsCreated++;
              await new Promise(resolve => setTimeout(resolve, 30));
            } catch (habitError: any) {
              console.error(`Failed to create habit ${habitName}:`, habitError);
              // Continue with next habit
            }
          }
          
          updateStepStatus('student-habits', 'success', `Created: ${totalHabitsCreated} habits for Template 3`);
        } else {
          updateStepStatus('student-habits', 'success', `Skipped - No student or academic year`);
        }
      } catch (error: any) {
        log.push({ step: 'Student Habits', status: 'failed', reason: error.message });
        updateStepStatus('student-habits', 'error', error.message);
        // Don't throw - continue
      }

      // Step 13: Create Online Exam Paper
      updateStepStatus('online-exam', 'running');
      try {
        const baseExam = createdData.finalExams[0]; // Use Term 1 exam
        
        const paperId = `PAPER-TEST-${Date.now().toString(36).toUpperCase()}`;
        const onlinePaper = await examPapersService.create({
          paperId,
          examId: baseExam.examId,
          paperTitle: 'Online Quiz - Test Student',
          paperCode: 'OQ-TEST-01',
          durationMinutes: 30,
          totalMarks: 25,
          isOnline: true,
          displayOrder: 1,
          instructions: 'Quick online quiz for test student.',
          status: 'Published',
        });
        
        createdData.onlinePaper = onlinePaper;
        log.push({ step: 'Online Exam Paper', status: 'created' });
        updateStepStatus('online-exam', 'success', `Created: ${onlinePaper.paperTitle}`);
      } catch (error: any) {
        log.push({ step: 'Online Exam Paper', status: 'failed', reason: error.message });
        updateStepStatus('online-exam', 'error', error.message);
      }

      // Step 14: Create Paper Rules
      updateStepStatus('paper-rules', 'running');
      try {
        if (createdData.onlinePaper) {
          const ruleId = `RULE-TEST-${Date.now().toString(36).toUpperCase()}`;
          const paperRule = await paperRulesService.create({
            ruleId,
            paperId: createdData.onlinePaper.paperId,
            minMarksToPass: 10,
            minPercentage: 40,
            sectionWisePassRequired: false,
            mustAttemptPercentage: 100,
            evaluationMode: 'AUTO',
            negativeMarkingEnabled: false,
            negativeMarkingPerQuestion: 0,
            graceMarks: 0,
          });
          
          createdData.paperRule = paperRule;
          log.push({ step: 'Paper Rules', status: 'created' });
          updateStepStatus('paper-rules', 'success', `Created rules: Pass >= 40%`);
        } else {
          updateStepStatus('paper-rules', 'success', `Skipped - No online paper`);
        }
      } catch (error: any) {
        log.push({ step: 'Paper Rules', status: 'failed', reason: error.message });
        updateStepStatus('paper-rules', 'error', error.message);
      }

      // Step 15: Create MCQ Questions
      updateStepStatus('questions', 'running');
      try {
        if (createdData.onlinePaper) {
          const questionsCreated: any[] = [];
          const mcqQuestions = [
            { text: 'What is 5 x 5?', options: ['20', '25', '30', '35'], correct: 1 },
            { text: 'Capital of India?', options: ['Mumbai', 'Delhi', 'Kolkata', 'Chennai'], correct: 1 },
          ];

          for (let i = 0; i < mcqQuestions.length; i++) {
            const mcq = mcqQuestions[i];
            const questionId = `Q-TEST-MCQ-${Date.now()}-${i}`.toUpperCase();
            
            const question = await questionsService.create({
              questionId,
              paperId: createdData.onlinePaper.paperId,
              questionType: 'MCQ',
              questionText: mcq.text,
              marks: 10,
              negativeMarks: 0,
              difficulty: 'Easy',
              displayOrder: i + 1,
              isRequired: true,
            });
            
            const optionIds: string[] = [];
            for (let j = 0; j < mcq.options.length; j++) {
              const optionId = `OPT-TEST-${Date.now()}-${i}-${j}`.toUpperCase();
              optionIds.push(optionId);
              await questionOptionsService.create({
                optionId,
                questionId,
                optionText: mcq.options[j],
                isCorrect: j === mcq.correct,
                displayOrder: j + 1,
              });
            }
            
            questionsCreated.push({ ...question, optionIds });
          }

          createdData.questions = questionsCreated;
          log.push({ step: 'MCQ Questions', status: 'created' });
          updateStepStatus('questions', 'success', `Created: ${questionsCreated.length} MCQ questions`);
        } else {
          updateStepStatus('questions', 'success', `Skipped - No online paper`);
        }
      } catch (error: any) {
        log.push({ step: 'MCQ Questions', status: 'failed', reason: error.message });
        updateStepStatus('questions', 'error', error.message);
      }

      // Step 16: Create Student Habits (Template 3)
      updateStepStatus('student-habits', 'running');
      try {
        if (createdData.student && createdData.academicYear) {
          const habitNames = ['Courteous', 'Art/Craft', 'Responsibility', 'Systematic', 'Sports', 'Elocution', 'Gen.Knowledge', 'Cultural Activities', 'Cleanliness', 'Hindi Oral', 'English Oral'];
          const habitsCreated: any[] = [];
          
          // Generate random grades (A, B, C) for both terms
          const getRandomGrade = (): 'A' | 'B' | 'C' => {
            const rand = Math.random();
            if (rand > 0.6) return 'A';
            if (rand > 0.3) return 'B';
            return 'C';
          };
          
          for (const habitName of habitNames) {
            try {
              const habitId = `HABIT-TEST-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`.toUpperCase();
              const habit = await studentHabitsService.create({
                habitId,
                studentId: createdData.student.studentId,
                academicYear: createdData.academicYear,
                habitName: habitName as any,
                term1Grade: getRandomGrade(),
                term2Grade: getRandomGrade(),
              });
              habitsCreated.push(habit);
              await new Promise(resolve => setTimeout(resolve, 30));
            } catch (error: any) {
              console.warn(`Failed to create habit ${habitName}:`, error);
              // Continue with next habit
            }
          }
          
          createdData.habits = habitsCreated;
          log.push({ step: 'Student Habits', status: 'created' });
          updateStepStatus('student-habits', 'success', `Created: ${habitsCreated.length} habits for Template 3`);
        } else {
          updateStepStatus('student-habits', 'success', `Skipped - No student or academic year`);
        }
      } catch (error: any) {
        log.push({ step: 'Student Habits', status: 'failed', reason: error.message });
        updateStepStatus('student-habits', 'error', error.message);
      }

      // Step 17: Report Card Ready
      updateStepStatus('report-card', 'running');
      try {
        updateStepStatus('report-card', 'success', `CBSE Report Card Ready for ${createdStudentName} (Term 1 & Term 2)`);
      } catch (error: any) {
        updateStepStatus('report-card', 'success', `CBSE Report Card can be viewed in Report Cards module`);
      }

      setGeneratedData(createdData);
      
      // Generate summary log
      const created = log.filter(l => l.status === 'created').length;
      const skipped = log.filter(l => l.status === 'skipped').length;
      const failed = log.filter(l => l.status === 'failed').length;
      
      let logMessage = `✅ Test Student Created Successfully!\n\n`;
      logMessage += `📊 Summary:\n`;
      logMessage += `  ✅ Created: ${created}\n`;
      logMessage += `  ⏭️  Skipped: ${skipped}\n`;
      if (failed > 0) {
        logMessage += `  ❌ Failed: ${failed}\n`;
      }
      logMessage += `\n📝 Details:\n`;
      log.forEach(l => {
        if (l.status === 'created') {
          logMessage += `  ✅ ${l.step}\n`;
        } else if (l.status === 'skipped') {
          logMessage += `  ⏭️  ${l.step} (${l.reason})\n`;
        } else {
          logMessage += `  ❌ ${l.step} (${l.reason})\n`;
        }
      });
      
      console.log('Generation Log:', log);
      console.log(logMessage);
      
      toast.success(`✅ Test Student Created Successfully!`, {
        description: `📋 Student Name: "${createdStudentName}"
        
📊 CBSE Format Marks (Term 1 & Term 2):
• Term 1 (Mid-Term): PT/NB/SE/Half Yearly breakdown
• Term 2 (Final): PT/NB/SE/Annual breakdown
• All subjects: 10:5:5:80 format (100 marks per term)

✅ Go to Report Cards → Select this student → Click "CBSE" button to view Template 2!`,
        duration: 30000,
      });

    } catch (error: any) {
      console.error('Error generating test student:', error);
      
      // Log final status
      const created = log.filter(l => l.status === 'created').length;
      const skipped = log.filter(l => l.status === 'skipped').length;
      const failed = log.filter(l => l.status === 'failed').length;
      
      console.log('Generation Log (with errors):', log);
      console.log(`Summary: Created: ${created}, Skipped: ${skipped}, Failed: ${failed}`);
      
      toast.error('Failed to generate test student', {
        description: `${error.message}\nCreated: ${created} | Skipped: ${skipped} | Failed: ${failed}`,
        duration: 15000,
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Generate Single Test Student with V2 Data (Direct Entry Mode Only)
  const generateSingleTestStudentDirect = async () => {
    // Call the main function with 'direct' mode parameter
    await generateSingleTestStudent('direct');
  };

  // Generate Standard Test Data with 5 Subjects (Hindi/Sanskrit, English, SST, Mathematics, Science)
  const generateStandardTestData = async () => {
    setIsGenerating(true);
    const testStudentName = `Standard Test Student ${Date.now().toString(36).toUpperCase()}`;
    let createdStudentName = '';

    // Track what was created
    const log: { step: string; status: 'created' | 'skipped' | 'failed'; reason?: string }[] = [];

    try {
      // Reset steps
      setGenerationSteps(prev => prev.map(s => ({ ...s, status: 'pending' as const, message: undefined, data: undefined })));

      const createdData: any = {
        academicYear: null,
        class: null,
        section: null,
        teacher: null,
        subjects: [],
        student: null,
        unitTestExams: [],
        finalExams: [],
        unitTestMarks: [],
        finalExamMarks: [],
        template1Marks: [],
        template2Marks: [],
        template3Marks: [],
        results: [],
      };

      // Step 1: Get or Create Academic Year
      updateStepStatus('academic-year', 'running');
      try {
        const currentYear = new Date().getFullYear();
        const academicYearId = `AY-${currentYear}-${currentYear + 1}`;
        const startDate = `${currentYear}-06-01`;
        const endDate = `${currentYear + 1}-05-31`;
        
        let academicYear;
        try {
          const allAcademicYears = await academicYearsService.getAll();
          const existingYear = allAcademicYears.find(
            (ay) => ay.startDate === startDate && ay.endDate === endDate
          );
          
          if (existingYear) {
            academicYear = existingYear;
            log.push({ step: 'Academic Year', status: 'skipped', reason: 'Already exists' });
            updateStepStatus('academic-year', 'success', `Using existing: ${academicYear.academicYearId || academicYearId}`);
          } else {
            academicYear = await academicYearsService.create({
              academicYearId,
              startDate,
              endDate,
              status: 'Active',
            });
            log.push({ step: 'Academic Year', status: 'created' });
            updateStepStatus('academic-year', 'success', `Created: ${academicYear.academicYearId || academicYearId}`);
          }
        } catch (createError: any) {
          if (createError.message?.includes('already exists')) {
            const allYearsRetry = await academicYearsService.getAll();
            const foundYear = allYearsRetry.find(
              (ay) => ay.startDate === startDate && ay.endDate === endDate
            );
            if (foundYear) {
              academicYear = foundYear;
              log.push({ step: 'Academic Year', status: 'skipped', reason: 'Already exists' });
              updateStepStatus('academic-year', 'success', `Using existing: ${academicYear.academicYearId || academicYearId}`);
            } else {
              const currentYearData = await academicYearsService.getCurrent();
              if (currentYearData) {
                academicYear = currentYearData;
                log.push({ step: 'Academic Year', status: 'skipped', reason: 'Using current academic year' });
                updateStepStatus('academic-year', 'success', `Using current: ${academicYear.academicYearId}`);
              } else {
                throw createError;
              }
            }
          } else {
            throw createError;
          }
        }
        
        createdData.academicYear = academicYear;
      } catch (error: any) {
        updateStepStatus('academic-year', 'error', error.message);
        throw error;
      }

      // Step 2: Create Class
      updateStepStatus('class', 'running');
      try {
        const classId = `CLS-STD-${Date.now().toString(36).toUpperCase()}`;
        try {
          const existingClass = await classesService.getById(classId);
          createdData.class = existingClass;
          log.push({ step: 'Class', status: 'skipped', reason: 'Already exists' });
          updateStepStatus('class', 'success', `Using existing: ${existingClass.name}`);
        } catch {
          const newClass = await classesService.create({
            classId,
            name: 'Standard Test Class 10',
            description: 'Standard test class with 5 subjects',
            capacity: 40,
            status: 'Active',
          });
          createdData.class = newClass;
          log.push({ step: 'Class', status: 'created' });
          updateStepStatus('class', 'success', `Created: ${newClass.name}`);
        }
      } catch (error: any) {
        updateStepStatus('class', 'error', error.message);
        throw error;
      }

      // Step 3: Create Section
      updateStepStatus('section', 'running');
      try {
        const sectionId = `SEC-STD-${Date.now().toString(36).toUpperCase()}`;
        try {
          const existingSection = await sectionsService.getById(sectionId);
          createdData.section = existingSection;
          log.push({ step: 'Section', status: 'skipped', reason: 'Already exists' });
          updateStepStatus('section', 'success', `Using existing: ${existingSection.name}`);
        } catch {
          const newSection = await sectionsService.create({
            sectionId,
            name: 'Standard Section A',
            capacity: 40,
            roomNumber: 'Room STD-101',
            status: 'Active',
          });
          createdData.section = newSection;
          log.push({ step: 'Section', status: 'created' });
          updateStepStatus('section', 'success', `Created: ${newSection.name}`);
        }
      } catch (error: any) {
        updateStepStatus('section', 'error', error.message);
        throw error;
      }

      // Step 4: Link Class-Section
      updateStepStatus('class-section', 'running');
      try {
        await classesService.addSectionToClass(createdData.class.classId, createdData.section.sectionId);
        log.push({ step: 'Class-Section Link', status: 'created' });
        updateStepStatus('class-section', 'success', `Linked`);
      } catch (error: any) {
        if (error.message?.includes('already') || error.message?.includes('exists')) {
          log.push({ step: 'Class-Section Link', status: 'skipped', reason: 'Link already exists' });
          updateStepStatus('class-section', 'success', `Link exists`);
        }
      }

      // Step 5: Create Teacher
      updateStepStatus('teacher', 'running');
      try {
        const teacherId = `TCH-STD-${Date.now().toString(36).toUpperCase()}`;
        try {
          const existingTeacher = await teachersService.getById(teacherId);
          createdData.teacher = existingTeacher;
          log.push({ step: 'Teacher', status: 'skipped', reason: 'Already exists' });
          updateStepStatus('teacher', 'success', `Using existing: ${existingTeacher.name}`);
        } catch {
          const newTeacher = await teachersService.create({
            teacherId,
            name: 'Dr. Standard Test Teacher',
            email: `std.teacher.${Date.now()}@school.edu`,
            phone: '+1234567890',
            department: 'General',
            designation: 'Senior Teacher',
            qualification: 'M.A., B.Ed.',
            experience: 10,
            joiningDate: new Date().toISOString().split('T')[0],
            status: 'Active',
          });
          createdData.teacher = newTeacher;
          log.push({ step: 'Teacher', status: 'created' });
          updateStepStatus('teacher', 'success', `Created: ${newTeacher.name}`);
        }
      } catch (error: any) {
        updateStepStatus('teacher', 'error', error.message);
        throw error;
      }

      // Step 6: Create 5 Standard Subjects
      updateStepStatus('subjects', 'running');
      try {
        const subjectNames = [
          { name: 'Hindi', code: 'HIN' },
          { name: 'English', code: 'ENG' },
          { name: 'SST', code: 'SST', fullName: 'Social Studies' },
          { name: 'Mathematics', code: 'MATH' },
          { name: 'Science', code: 'SCI' },
        ];
        
        const timestamp = Date.now().toString(36).toUpperCase();
        
        for (const subj of subjectNames) {
          const subjectCode = `${subj.code}-STD-${timestamp}`;
          const subjectId = `SUB-STD-${subj.code}-${timestamp}`;
          
          try {
            const newSubject = await subjectsService.create({
              subjectId,
              subjectName: subj.name,
              subjectCode: subjectCode,
              classId: createdData.class.classId,
              teacherId: createdData.teacher.teacherId,
              teacherIds: [createdData.teacher.teacherId],
              description: `${subj.fullName || subj.name} for standard test`,
              credits: 4,
              hoursPerWeek: 5,
              status: 'Active',
            });
            createdData.subjects.push(newSubject);
            log.push({ step: `Subject: ${subj.name}`, status: 'created' });
          } catch (createError: any) {
            if (createError.message?.includes('already exists')) {
              const allSubjects = await subjectsService.getAll({ search: subjectCode });
              const foundSubject = allSubjects.find((s) => s.subjectCode === subjectCode);
              if (foundSubject) {
                createdData.subjects.push(foundSubject);
                log.push({ step: `Subject: ${subj.name}`, status: 'skipped', reason: 'Already exists' });
              } else {
                const classSubjects = await subjectsService.getAll({ classId: createdData.class.classId });
                const foundByName = classSubjects.find((s) => s.subjectName === subj.name);
                if (foundByName) {
                  createdData.subjects.push(foundByName);
                  log.push({ step: `Subject: ${subj.name}`, status: 'skipped', reason: 'Already exists' });
                }
              }
            }
          }
        }
        
        if (createdData.subjects.length === 0) {
          throw new Error('Failed to create or find any subjects');
        }
        updateStepStatus('subjects', 'success', `Created/Found: ${createdData.subjects.length} subjects`);
      } catch (error: any) {
        updateStepStatus('subjects', 'error', error.message);
        throw error;
      }

      // Step 7: Create 1 Test Student
      updateStepStatus('student', 'running');
      try {
        const studentId = `STU-STD-${Date.now()}`.toUpperCase();
        const timestamp = Date.now();
        const newStudent = await studentsService.create({
          studentId,
          name: testStudentName,
          email: `std.student.${timestamp}@school.edu`,
          phone: '+1234567890',
          dateOfBirth: '2008-05-15',
          gender: 'Male',
          address: 'Standard Test Student Lane, Education City',
          classId: createdData.class.classId,
          sectionId: createdData.section.sectionId,
          rollNo: 1,
          parentName: `Parent of ${testStudentName}`,
          parentContact: '+1234567891',
          parentEmail: `std.parent.${timestamp}@school.edu`,
          admissionDate: new Date().toISOString().split('T')[0],
          status: 'Active',
        });
        createdData.student = newStudent;
        createdStudentName = newStudent.name;
        updateStepStatus('student', 'success', `Created: ${newStudent.name}`);
      } catch (error: any) {
        updateStepStatus('student', 'error', error.message);
        throw error;
      }

      // Step 8: Create Unit Test Exams (3 for Term 1, 3 for Term 2)
      updateStepStatus('unit-tests', 'running');
      try {
        const unitTestExamsCreated: any[] = [];
        
        // Term 1: Unit Tests 1, 2, 3
        for (let i = 1; i <= 3; i++) {
          const timestamp = Date.now();
          const randomSuffix = Math.random().toString(36).substr(2, 5).toUpperCase();
          const examId = `EXM-UT-T1-${i}-${timestamp}-${randomSuffix}`.toUpperCase();
          const baseDate = new Date();
          const startDate = new Date(baseDate);
          startDate.setDate(startDate.getDate() + (i - 1) * 7);
          const endDate = new Date(startDate);
          endDate.setDate(endDate.getDate() + 1);
          
          try {
            const newExam = await examsService.create({
              examId,
              examName: `Unit Test ${i} (Term 1)`,
              examType: 'Unit Test',
              academicYear: createdData.academicYear.academicYearId,
              classId: createdData.class.classId,
              term: 'Term 1',
              startDate: startDate.toISOString().split('T')[0],
              endDate: endDate.toISOString().split('T')[0],
              totalMarks: 100,
              passingMarks: 40,
              status: 'Completed',
            });
            unitTestExamsCreated.push(newExam);
            await new Promise(resolve => setTimeout(resolve, 50));
          } catch (examError: any) {
            console.error(`Failed to create Unit Test ${i} (Term 1):`, examError);
          }
        }
        
        // Term 2: Unit Tests 4, 5, 6
        for (let i = 4; i <= 6; i++) {
          const timestamp = Date.now();
          const randomSuffix = Math.random().toString(36).substr(2, 5).toUpperCase();
          const examId = `EXM-UT-T2-${i}-${timestamp}-${randomSuffix}`.toUpperCase();
          const utIndex = i - 3;
          const baseDate = new Date();
          baseDate.setMonth(baseDate.getMonth() + 4);
          const startDate = new Date(baseDate);
          startDate.setDate(startDate.getDate() + (utIndex - 1) * 7);
          const endDate = new Date(startDate);
          endDate.setDate(endDate.getDate() + 1);
          
          try {
            const newExam = await examsService.create({
              examId,
              examName: `Unit Test ${i} (Term 2)`,
              examType: 'Unit Test',
              academicYear: createdData.academicYear.academicYearId,
              classId: createdData.class.classId,
              term: 'Term 2',
              startDate: startDate.toISOString().split('T')[0],
              endDate: endDate.toISOString().split('T')[0],
              totalMarks: 100,
              passingMarks: 40,
              status: 'Completed',
            });
            unitTestExamsCreated.push(newExam);
            await new Promise(resolve => setTimeout(resolve, 50));
          } catch (examError: any) {
            console.error(`Failed to create Unit Test ${i} (Term 2):`, examError);
          }
        }
        
        createdData.unitTestExams = unitTestExamsCreated;
        updateStepStatus('unit-tests', 'success', `Created: ${unitTestExamsCreated.length} unit tests`);
      } catch (error: any) {
        updateStepStatus('unit-tests', 'error', error.message);
        throw error;
      }

      // Step 9: Create Term 1 (Mid-Term) and Term 2 (Final) Exams
      updateStepStatus('exam', 'running');
      try {
        const finalExamsCreated: any[] = [];
        
        // Term 1: Mid-Term Examination
        const term1ExamId = `EXM-T1-STD-${Date.now()}`.toUpperCase();
        const term1Exam = await examsService.create({
          examId: term1ExamId,
          examName: 'Mid-Term Examination (Half Yearly)',
          examType: 'Mid-Term',
          academicYear: createdData.academicYear.academicYearId,
          classId: createdData.class.classId,
          term: 'Term 1',
          startDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          endDate: new Date(Date.now() + 95 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          totalMarks: 500,
          passingMarks: 200,
          status: 'Completed',
        });
        finalExamsCreated.push(term1Exam);
        
        // Term 2: Final Examination
        const term2ExamId = `EXM-T2-STD-${Date.now()}`.toUpperCase();
        const term2Exam = await examsService.create({
          examId: term2ExamId,
          examName: 'Final Examination (Annual)',
          examType: 'Final',
          academicYear: createdData.academicYear.academicYearId,
          classId: createdData.class.classId,
          term: 'Term 2',
          startDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          endDate: new Date(Date.now() + 185 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          totalMarks: 500,
          passingMarks: 200,
          status: 'Completed',
        });
        finalExamsCreated.push(term2Exam);
        
        createdData.finalExams = finalExamsCreated;
        updateStepStatus('exam', 'success', `Created: ${finalExamsCreated.length} exams (Term 1 & Term 2)`);
      } catch (error: any) {
        updateStepStatus('exam', 'error', error.message);
        throw error;
      }

      // Step 10: Create Unit Test Marks
      updateStepStatus('unit-test-marks', 'running');
      try {
        const unitTestMarksEntries: any[] = [];
        let markCounter = 0;

        // Consistent unit test scores for all subjects
        const term1UnitTestScores = [75, 80, 85]; // UT1, UT2, UT3
        const term2UnitTestScores = [82, 88, 90]; // UT4, UT5, UT6

        for (let i = 0; i < createdData.unitTestExams.length; i++) {
          const unitTestExam = createdData.unitTestExams[i];
          const isTerm1 = unitTestExam.term === 'Term 1';
          const utIndex = isTerm1 ? i : i - 3;
          const scores = isTerm1 ? term1UnitTestScores : term2UnitTestScores;
          const marksObtained = scores[utIndex] || 75;

          for (const subj of createdData.subjects) {
            const uniqueId = `${Date.now()}-${markCounter++}-${Math.random().toString(36).substr(2, 5)}`;
            const markId = `MRK-UT-${isTerm1 ? 'T1' : 'T2'}-${utIndex + 1}-${uniqueId}`.toUpperCase();
            const percentage = (marksObtained / 100) * 100;

            try {
              const markData: any = {
                markId,
                studentId: createdData.student.studentId,
                examId: unitTestExam.examId,
                subjectId: subj.subjectId,
                marksObtained,
                totalMarks: 100,
                grade: calculateGrade(percentage),
                remarks: `Unit Test ${utIndex + 1} (${isTerm1 ? 'Term 1' : 'Term 2'})`,
                isAbsent: false,
                status: 'Published',
                enteredBy: 'System',
                marksType: 'Unit Test',
                internalMarks: marksObtained,
              };
              
              if (createdData.student.classId) {
                markData.classId = createdData.student.classId;
              }
              
              const newMark = await marksService.create(markData);
              unitTestMarksEntries.push(newMark);
              await new Promise(resolve => setTimeout(resolve, 50));
            } catch (markError: any) {
              console.error(`Failed to create unit test mark for ${subj.subjectName}:`, markError);
            }
          }
        }

        createdData.unitTestMarks = unitTestMarksEntries;
        updateStepStatus('unit-test-marks', 'success', `Created: ${unitTestMarksEntries.length} unit test marks`);
      } catch (error: any) {
        updateStepStatus('unit-test-marks', 'error', error.message);
        throw error;
      }

      // Step 11: Create Template 2 Marks (CBSE Style - PT, NB, SE, HY/Annual)
      updateStepStatus('final-exam-marks', 'running');
      try {
        const template2Marks: any[] = [];
        let markCounter = 0;

        const term1Exam = createdData.finalExams.find((e: any) => e.term === 'Term 1');
        const term2Exam = createdData.finalExams.find((e: any) => e.term === 'Term 2');

        if (!term1Exam || !term2Exam) {
          throw new Error('Term 1 or Term 2 exam not found');
        }

        // Subject-wise data for Template 2 (PT, NB, SE, External)
        // Hindi, English, SST, Mathematics, Science
        const template2SubjectData = [
          { name: 'Hindi', term1: { pt: 8.0, nb: 4.5, se: 4.5, external: 72 }, term2: { pt: 8.5, nb: 5, se: 5, external: 75 } },
          { name: 'English', term1: { pt: 8.5, nb: 5, se: 5, external: 74 }, term2: { pt: 9.0, nb: 5, se: 5, external: 76 } },
          { name: 'SST', term1: { pt: 8.0, nb: 4, se: 4, external: 70 }, term2: { pt: 8.5, nb: 4.5, se: 4.5, external: 72 } },
          { name: 'Mathematics', term1: { pt: 9.0, nb: 5, se: 5, external: 75 }, term2: { pt: 9.5, nb: 5, se: 5, external: 78 } },
          { name: 'Science', term1: { pt: 8.5, nb: 4.5, se: 4.5, external: 73 }, term2: { pt: 9.0, nb: 5, se: 5, external: 75 } },
        ];

        for (let idx = 0; idx < createdData.subjects.length; idx++) {
          const subj = createdData.subjects[idx];
          const data = template2SubjectData[idx] || template2SubjectData[0];

          // Calculate PT from Unit Test averages (Term 1)
          const term1UnitTests = createdData.unitTestMarks.filter((m: any) => {
            const exam = createdData.unitTestExams.find((e: any) => e.examId === m.examId);
            return exam && exam.term === 'Term 1' && m.subjectId === subj.subjectId;
          });
          
          let term1PT = data.term1.pt;
          if (term1UnitTests.length > 0) {
            const avgUnitTest = term1UnitTests.reduce((sum: number, m: any) => sum + (parseFloat(m.marksObtained) || 0), 0) / term1UnitTests.length;
            term1PT = Math.min(10, Math.max(0, (avgUnitTest / 100) * 10));
          }

          // Term 1 Template 2 Combined Mark
          try {
            const uniqueId = `${Date.now()}-${markCounter++}-${Math.random().toString(36).substr(2, 5)}`;
            const term1MarkId = `MRK-T1-T2-${uniqueId}`.toUpperCase();
            
            const term1Total = term1PT + data.term1.nb + data.term1.se + data.term1.external;
            
            const term1MarkData: any = {
              markId: term1MarkId,
              studentId: createdData.student.studentId,
              examId: term1Exam.examId,
              subjectId: subj.subjectId,
              marksObtained: term1Total,
              totalMarks: 100,
              grade: calculateGrade(term1Total),
              remarks: `Term 1 Template 2: PT=${term1PT.toFixed(1)}, NB=${data.term1.nb}, SE=${data.term1.se}, HY=${data.term1.external}`,
              isAbsent: false,
              status: 'Published',
              enteredBy: 'System',
              marksType: 'Mid-Term',
              unitTestMarks: parseFloat(term1PT.toFixed(2)) || 0,
              assignmentMarks: parseFloat(data.term1.nb.toFixed(2)) || 0,
              attendanceMarks: parseFloat(data.term1.se.toFixed(2)) || 0,
              externalMarks: parseFloat(data.term1.external.toFixed(2)) || 0,
              internalMarks: parseFloat((term1PT + data.term1.nb + data.term1.se).toFixed(2)) || 0,
            };
            if (createdData.student.classId) term1MarkData.classId = createdData.student.classId;
            
            const term1Mark = await marksService.create(term1MarkData);
            template2Marks.push(term1Mark);
            await new Promise(resolve => setTimeout(resolve, 50));
          } catch (error: any) {
            console.error(`Failed to create Term 1 Template 2 mark for ${subj.subjectName}:`, error);
          }

          // Calculate PT from Unit Test averages (Term 2)
          const term2UnitTests = createdData.unitTestMarks.filter((m: any) => {
            const exam = createdData.unitTestExams.find((e: any) => e.examId === m.examId);
            return exam && exam.term === 'Term 2' && m.subjectId === subj.subjectId;
          });
          
          let term2PT = data.term2.pt;
          if (term2UnitTests.length > 0) {
            const avgUnitTest = term2UnitTests.reduce((sum: number, m: any) => sum + (parseFloat(m.marksObtained) || 0), 0) / term2UnitTests.length;
            term2PT = Math.min(10, Math.max(0, (avgUnitTest / 100) * 10));
          }

          // Term 2 Template 2 Combined Mark
          try {
            const uniqueId = `${Date.now()}-${markCounter++}-${Math.random().toString(36).substr(2, 5)}`;
            const term2MarkId = `MRK-T2-T2-${uniqueId}`.toUpperCase();
            
            const term2Total = term2PT + data.term2.nb + data.term2.se + data.term2.external;
            
            const term2MarkData: any = {
              markId: term2MarkId,
              studentId: createdData.student.studentId,
              examId: term2Exam.examId,
              subjectId: subj.subjectId,
              marksObtained: term2Total,
              totalMarks: 100,
              grade: calculateGrade(term2Total),
              remarks: `Term 2 Template 2: PT=${term2PT.toFixed(1)}, NB=${data.term2.nb}, SE=${data.term2.se}, Annual=${data.term2.external}`,
              isAbsent: false,
              status: 'Published',
              enteredBy: 'System',
              marksType: 'Final',
              unitTestMarks: parseFloat(term2PT.toFixed(2)) || 0,
              assignmentMarks: parseFloat(data.term2.nb.toFixed(2)) || 0,
              attendanceMarks: parseFloat(data.term2.se.toFixed(2)) || 0,
              externalMarks: parseFloat(data.term2.external.toFixed(2)) || 0,
              internalMarks: parseFloat((term2PT + data.term2.nb + data.term2.se).toFixed(2)) || 0,
            };
            if (createdData.student.classId) term2MarkData.classId = createdData.student.classId;
            
            const term2Mark = await marksService.create(term2MarkData);
            template2Marks.push(term2Mark);
            await new Promise(resolve => setTimeout(resolve, 50));
          } catch (error: any) {
            console.error(`Failed to create Term 2 Template 2 mark for ${subj.subjectId}:`, error);
          }
        }

        createdData.template2Marks = template2Marks;
        updateStepStatus('final-exam-marks', 'success', `Created: ${template2Marks.length} Template 2 marks`);
      } catch (error: any) {
        updateStepStatus('final-exam-marks', 'error', error.message);
        throw error;
      }

      // Step 12: Create Template 1 Marks (Simple marks)
      updateStepStatus('template1-marks', 'running');
      try {
        const template1Marks: any[] = [];
        let markCounter = 0;

        const term1Exam = createdData.finalExams.find((e: any) => e.term === 'Term 1');
        const term2Exam = createdData.finalExams.find((e: any) => e.term === 'Term 2');

        if (term1Exam && term2Exam) {
          // Subject-wise simple marks for Template 1
          const template1Scores = [
            { name: 'Hindi', term1: 85, term2: 88 },
            { name: 'English', term1: 88, term2: 90 },
            { name: 'SST', term1: 82, term2: 85 },
            { name: 'Mathematics', term1: 90, term2: 93 },
            { name: 'Science', term1: 87, term2: 90 },
          ];

          for (let idx = 0; idx < createdData.subjects.length; idx++) {
            const subj = createdData.subjects[idx];
            const scores = template1Scores[idx] || template1Scores[0];

            // Term 1 Template 1 mark
            try {
              const uniqueId = `${Date.now()}-${markCounter++}-${Math.random().toString(36).substr(2, 5)}`;
              const term1MarkId = `MRK-T1-T1-${uniqueId}`.toUpperCase();
              
              const term1MarkData: any = {
                markId: term1MarkId,
                studentId: createdData.student.studentId,
                examId: term1Exam.examId,
                subjectId: subj.subjectId,
                marksObtained: scores.term1,
                totalMarks: 100,
                grade: calculateGrade(scores.term1),
                remarks: `Term 1 - Template 1 (Simple)`,
                isAbsent: false,
                status: 'Published',
                enteredBy: 'System',
                marksType: 'Mid-Term',
              };
              if (createdData.student.classId) term1MarkData.classId = createdData.student.classId;
              
              const term1Mark = await marksService.create(term1MarkData);
              template1Marks.push(term1Mark);
              await new Promise(resolve => setTimeout(resolve, 50));
            } catch (error: any) {
              console.error(`Failed to create Term 1 Template 1 mark for ${subj.subjectName}:`, error);
            }

            // Term 2 Template 1 mark
            try {
              const uniqueId = `${Date.now()}-${markCounter++}-${Math.random().toString(36).substr(2, 5)}`;
              const term2MarkId = `MRK-T2-T1-${uniqueId}`.toUpperCase();
              
              const term2MarkData: any = {
                markId: term2MarkId,
                studentId: createdData.student.studentId,
                examId: term2Exam.examId,
                subjectId: subj.subjectId,
                marksObtained: scores.term2,
                totalMarks: 100,
                grade: calculateGrade(scores.term2),
                remarks: `Term 2 - Template 1 (Simple)`,
                isAbsent: false,
                status: 'Published',
                enteredBy: 'System',
                marksType: 'Final',
              };
              if (createdData.student.classId) term2MarkData.classId = createdData.student.classId;
              
              const term2Mark = await marksService.create(term2MarkData);
              template1Marks.push(term2Mark);
              await new Promise(resolve => setTimeout(resolve, 50));
            } catch (error: any) {
              console.error(`Failed to create Term 2 Template 1 mark for ${subj.subjectName}:`, error);
            }
          }
        }

        createdData.template1Marks = template1Marks;
        updateStepStatus('template1-marks', 'success', `Created: ${template1Marks.length} Template 1 marks`);
      } catch (error: any) {
        updateStepStatus('template1-marks', 'error', error.message);
      }

      // Step 13: Create Template 3 Marks (Assessment 20 + Written 80)
      updateStepStatus('template3-marks', 'running');
      try {
        const template3Marks: any[] = [];
        let markCounter = 0;

        const term1Exam = createdData.finalExams.find((e: any) => e.term === 'Term 1');
        const term2Exam = createdData.finalExams.find((e: any) => e.term === 'Term 2');

        if (term1Exam && term2Exam) {
          // Subject-wise Assessment and Written marks for Template 3
          const template3Scores = [
            { name: 'Hindi', term1: { assessment: 18, written: 70 }, term2: { assessment: 19, written: 72 } },
            { name: 'English', term1: { assessment: 19, written: 72 }, term2: { assessment: 19, written: 74 } },
            { name: 'SST', term1: { assessment: 17, written: 68 }, term2: { assessment: 18, written: 70 } },
            { name: 'Mathematics', term1: { assessment: 19, written: 75 }, term2: { assessment: 20, written: 78 } },
            { name: 'Science', term1: { assessment: 18, written: 73 }, term2: { assessment: 19, written: 75 } },
          ];

          for (let idx = 0; idx < createdData.subjects.length; idx++) {
            const subj = createdData.subjects[idx];
            const scores = template3Scores[idx] || template3Scores[0];

            // Term 1 Template 3 mark
            try {
              const uniqueId = `${Date.now()}-${markCounter++}-${Math.random().toString(36).substr(2, 5)}`;
              const term1MarkId = `MRK-T1-T3-${uniqueId}`.toUpperCase();
              
              const term1Total = scores.term1.assessment + scores.term1.written;
              
              const term1MarkData: any = {
                markId: term1MarkId,
                studentId: createdData.student.studentId,
                examId: term1Exam.examId,
                subjectId: subj.subjectId,
                marksObtained: term1Total,
                totalMarks: 100,
                grade: calculateGrade(term1Total),
                remarks: `Term 1 - Template 3: Assessment=${scores.term1.assessment}, Written=${scores.term1.written}`,
                isAbsent: false,
                status: 'Published',
                enteredBy: 'System',
                marksType: 'Mid-Term',
                internalMarks: parseFloat(scores.term1.assessment.toFixed(2)),
                externalMarks: parseFloat(scores.term1.written.toFixed(2)),
              };
              if (createdData.student.classId) term1MarkData.classId = createdData.student.classId;
              
              const term1Mark = await marksService.create(term1MarkData);
              template3Marks.push(term1Mark);
              await new Promise(resolve => setTimeout(resolve, 50));
            } catch (error: any) {
              console.error(`Failed to create Term 1 Template 3 mark for ${subj.subjectName}:`, error);
            }

            // Term 2 Template 3 mark
            try {
              const uniqueId = `${Date.now()}-${markCounter++}-${Math.random().toString(36).substr(2, 5)}`;
              const term2MarkId = `MRK-T2-T3-${uniqueId}`.toUpperCase();
              
              const term2Total = scores.term2.assessment + scores.term2.written;
              
              const term2MarkData: any = {
                markId: term2MarkId,
                studentId: createdData.student.studentId,
                examId: term2Exam.examId,
                subjectId: subj.subjectId,
                marksObtained: term2Total,
                totalMarks: 100,
                grade: calculateGrade(term2Total),
                remarks: `Term 2 - Template 3: Assessment=${scores.term2.assessment}, Written=${scores.term2.written}`,
                isAbsent: false,
                status: 'Published',
                enteredBy: 'System',
                marksType: 'Final',
                internalMarks: parseFloat(scores.term2.assessment.toFixed(2)),
                externalMarks: parseFloat(scores.term2.written.toFixed(2)),
              };
              if (createdData.student.classId) term2MarkData.classId = createdData.student.classId;
              
              const term2Mark = await marksService.create(term2MarkData);
              template3Marks.push(term2Mark);
              await new Promise(resolve => setTimeout(resolve, 50));
            } catch (error: any) {
              console.error(`Failed to create Term 2 Template 3 mark for ${subj.subjectName}:`, error);
            }
          }
        }

        createdData.template3Marks = template3Marks;
        updateStepStatus('template3-marks', 'success', `Created: ${template3Marks.length} Template 3 marks`);
      } catch (error: any) {
        updateStepStatus('template3-marks', 'error', error.message);
      }

      // Step 14: Create Results for both terms (using Template 2 marks - most comprehensive)
      updateStepStatus('result', 'running');
      try {
        const resultsCreated: any[] = [];
        
        for (const exam of createdData.finalExams) {
          try {
            // Calculate result from Template 2 marks only (to avoid duplicates)
            const examMarks = (createdData.template2Marks || []).filter((m: any) => m.examId === exam.examId);
            
            if (examMarks.length > 0) {
              const totalMarksObtained = examMarks.reduce((sum: number, m: any) => sum + (parseFloat(m.marksObtained) || 0), 0);
              const totalMaxMarks = examMarks.length * 100;
              const percentage = (totalMarksObtained / totalMaxMarks) * 100;
              
              const resultId = `RES-STD-${exam.examId}-${Date.now()}`.toUpperCase();
              const newResult = await resultsService.create({
                resultId,
                studentId: createdData.student.studentId,
                examId: exam.examId,
                classId: createdData.student.classId,
                totalMarksObtained,
                totalMaxMarks,
                percentage,
                grade: calculateGrade(percentage),
                isPassed: percentage >= 40,
                status: 'Published',
                remarks: `Standard test data - ${exam.term}`,
              });
              resultsCreated.push(newResult);
              await new Promise(resolve => setTimeout(resolve, 50));
            }
          } catch (error: any) {
            console.error(`Failed to create result for ${exam.examName}:`, error);
          }
        }
        
        createdData.results = resultsCreated;
        updateStepStatus('result', 'success', `Created: ${resultsCreated.length} results`);
      } catch (error: any) {
        updateStepStatus('result', 'error', error.message);
      }

      // Success
      setGeneratedData(createdData);
      toast.success(`✅ Standard test data created successfully! Student: ${createdStudentName}`);
      
      console.log('📊 Standard Test Data Created:', {
        student: createdStudentName,
        subjects: createdData.subjects.length,
        exams: createdData.finalExams.length,
        unitTests: createdData.unitTestExams.length,
        marks: {
          template1: createdData.template1Marks?.length || 0,
          template2: createdData.template2Marks?.length || 0,
          template3: createdData.template3Marks?.length || 0,
        },
        results: createdData.results.length,
      });

    } catch (error: any) {
      console.error('❌ Error generating standard test data:', error);
      toast.error(`Failed to generate standard test data: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  // Bulk Delete All Data
  const handleBulkDeleteAll = async () => {
    const confirmed = window.confirm(
      '⚠️ WARNING: This will DELETE ALL DATA from the system!\n\n' +
      'This includes:\n' +
      '• All Results\n' +
      '• All Marks\n' +
      '• All Students\n' +
      '• All Exams\n' +
      '• All Subjects\n' +
      '• All Teachers\n' +
      '• All Sections\n' +
      '• All Classes\n' +
      '• All Academic Years\n\n' +
      'This action CANNOT be undone!\n\n' +
      'Are you absolutely sure you want to proceed?'
    );

    if (!confirmed) return;

    setIsDeleting(true);
    setDeleteProgress([
      { module: 'Results', status: 'pending' },
      { module: 'Marks', status: 'pending' },
      { module: 'Students', status: 'pending' },
      { module: 'Exams', status: 'pending' },
      { module: 'Subjects', status: 'pending' },
      { module: 'Teachers', status: 'pending' },
      { module: 'Sections', status: 'pending' },
      { module: 'Classes', status: 'pending' },
      { module: 'Academic Years', status: 'pending' },
    ]);

    const updateProgress = (module: string, status: 'pending' | 'running' | 'success' | 'error', count?: number) => {
      setDeleteProgress(prev => prev.map(p => 
        p.module === module ? { ...p, status, count } : p
      ));
    };

    try {
      let totalDeleted = 0;

      // 1. Delete Results
      try {
        updateProgress('Results', 'running');
        const results = await resultsService.getAll();
        if (results.length > 0) {
          const resultIds = results.map(r => r.resultId);
          await resultsService.bulkDelete(resultIds);
          totalDeleted += results.length;
          updateProgress('Results', 'success', results.length);
        } else {
          updateProgress('Results', 'success', 0);
        }
      } catch (error: any) {
        console.error('Error deleting results:', error);
        updateProgress('Results', 'error');
      }

      // 2. Delete Marks
      try {
        updateProgress('Marks', 'running');
        const marks = await marksService.getAll();
        if (marks.length > 0) {
          const markIds = marks.map(m => m.markId);
          await marksService.bulkDelete(markIds);
          totalDeleted += marks.length;
          updateProgress('Marks', 'success', marks.length);
        } else {
          updateProgress('Marks', 'success', 0);
        }
      } catch (error: any) {
        console.error('Error deleting marks:', error);
        updateProgress('Marks', 'error');
      }

      // 3. Delete Students
      try {
        updateProgress('Students', 'running');
        const students = await studentsService.getAll();
        if (students.length > 0) {
          const studentIds = students.map(s => s.studentId);
          await studentsService.bulkDelete(studentIds);
          totalDeleted += students.length;
          updateProgress('Students', 'success', students.length);
        } else {
          updateProgress('Students', 'success', 0);
        }
      } catch (error: any) {
        console.error('Error deleting students:', error);
        updateProgress('Students', 'error');
      }

      // 4. Delete Exams
      try {
        updateProgress('Exams', 'running');
        const exams = await examsService.getAll();
        for (const exam of exams) {
          try {
            await examsService.delete(exam.examId);
            totalDeleted++;
          } catch (e) {
            console.warn(`Failed to delete exam ${exam.examId}:`, e);
          }
        }
        updateProgress('Exams', 'success', exams.length);
      } catch (error: any) {
        console.error('Error deleting exams:', error);
        updateProgress('Exams', 'error');
      }

      // 5. Delete Subjects
      try {
        updateProgress('Subjects', 'running');
        const subjects = await subjectsService.getAll();
        for (const subject of subjects) {
          try {
            await subjectsService.delete(subject.subjectId);
            totalDeleted++;
          } catch (e) {
            console.warn(`Failed to delete subject ${subject.subjectId}:`, e);
          }
        }
        updateProgress('Subjects', 'success', subjects.length);
      } catch (error: any) {
        console.error('Error deleting subjects:', error);
        updateProgress('Subjects', 'error');
      }

      // 6. Delete Teachers
      try {
        updateProgress('Teachers', 'running');
        const teachers = await teachersService.getAll();
        for (const teacher of teachers) {
          try {
            await teachersService.delete(teacher.teacherId);
            totalDeleted++;
          } catch (e) {
            console.warn(`Failed to delete teacher ${teacher.teacherId}:`, e);
          }
        }
        updateProgress('Teachers', 'success', teachers.length);
      } catch (error: any) {
        console.error('Error deleting teachers:', error);
        updateProgress('Teachers', 'error');
      }

      // 7. Delete Sections
      try {
        updateProgress('Sections', 'running');
        const sections = await sectionsService.getAll();
        for (const section of sections) {
          try {
            await sectionsService.delete(section.sectionId);
            totalDeleted++;
          } catch (e) {
            console.warn(`Failed to delete section ${section.sectionId}:`, e);
          }
        }
        updateProgress('Sections', 'success', sections.length);
      } catch (error: any) {
        console.error('Error deleting sections:', error);
        updateProgress('Sections', 'error');
      }

      // 8. Delete Classes
      try {
        updateProgress('Classes', 'running');
        const classes = await classesService.getAll();
        for (const cls of classes) {
          try {
            await classesService.delete(cls.classId);
            totalDeleted++;
          } catch (e) {
            console.warn(`Failed to delete class ${cls.classId}:`, e);
          }
        }
        updateProgress('Classes', 'success', classes.length);
      } catch (error: any) {
        console.error('Error deleting classes:', error);
        updateProgress('Classes', 'error');
      }

      // 9. Delete Academic Years
      try {
        updateProgress('Academic Years', 'running');
        const academicYears = await academicYearsService.getAll();
        for (const ay of academicYears) {
          try {
            await academicYearsService.delete(ay.academicYearId);
            totalDeleted++;
          } catch (e) {
            console.warn(`Failed to delete academic year ${ay.academicYearId}:`, e);
          }
        }
        updateProgress('Academic Years', 'success', academicYears.length);
      } catch (error: any) {
        console.error('Error deleting academic years:', error);
        updateProgress('Academic Years', 'error');
      }

      const successCount = deleteProgress.filter(p => p.status === 'success').length;
      const errorCount = deleteProgress.filter(p => p.status === 'error').length;

      toast.success('✅ Bulk Delete Completed!', {
        description: `Deleted ${totalDeleted} records across ${successCount} modules${errorCount > 0 ? ` (${errorCount} errors)` : ''}`,
        duration: 10000,
      });

      // Reset generated data
      setGeneratedData(null);

    } catch (error: any) {
      console.error('Error in bulk delete:', error);
      toast.error('Failed to delete all data', {
        description: error.message || 'An error occurred during bulk deletion',
        duration: 10000,
      });
    } finally {
      setIsDeleting(false);
      // Reset progress after 3 seconds
      setTimeout(() => {
        setDeleteProgress([]);
      }, 3000);
    }
  };

  // Get status icon
  const getStatusIcon = (status: SampleDataStep['status']) => {
    switch (status) {
      case 'running':
        return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-300" />;
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <SettingsIcon className="w-6 h-6 text-blue-600" />
              Settings
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Configure system settings and generate sample data
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-5xl mx-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-7 mb-6">
              <TabsTrigger value="general" className="flex items-center gap-2">
                <School className="w-4 h-4" />
                General
              </TabsTrigger>
              <TabsTrigger value="grading" className="flex items-center gap-2">
                <Award className="w-4 h-4" />
                Grading
              </TabsTrigger>
              <TabsTrigger value="preferences" className="flex items-center gap-2">
                <Palette className="w-4 h-4" />
                Preferences
              </TabsTrigger>
              <TabsTrigger value="system" className="flex items-center gap-2">
                <Sliders className="w-4 h-4" />
                System
              </TabsTrigger>
              <TabsTrigger value="license" className="flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                License
              </TabsTrigger>
              <TabsTrigger value="sample-data" className="flex items-center gap-2">
                <Database className="w-4 h-4" />
                Sample Data
              </TabsTrigger>
              <TabsTrigger value="bulk-delete" className="flex items-center gap-2">
                <Trash2 className="w-4 h-4" />
                Bulk Delete
              </TabsTrigger>
            </TabsList>

            {/* General Settings */}
            <TabsContent value="general" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>School Information</CardTitle>
                  <CardDescription>
                    Basic information about your school
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <Label>School Name *</Label>
                      <Input
                        value={generalSettings.schoolName}
                        onChange={(e) =>
                          setGeneralSettings({ ...generalSettings, schoolName: e.target.value })
                        }
                        placeholder="Enter school name"
                        className="mt-1"
                      />
                    </div>

                    <div className="col-span-2">
                      <Label>School Address</Label>
                      <Input
                        value={generalSettings.schoolAddress}
                        onChange={(e) =>
                          setGeneralSettings({ ...generalSettings, schoolAddress: e.target.value })
                        }
                        placeholder="Enter school address"
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label>Phone Number</Label>
                      <Input
                        value={generalSettings.schoolPhone}
                        onChange={(e) =>
                          setGeneralSettings({ ...generalSettings, schoolPhone: e.target.value })
                        }
                        placeholder="+1234567890"
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label>Email Address</Label>
                      <Input
                        type="email"
                        value={generalSettings.schoolEmail}
                        onChange={(e) =>
                          setGeneralSettings({ ...generalSettings, schoolEmail: e.target.value })
                        }
                        placeholder="info@school.edu"
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label>Website</Label>
                      <Input
                        value={generalSettings.schoolWebsite}
                        onChange={(e) =>
                          setGeneralSettings({ ...generalSettings, schoolWebsite: e.target.value })
                        }
                        placeholder="www.school.edu"
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label>Principal Name</Label>
                      <Input
                        value={generalSettings.principalName}
                        onChange={(e) =>
                          setGeneralSettings({ ...generalSettings, principalName: e.target.value })
                        }
                        placeholder="Dr. Principal Name"
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label>Academic Year Start (MM-DD)</Label>
                      <Input
                        value={generalSettings.academicYearStart}
                        onChange={(e) =>
                          setGeneralSettings({
                            ...generalSettings,
                            academicYearStart: e.target.value,
                          })
                        }
                        placeholder="04-01"
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label>Academic Year End (MM-DD)</Label>
                      <Input
                        value={generalSettings.academicYearEnd}
                        onChange={(e) =>
                          setGeneralSettings({
                            ...generalSettings,
                            academicYearEnd: e.target.value,
                          })
                        }
                        placeholder="03-31"
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end">
                    <Button onClick={handleSaveGeneral} disabled={saving} className="bg-blue-600">
                      <Save className="w-4 h-4 mr-2" />
                      {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Grading Settings */}
            <TabsContent value="grading" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Grading System</CardTitle>
                  <CardDescription>
                    Configure grading rules and passing marks
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-6">
                    <Label>Passing Marks (%)</Label>
                    <Input
                      type="number"
                      value={gradingSettings.passingMarks}
                      onChange={(e) =>
                        setGradingSettings({
                          ...gradingSettings,
                          passingMarks: parseInt(e.target.value) || 0,
                        })
                      }
                      className="mt-1 max-w-xs"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <Label className="text-base">Grade Rules</Label>
                      <Button onClick={addGradeRule} variant="outline" size="sm">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Grade
                      </Button>
                    </div>

                    <div className="space-y-3">
                      {gradingSettings.gradeRules.map((rule, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-3 p-3 border rounded-lg bg-white"
                        >
                          <Input
                            type="number"
                            value={rule.min}
                            onChange={(e) =>
                              updateGradeRule(index, 'min', parseInt(e.target.value) || 0)
                            }
                            placeholder="Min"
                            className="w-20"
                          />
                          <span className="text-gray-500">to</span>
                          <Input
                            type="number"
                            value={rule.max}
                            onChange={(e) =>
                              updateGradeRule(index, 'max', parseInt(e.target.value) || 0)
                            }
                            placeholder="Max"
                            className="w-20"
                          />
                          <Input
                            value={rule.grade}
                            onChange={(e) => updateGradeRule(index, 'grade', e.target.value)}
                            placeholder="Grade"
                            className="w-20"
                          />
                          <Input
                            type="number"
                            value={rule.gpa}
                            onChange={(e) =>
                              updateGradeRule(index, 'gpa', parseFloat(e.target.value) || 0)
                            }
                            placeholder="GPA"
                            className="w-20"
                          />
                          <Input
                            value={rule.abbreviation || ''}
                            onChange={(e) => updateGradeRule(index, 'abbreviation', e.target.value)}
                            placeholder="Abbreviation"
                            className="w-32"
                          />
                          <Input
                            type="color"
                            value={rule.color}
                            onChange={(e) => updateGradeRule(index, 'color', e.target.value)}
                            className="w-16"
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeGradeRule(index)}
                            className="text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-6">
                    <Label>Grading System Legend/Abbreviations</Label>
                    <p className="text-sm text-gray-500 mb-2">
                      This will be displayed on report cards. Format: "A+ (90-100): Outstanding | A (80-89): Excellent | ..."
                    </p>
                    <textarea
                      value={gradingSettings.gradingLegend || ''}
                      onChange={(e) =>
                        setGradingSettings({
                          ...gradingSettings,
                          gradingLegend: e.target.value,
                        })
                      }
                      placeholder="A+ (90-100): Outstanding | A (80-89): Excellent | B+ (70-79): Very Good | B (60-69): Good | C (50-59): Average | D (40-49): Below Average | F (0-39): Fail"
                      className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg min-h-[80px]"
                    />
                  </div>

                  <div className="mt-6 flex justify-end">
                    <Button onClick={handleSaveGrading} disabled={saving} className="bg-blue-600">
                      <Save className="w-4 h-4 mr-2" />
                      {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Preferences Settings */}
            <TabsContent value="preferences" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>User Preferences</CardTitle>
                  <CardDescription>
                    Customize your interface and display settings
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Theme</Label>
                      <Select
                        value={preferencesSettings.theme}
                        onValueChange={(value) =>
                          setPreferencesSettings({ ...preferencesSettings, theme: value })
                        }
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="light">Light</SelectItem>
                          <SelectItem value="dark">Dark</SelectItem>
                          <SelectItem value="auto">Auto</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Sidebar Position</Label>
                      <Select
                        value={preferencesSettings.sidebarPosition}
                        onValueChange={(value) =>
                          setPreferencesSettings({ ...preferencesSettings, sidebarPosition: value })
                        }
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="left">Left</SelectItem>
                          <SelectItem value="right">Right</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Date Format</Label>
                      <Select
                        value={preferencesSettings.dateFormat}
                        onValueChange={(value) =>
                          setPreferencesSettings({ ...preferencesSettings, dateFormat: value })
                        }
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                          <SelectItem value="DD-MM-YYYY">DD-MM-YYYY</SelectItem>
                          <SelectItem value="MM-DD-YYYY">MM-DD-YYYY</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Time Format</Label>
                      <Select
                        value={preferencesSettings.timeFormat}
                        onValueChange={(value) =>
                          setPreferencesSettings({ ...preferencesSettings, timeFormat: value })
                        }
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="24h">24 Hour</SelectItem>
                          <SelectItem value="12h">12 Hour</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Language</Label>
                      <Select
                        value={preferencesSettings.language}
                        onValueChange={(value) =>
                          setPreferencesSettings({ ...preferencesSettings, language: value })
                        }
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="en">English</SelectItem>
                          <SelectItem value="es">Spanish</SelectItem>
                          <SelectItem value="fr">French</SelectItem>
                          <SelectItem value="de">German</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end">
                    <Button
                      onClick={handleSavePreferences}
                      disabled={saving}
                      className="bg-blue-600"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* System Settings */}
            <TabsContent value="system" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>System Configuration</CardTitle>
                  <CardDescription>
                    Configure system-wide settings and permissions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-base">Enable Notifications</Label>
                        <p className="text-sm text-gray-500">
                          Send system notifications to users
                        </p>
                      </div>
                      <Switch
                        checked={systemSettings.enableNotifications}
                        onCheckedChange={(checked) =>
                          setSystemSettings({ ...systemSettings, enableNotifications: checked })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-base">Enable Email Reports</Label>
                        <p className="text-sm text-gray-500">
                          Send report cards via email
                        </p>
                      </div>
                      <Switch
                        checked={systemSettings.enableEmailReports}
                        onCheckedChange={(checked) =>
                          setSystemSettings({ ...systemSettings, enableEmailReports: checked })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-base">Auto-publish Results</Label>
                        <p className="text-sm text-gray-500">
                          Automatically publish results when marks are entered
                        </p>
                      </div>
                      <Switch
                        checked={systemSettings.autoPublishResults}
                        onCheckedChange={(checked) =>
                          setSystemSettings({ ...systemSettings, autoPublishResults: checked })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-base">Allow Students to View Marks</Label>
                        <p className="text-sm text-gray-500">
                          Students can view their own marks
                        </p>
                      </div>
                      <Switch
                        checked={systemSettings.allowStudentViewMarks}
                        onCheckedChange={(checked) =>
                          setSystemSettings({ ...systemSettings, allowStudentViewMarks: checked })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-base">Allow Parents to View Marks</Label>
                        <p className="text-sm text-gray-500">
                          Parents can view their children's marks
                        </p>
                      </div>
                      <Switch
                        checked={systemSettings.allowParentViewMarks}
                        onCheckedChange={(checked) =>
                          setSystemSettings({ ...systemSettings, allowParentViewMarks: checked })
                        }
                      />
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end">
                    <Button onClick={handleSaveSystem} disabled={saving} className="bg-blue-600">
                      <Save className="w-4 h-4 mr-2" />
                      {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Sample Data Tab */}
            <TabsContent value="sample-data" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-amber-500" />
                    End-to-End Sample Data Generator
                  </CardTitle>
                  <CardDescription>
                    Generate complete sample data across all modules to test the entire application flow.
                    This creates interconnected data from student registration to report card generation.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Data Flow Diagram */}
                  <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100">
                    <h3 className="font-semibold text-gray-800 mb-3">Data Flow (Happy Path)</h3>
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      <span className="px-2 py-1 bg-white rounded border">Academic Year</span>
                      <ArrowRight className="w-4 h-4 text-gray-400" />
                      <span className="px-2 py-1 bg-white rounded border">Class</span>
                      <ArrowRight className="w-4 h-4 text-gray-400" />
                      <span className="px-2 py-1 bg-white rounded border">Section</span>
                      <ArrowRight className="w-4 h-4 text-gray-400" />
                      <span className="px-2 py-1 bg-white rounded border">Teacher</span>
                      <ArrowRight className="w-4 h-4 text-gray-400" />
                      <span className="px-2 py-1 bg-white rounded border">Subjects</span>
                      <ArrowRight className="w-4 h-4 text-gray-400" />
                      <span className="px-2 py-1 bg-white rounded border">Student</span>
                      <ArrowRight className="w-4 h-4 text-gray-400" />
                      <span className="px-2 py-1 bg-white rounded border">Exam</span>
                      <ArrowRight className="w-4 h-4 text-gray-400" />
                      <span className="px-2 py-1 bg-white rounded border">Timetable</span>
                      <ArrowRight className="w-4 h-4 text-gray-400" />
                      <span className="px-2 py-1 bg-white rounded border">Marks</span>
                      <ArrowRight className="w-4 h-4 text-gray-400" />
                      <span className="px-2 py-1 bg-white rounded border">Result</span>
                      <ArrowRight className="w-4 h-4 text-gray-400" />
                      <span className="px-2 py-1 bg-green-100 rounded border border-green-300">Report Card</span>
                    </div>
                    {/* V3 Online Exams Flow */}
                    <div className="mt-3 pt-3 border-t border-blue-200">
                      <h4 className="font-medium text-blue-800 mb-2 flex items-center gap-2">
                        <Monitor className="w-4 h-4" />
                        Online Exams (V3)
                      </h4>
                      <div className="flex flex-wrap items-center gap-2 text-sm">
                        <span className="px-2 py-1 bg-blue-100 rounded border border-blue-300">Exam Paper</span>
                        <ArrowRight className="w-4 h-4 text-blue-400" />
                        <span className="px-2 py-1 bg-blue-100 rounded border border-blue-300">Paper Rules</span>
                        <ArrowRight className="w-4 h-4 text-blue-400" />
                        <span className="px-2 py-1 bg-blue-100 rounded border border-blue-300">Questions (MCQ/Theory)</span>
                        <ArrowRight className="w-4 h-4 text-blue-400" />
                        <span className="px-2 py-1 bg-blue-100 rounded border border-blue-300">Student Attempts</span>
                        <ArrowRight className="w-4 h-4 text-blue-400" />
                        <span className="px-2 py-1 bg-purple-100 rounded border border-purple-300">Student Responses</span>
                      </div>
                    </div>
                  </div>

                  {/* Generate Buttons */}
                  <div className="flex flex-col items-center gap-4 mb-6">
                    <div className="flex flex-col gap-3 w-full max-w-md">
                      <Button
                        onClick={generateEndToEndSampleDataV2}
                        disabled={isGenerating}
                        size="lg"
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-6 text-lg w-full"
                      >
                        {isGenerating ? (
                          <>
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-5 h-5 mr-2" />
                            Generate End-to-End (Scaled Entry)
                          </>
                        )}
                      </Button>
                      <p className="text-xs text-gray-500 text-center">
                        External marks entered out of 100, auto-scaled to 80
                      </p>
                      
                      <Button
                        onClick={generateEndToEndSampleDataV2Direct}
                        disabled={isGenerating}
                        size="lg"
                        className="bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white px-8 py-6 text-lg w-full"
                      >
                        {isGenerating ? (
                          <>
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-5 h-5 mr-2" />
                            Generate End-to-End (Direct Entry)
                          </>
                        )}
                      </Button>
                      <p className="text-xs text-gray-500 text-center">
                        External marks entered directly out of 80 (no scaling)
                      </p>
                    </div>
                    <div className="w-full border-t pt-4">
                      <div className="flex flex-col gap-3 w-full max-w-md">
                        <Button
                          onClick={generateSingleTestStudent}
                          disabled={isGenerating}
                          size="lg"
                          variant="outline"
                          className="border-2 border-green-600 text-green-600 hover:bg-green-50 px-8 py-6 text-lg w-full"
                        >
                          {isGenerating ? (
                            <>
                              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                              Creating Test Student...
                            </>
                          ) : (
                            <>
                              <Award className="w-5 h-5 mr-2" />
                              Generate Single Test Student (Mixed)
                            </>
                          )}
                        </Button>
                        <p className="text-xs text-gray-500 text-center">
                          Creates 1 student with mixed entry modes (scaled + direct)
                        </p>
                        
                        <Button
                          onClick={generateSingleTestStudentDirect}
                          disabled={isGenerating}
                          size="lg"
                          variant="outline"
                          className="border-2 border-teal-600 text-teal-600 hover:bg-teal-50 px-8 py-6 text-lg w-full"
                        >
                          {isGenerating ? (
                            <>
                              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                              Creating Test Student...
                            </>
                          ) : (
                            <>
                              <Award className="w-5 h-5 mr-2" />
                              Generate Single Test Student (Direct Entry)
                            </>
                          )}
                        </Button>
                        <p className="text-xs text-gray-500 text-center">
                          Creates 1 student with DIRECT ENTRY mode (all subjects use 80 marks directly)
                        </p>
                        
                        <Button
                          onClick={generateStandardTestData}
                          disabled={isGenerating}
                          size="lg"
                          variant="outline"
                          className="border-2 border-purple-600 text-purple-600 hover:bg-purple-50 px-8 py-6 text-lg w-full"
                        >
                          {isGenerating ? (
                            <>
                              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                              Creating Standard Test Data...
                            </>
                          ) : (
                            <>
                              <Award className="w-5 h-5 mr-2" />
                              Generate Standard Test Data (5 Subjects)
                            </>
                          )}
                        </Button>
                        <p className="text-xs text-gray-500 text-center">
                          Creates test data with: Hindi, English, SST, Mathematics, Science<br/>
                          Consistent marks for Template 1, 2 & 3
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Progress Steps */}
                  <div className="space-y-2">
                    <h3 className="font-semibold text-gray-800 mb-3">Generation Progress</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {generationSteps.map((step) => {
                        const Icon = step.icon;
                        return (
                          <div
                            key={step.id}
                            className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                              step.status === 'running'
                                ? 'bg-blue-50 border-blue-200'
                                : step.status === 'success'
                                ? 'bg-green-50 border-green-200'
                                : step.status === 'error'
                                ? 'bg-red-50 border-red-200'
                                : 'bg-gray-50 border-gray-200'
                            }`}
                          >
                            <Icon className={`w-5 h-5 ${
                              step.status === 'success' ? 'text-green-600' :
                              step.status === 'error' ? 'text-red-600' :
                              step.status === 'running' ? 'text-blue-600' :
                              'text-gray-400'
                            }`} />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm text-gray-800">{step.name}</p>
                              {step.message && (
                                <p className={`text-xs truncate ${
                                  step.status === 'error' ? 'text-red-600' : 'text-gray-500'
                                }`}>
                                  {step.message}
                                </p>
                              )}
                            </div>
                            {getStatusIcon(step.status)}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Generated Data Summary */}
                  {generatedData && (
                    <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
                      <h3 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
                        <CheckCircle className="w-5 h-5" />
                        Sample Data Generated Successfully!
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Students</p>
                          <p className="font-medium">{generatedData.students?.length || generatedData.student?.name || 0}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Class</p>
                          <p className="font-medium">{generatedData.class?.name || generatedData.class?.className}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Exams</p>
                          <p className="font-medium">
                            {(generatedData.unitTestExams?.length || 0) + (generatedData.finalExams?.length || (generatedData.exam ? 1 : 0))}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600">Results</p>
                          <p className="font-medium text-green-600">
                            {generatedData.results?.length || (generatedData.result ? 1 : 0)} created
                          </p>
                        </div>
                      </div>
                      
                      {/* V3 Online Exams Summary */}
                      {generatedData.onlinePaper && (
                        <div className="mt-4 pt-4 border-t border-green-200">
                          <h4 className="font-medium text-blue-700 mb-2 flex items-center gap-2">
                            <Monitor className="w-4 h-4" />
                            Online Exams (V3)
                          </h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <p className="text-gray-600">Exam Paper</p>
                              <p className="font-medium">{generatedData.onlinePaper?.paperTitle?.slice(0, 20)}...</p>
                            </div>
                            <div>
                              <p className="text-gray-600">Questions</p>
                              <p className="font-medium">{generatedData.questions?.length || 0}</p>
                            </div>
                            <div>
                              <p className="text-gray-600">Attempts</p>
                              <p className="font-medium">{generatedData.attempts?.length || 0}</p>
                            </div>
                            <div>
                              <p className="text-gray-600">Responses</p>
                              <p className="font-medium">{generatedData.responses?.length || 0}</p>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <p className="mt-4 text-sm text-gray-600">
                        ✅ Navigate to each module (Students, Classes, Teachers, Subjects, Exams, Marks Entry, Results, Report Cards, <strong>Online Exams</strong>) to verify the sample data is connected correctly.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Instructions Card */}
              <Card>
                <CardHeader>
                  <CardTitle>How It Works</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 text-sm text-gray-600">
                    <p>
                      <strong>Purpose:</strong> This tool generates a complete set of interconnected sample data to test the entire application workflow from student registration to report card generation.
                    </p>
                    <p>
                      <strong>What gets created:</strong>
                    </p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>1 Academic Year (current year)</li>
                      <li>1 Class (Sample Class 10)</li>
                      <li>1 Section (Sample Section A) linked to the class</li>
                      <li>1 Teacher (Dr. Sample Teacher)</li>
                      <li>3 Subjects (Mathematics, Physics, Chemistry) assigned to teacher and class</li>
                      <li>20 Students enrolled in the class/section</li>
                      <li>5 Unit Test Exams + 2 Final Exams</li>
                      <li>Marks entries with internal/external breakdown</li>
                      <li>Results for all students (calculated with overall grade)</li>
                      <li>Report Cards ready to view</li>
                    </ul>
                    <p className="mt-3 font-medium text-blue-700">V3 Online Exams (New!):</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>1 Online Exam Paper linked to final exam</li>
                      <li>Pass/Fail rules with negative marking</li>
                      <li>5 MCQ Questions with options (auto-evaluated)</li>
                      <li>2 Theory/Descriptive Questions</li>
                      <li>5 Student Attempts (submitted)</li>
                      <li>Student Responses with answers</li>
                    </ul>
                    <p className="text-amber-600">
                      <strong>Note:</strong> Each generation creates new records with unique IDs. You can run this multiple times to create multiple sample data sets.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* License Tab (Razorpay) */}
            <TabsContent value="license" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    License & Payment
                  </CardTitle>
                  <CardDescription>
                    Manage your school license. Pay securely with Razorpay to activate or renew.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {licenseLoading ? (
                    <div className="flex items-center gap-2 text-gray-500 py-8">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Loading license info...
                    </div>
                  ) : (
                    <>
                      {/* Current license */}
                      <div className="mb-6 p-4 rounded-lg border bg-gray-50">
                        <h3 className="font-semibold text-gray-800 mb-2">Current license</h3>
                        {licenseCurrent ? (
                          <div className="flex flex-wrap items-center gap-4 text-sm">
                            <span className="font-medium text-green-700">{licenseCurrent.plan}</span>
                            <span>Valid until: {new Date(licenseCurrent.validTo).toLocaleDateString()}</span>
                            <span className="px-2 py-0.5 rounded bg-green-100 text-green-800">{licenseCurrent.status}</span>
                          </div>
                        ) : (
                          <p className="text-gray-600">No active license. Choose a plan and pay with Razorpay or PayU.</p>
                        )}
                      </div>

                      {/* Plans */}
                      <h3 className="font-semibold text-gray-800 mb-3">Available plans</h3>
                      {!licenseConfig.razorpayConfigured && !licenseConfig.payuConfigured && (
                        <p className="text-amber-700 text-sm mb-3 bg-amber-50 border border-amber-200 rounded p-2">
                          Add at least one gateway: RAZORPAY_KEY_ID + RAZORPAY_KEY_SECRET, or PAYU_KEY + PAYU_SALT in backend .env
                        </p>
                      )}
                      <div className="grid gap-4 sm:grid-cols-2">
                        {licensePlans.map((plan) => (
                          <div key={plan.plan} className="border rounded-lg p-4 flex flex-col">
                            <p className="font-medium text-gray-900">{plan.plan}</p>
                            <p className="text-2xl font-bold text-blue-600 mt-1">
                              ₹{plan.amount.toLocaleString()}
                              <span className="text-sm font-normal text-gray-500"> / {plan.duration}</span>
                            </p>
                            <div className="mt-4 flex flex-col gap-2">
                              <Button
                                onClick={() => payWithRazorpay(plan)}
                                disabled={!licenseConfig.razorpayConfigured || licensePaying !== null}
                              >
                                {licensePaying === plan.plan ? (
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                  <CreditCard className="w-4 h-4 mr-2" />
                                )}
                                Pay with Razorpay
                              </Button>
                              <Button
                                variant="outline"
                                onClick={() => payWithPayU(plan)}
                                disabled={!licenseConfig.payuConfigured || licensePaying !== null}
                              >
                                Pay with PayU
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Bulk Delete Tab */}
            <TabsContent value="bulk-delete" className="space-y-6">
              <Card className="border-red-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-600">
                    <Trash2 className="w-5 h-5" />
                    Bulk Delete All Data
                  </CardTitle>
                  <CardDescription className="text-red-700">
                    ⚠️ This will permanently delete ALL data from the system. This action cannot be undone!
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Warning Section */}
                    <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
                      <h3 className="font-semibold text-red-900 mb-3 flex items-center gap-2">
                        <AlertCircle className="w-5 h-5" />
                        What Will Be Deleted:
                      </h3>
                      <ul className="list-disc pl-6 space-y-1 text-sm text-red-800">
                        <li>All Results and Report Cards</li>
                        <li>All Marks Entries</li>
                        <li>All Students</li>
                        <li>All Exams</li>
                        <li>All Subjects</li>
                        <li>All Teachers</li>
                        <li>All Sections</li>
                        <li>All Classes</li>
                        <li>All Academic Years</li>
                      </ul>
                      <p className="mt-4 text-sm font-semibold text-red-900">
                        ⚠️ This action is IRREVERSIBLE. Make sure you have a backup if needed.
                      </p>
                    </div>

                    {/* Delete Progress */}
                    {deleteProgress.length > 0 && (
                      <div className="space-y-2">
                        <h3 className="font-semibold text-gray-800 mb-3">Deletion Progress</h3>
                        <div className="grid grid-cols-2 gap-3">
                          {deleteProgress.map((progress) => (
                            <div
                              key={progress.module}
                              className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                                progress.status === 'running'
                                  ? 'bg-blue-50 border-blue-200'
                                  : progress.status === 'success'
                                  ? 'bg-green-50 border-green-200'
                                  : progress.status === 'error'
                                  ? 'bg-red-50 border-red-200'
                                  : 'bg-gray-50 border-gray-200'
                              }`}
                            >
                              {progress.status === 'running' && (
                                <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                              )}
                              {progress.status === 'success' && (
                                <CheckCircle className="w-5 h-5 text-green-500" />
                              )}
                              {progress.status === 'error' && (
                                <XCircle className="w-5 h-5 text-red-500" />
                              )}
                              {progress.status === 'pending' && (
                                <AlertCircle className="w-5 h-5 text-gray-300" />
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm text-gray-800">{progress.module}</p>
                                {progress.count !== undefined && (
                                  <p className="text-xs text-gray-500">
                                    {progress.count} {progress.count === 1 ? 'record' : 'records'}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Delete Button */}
                    <div className="flex justify-center pt-4">
                      <Button
                        onClick={handleBulkDeleteAll}
                        disabled={isDeleting}
                        size="lg"
                        className="bg-red-600 hover:bg-red-700 text-white px-8 py-6 text-lg"
                      >
                        {isDeleting ? (
                          <>
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            Deleting All Data...
                          </>
                        ) : (
                          <>
                            <Trash2 className="w-5 h-5 mr-2" />
                            Delete All Data
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
