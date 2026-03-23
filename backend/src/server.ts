import 'reflect-metadata';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load env before anything else
dotenv.config({ path: path.join(__dirname, '../.env') });
dotenv.config({ path: path.join(__dirname, '../env.example') });

import express from 'express';
import cors from 'cors';
import { DataSource } from 'typeorm';

import { createRoutes, Services } from './routes';
import { AppError } from './common/app-error';

// Services
import { AuthService } from './modules/auth/auth.service';
import { UsersService } from './modules/users/users.service';
import { AcademicYearsService } from './modules/academic-years/academic-years.service';
import { StudentsService } from './modules/students/students.service';
import { ClassesService } from './modules/classes/classes.service';
import { SectionsService } from './modules/sections/sections.service';
import { TeachersService } from './modules/teachers/teachers.service';
import { TeacherAssignmentsService } from './modules/teachers/teacher-assignments.service';
import { SubjectsService } from './modules/subjects/subjects.service';
import { ExamsService } from './modules/exams/exams.service';
import { ExamPapersService } from './modules/exam-papers/exam-papers.service';
import { MarksService } from './modules/marks/marks.service';
import { ResultsService } from './modules/results/results.service';
import { AttachmentsService } from './modules/attachments/attachments.service';
import { FileStorageService } from './modules/attachments/file-storage.service';
import { BatchesService } from './modules/batches/batches.service';
import { CoursesService } from './modules/courses/courses.service';
import { EnrollmentsService } from './modules/enrollments/enrollments.service';
import { LecturesService } from './modules/lectures/lectures.service';
import { AttendanceService } from './modules/attendance/attendance.service';
import { BroadcastsService } from './modules/broadcasts/broadcasts.service';
import { BroadcastProcessorService } from './modules/broadcasts/broadcast-processor.service';
import { LicenseService } from './modules/license/license.service';
import { PaidStudentFeesService } from './modules/paid-student-fees/paid-student-fees.service';
import { PaymentRemindersService } from './modules/payment-reminders/payment-reminders.service';
import { QuestionsService } from './modules/questions/questions.service';
import { QuestionOptionsService } from './modules/question-options/question-options.service';
import { PaperRulesService } from './modules/paper-rules/paper-rules.service';
import { ReportCardTemplatesService } from './modules/report-card-templates/report-card-templates.service';
import { StudentAttemptsService } from './modules/student-attempts/student-attempts.service';
import { StudentHabitsService } from './modules/student-habits/student-habits.service';
import { StudentResponsesService } from './modules/student-responses/student-responses.service';
import { TeacherPayoutsService } from './modules/teacher-payouts/teacher-payouts.service';
import { WhatsAppTemplatesService } from './modules/whatsapp-templates/whatsapp-templates.service';
import { WhatsAppService } from './modules/whatsapp/whatsapp.service';
import { PaymentLinksService } from './modules/payment-links/payment-links.service';
import { EmailService } from './modules/notifications/email.service';
import { EmailTemplatesService } from './modules/notifications/email-templates.service';
import { ReportCardOverridesService } from './modules/report-card-overrides/report-card-overrides.service';
import { AiService } from './modules/ai/ai.service';
import { AnalyticsAgent } from './modules/ai/agents/analytics.agent';
import { LearningEngine } from './modules/ai/learning/learning.engine';
import { PromptManager } from './modules/ai/learning/prompt.manager';
import { PatternRecognizer } from './modules/ai/learning/pattern.recognizer';
import { FeedbackAnalyzer } from './modules/ai/learning/feedback.analyzer';
import { VectorStore } from './modules/ai/learning/vector.store';

