import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Users,
  Search,
  Plus,
  Building2,
  Phone,
  Mail,
  Calendar,
  Filter,
  RefreshCw,
  MapPin,
  CheckCircle2,
  XCircle,
  Briefcase,
  UserPlus,
  Eye,
  Edit2,
  Trash2,
  X,
  Sparkles,
  ShoppingBag,
  IndianRupee,
  Receipt,
  CalendarDays,
  Award,
} from 'lucide-react';
import api from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';

export const HrEmployeesPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { success, error: toastError } = useToast();

  const [employees, setEmployees] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [branchFilter, setBranchFilter] = useState<string>(
    searchParams.get('branch')?.toUpperCase() || 'ALL'
  );

  // Add Employee Modal State
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [addForm, setAddForm] = useState({
    branch_code: 'YELAHANKA',
    full_name: '',
    employee_code: '',
    phone: '',
    email: '',
    designation: 'Sales Executive',
    department: 'Sales & Showroom Operations',
    date_of_joining: new Date().toISOString().slice(0, 10),
    notes: '',
  });

  // Edit Employee Modal State
  const [editingEmployee, setEditingEmployee] = useState<any | null>(null);
  const [isUpdatingEmployee, setIsUpdatingEmployee] = useState<boolean>(false);
  const [editForm, setEditForm] = useState({
    full_name: '',
    employee_code: '',
    phone: '',
    email: '',
    designation: 'Sales Executive',
    department: 'Sales & Showroom Operations',
    branch_code: 'YELAHANKA',
    date_of_joining: '',
    status: 'active',
    notes: '',
  });

  // Employee Overview Modal State
  const [overviewEmployee, setOverviewEmployee] = useState<any | null>(null);
  const [isLoadingOverview, setIsLoadingOverview] = useState<boolean>(false);

  // Delete Confirm Dialog State
  const [deleteTargetEmp, setDeleteTargetEmp] = useState<any | null>(null);
  const [isDeletingEmp, setIsDeletingEmp] = useState<boolean>(false);

  const fetchEmployees = async () => {
    try {
      setIsLoading(true);
      const params: any = {};
      if (branchFilter !== 'ALL') {
        params.branch_code = branchFilter;
      }
      if (search.trim()) {
        params.search = search.trim();
      }
      const res = await api.get('/api/v1/hr/employees', { params });
      setEmployees(res.data || []);
    } catch (err: any) {
      console.error('Failed to fetch employees:', err);
      toastError('Could not load employees.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const b = searchParams.get('branch')?.toUpperCase();
    setBranchFilter(b || 'ALL');
  }, [searchParams]);

  useEffect(() => {
    fetchEmployees();
  }, [branchFilter]);

  const handleBranchSelect = (code: string) => {
    setBranchFilter(code);
    if (code === 'ALL') {
      searchParams.delete('branch');
    } else {
      searchParams.set('branch', code);
    }
    setSearchParams(searchParams);
  };

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.full_name.trim()) {
      toastError('Employee full name is required.');
      return;
    }
    try {
      setIsSubmitting(true);
      const res = await api.post('/api/v1/hr/employees', addForm);
      success(res.data?.message || 'Employee added successfully.');
      setShowAddModal(false);
      setAddForm({
        branch_code: 'YELAHANKA',
        full_name: '',
        employee_code: '',
        phone: '',
        email: '',
        designation: 'Sales Executive',
        department: 'Sales & Showroom Operations',
        date_of_joining: new Date().toISOString().slice(0, 10),
        notes: '',
      });
      fetchEmployees();
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Failed to add employee.';
      toastError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEdit = (emp: any) => {
    setEditingEmployee(emp);
    setEditForm({
      full_name: emp.full_name || '',
      employee_code: emp.employee_code || '',
      phone: emp.phone || '',
      email: emp.email || '',
      designation: emp.designation || 'Sales Executive',
      department: emp.department || 'Sales & Showroom Operations',
      branch_code: emp.branch_code || 'YELAHANKA',
      date_of_joining: emp.date_of_joining || '',
      status: emp.status || 'active',
      notes: emp.notes || '',
    });
  };

  const handleUpdateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmployee) return;
    if (!editForm.full_name.trim()) {
      toastError('Employee full name is required.');
      return;
    }
    try {
      setIsUpdatingEmployee(true);
      const res = await api.put(`/api/v1/hr/employees/${editingEmployee.id}`, editForm);
      success(res.data?.message || 'Employee updated successfully.');
      setEditingEmployee(null);
      fetchEmployees();
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Failed to update employee details.';
      toastError(msg);
    } finally {
      setIsUpdatingEmployee(false);
    }
  };

  const handleOpenOverview = async (emp: any) => {
    try {
      setIsLoadingOverview(true);
      setOverviewEmployee(emp);
      const res = await api.get(`/api/v1/hr/employees/${emp.id}`);
      if (res.data) {
        setOverviewEmployee(res.data);
      }
    } catch (err: any) {
      console.error('Failed to load employee overview:', err);
      // Fallback to local item
      setOverviewEmployee(emp);
    } finally {
      setIsLoadingOverview(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTargetEmp) return;
    try {
      setIsDeletingEmp(true);
      const res = await api.delete(`/api/v1/hr/employees/${deleteTargetEmp.id}`);
      success(res.data?.message || `Employee ${deleteTargetEmp.full_name} deleted.`);
      setDeleteTargetEmp(null);
      fetchEmployees();
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Failed to delete employee.';
      toastError(msg);
    } finally {
      setIsDeletingEmp(false);
    }
  };

  const filteredEmployees = employees.filter((emp) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      emp.full_name?.toLowerCase().includes(q) ||
      emp.employee_code?.toLowerCase().includes(q) ||
      emp.phone?.includes(q) ||
      emp.designation?.toLowerCase().includes(q) ||
      emp.branch_name?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Top Header */}
      <div className="bg-white border border-[#E4DFD4] rounded-3xl p-6 sm:p-8 shadow-[0_4px_18px_rgba(40,35,25,0.045)] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#EFF6FF] border border-[#BFDBFE] text-[#1D4ED8] flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" />
              <span>Personnel Directory</span>
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#1D1D1B] tracking-tight">
            Employee Directory & Roster
          </h1>
          <p className="text-xs sm:text-sm text-[#5E5A52] font-medium mt-1">
            Manage showroom staff across Yelahanka, Kolar, and Udupi branches with editing, deletion, and performance overview.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 rounded-xl bg-[#21845F] hover:bg-[#1A6B4C] text-white font-extrabold text-xs shadow-sm flex items-center gap-2 cursor-pointer transition-all hover:scale-102"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Employee</span>
          </button>
          <button
            onClick={fetchEmployees}
            className="p-2.5 rounded-xl bg-white border border-[#E4DFD4] hover:bg-[#FAF8F3] text-[#536B8A] transition-colors cursor-pointer"
            title="Refresh List"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Segregated Branches Switcher Bar */}
      <div className="bg-white border border-[#E4DFD4] rounded-2xl p-2.5 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] font-bold text-[#8A8479] uppercase tracking-wider px-2 flex items-center gap-1">
            <Building2 className="w-3.5 h-3.5 text-[#536B8A]" />
            <span>Branch Filter:</span>
          </span>

          <button
            onClick={() => handleBranchSelect('ALL')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              branchFilter === 'ALL'
                ? 'bg-[#18181B] text-white shadow-2xs'
                : 'bg-[#FAF8F3] hover:bg-[#F2EDE4] text-[#5E5A52] border border-[#E4DFD4]'
            }`}
          >
            All Showrooms ({employees.length})
          </button>

          <button
            onClick={() => handleBranchSelect('YELAHANKA')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              branchFilter === 'YELAHANKA'
                ? 'bg-[#D97706] text-white shadow-2xs'
                : 'bg-[#FEF3C7] hover:bg-[#FDE68A] text-[#92400E] border border-[#FDE68A]'
            }`}
          >
            <MapPin className="w-3 h-3" />
            <span>Yelahanka Branch</span>
          </button>

          <button
            onClick={() => handleBranchSelect('KOLAR')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              branchFilter === 'KOLAR'
                ? 'bg-[#0284C7] text-white shadow-2xs'
                : 'bg-[#E0F2FE] hover:bg-[#BAE6FD] text-[#0369A1] border border-[#BAE6FD]'
            }`}
          >
            <MapPin className="w-3 h-3" />
            <span>Kolar Branch</span>
          </button>

          <button
            onClick={() => handleBranchSelect('UDUPI')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              branchFilter === 'UDUPI'
                ? 'bg-[#059669] text-white shadow-2xs'
                : 'bg-[#D1FAE5] hover:bg-[#A7F3D0] text-[#065F46] border border-[#A7F3D0]'
            }`}
          >
            <MapPin className="w-3 h-3" />
            <span>Udupi Branch</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-[#8A8479] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, code, phone..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#FAF8F3] border border-[#E4DFD4] rounded-xl focus:outline-none focus:border-[#21845F] focus:bg-white transition-colors"
          />
        </div>
      </div>

      {/* Employees Table */}
      <div className="bg-white border border-[#E4DFD4] rounded-3xl overflow-hidden shadow-[0_4px_18px_rgba(40,35,25,0.045)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#FAF8F3] border-b border-[#EBE6DC] text-[#6B6559] uppercase font-bold text-[10px] tracking-wider">
                <th className="px-5 py-3.5">Employee Code</th>
                <th className="px-5 py-3.5">Full Name & Role</th>
                <th className="px-5 py-3.5">Branch</th>
                <th className="px-5 py-3.5">Contact Details</th>
                <th className="px-5 py-3.5">Date of Joining</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0ECE1]">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-[#8A8479]">
                    <div className="flex flex-col items-center gap-2">
                      <RefreshCw className="w-5 h-5 animate-spin text-[#D97706]" />
                      <span className="font-semibold">Loading employees...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-[#8A8479]">
                    <p className="font-bold text-sm text-[#1D1D1B]">No employees found.</p>
                    <p className="text-xs mt-1">Try adjusting your branch filter or search query.</p>
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp) => {
                  const bCode = (emp.branch_code || '').toUpperCase();
                  return (
                    <tr key={emp.id} className="hover:bg-[#FAF9F5] transition-colors">
                      {/* Code */}
                      <td className="px-5 py-3.5 font-mono font-bold text-[#536B8A] whitespace-nowrap">
                        <span className="px-2 py-1 rounded-lg bg-[#FAF8F3] border border-[#E4DFD4]">
                          {emp.employee_code}
                        </span>
                      </td>

                      {/* Name & Designation */}
                      <td className="px-5 py-3.5">
                        <div className="font-extrabold text-[#1D1D1B] text-sm">{emp.full_name}</div>
                        <div className="text-[11px] text-[#6B6559] font-medium flex items-center gap-1 mt-0.5">
                          <Briefcase className="w-3 h-3 text-[#8A8479]" />
                          <span>{emp.designation || 'Sales Executive'}</span>
                        </div>
                      </td>

                      {/* Branch */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold border ${
                            bCode === 'YELAHANKA'
                              ? 'bg-[#FEF3C7] text-[#92400E] border-[#FDE68A]'
                              : bCode === 'KOLAR'
                              ? 'bg-[#E0F2FE] text-[#0369A1] border-[#BAE6FD]'
                              : 'bg-[#D1FAE5] text-[#065F46] border-[#A7F3D0]'
                          }`}
                        >
                          <MapPin className="w-3 h-3" />
                          <span>{emp.branch_name || bCode}</span>
                        </span>
                      </td>

                      {/* Contact */}
                      <td className="px-5 py-3.5">
                        <div className="space-y-0.5 font-medium text-[11px]">
                          {emp.phone ? (
                            <div className="flex items-center gap-1.5 text-[#1D1D1B] font-mono">
                              <Phone className="w-3 h-3 text-[#21845F]" />
                              <span>{emp.phone}</span>
                            </div>
                          ) : (
                            <span className="text-[#8A8479]">No phone</span>
                          )}
                          {emp.email && (
                            <div className="flex items-center gap-1.5 text-[#5E5A52]">
                              <Mail className="w-3 h-3 text-[#8A8479]" />
                              <span>{emp.email}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* DOJ */}
                      <td className="px-5 py-3.5 text-[#5E5A52] font-mono whitespace-nowrap">
                        {emp.date_of_joining ? (
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-[#8A8479]" />
                            <span>{emp.date_of_joining}</span>
                          </div>
                        ) : (
                          '—'
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            emp.status === 'active'
                              ? 'bg-[#E8F4EE] text-[#21845F] border border-[#C5E3D5]'
                              : 'bg-[#FEE2E2] text-[#DC2626] border border-[#FECACA]'
                          }`}
                        >
                          {emp.status === 'active' ? (
                            <CheckCircle2 className="w-3 h-3 text-[#21845F]" />
                          ) : (
                            <XCircle className="w-3 h-3 text-[#DC2626]" />
                          )}
                          <span className="capitalize">{emp.status || 'Active'}</span>
                        </span>
                      </td>

                      {/* Actions: Overview, Edit, Delete */}
                      <td className="px-5 py-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Overview Button */}
                          <button
                            onClick={() => handleOpenOverview(emp)}
                            className="p-1.5 rounded-lg bg-[#FAF8F3] hover:bg-[#EFF6FF] text-[#536B8A] hover:text-[#1D4ED8] border border-[#E4DFD4] hover:border-[#BFDBFE] transition-colors cursor-pointer"
                            title="Employee Performance Overview"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit Button */}
                          <button
                            onClick={() => handleOpenEdit(emp)}
                            className="p-1.5 rounded-lg bg-[#FAF8F3] hover:bg-[#FEF3C7] text-[#536B8A] hover:text-[#B45309] border border-[#E4DFD4] hover:border-[#FDE68A] transition-colors cursor-pointer"
                            title="Edit Employee Details"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete Button */}
                          <button
                            onClick={() => setDeleteTargetEmp(emp)}
                            className="p-1.5 rounded-lg bg-[#FAF8F3] hover:bg-[#FEE2E2] text-[#8A8479] hover:text-[#DC2626] border border-[#E4DFD4] hover:border-[#FECACA] transition-colors cursor-pointer"
                            title="Delete Employee Record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 1. Add Employee Modal */}
      {/* ------------------------------------------------------------- */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white border border-[#E4DFD4] rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 bg-[#FAF8F3] border-b border-[#EBE6DC] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#21845F]/10 border border-[#A7F3D0] text-[#21845F] flex items-center justify-center">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[#1D1D1B]">Add New Employee</h3>
                  <p className="text-xs text-[#6B6559]">Assign to showroom branch roster</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="w-8 h-8 rounded-xl bg-white hover:bg-[#F2EDE4] text-[#6B6559] border border-[#E4DFD4] flex items-center justify-center font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateEmployee} className="p-6 overflow-y-auto space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-[#6B6559] uppercase tracking-wider mb-1">
                  Showroom Branch *
                </label>
                <select
                  value={addForm.branch_code}
                  onChange={(e) => setAddForm({ ...addForm, branch_code: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF8F3] border border-[#E4DFD4] text-xs font-bold text-[#1D1D1B] focus:outline-none focus:border-[#21845F] focus:bg-white"
                >
                  <option value="YELAHANKA">Yelahanka Showroom (Main Branch)</option>
                  <option value="KOLAR">Kolar Showroom</option>
                  <option value="UDUPI">Udupi Showroom</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#6B6559] uppercase tracking-wider mb-1">
                  Employee Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={addForm.full_name}
                  onChange={(e) => setAddForm({ ...addForm, full_name: e.target.value })}
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF8F3] border border-[#E4DFD4] text-xs font-semibold text-[#1D1D1B] focus:outline-none focus:border-[#21845F] focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#6B6559] uppercase tracking-wider mb-1">
                    Employee Code (Optional)
                  </label>
                  <input
                    type="text"
                    value={addForm.employee_code}
                    onChange={(e) => setAddForm({ ...addForm, employee_code: e.target.value })}
                    placeholder="e.g. EMP-YEL-220 (auto-generated if empty)"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF8F3] border border-[#E4DFD4] text-xs font-mono font-bold text-[#536B8A] focus:outline-none focus:border-[#21845F] focus:bg-white uppercase"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#6B6559] uppercase tracking-wider mb-1">
                    Designation
                  </label>
                  <input
                    type="text"
                    value={addForm.designation}
                    onChange={(e) => setAddForm({ ...addForm, designation: e.target.value })}
                    placeholder="Sales Executive"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF8F3] border border-[#E4DFD4] text-xs font-semibold text-[#1D1D1B] focus:outline-none focus:border-[#21845F] focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#6B6559] uppercase tracking-wider mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={addForm.phone}
                    onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })}
                    placeholder="10 digit mobile"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF8F3] border border-[#E4DFD4] text-xs font-mono text-[#1D1D1B] focus:outline-none focus:border-[#21845F] focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#6B6559] uppercase tracking-wider mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={addForm.email}
                    onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                    placeholder="staff@sirisamruddhigold.com"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF8F3] border border-[#E4DFD4] text-xs text-[#1D1D1B] focus:outline-none focus:border-[#21845F] focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#6B6559] uppercase tracking-wider mb-1">
                  Date of Joining
                </label>
                <input
                  type="date"
                  value={addForm.date_of_joining}
                  onChange={(e) => setAddForm({ ...addForm, date_of_joining: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF8F3] border border-[#E4DFD4] text-xs font-mono text-[#1D1D1B] focus:outline-none focus:border-[#21845F] focus:bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#F0ECE1]">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-white border border-[#E4DFD4] text-xs font-bold text-[#5E5A52] hover:bg-[#FAF8F3] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-[#21845F] hover:bg-[#1A6B4C] text-white text-xs font-extrabold shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" />
                      <span>Create Employee</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 2. Edit Employee Modal */}
      {/* ------------------------------------------------------------- */}
      {editingEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white border border-[#E4DFD4] rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 bg-[#FAF8F3] border-b border-[#EBE6DC] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#D97706]/10 border border-[#FDE68A] text-[#D97706] flex items-center justify-center">
                  <Edit2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[#1D1D1B]">Edit Employee</h3>
                  <p className="text-xs text-[#6B6559]">
                    Updating {editingEmployee.full_name} ({editingEmployee.employee_code})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingEmployee(null)}
                className="w-8 h-8 rounded-xl bg-white hover:bg-[#F2EDE4] text-[#6B6559] border border-[#E4DFD4] flex items-center justify-center font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateEmployee} className="p-6 overflow-y-auto space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#6B6559] uppercase tracking-wider mb-1">
                    Showroom Branch *
                  </label>
                  <select
                    value={editForm.branch_code}
                    onChange={(e) => setEditForm({ ...editForm, branch_code: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF8F3] border border-[#E4DFD4] text-xs font-bold text-[#1D1D1B] focus:outline-none focus:border-[#D97706] focus:bg-white"
                  >
                    <option value="YELAHANKA">Yelahanka Showroom</option>
                    <option value="KOLAR">Kolar Showroom</option>
                    <option value="UDUPI">Udupi Showroom</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#6B6559] uppercase tracking-wider mb-1">
                    Status *
                  </label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF8F3] border border-[#E4DFD4] text-xs font-bold text-[#1D1D1B] focus:outline-none focus:border-[#D97706] focus:bg-white"
                  >
                    <option value="active">Active (On Duty)</option>
                    <option value="inactive">Inactive / On Hold</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#6B6559] uppercase tracking-wider mb-1">
                  Employee Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={editForm.full_name}
                  onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF8F3] border border-[#E4DFD4] text-xs font-semibold text-[#1D1D1B] focus:outline-none focus:border-[#D97706] focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#6B6559] uppercase tracking-wider mb-1">
                    Employee Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.employee_code}
                    onChange={(e) => setEditForm({ ...editForm, employee_code: e.target.value.toUpperCase() })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF8F3] border border-[#E4DFD4] text-xs font-mono font-bold text-[#536B8A] focus:outline-none focus:border-[#D97706] focus:bg-white uppercase"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#6B6559] uppercase tracking-wider mb-1">
                    Designation
                  </label>
                  <input
                    type="text"
                    value={editForm.designation}
                    onChange={(e) => setEditForm({ ...editForm, designation: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF8F3] border border-[#E4DFD4] text-xs font-semibold text-[#1D1D1B] focus:outline-none focus:border-[#D97706] focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#6B6559] uppercase tracking-wider mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF8F3] border border-[#E4DFD4] text-xs font-mono text-[#1D1D1B] focus:outline-none focus:border-[#D97706] focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#6B6559] uppercase tracking-wider mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF8F3] border border-[#E4DFD4] text-xs text-[#1D1D1B] focus:outline-none focus:border-[#D97706] focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#6B6559] uppercase tracking-wider mb-1">
                    Department
                  </label>
                  <input
                    type="text"
                    value={editForm.department}
                    onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF8F3] border border-[#E4DFD4] text-xs text-[#1D1D1B] focus:outline-none focus:border-[#D97706] focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#6B6559] uppercase tracking-wider mb-1">
                    Date of Joining
                  </label>
                  <input
                    type="date"
                    value={editForm.date_of_joining}
                    onChange={(e) => setEditForm({ ...editForm, date_of_joining: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF8F3] border border-[#E4DFD4] text-xs font-mono text-[#1D1D1B] focus:outline-none focus:border-[#D97706] focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#6B6559] uppercase tracking-wider mb-1">
                  HR Notes
                </label>
                <textarea
                  rows={2}
                  value={editForm.notes}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  placeholder="Optional personnel notes, remarks, etc."
                  className="w-full px-3.5 py-2 rounded-xl bg-[#FAF8F3] border border-[#E4DFD4] text-xs text-[#1D1D1B] focus:outline-none focus:border-[#D97706] focus:bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#F0ECE1]">
                <button
                  type="button"
                  onClick={() => setEditingEmployee(null)}
                  className="px-4 py-2.5 rounded-xl bg-white border border-[#E4DFD4] text-xs font-bold text-[#5E5A52] hover:bg-[#FAF8F3] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingEmployee}
                  className="px-5 py-2.5 rounded-xl bg-[#D97706] hover:bg-[#B45309] text-white text-xs font-extrabold shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isUpdatingEmployee ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving Changes...</span>
                    </>
                  ) : (
                    <span>Save Changes</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 3. Employee Performance & Profile Overview Modal */}
      {/* ------------------------------------------------------------- */}
      {overviewEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white border border-[#E4DFD4] rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-5 bg-[#FAF8F3] border-b border-[#EBE6DC] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#1D1D1B] to-[#3F3F46] text-[#E5C378] font-black text-sm flex items-center justify-center border border-[#3F3F46] shadow-xs">
                  {overviewEmployee.full_name?.slice(0, 2).toUpperCase() || 'EM'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-black text-[#1D1D1B]">{overviewEmployee.full_name}</h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E8F4EE] text-[#21845F] border border-[#C5E3D5] capitalize">
                      {overviewEmployee.status || 'Active'}
                    </span>
                  </div>
                  <p className="text-xs text-[#5E5A52] font-medium flex items-center gap-2 mt-0.5">
                    <span className="font-mono font-bold text-[#536B8A]">{overviewEmployee.employee_code}</span>
                    <span>•</span>
                    <span>{overviewEmployee.designation || 'Sales Executive'}</span>
                    <span>•</span>
                    <span className="text-[#D97706] font-semibold">{overviewEmployee.branch_name || overviewEmployee.branch_code}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setOverviewEmployee(null)}
                className="w-8 h-8 rounded-xl bg-white hover:bg-[#F2EDE4] text-[#6B6559] border border-[#E4DFD4] flex items-center justify-center font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6">
              {isLoadingOverview ? (
                <div className="py-12 text-center text-[#8A8479]">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#D97706]" />
                  <span className="block mt-2 font-semibold">Loading overview & activity metrics...</span>
                </div>
              ) : (
                <>
                  {/* Contact & Bio Info Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="bg-[#FAF8F3] border border-[#E4DFD4] rounded-2xl p-3.5">
                      <span className="text-[10px] font-bold text-[#8A8479] uppercase tracking-wider block mb-1">
                        Phone Contact
                      </span>
                      <div className="text-xs font-mono font-bold text-[#1D1D1B] flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-[#21845F]" />
                        <span>{overviewEmployee.phone || 'No phone'}</span>
                      </div>
                    </div>

                    <div className="bg-[#FAF8F3] border border-[#E4DFD4] rounded-2xl p-3.5">
                      <span className="text-[10px] font-bold text-[#8A8479] uppercase tracking-wider block mb-1">
                        Email Address
                      </span>
                      <div className="text-xs font-medium text-[#1D1D1B] flex items-center gap-1.5 truncate">
                        <Mail className="w-3.5 h-3.5 text-[#0284C7] shrink-0" />
                        <span className="truncate">{overviewEmployee.email || 'No email provided'}</span>
                      </div>
                    </div>

                    <div className="bg-[#FAF8F3] border border-[#E4DFD4] rounded-2xl p-3.5">
                      <span className="text-[10px] font-bold text-[#8A8479] uppercase tracking-wider block mb-1">
                        Date Joined
                      </span>
                      <div className="text-xs font-mono font-bold text-[#1D1D1B] flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-[#D97706]" />
                        <span>{overviewEmployee.date_of_joining || 'Not recorded'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Performance Metrics Grid */}
                  <div>
                    <h4 className="text-xs font-extrabold text-[#1D1D1B] uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#D97706]" />
                      <span>Sales & Performance Metrics</span>
                    </h4>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="bg-white border border-[#E4DFD4] rounded-2xl p-3.5 shadow-2xs">
                        <span className="text-[10px] font-bold text-[#6B6559] uppercase block mb-1">
                          Customers Attended
                        </span>
                        <div className="text-xl font-mono font-black text-[#1D1D1B]">
                          {overviewEmployee.metrics?.total_customers_attended ?? '—'}
                        </div>
                      </div>

                      <div className="bg-white border border-[#E4DFD4] rounded-2xl p-3.5 shadow-2xs">
                        <span className="text-[10px] font-bold text-[#21845F] uppercase block mb-1">
                          Sold Orders
                        </span>
                        <div className="text-xl font-mono font-black text-[#21845F]">
                          {overviewEmployee.metrics?.total_sold_count ?? '—'}
                        </div>
                      </div>

                      <div className="bg-white border border-[#E4DFD4] rounded-2xl p-3.5 shadow-2xs">
                        <span className="text-[10px] font-bold text-[#D97706] uppercase block mb-1">
                          Total Revenue (₹)
                        </span>
                        <div className="text-lg font-mono font-black text-[#D97706]">
                          ₹{(overviewEmployee.metrics?.total_sales_value || 0).toLocaleString('en-IN')}
                        </div>
                      </div>

                      <div className="bg-white border border-[#E4DFD4] rounded-2xl p-3.5 shadow-2xs">
                        <span className="text-[10px] font-bold text-[#8B5CF6] uppercase block mb-1">
                          Review Points
                        </span>
                        <div className="text-xl font-mono font-black text-[#8B5CF6] flex items-center gap-1">
                          <Award className="w-4 h-4 text-[#8B5CF6]" />
                          <span>{overviewEmployee.metrics?.total_points ?? 0}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Payroll & Leaves Status */}
                  <div>
                    <h4 className="text-xs font-extrabold text-[#1D1D1B] uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <Receipt className="w-3.5 h-3.5 text-[#21845F]" />
                      <span>Payroll & Leaves Status</span>
                    </h4>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <div className="bg-[#FAF8F3] border border-[#E4DFD4] rounded-2xl p-3">
                        <span className="text-[10px] font-bold text-[#6B6559] uppercase block">
                          Issued Pay Slips
                        </span>
                        <div className="text-lg font-mono font-black text-[#1D1D1B] mt-0.5">
                          {overviewEmployee.metrics?.payslips_issued ?? 0} Slips
                        </div>
                      </div>

                      <div className="bg-[#FAF8F3] border border-[#E4DFD4] rounded-2xl p-3">
                        <span className="text-[10px] font-bold text-[#21845F] uppercase block">
                          Approved Leaves
                        </span>
                        <div className="text-lg font-mono font-black text-[#21845F] mt-0.5">
                          {overviewEmployee.metrics?.approved_leaves ?? 0} Days
                        </div>
                      </div>

                      <div className="bg-[#FAF8F3] border border-[#E4DFD4] rounded-2xl p-3">
                        <span className="text-[10px] font-bold text-[#EF4444] uppercase block">
                          Pending Leaves
                        </span>
                        <div className="text-lg font-mono font-black text-[#EF4444] mt-0.5">
                          {overviewEmployee.metrics?.pending_leaves ?? 0} Awaiting
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Recent Customer Activities */}
                  {overviewEmployee.recent_activities && overviewEmployee.recent_activities.length > 0 && (
                    <div>
                      <h4 className="text-xs font-extrabold text-[#1D1D1B] uppercase tracking-wider mb-2.5">
                        Recent Showroom Customer Interactions
                      </h4>
                      <div className="border border-[#E4DFD4] rounded-2xl overflow-hidden bg-white">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="bg-[#FAF8F3] border-b border-[#EBE6DC] text-[#6B6559] uppercase text-[9px] font-bold tracking-wider">
                              <th className="px-3.5 py-2">Date</th>
                              <th className="px-3.5 py-2">Customer</th>
                              <th className="px-3.5 py-2">Outcome</th>
                              <th className="px-3.5 py-2 text-right">Value (₹)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#F0ECE1]">
                            {overviewEmployee.recent_activities.map((a: any) => (
                              <tr key={a.id} className="hover:bg-[#FAF9F5]">
                                <td className="px-3.5 py-2 font-mono text-[#536B8A]">{a.date}</td>
                                <td className="px-3.5 py-2 font-bold text-[#1D1D1B]">{a.customer_name}</td>
                                <td className="px-3.5 py-2">
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-[9.5px] font-bold ${
                                      a.status === 'Sold'
                                        ? 'bg-[#E8F4EE] text-[#21845F]'
                                        : 'bg-[#FAF8F3] text-[#5E5A52]'
                                    }`}
                                  >
                                    {a.status}
                                  </span>
                                </td>
                                <td className="px-3.5 py-2 text-right font-mono font-bold text-[#21845F]">
                                  {a.product_value > 0 ? `₹${a.product_value.toLocaleString('en-IN')}` : '—'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  {overviewEmployee.notes && (
                    <div className="p-3.5 rounded-2xl bg-[#FEF3C7]/40 border border-[#FDE68A] text-xs text-[#92400E]">
                      <strong className="block font-bold mb-0.5">HR Notes:</strong>
                      <span>{overviewEmployee.notes}</span>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-[#FAF8F3] border-t border-[#EBE6DC] flex items-center justify-between">
              <button
                onClick={() => {
                  const emp = overviewEmployee;
                  setOverviewEmployee(null);
                  handleOpenEdit(emp);
                }}
                className="px-4 py-2 rounded-xl bg-[#D97706] hover:bg-[#B45309] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Edit Employee</span>
              </button>
              <button
                onClick={() => setOverviewEmployee(null)}
                className="px-4 py-2 rounded-xl bg-white border border-[#E4DFD4] text-xs font-bold text-[#5E5A52] hover:bg-[#FAF8F3] cursor-pointer"
              >
                Close Overview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 4. Delete Confirmation Dialog (No native browser alerts) */}
      {/* ------------------------------------------------------------- */}
      <ConfirmDialog
        isOpen={!!deleteTargetEmp}
        title="Delete Employee Record"
        message={`Are you sure you want to permanently delete employee "${deleteTargetEmp?.full_name}" (${deleteTargetEmp?.employee_code}) from ${deleteTargetEmp?.branch_name || deleteTargetEmp?.branch_code}? This will remove their record from showroom rosters.`}
        confirmText="Delete Employee"
        variant="danger"
        isLoading={isDeletingEmp}
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteTargetEmp(null)}
      />
    </div>
  );
};
