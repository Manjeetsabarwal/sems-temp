import { NotFoundException, ConflictException } from '../../common/app-error';
import { Repository, DataSource } from 'typeorm';
import { Result } from './result.entity';
import { CreateResultDto } from './dto/create-result.dto';
import { UpdateResultDto } from './dto/update-result.dto';
import { Mark } from '../marks/mark.entity';
import { Student } from '../students/student.entity';
import { Exam } from '../exams/exam.entity';
import { Class } from '../classes/class.entity';
import { User, UserRole } from '../users/user.entity';
import { EmailService } from '../notifications/email.service';
import { EmailTemplatesService } from '../notifications/email-templates.service';
import { MarksService } from '../marks/marks.service';

// Grade calculation based on percentage
export const calculateGrade = (percentage: number): string => {
  if (percentage >= 90) return 'A+';
  if (percentage >= 80) return 'A';
  if (percentage >= 70) return 'B+';
  if (percentage >= 60) return 'B';
  if (percentage >= 50) return 'C';
  if (percentage >= 40) return 'D';
  return 'F';
};

export class ResultsService {
  private readonly resultRepository: Repository<Result>;
  private readonly markRepository: Repository<Mark>;
  private readonly studentRepository: Repository<Student>;
  private readonly examRepository: Repository<Exam>;
  private readonly classRepository: Repository<Class>;
  private readonly userRepository: Repository<User>;

  constructor(
    dataSource: DataSource,
    private readonly emailService: EmailService,
    private readonly emailTemplatesService: EmailTemplatesService,
    private readonly marksService: MarksService,
  ) {
    this.resultRepository = dataSource.getRepository(Result);
    this.markRepository = dataSource.getRepository(Mark);
    this.studentRepository = dataSource.getRepository(Student);
    this.examRepository = dataSource.getRepository(Exam);
    this.classRepository = dataSource.getRepository(Class);
    this.userRepository = dataSource.getRepository(User);
  }

  async findAll(filters?: {
    studentId?: string;
    examId?: string;
    classId?: string;
    status?: string;
  }): Promise<Result[]> {
    const queryBuilder = this.resultRepository
      .createQueryBuilder('result')
      .leftJoinAndSelect('result.student', 'student')
      .leftJoinAndSelect('result.exam', 'exam')
      .leftJoinAndSelect('result.class', 'class');

    if (filters?.studentId) {
      queryBuilder.andWhere('result.studentId = :studentId', { studentId: filters.studentId });
    }

    if (filters?.examId) {
      queryBuilder.andWhere('result.examId = :examId', { examId: filters.examId });
    }

    if (filters?.classId) {
      queryBuilder.andWhere('result.classId = :classId', { classId: filters.classId });
    }

    if (filters?.status) {
      queryBuilder.andWhere('result.status = :status', { status: filters.status });
    }

    return queryBuilder
      .orderBy('result.percentage', 'DESC')
      .addOrderBy('result.createdAt', 'DESC')
      .getMany();
  }

  async findOne(resultId: string): Promise<Result> {
    const result = await this.resultRepository.findOne({
      where: { resultId },
      relations: ['student', 'exam', 'class'],
    });

    if (!result) {
      throw new NotFoundException(`Result ${resultId} not found`);
    }

    return result;
  }

  async create(createDto: CreateResultDto): Promise<Result> {
    try {
      // Check if result already exists for this student and exam
      const existing = await this.resultRepository.findOne({
        where: { studentId: createDto.studentId, examId: createDto.examId },
      });

      if (existing) {
        throw new ConflictException('A result for this student and exam already exists');
      }

      const result = this.resultRepository.create({
        ...createDto,
        status: createDto.status || 'Draft',
      });

      return await this.resultRepository.save(result);
    } catch (error: any) {
      if (error.code === '23505') {
        throw new ConflictException('A result for this student and exam already exists');
      }
      if (error.code === '23503') {
        throw new ConflictException('Invalid student, exam, or class ID');
      }
      throw error;
    }
  }

  async update(resultId: string, updateDto: UpdateResultDto): Promise<Result> {
    try {
      const result = await this.findOne(resultId);
      Object.assign(result, updateDto);

      // If status changed to Published, set publishedAt
      if (updateDto.status === 'Published' && !result.publishedAt) {
        result.publishedAt = new Date();
      }

      return await this.resultRepository.save(result);
    } catch (error: any) {
      if (error.code === '23505') {
        throw new ConflictException('A result for this student and exam already exists');
      }
      throw error;
    }
  }