async function bootstrap() {
  // ── Database ──
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432', 10),
    username: process.env.DATABASE_USER || 'postgres',
    password: process.env.DATABASE_PASSWORD || 'postgres',
    database: process.env.DATABASE_NAME || 'school_exam_db',
    entities: [path.join(__dirname, '/**/*.entity{.ts,.js}')],
    synchronize: true,
    logging: process.env.NODE_ENV === 'development',
  });

  await dataSource.initialize();
  console.log('Database connected');

  // ── Instantiate services ──
  const usersService = new UsersService(dataSource);
  const authService = new AuthService(usersService);
  const academicYearsService = new AcademicYearsService(dataSource);
  const studentsService = new StudentsService(dataSource);
  const classesService = new ClassesService(dataSource);
  const sectionsService = new SectionsService(dataSource);
  const teachersService = new TeachersService(dataSource);
  const teacherAssignmentsService = new TeacherAssignmentsService(dataSource);
  const subjectsService = new SubjectsService(dataSource);
  const examsService = new ExamsService(dataSource);
  const examPapersService = new ExamPapersService(dataSource);
  const marksService = new MarksService(dataSource);

  // Services without DataSource
  const fileStorageService = new FileStorageService();
  const whatsAppService = new WhatsAppService();
  const paymentLinksService = new PaymentLinksService();
  const emailService = new EmailService();
  const emailTemplatesService = new EmailTemplatesService();

  // Services with DataSource + deps
  const attachmentsService = new AttachmentsService(dataSource, fileStorageService);
  const resultsService = new ResultsService(dataSource, emailService, emailTemplatesService, marksService);
  const broadcastsService = new BroadcastsService(dataSource, whatsAppService);
  const broadcastProcessor = new BroadcastProcessorService(dataSource, whatsAppService);
  broadcastProcessor.start();

  const licenseService = new LicenseService(dataSource);
  const batchesService = new BatchesService(dataSource);
  const coursesService = new CoursesService(dataSource);
  const enrollmentsService = new EnrollmentsService(dataSource);
  const lecturesService = new LecturesService(dataSource);
  const attendanceService = new AttendanceService(dataSource);
  const paidStudentFeesService = new PaidStudentFeesService(dataSource);
  const paymentRemindersService = new PaymentRemindersService(dataSource, whatsAppService, paymentLinksService);
  const questionsService = new QuestionsService(dataSource);
  const questionOptionsService = new QuestionOptionsService(dataSource);
  const paperRulesService = new PaperRulesService(dataSource);
  const reportCardTemplatesService = new ReportCardTemplatesService(dataSource);
  const studentAttemptsService = new StudentAttemptsService(dataSource);
  const studentHabitsService = new StudentHabitsService(dataSource);
  const studentResponsesService = new StudentResponsesService(dataSource);
  const teacherPayoutsService = new TeacherPayoutsService(dataSource);
  const reportCardOverridesService = new ReportCardOverridesService(dataSource);
  const whatsappTemplatesService = new WhatsAppTemplatesService(dataSource);

  // AI services (chained dependencies)
  const analyticsAgent = new AnalyticsAgent(dataSource);
  const patternRecognizer = new PatternRecognizer(dataSource);
  const feedbackAnalyzer = new FeedbackAnalyzer(dataSource);
  const promptManager = new PromptManager(dataSource);
  const vectorStore = new VectorStore(dataSource);
  const learningEngine = new LearningEngine(dataSource, patternRecognizer, promptManager, feedbackAnalyzer);
  const aiService = new AiService(dataSource, learningEngine, promptManager, patternRecognizer, vectorStore, analyticsAgent);

  // ── Express app ──
  const app = express();

  app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  }));
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Mount all API routes
  const services: Services = {
    auth: authService,
    users: usersService,
    academicYears: academicYearsService,
    students: studentsService,
    classes: classesService,
    sections: sectionsService,
    teachers: teachersService,
    teacherAssignments: teacherAssignmentsService,
    subjects: subjectsService,
    exams: examsService,
    examPapers: examPapersService,
    marks: marksService,
    results: resultsService,
    attachments: attachmentsService,
    batches: batchesService,
    courses: coursesService,
    enrollments: enrollmentsService,
    lectures: lecturesService,
    attendance: attendanceService,
    broadcasts: broadcastsService,
    license: licenseService,
    paidStudentFees: paidStudentFeesService,
    paymentReminders: paymentRemindersService,
    questions: questionsService,
    questionOptions: questionOptionsService,
    paperRules: paperRulesService,
    reportCardTemplates: reportCardTemplatesService,
    studentAttempts: studentAttemptsService,
    studentHabits: studentHabitsService,
    studentResponses: studentResponsesService,
    teacherPayouts: teacherPayoutsService,
    whatsappTemplates: whatsappTemplatesService,
    reportCardOverrides: reportCardOverridesService,
    ai: aiService,
    analyticsAgent,
    promptManager,
    dataSource,
  };

  app.use('/api', createRoutes(services));

  // ── Error handler ──
  app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    if (err instanceof AppError) {
      return res.status(err.statusCode).json({ statusCode: err.statusCode, message: err.message });
    }
    console.error('Unhandled error:', err);
    res.status(500).json({ statusCode: 500, message: 'Internal server error' });
  });

  // ── Start ──
  const port = parseInt(process.env.PORT || '3000', 10);
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
}

bootstrap().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
