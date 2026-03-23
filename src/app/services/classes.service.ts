import { API_ENDPOINTS, apiCall, buildQueryString } from '../config/api.config';
import type { ClassExtended } from '../types';

export interface ClassFilters {
  status?: string;
  search?: string;
}

/**
 * Classes Service - REST API Access
 * All operations call NestJS backend
 */
class ClassesService {
  /**
   * Get all classes with optional filters
   */
  async getAll(filters: ClassFilters = {}): Promise<ClassExtended[]> {
    try {
      console.log('📖 Reading classes from server...', filters);

      const queryString = buildQueryString({
        status: filters.status,
        search: filters.search,
      });

      const data = await apiCall<any[]>(`${API_ENDPOINTS.classes}${queryString}`);

      // Map API response to UI format
      const classes = data.map((row) => ({
        classId: row.classId,
        name: row.className,
        description: row.description,
        capacity: row.capacity, // Use capacity field from backend
        currentStrength: row.currentStrength || 0, // This is the actual student count
        status: row.status || 'Active',
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      }));

      console.log(`✅ Found ${classes.length} classes`);
      return classes;
    } catch (error: any) {
      console.error('❌ Exception in getAll:', error);
      throw new Error(`Failed to fetch classes: ${error.message}`);
    }
  }

  /**
   * Get a single class by ID
   */
  async getById(classId: string): Promise<ClassExtended> {
    try {
      const data = await apiCall<any>(`${API_ENDPOINTS.classes}/${classId}`);
      
      return {
        classId: data.classId,
        name: data.className,
        description: data.description,
        capacity: data.capacity, // Use capacity field from backend
        currentStrength: data.currentStrength || 0, // This is the actual student count
        status: data.status || 'Active',
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      };
    } catch (error: any) {
      console.error('❌ Exception in getById:', error);
      throw new Error(`Failed to fetch class: ${error.message}`);
    }
  }

  /**
   * Create a new class
   */
  async create(classData: Omit<ClassExtended, 'createdAt' | 'updatedAt' | 'currentStrength'>): Promise<ClassExtended> {
    try {
      console.log('📝 Creating class:', classData);

      const payload: any = {
        classId: classData.classId || `CLS${Date.now().toString(36).toUpperCase()}`,
        className: classData.name,
        status: classData.status || 'Active',
      };

      // Add optional fields
      if (classData.description !== undefined) payload.description = classData.description;
      if (classData.capacity !== undefined) payload.capacity = classData.capacity;

      const data = await apiCall<any>(API_ENDPOINTS.classes, {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      const newClass = {
        classId: data.classId,
        name: data.className,
        description: data.description,
        capacity: data.capacity, // Use capacity field from backend
        currentStrength: data.currentStrength || 0, // New classes have 0 students
        status: data.status,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      };

      console.log('✅ Class created:', newClass);
      return newClass;
    } catch (error: any) {
      console.error('❌ Exception in create:', error);
      throw new Error(error.message || 'Failed to create class');
    }
  }

  /**
   * Update an existing class
   */
  async update(classId: string, updates: Partial<ClassExtended>): Promise<ClassExtended> {
    try {
      console.log('📝 Updating class:', classId, updates);

      const payload: any = {};
      // Include classId if it's being changed (for cascading updates)
      if (updates.classId !== undefined) payload.classId = updates.classId;
      if (updates.name !== undefined) payload.className = updates.name;
      if (updates.description !== undefined) payload.description = updates.description;
      if (updates.capacity !== undefined) payload.capacity = updates.capacity;
      if (updates.status !== undefined) payload.status = updates.status;

      const data = await apiCall<any>(`${API_ENDPOINTS.classes}/${classId}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });

      const updated = {
        classId: data.classId,
        name: data.className,
        description: data.description,
        capacity: data.capacity, // Use capacity field from backend
        currentStrength: data.currentStrength || 0, // This is the actual student count
        status: data.status,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      };

      console.log('✅ Class updated:', updated);
      return updated;
    } catch (error: any) {
      console.error('❌ Exception in update:', error);
      throw new Error(error.message || 'Failed to update class');
    }
  }

  /**
   * Delete a class
   */
  async delete(classId: string): Promise<void> {
    try {
      console.log('🗑️ Deleting class:', classId);

      await apiCall(`${API_ENDPOINTS.classes}/${classId}`, {
        method: 'DELETE',
      });

      console.log('✅ Class deleted:', classId);
    } catch (error: any) {
      console.error('❌ Exception in delete:', error);
      throw new Error(error.message || 'Failed to delete class');
    }
  }

  /**
   * Bulk delete classes
   */
  async bulkDelete(classIds: string[]): Promise<void> {
    try {
      console.log('🗑️ Bulk deleting classes:', classIds);

      await apiCall(`${API_ENDPOINTS.classes}/bulk-delete`, {
        method: 'POST',
        body: JSON.stringify({ classIds }),
      });

      console.log('✅ Bulk delete successful');
    } catch (error: any) {
      console.error('❌ Exception in bulkDelete:', error);
      throw new Error(error.message || 'Failed to delete classes');
    }
  }

  /**
   * Get classes for dropdown (lightweight)
   */
  async getForDropdown(): Promise<Array<{ classId: string; name: string }>> {
    try {
      const data = await apiCall<any[]>(API_ENDPOINTS.classesDropdown);
      return data.map((c) => ({
        classId: c.classId || '',
        name: c.className || '',
      }));
    } catch (error: any) {
      console.error('❌ Exception in getForDropdown:', error);
      return [];
    }
  }

  /**
   * Get all sections assigned to a class
   */
  async getClassSections(classId: string): Promise<Array<{ sectionId: string; sectionName: string; status: string }>> {
    try {
      const data = await apiCall<any[]>(`${API_ENDPOINTS.classes}/${classId}/sections`);
      return data.map((s) => ({
        sectionId: s.sectionId,
        sectionName: s.sectionName,
        status: s.status,
      }));
    } catch (error: any) {
      console.error('❌ Exception in getClassSections:', error);
      throw new Error(`Failed to fetch class sections: ${error.message}`);
    }
  }

  /**
   * Add a section to a class
   */
  async addSectionToClass(classId: string, sectionId: string): Promise<Array<{ sectionId: string; sectionName: string; status: string }>> {
    try {
      const data = await apiCall<any[]>(`${API_ENDPOINTS.classes}/${classId}/sections`, {
        method: 'POST',
        body: JSON.stringify({ sectionId }),
      });
      return data.map((s) => ({
        sectionId: s.sectionId,
        sectionName: s.sectionName,
        status: s.status,
      }));
    } catch (error: any) {
      console.error('❌ Exception in addSectionToClass:', error);
      throw new Error(`Failed to add section to class: ${error.message}`);
    }
  }

  /**
   * Remove a section from a class
   */
  async removeSectionFromClass(classId: string, sectionId: string): Promise<void> {
    try {
      await apiCall(`${API_ENDPOINTS.classes}/${classId}/sections/${sectionId}`, {
        method: 'DELETE',
      });
    } catch (error: any) {
      console.error('❌ Exception in removeSectionFromClass:', error);
      throw new Error(`Failed to remove section from class: ${error.message}`);
    }
  }
}

export const classesService = new ClassesService();
