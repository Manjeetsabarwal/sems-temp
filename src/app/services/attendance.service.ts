import { API_ENDPOINTS, apiCall, buildQueryString } from '../config/api.config';
import type { AttendanceRecord, AttendanceReportEntry } from '../types';

export class AttendanceService {
  async getAll(filters?: {
    lectureId?: number;
    studentId?: string;
    status?: string;
  }): Promise<AttendanceRecord[]> {
    try {
      const queryString = buildQueryString({
        lectureId: filters?.lectureId?.toString(),
        studentId: filters?.studentId,
        status: filters?.status,
      });
      const data = await apiCall<any[]>(`${API_ENDPOINTS.attendance}${queryString}`);
      return data.map((row) => ({
        id: row.id,
        lectureId: row.lectureId,
        studentId: row.studentId,
        status: row.status,
        notes: row.notes,
        date: row.date,
        createdAt: row.createdAt,
        lecture: row.lecture,
      }));
    } catch (error: any) {
      console.error('Error fetching attendance:', error);
      throw new Error(`Failed to fetch attendance: ${error.message}`);
    }
  }

  async getById(id: number): Promise<AttendanceRecord> {
    try {
      return await apiCall<AttendanceRecord>(`${API_ENDPOINTS.attendance}/${id}`);
    } catch (error: any) {
      console.error('Error fetching attendance record:', error);
      throw new Error(`Failed to fetch attendance record: ${error.message}`);
    }
  }

  async getByLecture(lectureId: number): Promise<AttendanceRecord[]> {
    try {
      return await apiCall<AttendanceRecord[]>(API_ENDPOINTS.attendanceByLecture(lectureId));
    } catch (error: any) {
      console.error('Error fetching attendance by lecture:', error);
      throw new Error(`Failed to fetch attendance by lecture: ${error.message}`);
    }
  }

  async getByStudent(studentId: string): Promise<AttendanceRecord[]> {
    try {
      return await apiCall<AttendanceRecord[]>(API_ENDPOINTS.attendanceByStudent(studentId));
    } catch (error: any) {
      console.error('Error fetching attendance by student:', error);
      throw new Error(`Failed to fetch attendance by student: ${error.message}`);
    }
  }

  async bulkMark(lectureId: number, records: Array<{ studentId: string; status: string; notes?: string }>): Promise<AttendanceRecord[]> {
    try {
      return await apiCall<AttendanceRecord[]>(API_ENDPOINTS.attendanceBulkMark, {
        method: 'POST',
        body: JSON.stringify({ lectureId, records }),
      });
    } catch (error: any) {
      console.error('Error bulk marking attendance:', error);
      throw new Error(`Failed to bulk mark attendance: ${error.message}`);
    }
  }

  async getReport(filters: {
    batchId?: number;
    studentId?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<{ records: AttendanceRecord[]; summary: AttendanceReportEntry[] }> {
    try {
      const queryString = buildQueryString({
        batchId: filters.batchId?.toString(),
        studentId: filters.studentId,
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo,
      });
      return await apiCall(`${API_ENDPOINTS.attendanceReport}${queryString}`);
    } catch (error: any) {
      console.error('Error fetching attendance report:', error);
      throw new Error(`Failed to fetch attendance report: ${error.message}`);
    }
  }

  async update(id: number, data: Partial<AttendanceRecord>): Promise<AttendanceRecord> {
    try {
      return await apiCall<AttendanceRecord>(`${API_ENDPOINTS.attendance}/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    } catch (error: any) {
      console.error('Error updating attendance:', error);
      throw new Error(`Failed to update attendance: ${error.message}`);
    }
  }

  async delete(id: number): Promise<void> {
    try {
      await apiCall(`${API_ENDPOINTS.attendance}/${id}`, { method: 'DELETE' });
    } catch (error: any) {
      console.error('Error deleting attendance:', error);
      throw new Error(`Failed to delete attendance: ${error.message}`);
    }
  }
}

export const attendanceService = new AttendanceService();
