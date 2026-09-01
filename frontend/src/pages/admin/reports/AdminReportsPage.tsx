import React, { useEffect, useState } from 'react';
import {
  FileSpreadsheet,
  Download,
  Printer,
  Filter,
  Calendar,
  Building2,
  Sparkles,
  TrendingUp,
  Award,
  CheckCircle2,
  Clock,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';
import { AdminReportResponse } from '../../../types';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { EmptyState } from '../../../components/ui/EmptyState';
import { Button } from '../../../components/ui/Button';
import { useAdminBranch } from '../../../context/AdminBranchContext';
import { useToast } from '../../../context/ToastContext';
import api from '../../../api/client';
import logoImg from '../../../assets/siri samruddhi logo.png';

const reportTypes = [
  { id: 'executive_summary', label: 'Executive Enterprise Summary', desc: 'Holistic multi-branch performance overview' },
  { id: 'branch_performance', label: 'Branch Comparison Report', desc: 'Yelahanka, Kolar, and Udupi operational metrics' },
  { id: 'employee_performance', label: 'Staff Performance Leaderboard', desc: '5-Dimension evaluation rankings for all staff' },
  { id: 'gold_schemes', label: 'Gold Savings Schemes Report', desc: 'Enrollment ledger and scheme revenue breakdown' },
  { id: 'customer_crm', label: 'Customer Walk-ins & Footfall', desc: 'Inquiries, floor attendance, and conversion deals' },
  { id: 'outdoor_marketing', label: 'Outdoor Marketing Field Drives', desc: 'Territory campaigns, outreach leads, and conversions' },
  { id: 'google_reviews', label: 'Google Reviews Reputation Report', desc: 'Ratings, customer reviews, and credited staff' },
  { id: 'attire_compliance', label: 'Attire & Grooming Compliance', desc: 'Showroom staff uniform audits and standard adherence' },
];

export const AdminReportsPage: React.FC = () => {
  const { branches, selectedBranchId } = useAdminBranch();
  const { success, error: toastError } = useToast();

  const [selectedReportType, setSelectedReportType] = useState<string>('executive_summary');
  const [branchFilter, setBranchFilter] = useState<string>(selectedBranchId?.toString() || 'all');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [reportData, setReportData] = useState<AdminReportResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  const fetchReport = async () => {
    try {
      setIsLoading(true);
      const params: Record<string, any> = {
        report_type: selectedReportType,
      };
      if (branchFilter !== 'all') params.branch_id = parseInt(branchFilter);
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;

      const res = await api.get<AdminReportResponse>('/api/v1/admin/reports/generate', { params });
      setReportData(res.data);
    } catch (err) {
      console.error('Failed to generate report:', err);
      toastError('Failed to generate executive report.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [selectedReportType, branchFilter]);

  const handleExportCSV = async () => {
    try {
      setIsExporting(true);
      const params: Record<string, any> = {
        report_type: selectedReportType,
      };
      if (branchFilter !== 'all') params.branch_id = parseInt(branchFilter);
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;

      const response = await api.get('/api/v1/admin/reports/export-csv', {
        params,
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Siri_Samruddhi_${selectedReportType}_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      success('CSV Report exported successfully.');
    } catch (err) {
      console.error('Failed to export CSV:', err);
      toastError('Failed to download CSV report.');
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-7 pb-16">
      {/* ---------------- PRINT ONLY CORPORATE LETTERHEAD ---------------- */}
      <div className="hidden print:block border-b-2 border-[#1D1D1B] pb-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logoImg} alt="Siri Samruddhi" className="w-14 h-14 object-contain" />
            <div>
              <h1 className="text-xl font-black text-black uppercase tracking-wider">
                Siri Samruddhi Gold Palace Private Limited
              </h1>
              <p className="text-xs text-gray-700 font-semibold">
                Executive Management Intelligence & Performance Audit Report
              </p>
            </div>
          </div>
          <div className="text-right text-xs text-gray-800">
            <p className="font-bold">Confidential Enterprise Document</p>
            <p className="text-[11px] text-gray-600">Generated: {new Date().toLocaleString('en-IN')}</p>
          </div>
        </div>
      </div>

      {/* Screen Header (Hidden on Print) */}
      <div className="print:hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#EBE6DC] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#3B82F6] bg-[#EFF6FF] px-2.5 py-1 rounded-full border border-[#BFDBFE]">
              Executive Business Intelligence
            </span>
            <span className="text-xs text-[#8A8479] font-medium">8 Report Formats Available</span>
          </div>
          <h1 className="text-2xl font-extrabold text-[#1D1D1B] tracking-tight mt-1">
            Executive Intelligence & Reports Center
          </h1>
          <p className="text-xs text-[#8A8479] font-medium mt-0.5">
            Generate, filter, print, and stream CSV exports for all organizational departments and showrooms
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            onClick={handlePrint}
            icon={<Printer className="w-4 h-4" />}
          >
            Professional Print
          </Button>

          <Button
            onClick={handleExportCSV}
            isLoading={isExporting}
            icon={<Download className="w-4 h-4" />}
          >
            Export CSV
          </Button>
        </div>
      </div>

      {/* Report Categories Selector (Hidden on Print) */}
      <div className="print:hidden grid grid-cols-2 sm:grid-cols-4 gap-3">
        {reportTypes.map((rt) => (
          <button
            key={rt.id}
            onClick={() => setSelectedReportType(rt.id)}
            className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-1 ${
              selectedReportType === rt.id
                ? 'bg-[#F3E8FF] border-[#7E22CE] text-[#3B0764] shadow-xs'
                : 'bg-white border-[#E4DFD4] text-[#5E5A52] hover:bg-[#FAF8F3] hover:border-[#D8B4FE]'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold truncate">{rt.label}</span>
              {selectedReportType === rt.id && <div className="w-2 h-2 rounded-full bg-[#7E22CE]" />}
            </div>
            <p className="text-[10px] text-[#8A8479] line-clamp-1">{rt.desc}</p>
          </button>
        ))}
      </div>

      {/* Filter Toolbar (Hidden on Print) */}
      <div className="print:hidden p-4 bg-white border border-[#E4DFD4] rounded-2xl shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-wrap w-full sm:w-auto">
          {/* Branch Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#8A8479]">Branch:</span>
            <select
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              className="px-3 py-1.5 bg-[#FAF8F3] border border-[#E4DFD4] rounded-xl text-xs font-bold text-[#1D1D1B] focus:outline-none cursor-pointer"
            >
              <option value="all">All Branches (Consolidated)</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id.toString()}>
                  {b.name} Showroom
                </option>
              ))}
            </select>
          </div>

          {/* Date Range Inputs */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#8A8479]">From:</span>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="px-2.5 py-1.5 bg-[#FAF8F3] border border-[#E4DFD4] rounded-xl text-xs font-bold text-[#1D1D1B] focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#8A8479]">To:</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="px-2.5 py-1.5 bg-[#FAF8F3] border border-[#E4DFD4] rounded-xl text-xs font-bold text-[#1D1D1B] focus:outline-none"
            />
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchReport}
          icon={<RefreshCw className="w-3.5 h-3.5" />}
        >
          Update Report
        </Button>
      </div>

      {/* Generated Report Presentation */}
      <div className="bg-white border border-[#E4DFD4] rounded-3xl p-6 sm:p-7 shadow-[0_4px_18px_rgba(40,35,25,0.045)] space-y-6 print:border-none print:shadow-none print:p-0">
        {/* Report Document Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#EBE6DC] pb-4 print:border-b-2 print:border-black">
          <div>
            <h2 className="text-lg sm:text-xl font-extrabold text-[#1D1D1B] tracking-tight print:text-black">
              {reportData?.title || 'Executive Report'}
            </h2>
            <p className="text-xs text-[#8A8479] font-medium mt-0.5 print:text-gray-700">
              Scope: <span className="font-bold text-[#7E22CE] print:text-black">{reportData?.branch_filter}</span> • Generated:{' '}
              {reportData?.generated_at ? new Date(reportData.generated_at).toLocaleString('en-IN') : 'Just now'}
            </p>
          </div>
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#FAF8F3] border border-[#E4DFD4] text-[#1D1D1B] self-start sm:self-auto print:border-black print:text-black">
            {reportData?.total_records ?? 0} Records Processed
          </span>
        </div>

        {/* Summary Metrics Cards */}
        {reportData?.summary_metrics && Object.keys(reportData.summary_metrics).length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 print:grid-cols-4 print:gap-2">
            {Object.entries(reportData.summary_metrics).map(([key, val]) => (
              <div key={key} className="p-3.5 rounded-2xl bg-[#FAF8F3] border border-[#E4DFD4] space-y-1 print:border-gray-300 print:bg-gray-50 print:p-2">
                <span className="text-[10px] font-bold text-[#8A8479] uppercase tracking-wider block print:text-gray-600">
                  {key.replace(/_/g, ' ')}
                </span>
                <span className="text-base font-extrabold text-[#1D1D1B] block print:text-black print:text-sm">
                  {typeof val === 'number' && key.toLowerCase().includes('revenue')
                    ? `₹${val.toLocaleString('en-IN')}`
                    : val.toString()}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Dynamic Report Table */}
        {isLoading ? (
          <LoadingSpinner message="Generating report data..." />
        ) : !reportData || reportData.rows.length === 0 ? (
          <EmptyState
            title="No records found"
            description="No data exists for the selected report filters."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse print:text-[10px]">
              <thead className="bg-[#FAF8F3] border-b border-[#E4DFD4] text-[#5E5A52] uppercase font-bold text-[11px] print:bg-gray-100 print:text-black print:border-black">
                <tr>
                  {reportData.headers.map((h, i) => (
                    <th key={i} className="px-4 py-3 whitespace-nowrap print:px-2 print:py-2 print:border-b print:border-black">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EBE6DC] font-medium print:divide-gray-300">
                {reportData.rows.map((row, rIndex) => (
                  <tr key={rIndex} className="hover:bg-[#FAF5FF] transition-colors print:hover:bg-transparent">
                    {row.map((cell, cIndex) => (
                      <td key={cIndex} className="px-4 py-3.5 text-[#1D1D1B] whitespace-nowrap print:px-2 print:py-2 print:border-b print:border-gray-200">
                        {cell !== null && cell !== undefined ? cell.toString() : '—'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ---------------- PRINT ONLY SIGNATORY BLOCK ---------------- */}
        <div className="hidden print:grid grid-cols-3 gap-8 pt-12 mt-8 border-t border-gray-300 text-xs text-gray-800">
          <div className="border-t border-black pt-2 text-center">
            <p className="font-bold">Prepared By</p>
            <p className="text-[10px] text-gray-600">Showroom Operations Desk</p>
          </div>
          <div className="border-t border-black pt-2 text-center">
            <p className="font-bold">Audited & Verified By</p>
            <p className="text-[10px] text-gray-600">Executive Showroom Manager</p>
          </div>
          <div className="border-t border-black pt-2 text-center">
            <p className="font-bold">Authorized Signatory</p>
            <p className="text-[10px] text-gray-600">Siri Samruddhi Gold Palace HQ</p>
          </div>
        </div>
      </div>
    </div>
  );
};
