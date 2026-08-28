import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Plus,
  Search,
  Filter,
  Building2,
  Phone,
  Mail,
  Edit2,
  ArrowRightLeft,
  Eye,
  CheckCircle2,
  XCircle,
  Compass,
  Award,
  Shirt,
  UserCheck,
} from 'lucide-react';
import { AdminEmployee } from '../../../types';
import { Modal } from '../../../components/ui/Modal';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Button } from '../../../components/ui/Button';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { EmptyState } from '../../../components/ui/EmptyState';
import { useToast } from '../../../context/ToastContext';
import { useAdminBranch } from '../../../context/AdminBranchContext';
import api from '../../../api/client';

export const AdminEmployeeListPage: React.FC = () => {
  const navigate = useNavigate();
  const { branches } = useAdminBranch();
  const { success, error: toastError } = useToast();

  const [employees, setEmployees] = useState<AdminEmployee[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [branchFilter, setBranchFilter] = useState<string>('all');
  const [deptFilter, setDeptFilter] = useState<string>('all');
  const [outdoorFilter, setOutdoorFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Add Employee Modal
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [addFullName, setAddFullName] = useState<string>('');
  const [addEmployeeCode, setAddEmployeeCode] = useState<string>('');
  const [addDesignation, setAddDesignation] = useState<string>('Sales Executive');
  const [addDepartment, setAddDepartment] = useState<string>('Sales');
  const [addBranchId, setAddBranchId] = useState<string>('1');
  const [addPhone, setAddPhone] = useState<string>('');
  const [addEmail, setAddEmail] = useState<string>('');
  const [addIsOutdoor, setAddIsOutdoor] = useState<boolean>(false);
  const [isSubmittingAdd, setIsSubmittingAdd] = useState<boolean>(false);

  // Edit Employee Modal
  const [editEmployee, setEditEmployee] = useState<AdminEmployee | null>(null);
  const [editFullName, setEditFullName] = useState<string>('');
  const [editDesignation, setEditDesignation] = useState<string>('');
  const [editDepartment, setEditDepartment] = useState<string>('');
  const [editPhone, setEditPhone] = useState<string>('');
  const [editEmail, setEditEmail] = useState<string>('');
  const [editIsOutdoor, setEditIsOutdoor] = useState<boolean>(false);
  const [isSubmittingEdit, setIsSubmittingEdit] = useState<boolean>(false);

  // Reassign Branch Modal
  const [reassignEmployee, setReassignEmployee] = useState<AdminEmployee | null>(null);
  const [targetBranchId, setTargetBranchId] = useState<string>('1');
  const [isReassigning, setIsReassigning] = useState<boolean>(false);

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

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmittingAdd(true);
      await api.post('/api/v1/admin/employees', {
        branch_id: parseInt(addBranchId),
        full_name: addFullName.trim(),
        employee_code: addEmployeeCode.trim(),
        designation: addDesignation.trim(),
        department: addDepartment.trim(),
        phone: addPhone.trim() || undefined,
        email: addEmail.trim() || undefined,
        is_outdoor_marketing_employee: addIsOutdoor,
        status: 'active',
      });
      success(`Employee ${addFullName} added to roster.`);
      setShowAddModal(false);
      setAddFullName('');
      setAddEmployeeCode('');
      setAddPhone('');
      setAddEmail('');
      fetchEmployees();
    } catch (err: any) {
      toastError(err.response?.data?.detail || 'Failed to add employee.');
    } finally {
      setIsSubmittingAdd(false);
    }
  };

  const handleEditEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editEmployee) return;

    try {
      setIsSubmittingEdit(true);
      await api.put(`/api/v1/admin/employees/${editEmployee.id}`, {
        full_name: editFullName.trim(),
        designation: editDesignation.trim(),
        department: editDepartment.trim(),
        phone: editPhone.trim() || undefined,
        email: editEmail.trim() || undefined,
        is_outdoor_marketing_employee: editIsOutdoor,
      });
      success(`Employee ${editFullName} updated.`);
      setEditEmployee(null);
      fetchEmployees();
    } catch (err: any) {
      toastError(err.response?.data?.detail || 'Failed to update employee.');
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  const handleReassignBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reassignEmployee) return;

    try {
      setIsReassigning(true);
      await api.post(`/api/v1/admin/employees/${reassignEmployee.id}/reassign-branch`, {
        target_branch_id: parseInt(targetBranchId),
      });
      success(`Employee ${reassignEmployee.full_name} reassigned to branch successfully.`);
      setReassignEmployee(null);
      fetchEmployees();
    } catch (err: any) {
      toastError(err.response?.data?.detail || 'Failed to reassign branch.');
    } finally {
      setIsReassigning(false);
    }
  };

  const handleToggleStatus = async (emp: AdminEmployee) => {
    try {
      const nextStatus = emp.status === 'active' ? 'inactive' : 'active';
      await api.put(`/api/v1/admin/employees/${emp.id}`, {
        status: nextStatus,
      });
      success(`Employee ${emp.full_name} status set to ${nextStatus}.`);
      fetchEmployees();
    } catch (err: any) {
      toastError('Failed to change employee status.');
    }
  };

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
            Complete staff roster across Yelahanka, Kolar, and Udupi showrooms with branch transfers
          </p>
        </div>

        <Button onClick={() => setShowAddModal(true)} icon={<Plus className="w-4 h-4" />}>
          + Onboard Employee
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="p-4 bg-white border border-[#E4DFD4] rounded-2xl shadow-xs flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-[#8A8479] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, code, designation..."
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
                  <th className="px-4 py-3">Employee</th>
                  <th className="px-4 py-3">Code</th>
                  <th className="px-4 py-3">Branch</th>
                  <th className="px-4 py-3">Role & Dept</th>
                  <th className="px-4 py-3">Customers</th>
                  <th className="px-4 py-3">Gold Schemes</th>
                  <th className="px-4 py-3">Attire Score</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EBE6DC] font-medium">
                {employees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-[#FAF5FF] transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-[#F3E8FF] border border-[#D8B4FE] text-[#7E22CE] flex items-center justify-center font-bold text-xs shrink-0">
                          {emp.full_name.charAt(0)}
                        </div>
                        <div>
                          <span className="font-bold text-[#1D1D1B] block">{emp.full_name}</span>
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
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => navigate(`/employees/${emp.id}`)}
                          className="p-1.5 rounded-lg text-[#5E5A52] hover:text-[#7E22CE] hover:bg-[#FAF5FF] transition-colors"
                          title="View 360° Profile"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => {
                            setEditEmployee(emp);
                            setEditFullName(emp.full_name);
                            setEditDesignation(emp.designation);
                            setEditDepartment(emp.department);
                            setEditPhone(emp.phone || '');
                            setEditEmail(emp.email || '');
                            setEditIsOutdoor(emp.is_outdoor_marketing_employee);
                          }}
                          className="p-1.5 rounded-lg text-[#5E5A52] hover:text-[#7E22CE] hover:bg-[#FAF5FF] transition-colors"
                          title="Edit Details"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => {
                            setReassignEmployee(emp);
                            setTargetBranchId(emp.branch_id.toString());
                          }}
                          className="p-1.5 rounded-lg text-[#5E5A52] hover:text-[#3B82F6] hover:bg-[#EFF6FF] transition-colors"
                          title="Reassign / Transfer Branch"
                        >
                          <ArrowRightLeft className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleToggleStatus(emp)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            emp.status === 'active'
                              ? 'text-[#5E5A52] hover:text-[#DC2626] hover:bg-[#FEE2E2]'
                              : 'text-[#5E5A52] hover:text-[#21845F] hover:bg-[#E8F4EE]'
                          }`}
                          title={emp.status === 'active' ? 'Deactivate Staff' : 'Activate Staff'}
                        >
                          {emp.status === 'active' ? <XCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Employee Modal */}
      {showAddModal && (
        <Modal
          isOpen={true}
          onClose={() => setShowAddModal(false)}
          title="Onboard Staff Member"
        >
          <form onSubmit={handleAddEmployee} className="space-y-4">
            <Input
              label="Employee Full Name"
              value={addFullName}
              onChange={(e) => setAddFullName(e.target.value)}
              placeholder="e.g. Anand Sharma"
              required
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Employee Code"
                value={addEmployeeCode}
                onChange={(e) => setAddEmployeeCode(e.target.value)}
                placeholder="e.g. EMP008"
                required
              />
              <Select
                label="Assigned Branch"
                value={addBranchId}
                onChange={(e) => setAddBranchId(e.target.value)}
                options={branches.map((b) => ({ value: b.id.toString(), label: `${b.name} Showroom` }))}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Designation"
                value={addDesignation}
                onChange={(e) => setAddDesignation(e.target.value)}
                required
              />
              <Input
                label="Department"
                value={addDepartment}
                onChange={(e) => setAddDepartment(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Phone Number"
                value={addPhone}
                onChange={(e) => setAddPhone(e.target.value)}
                placeholder="e.g. 9876543210"
              />
              <Input
                label="Email Address"
                type="email"
                value={addEmail}
                onChange={(e) => setAddEmail(e.target.value)}
                placeholder="e.g. anand@sirisamruddhigold.com"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="is_outdoor_add"
                checked={addIsOutdoor}
                onChange={(e) => setAddIsOutdoor(e.target.checked)}
                className="w-4 h-4 rounded-sm border-[#D8B4FE] text-[#7E22CE] cursor-pointer"
              />
              <label htmlFor="is_outdoor_add" className="text-xs font-bold text-[#1D1D1B] cursor-pointer">
                Outdoor Marketing Specialist (Field Drive Staff)
              </label>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#EBE6DC]">
              <Button type="button" variant="outline" onClick={() => setShowAddModal(false)}>
                Cancel
              </Button>
              <Button type="submit" isLoading={isSubmittingAdd}>
                Add to Roster
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit Employee Modal */}
      {editEmployee && (
        <Modal
          isOpen={true}
          onClose={() => setEditEmployee(null)}
          title={`Edit ${editEmployee.full_name}`}
        >
          <form onSubmit={handleEditEmployee} className="space-y-4">
            <Input
              label="Full Name"
              value={editFullName}
              onChange={(e) => setEditFullName(e.target.value)}
              required
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Designation"
                value={editDesignation}
                onChange={(e) => setEditDesignation(e.target.value)}
                required
              />
              <Input
                label="Department"
                value={editDepartment}
                onChange={(e) => setEditDepartment(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Phone Number"
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
              />
              <Input
                label="Email Address"
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="is_outdoor_edit"
                checked={editIsOutdoor}
                onChange={(e) => setEditIsOutdoor(e.target.checked)}
                className="w-4 h-4 rounded-sm border-[#D8B4FE] text-[#7E22CE] cursor-pointer"
              />
              <label htmlFor="is_outdoor_edit" className="text-xs font-bold text-[#1D1D1B] cursor-pointer">
                Outdoor Marketing Specialist
              </label>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#EBE6DC]">
              <Button type="button" variant="outline" onClick={() => setEditEmployee(null)}>
                Cancel
              </Button>
              <Button type="submit" isLoading={isSubmittingEdit}>
                Save Changes
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Reassign Branch Modal */}
      {reassignEmployee && (
        <Modal
          isOpen={true}
          onClose={() => setReassignEmployee(null)}
          title={`Transfer ${reassignEmployee.full_name} to Another Branch`}
        >
          <form onSubmit={handleReassignBranch} className="space-y-4">
            <p className="text-xs text-[#5E5A52]">
              Current Branch: <span className="font-bold text-[#7E22CE]">{reassignEmployee.branch_name} ({reassignEmployee.branch_code})</span>.
              Select the destination showroom to transfer this employee.
            </p>

            <Select
              label="Destination Showroom Branch"
              value={targetBranchId}
              onChange={(e) => setTargetBranchId(e.target.value)}
              options={branches.map((b) => ({ value: b.id.toString(), label: `${b.name} Showroom (${b.city})` }))}
            />

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#EBE6DC]">
              <Button type="button" variant="outline" onClick={() => setReassignEmployee(null)}>
                Cancel
              </Button>
              <Button type="submit" isLoading={isReassigning}>
                Confirm Branch Transfer
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
