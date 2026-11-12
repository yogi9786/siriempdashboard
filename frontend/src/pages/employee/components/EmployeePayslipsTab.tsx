import React, { useState } from 'react';
import {
  Receipt,
  Download,
  Eye,
  Calendar,
  RefreshCw,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { EmployeePaySlip } from '../../../types';
import { getMediaUrl, triggerFileDownload } from '../../../utils/media';

interface EmployeePayslipsTabProps {
  payslips: EmployeePaySlip[];
  isLoading: boolean;
  onRefresh: () => void;
  employeeCode?: string;
}

export const EmployeePayslipsTab: React.FC<EmployeePayslipsTabProps> = ({
  payslips,
  isLoading,
  onRefresh,
  employeeCode = 'Staff',
}) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      {/* Tab Header */}
      <div className="bg-white border border-[#E4DFD4] rounded-3xl p-5 sm:p-7 shadow-[0_4px_18px_rgba(40,35,25,0.045)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] sm:text-xs font-bold px-3 py-1 rounded-full bg-[#E8F4EE] border border-[#C5E3D5] text-[#21845F] flex items-center gap-1.5">
              <Receipt className="w-3.5 h-3.5" />
              <span>Official Salary Records</span>
            </span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-[#1D1D1B] tracking-tight">
            My Salary Slips
          </h3>
          <p className="text-xs text-[#6B6559] mt-0.5">
            View and download your monthly salary slips issued by the HR department.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="px-3 py-1.5 rounded-full bg-[#FAF8F3] border border-[#E4DFD4] text-xs font-mono font-bold text-[#5E5A52]">
            Total Slips: {payslips.length}
          </span>
          <button
            type="button"
            onClick={onRefresh}
            className="p-2 rounded-xl bg-white border border-[#E4DFD4] hover:bg-[#FAF8F3] text-[#5E5A52] transition-colors cursor-pointer shadow-2xs"
            title="Refresh pay slips"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Content Grid */}
      {isLoading ? (
        <div className="py-16 flex flex-col items-center justify-center bg-white border border-[#E4DFD4] rounded-3xl">
          <RefreshCw className="w-6 h-6 animate-spin text-[#21845F]" />
          <span className="text-xs font-bold text-[#8A8479] mt-2">Loading salary slips...</span>
        </div>
      ) : payslips.length === 0 ? (
        <div className="bg-white border border-[#E4DFD4] rounded-3xl p-10 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-[#FAF8F3] border border-[#E4DFD4] text-[#8A8479] flex items-center justify-center mx-auto">
            <Receipt className="w-6 h-6" />
          </div>
          <p className="text-sm font-bold text-[#1D1D1B]">No Salary Slips Available Yet</p>
          <p className="text-xs text-[#8A8479] max-w-sm mx-auto">
            Your monthly salary slips issued by HR will appear here with downloadable receipts and image previews.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {payslips.map((slip) => {
            const isPdf = slip.file_url?.toLowerCase().endsWith('.pdf');
            const fullUrl = getMediaUrl(slip.file_url);

            return (
              <div
                key={slip.id}
                className="bg-white border border-[#E4DFD4] hover:border-[#21845F] rounded-2xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="px-2.5 py-1 rounded-full bg-[#E8F4EE] text-[#21845F] border border-[#C5E3D5] text-[11px] font-extrabold uppercase tracking-wide">
                        {slip.month} {slip.year}
                      </span>
                      <div className="text-xl font-bold font-mono text-[#1D1D1B] mt-2">
                        {slip.amount !== undefined && slip.amount !== null
                          ? `₹${Number(slip.amount).toLocaleString('en-IN')}`
                          : 'Salary Slip'}
                      </div>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#F3F4F6] text-[#4B5563] font-bold">
                      Issued
                    </span>
                  </div>

                  {/* File preview thumbnail if image */}
                  {slip.file_url && !isPdf && (
                    <div
                      onClick={() => setPreviewUrl(slip.file_url)}
                      className="h-36 rounded-xl border border-[#E6E1D6] overflow-hidden bg-[#FAF8F3] relative group cursor-pointer"
                    >
                      <img
                        src={fullUrl}
                        alt={`Payslip ${slip.month} ${slip.year}`}
                        className="w-full h-full object-cover object-top transition-transform group-hover:scale-105 duration-200"
                      />
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1">
                        <Eye className="w-4 h-4" />
                        <span>Click to enlarge</span>
                      </div>
                    </div>
                  )}

                  {slip.file_url && isPdf && (
                    <div
                      onClick={() => setPreviewUrl(slip.file_url)}
                      className="p-4 rounded-xl border border-dashed border-[#CBD5E1] bg-[#F8FAFC] flex items-center gap-3 cursor-pointer hover:border-[#21845F] transition-all"
                    >
                      <div className="w-10 h-10 rounded-lg bg-red-100 text-red-600 font-bold flex items-center justify-center text-xs">
                        PDF
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-[#1D1D1B] truncate">
                          Salary_Slip_{slip.month}_{slip.year}.pdf
                        </p>
                        <span className="text-[10px] text-[#64748B]">Click to preview document</span>
                      </div>
                      <Eye className="w-4 h-4 text-[#64748B]" />
                    </div>
                  )}

                  {slip.notes && (
                    <p className="text-xs text-[#5E5A52] bg-[#FAF8F3] p-2.5 rounded-xl border border-[#EBE6DC] leading-relaxed">
                      {slip.notes}
                    </p>
                  )}

                  <div className="text-[10px] text-[#8A8479] flex items-center gap-1 font-mono">
                    <Calendar className="w-3 h-3 text-[#8A8479]" />
                    <span>Issued: {slip.issued_date || slip.created_at?.slice(0, 10)}</span>
                  </div>
                </div>

                {/* Download Action */}
                <button
                  type="button"
                  onClick={() =>
                    triggerFileDownload(
                      slip.file_url,
                      `Payslip_${employeeCode}_${slip.month}_${slip.year}`
                    )
                  }
                  className="w-full py-2.5 px-4 rounded-xl bg-[#21845F] hover:bg-[#1A6B4C] text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Pay Slip</span>
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Lightbox / Preview Modal */}
      {previewUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setPreviewUrl(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 bg-[#FAF8F3] border-b border-[#EBE6DC] flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-[#1D1D1B]">Salary Slip Document</h3>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() =>
                    triggerFileDownload(
                      previewUrl,
                      `Payslip_${employeeCode}_document`
                    )
                  }
                  className="px-3 py-1.5 rounded-xl bg-[#21845F] hover:bg-[#1A6B4C] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewUrl(null)}
                  className="w-8 h-8 rounded-xl bg-white border border-[#E4DFD4] text-[#6B6559] hover:bg-[#F2EDE4] font-bold text-sm cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="p-4 flex-1 overflow-auto flex items-center justify-center bg-[#18181B]">
              {previewUrl.toLowerCase().endsWith('.pdf') ? (
                <iframe
                  src={getMediaUrl(previewUrl)}
                  className="w-full h-[70vh] rounded-xl"
                  title="Payslip PDF"
                />
              ) : (
                <img
                  src={getMediaUrl(previewUrl)}
                  alt="Payslip Preview"
                  className="max-h-[75vh] object-contain rounded-xl shadow-lg"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

