import React, { useState, useEffect } from 'react';
import {
  Users,
  Calendar,
  Phone,
  User,
  Heart,
  Gift,
  IndianRupee,
  FileText,
  CheckCircle2,
  Clock,
  XCircle,
  ArrowUpDown,
  Sparkles,
  UserCheck,
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useToast } from '../../context/ToastContext';
import { CustomerActivity, CustomerDetailItem, Employee } from '../../types';
import { parseCustomerBreakdown } from '../../utils/customerUtils';
import api from '../../api/client';

interface CustomerActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  employeeId?: number;
  employeeName?: string;
  initialData?: CustomerActivity | null;
  employeesList?: Employee[];
}

export const CustomerActivityModal: React.FC<CustomerActivityModalProps> = ({
  isOpen,
  onClose,
  onSaved,
  employeeId,
  employeeName,
  initialData,
  employeesList = [],
}) => {
  const { success, error: toastError } = useToast();

  const [selectedEmpId, setSelectedEmpId] = useState<number>(0);
  const [customerCount, setCustomerCount] = useState<number>(0);
  const [customerItems, setCustomerItems] = useState<CustomerDetailItem[]>([]);
  const [activityDate, setActivityDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [overallNotes, setOverallNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Initialize form ONLY when modal opens or initialData ID changes (prevents resetting on input/dropdown changes)
  useEffect(() => {
    if (!isOpen) return;

    if (initialData) {
      const count =
        initialData.customers_count !== undefined
          ? initialData.customers_count
          : 0;
      setSelectedEmpId(initialData.employee_id || 0);
      setCustomerCount(count);
      setActivityDate(
        initialData.activity_date || new Date().toISOString().split('T')[0]
      );
      setOverallNotes(initialData.notes || '');

      const parsedItems = parseCustomerBreakdown(
        initialData.breakdown,
        count,
        initialData.status,
        initialData.customer_name,
        initialData.phone_number,
        initialData.dob,
        initialData.anniversary,
        initialData.product_value
      );
      setCustomerItems(parsedItems);
    } else {
      const defaultEmp =
        employeeId || (employeesList.length > 0 ? employeesList[0].id : 0);
      setSelectedEmpId(defaultEmp);
      setCustomerCount(0); // Auto set to 0 customers initial
      setActivityDate(new Date().toISOString().split('T')[0]);
      setOverallNotes('');
      setCustomerItems([]);
    }
  }, [isOpen, initialData?.id]);

  const handleCustomerCountChange = (newCount: number) => {
    const validCount = Math.max(0, Math.min(20, newCount));
    setCustomerCount(validCount);

    if (validCount <= 0) {
      setCustomerItems([]);
      return;
    }

    setCustomerItems((prev) => {
      const updated = [...prev];
      if (updated.length < validCount) {
        for (let i = updated.length; i < validCount; i++) {
          updated.push({
            id: i + 1,
            name: '',
            phone: '',
            dob: '',
            anniversary: '',
            status: 'Walkin',
            product_value: '',
            notes: '',
          });
        }
      } else if (updated.length > validCount) {
        return updated.slice(0, validCount);
      }
      return updated;
    });
  };

  const handleCustomerFieldChange = (
    index: number,
    field: keyof CustomerDetailItem,
    value: any
  ) => {
    setCustomerItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'Sold':
        return 'bg-[#E8F4EE] text-[#21845F] border-[#C5E3D5]';
      case 'Exchange':
        return 'bg-[#EDF2F7] text-[#536B8A] border-[#C5D5E6]';
      case 'In Hold / Follow Up':
      case 'In Hold':
      case 'Follow Up':
        return 'bg-[#FAF1EC] text-[#B97855] border-[#ECCFC0]';
      case 'Lost':
        return 'bg-[#FDECEC] text-[#C24141] border-[#F9C3C3]';
      case 'Walkin':
      default:
        return 'bg-[#FAF8F3] text-[#8A8479] border-[#E4DFD4]';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const empIdToUse =
      selectedEmpId ||
      employeeId ||
      (employeesList.length > 0 ? employeesList[0].id : 0);

    if (!empIdToUse) {
      toastError('Please select a staff member.');
      return;
    }

    try {
      setIsSubmitting(true);

      // Determine primary status and total product value
      let primaryStatus = 'Walkin';
      let totalProductVal = 0;

      if (customerCount > 0 && customerItems.length > 0) {
        const statusCounts = customerItems.reduce(
          (acc: Record<string, number>, item) => {
            const st = item.status || 'Walkin';
            acc[st] = (acc[st] || 0) + 1;
            return acc;
          },
          {}
        );
        const priority = [
          'Sold',
          'Exchange',
          'In Hold / Follow Up',
          'In Hold',
          'Follow Up',
          'Lost',
          'Walkin',
        ];
        for (const p of priority) {
          if (statusCounts[p]) {
            primaryStatus = p;
            break;
          }
        }

        totalProductVal = customerItems.reduce((sum, item) => {
          const val = parseFloat(item.product_value?.toString() || '0');
          return sum + (isNaN(val) ? 0 : val);
        }, 0);
      }

      const firstCustomer = customerItems[0];
      const payload = {
        employee_id: empIdToUse,
        customers_count: customerCount,
        customer_name:
          firstCustomer?.name?.trim() ||
          (customerCount > 0
            ? `Customer Interaction (${customerCount})`
            : '0 Customers Attended'),
        phone_number: firstCustomer?.phone?.trim() || '',
        dob: firstCustomer?.dob || null,
        anniversary: firstCustomer?.anniversary || null,
        product_value: totalProductVal,
        activity_date: activityDate,
        status: primaryStatus,
        breakdown: JSON.stringify(customerItems),
        notes: overallNotes.trim() || null,
      };

      if (initialData) {
        await api.put(`/api/v1/customers/${initialData.id}`, payload);
        success('Customer activity updated successfully.');
      } else {
        await api.post('/api/v1/customers', payload);
        success(
          `Recorded activity for ${customerCount} customer${
            customerCount !== 1 ? 's' : ''
          }.`
        );
      }

      onSaved();
      onClose();
    } catch (err: any) {
      console.error('Failed to save customer activity:', err);
      toastError(
        err.response?.data?.detail || 'Failed to save customer activity.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit Customer Activity' : 'Record Customer Activity'}
      subtitle={
        employeeName
          ? `Log walk-ins, sales closures, and customer profiles for ${employeeName}`
          : 'Log showroom customer walk-ins, sales closures, and customer profiles'
      }
      size="xl"
      footer={
        <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5 w-full">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isSubmitting}
            className="w-full sm:w-auto text-xs"
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSubmit}
            isLoading={isSubmitting}
            className="w-full sm:w-auto bg-[#536B8A] hover:bg-[#40546D] text-white text-xs font-bold shadow-sm"
          >
            {initialData ? 'Save Changes' : 'Save Customer Activity'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Top Control Bar: Employee Selector, Customer Count Dropdown, Interaction Date */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 bg-[#FAF8F3] p-4 rounded-2xl border border-[#E4DFD4]">
          {/* 1. Employee Selector */}
          {!employeeId && employeesList.length > 0 ? (
            <div>
              <label className="block text-xs font-bold text-[#1D1D1B] mb-1.5">
                Staff / Employee *
              </label>
              <select
                value={selectedEmpId}
                onChange={(e) => setSelectedEmpId(parseInt(e.target.value, 10))}
                className="w-full text-xs font-semibold bg-white border border-[#C5D5E6] rounded-xl px-3 py-2 text-[#1D1D1B] focus:outline-none focus:border-[#536B8A]"
                required
              >
                {employeesList.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.full_name} ({emp.employee_code})
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-bold text-[#1D1D1B] mb-1.5">
                Staff Attending
              </label>
              <div className="text-xs font-bold text-[#536B8A] bg-[#EDF2F7] border border-[#C5D5E6] rounded-xl px-3 py-2 truncate">
                {employeeName || 'Assigned Staff'}
              </div>
            </div>
          )}

          {/* 2. Customer Count Dropdown (Starts from 0) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-[#1D1D1B]">
                Customers Attended *
              </label>
              <span className="text-[10px] font-bold text-[#536B8A]">
                {customerCount === 0 ? '0 (No Walk-in)' : `${customerCount} Selected`}
              </span>
            </div>
            <select
              value={customerCount}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                handleCustomerCountChange(isNaN(val) ? 0 : val);
              }}
              className="w-full text-xs font-bold bg-white border border-[#C5D5E6] rounded-xl px-3 py-2 text-[#1D1D1B] focus:outline-none focus:border-[#536B8A] cursor-pointer"
            >
              <option value={0}>0 Customers (No Walk-in)</option>
              {Array.from({ length: 20 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {i + 1} Customer{i > 0 ? 's' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* 3. Interaction Date */}
          <div>
            <label className="block text-xs font-bold text-[#1D1D1B] mb-1.5">
              Interaction Date *
            </label>
            <input
              type="date"
              value={activityDate}
              onChange={(e) => setActivityDate(e.target.value)}
              className="w-full text-xs font-semibold bg-white border border-[#C5D5E6] rounded-xl px-3 py-2 text-[#1D1D1B] focus:outline-none focus:border-[#536B8A]"
              required
            />
          </div>
        </div>

        {/* Dynamic Individual Customer Cards */}
        {customerCount === 0 ? (
          <div className="p-6 rounded-2xl bg-[#FAF8F3] border border-[#E4DFD4] text-center space-y-2">
            <div className="w-10 h-10 rounded-xl bg-[#EDF2F7] border border-[#C5D5E6] flex items-center justify-center mx-auto text-[#536B8A]">
              <Users className="w-5 h-5" />
            </div>
            <p className="text-xs font-bold text-[#1D1D1B]">0 Customers Recorded</p>
            <p className="text-[11px] text-[#8A8479] max-w-sm mx-auto">
              Select <strong>1 or more customers</strong> from the dropdown above to enter individual customer details, DOB, anniversary, outcome status, and notes.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-[#E4DFD4] pb-2">
              <h4 className="text-xs font-bold text-[#1D1D1B] uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-4 h-4 text-[#536B8A]" />
                <span>Customer Information & Outcome Breakdown ({customerItems.length})</span>
              </h4>
              <span className="text-[11px] text-[#8A8479] font-medium">
                All individual customer fields below are optional
              </span>
            </div>

            <div className="space-y-3">
              {customerItems.map((item, idx) => (
                <div
                  key={item.id || idx}
                  className="bg-white border border-[#E4DFD4] hover:border-[#536B8A] rounded-2xl p-4 shadow-[0_4px_18px_rgba(40,35,25,0.045)] space-y-3 relative transition-all"
                >
                  {/* Card Header with Customer Number & Status Badge */}
                  <div className="flex items-center justify-between pb-2.5 border-b border-[#F0EFEA]">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-[#EDF2F7] border border-[#C5D5E6] text-[#536B8A] font-bold text-xs flex items-center justify-center">
                        #{idx + 1}
                      </span>
                      <span className="text-xs font-bold text-[#1D1D1B]">
                        Customer #{idx + 1} Details
                      </span>
                    </div>

                    {/* Top Right Live Dynamic Badge */}
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border transition-all ${getStatusBadgeStyle(
                        item.status || 'Walkin'
                      )}`}
                    >
                      {item.status || 'Walkin'}
                    </span>
                  </div>

                  {/* Customer Info Grid: Name, Phone, DOB, Anniversary (All Optional) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
                    {/* Customer Name */}
                    <div>
                      <label className="block text-[11px] font-bold text-[#536B8A] mb-1 flex items-center gap-1">
                        <User className="w-3 h-3 text-[#8A8479]" />
                        <span>Customer Name (Optional)</span>
                      </label>
                      <input
                        type="text"
                        value={item.name || ''}
                        onChange={(e) =>
                          handleCustomerFieldChange(idx, 'name', e.target.value)
                        }
                        placeholder="e.g. Ramesh Kumar"
                        className="w-full text-xs bg-[#FAF8F3] border border-[#E4DFD4] rounded-xl px-2.5 py-2 text-[#1D1D1B] placeholder-[#8A8479] focus:bg-white focus:outline-none focus:border-[#536B8A]"
                      />
                    </div>

                    {/* Phone Number */}
                    <div>
                      <label className="block text-[11px] font-bold text-[#536B8A] mb-1 flex items-center gap-1">
                        <Phone className="w-3 h-3 text-[#8A8479]" />
                        <span>Phone Number (Optional)</span>
                      </label>
                      <input
                        type="tel"
                        value={item.phone || ''}
                        onChange={(e) =>
                          handleCustomerFieldChange(idx, 'phone', e.target.value)
                        }
                        placeholder="e.g. 9876543210"
                        className="w-full text-xs bg-[#FAF8F3] border border-[#E4DFD4] rounded-xl px-2.5 py-2 text-[#1D1D1B] placeholder-[#8A8479] focus:bg-white focus:outline-none focus:border-[#536B8A]"
                      />
                    </div>

                    {/* DOB (Date of Birth) */}
                    <div>
                      <label className="block text-[11px] font-bold text-[#536B8A] mb-1 flex items-center gap-1">
                        <Gift className="w-3 h-3 text-[#B97855]" />
                        <span>Date of Birth (Optional)</span>
                      </label>
                      <input
                        type="date"
                        value={item.dob || ''}
                        onChange={(e) =>
                          handleCustomerFieldChange(idx, 'dob', e.target.value)
                        }
                        className="w-full text-xs bg-[#FAF8F3] border border-[#E4DFD4] rounded-xl px-2.5 py-2 text-[#1D1D1B] focus:bg-white focus:outline-none focus:border-[#536B8A]"
                      />
                    </div>

                    {/* Anniversary Date */}
                    <div>
                      <label className="block text-[11px] font-bold text-[#536B8A] mb-1 flex items-center gap-1">
                        <Heart className="w-3 h-3 text-[#C24141]" />
                        <span>Anniversary Date (Optional)</span>
                      </label>
                      <input
                        type="date"
                        value={item.anniversary || ''}
                        onChange={(e) =>
                          handleCustomerFieldChange(idx, 'anniversary', e.target.value)
                        }
                        className="w-full text-xs bg-[#FAF8F3] border border-[#E4DFD4] rounded-xl px-2.5 py-2 text-[#1D1D1B] focus:bg-white focus:outline-none focus:border-[#536B8A]"
                      />
                    </div>
                  </div>

                  {/* Outcome Status, Product Value */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-0.5">
                    {/* Status Dropdown: Sold, Exchange, Lost, Walkin, In Hold / Follow Up */}
                    <div>
                      <label className="block text-[11px] font-bold text-[#1D1D1B] mb-1 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-[#536B8A]" />
                        <span>Outcome / Status *</span>
                      </label>
                      <select
                        value={item.status || 'Walkin'}
                        onChange={(e) =>
                          handleCustomerFieldChange(idx, 'status', e.target.value)
                        }
                        className="w-full text-xs font-bold bg-white border border-[#C5D5E6] rounded-xl px-2.5 py-2 text-[#1D1D1B] focus:outline-none focus:border-[#536B8A] cursor-pointer"
                      >
                        <option value="Sold">Sold (Purchased / Closed)</option>
                        <option value="Exchange">Exchange (Gold / Diamond Exchange)</option>
                        <option value="In Hold / Follow Up">In Hold / Follow Up (Item on Hold / Callback)</option>
                        <option value="Walkin">Walkin (General Inquiry / Browsing)</option>
                        <option value="Lost">Lost (Not Interested / Left)</option>
                      </select>
                    </div>

                    {/* Product Value (₹) */}
                    <div>
                      <label className="block text-[11px] font-bold text-[#536B8A] mb-1 flex items-center gap-1">
                        <IndianRupee className="w-3 h-3 text-[#21845F]" />
                        <span>Value of Product (₹, Optional)</span>
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={item.product_value || ''}
                        onChange={(e) =>
                          handleCustomerFieldChange(
                            idx,
                            'product_value',
                            e.target.value
                          )
                        }
                        placeholder="e.g. 45000"
                        className="w-full text-xs bg-[#FAF8F3] border border-[#E4DFD4] rounded-xl px-2.5 py-2 font-mono text-[#1D1D1B] placeholder-[#8A8479] focus:bg-white focus:outline-none focus:border-[#536B8A]"
                      />
                    </div>
                  </div>

                  {/* Specific Individual Customer Notes */}
                  <div>
                    <label className="block text-[11px] font-bold text-[#536B8A] mb-1 flex items-center gap-1">
                      <FileText className="w-3 h-3 text-[#536B8A]" />
                      <span>Customer Notes / Inquired Item Details (Optional)</span>
                    </label>
                    <input
                      type="text"
                      value={item.notes || ''}
                      onChange={(e) =>
                        handleCustomerFieldChange(idx, 'notes', e.target.value)
                      }
                      placeholder="e.g. Looked at 22kt antique gold necklace, asked for festival discount & exchange estimate"
                      className="w-full text-xs bg-[#FAF8F3] border border-[#E4DFD4] rounded-xl px-3 py-2 text-[#1D1D1B] placeholder-[#8A8479] focus:bg-white focus:outline-none focus:border-[#536B8A]"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Overall General Activity Notes */}
        <div>
          <label className="block text-xs font-bold text-[#1D1D1B] mb-1.5">
            General Floor Remarks (Optional)
          </label>
          <textarea
            rows={2}
            value={overallNotes}
            onChange={(e) => setOverallNotes(e.target.value)}
            placeholder="e.g. High footfall evening drive; customer booked auspicious wedding jewellery on hold"
            className="w-full text-xs bg-white border border-[#E4DFD4] rounded-xl p-2.5 text-[#1D1D1B] placeholder:text-[#8A8479] focus:outline-none focus:border-[#536B8A] focus:ring-2 focus:ring-[#536B8A]/20 font-medium"
          />
        </div>
      </form>
    </Modal>
  );
};
