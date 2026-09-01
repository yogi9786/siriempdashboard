import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  Users,
  Award,
  UserCheck,
  Star,
  Shirt,
  Phone,
  Mail,
  MapPin,
  Edit2,
  ChevronRight,
  Shield,
  Layers,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { AdminBranchSummary } from '../../../types';
import { Modal } from '../../../components/ui/Modal';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { useToast } from '../../../context/ToastContext';
import api from '../../../api/client';

export const AdminBranchListPage: React.FC = () => {
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();

  const [branches, setBranches] = useState<AdminBranchSummary[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Edit Modal State
  const [editBranch, setEditBranch] = useState<AdminBranchSummary | null>(null);
  const [editName, setEditName] = useState<string>('');
  const [editCity, setEditCity] = useState<string>('');
  const [editAddress, setEditAddress] = useState<string>('');
  const [editPhone, setEditPhone] = useState<string>('');
  const [editEmail, setEditEmail] = useState<string>('');
  const [editDescription, setEditDescription] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const fetchBranches = async () => {
    try {
      setIsLoading(true);
      const res = await api.get<AdminBranchSummary[]>('/api/v1/admin/branches');
      setBranches(res.data);
    } catch (err) {
      console.error('Failed to load branches:', err);
      toastError('Failed to fetch showroom branches.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  const openEditModal = (b: AdminBranchSummary, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditBranch(b);
    setEditName(b.name);
    setEditCity(b.city);
    setEditAddress(b.address || '');
    setEditPhone(b.phone || '');
    setEditEmail(b.email || '');
    setEditDescription(b.description || '');
  };

  const handleSaveBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editBranch) return;

    try {
      setIsSaving(true);
      await api.put(`/api/v1/admin/branches/${editBranch.id}`, {
        name: editName.trim(),
        city: editCity.trim(),
        address: editAddress.trim(),
        phone: editPhone.trim(),
        email: editEmail.trim(),
        description: editDescription.trim(),
      });
      success(`Branch ${editName} updated successfully.`);
      setEditBranch(null);
      fetchBranches();
    } catch (err: any) {
      toastError(err.response?.data?.detail || 'Failed to update branch.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner fullPage message="Loading showroom branches..." />;
  }

  return (
    <div className="space-y-7 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#EBE6DC] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#7E22CE] bg-[#F3E8FF] px-2.5 py-1 rounded-full border border-[#D8B4FE]">
              Organization Infrastructure
            </span>
            <span className="text-xs text-[#8A8479] font-medium">3 Showroom Centers</span>
          </div>
          <h1 className="text-2xl font-extrabold text-[#1D1D1B] tracking-tight mt-1">
            Showroom Branch Command
          </h1>
          <p className="text-xs text-[#8A8479] font-medium mt-0.5">
            Operational status and performance breakdown for Yelahanka, Kolar, and Udupi
          </p>
        </div>
      </div>

      {/* 3 Main Branch Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {branches.map((b) => (
          <div
            key={b.id}
            onClick={() => navigate(`/admin/branches/${b.id}`)}
            className="bg-white border border-[#E4DFD4] hover:border-[#7E22CE] rounded-3xl p-6 shadow-[0_4px_18px_rgba(40,35,25,0.045)] hover:shadow-lg hover:-translate-y-1 transition-all duration-200 cursor-pointer group flex flex-col justify-between space-y-6"
          >
            {/* Card Top */}
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="w-12 h-12 rounded-2xl bg-[#F3E8FF] border border-[#D8B4FE] text-[#7E22CE] flex items-center justify-center font-bold text-base shadow-2xs group-hover:scale-105 transition-transform">
                  <Building2 className="w-6 h-6" />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#E8F4EE] text-[#21845F] border border-[#C5E3D5]">
                    Active
                  </span>
                  <button
                    onClick={(e) => openEditModal(b, e)}
                    className="p-1.5 rounded-lg text-[#8A8479] hover:text-[#7E22CE] hover:bg-[#FAF5FF] transition-colors"
                    title="Edit Branch Information"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div>
                <h2 className="text-lg font-extrabold text-[#1D1D1B] group-hover:text-[#7E22CE] transition-colors">
                  {b.name} Showroom
                </h2>
                <p className="text-xs text-[#8A8479] font-medium font-mono mt-0.5">
                  {b.code} • {b.city}
                </p>
              </div>

              {/* Manager Badges */}
              <div className="p-3 rounded-2xl bg-[#FAF8F3] border border-[#E4DFD4] space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-bold text-[#8A8479]">
                  <span className="flex items-center gap-1">
                    <Shield className="w-3 h-3 text-[#7E22CE]" />
                    <span>Assigned Managers ({b.managers.length})</span>
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {b.managers.map((m) => (
                    <span
                      key={m.id}
                      className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white border border-[#D8B4FE] text-[#3B0764]"
                    >
                      {m.full_name}
                    </span>
                  ))}
                </div>
              </div>

              {/* Key Metrics Grid */}
              <div className="grid grid-cols-2 gap-2.5 pt-2">
                <div className="p-2.5 rounded-xl bg-[#FAF8F3] border border-[#E4DFD4] text-center">
                  <span className="text-[10px] font-bold text-[#8A8479] uppercase block">Staff Floor</span>
                  <span className="text-sm font-extrabold text-[#1D1D1B]">
                    {b.active_employee_count} / {b.employee_count}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-[#FAF8F3] border border-[#E4DFD4] text-center">
                  <span className="text-[10px] font-bold text-[#8A8479] uppercase block">Footfall</span>
                  <span className="text-sm font-extrabold text-[#1D1D1B]">{b.customer_footfall}</span>
                </div>

                <div className="p-2.5 rounded-xl bg-[#F3E8FF] border border-[#D8B4FE] text-center">
                  <span className="text-[10px] font-bold text-[#7E22CE] uppercase block">Gold Plans</span>
                  <span className="text-sm font-extrabold text-[#7E22CE]">{b.schemes_count} Closed</span>
                </div>

                <div className="p-2.5 rounded-xl bg-[#FAF1EC] border border-[#ECCFC0] text-center">
                  <span className="text-[10px] font-bold text-[#B97855] uppercase block">Reputation</span>
                  <span className="text-sm font-extrabold text-[#B97855] flex items-center justify-center gap-1">
                    <Star className="w-3.5 h-3.5 fill-[#B97855]" />
                    <span>{b.average_rating.toFixed(1)}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Button */}
            <button className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-[#FAF5FF] group-hover:bg-[#7E22CE] text-[#7E22CE] group-hover:text-white text-xs font-bold transition-colors cursor-pointer">
              <span>View Branch Command</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Edit Branch Modal */}
      {editBranch && (
        <Modal
          isOpen={true}
          onClose={() => setEditBranch(null)}
          title={`Edit ${editBranch.name} Showroom Details`}
        >
          <form onSubmit={handleSaveBranch} className="space-y-4">
            <Input
              label="Branch Name"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              required
            />

            <Input
              label="City / Location"
              value={editCity}
              onChange={(e) => setEditCity(e.target.value)}
              required
            />

            <Input
              label="Physical Address"
              value={editAddress}
              onChange={(e) => setEditAddress(e.target.value)}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Contact Phone"
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
              />
              <Input
                label="Contact Email"
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
              />
            </div>

            <Input
              label="Description / Notes"
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
            />

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#EBE6DC]">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditBranch(null)}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button type="submit" isLoading={isSaving}>
                Save Branch Changes
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
