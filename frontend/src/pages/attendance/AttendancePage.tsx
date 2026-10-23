import React, { useEffect, useState, useCallback } from 'react';
import {
  UserCheck,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Users,
  Search,
  Save,
  RotateCcw,
  Sparkles,
  Building2,
  FileText,
  Filter,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Employee, EmployeeAttendance } from '../../types';
import api from '../../api/client';

interface AttendanceRowState {
  employee_id: number;
  employee_name: string;
  employee_code: string;
  designation: string;
  department: string;
  status: 'Present' | 'Absent' | 'Half Day' | 'On Leave' | 'Late';
  check_in: string;
  check_out: string;
  notes: string;
  existing_id?: number;
}

export const AttendancePage: React.FC = () => {
  const { user, selectedBranch } = useAuth();
  const { success, error: toastError } = useToast();

  const getTodayDate = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [selectedDate, setSelectedDate] = useState<string>(getTodayDate());
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [rows, setRows] = useState<AttendanceRowState[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      // 1. Fetch showroom employees
      const empRes = await api.get<Employee[]>('/api/v1/employees');
      const empList = empRes.data.filter((e) => (e.status as string).toLowerCase() === 'active');
      setEmployees(empList);

      // 2. Fetch existing attendance records for the selected date
      const attRes = await api.get<EmployeeAttendance[]>('/api/v1/attendance', {
        params: { date: selectedDate },
      });
      const existingMap = new Map<number, EmployeeAttendance>();
      (attRes.data || []).forEach((att) => {
        existingMap.set(att.employee_id, att);
      });

      // 3. Build rows
      const initialRows: AttendanceRowState[] = empList.map((emp) => {
        const existing = existingMap.get(emp.id);
        if (existing) {
          return {
            employee_id: emp.id,
            employee_name: emp.full_name,
            employee_code: emp.employee_code,
            designation: emp.designation,
            department: emp.department,
            status: (existing.status as AttendanceRowState['status']) || 'Present',
            check_in: existing.check_in || '',
            check_out: existing.check_out || '',
            notes: existing.notes || '',
            existing_id: existing.id,
          };
        }
        return {
          employee_id: emp.id,
          employee_name: emp.full_name,
          employee_code: emp.employee_code,
          designation: emp.designation,
          department: emp.department,
          status: 'Present',
          check_in: '09:30 AM',
          check_out: '08:30 PM',
          notes: '',
        };
      });

      setRows(initialRows);
    } catch (err) {
      console.error('Failed to load attendance data:', err);
      toastError('Failed to fetch attendance data.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const updateRowField = (empId: number, field: keyof AttendanceRowState, value: any) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.employee_id !== empId) return r;
        const updated = { ...r, [field]: value };
        // Auto-clear or auto-set times based on status
        if (field === 'status') {
          if (value === 'Absent' || value === 'On Leave') {
            updated.check_in = '';
            updated.check_out = '';
          } else if (value === 'Present' && !updated.check_in) {
            updated.check_in = '09:30 AM';
            updated.check_out = '08:30 PM';
          }
        }
        return updated;
      })
    );
  };

  const handleMarkAll = (status: 'Present' | 'Absent') => {
    setRows((prev) =>
      prev.map((r) => ({
        ...r,
        status,
        check_in: status === 'Present' ? '09:30 AM' : '',
        check_out: status === 'Present' ? '08:30 PM' : '',
      }))
    );
  };

  const handleSaveAttendance = async () => {
    if (rows.length === 0) return;
    setIsSaving(true);
    try {
      const payload = {
        date: selectedDate,
        records: rows.map((r) => ({
          employee_id: r.employee_id,
          date: selectedDate,
          status: r.status,
          check_in: r.check_in || undefined,
          check_out: r.check_out || undefined,
          notes: r.notes || undefined,
        })),
      };

      await api.post('/api/v1/attendance/bulk', payload);
      success(`Attendance successfully logged for ${rows.length} showroom staff on ${selectedDate}!`);
      loadData();
    } catch (err: any) {
      console.error('Save attendance failed:', err);
      toastError(err.response?.data?.detail || 'Failed to save staff attendance.');
    } finally {
      setIsSaving(false);
    }
  };

  // Metrics
  const presentCount = rows.filter((r) => r.status === 'Present').length;
  const absentCount = rows.filter((r) => r.status === 'Absent').length;
  const halfDayCount = rows.filter((r) => r.status === 'Half Day').length;
  const leaveCount = rows.filter((r) => r.status === 'On Leave').length;
  const lateCount = rows.filter((r) => r.status === 'Late').length;
  const attendanceRate = rows.length > 0 ? Math.round(((presentCount + halfDayCount * 0.5) / rows.length) * 100) : 0;

  const filteredRows = rows.filter((r) => {
    const matchesSearch =
      r.employee_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.employee_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.designation.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 py-6 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-[#C5E3D5] rounded-3xl p-5 sm:p-6 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#E8F4EE] text-[#23815F] border border-[#C5E3D5] flex items-center justify-center shrink-0 shadow-2xs">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-[#1D1D1B] tracking-tight flex items-center gap-2">
              <span>Showroom Staff Daily Attendance</span>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#E8F4EE] text-[#23815F] border border-[#C5E3D5]">
                {selectedBranch?.name || 'Showroom Floor'}
              </span>
            </h1>
            <p className="text-xs text-[#5E5A52] mt-0.5">
              Record daily employee roster presence, check-in, check-out times, and remarks. Synced with Super Admin.
            </p>
          </div>
        </div>

        {/* Date Selector & Save Action */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 bg-[#FAF8F3] border border-[#E4DFD4] rounded-2xl px-3.5 py-1.5 shadow-2xs">
            <Calendar className="w-4 h-4 text-[#23815F]" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-xs font-bold text-[#1D1D1B] outline-none cursor-pointer"
            />
          </div>

          <Button
            onClick={handleSaveAttendance}
            isLoading={isSaving}
            className="bg-gradient-to-r from-[#23815F] to-[#1B694C] hover:from-[#1B694C] hover:to-[#14533C] text-white text-xs font-extrabold px-5 py-2.5 rounded-2xl shadow-sm transition-all flex items-center gap-2 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Save Attendance ({selectedDate})</span>
          </Button>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white border border-[#C5E3D5] rounded-2xl p-4 shadow-2xs">
          <span className="text-[10px] font-bold text-[#5E5A52] uppercase tracking-wider block">Total Roster</span>
          <span className="text-xl font-extrabold text-[#1D1D1B] mt-1 block">{rows.length}</span>
        </div>

        <div className="bg-white border border-[#C5E3D5] rounded-2xl p-4 shadow-2xs">
          <span className="text-[10px] font-bold text-[#23815F] uppercase tracking-wider block">Present</span>
          <span className="text-xl font-extrabold text-[#23815F] mt-1 block">{presentCount}</span>
        </div>

        <div className="bg-white border border-[#C5E3D5] rounded-2xl p-4 shadow-2xs">
          <span className="text-[10px] font-bold text-[#C24141] uppercase tracking-wider block">Absent</span>
          <span className="text-xl font-extrabold text-[#C24141] mt-1 block">{absentCount}</span>
        </div>

        <div className="bg-white border border-[#C5E3D5] rounded-2xl p-4 shadow-2xs">
          <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider block">Half Day</span>
          <span className="text-xl font-extrabold text-amber-600 mt-1 block">{halfDayCount}</span>
        </div>

        <div className="bg-white border border-[#C5E3D5] rounded-2xl p-4 shadow-2xs">
          <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">On Leave</span>
          <span className="text-xl font-extrabold text-blue-600 mt-1 block">{leaveCount}</span>
        </div>

        <div className="bg-white border border-[#C5E3D5] rounded-2xl p-4 shadow-2xs">
          <span className="text-[10px] font-bold text-[#23815F] uppercase tracking-wider block">Attendance Rate</span>
          <span className="text-xl font-extrabold text-[#23815F] mt-1 block">{attendanceRate}%</span>
        </div>
      </div>

      {/* Filter & Bulk Quick Actions Bar */}
      <div className="bg-white border border-[#C5E3D5] rounded-3xl p-4 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3 w-full md:w-auto flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-[#8A8479] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search staff name, code, designation..."
              className="w-full pl-9 pr-3 py-1.5 input-luxury-beige rounded-xl text-xs"
            />
          </div>

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
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => handleMarkAll('Present')}
            className="px-3 py-1.5 rounded-xl bg-[#E8F4EE] hover:bg-[#D4EBDD] text-[#23815F] text-xs font-bold border border-[#C5E3D5] transition-colors cursor-pointer"
          >
            ✓ Mark All Present
          </button>
          <button
            type="button"
            onClick={() => handleMarkAll('Absent')}
            className="px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold border border-red-200 transition-colors cursor-pointer"
          >
            ✗ Mark All Absent
          </button>
        </div>
      </div>

      {/* Attendance Table */}
      {isLoading ? (
        <div className="p-16 flex items-center justify-center bg-white border border-[#C5E3D5] rounded-3xl">
          <LoadingSpinner message="Loading staff roster and attendance..." />
        </div>
      ) : filteredRows.length === 0 ? (
        <div className="p-12 text-center bg-white border border-[#C5E3D5] rounded-3xl space-y-2">
          <Users className="w-10 h-10 text-[#8A8479] mx-auto opacity-40" />
          <h3 className="text-sm font-extrabold text-[#1D1D1B]">No staff members found</h3>
          <p className="text-xs text-[#5E5A52]">Try adjusting your search or status filter.</p>
        </div>
      ) : (
        <div className="bg-white border border-[#C5E3D5] rounded-3xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#FAF8F3] border-b border-[#C5E3D5] text-[#5E5A52] uppercase font-bold text-[11px]">
                <tr>
                  <th className="px-5 py-3.5">Employee</th>
                  <th className="px-5 py-3.5">Department</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Check-In</th>
                  <th className="px-5 py-3.5">Check-Out</th>
                  <th className="px-5 py-3.5">Notes / Shift Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EBF3EE] font-medium">
                {filteredRows.map((row) => (
                  <tr key={row.employee_id} className="hover:bg-[#F0F7F4]/60 transition-colors">
                    {/* Employee Profile */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-[#E8F4EE] text-[#23815F] border border-[#C5E3D5] flex items-center justify-center font-extrabold text-xs shrink-0">
                          {row.employee_name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-extrabold text-[#1D1D1B]">{row.employee_name}</div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="font-mono text-[10px] text-[#23815F] font-bold bg-[#E8F4EE] px-1.5 py-0.2 rounded">
                              {row.employee_code}
                            </span>
                            <span className="text-[11px] text-[#5E5A52]">{row.designation}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Department */}
                    <td className="px-5 py-3.5 text-[#5E5A52] font-semibold">
                      {row.department || 'Showroom Floor'}
                    </td>

                    {/* Attendance Status Dropdown */}
                    <td className="px-5 py-3.5">
                      <select
                        value={row.status}
                        onChange={(e) =>
                          updateRowField(
                            row.employee_id,
                            'status',
                            e.target.value as AttendanceRowState['status']
                          )
                        }
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border cursor-pointer outline-none transition-colors ${
                          row.status === 'Present'
                            ? 'bg-[#E8F4EE] text-[#23815F] border-[#C5E3D5]'
                            : row.status === 'Absent'
                            ? 'bg-red-50 text-red-600 border-red-200'
                            : row.status === 'Half Day'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : row.status === 'On Leave'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : 'bg-purple-50 text-purple-700 border-purple-200'
                        }`}
                      >
                        <option value="Present">🟢 Present</option>
                        <option value="Absent">🔴 Absent</option>
                        <option value="Half Day">🟡 Half Day</option>
                        <option value="On Leave">🔵 On Leave</option>
                        <option value="Late">🟣 Late Arrival</option>
                      </select>
                    </td>

                    {/* Check In */}
                    <td className="px-5 py-3.5">
                      <input
                        type="text"
                        value={row.check_in}
                        disabled={row.status === 'Absent' || row.status === 'On Leave'}
                        onChange={(e) => updateRowField(row.employee_id, 'check_in', e.target.value)}
                        placeholder="e.g. 09:30 AM"
                        className="w-28 px-2.5 py-1 input-luxury-beige rounded-lg text-xs font-mono font-semibold disabled:opacity-40 disabled:bg-gray-100"
                      />
                    </td>

                    {/* Check Out */}
                    <td className="px-5 py-3.5">
                      <input
                        type="text"
                        value={row.check_out}
                        disabled={row.status === 'Absent' || row.status === 'On Leave'}
                        onChange={(e) => updateRowField(row.employee_id, 'check_out', e.target.value)}
                        placeholder="e.g. 08:30 PM"
                        className="w-28 px-2.5 py-1 input-luxury-beige rounded-lg text-xs font-mono font-semibold disabled:opacity-40 disabled:bg-gray-100"
                      />
                    </td>

                    {/* Notes */}
                    <td className="px-5 py-3.5">
                      <input
                        type="text"
                        value={row.notes}
                        onChange={(e) => updateRowField(row.employee_id, 'notes', e.target.value)}
                        placeholder="Shift remarks, permission, etc."
                        className="w-full min-w-44 px-2.5 py-1 input-luxury-beige rounded-lg text-xs"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer with Save Action */}
          <div className="p-4 bg-[#FAF8F3] border-t border-[#C5E3D5] flex items-center justify-between">
            <span className="text-xs text-[#5E5A52] font-semibold">
              Showing {filteredRows.length} showroom employees for {selectedDate}.
            </span>
            <Button
              onClick={handleSaveAttendance}
              isLoading={isSaving}
              className="bg-gradient-to-r from-[#23815F] to-[#1B694C] hover:from-[#1B694C] hover:to-[#14533C] text-white text-xs font-extrabold px-6 py-2 rounded-xl shadow-xs cursor-pointer flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>Confirm & Save Attendance</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
