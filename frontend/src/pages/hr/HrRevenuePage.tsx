import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  TrendingUp,
  IndianRupee,
  Calendar,
  Search,
  Download,
  Filter,
  User,
  Phone,
  Sparkles,
  ShoppingBag,
  Eye,
  RefreshCw,
  Building2,
  CheckCircle2,
  RotateCcw,
  MapPin,
  Clock,
  Layers,
  ArrowUpRight,
} from 'lucide-react';
import api from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { CustomerActivity, CustomerDetailItem, Employee } from '../../types';
import { parseCustomerBreakdown } from '../../utils/customerUtils';
import { CustomerActivityViewModal } from '../../components/customers/CustomerActivityViewModal';

export const HrRevenuePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { error: toastError, success: toastSuccess } = useToast();

  const [activities, setActivities] = useState<CustomerActivity[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [branchBreakdown, setBranchBreakdown] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Tabs: Sold Customer Purchases vs Jewellery Savings Schemes
  const [activeTab, setActiveTab] = useState<'SOLD' | 'SCHEMES'>('SOLD');
  const [schemeCategory, setSchemeCategory] = useState<string>('ALL');
  const [search, setSearch] = useState<string>('');

  // Branch Filter (URL synced)
  const initialBranch = searchParams.get('branch')?.toUpperCase() || 'ALL';
  const [selectedBranch, setSelectedBranch] = useState<string>(initialBranch);

  // Date and Employee Filter States
  const [dateFilter, setDateFilter] = useState<
    'all' | 'today' | 'yesterday' | 'this_week' | 'this_month' | 'last_month' | 'custom'
  >('all');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [selectedEmployee, setSelectedEmployee] = useState<string>('ALL');

  // Single Customer View Modal
  const [viewingActivity, setViewingActivity] = useState<CustomerActivity | null>(null);

  // Keep branch in URL
  const handleBranchChange = (branchCode: string) => {
    setSelectedBranch(branchCode);
    if (branchCode === 'ALL') {
      searchParams.delete('branch');
      setSearchParams(searchParams, { replace: true });
    } else {
      setSearchParams({ branch: branchCode }, { replace: true });
    }
  };

  useEffect(() => {
    const b = searchParams.get('branch')?.toUpperCase();
    if (b && b !== selectedBranch) {
      setSelectedBranch(b);
    } else if (!b && selectedBranch !== 'ALL') {
      setSelectedBranch('ALL');
    }
  }, [searchParams]);

  const fetchRevenueData = async () => {
    try {
      setIsLoading(true);
      const params: Record<string, any> = {};
      if (selectedBranch && selectedBranch !== 'ALL') {
        params.branch_code = selectedBranch;
      }
      if (dateFilter && dateFilter !== 'all' && dateFilter !== 'custom') {
        params.date_filter = dateFilter;
      }
      if (fromDate) params.from_date = fromDate;
      if (toDate) params.to_date = toDate;
      if (search.trim()) params.search = search.trim();

      const [revRes, empRes] = await Promise.all([
        api.get('/api/v1/hr/revenue', { params }),
        api.get<any[]>('/api/v1/hr/employees').catch(() => ({ data: [] })),
      ]);

      if (revRes.data) {
        setActivities(revRes.data.activities || []);
        setBranchBreakdown(revRes.data.branch_breakdown || []);
      }
      if (empRes?.data && Array.isArray(empRes.data)) {
        setEmployees(empRes.data);
      }
    } catch (err: any) {
      console.error('Failed to load HR revenue data:', err);
      toastError('Could not load consolidated revenue records.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRevenueData();
  }, [selectedBranch, dateFilter, fromDate, toDate]);

  // Date filtering helper
  const pad = (n: number) => String(n).padStart(2, '0');
  const toLocalDateStr = (d: Date) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  const matchesDateFilter = (itemDateStr?: string) => {
    if (!itemDateStr) return false;
    const rowDate = itemDateStr.slice(0, 10);

    if (fromDate && rowDate < fromDate) return false;
    if (toDate && rowDate > toDate) return false;

    if (dateFilter === 'all') return true;

    const now = new Date();
    const todayStr = toLocalDateStr(now);

    if (dateFilter === 'today') {
      return rowDate === todayStr;
    } else if (dateFilter === 'yesterday') {
      const yest = new Date(now);
      yest.setDate(yest.getDate() - 1);
      return rowDate === toLocalDateStr(yest);
    } else if (dateFilter === 'this_week') {
      const weekAgo = new Date(now);
      weekAgo.setDate(weekAgo.getDate() - 7);
      return rowDate >= toLocalDateStr(weekAgo) && rowDate <= todayStr;
    } else if (dateFilter === 'this_month') {
      const monthStart = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-01`;
      return rowDate >= monthStart && rowDate <= todayStr;
    } else if (dateFilter === 'last_month') {
      const firstThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastPrevMonth = new Date(firstThisMonth.getTime() - 86400000);
      const firstPrevMonth = new Date(lastPrevMonth.getFullYear(), lastPrevMonth.getMonth(), 1);
      return rowDate >= toLocalDateStr(firstPrevMonth) && rowDate <= toLocalDateStr(lastPrevMonth);
    } else if (dateFilter === 'custom') {
      if (fromDate && rowDate < fromDate) return false;
      if (toDate && rowDate > toDate) return false;
      return true;
    }
    return true;
  };

  // Branch filtered employees for dropdown
  const filteredEmployeesList = useMemo(() => {
    if (selectedBranch === 'ALL') return employees;
    return employees.filter(
      (e) => (e.branch_code || '').toUpperCase() === selectedBranch.toUpperCase()
    );
  }, [employees, selectedBranch]);

  // Flattened Sold Customer Purchases
  const soldPurchases = useMemo(() => {
    const list: Array<{
      id: string;
      activityId: number;
      customerName: string;
      phone: string;
      status: string;
      exchangeType?: string;
      productId: string;
      productValue: number;
      employeeName: string;
      employeeCode: string;
      branchName: string;
      branchCode: string;
      date: string;
      notes: string;
      soldImageUrl?: string;
      parentActivity: CustomerActivity;
    }> = [];

    activities.forEach((act) => {
      const items: CustomerDetailItem[] = parseCustomerBreakdown(
        act.breakdown,
        act.customers_count || 1,
        act.status,
        act.customer_name,
        act.phone_number,
        act.dob,
        act.anniversary,
        act.product_value
      );

      items.forEach((item, idx) => {
        const itemStatus = item.status || act.status;
        const val = Number(item.product_value) || 0;
        const isSoldOrExchange = itemStatus === 'Sold' || itemStatus === 'Exchange' || val > 0;

        if (isSoldOrExchange) {
          list.push({
            id: `${act.id}-${idx}`,
            activityId: act.id,
            customerName: item.name || act.customer_name || `Customer #${idx + 1}`,
            phone: item.phone || act.phone_number || '',
            status: itemStatus === 'Sold' ? 'Sold' : itemStatus === 'Exchange' ? 'Exchange' : 'Sold',
            exchangeType: item.exchange_type,
            productId: item.product_id || '',
            productValue: val > 0 ? val : Number(act.product_value) || 0,
            employeeName: act.employee_name || 'Showroom Staff',
            employeeCode: act.employee_code || '',
            branchName: act.branch_name || 'Showroom',
            branchCode: act.branch_code || 'SHOWROOM',
            date: act.activity_date,
            notes: item.notes || act.notes || '',
            soldImageUrl: item.sold_image_url || '',
            parentActivity: act,
          });
        }
      });
    });

    return list;
  }, [activities]);

  // Flattened Scheme Enrollments
  const schemeEnrollments = useMemo(() => {
    const list: Array<{
      id: string;
      activityId: number;
      customerName: string;
      phone: string;
      schemeName: string;
      monthlyAmount: number;
      priceNotes?: string;
      reminderDate?: string;
      employeeName: string;
      employeeCode: string;
      branchName: string;
      branchCode: string;
      date: string;
      parentActivity: CustomerActivity;
    }> = [];

    activities.forEach((act) => {
      const items: CustomerDetailItem[] = parseCustomerBreakdown(
        act.breakdown,
        act.customers_count || 1,
        act.status,
        act.customer_name,
        act.phone_number,
        act.dob,
        act.anniversary,
        act.product_value
      );

      items.forEach((item, idx) => {
        if (item.has_scheme || item.scheme_name) {
          list.push({
            id: `sch-${act.id}-${idx}`,
            activityId: act.id,
            customerName: item.name || act.customer_name || `Customer #${idx + 1}`,
            phone: item.phone || act.phone_number || '',
            schemeName: item.scheme_name || 'SIRI SAMRUDDHI GOLDEN DREAMS',
            monthlyAmount: Number(item.scheme_amount) || 0,
            priceNotes: item.scheme_notes || '',
            reminderDate: item.scheme_reminder_date || '',
            employeeName: act.employee_name || 'Showroom Staff',
            employeeCode: act.employee_code || '',
            branchName: act.branch_name || 'Showroom',
            branchCode: act.branch_code || 'SHOWROOM',
            date: act.activity_date,
            parentActivity: act,
          });
        }
      });
    });

    return list;
  }, [activities]);

  // Filtered Sold Purchases List
  const filteredSold = useMemo(() => {
    return soldPurchases.filter((s) => {
      if (!matchesDateFilter(s.date)) return false;

      if (selectedBranch !== 'ALL') {
        if (s.branchCode.toUpperCase() !== selectedBranch.toUpperCase()) return false;
      }

      if (selectedEmployee !== 'ALL') {
        const empMatch =
          s.employeeName.toLowerCase().trim() === selectedEmployee.toLowerCase().trim() ||
          s.employeeCode.toLowerCase().trim() === selectedEmployee.toLowerCase().trim();
        if (!empMatch) return false;
      }

      if (search.trim()) {
        const q = search.toLowerCase();
        const match =
          s.customerName.toLowerCase().includes(q) ||
          s.phone.includes(q) ||
          s.productId.toLowerCase().includes(q) ||
          s.employeeName.toLowerCase().includes(q) ||
          s.employeeCode.toLowerCase().includes(q) ||
          s.branchName.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [soldPurchases, selectedBranch, dateFilter, fromDate, toDate, selectedEmployee, search]);

  // Filtered Schemes List
  const filteredSchemes = useMemo(() => {
    return schemeEnrollments.filter((sch) => {
      if (!matchesDateFilter(sch.date)) return false;

      if (selectedBranch !== 'ALL') {
        if (sch.branchCode.toUpperCase() !== selectedBranch.toUpperCase()) return false;
      }

      if (selectedEmployee !== 'ALL') {
        const empMatch =
          sch.employeeName.toLowerCase().trim() === selectedEmployee.toLowerCase().trim() ||
          sch.employeeCode.toLowerCase().trim() === selectedEmployee.toLowerCase().trim();
        if (!empMatch) return false;
      }

      if (schemeCategory !== 'ALL') {
        const sName = sch.schemeName.toUpperCase();
        if (schemeCategory === 'NIDHI' && !sName.includes('NIDHI')) return false;
        if (schemeCategory === 'GOLDEN_DREAMS' && !sName.includes('GOLDEN DREAMS')) return false;
        if (
          schemeCategory === 'OTHER' &&
          (sName.includes('NIDHI') || sName.includes('GOLDEN DREAMS'))
        )
          return false;
      }

      if (search.trim()) {
        const q = search.toLowerCase();
        const match =
          sch.customerName.toLowerCase().includes(q) ||
          sch.phone.includes(q) ||
          sch.schemeName.toLowerCase().includes(q) ||
          sch.employeeName.toLowerCase().includes(q) ||
          sch.employeeCode.toLowerCase().includes(q) ||
          sch.branchName.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [schemeEnrollments, selectedBranch, dateFilter, fromDate, toDate, selectedEmployee, schemeCategory, search]);

  // Aggregate Metrics
  const totalRevenue = useMemo(() => {
    return filteredSold.reduce((acc, curr) => acc + (curr.productValue || 0), 0);
  }, [filteredSold]);

  const totalSchemesVolume = useMemo(() => {
    return filteredSchemes.reduce((acc, curr) => acc + (curr.monthlyAmount || 0), 0);
  }, [filteredSchemes]);

  const avgOrderValue = useMemo(() => {
    if (filteredSold.length === 0) return 0;
    return Math.round(totalRevenue / filteredSold.length);
  }, [totalRevenue, filteredSold.length]);

  // CSV Export Handler
  const handleExportCSV = () => {
    if (activeTab === 'SOLD') {
      if (filteredSold.length === 0) {
        toastError('No sold customer records to export.');
        return;
      }
      const headers = [
        'Date',
        'Customer Name',
        'Phone Number',
        'Branch',
        'Status',
        'Exchange Type',
        'Product / Tag ID',
        'Sold Value (INR)',
        'Attended Employee',
        'Employee Code',
        'Notes',
      ];
      const rows = filteredSold.map((s) => [
        s.date,
        `"${s.customerName.replace(/"/g, '""')}"`,
        `"${s.phone}"`,
        `"${s.branchName}"`,
        s.status,
        s.exchangeType || 'N/A',
        `"${s.productId}"`,
        s.productValue,
        `"${s.employeeName.replace(/"/g, '""')}"`,
        s.employeeCode,
        `"${(s.notes || '').replace(/"/g, '""')}"`,
      ]);

      const csvContent =
        '\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `HR_Revenue_Sold_${selectedBranch}_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toastSuccess('Sold customer revenue CSV exported.');
    } else {
      if (filteredSchemes.length === 0) {
        toastError('No jewellery scheme records to export.');
        return;
      }
      const headers = [
        'Date',
        'Customer Name',
        'Phone',
        'Branch',
        'Scheme Name',
        'Monthly Amount (INR)',
        'Price Notes',
        'Payment Reminder Date',
        'Enrolled By Employee',
        'Employee Code',
      ];
      const rows = filteredSchemes.map((s) => [
        s.date,
        `"${s.customerName.replace(/"/g, '""')}"`,
        `"${s.phone}"`,
        `"${s.branchName}"`,
        `"${s.schemeName.replace(/"/g, '""')}"`,
        s.monthlyAmount,
        `"${(s.priceNotes || '').replace(/"/g, '""')}"`,
        s.reminderDate || 'N/A',
        `"${s.employeeName.replace(/"/g, '""')}"`,
        s.employeeCode,
      ]);

      const csvContent =
        '\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `HR_Savings_Schemes_${selectedBranch}_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toastSuccess('Jewellery savings schemes CSV exported.');
    }
  };

  const resetFilters = () => {
    setSelectedBranch('ALL');
    searchParams.delete('branch');
    setSearchParams(searchParams, { replace: true });
    setDateFilter('all');
    setFromDate('');
    setToDate('');
    setSelectedEmployee('ALL');
    setSearch('');
    setSchemeCategory('ALL');
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Top Banner Header */}
      <div className="bg-white border border-[#E4DFD4] rounded-3xl p-6 sm:p-8 shadow-[0_4px_18px_rgba(40,35,25,0.045)] flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#FAF8F3] border border-[#E4DFD4] text-[#B45309] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#D97706]" />
              <span>HR Central Revenue Control</span>
            </span>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#E8F4EE] border border-[#C5E3D5] text-[#21845F]">
              Yelahanka • Kolar • Udupi
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#1D1D1B] tracking-tight">
            Revenue & Sales Intelligence
          </h1>
          <p className="text-xs sm:text-sm text-[#5E5A52] font-medium mt-1">
            Complete revenue tracking, customer jewellery purchases, and savings schemes segregated across showroom branches.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={handleExportCSV}
            className="px-4 py-2.5 rounded-xl bg-[#21845F] hover:bg-[#1A6B4C] text-white font-extrabold text-xs shadow-sm flex items-center gap-2 cursor-pointer transition-all hover:scale-102"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={fetchRevenueData}
            className="p-2.5 rounded-xl bg-white border border-[#E4DFD4] hover:bg-[#FAF8F3] text-[#536B8A] transition-colors cursor-pointer"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Showroom Branch Segregation Bar */}
      <div className="bg-white border border-[#E4DFD4] rounded-2xl p-2.5 shadow-xs flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
          <button
            onClick={() => handleBranchChange('ALL')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
              selectedBranch === 'ALL'
                ? 'bg-[#1D1D1B] text-white shadow-xs'
                : 'bg-[#FAF8F3] text-[#5E5A52] hover:bg-[#F2EDE4] hover:text-[#1D1D1B] border border-[#E4DFD4]'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-[#E5C378]" />
            <span>All Showrooms (Consolidated)</span>
          </button>

          <button
            onClick={() => handleBranchChange('YELAHANKA')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
              selectedBranch === 'YELAHANKA'
                ? 'bg-[#D97706] text-white shadow-xs'
                : 'bg-[#FAF8F3] text-[#B45309] hover:bg-[#FEF3C7] border border-[#FDE68A]'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Yelahanka Showroom</span>
          </button>

          <button
            onClick={() => handleBranchChange('KOLAR')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
              selectedBranch === 'KOLAR'
                ? 'bg-[#0284C7] text-white shadow-xs'
                : 'bg-[#FAF8F3] text-[#0284C7] hover:bg-[#E0F2FE] border border-[#BAE6FD]'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Kolar Showroom</span>
          </button>

          <button
            onClick={() => handleBranchChange('UDUPI')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
              selectedBranch === 'UDUPI'
                ? 'bg-[#059669] text-white shadow-xs'
                : 'bg-[#FAF8F3] text-[#059669] hover:bg-[#D1FAE5] border border-[#A7F3D0]'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Udupi Showroom</span>
          </button>
        </div>

        {(selectedBranch !== 'ALL' || dateFilter !== 'all' || selectedEmployee !== 'ALL' || search) && (
          <button
            onClick={resetFilters}
            className="px-3 py-1.5 rounded-lg text-xs font-bold text-[#8A8479] hover:text-[#DC2626] hover:bg-[#FEE2E2]/50 transition-colors flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset Filters</span>
          </button>
        )}
      </div>

      {/* Showroom Branch Comparison Cards (Visible when ALL or summary) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {branchBreakdown.map((b: any) => {
          const isSelected = selectedBranch === b.branch_code;
          return (
            <div
              key={b.branch_code}
              onClick={() => handleBranchChange(b.branch_code)}
              className={`bg-white rounded-2xl p-5 border-2 transition-all cursor-pointer group shadow-xs hover:shadow-md ${
                isSelected
                  ? 'border-[#D97706] ring-2 ring-[#D97706]/20'
                  : 'border-[#E4DFD4] hover:border-[#D97706]/50'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#FAF8F3] border border-[#E4DFD4] text-[#8A8479] uppercase">
                    {b.branch_code}
                  </span>
                  <h3 className="text-base font-extrabold text-[#1D1D1B] mt-1.5 group-hover:text-[#D97706] transition-colors">
                    {b.branch_name}
                  </h3>
                  <p className="text-xs text-[#8A8479] flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 text-[#D97706]" />
                    <span>{b.city || 'Showroom'}</span>
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[11px] font-bold text-[#8A8479] block">Revenue</span>
                  <div className="text-lg font-black font-mono text-[#21845F]">
                    ₹{(b.revenue || 0).toLocaleString('en-IN')}
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[#F0ECE1] flex items-center justify-between text-xs text-[#6B6559]">
                <div className="flex items-center gap-3 font-semibold">
                  <span>
                    <strong className="text-[#1D1D1B] font-mono">{b.sold_count || 0}</strong> Sold
                  </span>
                  <span>•</span>
                  <span>
                    <strong className="text-[#D97706] font-mono">₹{(b.schemes_volume || 0).toLocaleString('en-IN')}</strong> Schemes
                  </span>
                </div>
                <span className="text-[11px] font-bold text-[#D97706] group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                  <span>Filter</span>
                  <ArrowUpRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Gross Revenue */}
        <div className="bg-white border border-[#E4DFD4] rounded-2xl p-5 shadow-xs">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-bold text-[#21845F] uppercase tracking-wider block mb-1">
                Gross Sold Revenue
              </span>
              <div className="text-2xl sm:text-3xl font-black text-[#1D1D1B] font-mono">
                ₹{totalRevenue.toLocaleString('en-IN')}
              </div>
              <span className="text-xs text-[#8A8479] font-medium mt-1 block">
                {selectedBranch === 'ALL' ? 'Across all 3 showrooms' : `${selectedBranch} branch`}
              </span>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-[#E8F4EE] border border-[#C5E3D5] text-[#21845F] flex items-center justify-center shrink-0">
              <IndianRupee className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Card 2: Sold Transactions */}
        <div className="bg-white border border-[#E4DFD4] rounded-2xl p-5 shadow-xs">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-bold text-[#D97706] uppercase tracking-wider block mb-1">
                Completed Purchases
              </span>
              <div className="text-2xl sm:text-3xl font-black text-[#1D1D1B] font-mono">
                {filteredSold.length}
              </div>
              <span className="text-xs text-[#8A8479] font-medium mt-1 block">
                Sold & Exchange orders
              </span>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-[#FEF3C7] border border-[#FDE68A] text-[#D97706] flex items-center justify-center shrink-0">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Card 3: Jewellery Savings Schemes */}
        <div className="bg-white border border-[#E4DFD4] rounded-2xl p-5 shadow-xs">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-bold text-[#3B82F6] uppercase tracking-wider block mb-1">
                Monthly Schemes Volume
              </span>
              <div className="text-2xl sm:text-3xl font-black text-[#1D1D1B] font-mono">
                ₹{totalSchemesVolume.toLocaleString('en-IN')}
              </div>
              <span className="text-xs text-[#8A8479] font-medium mt-1 block">
                {filteredSchemes.length} Active Accounts
              </span>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-[#EFF6FF] border border-[#BFDBFE] text-[#3B82F6] flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Card 4: Average Order Value */}
        <div className="bg-white border border-[#E4DFD4] rounded-2xl p-5 shadow-xs">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-bold text-[#8B5CF6] uppercase tracking-wider block mb-1">
                Avg Ticket Size
              </span>
              <div className="text-2xl sm:text-3xl font-black text-[#1D1D1B] font-mono">
                ₹{avgOrderValue.toLocaleString('en-IN')}
              </div>
              <span className="text-xs text-[#8A8479] font-medium mt-1 block">
                Per customer transaction
              </span>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-[#F5F3FF] border border-[#DDD6FE] text-[#8B5CF6] flex items-center justify-center shrink-0">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="bg-white border border-[#E4DFD4] rounded-3xl p-5 shadow-xs space-y-4">
        {/* Date Filter Presets */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-bold text-[#6B6559] flex items-center gap-1 mr-1">
              <Calendar className="w-3.5 h-3.5 text-[#536B8A]" />
              <span>Period:</span>
            </span>
            {(
              [
                { label: 'All Time', val: 'all' },
                { label: 'Today', val: 'today' },
                { label: 'Yesterday', val: 'yesterday' },
                { label: 'This Week', val: 'this_week' },
                { label: 'This Month', val: 'this_month' },
                { label: 'Last Month', val: 'last_month' },
                { label: 'Custom', val: 'custom' },
              ] as const
            ).map((item) => (
              <button
                key={item.val}
                onClick={() => setDateFilter(item.val)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  dateFilter === item.val
                    ? 'bg-[#1D1D1B] text-white shadow-xs'
                    : 'bg-[#FAF8F3] text-[#5E5A52] hover:bg-[#F2EDE4] border border-[#E4DFD4]'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Employee Filter */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <User className="w-3.5 h-3.5 text-[#536B8A] shrink-0" />
            <select
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
              className="px-3 py-1.5 text-xs font-bold bg-[#FAF8F3] border border-[#E4DFD4] rounded-xl text-[#1D1D1B] focus:outline-none focus:border-[#21845F] focus:bg-white"
            >
              <option value="ALL">All Attending Staff ({filteredEmployeesList.length})</option>
              {filteredEmployeesList.map((emp) => (
                <option key={emp.id} value={emp.full_name}>
                  {emp.full_name} ({emp.employee_code || emp.branch_code || 'STAFF'})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Custom Datepicker Row (Visible if custom selected) */}
        {dateFilter === 'custom' && (
          <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-[#F0ECE1]">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#6B6559]">From:</span>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="px-3 py-1.5 text-xs font-mono font-bold bg-[#FAF8F3] border border-[#E4DFD4] rounded-xl focus:outline-none focus:border-[#21845F]"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#6B6559]">To:</span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="px-3 py-1.5 text-xs font-mono font-bold bg-[#FAF8F3] border border-[#E4DFD4] rounded-xl focus:outline-none focus:border-[#21845F]"
              />
            </div>
          </div>
        )}

        {/* Search Bar & Tabs Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-[#F0ECE1]">
          {/* Main Tabs */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('SOLD')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'SOLD'
                  ? 'bg-[#21845F] text-white shadow-xs'
                  : 'bg-[#FAF8F3] text-[#5E5A52] hover:bg-[#F2EDE4] border border-[#E4DFD4]'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Customer Purchases ({filteredSold.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('SCHEMES')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'SCHEMES'
                  ? 'bg-[#D97706] text-white shadow-xs'
                  : 'bg-[#FAF8F3] text-[#5E5A52] hover:bg-[#F2EDE4] border border-[#E4DFD4]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Savings Schemes ({filteredSchemes.length})</span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 text-[#8A8479] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search customer, staff, phone, tag..."
              className="w-full pl-8 pr-3 py-2 text-xs bg-[#FAF8F3] border border-[#E4DFD4] rounded-xl focus:outline-none focus:border-[#21845F] focus:bg-white"
            />
          </div>
        </div>

        {/* Scheme Category Filter (Only on SCHEMES tab) */}
        {activeTab === 'SCHEMES' && (
          <div className="flex items-center gap-2 pt-2 border-t border-[#F0ECE1]">
            <span className="text-[11px] font-bold text-[#6B6559] uppercase tracking-wider">
              Scheme Category:
            </span>
            {[
              { label: 'All Schemes', val: 'ALL' },
              { label: 'Siri Nidhi (10 Months)', val: 'NIDHI' },
              { label: 'Siri Samruddhi Golden Dreams', val: 'GOLDEN_DREAMS' },
              { label: 'Other Monthly Schemes', val: 'OTHER' },
            ].map((c) => (
              <button
                key={c.val}
                onClick={() => setSchemeCategory(c.val)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  schemeCategory === c.val
                    ? 'bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]'
                    : 'text-[#8A8479] hover:bg-[#FAF8F3]'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main Data Tables Section */}
      <div className="bg-white border border-[#E4DFD4] rounded-3xl overflow-hidden shadow-[0_4px_18px_rgba(40,35,25,0.045)]">
        {activeTab === 'SOLD' ? (
          /* TAB 1: CUSTOMER PURCHASES (SOLD) */
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#FAF8F3] border-b border-[#EBE6DC] text-[#6B6559] uppercase font-bold text-[10px] tracking-wider">
                  <th className="px-5 py-3.5">Visit Date</th>
                  <th className="px-5 py-3.5">Customer & Contact</th>
                  <th className="px-5 py-3.5">Showroom Branch</th>
                  <th className="px-5 py-3.5">Attended By Staff</th>
                  <th className="px-5 py-3.5">Outcome</th>
                  <th className="px-5 py-3.5">Purchase Value (₹)</th>
                  <th className="px-5 py-3.5">Notes / Breakdown</th>
                  <th className="px-5 py-3.5 text-right">View</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0ECE1]">
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-12 text-center text-[#8A8479]">
                      <RefreshCw className="w-5 h-5 animate-spin mx-auto text-[#21845F]" />
                      <span className="block mt-2 font-semibold">Loading revenue transactions...</span>
                    </td>
                  </tr>
                ) : filteredSold.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-12 text-center text-[#8A8479]">
                      <p className="font-bold text-sm text-[#1D1D1B]">No sold purchases found.</p>
                      <p className="text-xs mt-1">
                        Try adjusting the showroom branch, date filters, or search terms.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredSold.map((item) => (
                    <tr key={item.id} className="hover:bg-[#FAF9F5] transition-colors">
                      {/* Date */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 font-bold text-[#1D1D1B]">
                          <Calendar className="w-3.5 h-3.5 text-[#536B8A]" />
                          <span>{item.date}</span>
                        </div>
                        <span className="text-[10px] font-mono text-[#8A8479]">#{item.activityId}</span>
                      </td>

                      {/* Customer */}
                      <td className="px-5 py-3.5">
                        <div className="font-extrabold text-[#1D1D1B] text-sm">
                          {item.customerName}
                        </div>
                        {item.phone ? (
                          <div className="text-[11px] font-mono text-[#536B8A] flex items-center gap-1">
                            <Phone className="w-3 h-3 text-[#21845F]" />
                            <span>{item.phone}</span>
                          </div>
                        ) : (
                          <span className="text-[10px] text-[#8A8479] italic">No phone</span>
                        )}
                      </td>

                      {/* Branch */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            item.branchCode === 'YELAHANKA'
                              ? 'bg-[#FEF3C7] text-[#B45309] border-[#FDE68A]'
                              : item.branchCode === 'KOLAR'
                              ? 'bg-[#E0F2FE] text-[#0284C7] border-[#BAE6FD]'
                              : 'bg-[#D1FAE5] text-[#059669] border-[#A7F3D0]'
                          }`}
                        >
                          {item.branchName}
                        </span>
                      </td>

                      {/* Attended Staff */}
                      <td className="px-5 py-3.5">
                        <div className="font-bold text-[#1D1D1B]">{item.employeeName}</div>
                        <div className="text-[10px] font-mono text-[#8A8479]">{item.employeeCode}</div>
                      </td>

                      {/* Outcome */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold border ${
                            item.status === 'Sold'
                              ? 'bg-[#E8F4EE] text-[#21845F] border-[#C5E3D5]'
                              : 'bg-[#FEF3C7] text-[#92400E] border-[#FDE68A]'
                          }`}
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          <span>{item.status}</span>
                          {item.exchangeType && (
                            <span className="text-[9.5px] font-mono uppercase bg-black/10 px-1 rounded ml-1">
                              {item.exchangeType}
                            </span>
                          )}
                        </span>
                      </td>

                      {/* Value */}
                      <td className="px-5 py-3.5 font-mono font-black text-sm whitespace-nowrap">
                        <span className="text-[#21845F]">
                          ₹{item.productValue.toLocaleString('en-IN')}
                        </span>
                      </td>

                      {/* Notes / Tag */}
                      <td className="px-5 py-3.5 max-w-xs">
                        {item.productId && (
                          <span className="inline-block px-1.5 py-0.5 text-[10px] font-mono bg-[#FAF8F3] border border-[#E4DFD4] rounded text-[#5E5A52] mr-1">
                            Tag: {item.productId}
                          </span>
                        )}
                        <span className="text-[#5E5A52] text-xs truncate block">
                          {item.notes || '—'}
                        </span>
                      </td>

                      {/* View Single Customer */}
                      <td className="px-5 py-3.5 text-right whitespace-nowrap">
                        <button
                          onClick={() => setViewingActivity(item.parentActivity)}
                          className="p-1.5 rounded-lg bg-[#FAF8F3] hover:bg-[#F2EDE4] text-[#536B8A] hover:text-[#1D1D1B] border border-[#E4DFD4] transition-colors cursor-pointer"
                          title="View Single Customer Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          /* TAB 2: JEWELLERY SAVINGS SCHEMES */
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#FAF8F3] border-b border-[#EBE6DC] text-[#6B6559] uppercase font-bold text-[10px] tracking-wider">
                  <th className="px-5 py-3.5">Enrolled Date</th>
                  <th className="px-5 py-3.5">Customer & Contact</th>
                  <th className="px-5 py-3.5">Showroom Branch</th>
                  <th className="px-5 py-3.5">Scheme Details</th>
                  <th className="px-5 py-3.5">Monthly Amount (₹)</th>
                  <th className="px-5 py-3.5">Payment Reminder</th>
                  <th className="px-5 py-3.5">Enrolled By Staff</th>
                  <th className="px-5 py-3.5 text-right">View</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0ECE1]">
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-12 text-center text-[#8A8479]">
                      <RefreshCw className="w-5 h-5 animate-spin mx-auto text-[#D97706]" />
                      <span className="block mt-2 font-semibold">Loading scheme records...</span>
                    </td>
                  </tr>
                ) : filteredSchemes.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-12 text-center text-[#8A8479]">
                      <p className="font-bold text-sm text-[#1D1D1B]">No jewellery schemes enrolled.</p>
                      <p className="text-xs mt-1">
                        Try changing the scheme category or showroom branch filter.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredSchemes.map((item) => (
                    <tr key={item.id} className="hover:bg-[#FAF9F5] transition-colors">
                      {/* Date */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 font-bold text-[#1D1D1B]">
                          <Calendar className="w-3.5 h-3.5 text-[#536B8A]" />
                          <span>{item.date}</span>
                        </div>
                        <span className="text-[10px] font-mono text-[#8A8479]">#{item.activityId}</span>
                      </td>

                      {/* Customer */}
                      <td className="px-5 py-3.5">
                        <div className="font-extrabold text-[#1D1D1B] text-sm">
                          {item.customerName}
                        </div>
                        {item.phone ? (
                          <div className="text-[11px] font-mono text-[#536B8A] flex items-center gap-1">
                            <Phone className="w-3 h-3 text-[#21845F]" />
                            <span>{item.phone}</span>
                          </div>
                        ) : (
                          <span className="text-[10px] text-[#8A8479] italic">No phone</span>
                        )}
                      </td>

                      {/* Branch */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            item.branchCode === 'YELAHANKA'
                              ? 'bg-[#FEF3C7] text-[#B45309] border-[#FDE68A]'
                              : item.branchCode === 'KOLAR'
                              ? 'bg-[#E0F2FE] text-[#0284C7] border-[#BAE6FD]'
                              : 'bg-[#D1FAE5] text-[#059669] border-[#A7F3D0]'
                          }`}
                        >
                          {item.branchName}
                        </span>
                      </td>

                      {/* Scheme Details */}
                      <td className="px-5 py-3.5">
                        <div className="font-bold text-[#D97706] text-xs flex items-center gap-1">
                          <Sparkles className="w-3 h-3" />
                          <span>{item.schemeName}</span>
                        </div>
                        {item.priceNotes && (
                          <p className="text-[11px] text-[#8A8479] mt-0.5">Note: {item.priceNotes}</p>
                        )}
                      </td>

                      {/* Monthly Amount */}
                      <td className="px-5 py-3.5 font-mono font-black text-sm whitespace-nowrap">
                        <span className="text-[#1D1D1B]">
                          ₹{item.monthlyAmount.toLocaleString('en-IN')}
                        </span>
                        <span className="text-[10px] font-normal text-[#8A8479] block">/ month</span>
                      </td>

                      {/* Payment Reminder Date */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        {item.reminderDate ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-mono font-bold bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]">
                            <Clock className="w-3 h-3" />
                            <span>Pay Day: {item.reminderDate}</span>
                          </span>
                        ) : (
                          <span className="text-[11px] text-[#8A8479] italic">Auto monthly</span>
                        )}
                      </td>

                      {/* Enrolled By Staff */}
                      <td className="px-5 py-3.5">
                        <div className="font-bold text-[#1D1D1B]">{item.employeeName}</div>
                        <div className="text-[10px] font-mono text-[#8A8479]">{item.employeeCode}</div>
                      </td>

                      {/* View Single Action */}
                      <td className="px-5 py-3.5 text-right whitespace-nowrap">
                        <button
                          onClick={() => setViewingActivity(item.parentActivity)}
                          className="p-1.5 rounded-lg bg-[#FAF8F3] hover:bg-[#F2EDE4] text-[#536B8A] hover:text-[#1D1D1B] border border-[#E4DFD4] transition-colors cursor-pointer"
                          title="View Single Customer Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Customer Activity View Modal */}
      <CustomerActivityViewModal
        isOpen={!!viewingActivity}
        onClose={() => setViewingActivity(null)}
        activity={viewingActivity}
      />
    </div>
  );
};
