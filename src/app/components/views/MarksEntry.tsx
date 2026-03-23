import React, { useState } from 'react';
import { Save, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { students, exams, subjects, classes } from '../../data/mockData';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';

export function MarksEntry() {
  const [selectedExam, setSelectedExam] = useState(exams[0].examId);
  const [selectedClass, setSelectedClass] = useState('10');
  const [selectedSubject, setSelectedSubject] = useState(subjects[0].id);
  const [marksData, setMarksData] = useState<Record<string, number>>({});

  const filteredStudents = students.filter((s) => s.classId === selectedClass);
  const currentSubject = subjects.find((s) => s.id === selectedSubject);

  const handleMarksChange = (studentId: string, marks: string) => {
    const value = parseInt(marks) || 0;
    setMarksData((prev) => ({
      ...prev,
      [studentId]: value,
    }));
  };

  const handleSave = () => {
    alert('Marks saved successfully!');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Marks Entry</h1>
          <p className="text-gray-500 mt-1">Enter examination marks for students</p>
        </div>
        <Button className="gap-2" onClick={handleSave}>
          <Save className="w-4 h-4" />
          Save Marks
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select Exam Parameters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Exam
              </label>
              <select
                value={selectedExam}
                onChange={(e) => setSelectedExam(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {exams.map((exam) => (
                  <option key={exam.examId} value={exam.examId}>
                    {exam.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Class
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
                Subject
              </label>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {currentSubject && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Max Marks:</span>
                  <span className="ml-2 font-medium text-gray-900">
                    {currentSubject.maxMarks}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Pass Marks:</span>
                  <span className="ml-2 font-medium text-gray-900">
                    {currentSubject.passMarks}
                  </span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Enter Marks ({filteredStudents.length} Students)</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Roll No</TableHead>
                <TableHead>Student Name</TableHead>
                <TableHead>Student ID</TableHead>
                <TableHead>Marks Obtained</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStudents.map((student) => {
                const marks = marksData[student.studentId] || 0;
                const isPassed = marks >= (currentSubject?.passMarks || 35);

                return (
                  <TableRow key={student.studentId}>
                    <TableCell>{student.rollNo}</TableCell>
                    <TableCell className="font-medium">{student.name}</TableCell>
                    <TableCell>{student.studentId}</TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min="0"
                        max={currentSubject?.maxMarks || 100}
                        value={marksData[student.studentId] || ''}
                        onChange={(e) =>
                          handleMarksChange(student.studentId, e.target.value)
                        }
                        placeholder="0"
                        className="w-24"
                      />
                    </TableCell>
                    <TableCell>
                      {marks > 0 && (
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            isPassed
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {isPassed ? 'Pass' : 'Fail'}
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
