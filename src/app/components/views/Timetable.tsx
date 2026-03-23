import React, { useState } from 'react';
import { Calendar, Clock, BookOpen, MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { exams, examSubjects, subjects, classes } from '../../data/mockData';
import { Badge } from '../ui/badge';

export function Timetable() {
  const [selectedExam, setSelectedExam] = useState(exams[0].examId);
  const [selectedClass, setSelectedClass] = useState('10');

  const examDetails = exams.find((e) => e.examId === selectedExam);
  const timetable = examSubjects.filter(
    (es) => es.examId === selectedExam && es.classId === selectedClass
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Exam Timetable</h1>
          <p className="text-gray-500 mt-1">View examination schedule</p>
        </div>
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

      {/* Exam Info */}
      {examDetails && (
        <Card className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold">{examDetails.name}</h3>
                <p className="text-blue-100 mt-2">
                  Academic Year: {examDetails.academicYear}
                </p>
              </div>
              <div className="text-right">
                <p className="text-blue-100 text-sm">Weightage</p>
                <p className="text-3xl font-bold">{examDetails.weightage}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Timetable */}
      <Card>
        <CardHeader>
          <CardTitle>Examination Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          {timetable.length > 0 ? (
            <div className="space-y-4">
              {timetable.map((schedule) => {
                const subject = subjects.find((s) => s.id === schedule.subjectId);
                const date = new Date(schedule.examDate);

                return (
                  <div
                    key={`${schedule.examId}-${schedule.subjectId}`}
                    className="flex items-center justify-between p-6 border-2 border-gray-200 rounded-lg hover:border-blue-500 transition-colors"
                  >
                    <div className="flex items-center gap-6">
                      {/* Date */}
                      <div className="text-center p-4 bg-blue-50 rounded-lg min-w-[100px]">
                        <p className="text-sm text-blue-600 font-medium">
                          {date.toLocaleDateString('en-US', { weekday: 'short' })}
                        </p>
                        <p className="text-3xl font-bold text-blue-600 my-1">
                          {date.getDate()}
                        </p>
                        <p className="text-sm text-blue-600">
                          {date.toLocaleDateString('en-US', { month: 'short' })}
                        </p>
                      </div>

                      {/* Subject Details */}
                      <div className="flex-1">
                        <h4 className="text-xl font-bold text-gray-900">
                          {subject?.name}
                        </h4>
                        <div className="flex items-center gap-4 mt-3 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            <span>
                              {schedule.startTime} - {schedule.endTime}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <BookOpen className="w-4 h-4" />
                            <span>Code: {subject?.code}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Marks Info */}
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Max Marks</p>
                      <p className="text-2xl font-bold text-gray-900">{subject?.maxMarks}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Pass: {subject?.passMarks}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No timetable available for selected exam and class</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Important Instructions */}
      <Card className="bg-yellow-50 border-yellow-200">
        <CardHeader>
          <CardTitle className="text-yellow-900">Important Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-yellow-900">
            <li className="flex items-start gap-2">
              <span className="font-bold">•</span>
              <span>Students must report 30 minutes before the exam start time</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold">•</span>
              <span>Bring your admit card and ID card to the examination hall</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold">•</span>
              <span>Electronic devices are strictly prohibited in the exam hall</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold">•</span>
              <span>Use of unfair means will result in cancellation of exam</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
