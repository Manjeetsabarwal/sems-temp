import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, Edit, Eye, Sparkles, Pencil } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { studentsService } from '../../services/students.service';
import { classesService } from '../../services/classes.service';
import { sectionsService } from '../../services/sections.service';
import { toast } from 'sonner';
import type { Student } from '../../types';
import { useApp } from '../../context/AppContext';
import { RenameDialog } from '../ui/RenameDialog';
import { FileAttachments } from '../FileAttachments';

interface StudentDetailsProps {
  mode: 'create' | 'edit' | 'view';
  studentId?: string;
  onBack: () => void;
  onSuccess: () => void;
}

export function StudentDetails({ mode, studentId, onBack, onSuccess }: StudentDetailsProps) {
  const { goBack, navigateToRecord, canGoBack, pushNavigation } = useApp();
  
  const handleBack = () => {
    // Only use navigation history if we actually navigated from another module
    // Otherwise, just close the detail view (onBack handles local state)
    if (canGoBack()) {
      goBack();
    }
    onBack();
  };
  
  const [formData, setFormData] = useState({
    studentId: '',
    name: '',
    classId: '',
    sectionId: '',
    rollNo: undefined as number | undefined,
    parentContact: '',
    parentEmail: '',
    fatherName: '',
    motherName: '',
    dateOfBirth: '',
    gender: '' as string | undefined,
    examRegistrationFees: undefined as number | undefined,
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(mode === 'create' || mode === 'edit');
  const [suggestedRollNo, setSuggestedRollNo] = useState<number | null>(null);
  const [existingRollNumbers, setExistingRollNumbers] = useState<number[]>([]);
  const [classOptions, setClassOptions] = useState<Array<{ classId: string; name: string }>>([]);
  const [sectionOptions, setSectionOptions] = useState<Array<{ sectionId: string; name: string; classId: string }>>([]);
  const [showRenameDialog, setShowRenameDialog] = useState(false);

  // Auto-generate Student ID for new students
  const generateStudentId = async () => {
    try {
      const students = await studentsService.getAll({});
      const existingIds = students.map(s => s.studentId);
      
      // Find the highest number
      let maxNum = 0;
      existingIds.forEach(id => {
        const match = id.match(/STU(\d+)/);
        if (match) {
          const num = parseInt(match[1]);
          if (num > maxNum) maxNum = num;
        }
      });
      
      const newNum = maxNum + 1;
      return `STU${String(newNum).padStart(3, '0')}`;
    } catch (err) {
      return 'STU001';
    }
  };

  // Get next available roll number for selected class and section
  const getNextRollNumber = async (classId: string, sectionId: string) => {
    try {
      const students = await studentsService.getAll({ classId, sectionId });
      const rollNumbers = students.map(s => Number(s.rollNo)).filter(n => !isNaN(n));
      setExistingRollNumbers(rollNumbers);
      
      if (rollNumbers.length === 0) {
        return 1;
      }
      
      const maxRollNo = Math.max(...rollNumbers);
      return maxRollNo + 1;
    } catch (err) {
      return 1;
    }
  };

  // Update suggested roll number when class or section changes
  useEffect(() => {
    const updateSuggestion = async () => {
      if (mode === 'create') {
        const nextRoll = await getNextRollNumber(formData.classId, formData.sectionId);
        setSuggestedRollNo(nextRoll);
        setFormData(prev => ({ ...prev, rollNo: nextRoll }));
      }
    };
    updateSuggestion();
  }, [formData.classId, formData.sectionId, mode]);

  useEffect(() => {
    const loadData = async () => {
      await loadClasses();
      if (mode === 'create') {
        // Auto-generate student ID
        const newId = await generateStudentId();
        setFormData(prev => ({ ...prev, studentId: newId }));
        await loadSections('10');
      } else if (studentId) {
        setLoading(true);
        try {
          const student = await studentsService.getById(studentId);
          if (student.classId) {
            await loadSections(student.classId);
          }
          setFormData({
            studentId: student.studentId,
            name: student.name,
            classId: student.classId || '',
            sectionId: student.sectionId || '',
            rollNo: student.rollNo || undefined,
            parentContact: student.parentContact || '',
            parentEmail: student.parentEmail || '',
            fatherName: student.fatherName || '',
            motherName: student.motherName || '',
            dateOfBirth: student.dateOfBirth || '',
            gender: student.gender || '',
            examRegistrationFees: student.examRegistrationFees || undefined,
          });
        } catch (err: any) {
          setError(err.message);
          toast.error('Failed to load student details');
        } finally {
          setLoading(false);
        }
      }
    };

    loadData();
  }, [mode, studentId]);

  const loadClasses = async () => {
    try {
      const classes = await classesService.getForDropdown();
      setClassOptions(classes);
    } catch (err) {
      console.error('Failed to load classes:', err);
    }
  };

  const loadSections = async (classId: string) => {
    if (!classId) {
      setSectionOptions([]);
      return [];
    }
    try {
      // Use getByClass which handles many-to-many relationships properly
      const sections = await sectionsService.getByClass(classId);
      // Map to the format expected by the dropdown
      const mappedSections = sections.map(s => ({
        sectionId: s.sectionId,
        name: s.name,
        classId: s.classId || classId, // Use provided classId if section doesn't have one
      }));
      setSectionOptions(mappedSections);
      console.log(`✅ Loaded ${mappedSections.length} sections for class ${classId}:`, mappedSections);
      return mappedSections;
    } catch (err) {
      console.error('Failed to load sections:', err);
      setSectionOptions([]);
      return [];
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      if (mode === 'create') {
        await studentsService.create(formData as Omit<Student, 'createdAt' | 'updatedAt'>);
        toast.success('Student created successfully!');
        onSuccess();
      } else if (mode === 'edit' || (mode === 'view' && isEditing)) {
        // Allow updates in both edit mode and view mode when isEditing is true
        await studentsService.update(formData.studentId, formData);
        toast.success('Student updated successfully!');
        setIsEditing(false); // Switch back to view mode after saving
        onSuccess(); // Trigger parent refresh to update the list
      }
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message || 'Failed to save student');
    } finally {
      setSaving(false);
    }
  };

  const handleClassChange = async (classId: string) => {
    // Update classId immediately (synchronously)
    const finalClassId = classId === '__none__' ? '' : classId;
    setFormData((prev) => ({
      ...prev,
      classId: finalClassId,
      sectionId: '', // Clear section when class changes
      rollNo: undefined, // Clear roll number when class changes
    }));
    
    // Then load sections asynchronously if classId is provided
    if (finalClassId) {
      console.log(`🔄 Loading sections for class: ${finalClassId}`);
      try {
        const sections = await loadSections(finalClassId);
        if (sections.length === 0) {
          toast.info(`No sections found for Class ${finalClassId}. You can still create a student without a section.`);
        } else {
          console.log(`✅ Successfully loaded ${sections.length} sections for Class ${finalClassId}`);
        }
      } catch (error: any) {
        console.error('❌ Error loading sections:', error);
        toast.error(`Failed to load sections: ${error.message}`);
      }
    } else {
      setSectionOptions([]);
    }
  };

  const toggleEditMode = () => {
    setIsEditing(!isEditing);
  };

  // Generate sample data (only for create mode)
  const fillSampleData = async () => {
    if (mode !== 'create') return;

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

    // Generate random student ID
    const newId = await generateStudentId();

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

    // Get next available roll number
    const rollNo = await getNextRollNumber(selectedClass, selectedSection);

    // Generate random phone number (Indian format)
    const phonePrefixes = ['98765', '98766', '98767', '98768', '98769', '98770', '98771', '98772'];
    const phoneSuffix = String(Math.floor(Math.random() * 100000)).padStart(5, '0');
    const parentContact = `+91-${phonePrefixes[Math.floor(Math.random() * phonePrefixes.length)]}${phoneSuffix}`;

    // Generate random email
    const emailDomains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com'];
    const emailName = `${firstName.toLowerCase()}.${lastName.toLowerCase()}`;
    const emailDomain = emailDomains[Math.floor(Math.random() * emailDomains.length)];
    const parentEmail = `parent.${emailName}@${emailDomain}`;

    // Random exam registration fees (500-2000)
    const examFees = Math.floor(Math.random() * 1501) + 500;

    // Random DOB (between 14 and 18 years ago)
    const birthYear = new Date().getFullYear() - (Math.floor(Math.random() * 5) + 14);
    const birthMonth = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
    const birthDay = String(Math.floor(Math.random() * 28) + 1).padStart(2, '0');
    const dateOfBirth = `${birthYear}-${birthMonth}-${birthDay}`;

    // Random Parent names
    const fatherName = `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastName}`;
    const motherName = `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastName}`;

    // Update form data
    setFormData({
      studentId: newId,
      name,
      classId: selectedClass,
      sectionId: selectedSection,
      rollNo: rollNo || undefined,
      parentContact,
      parentEmail,
      fatherName,
      motherName,
      dateOfBirth,
      gender: Math.random() > 0.5 ? 'Male' : 'Female',
      examRegistrationFees: examFees,
    });

    toast.success('Sample data filled! Review and submit when ready.');
  };

  const isReadOnly = !isEditing;
  const pageTitle = mode === 'create' ? 'Create New Student' : mode === 'edit' ? 'Edit Student' : 'Student Details';
  const pageSubtitle = mode === 'create' 
    ? 'Add a new student to the system' 
    : mode === 'edit' 
    ? 'Update student information'
    : 'View student information';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading student details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={handleBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{pageTitle}</h1>
              {mode === 'view' && (
                <Badge variant="secondary" className={isEditing ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}>
                  {isEditing ? 'Editing' : 'View Only'}
                </Badge>
              )}
            </div>
            <p className="text-gray-500 mt-1">{pageSubtitle}</p>
          </div>
        </div>
        
        {/* Edit/View Toggle for View Mode */}
        {mode === 'view' && (
          <Button
            variant={isEditing ? "default" : "outline"}
            onClick={toggleEditMode}
            className="gap-2"
          >
            {isEditing ? (
              <>
                <Eye className="w-4 h-4" />
                Switch to View
              </>
            ) : (
              <>
                <Edit className="w-4 h-4" />
                Edit Student
              </>
            )}
          </Button>
        )}
      </div>

      {/* Form Card */}
      <Card className="max-w-3xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Student Information</CardTitle>
            {mode === 'create' && (
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
            )}
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
                  <div className="flex items-center justify-between">
                    <Label htmlFor="studentId">
                      Student ID <span className="text-red-500">*</span>
                    </Label>
                    {mode !== 'create' && !isReadOnly && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowRenameDialog(true)}
                        className="gap-2"
                      >
                        <Pencil className="w-3 h-3" />
                        Rename ID
                      </Button>
                    )}
                  </div>
                  {mode === 'create' ? (
                    <div className="flex gap-2">
                      <Input
                        id="studentId"
                        value={formData.studentId}
                        onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                        required
                        placeholder="Auto-generated"
                        className="flex-1 font-mono"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={async () => {
                          const newId = await generateStudentId();
                          setFormData({ ...formData, studentId: newId });
                        }}
                      >
                        Generate
                      </Button>
                    </div>
                  ) : (
                    <Input
                      id="studentId"
                      value={formData.studentId}
                      disabled
                      className="font-mono bg-gray-50"
                    />
                  )}
                  <p className="text-xs text-gray-500">
                    {mode === 'create' ? 'Auto-generated unique identifier' : 'Use "Rename ID" button to change'}
                  </p>
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
                    disabled={isReadOnly}
                    required
                    placeholder="e.g., John Doe"
                    className={isReadOnly ? 'bg-gray-50' : ''}
                  />
                </div>

                {/* Date of Birth */}
                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth">
                    Date of Birth
                  </Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                    disabled={isReadOnly}
                    className={isReadOnly ? 'bg-gray-50' : ''}
                  />
                </div>

                {/* Gender */}
                <div className="space-y-2">
                  <Label htmlFor="gender">
                    Gender
                  </Label>
                  <Select
                    value={formData.gender || '__none__'}
                    onValueChange={(value) => setFormData({ ...formData, gender: value === '__none__' ? '' : value })}
                    disabled={isReadOnly}
                  >
                    <SelectTrigger id="gender" className={isReadOnly ? 'bg-gray-50' : ''}>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Select gender</SelectItem>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Academic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                Academic Information <span className="text-sm font-normal text-gray-500">(Optional - can be assigned later)</span>
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Class */}
                <div className="space-y-2">
                  <Label htmlFor="classId">
                    Class
                  </Label>
                  <Select
                    value={formData.classId && classOptions.some(c => String(c.classId) === String(formData.classId)) 
                      ? String(formData.classId) 
                      : formData.classId === '' ? '__none__' : undefined}
                    onValueChange={(value) => {
                      console.log('Class selected:', value);
                      handleClassChange(value === '__none__' ? '' : value);
                    }}
                    disabled={isReadOnly}
                  >
                    <SelectTrigger id="classId" className={isReadOnly ? 'bg-gray-50' : ''}>
                      <SelectValue placeholder="Select class (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">None (Not Assigned)</SelectItem>
                      {classOptions.length === 0 ? (
                        <SelectItem value="__loading__" disabled>Loading classes...</SelectItem>
                      ) : (
                        classOptions.map((cls) => (
                          <SelectItem key={cls.classId} value={String(cls.classId)}>
                            {cls.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {isReadOnly && formData.classId && (
                    <button
                      onClick={() => {
                        // Push current location to history before navigating
                        pushNavigation('students', studentId);
                        navigateToRecord('classes', formData.classId);
                      }}
                      className="text-xs text-blue-600 hover:text-blue-800 hover:underline mt-1"
                    >
                      View Class Details →
                    </button>
                  )}
                  <p className="text-xs text-gray-500">Can be assigned later</p>
                </div>

                {/* Section */}
                <div className="space-y-2">
                  <Label htmlFor="sectionId">
                    Section
                  </Label>
                  <Select
                    value={formData.sectionId ? String(formData.sectionId) : '__none__'}
                    onValueChange={(value) => {
                      console.log('Section selected:', value);
                      const sectionId = value === '__none__' ? '' : String(value);
                      setFormData({ ...formData, sectionId });
                      if (sectionId && formData.classId) {
                        getNextRollNumber(formData.classId, sectionId).then(roll => {
                          if (roll !== null) {
                            setSuggestedRollNo(roll);
                            setFormData(prev => ({ ...prev, rollNo: roll }));
                          }
                        });
                      }
                    }}
                    disabled={isReadOnly || !formData.classId}
                  >
                    <SelectTrigger id="sectionId" className={isReadOnly || !formData.classId ? 'bg-gray-50' : ''}>
                      <SelectValue placeholder={formData.classId ? "Select section (optional)" : "Select class first"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">None (Not Assigned)</SelectItem>
                      {sectionOptions.length === 0 ? (
                        <SelectItem value="__no_sections__" disabled>
                          {formData.classId ? `No sections found for Class ${formData.classId}` : 'Select class first'}
                        </SelectItem>
                      ) : (
                        sectionOptions.map((sec) => (
                          <SelectItem key={sec.sectionId} value={String(sec.sectionId)}>
                            {sec.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {formData.classId && sectionOptions.length === 0 && (
                    <p className="text-xs text-yellow-600">
                      ⚠️ No sections found for Class {formData.classId}. Please create sections A, B, C for this class first.
                    </p>
                  )}
                  {formData.classId && sectionOptions.length > 0 && (
                    <p className="text-xs text-gray-500">
                      {sectionOptions.length} section(s) available for Class {formData.classId}
                    </p>
                  )}
                  {!formData.classId && (
                    <p className="text-xs text-gray-500">Can be assigned later</p>
                  )}
                  {isReadOnly && formData.sectionId && (
                    <button
                      onClick={() => {
                        // Push current location to history before navigating
                        pushNavigation('students', studentId);
                        navigateToRecord('sections', formData.sectionId);
                      }}
                      className="text-xs text-blue-600 hover:text-blue-800 hover:underline mt-1"
                    >
                      View Section Details →
                    </button>
                  )}
                </div>

                {/* Roll Number */}
                <div className="space-y-2">
                  <Label htmlFor="rollNo">
                    Roll Number
                  </Label>
                  <Input
                    id="rollNo"
                    type="number"
                    min="1"
                    value={formData.rollNo || ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      setFormData({ ...formData, rollNo: value ? parseInt(value) : undefined });
                    }}
                    disabled={isReadOnly || !formData.classId || !formData.sectionId}
                    placeholder="Auto-suggested when class & section selected"
                    className={
                      isReadOnly 
                        ? 'bg-gray-50' 
                        : mode === 'create' && formData.rollNo && existingRollNumbers.includes(formData.rollNo)
                        ? 'border-red-500 focus:ring-red-500'
                        : ''
                    }
                  />
                  {mode === 'create' && formData.rollNo && existingRollNumbers.includes(formData.rollNo) && (
                    <p className="text-xs text-red-600 flex items-center gap-1">
                      ⚠️ Roll No {formData.rollNo} already taken. Try: {suggestedRollNo}
                    </p>
                  )}
                  {mode === 'create' && formData.rollNo && !existingRollNumbers.includes(formData.rollNo) && suggestedRollNo !== null && (
                    <p className="text-xs text-green-600 flex items-center gap-1">
                      ✓ Roll No {formData.rollNo} is available
                    </p>
                  )}
                  <p className="text-xs text-gray-500">Can be assigned later</p>
                </div>
              </div>
            </div>

            {/* Parent/Guardian Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                Parent/Guardian Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Father's Name */}
                <div className="space-y-2">
                  <Label htmlFor="fatherName">
                    Father's Name
                  </Label>
                  <Input
                    id="fatherName"
                    value={formData.fatherName}
                    onChange={(e) => setFormData({ ...formData, fatherName: e.target.value })}
                    disabled={isReadOnly}
                    placeholder="e.g., Richard Doe"
                    className={isReadOnly ? 'bg-gray-50' : ''}
                  />
                </div>

                {/* Mother's Name */}
                <div className="space-y-2">
                  <Label htmlFor="motherName">
                    Mother's Name
                  </Label>
                  <Input
                    id="motherName"
                    value={formData.motherName}
                    onChange={(e) => setFormData({ ...formData, motherName: e.target.value })}
                    disabled={isReadOnly}
                    placeholder="e.g., Jane Doe"
                    className={isReadOnly ? 'bg-gray-50' : ''}
                  />
                </div>
              </div>

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
                    disabled={isReadOnly}
                    placeholder="e.g., +1234567890"
                    className={isReadOnly ? 'bg-gray-50' : ''}
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
                    disabled={isReadOnly}
                    placeholder="e.g., parent@example.com"
                    className={isReadOnly ? 'bg-gray-50' : ''}
                  />
                </div>
              </div>
            </div>

            {/* Exam Registration Fees */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                Exam Registration
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Exam Registration Fees */}
                <div className="space-y-2">
                  <Label htmlFor="examRegistrationFees">
                    Exam Registration Fees
                  </Label>
                  <Input
                    id="examRegistrationFees"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.examRegistrationFees || ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      setFormData({ ...formData, examRegistrationFees: value ? parseFloat(value) : undefined });
                    }}
                    disabled={isReadOnly}
                    placeholder="e.g., 500.00"
                    className={isReadOnly ? 'bg-gray-50' : ''}
                  />
                  <p className="text-xs text-gray-500">Optional - Exam registration fees amount</p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            {!isReadOnly && (
              <div className="flex gap-3 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBack}
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
                  {saving ? 'Saving...' : mode === 'create' ? 'Create Student' : 'Save Changes'}
                </Button>
              </div>
            )}

            {/* View Mode Actions */}
            {isReadOnly && (
              <div className="flex gap-3 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBack}
                  className="flex-1"
                >
                  Back to List
                </Button>
              </div>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Attachments - only for existing students (edit/view) */}
      {mode !== 'create' && studentId && (
        <div className="max-w-3xl">
          <FileAttachments
            entityType="student"
            entityId={studentId}
            readOnly={mode === 'view' && !isEditing}
            title="Student Documents"
          />
        </div>
      )}

      {/* Help Text */}
      {mode === 'create' && (
        <Card className="max-w-3xl bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <h4 className="font-semibold text-blue-900 mb-2">📝 Important Notes:</h4>
            <ul className="space-y-1 text-sm text-blue-800">
              <li>• Student ID is auto-generated but you can edit it if needed</li>
              <li>• Roll Number should be unique within the same class and section</li>
              <li>• Parent contact and email are optional but recommended</li>
              <li>• All required fields are marked with an asterisk (*)</li>
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Rename Dialog */}
      {mode !== 'create' && (
        <RenameDialog
          open={showRenameDialog}
          onOpenChange={setShowRenameDialog}
          currentId={formData.studentId}
          entityName="Student"
          onRename={async (newId: string) => {
            try {
              await studentsService.rename(formData.studentId, newId);
              toast.success(`Student ID renamed from ${formData.studentId} to ${newId}`);
              // Reload student data with new ID
              const refreshed = await studentsService.getById(newId);
              setFormData({
                studentId: refreshed.studentId,
                name: refreshed.name,
                classId: refreshed.classId || '',
                sectionId: refreshed.sectionId || '',
                rollNo: refreshed.rollNo || undefined,
                parentContact: refreshed.parentContact || '',
                parentEmail: refreshed.parentEmail || '',
                fatherName: refreshed.fatherName || '',
                motherName: refreshed.motherName || '',
                dateOfBirth: refreshed.dateOfBirth || '',
                gender: refreshed.gender || '',
                examRegistrationFees: refreshed.examRegistrationFees || undefined,
              });
              setShowRenameDialog(false); // Close dialog after success
              onSuccess(); // Trigger parent refresh
            } catch (error: any) {
              // Error is already handled in RenameDialog, just rethrow
              throw error;
            }
          }}
          validateId={(id) => {
            if (!id.match(/^STU\d{3}$/)) {
              return 'Student ID must be in format STU### (e.g., STU001)';
            }
            return null;
          }}
        />
      )}
    </div>
  );
}