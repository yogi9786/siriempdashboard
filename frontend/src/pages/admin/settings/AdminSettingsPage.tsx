import React, { useEffect, useState } from 'react';
import {
  Settings,
  Database,
  Shield,
  Server,
  HardDrive,
  Clock,
  CheckCircle2,
  Lock,
  Sparkles,
  RefreshCw,
  Building2,
  Users,
} from 'lucide-react';
import { AdminSettingsResponse } from '../../../types';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { Button } from '../../../components/ui/Button';
import { useToast } from '../../../context/ToastContext';
import api from '../../../api/client';

export const AdminSettingsPage: React.FC = () => {
  const { success, error: toastError } = useToast();

  const [settings, setSettings] = useState<AdminSettingsResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      const res = await api.get<AdminSettingsResponse>('/api/v1/admin/settings');
      setSettings(res.data);
    } catch (err) {
      console.error('Failed to load settings:', err);
      toastError('Failed to fetch system settings.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  if (isLoading || !settings) {
    return <LoadingSpinner fullPage message="Loading enterprise settings & database diagnostics..." />;
  }

  return (
    <div className="space-y-7 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#EBE6DC] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#4B5563] bg-[#F3F4F6] px-2.5 py-1 rounded-full border border-[#D1D5DB]">
              System Configuration
            </span>
            <span className="text-xs text-[#8A8479] font-medium">Enterprise Engine v{settings.version}</span>
          </div>
          <h1 className="text-2xl font-extrabold text-[#1D1D1B] tracking-tight mt-1">
            Enterprise Admin Settings & Diagnostics
          </h1>
          <p className="text-xs text-[#8A8479] font-medium mt-0.5">
            Architecture parameters, security layer, dual database health, and storage limits
          </p>
        </div>

        <Button variant="outline" onClick={fetchSettings} icon={<RefreshCw className="w-4 h-4" />}>
          Refresh Diagnostics
        </Button>
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 1. Database & Architecture Status */}
        <div className="bg-white border border-[#E4DFD4] rounded-3xl p-6 shadow-[0_4px_18px_rgba(40,35,25,0.045)] space-y-4">
          <div className="flex items-center gap-3 border-b border-[#EBE6DC] pb-3">
            <div className="w-10 h-10 rounded-xl bg-[#E8F4EE] border border-[#C5E3D5] text-[#21845F] flex items-center justify-center font-bold">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#1D1D1B]">Database & Persistence Engine</h2>
              <p className="text-xs text-[#8A8479]">Dual backend: PostgreSQL primary / SQLite local</p>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#FAF8F3] border border-[#E4DFD4]">
              <span className="font-semibold text-[#5E5A52]">Active Database Engine</span>
              <span className="font-bold text-[#21845F] font-mono">{settings.database_backend}</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-[#FAF8F3] border border-[#E4DFD4]">
              <span className="font-semibold text-[#5E5A52]">Database Connection Health</span>
              <span className="inline-flex items-center gap-1 font-bold text-[#21845F]">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{settings.database_status}</span>
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-[#FAF8F3] border border-[#E4DFD4]">
              <span className="font-semibold text-[#5E5A52]">Managed Showrooms</span>
              <span className="font-bold text-[#1D1D1B]">{settings.total_branches} Branches</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-[#FAF8F3] border border-[#E4DFD4]">
              <span className="font-semibold text-[#5E5A52]">Total Staff in DB</span>
              <span className="font-bold text-[#1D1D1B]">{settings.total_employees} Employees</span>
            </div>
          </div>
        </div>

        {/* 2. Security & Token Authentication */}
        <div className="bg-white border border-[#E4DFD4] rounded-3xl p-6 shadow-[0_4px_18px_rgba(40,35,25,0.045)] space-y-4">
          <div className="flex items-center gap-3 border-b border-[#EBE6DC] pb-3">
            <div className="w-10 h-10 rounded-xl bg-[#F3E8FF] border border-[#D8B4FE] text-[#7E22CE] flex items-center justify-center font-bold">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#1D1D1B]">Security & Access Control</h2>
              <p className="text-xs text-[#8A8479]">JWT token cryptography and session timeouts</p>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#FAF8F3] border border-[#E4DFD4]">
              <span className="font-semibold text-[#5E5A52]">JWT Encryption Algorithm</span>
              <span className="font-bold text-[#7E22CE] font-mono">{settings.jwt_algorithm}</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-[#FAF8F3] border border-[#E4DFD4]">
              <span className="font-semibold text-[#5E5A52]">Session Token Lifetime</span>
              <span className="font-bold text-[#1D1D1B]">{settings.session_timeout_minutes / 60} Hours (7 Days Remembered)</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-[#FAF8F3] border border-[#E4DFD4]">
              <span className="font-semibold text-[#5E5A52]">Role-based Access Control</span>
              <span className="font-bold text-[#21845F]">SUPER_ADMIN & MANAGER Enforced</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-[#FAF8F3] border border-[#E4DFD4]">
              <span className="font-semibold text-[#5E5A52]">Server Time (UTC/IST)</span>
              <span className="font-bold text-[#1D1D1B] font-mono text-[11px]">
                {new Date(settings.server_time).toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>

        {/* 3. Media & Storage Architecture */}
        <div className="bg-white border border-[#E4DFD4] rounded-3xl p-6 shadow-[0_4px_18px_rgba(40,35,25,0.045)] space-y-4">
          <div className="flex items-center gap-3 border-b border-[#EBE6DC] pb-3">
            <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] border border-[#BFDBFE] text-[#3B82F6] flex items-center justify-center font-bold">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#1D1D1B]">Media & Storage Directory</h2>
              <p className="text-xs text-[#8A8479]">Closing forms, reviews screenshots, and attire uploads</p>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#FAF8F3] border border-[#E4DFD4]">
              <span className="font-semibold text-[#5E5A52]">Uploads Storage Path</span>
              <span className="font-bold text-[#1D1D1B] font-mono text-[11px]">{settings.media_dir}</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-[#FAF8F3] border border-[#E4DFD4]">
              <span className="font-semibold text-[#5E5A52]">Max File Upload Size</span>
              <span className="font-bold text-[#1D1D1B]">{settings.max_upload_size_mb} MB per file</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-[#FAF8F3] border border-[#E4DFD4]">
              <span className="font-semibold text-[#5E5A52]">Allowed File Types</span>
              <span className="font-bold text-[#7E22CE]">JPG, PNG, WEBP, PDF</span>
            </div>
          </div>
        </div>

        {/* 4. Company & Enterprise Branding */}
        <div className="bg-white border border-[#E4DFD4] rounded-3xl p-6 shadow-[0_4px_18px_rgba(40,35,25,0.045)] space-y-4">
          <div className="flex items-center gap-3 border-b border-[#EBE6DC] pb-3">
            <div className="w-10 h-10 rounded-xl bg-[#FEF3C7] border border-[#FDE68A] text-[#D97706] flex items-center justify-center font-bold">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#1D1D1B]">Organization Identity</h2>
              <p className="text-xs text-[#8A8479]">Siri Samruddhi Gold Palace corporate metadata</p>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#FAF8F3] border border-[#E4DFD4]">
              <span className="font-semibold text-[#5E5A52]">Company Legal Name</span>
              <span className="font-bold text-[#1D1D1B]">{settings.company_name}</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-[#FAF8F3] border border-[#E4DFD4]">
              <span className="font-semibold text-[#5E5A52]">System Deployment Environment</span>
              <span className="font-bold text-[#21845F] uppercase font-mono">{settings.environment}</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-[#FAF8F3] border border-[#E4DFD4]">
              <span className="font-semibold text-[#5E5A52]">Software Suite Version</span>
              <span className="font-bold text-[#1D1D1B]">{settings.version}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
