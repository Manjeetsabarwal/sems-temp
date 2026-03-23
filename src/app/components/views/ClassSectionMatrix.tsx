import React, { useState, useEffect } from 'react';
import { 
  Grid, 
  Check, 
  X, 
  Loader2, 
  RefreshCw, 
  Download, 
  Upload, 
  Search,
  Plus,
  Trash2,
  Save,
  AlertCircle
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Checkbox } from '../ui/checkbox';
import { toast } from 'sonner';
import { classesService } from '../../services/classes.service';
import { sectionsService } from '../../services/sections.service';
import type { ClassExtended, SectionExtended } from '../../types';

interface ClassSectionCombination {
  classId: string;
  sectionId: string;
  status: 'Active' | 'Inactive';
}

export function ClassSectionMatrix() {
  const [classes, setClasses] = useState<ClassExtended[]>([]);
  const [sections, setSections] = useState<SectionExtended[]>([]);
  const [combinations, setCombinations] = useState<Map<string, ClassSectionCombination>>(new Map());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Active' | 'Inactive'>('all');

  // Load all data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [classesData, sectionsData] = await Promise.all([
        classesService.getAll({ status: 'Active' }),
        sectionsService.getAll({ status: 'Active' }),
      ]);

      setClasses(classesData);
      setSections(sectionsData);

      // Load all combinations
      await loadCombinations(classesData);
    } catch (error: any) {
      toast.error(`Failed to load data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const loadCombinations = async (classesData: ClassExtended[]) => {
    const combinationsMap = new Map<string, ClassSectionCombination>();

    // Load sections for each class
    for (const classItem of classesData) {
      try {
        const classSections = await classesService.getClassSections(classItem.classId);
        classSections.forEach((cs) => {
          const key = `${classItem.classId}-${cs.sectionId}`;
          combinationsMap.set(key, {
            classId: classItem.classId,
            sectionId: cs.sectionId,
            status: cs.status as 'Active' | 'Inactive',
          });
        });
      } catch (error: any) {
        console.error(`Failed to load sections for class ${classItem.classId}:`, error);
      }
    }

    setCombinations(combinationsMap);
  };

  const toggleCombination = async (classId: string, sectionId: string) => {
    const key = `${classId}-${sectionId}`;
    const exists = combinations.has(key);

    setSaving(true);
    try {
      if (exists) {
        // Remove combination
        await classesService.removeSectionFromClass(classId, sectionId);
        const newCombinations = new Map(combinations);
        newCombinations.delete(key);
        setCombinations(newCombinations);
        toast.success(`Removed ${getSectionName(sectionId)} from ${getClassName(classId)}`);
      } else {
        // Add combination
        await classesService.addSectionToClass(classId, sectionId);
        const newCombinations = new Map(combinations);
        newCombinations.set(key, {
          classId,
          sectionId,
          status: 'Active',
        });
        setCombinations(newCombinations);
        toast.success(`Added ${getSectionName(sectionId)} to ${getClassName(classId)}`);
      }
    } catch (error: any) {
      toast.error(`Failed to update combination: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const getClassName = (classId: string) => {
    const classItem = classes.find(c => c.classId === classId);
    return classItem?.name || classId;
  };

  const getSectionName = (sectionId: string) => {
    const section = sections.find(s => s.sectionId === sectionId);
    return section?.name || sectionId;
  };

  const isCombinationActive = (classId: string, sectionId: string): boolean => {
    const key = `${classId}-${sectionId}`;
    const combination = combinations.get(key);
    return combination?.status === 'Active';
  };

  const hasCombination = (classId: string, sectionId: string): boolean => {
    return combinations.has(`${classId}-${sectionId}`);
  };

  // Filter classes and sections based on search
  const filteredClasses = classes.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.classId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredSections = sections.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.sectionId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Count statistics
  const totalCombinations = combinations.size;
  const activeCombinations = Array.from(combinations.values()).filter(c => c.status === 'Active').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading class-section combinations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Grid className="w-6 h-6 text-blue-600" />
            Class-Section Combination Matrix
          </h1>
          <p className="text-gray-500 mt-1">
            Manage which sections are assigned to which classes
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={loadData} disabled={loading || saving}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-gray-500">Total Classes</div>
            <div className="text-2xl font-bold text-gray-900">{classes.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-gray-500">Total Sections</div>
            <div className="text-2xl font-bold text-gray-900">{sections.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-gray-500">Active Combinations</div>
            <div className="text-2xl font-bold text-blue-600">{activeCombinations}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search classes or sections..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="Active">Active Only</option>
              <option value="Inactive">Inactive Only</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Matrix Table */}
      <Card>
        <CardHeader>
          <CardTitle>Combination Matrix</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredClasses.length === 0 || filteredSections.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">
                {filteredClasses.length === 0 
                  ? 'No classes found. Please create classes first.'
                  : 'No sections found. Please create sections first.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <div className="inline-block min-w-full align-middle">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-10 border-r">
                        Class / Section
                      </th>
                      {filteredSections.map((section) => (
                        <th
                          key={section.sectionId}
                          className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px]"
                        >
                          <div className="flex flex-col items-center">
                            <span className="font-semibold">{section.name}</span>
                            <span className="text-xs text-gray-400 mt-1">{section.sectionId}</span>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredClasses.map((classItem) => (
                      <tr key={classItem.classId} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap sticky left-0 bg-white z-10 border-r">
                          <div className="flex flex-col">
                            <span className="font-semibold text-gray-900">{classItem.name}</span>
                            <span className="text-xs text-gray-500">{classItem.classId}</span>
                          </div>
                        </td>
                        {filteredSections.map((section) => {
                          const isActive = isCombinationActive(classItem.classId, section.sectionId);
                          const exists = hasCombination(classItem.classId, section.sectionId);
                          
                          return (
                            <td
                              key={`${classItem.classId}-${section.sectionId}`}
                              className="px-4 py-3 text-center"
                            >
                              <button
                                onClick={() => toggleCombination(classItem.classId, section.sectionId)}
                                disabled={saving}
                                className={`
                                  w-8 h-8 rounded border-2 transition-all
                                  ${exists
                                    ? isActive
                                      ? 'bg-blue-600 border-blue-600 text-white'
                                      : 'bg-gray-200 border-gray-300 text-gray-500'
                                    : 'bg-white border-gray-300 text-gray-400 hover:border-blue-400'
                                  }
                                  ${saving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-110'}
                                `}
                                title={
                                  exists
                                    ? isActive
                                      ? `Active: ${classItem.name} - ${section.name}`
                                      : `Inactive: ${classItem.name} - ${section.name}`
                                    : `Click to assign ${section.name} to ${classItem.name}`
                                }
                              >
                                {exists ? (
                                  isActive ? (
                                    <Check className="w-5 h-5 mx-auto" />
                                  ) : (
                                    <X className="w-5 h-5 mx-auto" />
                                  )
                                ) : (
                                  <Plus className="w-5 h-5 mx-auto" />
                                )}
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Legend */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <h3 className="font-semibold text-blue-900 mb-3">Legend</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded border-2 bg-blue-600 border-blue-600 flex items-center justify-center">
                <Check className="w-5 h-5 text-white" />
              </div>
              <span className="text-blue-900">Active Combination</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded border-2 bg-gray-200 border-gray-300 flex items-center justify-center">
                <X className="w-5 h-5 text-gray-500" />
              </div>
              <span className="text-blue-900">Inactive Combination</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded border-2 bg-white border-gray-300 flex items-center justify-center">
                <Plus className="w-5 h-5 text-gray-400" />
              </div>
              <span className="text-blue-900">Not Assigned (Click to Add)</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
