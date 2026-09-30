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
  Check,
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useToast } from '../../context/ToastContext';
import { CustomerActivity, CustomerDetailItem, Employee } from '../../types';
import { parseCustomerBreakdown } from '../../utils/customerUtils';
import api from '../../api/client';

const WhatsAppIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.664-.698c.97.53 1.83.812 2.796.813 3.179 0 5.767-2.587 5.768-5.766.001-3.181-2.587-5.766-5.768-5.766zm3.376 8.212c-.144.405-.837.774-1.17.824-.312.045-.717.067-1.168-.08-.288-.094-.658-.236-1.144-.45-2.072-.913-3.414-3.033-3.518-3.173-.104-.14-1.01-1.344-1.01-2.564 0-1.22.637-1.82.863-2.066.226-.246.495-.308.66-.308.165 0 .33.003.475.01.153.008.358-.058.56.427.207.497.708 1.724.77 1.849.062.125.104.271.021.437-.083.165-.124.27-.247.416-.124.145-.262.325-.374.436-.125.124-.255.26-.11.51.145.249.645 1.062 1.385 1.722.953.849 1.756 1.112 2.004 1.237.248.125.394.104.539-.063.145-.166.621-.726.786-.975.166-.249.331-.208.558-.125.228.083 1.446.682 1.694.807.248.124.414.186.475.29.063.104.063.602-.081 1.007zM12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.98-1.306A9.957 9.957 0 0 0 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2z" />
  </svg>
);

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
  const [sendingWhatsappIdx, setSendingWhatsappIdx] = useState<number | null>(null);
  const [isSendingWhatsappAll, setIsSendingWhatsappAll] = useState<boolean>(false);

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

  const handleSendWhatsappSingle = async (idx: number, cust: CustomerDetailItem) => {
    if (!cust.phone || !cust.phone.trim()) {
      toastError(`Please enter a valid phone number for ${cust.name || `Customer #${idx + 1}`} first.`);
      return;
    }

    if (!initialData?.id) {
      toastError('Please save the customer activity first or click "Save & Send WhatsApp".');
      return;
    }

    try {
      setSendingWhatsappIdx(idx);
      const res = await api.post(`/api/v1/customers/${initialData.id}/send-whatsapp`, {
        customer_index: idx,
      });

      if (res.data?.success) {
        success(
          `WhatsApp message dispatched to ${cust.name || 'Customer'} (${cust.phone}) via AiSensy.`
        );
      } else {
        toastError(res.data?.results?.[0]?.error || 'Failed to dispatch WhatsApp message.');
      }
    } catch (err: any) {
      console.error('Failed to send WhatsApp:', err);
      toastError(err.response?.data?.detail || 'Failed to send WhatsApp message via AiSensy.');
    } finally {
      setSendingWhatsappIdx(null);
    }
  };

  const handleSaveAndSendWhatsapp = async () => {
    const empIdToUse =
      selectedEmpId ||
      employeeId ||
      (employeesList.length > 0 ? employeesList[0].id : 0);

    if (!empIdToUse) {
      toastError('Please select a staff member.');
      return;
    }

    try {
      setIsSendingWhatsappAll(true);

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

      let savedRecordId: number | undefined;
      if (initialData) {
        const putRes = await api.put(`/api/v1/customers/${initialData.id}`, payload);
        savedRecordId = putRes.data?.id || initialData.id;
      } else {
        const postRes = await api.post('/api/v1/customers', payload);
        savedRecordId = postRes.data?.id;
      }

      if (savedRecordId) {
        try {
          const waRes = await api.post(`/api/v1/customers/${savedRecordId}/send-whatsapp`, {});
          const sentCount = waRes.data?.total_sent || 0;
          if (sentCount > 0) {
            success(`Activity saved & WhatsApp dispatched successfully to ${sentCount} customer${sentCount > 1 ? 's' : ''}!`);
          } else {
            success('Customer activity saved successfully.');
          }
        } catch (waErr: any) {
          console.warn('WhatsApp auto-send response:', waErr);
          success('Customer activity saved successfully.');
        }
      } else {
        success('Customer activity saved successfully.');
      }

      onSaved();
      onClose();
    } catch (err: any) {
      console.error('Failed to save customer activity:', err);
      toastError(
        err.response?.data?.detail || 'Failed to save customer activity.'
      );
    } finally {
      setIsSendingWhatsappAll(false);
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
        <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-2.5 w-full">
          <div className="text-[11px] text-[#737373] hidden sm:flex items-center gap-1.5 font-medium">
            <WhatsAppIcon className="w-3.5 h-3.5 text-[#25D366]" />
            <span>AiSensy WhatsApp notifications are sent to recorded customer phones</span>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting || isSendingWhatsappAll}
              className="w-full sm:w-auto text-xs"
            >
              Cancel
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSubmit}
              isLoading={isSubmitting}
              disabled={isSendingWhatsappAll}
              className="w-full sm:w-auto text-xs font-bold border-[#CBD5E1] text-[#334155] hover:bg-[#F1F5F9]"
            >
              {initialData ? 'Save Changes' : 'Save'}
            </Button>
            <button
              type="button"
              onClick={() => handleSaveAndSendWhatsapp()}
              disabled={isSubmitting || isSendingWhatsappAll}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-[#25D366] hover:bg-[#1EBE5D] active:scale-98 text-white text-xs font-bold shadow-md shadow-[#25D366]/20 transition-all cursor-pointer disabled:opacity-50"
            >
              <WhatsAppIcon className={`w-4 h-4 text-white ${isSendingWhatsappAll ? 'animate-spin' : ''}`} />
              <span>{isSendingWhatsappAll ? 'Sending WhatsApp...' : 'Save & Send WhatsApp'}</span>
            </button>
          </div>
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
                className="w-full text-xs font-semibold select-luxury-slate rounded-xl px-3 py-2 cursor-pointer"
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
              className="w-full text-xs font-bold select-luxury-slate rounded-xl px-3 py-2 cursor-pointer"
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
              className="w-full text-xs font-semibold input-luxury-beige rounded-xl px-3 py-2"
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
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-[#F0EFEA]">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-[#EDF2F7] border border-[#C5D5E6] text-[#536B8A] font-bold text-xs flex items-center justify-center">
                        #{idx + 1}
                      </span>
                      <span className="text-xs font-bold text-[#1D1D1B]">
                        Customer #{idx + 1} Details
                      </span>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Top Right Live Dynamic Badge */}
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border transition-all ${getStatusBadgeStyle(
                          item.status || 'Walkin'
                        )}`}
                      >
                        {item.status || 'Walkin'}
                      </span>

                      {/* Direct Send WhatsApp Button for this customer */}
                      {item.phone && item.phone.trim().length >= 10 && (
                        <button
                          type="button"
                          onClick={() => handleSendWhatsappSingle(idx, item)}
                          disabled={sendingWhatsappIdx === idx || isSendingWhatsappAll}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#E8F8EE] hover:bg-[#D1F2DD] border border-[#A6E7B9] text-[#1E7E34] text-[11px] font-bold transition-all cursor-pointer shadow-2xs hover:scale-[1.02] disabled:opacity-50"
                          title={`Send "${item.status || 'Walkin'}" WhatsApp message directly to ${item.phone}`}
                        >
                          <WhatsAppIcon className={`w-3.5 h-3.5 text-[#25D366] ${sendingWhatsappIdx === idx ? 'animate-spin' : ''}`} />
                          <span>{sendingWhatsappIdx === idx ? 'Sending...' : 'Send WhatsApp'}</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Customer Info Grid: Name, Phone, DOB, Anniversary (All Optional) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
                    {/* Customer Name */}
                    <div>
                      <label className="text-[11px] font-bold text-[#536B8A] mb-1 flex items-center gap-1">
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
                        className="w-full text-xs input-luxury-beige rounded-xl px-2.5 py-2"
                      />
                    </div>

                    {/* Phone Number */}
                    <div>
                      <label className="text-[11px] font-bold text-[#536B8A] mb-1 flex items-center gap-1">
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
                        className="w-full text-xs input-luxury-beige rounded-xl px-2.5 py-2"
                      />
                    </div>

                    {/* DOB (Date of Birth) */}
                    <div>
                      <label className="text-[11px] font-bold text-[#536B8A] mb-1 flex items-center gap-1">
                        <Gift className="w-3 h-3 text-[#B97855]" />
                        <span>Date of Birth (Optional)</span>
                      </label>
                      <input
                        type="date"
                        value={item.dob || ''}
                        onChange={(e) =>
                          handleCustomerFieldChange(idx, 'dob', e.target.value)
                        }
                        className="w-full text-xs input-luxury-beige rounded-xl px-2.5 py-2"
                      />
                    </div>

                    {/* Anniversary Date */}
                    <div>
                      <label className="text-[11px] font-bold text-[#536B8A] mb-1 flex items-center gap-1">
                        <Heart className="w-3 h-3 text-[#C24141]" />
                        <span>Anniversary Date (Optional)</span>
                      </label>
                      <input
                        type="date"
                        value={item.anniversary || ''}
                        onChange={(e) =>
                          handleCustomerFieldChange(idx, 'anniversary', e.target.value)
                        }
                        className="w-full text-xs input-luxury-beige rounded-xl px-2.5 py-2"
                      />
                    </div>
                  </div>

                  {/* Outcome Status, Product Value */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-0.5">
                    {/* Status Dropdown: Sold, Exchange, Lost, Walkin, In Hold / Follow Up */}
                    <div>
                      <label className="text-[11px] font-bold text-[#1D1D1B] mb-1 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-[#536B8A]" />
                        <span>Outcome / Status *</span>
                      </label>
                      <select
                        value={item.status || 'Walkin'}
                        onChange={(e) =>
                          handleCustomerFieldChange(idx, 'status', e.target.value)
                        }
                        className="w-full text-xs font-bold select-luxury-slate rounded-xl px-2.5 py-2 cursor-pointer"
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
                      <label className="text-[11px] font-bold text-[#536B8A] mb-1 flex items-center gap-1">
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
                        className="w-full text-xs input-luxury-beige rounded-xl px-2.5 py-2 font-mono"
                      />
                    </div>
                  </div>

                  {/* Specific Individual Customer Notes */}
                  <div>
                    <label className="text-[11px] font-bold text-[#536B8A] mb-1 flex items-center gap-1">
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
                      className="w-full text-xs input-luxury-beige rounded-xl px-3 py-2"
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
            className="w-full text-xs input-luxury-beige rounded-xl p-2.5 font-medium"
          />
        </div>
      </form>
    </Modal>
  );
};
