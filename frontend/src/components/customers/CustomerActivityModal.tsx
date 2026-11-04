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
  Award,
  Star,
  MessageSquareHeart,
  UploadCloud,
  Trash2,
  Eye,
  Loader2,
  Video,
  Plus,
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useToast } from '../../context/ToastContext';
import { CustomerActivity, CustomerDetailItem, Employee } from '../../types';
import { parseCustomerBreakdown } from '../../utils/customerUtils';
import { SCHEMES, DEFAULT_SCHEME } from '../../constants/schemes';
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
  apiBaseUrl?: string;
  defaultCustomerCount?: number;
}

export const CustomerActivityModal: React.FC<CustomerActivityModalProps> = ({
  isOpen,
  onClose,
  onSaved,
  employeeId,
  employeeName,
  initialData,
  employeesList = [],
  apiBaseUrl = '/api/v1/customers',
  defaultCustomerCount,
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
  const [uploadingGoogleProofIdx, setUploadingGoogleProofIdx] = useState<number | null>(null);
  const [previewProofUrl, setPreviewProofUrl] = useState<string | null>(null);
  const [uploadingVideoProofIdx, setUploadingVideoProofIdx] = useState<number | null>(null);

  const handleDeleteCustomerColumn = (idx: number) => {
    setCustomerItems((prev) => {
      const updated = prev.filter((_, i) => i !== idx).map((item, i) => ({ ...item, id: i + 1 }));
      setCustomerCount(updated.length);
      return updated;
    });
  };

  const handleVideoProofUpload = async (idx: number, file: File) => {
    if (!file) return;
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type.toLowerCase())) {
      toastError('Please upload a valid image (PNG, JPG, or WebP).');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toastError('Image file size must be less than 10MB.');
      return;
    }

    try {
      setUploadingVideoProofIdx(idx);
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post('/api/v1/video-reviews/upload-screenshot', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const url = res.data.screenshot_url || res.data.photo_url || res.data.url;
      handleCustomerFieldChange(idx, 'video_screenshot', url);
      success('Video review photo proof attached.');
    } catch (err: any) {
      console.error('Failed to upload video proof:', err);
      toastError(err.response?.data?.detail || 'Failed to upload photo proof.');
    } finally {
      setUploadingVideoProofIdx(null);
    }
  };

  // Initialize form ONLY when modal opens or initialData ID changes (prevents resetting on input/dropdown changes)
  useEffect(() => {
    if (!isOpen) return;

    if (initialData) {
      const count =
        initialData.customers_count !== undefined
          ? initialData.customers_count
          : 1;
      setSelectedEmpId(initialData.employee_id || employeeId || 0);
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
      const startCount = defaultCustomerCount !== undefined ? defaultCustomerCount : 0;
      setCustomerCount(startCount);
      setActivityDate(new Date().toISOString().split('T')[0]);
      setOverallNotes('');
      if (startCount > 0) {
        setCustomerItems(
          Array.from({ length: startCount }, (_, i) => ({
            id: i + 1,
            name: '',
            phone: '',
            dob: '',
            anniversary: '',
            status: 'Walkin',
            product_id: '',
            product_value: '',
            notes: '',
            has_scheme: false,
            scheme_name: '',
            scheme_amount: '',
            has_google_review: false,
            google_review_rating: 5,
            google_review_text: '',
            google_review_screenshot: '',
            has_video_review: false,
            videos_count: 1,
            video_title: '',
            video_url: '',
            video_screenshot: '',
            has_customer_feedback: false,
            feedback_rating: 5,
            feedback_text: '',
          }))
        );
      } else {
        setCustomerItems([]);
      }
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
            product_id: '',
            product_value: '',
            notes: '',
            has_scheme: false,
            scheme_name: '',
            scheme_amount: '',
            has_google_review: false,
            google_review_rating: 5,
            google_review_text: '',
            google_review_screenshot: '',
            has_video_review: false,
            videos_count: 1,
            video_title: '',
            video_url: '',
            video_screenshot: '',
            has_customer_feedback: false,
            feedback_rating: 5,
            feedback_text: '',
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

  const handleGoogleProofUpload = async (idx: number, file: File) => {
    if (!file) return;
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type.toLowerCase())) {
      toastError('Please upload a valid image (PNG, JPG, or WebP).');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toastError('Image file size must be less than 10MB.');
      return;
    }

    try {
      setUploadingGoogleProofIdx(idx);
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post('/api/v1/google-reviews/upload-screenshot', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const url = res.data.screenshot_url || res.data.photo_url || res.data.url;
      handleCustomerFieldChange(idx, 'google_review_screenshot', url);
      success('Google review photo proof attached.');
    } catch (err: any) {
      console.error('Failed to upload review screenshot:', err);
      toastError(err.response?.data?.detail || 'Failed to upload photo proof.');
    } finally {
      setUploadingGoogleProofIdx(null);
    }
  };


  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'Sold':
        return 'bg-[#E8F4EE] text-[#21845F] border-[#C5E3D5]';
      case 'Exchange':
        return 'bg-[#EDF2F7] text-[#536B8A] border-[#C5D5E6]';
      case 'Interested':
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

  const isEmployeePortal = apiBaseUrl.includes('/employee/');

  const handleSendWhatsappSingle = async (idx: number, cust: CustomerDetailItem) => {
    if (!cust.phone || !cust.phone.trim()) {
      toastError(`Please enter a valid phone number for ${cust.name || `Customer #${idx + 1}`} first.`);
      return;
    }

    if (isEmployeePortal && (!initialData?.id || initialData.approval_status !== 'APPROVED')) {
      toastError(
        'WhatsApp message will be sent automatically once your Showroom Manager approves this customer activity. Click "Save & Send WhatsApp" below to queue it.'
      );
      return;
    }

    if (!initialData?.id) {
      toastError('Please save the customer activity first or click "Save & Send WhatsApp".');
      return;
    }

    try {
      setSendingWhatsappIdx(idx);
      const res = await api.post(`${apiBaseUrl}/${initialData.id}/send-whatsapp`, {
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

  const buildPayload = (
    empId: number,
    primaryStatus: string,
    totalVal: number,
    itemsToUse: CustomerDetailItem[] = customerItems,
    notesToUse: string = overallNotes
  ) => {
    const firstCustomer = itemsToUse[0];
    const customerNameClean =
      firstCustomer?.name?.trim() ||
      (customerCount > 0
        ? `Customer Interaction (${customerCount})`
        : 'Customer Interaction');

    const phoneClean = firstCustomer?.phone ? firstCustomer.phone.trim() : '';
    const dobClean =
      firstCustomer?.dob && firstCustomer.dob.trim()
        ? firstCustomer.dob.trim().split('T')[0]
        : null;
    const annivClean =
      firstCustomer?.anniversary && firstCustomer.anniversary.trim()
        ? firstCustomer.anniversary.trim().split('T')[0]
        : null;

    return {
      employee_id: empId,
      customers_count: itemsToUse.length,
      customer_name: customerNameClean,
      phone_number: phoneClean,
      dob: dobClean,
      anniversary: annivClean,
      product_value: typeof totalVal === 'number' && !isNaN(totalVal) ? totalVal : 0,
      activity_date: activityDate && activityDate.trim() ? activityDate.trim() : new Date().toISOString().split('T')[0],
      status: primaryStatus || 'Walkin',
      breakdown: JSON.stringify(itemsToUse),
      notes: notesToUse && notesToUse.trim() ? notesToUse.trim() : null,
    };
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

    if (customerCount <= 0 || customerItems.length === 0) {
      toastError('Please select at least 1 customer to send WhatsApp messages.');
      return;
    }

    for (let i = 0; i < customerItems.length; i++) {
      const item = customerItems[i];
      if (item.has_google_review && !item.google_review_screenshot?.trim()) {
        toastError(`Please upload photo proof for customer ${item.name ? `"${item.name}"` : `#${i + 1}`} Google review.`);
        return;
      }
      if (item.has_video_review && !item.video_screenshot?.trim()) {
        toastError(`Please upload photo proof for customer ${item.name ? `"${item.name}"` : `#${i + 1}`} Video review.`);
        return;
      }
    }

    const hasValidPhone = customerItems.some(
      (c) => c.phone && c.phone.trim().replace(/\D/g, '').length >= 10
    );
    if (!hasValidPhone) {
      toastError('Please enter at least one 10-digit mobile number to send WhatsApp message.');
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
          'Interested',
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

      if (isEmployeePortal) {
        // Employee saving: WhatsApp will NOT be sent now, but queued for dispatch when Showroom Manager approves!
        const queuedItems = customerItems.map((item) => ({
          ...item,
          send_whatsapp_on_approval: Boolean(item.phone && item.phone.trim().replace(/\D/g, '').length >= 10),
          queued_whatsapp: true,
        }));

        let queuedNotes = overallNotes.replace(/\[WhatsApp Dispatch Queued on Manager Approval\]/g, '').trim();
        queuedNotes = (queuedNotes ? `${queuedNotes}\n` : '') + '[WhatsApp Dispatch Queued on Manager Approval]';

        const payload = buildPayload(empIdToUse, primaryStatus, totalProductVal, queuedItems, queuedNotes);

        if (initialData) {
          await api.put(`${apiBaseUrl}/${initialData.id}`, payload);
        } else {
          await api.post(apiBaseUrl, payload);
        }

        success(
          'Customer interaction submitted! WhatsApp message is queued and will be sent automatically once your Showroom Manager approves.'
        );
      } else {
        // Manager saving: auto-approved, so dispatch WhatsApp immediately!
        const payload = buildPayload(empIdToUse, primaryStatus, totalProductVal, customerItems, overallNotes);

        let savedRecordId: number | undefined;
        if (initialData) {
          const putRes = await api.put(`${apiBaseUrl}/${initialData.id}`, payload);
          savedRecordId = putRes.data?.id || initialData.id;
        } else {
          const postRes = await api.post(apiBaseUrl, payload);
          savedRecordId = postRes.data?.id;
        }

        if (savedRecordId) {
          try {
            const waRes = await api.post(`${apiBaseUrl}/${savedRecordId}/send-whatsapp`, {});
            const sentCount = waRes.data?.total_sent || 0;
            if (sentCount > 0) {
              success(`Activity saved & WhatsApp dispatched successfully to ${sentCount} customer${sentCount > 1 ? 's' : ''}!`);
            } else {
              success('Customer activity saved successfully.');
            }
          } catch (waErr: any) {
            console.warn('WhatsApp auto-send response:', waErr);
            if (waErr.response?.status === 404) {
              toastError('Customer activity saved. Note: production backend service needs to be updated & restarted to enable WhatsApp dispatch.');
            } else {
              const waDetail = waErr.response?.data?.detail;
              toastError(waDetail ? `Saved, but WhatsApp failed: ${waDetail}` : 'Customer activity saved successfully.');
            }
          }
        } else {
          success('Customer activity saved successfully.');
        }
      }

      onSaved();
      onClose();
    } catch (err: any) {
      console.error('Failed to save customer activity:', err);
      const detail = err.response?.data?.detail;
      const errors = err.response?.data?.errors;
      if (typeof detail === 'string') {
        toastError(detail);
      } else if (Array.isArray(detail)) {
        const msg = detail.map((d: any) => `${d.loc?.slice(-1)[0] || 'Field'}: ${d.msg}`).join('; ');
        toastError(msg || 'Server validation failed.');
      } else if (Array.isArray(errors)) {
        const msg = errors.map((d: any) => `${d.loc?.slice(-1)[0] || 'Field'}: ${d.msg}`).join('; ');
        toastError(msg || 'Server validation failed.');
      } else {
        toastError(err.message || 'Failed to save customer activity.');
      }
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

    for (let i = 0; i < customerItems.length; i++) {
      const item = customerItems[i];
      if (item.has_google_review && !item.google_review_screenshot?.trim()) {
        toastError(`Please upload photo proof for customer ${item.name ? `"${item.name}"` : `#${i + 1}`} Google review.`);
        return;
      }
      if (item.has_video_review && !item.video_screenshot?.trim()) {
        toastError(`Please upload photo proof for customer ${item.name ? `"${item.name}"` : `#${i + 1}`} Video review.`);
        return;
      }
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
          'Interested',
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

      const payload = buildPayload(empIdToUse, primaryStatus, totalProductVal);

      if (initialData) {
        await api.put(`${apiBaseUrl}/${initialData.id}`, payload);
        success('Customer activity updated successfully.');
      } else {
        await api.post(apiBaseUrl, payload);
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
      const detail = err.response?.data?.detail;
      const errors = err.response?.data?.errors;
      if (typeof detail === 'string') {
        toastError(detail);
      } else if (Array.isArray(detail)) {
        const msg = detail.map((d: any) => `${d.loc?.slice(-1)[0] || 'Field'}: ${d.msg}`).join('; ');
        toastError(msg || 'Server validation failed.');
      } else if (Array.isArray(errors)) {
        const msg = errors.map((d: any) => `${d.loc?.slice(-1)[0] || 'Field'}: ${d.msg}`).join('; ');
        toastError(msg || 'Server validation failed.');
      } else {
        toastError(err.message || 'Failed to save customer activity.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
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
        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 w-full">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isSubmitting || isSendingWhatsappAll}
            className="w-full sm:w-auto px-4 py-2 text-xs font-semibold whitespace-nowrap justify-center"
          >
            Cancel
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSubmit}
            isLoading={isSubmitting}
            disabled={isSendingWhatsappAll}
            className="w-full sm:w-auto px-4 py-2 text-xs font-bold border-[#CBD5E1] text-[#334155] hover:bg-[#F1F5F9] whitespace-nowrap justify-center"
          >
            {initialData ? 'Save Changes' : 'Save'}
          </Button>
          <button
            type="button"
            onClick={() => handleSaveAndSendWhatsapp()}
            disabled={isSubmitting || isSendingWhatsappAll}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-[#25D366] hover:bg-[#1EBE5D] active:scale-98 text-white text-xs font-bold shadow-md shadow-[#25D366]/20 transition-all cursor-pointer disabled:opacity-50 whitespace-nowrap"
          >
            <WhatsAppIcon className={`w-4 h-4 text-white shrink-0 ${isSendingWhatsappAll ? 'animate-spin' : ''}`} />
            <span className="whitespace-nowrap">{isSendingWhatsappAll ? 'Sending WhatsApp...' : 'Save & Send WhatsApp'}</span>
          </button>
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E4DFD4] pb-2">
              <h4 className="text-xs font-bold text-[#1D1D1B] uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-4 h-4 text-[#536B8A]" />
                <span>Customer Columns ({customerItems.length})</span>
              </h4>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleCustomerCountChange(customerItems.length + 1)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#FAF5FF] hover:bg-[#F3E8FF] border border-[#D8B4FE] text-[#7E22CE] text-xs font-bold transition-all cursor-pointer shadow-2xs hover:scale-[1.02]"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Add Customer Column</span>
                </button>
              </div>
            </div>

            <div className={`grid gap-4 ${customerItems.length > 1 ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
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

                      {/* Delete Customer Column Button */}
                      <button
                        type="button"
                        onClick={() => handleDeleteCustomerColumn(idx)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-50 hover:bg-red-100 border border-red-200 text-[#C24141] hover:text-red-700 text-[11px] font-bold transition-all cursor-pointer shadow-2xs"
                        title={`Delete Customer #${idx + 1} column`}
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-600" />
                        <span>Delete Column</span>
                      </button>
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

                  {/* Outcome Status, Product ID & Product Value */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-0.5">
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
                        <option value="Interested">Interested (Interested / In Hold / Callback)</option>
                        <option value="Lost">Lost (Not Interested / Left)</option>
                        <option value="Exchange">Exchange (Gold / Diamond / Silver Exchange)</option>
                        <option value="In Hold / Follow Up">In Hold / Follow Up</option>
                        <option value="Walkin">Walkin (General Inquiry / Browsing)</option>
                      </select>
                    </div>

                    {/* Product ID / Tag */}
                    <div>
                      <label className="text-[11px] font-bold text-[#536B8A] mb-1 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-[#D97706]" />
                        <span>Product ID / Code (Optional)</span>
                      </label>
                      <input
                        type="text"
                        value={item.product_id || ''}
                        onChange={(e) =>
                          handleCustomerFieldChange(idx, 'product_id', e.target.value)
                        }
                        placeholder="e.g. 22KT-NK-101"
                        className="w-full text-xs input-luxury-beige rounded-xl px-2.5 py-2 font-mono uppercase"
                      />
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

                  {/* 1. Jewellery Savings Schemes (3 Schemes + None to Deselect) */}
                  <div className="p-3 rounded-xl bg-[#FAF8F3] border border-[#E8E4D9] space-y-2.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-[#1D1D1B] flex items-center gap-1.5">
                        <Award className="w-4 h-4 text-[#D97706]" />
                        <span>Jewellery Savings Scheme (Optional)</span>
                      </label>
                      {item.scheme_name && (
                        <button
                          type="button"
                          onClick={() => {
                            handleCustomerFieldChange(idx, 'scheme_name', '');
                            handleCustomerFieldChange(idx, 'has_scheme', false);
                            handleCustomerFieldChange(idx, 'scheme_amount', '');
                          }}
                          className="text-[10px] font-bold text-[#DC2626] hover:underline cursor-pointer"
                        >
                          ✕ Deselect Scheme
                        </button>
                      )}
                    </div>

                    {/* Quick Selection Pills with None */}
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          handleCustomerFieldChange(idx, 'scheme_name', '');
                          handleCustomerFieldChange(idx, 'has_scheme', false);
                          handleCustomerFieldChange(idx, 'scheme_amount', '');
                        }}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                          !item.scheme_name
                            ? 'bg-[#1D1D1B] text-white shadow-xs'
                            : 'bg-white border border-[#E4DFD4] text-[#5E5A52] hover:bg-[#F5F2EB]'
                        }`}
                      >
                        None
                      </button>
                      {SCHEMES.map((sch) => {
                        const isSelected = item.scheme_name === sch;
                        return (
                          <button
                            key={sch}
                            type="button"
                            onClick={() => {
                              handleCustomerFieldChange(idx, 'scheme_name', sch);
                              handleCustomerFieldChange(idx, 'has_scheme', true);
                            }}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-[#D97706] text-white shadow-xs'
                                : 'bg-white border border-[#E4DFD4] text-[#5E5A52] hover:bg-[#F5F2EB]'
                            }`}
                          >
                            {isSelected ? '✓ ' : ''}{sch}
                          </button>
                        );
                      })}
                    </div>

                    <select
                      value={item.scheme_name || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        handleCustomerFieldChange(idx, 'scheme_name', val);
                        handleCustomerFieldChange(idx, 'has_scheme', Boolean(val));
                        if (!val) handleCustomerFieldChange(idx, 'scheme_amount', '');
                      }}
                      className="w-full text-xs font-semibold select-luxury-slate rounded-xl px-3 py-2 cursor-pointer"
                    >
                      <option value="">None (No Scheme / Deselect)</option>
                      {SCHEMES.map((sch) => (
                        <option key={sch} value={sch}>
                          {sch}
                        </option>
                      ))}
                    </select>

                    {item.scheme_name && (
                      <div className="pt-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                        <div className="flex-1">
                          <label className="text-[11px] font-bold text-[#536B8A] mb-1 block">
                            Monthly Contribution Amount (₹, Optional)
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={item.scheme_amount || ''}
                            onChange={(e) =>
                              handleCustomerFieldChange(idx, 'scheme_amount', e.target.value)
                            }
                            placeholder="e.g. 5000"
                            className="w-full text-xs input-luxury-beige rounded-xl px-2.5 py-1.5 font-mono"
                          />
                        </div>
                        <span className="self-start sm:self-end text-[10px] font-bold px-2.5 py-1.5 rounded-full bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]">
                          ✨ {item.scheme_name} Enrolled
                        </span>
                      </div>
                    )}
                  </div>

                  {/* 2. Google Reviews Section for This Customer */}
                  <div className="p-3 rounded-xl bg-[#FAF9F6] border border-[#E8E6E1] space-y-2.5">
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={item.has_google_review || false}
                          onChange={(e) =>
                            handleCustomerFieldChange(idx, 'has_google_review', e.target.checked)
                          }
                          className="w-4 h-4 rounded text-[#536B8A] focus:ring-[#536B8A] border-[#CBD5E1] cursor-pointer"
                        />
                        <span className="text-xs font-bold text-[#1D1D1B] flex items-center gap-1.5">
                          <Star className="w-4 h-4 text-[#F59E0B] fill-[#F59E0B]" />
                          <span>Google Review Received</span>
                        </span>
                      </label>
                      {item.has_google_review && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]">
                          ⭐ {item.google_review_rating || 5}★ Google Review
                        </span>
                      )}
                    </div>

                    {item.has_google_review && (
                      <div className="space-y-2 pt-1">
                        <div className="flex items-center gap-2">
                          <label className="text-[11px] font-bold text-[#536B8A]">Rating:</label>
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                type="button"
                                onClick={() =>
                                  handleCustomerFieldChange(idx, 'google_review_rating', star)
                                }
                                className="p-1 sm:p-0.5 hover:scale-110 transition-transform cursor-pointer min-w-[28px] min-h-[28px] flex items-center justify-center"
                              >
                                <Star
                                  className={`w-4 h-4 ${
                                    star <= (item.google_review_rating || 5)
                                      ? 'fill-[#F59E0B] text-[#F59E0B]'
                                      : 'text-[#D4D4D8]'
                                  }`}
                                />
                              </button>
                            ))}
                            <span className="text-xs font-bold text-[#F59E0B] ml-1">
                              {item.google_review_rating || 5} Stars
                            </span>
                          </div>
                        </div>

                        <input
                          type="text"
                          value={item.google_review_text || ''}
                          onChange={(e) =>
                            handleCustomerFieldChange(idx, 'google_review_text', e.target.value)
                          }
                          placeholder="e.g. Excellent service by staff, great hospitality and collection!"
                          className="w-full text-xs input-luxury-beige rounded-xl px-2.5 py-1.5"
                        />

                        {/* Screenshot Proof Upload for Google Review */}
                        <div className="pt-2 border-t border-[#EAE6DF]">
                          <label className="block text-[11px] font-bold text-[#536B8A] mb-1 flex items-center justify-between">
                            <span className="flex items-center gap-1">
                              <span>Upload Photo Proof</span>
                              <span className="text-red-500 font-extrabold">*</span>
                            </span>
                            <span className="text-[10px] text-[#D97706] font-bold">Required for Point Verification</span>
                          </label>

                          {item.google_review_screenshot ? (
                            <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white border border-[#E2E8F0] shadow-2xs">
                              <img
                                src={item.google_review_screenshot}
                                alt="Review Photo Proof"
                                className="w-12 h-12 rounded-lg object-cover border border-[#CBD5E1] shrink-0 cursor-pointer hover:opacity-90"
                                onClick={() => setPreviewProofUrl(item.google_review_screenshot || null)}
                              />
                              <div className="flex-1 min-w-0">
                                <span className="text-xs font-bold text-[#1D1D1B] truncate block">
                                  Photo Proof Attached
                                </span>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <button
                                    type="button"
                                    onClick={() => setPreviewProofUrl(item.google_review_screenshot || null)}
                                    className="text-[11px] text-[#2563EB] hover:underline flex items-center gap-1 font-bold cursor-pointer"
                                  >
                                    <Eye className="w-3 h-3" />
                                    <span>View Proof</span>
                                  </button>
                                  <span className="text-gray-300">•</span>
                                  <button
                                    type="button"
                                    onClick={() => handleCustomerFieldChange(idx, 'google_review_screenshot', '')}
                                    className="text-[11px] text-red-600 hover:underline flex items-center gap-1 font-bold cursor-pointer"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                    <span>Change / Remove</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <label className="border-2 border-dashed border-[#CBD5E1] hover:border-[#D97706] hover:bg-[#FAF8F5] rounded-xl p-3 flex flex-col items-center justify-center cursor-pointer bg-white transition-all">
                              {uploadingGoogleProofIdx === idx ? (
                                <div className="flex items-center gap-2 text-xs text-[#D97706] font-bold py-1">
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                  <span>Uploading photo proof...</span>
                                </div>
                              ) : (
                                <>
                                  <UploadCloud className="w-5 h-5 text-[#D97706] mb-0.5" />
                                  <span className="text-xs font-bold text-[#1D1D1B]">Attach Review Photo Proof</span>
                                  <span className="text-[10px] text-[#8A8479]">PNG, JPG, or WebP (Max 10MB)</span>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    disabled={uploadingGoogleProofIdx === idx}
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                        handleGoogleProofUpload(idx, file);
                                      }
                                    }}
                                  />
                                </>
                              )}
                            </label>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 2b. Video Review Section for This Customer (5 Points per Video) */}
                  <div className="p-3 rounded-xl bg-[#FAF5FF] border border-[#E9D5FF] space-y-2.5">
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={item.has_video_review || false}
                          onChange={(e) =>
                            handleCustomerFieldChange(idx, 'has_video_review', e.target.checked)
                          }
                          className="w-4 h-4 rounded text-[#7E22CE] focus:ring-[#7E22CE] border-[#CBD5E1] cursor-pointer"
                        />
                        <span className="text-xs font-bold text-[#1D1D1B] flex items-center gap-1.5">
                          <Video className="w-4 h-4 text-[#7E22CE]" />
                          <span>Customer Video Review Recorded</span>
                        </span>
                      </label>
                      {item.has_video_review && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#F3E8FF] text-[#7E22CE] border border-[#D8B4FE]">
                          🎬 {item.videos_count || 1} Video(s) • {(item.videos_count || 1) * 5} Points
                        </span>
                      )}
                    </div>

                    {item.has_video_review && (
                      <div className="space-y-2 pt-1">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div>
                            <label className="text-[11px] font-bold text-[#536B8A] mb-1 block">
                              Number of Videos (5 pts per video) *
                            </label>
                            <select
                              value={item.videos_count || 1}
                              onChange={(e) =>
                                handleCustomerFieldChange(idx, 'videos_count', parseInt(e.target.value, 10))
                              }
                              className="w-full text-xs font-bold select-luxury-slate rounded-xl px-2.5 py-1.5 cursor-pointer"
                            >
                              <option value={1}>1 Video Review (+5 Points)</option>
                              <option value={2}>2 Video Reviews (+10 Points)</option>
                              <option value={3}>3 Video Reviews (+15 Points)</option>
                              <option value={4}>4 Video Reviews (+20 Points)</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-[11px] font-bold text-[#536B8A] mb-1 block">
                              Video Title / Topic
                            </label>
                            <input
                              type="text"
                              value={item.video_title || ''}
                              onChange={(e) =>
                                handleCustomerFieldChange(idx, 'video_title', e.target.value)
                              }
                              placeholder="e.g. Wedding Jewellery Customer Testimonial"
                              className="w-full text-xs input-luxury-beige rounded-xl px-2.5 py-1.5"
                            />
                          </div>
                        </div>



                        {/* Photo Proof Upload for Video Review */}
                        <div className="pt-2 border-t border-[#E9D5FF]/60">
                          <label className="block text-[11px] font-bold text-[#536B8A] mb-1 flex items-center justify-between">
                            <span className="flex items-center gap-1">
                              <span>Upload Photo Proof</span>
                              <span className="text-red-500 font-extrabold">*</span>
                            </span>
                            <span className="text-[10px] text-[#7E22CE] font-bold">5 Points per Video upon Manager Approval</span>
                          </label>

                          {item.video_screenshot ? (
                            <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white border border-[#E9D5FF] shadow-2xs">
                              <img
                                src={item.video_screenshot}
                                alt="Video Photo Proof"
                                className="w-12 h-12 rounded-lg object-cover border border-[#D8B4FE] shrink-0 cursor-pointer hover:opacity-90"
                                onClick={() => setPreviewProofUrl(item.video_screenshot || null)}
                              />
                              <div className="flex-1 min-w-0">
                                <span className="text-xs font-bold text-[#1D1D1B] truncate block">
                                  Photo Proof Attached
                                </span>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <button
                                    type="button"
                                    onClick={() => setPreviewProofUrl(item.video_screenshot || null)}
                                    className="text-[11px] text-[#7E22CE] hover:underline flex items-center gap-1 font-bold cursor-pointer"
                                  >
                                    <Eye className="w-3 h-3" />
                                    <span>View Proof</span>
                                  </button>
                                  <span className="text-gray-300">•</span>
                                  <button
                                    type="button"
                                    onClick={() => handleCustomerFieldChange(idx, 'video_screenshot', '')}
                                    className="text-[11px] text-red-600 hover:underline flex items-center gap-1 font-bold cursor-pointer"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                    <span>Change / Remove</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <label className="border-2 border-dashed border-[#D8B4FE] hover:border-[#7E22CE] hover:bg-[#FAF5FF] rounded-xl p-3 flex flex-col items-center justify-center cursor-pointer bg-white transition-all">
                              {uploadingVideoProofIdx === idx ? (
                                <div className="flex items-center gap-2 text-xs text-[#7E22CE] font-bold py-1">
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                  <span>Uploading photo proof...</span>
                                </div>
                              ) : (
                                <>
                                  <UploadCloud className="w-5 h-5 text-[#7E22CE] mb-0.5" />
                                  <span className="text-xs font-bold text-[#1D1D1B]">Attach Video Review Photo Proof</span>
                                  <span className="text-[10px] text-[#8A8479]">PNG, JPG, or WebP (Max 10MB)</span>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    disabled={uploadingVideoProofIdx === idx}
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                        handleVideoProofUpload(idx, file);
                                      }
                                    }}
                                  />
                                </>
                              )}
                            </label>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 3. Customer Direct Feedback Section for This Customer */}
                  <div className="p-3 rounded-xl bg-[#F0FDF4] border border-[#DCFCE7] space-y-2.5">
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={item.has_customer_feedback || false}
                          onChange={(e) =>
                            handleCustomerFieldChange(idx, 'has_customer_feedback', e.target.checked)
                          }
                          className="w-4 h-4 rounded text-[#23815F] focus:ring-[#23815F] border-[#CBD5E1] cursor-pointer"
                        />
                        <span className="text-xs font-bold text-[#1D1D1B] flex items-center gap-1.5">
                          <MessageSquareHeart className="w-4 h-4 text-[#23815F]" />
                          <span>Customer Feedback & Rating</span>
                        </span>
                      </label>
                      {item.has_customer_feedback && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#DCFCE7] text-[#166534] border border-[#BBF7D0]">
                          💬 {item.feedback_rating || 5}★ Feedback
                        </span>
                      )}
                    </div>

                    {item.has_customer_feedback && (
                      <div className="space-y-2 pt-1">
                        <div className="flex items-center gap-2">
                          <label className="text-[11px] font-bold text-[#536B8A]">Staff Rating:</label>
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                type="button"
                                onClick={() =>
                                  handleCustomerFieldChange(idx, 'feedback_rating', star)
                                }
                                className="p-1 sm:p-0.5 hover:scale-110 transition-transform cursor-pointer min-w-[28px] min-h-[28px] flex items-center justify-center"
                              >
                                <Star
                                  className={`w-4 h-4 ${
                                    star <= (item.feedback_rating || 5)
                                      ? 'fill-[#23815F] text-[#23815F]'
                                      : 'text-[#D4D4D8]'
                                  }`}
                                />
                              </button>
                            ))}
                            <span className="text-xs font-bold text-[#23815F] ml-1">
                              {item.feedback_rating || 5}.0 Score
                            </span>
                          </div>
                        </div>

                        <input
                          type="text"
                          value={item.feedback_text || ''}
                          onChange={(e) =>
                            handleCustomerFieldChange(idx, 'feedback_text', e.target.value)
                          }
                          placeholder="e.g. Very patient in showing all designs and billing was smooth!"
                          className="w-full text-xs input-luxury-beige rounded-xl px-2.5 py-1.5"
                        />
                      </div>
                    )}
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

      {/* Proof Lightbox Preview */}
      {previewProofUrl && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in"
          onClick={() => setPreviewProofUrl(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-2xl w-full p-4 max-h-[90vh] flex flex-col relative shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <span className="text-sm font-black text-[#1D1D1B]">Google Review Photo Proof</span>
              <button
                type="button"
                onClick={() => setPreviewProofUrl(null)}
                className="w-7 h-7 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-500 font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="flex items-center justify-center p-2 overflow-auto max-h-[75vh]">
              <img
                src={previewProofUrl}
                alt="Review Proof"
                className="max-h-[70vh] w-auto object-contain rounded-xl border border-gray-200"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};
