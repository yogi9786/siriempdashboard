import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  UserCheck,
  Building2,
  Calendar,
  Clock,
  RefreshCw,
  Search,
  Filter,
  Download,
  Users,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Sparkles,
  ChevronRight,
  Edit2,
  Save,
  X,
  TrendingUp,
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { useAdminBranch } from '../../../context/AdminBranchContext';
import { useToast } from '../../../context/ToastContext';
import { AdminAttendanceOverview, EmployeeAttendance } from '../../../types';
import api from '../../../api/client';

export const AdminAttendancePage: React.FC = () => {
  const { branches, selectedBranchId, setSelectedBranchId } = useAdminBranch();
  const { success, error: toastError } = useToast();

  const getTodayDate = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [selectedDate, setSelectedDate] = useState<string>(getTodayDate());
  const [branchFilter, setBranchFilter] = useState<string>(selectedBranchId?.toString() || 'all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const [data, setData] = useState<AdminAttendanceOverview | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // 1-Hour Live Sync State
  const [lastSyncedTime, setLastSyncedTime] = useState<string>('');
  const [minutesUntilSync, setMinutesUntilSync] = useState<number>(60);
  const syncIntervalRef = useRef<any>(null);
  const countdownIntervalRef = useRef<any>(null);

  // Edit Modal State
  const [editingRecord, setEditingRecord] = useState<EmployeeAttendance | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState<boolean>(false);

  // Sync branchFilter with context selectedBranchId
  useEffect(() => {
    if (selectedBranchId !== null) {
      setBranchFilter(selectedBranchId.toString());
    } else {
      setBranchFilter('all');
    }
  }, [selectedBranchId]);

  const fetchAttendance = useCallback(
    async (isManualRefresh = false) => {
      if (isManualRefresh) setIsRefreshing(true);
      else setIsLoading(true);

      try {
        const params: Record<string, any> = { date: selectedDate };
        if (branchFilter !== 'all') {
          params.branch_id = parseInt(branchFilter);
        }

        const res = await api.get<AdminAttendanceOverview>('/api/v1/attendance/admin/overview', {
          params,
        });
        setData(res.data);

        const now = new Date();
        setLastSyncedTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
        setMinutesUntilSync(60);

        if (isManualRefresh) {
          success('Showroom staff attendance live-synced successfully!');
        }
      } catch (err) {
        console.error('Failed to load admin attendance:', err);
        toastError('Failed to fetch attendance overview.');
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [selectedDate, branchFilter]
  );

  // Initial fetch and 1-hour live sync timer
  useEffect(() => {
    fetchAttendance();

    // 1-Hour auto sync (3,600,000 ms)
    if (syncIntervalRef.current) clearInterval(syncIntervalRef.current);
    syncIntervalRef.current = setInterval(() => {
      fetchAttendance();
    }, 3600000);

    // Countdown minute tracker
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    countdownIntervalRef.current = setInterval(() => {
      setMinutesUntilSync((prev) => (prev > 1 ? prev - 1 : 60));
    }, 60000);

    return () => {
      if (syncIntervalRef.current) clearInterval(syncIntervalRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, [fetchAttendance]);

  const handleBranchChange = (newVal: string) => {
    setBranchFilter(newVal);
    if (newVal === 'all') {
      setSelectedBranchId(null);
    } else {
      setSelectedBranchId(parseInt(newVal));
    }
  };

  const handleSaveEdit = async () => {
    if (!editingRecord) return;
    setIsSavingEdit(true);
    try {
      await api.put(`/api/v1/attendance/admin/${editingRecord.id}`, {
        status: editingRecord.status,
        check_in: editingRecord.check_in || undefined,
        check_out: editingRecord.check_out || undefined,
        notes: editingRecord.notes || undefined,
      });
      success(`Updated attendance for ${editingRecord.employee_name}`);
      setEditingRecord(null);
      fetchAttendance();
    } catch (err: any) {
      toastError(err.response?.data?.detail || 'Failed to update attendance record.');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleExportCSV = () => {
    if (!data || data.records.length === 0) {
      toastError('No attendance records to export.');
      return;
    }
    const headers = ['Branch', 'Employee Code', 'Employee Name', 'Designation', 'Status', 'Check-In', 'Check-Out', 'Notes', 'Date'];
    const rows = data.records.map((r) => [
      `"${r.branch_name || ''}"`,
      `"${r.employee_code || ''}"`,
      `"${r.employee_name || ''}"`,
      `"${r.designation || ''}"`,
      `"${r.status || ''}"`,
      `"${r.check_in || ''}"`,
      `"${r.check_out || ''}"`,
      `"${r.notes || ''}"`,
      `"${r.date || selectedDate}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `staff_attendance_${selectedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    success('Attendance records exported to CSV!');
  };

  const summary = data?.summary || {
    total_roster: 0,
    total_present: 0,
    total_absent: 0,
    total_half_day: 0,
    total_leave: 0,
    total_late: 0,
    attendance_rate: 0,
  };

  const filteredRecords = (data?.records || []).filter((r) => {
    const matchesSearch =
      (r.employee_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.employee_code || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.designation || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.branch_name || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 py-6 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white border border-[#C5E3D5] rounded-3xl p-5 sm:p-6 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#E8F4EE] text-[#23815F] border border-[#C5E3D5] flex items-center justify-center shrink-0 shadow-2xs">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl font-extrabold text-[#1D1D1B] tracking-tight">
                Staff Attendance Command
              </h1>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#E8F4EE] text-[#23815F] border border-[#C5E3D5]">
                Multi-Branch Live Sync
              </span>
            </div>
            <p className="text-xs text-[#5E5A52] mt-0.5">
              Live enterprise monitoring of showroom staff attendance across Yelahanka, Kolar, and Udupi branches.
            </p>
          </div>
        </div>

        {/* 1-Hour Live Sync Indicator & Actions */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Live Sync Badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-[#F0FDF4] border border-[#BBF7D0] text-xs shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-[#16A34A] animate-pulse" />
            <div className="text-[11px] font-bold text-[#166534]">
              <span>Auto-syncs every 1 hr</span>
              {lastSyncedTime && (
                <span className="text-[#15803D] font-normal ml-1">
                  (Last: {lastSyncedTime} • Next ~{minutesUntilSync}m)
                </span>
              )}
            </div>
          </div>

          <Button
            onClick={() => fetchAttendance(true)}
            isLoading={isRefreshing}
            variant="outline"
            size="sm"
            className="rounded-xl border-[#C5E3D5] text-[#23815F] hover:bg-[#E8F4EE] text-xs font-bold flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Sync Now</span>
          </Button>

          <Button
            onClick={handleExportCSV}
            variant="outline"
            size="sm"
            className="rounded-xl border-[#C5E3D5] text-[#23815F] hover:bg-[#E8F4EE] text-xs font-bold flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </Button>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white border border-[#C5E3D5] rounded-2xl p-4 shadow-2xs">
          <span className="text-[10px] font-bold text-[#5E5A52] uppercase tracking-wider block">Total Roster</span>
          <span className="text-xl font-extrabold text-[#1D1D1B] mt-1 block">{summary.total_roster}</span>
        </div>

        <div className="bg-white border border-[#C5E3D5] rounded-2xl p-4 shadow-2xs">
          <span className="text-[10px] font-bold text-[#23815F] uppercase tracking-wider block">Present</span>
          <span className="text-xl font-extrabold text-[#23815F] mt-1 block">{summary.total_present}</span>
        </div>

        <div className="bg-white border border-[#C5E3D5] rounded-2xl p-4 shadow-2xs">
          <span className="text-[10px] font-bold text-[#C24141] uppercase tracking-wider block">Absent</span>
          <span className="text-xl font-extrabold text-[#C24141] mt-1 block">{summary.total_absent}</span>
        </div>

        <div className="bg-white border border-[#C5E3D5] rounded-2xl p-4 shadow-2xs">
          <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider block">Half Day</span>
          <span className="text-xl font-extrabold text-amber-600 mt-1 block">{summary.total_half_day}</span>
        </div>

        <div className="bg-white border border-[#C5E3D5] rounded-2xl p-4 shadow-2xs">
          <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">On Leave</span>
          <span className="text-xl font-extrabold text-blue-600 mt-1 block">{summary.total_leave}</span>
        </div>

        <div className="bg-white border border-[#C5E3D5] rounded-2xl p-4 shadow-2xs">
          <span className="text-[10px] font-bold text-[#23815F] uppercase tracking-wider block">Attendance Rate</span>
          <span className="text-xl font-extrabold text-[#23815F] mt-1 block">{summary.attendance_rate}%</span>
        </div>
      </div>

      {/* Branch Breakdown Cards */}
      {data?.branch_metrics && data.branch_metrics.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {data.branch_metrics.map((bm) => (
            <div
              key={bm.branch_id}
              onClick={() => handleBranchChange(bm.branch_id.toString())}
              className={`p-4 rounded-3xl border transition-all cursor-pointer shadow-2xs ${
                branchFilter === bm.branch_id.toString()
                  ? 'bg-[#E8F4EE]/60 border-[#23815F] ring-2 ring-[#23815F]/20'
                  : 'bg-white border-[#C5E3D5] hover:border-[#23815F]'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-extrabold text-[#1D1D1B] flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-[#23815F]" />
                  <span>{bm.branch_name}</span>
                </span>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#FAF8F3] text-[#5E5A52] border border-[#E4DFD4]">
                  {bm.branch_code}
                </span>
              </div>

              <div className="grid grid-cols-4 gap-2 text-center text-xs mt-2 pt-2 border-t border-[#E8E6E1]">
                <div>
                  <span className="text-[9px] text-[#5E5A52] block font-bold">Roster</span>
                  <span className="font-extrabold text-[#1D1D1B]">{bm.total_roster}</span>
                </div>
                <div>
                  <span className="text-[9px] text-[#23815F] block font-bold">Present</span>
                  <span className="font-extrabold text-[#23815F]">{bm.present_count}</span>
                </div>
                <div>
                  <span className="text-[9px] text-[#C24141] block font-bold">Absent</span>
                  <span className="font-extrabold text-[#C24141]">{bm.absent_count}</span>
                </div>
                <div>
                  <span className="text-[9px] text-[#23815F] block font-bold">Rate</span>
                  <span className="font-extrabold text-[#23815F]">{bm.attendance_rate}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="bg-white border border-[#C5E3D5] rounded-3xl p-4 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3 w-full md:w-auto flex-1 flex-wrap">
          {/* Branch Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#5E5A52]">Branch:</span>
            <select
              value={branchFilter}
              onChange={(e) => handleBranchChange(e.target.value)}
              className="select-luxury-slate rounded-xl px-3 py-1.5 text-xs font-bold cursor-pointer"
            >
              <option value="all">All Branches ({branches.length})</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id.toString()}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date Picker */}
          <div className="flex items-center gap-2 bg-[#FAF8F3] border border-[#E4DFD4] rounded-xl px-3 py-1">
            <Calendar className="w-3.5 h-3.5 text-[#23815F]" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-xs font-bold text-[#1D1D1B] outline-none cursor-pointer"
            />
          </div>

          {/* Status Dropdown */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="select-luxury-slate rounded-xl px-3 py-1.5 text-xs font-bold cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="Present">Present Only</option>
            <option value="Absent">Absent Only</option>
            <option value="Half Day">Half Day Only</option>
            <option value="On Leave">On Leave Only</option>
            <option value="Late">Late Only</option>
          </select>

          {/* Search Input */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-[#8A8479] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search employee, branch, code..."
              className="w-full pl-8 pr-3 py-1.5 input-luxury-beige rounded-xl text-xs"
            />
          </div>
        </div>

        <div className="text-xs text-[#5E5A52] font-semibold">
          Showing {filteredRecords.length} records for {selectedDate}
        </div>
      </div>

      {/* Attendance Table */}
      {isLoading ? (
        <div className="p-16 flex items-center justify-center bg-white border border-[#C5E3D5] rounded-3xl">
          <LoadingSpinner message="Loading enterprise attendance roster..." />
        </div>
      ) : filteredRecords.length === 0 ? (
        <div className="p-12 text-center bg-white border border-[#C5E3D5] rounded-3xl space-y-2">
          <Users className="w-10 h-10 text-[#8A8479] mx-auto opacity-40" />
          <h3 className="text-sm font-extrabold text-[#1D1D1B]">No attendance logs found</h3>
          <p className="text-xs text-[#5E5A52]">
            Showroom managers have not yet saved attendance for {selectedDate} under selected filters.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-[#C5E3D5] rounded-3xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#FAF8F3] border-b border-[#C5E3D5] text-[#5E5A52] uppercase font-bold text-[11px]">
                <tr>
                  <th className="px-5 py-3.5">Branch</th>
                  <th className="px-5 py-3.5">Employee</th>
                  <th className="px-5 py-3.5">Designation</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Check-In</th>
                  <th className="px-5 py-3.5">Check-Out</th>
                  <th className="px-5 py-3.5">Manager Notes</th>
                  <th className="px-5 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EBF3EE] font-medium">
                {filteredRecords.map((rec) => (
                  <tr key={rec.id} className="hover:bg-[#F0F7F4]/60 transition-colors">
                    {/* Branch */}
                    <td className="px-5 py-3.5">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#FAF8F3] text-[#5E5A52] border border-[#E4DFD4]">
                        {rec.branch_name || 'Showroom'}
                      </span>
                    </td>

                    {/* Employee Profile */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-[#E8F4EE] text-[#23815F] border border-[#C5E3D5] flex items-center justify-center font-extrabold text-xs shrink-0">
                          {rec.employee_name?.charAt(0) || 'E'}
                        </div>
                        <div>
                          <div className="font-extrabold text-[#1D1D1B]">{rec.employee_name}</div>
                          <div className="font-mono text-[10px] text-[#23815F] font-bold">
                            {rec.employee_code}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Designation */}
                    <td className="px-5 py-3.5 text-[#5E5A52]">
                      {rec.designation || 'Staff'}
                    </td>

                    {/* Status Badge */}
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          rec.status === 'Present'
                            ? 'bg-[#E8F4EE] text-[#23815F] border border-[#C5E3D5]'
                            : rec.status === 'Absent'
                            ? 'bg-red-50 text-red-600 border border-red-200'
                            : rec.status === 'Half Day'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : rec.status === 'On Leave'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-purple-50 text-purple-700 border border-purple-200'
                        }`}
                      >
                        {rec.status === 'Present'
                          ? '🟢 Present'
                          : rec.status === 'Absent'
                          ? '🔴 Absent'
                          : rec.status === 'Half Day'
                          ? '🟡 Half Day'
                          : rec.status === 'On Leave'
                          ? '🔵 Leave'
                          : '🟣 Late'}
                      </span>
                    </td>

                    {/* Check In */}
                    <td className="px-5 py-3.5 font-mono text-[#1D1D1B]">
                      {rec.check_in || '—'}
                    </td>

                    {/* Check Out */}
                    <td className="px-5 py-3.5 font-mono text-[#1D1D1B]">
                      {rec.check_out || '—'}
                    </td>

                    {/* Notes */}
                    <td className="px-5 py-3.5 text-[#5E5A52] text-[11px] max-w-xs truncate">
                      {rec.notes || '—'}
                    </td>

                    {/* Action */}
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => setEditingRecord({ ...rec })}
                        className="p-1.5 rounded-lg hover:bg-[#E8F4EE] text-[#23815F] transition-colors cursor-pointer"
                        title="Edit Attendance"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Admin Edit Modal */}
      {editingRecord && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-[#C5E3D5]">
            <div className="flex items-center justify-between border-b border-[#E8E6E1] pb-3">
              <div>
                <h3 className="text-sm font-extrabold text-[#1D1D1B]">
                  Edit Attendance: {editingRecord.employee_name}
                </h3>
                <p className="text-xs text-[#5E5A52]">
                  {editingRecord.branch_name} • {editingRecord.date || selectedDate}
                </p>
              </div>
              <button
                onClick={() => setEditingRecord(null)}
                className="p-1 rounded-full hover:bg-gray-100 text-[#5E5A52] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-[#1D1D1B] block mb-1">Status</label>
                <select
                  value={editingRecord.status}
                  onChange={(e) =>
                    setEditingRecord({
                      ...editingRecord,
                      status: e.target.value as EmployeeAttendance['status'],
                    })
                  }
                  className="w-full select-luxury-slate rounded-xl px-3 py-2 text-xs font-bold"
                >
                  <option value="Present">🟢 Present</option>
                  <option value="Absent">🔴 Absent</option>
                  <option value="Half Day">🟡 Half Day</option>
                  <option value="On Leave">🔵 On Leave</option>
                  <option value="Late">🟣 Late Arrival</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#1D1D1B] block mb-1">Check-In</label>
                  <input
                    type="text"
                    value={editingRecord.check_in || ''}
                    onChange={(e) => setEditingRecord({ ...editingRecord, check_in: e.target.value })}
                    placeholder="09:30 AM"
                    className="w-full px-3 py-1.5 input-luxury-beige rounded-xl text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#1D1D1B] block mb-1">Check-Out</label>
                  <input
                    type="text"
                    value={editingRecord.check_out || ''}
                    onChange={(e) => setEditingRecord({ ...editingRecord, check_out: e.target.value })}
                    placeholder="08:30 PM"
                    className="w-full px-3 py-1.5 input-luxury-beige rounded-xl text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#1D1D1B] block mb-1">Admin Notes</label>
                <textarea
                  rows={2}
                  value={editingRecord.notes || ''}
                  onChange={(e) => setEditingRecord({ ...editingRecord, notes: e.target.value })}
                  placeholder="Manager / admin adjustment reason..."
                  className="w-full px-3 py-1.5 input-luxury-beige rounded-xl text-xs resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E8E6E1]">
              <Button variant="outline" size="sm" onClick={() => setEditingRecord(null)}>
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSaveEdit}
                isLoading={isSavingEdit}
                className="bg-[#23815F] hover:bg-[#1B694C] text-white font-bold"
              >
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
