import { API_ENDPOINTS, apiCall, buildQueryString } from '../config/api.config';
import type { SectionExtended } from '../types';

export interface SectionFilters {
  classId?: string;
  status?: string;
}

export interface SectionClass {
  classId: string;
  className: string;
  status: string;
}

/**
 * Sections Service - REST API Access
 * All operations call NestJS backend
 * Supports normalized schema with many-to-many class relationships
 */
class SectionsService {
  /**
   * Get all sections with optional filters
   */
  async getAll(filters: SectionFilters = {}): Promise<SectionExtended[]> {
    try {
      console.log('📖 Reading sections from server...', filters);

      const queryString = buildQueryString({
        classId: filters.classId,
        status: filters.status,
      });

      const data = await apiCall<any[]>(`${API_ENDPOINTS.sections}${queryString}`);

      // Map API response to UI format
      const sections = data.map((row) => ({
        sectionId: row.sectionId,
        classId: row.classId || null, // Now optional
        className: row.className || null,
        name: row.sectionName,
        capacity: row.capacity,
        currentStrength: row.currentStrength,
        roomNumber: row.roomNumber,
        classes: row.classes || [], // Many-to-many classes
        status: row.status || 'Active',
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      }));

      console.log(`✅ Found ${sections.length} sections`);
      return sections;
    } catch (error: any) {
      console.error('❌ Exception in getAll:', error);
      throw new Error(`Failed to fetch sections: ${error.message}`);
    }
  }

  /**
   * Get a single section by ID
   */
  async getById(sectionId: string): Promise<SectionExtended> {
    try {
      const data = await apiCall<any>(`${API_ENDPOINTS.sections}/${sectionId}`);
      
      return {
        sectionId: data.sectionId,
        classId: data.classId || null,
        className: data.className || null,
        name: data.sectionName,
        capacity: data.capacity,
        currentStrength: data.currentStrength,
        roomNumber: data.roomNumber,
        classes: data.classes || [],
        status: data.status || 'Active',
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      };
    } catch (error: any) {
      console.error('❌ Exception in getById:', error);
      throw new Error(`Failed to fetch section: ${error.message}`);
    }
  }

  /**
   * Get sections by class ID
   */
  async getByClass(classId: string): Promise<SectionExtended[]> {
    try {
      console.log(`📖 Fetching sections for class: ${classId}`);
      const data = await apiCall<any[]>(API_ENDPOINTS.sectionsByClass(classId));
      console.log(`✅ Received ${data.length} sections for class ${classId}:`, data);
      
      return data.map((row) => ({
        sectionId: row.sectionId,
        classId: row.classId || null,
        className: row.className || null,
        name: row.sectionName,
        capacity: row.capacity,
        currentStrength: row.currentStrength,
        roomNumber: row.roomNumber,
        classes: row.classes || [],
        status: row.status || 'Active',
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      }));
    } catch (error: any) {
      console.error('❌ Exception in getByClass:', error);
      throw new Error(`Failed to fetch sections: ${error.message}`);
    }
  }

