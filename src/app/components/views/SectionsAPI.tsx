import React, { useState, useRef, useEffect } from 'react';
import { Search, Plus, Edit, Trash2, Eye, Loader2, ArrowUpDown, ArrowUp, ArrowDown, Download, Upload, FileSpreadsheet, File, RefreshCw, Database, FileJson, X, LayoutGrid, List as ListIcon, Users, DoorOpen } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Checkbox } from '../ui/checkbox';
import { useSections } from '../../hooks/useSections';
import { sectionsService } from '../../services/sections.service';
import { classesService } from '../../services/classes.service';
import { DeleteConfirmDialog } from '../DeleteConfirmDialog';
import { SectionDetails } from './SectionDetails';
import { useApp } from '../../context/AppContext';
import type { SectionExtended } from '../../types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import { Badge } from '../ui/badge';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';

type SortField = 'sectionId' | 'name' | 'classId' | 'roomNumber' | 'capacity' | 'currentStrength';
type SortOrder = 'asc' | 'desc';
type ViewMode = 'grid' | 'list';

export function SectionsAPI() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [classFilter, setClassFilter] = useState<string>('');
  const [detailsMode, setDetailsMode] = useState<'create' | 'edit' | 'view' | null>(null);
  const [selectedSectionId, setSelectedSectionId] = useState<string | undefined>();
  const [sortField, setSortField] = useState<SortField>('sectionId');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [selectedSections, setSelectedSections] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [availableClasses, setAvailableClasses] = useState<Array<{ classId: string; name: string }>>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Import loading state
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });
  
  // Delete dialog state
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    section?: SectionExtended;
    isBulk?: boolean;
  }>({ open: false });

  const {
    sections,
    loading,
    error,
    deleteSection,
    createSection,
    updateSection,
    bulkDeleteSections,
    refresh,
  } = useSections({
    classId: classFilter || undefined,
    status: statusFilter || undefined,
    search: searchTerm,
  });

  const { getPendingRecordId, clearPendingRecordId, currentView } = useApp();

  // Check for pending record ID when component mounts or view changes to sections
  useEffect(() => {
    if (currentView === 'sections' && !detailsMode && sections.length > 0) {
      const pendingId = getPendingRecordId('sections');
      if (pendingId) {
        // Wait a bit for sections to load
        const timer = setTimeout(() => {
          const sectionExists = sections.find(s => s.sectionId === pendingId);
          if (sectionExists) {
            setDetailsMode('view');
            setSelectedSectionId(pendingId);
            clearPendingRecordId('sections');
          } else {
            // If section not found yet, wait a bit more
            setTimeout(() => {
              const sectionExistsRetry = sections.find(s => s.sectionId === pendingId);
              if (sectionExistsRetry) {
                setDetailsMode('view');
                setSelectedSectionId(pendingId);
                clearPendingRecordId('sections');
              }
            }, 500);
          }
        }, 100);
        return () => clearTimeout(timer);
      }
    }
  }, [currentView, sections, detailsMode, getPendingRecordId, clearPendingRecordId]);

  // Load available classes for dropdown
  useEffect(() => {
    const loadClasses = async () => {
      try {
        const classes = await classesService.getForDropdown();
        setAvailableClasses(classes);
      } catch (err) {
        console.error('Error loading classes:', err);
      }
    };
    loadClasses();
  }, []);

  // Sort sections
  const sortedSections = [...sections].sort((a, b) => {
    let aVal: any = a[sortField];
    let bVal: any = b[sortField];

    if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  // Get class name from ID
  const getClassName = (classId?: string | null) => {
    if (!classId) return '—';
    const classData = availableClasses.find(c => c.classId === classId);
    return classData?.name || classId;
  };

  // Open page handlers
  const handleCreate = () => {
    setDetailsMode('create');
    setSelectedSectionId(undefined);
  };

  const handleView = (sectionId: string) => {
    setDetailsMode('view');
    setSelectedSectionId(sectionId);
  };

  const handleEdit = (sectionId: string) => {
    setDetailsMode('edit');
    setSelectedSectionId(sectionId);
  };

  const handleDeleteClick = (section: SectionExtended) => {
    setDeleteDialog({ open: true, section, isBulk: false });
  };

  const handleDeleteConfirm = async () => {
    if (deleteDialog.isBulk) {
      // Bulk delete
      try {
        await bulkDeleteSections(Array.from(selectedSections));
        setSelectedSections(new Set());
      } catch (err: any) {
        // Error already handled in hook
      }
    } else if (deleteDialog.section) {
      // Single delete
      try {
        await deleteSection(deleteDialog.section.sectionId);
      } catch (err: any) {
        // Error already handled in hook
      }
    }
    setDeleteDialog({ open: false });
  };

  const handleBulkDeleteClick = () => {
    setDeleteDialog({ open: true, isBulk: true });
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-4 h-4 text-gray-400" />;
    }
    return sortOrder === 'asc' ? (
      <ArrowUp className="w-4 h-4 text-blue-600" />
    ) : (
      <ArrowDown className="w-4 h-4 text-blue-600" />
    );
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedSections(new Set(sections.map(s => s.sectionId)));
    } else {
      setSelectedSections(new Set());
    }
  };

  const handleSelectSection = (sectionId: string, checked: boolean) => {
    const newSelected = new Set(selectedSections);
    if (checked) {
      newSelected.add(sectionId);
    } else {
      newSelected.delete(sectionId);
    }
    setSelectedSections(newSelected);
  };

  // Generate sample data for sections
  const fillSampleData = async () => {
    // Section names
    const sectionNames = ['A', 'B', 'C', 'D', 'E', 'F'];
    
    // Room number prefixes
    const roomPrefixes = ['1', '2', '3', '4', '5'];
    const roomSuffixes = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10'];

    // Get available classes
    let selectedClassId = '';
    if (availableClasses.length > 0) {
      selectedClassId = availableClasses[Math.floor(Math.random() * availableClasses.length)].classId;
    } else {
      // Fallback to common class IDs
      const commonClasses = ['9', '10', '11', '12'];
      selectedClassId = commonClasses[Math.floor(Math.random() * commonClasses.length)];
    }

    // Get class name for section ID generation
    const className = availableClasses.find(c => c.classId === selectedClassId)?.name || selectedClassId;

    // Generate unique section ID based on class
    let sectionId = '';
    try {
      const existingSections = await sectionsService.getAll({ classId: selectedClassId });
      const existingIds = existingSections.map(s => s.sectionId);
      
      // Try to find next available section letter
      let sectionLetter = '';
      for (const letter of sectionNames) {
        const potentialId = `${selectedClassId}-${letter}`;
        if (!existingIds.includes(potentialId)) {
          sectionLetter = letter;
          break;
        }
      }
      
      // If all letters are taken, use a number
      if (!sectionLetter) {
        let maxNum = 0;
        existingIds.forEach(id => {
          const match = id.match(new RegExp(`${selectedClassId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}-(\\d+)`));
          if (match) {
            const num = parseInt(match[1]);
            if (num > maxNum) maxNum = num;
          }
        });
        sectionLetter = String(maxNum + 1);
      }
      
      sectionId = `${selectedClassId}-${sectionLetter}`;
    } catch (err) {
      // Fallback
      const letter = sectionNames[Math.floor(Math.random() * sectionNames.length)];
      sectionId = `${selectedClassId}-${letter}`;
    }

    // Generate section name
    const sectionName = `Section ${sectionId.split('-')[1]}`;

    // Generate random room number
    const roomPrefix = roomPrefixes[Math.floor(Math.random() * roomPrefixes.length)];
    const roomSuffix = roomSuffixes[Math.floor(Math.random() * roomSuffixes.length)];
    const roomNumber = `${roomPrefix}${roomSuffix}`;

    // Random capacity (20-40 students)
    const capacity = Math.floor(Math.random() * 21) + 20;

    // Mostly Active (80% chance)
    const status = Math.random() > 0.2 ? 'Active' : 'Inactive';

    // Update form data
    setFormData({
      sectionId,
      classId: selectedClassId,
      name: sectionName,
      capacity,
      roomNumber,
      status: status as 'Active' | 'Inactive',
    });

    toast.success('Sample data filled! Review and submit when ready.');
  };

  // Handle file upload
  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const fileExtension = file.name.split('.').pop()?.toLowerCase();

    setIsImporting(true);
    setImportProgress({ current: 0, total: 0 });

    try {
      let rows: any[] = [];

      if (fileExtension === 'csv') {
        const text = await file.text();
        const result = Papa.parse(text, { header: true, skipEmptyLines: true });
        rows = result.data;
      } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        rows = XLSX.utils.sheet_to_json(worksheet);
      } else if (fileExtension === 'json') {
        const text = await file.text();
        rows = JSON.parse(text);
      } else {
        throw new Error('Unsupported file format');
      }

      setImportProgress({ current: 0, total: rows.length });

      let successCount = 0;
      let errorCount = 0;
      const errors: string[] = [];

      for (const row of rows) {
        try {
          const sectionId = row.sectionId || row.SectionID || row.section_id;
          const classId = row.classId || row.ClassID || row.class_id;
          const name = row.name || row.Name;
          const capacity = row.capacity || row.Capacity;
          const roomNumber = row.roomNumber || row.RoomNumber || row.room_number || '';
          const status = row.status || row.Status || 'Active';

          if (!sectionId || !name) {
            throw new Error('SectionID and Name are required');
          }

          await createSection({
            sectionId,
            classId: classId || undefined, // Optional now
            name,
            capacity: capacity ? Number(capacity) : undefined,
            roomNumber,
            status: status as 'Active' | 'Inactive',
          });
          successCount++;
        } catch (err: any) {
          errors.push(`Error importing ${row.name || 'Unknown'}: ${err.message}`);
          errorCount++;
        }
        setImportProgress(prev => ({ ...prev, current: prev.current + 1 }));
      }

      setIsImporting(false);

      if (successCount > 0) {
        toast.success(`Successfully imported ${successCount} section(s)`, {
          duration: 5000,
        });
      }
      if (errorCount > 0) {
        toast.error(`Failed to import ${errorCount} section(s)`, {
          description: errors.slice(0, 3).join('\n') + (errors.length > 3 ? '\n...' : ''),
        });
      }

      refresh();
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err: any) {
      setIsImporting(false);
      toast.error(`Failed to process file: ${err.message}`);
    }
  };

  // Export to Excel
  const handleExportExcel = () => {
    const dataToExport = selectedSections.size > 0
      ? sortedSections.filter(s => selectedSections.has(s.sectionId))
      : sortedSections;

    const worksheet = XLSX.utils.json_to_sheet(dataToExport.map(s => ({
      sectionId: s.sectionId,
      classId: s.classId,
      name: s.name,
      capacity: s.capacity || 0,
      currentStrength: s.currentStrength || 0,
      roomNumber: s.roomNumber || '',
      status: s.status,
    })));

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sections');
    XLSX.writeFile(workbook, `sections_${new Date().toISOString().split('T')[0]}.xlsx`);
    
    toast.success(`Exported ${dataToExport.length} sections to Excel`);
  };

  // Export to CSV
  const handleExportCSV = () => {
    const dataToExport = selectedSections.size > 0
      ? sortedSections.filter(s => selectedSections.has(s.sectionId))
      : sortedSections;

    const csv = Papa.unparse(dataToExport.map(s => ({
      sectionId: s.sectionId,
      classId: s.classId,
      name: s.name,
      capacity: s.capacity || 0,
      currentStrength: s.currentStrength || 0,
      roomNumber: s.roomNumber || '',
      status: s.status,
    })));

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `sections_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    
    toast.success(`Exported ${dataToExport.length} sections to CSV`);
  };

  // Export to JSON
  const handleExportJSON = () => {
    const dataToExport = selectedSections.size > 0
      ? sortedSections.filter(s => selectedSections.has(s.sectionId))
      : sortedSections;

    const jsonString = JSON.stringify(dataToExport, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `sections_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    toast.success(`Exported ${dataToExport.length} sections to JSON`);
  };

  const allSelected = sections.length > 0 && selectedSections.size === sections.length;
  const someSelected = selectedSections.size > 0 && selectedSections.size < sections.length;

  // Show details page
  if (detailsMode) {
    return (
      <SectionDetails
        mode={detailsMode}
        sectionId={selectedSectionId}
        onBack={() => {
          setDetailsMode(null);
          setSelectedSectionId(undefined);
        }}
        onSuccess={() => {
          setDetailsMode(null);
          setSelectedSectionId(undefined);
          refresh();
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header - Sticky */}
      <div className="sticky top-0 z-20 bg-white pb-6 pt-6 px-6 -mx-6 border-b shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900">Sections Management</h1>
              <Badge variant="secondary" className="bg-purple-100 text-purple-700 hover:bg-purple-200">
                β
              </Badge>
            </div>
            <p className="text-gray-500 mt-1">
              Manage section records with live database ({sections.length} sections)
            </p>
          </div>
          <div className="flex gap-2">
            <Button className="gap-2" onClick={handleCreate}>
              <Plus className="w-4 h-4" />
              Add Section
            </Button>
          </div>
        </div>

        {/* Section Management Action Bar - Excel-like grouped partitions */}
        <div className="mt-4 bg-gray-50 rounded-lg border border-gray-200 p-3">
          <div className="flex items-center gap-4 flex-wrap">
            {/* Group 1: Database Actions */}
            <div className="flex items-center gap-2 pr-4 border-r border-gray-300">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Database</span>
              <Button
                variant="outline"
                size="sm"
                onClick={refresh}
                className="gap-2 h-8"
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              {selectedSections.size > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBulkDeleteClick}
                  className="gap-2 h-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete ({selectedSections.size})
                </Button>
              )}
            </div>

            {/* Group 2: Import/Export Actions */}
            <div className="flex items-center gap-2 pr-4 border-r border-gray-300">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Data</span>
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls,.json"
                  onChange={handleImport}
                  className="hidden"
                  disabled={isImporting}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="gap-2 h-8"
                  disabled={isImporting}
                >
                  {isImporting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Import
                    </>
                  )}
                </Button>
              </div>
              {sections.length > 0 && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExportExcel}
                    className="gap-2 h-8"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    Export Excel
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExportCSV}
                    className="gap-2 h-8"
                  >
                    <File className="w-4 h-4" />
                    Export CSV
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExportJSON}
                    className="gap-2 h-8"
                  >
                    <FileJson className="w-4 h-4" />
                    Export JSON
                  </Button>
                </>
              )}
            </div>

            {/* Group 3: Filter Actions */}
            <div className="flex items-center gap-2 pr-4 border-r border-gray-300 flex-1">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Filters</span>
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search sections..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-8"
                />
              </div>
              <select
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
                className="h-8 px-3 border border-gray-300 rounded-md text-sm bg-white"
              >
                <option value="">All Classes</option>
                {availableClasses.map((cls) => (
                  <option key={cls.classId} value={cls.classId}>
                    {cls.name}
                  </option>
                ))}
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-8 px-3 border border-gray-300 rounded-md text-sm bg-white"
              >
                <option value="">All Status</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
              {(searchTerm || statusFilter || classFilter) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('');
                    setClassFilter('');
                  }}
                  className="h-8 text-gray-600"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>

            {/* Group 4: View Toggle */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">View</span>
              <div className="flex border border-gray-300 rounded-md overflow-hidden">
                <Button
                  variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="h-8 rounded-none border-r border-gray-300"
                >
                  <LayoutGrid className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="h-8 rounded-none"
                >
                  <ListIcon className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-red-600">
              <p className="font-medium">Error loading sections</p>
              <p className="text-sm mt-1">{error}</p>
              <Button onClick={refresh} className="mt-4">
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!loading && !error && sections.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-gray-500">
              <Database className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="font-medium">No sections found</p>
              <p className="text-sm mt-1">Get started by adding your first section</p>
              <Button onClick={handleCreate} className="mt-4 gap-2">
                <Plus className="w-4 h-4" />
                Add Section
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Grid View */}
      {!loading && !error && sortedSections.length > 0 && viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedSections.map((section) => (
            <Card key={section.sectionId} className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center">
                      <DoorOpen className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">{section.name}</h3>
                      <Badge variant="outline" className="text-xs">
                        {section.sectionId}
                      </Badge>
                    </div>
                  </div>
                  <Checkbox
                    checked={selectedSections.has(section.sectionId)}
                    onCheckedChange={(checked) => 
                      handleSelectSection(section.sectionId, checked as boolean)
                    }
                  />
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Class</span>
                    {section.classId ? (
                      <Badge variant="secondary">{getClassName(section.classId)}</Badge>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </div>
                  {section.roomNumber && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Room</span>
                      <span className="font-semibold">{section.roomNumber}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      Students
                    </span>
                    <span className="font-semibold">
                      {section.currentStrength || 0}
                      {section.capacity ? ` / ${section.capacity}` : ''}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t">
                  <Badge 
                    variant={section.status === 'Active' ? 'default' : 'secondary'}
                    className={
                      section.status === 'Active' 
                        ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                        : 'bg-gray-100 text-gray-600'
                    }
                  >
                    {section.status}
                  </Badge>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleView(section.sectionId)}
                      className="h-8 w-8 p-0"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(section.sectionId)}
                      className="h-8 w-8 p-0"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteClick(section)}
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* List View */}
      {!loading && !error && sortedSections.length > 0 && viewMode === 'list' && (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="w-12">
                      <Checkbox
                        checked={allSelected}
                        onCheckedChange={handleSelectAll}
                        aria-label="Select all"
                        className={someSelected ? 'opacity-50' : ''}
                      />
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('sectionId')}
                    >
                      <div className="flex items-center gap-2">
                        Section ID
                        <SortIcon field="sectionId" />
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('name')}
                    >
                      <div className="flex items-center gap-2">
                        Name
                        <SortIcon field="name" />
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('classId')}
                    >
                      <div className="flex items-center gap-2">
                        Class
                        <SortIcon field="classId" />
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('roomNumber')}
                    >
                      <div className="flex items-center gap-2">
                        Room Number
                        <SortIcon field="roomNumber" />
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('capacity')}
                    >
                      <div className="flex items-center gap-2">
                        Capacity
                        <SortIcon field="capacity" />
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('currentStrength')}
                    >
                      <div className="flex items-center gap-2">
                        Current Strength
                        <SortIcon field="currentStrength" />
                      </div>
                    </TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedSections.map((section) => (
                    <TableRow key={section.sectionId} className="hover:bg-gray-50">
                      <TableCell>
                        <Checkbox
                          checked={selectedSections.has(section.sectionId)}
                          onCheckedChange={(checked) => 
                            handleSelectSection(section.sectionId, checked as boolean)
                          }
                          aria-label={`Select ${section.name}`}
                        />
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        <button
                          onClick={() => handleView(section.sectionId)}
                          className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
                        >
                          {section.sectionId}
                        </button>
                      </TableCell>
                      <TableCell className="font-medium">
                        <button
                          onClick={() => handleView(section.sectionId)}
                          className="text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          {section.name}
                        </button>
                      </TableCell>
                      <TableCell>
                        {section.classId ? (
                          <Badge variant="secondary">{getClassName(section.classId)}</Badge>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </TableCell>
                      <TableCell>{section.roomNumber || '—'}</TableCell>
                      <TableCell>{section.capacity || '—'}</TableCell>
                      <TableCell>{section.currentStrength || 0}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={section.status === 'Active' ? 'default' : 'secondary'}
                          className={
                            section.status === 'Active' 
                              ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                              : 'bg-gray-100 text-gray-600'
                          }
                        >
                          {section.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleView(section.sectionId)}
                            className="h-8 w-8 p-0"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(section.sectionId)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteClick(section)}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false })}
        onConfirm={handleDeleteConfirm}
        title={deleteDialog.isBulk ? 'Delete Sections' : 'Delete Section'}
        description={
          deleteDialog.isBulk
            ? `Are you sure you want to delete ${selectedSections.size} section(s)? This action cannot be undone.`
            : `Are you sure you want to delete section "${deleteDialog.section?.name}"? This action cannot be undone.`
        }
      />
    </div>
  );
}
