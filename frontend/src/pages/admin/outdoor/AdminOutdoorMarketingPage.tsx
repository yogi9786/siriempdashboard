import React, { useEffect, useState } from 'react';
import {
  Compass,
  Search,
  Filter,
  Building2,
  Users,
  MapPin,
  Calendar,
  CheckCircle2,
  TrendingUp,
} from 'lucide-react';
import { OutdoorMarketingActivity, OutdoorMarketingLead } from '../../../types';
import { AdminKPICard } from '../../../components/admin/ui/AdminKPICard';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { EmptyState } from '../../../components/ui/EmptyState';
import { useAdminBranch } from '../../../context/AdminBranchContext';
import { useToast } from '../../../context/ToastContext';
import api from '../../../api/client';

export const AdminOutdoorMarketingPage: React.FC = () => {
  const { branches, selectedBranchId } = useAdminBranch();
  const { error: toastError } = useToast();

  const [activities, setActivities] = useState<OutdoorMarketingActivity[]>([]);
  const [leads, setLeads] = useState<OutdoorMarketingLead[]>([]);
  const [overview, setOverview] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'activities' | 'leads'>('activities');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [branchFilter, setBranchFilter] = useState<string>(selectedBranchId?.toString() || 'all');

  const fetchOutdoorData = async () => {
    try {
      setIsLoading(true);
      const params: Record<string, any> = {};
      if (branchFilter !== 'all') params.branch_id = parseInt(branchFilter);

      const [actRes, leadRes] = await Promise.all([
        api.get<OutdoorMarketingActivity[]>('/api/v1/admin/outdoor/activities', { params }),
        api.get<OutdoorMarketingLead[]>('/api/v1/admin/outdoor/leads', { params }),
      ]);

      setActivities(actRes.data || []);
      setLeads(leadRes.data || []);
    } catch (err) {
      console.error('Failed to load outdoor marketing data:', err);
      toastError('Failed to fetch outdoor marketing records.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOutdoorData();
  }, [branchFilter]);

  const totalGenerated = activities.reduce((acc, a) => acc + (a.customers_generated || 0), 0);
  const totalClosed = activities.reduce((acc, a) => acc + (a.customers_closed || 0), 0);
  const conversionRate = totalGenerated > 0 ? Math.round((totalClosed / totalGenerated) * 100) : 0;

  return (
    <div className="space-y-7 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#EBE6DC] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#21845F] bg-[#E8F4EE] px-2.5 py-1 rounded-full border border-[#C5E3D5]">
              Field Drives & Outreach
            </span>
            <span className="text-xs text-[#8A8479] font-medium">{activities.length} Outreach Campaigns</span>
          </div>
          <h1 className="text-2xl font-extrabold text-[#1D1D1B] tracking-tight mt-1">
            Outdoor Marketing & Field Intelligence
          </h1>
          <p className="text-xs text-[#8A8479] font-medium mt-0.5">
            Territory campaigns, gold scheme field drives, and lead conversions across all branches
          </p>
        </div>
      </div>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminKPICard
          title="Campaign Drives"
          value={activities.length}
          subtitle="Outreach Field Sessions"
          icon={<Compass className="w-5 h-5 text-[#21845F]" />}
          iconBgColor="bg-[#E8F4EE] border-[#C5E3D5] text-[#21845F]"
        />

        <AdminKPICard
          title="Field Leads Generated"
          value={totalGenerated}
          subtitle="Territory Inquiries"
          icon={<Users className="w-5 h-5 text-[#7E22CE]" />}
          iconBgColor="bg-[#F3E8FF] border-[#D8B4FE] text-[#7E22CE]"
        />

        <AdminKPICard
          title="Field Deals Closed"
          value={totalClosed}
          subtitle="Enrolled Scheme Subscribers"
          icon={<CheckCircle2 className="w-5 h-5 text-[#21845F]" />}
          iconBgColor="bg-[#E8F4EE] border-[#C5E3D5] text-[#21845F]"
        />

        <AdminKPICard
          title="Field Conversion Rate"
          value={`${conversionRate}%`}
          subtitle="Campaign Effectiveness"
          icon={<TrendingUp className="w-5 h-5 text-[#526F91]" />}
          iconBgColor="bg-[#EDF2F8] border-[#C6D4E3] text-[#526F91]"
        />
      </div>

      {/* Filter Bar */}
      <div className="p-4 bg-white border border-[#E4DFD4] rounded-2xl shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Tab Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('activities')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'activities'
                ? 'bg-[#7E22CE] text-white shadow-2xs'
                : 'bg-[#FAF8F3] text-[#5E5A52] hover:text-[#1D1D1B]'
            }`}
          >
            Campaign Activities ({activities.length})
          </button>
          <button
            onClick={() => setActiveTab('leads')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'leads'
                ? 'bg-[#7E22CE] text-white shadow-2xs'
                : 'bg-[#FAF8F3] text-[#5E5A52] hover:text-[#1D1D1B]'
            }`}
          >
            Customer Leads ({leads.length})
          </button>
        </div>

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
      </div>

      {/* Content Table */}
      <div className="bg-white border border-[#E4DFD4] rounded-3xl p-6 shadow-[0_4px_18px_rgba(40,35,25,0.045)]">
        {isLoading ? (
          <LoadingSpinner message="Loading outdoor marketing records..." />
        ) : activeTab === 'activities' ? (
          activities.length === 0 ? (
            <EmptyState
              title="No campaign activities"
              description="No outdoor marketing campaigns found."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#FAF8F3] border-b border-[#E4DFD4] text-[#5E5A52] uppercase font-bold text-[11px]">
                  <tr>
                    <th className="px-4 py-3">Area / Territory</th>
                    <th className="px-4 py-3">Staff Specialist</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Schemes Promoted</th>
                    <th className="px-4 py-3">Leads Generated</th>
                    <th className="px-4 py-3">Deals Closed</th>
                    <th className="px-4 py-3">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EBE6DC] font-medium">
                  {activities.map((a) => (
                    <tr key={a.id} className="hover:bg-[#FAF5FF] transition-colors">
                      <td className="px-4 py-3.5">
                        <span className="font-bold text-[#1D1D1B] flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-[#7E22CE]" />
                          <span>{a.area}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-[#5E5A52] font-semibold">{a.employee_name || 'Field Specialist'}</td>
                      <td className="px-4 py-3.5 text-[#8A8479] font-mono">{a.date}</td>
                      <td className="px-4 py-3.5 font-bold text-[#7E22CE]">{a.schemes_promoted}</td>
                      <td className="px-4 py-3.5 font-bold text-[#1D1D1B]">{a.customers_generated}</td>
                      <td className="px-4 py-3.5 font-bold text-[#21845F]">{a.customers_closed}</td>
                      <td className="px-4 py-3.5 text-[#5E5A52] max-w-xs truncate">{a.notes || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : leads.length === 0 ? (
          <EmptyState
            title="No field leads"
            description="No customer leads captured from field campaigns."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#FAF8F3] border-b border-[#E4DFD4] text-[#5E5A52] uppercase font-bold text-[11px]">
                <tr>
                  <th className="px-4 py-3">Customer Lead</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Territory Area</th>
                  <th className="px-4 py-3">Field Specialist</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Lead Status</th>
                  <th className="px-4 py-3">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EBE6DC] font-medium">
                {leads.map((l) => (
                  <tr key={l.id} className="hover:bg-[#FAF5FF] transition-colors">
                    <td className="px-4 py-3.5 font-bold text-[#1D1D1B]">{l.customer_name}</td>
                    <td className="px-4 py-3.5 font-mono text-[#8A8479]">{l.phone}</td>
                    <td className="px-4 py-3.5 text-[#5E5A52]">{l.area_name}</td>
                    <td className="px-4 py-3.5 text-[#5E5A52] font-semibold">{l.marketing_employee_name || 'Staff'}</td>
                    <td className="px-4 py-3.5 text-[#8A8479] font-mono">{l.date}</td>
                    <td className="px-4 py-3.5">
                      <span className="px-2.5 py-0.5 rounded-full bg-[#FAF8F3] border border-[#D8B4FE] text-[#7E22CE] font-bold text-[10px]">
                        {l.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-[#5E5A52] max-w-xs truncate">{l.notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
