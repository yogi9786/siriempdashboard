import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Search,
  Building2,
  Phone,
  Mail,
  Eye,
  CheckCircle2,
  XCircle,
  Compass,
  Award,
  Shirt,
  ShieldCheck,
} from 'lucide-react';
import { AdminEmployee } from '../../../types';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { EmptyState } from '../../../components/ui/EmptyState';
import { useToast } from '../../../context/ToastContext';
import { useAdminBranch } from '../../../context/AdminBranchContext';
import api from '../../../api/client';

export const AdminEmployeeListPage: React.FC = () => {
  const navigate = useNavigate();
  const { branches } = useAdminBranch();
  const { error: toastError } = useToast();

  const [employees, setEmployees] = useState<AdminEmployee[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [branchFilter, setBranchFilter] = useState<string>('all');
  const [deptFilter, setDeptFilter] = useState<string>('all');
  const [outdoorFilter, setOutdoorFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const fetchEmployees = async () => {
    try {
      setIsLoading(true);
      const params: Record<string, any> = {};
      if (searchTerm.trim()) params.search = searchTerm.trim();
      if (branchFilter !== 'all') params.branch_id = parseInt(branchFilter);
      if (deptFilter !== 'all') params.department = deptFilter;
      if (outdoorFilter !== 'all') params.is_outdoor = outdoorFilter === 'true';
      if (statusFilter !== 'all') params.status = statusFilter;

      const res = await api.get<AdminEmployee[]>('/api/v1/admin/employees', { params });
      setEmployees(res.data);
    } catch (err) {
      console.error('Failed to load employees:', err);
      toastError('Failed to fetch employee roster.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [searchTerm, branchFilter, deptFilter, outdoorFilter, statusFilter]);

  return (
    <div className="space-y-7 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#EBE6DC] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#7E22CE] bg-[#F3E8FF] px-2.5 py-1 rounded-full border border-[#D8B4FE]">
              Organization Workforce
            </span>
            <span className="text-xs text-[#8A8479] font-medium">{employees.length} Total Staff</span>
          </div>
          <h1 className="text-2xl font-extrabold text-[#1D1D1B] tracking-tight mt-1">
            Master Staff Directory
          </h1>
          <p className="text-xs text-[#8A8479] font-medium mt-0.5">
            Complete centralized staff roster across Yelahanka, Kolar, and Udupi showrooms (Read-Only Overview)
          </p>
        </div>

        <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-[#FAF8F3] border border-[#E4DFD4] text-[#5E5A52] text-xs font-bold shadow-2xs">
          <ShieldCheck className="w-4 h-4 text-[#7E22CE]" />
          <span>System Verified Roster</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 bg-white border border-[#E4DFD4] rounded-2xl shadow-xs flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-[#8A8479] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by ID, name, code, designation..."
            className="w-full pl-10 pr-4 py-2 bg-[#FAF8F3] border border-[#E4DFD4] rounded-xl text-xs text-[#1D1D1B] placeholder-[#8A8479] focus:outline-none focus:border-[#7E22CE]"
          />
        </div>

        <div className="flex items-center gap-2.5 flex-wrap w-full sm:w-auto">
          <select
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
            className="px-3 py-2 bg-[#FAF8F3] border border-[#E4DFD4] rounded-xl text-xs font-bold text-[#1D1D1B] focus:outline-none cursor-pointer"
          >
            <option value="all">All Branches</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id.toString()}>
                {b.name} Showroom
              </option>
            ))}
          </select>

          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="px-3 py-2 bg-[#FAF8F3] border border-[#E4DFD4] rounded-xl text-xs font-bold text-[#1D1D1B] focus:outline-none cursor-pointer"
          >
            <option value="all">All Departments</option>
            <option value="Sales">Sales</option>
            <option value="Gold Schemes">Gold Schemes</option>
            <option value="Marketing">Marketing / Outdoor</option>
            <option value="Cashier">Cashier</option>
            <option value="Floor Management">Floor Management</option>
          </select>

          <select
            value={outdoorFilter}
            onChange={(e) => setOutdoorFilter(e.target.value)}
            className="px-3 py-2 bg-[#FAF8F3] border border-[#E4DFD4] rounded-xl text-xs font-bold text-[#1D1D1B] focus:outline-none cursor-pointer"
          >
            <option value="all">All Roles</option>
            <option value="true">Outdoor Staff Only</option>
            <option value="false">Showroom Floor Staff</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-[#FAF8F3] border border-[#E4DFD4] rounded-xl text-xs font-bold text-[#1D1D1B] focus:outline-none cursor-pointer"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Employees Table */}
      <div className="bg-white border border-[#E4DFD4] rounded-3xl p-6 shadow-[0_4px_18px_rgba(40,35,25,0.045)]">
        {isLoading ? (
          <LoadingSpinner message="Loading employee roster..." />
        ) : employees.length === 0 ? (
          <EmptyState
            title="No employees found"
            description="No staff members matched your search criteria."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#FAF8F3] border-b border-[#E4DFD4] text-[#5E5A52] uppercase font-bold text-[11px]">
                <tr>
                  <th className="px-4 py-3">Employee Name</th>
                  <th className="px-4 py-3">Employee Code</th>
                  <th className="px-4 py-3">Branch</th>
                  <th className="px-4 py-3">Role & Dept</th>
                  <th className="px-4 py-3">Customers</th>
                  <th className="px-4 py-3">Gold Schemes</th>
                  <th className="px-4 py-3">Attire Score</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">View Profile</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EBE6DC] font-medium">
                {employees.map((emp) => (
                  <tr
                    key={emp.id}
                    onClick={() => navigate(`/admin/employees/${emp.id}`)}
                    className="hover:bg-[#FAF5FF] transition-colors cursor-pointer group"
                  >
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-[#F3E8FF] border border-[#D8B4FE] text-[#7E22CE] flex items-center justify-center font-bold text-xs shrink-0">
                          {emp.full_name.charAt(0)}
                        </div>
                        <div>
                          <span className="font-bold text-[#1D1D1B] group-hover:text-[#7E22CE] transition-colors block">
                            {emp.full_name}
                          </span>
                          {emp.is_outdoor_marketing_employee && (
                            <span className="inline-flex items-center gap-1 text-[9px] font-bold text-[#21845F] bg-[#E8F4EE] px-1.5 py-0.2 rounded-sm border border-[#C5E3D5]">
                              <Compass className="w-2.5 h-2.5" /> Outdoor
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-xs whitespace-nowrap">
                      <span className="px-1.5 sm:px-2 py-0.5 rounded-md bg-[#FAF8F3] border border-[#E4DFD4] text-[#1D1D1B] font-semibold text-[10px] sm:text-xs whitespace-nowrap inline-flex items-center shrink-0">
                        {emp.employee_code}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="px-2.5 py-1 rounded-full bg-[#FAF8F3] border border-[#D8B4FE] text-[#7E22CE] font-bold text-[10px]">
                        {emp.branch_name}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="font-bold text-[#1D1D1B] block">{emp.designation}</span>
                      <span className="text-[10px] text-[#8A8479]">{emp.department}</span>
                    </td>
                    <td className="px-4 py-3.5 font-bold text-[#1D1D1B]">
                      {emp.customers_attended_count}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="font-bold text-[#7E22CE] block">{emp.schemes_closed_count}</span>
                      <span className="text-[10px] text-[#8A8479]">₹{emp.schemes_total_amount.toLocaleString('en-IN')}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="px-2 py-0.5 rounded-md bg-[#E8F4EE] text-[#21845F] font-bold text-[11px]">
                        {emp.attire_compliance_pct}%
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                          emp.status === 'active'
                            ? 'bg-[#E8F4EE] text-[#21845F] border border-[#C5E3D5]'
                            : 'bg-[#FEE2E2] text-[#DC2626] border border-[#FECACA]'
                        }`}
                      >
                        {emp.status === 'active' ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/admin/employees/${emp.id}`);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FAF5FF] hover:bg-[#F3E8FF] border border-[#D8B4FE] text-[#7E22CE] font-bold text-xs transition-colors cursor-pointer"
                        title="View 360° Profile"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
