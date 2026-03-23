import React, { useState } from 'react';
import { Download, Printer, Send } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { students, marks, exams, classes } from '../../data/mockData';
import { calculateStudentResult, calculateRanks, getGradeColor } from '../../utils/calculations';
import { Badge } from '../ui/badge';

export function ReportCards() {
  const [selectedExam, setSelectedExam] = useState(exams[0].examId);
  const [selectedClass, setSelectedClass] = useState('10');
  const [selectedStudent, setSelectedStudent] = useState(students[0].studentId);

  const classStudents = students.filter((s) => s.classId === selectedClass);
  const results = calculateRanks(
    classStudents.map((s) => calculateStudentResult(s.studentId, selectedExam, marks))
  );
  const studentResult = results.find((r) => r.studentId === selectedStudent);
  const student = students.find((s) => s.studentId === selectedStudent);
  const exam = exams.find((e) => e.examId === selectedExam);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Report Cards</h1>
          <p className="text-gray-500 mt-1">Generate and download student report cards</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Send className="w-4 h-4" />
            Email
          </Button>
          <Button variant="outline" className="gap-2">
            <Printer className="w-4 h-4" />
            Print
          </Button>
          <Button className="gap-2">
            <Download className="w-4 h-4" />
            Download PDF
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Exam
              </label>
              <select
                value={selectedExam}
                onChange={(e) => setSelectedExam(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {exams.map((exam) => (
                  <option key={exam.examId} value={exam.examId}>
                    {exam.examName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Class
              </label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Student
              </label>
              <select
                value={selectedStudent}
                onChange={(e) => setSelectedStudent(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {classStudents.map((student) => (
                  <option key={student.studentId} value={student.studentId}>
                    {student.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Card */}
      {studentResult && student && (
        <Card className="max-w-4xl mx-auto">
          <CardContent className="p-8">
            {/* Header */}
            <div className="text-center border-b-2 border-gray-300 pb-6 mb-6">
              <h2 className="text-3xl font-bold text-gray-900">
                St. Joseph's High School
              </h2>
              <p className="text-gray-600 mt-2">Academic Excellence Since 1985</p>
              <h3 className="text-xl font-semibold text-blue-600 mt-4">
                STUDENT REPORT CARD
              </h3>
            </div>

            {/* Student Info */}
            <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-600">Student Name</p>
                <p className="font-semibold text-gray-900">{student.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Student ID</p>
                <p className="font-semibold text-gray-900">{student.studentId}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Class / Section</p>
                <p className="font-semibold text-gray-900">
                  {student.classId} / {(student.sectionId ?? '').split('-')[1] || '-'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Roll Number</p>
                <p className="font-semibold text-gray-900">{student.rollNo}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Date of Birth</p>
                <p className="font-semibold text-gray-900">{student.dateOfBirth || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Father's Name</p>
                <p className="font-semibold text-gray-900">{student.fatherName || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Mother's Name</p>
                <p className="font-semibold text-gray-900">{student.motherName || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Examination</p>
                <p className="font-semibold text-gray-900">{exam?.examName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Academic Year</p>
                <p className="font-semibold text-gray-900">{exam?.academicYear}</p>
              </div>
            </div>

            {/* Marks Table */}
            <div className="mb-6">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 px-4 py-3 text-left">Subject</th>
                    <th className="border border-gray-300 px-4 py-3 text-center">
                      Max Marks
                    </th>
                    <th className="border border-gray-300 px-4 py-3 text-center">
                      Marks Obtained
                    </th>
                    <th className="border border-gray-300 px-4 py-3 text-center">Grade</th>
                    <th className="border border-gray-300 px-4 py-3 text-center">Result</th>
                  </tr>
                </thead>
                <tbody>
                  {studentResult.subjects.map((subject) => (
                    <tr key={subject.subjectId}>
                      <td className="border border-gray-300 px-4 py-3 font-medium">
                        {subject.subjectName}
                      </td>
                      <td className="border border-gray-300 px-4 py-3 text-center">
                        {subject.maxMarks}
                      </td>
                      <td className="border border-gray-300 px-4 py-3 text-center font-medium">
                        {subject.marksObtained}
                      </td>
                      <td className="border border-gray-300 px-4 py-3 text-center">
                        <span
                          className="px-3 py-1 rounded-full font-medium text-white text-sm"
                          style={{ backgroundColor: getGradeColor(subject.grade) }}
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
                  ))}
                  <tr className="bg-gray-100 font-bold">
                    <td className="border border-gray-300 px-4 py-3">TOTAL</td>
                    <td className="border border-gray-300 px-4 py-3 text-center">
                      {studentResult.maxMarks}
                    </td>
                    <td className="border border-gray-300 px-4 py-3 text-center">
                      {studentResult.totalMarks}
                    </td>
                    <td className="border border-gray-300 px-4 py-3 text-center">-</td>
                    <td className="border border-gray-300 px-4 py-3 text-center">-</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="p-4 bg-blue-50 rounded-lg text-center">
                <p className="text-sm text-gray-600">Percentage</p>
                <p className="text-2xl font-bold text-blue-600">
                  {studentResult.percentage.toFixed(1)}%
                </p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg text-center">
                <p className="text-sm text-gray-600">Overall Grade</p>
                <p className="text-2xl font-bold text-purple-600">{studentResult.grade}</p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg text-center">
                <p className="text-sm text-gray-600">Class Rank</p>
                <p className="text-2xl font-bold text-green-600">{studentResult.rank}</p>
              </div>
              <div className="p-4 bg-orange-50 rounded-lg text-center">
                <p className="text-sm text-gray-600">Result</p>
                <p className="text-2xl font-bold text-orange-600">
                  {studentResult.isPassed ? 'PASS' : 'FAIL'}
                </p>
              </div>
            </div>

            {/* Remarks */}
            <div className="p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded">
              <p className="font-semibold text-gray-900 mb-2">Teacher's Remarks:</p>
              <p className="text-gray-700">
                {studentResult.percentage >= 90
                  ? 'Outstanding performance! Keep up the excellent work.'
                  : studentResult.percentage >= 75
                  ? 'Very good performance. Well done!'
                  : studentResult.percentage >= 60
                  ? 'Good effort. Focus on improvement in weaker areas.'
                  : 'Needs improvement. Please work harder and seek help when needed.'}
              </p>
            </div>

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
              <p>Issued on: {new Date().toLocaleDateString()}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
