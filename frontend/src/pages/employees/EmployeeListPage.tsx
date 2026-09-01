import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Trash2,
  Edit2,
  Compass,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  XCircle,
  MoreVertical,
  Building2,
  Phone,
  RotateCcw,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { Employee } from '../../types';
import api from '../../api/client';

import { EmployeeFormModal } from './EmployeeFormModal';

export const EmployeeListPage: React.FC = () => {
  const { user, selectedBranch } = useAuth();
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [outdoorFilter, setOutdoorFilter] = useState<string>('all');

  // Edit and Delete State
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Employee | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const fetchEmployees = async () => {
    setIsLoading(true);
    try {
      const res = await api.get<Employee[]>('/api/v1/employees');
      setEmployees(res.data);
    } catch (err) {
      console.error('Failed to load employees:', err);
      toastError('Failed to fetch showroom employees.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await api.delete(`/api/v1/employees/${deleteTarget.id}`);
      success(`Employee ${deleteTarget.full_name} removed.`);
      setDeleteTarget(null);
      fetchEmployees();
    } catch (err: any) {
      toastError(err.response?.data?.detail || 'Failed to delete employee.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setDepartmentFilter('all');
    setOutdoorFilter('all');
  };

  const hasActiveFilters =
    searchTerm.trim() !== '' ||
    statusFilter !== 'all' ||
    departmentFilter !== 'all' ||
    outdoorFilter !== 'all';

  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      emp.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.employee_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.designation.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || emp.status === statusFilter;
    const matchesDept = departmentFilter === 'all' || emp.department === departmentFilter;
    const matchesOutdoor =
      outdoorFilter === 'all' ||
      (outdoorFilter === 'outdoor' && (emp.is_outdoor_marketing_employee || emp.department === 'Outdoor Marketing')) ||
      (outdoorFilter === 'showroom' && !emp.is_outdoor_marketing_employee && emp.department !== 'Outdoor Marketing');

    return matchesSearch && matchesStatus && matchesDept && matchesOutdoor;
  });

  const totalCount = employees.length;
  const activeCount = employees.filter((e) => e.status === 'active').length;
  const inactiveCount = employees.filter((e) => e.status === 'inactive').length;
  const outdoorCount = employees.filter(
    (e) => e.is_outdoor_marketing_employee || e.department === 'Outdoor Marketing'
  ).length;

  return (
    <div className="space-y-6 pb-16">
      {/* 1. Light Slate Sapphire Hero Banner */}
      <div className="relative bg-linear-to-br from-[#FAF8F3] via-white to-[#F0F4F8] border border-[#C5D5E6] rounded-3xl p-6 sm:p-8 shadow-sm text-[#1D1D1B] overflow-hidden">
        {/* Subtle Ambient Blue Shimmer */}
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-linear-to-r from-transparent via-[#536B8A] to-transparent opacity-60 animate-pulse" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2.5">
            {/* Showroom Badge */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-white backdrop-blur-xs text-[#536B8A] border border-[#C5D5E6] flex items-center gap-2 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-[#536B8A] animate-pulse" />
                <span>{selectedBranch?.name || 'Showroom'} Staff</span>
              </span>

              <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#EDF2F7] text-[#536B8A] border border-[#C5D5E6] shadow-2xs">
                {totalCount} Total Employees
              </span>
            </div>

            {/* Title & Subtitle in Clean Slate Blue Typography */}
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#1D1D1B] tracking-tight flex items-center gap-2.5">
                <Users className="w-6 h-6 text-[#536B8A]" />
                <span>Showroom Employees Directory</span>
              </h1>
              <p className="text-xs sm:text-sm text-[#536B8A] font-medium mt-1 max-w-2xl">
                Manage showroom workforce, attendance rosters, sales floor assignments, and field marketing representatives for <span className="font-bold text-[#1D1D1B] underline decoration-[#536B8A]/40 underline-offset-2">{selectedBranch?.name || 'Showroom'}</span>
              </p>
            </div>
          </div>

          {/* Quick Action: Add Employee in Slate Blue */}
          <div className="flex items-center gap-3 self-start md:self-auto shrink-0">
            <button
              onClick={() => navigate('/employees/add')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#536B8A] hover:bg-[#40546D] text-white text-xs font-bold shadow-sm transition-all cursor-pointer hover:scale-[1.02]"
            >
              <UserPlus className="w-4 h-4 text-white" />
              <span>+ Add Employee</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Workforce Metric KPI Cards (Clean Light Surfaces on #F6F3EC) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Staff (Slate Blue Accent) */}
        <div className="bg-white border border-[#C5D5E6] hover:border-[#536B8A] rounded-2xl p-4 sm:p-5 shadow-[0_4px_18px_rgba(40,35,25,0.045)] flex items-center justify-between transition-colors">
          <div>
            <span className="text-[10px] sm:text-[11px] font-bold text-[#536B8A] uppercase tracking-wider block mb-1">
              Total Staff
            </span>
            <div className="text-xl sm:text-2xl font-bold text-[#1D1D1B]">{totalCount}</div>
            <span className="text-[10px] text-[#536B8A] font-medium">Registered Personnel</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#EDF2F7] border border-[#C5D5E6] text-[#536B8A] flex items-center justify-center font-bold">
            <Users className="w-4 h-4" />
          </div>
        </div>

        {/* Active on Duty (Green Accent) */}
        <div className="bg-white border border-[#E4DFD4] hover:border-[#C5E3D5] rounded-2xl p-4 sm:p-5 shadow-[0_4px_18px_rgba(40,35,25,0.045)] flex items-center justify-between transition-colors">
          <div>
            <span className="text-[10px] sm:text-[11px] font-bold text-[#8A8479] uppercase tracking-wider block mb-1">
              Active on Duty
            </span>
            <div className="text-xl sm:text-2xl font-bold text-[#21845F]">{activeCount}</div>
            <span className="text-[10px] text-[#21845F] font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#21845F]" />
              {totalCount > 0 ? Math.round((activeCount / totalCount) * 100) : 100}% Active
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#E8F4EE] border border-[#C5E3D5] text-[#21845F] flex items-center justify-center font-bold">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>

        {/* Outdoor Marketers (Slate Blue / Gold Accent) */}
        <div className="bg-white border border-[#E4DFD4] hover:border-[#C5D5E6] rounded-2xl p-4 sm:p-5 shadow-[0_4px_18px_rgba(40,35,25,0.045)] flex items-center justify-between transition-colors">
          <div>
            <span className="text-[10px] sm:text-[11px] font-bold text-[#536B8A] uppercase tracking-wider block mb-1">
              Field Marketers
            </span>
            <div className="text-xl sm:text-2xl font-bold text-[#536B8A]">{outdoorCount}</div>
            <span className="text-[10px] text-[#536B8A] font-semibold">Outdoor Staff</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#EDF2F7] border border-[#C5D5E6] text-[#536B8A] flex items-center justify-center font-bold">
            <Compass className="w-4 h-4 text-[#536B8A]" />
          </div>
        </div>

        {/* Inactive / Available */}
        <div className="bg-white border border-[#E4DFD4] rounded-2xl p-4 sm:p-5 shadow-[0_4px_18px_rgba(40,35,25,0.045)] flex items-center justify-between">
          <div>
            <span className="text-[10px] sm:text-[11px] font-bold text-[#8A8479] uppercase tracking-wider block mb-1">
              Inactive
            </span>
            <div className="text-xl sm:text-2xl font-bold text-[#8A8479]">{inactiveCount}</div>
            <span className="text-[10px] text-[#8A8479] font-medium">On Leave / Rest</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#FAF8F3] border border-[#E4DFD4] text-[#8A8479] flex items-center justify-center font-bold">
            <Users className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* 3. SaaS Toolbar: Search & Filters (Responsive & Full-Width on Mobile) */}
      <div className="bg-white border border-[#E4DFD4] rounded-2xl p-3.5 sm:p-4 shadow-[0_4px_18px_rgba(40,35,25,0.045)] flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Search */}
        <div className="w-full lg:w-72 xl:w-80 relative flex items-center shrink-0">
          <Search className="absolute left-3.5 w-4 h-4 text-[#536B8A]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, code, or role..."
            className="w-full pl-9 pr-3.5 py-2.5 input-luxury-beige rounded-xl text-xs transition-all font-medium"
          />
        </div>

        {/* Filters: Fully Responsive Grid on Mobile, Flex on Desktop */}
        <div className="w-full lg:w-auto flex-1 grid grid-cols-1 sm:grid-cols-3 lg:flex items-center gap-2 lg:justify-end">
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="w-full lg:w-auto select-luxury-slate rounded-xl px-3 py-2.5 text-xs font-semibold cursor-pointer"
          >
            <option value="all">All Departments</option>
            <option value="Sales Department">Sales Department</option>
            <option value="Marketing">Marketing</option>
            <option value="Outdoor Marketing">Outdoor Marketing</option>
          </select>

          <select
            value={outdoorFilter}
            onChange={(e) => setOutdoorFilter(e.target.value)}
            className="w-full lg:w-auto select-luxury-slate rounded-xl px-3 py-2.5 text-xs font-semibold cursor-pointer"
          >
            <option value="all">All Roles</option>
            <option value="showroom">Showroom Floor</option>
            <option value="outdoor">Outdoor Marketing</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full lg:w-auto select-luxury-slate rounded-xl px-3 py-2.5 text-xs font-semibold cursor-pointer"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          {/* Refresh / Fetch Button */}
          <button
            onClick={fetchEmployees}
            title="Fetch and reload latest employee records"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-[#536B8A] bg-[#EDF2F7] border border-[#C5D5E6] hover:bg-[#E2E8F0] transition-colors cursor-pointer shrink-0"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Fetch / Refresh</span>
          </button>

          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              title="Clear active filters"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-[#B97855] bg-[#FAF1EC] border border-[#ECCFC0] hover:bg-[#F5E2D6] transition-colors cursor-pointer shrink-0"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          )}
        </div>
      </div>

      {/* 4. Data Table (Light White Card with #FAF8F3 Header & Blue Accents) */}
      {isLoading ? (
        <div className="py-20 flex justify-center bg-white border border-[#E4DFD4] rounded-3xl shadow-2xs">
          <LoadingSpinner message="Loading employee records..." />
        </div>
      ) : filteredEmployees.length === 0 ? (
        <EmptyState
          title="No employees found."
          description="Try adjusting your search query or department filter."
          icon={Users}
          actionText="Add Showroom Employee"
          onAction={() => navigate('/employees/add')}
          actionIcon={<UserPlus className="w-4 h-4" />}
        />
      ) : (
        <div className="bg-white border border-[#E4DFD4] rounded-3xl overflow-hidden shadow-[0_4px_18px_rgba(40,35,25,0.045)]">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#FAF8F3] border-b border-[#E4DFD4] text-[#536B8A] uppercase tracking-wider font-bold text-[11px]">
                <tr>
                  <th className="px-5 py-4 w-12 text-center text-[#8A8479]">#</th>
                  <th className="px-5 py-4">Employee Details</th>
                  <th className="px-5 py-4">Badge Code</th>
                  <th className="px-5 py-4">Designation</th>
                  <th className="px-5 py-4">Department</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EBE6DC] font-medium">
                {filteredEmployees.map((emp, index) => {
                  const isOutdoor = emp.department === 'Outdoor Marketing' || emp.is_outdoor_marketing_employee;
                  return (
                    <tr
                      key={emp.id}
                      onClick={() => navigate(`/employees/${emp.id}`)}
                      className="hover:bg-[#F0F4F8]/70 transition-colors cursor-pointer group"
                    >
                      <td className="px-5 py-4 text-center text-[#8A8479] font-mono">
                        {index + 1}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-[#EDF2F7] border border-[#C5D5E6] text-[#536B8A] flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                            {emp.profile_photo_url ? (
                              <img
                                src={emp.profile_photo_url}
                                alt={emp.full_name}
                                className="w-full h-full object-cover rounded-xl"
                              />
                            ) : (
                              emp.full_name.charAt(0)
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-[#1D1D1B] group-hover:text-[#536B8A] transition-colors">
                              {emp.full_name}
                            </p>
                            <p className="text-[11px] text-[#536B8A] font-medium">{emp.designation || 'Showroom Executive'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 sm:px-5 py-4 font-mono text-xs whitespace-nowrap">
                        <span className="px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-md bg-[#EDF2F7] border border-[#C5D5E6] text-[#536B8A] font-bold text-[10px] sm:text-xs shadow-2xs whitespace-nowrap inline-flex items-center shrink-0">
                          {emp.employee_code}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-[#536B8A] font-semibold">
                        {emp.designation || (isOutdoor ? 'Field Marketing Executive' : 'Sales Executive')}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <span className="text-[#5E5A52]">{emp.department || 'Sales Department'}</span>
                          {isOutdoor && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#EDF2F8] text-[#526F91] border border-[#C6D4E3] text-[10px] font-bold">
                              <Compass className="w-3 h-3 text-[#526F91]" />
                              <span>Outdoor</span>
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          emp.status === 'active'
                            ? 'bg-[#E8F4EE] text-[#21845F] border border-[#C5E3D5]'
                            : 'bg-[#FAF8F3] text-[#8A8479] border border-[#E4DFD4]'
                        }`}>
                          {emp.status === 'active' ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => navigate(`/employees/${emp.id}`)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white hover:bg-[#EDF2F7] border border-[#C5D5E6] text-[#536B8A] font-bold text-xs shadow-2xs transition-all cursor-pointer hover:scale-105"
                          >
                            <span>Profile</span>
                            <ArrowRight className="w-3 h-3 text-[#536B8A]" />
                          </button>
                          <button
                            onClick={() => setEditingEmployee(emp)}
                            title="Edit Employee"
                            className="p-1.5 text-[#8A8479] hover:text-[#536B8A] hover:bg-[#EDF2F7] rounded-lg transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(emp)}
                            title="Delete Employee"
                            className="p-1.5 text-[#8A8479] hover:text-[#A94A4A] hover:bg-[#F9EAEA] rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="px-5 py-3 bg-[#FAF8F3] border-t border-[#E4DFD4] flex items-center justify-between text-xs text-[#536B8A] font-medium">
            <span>Showing {filteredEmployees.length} of {totalCount} registered personnel</span>
            <span className="font-semibold text-[#1D1D1B]">{selectedBranch?.name} Branch Roster</span>
          </div>
        </div>
      )}

      {/* Edit Employee Modal */}
      <EmployeeFormModal
        isOpen={!!editingEmployee}
        onClose={() => setEditingEmployee(null)}
        onSuccess={fetchEmployees}
        employeeToEdit={editingEmployee}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Remove Showroom Employee"
        message={`Are you sure you want to delete ${deleteTarget?.full_name} (${deleteTarget?.employee_code})? All associated customer logs will be unassigned.`}
        confirmText="Delete Employee"
        cancelText="Cancel"
        variant="danger"
        isLoading={isDeleting}
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
};

