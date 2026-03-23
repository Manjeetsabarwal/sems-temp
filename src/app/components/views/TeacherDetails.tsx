import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, Edit, Eye, Loader2, Sparkles, Pencil } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Textarea } from '../ui/textarea';
import { teachersService } from '../../services/teachers.service';
import { classesService } from '../../services/classes.service';
import { subjectsService } from '../../services/subjects.service';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Checkbox } from '../ui/checkbox';
import { toast } from 'sonner';
import type { TeacherExtended } from '../../types';
import { useApp } from '../../context/AppContext';
import { RenameDialog } from '../ui/RenameDialog';
import { FileAttachments } from '../FileAttachments';

interface TeacherDetailsProps {
  mode: 'create' | 'edit' | 'view';
  teacherId?: string;
  onBack: () => void;
  onSuccess: () => void;
}

export function TeacherDetails({ mode, teacherId, onBack, onSuccess }: TeacherDetailsProps) {
  const { goBack, canGoBack } = useApp();
  
  const handleBack = () => {
    // Only use navigation history if we actually navigated from another module
    if (canGoBack()) {
      goBack();
    }
    onBack();
  };
  
  const [formData, setFormData] = useState({
    teacherId: '',
    name: '',
    email: '',
    phone: '',
    subjects: [] as string[],
    primarySubject: '' as string, // Primary subject ID
    additionalSubjects: [] as string[], // Additional subject IDs
    classes: [] as string[],
    qualification: '',
    experience: 0,
    joiningDate: '',
    address: '',
    status: 'Active' as 'Active' | 'Inactive',
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(mode === 'create' || mode === 'edit');
  const [classOptions, setClassOptions] = useState<Array<{ classId: string; name: string }>>([]);
  const [subjectOptions, setSubjectOptions] = useState<Array<{ subjectId: string; subjectName: string; subjectCode: string }>>([]);
  const [showRenameDialog, setShowRenameDialog] = useState(false);

  // Auto-generate Teacher ID for new teachers
  const generateTeacherId = async () => {
    try {
      const teachers = await teachersService.getAll();
      const existingIds = teachers.map(t => t.teacherId);
      
      // Find the highest number
      let maxNum = 0;
      existingIds.forEach(id => {
        const match = id.match(/TCH(\d+)/);
        if (match) {
          const num = parseInt(match[1]);
          if (num > maxNum) maxNum = num;
        }
      });
      
      const newNum = maxNum + 1;
      return `TCH${String(newNum).padStart(3, '0')}`;
    } catch (err) {
      return 'TCH001';
    }
  };

  useEffect(() => {
    const loadData = async () => {
      // Load classes and subjects for dropdowns
      try {
        const classes = await classesService.getForDropdown();
        setClassOptions(classes);
      } catch (err) {
        console.error('Failed to load classes:', err);
      }

      try {
        const subjects = await subjectsService.getForDropdown();
        setSubjectOptions(subjects);
      } catch (err) {
        console.error('Failed to load subjects:', err);
      }

      if (mode === 'create') {
        // Auto-generate teacher ID
        const newId = await generateTeacherId();
        setFormData(prev => ({ ...prev, teacherId: newId }));
      } else if (teacherId) {
        setLoading(true);
        try {
          const teacher = await teachersService.getById(teacherId);
          // Extract primary and additional subjects from subjectDetails if available
          const subjectDetails = (teacher as any).subjectDetails || [];
          const primarySubject = subjectDetails.find((s: any) => s.isPrimary)?.subjectId || '';
          const additionalSubjects = subjectDetails.filter((s: any) => !s.isPrimary).map((s: any) => s.subjectId).filter(Boolean);
          
          setFormData({
            teacherId: teacher.teacherId,
            name: teacher.name,
            email: teacher.email || '',
            phone: teacher.phone || '',
            subjects: teacher.subjects || [],
            primarySubject: primarySubject,
            additionalSubjects: additionalSubjects,
            classes: teacher.classes || [],
            qualification: teacher.qualification || '',
            experience: teacher.experience || 0,
            joiningDate: teacher.joiningDate || '',
            address: teacher.address || '',
            status: teacher.status,
          });
        } catch (err: any) {
          setError(err.message);
          toast.error('Failed to load teacher details');
        } finally {
          setLoading(false);
        }
      }
    };

    loadData();
  }, [mode, teacherId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      // Validate required fields
      if (!formData.name.trim()) {
        toast.error('Name is required');
        setSaving(false);
        return;
      }

      // Combine primary and additional subjects
      const allSubjects = formData.primarySubject 
        ? [formData.primarySubject, ...formData.additionalSubjects]
        : formData.additionalSubjects;

      // Prepare data
      const teacherData: any = {
        teacherId: formData.teacherId,
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        subjects: allSubjects,
        primarySubject: formData.primarySubject,
        additionalSubjects: formData.additionalSubjects,
        classes: formData.classes,
        qualification: formData.qualification.trim(),
        experience: Number(formData.experience) || 0,
        joiningDate: formData.joiningDate || undefined,
        address: formData.address?.trim() || '',
        status: formData.status,
      };

      if (mode === 'create') {
        await teachersService.create(teacherData);
        toast.success('Teacher created successfully!');
        onSuccess();
      } else if (mode === 'edit' || (mode === 'view' && isEditing)) {
        // Allow updates in both edit mode and view mode when isEditing is true
        const updated = await teachersService.update(formData.teacherId, teacherData);
        toast.success('Teacher updated successfully!');
        
        // Reload the updated teacher data to show the latest changes (including address)
        if (teacherId) {
          try {
            const refreshed = await teachersService.getById(teacherId);
            const subjectDetails = (refreshed as any).subjectDetails || [];
            const primarySubject = subjectDetails.find((s: any) => s.isPrimary)?.subjectId || '';
            const additionalSubjects = subjectDetails.filter((s: any) => !s.isPrimary).map((s: any) => s.subjectId).filter(Boolean);
            
            setFormData({
              teacherId: refreshed.teacherId,
              name: refreshed.name,
              email: refreshed.email || '',
              phone: refreshed.phone || '',
              subjects: refreshed.subjects || [],
              primarySubject: primarySubject,
              additionalSubjects: additionalSubjects,
              classes: refreshed.classes || [],
              qualification: refreshed.qualification || '',
              experience: refreshed.experience || 0,
              joiningDate: refreshed.joiningDate || '',
              address: refreshed.address || '',
              status: refreshed.status,
            });
          } catch (err) {
            console.error('Failed to reload teacher data:', err);
            // If reload fails, use the response from update
            const subjectDetails = (updated as any).subjectDetails || [];
            const primarySubject = subjectDetails.find((s: any) => s.isPrimary)?.subjectId || '';
            const additionalSubjects = subjectDetails.filter((s: any) => !s.isPrimary).map((s: any) => s.subjectId).filter(Boolean);
            
            setFormData({
              teacherId: updated.teacherId,
              name: updated.name,
              email: updated.email || '',
              phone: updated.phone || '',
              subjects: updated.subjects || [],
              primarySubject: primarySubject,
              additionalSubjects: additionalSubjects,
              classes: updated.classes || [],
              qualification: updated.qualification || '',
              experience: updated.experience || 0,
              joiningDate: updated.joiningDate || '',
              address: updated.address || '',
              status: updated.status,
            });
          }
        }
        
        setIsEditing(false); // Switch back to view mode after saving
        onSuccess(); // Trigger parent refresh to update the list
      }
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message || 'Failed to save teacher');
    } finally {
      setSaving(false);
    }
  };

  const toggleEditMode = () => {
    setIsEditing(!isEditing);
  };

  // Generate sample data
  const fillSampleData = async () => {
    // Sample first names and last names
    const firstNames = [
      'Rajesh', 'Priya', 'Amit', 'Sneha', 'Arjun', 'Kavya', 'Vikram', 'Divya',
      'Rohan', 'Anjali', 'Karan', 'Isha', 'Aditya', 'Meera', 'Siddharth', 'Neha',
      'Raj', 'Pooja', 'Suresh', 'Kiran', 'Nikhil', 'Swati', 'Manish', 'Deepika',
      'Aryan', 'Shreya', 'Harsh', 'Tanvi', 'Yash', 'Riya', 'Akash', 'Sakshi'
    ];
    const lastNames = [
      'Sharma', 'Patel', 'Kumar', 'Reddy', 'Singh', 'Verma', 'Gupta', 'Rao',
      'Mehta', 'Joshi', 'Desai', 'Iyer', 'Shah', 'Nair', 'Roy', 'Malhotra',
      'Chopra', 'Agarwal', 'Kapoor', 'Bansal', 'Goyal', 'Saxena', 'Tiwari', 'Mishra'
    ];


    // Common qualifications
    const qualifications = [
      'M.Sc Mathematics, B.Ed',
      'M.A English, B.Ed',
      'M.Sc Physics, B.Ed',
      'M.Sc Chemistry, B.Ed',
      'M.A History, B.Ed',
      'M.A Geography, B.Ed',
      'M.Com, B.Ed',
      'B.Sc Mathematics, B.Ed',
      'B.A English, B.Ed',
      'M.Sc Biology, B.Ed',
      'M.A Economics, B.Ed',
      'B.Tech, B.Ed',
      'M.A Hindi, B.Ed',
      'M.Sc Computer Science, B.Ed'
    ];

    // Generate unique teacher ID
    let teacherId = '';
    try {
      const teachers = await teachersService.getAll();
      const existingIds = teachers.map(t => t.teacherId);
      let maxNum = 0;
      existingIds.forEach(id => {
        const match = id.match(/TCH(\d+)/);
        if (match) {
          const num = parseInt(match[1]);
          if (num > maxNum) maxNum = num;
        }
      });
      const newNum = maxNum + 1;
      teacherId = `TCH${String(newNum).padStart(3, '0')}`;
    } catch (err) {
      const randomNum = Math.floor(Math.random() * 999) + 1;
      teacherId = `TCH${String(randomNum).padStart(3, '0')}`;
    }

    // Generate random name
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const name = `${firstName} ${lastName}`;

    // Get available classes
    let availableClasses: Array<{ classId: string; name: string }> = [];
    try {
      availableClasses = await classesService.getForDropdown();
    } catch (err) {
      // Fallback to common class IDs
      availableClasses = [
        { classId: '9', name: 'Class 9' },
        { classId: '10', name: 'Class 10' },
        { classId: '11', name: 'Class 11' },
        { classId: '12', name: 'Class 12' },
      ];
    }

    // Get available subjects
    let availableSubjects: Array<{ subjectId: string; subjectName: string; subjectCode: string }> = [];
    try {
      availableSubjects = await subjectsService.getForDropdown();
    } catch (err) {
      // Fallback - will use empty array
      availableSubjects = [];
    }

    // Select random subjects (1-3 subjects) - first one as primary, rest as additional
    const numSubjects = Math.floor(Math.random() * 3) + 1;
    const selectedSubjectIds: string[] = [];
    const shuffledSubjects = [...availableSubjects].sort(() => Math.random() - 0.5);
    for (let i = 0; i < numSubjects && i < shuffledSubjects.length; i++) {
      selectedSubjectIds.push(shuffledSubjects[i].subjectId);
    }
    const primarySubjectId = selectedSubjectIds.length > 0 ? selectedSubjectIds[0] : '';
    const additionalSubjectIds = selectedSubjectIds.length > 1 ? selectedSubjectIds.slice(1) : [];

    // Select random classes (1-3 classes)
    const numClasses = Math.floor(Math.random() * 3) + 1;
    const selectedClassIds: string[] = [];
    const shuffledClasses = [...availableClasses].sort(() => Math.random() - 0.5);
    for (let i = 0; i < numClasses && i < shuffledClasses.length; i++) {
      selectedClassIds.push(shuffledClasses[i].classId);
    }

    // Generate random email
    const emailDomains = ['school.edu', 'gmail.com', 'yahoo.com', 'outlook.com'];
    const emailName = `${firstName.toLowerCase()}.${lastName.toLowerCase()}`;
    const emailDomain = emailDomains[Math.floor(Math.random() * emailDomains.length)];
    const email = `${emailName}@${emailDomain}`;

    // Generate random phone number (Indian format)
    const phonePrefixes = ['98765', '98766', '98767', '98768', '98769', '98770', '98771', '98772'];
    const phoneSuffix = String(Math.floor(Math.random() * 100000)).padStart(5, '0');
    const phone = `+91-${phonePrefixes[Math.floor(Math.random() * phonePrefixes.length)]}${phoneSuffix}`;

    // Generate random qualification
    const qualification = qualifications[Math.floor(Math.random() * qualifications.length)];

    // Generate random experience (0-25 years)
    const experience = Math.floor(Math.random() * 26);

    // Generate random joining date (within last 10 years)
    const today = new Date();
    const yearsAgo = Math.floor(Math.random() * 10);
    const monthsAgo = Math.floor(Math.random() * 12);
    const joiningDate = new Date(today.getFullYear() - yearsAgo, today.getMonth() - monthsAgo, Math.floor(Math.random() * 28) + 1);
    const joiningDateStr = joiningDate.toISOString().split('T')[0];

    // Generate random address
    const streets = ['Main Street', 'Park Avenue', 'Gandhi Road', 'Nehru Nagar', 'Rajiv Colony', 'Indira Enclave'];
    const cities = ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata', 'Hyderabad', 'Pune', 'Ahmedabad'];
    const states = ['Maharashtra', 'Delhi', 'Karnataka', 'Tamil Nadu', 'West Bengal', 'Telangana', 'Gujarat'];
    const street = streets[Math.floor(Math.random() * streets.length)];
    const city = cities[Math.floor(Math.random() * cities.length)];
    const state = states[Math.floor(Math.random() * states.length)];
    const pincode = String(Math.floor(Math.random() * 900000) + 100000);
    const address = `${Math.floor(Math.random() * 999) + 1} ${street}, ${city}, ${state} - ${pincode}`;

    // Random status (mostly Active)
    const status = Math.random() > 0.2 ? 'Active' : 'Inactive';

    // Update form data
    setFormData({
      teacherId,
      name,
      email,
      phone,
      subjects: selectedSubjectIds,
      primarySubject: primarySubjectId,
      additionalSubjects: additionalSubjectIds,
      classes: selectedClassIds,
      qualification,
      experience,
      joiningDate: joiningDateStr,
      address,
      status: status as 'Active' | 'Inactive',
    });

    toast.success('Sample data filled! Review and submit when ready.');
  };

  const isReadOnly = !isEditing;
  const pageTitle = mode === 'create' ? 'Create New Teacher' : mode === 'edit' ? 'Edit Teacher' : 'Teacher Details';
  const pageSubtitle = mode === 'create' 
    ? 'Add a new teacher to the system' 
    : mode === 'edit' 
    ? 'Update teacher information'
    : 'View teacher information';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="animate-spin h-12 w-12 text-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading teacher details...</p>
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
                <Badge variant="secondary" className={isEditing ? "bg-green-100 text-green-700" : "bg-purple-100 text-purple-700"}>
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
                Edit Teacher
              </>
            )}
          </Button>
        )}
      </div>

      {/* Form Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Teacher Information</CardTitle>
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
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
                <p className="font-medium">Error</p>
                <p className="text-sm mt-1">{error}</p>
              </div>
            )}

            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="teacherId">
                    Teacher ID <span className="text-red-500">*</span>
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
                <Input
                  id="teacherId"
                  value={formData.teacherId}
                  onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
                  disabled={mode === 'edit' || mode === 'view' || isReadOnly}
                  className="font-mono"
                  required
                />
                <p className="text-xs text-gray-500">
                  {mode === 'create' ? 'Auto-generated unique identifier' : 'Use "Rename ID" button to change'}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">
                  Status <span className="text-red-500">*</span>
                </Label>
                <select
                  id="status"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as 'Active' | 'Inactive' })}
                  disabled={isReadOnly}
                  className="w-full h-10 px-3 border border-gray-300 rounded-md bg-white disabled:bg-gray-50 disabled:text-gray-500"
                  required
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">
                Full Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                disabled={isReadOnly}
                placeholder="Enter teacher's full name"
                required
              />
            </div>

            {/* Contact Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  disabled={isReadOnly}
                  placeholder="teacher@school.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  disabled={isReadOnly}
                  placeholder="+1 234 567 8900"
                />
              </div>
            </div>

            {/* Teaching Details */}
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="primary-subject">Primary Subject</Label>
                  <p className="text-xs text-gray-500 mb-2">Select the main subject this teacher teaches</p>
                  <Select
                    value={formData.primarySubject || undefined}
                    onValueChange={(value) => {
                      // If switching primary, move old primary to additional if it exists
                      const oldPrimary = formData.primarySubject;
                      const newAdditional = oldPrimary && oldPrimary !== value
                        ? [...formData.additionalSubjects.filter(id => id !== value), oldPrimary]
                        : formData.additionalSubjects.filter(id => id !== value);
                      
                      setFormData({
                        ...formData,
                        primarySubject: value || '',
                        additionalSubjects: newAdditional,
                      });
                    }}
                    disabled={isReadOnly}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select primary subject (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjectOptions.map((subject) => (
                        <SelectItem key={subject.subjectId} value={subject.subjectId}>
                          {subject.subjectName} ({subject.subjectCode})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formData.primarySubject && (
                    <div className="mt-2 flex items-center gap-2">
                      <Badge variant="default" className="bg-blue-600">
                        Primary: {subjectOptions.find(s => s.subjectId === formData.primarySubject)?.subjectName}
                      </Badge>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="additional-subjects">Additional Subjects</Label>
                  <p className="text-xs text-gray-500 mb-2">Select other subjects this teacher can teach</p>
                  <div className="border rounded-md p-3 min-h-[120px] max-h-[200px] overflow-y-auto bg-white">
                    {subjectOptions.length === 0 ? (
                      <p className="text-sm text-gray-500">Loading subjects...</p>
                    ) : (
                      <div className="space-y-2">
                        {subjectOptions
                          .filter(subject => subject.subjectId !== formData.primarySubject)
                          .map((subject) => {
                            const isSelected = formData.additionalSubjects.includes(subject.subjectId);
                            return (
                              <div key={subject.subjectId} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`additional-subject-${subject.subjectId}`}
                                  checked={isSelected}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      setFormData({
                                        ...formData,
                                        additionalSubjects: [...formData.additionalSubjects, subject.subjectId],
                                      });
                                    } else {
                                      setFormData({
                                        ...formData,
                                        additionalSubjects: formData.additionalSubjects.filter((id) => id !== subject.subjectId),
                                      });
                                    }
                                  }}
                                  disabled={isReadOnly}
                                />
                                <label
                                  htmlFor={`additional-subject-${subject.subjectId}`}
                                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                                >
                                  {subject.subjectName} ({subject.subjectCode})
                                </label>
                                {isSelected && (
                                  <Badge variant="outline" className="text-xs">
                                    Additional
                                  </Badge>
                                )}
                              </div>
                            );
                          })}
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">
                    {formData.additionalSubjects.length} additional subject{formData.additionalSubjects.length !== 1 ? 's' : ''} selected
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="classes">Classes</Label>
                <div className="border rounded-md p-3 min-h-[120px] max-h-[200px] overflow-y-auto bg-white">
                  {classOptions.length === 0 ? (
                    <p className="text-sm text-gray-500">Loading classes...</p>
                  ) : (
                    <div className="space-y-2">
                      {classOptions.map((cls) => (
                        <div key={cls.classId} className="flex items-center space-x-2">
                          <Checkbox
                            id={`class-${cls.classId}`}
                            checked={formData.classes.includes(cls.classId)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setFormData({
                                  ...formData,
                                  classes: [...formData.classes, cls.classId],
                                });
                              } else {
                                setFormData({
                                  ...formData,
                                  classes: formData.classes.filter((id) => id !== cls.classId),
                                });
                              }
                            }}
                            disabled={isReadOnly}
                          />
                          <label
                            htmlFor={`class-${cls.classId}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                          >
                            {cls.name}
                          </label>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500">
                  {formData.classes.length} class{formData.classes.length !== 1 ? 'es' : ''} selected
                </p>
              </div>
            </div>

            {/* Professional Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="qualification">Qualification</Label>
                <Input
                  id="qualification"
                  value={formData.qualification}
                  onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                  disabled={isReadOnly}
                  placeholder="M.Sc., B.Ed."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="experience">Experience (years)</Label>
                <Input
                  id="experience"
                  type="number"
                  min="0"
                  value={formData.experience}
                  onChange={(e) => setFormData({ ...formData, experience: Number(e.target.value) })}
                  disabled={isReadOnly}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="joiningDate">Joining Date</Label>
              <Input
                id="joiningDate"
                type="date"
                value={formData.joiningDate}
                onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })}
                disabled={isReadOnly}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                disabled={isReadOnly}
                placeholder="Enter full address"
                rows={3}
              />
            </div>

            {/* Action Buttons */}
            {!isReadOnly && (
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button type="button" variant="outline" onClick={handleBack} disabled={saving}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saving} className="gap-2">
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      {mode === 'create' ? 'Create Teacher' : 'Save Changes'}
                    </>
                  )}
                </Button>
              </div>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Attachments - only for existing teachers (edit/view) */}
      {mode !== 'create' && formData.teacherId && (
        <div className="max-w-3xl">
          <FileAttachments
            entityType="teacher"
            entityId={formData.teacherId}
            readOnly={mode === 'view' && !isEditing}
            title="Teacher Documents"
          />
        </div>
      )}

      {/* Rename Dialog */}
      {mode !== 'create' && (
        <RenameDialog
          open={showRenameDialog}
          onOpenChange={setShowRenameDialog}
          currentId={formData.teacherId}
          entityName="Teacher"
          onRename={async (newId: string) => {
            try {
              await teachersService.rename(formData.teacherId, newId);
              toast.success(`Teacher ID renamed from ${formData.teacherId} to ${newId}`);
              // Reload teacher data with new ID
              const refreshed = await teachersService.getById(newId);
              const subjectDetails = (refreshed as any).subjectDetails || [];
              const primarySubject = subjectDetails.find((s: any) => s.isPrimary)?.subjectId || '';
              const additionalSubjects = subjectDetails.filter((s: any) => !s.isPrimary).map((s: any) => s.subjectId).filter(Boolean);
              
              setFormData({
                teacherId: refreshed.teacherId,
                name: refreshed.name,
                email: refreshed.email || '',
                phone: refreshed.phone || '',
                subjects: refreshed.subjects || [],
                primarySubject: primarySubject,
                additionalSubjects: additionalSubjects,
                classes: refreshed.classes || [],
                qualification: refreshed.qualification || '',
                experience: refreshed.experience || 0,
                joiningDate: refreshed.joiningDate || '',
                address: refreshed.address || '',
                status: refreshed.status,
              });
              setShowRenameDialog(false); // Close dialog after success
              onSuccess(); // Trigger parent refresh
            } catch (error: any) {
              // Error is already handled in RenameDialog, just rethrow
              throw error;
            }
          }}
          validateId={(id) => {
            if (!id.match(/^TCH\d{3}$/)) {
              return 'Teacher ID must be in format TCH### (e.g., TCH001)';
            }
            return null;
          }}
        />
      )}
    </div>
  );
}