  /**
   * Create a new section
   */
  async create(sectionData: Omit<SectionExtended, 'createdAt' | 'updatedAt' | 'currentStrength'>): Promise<SectionExtended> {
    try {
      console.log('📝 Creating section:', sectionData);

      const payload: any = {
        sectionId: sectionData.sectionId || `${sectionData.classId || 'SEC'}-${sectionData.name}`,
        sectionName: sectionData.name,
        capacity: sectionData.capacity || 40,
        roomNumber: sectionData.roomNumber || null,
        status: sectionData.status || 'Active',
      };

      // Optional classId (normalized schema)
      if (sectionData.classId) {
        payload.classId = sectionData.classId;
      }

      // Handle multiple classes
      if ((sectionData as any).classIds && (sectionData as any).classIds.length > 0) {
        payload.classIds = (sectionData as any).classIds;
      }

      const data = await apiCall<any>(API_ENDPOINTS.sections, {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      const newSection = {
        sectionId: data.sectionId,
        classId: data.classId || null,
        className: data.className || null,
        name: data.sectionName,
        capacity: data.capacity,
        currentStrength: data.currentStrength,
        roomNumber: data.roomNumber,
        classes: data.classes || [],
        status: data.status,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      };

      console.log('✅ Section created:', newSection);
      return newSection;
    } catch (error: any) {
      console.error('❌ Exception in create:', error);
      throw new Error(error.message || 'Failed to create section');
    }
  }

  /**
   * Update an existing section
   */
  async update(sectionId: string, updates: Partial<SectionExtended>): Promise<SectionExtended> {
    try {
      console.log('📝 Updating section:', sectionId, updates);

      const payload: any = {};
      if (updates.name !== undefined) payload.sectionName = updates.name;
      if (updates.classId !== undefined) payload.classId = updates.classId;
      if (updates.capacity !== undefined) payload.capacity = updates.capacity;
      if (updates.roomNumber !== undefined) payload.roomNumber = updates.roomNumber;
      if (updates.status !== undefined) payload.status = updates.status;
      if ((updates as any).classIds !== undefined) payload.classIds = (updates as any).classIds;

      const data = await apiCall<any>(`${API_ENDPOINTS.sections}/${sectionId}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });

      const updated = {
        sectionId: data.sectionId,
        classId: data.classId || null,
        className: data.className || null,
        name: data.sectionName,
        capacity: data.capacity,
        currentStrength: data.currentStrength,
        roomNumber: data.roomNumber,
        classes: data.classes || [],
        status: data.status,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      };

      console.log('✅ Section updated:', updated);
      return updated;
    } catch (error: any) {
      console.error('❌ Exception in update:', error);
      throw new Error(error.message || 'Failed to update section');
    }
  }

  /**
   * Delete a section
   */
  async delete(sectionId: string): Promise<void> {
    try {
      console.log('🗑️ Deleting section:', sectionId);

      await apiCall(`${API_ENDPOINTS.sections}/${sectionId}`, {
        method: 'DELETE',
      });

      console.log('✅ Section deleted:', sectionId);
    } catch (error: any) {
      console.error('❌ Exception in delete:', error);
      throw new Error(error.message || 'Failed to delete section');
    }
  }

  /**
   * Get sections for dropdown
   */
  async getForDropdown(classId?: string): Promise<Array<{ sectionId: string; name: string; classId: string }>> {
    try {
      const queryString = classId ? `?classId=${classId}` : '';
      const data = await apiCall<any[]>(`${API_ENDPOINTS.sectionsDropdown}${queryString}`);
      
      return data.map((s) => ({
        sectionId: s.sectionId || '',
        name: s.sectionName || '',
        classId: s.classId || '',
      }));
    } catch (error: any) {
      console.error('❌ Exception in getForDropdown:', error);
      return [];
    }
  }

  // ============================================
  // Section-Class Association Methods
  // ============================================

  /**
   * Get all classes assigned to a section
   */
  async getSectionClasses(sectionId: string): Promise<SectionClass[]> {
    try {
      const data = await apiCall<any[]>(`${API_ENDPOINTS.sections}/${sectionId}/classes`);
      return data.map((c) => ({
        classId: c.classId,
        className: c.className,
        status: c.status,
      }));
    } catch (error: any) {
      console.error('❌ Exception in getSectionClasses:', error);
      return [];
    }
  }

  /**
   * Add a class to a section
   */
  async addClassToSection(sectionId: string, classId: string): Promise<SectionClass[]> {
    try {
      const data = await apiCall<any[]>(`${API_ENDPOINTS.sections}/${sectionId}/classes`, {
        method: 'POST',
        body: JSON.stringify({ classId }),
      });
      return data.map((c) => ({
        classId: c.classId,
        className: c.className,
        status: c.status,
      }));
    } catch (error: any) {
      console.error('❌ Exception in addClassToSection:', error);
      throw new Error(error.message || 'Failed to add class to section');
    }
  }

  /**
   * Remove a class from a section
   */
  async removeClassFromSection(sectionId: string, classId: string): Promise<void> {
    try {
      await apiCall(`${API_ENDPOINTS.sections}/${sectionId}/classes/${classId}`, {
        method: 'DELETE',
      });
    } catch (error: any) {
      console.error('❌ Exception in removeClassFromSection:', error);
      throw new Error(error.message || 'Failed to remove class from section');
    }
  }
}

export const sectionsService = new SectionsService();
