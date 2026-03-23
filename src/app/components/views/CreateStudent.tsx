import React, { useState } from 'react';
import { ArrowLeft, Save, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { studentsService } from '../../services/students.service';
import { classesService } from '../../services/classes.service';
import { sectionsService } from '../../services/sections.service';
import { toast } from 'sonner';
import type { Student } from '../../types';

interface CreateStudentProps {
  onBack: () => void;
  onSuccess: () => void;
}

export function CreateStudent({ onBack, onSuccess }: CreateStudentProps) {
  const [formData, setFormData] = useState({
    studentId: '',
    name: '',
    classId: '10',
    sectionId: '10-A',
    rollNo: 1,
    parentContact: '',
    parentEmail: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [classOptions, setClassOptions] = useState<Array<{ classId: string; name: string }>>([]);
  const [sectionOptions, setSectionOptions] = useState<Array<{ sectionId: string; name: string; classId: string }>>([]);

  const loadClasses = async () => {
    try {
      const classes = await classesService.getForDropdown();
      setClassOptions(classes);
    } catch (err) {
      console.error('Failed to load classes:', err);
    }
  };

  const loadSections = async (classId: string) => {
    try {
      const sections = await sectionsService.getForDropdown(classId);
      setSectionOptions(sections);
      return sections;
    } catch (err) {
      console.error('Failed to load sections:', err);
      setSectionOptions([]);
      return [];
    }
  };

  React.useEffect(() => {
    const init = async () => {
      await loadClasses();
      await loadSections(formData.classId);
    };
    init();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      await studentsService.create(formData as Omit<Student, 'createdAt' | 'updatedAt'>);
      toast.success('Student created successfully!');
      onSuccess();
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message || 'Failed to create student');
    } finally {
      setSaving(false);
    }
  };

  const handleClassChange = async (classId: string) => {
    // Update classId immediately (synchronously)
    setFormData((prev) => ({
      ...prev,
      classId,
      sectionId: '', // Clear section first
    }));
    
    // Then load sections asynchronously
    const sections = await loadSections(classId);
    setFormData((prev) => ({
      ...prev,
      sectionId: sections[0]?.sectionId || '',
    }));
  };

  // Generate sample data
  const fillSampleData = async () => {
    // Sample first names and last names
    const firstNames = [
      'Rahul', 'Priya', 'Amit', 'Sneha', 'Arjun', 'Kavya', 'Vikram', 'Divya',
      'Rohan', 'Anjali', 'Karan', 'Isha', 'Aditya', 'Meera', 'Siddharth', 'Neha',
      'Raj', 'Pooja', 'Suresh', 'Kiran', 'Nikhil', 'Swati', 'Manish', 'Deepika',
      'Aryan', 'Shreya', 'Harsh', 'Tanvi', 'Yash', 'Riya', 'Akash', 'Sakshi'
    ];
    const lastNames = [
      'Sharma', 'Patel', 'Kumar', 'Reddy', 'Singh', 'Verma', 'Gupta', 'Rao',
      'Mehta', 'Joshi', 'Desai', 'Iyer', 'Shah', 'Nair', 'Roy', 'Malhotra',
      'Chopra', 'Agarwal', 'Kapoor', 'Bansal', 'Goyal', 'Saxena', 'Tiwari', 'Mishra'
    ];

    // Generate unique student ID
    let studentId = '';
    try {
      const students = await studentsService.getAll({});
      const existingIds = students.map(s => s.studentId);
      let maxNum = 0;
      existingIds.forEach(id => {
        const match = id.match(/STU(\d+)/);
        if (match) {
          const num = parseInt(match[1]);
          if (num > maxNum) maxNum = num;
        }
      });
      const newNum = maxNum + 1;
      studentId = `STU${String(newNum).padStart(3, '0')}`;
    } catch (err) {
      // Fallback if API fails
      const randomNum = Math.floor(Math.random() * 999) + 1;
      studentId = `STU${String(randomNum).padStart(3, '0')}`;
    }

    // Generate random name
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const name = `${firstName} ${lastName}`;

    // Get random class and section
    let selectedClass = classOptions[0]?.classId || '10';
    if (classOptions.length > 0) {
      selectedClass = classOptions[Math.floor(Math.random() * classOptions.length)].classId;
    }

    // Load sections for selected class
    const sections = await loadSections(selectedClass);
    const selectedSection = sections.length > 0 
      ? sections[Math.floor(Math.random() * sections.length)].sectionId 
      : '';

    // Get next available roll number for selected class and section
    let rollNo = 1;
    try {
      const students = await studentsService.getAll({ classId: selectedClass, sectionId: selectedSection });
      const rollNumbers = students.map(s => Number(s.rollNo)).filter(n => !isNaN(n));
      if (rollNumbers.length > 0) {
        const maxRollNo = Math.max(...rollNumbers);
        rollNo = maxRollNo + 1;
      }
    } catch (err) {
      rollNo = Math.floor(Math.random() * 50) + 1;
    }

    // Generate random phone number (Indian format)
    const phonePrefixes = ['98765', '98766', '98767', '98768', '98769', '98770', '98771', '98772'];
    const phoneSuffix = String(Math.floor(Math.random() * 100000)).padStart(5, '0');
    const parentContact = `+91-${phonePrefixes[Math.floor(Math.random() * phonePrefixes.length)]}${phoneSuffix}`;

    // Generate random email
    const emailDomains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com'];
    const emailName = `${firstName.toLowerCase()}.${lastName.toLowerCase()}`;
    const emailDomain = emailDomains[Math.floor(Math.random() * emailDomains.length)];
    const parentEmail = `parent.${emailName}@${emailDomain}`;

    // Update form data
    setFormData({
      studentId,
      name,
      classId: selectedClass,
      sectionId: selectedSection,
      rollNo,
      parentContact,
      parentEmail,
    });

    toast.success('Sample data filled! Review and submit when ready.');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create New Student</h1>
          <p className="text-gray-500 mt-1">Add a new student to the system</p>
        </div>
      </div>

      {/* Form Card */}
      <Card className="max-w-3xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Student Information</CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={fillSampleData}
              className="gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Fill Sample Data
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Display */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
                {error}
              </div>
            )}

            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                Personal Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Student ID */}
                <div className="space-y-2">
                  <Label htmlFor="studentId" className="required">
                    Student ID <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="studentId"
                    value={formData.studentId}
                    onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                    required
                    placeholder="e.g., STU011"
                    className="w-full"
                  />
                  <p className="text-xs text-gray-500">Unique identifier for the student</p>
                </div>

                {/* Full Name */}
                <div className="space-y-2">
                  <Label htmlFor="name">
                    Full Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    placeholder="e.g., John Doe"
                    className="w-full"
                  />
                </div>
              </div>
            </div>

            {/* Academic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                Academic Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Class */}
                <div className="space-y-2">
                  <Label htmlFor="classId">
                    Class <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.classId && classOptions.some(c => String(c.classId) === String(formData.classId)) 
                      ? String(formData.classId) 
                      : undefined}
                    onValueChange={(value) => {
                      console.log('Class selected:', value);
                      handleClassChange(value);
                    }}
                  >
                    <SelectTrigger id="classId">
                      <SelectValue placeholder="Select class" />
                    </SelectTrigger>
                    <SelectContent>
                      {classOptions.length === 0 ? (
                        <SelectItem value="loading" disabled>Loading classes...</SelectItem>
                      ) : (
                        classOptions.map((cls) => (
                          <SelectItem key={cls.classId} value={String(cls.classId)}>
                            {cls.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* Section */}
                <div className="space-y-2">
                  <Label htmlFor="sectionId">
                    Section <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={String(formData.sectionId || '')}
                    onValueChange={(value) => setFormData({ ...formData, sectionId: String(value) })}
                  >
                    <SelectTrigger id="sectionId">
                      <SelectValue placeholder="Select section" />
                    </SelectTrigger>
                    <SelectContent>
                      {sectionOptions.map((sec) => (
                        <SelectItem key={sec.sectionId} value={String(sec.sectionId)}>
                          {sec.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Roll Number */}
                <div className="space-y-2">
                  <Label htmlFor="rollNo">
                    Roll Number <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="rollNo"
                    type="number"
                    min="1"
                    value={formData.rollNo}
                    onChange={(e) => setFormData({ ...formData, rollNo: parseInt(e.target.value) || 1 })}
                    required
                    className="w-full"
                  />
                </div>
              </div>
            </div>

            {/* Parent/Guardian Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                Parent/Guardian Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Parent Contact */}
                <div className="space-y-2">
                  <Label htmlFor="parentContact">
                    Parent Contact Number
                  </Label>
                  <Input
                    id="parentContact"
                    type="tel"
                    value={formData.parentContact}
                    onChange={(e) => setFormData({ ...formData, parentContact: e.target.value })}
                    placeholder="e.g., +1234567890"
                    className="w-full"
                  />
                  <p className="text-xs text-gray-500">Include country code if international</p>
                </div>

                {/* Parent Email */}
                <div className="space-y-2">
                  <Label htmlFor="parentEmail">
                    Parent Email Address
                  </Label>
                  <Input
                    id="parentEmail"
                    type="email"
                    value={formData.parentEmail}
                    onChange={(e) => setFormData({ ...formData, parentEmail: e.target.value })}
                    placeholder="e.g., parent@example.com"
                    className="w-full"
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={onBack}
                disabled={saving}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="flex-1 gap-2"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Creating...' : 'Create Student'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Help Text */}
      <Card className="max-w-3xl bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <h4 className="font-semibold text-blue-900 mb-2">📝 Important Notes:</h4>
          <ul className="space-y-1 text-sm text-blue-800">
            <li>• Student ID must be unique across the system</li>
            <li>• Roll Number should be unique within the same class and section</li>
            <li>• Parent contact and email are optional but recommended</li>
            <li>• All required fields are marked with an asterisk (*)</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
