import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { DataSource } from 'typeorm';

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
import { BatchesService } from './modules/batches/batches.service';
import { CoursesService } from './modules/courses/courses.service';
import { EnrollmentsService } from './modules/enrollments/enrollments.service';
import { LecturesService } from './modules/lectures/lectures.service';
import { AttendanceService } from './modules/attendance/attendance.service';
import { BroadcastsService } from './modules/broadcasts/broadcasts.service';
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
import { FileStorageService } from './modules/attachments/file-storage.service';
import { EmailService } from './modules/notifications/email.service';
import { EmailTemplatesService } from './modules/notifications/email-templates.service';
import { AiService } from './modules/ai/ai.service';
import { ReportCardOverridesService } from './modules/report-card-overrides/report-card-overrides.service';
import { AnalyticsAgent } from './modules/ai/agents/analytics.agent';
import { PromptManager } from './modules/ai/learning/prompt.manager';
import { BroadcastMessage } from './modules/broadcasts/broadcast-message.entity';
import { BadRequestException } from './common/app-error';

import { createAuthMiddleware } from './middleware/auth.middleware';

// Create a bound auth middleware factory
function authMiddleware(usersService: any) {
  return createAuthMiddleware(usersService);
}

// Async handler wrapper
const h = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) =>
  (req: Request, res: Response, next: NextFunction) => fn(req, res, next).catch(next);

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });

export interface Services {
  auth: AuthService;
  users: UsersService;
  academicYears: AcademicYearsService;
  students: StudentsService;
  classes: ClassesService;
  sections: SectionsService;
  teachers: TeachersService;
  teacherAssignments: TeacherAssignmentsService;
  subjects: SubjectsService;
  exams: ExamsService;
  examPapers: ExamPapersService;
  marks: MarksService;
  results: ResultsService;
  attachments: AttachmentsService;
  batches: BatchesService;
  courses: CoursesService;
  enrollments: EnrollmentsService;
  lectures: LecturesService;
  attendance: AttendanceService;
  broadcasts: BroadcastsService;
  license: LicenseService;
  paidStudentFees: PaidStudentFeesService;
  paymentReminders: PaymentRemindersService;
  questions: QuestionsService;
  questionOptions: QuestionOptionsService;
  paperRules: PaperRulesService;
  reportCardTemplates: ReportCardTemplatesService;
  studentAttempts: StudentAttemptsService;
  studentHabits: StudentHabitsService;
  studentResponses: StudentResponsesService;
  teacherPayouts: TeacherPayoutsService;
  whatsappTemplates: WhatsAppTemplatesService;
  reportCardOverrides: ReportCardOverridesService;
  ai: AiService;
  analyticsAgent: AnalyticsAgent;
  promptManager: PromptManager;
  dataSource: DataSource;
}

