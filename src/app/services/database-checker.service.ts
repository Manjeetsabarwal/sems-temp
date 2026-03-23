/**
 * Database Checker Service - KV Store Version
 * Checks if data exists in KV Store (not traditional database tables)
 */

import { API_BASE_URL as NEST_API_BASE_URL } from '../config/api.config';

const API_BASE_URL = `${NEST_API_BASE_URL}/api`;

export interface TableStatus {
  exists: boolean;
  hasCorrectSchema: boolean;
  missingColumns: string[];
  extraColumns: string[];
}

export interface DatabaseStatus {
  students: TableStatus;
  exams: TableStatus;
  subjects: TableStatus;
  marks: TableStatus;
  teachers: TableStatus;
  allTablesReady: boolean;
}

class DatabaseCheckerService {
  private async checkDataExists(endpoint: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`);

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      return Array.isArray(data) && data.length > 0;
    } catch (error) {
      console.error(`Error checking ${endpoint}:`, error);
      return false;
    }
  }

  /**
   * Check if all required data exists in KV store
   */
  async checkDatabase(): Promise<DatabaseStatus> {
    // All collections in KV store are automatically "schema-ready"
    // We just check if data exists
    const [studentsExist, examsExist, subjectsExist, marksExist, teachersExist] = await Promise.all([
      this.checkDataExists('/students'),
      this.checkDataExists('/exams'),
      this.checkDataExists('/subjects'),
      this.checkDataExists('/marks'),
      this.checkDataExists('/teachers'),
    ]);

    const createStatus = (exists: boolean): TableStatus => ({
      exists,
      hasCorrectSchema: true, // KV store doesn't have schema issues
      missingColumns: [],
      extraColumns: [],
    });

    return {
      students: createStatus(studentsExist),
      exams: createStatus(examsExist),
      subjects: createStatus(subjectsExist),
      marks: createStatus(marksExist),
      teachers: createStatus(teachersExist),
      allTablesReady: true, // KV store is always ready (no schema to set up)
    };
  }

  /**
   * Get migration SQL - Not applicable for KV store
   */
  getMigrationSQL(dbStatus: DatabaseStatus): string | null {
    // KV store doesn't need SQL migrations
    return null;
  }
}

export const databaseCheckerService = new DatabaseCheckerService();
