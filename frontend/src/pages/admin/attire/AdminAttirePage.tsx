import React, { useEffect, useState } from 'react';
import {
  Shirt,
  Search,
  Filter,
  Building2,
  Calendar,
  Eye,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import { AttireRecord } from '../../../types';
import { AdminKPICard } from '../../../components/admin/ui/AdminKPICard';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { EmptyState } from '../../../components/ui/EmptyState';
import { Modal } from '../../../components/ui/Modal';
import { useAdminBranch } from '../../../context/AdminBranchContext';
import { useToast } from '../../../context/ToastContext';
import api from '../../../api/client';

export const AdminAttirePage: React.FC = () => {
  const { branches, selectedBranchId } = useAdminBranch();
  const { error: toastError } = useToast();

  const [records, setRecords] = useState<AttireRecord[]>([]);
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [compliancePct, setCompliancePct] = useState<number>(100);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [branchFilter, setBranchFilter] = useState<string>(selectedBranchId?.toString() || 'all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [previewRecord, setPreviewRecord] = useState<AttireRecord | null>(null);

  const fetchAttireRecords = async () => {
    try {
      setIsLoading(true);
      const params: Record<string, any> = {};
      if (searchTerm.trim()) params.search = searchTerm.trim();
      if (branchFilter !== 'all') params.branch_id = parseInt(branchFilter);
      if (statusFilter !== 'all') params.status = statusFilter;

      const res = await api.get<any>('/api/v1/admin/attire', { params });
      setRecords(res.data.records || []);
      setTotalRecords(res.data.total_records || 0);
      setCompliancePct(res.data.compliance_percentage || 100);
    } catch (err) {
      console.error('Failed to load attire records:', err);
      toastError('Failed to fetch attire & grooming records.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAttireRecords();
  }, [searchTerm, branchFilter, statusFilter]);

  const properCount = records.filter((r) => r.status === 'Proper').length;
  const improperCount = records.filter((r) => r.status !== 'Proper').length;

  return (
    <div className="space-y-7 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#EBE6DC] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#7E22CE] bg-[#F3E8FF] px-2.5 py-1 rounded-full border border-[#D8B4FE]">
              Showroom Luxury Standards
            </span>
            <span className="text-xs text-[#8A8479] font-medium">{totalRecords} Grooming Audits</span>
          </div>
          <h1 className="text-2xl font-extrabold text-[#1D1D1B] tracking-tight mt-1">
            Attire & Grooming Compliance
          </h1>
          <p className="text-xs text-[#8A8479] font-medium mt-0.5">
            Multi-branch daily uniform inspections, staff grooming audits, and photographic compliance
          </p>
        </div>
      </div>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminKPICard
          title="Overall Compliance Score"
          value={`${compliancePct}%`}
          subtitle="Showroom Standard Adherence"
          icon={<Shirt className="w-5 h-5 text-[#7E22CE]" />}
          iconBgColor="bg-[#F3E8FF] border-[#D8B4FE] text-[#7E22CE]"
          badgeText="Verified"
          badgeColor="bg-[#E8F4EE] text-[#21845F] border-[#C5E3D5]"
        />

        <AdminKPICard
          title="Total Staff Audits"
          value={totalRecords}
          subtitle="Daily Uniform Checks"
          icon={<CheckCircle2 className="w-5 h-5 text-[#21845F]" />}
          iconBgColor="bg-[#E8F4EE] border-[#C5E3D5] text-[#21845F]"
        />

        <AdminKPICard
          title="Proper Attire Verifications"
          value={properCount}
          subtitle="100% Compliant Uniforms"
          icon={<CheckCircle2 className="w-5 h-5 text-[#21845F]" />}
          iconBgColor="bg-[#E8F4EE] border-[#C5E3D5] text-[#21845F]"
        />

        <AdminKPICard
          title="Flagged Non-Compliance"
          value={improperCount}
          subtitle="Grooming Corrections Needed"
          icon={<AlertCircle className="w-5 h-5 text-[#DC2626]" />}
          iconBgColor="bg-[#FEE2E2] border-[#FECACA] text-[#DC2626]"
        />
      </div>

      {/* Filter Bar */}
      <div className="p-4 bg-white border border-[#E4DFD4] rounded-2xl shadow-xs flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-[#8A8479] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by staff name or remarks..."
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
            <option value="Proper">Proper Attire</option>
            <option value="Improper">Improper</option>
            <option value="Incomplete">Incomplete</option>
          </select>
        </div>
      </div>

      {/* Audits Table */}
      <div className="bg-white border border-[#E4DFD4] rounded-3xl p-6 shadow-[0_4px_18px_rgba(40,35,25,0.045)]">
        {isLoading ? (
          <LoadingSpinner message="Loading attire records..." />
        ) : records.length === 0 ? (
          <EmptyState
            title="No attire records found"
            description="No staff grooming audits matched your query."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#FAF8F3] border-b border-[#E4DFD4] text-[#5E5A52] uppercase font-bold text-[11px]">
                <tr>
                  <th className="px-4 py-3">Staff Member</th>
                  <th className="px-4 py-3">Showroom Branch</th>
                  <th className="px-4 py-3">Audit Date</th>
                  <th className="px-4 py-3">Compliance Status</th>
                  <th className="px-4 py-3">Auditor Remarks</th>
                  <th className="px-4 py-3 text-right">Photo Audit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EBE6DC] font-medium">
                {records.map((r) => (
                  <tr key={r.id} className="hover:bg-[#FAF5FF] transition-colors">
                    <td className="px-4 py-3.5 font-bold text-[#1D1D1B]">{r.employee_name || 'Staff Member'}</td>
                    <td className="px-4 py-3.5">
                      <span className="px-2.5 py-1 rounded-full bg-[#FAF8F3] border border-[#D8B4FE] text-[#7E22CE] font-bold text-[10px]">
                        {r.branch_name}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-[#8A8479] font-mono">{r.check_date}</td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                          r.status === 'Proper'
                            ? 'bg-[#E8F4EE] text-[#21845F] border border-[#C5E3D5]'
                            : 'bg-[#FEE2E2] text-[#DC2626] border border-[#FECACA]'
                        }`}
                      >
                        {r.status === 'Proper' ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        {r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-[#5E5A52] max-w-xs truncate">{r.notes || '—'}</td>
                    <td className="px-4 py-3.5 text-right">
                      {r.image_url ? (
                        <button
                          onClick={() => setPreviewRecord(r)}
                          className="inline-flex items-center gap-1 text-xs font-bold text-[#7E22CE] hover:underline cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Photo</span>
                        </button>
                      ) : (
                        <span className="text-[#8A8479] text-[11px]">Direct Log</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Photo Preview Modal */}
      {previewRecord && (
        <Modal
          isOpen={true}
          onClose={() => setPreviewRecord(null)}
          title={`Attire Photo Check: ${previewRecord.employee_name}`}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-[#1D1D1B]">Date: {previewRecord.check_date}</span>
              <span className="text-[#7E22CE]">{previewRecord.branch_name}</span>
            </div>
            {previewRecord.image_url && (
              <div className="rounded-2xl border border-[#E4DFD4] overflow-hidden max-h-96 flex items-center justify-center bg-black/5">
                <img
                  src={previewRecord.image_url}
                  alt="Attire Inspection"
                  className="max-h-96 w-full object-contain"
                />
              </div>
            )}
            {previewRecord.notes && (
              <p className="text-xs text-[#5E5A52] bg-[#FAF8F3] p-3 rounded-xl border border-[#E4DFD4]">
                <b>Auditor Remarks:</b> {previewRecord.notes}
              </p>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};
