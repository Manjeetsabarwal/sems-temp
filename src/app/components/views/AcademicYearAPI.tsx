import React, { useState, useEffect } from 'react';
import { Plus, Grid, List, Search, Filter, Download, Upload, RefreshCw, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { toast } from 'sonner';
import { academicYearsService, type AcademicYear } from '../../services/academic-years.service';
import { AcademicYearDetails } from './AcademicYearDetails';


type ViewMode = 'grid' | 'list';
type DetailsMode = 'create' | 'edit' | 'view' | null;

export function AcademicYearAPI() {
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [detailsMode, setDetailsMode] = useState<DetailsMode>(null);
  const [selectedYearId, setSelectedYearId] = useState<string | undefined>(undefined);

  useEffect(() => {
    fetchAcademicYears();
  }, [statusFilter]);

  const fetchAcademicYears = async () => {
    setLoading(true);
    try {
      const filters = statusFilter !== 'All' ? { status: statusFilter } : {};
      const data = await academicYearsService.getAll(filters);
      setAcademicYears(data);
      console.log('✅ Loaded academic years:', data.length);
    } catch (error: any) {
      console.error('❌ Error fetching academic years:', error);
      toast.error('Failed to load academic years');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (yearId: string) => {
    if (!confirm('Are you sure you want to delete this academic year?')) return;

    try {
      await academicYearsService.delete(yearId);
      toast.success('Academic year deleted successfully');
      fetchAcademicYears();
    } catch (error: any) {
      console.error('❌ Error deleting academic year:', error);
      toast.error(error.message || 'Failed to delete academic year');
    }
  };

  const handleCreateNew = () => {
    setSelectedYearId(undefined);
    setDetailsMode('create');
  };

  const handleView = (yearId: string) => {
    setSelectedYearId(yearId);
    setDetailsMode('view');
  };

  const handleEdit = (yearId: string) => {
    setSelectedYearId(yearId);
    setDetailsMode('edit');
  };

  const handleBack = () => {
    setDetailsMode(null);
    setSelectedYearId(undefined);
  };

  const handleSuccess = () => {
    fetchAcademicYears();
    if (detailsMode === 'create') {
      setDetailsMode(null);
    }
  };

  const filteredYears = academicYears.filter(
    (year) =>
      year.academicYearId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (detailsMode) {
    return (
      <AcademicYearDetails
        mode={detailsMode}
        yearId={selectedYearId}
        onBack={handleBack}
        onSuccess={handleSuccess}
      />
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Sticky Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        {/* Title Section */}
        <div className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Calendar className="w-6 h-6 text-blue-600" />
                Academic Year Management
              </h1>
              <p className="text-gray-500 mt-1">
                Manage academic years and sessions for the school
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-sm">
                {filteredYears.length} Year{filteredYears.length !== 1 ? 's' : ''}
              </Badge>
            </div>
          </div>
        </div>

        {/* Action Bar - Excel-style grouped partitions */}
        <div className="px-6 py-3 flex items-center justify-between gap-4 bg-gray-50/50">
          {/* Database Group */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white border rounded-lg">
            <span className="text-xs font-medium text-gray-500 uppercase">Database</span>
            <div className="w-px h-4 bg-gray-300" />
            <Button size="sm" variant="default" onClick={handleCreateNew} className="h-7">
              <Plus className="w-3.5 h-3.5 mr-1" />
              New
            </Button>
            <Button size="sm" variant="ghost" onClick={fetchAcademicYears} className="h-7">
              <RefreshCw className="w-3.5 h-3.5" />
            </Button>
          </div>

          {/* Data Group */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white border rounded-lg">
            <span className="text-xs font-medium text-gray-500 uppercase">Data</span>
            <div className="w-px h-4 bg-gray-300" />
            <Button size="sm" variant="ghost" className="h-7">
              <Upload className="w-3.5 h-3.5 mr-1" />
              Import
            </Button>
            <Button size="sm" variant="ghost" className="h-7">
              <Download className="w-3.5 h-3.5 mr-1" />
              Export
            </Button>
          </div>

          {/* Filters Group */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white border rounded-lg flex-1 max-w-2xl">
            <span className="text-xs font-medium text-gray-500 uppercase">Filters</span>
            <div className="w-px h-4 bg-gray-300" />
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <Input
                placeholder="Search by Year ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 h-7 text-sm"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-7 text-sm border border-gray-300 rounded px-2 bg-white"
            >
              <option value="All">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Upcoming">Upcoming</option>
            </select>
          </div>

          {/* View Toggle */}
          <div className="flex items-center gap-1 px-2 py-1 bg-white border rounded-lg">
            <Button
              size="sm"
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              onClick={() => setViewMode('grid')}
              className="h-7 w-7 p-0"
            >
              <Grid className="w-3.5 h-3.5" />
            </Button>
            <Button
              size="sm"
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              onClick={() => setViewMode('list')}
              className="h-7 w-7 p-0"
            >
              <List className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading academic years...</p>
            </div>
          </div>
        ) : filteredYears.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Academic Years Found</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || statusFilter !== 'All'
                  ? 'Try adjusting your filters'
                  : 'Get started by creating your first academic year'}
              </p>
              {!searchTerm && statusFilter === 'All' && (
                <Button onClick={handleCreateNew}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Academic Year
                </Button>
              )}
            </CardContent>
          </Card>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredYears.map((year) => (
              <Card
                key={year.academicYearId}
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => handleView(year.academicYearId)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-2xl font-bold text-blue-600">
                        {year.academicYearId}
                      </CardTitle>
                      <Badge
                        variant={
                          year.status === 'Active'
                            ? 'default'
                            : year.status === 'Upcoming'
                            ? 'secondary'
                            : 'outline'
                        }
                        className="mt-2"
                      >
                        {year.status}
                      </Badge>
                    </div>
                    <Calendar className="w-8 h-8 text-gray-300" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Start Date:</span>
                      <span className="font-medium">
                        {new Date(year.startDate).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">End Date:</span>
                      <span className="font-medium">
                        {new Date(year.endDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(year.academicYearId);
                      }}
                      className="flex-1"
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(year.academicYearId);
                      }}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Academic Year ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Start Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        End Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredYears.map((year) => (
                      <tr
                        key={year.academicYearId}
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => handleView(year.academicYearId)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleView(year.academicYearId);
                            }}
                            className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
                          >
                            {year.academicYearId}
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {new Date(year.startDate).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {new Date(year.endDate).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge
                            variant={
                              year.status === 'Active'
                                ? 'default'
                                : year.status === 'Upcoming'
                                ? 'secondary'
                                : 'outline'
                            }
                          >
                            {year.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEdit(year.academicYearId);
                              }}
                            >
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(year.academicYearId);
                              }}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
