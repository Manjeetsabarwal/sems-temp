/**
 * Database Setup Service
 * Handles initial setup and sample data population using KV Store
 */

import * as kv from '../utils/kv-store';
import { teachersService } from './teachers.service';
import { classesService } from './classes.service';
import { sectionsService } from './sections.service';

export interface SetupProgress {
  step: string;
  status: 'pending' | 'running' | 'success' | 'error';
  message: string;
}

class DatabaseSetupService {
  /**
   * Check if initial data exists in KV store
   */
  async checkDataExists(): Promise<{ teachers: boolean; classes: boolean; sections: boolean }> {
    try {
      const teacherRecords = await kv.getByPrefix('teacher:');
      const classRecords = await kv.getByPrefix('class:');
      const sectionRecords = await kv.getByPrefix('section:');

      return {
        teachers: teacherRecords.length > 0,
        classes: classRecords.length > 0,
        sections: sectionRecords.length > 0,
      };
    } catch (err) {
      return { teachers: false, classes: false, sections: false };
    }
  }

  /**
   * Setup initial data in KV store
   */
  async setupDatabase(onProgress?: (progress: SetupProgress) => void): Promise<void> {
    const steps: SetupProgress[] = [
      { step: 'classes_data', status: 'pending', message: 'Creating sample classes...' },
      { step: 'sections_data', status: 'pending', message: 'Creating sample sections...' },
      { step: 'teachers_data', status: 'pending', message: 'Creating sample teachers...' },
    ];

    try {
      // Step 1: Create Sample Classes
      onProgress?.({ ...steps[0], status: 'running' });
      await this.insertSampleClasses();
      onProgress?.({ ...steps[0], status: 'success', message: 'Classes created successfully!' });

      // Step 2: Create Sample Sections
      onProgress?.({ ...steps[1], status: 'running' });
      await this.insertSampleSections();
      onProgress?.({ ...steps[1], status: 'success', message: 'Sections created successfully!' });

      // Step 3: Create Sample Teachers
      onProgress?.({ ...steps[2], status: 'running' });
      await this.insertSampleTeachers();
      onProgress?.({ ...steps[2], status: 'success', message: 'Teachers created successfully!' });

    } catch (err: any) {
      console.error('Database setup error:', err);
      const errorStep = steps.find(s => s.status === 'running');
      if (errorStep && onProgress) {
        onProgress?.({ ...errorStep, status: 'error', message: err.message });
      }
      throw err;
    }
  }

  /**
   * Insert sample classes
   */
  private async insertSampleClasses(): Promise<void> {
    const sampleClasses = [
      { 
        classId: '10', 
        name: 'Class 10',
        description: 'Secondary Level - Grade 10',
        capacity: 60,
        status: 'Active' as const
      },
      { 
        classId: '11', 
        name: 'Class 11',
        description: 'Senior Secondary - Grade 11',
        capacity: 50,
        status: 'Active' as const
      },
      { 
        classId: '12', 
        name: 'Class 12',
        description: 'Senior Secondary - Grade 12',
        capacity: 50,
        status: 'Active' as const
      },
    ];

    for (const classData of sampleClasses) {
      try {
        await classesService.create(classData);
      } catch (err: any) {
        // Ignore if already exists
        if (!err.message.includes('already exists')) {
          throw err;
        }
      }
    }
  }

  /**
   * Insert sample sections
   */
  private async insertSampleSections(): Promise<void> {
    const sampleSections = [
      { 
        sectionId: '10-A', 
        name: 'Section A', 
        classId: '10',
        capacity: 30,
        roomNumber: 'Room 101',
        status: 'Active' as const
      },
      { 
        sectionId: '10-B', 
        name: 'Section B', 
        classId: '10',
        capacity: 30,
        roomNumber: 'Room 102',
        status: 'Active' as const
      },
      { 
        sectionId: '11-A', 
        name: 'Section A', 
        classId: '11',
        capacity: 30,
        roomNumber: 'Room 201',
        status: 'Active' as const
      },
      { 
        sectionId: '12-A', 
        name: 'Section A', 
        classId: '12',
        capacity: 30,
        roomNumber: 'Room 301',
        status: 'Active' as const
      },
    ];

    for (const section of sampleSections) {
      try {
        await sectionsService.create(section);
      } catch (err: any) {
        // Ignore if already exists
        if (!err.message.includes('already exists')) {
          throw err;
        }
      }
    }
  }

  /**
   * Insert sample teachers
   */
  private async insertSampleTeachers(): Promise<void> {
    const sampleTeachers = [
      {
        teacherId: 'TCH001',
        name: 'Alice Johnson',
        email: 'alice.johnson@school.edu',
        phone: '+1-555-0101',
        department: 'Science',
        subjects: ['Mathematics', 'Science'],
        classes: ['10', '11'],
        qualification: 'M.Sc Mathematics, B.Ed',
        experience: 8,
        joinDate: '2016-06-15',
        status: 'Active' as const,
      },
      {
        teacherId: 'TCH002',
        name: 'Bob Smith',
        email: 'bob.smith@school.edu',
        phone: '+1-555-0102',
        department: 'English',
        subjects: ['English'],
        classes: ['10', '11', '12'],
        qualification: 'M.A English, B.Ed',
        experience: 12,
        joinDate: '2012-08-20',
        status: 'Active' as const,
      },
      {
        teacherId: 'TCH003',
        name: 'Charlie Brown',
        email: 'charlie.brown@school.edu',
        phone: '+1-555-0103',
        department: 'Social Studies',
        subjects: ['Social Studies', 'Hindi'],
        classes: ['10', '11'],
        qualification: 'M.A History, B.Ed',
        experience: 6,
        joinDate: '2018-07-01',
        status: 'Active' as const,
      },
      {
        teacherId: 'TCH004',
        name: 'Diana Prince',
        email: 'diana.prince@school.edu',
        phone: '+1-555-0104',
        department: 'Mathematics',
        subjects: ['Mathematics'],
        classes: ['10'],
        qualification: 'M.Sc Mathematics, B.Ed',
        experience: 10,
        joinDate: '2014-09-10',
        status: 'Active' as const,
      },
      {
        teacherId: 'TCH005',
        name: 'Ethan Hunt',
        email: 'ethan.hunt@school.edu',
        phone: '+1-555-0105',
        department: 'Science',
        subjects: ['Physics', 'Chemistry'],
        classes: ['11', '12'],
        qualification: 'M.Sc Physics, B.Ed',
        experience: 15,
        joinDate: '2009-06-01',
        status: 'Active' as const,
      },
    ];

    for (const teacher of sampleTeachers) {
      try {
        await teachersService.create(teacher);
      } catch (err: any) {
        // Ignore if already exists
        if (!err.message.includes('already exists')) {
          throw err;
        }
      }
    }
  }

  /**
   * Reset all data (clear KV store)
   */
  async resetDatabase(): Promise<void> {
    try {
      // Get all records with our prefixes
      const teacherRecords = await kv.getByPrefix('teacher:');
      const classRecords = await kv.getByPrefix('class:');
      const sectionRecords = await kv.getByPrefix('section:');

      // Delete all records
      const allKeys = [
        ...teacherRecords.map(r => r.key),
        ...classRecords.map(r => r.key),
        ...sectionRecords.map(r => r.key),
      ];

      if (allKeys.length > 0) {
        await kv.mdel(allKeys);
      }

      console.log('✅ Database reset complete');
    } catch (err: any) {
      console.error('❌ Reset database error:', err);
      throw new Error(`Failed to reset database: ${err.message}`);
    }
  }
}

export const databaseSetupService = new DatabaseSetupService();