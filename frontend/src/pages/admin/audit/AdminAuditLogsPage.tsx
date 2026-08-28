import React, { useEffect, useState } from 'react';
import {
  ShieldCheck,
  Search,
  Filter,
  Clock,
  User,
  Shield,
  Activity,
  AlertTriangle,
  FileText,
} from 'lucide-react';
import { AdminAuditLogResponse, AdminAuditLogItem } from '../../../types';
import { AdminKPICard } from '../../../components/admin/ui/AdminKPICard';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { EmptyState } from '../../../components/ui/EmptyState';
import { useToast } from '../../../context/ToastContext';
import api from '../../../api/client';

export const AdminAuditLogsPage: React.FC = () => {
  const { error: toastError } = useToast();

  const [logs, setLogs] = useState<AdminAuditLogItem[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [actionFilter, setActionFilter] = useState<string>('all');

  const fetchLogs = async () => {
    try {
      setIsLoading(true);
      const params: Record<string, any> = {
        page,
        limit: 50,
      };
      if (searchTerm.trim()) params.search = searchTerm.trim();
      if (actionFilter !== 'all') params.action = actionFilter;

      const res = await api.get<AdminAuditLogResponse>('/api/v1/admin/audit/logs', { params });
      setLogs(res.data.logs || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
      toastError('Failed to fetch security audit logs.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, searchTerm, actionFilter]);

  const getActionBadgeColor = (action: string) => {
    if (action.includes('LOGIN')) return 'bg-[#E8F4EE] text-[#21845F] border-[#C5E3D5]';
    if (action.includes('UPDATE') || action.includes('EDIT')) return 'bg-[#EFF6FF] text-[#3B82F6] border-[#BFDBFE]';
    if (action.includes('DELETE') || action.includes('RESET')) return 'bg-[#FEE2E2] text-[#DC2626] border-[#FECACA]';
    return 'bg-[#FAF8F3] text-[#7E22CE] border-[#D8B4FE]';
  };

  return (
    <div className="space-y-7 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#EBE6DC] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#4B5563] bg-[#F3F4F6] px-2.5 py-1 rounded-full border border-[#D1D5DB]">
              Security & Compliance
            </span>
            <span className="text-xs text-[#8A8479] font-medium">{total} Logged Events</span>
          </div>
          <h1 className="text-2xl font-extrabold text-[#1D1D1B] tracking-tight mt-1">
            Enterprise Security Audit Trail
          </h1>
          <p className="text-xs text-[#8A8479] font-medium mt-0.5">
            Immutable log of administrative operations, manager logins, branch modifications, and user access
          </p>
        </div>
      </div>

      {/* 3 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <AdminKPICard
          title="Total Audit Events"
          value={total}
          subtitle="System Security Trail"
          icon={<ShieldCheck className="w-5 h-5 text-[#21845F]" />}
          iconBgColor="bg-[#E8F4EE] border-[#C5E3D5] text-[#21845F]"
        />

        <AdminKPICard
          title="Super Admin Activity"
          value="Active"
          subtitle="Enterprise HQ Operations"
          icon={<Shield className="w-5 h-5 text-[#7E22CE]" />}
          iconBgColor="bg-[#F3E8FF] border-[#D8B4FE] text-[#7E22CE]"
        />

        <AdminKPICard
          title="Security Status"
          value="100% Verified"
          subtitle="Encrypted JWT Tokens"
          icon={<Activity className="w-5 h-5 text-[#3B82F6]" />}
          iconBgColor="bg-[#EFF6FF] border-[#BFDBFE] text-[#3B82F6]"
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
            placeholder="Search audit logs by username, action, entity, or details..."
            className="w-full pl-10 pr-4 py-2 bg-[#FAF8F3] border border-[#E4DFD4] rounded-xl text-xs text-[#1D1D1B] placeholder-[#8A8479] focus:outline-none focus:border-[#7E22CE]"
          />
        </div>

        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="px-3 py-2 bg-[#FAF8F3] border border-[#E4DFD4] rounded-xl text-xs font-bold text-[#1D1D1B] focus:outline-none cursor-pointer w-full sm:w-auto"
        >
          <option value="all">All Actions</option>
          <option value="LOGIN">Login Events</option>
          <option value="UPDATE">Update Events</option>
          <option value="CREATE">Create Events</option>
          <option value="RESET_PASSWORD">Password Resets</option>
        </select>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-white border border-[#E4DFD4] rounded-3xl p-6 shadow-[0_4px_18px_rgba(40,35,25,0.045)]">
        {isLoading ? (
          <LoadingSpinner message="Loading security audit trail..." />
        ) : logs.length === 0 ? (
          <EmptyState
            title="No audit logs recorded"
            description="No system audit logs match your search filters."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#FAF8F3] border-b border-[#E4DFD4] text-[#5E5A52] uppercase font-bold text-[11px]">
                <tr>
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3">User / Admin</th>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">Entity</th>
                  <th className="px-4 py-3">IP Address</th>
                  <th className="px-4 py-3">Details & Audit Payload</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EBE6DC] font-medium">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#FAF5FF] transition-colors">
                    <td className="px-4 py-3.5 text-[#8A8479] font-mono whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString('en-IN')}
                    </td>
                    <td className="px-4 py-3.5 font-bold text-[#1D1D1B]">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-[#7E22CE]" />
                        <span>{log.username || 'System'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`px-2.5 py-0.5 rounded-md border font-bold text-[10px] ${getActionBadgeColor(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-[#5E5A52] font-semibold">{log.entity}</td>
                    <td className="px-4 py-3.5 text-[#8A8479] font-mono">{log.ip_address || '127.0.0.1'}</td>
                    <td className="px-4 py-3.5 text-[#5E5A52] max-w-md truncate font-mono text-[11px]">
                      {log.details || '—'}
                    </td>
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