export function createRoutes(s: Services): Router {
  const api = Router();

  // ── Auth (public routes) ──
  const auth = Router();
  auth.post('/register', h(async (req, res) => res.status(201).json(await s.auth.register(req.body))));
  auth.post('/login', h(async (req, res) => res.json(await s.auth.login(req.body))));
  auth.get('/me', authMiddleware(s.users), h(async (req, res) => {
    const u = (req as any).user;
    res.json({ userId: u.userId, email: u.email, name: u.name, role: u.role, studentId: u.studentId, teacherId: u.teacherId, isActive: u.isActive });
  }));
  api.use('/auth', auth);

  // All remaining routes require auth
  api.use(authMiddleware(s.users));

  // ── Users ──
  const users = Router();
  users.post('/', h(async (req, res) => res.status(201).json(await s.users.create(req.body))));
  users.get('/', h(async (req, res) => res.json(await s.users.findAll())));
  users.get('/:userId', h(async (req, res) => res.json(await s.users.findById(req.params.userId))));
  api.use('/users', users);

  // ── Academic Years ──
  const ay = Router();
  ay.get('/', h(async (req, res) => res.json(await s.academicYears.findAll({ status: req.query.status as string }))));
  ay.get('/current', h(async (req, res) => res.json(await s.academicYears.findCurrent())));
  ay.get('/:id', h(async (req, res) => res.json(await s.academicYears.findOne(req.params.id))));
  ay.post('/', h(async (req, res) => res.status(201).json(await s.academicYears.create(req.body))));
  ay.patch('/:id', h(async (req, res) => res.json(await s.academicYears.update(req.params.id, req.body))));
  ay.patch('/:id/set-current', h(async (req, res) => res.json(await s.academicYears.setAsCurrent(req.params.id))));
  ay.delete('/:id', h(async (req, res) => { await s.academicYears.remove(req.params.id); res.status(204).send(); }));
  api.use('/academic-years', ay);

  // ── Students ──
  const students = Router();
  students.get('/', h(async (req, res) => res.json(await s.students.findAll({ classId: req.query.classId as string, sectionId: req.query.sectionId as string, status: req.query.status as string, search: req.query.search as string }))));
  students.get('/by-class-section', h(async (req, res) => res.json(await s.students.getByClassAndSection(req.query.classId as string, req.query.sectionId as string))));
  students.get('/:id', h(async (req, res) => res.json(await s.students.findOne(req.params.id))));
  students.post('/', h(async (req, res) => res.status(201).json(await s.students.create(req.body))));
  students.post('/bulk-delete', h(async (req, res) => res.json(await s.students.bulkDelete(req.body.studentIds))));
  students.patch('/:id/rename', h(async (req, res) => res.json(await s.students.rename(req.params.id, req.body.newId))));
  students.patch('/:id', h(async (req, res) => res.json(await s.students.update(req.params.id, req.body))));
  students.delete('/:id', h(async (req, res) => { await s.students.remove(req.params.id); res.status(204).send(); }));
  api.use('/students', students);

  // ── Classes ──
  const classes = Router();
  classes.get('/', h(async (req, res) => res.json(await s.classes.findAll({ status: req.query.status as string, search: req.query.search as string }))));
  classes.get('/dropdown', h(async (req, res) => res.json(await s.classes.getForDropdown())));
  classes.get('/:id', h(async (req, res) => res.json(await s.classes.findOne(req.params.id))));
  classes.post('/', h(async (req, res) => res.status(201).json(await s.classes.create(req.body))));
  classes.post('/bulk-delete', h(async (req, res) => res.json(await s.classes.bulkDelete(req.body.classIds))));
  classes.patch('/:id', h(async (req, res) => res.json(await s.classes.update(req.params.id, req.body))));
  classes.delete('/:id', h(async (req, res) => { await s.classes.remove(req.params.id); res.status(204).send(); }));
  api.use('/classes', classes);

  // ── Sections ──
  const sections = Router();
  sections.get('/', h(async (req, res) => res.json(await s.sections.findAll({ classId: req.query.classId as string, status: req.query.status as string }))));
  sections.get('/dropdown', h(async (req, res) => res.json(await s.sections.getForDropdown(req.query.classId as string))));
  sections.get('/by-class/:classId', h(async (req, res) => res.json(await s.sections.findByClass(req.params.classId))));
  sections.get('/:id', h(async (req, res) => res.json(await s.sections.findOne(req.params.id))));
  sections.post('/', h(async (req, res) => res.status(201).json(await s.sections.create(req.body))));
  sections.post('/bulk-delete', h(async (req, res) => res.json(await s.sections.bulkDelete(req.body.sectionIds))));
  sections.patch('/:id', h(async (req, res) => res.json(await s.sections.update(req.params.id, req.body))));
  sections.delete('/:id', h(async (req, res) => { await s.sections.remove(req.params.id); res.status(204).send(); }));
  api.use('/sections', sections);

  // ── Teachers ──
  const teachers = Router();
  teachers.get('/', h(async (req, res) => res.json(await s.teachers.findAll({ status: req.query.status as string, search: req.query.search as string }))));
  teachers.get('/dropdown', h(async (req, res) => res.json(await s.teachers.getForDropdown())));
  teachers.get('/:id', h(async (req, res) => res.json(await s.teachers.findOne(req.params.id))));
  teachers.post('/', h(async (req, res) => res.status(201).json(await s.teachers.create(req.body))));
  teachers.post('/bulk-delete', h(async (req, res) => res.json(await s.teachers.bulkDelete(req.body.teacherIds))));
  teachers.patch('/:id/rename', h(async (req, res) => res.json(await s.teachers.rename(req.params.id, req.body.newId))));
  teachers.patch('/:id', h(async (req, res) => res.json(await s.teachers.update(req.params.id, req.body))));
  teachers.delete('/:id', h(async (req, res) => { await s.teachers.remove(req.params.id); res.status(204).send(); }));
  api.use('/teachers', teachers);

  // ── Teacher Assignments ──
  const ta = Router();
  ta.get('/', h(async (req, res) => res.json(await s.teacherAssignments.findAll({ teacherId: req.query.teacherId as string, classId: req.query.classId as string, sectionId: req.query.sectionId as string, subjectId: req.query.subjectId as string, academicYear: req.query.academicYear as string, status: req.query.status as string }))));
  ta.get('/teacher/:classId/:sectionId/:subjectId', h(async (req, res) => res.json(await s.teacherAssignments.findAll({ classId: req.params.classId, sectionId: req.params.sectionId, subjectId: req.params.subjectId, academicYear: req.query.academicYear as string }))));
  ta.get('/subjects/:classId/:sectionId', h(async (req, res) => res.json(await s.teacherAssignments.findAll({ classId: req.params.classId, sectionId: req.params.sectionId, academicYear: req.query.academicYear as string }))));
  ta.get('/by-teacher/:teacherId', h(async (req, res) => res.json(await s.teacherAssignments.findAll({ teacherId: req.params.teacherId, academicYear: req.query.academicYear as string }))));
  ta.get('/:id', h(async (req, res) => res.json(await s.teacherAssignments.findOne(Number(req.params.id)))));
  ta.post('/', h(async (req, res) => res.status(201).json(await s.teacherAssignments.create(req.body))));
  ta.put('/:id', h(async (req, res) => res.json(await s.teacherAssignments.update(Number(req.params.id), req.body))));
  ta.delete('/:id', h(async (req, res) => { await s.teacherAssignments.remove(Number(req.params.id)); res.status(204).send(); }));
  api.use('/teacher-assignments', ta);

  // ── Subjects ──
  const subjects = Router();
  subjects.get('/', h(async (req, res) => res.json(await s.subjects.findAll({ classId: req.query.classId as string, teacherId: req.query.teacherId as string, status: req.query.status as string, search: req.query.search as string }))));
  subjects.get('/dropdown', h(async (req, res) => res.json(await s.subjects.getForDropdown(req.query.classId as string))));
  subjects.get('/by-class/:classId', h(async (req, res) => res.json(await s.subjects.findByClass(req.params.classId))));
  subjects.get('/:id', h(async (req, res) => res.json(await s.subjects.findOne(req.params.id))));
  subjects.get('/:id/teachers', h(async (req, res) => res.json(await s.subjects.getSubjectTeachers(req.params.id))));
  subjects.post('/', h(async (req, res) => res.status(201).json(await s.subjects.create(req.body))));
  subjects.post('/:id/teachers', h(async (req, res) => res.json(await s.subjects.addTeacherToSubject({ subjectId: req.params.id, teacherId: req.body.teacherId, isPrimary: req.body.isPrimary }))));
  subjects.delete('/:id/teachers/:teacherId', h(async (req, res) => { await s.subjects.removeTeacherFromSubject(req.params.id, req.params.teacherId); res.status(204).send(); }));
  subjects.post('/bulk-delete', h(async (req, res) => res.json(await s.subjects.bulkDelete(req.body.subjectIds))));
  subjects.patch('/:id', h(async (req, res) => res.json(await s.subjects.update(req.params.id, req.body))));
  subjects.delete('/:id', h(async (req, res) => { await s.subjects.remove(req.params.id); res.status(204).send(); }));
  api.use('/subjects', subjects);

  // ── Exams ──
  const exams = Router();
  exams.get('/', h(async (req, res) => res.json(await s.exams.findAll({ classId: req.query.classId as string, status: req.query.status as string, search: req.query.search as string, academicYear: req.query.academicYear as string }))));
  exams.get('/dropdown', h(async (req, res) => res.json(await s.exams.getForDropdown())));
  exams.get('/:id', h(async (req, res) => res.json(await s.exams.findOne(req.params.id))));
  exams.post('/', h(async (req, res) => res.status(201).json(await s.exams.create(req.body))));
  exams.post('/bulk-delete', h(async (req, res) => res.json(await s.exams.bulkDelete(req.body.examIds))));
  exams.patch('/:id', h(async (req, res) => res.json(await s.exams.update(req.params.id, req.body))));
  exams.delete('/:id', h(async (req, res) => { await s.exams.remove(req.params.id); res.status(204).send(); }));
  api.use('/exams', exams);

  // ── Exam Papers ──
  const ep = Router();
  ep.get('/', h(async (req, res) => res.json(await s.examPapers.findAll({ examId: req.query.examId as string, isOnline: req.query.isOnline === 'true' ? true : undefined, status: req.query.status as string }))));
  ep.get('/:id', h(async (req, res) => res.json(await s.examPapers.findOne(req.params.id))));
  ep.post('/', h(async (req, res) => res.status(201).json(await s.examPapers.create(req.body))));
  ep.patch('/:id', h(async (req, res) => res.json(await s.examPapers.update(req.params.id, req.body))));
  ep.delete('/:id', h(async (req, res) => { await s.examPapers.remove(req.params.id); res.status(204).send(); }));
  api.use('/exam-papers', ep);

  // ── Marks ──
  const marks = Router();
  marks.get('/', h(async (req, res) => res.json(await s.marks.findAll({ studentId: req.query.studentId as string, examId: req.query.examId as string, subjectId: req.query.subjectId as string, status: req.query.status as string }))));
  marks.get('/by-student/:studentId', h(async (req, res) => res.json(await s.marks.getByStudent(req.params.studentId))));
  marks.get('/by-exam/:examId', h(async (req, res) => res.json(await s.marks.getByExam(req.params.examId))));
  marks.get('/by-student-exam', h(async (req, res) => res.json(await s.marks.getByStudentAndExam(req.query.studentId as string, req.query.examId as string))));
  marks.get('/:id', h(async (req, res) => res.json(await s.marks.findOne(req.params.id))));
  marks.post('/', h(async (req, res) => res.status(201).json(await s.marks.create(req.body))));
  marks.post('/bulk-delete', h(async (req, res) => res.json(await s.marks.bulkDelete(req.body.markIds))));
  marks.patch('/:id', h(async (req, res) => res.json(await s.marks.update(req.params.id, req.body))));
  marks.delete('/:id', h(async (req, res) => { await s.marks.remove(req.params.id); res.status(204).send(); }));
  api.use('/marks', marks);

  // ── Results ──
  const results = Router();
  results.get('/', h(async (req, res) => res.json(await s.results.findAll({ studentId: req.query.studentId as string, examId: req.query.examId as string, classId: req.query.classId as string, status: req.query.status as string }))));
  results.get('/by-student/:studentId', h(async (req, res) => res.json(await s.results.getByStudent(req.params.studentId))));
  results.get('/by-exam/:examId', h(async (req, res) => res.json(await s.results.getByExam(req.params.examId))));
  results.get('/report-cards', h(async (req, res) => res.json(await s.results.getReportCardsList({ examId: req.query.examId as string, classId: req.query.classId as string, studentId: req.query.studentId as string }))));
  results.get('/report-card/:studentId/:examId', h(async (req, res) => res.json(await s.results.getReportCard(req.params.studentId, req.params.examId, (req.query.version as any) || 'v1', (req.query.unitTestMethod as any) || 'average'))));
  results.get('/:resultId', h(async (req, res) => res.json(await s.results.findOne(req.params.resultId))));
  results.post('/', h(async (req, res) => res.status(201).json(await s.results.create(req.body))));
  results.post('/calculate/:studentId/:examId', h(async (req, res) => res.json(await s.results.calculateFromMarks(req.params.studentId, req.params.examId, req.body.classId, req.body.useVersion2 || false, req.body.unitTestMethod || 'average'))));
  results.post('/calculate-ranks/:examId', h(async (req, res) => res.json(await s.results.calculateRanks(req.params.examId))));
  results.put('/:resultId', h(async (req, res) => res.json(await s.results.update(req.params.resultId, req.body))));
  results.put('/:resultId/publish', h(async (req, res) => res.json(await s.results.publish(req.params.resultId, req.body?.sendEmail !== false))));
  results.put('/:resultId/send-notification', h(async (req, res) => res.json(await s.results.sendNotification(req.params.resultId))));
  results.put('/:resultId/unpublish', h(async (req, res) => res.json(await s.results.unpublish(req.params.resultId))));
  results.delete('/bulk-delete', h(async (req, res) => { await s.results.bulkDelete(req.body.resultIds); res.status(204).send(); }));
  results.delete('/:resultId', h(async (req, res) => { await s.results.remove(req.params.resultId); res.status(204).send(); }));
  api.use('/results', results);

  // ── Attachments ──
  const att = Router();
  att.post('/upload', upload.single('file'), h(async (req, res) => {
    const file = (req as any).file;
    if (!file) throw new BadRequestException('No file provided');
    const { entityType, entityId, category, description, uploadedBy } = req.query as any;
    if (!entityType || !entityId) throw new BadRequestException('entityType and entityId are required');
    res.status(201).json(await s.attachments.upload(file, entityType, entityId, category, description, uploadedBy));
  }));
  att.get('/storage/info', h(async (req, res) => res.json(await s.attachments.getStorageInfo())));
  att.get('/:id/download', h(async (req, res) => {
    const { buffer, attachment } = await s.attachments.download(Number(req.params.id));
    res.set({ 'Content-Type': attachment.mimeType, 'Content-Disposition': `attachment; filename="${encodeURIComponent(attachment.originalName)}"`, 'Content-Length': String(buffer.length) });
    res.send(buffer);
  }));
  att.get('/:id/preview', h(async (req, res) => {
    const { buffer, attachment } = await s.attachments.download(Number(req.params.id));
    res.set({ 'Content-Type': attachment.mimeType, 'Content-Disposition': `inline; filename="${encodeURIComponent(attachment.originalName)}"`, 'Content-Length': String(buffer.length) });
    res.send(buffer);
  }));
  att.get('/:id', h(async (req, res) => res.json(await s.attachments.findOne(Number(req.params.id)))));
  att.get('/', h(async (req, res) => {
    const { entityType, entityId } = req.query as any;
    if (!entityType || !entityId) throw new BadRequestException('entityType and entityId are required');
    res.json(await s.attachments.findByEntity(entityType, entityId));
  }));
  att.delete('/:id', h(async (req, res) => { await s.attachments.remove(Number(req.params.id)); res.status(204).send(); }));
  att.delete('/', h(async (req, res) => {
    const { entityType, entityId } = req.query as any;
    if (!entityType || !entityId) throw new BadRequestException('entityType and entityId are required');
    const count = await s.attachments.removeAllForEntity(entityType, entityId);
    res.json({ deleted: count });
  }));
  api.use('/attachments', att);

  // ── Batches ──
  const batches = Router();
  batches.get('/', h(async (req, res) => res.json(await s.batches.findAll({ courseId: req.query.courseId ? Number(req.query.courseId) : undefined, classId: req.query.classId as string, isCompleted: req.query.isCompleted === 'true' ? true : undefined, search: req.query.search as string }))));
  batches.get('/dropdown', h(async (req, res) => res.json(await s.batches.getForDropdown())));
  batches.get('/:id', h(async (req, res) => res.json(await s.batches.findOne(Number(req.params.id)))));
  batches.post('/', h(async (req, res) => res.status(201).json(await s.batches.create(req.body))));
  batches.post('/:id/teachers', h(async (req, res) => res.json(await s.batches.addTeacher(Number(req.params.id), req.body))));
  batches.post('/:id/students', h(async (req, res) => res.json(await s.batches.addStudent(Number(req.params.id), req.body))));
  batches.patch('/:id', h(async (req, res) => res.json(await s.batches.update(Number(req.params.id), req.body))));
  batches.delete('/:id/teachers/:teacherId', h(async (req, res) => { await s.batches.removeTeacher(Number(req.params.id), req.params.teacherId); res.status(204).send(); }));
  batches.delete('/:id/students/:studentId', h(async (req, res) => { await s.batches.removeStudent(Number(req.params.id), req.params.studentId); res.status(204).send(); }));
  batches.delete('/:id', h(async (req, res) => { await s.batches.remove(Number(req.params.id)); res.status(204).send(); }));
  api.use('/batches', batches);

  // ── Courses ──
  const courses = Router();
  courses.get('/', h(async (req, res) => res.json(await s.courses.findAll({ search: req.query.search as string, class: req.query.class as string, stream: req.query.stream as string }))));
  courses.get('/dropdown', h(async (req, res) => res.json(await s.courses.getForDropdown())));
  courses.get('/:id', h(async (req, res) => res.json(await s.courses.findOne(Number(req.params.id)))));
  courses.post('/', h(async (req, res) => res.status(201).json(await s.courses.create(req.body))));
  courses.post('/bulk-delete', h(async (req, res) => res.json(await s.courses.bulkDelete(req.body.ids))));
  courses.patch('/:id', h(async (req, res) => res.json(await s.courses.update(Number(req.params.id), req.body))));
  courses.delete('/:id', h(async (req, res) => { await s.courses.remove(Number(req.params.id)); res.status(204).send(); }));
  api.use('/courses', courses);

  // ── Enrollments ──
  const enrollments = Router();
  enrollments.get('/', h(async (req, res) => res.json(await s.enrollments.findAll({ studentId: req.query.studentId as string, batchId: req.query.batchId ? Number(req.query.batchId) : undefined, courseId: req.query.courseId ? Number(req.query.courseId) : undefined, paymentStatus: req.query.paymentStatus as string }))));
  enrollments.get('/:id', h(async (req, res) => res.json(await s.enrollments.findOne(Number(req.params.id)))));
  enrollments.post('/', h(async (req, res) => res.status(201).json(await s.enrollments.create(req.body))));
  enrollments.patch('/:id', h(async (req, res) => res.json(await s.enrollments.update(Number(req.params.id), req.body))));
  enrollments.delete('/:id', h(async (req, res) => { await s.enrollments.remove(Number(req.params.id)); res.status(204).send(); }));
  api.use('/enrollments', enrollments);

  // ── Lectures ──
  const lectures = Router();
  lectures.get('/', h(async (req, res) => res.json(await s.lectures.findAll({ batchId: req.query.batchId ? Number(req.query.batchId) : undefined, teacherId: req.query.teacherId as string, subjectId: req.query.subjectId as string, search: req.query.search as string, dateFrom: req.query.dateFrom as string, dateTo: req.query.dateTo as string }))));
  lectures.get('/:id', h(async (req, res) => res.json(await s.lectures.findOne(Number(req.params.id)))));
  lectures.post('/', h(async (req, res) => res.status(201).json(await s.lectures.create(req.body))));
  lectures.patch('/:id', h(async (req, res) => res.json(await s.lectures.update(Number(req.params.id), req.body))));
  lectures.delete('/:id', h(async (req, res) => { await s.lectures.remove(Number(req.params.id)); res.status(204).send(); }));
  api.use('/lectures', lectures);

  // ── Attendance ──
  const attendance = Router();
  attendance.get('/', h(async (req, res) => res.json(await s.attendance.findAll({ lectureId: req.query.lectureId ? Number(req.query.lectureId) : undefined, studentId: req.query.studentId as string, status: req.query.status as string }))));
  attendance.get('/:id', h(async (req, res) => res.json(await s.attendance.findOne(Number(req.params.id)))));
  attendance.post('/', h(async (req, res) => res.status(201).json(await s.attendance.create(req.body))));
  attendance.patch('/:id', h(async (req, res) => res.json(await s.attendance.update(Number(req.params.id), req.body))));
  attendance.delete('/:id', h(async (req, res) => { await s.attendance.remove(Number(req.params.id)); res.status(204).send(); }));
  api.use('/attendance', attendance);

  // ── Broadcasts ──
  const broadcasts = Router();
  broadcasts.get('/', h(async (req, res) => res.json(await s.broadcasts.findAll({ status: req.query.status as string }))));
  broadcasts.get('/whatsapp/templates', h(async (req, res) => res.json(await s.broadcasts.getWhatsAppTemplates())));
  broadcasts.get('/:id', h(async (req, res) => res.json(await s.broadcasts.findOne(Number(req.params.id)))));
  broadcasts.post('/', h(async (req, res) => res.status(201).json(await s.broadcasts.create(req.body))));
  broadcasts.post('/with-recipients', h(async (req, res) => res.status(201).json(await s.broadcasts.createWithRecipients(req.body))));
  broadcasts.post('/:id/retry', h(async (req, res) => { await s.broadcasts.retryFailed(Number(req.params.id)); res.json({ message: 'Retry initiated' }); }));
  broadcasts.patch('/:id', h(async (req, res) => res.json(await s.broadcasts.update(Number(req.params.id), req.body))));
  broadcasts.delete('/:id', h(async (req, res) => { await s.broadcasts.remove(Number(req.params.id)); res.status(204).send(); }));
  api.use('/broadcasts', broadcasts);

  // ── WhatsApp Webhook (public) ──
  const webhook = Router();
  const messageRepo = s.dataSource.getRepository(BroadcastMessage);
  const verifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || 'sems_webhook_verify';
  webhook.get('/', (req, res) => {
    const mode = req.query['hub.mode'] as string;
    const token = req.query['hub.verify_token'] as string;
    const challenge = req.query['hub.challenge'] as string;
    if (mode === 'subscribe' && token === verifyToken) { res.send(challenge); }
    else { res.sendStatus(403); }
  });
  webhook.post('/', h(async (req, res) => {
    try {
      for (const entry of (req.body?.entry || [])) {
        for (const change of (entry?.changes || [])) {
          if (change?.field !== 'messages') continue;
          for (const status of (change?.value?.statuses || [])) {
            const mid = status?.id, sv = status?.status, ts = status?.timestamp;
            if (!mid || !sv) continue;
            const msg = await messageRepo.findOne({ where: { providerMessageId: mid } });
            if (!msg) continue;
            const now = new Date(parseInt(ts) * 1000);
            if (sv === 'sent') { msg.status = 'sent'; msg.sentAt = now; }
            else if (sv === 'delivered') { msg.status = 'delivered'; msg.deliveredAt = now; }
            else if (sv === 'read') { msg.status = 'read'; msg.readAt = now; }
            else if (sv === 'failed') { msg.status = 'failed'; msg.failedAt = now; msg.errorMessage = status?.errors?.[0]?.message || 'Delivery failed'; }
            await messageRepo.save(msg);
          }
        }
      }
    } catch (err: any) { console.error(`Webhook error: ${err.message}`); }
    res.send('EVENT_RECEIVED');
  }));
  // Mount webhook before auth middleware by putting it at top level
  api.use('/whatsapp/webhook', webhook);

  // ── License ──
  const license = Router();
  license.get('/current', h(async (req, res) => res.json(await s.license.getCurrent())));
  license.get('/plans', h(async (req, res) => res.json(await s.license.getPlans())));
  license.post('/create-order', h(async (req, res) => res.json(await s.license.createOrder(req.body))));
  license.post('/verify-payment', h(async (req, res) => res.json(await s.license.verifyPayment(req.body))));
  license.post('/payu-callback', h(async (req, res) => res.json(await s.license.handlePayUCallback(req.body))));
  api.use('/license', license);

  // ── Paid Student Fees ──
  const psf = Router();
  psf.get('/', h(async (req, res) => res.json(await s.paidStudentFees.findAll({ enrollmentId: req.query.enrollmentId ? Number(req.query.enrollmentId) : undefined }))));
  psf.get('/:id', h(async (req, res) => res.json(await s.paidStudentFees.findOne(Number(req.params.id)))));
  psf.post('/', h(async (req, res) => res.status(201).json(await s.paidStudentFees.create(req.body))));
  psf.patch('/:id', h(async (req, res) => res.json(await s.paidStudentFees.update(Number(req.params.id), req.body))));
  psf.delete('/:id', h(async (req, res) => { await s.paidStudentFees.remove(Number(req.params.id)); res.status(204).send(); }));
  api.use('/paid-student-fees', psf);

  // ── Payment Reminders ──
  const pr = Router();
  pr.get('/', h(async (req, res) => res.json(await s.paymentReminders.findAll({ enrollmentId: req.query.enrollmentId ? Number(req.query.enrollmentId) : undefined, studentId: req.query.studentId as string, status: req.query.status as string, reminderType: req.query.reminderType as string }))));
  pr.get('/stats', h(async (req, res) => res.json(await s.paymentReminders.getStats())));
  pr.get('/:id', h(async (req, res) => res.json(await s.paymentReminders.findOne(Number(req.params.id)))));
  pr.post('/send', h(async (req, res) => res.json(await s.paymentReminders.sendReminder(req.body.enrollmentId, req.body.reminderType || 'manual'))));
  pr.post('/send-bulk', h(async (req, res) => res.json(await s.paymentReminders.sendBulkReminders(req.body.filters, req.body.reminderType || 'manual'))));
  pr.post('/check-payment', h(async (req, res) => res.json(await s.paymentReminders.checkPaymentStatus(req.body.reminderId))));
  api.use('/payment-reminders', pr);

  // ── Questions ──
  const questions = Router();
  questions.get('/', h(async (req, res) => res.json(await s.questions.findAll({ paperId: req.query.paperId as string, sectionId: req.query.sectionId as string, questionType: req.query.questionType as string, difficulty: req.query.difficulty as string }))));
  questions.get('/:id', h(async (req, res) => res.json(await s.questions.findOne(req.params.id))));
  questions.post('/', h(async (req, res) => res.status(201).json(await s.questions.create(req.body))));
  questions.patch('/:id', h(async (req, res) => res.json(await s.questions.update(req.params.id, req.body))));
  questions.delete('/:id', h(async (req, res) => { await s.questions.remove(req.params.id); res.status(204).send(); }));
  api.use('/questions', questions);

  // ── Question Options ──
  const qo = Router();
  qo.get('/', h(async (req, res) => res.json(await s.questionOptions.findAll({ questionId: req.query.questionId as string }))));
  qo.get('/:id', h(async (req, res) => res.json(await s.questionOptions.findOne(req.params.id))));
  qo.post('/', h(async (req, res) => res.status(201).json(await s.questionOptions.create(req.body))));
  qo.post('/bulk/:questionId', h(async (req, res) => res.json(await s.questionOptions.createBulk(req.params.questionId, req.body.options))));
  qo.patch('/:id', h(async (req, res) => res.json(await s.questionOptions.update(req.params.id, req.body))));
  qo.delete('/:id', h(async (req, res) => { await s.questionOptions.remove(req.params.id); res.status(204).send(); }));
  api.use('/question-options', qo);

  // ── Paper Rules ──
  const prules = Router();
  prules.get('/', h(async (req, res) => res.json(await s.paperRules.findAll({ paperId: req.query.paperId as string }))));
  prules.get('/:id', h(async (req, res) => res.json(await s.paperRules.findOne(req.params.id))));
  prules.post('/', h(async (req, res) => res.status(201).json(await s.paperRules.create(req.body))));
  prules.patch('/:id', h(async (req, res) => res.json(await s.paperRules.update(req.params.id, req.body))));
  prules.delete('/:id', h(async (req, res) => { await s.paperRules.remove(req.params.id); res.status(204).send(); }));
  api.use('/paper-rules', prules);

  // ── Report Card Templates ──
  const rct = Router();
  rct.get('/', h(async (req, res) => res.json(await s.reportCardTemplates.findAll())));
  rct.get('/:id', h(async (req, res) => res.json(await s.reportCardTemplates.findOne(Number(req.params.id)))));
  rct.post('/', h(async (req, res) => res.status(201).json(await s.reportCardTemplates.create(req.body))));
  rct.patch('/:id', h(async (req, res) => res.json(await s.reportCardTemplates.update(Number(req.params.id), req.body))));
  rct.delete('/:id', h(async (req, res) => { await s.reportCardTemplates.remove(Number(req.params.id)); res.status(204).send(); }));
  api.use('/report-card-templates', rct);

  // ── Report Card Overrides ──
  const rco = Router();
  rco.get('/', h(async (req, res) => {
    const { studentId, academicYear, templateId } = req.query as any;
    if (!studentId || !academicYear || !templateId) throw new BadRequestException('studentId, academicYear and templateId are required');
    res.json(await s.reportCardOverrides.findOne(studentId, academicYear, templateId));
  }));
  rco.post('/', h(async (req, res) => res.status(201).json(await s.reportCardOverrides.upsert(req.body))));
  rco.delete('/:id', h(async (req, res) => { await s.reportCardOverrides.remove(req.params.id); res.status(204).send(); }));
  api.use('/report-card-overrides', rco);

  // ── Student Attempts ──
  const sa = Router();
  sa.get('/', h(async (req, res) => res.json(await s.studentAttempts.findAll({ studentId: req.query.studentId as string, paperId: req.query.paperId as string, status: req.query.status as string }))));
  sa.get('/:id', h(async (req, res) => res.json(await s.studentAttempts.findOne(req.params.id))));
  sa.post('/', h(async (req, res) => res.status(201).json(await s.studentAttempts.create(req.body))));
  sa.patch('/:id', h(async (req, res) => res.json(await s.studentAttempts.update(req.params.id, req.body))));
  sa.delete('/:id', h(async (req, res) => { await s.studentAttempts.remove(req.params.id); res.status(204).send(); }));
  api.use('/student-attempts', sa);

  // ── Student Habits ──
  const sh = Router();
  sh.get('/', h(async (req, res) => res.json(await s.studentHabits.findAll({ studentId: req.query.studentId as string, academicYear: req.query.academicYear as string, habitName: req.query.habitName as string }))));
  sh.get('/:id', h(async (req, res) => res.json(await s.studentHabits.findOne(req.params.id))));
  sh.post('/', h(async (req, res) => res.status(201).json(await s.studentHabits.create(req.body))));
  sh.patch('/:id', h(async (req, res) => res.json(await s.studentHabits.update(req.params.id, req.body))));
  sh.delete('/:id', h(async (req, res) => { await s.studentHabits.remove(req.params.id); res.status(204).send(); }));
  api.use('/student-habits', sh);

  // ── Student Responses ──
  const sr = Router();
  sr.get('/', h(async (req, res) => res.json(await s.studentResponses.findAll({ attemptId: req.query.attemptId as string, questionId: req.query.questionId as string, isEvaluated: req.query.isEvaluated === 'true' ? true : req.query.isEvaluated === 'false' ? false : undefined }))));
  sr.get('/by-attempt/:attemptId', h(async (req, res) => res.json(await s.studentResponses.findByAttemptId(req.params.attemptId))));
  sr.get('/by-question/:questionId', h(async (req, res) => res.json(await s.studentResponses.findByQuestionId(req.params.questionId))));
  sr.get('/:responseId', h(async (req, res) => res.json(await s.studentResponses.findOne(req.params.responseId))));
  sr.post('/', h(async (req, res) => res.status(201).json(await s.studentResponses.create(req.body))));
  sr.put('/:responseId', h(async (req, res) => res.json(await s.studentResponses.update(req.params.responseId, req.body))));
  api.use('/student-responses', sr);

  // ── Teacher Payouts ──
  const tp = Router();
  tp.get('/', h(async (req, res) => res.json(await s.teacherPayouts.findAll({ batchId: req.query.batchId ? Number(req.query.batchId) : undefined, teacherId: req.query.teacherId as string, status: req.query.status as string }))));
  tp.get('/by-batch/:batchId', h(async (req, res) => res.json(await s.teacherPayouts.findAll({ batchId: Number(req.params.batchId) }))));
  tp.get('/by-teacher/:teacherId', h(async (req, res) => res.json(await s.teacherPayouts.findAll({ teacherId: req.params.teacherId }))));
  tp.get('/:id', h(async (req, res) => res.json(await s.teacherPayouts.findOne(Number(req.params.id)))));
  tp.post('/', h(async (req, res) => res.status(201).json(await s.teacherPayouts.create(req.body))));
  tp.patch('/:id', h(async (req, res) => res.json(await s.teacherPayouts.update(Number(req.params.id), req.body))));
  tp.delete('/:id', h(async (req, res) => { await s.teacherPayouts.remove(Number(req.params.id)); res.status(204).send(); }));
  api.use('/teacher-payouts', tp);

  // ── WhatsApp Templates ──
  const wt = Router();
  wt.get('/', h(async (req, res) => res.json(await s.whatsappTemplates.findAll({ status: req.query.status as string, language: req.query.language as string }))));
  wt.get('/dropdown', h(async (req, res) => res.json(await s.whatsappTemplates.getDropdown())));
  wt.get('/:id', h(async (req, res) => res.json(await s.whatsappTemplates.findOne(Number(req.params.id)))));
  wt.post('/', h(async (req, res) => res.status(201).json(await s.whatsappTemplates.create(req.body))));
  wt.patch('/:id', h(async (req, res) => res.json(await s.whatsappTemplates.update(Number(req.params.id), req.body))));
  wt.delete('/:id', h(async (req, res) => { await s.whatsappTemplates.remove(Number(req.params.id)); res.status(204).send(); }));
  api.use('/whatsapp-templates', wt);

  // ── AI ──
  const ai = Router();
  ai.post('/query', h(async (req, res) => {
    const user = (req as any).user;
    res.json(await s.ai.processQuery({ ...req.body, userId: user.userId, userRole: user.role }));
  }));
  ai.post('/feedback', h(async (req, res) => res.json(await s.ai.submitFeedback(req.body))));
  ai.get('/insights/:type', h(async (req, res) => {
    const user = (req as any).user;
    const { type } = req.params;
    const timeframe = req.query.timeframe as string;
    if (type === 'performance') return res.json(await s.analyticsAgent.analyzePerformance({ entityType: 'student', timeframe: timeframe || 'last_30_days' }));
    if (type === 'class') return res.json(await s.analyticsAgent.analyzePerformance({ entityType: 'class', timeframe: timeframe || 'last_30_days' }));
    if (type === 'subject') return res.json(await s.analyticsAgent.analyzePerformance({ entityType: 'subject', timeframe: timeframe || 'last_30_days' }));
    if (type === 'overview') return res.json(await s.analyticsAgent.generateInsights({}, {}));
    res.json(await s.ai.getInsights(type, user.userId, user.role));
  }));
  ai.post('/automate', h(async (req, res) => {
    const user = (req as any).user;
    res.json(await s.ai.automateTask({ ...req.body, userId: user.userId }));
  }));
  ai.get('/suggestions', h(async (req, res) => {
    const role = (req as any).user.role;
    const suggestions = ['Show me students who are performing poorly', 'What is the fee collection status?', 'Compare attendance between classes'];
    if (role === 'admin') suggestions.push('Show overall school performance trends', 'Which teachers have the highest pass rates?', 'Predict next term enrollment numbers');
    if (role === 'teacher') suggestions.push('Show my class performance breakdown', 'Which students need extra attention?', 'Compare subject scores for my classes');
    res.json({ suggestions });
  }));
  ai.get('/learning-metrics', h(async (req, res) => {
    const days = Number(req.query.days) || 30;
    const metrics = await s.dataSource.query(`SELECT COALESCE(SUM("totalInteractions"), 0) as "totalInteractions", COALESCE(ROUND(AVG("averageFeedbackScore")::numeric, 2), 0) as "averageFeedbackScore", COALESCE(SUM("newPatternsDiscovered"), 0) as "patternsDiscovered", COALESCE(SUM("templatesGenerated"), 0) as "templatesGenerated", COALESCE(ROUND(AVG("accuracyImprovement")::numeric, 2), 0) as "accuracyImprovement" FROM ai_learning_metrics WHERE "metricDate" >= CURRENT_DATE - $1::integer`, [days]);
    const ic = await s.dataSource.query(`SELECT COUNT(*) as total FROM "ai_interactions" WHERE "createdAt" >= CURRENT_DATE - $1::integer`, [days]);
    const fs = await s.dataSource.query(`SELECT COUNT(*) as total, COALESCE(ROUND(AVG(rating)::numeric, 2), 0) as avg_rating, COUNT(CASE WHEN "feedbackType" = 'thumbs_up' THEN 1 END) as thumbs_up, COUNT(CASE WHEN "feedbackType" = 'thumbs_down' THEN 1 END) as thumbs_down FROM "ai_feedback" WHERE "createdAt" >= CURRENT_DATE - $1::integer`, [days]);
    const pc = await s.dataSource.query(`SELECT COUNT(*) as total FROM "ai_patterns" WHERE "isActive" = true`);
    const tc = await s.dataSource.query(`SELECT COUNT(*) as total, COUNT(CASE WHEN "autoGenerated" = true THEN 1 END) as auto_generated FROM "ai_prompt_templates" WHERE "isActive" = true`);
    res.json({
      period: `${days} days`,
      interactions: { total: parseInt(ic[0]?.total || '0'), dailyAverage: Math.round(parseInt(ic[0]?.total || '0') / days) },
      feedback: { total: parseInt(fs[0]?.total || '0'), averageRating: parseFloat(fs[0]?.avg_rating || '0'), thumbsUp: parseInt(fs[0]?.thumbs_up || '0'), thumbsDown: parseInt(fs[0]?.thumbs_down || '0'), satisfactionRate: parseInt(fs[0]?.total || '0') > 0 ? Math.round((parseInt(fs[0]?.thumbs_up || '0') / parseInt(fs[0]?.total || '1')) * 100) : 0 },
      learning: { activePatterns: parseInt(pc[0]?.total || '0'), activeTemplates: parseInt(tc[0]?.total || '0'), autoGeneratedTemplates: parseInt(tc[0]?.auto_generated || '0'), patternsDiscovered: parseInt(metrics[0]?.patternsDiscovered || '0'), accuracyImprovement: parseFloat(metrics[0]?.accuracyImprovement || '0') },
    });
  }));
  ai.get('/templates', h(async (req, res) => {
    const templates = await s.promptManager.getTemplatesByCategory(req.query.category as string);
    const categories = await s.dataSource.query(`SELECT DISTINCT category, COUNT(*) as count FROM "ai_prompt_templates" WHERE "isActive" = true GROUP BY category ORDER BY category`);
    res.json({ templates: templates || [], categories: categories.map((c: any) => ({ name: c.category, count: parseInt(c.count) })) });
  }));
  ai.post('/templates', h(async (req, res) => {
    const template = await s.promptManager.createTemplate(req.body);
    res.json({ message: 'Template created successfully', template });
  }));
  ai.get('/patterns', h(async (req, res) => {
    const type = req.query.type as string;
    const patterns = await s.dataSource.query(`SELECT * FROM "ai_patterns" WHERE "isActive" = true ${type ? 'AND "patternType" = $1' : ''} ORDER BY frequency DESC LIMIT 100`, type ? [type] : []);
    const categories = await s.dataSource.query(`SELECT DISTINCT category, COUNT(*) as count FROM "ai_patterns" WHERE "isActive" = true GROUP BY category ORDER BY count DESC`);
    res.json({ patterns, categories: categories.map((c: any) => ({ name: c.category, count: parseInt(c.count) })), total: patterns.length });
  }));
  ai.get('/dashboard', h(async (req, res) => {
    const days = 30;
    const [metrics, insights, recentInteractions] = await Promise.all([
      (async () => { /* reuse learning-metrics logic inline */ return {}; })(),
      s.analyticsAgent.generateInsights({}, {}),
      s.dataSource.query(`SELECT i.id, i.question, i."responseTimeMs", i."createdAt", f."feedbackType", f.rating FROM "ai_interactions" i LEFT JOIN "ai_feedback" f ON f."interactionId" = i.id ORDER BY i."createdAt" DESC LIMIT 10`),
    ]);
    res.json({ metrics, insights, recentInteractions: recentInteractions.map((i: any) => ({ id: i.id, question: i.question, responseTime: i.responseTimeMs, createdAt: i.createdAt, feedbackType: i.feedbackType, rating: i.rating })) });
  }));
  api.use('/ai', ai);

  return api;
}
