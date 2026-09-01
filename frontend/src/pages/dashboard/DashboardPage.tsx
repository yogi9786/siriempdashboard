import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  UserPlus,
  Compass,
  ArrowRight,
  UserCheck,
  FileText,
  Star,
  Award,
  Sparkles,
  CheckCircle2,
  Clock,
  ChevronRight,
  Layers,
  RotateCcw,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  DashboardOverview,
  Employee,
  CustomerActivity,
  SchemeRecord,
  GoogleReview,
  FormMedia,
} from '../../types';
import api from '../../api/client';
import { Button } from '../../components/ui/Button';

export const DashboardPage: React.FC = () => {
  const { user, selectedBranch } = useAuth();
  const navigate = useNavigate();

  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [customerActivities, setCustomerActivities] = useState<CustomerActivity[]>([]);
  const [schemes, setSchemes] = useState<SchemeRecord[]>([]);
  const [googleReviews, setGoogleReviews] = useState<GoogleReview[]>([]);
  const [formMediaList, setFormMediaList] = useState<FormMedia[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      const [
        overviewRes,
        employeesRes,
        customersRes,
        schemesRes,
        reviewsRes,
        galleryRes,
      ] = await Promise.all([
        api.get<DashboardOverview>('/api/v1/dashboard/overview').catch(() => ({ data: null })),
        api.get<Employee[]>('/api/v1/employees').catch(() => ({ data: [] })),
        api.get<CustomerActivity[]>('/api/v1/customers').catch(() => ({ data: [] })),
        api.get<SchemeRecord[]>('/api/v1/schemes').catch(() => ({ data: [] })),
        api.get<GoogleReview[]>('/api/v1/google-reviews').catch(() => ({ data: [] })),
        api.get<FormMedia[]>('/api/v1/gallery').catch(() => ({ data: [] })),
      ]);

      if (overviewRes.data) setOverview(overviewRes.data);
      if (employeesRes.data) setEmployees(employeesRes.data);
      if (customersRes.data) setCustomerActivities(customersRes.data);
      if (schemesRes.data) setSchemes(schemesRes.data);
      if (reviewsRes.data) setGoogleReviews(reviewsRes.data);
      if (galleryRes.data) setFormMediaList(galleryRes.data);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const totalEmployees = overview?.total_employees ?? employees.length ?? 0;
  const activeEmployees = overview?.active_employees ?? employees.filter((e) => e.status === 'active').length ?? 0;
  const outdoorEmployees =
    overview?.outdoor_marketing_employees ??
    employees.filter((e) => e.is_outdoor_marketing_employee || e.department === 'Outdoor Marketing').length;

  const getClosedCount = (act: CustomerActivity): number => {
    if (act.breakdown) {
      const parts = act.breakdown.split('|');
      const closedInBreakdown = parts.filter(
        (p) => p.toLowerCase().includes(': closed') || p.trim().toLowerCase() === 'closed'
      ).length;
      if (closedInBreakdown > 0) return closedInBreakdown;
    }
    return act.status === 'Closed' ? (act.customers_count || 1) : 0;
  };

  const totalCustomersAttended = customerActivities.reduce((sum, c) => sum + (c.customers_count || 1), 0);
  const totalCustomersClosed = customerActivities.reduce((sum, c) => sum + getClosedCount(c), 0);
  const totalFollowUps = customerActivities.reduce((sum, c) => {
    if (c.breakdown) {
      const parts = c.breakdown.split('|');
      const fuCount = parts.filter(
        (p) => p.toLowerCase().includes('follow up') || p.toLowerCase().includes('follow-up')
      ).length;
      if (fuCount > 0) return sum + fuCount;
    }
    return sum + (c.status === 'Follow-up' || c.status === 'Follow Up Needed' ? (c.customers_count || 1) : 0);
  }, 0);
  const totalSchemesClosed = schemes.reduce((sum, s) => sum + (s.customers_count || 1), 0);
  const totalSchemesAmount = schemes.reduce((sum, s) => sum + (s.amount || 0), 0);
  const totalReviewsCount = googleReviews.reduce((sum, r) => sum + (r.customers_count || 1), 0);
  const avgRating =
    googleReviews.length > 0
      ? googleReviews.reduce((sum, r) => sum + r.rating, 0) / googleReviews.length
      : 5.0;
  const totalFormMediaCount = formMediaList.length;

  const conversionPercentage =
    totalCustomersAttended > 0
      ? Math.round((totalCustomersClosed / totalCustomersAttended) * 100)
      : 100;

  const todayFormatted = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  const rawBranch = selectedBranch?.name || user?.branch_name || 'Yelahanka';
  const branchDisplayName = rawBranch.toLowerCase().includes('branch')
    ? rawBranch
    : `${rawBranch} Branch`;

  // 7-day sparkline bar heights
  const sparklineDays = [
    { day: 'Mon', height: '40%' },
    { day: 'Tue', height: '55%' },
    { day: 'Wed', height: '70%' },
    { day: 'Thu', height: '60%' },
    { day: 'Fri', height: '85%' },
    { day: 'Sat', height: '100%' },
    { day: 'Sun', height: '90%' },
  ];

  return (
    <div className="space-y-7 pb-16">
      {/* -------------------------------------------------------------
          1. DASHBOARD LUXURY HERO SECTION (LIGHT CANVAS WITH PURPLE BORDER & DESIGN ACCENTS)
      ------------------------------------------------------------- */}
      <div className="relative bg-linear-to-br from-[#FAF8F3] via-white to-[#FAF5FF] border border-[#D8B4FE] rounded-3xl p-6 sm:p-8 sm:py-9 shadow-xs overflow-hidden group text-[#1D1D1B]">
        {/* Top Purple Shimmer Border Line */}
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-linear-to-r from-transparent via-[#9333EA] to-transparent opacity-60 animate-pulse" />

        {/* Corner Filigree Luxury Brackets in Purple */}
        <div className="absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2 border-[#7E22CE]/40 rounded-tl-sm pointer-events-none" />
        <div className="absolute top-3 right-3 w-4 h-4 border-t-2 border-r-2 border-[#7E22CE]/40 rounded-tr-sm pointer-events-none" />
        <div className="absolute bottom-3 left-3 w-4 h-4 border-b-2 border-l-2 border-[#7E22CE]/40 rounded-bl-sm pointer-events-none" />
        <div className="absolute bottom-3 right-3 w-4 h-4 border-b-2 border-r-2 border-[#7E22CE]/40 rounded-br-sm pointer-events-none" />

        {/* Geometric Diamond Lattice SVG Pattern in Purple */}
        <div className="absolute -top-12 -right-12 w-96 h-96 pointer-events-none opacity-[0.06] select-none text-[#7E22CE]">
          <svg viewBox="0 0 200 200" className="w-full h-full" fill="none" stroke="currentColor">
            <circle cx="100" cy="100" r="90" strokeWidth="0.75" strokeDasharray="3 3" />
            <circle cx="100" cy="100" r="75" strokeWidth="0.75" />
            <circle cx="100" cy="100" r="60" strokeWidth="0.75" strokeDasharray="2 2" />
            <circle cx="100" cy="100" r="45" strokeWidth="1" />
            <circle cx="100" cy="100" r="30" strokeWidth="0.75" />
            <polygon points="100,10 190,100 100,190 10,100" strokeWidth="0.75" />
            <polygon points="100,25 175,100 100,175 25,100" strokeWidth="0.75" strokeDasharray="4 4" />
            <polygon points="100,40 160,100 100,160 40,100" strokeWidth="0.75" />
          </svg>
        </div>

        {/* Ambient Subtle Purple Radial Glow */}
        <div className="absolute top-0 right-1/4 w-72 h-72 bg-linear-to-br from-[#9333EA]/10 via-[#F3E8FF]/20 to-transparent rounded-full blur-3xl pointer-events-none" />

        {/* Floating Luxury Sparkles in Purple */}
        <div className="absolute top-6 right-1/3 text-[#7E22CE]/40 animate-float-slow pointer-events-none text-base">
          ✦
        </div>
        <div className="absolute bottom-6 right-16 text-[#9333EA]/30 animate-float-reverse pointer-events-none text-xs">
          ◇
        </div>

        {/* Hero Content */}
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            {/* Showroom Branch Badge & Date */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="text-xs font-bold text-[#1D1D1B] px-3.5 py-1.5 rounded-full bg-white border border-[#D8B4FE] flex items-center gap-2 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-[#7E22CE] animate-pulse" />
                <span>{branchDisplayName}</span>
              </span>

              <span className="text-xs font-semibold text-[#5E5A52] flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-full border border-[#D8B4FE] shadow-2xs">
                <Clock className="w-3.5 h-3.5 text-[#7E22CE]" />
                <span>{todayFormatted}</span>
              </span>
            </div>

            {/* Welcome Title */}
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1D1D1B] tracking-tight">
                Welcome back, <span className="text-[#7E22CE] font-extrabold">{user?.full_name || 'ADARSHA'}</span>
              </h1>
              <p className="text-xs sm:text-sm text-[#5E5A52] font-medium mt-1">
                Showroom Operations & Luxury Jewellery Management Command Center for <span className="font-bold text-[#3B0764] underline decoration-[#7E22CE]/40 underline-offset-2">{branchDisplayName}</span>
              </p>
            </div>
          </div>

          {/* Quick Hero Actions */}
          <div className="flex items-center gap-3 self-start md:self-auto shrink-0 flex-wrap">
            <button
              onClick={fetchDashboardData}
              title="Refresh all dashboard statistics and latest metrics"
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white hover:bg-[#FAF5FF] text-[#3B0764] text-xs font-bold border border-[#D8B4FE] shadow-2xs transition-all cursor-pointer"
            >
              <RotateCcw className={`w-4 h-4 text-[#7E22CE] ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>

            <button
              onClick={() => navigate('/employees')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-[#FAF5FF] text-[#3B0764] text-xs font-bold border border-[#D8B4FE] shadow-2xs transition-all cursor-pointer"
            >
              <Users className="w-4 h-4 text-[#7E22CE]" />
              <span>Staff Roster ({totalEmployees})</span>
            </button>

            <button
              onClick={() => navigate('/employees/add')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#7E22CE] hover:bg-[#6B21A8] text-white text-xs font-bold shadow-sm transition-all cursor-pointer hover:scale-[1.02]"
            >
              <UserPlus className="w-4 h-4 text-white" />
              <span>+ Add Employee</span>
            </button>
          </div>
        </div>
      </div>

      {/* -------------------------------------------------------------
          2. 4 METRIC CARDS (WITH PURPLE & LAVENDER ACCENTS)
      ------------------------------------------------------------- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Card 1: Showroom Staff (Purple/Lavender Accent #7E22CE) */}
        <div
          onClick={() => navigate('/employees')}
          className="bg-white border border-[#E4DFD4] hover:border-[#C084FC] rounded-2xl p-5 sm:p-6 shadow-[0_4px_18px_rgba(40,35,25,0.045)] hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group flex flex-col justify-between"
        >
          <div>
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-bold text-[#8A8479] uppercase tracking-wider block mb-1">
                  Showroom Staff
                </span>
                <div className="text-3xl font-bold text-[#1D1D1B] tracking-tight">
                  {totalEmployees}
                </div>
                <span className="text-xs text-[#8A8479] font-medium mt-0.5 block">Staff Members</span>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-[#F3E8FF] border border-[#D8B4FE] text-[#7E22CE] flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                <Users className="w-5 h-5 text-[#7E22CE]" />
              </div>
            </div>

            {/* Mini Visual: Active Staff Ratio */}
            <div className="mt-4 pt-3 border-t border-[#EBE6DC] space-y-1.5">
              <div className="flex justify-between text-[11px] font-semibold text-[#8A8479]">
                <span className="flex items-center gap-1.5 text-[#7E22CE]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#7E22CE]" />
                  {activeEmployees} Active on Floor
                </span>
                <span className="text-[#1D1D1B] font-bold">
                  {totalEmployees > 0 ? Math.round((activeEmployees / totalEmployees) * 100) : 100}%
                </span>
              </div>
              <div className="w-full h-1.5 bg-[#F3E8FF] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#7E22CE] rounded-full"
                  style={{ width: `${totalEmployees > 0 ? (activeEmployees / totalEmployees) * 100 : 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Customer Footfall (Muted Slate Blue Accent #526F91) */}
        <div
          onClick={() => navigate('/employees')}
          className="bg-white border border-[#E4DFD4] hover:border-[#C6D4E3] rounded-2xl p-5 sm:p-6 shadow-[0_4px_18px_rgba(40,35,25,0.045)] hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group flex flex-col justify-between"
        >
          <div>
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-bold text-[#8A8479] uppercase tracking-wider block mb-1">
                  Customer Footfall
                </span>
                <div className="text-3xl font-bold text-[#1D1D1B] tracking-tight">
                  {totalCustomersAttended}
                </div>
                <span className="text-xs text-[#8A8479] font-medium mt-0.5 block">Walk-ins Logged</span>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-[#EDF2F8] border border-[#C6D4E3] text-[#526F91] flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                <UserCheck className="w-5 h-5" />
              </div>
            </div>

            {/* Mini Visual: 7-Day Sparkline Visualization */}
            <div className="mt-4 pt-3 border-t border-[#EBE6DC]">
              <div className="flex items-end justify-between gap-1 h-7 pt-1 px-1">
                {sparklineDays.map((item) => (
                  <div key={item.day} className="flex-1 flex flex-col items-center gap-1 group/bar">
                    <div className="w-full bg-[#EDF2F8] rounded-xs overflow-hidden h-5 flex items-end">
                      <div
                        className="w-full bg-[#526F91] rounded-xs transition-all duration-300 group-hover/bar:bg-[#1D1D1B]"
                        style={{ height: item.height }}
                      />
                    </div>
                    <span className="text-[8px] text-[#8A8479] font-semibold leading-none">{item.day}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Schemes Closed (Purple & Gold Accent #7E22CE) */}
        <div
          onClick={() => navigate('/employees')}
          className="bg-white border border-[#E4DFD4] hover:border-[#C084FC] rounded-2xl p-5 sm:p-6 shadow-[0_4px_18px_rgba(40,35,25,0.045)] hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group flex flex-col justify-between"
        >
          <div>
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-bold text-[#8A8479] uppercase tracking-wider block mb-1">
                  Schemes Closed
                </span>
                <div className="text-3xl font-bold text-[#1D1D1B] tracking-tight">
                  {totalSchemesClosed}
                </div>
                <span className="text-xs text-[#8A8479] font-medium mt-0.5 block">Gold Savings Plans</span>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-[#F3E8FF] border border-[#D8B4FE] text-[#7E22CE] flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                <Award className="w-5 h-5 text-[#7E22CE]" />
              </div>
            </div>

            {/* Mini Visual: Value & Target Progress */}
            <div className="mt-4 pt-3 border-t border-[#EBE6DC] space-y-1.5">
              <div className="flex justify-between text-[11px] font-bold">
                <span className="text-[#7E22CE]">₹{totalSchemesAmount.toLocaleString('en-IN')} Total</span>
                <span className="text-[#8A8479] font-semibold text-[10px]">Monthly Goal</span>
              </div>
              <div className="w-full h-1.5 bg-[#F3E8FF] rounded-full overflow-hidden">
                <div
                  className="h-full bg-linear-to-r from-[#9333EA] to-[#7E22CE] rounded-full"
                  style={{ width: `${Math.min(100, Math.max(25, totalSchemesClosed * 15))}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Card 4: Showroom Rating (Warm Terracotta Accent #B97855) */}
        <div
          onClick={() => navigate('/google-reviews')}
          className="bg-white border border-[#E4DFD4] hover:border-[#ECCFC0] rounded-2xl p-5 sm:p-6 shadow-[0_4px_18px_rgba(40,35,25,0.045)] hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group flex flex-col justify-between"
        >
          <div>
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-bold text-[#8A8479] uppercase tracking-wider block mb-1">
                  Showroom Rating
                </span>
                <div className="text-3xl font-bold text-[#1D1D1B] tracking-tight flex items-center gap-1.5">
                  <span>{avgRating.toFixed(1)}</span>
                  <span className="text-sm font-semibold text-[#8A8479]">/ 5.0</span>
                </div>
                <span className="text-xs text-[#8A8479] font-medium mt-0.5 block">Customer Feedback</span>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-[#FAF1EC] border border-[#ECCFC0] text-[#B97855] flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                <Star className="w-5 h-5 fill-[#B97855]" />
              </div>
            </div>

            {/* Mini Visual: 5 Star Rating Display */}
            <div className="mt-4 pt-3 border-t border-[#EBE6DC] flex items-center justify-between">
              <div className="flex items-center gap-0.5 text-[#B8943D]">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-[#B8943D]" />
                ))}
              </div>
              <span className="text-[11px] font-bold text-[#21845F] bg-[#E8F4EE] px-2.5 py-0.5 rounded-full border border-[#C5E3D5]">
                {totalReviewsCount} Verified
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* -------------------------------------------------------------
          3. MIDDLE SECTION: CUSTOMER PIPELINE (2 COLS) + ONE DARK PREMIUM CARD (1 COL)
      ------------------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5 items-stretch">
        {/* Left 2 Cols: Customer Activity Pipeline (White Card) */}
        <div className="lg:col-span-2 bg-white border border-[#E4DFD4] rounded-3xl p-5 sm:p-6 shadow-[0_4px_18px_rgba(40,35,25,0.045)] flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-[#1D1D1B] tracking-tight">
                  Customer Engagement Pipeline
                </h3>
                <p className="text-xs text-[#8A8479] font-medium mt-0.5">
                  Live showroom walk-in conversion & field customer inquiry stages
                </p>
              </div>
              <button
                onClick={() => navigate('/employees')}
                className="text-xs font-bold text-[#7E22CE] hover:text-[#581C87] flex items-center gap-1 cursor-pointer transition-colors"
              >
                <span>Full Logs</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Pipeline Stage Funnel with Compact Gaps: Lavender/Purple -> Muted Plum -> Sage Green */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* Stage 1: Interest (Purple & Lavender #7E22CE) */}
              <div className="p-3.5 rounded-2xl bg-[#F3E8FF] border border-[#D8B4FE] space-y-1">
                <div className="flex items-center justify-between text-xs font-bold text-[#7E22CE]">
                  <span>1. Initial Inquiries</span>
                  <span className="w-2 h-2 rounded-full bg-[#7E22CE]" />
                </div>
                <div className="text-2xl font-bold text-[#1D1D1B] leading-none pt-0.5">{totalCustomersAttended}</div>
                <span className="text-[11px] text-[#8A8479] block">Registered Walk-ins</span>
              </div>

              {/* Stage 2: Qualified (Muted Plum #765568) */}
              <div className="p-3.5 rounded-2xl bg-[#F5EDF1] border border-[#E8D5D2] space-y-1">
                <div className="flex items-center justify-between text-xs font-bold text-[#765568]">
                  <span>2. In Follow-up</span>
                  <span className="w-2 h-2 rounded-full bg-[#765568]" />
                </div>
                <div className="text-2xl font-bold text-[#1D1D1B] leading-none pt-0.5">{totalFollowUps}</div>
                <span className="text-[11px] text-[#8A8479] block">Active Follow-ups</span>
              </div>

              {/* Stage 3: Converted (Sage Green #21845F) */}
              <div className="p-3.5 rounded-2xl bg-[#E8F4EE] border border-[#C5E3D5] space-y-1">
                <div className="flex items-center justify-between text-xs font-bold text-[#21845F]">
                  <span>3. Closed Sales</span>
                  <span className="w-2 h-2 rounded-full bg-[#21845F]" />
                </div>
                <div className="text-2xl font-bold text-[#21845F] leading-none pt-0.5">{totalCustomersClosed}</div>
                <span className="text-[11px] text-[#21845F] font-semibold block">
                  {conversionPercentage}% Conversion
                </span>
              </div>
            </div>
          </div>

          {/* Quick Metrics Bar - Compact Height & Clean Margin */}
          <div className="grid grid-cols-3 gap-2.5 pt-3 mt-3 border-t border-[#EBE6DC]">
            <div className="py-2 px-3 bg-[#FAF8F3] border border-[#E4DFD4] rounded-xl text-center">
              <span className="text-[10px] font-bold text-[#8A8479] uppercase block">Follow-ups</span>
              <span className="text-sm font-bold text-[#1D1D1B]">{totalFollowUps}</span>
            </div>
            <div className="py-2 px-3 bg-[#F3E8FF] border border-[#D8B4FE] rounded-xl text-center">
              <span className="text-[10px] font-bold text-[#7E22CE] uppercase block">Gold Plans</span>
              <span className="text-sm font-bold text-[#7E22CE]">{totalSchemesClosed}</span>
            </div>
            <div className="py-2 px-3 bg-[#FAF8F3] border border-[#E4DFD4] rounded-xl text-center">
              <span className="text-[10px] font-bold text-[#8A8479] uppercase block">Daily Sheets</span>
              <span className="text-sm font-bold text-[#1D1D1B]">{totalFormMediaCount}</span>
            </div>
          </div>
        </div>

        {/* Right 1 Col: ONE DARK PREMIUM FEATURE CARD (#1D1D1B) */}
        <div className="bg-[#1D1D1B] border border-[#3A3A38] rounded-3xl p-5 sm:p-6 shadow-md text-white flex flex-col justify-between space-y-3.5 relative overflow-hidden">
          {/* Subtle Purple Ambient Corner Accent */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-linear-to-bl from-[#9333EA]/15 to-transparent rounded-bl-full pointer-events-none" />

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#D8B4FE] flex items-center gap-1.5 bg-[#2E1065] px-2.5 py-0.5 rounded-full border border-[#581C87]">
                <Sparkles className="w-3 h-3 text-[#C084FC]" />
                <span>Showroom Command</span>
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Status
              </span>
            </div>

            <h3 className="text-lg font-bold text-white tracking-tight">
              Operational Performance
            </h3>
            <p className="text-xs text-[#B5B0A7] font-medium mt-0.5 leading-relaxed">
              Showroom metrics show high customer conversion and active staff discipline.
            </p>
          </div>

          <div className="space-y-2 py-0.5">
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-bold shrink-0">
                  <CheckCircle2 className="w-3 h-3" />
                </div>
                <span className="text-xs font-semibold text-white/90">Staff Attendance</span>
              </div>
              <span className="text-xs font-bold text-emerald-300">{activeEmployees} / {totalEmployees} Present</span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-purple-500/20 text-[#D8B4FE] flex items-center justify-center font-bold shrink-0">
                  <Award className="w-3 h-3 text-[#C084FC]" />
                </div>
                <span className="text-xs font-semibold text-white/90">Gold Schemes Enrolled</span>
              </div>
              <span className="text-xs font-bold text-[#D8B4FE]">{totalSchemesClosed} Plans</span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-bold shrink-0">
                  <Star className="w-3 h-3 fill-emerald-300" />
                </div>
                <span className="text-xs font-semibold text-white/90">Customer Satisfaction</span>
              </div>
              <span className="text-xs font-bold text-emerald-300">100% 5-Star</span>
            </div>
          </div>

          <button
            onClick={() => navigate('/employees')}
            className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl bg-white hover:bg-[#FAF5FF] text-[#3B0764] text-xs font-bold shadow-sm transition-all cursor-pointer hover:scale-[1.01]"
          >
            <span>View Showroom Directory</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#7E22CE]" />
          </button>
        </div>
      </div>

      {/* -------------------------------------------------------------
          4. MANAGEMENT HUB COMMAND ACTION TILES
      ------------------------------------------------------------- */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-[#1C1C1A] tracking-tight">
              Showroom Management Command Tiles
            </h2>
            <p className="text-xs text-[#8A857A] font-medium">
              Direct access to all showroom administrative and operational modules
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Tile 1: Staff Directory (Purple & Lavender Theme) */}
          <div
            onClick={() => navigate('/employees')}
            className="p-5 rounded-2xl bg-white border border-[#E4DFD4] hover:border-[#C084FC] hover:bg-[#FAF5FF] hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group flex flex-col justify-between space-y-4 shadow-[0_4px_18px_rgba(40,35,25,0.045)]"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-[#F3E8FF] border border-[#D8B4FE] text-[#7E22CE] flex items-center justify-center font-bold shadow-2xs group-hover:scale-105 transition-transform">
                <Users className="w-5 h-5" />
              </div>
              <ChevronRight className="w-4 h-4 text-[#8A8479] group-hover:translate-x-1 group-hover:text-[#7E22CE] transition-all" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#1D1D1B] group-hover:text-[#7E22CE] transition-colors">
                Staff Directory
              </h3>
              <p className="text-xs text-[#8A8479] font-medium mt-0.5">
                Manage {totalEmployees} showroom staff profiles and rosters
              </p>
            </div>
          </div>

          {/* Tile 2: Outdoor Marketing (Emerald Sage Theme) */}
          <div
            onClick={() => navigate('/outdoor-marketing')}
            className="p-5 rounded-2xl bg-white border border-[#E4DFD4] hover:border-[#21845F] hover:bg-[#E8F4EE]/40 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group flex flex-col justify-between space-y-4 shadow-[0_4px_18px_rgba(40,35,25,0.045)]"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-[#E8F4EE] border border-[#C5E3D5] text-[#21845F] flex items-center justify-center font-bold shadow-2xs group-hover:scale-105 transition-transform">
                <Compass className="w-5 h-5" />
              </div>
              <ChevronRight className="w-4 h-4 text-[#8A8479] group-hover:translate-x-1 group-hover:text-[#21845F] transition-all" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#1D1D1B] group-hover:text-[#21845F] transition-colors">
                Outdoor Campaigns
              </h3>
              <p className="text-xs text-[#8A8479] font-medium mt-0.5">
                {outdoorEmployees} Field staff, campaign zones & leads
              </p>
            </div>
          </div>

          {/* Tile 3: Daily Closing & Forms (Warm Terracotta Theme) */}
          <div
            onClick={() => navigate('/gallery')}
            className="p-5 rounded-2xl bg-white border border-[#E4DFD4] hover:border-[#B97855] hover:bg-[#FAF1EC]/40 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group flex flex-col justify-between space-y-4 shadow-[0_4px_18px_rgba(40,35,25,0.045)]"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-[#FAF1EC] border border-[#ECCFC0] text-[#B97855] flex items-center justify-center font-bold shadow-2xs group-hover:scale-105 transition-transform">
                <FileText className="w-5 h-5" />
              </div>
              <ChevronRight className="w-4 h-4 text-[#8A8479] group-hover:translate-x-1 group-hover:text-[#B97855] transition-all" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#1D1D1B] group-hover:text-[#B97855] transition-colors">
                Daily Closing Forms
              </h3>
              <p className="text-xs text-[#8A8479] font-medium mt-0.5">
                {totalFormMediaCount} Camera snapshots and closing sheets
              </p>
            </div>
          </div>

          {/* Tile 4: Google Reviews (Muted Plum Theme) */}
          <div
            onClick={() => navigate('/google-reviews')}
            className="p-5 rounded-2xl bg-white border border-[#E4DFD4] hover:border-[#765568] hover:bg-[#F5EDF1]/40 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group flex flex-col justify-between space-y-4 shadow-[0_4px_18px_rgba(40,35,25,0.045)]"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-[#F5EDF1] border border-[#E8D5D2] text-[#765568] flex items-center justify-center font-bold shadow-2xs group-hover:scale-105 transition-transform">
                <Star className="w-5 h-5 fill-[#765568]" />
              </div>
              <ChevronRight className="w-4 h-4 text-[#8A8479] group-hover:translate-x-1 group-hover:text-[#765568] transition-all" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#1D1D1B] group-hover:text-[#765568] transition-colors">
                Google Reviews
              </h3>
              <p className="text-xs text-[#8A8479] font-medium mt-0.5">
                {totalReviewsCount} Customer 5-star testimonials
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* -------------------------------------------------------------
          5. RECENT ACTIVITY TIMELINE & ACTIVE STAFF ROSTER
      ------------------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Showroom Staff Roster Snapshot (2 Cols) */}
        <div className="lg:col-span-2 bg-white border border-[#E4DFD4] rounded-3xl p-6 sm:p-7 shadow-[0_4px_18px_rgba(40,35,25,0.045)] space-y-4">
          <div className="flex items-center justify-between border-b border-[#EBE6DC] pb-4">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[#1D1D1B] tracking-tight">
                Active Showroom Staff Roster
              </h2>
              <p className="text-xs text-[#8A8479] font-medium mt-0.5">
                Assigned floor staff and field representatives for {selectedBranch?.name || 'Showroom'}
              </p>
            </div>
            <button
              onClick={() => navigate('/employees')}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white hover:bg-[#FAF5FF] border border-[#D8B4FE] text-[#7E22CE] text-xs font-bold shadow-2xs transition-all cursor-pointer"
            >
              <span>Full Directory</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#FAF8F3] border-b border-[#E4DFD4] text-[#5E5A52] uppercase tracking-wider font-bold text-[11px]">
                <tr>
                  <th className="px-4 py-3 w-12 text-center text-[#8A8479]">#</th>
                  <th className="px-4 py-3">Employee Name</th>
                  <th className="px-4 py-3">Badge Code</th>
                  <th className="px-4 py-3">Designation</th>
                  <th className="px-4 py-3">Department</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EBE6DC] font-medium">
                {employees.slice(0, 6).map((emp, index) => {
                  const isOutdoor = emp.department === 'Outdoor Marketing' || emp.is_outdoor_marketing_employee;
                  return (
                    <tr
                      key={emp.id}
                      onClick={() => navigate(`/employees/${emp.id}`)}
                      className="hover:bg-[#FAF5FF] transition-colors cursor-pointer group"
                    >
                      <td className="px-4 py-3 text-center text-[#8A8479] font-mono">
                        {index + 1}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-[#F3E8FF] border border-[#D8B4FE] text-[#7E22CE] flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                            {emp.profile_photo_url ? (
                              <img
                                src={emp.profile_photo_url}
                                alt={emp.full_name}
                                className="w-full h-full object-cover rounded-xl"
                              />
                            ) : (
                              emp.full_name.charAt(0)
                            )}
                          </div>
                          <div>
                            <span className="font-bold text-[#1D1D1B] group-hover:text-[#7E22CE] transition-colors block">
                              {emp.full_name}
                            </span>
                            <span className="text-[10px] text-[#8A8479] block">{emp.designation}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-[#8A8479] whitespace-nowrap">
                        <span className="px-1.5 sm:px-2 py-0.5 rounded-md bg-[#FAF8F3] border border-[#E4DFD4] text-[#1D1D1B] font-semibold text-[10px] sm:text-xs whitespace-nowrap inline-flex items-center shrink-0">
                          {emp.employee_code}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[#5E5A52] font-medium">
                        {emp.designation || (isOutdoor ? 'Field Marketing Executive' : 'Sales Executive')}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[#5E5A52]">{emp.department || 'Sales Department'}</span>
                          {isOutdoor && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#EDF2F8] text-[#526F91] border border-[#C6D4E3] text-[10px] font-bold">
                              <Compass className="w-2.5 h-2.5 text-[#526F91]" />
                              <span>Outdoor</span>
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-xs font-bold text-[#7E22CE] group-hover:underline">
                          View Profile →
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Live Operational Timeline (1 Col) */}
        <div className="bg-white border border-[#E4DFD4] rounded-3xl p-6 sm:p-7 shadow-[0_4px_18px_rgba(40,35,25,0.045)] space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-[#EBE6DC] pb-3 mb-4">
              <h2 className="text-base font-bold text-[#1D1D1B] tracking-tight">
                Live Showroom Activity
              </h2>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-[#F3E8FF] text-[#7E22CE] border border-[#D8B4FE] font-bold">
                Live Feed
              </span>
            </div>

            <div className="space-y-4 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#D8B4FE]">
              {(() => {
                const feedItems = [
                  ...customerActivities.map((act) => {
                    const count = act.customers_count || 1;
                    const t = act.created_at ? new Date(act.created_at).getTime() : new Date(act.activity_date).getTime();
                    return {
                      id: `act-${act.id}`,
                      title: `Customer Activity (${count} Cust)`,
                      subtitle: act.breakdown || `${count} Customer${count > 1 ? 's' : ''} attended (${act.status})`,
                      date: act.activity_date,
                      timestamp: t,
                      color: '#7E22CE',
                    };
                  }),
                  ...schemes.map((sch) => {
                    const count = sch.customers_count || 1;
                    const t = sch.created_at ? new Date(sch.created_at).getTime() : new Date(sch.record_date).getTime();
                    return {
                      id: `sch-${sch.id}`,
                      title: `Gold Scheme (${count} Enrolled)`,
                      subtitle: `${sch.scheme_name} (₹${(sch.amount || 0).toLocaleString('en-IN')})`,
                      date: sch.record_date,
                      timestamp: t,
                      color: '#21845F',
                    };
                  }),
                  ...googleReviews.map((rev) => {
                    const count = rev.customers_count || 1;
                    const t = rev.created_at ? new Date(rev.created_at).getTime() : new Date(rev.review_date).getTime();
                    return {
                      id: `rev-${rev.id}`,
                      title: `${rev.rating}★ Review (${count} Cust)`,
                      subtitle: rev.review_text ? `"${rev.review_text.substring(0, 38)}..."` : '5-Star Google Review',
                      date: rev.review_date,
                      timestamp: t,
                      color: '#B97855',
                    };
                  }),
                  ...formMediaList.map((form) => {
                    const t = form.created_at ? new Date(form.created_at).getTime() : 0;
                    return {
                      id: `form-${form.id}`,
                      title: 'Closing Form Uploaded',
                      subtitle: `${form.form_type || 'Store Form'} verified`,
                      date: form.created_at ? new Date(form.created_at).toISOString().split('T')[0] : 'Today',
                      timestamp: t,
                      color: '#526F91',
                    };
                  }),
                ]
                  .sort((a, b) => b.timestamp - a.timestamp)
                  .slice(0, 5);

                if (feedItems.length === 0) {
                  return (
                    <p className="text-xs text-[#8A8479] italic pl-6 py-2">No showroom activities logged yet.</p>
                  );
                }

                return feedItems.map((item) => (
                  <div key={item.id} className="flex items-start gap-3 relative pl-6">
                    <div
                      className="absolute left-1.5 top-1 w-3 h-3 rounded-full border-2 border-white shadow-2xs"
                      style={{ backgroundColor: item.color }}
                    />
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-[#1D1D1B]">{item.title}</p>
                      <p className="text-[11px] text-[#5E5A52] line-clamp-2">{item.subtitle}</p>
                      <span className="text-[10px] text-[#8A8479] font-medium">{item.date}</span>
                    </div>
                  </div>
                ));
              })()}
            </div>
          </div>

          <button
            onClick={() => navigate('/employees')}
            className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-[#FAF5FF] border border-[#D8B4FE] text-[#7E22CE] text-xs font-bold shadow-2xs transition-all cursor-pointer mt-4"
          >
            <span>View Showroom Directory</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
