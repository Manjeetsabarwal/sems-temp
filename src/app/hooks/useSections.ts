import { useState, useEffect, useCallback } from 'react';
import { sectionsService, type SectionFilters } from '../services/sections.service';
import type { SectionExtended } from '../types';
import { toast } from 'sonner';

interface UseSectionsOptions extends SectionFilters {}

export function useSections(options: UseSectionsOptions = {}) {
  const [sections, setSections] = useState<SectionExtended[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch sections from database
  const fetchSections = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await sectionsService.getAll(options);
      setSections(data);
    } catch (err: any) {
      console.error('Error fetching sections:', err);
      setError(err.message || 'Failed to load sections');
      toast.error(err.message || 'Failed to load sections');
    } finally {
      setLoading(false);
    }
  }, [options.classId, options.status, options.search]);

  // Create section
  const createSection = useCallback(async (section: Omit<SectionExtended, 'createdAt' | 'updatedAt' | 'currentStrength'>) => {
    try {
      const newSection = await sectionsService.create(section);
      setSections(prev => [...prev, newSection]);
      toast.success('Section created successfully');
      return newSection;
    } catch (err: any) {
      console.error('Error creating section:', err);
      toast.error(err.message || 'Failed to create section');
      throw err;
    }
  }, []);

  // Update section
  const updateSection = useCallback(async (sectionId: string, updates: Partial<SectionExtended>) => {
    try {
      const updatedSection = await sectionsService.update(sectionId, updates);
      setSections(prev => 
        prev.map(s => s.sectionId === sectionId ? updatedSection : s)
      );
      toast.success('Section updated successfully');
      return updatedSection;
    } catch (err: any) {
      console.error('Error updating section:', err);
      toast.error(err.message || 'Failed to update section');
      throw err;
    }
  }, []);

  // Delete section
  const deleteSection = useCallback(async (sectionId: string) => {
    try {
      await sectionsService.delete(sectionId);
      setSections(prev => prev.filter(s => s.sectionId !== sectionId));
      toast.success('Section deleted successfully');
    } catch (err: any) {
      console.error('Error deleting section:', err);
      toast.error(err.message || 'Failed to delete section');
      throw err;
    }
  }, []);

  // Bulk delete sections
  const bulkDeleteSections = useCallback(async (sectionIds: string[]) => {
    try {
      await sectionsService.bulkDelete(sectionIds);
      setSections(prev => prev.filter(s => !sectionIds.includes(s.sectionId)));
      toast.success(`${sectionIds.length} sections deleted successfully`);
    } catch (err: any) {
      console.error('Error bulk deleting sections:', err);
      toast.error(err.message || 'Failed to delete sections');
      throw err;
    }
  }, []);

  // Refresh data
  const refresh = useCallback(() => {
    fetchSections();
  }, [fetchSections]);

  useEffect(() => {
    fetchSections();
  }, [fetchSections]);

  return {
    sections,
    loading,
    error,
    createSection,
    updateSection,
    deleteSection,
    bulkDeleteSections,
    refresh,
  };
}
