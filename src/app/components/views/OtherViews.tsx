import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Plus, Settings as SettingsIcon, Users, BookOpen, UserCog, BookMarked } from 'lucide-react';
import { classes, sections, subjects, academicYears } from '../../data/mockData';
import { Badge } from '../ui/badge';
import { DiagnosticPanel } from '../DiagnosticPanel';
import { DataPopulator } from '../DataPopulator';

export function Teachers() {
  const teachers = [
    { id: 'T001', name: 'Prof. Meena Sharma', subject: 'Mathematics', experience: '15 years' },
    { id: 'T002', name: 'Dr. Rajesh Kumar', subject: 'Physics', experience: '12 years' },
    { id: 'T003', name: 'Mrs. Anjali Patel', subject: 'English', experience: '10 years' },
    { id: 'T004', name: 'Mr. Vikram Singh', subject: 'Chemistry', experience: '8 years' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Teachers Management</h1>
          <p className="text-gray-500 mt-1">Manage teacher records and assignments</p>
        </div>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Add Teacher
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teachers.map((teacher) => (
          <Card key={teacher.id}>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white text-2xl font-semibold">
                    {teacher.name.charAt(0)}
                  </span>
                </div>
                <h3 className="font-bold text-lg text-gray-900">{teacher.name}</h3>
                <p className="text-sm text-gray-600 mt-1">{teacher.subject}</p>
                <p className="text-xs text-gray-500 mt-2">{teacher.experience} Experience</p>
                <Badge className="mt-3">{teacher.id}</Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function Classes() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Classes & Sections</h1>
          <p className="text-gray-500 mt-1">Manage class and section configuration</p>
        </div>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Add Class/Section
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {classes.slice(7).map((cls) => {
          const classSections = sections.filter((s) => s.classId === cls.id);

          return (
            <Card key={cls.id}>
              <CardHeader>
                <CardTitle>{cls.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Sections:</p>
                    <div className="flex flex-wrap gap-2">
                      {classSections.length > 0 ? (
                        classSections.map((section) => (
                          <Badge key={section.id} variant="secondary">
                            Section {section.name}
                          </Badge>
                        ))
                      ) : (
                        <p className="text-sm text-gray-400">No sections configured</p>
                      )}
                    </div>
                  </div>
                  <div className="pt-3 border-t border-gray-200">
                    <p className="text-sm text-gray-600">
                      Students: {Math.floor(Math.random() * 100) + 50}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

export function Subjects() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Subjects Management</h1>
          <p className="text-gray-500 mt-1">Configure subjects and grading rules</p>
        </div>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Add Subject
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {subjects.map((subject) => (
          <Card key={subject.id}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-gray-900">{subject.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">Code: {subject.code}</p>
                </div>
                <div className="bg-blue-100 p-2 rounded-lg">
                  <BookOpen className="w-5 h-5 text-blue-600" />
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Max Marks:</span>
                  <span className="font-medium text-gray-900">{subject.maxMarks}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Pass Marks:</span>
                  <span className="font-medium text-gray-900">{subject.passMarks}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function AcademicYear() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Academic Year Management</h1>
          <p className="text-gray-500 mt-1">Manage academic year settings</p>
        </div>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Add Academic Year
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {academicYears.map((year) => (
          <Card key={year.id} className={year.isActive ? 'border-2 border-blue-500' : ''}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">{year.id}</h3>
                  {year.isActive && (
                    <Badge className="mt-2" variant="default">
                      Active
                    </Badge>
                  )}
                </div>
                <BookMarked className="w-8 h-8 text-gray-400" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Start Date:</span>
                  <span className="font-medium text-gray-900">
                    {new Date(year.startDate).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">End Date:</span>
                  <span className="font-medium text-gray-900">
                    {new Date(year.endDate).toLocaleDateString()}
                  </span>
                </div>
              </div>
              {year.isActive && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-xs text-blue-700">
                    This is the current active academic year
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function Settings() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
        <p className="text-gray-500 mt-1">Configure system preferences and settings</p>
      </div>

      {/* Data Populator - IMPORTANT: Populate database after table fix */}
      <DataPopulator />

      {/* Diagnostic Panel */}
      <DiagnosticPanel />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>School Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                School Name
              </label>
              <input
                type="text"
                defaultValue="St. Joseph's High School"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                School Code
              </label>
              <input
                type="text"
                defaultValue="SJHS-2025"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <Button>Update Information</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Grading System</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Grading Type
              </label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                <option>Percentage Based</option>
                <option>Points Based</option>
                <option>Custom</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pass Percentage
              </label>
              <input
                type="number"
                defaultValue="35"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <Button>Save Settings</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notification Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Email Notifications</span>
              <input type="checkbox" defaultChecked className="w-4 h-4" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">SMS Notifications</span>
              <input type="checkbox" defaultChecked className="w-4 h-4" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Result Notifications</span>
              <input type="checkbox" defaultChecked className="w-4 h-4" />
            </div>
            <Button>Update Preferences</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Backup & Security</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 mb-3">
                Last Backup: January 10, 2026
              </p>
              <Button variant="outline" className="w-full">
                Create Backup
              </Button>
            </div>
            <div className="pt-4 border-t border-gray-200">
              <Button variant="outline" className="w-full">
                Export Database
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}