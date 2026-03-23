// Utility functions for calculations

import { GradeRule, Marks, Subject, StudentResult, SubjectResult } from '../types';
import { gradeRules, subjects } from '../data/mockData';

export function calculateGrade(percentage: number, rules: GradeRule[] = gradeRules): string {
  for (const rule of rules) {
    if (percentage >= rule.min) {
      return rule.grade;
    }
  }
  return 'F';
}

export function getGradeColor(grade: string): string {
  const rule = gradeRules.find((r) => r.grade === grade);
  return rule?.color || '#6b7280';
}

export function calculateStudentResult(
  studentId: string,
  examId: string,
  studentMarks: Marks[]
): StudentResult {
  const examMarks = studentMarks.filter(
    (m) => m.studentId === studentId && m.examId === examId && !m.isAbsent
  );

  const subjectResults: SubjectResult[] = examMarks.map((mark) => {
    const subject = subjects.find((s) => s.id === mark.subjectId);
    const percentage = (mark.marksObtained / (subject?.maxMarks || 100)) * 100;
    const grade = calculateGrade(percentage);
    const isPassed = mark.marksObtained >= (subject?.passMarks || 35);

    return {
      subjectId: mark.subjectId,
      subjectName: subject?.name || '',
      marksObtained: mark.marksObtained,
      maxMarks: subject?.maxMarks || 100,
      grade,
      isPassed,
    };
  });

  const totalMarks = subjectResults.reduce((sum, s) => sum + s.marksObtained, 0);
  const maxMarks = subjectResults.reduce((sum, s) => sum + s.maxMarks, 0);
  const percentage = maxMarks > 0 ? (totalMarks / maxMarks) * 100 : 0;
  const grade = calculateGrade(percentage);
  const isPassed = subjectResults.every((s) => s.isPassed);

  return {
    studentId,
    examId,
    totalMarks,
    maxMarks,
    percentage,
    grade,
    rank: 0, // Will be calculated separately
    subjects: subjectResults,
    isPassed,
  };
}

export function calculateRanks(results: StudentResult[]): StudentResult[] {
  const sorted = [...results].sort((a, b) => b.percentage - a.percentage);
  return sorted.map((result, index) => ({
    ...result,
    rank: index + 1,
  }));
}

export function getPerformanceTrend(studentMarks: Marks[], studentId: string): number[] {
  // Return last 6 exam averages for trend
  const examIds = Array.from(new Set(studentMarks.map((m) => m.examId)));
  return examIds.slice(-6).map((examId) => {
    const marks = studentMarks.filter((m) => m.studentId === studentId && m.examId === examId);
    const total = marks.reduce((sum, m) => sum + m.marksObtained, 0);
    return marks.length > 0 ? total / marks.length : 0;
  });
}
