import React, { useEffect, useState } from 'react';
import {
  MessageSquare,
  Sparkles,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  XCircle,
  Edit2,
  Trash2,
  RotateCcw,
  Send,
  Users,
  Image as ImageIcon,
  Tag,
  ExternalLink,
  Shield,
  FileSpreadsheet,
  AlertCircle,
  Phone,
  Calendar,
  Loader2,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import {
  WhatsAppTemplate,
  WhatsAppMessageLog,
  WhatsAppStats,
} from '../../types';
import api from '../../api/client';

export const WhatsAppTemplatesPage: React.FC = () => {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();

  const [activeTab, setActiveTab] = useState<'templates' | 'logs'>('templates');

  // Templates State
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState<boolean>(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTemplate, setSearchTemplate] = useState<string>('');

  // Template Modal (Add / Edit)
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingTemplate, setEditingTemplate] = useState<WhatsAppTemplate | null>(null);
  const [formName, setFormName] = useState<string>('');
  const [formCampaign, setFormCampaign] = useState<string>('');
  const [formTemplateId, setFormTemplateId] = useState<string>('');
  const [formCategory, setFormCategory] = useState<string>('Offers');
  const [formDescription, setFormDescription] = useState<string>('');
  const [formMediaUrl, setFormMediaUrl] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Template Delete
  const [deleteTarget, setDeleteTarget] = useState<WhatsAppTemplate | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Sent Logs State
  const [logs, setLogs] = useState<WhatsAppMessageLog[]>([]);
  const [stats, setStats] = useState<WhatsAppStats | null>(null);
  const [isLoadingLogs, setIsLoadingLogs] = useState<boolean>(false);
  const [searchLog, setSearchLog] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const fetchTemplates = async () => {
    try {
      setIsLoadingTemplates(true);
      const res = await api.get<WhatsAppTemplate[]>('/api/v1/whatsapp/templates');
      setTemplates(res.data);
    } catch (err) {
      console.error('Failed to load templates:', err);
      toastError('Failed to fetch WhatsApp templates.');
    } finally {
      setIsLoadingTemplates(false);
    }
  };

  const fetchLogsAndStats = async () => {
    try {
      setIsLoadingLogs(true);
      const [logsRes, statsRes] = await Promise.all([
        api.get<WhatsAppMessageLog[]>('/api/v1/whatsapp/logs', { params: { limit: 150 } }),
        api.get<WhatsAppStats>('/api/v1/whatsapp/stats'),
      ]);
      setLogs(logsRes.data);
      setStats(statsRes.data);
    } catch (err) {
      console.error('Failed to load WhatsApp logs and stats:', err);
      toastError('Failed to fetch WhatsApp sent message logs.');
    } finally {
      setIsLoadingLogs(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
    fetchLogsAndStats();
  }, []);

  const handleOpenAddModal = () => {
    setEditingTemplate(null);
    setFormName('');
    setFormCampaign('');
    setFormTemplateId('');
    setFormCategory('Offers');
    setFormDescription('');
    setFormMediaUrl('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (tpl: WhatsAppTemplate) => {
    setEditingTemplate(tpl);
    setFormName(tpl.name);
    setFormCampaign(tpl.campaign_name);
    setFormTemplateId(tpl.template_id);
    setFormCategory(tpl.category || 'Offers');
    setFormDescription(tpl.description || '');
    setFormMediaUrl(tpl.media_url || '');
    setIsModalOpen(true);
  };

  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formCampaign.trim() || !formTemplateId.trim()) {
      toastError('Please fill in Template Name, Campaign Name, and Template ID.');
      return;
    }

    try {
      setIsSaving(true);
      const payload = {
        name: formName.trim(),
        campaign_name: formCampaign.trim(),
        template_id: formTemplateId.trim(),
        category: formCategory.trim() || 'Offers',
        description: formDescription.trim() || undefined,
        media_url: formMediaUrl.trim() || undefined,
        is_active: true,
      };

      if (editingTemplate) {
        await api.put(`/api/v1/whatsapp/templates/${editingTemplate.id}`, payload);
        success(`Template '${payload.name}' updated successfully.`);
      } else {
        await api.post('/api/v1/whatsapp/templates', payload);
        success(`New WhatsApp template '${payload.name}' created successfully.`);
      }

      setIsModalOpen(false);
      fetchTemplates();
    } catch (err: any) {
      console.error('Save template error:', err);
      toastError(err?.response?.data?.detail || 'Failed to save template.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteTemplate = async () => {
    if (!deleteTarget) return;
    try {
      setIsDeleting(true);
      await api.delete(`/api/v1/whatsapp/templates/${deleteTarget.id}`);
      success(`Template '${deleteTarget.name}' deleted.`);
      setDeleteTarget(null);
      fetchTemplates();
    } catch (err: any) {
      toastError(err?.response?.data?.detail || 'Failed to delete template.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Filter templates
  const filteredTemplates = templates.filter((tpl) => {
    if (selectedCategory !== 'all' && (tpl.category || '').toLowerCase() !== selectedCategory.toLowerCase()) {
      return false;
    }
    if (searchTemplate.trim()) {
      const q = searchTemplate.toLowerCase();
      const matchName = tpl.name.toLowerCase().includes(q);
      const matchCamp = tpl.campaign_name.toLowerCase().includes(q);
      const matchTplId = tpl.template_id.toLowerCase().includes(q);
      const matchDesc = (tpl.description || '').toLowerCase().includes(q);
      if (!matchName && !matchCamp && !matchTplId && !matchDesc) return false;
    }
    return true;
  });

  // Filter logs
  const filteredLogs = logs.filter((l) => {
    if (statusFilter !== 'all' && (l.status || '').toUpperCase() !== statusFilter.toUpperCase()) {
      return false;
    }
    if (searchLog.trim()) {
      const q = searchLog.toLowerCase();
      const matchName = (l.customer_name || '').toLowerCase().includes(q);
      const matchPhone = (l.phone_number || '').includes(q);
      const matchMgr = (l.manager_name || '').toLowerCase().includes(q);
      const matchCamp = (l.campaign_name || '').toLowerCase().includes(q);
      if (!matchName && !matchPhone && !matchMgr && !matchCamp) return false;
    }
    return true;
  });

  const getStatusBadge = (status: string) => {
    const st = (status || '').toUpperCase();
    if (st === 'SENT') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-[#F0FDF4] text-[#166534] border border-[#BBF7D0]">
          <CheckCircle2 className="w-3 h-3 text-[#16A34A]" />
          <span>Live Sent</span>
        </span>
      );
    }
    if (st === 'SIMULATED') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-[#EFF6FF] text-[#1E40AF] border border-[#BFDBFE]">
          <Sparkles className="w-3 h-3 text-[#3B82F6]" />
          <span>Simulated</span>
        </span>
      );
    }
    if (st === 'DEDUPLICATED') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-[#FFFBEB] text-[#B45309] border border-[#FDE68A]">
          <Clock className="w-3 h-3 text-[#D97706]" />
          <span>Cooldown Dedup</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-[#FEF2F2] text-[#991B1B] border border-[#FECACA]">
        <XCircle className="w-3 h-3 text-[#DC2626]" />
        <span>Failed</span>
      </span>
    );
  };

  return (
    <div className="space-y-6 pb-16">
      {/* 1. Hero Banner Matching Showroom Luxury Style */}
      <div className="relative bg-linear-to-br from-[#18181B] via-[#222226] to-[#27272A] border border-[#3F3F46] rounded-3xl p-6 sm:p-8 shadow-sm text-white overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-linear-to-r from-transparent via-[#16A34A] to-transparent opacity-80 animate-pulse" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2.5">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-white/10 text-[#4ADE80] border border-[#16A34A]/40 flex items-center gap-2 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-[#16A34A] animate-pulse" />
                <span>WhatsApp Outreach Center</span>
              </span>

              <span className="text-xs font-bold px-3 py-1 rounded-full bg-white/5 text-[#E5C378] border border-white/10 shadow-2xs">
                {templates.length} Approved Templates
              </span>

              {stats && (
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#16A34A]/20 text-[#4ADE80] border border-[#16A34A]/40">
                  {stats.total_sent} Dispatched
                </span>
              )}
            </div>

            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                WhatsApp Campaigns & Message Logs
              </h1>
              <p className="text-xs sm:text-sm text-[#A1A1AA] font-medium mt-1 max-w-2xl">
                Configure offer templates, festival promotions, and gold exchange privileges. Dispatched directly through verified AiSensy WhatsApp Business API.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto shrink-0">
            <button
              onClick={handleOpenAddModal}
              className="w-full sm:w-auto justify-center inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold text-white bg-linear-to-r from-[#16A34A] to-[#15803D] hover:from-[#15803D] hover:to-[#166534] shadow-md shadow-[#16A34A]/30 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 shrink-0" />
              <span>+ Add New Template</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 mt-6 pt-5 border-t border-white/10 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab('templates')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer shrink-0 whitespace-nowrap ${
              activeTab === 'templates'
                ? 'bg-white text-[#18181B] shadow-sm'
                : 'text-[#A1A1AA] hover:text-white hover:bg-white/10'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 shrink-0" />
            <span>Templates & Campaigns</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/10 font-mono">
              {templates.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('logs')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer shrink-0 whitespace-nowrap ${
              activeTab === 'logs'
                ? 'bg-white text-[#18181B] shadow-sm'
                : 'text-[#A1A1AA] hover:text-white hover:bg-white/10'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5 shrink-0" />
            <span>Sent Messages History & Reference</span>
            {stats && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/10 font-mono">
                {stats.total_sent}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: TEMPLATES & CAMPAIGNS                              */}
      {/* ======================================================== */}
      {activeTab === 'templates' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Category Filter Pills & Search */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white border border-[#E4DFD4] p-3 rounded-2xl shadow-2xs">
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
              <span className="text-xs font-bold text-[#6B6559] mr-1 uppercase tracking-wider text-[10px] shrink-0">Category:</span>
              {[
                { id: 'all', label: 'All Categories' },
                { id: 'Offers', label: 'Offers & Discounts' },
                { id: 'Festival & Offers', label: 'Festivals' },
                { id: 'Exchange', label: 'Exchange Privilege' },
                { id: 'Sold', label: 'Purchase Thanks' },
                { id: 'Follow-up', label: 'In-Hold Follow-up' },
              ].map((cat) => {
                const isSelected = selectedCategory.toLowerCase() === cat.id.toLowerCase();
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-extrabold border transition-all cursor-pointer shrink-0 whitespace-nowrap ${
                      isSelected
                        ? 'bg-[#18181B] text-white border-[#18181B] shadow-xs'
                        : 'bg-[#FAF8F5] text-[#6B6559] border-[#E6E1D6] hover:bg-[#F0EDE6]'
                    }`}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>

            <div className="w-full sm:w-64 relative flex items-center">
              <Search className="absolute left-3 w-4 h-4 text-[#8A8479]" />
              <input
                type="text"
                value={searchTemplate}
                onChange={(e) => setSearchTemplate(e.target.value)}
                placeholder="Search templates or campaigns..."
                className="w-full pl-9 pr-3 py-2 input-luxury-beige rounded-xl text-xs font-medium"
              />
            </div>
          </div>

          {/* Templates Grid */}
          {isLoadingTemplates ? (
            <div className="py-20 flex justify-center bg-white border border-[#E4DFD4] rounded-3xl shadow-2xs">
              <LoadingSpinner message="Loading WhatsApp templates..." />
            </div>
          ) : filteredTemplates.length === 0 ? (
            <EmptyState
              title="No WhatsApp templates found"
              description="Add a new template or adjust your category filter."
              icon={MessageSquare}
              actionText="+ Add New Template"
              onAction={handleOpenAddModal}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTemplates.map((tpl) => (
                <div
                  key={tpl.id}
                  className="bg-white border border-[#E4DFD4] hover:border-[#16A34A]/50 rounded-3xl p-5 shadow-[0_4px_18px_rgba(40,35,25,0.045)] flex flex-col justify-between transition-all duration-200 group"
                >
                  <div className="space-y-3">
                    {/* Top Badges & Actions */}
                    <div className="flex items-start justify-between gap-2">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-[#F0FDF4] text-[#166534] border border-[#BBF7D0]">
                        {tpl.category}
                      </span>
                      <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleOpenEditModal(tpl)}
                          className="p-1.5 rounded-lg text-[#536B8A] hover:text-[#18181B] hover:bg-[#EDF2F7] transition-colors cursor-pointer"
                          title="Edit Template"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(tpl)}
                          className="p-1.5 rounded-lg text-[#8A8479] hover:text-[#DC2626] hover:bg-[#FEE2E2] transition-colors cursor-pointer"
                          title="Delete Template"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Template Title */}
                    <div>
                      <h3 className="font-extrabold text-sm text-[#1D1D1B] group-hover:text-[#16A34A] transition-colors">
                        {tpl.name}
                      </h3>
                      <div className="mt-1 flex items-center gap-2 flex-wrap text-[11px]">
                        <span className="font-mono px-2 py-0.5 rounded-md bg-[#FAF8F5] border border-[#E6E1D6] text-[#525252]">
                          Camp: <strong>{tpl.campaign_name}</strong>
                        </span>
                        <span className="font-mono px-2 py-0.5 rounded-md bg-[#FAF8F5] border border-[#E6E1D6] text-[#525252]">
                          ID: <strong>{tpl.template_id}</strong>
                        </span>
                      </div>
                    </div>

                    {/* Message Preview Chat Bubble */}
                    <div className="bg-[#F0FDF4] border border-[#BBF7D0] rounded-2xl p-3 text-xs text-[#166534] font-medium leading-relaxed">
                      <p className="line-clamp-4">{tpl.description || 'No description provided.'}</p>
                    </div>

                    {/* Image Banner Indicator */}
                    {tpl.media_url && (
                      <div className="flex items-center gap-1.5 text-[11px] text-[#536B8A] truncate font-mono">
                        <ImageIcon className="w-3 h-3 shrink-0" />
                        <span className="truncate">{tpl.media_url}</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#F0EFEA] flex items-center justify-between text-[11px] text-[#8A8479]">
                    <span>Created: {new Date(tpl.created_at).toLocaleDateString()}</span>
                    <span className="text-[#16A34A] font-bold">AiSensy Verified</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: SENT MESSAGES HISTORY & REFERENCE (Admin & Manager) */}
      {/* ======================================================== */}
      {activeTab === 'logs' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          {/* Top KPI Metrics Cards */}
          {stats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              <div className="bg-white border border-[#E4DFD4] rounded-2xl p-4 shadow-2xs">
                <span className="text-[10px] sm:text-[11px] font-bold text-[#8A8479] uppercase tracking-wider block mb-1">
                  Total Dispatched
                </span>
                <div className="text-xl sm:text-2xl font-bold text-[#1D1D1B] font-mono">
                  {stats.total_sent}
                </div>
                <span className="text-[10px] text-[#16A34A] font-bold">Lifetime Outreach</span>
              </div>

              <div className="bg-white border border-[#E4DFD4] rounded-2xl p-4 shadow-2xs">
                <span className="text-[10px] sm:text-[11px] font-bold text-[#8A8479] uppercase tracking-wider block mb-1">
                  Sent Today
                </span>
                <div className="text-xl sm:text-2xl font-bold text-[#166534] font-mono">
                  {stats.sent_today}
                </div>
                <span className="text-[10px] text-[#166534] font-semibold">Today's Footfall Follow-ups</span>
              </div>

              <div className="bg-white border border-[#E4DFD4] rounded-2xl p-4 shadow-2xs">
                <span className="text-[10px] sm:text-[11px] font-bold text-[#8A8479] uppercase tracking-wider block mb-1">
                  Sent This Month
                </span>
                <div className="text-xl sm:text-2xl font-bold text-[#1E40AF] font-mono">
                  {stats.sent_this_month}
                </div>
                <span className="text-[10px] text-[#1E40AF] font-semibold">Monthly Promotions</span>
              </div>

              <div className="bg-white border border-[#E4DFD4] rounded-2xl p-4 shadow-2xs">
                <span className="text-[10px] sm:text-[11px] font-bold text-[#8A8479] uppercase tracking-wider block mb-1">
                  Failed Delivery
                </span>
                <div className="text-xl sm:text-2xl font-bold text-[#991B1B] font-mono">
                  {stats.total_failed}
                </div>
                <span className="text-[10px] text-[#991B1B] font-semibold">Invalid phone / API issues</span>
              </div>
            </div>
          )}

          {/* Filter & Search Bar */}
          <div className="bg-white border border-[#E4DFD4] rounded-2xl p-3.5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-2xs">
            <div className="w-full sm:w-72 relative flex items-center">
              <Search className="absolute left-3 w-4 h-4 text-[#8A8479]" />
              <input
                type="text"
                value={searchLog}
                onChange={(e) => setSearchLog(e.target.value)}
                placeholder="Search by customer, phone, manager..."
                className="w-full pl-9 pr-3 py-2 input-luxury-beige rounded-xl text-xs font-medium"
              />
            </div>

            <div className="flex items-center gap-2 justify-end">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="select-luxury-slate rounded-xl px-3 py-2 text-xs font-semibold cursor-pointer"
              >
                <option value="all">All Delivery Statuses</option>
                <option value="SENT">Live Sent</option>
                <option value="SIMULATED">Simulated</option>
                <option value="DEDUPLICATED">Deduplicated (Cooldown)</option>
                <option value="FAILED">Failed</option>
              </select>

              <button
                onClick={fetchLogsAndStats}
                title="Refresh Sent Message Logs"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-[#536B8A] bg-[#EDF2F7] border border-[#C5D5E6] hover:bg-[#E2E8F0] transition-colors cursor-pointer shrink-0"
              >
                <RotateCcw className={`w-3.5 h-3.5 ${isLoadingLogs ? 'animate-spin' : ''}`} />
                <span>Sync / Refresh</span>
              </button>
            </div>
          </div>

          {/* Logs Table */}
          {isLoadingLogs ? (
            <div className="py-20 flex justify-center bg-white border border-[#E4DFD4] rounded-3xl shadow-2xs">
              <LoadingSpinner message="Loading sent message records..." />
            </div>
          ) : filteredLogs.length === 0 ? (
            <EmptyState
              title="No WhatsApp message records found"
              description="Messages sent by managers from the Customer Directory will appear here for audit and reference."
              icon={FileSpreadsheet}
            />
          ) : (
            <div className="bg-white border border-[#E4DFD4] rounded-3xl overflow-hidden shadow-[0_4px_18px_rgba(40,35,25,0.045)]">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-[#FAF8F3] border-b border-[#E4DFD4] text-[#8A8479] uppercase font-bold text-[11px] tracking-wider">
                    <tr>
                      <th className="px-5 py-3.5">Dispatched At</th>
                      <th className="px-5 py-3.5">Customer Recipient</th>
                      <th className="px-5 py-3.5">Campaign & Template</th>
                      <th className="px-5 py-3.5">Sent By (Manager)</th>
                      <th className="px-5 py-3.5">Delivery Status</th>
                      <th className="px-5 py-3.5">Details / API Note</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F0EFEA] font-medium">
                    {filteredLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-[#F0F4F8] transition-colors">
                        {/* Timestamp */}
                        <td className="px-5 py-3.5 whitespace-nowrap text-[#525252]">
                          <div className="flex items-center gap-1.5 font-mono text-[11px]">
                            <Calendar className="w-3 h-3 text-[#8A8479]" />
                            <span>{new Date(log.sent_at).toLocaleString()}</span>
                          </div>
                        </td>

                        {/* Customer */}
                        <td className="px-5 py-3.5">
                          <div className="font-bold text-[#1D1D1B]">{log.customer_name}</div>
                          <a
                            href={`tel:${log.phone_number}`}
                            className="text-[11px] font-mono text-[#536B8A] flex items-center gap-1 hover:underline"
                          >
                            <Phone className="w-3 h-3 text-[#8A8479]" />
                            <span>{log.phone_number}</span>
                          </a>
                        </td>

                        {/* Campaign */}
                        <td className="px-5 py-3.5">
                          <span className="font-bold text-[#1D1D1B] block">{log.campaign_name}</span>
                          <span className="font-mono text-[10px] text-[#8A8479]">ID: {log.template_id || '—'}</span>
                          {log.category && (
                            <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded text-[9px] font-bold bg-[#FAF8F5] border border-[#E6E1D6] text-[#525252]">
                              {log.category}
                            </span>
                          )}
                        </td>

                        {/* Sent By */}
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <span className="font-bold text-[#1D1D1B] block">{log.manager_name || 'Showroom Manager'}</span>
                          <span className="text-[10px] text-[#8A8479]">Branch #{log.branch_id || 'Yelahanka'}</span>
                        </td>

                        {/* Status */}
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          {getStatusBadge(log.status)}
                        </td>

                        {/* Details */}
                        <td className="px-5 py-3.5 max-w-xs">
                          <p className="text-xs text-[#525252] truncate" title={log.status_details || undefined}>
                            {log.status_details || '—'}
                          </p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add / Edit Template Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-[#E4DFD4] overflow-hidden flex flex-col">
            <div className="px-5 sm:px-6 py-4 bg-linear-to-r from-[#18181B] to-[#27272A] text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-[#16A34A]/20 border border-[#16A34A]/40 flex items-center justify-center text-[#4ADE80]">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base text-white">
                    {editingTemplate ? 'Edit WhatsApp Template' : 'Add New WhatsApp Template'}
                  </h3>
                  <p className="text-[11px] text-[#A1A1AA]">
                    AiSensy Meta-approved template for customer outreach
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                disabled={isSaving}
                className="p-1.5 rounded-xl text-[#A1A1AA] hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTemplate} className="p-5 sm:p-6 space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#1D1D1B]">Template Display Name *</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Akshaya Tritiya Gold Special Offer"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#C5D5E6] text-xs font-semibold text-[#1D1D1B] focus:ring-2 focus:ring-[#16A34A] outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#1D1D1B]">AiSensy Campaign Name *</label>
                  <input
                    type="text"
                    required
                    value={formCampaign}
                    onChange={(e) => setFormCampaign(e.target.value)}
                    placeholder="e.g. akshaya_gold_2026"
                    className="w-full px-3 py-2 rounded-xl border border-[#C5D5E6] text-xs font-mono font-semibold text-[#1D1D1B] focus:ring-2 focus:ring-[#16A34A] outline-hidden"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#1D1D1B]">Meta Template ID *</label>
                  <input
                    type="text"
                    required
                    value={formTemplateId}
                    onChange={(e) => setFormTemplateId(e.target.value)}
                    placeholder="e.g. akshaya_offer_v1"
                    className="w-full px-3 py-2 rounded-xl border border-[#C5D5E6] text-xs font-mono font-semibold text-[#1D1D1B] focus:ring-2 focus:ring-[#16A34A] outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#1D1D1B]">Category</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#C5D5E6] bg-white text-xs font-semibold text-[#1D1D1B] focus:ring-2 focus:ring-[#16A34A] outline-hidden cursor-pointer"
                  >
                    <option value="Offers">Offers & Discounts</option>
                    <option value="Festival & Offers">Festival Special</option>
                    <option value="Exchange">Gold Exchange Privilege</option>
                    <option value="Sold">Purchase Thank You</option>
                    <option value="Follow-up">In Hold / Follow-up</option>
                    <option value="General">General Outreach</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#1D1D1B]">Media / Image URL (Optional)</label>
                  <input
                    type="url"
                    value={formMediaUrl}
                    onChange={(e) => setFormMediaUrl(e.target.value)}
                    placeholder="https://example.com/banner.jpg"
                    className="w-full px-3 py-2 rounded-xl border border-[#C5D5E6] text-xs font-mono text-[#1D1D1B] focus:ring-2 focus:ring-[#16A34A] outline-hidden"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#1D1D1B]">Sample Message Text / Description</label>
                <textarea
                  rows={3}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Enter the template preview text delivered to customer WhatsApp..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#C5D5E6] text-xs font-medium text-[#1D1D1B] focus:ring-2 focus:ring-[#16A34A] outline-hidden"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSaving}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-[#6B6559] hover:bg-[#EAE5D9] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-extrabold text-white bg-linear-to-r from-[#16A34A] to-[#15803D] hover:from-[#15803D] hover:to-[#166534] shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  <span>{editingTemplate ? 'Update Template' : 'Save Template'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <ConfirmDialog
          isOpen={Boolean(deleteTarget)}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDeleteTemplate}
          title="Delete WhatsApp Template"
          message={`Are you sure you want to delete template '${deleteTarget.name}'? This action cannot be undone.`}
          confirmText="Delete Template"
          variant="danger"
          isLoading={isDeleting}
        />
      )}
    </div>
  );
};