  async remove(resultId: string): Promise<void> {
    const result = await this.findOne(resultId);
    await this.resultRepository.remove(result);
  }

  async bulkDelete(resultIds: string[]): Promise<void> {
    if (!resultIds || resultIds.length === 0) {
      throw new NotFoundException('No result IDs provided for deletion');
    }

    // Verify all results exist
    const existingResults = await this.resultRepository.find({
      where: resultIds.map((id) => ({ resultId: id })),
    });

    if (existingResults.length !== resultIds.length) {
      const foundIds = existingResults.map((r) => r.resultId);
      const missingIds = resultIds.filter((id) => !foundIds.includes(id));
      throw new NotFoundException(`Results not found: ${missingIds.join(', ')}`);
    }

    await this.resultRepository.delete(resultIds);
  }

  async getByStudent(studentId: string): Promise<Result[]> {
    return this.findAll({ studentId });
  }

  async getByExam(examId: string): Promise<Result[]> {
    return this.findAll({ examId });
  }

  async publish(resultId: string, sendEmail: boolean = true): Promise<Result> {
    const result = await this.findOne(resultId);
    result.status = 'Published';
    result.publishedAt = new Date();
    const savedResult = await this.resultRepository.save(result);

    // Send email notifications asynchronously if requested (don't block the response)
    if (sendEmail) {
      this.sendResultNotifications(savedResult).catch(error => {
        console.error('Error sending result notifications:', error);
      });
    }

    return savedResult;
  }

  async sendNotification(resultId: string): Promise<{ message: string; emailsSent: number }> {
    const result = await this.findOne(resultId);
    
    if (result.status !== 'Published') {
      throw new NotFoundException('Result must be published before sending notifications');
    }

    // Send email notifications asynchronously (don't block the response)
    let emailsSent = 0;
    try {
      await this.sendResultNotifications(result);
      // Count emails that would be sent (we'll track this in the method)
      emailsSent = await this.countNotificationEmails(result);
    } catch (error) {
      console.error('Error sending result notifications:', error);
      throw error;
    }

    return { message: 'Notifications sent successfully', emailsSent };
  }

  private async countNotificationEmails(result: Result): Promise<number> {
    try {
      const student = await this.studentRepository.findOne({ where: { studentId: result.studentId } });
      if (!student) return 0;

      let count = 0;
      if (student.email) count++;
      if (student.parentEmail) count++;

      // Count teachers
      const classTeachers = await this.userRepository.find({
        where: { role: UserRole.TEACHER },
      });
      count += classTeachers.filter(t => t.email).length;

      return count;
    } catch (error) {
      console.error('Error counting notification emails:', error);
      return 0;
    }
  }

  private async sendResultNotifications(result: Result): Promise<void> {
    try {
      // Fetch related data
      const student = await this.studentRepository.findOne({ where: { studentId: result.studentId } });
      const exam = await this.examRepository.findOne({ where: { examId: result.examId } });
      const classEntity = await this.classRepository.findOne({ where: { classId: result.classId } });

      if (!student || !exam || !classEntity) {
        console.error('Missing data for result notification:', { student, exam, classEntity });
        return;
      }

      // Prepare notification data
      const notificationData = {
        studentName: student.name,
        examName: exam.examName,
        examType: exam.examType,
        className: classEntity.className,
        percentage: result.percentage,
        grade: result.grade,
        rank: result.rank || undefined,
        isPassed: result.isPassed,
        totalMarksObtained: result.totalMarksObtained,
        totalMaxMarks: result.totalMaxMarks,
        subjects: (result.subjects || []).map((sub: any) => ({
          subjectName: sub.subjectName || 'Unknown',
          marksObtained: sub.marksObtained || 0,
          maxMarks: sub.maxMarks || 0,
          grade: sub.grade || 'N/A',
          isPassed: sub.isPassed || false,
        })),
      };

      const emails: Array<{ to: string; subject: string; html: string }> = [];

      // 1. Send email to student (if email exists)
      if (student.email) {
        const studentEmail = this.emailTemplatesService.generateStudentResultEmail(notificationData);
        emails.push({
          to: student.email,
          subject: `Exam Results Published: ${exam.examName}`,
          html: studentEmail,
        });
      }

      // 2. Send email to parent (if parent email exists)
      if (student.parentEmail) {
        const parentEmail = this.emailTemplatesService.generateParentResultEmail(notificationData, student.name);
        emails.push({
          to: student.parentEmail,
          subject: `Your Child's Exam Results: ${exam.examName}`,
          html: parentEmail,
        });
      }

      // 3. Send email to class teachers (if user accounts exist and are teachers)
      // Find users linked to this class as teachers
      const classTeachers = await this.userRepository.find({
        where: { role: UserRole.TEACHER },
        relations: ['teacher'],
      });

      // Get class statistics for teacher notification
      const classResults = await this.resultRepository.find({
        where: { examId: exam.examId, classId: result.classId, status: 'Published' },
      });

      // Send to all teachers (you can refine this based on teacher-class assignments)
      for (const teacherUser of classTeachers) {
        if (teacherUser.email) {
          const teacherEmail = this.emailTemplatesService.generateTeacherClassResultEmail(
            exam.examName,
            classEntity.className,
            classResults.length, // Total students with published results
            classResults.length,
          );

          emails.push({
            to: teacherUser.email,
            subject: `Class Results Published: ${exam.examName} - ${classEntity.className}`,
            html: teacherEmail,
          });
        }
      }

      // Send all emails
      if (emails.length > 0) {
        await this.emailService.sendBulkEmails(emails);
        console.log(`✅ Sent ${emails.length} result notification emails`);
      }
    } catch (error) {
      console.error('Error in sendResultNotifications:', error);
    }
  }

