import React, { useEffect, useState } from 'react';
import {
  FileText,
  Search,
  Filter,
  Building2,
  Calendar,
  Eye,
  Download,
  Image as ImageIcon,
} from 'lucide-react';
import { FormMedia } from '../../../types';
import { AdminKPICard } from '../../../components/admin/ui/AdminKPICard';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { EmptyState } from '../../../components/ui/EmptyState';
import { Modal } from '../../../components/ui/Modal';
import { useAdminBranch } from '../../../context/AdminBranchContext';
import { useToast } from '../../../context/ToastContext';
import api from '../../../api/client';
import { getMediaUrl } from '../../../utils/media';

export const AdminGalleryPage: React.FC = () => {
  const { branches, selectedBranchId } = useAdminBranch();
  const { error: toastError } = useToast();

  const [media, setMedia] = useState<FormMedia[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [formTypeFilter, setFormTypeFilter] = useState<string>('all');
  const [branchFilter, setBranchFilter] = useState<string>(selectedBranchId?.toString() || 'all');
  const [previewMedia, setPreviewMedia] = useState<FormMedia | null>(null);

  const fetchGallery = async () => {
    try {
      setIsLoading(true);
      const params: Record<string, any> = {};
      if (branchFilter !== 'all') params.branch_id = parseInt(branchFilter);
      if (formTypeFilter !== 'all') params.form_type = formTypeFilter;

      const res = await api.get<FormMedia[]>('/api/v1/admin/gallery', { params });
      setMedia(res.data || []);
    } catch (err) {
      console.error('Failed to load gallery:', err);
      toastError('Failed to fetch closing sheets archive.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGallery();
  }, [branchFilter, formTypeFilter]);

  return (
    <div className="space-y-7 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#EBE6DC] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#B97855] bg-[#FAF1EC] px-2.5 py-1 rounded-full border border-[#ECCFC0]">
              Day-End Operations Archive
            </span>
            <span className="text-xs text-[#8A8479] font-medium">{media.length} Closing Balance Sheets</span>
          </div>
          <h1 className="text-2xl font-extrabold text-[#1D1D1B] tracking-tight mt-1">
            Daily Closing Forms & Balance Sheets
          </h1>
          <p className="text-xs text-[#8A8479] font-medium mt-0.5">
            Archived day-end reconciliation sheets, cash tallies, and store closing documents across all branches
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 bg-white border border-[#E4DFD4] rounded-2xl shadow-xs flex flex-col sm:flex-row items-center gap-3">
        <select
          value={branchFilter}
          onChange={(e) => setBranchFilter(e.target.value)}
          className="px-3 py-2 bg-[#FAF8F3] border border-[#E4DFD4] rounded-xl text-xs font-bold text-[#1D1D1B] focus:outline-none cursor-pointer w-full sm:w-auto"
        >
          <option value="all">All Branches</option>
          {branches.map((b) => (
            <option key={b.id} value={b.id.toString()}>
              {b.name} Showroom
            </option>
          ))}
        </select>

        <select
          value={formTypeFilter}
          onChange={(e) => setFormTypeFilter(e.target.value)}
          className="px-3 py-2 bg-[#FAF8F3] border border-[#E4DFD4] rounded-xl text-xs font-bold text-[#1D1D1B] focus:outline-none cursor-pointer w-full sm:w-auto"
        >
          <option value="all">All Document Types</option>
          <option value="Daily Closing Form">Daily Closing Form</option>
          <option value="Cash Tally">Cash Tally Sheet</option>
          <option value="Gold Reconciliation">Gold Stock Reconciliation</option>
        </select>
      </div>

      {/* Grid of Closing Sheets */}
      <div className="bg-white border border-[#E4DFD4] rounded-3xl p-6 shadow-[0_4px_18px_rgba(40,35,25,0.045)]">
        {isLoading ? (
          <LoadingSpinner message="Loading closing sheets archive..." />
        ) : media.length === 0 ? (
          <EmptyState
            title="No forms found"
            description="No daily balance sheets uploaded matching the criteria."
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {media.map((m) => (
              <div
                key={m.id}
                onClick={() => setPreviewMedia(m)}
                className="p-3.5 rounded-2xl bg-[#FAF8F3] border border-[#E4DFD4] hover:border-[#7E22CE] transition-all cursor-pointer group space-y-3"
              >
                <div className="h-44 rounded-xl bg-white border border-[#E4DFD4] flex items-center justify-center overflow-hidden relative">
                  {m.file_url ? (
                    <img
                      src={getMediaUrl(m.file_url)}
                      alt={m.form_type}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                  ) : (
                    <FileText className="w-12 h-12 text-[#8A8479]" />
                  )}
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1">
                    <Eye className="w-4 h-4" />
                    <span>View Sheet</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#1D1D1B] truncate">{m.form_type}</span>
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-white border border-[#D8B4FE] text-[#7E22CE]">
                      {m.branch_name}
                    </span>
                  </div>
                  <p className="text-[10px] text-[#8A8479] flex items-center justify-between">
                    <span>{m.employee_name || 'Store Manager'}</span>
                    <span className="font-mono">{m.upload_date}</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {previewMedia && (
        <Modal
          isOpen={true}
          onClose={() => setPreviewMedia(null)}
          title={`${previewMedia.form_type} — ${previewMedia.branch_name}`}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs font-bold border-b border-[#EBE6DC] pb-2">
              <span className="text-[#1D1D1B]">Uploaded by: {previewMedia.employee_name}</span>
              <span className="text-[#8A8479] font-mono">{previewMedia.upload_date}</span>
            </div>
            {previewMedia.file_url && (
              <div className="rounded-2xl border border-[#E4DFD4] overflow-hidden max-h-[500px] flex items-center justify-center bg-black/5">
                <img
                  src={getMediaUrl(previewMedia.file_url)}
                  alt={previewMedia.form_type}
                  className="max-h-[500px] w-full object-contain"
                />
              </div>
            )}
            {previewMedia.notes && (
              <p className="text-xs text-[#5E5A52] bg-[#FAF8F3] p-3 rounded-xl border border-[#E4DFD4]">
                <b>Notes:</b> {previewMedia.notes}
              </p>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};
