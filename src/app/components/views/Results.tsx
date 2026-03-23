import React, { useState } from 'react';
import { Trophy, TrendingUp, Award, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { students, marks, exams, classes } from '../../data/mockData';
import { calculateStudentResult, calculateRanks, getGradeColor } from '../../utils/calculations';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import { Badge } from '../ui/badge';

export function Results() {
  const [selectedExam, setSelectedExam] = useState(exams[0].examId);
  const [selectedClass, setSelectedClass] = useState('10');

  const classStudents = students.filter((s) => s.classId === selectedClass);
  const results = calculateRanks(
    classStudents.map((s) => calculateStudentResult(s.studentId, selectedExam, marks))
  );

  const toppers = results.slice(0, 3);
  const classAverage =
    results.reduce((sum, r) => sum + r.percentage, 0) / results.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Exam Results</h1>
          <p className="text-gray-500 mt-1">View and analyze examination results</p>
        </div>
        <Button className="gap-2">
          <Download className="w-4 h-4" />
          Export Results
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    {exam.name}
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
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Students</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{results.length}</p>
              </div>
              <div className="bg-blue-500 p-3 rounded-lg">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Class Average</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {classAverage.toFixed(1)}%
                </p>
              </div>
              <div className="bg-purple-500 p-3 rounded-lg">
                <Award className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pass Percentage</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {((results.filter((r) => r.isPassed).length / results.length) * 100).toFixed(
                    1
                  )}
                  %
                </p>
              </div>
              <div className="bg-green-500 p-3 rounded-lg">
                <Trophy className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Highest Score</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {results[0]?.percentage.toFixed(1)}%
                </p>
              </div>
              <div className="bg-orange-500 p-3 rounded-lg">
                <Award className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Performers */}
      <Card>
        <CardHeader>
          <CardTitle>🏆 Top Performers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {toppers.map((result, index) => {
              const student = students.find((s) => s.studentId === result.studentId);
              const medals = ['🥇', '🥈', '🥉'];

              return (
                <div
                  key={result.studentId}
                  className={`p-6 rounded-lg border-2 ${
                    index === 0
                      ? 'border-yellow-400 bg-yellow-50'
                      : index === 1
                      ? 'border-gray-400 bg-gray-50'
                      : 'border-orange-400 bg-orange-50'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-4xl mb-2">{medals[index]}</div>
                    <h4 className="font-bold text-lg text-gray-900">{student?.name}</h4>
                    <p className="text-sm text-gray-600 mt-1">Rank {result.rank}</p>
                    <div className="mt-4">
                      <p className="text-3xl font-bold text-gray-900">
                        {result.percentage.toFixed(1)}%
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        Grade: {result.grade}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* All Results */}
      <Card>
        <CardHeader>
          <CardTitle>Complete Results</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rank</TableHead>
                <TableHead>Student Name</TableHead>
                <TableHead>Roll No</TableHead>
                <TableHead>Total Marks</TableHead>
                <TableHead>Percentage</TableHead>
                <TableHead>Grade</TableHead>
                <TableHead>Result</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.map((result) => {
                const student = students.find((s) => s.studentId === result.studentId);

                return (
                  <TableRow key={result.studentId}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {result.rank <= 3 && (
                          <span className="text-lg">
                            {result.rank === 1 ? '🥇' : result.rank === 2 ? '🥈' : '🥉'}
                          </span>
                        )}
                        <span className="font-medium">{result.rank}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{student?.name}</TableCell>
                    <TableCell>{student?.rollNo}</TableCell>
                    <TableCell>
                      {result.totalMarks} / {result.maxMarks}
                    </TableCell>
                    <TableCell>{result.percentage.toFixed(1)}%</TableCell>
                    <TableCell>
                      <Badge
                        style={{
                          backgroundColor: getGradeColor(result.grade),
                          color: 'white',
                        }}
                      >
                        {result.grade}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={result.isPassed ? 'default' : 'destructive'}>
                        {result.isPassed ? 'PASS' : 'FAIL'}
                      </Badge>
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