  async unpublish(resultId: string): Promise<Result> {
    const result = await this.findOne(resultId);
    result.status = 'Draft';
    result.publishedAt = undefined as any;
    return await this.resultRepository.save(result);
  }

  // Calculate ranks for all results of an exam
  async calculateRanks(examId: string): Promise<Result[]> {
    const results = await this.findAll({ examId });
    
    // Sort by percentage descending
    const sortedResults = [...results].sort((a, b) => b.percentage - a.percentage);
    
    // Assign ranks
    let currentRank = 1;
    for (let i = 0; i < sortedResults.length; i++) {
      // Handle ties - same percentage gets same rank
      if (i > 0 && sortedResults[i].percentage === sortedResults[i - 1].percentage) {
        sortedResults[i].rank = sortedResults[i - 1].rank;
      } else {
        sortedResults[i].rank = currentRank;
      }
      currentRank++;
    }

    // Save all results with updated ranks
    await this.resultRepository.save(sortedResults);

    return sortedResults;
  }

  // Calculate result from marks for a student/exam combination
  // Version 2: Supports internal/external marks breakdown
  async calculateFromMarks(
    studentId: string,
    examId: string,
    classId: string,
    useVersion2: boolean = false,
    unitTestMethod: 'average' | 'highest' = 'average',
  ): Promise<Result> {
    // Get exam details to find academic year
    const exam = await this.examRepository.findOne({ where: { examId } });
    if (!exam) {
      throw new NotFoundException(`Exam ${examId} not found`);
    }

    // Get all marks for this student and exam
    // (don't hard-require marksType since older DB rows may have NULL/defaults)
    const marks = await this.markRepository.find({
      where: { studentId, examId },
      relations: ['subject'],
    });

    if (marks.length === 0) {
      throw new NotFoundException(`No marks found for student ${studentId} in exam ${examId}`);
    }

    let totalMarksObtained = 0;
    let totalMaxMarks = 0;
    const subjects: any[] = [];

    if (useVersion2) {
      // Version 2: Calculate with internal/external breakdown
      for (const mark of marks) {
        try {
          const finalMarks = await this.marksService.calculateFinalMarks(
            studentId,
            examId,
            mark.subjectId,
            exam.academicYear,
            unitTestMethod,
          );

          const subjectTotal = finalMarks.totalMarks;
          const maxMarks = Number(mark.totalMarks || 100);
          totalMarksObtained += subjectTotal;
          totalMaxMarks += maxMarks;

          subjects.push({
            subjectId: mark.subjectId,
            subjectName: mark.subject?.subjectName || 'Unknown',
            maxMarks,
            marksObtained: subjectTotal,
            internalMarks: finalMarks.internalMarks,
            externalMarks: finalMarks.externalMarks,
            breakdown: finalMarks.breakdown,
            grade: calculateGrade(maxMarks > 0 ? (subjectTotal / maxMarks) * 100 : 0),
            isPassed: subjectTotal >= (maxMarks * 0.4),
          });
        } catch (error) {
          // Fallback to version 1 if calculation fails
          const subjectTotal = Number(mark.marksObtained);
          totalMarksObtained += subjectTotal;
          totalMaxMarks += Number(mark.totalMarks);

          subjects.push({
            subjectId: mark.subjectId,
            subjectName: mark.subject?.subjectName || 'Unknown',
            maxMarks: Number(mark.totalMarks),
            marksObtained: subjectTotal,
            grade: mark.grade || calculateGrade((subjectTotal / Number(mark.totalMarks)) * 100),
            isPassed: subjectTotal >= (Number(mark.totalMarks) * 0.4),
          });
        }
      }
    } else {
      // Version 1: Original calculation (backward compatible)
      totalMarksObtained = marks.reduce((sum, m) => sum + Number(m.marksObtained), 0);
      totalMaxMarks = marks.reduce((sum, m) => sum + Number(m.totalMarks), 0);

      subjects.push(...marks.map(m => ({
        subjectId: m.subjectId,
        subjectName: m.subject?.subjectName || 'Unknown',
        maxMarks: Number(m.totalMarks),
        marksObtained: Number(m.marksObtained),
        grade: m.grade || calculateGrade((Number(m.marksObtained) / Number(m.totalMarks)) * 100),
        isPassed: Number(m.marksObtained) >= (Number(m.totalMarks) * 0.4),
      })));
    }

    const percentage = (totalMarksObtained / totalMaxMarks) * 100;
    const grade = calculateGrade(percentage);
    const isPassed = percentage >= 40;

    // Check if result already exists
    const existingResult = await this.resultRepository.findOne({
      where: { studentId, examId },
    });

    if (existingResult) {
      // Update existing result
      Object.assign(existingResult, {
        totalMarksObtained,
        totalMaxMarks,
        percentage,
        grade,
        isPassed,
        subjects,
      });
      return await this.resultRepository.save(existingResult);
    }

    // Create new result
    const resultId = `RES-${Date.now().toString(36).toUpperCase()}`;
    const result = this.resultRepository.create({
      resultId,
      studentId,
      examId,
      classId,
      totalMarksObtained,
      totalMaxMarks,
      percentage,
      grade,
      isPassed,
      subjects,
      status: 'Draft',
    });

    return await this.resultRepository.save(result);
  }

