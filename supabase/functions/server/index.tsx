import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";
import { createClient } from 'npm:@supabase/supabase-js@2';

// Server v2.0 - CONSOLIDATED: Everything uses KV Store (Postgres-backed via kv_store_2fbe5237 table)
const app = new Hono();

// Create Supabase client
const getSupabaseClient = () => {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );
};

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
// Updated: Fixed deletion logic for camelCase/snake_case compatibility
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check endpoint
app.get("/make-server-2fbe5237/health", (c) => {
  return c.json({ status: "ok" });
});

// ========== STUDENTS API (KV Store) ==========

// LIST - Get all students with filters
app.get("/make-server-2fbe5237/api/students", async (c) => {
  try {
    const { classId, sectionId, search } = c.req.query();

    // Get all students from KV store
    const students = await kv.getByPrefix('sems:student:');

    let filtered = students;

    // Apply filters
    if (classId) {
      filtered = filtered.filter((s: any) => s.class_id === classId || s.classId === classId);
    }

    if (sectionId) {
      filtered = filtered.filter((s: any) => s.section_id === sectionId || s.sectionId === sectionId);
    }

    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter((s: any) => 
        s.name?.toLowerCase().includes(searchLower) ||
        (s.student_id || s.studentId)?.toLowerCase().includes(searchLower)
      );
    }

    // Sort by class, section, roll number
    filtered.sort((a: any, b: any) => {
      const classA = a.class_id || a.classId || '';
      const classB = b.class_id || b.classId || '';
      if (classA !== classB) return classA.localeCompare(classB);
      
      const secA = a.section_id || a.sectionId || '';
      const secB = b.section_id || b.sectionId || '';
      if (secA !== secB) return secA.localeCompare(secB);
      
      const rollA = a.roll_no || a.rollNo || 0;
      const rollB = b.roll_no || b.rollNo || 0;
      return rollA - rollB;
    });

    return c.json(filtered);
  } catch (error: any) {
    console.error('Error fetching students:', error);
    return c.json({ error: 'Failed to fetch students' }, 500);
  }
});

// VIEW - Get single student by ID
app.get("/make-server-2fbe5237/api/students/:id", async (c) => {
  try {
    const studentId = c.req.param('id');
    const student = await kv.get(`sems:student:${studentId}`);

    if (!student) {
      return c.json({ error: 'Student not found' }, 404);
    }

    return c.json(student);
  } catch (error: any) {
    console.error('Error fetching student:', error);
    return c.json({ error: 'Failed to fetch student' }, 500);
  }
});

// CREATE - Add new student
app.post("/make-server-2fbe5237/api/students", async (c) => {
  try {
    const body = await c.req.json();

    // Normalize field names
    const studentId = body.student_id || body.studentId;
    const name = body.name;
    const classId = body.class_id || body.classId;
    const sectionId = body.section_id || body.sectionId;
    const rollNo = body.roll_no || body.rollNo;
    
    if (!studentId || !name || !classId || !sectionId || rollNo === undefined) {
      return c.json({ error: 'Missing required fields: studentId, name, classId, sectionId, rollNo' }, 400);
    }

    // Check if student ID already exists
    const existing = await kv.get(`sems:student:${studentId}`);
    if (existing) {
      return c.json({ error: `Student ID ${studentId} already exists` }, 409);
    }

    // Check if roll number already exists in class/section
    const allStudents = await kv.getByPrefix('sems:student:');
    const duplicate = allStudents.find((s: any) => 
      (s.class_id === classId || s.classId === classId) &&
      (s.section_id === sectionId || s.sectionId === sectionId) &&
      (s.roll_no === rollNo || s.rollNo === rollNo)
    );
    
    if (duplicate) {
      return c.json({ 
        error: `Roll Number ${rollNo} already exists in Class ${classId}, Section ${sectionId}` 
      }, 409);
    }

    // Create student object
    const student = {
      student_id: studentId,
      name,
      class_id: classId,
      section_id: sectionId,
      roll_no: rollNo,
      date_of_birth: body.date_of_birth || body.dateOfBirth || null,
      gender: body.gender || null,
      email: body.email || null,
      phone: body.phone || null,
      parent_name: body.parent_name || body.parentName || null,
      parent_phone: body.parent_phone || body.parentPhone || null,
      address: body.address || null,
      status: body.status || 'Active',
      created_at: new Date().toISOString(),
    };

    await kv.set(`sems:student:${studentId}`, student);
    console.log('✅ Student created successfully:', studentId);
    return c.json(student, 201);
  } catch (error: any) {
    console.error('❌ Error creating student:', error);
    
    // Log detailed error for debugging
    console.error('Exception in create:', error);
    
    return c.json({ error: error.message || 'Failed to create student' }, 500);
  }
});

// UPDATE - Edit student
app.put("/make-server-2fbe5237/api/students/:id", async (c) => {
  try {
    const studentId = c.req.param('id');
    const body = await c.req.json();

    // Get existing student
    const existing = await kv.get(`sems:student:${studentId}`);
    if (!existing) {
      return c.json({ error: 'Student not found' }, 404);
    }

    // Build update object
    const updated = { ...existing };
    
    if (body.name !== undefined) updated.name = body.name;
    if (body.classId !== undefined || body.class_id !== undefined) {
      updated.class_id = body.classId || body.class_id;
    }
    if (body.sectionId !== undefined || body.section_id !== undefined) {
      updated.section_id = body.sectionId || body.section_id;
    }
    if (body.rollNo !== undefined || body.roll_no !== undefined) {
      const newRollNo = body.rollNo || body.roll_no;
      
      // Check for duplicate roll number
      const allStudents = await kv.getByPrefix('sems:student:');
      const duplicate = allStudents.find((s: any) => 
        s.student_id !== studentId &&
        (s.class_id === updated.class_id || s.classId === updated.class_id) &&
        (s.section_id === updated.section_id || s.sectionId === updated.section_id) &&
        (s.roll_no === newRollNo || s.rollNo === newRollNo)
      );
      
      if (duplicate) {
        return c.json({ 
          error: `Roll Number ${newRollNo} already exists in that Class and Section` 
        }, 409);
      }
      
      updated.roll_no = newRollNo;
    }
    if (body.dateOfBirth !== undefined || body.date_of_birth !== undefined) {
      updated.date_of_birth = body.dateOfBirth || body.date_of_birth;
    }
    if (body.gender !== undefined) updated.gender = body.gender;
    if (body.email !== undefined) updated.email = body.email;
    if (body.phone !== undefined) updated.phone = body.phone;
    if (body.parentName !== undefined || body.parent_name !== undefined) {
      updated.parent_name = body.parentName || body.parent_name;
    }
    if (body.parentPhone !== undefined || body.parent_phone !== undefined) {
      updated.parent_phone = body.parentPhone || body.parent_phone;
    }
    if (body.address !== undefined) updated.address = body.address;
    if (body.status !== undefined) updated.status = body.status;

    updated.updated_at = new Date().toISOString();

    await kv.set(`sems:student:${studentId}`, updated);
    return c.json(updated);
  } catch (error: any) {
    console.error('Error updating student:', error);
    return c.json({ error: 'Failed to update student' }, 500);
  }
});

