import React, { useEffect, useState } from 'react';
import {
  Shield,
  Plus,
  Search,
  Filter,
  KeyRound,
  Edit2,
  Trash2,
  Building2,
  Mail,
  UserCheck,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { AdminManager, Branch } from '../../../types';
import { Modal } from '../../../components/ui/Modal';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Button } from '../../../components/ui/Button';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { EmptyState } from '../../../components/ui/EmptyState';
import { useToast } from '../../../context/ToastContext';
import { useAdminBranch } from '../../../context/AdminBranchContext';
import api from '../../../api/client';

export const AdminManagerPage: React.FC = () => {
  const { branches } = useAdminBranch();
  const { success, error: toastError } = useToast();

  const [managers, setManagers] = useState<AdminManager[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [branchFilter, setBranchFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Add Manager Modal
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [addFullName, setAddFullName] = useState<string>('');
  const [addUsername, setAddUsername] = useState<string>('');
  const [addEmail, setAddEmail] = useState<string>('');
  const [addPassword, setAddPassword] = useState<string>('');
  const [addBranchId, setAddBranchId] = useState<string>('1');
  const [isSubmittingAdd, setIsSubmittingAdd] = useState<boolean>(false);

  // Edit Manager Modal
  const [editManager, setEditManager] = useState<AdminManager | null>(null);
  const [editFullName, setEditFullName] = useState<string>('');
  const [editUsername, setEditUsername] = useState<string>('');
  const [editEmail, setEditEmail] = useState<string>('');
  const [editBranchId, setEditBranchId] = useState<string>('1');
  const [isSubmittingEdit, setIsSubmittingEdit] = useState<boolean>(false);

  // Reset Password Modal
  const [resetTarget, setResetTarget] = useState<AdminManager | null>(null);
  const [newPassword, setNewPassword] = useState<string>('');
  const [isResetting, setIsResetting] = useState<boolean>(false);

  const fetchManagers = async () => {
    try {
      setIsLoading(true);
      const params: Record<string, any> = {};
      if (searchTerm.trim()) params.search = searchTerm.trim();
      if (branchFilter !== 'all') params.branch_id = parseInt(branchFilter);
      if (statusFilter !== 'all') params.is_active = statusFilter === 'active';

      const res = await api.get<AdminManager[]>('/api/v1/admin/managers', { params });
      setManagers(res.data);
    } catch (err) {
      console.error('Failed to load managers:', err);
      toastError('Failed to fetch managers list.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchManagers();
  }, [searchTerm, branchFilter, statusFilter]);

  const handleAddManager = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmittingAdd(true);
      await api.post('/api/v1/admin/managers', {
        branch_id: parseInt(addBranchId),
        full_name: addFullName.trim(),
        username: addUsername.trim(),
        email: addEmail.trim() || undefined,
        password: addPassword.trim(),
        is_active: true,
      });
      success(`Manager ${addFullName} created successfully.`);
      setShowAddModal(false);
      setAddFullName('');
      setAddUsername('');
      setAddEmail('');
      setAddPassword('');
      fetchManagers();
    } catch (err: any) {
      toastError(err.response?.data?.detail || 'Failed to create manager.');
    } finally {
      setIsSubmittingAdd(false);
    }
  };

  const handleEditManager = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editManager) return;

    try {
      setIsSubmittingEdit(true);
      await api.put(`/api/v1/admin/managers/${editManager.id}`, {
        branch_id: parseInt(editBranchId),
        full_name: editFullName.trim(),
        username: editUsername.trim(),
        email: editEmail.trim() || undefined,
      });
      success(`Manager ${editFullName} updated successfully.`);
      setEditManager(null);
      fetchManagers();
    } catch (err: any) {
      toastError(err.response?.data?.detail || 'Failed to update manager.');
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetTarget) return;

    try {
      setIsResetting(true);
      await api.post(`/api/v1/admin/managers/${resetTarget.id}/reset-password`, {
        new_password: newPassword.trim(),
      });
      success(`Password for ${resetTarget.full_name} reset successfully.`);
      setResetTarget(null);
      setNewPassword('');
    } catch (err: any) {
      toastError(err.response?.data?.detail || 'Failed to reset password.');
    } finally {
      setIsResetting(false);
    }
  };

  const handleToggleStatus = async (manager: AdminManager) => {
    try {
      await api.put(`/api/v1/admin/managers/${manager.id}`, {
        is_active: !manager.is_active,
      });
      success(`Manager ${manager.full_name} ${manager.is_active ? 'deactivated' : 'activated'}.`);
      fetchManagers();
    } catch (err: any) {
      toastError('Failed to toggle manager status.');
    }
  };

  return (
    <div className="space-y-7 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#EBE6DC] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#D97706] bg-[#FEF3C7] px-2.5 py-1 rounded-full border border-[#FDE68A]">
              Showroom Leadership
            </span>
            <span className="text-xs text-[#8A8479] font-medium">{managers.length} Active Managers</span>
          </div>
          <h1 className="text-2xl font-extrabold text-[#1D1D1B] tracking-tight mt-1">
            Showroom Managers Administration
          </h1>
          <p className="text-xs text-[#8A8479] font-medium mt-0.5">
            Manage showroom administrative credentials, roles, and branch assignments
          </p>
        </div>

        <Button onClick={() => setShowAddModal(true)} icon={<Plus className="w-4 h-4" />}>
          + Add New Manager
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
            placeholder="Search managers by name, username, or email..."
            className="w-full pl-10 pr-4 py-2 bg-[#FAF8F3] border border-[#E4DFD4] rounded-xl text-xs text-[#1D1D1B] placeholder-[#8A8479] focus:outline-none focus:border-[#7E22CE]"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
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
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-[#FAF8F3] border border-[#E4DFD4] rounded-xl text-xs font-bold text-[#1D1D1B] focus:outline-none cursor-pointer"
          >
            <option value="all">All Status</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
        </div>
      </div>

      {/* Managers Table */}
      <div className="bg-white border border-[#E4DFD4] rounded-3xl p-6 shadow-[0_4px_18px_rgba(40,35,25,0.045)]">
        {isLoading ? (
          <LoadingSpinner message="Loading managers..." />
        ) : managers.length === 0 ? (
          <EmptyState
            title="No managers found"
            description="No showroom managers matched your search criteria."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#FAF8F3] border-b border-[#E4DFD4] text-[#5E5A52] uppercase font-bold text-[11px]">
                <tr>
                  <th className="px-4 py-3">Manager Name</th>
                  <th className="px-4 py-3">Username</th>
                  <th className="px-4 py-3">Assigned Branch</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EBE6DC] font-medium">
                {managers.map((m) => (
                  <tr key={m.id} className="hover:bg-[#FAF5FF] transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-[#FEF3C7] border border-[#FDE68A] text-[#D97706] flex items-center justify-center font-bold text-xs shrink-0">
                          <Shield className="w-4 h-4" />
                        </div>
                        <span className="font-bold text-[#1D1D1B] block">{m.full_name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-[#8A8479]">@{m.username}</td>
                    <td className="px-4 py-3.5">
                      <span className="px-2.5 py-1 rounded-full bg-[#FAF8F3] border border-[#D8B4FE] text-[#7E22CE] font-bold text-[10px]">
                        {m.branch_name} ({m.branch_code})
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-[#5E5A52]">{m.email || '—'}</td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                          m.is_active
                            ? 'bg-[#E8F4EE] text-[#21845F] border border-[#C5E3D5]'
                            : 'bg-[#FEE2E2] text-[#DC2626] border border-[#FECACA]'
                        }`}
                      >
                        {m.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setEditManager(m);
                            setEditFullName(m.full_name);
                            setEditUsername(m.username);
                            setEditEmail(m.email || '');
                            setEditBranchId(m.branch_id?.toString() || '1');
                          }}
                          className="p-1.5 rounded-lg text-[#5E5A52] hover:text-[#7E22CE] hover:bg-[#FAF5FF] transition-colors"
                          title="Edit Manager"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => {
                            setResetTarget(m);
                            setNewPassword('');
                          }}
                          className="p-1.5 rounded-lg text-[#5E5A52] hover:text-[#D97706] hover:bg-[#FEF3C7] transition-colors"
                          title="Reset Password"
                        >
                          <KeyRound className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleToggleStatus(m)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            m.is_active
                              ? 'text-[#5E5A52] hover:text-[#DC2626] hover:bg-[#FEE2E2]'
                              : 'text-[#5E5A52] hover:text-[#21845F] hover:bg-[#E8F4EE]'
                          }`}
                          title={m.is_active ? 'Deactivate Manager' : 'Activate Manager'}
                        >
                          {m.is_active ? <XCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
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

      {/* Add Manager Modal */}
      {showAddModal && (
        <Modal
          isOpen={true}
          onClose={() => setShowAddModal(false)}
          title="Onboard New Showroom Manager"
        >
          <form onSubmit={handleAddManager} className="space-y-4">
            <Input
              label="Manager Full Name"
              value={addFullName}
              onChange={(e) => setAddFullName(e.target.value)}
              placeholder="e.g. Ramesh Kumar"
              required
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Login Username"
                value={addUsername}
                onChange={(e) => setAddUsername(e.target.value)}
                placeholder="e.g. RAMESH1234"
                required
              />
              <Input
                label="Email Address"
                type="email"
                value={addEmail}
                onChange={(e) => setAddEmail(e.target.value)}
                placeholder="ramesh@sirisamruddhigold.com"
              />
            </div>

            <Input
              label="Secure Password"
              type="password"
              value={addPassword}
              onChange={(e) => setAddPassword(e.target.value)}
              placeholder="Set manager password..."
              required
            />

            <Select
              label="Assign Branch"
              value={addBranchId}
              onChange={(e) => setAddBranchId(e.target.value)}
              options={branches.map((b) => ({ value: b.id.toString(), label: `${b.name} Showroom (${b.city})` }))}
            />

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#EBE6DC]">
              <Button type="button" variant="outline" onClick={() => setShowAddModal(false)}>
                Cancel
              </Button>
              <Button type="submit" isLoading={isSubmittingAdd}>
                Create Manager
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit Manager Modal */}
      {editManager && (
        <Modal
          isOpen={true}
          onClose={() => setEditManager(null)}
          title={`Edit ${editManager.full_name}`}
        >
          <form onSubmit={handleEditManager} className="space-y-4">
            <Input
              label="Manager Full Name"
              value={editFullName}
              onChange={(e) => setEditFullName(e.target.value)}
              required
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Login Username"
                value={editUsername}
                onChange={(e) => setEditUsername(e.target.value)}
                required
              />
              <Input
                label="Email Address"
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
              />
            </div>

            <Select
              label="Assigned Showroom Branch"
              value={editBranchId}
              onChange={(e) => setEditBranchId(e.target.value)}
              options={branches.map((b) => ({ value: b.id.toString(), label: `${b.name} Showroom (${b.city})` }))}
            />

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#EBE6DC]">
              <Button type="button" variant="outline" onClick={() => setEditManager(null)}>
                Cancel
              </Button>
              <Button type="submit" isLoading={isSubmittingEdit}>
                Save Manager Changes
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Reset Password Modal */}
      {resetTarget && (
        <Modal
          isOpen={true}
          onClose={() => setResetTarget(null)}
          title={`Reset Password for ${resetTarget.full_name}`}
        >
          <form onSubmit={handleResetPassword} className="space-y-4">
            <p className="text-xs text-[#5E5A52]">
              Enter a new secure password for manager <span className="font-bold text-[#1D1D1B]">@{resetTarget.username}</span>.
            </p>

            <Input
              label="New Password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password (min 6 characters)..."
              required
            />

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#EBE6DC]">
              <Button type="button" variant="outline" onClick={() => setResetTarget(null)}>
                Cancel
              </Button>
              <Button type="submit" isLoading={isResetting}>
                Confirm Password Reset
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