  // Generate report card data for a student/exam combination
  // Helper method to build subjects with breakdown from marks
  private async buildSubjectsFromMarks(
    marks: any[],
    examId: string,
    unitTestMethod: 'average' | 'highest' = 'average',
  ): Promise<any[]> {
    const subjects: any[] = [];
    const exam = await this.examRepository.findOne({ where: { examId } });
    
    for (const mark of marks) {
      try {
        // Check if mark has V2 values (avoid treating default 0 columns as V2 data)
        const hasV2Values =
          Number(mark.internalMarks || 0) > 0 ||
          Number(mark.externalMarks || 0) > 0 ||
          Number(mark.unitTestMarks || 0) > 0 ||
          Number(mark.assignmentMarks || 0) > 0 ||
          Number(mark.attendanceMarks || 0) > 0;

        if (hasV2Values) {
          // Mark has V2 fields - use them directly
          const unitTest = Number(mark.unitTestMarks || 0);
          const assignment = Number(mark.assignmentMarks || 0);
          const attendance = Number(mark.attendanceMarks || 0);
          const external = Number(mark.externalMarks || 0);
          const internalFromDb = Number(mark.internalMarks || 0);
          const internal = internalFromDb > 0 ? internalFromDb : (unitTest + assignment + attendance);
          const total = internal + external;
          
          subjects.push({
            subjectId: mark.subjectId,
            subjectName: mark.subject?.subjectName || 'Unknown',
            subjectCode: mark.subject?.subjectCode || '-',
            marksObtained: total,
            totalMarks: Number(mark.totalMarks || 100),
            internalMarks: internal,
            externalMarks: external,
            breakdown: {
              unitTest: unitTest,
              assignment: assignment,
              attendance: attendance,
              external: external,
            },
            percentage: (Number(mark.totalMarks || 100) > 0 ? ((total / Number(mark.totalMarks || 100)) * 100) : 0).toFixed(2),
            grade: calculateGrade(Number(mark.totalMarks || 100) > 0 ? ((total / Number(mark.totalMarks || 100)) * 100) : 0),
            isPassed: total >= (Number(mark.totalMarks || 100) * 0.4),
            remarks: mark.remarks || '',
          });
        } else {
          // No V2 fields - try to calculate from marksService
          if (exam && (exam.examType === 'Final' || exam.examType === 'Mid-Term')) {
            try {
              const finalMarks = await this.marksService.calculateFinalMarks(
                mark.studentId,
                examId,
                mark.subjectId,
                exam.academicYear,
                unitTestMethod,
              );
              
              const subjectTotal = finalMarks.totalMarks;
              subjects.push({
                subjectId: mark.subjectId,
                subjectName: mark.subject?.subjectName || 'Unknown',
                subjectCode: mark.subject?.subjectCode || '-',
                marksObtained: subjectTotal,
                totalMarks: 100,
                internalMarks: finalMarks.internalMarks,
                externalMarks: finalMarks.externalMarks,
                breakdown: finalMarks.breakdown,
                percentage: subjectTotal.toFixed(2),
                grade: calculateGrade(subjectTotal),
                isPassed: subjectTotal >= 40,
                remarks: mark.remarks || '',
              });
            } catch (calcError) {
              // Fallback to simple marks
              subjects.push({
                subjectId: mark.subjectId,
                subjectName: mark.subject?.subjectName || 'Unknown',
                subjectCode: mark.subject?.subjectCode || '-',
                marksObtained: Number(mark.marksObtained),
                totalMarks: Number(mark.totalMarks),
                percentage: ((Number(mark.marksObtained) / Number(mark.totalMarks)) * 100).toFixed(2),
                grade: mark.grade || calculateGrade((Number(mark.marksObtained) / Number(mark.totalMarks)) * 100),
                isPassed: Number(mark.marksObtained) >= (Number(mark.totalMarks) * 0.4),
                remarks: mark.remarks || '',
              });
            }
          } else {
            // Not a Final exam - use simple marks
            subjects.push({
              subjectId: mark.subjectId,
              subjectName: mark.subject?.subjectName || 'Unknown',
              subjectCode: mark.subject?.subjectCode || '-',
              marksObtained: Number(mark.marksObtained),
              totalMarks: Number(mark.totalMarks),
              percentage: ((Number(mark.marksObtained) / Number(mark.totalMarks)) * 100).toFixed(2),
              grade: mark.grade || calculateGrade((Number(mark.marksObtained) / Number(mark.totalMarks)) * 100),
              isPassed: Number(mark.marksObtained) >= (Number(mark.totalMarks) * 0.4),
              remarks: mark.remarks || '',
            });
          }
        }
      } catch (error) {
        console.error(`Error processing mark for subject ${mark.subjectId}:`, error);
        // Fallback to simple mark
        subjects.push({
          subjectId: mark.subjectId,
          subjectName: mark.subject?.subjectName || 'Unknown',
          subjectCode: mark.subject?.subjectCode || '-',
          marksObtained: Number(mark.marksObtained),
          totalMarks: Number(mark.totalMarks),
          percentage: ((Number(mark.marksObtained) / Number(mark.totalMarks)) * 100).toFixed(2),
          grade: mark.grade || calculateGrade((Number(mark.marksObtained) / Number(mark.totalMarks)) * 100),
          isPassed: Number(mark.marksObtained) >= (Number(mark.totalMarks) * 0.4),
          remarks: mark.remarks || '',
        });
      }
    }
    
    return subjects;
  }