// DELETE - Remove student
app.delete("/make-server-2fbe5237/api/students/:id", async (c) => {
  try {
    const studentId = c.req.param('id');
    await kv.del(`sems:student:${studentId}`);
    return c.json({ message: 'Student deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting student:', error);
    return c.json({ error: 'Failed to delete student' }, 500);
  }
});

// ========== CLASSES API (Supporting endpoints - Legacy endpoints redirected to KV) ==========

app.get("/make-server-2fbe5237/api/classes", async (c) => {
  try {
    // Use KV store instead of Postgres table
    const classes = await kv.getByPrefix('class:');
    console.log(`✅ Fetched ${classes.length} classes from KV store`);
    return c.json(classes || []);
  } catch (error) {
    console.error('Error fetching classes:', error);
    return c.json({ error: 'Failed to fetch classes' }, 500);
  }
});

// POST - Create class in KV store
app.post("/make-server-2fbe5237/api/classes", async (c) => {
  try {
    const body = await c.req.json();
    
    const classData = {
      classId: body.class_id || body.classId,
      className: body.class_name || body.className || body.name,
      classTeacherId: body.class_teacher_id || body.classTeacherId || null,
      academicYearId: body.academic_year_id || body.academicYearId || null,
      currentStrength: body.current_strength || body.currentStrength || 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const key = `class:${classData.classId}`;
    await kv.set(key, classData);
    
    console.log('✅ Class created in KV store:', classData.classId);
    return c.json(classData, 201);
  } catch (error) {
    console.error('Error creating class:', error);
    return c.json({ error: 'Failed to create class' }, 500);
  }
});

// ========== SECTIONS API (Supporting endpoints - Legacy endpoints redirected to KV) ==========

app.get("/make-server-2fbe5237/api/sections", async (c) => {
  try {
    const { classId } = c.req.query();
    
    // Use KV store instead of Postgres table
    let sections = await kv.getByPrefix('section:');
    
    if (classId) {
      sections = sections.filter((s: any) => s.classId === classId);
    }
    
    console.log(`✅ Fetched ${sections.length} sections from KV store`);
    return c.json(sections || []);
  } catch (error) {
    console.error('Error fetching sections:', error);
    return c.json({ error: 'Failed to fetch sections' }, 500);
  }
});

// POST - Create section in KV store
app.post("/make-server-2fbe5237/api/sections", async (c) => {
  try {
    const body = await c.req.json();
    
    const sectionData = {
      sectionId: body.section_id || body.sectionId,
      sectionName: body.section_name || body.sectionName || body.name,
      classId: body.class_id || body.classId,
      capacity: body.capacity || 40,
      currentStrength: body.current_strength || body.currentStrength || 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const key = `section:${sectionData.sectionId}`;
    await kv.set(key, sectionData);
    
    console.log('✅ Section created in KV store:', sectionData.sectionId);
    return c.json(sectionData, 201);
  } catch (error) {
    console.error('Error creating section:', error);
    return c.json({ error: 'Failed to create section' }, 500);
  }
});

// ========== TEACHERS API (KV Store based) ==========

const TEACHER_PREFIX = 'teacher:';
const CLASS_PREFIX = 'class:';
const SECTION_PREFIX = 'section:';

// LIST - Get all teachers with filters
app.get("/make-server-2fbe5237/api/kv/teachers", async (c) => {
  try {
    console.log('📖 Fetching teachers from KV store...');
    const { status, search } = c.req.query();

    // Get all teacher records from KV store
    const records = await kv.getByPrefix(TEACHER_PREFIX);
    let teachers = records;

    // Apply filters
    if (status) {
      teachers = teachers.filter((t: any) => t.status === status);
    }
    if (search) {
      const searchLower = search.toLowerCase();
      teachers = teachers.filter((t: any) =>
        t.name?.toLowerCase().includes(searchLower) ||
        t.teacherId?.toLowerCase().includes(searchLower) ||
        t.email?.toLowerCase().includes(searchLower)
      );
    }

    // Sort by teacherId
    teachers.sort((a: any, b: any) => (a.teacherId || '').localeCompare(b.teacherId || ''));

    console.log(`✅ Found ${teachers.length} teachers`);
    return c.json(teachers);
  } catch (error: any) {
    console.error('❌ Error fetching teachers:', error);
    return c.json({ error: error.message || 'Failed to fetch teachers' }, 500);
  }
});

// GET - Get single teacher by ID
app.get("/make-server-2fbe5237/api/kv/teachers/:id", async (c) => {
  try {
    const teacherId = c.req.param('id');
    const key = `${TEACHER_PREFIX}${teacherId}`;
    const teacher = await kv.get(key);

    if (!teacher) {
      return c.json({ error: 'Teacher not found' }, 404);
    }

    return c.json(teacher);
  } catch (error: any) {
    console.error('❌ Error fetching teacher:', error);
    return c.json({ error: error.message || 'Failed to fetch teacher' }, 500);
  }
});

// POST - Create new teacher
app.post("/make-server-2fbe5237/api/kv/teachers", async (c) => {
  try {
    const body = await c.req.json();
    
    if (!body.name || !body.teacherId) {
      return c.json({ error: 'Name and Teacher ID are required' }, 400);
    }

    const now = new Date().toISOString();
    const teacher = {
      ...body,
      createdAt: now,
      updatedAt: now,
    };

    const key = `${TEACHER_PREFIX}${teacher.teacherId}`;
    await kv.set(key, teacher);

    console.log('✅ Teacher created:', teacher);
    return c.json(teacher, 201);
  } catch (error: any) {
    console.error('❌ Error creating teacher:', error);
    return c.json({ error: error.message || 'Failed to create teacher' }, 500);
  }
});

// PUT - Update existing teacher
app.put("/make-server-2fbe5237/api/kv/teachers/:id", async (c) => {
  try {
    const teacherId = c.req.param('id');
    const body = await c.req.json();

    const key = `${TEACHER_PREFIX}${teacherId}`;
    const existing = await kv.get(key);

    if (!existing) {
      return c.json({ error: 'Teacher not found' }, 404);
    }

    const now = new Date().toISOString();
    const updated = {
      ...existing,
      ...body,
      teacherId: existing.teacherId,
      updatedAt: now,
    };

    await kv.set(key, updated);

    console.log('✅ Teacher updated:', updated);
    return c.json(updated);
  } catch (error: any) {
    console.error('❌ Error updating teacher:', error);
    return c.json({ error: error.message || 'Failed to update teacher' }, 500);
  }
});

// DELETE - Delete teacher
app.delete("/make-server-2fbe5237/api/kv/teachers/:id", async (c) => {
  try {
    const teacherId = c.req.param('id');
    const key = `${TEACHER_PREFIX}${teacherId}`;
    
    const existing = await kv.get(key);
    if (!existing) {
      return c.json({ error: 'Teacher not found' }, 404);
    }

    await kv.del(key);

    console.log('✅ Teacher deleted');
    return c.json({ message: 'Teacher deleted successfully' });
  } catch (error: any) {
    console.error('❌ Error deleting teacher:', error);
    return c.json({ error: error.message || 'Failed to delete teacher' }, 500);
  }
});

// POST - Bulk delete teachers
app.post("/make-server-2fbe5237/api/kv/teachers/bulk-delete", async (c) => {
  try {
    const { teacherIds } = await c.req.json();
    
    if (!Array.isArray(teacherIds) || teacherIds.length === 0) {
      return c.json({ error: 'Teacher IDs array is required' }, 400);
    }

    const keys = teacherIds.map((id: string) => `${TEACHER_PREFIX}${id}`);
    await kv.mdel(keys);

    console.log('✅ Bulk delete successful');
    return c.json({ message: `Successfully deleted ${teacherIds.length} teachers` });
  } catch (error: any) {
    console.error('❌ Error bulk deleting teachers:', error);
    return c.json({ error: error.message || 'Failed to delete teachers' }, 500);
  }
});

// ========== CLASSES API (KV Store based) ==========

// LIST - Get all classes with filters
app.get("/make-server-2fbe5237/api/kv/classes", async (c) => {
  try {
    const { status, search } = c.req.query();

    const records = await kv.getByPrefix(CLASS_PREFIX);
    let classes = records;

    if (status) {
      classes = classes.filter((cls: any) => cls.status === status);
    }
    if (search) {
      const searchLower = search.toLowerCase();
      classes = classes.filter((cls: any) =>
        cls.name?.toLowerCase().includes(searchLower) ||
        cls.classId?.toLowerCase().includes(searchLower)
      );
    }

    classes.sort((a: any, b: any) => (a.classId || '').localeCompare(b.classId || ''));

    return c.json(classes);
  } catch (error: any) {
    console.error('❌ Error fetching classes:', error);
    return c.json({ error: error.message || 'Failed to fetch classes' }, 500);
  }
});

// GET - Get single class by ID
app.get("/make-server-2fbe5237/api/kv/classes/:id", async (c) => {
  try {
    const classId = c.req.param('id');
    const key = `${CLASS_PREFIX}${classId}`;
    const classData = await kv.get(key);

    if (!classData) {
      return c.json({ error: 'Class not found' }, 404);
    }

    return c.json(classData);
  } catch (error: any) {
    console.error('❌ Error fetching class:', error);
    return c.json({ error: error.message || 'Failed to fetch class' }, 500);
  }
});

// POST - Create new class
app.post("/make-server-2fbe5237/api/kv/classes", async (c) => {
  try {
    const body = await c.req.json();
    
    if (!body.name || !body.classId) {
      return c.json({ error: 'Name and Class ID are required' }, 400);
    }

    const now = new Date().toISOString();
    const newClass = {
      ...body,
      currentStrength: 0,
      createdAt: now,
      updatedAt: now,
    };

    const key = `${CLASS_PREFIX}${newClass.classId}`;
    await kv.set(key, newClass);

    console.log('✅ Class created:', newClass);
    return c.json(newClass, 201);
  } catch (error: any) {
    console.error('❌ Error creating class:', error);
    return c.json({ error: error.message || 'Failed to create class' }, 500);
  }
});

// PUT - Update existing class
app.put("/make-server-2fbe5237/api/kv/classes/:id", async (c) => {
  try {
    const classId = c.req.param('id');
    const body = await c.req.json();

    const key = `${CLASS_PREFIX}${classId}`;
    const existing = await kv.get(key);

    if (!existing) {
      return c.json({ error: 'Class not found' }, 404);
    }

    const now = new Date().toISOString();
    const updated = {
      ...existing,
      ...body,
      classId: existing.classId,
      updatedAt: now,
    };

    await kv.set(key, updated);

    console.log('✅ Class updated:', updated);
    return c.json(updated);
  } catch (error: any) {
    console.error('❌ Error updating class:', error);
    return c.json({ error: error.message || 'Failed to update class' }, 500);
  }
});

// DELETE - Delete class
app.delete("/make-server-2fbe5237/api/kv/classes/:id", async (c) => {
  try {
    const classId = c.req.param('id');
    const key = `${CLASS_PREFIX}${classId}`;
    
    const existing = await kv.get(key);
    if (!existing) {
      return c.json({ error: 'Class not found' }, 404);
    }

    await kv.del(key);

    console.log('✅ Class deleted');
    return c.json({ message: 'Class deleted successfully' });
  } catch (error: any) {
    console.error('❌ Error deleting class:', error);
    return c.json({ error: error.message || 'Failed to delete class' }, 500);
  }
});

// POST - Bulk delete classes
app.post("/make-server-2fbe5237/api/kv/classes/bulk-delete", async (c) => {
  try {
    const { classIds } = await c.req.json();
    
    if (!Array.isArray(classIds) || classIds.length === 0) {
      return c.json({ error: 'Class IDs array is required' }, 400);
    }

    const keys = classIds.map((id: string) => `${CLASS_PREFIX}${id}`);
    await kv.mdel(keys);

    console.log('✅ Bulk delete successful');
    return c.json({ message: `Successfully deleted ${classIds.length} classes` });
  } catch (error: any) {
    console.error('❌ Error bulk deleting classes:', error);
    return c.json({ error: error.message || 'Failed to delete classes' }, 500);
  }
});

// ========== SECTIONS API (KV Store based) ==========

// LIST - Get all sections with filters
app.get("/make-server-2fbe5237/api/kv/sections", async (c) => {
  try {
    const { classId, status, search } = c.req.query();

    const records = await kv.getByPrefix(SECTION_PREFIX);
    let sections = records;

    if (classId) {
      sections = sections.filter((sec: any) => sec.classId === classId);
    }
    if (status) {
      sections = sections.filter((sec: any) => sec.status === status);
    }
    if (search) {
      const searchLower = search.toLowerCase();
      sections = sections.filter((sec: any) =>
        sec.name?.toLowerCase().includes(searchLower) ||
        sec.sectionId?.toLowerCase().includes(searchLower)
      );
    }

    sections.sort((a: any, b: any) => {
      const classCompare = (a.classId || '').localeCompare(b.classId || '');
      if (classCompare !== 0) return classCompare;
      return (a.name || '').localeCompare(b.name || '');
    });

    return c.json(sections);
  } catch (error: any) {
    console.error('❌ Error fetching sections:', error);
    return c.json({ error: error.message || 'Failed to fetch sections' }, 500);
  }
});

// GET - Get single section by ID
app.get("/make-server-2fbe5237/api/kv/sections/:id", async (c) => {
  try {
    const sectionId = c.req.param('id');
    const key = `${SECTION_PREFIX}${sectionId}`;
    const section = await kv.get(key);

    if (!section) {
      return c.json({ error: 'Section not found' }, 404);
    }

    return c.json(section);
  } catch (error: any) {
    console.error('❌ Error fetching section:', error);
    return c.json({ error: error.message || 'Failed to fetch section' }, 500);
  }
});

// POST - Create new section
app.post("/make-server-2fbe5237/api/kv/sections", async (c) => {
  try {
    const body = await c.req.json();
    
    if (!body.name || !body.sectionId || !body.classId) {
      return c.json({ error: 'Name, Section ID, and Class ID are required' }, 400);
    }

    const now = new Date().toISOString();
    const newSection = {
      ...body,
      currentStrength: 0,
      createdAt: now,
      updatedAt: now,
    };

    const key = `${SECTION_PREFIX}${newSection.sectionId}`;
    await kv.set(key, newSection);

    console.log('✅ Section created:', newSection);
    return c.json(newSection, 201);
  } catch (error: any) {
    console.error('❌ Error creating section:', error);
    return c.json({ error: error.message || 'Failed to create section' }, 500);
  }
});

// PUT - Update existing section
app.put("/make-server-2fbe5237/api/kv/sections/:id", async (c) => {
  try {
    const sectionId = c.req.param('id');
    const body = await c.req.json();

    const key = `${SECTION_PREFIX}${sectionId}`;
    const existing = await kv.get(key);

    if (!existing) {
      return c.json({ error: 'Section not found' }, 404);
    }

    const now = new Date().toISOString();
    const updated = {
      ...existing,
      ...body,
      sectionId: existing.sectionId,
      updatedAt: now,
    };

    await kv.set(key, updated);

    console.log('✅ Section updated:', updated);
    return c.json(updated);
  } catch (error: any) {
    console.error('❌ Error updating section:', error);
    return c.json({ error: error.message || 'Failed to update section' }, 500);
  }
});

// DELETE - Delete section
app.delete("/make-server-2fbe5237/api/kv/sections/:id", async (c) => {
  try {
    const sectionId = c.req.param('id');
    const key = `${SECTION_PREFIX}${sectionId}`;
    
    const existing = await kv.get(key);
    if (!existing) {
      return c.json({ error: 'Section not found' }, 404);
    }

    await kv.del(key);

    console.log('✅ Section deleted');
    return c.json({ message: 'Section deleted successfully' });
  } catch (error: any) {
    console.error('❌ Error deleting section:', error);
    return c.json({ error: error.message || 'Failed to delete section' }, 500);
  }
});

// POST - Bulk delete sections
app.post("/make-server-2fbe5237/api/kv/sections/bulk-delete", async (c) => {
  try {
    const { sectionIds } = await c.req.json();
    
    if (!Array.isArray(sectionIds) || sectionIds.length === 0) {
      return c.json({ error: 'Section IDs array is required' }, 400);
    }

    const keys = sectionIds.map((id: string) => `${SECTION_PREFIX}${id}`);
    await kv.mdel(keys);

    console.log('✅ Bulk delete successful');
    return c.json({ message: `Successfully deleted ${sectionIds.length} sections` });
  } catch (error: any) {
    console.error('❌ Error bulk deleting sections:', error);
    return c.json({ error: error.message || 'Failed to delete sections' }, 500);
  }
});

// ========== SUBJECTS API ==========

const SUBJECT_PREFIX = "sems:subject:";

// LIST - Get all subjects with filters
app.get("/make-server-2fbe5237/api/kv/subjects", async (c) => {
  try {
    const { classId, teacherId } = c.req.query();
    
    const subjects = await kv.getByPrefix(SUBJECT_PREFIX);
    let filteredSubjects = subjects;

    if (classId) {
      filteredSubjects = filteredSubjects.filter((s: any) => s.classId === classId);
    }

    if (teacherId) {
      filteredSubjects = filteredSubjects.filter((s: any) => s.teacherId === teacherId);
    }

    console.log(`✅ Fetched ${filteredSubjects.length} subjects`);
    return c.json(filteredSubjects);
  } catch (error: any) {
    console.error('❌ Error fetching subjects:', error);
    return c.json({ error: error.message || 'Failed to fetch subjects' }, 500);
  }
});

// GET - Get single subject by ID
app.get("/make-server-2fbe5237/api/kv/subjects/:id", async (c) => {
  try {
    const subjectId = c.req.param('id');
    const key = `${SUBJECT_PREFIX}${subjectId}`;
    const subject = await kv.get(key);

    if (!subject) {
      return c.json({ error: 'Subject not found' }, 404);
    }

    return c.json(subject);
  } catch (error: any) {
    console.error('❌ Error fetching subject:', error);
    return c.json({ error: error.message || 'Failed to fetch subject' }, 500);
  }
});

// POST - Create new subject
app.post("/make-server-2fbe5237/api/kv/subjects", async (c) => {
  try {
    const body = await c.req.json();
    const { subject_id, subject_name, subject_code, class_id, teacher_id, total_marks } = body;

    const subject = {
      subjectId: subject_id,
      subjectName: subject_name,
      subjectCode: subject_code,
      classId: class_id,
      teacherId: teacher_id,
      totalMarks: total_marks || 100,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const key = `${SUBJECT_PREFIX}${subject.subjectId}`;
    await kv.set(key, subject);

    console.log('✅ Subject created:', subject.subjectId);
    return c.json(subject);
  } catch (error: any) {
    console.error('❌ Error creating subject:', error);
    return c.json({ error: error.message || 'Failed to create subject' }, 500);
  }
});

// PUT - Update existing subject
app.put("/make-server-2fbe5237/api/kv/subjects/:id", async (c) => {
  try {
    const subjectId = c.req.param('id');
    const body = await c.req.json();
    const key = `${SUBJECT_PREFIX}${subjectId}`;
    
    const existing = await kv.get(key);
    if (!existing) {
      return c.json({ error: 'Subject not found' }, 404);
    }

    const updated = {
      ...existing,
      ...body,
      subjectId,
      updatedAt: new Date().toISOString(),
    };

    await kv.set(key, updated);
    console.log('✅ Subject updated:', subjectId);
    return c.json(updated);
  } catch (error: any) {
    console.error('❌ Error updating subject:', error);
    return c.json({ error: error.message || 'Failed to update subject' }, 500);
  }
});

// DELETE - Delete subject
app.delete("/make-server-2fbe5237/api/kv/subjects/:id", async (c) => {
  try {
    const subjectId = c.req.param('id');
    const key = `${SUBJECT_PREFIX}${subjectId}`;
    
    await kv.del(key);
    console.log('✅ Subject deleted:', subjectId);
    return c.json({ message: 'Subject deleted successfully' });
  } catch (error: any) {
    console.error('❌ Error deleting subject:', error);
    return c.json({ error: error.message || 'Failed to delete subject' }, 500);
  }
});

// ========== EXAMS API ==========

const EXAM_PREFIX = "sems:exam:";

// LIST - Get all exams with filters
app.get("/make-server-2fbe5237/api/kv/exams", async (c) => {
  try {
    const { classId, academicYearId, status } = c.req.query();
    
    const exams = await kv.getByPrefix(EXAM_PREFIX);
    let filteredExams = exams;

    if (classId) {
      filteredExams = filteredExams.filter((e: any) => e.classId === classId);
    }

    if (academicYearId) {
      filteredExams = filteredExams.filter((e: any) => e.academicYearId === academicYearId);
    }

    if (status) {
      filteredExams = filteredExams.filter((e: any) => e.status === status);
    }

    console.log(`✅ Fetched ${filteredExams.length} exams`);
    return c.json(filteredExams);
  } catch (error: any) {
    console.error('❌ Error fetching exams:', error);
    return c.json({ error: error.message || 'Failed to fetch exams' }, 500);
  }
});

// GET - Get single exam by ID
app.get("/make-server-2fbe5237/api/kv/exams/:id", async (c) => {
  try {
    const examId = c.req.param('id');
    const key = `${EXAM_PREFIX}${examId}`;
    const exam = await kv.get(key);

    if (!exam) {
      return c.json({ error: 'Exam not found' }, 404);
    }

    return c.json(exam);
  } catch (error: any) {
    console.error('❌ Error fetching exam:', error);
    return c.json({ error: error.message || 'Failed to fetch exam' }, 500);
  }
});

// POST - Create new exam
app.post("/make-server-2fbe5237/api/kv/exams", async (c) => {
  try {
    const body = await c.req.json();
    const { exam_id, exam_name, exam_type, class_id, academic_year_id, start_date, end_date, total_marks, passing_marks, status } = body;

    const exam = {
      examId: exam_id,
      examName: exam_name,
      examType: exam_type,
      classId: class_id,
      academicYearId: academic_year_id,
      startDate: start_date,
      endDate: end_date,
      totalMarks: total_marks,
      passingMarks: passing_marks,
      status: status || 'Draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const key = `${EXAM_PREFIX}${exam.examId}`;
    await kv.set(key, exam);

    console.log('✅ Exam created:', exam.examId);
    return c.json(exam);
  } catch (error: any) {
    console.error('❌ Error creating exam:', error);
    return c.json({ error: error.message || 'Failed to create exam' }, 500);
  }
});

// PUT - Update existing exam
app.put("/make-server-2fbe5237/api/kv/exams/:id", async (c) => {
  try {
    const examId = c.req.param('id');
    const body = await c.req.json();
    const key = `${EXAM_PREFIX}${examId}`;
    
    const existing = await kv.get(key);
    if (!existing) {
      return c.json({ error: 'Exam not found' }, 404);
    }

    const updated = {
      ...existing,
      ...body,
      examId,
      updatedAt: new Date().toISOString(),
    };

    await kv.set(key, updated);
    console.log('✅ Exam updated:', examId);
    return c.json(updated);
  } catch (error: any) {
    console.error('❌ Error updating exam:', error);
    return c.json({ error: error.message || 'Failed to update exam' }, 500);
  }
});

// DELETE - Delete exam
app.delete("/make-server-2fbe5237/api/kv/exams/:id", async (c) => {
  try {
    const examId = c.req.param('id');
    const key = `${EXAM_PREFIX}${examId}`;
    
    await kv.del(key);
    console.log('✅ Exam deleted:', examId);
    return c.json({ message: 'Exam deleted successfully' });
  } catch (error: any) {
    console.error('❌ Error deleting exam:', error);
    return c.json({ error: error.message || 'Failed to delete exam' }, 500);
  }
});

// ========== MARKS API ==========

const MARK_PREFIX = "sems:mark:";

// LIST - Get all marks with filters
app.get("/make-server-2fbe5237/api/kv/marks", async (c) => {
  try {
    const { studentId, examId, subjectId } = c.req.query();
    
    const marks = await kv.getByPrefix(MARK_PREFIX);
    let filteredMarks = marks;

    if (studentId) {
      filteredMarks = filteredMarks.filter((m: any) => m.studentId === studentId);
    }

    if (examId) {
      filteredMarks = filteredMarks.filter((m: any) => m.examId === examId);
    }

    if (subjectId) {
      filteredMarks = filteredMarks.filter((m: any) => m.subjectId === subjectId);
    }

    console.log(`✅ Fetched ${filteredMarks.length} marks`);
    return c.json(filteredMarks);
  } catch (error: any) {
    console.error('❌ Error fetching marks:', error);
    return c.json({ error: error.message || 'Failed to fetch marks' }, 500);
  }
});

// GET - Get single mark by ID
app.get("/make-server-2fbe5237/api/kv/marks/:id", async (c) => {
  try {
    const markId = c.req.param('id');
    const key = `${MARK_PREFIX}${markId}`;
    const mark = await kv.get(key);

    if (!mark) {
      return c.json({ error: 'Mark not found' }, 404);
    }

    return c.json(mark);
  } catch (error: any) {
    console.error('❌ Error fetching mark:', error);
    return c.json({ error: error.message || 'Failed to fetch mark' }, 500);
  }
});

// POST - Create new mark
app.post("/make-server-2fbe5237/api/kv/marks", async (c) => {
  try {
    const body = await c.req.json();
    const { mark_id, student_id, exam_id, subject_id, marks_obtained, total_marks, remarks } = body;

    const mark = {
      markId: mark_id,
      studentId: student_id,
      examId: exam_id,
      subjectId: subject_id,
      marksObtained: marks_obtained,
      totalMarks: total_marks || 100,
      remarks: remarks || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const key = `${MARK_PREFIX}${mark.markId}`;
    await kv.set(key, mark);

    console.log('✅ Mark created:', mark.markId);
    return c.json(mark);
  } catch (error: any) {
    console.error('❌ Error creating mark:', error);
    return c.json({ error: error.message || 'Failed to create mark' }, 500);
  }
});

// PUT - Update existing mark
app.put("/make-server-2fbe5237/api/kv/marks/:id", async (c) => {
  try {
    const markId = c.req.param('id');
    const body = await c.req.json();
    const key = `${MARK_PREFIX}${markId}`;
    
    const existing = await kv.get(key);
    if (!existing) {
      return c.json({ error: 'Mark not found' }, 404);
    }

    const updated = {
      ...existing,
      ...body,
      markId,
      updatedAt: new Date().toISOString(),
    };

    await kv.set(key, updated);
    console.log('✅ Mark updated:', markId);
    return c.json(updated);
  } catch (error: any) {
    console.error('❌ Error updating mark:', error);
    return c.json({ error: error.message || 'Failed to update mark' }, 500);
  }
});

// DELETE - Delete mark
app.delete("/make-server-2fbe5237/api/kv/marks/:id", async (c) => {
  try {
    const markId = c.req.param('id');
    const key = `${MARK_PREFIX}${markId}`;
    
    await kv.del(key);
    console.log('✅ Mark deleted:', markId);
    return c.json({ message: 'Mark deleted successfully' });
  } catch (error: any) {
    console.error('❌ Error deleting mark:', error);
    return c.json({ error: error.message || 'Failed to delete mark' }, 500);
  }
});

// ========== ACADEMIC YEARS API ==========

const ACADEMIC_YEAR_PREFIX = "sems:academic_year:";

// LIST - Get all academic years
app.get("/make-server-2fbe5237/api/kv/academic-years", async (c) => {
  try {
    const academicYears = await kv.getByPrefix(ACADEMIC_YEAR_PREFIX);
    console.log(`✅ Fetched ${academicYears.length} academic years`);
    return c.json(academicYears);
  } catch (error: any) {
    console.error('❌ Error fetching academic years:', error);
    return c.json({ error: error.message || 'Failed to fetch academic years' }, 500);
  }
});

// GET - Get single academic year by ID
app.get("/make-server-2fbe5237/api/kv/academic-years/:id", async (c) => {
  try {
    const yearId = c.req.param('id');
    const key = `${ACADEMIC_YEAR_PREFIX}${yearId}`;
    const year = await kv.get(key);

    if (!year) {
      return c.json({ error: 'Academic year not found' }, 404);
    }

    return c.json(year);
  } catch (error: any) {
    console.error('❌ Error fetching academic year:', error);
    return c.json({ error: error.message || 'Failed to fetch academic year' }, 500);
  }
});

// POST - Create new academic year
app.post("/make-server-2fbe5237/api/kv/academic-years", async (c) => {
  try {
    const body = await c.req.json();
    const { academic_year_id, year_name, start_date, end_date, is_current } = body;

    const academicYear = {
      academicYearId: academic_year_id,
      yearName: year_name,
      startDate: start_date,
      endDate: end_date,
      isCurrent: is_current || false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const key = `${ACADEMIC_YEAR_PREFIX}${academicYear.academicYearId}`;
    await kv.set(key, academicYear);

    console.log('✅ Academic year created:', academicYear.academicYearId);
    return c.json(academicYear);
  } catch (error: any) {
    console.error('❌ Error creating academic year:', error);
    return c.json({ error: error.message || 'Failed to create academic year' }, 500);
  }
});

// PUT - Update existing academic year
app.put("/make-server-2fbe5237/api/kv/academic-years/:id", async (c) => {
  try {
    const yearId = c.req.param('id');
    const body = await c.req.json();
    const key = `${ACADEMIC_YEAR_PREFIX}${yearId}`;
    
    const existing = await kv.get(key);
    if (!existing) {
      return c.json({ error: 'Academic year not found' }, 404);
    }

    const updated = {
      ...existing,
      ...body,
      academicYearId: yearId,
      updatedAt: new Date().toISOString(),
    };

    await kv.set(key, updated);
    console.log('✅ Academic year updated:', yearId);
    return c.json(updated);
  } catch (error: any) {
    console.error('❌ Error updating academic year:', error);
    return c.json({ error: error.message || 'Failed to update academic year' }, 500);
  }
});

// DELETE - Delete academic year
app.delete("/make-server-2fbe5237/api/kv/academic-years/:id", async (c) => {
  try {
    const yearId = c.req.param('id');
    const key = `${ACADEMIC_YEAR_PREFIX}${yearId}`;
    
    await kv.del(key);
    console.log('✅ Academic year deleted:', yearId);
    return c.json({ message: 'Academic year deleted successfully' });
  } catch (error: any) {
    console.error('❌ Error deleting academic year:', error);
    return c.json({ error: error.message || 'Failed to delete academic year' }, 500);
  }
});

// ========== RESULTS API ==========

const RESULT_PREFIX = "sems:result:";

// Helper function to calculate grade based on percentage
function calculateGrade(percentage: number): string {
  if (percentage >= 90) return 'A+';
  if (percentage >= 80) return 'A';
  if (percentage >= 70) return 'B+';
  if (percentage >= 60) return 'B';
  if (percentage >= 50) return 'C';
  if (percentage >= 40) return 'D';
  return 'F';
}

// Helper function to determine if student passed
function isPassed(percentage: number): boolean {
  return percentage >= 40; // Assuming 40% is passing
}

// LIST - Get all results with filters
app.get("/make-server-2fbe5237/api/kv/results", async (c) => {
  try {
    const { studentId, examId, classId, status } = c.req.query();
    
    const results = await kv.getByPrefix(RESULT_PREFIX);
    let filteredResults = results;

    if (studentId) {
      filteredResults = filteredResults.filter((r: any) => r.studentId === studentId);
    }

    if (examId) {
      filteredResults = filteredResults.filter((r: any) => r.examId === examId);
    }

    if (classId) {
      filteredResults = filteredResults.filter((r: any) => r.classId === classId);
    }

    if (status) {
      filteredResults = filteredResults.filter((r: any) => r.status === status);
    }

    console.log(`✅ Fetched ${filteredResults.length} results`);
    return c.json(filteredResults);
  } catch (error: any) {
    console.error('❌ Error fetching results:', error);
    return c.json({ error: error.message || 'Failed to fetch results' }, 500);
  }
});

// VIEW - Get single result by ID
app.get("/make-server-2fbe5237/api/kv/results/:id", async (c) => {
  try {
    const resultId = c.req.param('id');
    const key = `${RESULT_PREFIX}${resultId}`;
    
    const result = await kv.get(key);
    if (!result) {
      return c.json({ error: 'Result not found' }, 404);
    }

    console.log('✅ Fetched result:', resultId);
    return c.json(result);
  } catch (error: any) {
    console.error('❌ Error fetching result:', error);
    return c.json({ error: error.message || 'Failed to fetch result' }, 500);
  }
});

// CREATE - Generate result for a student in an exam
app.post("/make-server-2fbe5237/api/kv/results", async (c) => {
  try {
    const body = await c.req.json();
    
    // Validate required fields
    const required = ['resultId', 'studentId', 'examId', 'classId'];
    for (const field of required) {
      if (!body[field]) {
        return c.json({ error: `Missing required field: ${field}` }, 400);
      }
    }

    // Calculate totals and percentages
    const subjects = body.subjects || [];
    const totalMarksObtained = subjects.reduce((sum: number, s: any) => sum + (s.marksObtained || 0), 0);
    const totalMaxMarks = subjects.reduce((sum: number, s: any) => sum + (s.maxMarks || 0), 0);
    const percentage = totalMaxMarks > 0 ? (totalMarksObtained / totalMaxMarks) * 100 : 0;
    const grade = calculateGrade(percentage);
    const passed = isPassed(percentage);

    // Add grades to each subject
    const subjectsWithGrades = subjects.map((s: any) => {
      const subjectPercentage = s.maxMarks > 0 ? (s.marksObtained / s.maxMarks) * 100 : 0;
      return {
        ...s,
        percentage: Math.round(subjectPercentage * 100) / 100,
        grade: calculateGrade(subjectPercentage),
        isPassed: isPassed(subjectPercentage),
      };
    });

    const result = {
      resultId: body.resultId,
      studentId: body.studentId,
      studentName: body.studentName || '',
      examId: body.examId,
      examName: body.examName || '',
      classId: body.classId,
      totalMarksObtained,
      totalMaxMarks,
      percentage: Math.round(percentage * 100) / 100,
      grade,
      isPassed: passed,
      subjects: subjectsWithGrades,
      rank: body.rank || null,
      status: body.status || 'Draft',
      remarks: body.remarks || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const key = `${RESULT_PREFIX}${body.resultId}`;
    await kv.set(key, result);

    console.log('✅ Result created:', body.resultId);
    return c.json(result, 201);
  } catch (error: any) {
    console.error('❌ Error creating result:', error);
    return c.json({ error: error.message || 'Failed to create result' }, 500);
  }
});

// UPDATE - Update result
app.put("/make-server-2fbe5237/api/kv/results/:id", async (c) => {
  try {
    const resultId = c.req.param('id');
    const body = await c.req.json();
    const key = `${RESULT_PREFIX}${resultId}`;
    
    const existing = await kv.get(key);
    if (!existing) {
      return c.json({ error: 'Result not found' }, 404);
    }

    // Recalculate if subjects changed
    const subjects = body.subjects || existing.subjects || [];
    const totalMarksObtained = subjects.reduce((sum: number, s: any) => sum + (s.marksObtained || 0), 0);
    const totalMaxMarks = subjects.reduce((sum: number, s: any) => sum + (s.maxMarks || 0), 0);
    const percentage = totalMaxMarks > 0 ? (totalMarksObtained / totalMaxMarks) * 100 : 0;
    const grade = calculateGrade(percentage);
    const passed = isPassed(percentage);

    const subjectsWithGrades = subjects.map((s: any) => {
      const subjectPercentage = s.maxMarks > 0 ? (s.marksObtained / s.maxMarks) * 100 : 0;
      return {
        ...s,
        percentage: Math.round(subjectPercentage * 100) / 100,
        grade: calculateGrade(subjectPercentage),
        isPassed: isPassed(subjectPercentage),
      };
    });

    const updated = {
      ...existing,
      ...body,
      resultId,
      totalMarksObtained,
      totalMaxMarks,
      percentage: Math.round(percentage * 100) / 100,
      grade,
      isPassed: passed,
      subjects: subjectsWithGrades,
      updatedAt: new Date().toISOString(),
    };

    await kv.set(key, updated);

    console.log('✅ Result updated:', resultId);
    return c.json(updated);
  } catch (error: any) {
    console.error('❌ Error updating result:', error);
    return c.json({ error: error.message || 'Failed to update result' }, 500);
  }
});

// DELETE - Delete result
app.delete("/make-server-2fbe5237/api/kv/results/:id", async (c) => {
  try {
    const resultId = c.req.param('id');
    const key = `${RESULT_PREFIX}${resultId}`;
    
    const existing = await kv.get(key);
    if (!existing) {
      return c.json({ error: 'Result not found' }, 404);
    }

    await kv.del(key);

    console.log('✅ Result deleted:', resultId);
    return c.json({ message: 'Result deleted successfully' });
  } catch (error: any) {
    console.error('❌ Error deleting result:', error);
    return c.json({ error: error.message || 'Failed to delete result' }, 500);
  }
});

// POST - Publish/Unpublish results
app.post("/make-server-2fbe5237/api/kv/results/:id/publish", async (c) => {
  try {
    const resultId = c.req.param('id');
    const { status } = await c.req.json(); // 'Published' or 'Draft'
    const key = `${RESULT_PREFIX}${resultId}`;
    
    const existing = await kv.get(key);
    if (!existing) {
      return c.json({ error: 'Result not found' }, 404);
    }

    const updated = {
      ...existing,
      status,
      updatedAt: new Date().toISOString(),
    };

    await kv.set(key, updated);

    console.log(`✅ Result ${status === 'Published' ? 'published' : 'unpublished'}:`, resultId);
    return c.json(updated);
  } catch (error: any) {
    console.error('❌ Error updating result status:', error);
    return c.json({ error: error.message || 'Failed to update result status' }, 500);
  }
});

// POST - Bulk delete results
app.post("/make-server-2fbe5237/api/kv/results/bulk-delete", async (c) => {
  try {
    const { resultIds } = await c.req.json();
    
    if (!Array.isArray(resultIds) || resultIds.length === 0) {
      return c.json({ error: 'Result IDs array is required' }, 400);
    }

    const keys = resultIds.map((id: string) => `${RESULT_PREFIX}${id}`);
    await kv.mdel(keys);

    console.log('✅ Bulk delete successful');
    return c.json({ message: `Successfully deleted ${resultIds.length} results` });
  } catch (error: any) {
    console.error('❌ Error bulk deleting results:', error);
    return c.json({ error: error.message || 'Failed to delete results' }, 500);
  }
});

// POST - Calculate ranks for an exam
app.post("/make-server-2fbe5237/api/kv/results/calculate-ranks/:examId", async (c) => {
  try {
    const examId = c.req.param('examId');
    
    // Get all results for this exam
    const allResults = await kv.getByPrefix(RESULT_PREFIX);
    const examResults = allResults.filter((r: any) => r.examId === examId);

    if (examResults.length === 0) {
      return c.json({ error: 'No results found for this exam' }, 404);
    }

    // Sort by percentage descending
    const sortedResults = examResults.sort((a: any, b: any) => b.percentage - a.percentage);

    // Assign ranks
    for (let i = 0; i < sortedResults.length; i++) {
      const result = sortedResults[i];
      result.rank = i + 1;
      result.updatedAt = new Date().toISOString();
      const key = `${RESULT_PREFIX}${result.resultId}`;
      await kv.set(key, result);
    }

    console.log(`✅ Calculated ranks for ${sortedResults.length} results`);
    return c.json({ message: `Successfully calculated ranks for ${sortedResults.length} students` });
  } catch (error: any) {
    console.error('❌ Error calculating ranks:', error);
    return c.json({ error: error.message || 'Failed to calculate ranks' }, 500);
  }
});

// ========== REPORT CARDS API ==========

// GET - Generate report card for a student in an exam
app.get("/make-server-2fbe5237/api/kv/report-cards/:studentId/:examId", async (c) => {
  try {
    const studentId = c.req.param('studentId');
    const examId = c.req.param('examId');

    console.log(`📊 Generating report card for student ${studentId}, exam ${examId}`);

    // 1. Fetch Student Information (from KV Store)
    const studentData = await kv.get(`sems:student:${studentId}`);

    if (!studentData) {
      return c.json({ error: 'Student not found' }, 404);
    }

    // 2. Fetch Exam Information (from KV)
    const examKey = `${EXAM_PREFIX}${examId}`;
    const examData = await kv.get(examKey);

    if (!examData) {
      return c.json({ error: 'Exam not found' }, 404);
    }

    // 3. Fetch Result (from KV)
    const allResults = await kv.getByPrefix(RESULT_PREFIX);
    const resultData = allResults.find((r: any) => 
      r.studentId === studentId && r.examId === examId
    );

    if (!resultData) {
      return c.json({ error: 'Result not found for this student and exam' }, 404);
    }

    // 4. Fetch All Marks for this student and exam (from KV)
    const allMarks = await kv.getByPrefix(MARK_PREFIX);
    const studentMarks = allMarks.filter((m: any) => 
      m.studentId === studentId && m.examId === examId
    );

    // 5. Fetch Subject Information for each mark
    const subjectsWithMarks = [];
    for (const mark of studentMarks) {
      const subjectKey = `${SUBJECT_PREFIX}${mark.subjectId}`;
      const subjectData = await kv.get(subjectKey);

      if (subjectData) {
        const percentage = mark.totalMarks > 0 
          ? (mark.marksObtained / mark.totalMarks) * 100 
          : 0;
        const grade = calculateGrade(percentage);
        const passed = isPassed(percentage);

        subjectsWithMarks.push({
          subjectId: mark.subjectId,
          subjectName: subjectData.subjectName || subjectData.subject_name,
          subjectCode: subjectData.subjectCode || subjectData.subject_code,
          marksObtained: mark.marksObtained,
          totalMarks: mark.totalMarks,
          percentage: percentage.toFixed(2),
          grade,
          isPassed: passed,
          remarks: mark.remarks || '',
        });
      }
    }

    // 6. Fetch Class and Section names
    const classKey = `${CLASS_PREFIX}${studentData.classid}`;
    const sectionKey = `${SECTION_PREFIX}${studentData.sectionid}`;
    const classData = await kv.get(classKey);
    const sectionData = await kv.get(sectionKey);

    // 7. Generate teacher remarks based on percentage
    let teacherRemarks = '';
    const percentage = resultData.percentage || 0;
    if (percentage >= 90) {
      teacherRemarks = 'Outstanding performance! Keep up the excellent work.';
    } else if (percentage >= 80) {
      teacherRemarks = 'Excellent work! Well done.';
    } else if (percentage >= 70) {
      teacherRemarks = 'Very good performance. Continue to excel.';
    } else if (percentage >= 60) {
      teacherRemarks = 'Good effort. Focus on improvement in weaker areas.';
    } else if (percentage >= 50) {
      teacherRemarks = 'Satisfactory performance. More effort needed.';
    } else if (percentage >= 40) {
      teacherRemarks = 'Needs improvement. Please work harder and seek help when needed.';
    } else {
      teacherRemarks = 'Poor performance. Immediate attention and extra effort required.';
    }

    // 8. Construct the report card response
    const reportCard = {
      // Student Information
      student: {
        studentId: studentData.studentid,
        name: studentData.name,
        rollNo: studentData.rollno,
        classId: studentData.classid,
        className: classData?.name || studentData.classid,
        sectionId: studentData.sectionid,
        sectionName: sectionData?.name || studentData.sectionid,
        dateOfBirth: studentData.dateofbirth,
        gender: studentData.gender,
        email: studentData.email,
        phone: studentData.phone,
        avatar: studentData.avatar,
      },

      // Exam Information
      exam: {
        examId: examData.examId,
        examName: examData.examName,
        examType: examData.examType,
        academicYearId: examData.academicYearId,
        startDate: examData.startDate,
        endDate: examData.endDate,
        totalMarks: examData.totalMarks,
        passingMarks: examData.passingMarks,
      },

      // Subject-wise marks
      subjects: subjectsWithMarks.sort((a: any, b: any) => 
        a.subjectName.localeCompare(b.subjectName)
      ),

      // Overall Result
      result: {
        resultId: resultData.resultId,
        totalMarksObtained: resultData.totalMarksObtained,
        totalMaxMarks: resultData.totalMaxMarks,
        percentage: resultData.percentage,
        grade: resultData.grade,
        rank: resultData.rank || '-',
        status: resultData.status,
        isPassed: resultData.isPassed,
        publishedAt: resultData.publishedAt,
      },

      // Remarks
      remarks: {
        teacher: teacherRemarks,
        custom: resultData.remarks || '',
      },

      // Metadata
      generatedAt: new Date().toISOString(),
      issueDate: new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
    };

    console.log(`✅ Report card generated successfully`);
    return c.json(reportCard);
  } catch (error: any) {
    console.error('❌ Error generating report card:', error);
    return c.json({ error: error.message || 'Failed to generate report card' }, 500);
  }
});

// LIST - Get all available report cards
app.get("/make-server-2fbe5237/api/kv/report-cards", async (c) => {
  try {
    const { examId, classId, studentId } = c.req.query();

    console.log(`📊 Fetching report cards list`);

    // Get all results (report cards are based on results)
    const allResults = await kv.getByPrefix(RESULT_PREFIX);
    let filteredResults = allResults;

    // Apply filters
    if (examId) {
      filteredResults = filteredResults.filter((r: any) => r.examId === examId);
    }
    if (classId) {
      filteredResults = filteredResults.filter((r: any) => r.classId === classId);
    }
    if (studentId) {
      filteredResults = filteredResults.filter((r: any) => r.studentId === studentId);
    }

    // Fetch student and exam names for each result
    const reportCardsList = [];

    for (const result of filteredResults) {
      // Fetch student name from KV Store
      const studentData = await kv.get(`sems:student:${result.studentId}`);

      // Fetch exam name
      const examKey = `${EXAM_PREFIX}${result.examId}`;
      const examData = await kv.get(examKey);

      reportCardsList.push({
        resultId: result.resultId,
        studentId: result.studentId,
        studentName: studentData?.name || 'Unknown',
        rollNo: studentData?.roll_no || studentData?.rollNo || '-',
        examId: result.examId,
        examName: examData?.examName || 'Unknown',
        classId: result.classId,
        percentage: result.percentage,
        grade: result.grade,
        rank: result.rank || '-',
        status: result.status,
        isPassed: result.isPassed,
        publishedAt: result.publishedAt,
      });
    }

    // Sort by class, then by student name
    reportCardsList.sort((a: any, b: any) => {
      const classCompare = a.classId.localeCompare(b.classId);
      if (classCompare !== 0) return classCompare;
      return a.studentName.localeCompare(b.studentName);
    });

    console.log(`✅ Fetched ${reportCardsList.length} report cards`);
    return c.json(reportCardsList);
  } catch (error: any) {
    console.error('❌ Error fetching report cards:', error);
    return c.json({ error: error.message || 'Failed to fetch report cards' }, 500);
  }
});

// ========== TIMETABLE API (KV Store based) ==========

const TIMETABLE_PREFIX = "sems:timetable:";

// LIST - Get all timetable entries with filters
app.get("/make-server-2fbe5237/api/kv/timetable", async (c) => {
  try {
    const { examId, classId, subjectId, date } = c.req.query();
    
    console.log('📖 Fetching timetable entries from KV store...');
    const allEntries = await kv.getByPrefix(TIMETABLE_PREFIX);
    console.log(`Found ${allEntries.length} timetable entries`);

    let entries = allEntries;

    // Filter by examId
    if (examId) {
      entries = entries.filter((entry: any) => entry.examId === examId);
    }

    // Filter by classId
    if (classId) {
      entries = entries.filter((entry: any) => entry.classId === classId);
    }

    // Filter by subjectId
    if (subjectId) {
      entries = entries.filter((entry: any) => entry.subjectId === subjectId);
    }

    // Filter by date
    if (date) {
      entries = entries.filter((entry: any) => entry.date === date);
    }

    // Sort by date and time
    entries.sort((a: any, b: any) => {
      const dateCompare = a.date.localeCompare(b.date);
      if (dateCompare !== 0) return dateCompare;
      return a.startTime.localeCompare(b.startTime);
    });

    console.log(`✅ Returning ${entries.length} filtered timetable entries`);
    return c.json(entries);
  } catch (error: any) {
    console.error('❌ Error fetching timetable:', error);
    return c.json({ error: error.message || 'Failed to fetch timetable' }, 500);
  }
});

// GET - Get single timetable entry by ID
app.get("/make-server-2fbe5237/api/kv/timetable/:id", async (c) => {
  try {
    const timetableId = c.req.param('id');
    const key = `${TIMETABLE_PREFIX}${timetableId}`;
    
    console.log(`📖 Fetching timetable entry: ${timetableId}`);
    const entry = await kv.get(key);

    if (!entry) {
      console.log(`❌ Timetable entry not found: ${timetableId}`);
      return c.json({ error: 'Timetable entry not found' }, 404);
    }

    console.log(`✅ Fetched timetable entry: ${timetableId}`);
    return c.json(entry);
  } catch (error: any) {
    console.error('❌ Error fetching timetable entry:', error);
    return c.json({ error: error.message || 'Failed to fetch timetable entry' }, 500);
  }
});

// CREATE - Create new timetable entry
app.post("/make-server-2fbe5237/api/kv/timetable", async (c) => {
  try {
    const body = await c.req.json();
    const { timetableId, ...rest } = body;

    if (!timetableId) {
      return c.json({ error: 'Timetable ID is required' }, 400);
    }

    const key = `${TIMETABLE_PREFIX}${timetableId}`;
    
    // Check if already exists
    const existing = await kv.get(key);
    if (existing) {
      return c.json({ error: 'Timetable entry already exists' }, 409);
    }

    console.log(`➕ Creating timetable entry: ${timetableId}`);
    await kv.set(key, body);

    console.log(`✅ Created timetable entry: ${timetableId}`);
    return c.json(body, 201);
  } catch (error: any) {
    console.error('❌ Error creating timetable entry:', error);
    return c.json({ error: error.message || 'Failed to create timetable entry' }, 500);
  }
});

// UPDATE - Update existing timetable entry
app.put("/make-server-2fbe5237/api/kv/timetable/:id", async (c) => {
  try {
    const timetableId = c.req.param('id');
    const key = `${TIMETABLE_PREFIX}${timetableId}`;
    
    // Check if exists
    const existing = await kv.get(key);
    if (!existing) {
      return c.json({ error: 'Timetable entry not found' }, 404);
    }

    const body = await c.req.json();
    
    console.log(`✏️ Updating timetable entry: ${timetableId}`);
    await kv.set(key, body);

    console.log(`✅ Updated timetable entry: ${timetableId}`);
    return c.json(body);
  } catch (error: any) {
    console.error('❌ Error updating timetable entry:', error);
    return c.json({ error: error.message || 'Failed to update timetable entry' }, 500);
  }
});

// DELETE - Delete timetable entry
app.delete("/make-server-2fbe5237/api/kv/timetable/:id", async (c) => {
  try {
    const timetableId = c.req.param('id');
    const key = `${TIMETABLE_PREFIX}${timetableId}`;
    
    // Check if exists
    const existing = await kv.get(key);
    if (!existing) {
      return c.json({ error: 'Timetable entry not found' }, 404);
    }

    console.log(`🗑️ Deleting timetable entry: ${timetableId}`);
    await kv.del(key);

    console.log(`✅ Deleted timetable entry: ${timetableId}`);
    return c.json({ message: 'Timetable entry deleted successfully' });
  } catch (error: any) {
    console.error('❌ Error deleting timetable entry:', error);
    return c.json({ error: error.message || 'Failed to delete timetable entry' }, 500);
  }
});

// ========== SETTINGS API (KV Store based) ==========

const SETTINGS_PREFIX = "sems:settings:";

// GET - Get all settings
app.get("/make-server-2fbe5237/api/kv/settings", async (c) => {
  try {
    console.log('📖 Fetching all settings from KV store...');
    const allSettings = await kv.getByPrefix(SETTINGS_PREFIX);
    
    // Convert array to object for easier access
    const settingsObj: any = {};
    allSettings.forEach((setting: any) => {
      const key = setting.key?.replace(SETTINGS_PREFIX, '') || setting.category;
      settingsObj[key] = setting;
    });

    console.log(`✅ Fetched ${allSettings.length} setting categories`);
    return c.json(settingsObj);
  } catch (error: any) {
    console.error('❌ Error fetching settings:', error);
    return c.json({ error: error.message || 'Failed to fetch settings' }, 500);
  }
});

// GET - Get specific settings category
app.get("/make-server-2fbe5237/api/kv/settings/:category", async (c) => {
  try {
    const category = c.req.param('category');
    const key = `${SETTINGS_PREFIX}${category}`;
    
    console.log(`📖 Fetching settings for category: ${category}`);
    const settings = await kv.get(key);

    if (!settings) {
      console.log(`⚠️ Settings not found for category: ${category}, returning defaults`);
      // Return default settings based on category
      const defaults = getDefaultSettings(category);
      return c.json(defaults);
    }

    console.log(`✅ Fetched settings for category: ${category}`);
    return c.json(settings);
  } catch (error: any) {
    console.error('❌ Error fetching settings category:', error);
    return c.json({ error: error.message || 'Failed to fetch settings category' }, 500);
  }
});

// PUT - Update settings for a specific category
app.put("/make-server-2fbe5237/api/kv/settings/:category", async (c) => {
  try {
    const category = c.req.param('category');
    const key = `${SETTINGS_PREFIX}${category}`;
    const body = await c.req.json();

    // Add metadata
    const settingsData = {
      ...body,
      category,
      key,
      updatedAt: new Date().toISOString(),
    };

    console.log(`✏️ Updating settings for category: ${category}`);
    await kv.set(key, settingsData);

    console.log(`✅ Updated settings for category: ${category}`);
    return c.json(settingsData);
  } catch (error: any) {
    console.error('❌ Error updating settings:', error);
    return c.json({ error: error.message || 'Failed to update settings' }, 500);
  }
});

// Helper function to return default settings
function getDefaultSettings(category: string) {
  const defaults: any = {
    general: {
      category: 'general',
      schoolName: 'Demo School',
      schoolAddress: '123 Education Street',
      schoolPhone: '+1234567890',
      schoolEmail: 'info@demoschool.edu',
      schoolWebsite: 'www.demoschool.edu',
      principalName: 'Dr. Principal Name',
      academicYearStart: '04-01',
      academicYearEnd: '03-31',
    },
    grading: {
      category: 'grading',
      passingMarks: 40,
      gradeRules: [
        { min: 90, max: 100, grade: 'A+', gpa: 10, color: '#10b981' },
        { min: 80, max: 89, grade: 'A', gpa: 9, color: '#3b82f6' },
        { min: 70, max: 79, grade: 'B+', gpa: 8, color: '#6366f1' },
        { min: 60, max: 69, grade: 'B', gpa: 7, color: '#8b5cf6' },
        { min: 50, max: 59, grade: 'C', gpa: 6, color: '#f59e0b' },
        { min: 40, max: 49, grade: 'D', gpa: 5, color: '#f97316' },
        { min: 0, max: 39, grade: 'F', gpa: 0, color: '#ef4444' },
      ],
    },
    preferences: {
      category: 'preferences',
      theme: 'light',
      sidebarPosition: 'left',
      dateFormat: 'YYYY-MM-DD',
      timeFormat: '24h',
      language: 'en',
    },
    system: {
      category: 'system',
      defaultExamTypes: ['Mid-Term', 'Final', 'Unit Test', 'Quarterly'],
      defaultTerms: ['Term 1', 'Term 2'],
      enableNotifications: true,
      enableEmailReports: true,
      autoPublishResults: false,
      allowStudentViewMarks: true,
      allowParentViewMarks: true,
    },
  };

  return defaults[category] || { category, message: 'No default settings available' };
}

// ========== DATA MANAGEMENT API ==========

// DELETE - Clear ALL data (KV + Postgres)
app.delete("/make-server-2fbe5237/api/data/clear-everything", async (c) => {
  try {
    console.log('🗑️🗑️🗑️ CLEARING ALL DATA FROM SYSTEM...');
    
    // Helper function to get keys directly from database (FIXED APPROACH)
    const getKeysByPrefix = async (prefix: string): Promise<string[]> => {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from("kv_store_2fbe5237")
        .select("key")
        .like("key", prefix + "%");
      
      if (error) {
        console.error(`Error fetching keys for ${prefix}:`, error);
        return [];
      }
      
      return data?.map((d) => d.key) ?? [];
    };
    
    // Clear KV store data
    const prefixes = [
      'teacher:',
      'class:',
      'section:',
      'sems:student:',
      'sems:subject:',
      'sems:exam:',
      'sems:timetable:',
      'sems:academic_year:',  // Fixed: was 'sems:academicyear:' (missing underscore)
      'sems:mark:',
      'sems:result:',
      'sems:reportcard:',
    ];

    let totalKVDeleted = 0;
    
    for (const prefix of prefixes) {
      try {
        console.log(`🔍 Fetching keys for prefix: ${prefix}`);
        
        // NEW APPROACH: Query database directly for keys (no ID reconstruction needed!)
        const keys = await getKeysByPrefix(prefix);
        console.log(`✅ Found ${keys.length} keys for ${prefix}`);
        
        if (keys.length > 0) {
          console.log(`🗑️ Deleting ${keys.length} keys from ${prefix}`);
          await kv.mdel(keys);
          totalKVDeleted += keys.length;
          console.log(`✅ Deleted ${keys.length} entries from ${prefix}`);
        }
      } catch (prefixError: any) {
        console.error(`❌ Error clearing prefix ${prefix}:`, prefixError);
      }
    }

    console.log(`✅✅✅ CLEARED ALL DATA: ${totalKVDeleted} KV entries from Postgres kv_store_2fbe5237 table`);
    return c.json({ 
      message: 'All data cleared successfully!', 
      kvDeleted: totalKVDeleted,
      storage: 'Postgres KV Store (kv_store_2fbe5237)'
    });
  } catch (error: any) {
    console.error('❌ Error clearing all data:', error);
    return c.json({ error: error.message || 'Failed to clear all data' }, 500);
  }
});

// DELETE - Clear specific module data
app.delete("/make-server-2fbe5237/api/data/clear/:module", async (c) => {
  try {
    const module = c.req.param('module');
    console.log(`🗑️ Clearing ${module} data...`);
    
    const prefixMap: any = {
      'teachers': 'teacher:',
      'classes': 'class:',
      'sections': 'section:',
      'students': 'sems:student:',
      'subjects': 'sems:subject:',
      'exams': 'sems:exam:',
      'timetable': 'sems:timetable:',
      'academicyears': 'sems:academic_year:',  // Fixed: was 'sems:academicyear:'
      'marks': 'sems:mark:',
      'marks-entry': 'sems:mark:',
      'results': 'sems:result:',
      'reportcards': 'sems:reportcard:',
    };

    const prefix = prefixMap[module];
    
    if (!prefix && module !== 'students' && module !== 'marks-entry') {
      return c.json({ error: `Unknown module: ${module}` }, 400);
    }

    // Clear from KV store (all data now in KV store)
    console.log(`🔍 Fetching keys for ${module} with prefix: ${prefix}`);
    const supabase = getSupabaseClient();
    const { data: keyData, error: keyError } = await supabase
      .from("kv_store_2fbe5237")
      .select("key")
      .like("key", prefix + "%");
    
    if (keyError) {
      console.error(`Error fetching keys for ${module}:`, keyError);
      throw keyError;
    }
    
    const keys = keyData?.map((d) => d.key) ?? [];
    console.log(`✅ Found ${keys.length} keys for ${module}`);
    
    if (keys.length > 0) {
      console.log(`🗑️ Deleting ${keys.length} ${module} entries from KV store`);
      await kv.mdel(keys);
      console.log(`✅ Deleted ${keys.length} ${module} entries from KV store`);
      return c.json({ 
        message: `${module} cleared successfully`, 
        deletedCount: keys.length,
        source: 'kv-store'
      });
    }
    
    return c.json({ 
      message: `No ${module} data found to clear`,
      deletedCount: 0
    });
    
  } catch (error: any) {
    console.error('❌ Error clearing module data:', error);
    return c.json({ error: error.message || 'Failed to clear module data' }, 500);
  }
});

// GET - Diagnostic: Show all data in the system
app.get("/make-server-2fbe5237/api/data/diagnostic", async (c) => {
  try {
    console.log('🔍 Running diagnostic...');
    
    const prefixes = [
      'teacher:',
      'class:',
      'section:',
      'sems:student:',
      'sems:subject:',
      'sems:exam:',
      'sems:timetable:',
      'sems:academic_year:',  // Fixed: was 'sems:academicyear:'
      'sems:mark:',
      'sems:result:',
      'sems:reportcard:',
    ];

    const diagnostic: any = {
      kvStore: {},
      postgres: {},
      timestamp: new Date().toISOString()
    };
    
    // Check KV store
    for (const prefix of prefixes) {
      try {
        const entries = await kv.getByPrefix(prefix);
        console.log(`Prefix ${prefix}: Found ${entries.length} entries`);
        
        if (entries.length > 0) {
          console.log(`First entry for ${prefix}:`, JSON.stringify(entries[0], null, 2));
          
          diagnostic.kvStore[prefix] = {
            count: entries.length,
            sampleEntry: entries[0],
            allEntries: entries.map((e: any) => ({
              hasKey: !!e.key,
              keys: Object.keys(e),
              idFields: {
                teacherId: e.teacherId,
                classId: e.classId,
                sectionId: e.sectionId,
                subjectId: e.subjectId,
                examId: e.examId,
                timetableId: e.timetableId,
                academicYearId: e.academicYearId,
                markId: e.markId,
                resultId: e.resultId,
                reportCardId: e.reportCardId,
              }
            }))
          };
        } else {
          diagnostic.kvStore[prefix] = { count: 0 };
        }
      } catch (error: any) {
        diagnostic.kvStore[prefix] = { error: error.message };
      }
    }

    // Note: All data now stored in Postgres KV Store (kv_store_2fbe5237 table)
    diagnostic.storage = {
      type: 'Postgres KV Store',
      table: 'kv_store_2fbe5237',
      note: 'All application data uses key-value storage in Postgres'
    };

    console.log('Diagnostic complete');
    return c.json(diagnostic);
  } catch (error: any) {
    console.error('❌ Diagnostic error:', error);
    return c.json({ error: error.message }, 500);
  }
});

Deno.serve(app.fetch);