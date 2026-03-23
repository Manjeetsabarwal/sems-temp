import { API_ENDPOINTS, apiCall, buildQueryString } from '../config/api.config';

export interface AcademicYear {
  academicYearId: string;
  startDate: string;
  endDate: string;
  isCurrent?: boolean;
  status?: 'Active' | 'Inactive' | 'Upcoming';
  createdAt?: string;
  updatedAt?: string;
}

export interface AcademicYearFilters {
  status?: string;
}

/**
 * Academic Years Service - REST API Access
 * All operations call NestJS backend
 */
class AcademicYearsService {
  /**
   * Get all academic years with optional filters
   */
  async getAll(filters: AcademicYearFilters = {}): Promise<AcademicYear[]> {
    try {
      console.log('📖 Reading academic years from server...', filters);

      const queryString = buildQueryString({
        status: filters.status,
      });

      const data = await apiCall<any[]>(`${API_ENDPOINTS.academicYears}${queryString}`);

      // Map API response to UI format (backend uses 'id' not 'academicYearId')
      const academicYears = data.map((row) => ({
        academicYearId: row.id || row.academicYearId,
        startDate: row.startDate,
        endDate: row.endDate,
        isCurrent: row.isCurrent || false,
        status: row.status || 'Inactive',
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      }));

      console.log(`✅ Found ${academicYears.length} academic years`);
      return academicYears;
    } catch (error: any) {
      console.error('❌ Exception in getAll:', error);
      throw new Error(`Failed to fetch academic years: ${error.message}`);
    }
  }

  /**
   * Get current academic year
   */
  async getCurrent(): Promise<AcademicYear | null> {
    try {
      const data = await apiCall<any>(`${API_ENDPOINTS.academicYears}/current`);
      
      return {
        academicYearId: data.id || data.academicYearId,
        startDate: data.startDate,
        endDate: data.endDate,
        isCurrent: data.isCurrent || false,
        status: data.status || 'Active',
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      };
    } catch (error: any) {
      console.error('❌ Exception in getCurrent:', error);
      return null;
    }
  }

  /**
   * Get a single academic year by ID
   */
  async getById(academicYearId: string): Promise<AcademicYear> {
    try {
      const data = await apiCall<any>(`${API_ENDPOINTS.academicYears}/${academicYearId}`);
      
      return {
        academicYearId: data.academicYearId,
        startDate: data.startDate,
        endDate: data.endDate,
        isCurrent: data.isCurrent || false,
        status: data.status || 'Inactive',
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      };
    } catch (error: any) {
      console.error('❌ Exception in getById:', error);
      throw new Error(`Failed to fetch academic year: ${error.message}`);
    }
  }

  /**
   * Create a new academic year
   */
  async create(academicYear: Omit<AcademicYear, 'createdAt' | 'updatedAt'>): Promise<AcademicYear> {
    try {
      console.log('📝 Creating academic year:', academicYear);

      const payload = {
        id: academicYear.academicYearId, // Backend uses 'id' as primary key
        yearName: `${academicYear.startDate.split('-')[0]}-${academicYear.endDate.split('-')[0]}`, // Generate year name
        startDate: academicYear.startDate,
        endDate: academicYear.endDate,
        isCurrent: academicYear.isCurrent || false,
        status: academicYear.status || 'Upcoming',
      };

      const data = await apiCall<any>(API_ENDPOINTS.academicYears, {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      const newAcademicYear = {
        academicYearId: data.id || data.academicYearId,
        startDate: data.startDate,
        endDate: data.endDate,
        isCurrent: data.isCurrent || false,
        status: data.status,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      };

      console.log('✅ Academic year created:', newAcademicYear);
      return newAcademicYear;
    } catch (error: any) {
      console.error('❌ Exception in create:', error);
      throw new Error(error.message || 'Failed to create academic year');
    }
  }

  /**
   * Update an existing academic year
   */
  async update(academicYearId: string, updates: Partial<AcademicYear>): Promise<AcademicYear> {
    try {
      console.log('📝 Updating academic year:', academicYearId, updates);

      const payload: any = {};
      if (updates.startDate !== undefined) payload.startDate = updates.startDate;
      if (updates.endDate !== undefined) payload.endDate = updates.endDate;
      if (updates.status !== undefined) payload.status = updates.status;
      if (updates.isCurrent !== undefined) payload.isCurrent = updates.isCurrent;

      const data = await apiCall<any>(`${API_ENDPOINTS.academicYears}/${academicYearId}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });

      const updated = {
        academicYearId: data.id || data.academicYearId,
        startDate: data.startDate,
        endDate: data.endDate,
        isCurrent: data.isCurrent || false,
        status: data.status,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      };

      console.log('✅ Academic year updated:', updated);
      return updated;
    } catch (error: any) {
      console.error('❌ Exception in update:', error);
      throw new Error(error.message || 'Failed to update academic year');
    }
  }

  /**
   * Set academic year as current
   */
  async setAsCurrent(academicYearId: string): Promise<AcademicYear> {
    try {
      console.log('📝 Setting academic year as current:', academicYearId);

      const data = await apiCall<any>(`${API_ENDPOINTS.academicYears}/${academicYearId}/set-current`, {
        method: 'PATCH',
      });

      return {
        academicYearId: data.id || data.academicYearId,
        startDate: data.startDate,
        endDate: data.endDate,
        isCurrent: data.isCurrent || false,
        status: data.status,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      };
    } catch (error: any) {
      console.error('❌ Exception in setAsCurrent:', error);
      throw new Error(error.message || 'Failed to set academic year as current');
    }
  }

  /**
   * Delete an academic year
   */
  async delete(academicYearId: string): Promise<void> {
    try {
      console.log('🗑️ Deleting academic year:', academicYearId);

      await apiCall(`${API_ENDPOINTS.academicYears}/${academicYearId}`, {
        method: 'DELETE',
      });

      console.log('✅ Academic year deleted:', academicYearId);
    } catch (error: any) {
      console.error('❌ Exception in delete:', error);
      throw new Error(error.message || 'Failed to delete academic year');
    }
  }
}

export const academicYearsService = new AcademicYearsService();
