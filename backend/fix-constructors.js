const fs = require('fs');
const path = require('path');

const modulesDir = path.join(__dirname, 'src/modules');

// Map of service files to their constructor config
// Format: { repos: [{field, entity}], extraDeps: [{field, type}], hasDataSource: bool }
const serviceConfigs = {
  'exams/exams.service.ts': {
    repos: [{ field: 'examRepository', entity: 'Exam' }],
  },
  'enrollments/enrollments.service.ts': null, // read first
  'batches/batches.service.ts': null,
  'results/results.service.ts': null,
  'student-attempts/student-attempts.service.ts': {
    repos: [{ field: 'attemptRepository', entity: 'StudentAttempt' }],
  },
  'paid-student-fees/paid-student-fees.service.ts': null,
  'courses/courses.service.ts': null,
  'report-card-templates/report-card-templates.service.ts': {
    repos: [{ field: 'templateRepository', entity: 'ReportCardTemplate' }],
  },
  'student-responses/student-responses.service.ts': {
    repos: [{ field: 'responseRepository', entity: 'StudentResponse' }],
  },
  'lectures/lectures.service.ts': {
    repos: [{ field: 'lectureRepository', entity: 'Lecture' }],
  },
  'exam-papers/exam-papers.service.ts': {
    repos: [{ field: 'paperRepository', entity: 'ExamPaper' }],
  },
  'whatsapp-templates/whatsapp-templates.service.ts': {
    repos: [{ field: 'templateRepository', entity: 'WhatsAppTemplate' }],
  },
  'attendance/attendance.service.ts': {
    repos: [{ field: 'attendanceRepository', entity: 'Attendance' }],
  },
  'student-habits/student-habits.service.ts': {
    repos: [{ field: 'habitRepository', entity: 'StudentHabit' }],
  },
  'teacher-payouts/teacher-payouts.service.ts': {
    repos: [{ field: 'payoutRepository', entity: 'TeacherPayout' }],
  },
  'paper-rules/paper-rules.service.ts': {
    repos: [{ field: 'ruleRepository', entity: 'PaperRule' }],
  },
  'questions/questions.service.ts': {
    repos: [{ field: 'questionRepository', entity: 'Question' }],
  },
  'question-options/question-options.service.ts': {
    repos: [{ field: 'optionRepository', entity: 'QuestionOption' }],
  },
};

function transformService(filePath, config) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Skip if already transformed (has dataSource.getRepository)
  if (content.includes('dataSource.getRepository')) {
    console.log(`  SKIP (already transformed): ${filePath}`);
    return;
  }

  const { repos } = config;
  
  // Build the new class fields
  const fields = repos.map(r => `  private readonly ${r.field}: Repository<${r.entity}>;`).join('\n');
  
  // Build the repo initializations
  const inits = repos.map(r => `    this.${r.field} = dataSource.getRepository(${r.entity});`).join('\n');

  // Find the constructor and replace it
  // Pattern: constructor(\n  possibly multiple repo lines\n  ) {}
  // Or: constructor(\n  repos\n  private readonly dataSource: DataSource,\n  ) {}
  
  const constructorRegex = /  constructor\(\n([\s\S]*?)\) \{\}/;
  const match = content.match(constructorRegex);
  
  if (!match) {
    console.log(`  WARN: No simple constructor found in ${filePath}`);
    return;
  }

  const hasDataSource = match[1].includes('dataSource: DataSource');
  
  const newConstructor = `${fields}\n\n  constructor(${hasDataSource ? 'private readonly ' : ''}dataSource: DataSource) {\n${inits}\n  }`;
  
  content = content.replace(constructorRegex, newConstructor);
  
  // Ensure DataSource is imported from typeorm
  if (!content.includes('DataSource')) {
    content = content.replace(
      "import { Repository } from 'typeorm';",
      "import { Repository, DataSource } from 'typeorm';"
    );
  }
  
  fs.writeFileSync(filePath, content);
  console.log(`  OK: ${filePath}`);
}

// Process simple services
for (const [file, config] of Object.entries(serviceConfigs)) {
  if (!config) continue;
  const filePath = path.join(modulesDir, file);
  if (fs.existsSync(filePath)) {
    transformService(filePath, config);
  }
}

console.log('\nDone with simple services. Now handling complex ones...');

// Handle subjects (already has DataSource)
function fixSubjects() {
  const fp = path.join(modulesDir, 'subjects/subjects.service.ts');
  let c = fs.readFileSync(fp, 'utf8');
  if (c.includes('dataSource.getRepository')) return console.log('  SKIP subjects');
  
  c = c.replace(
    `  constructor(
    private readonly subjectRepository: Repository<Subject>,
    private readonly subjectTeacherRepository: Repository<SubjectTeacher>,
    private readonly teacherRepository: Repository<Teacher>,
    private readonly dataSource: DataSource,
  ) {}`,
    `  private readonly subjectRepository: Repository<Subject>;
  private readonly subjectTeacherRepository: Repository<SubjectTeacher>;
  private readonly teacherRepository: Repository<Teacher>;

  constructor(private readonly dataSource: DataSource) {
    this.subjectRepository = dataSource.getRepository(Subject);
    this.subjectTeacherRepository = dataSource.getRepository(SubjectTeacher);
    this.teacherRepository = dataSource.getRepository(Teacher);
  }`
  );
  fs.writeFileSync(fp, c);
  console.log('  OK: subjects');
}

// Handle teacher-assignments
function fixTeacherAssignments() {
  const fp = path.join(modulesDir, 'teachers/teacher-assignments.service.ts');
  let c = fs.readFileSync(fp, 'utf8');
  if (c.includes('dataSource.getRepository')) return console.log('  SKIP teacher-assignments');
  
  c = c.replace(
    `  constructor(
    private readonly assignmentRepository: Repository<TeacherAssignment>,
    private readonly teacherRepository: Repository<Teacher>,
    private readonly classRepository: Repository<Class>,
    private readonly sectionRepository: Repository<Section>,
    private readonly subjectRepository: Repository<Subject>,
  ) {}`,
    `  private readonly assignmentRepository: Repository<TeacherAssignment>;
  private readonly teacherRepository: Repository<Teacher>;
  private readonly classRepository: Repository<Class>;
  private readonly sectionRepository: Repository<Section>;
  private readonly subjectRepository: Repository<Subject>;

  constructor(dataSource: DataSource) {
    this.assignmentRepository = dataSource.getRepository(TeacherAssignment);
    this.teacherRepository = dataSource.getRepository(Teacher);
    this.classRepository = dataSource.getRepository(Class);
    this.sectionRepository = dataSource.getRepository(Section);
    this.subjectRepository = dataSource.getRepository(Subject);
  }`
  );
  // Add DataSource import
  if (!c.includes('DataSource')) {
    c = c.replace("import { Repository } from 'typeorm';", "import { Repository, DataSource } from 'typeorm';");
  }
  fs.writeFileSync(fp, c);
  console.log('  OK: teacher-assignments');
}

fixSubjects();
fixTeacherAssignments();

console.log('\nScript complete.');
