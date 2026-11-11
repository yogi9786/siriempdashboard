import React, { useState, useEffect, useMemo } from 'react';
import {
  TrendingUp,
  IndianRupee,
  Calendar,
  Search,
  Download,
  Filter,
  User,
  Phone,
  Tag,
  Award,
  Sparkles,
  ShoppingBag,
  Clock,
  Eye,
  RefreshCw,
  Building2,
  CheckCircle2,
} from 'lucide-react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { CustomerActivity, CustomerDetailItem } from '../../types';
import { parseCustomerBreakdown } from '../../utils/customerUtils';
import { CustomerActivityViewModal } from '../../components/customers/CustomerActivityViewModal';

export const BranchRevenuePage: React.FC = () => {
  const { user, selectedBranch } = useAuth();
  const { success, error: toastError } = useToast();

  const [activities, setActivities] = useState<CustomerActivity[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'SOLD' | 'SCHEMES'>('SOLD');
  const [schemeCategory, setSchemeCategory] = useState<string>('ALL');
  const [search, setSearch] = useState<string>('');
  const [dateRange, setDateRange] = useState<'ALL' | 'TODAY' | 'MONTH'>('ALL');
  const [viewingActivity, setViewingActivity] = useState<CustomerActivity | null>(null);

  const fetchBranchActivities = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/api/v1/customers', {
        params: {
          branch_id: selectedBranch?.id || user?.branch_id,
          limit: 300,
        },
      });
      setActivities(res.data || []);
    } catch (err: any) {
      console.error('Failed to load revenue data:', err);
      toastError('Could not load branch revenue activities.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBranchActivities();
  }, [selectedBranch]);

  // Flattened Sold Purchases
  const soldPurchases = useMemo(() => {
    const list: Array<{
      id: string;
      activityId: number;
      customerName: string;
      phone: string;
      productId: string;
      productValue: number;
      soldImageUrl?: string;
      employeeName: string;
      employeeCode: string;
      date: string;
      approvalStatus: string;
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

      // Check sub-items
      items.forEach((item, idx) => {
        const isSold = (item.status || '').toLowerCase() === 'sold' || (!item.status && (act.status || '').toLowerCase() === 'sold');
        const val = Number(item.product_value) || (idx === 0 && isSold ? Number(act.product_value) || 0 : 0);
        if (isSold || val > 0) {
          list.push({
            id: `sold-${act.id}-${idx}`,
            activityId: act.id,
            customerName: item.name || act.customer_name || `Customer #${idx + 1}`,
            phone: item.phone || act.phone_number || '',
            productId: item.product_id || act.product_id || 'JEWELRY-ITEM',
            productValue: val,
            soldImageUrl: item.sold_image_url || act.sold_image_url,
            employeeName: act.employee_name || 'Showroom Staff',
            employeeCode: act.employee_code || '',
            date: act.activity_date,
            approvalStatus: act.approval_status || 'PENDING',
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
            schemeName: item.scheme_name || 'SIRISAMRUDDHI GOLDEN DREAMS',
            monthlyAmount: Number(item.scheme_amount) || 0,
            priceNotes: item.scheme_notes || '',
            reminderDate: item.scheme_reminder_date || '',
            employeeName: act.employee_name || 'Showroom Staff',
            employeeCode: act.employee_code || '',
            date: act.activity_date,
            parentActivity: act,
          });
        }
      });
    });

    return list;
  }, [activities]);

  // Summary Metrics strictly for this branch
  const totalSalesRevenue = useMemo(() => {
    return soldPurchases.reduce((acc, curr) => acc + (curr.productValue || 0), 0);
  }, [soldPurchases]);

  const totalSchemesVolume = useMemo(() => {
    return schemeEnrollments.reduce((acc, curr) => acc + (curr.monthlyAmount || 0), 0);
  }, [schemeEnrollments]);

  // Filtered Sold List
  const filteredSold = useMemo(() => {
    return soldPurchases.filter((s) => {
      if (search.trim()) {
        const q = search.toLowerCase();
        const match =
          s.customerName.toLowerCase().includes(q) ||
          s.phone.includes(q) ||
          s.productId.toLowerCase().includes(q) ||
          s.employeeName.toLowerCase().includes(q) ||
          s.employeeCode.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [soldPurchases, search]);

  // Filtered Schemes List
  const filteredSchemes = useMemo(() => {
    return schemeEnrollments.filter((sch) => {
      if (schemeCategory !== 'ALL') {
        if (!sch.schemeName.toUpperCase().includes(schemeCategory.toUpperCase())) {
          return false;
        }
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        const match =
          sch.customerName.toLowerCase().includes(q) ||
          sch.phone.includes(q) ||
          sch.schemeName.toLowerCase().includes(q) ||
          sch.employeeName.toLowerCase().includes(q) ||
          sch.employeeCode.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [schemeEnrollments, schemeCategory, search]);

  // Export to CSV
  const handleExportCSV = () => {
    if (activeTab === 'SOLD') {
      const headers = ['Date', 'Customer Name', 'Phone', 'Product ID', 'Value (INR)', 'Sold By Staff', 'Staff Code', 'Status'];
      const rows = filteredSold.map((s) => [
        s.date,
        `"${s.customerName}"`,
        s.phone,
        `"${s.productId}"`,
        s.productValue,
        `"${s.employeeName}"`,
        s.employeeCode,
        s.approvalStatus,
      ]);
      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `branch_revenue_sales_${selectedBranch?.code || 'branch'}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      const headers = ['Date', 'Customer Name', 'Phone', 'Scheme Name', 'Monthly Amount (INR)', 'Enrolled By Staff', 'Staff Code', 'Price Notes'];
      const rows = filteredSchemes.map((s) => [
        s.date,
        `"${s.customerName}"`,
        s.phone,
        `"${s.schemeName}"`,
        s.monthlyAmount,
        `"${s.employeeName}"`,
        s.employeeCode,
        `"${s.priceNotes || ''}"`,
      ]);
      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `branch_revenue_schemes_${selectedBranch?.code || 'branch'}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-[#E4DFD4] rounded-3xl p-6 sm:p-8 shadow-[0_4px_18px_rgba(40,35,25,0.045)] flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#E8F4EE] border border-[#C5E3D5] text-[#21845F] flex items-center gap-1.5">
              <IndianRupee className="w-3.5 h-3.5" />
              <span>Showroom Branch Revenue</span>
            </span>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#FAF8F3] border border-[#E4DFD4] text-[#B45309]">
              {selectedBranch?.name || user?.branch_name || 'Showroom'} Branch Only
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#1D1D1B] tracking-tight">
            Revenue & Sales Breakdown
          </h1>
          <p className="text-xs sm:text-sm text-[#5E5A52] font-medium mt-1">
            Detailed purchases, items sold, employee sales attribution, and monthly savings schemes exclusively for {selectedBranch?.name || 'this'} showroom.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={handleExportCSV}
            className="px-4 py-2.5 rounded-xl bg-white border border-[#C5E3D5] hover:border-[#21845F] text-[#21845F] hover:bg-[#E8F4EE] text-xs font-bold shadow-2xs flex items-center gap-2 cursor-pointer transition-all"
          >
            <Download className="w-4 h-4 text-[#21845F]" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={fetchBranchActivities}
            className="p-2.5 rounded-xl bg-white border border-[#E4DFD4] hover:bg-[#FAF8F3] text-[#536B8A] transition-colors cursor-pointer"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 4 Solid Colored KPI Summary Cards (Site Theme) */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Revenue */}
        <div className="bg-[#E8F4EE] border border-[#C5E3D5] rounded-2xl p-5 shadow-xs">
          <span className="text-[11px] font-bold text-[#21845F] uppercase tracking-wider block mb-1">
            Store Sales Revenue
          </span>
          <div className="text-2xl sm:text-3xl font-black font-mono text-[#1D1D1B]">
            ₹{totalSalesRevenue.toLocaleString('en-IN')}
          </div>
          <span className="text-xs text-[#21845F] font-semibold mt-1 block">Closed Jewelry Deals</span>
        </div>

        {/* Card 2: Sold Count */}
        <div className="bg-[#FAF1EC] border border-[#ECCFC0] rounded-2xl p-5 shadow-xs">
          <span className="text-[11px] font-bold text-[#B97855] uppercase tracking-wider block mb-1">
            Items / Deals Sold
          </span>
          <div className="text-2xl sm:text-3xl font-black font-mono text-[#1D1D1B]">
            {soldPurchases.length}
          </div>
          <span className="text-xs text-[#B97855] font-semibold mt-1 block">Purchasing Customers</span>
        </div>

        {/* Card 3: Total Schemes Enrolled */}
        <div className="bg-[#FEF3C7] border border-[#FDE68A] rounded-2xl p-5 shadow-xs">
          <span className="text-[11px] font-bold text-[#92400E] uppercase tracking-wider block mb-1">
            Schemes Enrolled
          </span>
          <div className="text-2xl sm:text-3xl font-black font-mono text-[#1D1D1B]">
            {schemeEnrollments.length}
          </div>
          <span className="text-xs text-[#92400E] font-semibold mt-1 block">Active Savings Accounts</span>
        </div>

        {/* Card 4: Schemes Monthly Volume */}
        <div className="bg-[#EFF6FF] border border-[#BFDBFE] rounded-2xl p-5 shadow-xs">
          <span className="text-[11px] font-bold text-[#1D4ED8] uppercase tracking-wider block mb-1">
            Monthly Schemes Volume
          </span>
          <div className="text-2xl sm:text-3xl font-black font-mono text-[#1D1D1B]">
            ₹{totalSchemesVolume.toLocaleString('en-IN')}
          </div>
          <span className="text-xs text-[#1D4ED8] font-semibold mt-1 block">Monthly Recurring Commitment</span>
        </div>
      </div>

      {/* Main Tab Toggle: Sold Purchases vs Jewellery Schemes */}
      <div className="bg-white border border-[#E4DFD4] rounded-2xl p-2.5 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('SOLD')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'SOLD'
                ? 'bg-[#21845F] text-white shadow-2xs'
                : 'bg-[#FAF8F3] hover:bg-[#F2EDE4] text-[#5E5A52] border border-[#E4DFD4]'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Sold Ornaments & Purchases ({soldPurchases.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('SCHEMES')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'SCHEMES'
                ? 'bg-[#D97706] text-white shadow-2xs'
                : 'bg-[#FAF8F3] hover:bg-[#F2EDE4] text-[#5E5A52] border border-[#E4DFD4]'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>Jewellery Savings Schemes ({schemeEnrollments.length})</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-[#8A8479] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={activeTab === 'SOLD' ? 'Search customer, phone, product...' : 'Search scheme, staff...'}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#FAF8F3] border border-[#E4DFD4] rounded-xl focus:outline-none focus:border-[#21845F] focus:bg-white"
          />
        </div>
      </div>

      {/* TAB 1: SOLD PURCHASES TABLE */}
      {activeTab === 'SOLD' && (
        <div className="bg-white border border-[#E4DFD4] rounded-3xl overflow-hidden shadow-[0_4px_18px_rgba(40,35,25,0.045)]">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#FAF8F3] border-b border-[#EBE6DC] text-[#6B6559] uppercase font-bold text-[10px] tracking-wider">
                  <th className="px-5 py-3.5">Sold Date</th>
                  <th className="px-5 py-3.5">Customer & Mobile</th>
                  <th className="px-5 py-3.5">Product ID / Item Code</th>
                  <th className="px-5 py-3.5">Sold Value (₹)</th>
                  <th className="px-5 py-3.5">Sold By Employee</th>
                  <th className="px-5 py-3.5">Proof Photo</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">View</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0ECE1]">
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-12 text-center text-[#8A8479]">
                      <RefreshCw className="w-5 h-5 animate-spin mx-auto text-[#21845F]" />
                      <span className="block mt-2 font-semibold">Loading branch sales...</span>
                    </td>
                  </tr>
                ) : filteredSold.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-12 text-center text-[#8A8479]">
                      <p className="font-bold text-sm text-[#1D1D1B]">No sold records found for this branch.</p>
                      <p className="text-xs mt-1">When sales are marked as Sold, they appear here automatically.</p>
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
                      </td>

                      {/* Customer */}
                      <td className="px-5 py-3.5">
                        <div className="font-extrabold text-[#1D1D1B] text-sm">{item.customerName}</div>
                        {item.phone ? (
                          <div className="text-[11px] font-mono text-[#536B8A] flex items-center gap-1">
                            <Phone className="w-3 h-3 text-[#21845F]" />
                            <span>{item.phone}</span>
                          </div>
                        ) : (
                          <span className="text-[10px] text-[#8A8479] italic">No phone provided</span>
                        )}
                      </td>

                      {/* Product ID */}
                      <td className="px-5 py-3.5">
                        <span className="font-mono font-bold px-2 py-0.5 rounded-md bg-[#FAF8F3] border border-[#E4DFD4] text-[#536B8A]">
                          {item.productId || 'JEWELRY-ITEM'}
                        </span>
                      </td>

                      {/* Value */}
                      <td className="px-5 py-3.5 font-mono font-bold text-sm text-[#21845F]">
                        ₹{item.productValue.toLocaleString('en-IN')}
                      </td>

                      {/* Sold by Employee */}
                      <td className="px-5 py-3.5">
                        <div className="font-bold text-[#1D1D1B]">{item.employeeName}</div>
                        <div className="text-[10px] font-mono text-[#8A8479]">{item.employeeCode}</div>
                      </td>

                      {/* Photo Thumbnail */}
                      <td className="px-5 py-3.5">
                        {item.soldImageUrl ? (
                          <button
                            onClick={() => setViewingActivity(item.parentActivity)}
                            className="w-9 h-9 rounded-xl overflow-hidden border border-[#A7F3D0] hover:scale-105 transition-transform cursor-pointer"
                            title="Click to view photo"
                          >
                            <img src={item.soldImageUrl} alt="Sold Item" className="w-full h-full object-cover" />
                          </button>
                        ) : (
                          <span className="text-[#8A8479] text-[10px]">—</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            item.approvalStatus === 'APPROVED'
                              ? 'bg-[#E8F4EE] text-[#21845F] border border-[#C5E3D5]'
                              : 'bg-[#FEFCE8] text-[#854D0E] border border-[#FEF08A]'
                          }`}
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          <span>{item.approvalStatus}</span>
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3.5 text-right whitespace-nowrap">
                        <button
                          onClick={() => setViewingActivity(item.parentActivity)}
                          className="p-1.5 rounded-lg bg-[#FAF8F3] hover:bg-[#F2EDE4] text-[#536B8A] hover:text-[#1D1D1B] border border-[#E4DFD4] transition-colors cursor-pointer"
                          title="View Details"
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
        </div>
      )}

      {/* TAB 2: JEWELLERY SAVINGS SCHEMES TABLE */}
      {activeTab === 'SCHEMES' && (
        <div className="space-y-4">
          {/* Scheme Category Filter Pills */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-bold text-[#8A8479] uppercase tracking-wider px-1">
              Filter Scheme:
            </span>
            <button
              onClick={() => setSchemeCategory('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                schemeCategory === 'ALL'
                  ? 'bg-[#D97706] text-white shadow-2xs'
                  : 'bg-white hover:bg-[#FAF8F3] text-[#5E5A52] border border-[#E4DFD4]'
              }`}
            >
              All Schemes ({schemeEnrollments.length})
            </button>
            <button
              onClick={() => setSchemeCategory('GOLDEN DREAMS')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                schemeCategory === 'GOLDEN DREAMS'
                  ? 'bg-[#D97706] text-white shadow-2xs'
                  : 'bg-white hover:bg-[#FAF8F3] text-[#5E5A52] border border-[#E4DFD4]'
              }`}
            >
              Siri Samruddhi Golden Dreams
            </button>
            <button
              onClick={() => setSchemeCategory('AMBARI')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                schemeCategory === 'AMBARI'
                  ? 'bg-[#D97706] text-white shadow-2xs'
                  : 'bg-white hover:bg-[#FAF8F3] text-[#5E5A52] border border-[#E4DFD4]'
              }`}
            >
              Ambari Scheme
            </button>
            <button
              onClick={() => setSchemeCategory('NIDHI')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                schemeCategory === 'NIDHI'
                  ? 'bg-[#D97706] text-white shadow-2xs'
                  : 'bg-white hover:bg-[#FAF8F3] text-[#5E5A52] border border-[#E4DFD4]'
              }`}
            >
              Nidhi Scheme (10 Months)
            </button>
          </div>

          <div className="bg-white border border-[#E4DFD4] rounded-3xl overflow-hidden shadow-[0_4px_18px_rgba(40,35,25,0.045)]">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#FAF8F3] border-b border-[#EBE6DC] text-[#6B6559] uppercase font-bold text-[10px] tracking-wider">
                    <th className="px-5 py-3.5">Enrolled Date</th>
                    <th className="px-5 py-3.5">Customer & Phone</th>
                    <th className="px-5 py-3.5">Scheme Plan</th>
                    <th className="px-5 py-3.5">Monthly Installment (₹)</th>
                    <th className="px-5 py-3.5">Enrolled By Staff</th>
                    <th className="px-5 py-3.5">Price Notes / Reminder</th>
                    <th className="px-5 py-3.5 text-right">View</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0ECE1]">
                  {isLoading ? (
                    <tr>
                      <td colSpan={7} className="px-5 py-12 text-center text-[#8A8479]">
                        <RefreshCw className="w-5 h-5 animate-spin mx-auto text-[#D97706]" />
                        <span className="block mt-2 font-semibold">Loading schemes...</span>
                      </td>
                    </tr>
                  ) : filteredSchemes.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-5 py-12 text-center text-[#8A8479]">
                        <p className="font-bold text-sm text-[#1D1D1B]">No schemes found for this selection.</p>
                        <p className="text-xs mt-1">Customer savings scheme enrollments will appear here.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredSchemes.map((item) => (
                      <tr key={item.id} className="hover:bg-[#FAF9F5] transition-colors">
                        {/* Date */}
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <div className="flex items-center gap-1.5 font-bold text-[#1D1D1B]">
                            <Calendar className="w-3.5 h-3.5 text-[#D97706]" />
                            <span>{item.date}</span>
                          </div>
                        </td>

                        {/* Customer */}
                        <td className="px-5 py-3.5">
                          <div className="font-extrabold text-[#1D1D1B] text-sm">{item.customerName}</div>
                          {item.phone ? (
                            <div className="text-[11px] font-mono text-[#536B8A] flex items-center gap-1">
                              <Phone className="w-3 h-3 text-[#21845F]" />
                              <span>{item.phone}</span>
                            </div>
                          ) : (
                            <span className="text-[10px] text-[#8A8479] italic">No phone provided</span>
                          )}
                        </td>

                        {/* Scheme Name */}
                        <td className="px-5 py-3.5">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10.5px] font-extrabold bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]">
                            <Award className="w-3 h-3 text-[#D97706]" />
                            <span>{item.schemeName}</span>
                          </span>
                        </td>

                        {/* Monthly Installment */}
                        <td className="px-5 py-3.5 font-mono font-bold text-sm text-[#21845F]">
                          {item.monthlyAmount > 0 ? `₹${item.monthlyAmount.toLocaleString('en-IN')}` : '—'}
                        </td>

                        {/* Enrolled Staff */}
                        <td className="px-5 py-3.5">
                          <div className="font-bold text-[#1D1D1B]">{item.employeeName}</div>
                          <div className="text-[10px] font-mono text-[#8A8479]">{item.employeeCode}</div>
                        </td>

                        {/* Notes / Reminder */}
                        <td className="px-5 py-3.5 max-w-xs">
                          {item.priceNotes ? (
                            <p className="text-xs text-[#5E5A52]">{item.priceNotes}</p>
                          ) : item.reminderDate ? (
                            <span className="text-[10.5px] font-mono text-[#D97706]">
                              Reminder: {item.reminderDate}
                            </span>
                          ) : (
                            <span className="text-[#8A8479]">—</span>
                          )}
                        </td>

                        {/* View Action */}
                        <td className="px-5 py-3.5 text-right whitespace-nowrap">
                          <button
                            onClick={() => setViewingActivity(item.parentActivity)}
                            className="p-1.5 rounded-lg bg-[#FAF8F3] hover:bg-[#F2EDE4] text-[#536B8A] hover:text-[#1D1D1B] border border-[#E4DFD4] transition-colors cursor-pointer"
                            title="View Customer Details"
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
          </div>
        </div>
      )}

      {/* Customer View Modal */}
      <CustomerActivityViewModal
        isOpen={!!viewingActivity}
        onClose={() => setViewingActivity(null)}
        activity={viewingActivity}
      />
    </div>
  );
};