  // Version 2: Supports internal/external marks breakdown
  async getReportCard(
    studentId: string,
    examId: string,
    version: 'v1' | 'v2' = 'v1',
    unitTestMethod: 'average' | 'highest' = 'average',
  ): Promise<any> {
    // Get the result with relations
    const result = await this.resultRepository.findOne({
      where: { studentId, examId },
      relations: ['student', 'student.class', 'student.section', 'exam', 'class'],
    });

    if (!result) {
      throw new NotFoundException(`No result found for student ${studentId} in exam ${examId}`);
    }

    // Get marks with subject details and V2 fields
    const marks = await this.markRepository
      .createQueryBuilder('mark')
      .addSelect('mark.internalMarks')
      .addSelect('mark.externalMarks')
      .addSelect('mark.unitTestMarks')
      .addSelect('mark.assignmentMarks')
      .addSelect('mark.attendanceMarks')
      .addSelect('mark.marksType')
      .leftJoinAndSelect('mark.subject', 'subject')
      .where('mark.studentId = :studentId', { studentId })
      .andWhere('mark.examId = :examId', { examId })
      .getMany();

    let subjects: any[] = [];

    if (version === 'v2') {
      // Version 2: Try to get breakdown from result first, otherwise calculate from marks
      if (result.subjects && Array.isArray(result.subjects) && result.subjects.length > 0) {
        // Check if breakdown exists in result
        const hasBreakdown = result.subjects.some((subj: any) => subj.breakdown);
        
        if (hasBreakdown) {
          // Use breakdown from result if available
          subjects = result.subjects.map((subj: any) => ({
            subjectId: subj.subjectId,
            subjectName: subj.subjectName || 'Unknown',
            subjectCode: subj.subjectCode || '-',
            marksObtained: Number(subj.marksObtained),
            totalMarks: Number(subj.maxMarks || 100),
            internalMarks: subj.internalMarks ? Number(subj.internalMarks) : undefined,
            externalMarks: subj.externalMarks ? Number(subj.externalMarks) : undefined,
            breakdown: subj.breakdown || undefined,
            percentage: ((Number(subj.marksObtained) / Number(subj.maxMarks || 100)) * 100).toFixed(2),
            grade: subj.grade || calculateGrade((Number(subj.marksObtained) / Number(subj.maxMarks || 100)) * 100),
            isPassed: subj.isPassed !== undefined ? subj.isPassed : Number(subj.marksObtained) >= (Number(subj.maxMarks || 100) * 0.4),
            remarks: subj.remarks || '',
          }));
        } else {
          // Result exists but no breakdown - calculate from marks
          subjects = await this.buildSubjectsFromMarks(marks, examId, unitTestMethod);
        }
      } else {
        // No result subjects - calculate from marks directly
        subjects = await this.buildSubjectsFromMarks(marks, examId, unitTestMethod);
      }
    } else {
      // Version 1: Original format (backward compatible)
      subjects = marks.map(m => ({
        subjectId: m.subjectId,
        subjectName: m.subject?.subjectName || 'Unknown',
        subjectCode: m.subject?.subjectCode || '-',
        marksObtained: Number(m.marksObtained),
        totalMarks: Number(m.totalMarks),
        percentage: ((Number(m.marksObtained) / Number(m.totalMarks)) * 100).toFixed(2),
        grade: m.grade || calculateGrade((Number(m.marksObtained) / Number(m.totalMarks)) * 100),
        isPassed: Number(m.marksObtained) >= (Number(m.totalMarks) * 0.4),
        remarks: m.remarks || '',
      }));
    }

    // Build report card structure
    const reportCard = {
      version: version,
      student: {
        studentId: result.student?.studentId,
        name: result.student?.name || 'Unknown',
        rollNo: result.student?.rollNo || '-',
        classId: result.student?.classId || result.classId,
        className: result.student?.class?.className || result.class?.className || 'Unknown',
        sectionId: result.student?.sectionId,
        sectionName: result.student?.section?.sectionName || '-',
        dateOfBirth: result.student?.dateOfBirth,
        gender: result.student?.gender,
        email: result.student?.email,
        phone: result.student?.phone,
      },
      exam: {
        examId: result.exam?.examId,
        examName: result.exam?.examName || 'Unknown',
        examType: result.exam?.examType,
        academicYearId: result.exam?.academicYear,
        startDate: result.exam?.startDate,
        endDate: result.exam?.endDate,
        totalMarks: result.exam?.totalMarks,
        passingMarks: result.exam?.passingMarks,
      },
      subjects,
      result: {
        resultId: result.resultId,
        totalMarksObtained: Number(result.totalMarksObtained),
        totalMaxMarks: Number(result.totalMaxMarks),
        percentage: Number(result.percentage),
        grade: result.grade,
        rank: result.rank || '-',
        status: result.status,
        isPassed: result.isPassed,
        publishedAt: result.publishedAt,
      },
      remarks: {
        teacher: result.remarks || '',
        custom: '',
      },
      generatedAt: new Date().toISOString(),
      issueDate: new Date().toISOString().split('T')[0],
    };

    return reportCard;
  }

  // Get list of available report cards (results that can be viewed as report cards)
  async getReportCardsList(filters?: {
    examId?: string;
    classId?: string;
    studentId?: string;
  }): Promise<any[]> {
    const results = await this.findAll(filters);

    return results.map(r => ({
      resultId: r.resultId,
      studentId: r.studentId,
      studentName: r.student?.name || 'Unknown',
      rollNo: r.student?.rollNo || '-',
      examId: r.examId,
      examName: r.exam?.examName || 'Unknown',
      classId: r.classId,
      className: r.class?.className || 'Unknown',
      percentage: Number(r.percentage),
      grade: r.grade,
      rank: r.rank || '-',
      status: r.status,
      isPassed: r.isPassed,
      publishedAt: r.publishedAt,
    }));
  }
}
