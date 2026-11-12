import React, { useState } from 'react';
import {
  Compass,
  User,
  Phone,
  Calendar,
  Sparkles,
  Award,
  Camera,
  Star,
  MessageSquareHeart,
  Edit2,
  Trash2,
  Eye,
  Check,
  Loader2,
  Clock,
  BellRing,
} from 'lucide-react';
import { SCHEMES, SchemeName } from '../../../constants/schemes';
import { getMediaUrl } from '../../../utils/media';
import api from '../../../api/client';
import { useToast } from '../../../context/ToastContext';

export interface OutdoorModalCustomerData {
  id?: number;
  date: string;
  area_name: string;
  customer_name: string;
  phone: string;
  dob?: string;
  anniversary_date?: string;
  follow_up_date?: string;
  scheme_name: string;
  scheme_amount?: string | number;
  scheme_notes?: string;
  scheme_reminder_date?: string;
  interested_gold: boolean;
  interested_diamond: boolean;
  interested_silver: boolean;
  is_converted: boolean;
  has_google_review: boolean;
  google_review_rating: number;
  google_review_text: string;
  google_review_screenshot: string;
  has_customer_feedback: boolean;
  feedback_rating: number;
  feedback_text: string;
  customer_feedback_proof: string;
  photo_url: string;
  status: string;
  notes: string;
  note_notification_date?: string;
}

interface EmployeeOutdoorCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData: OutdoorModalCustomerData;
  onSaveSuccess: () => void;
}

export const EmployeeOutdoorCustomerModal: React.FC<EmployeeOutdoorCustomerModalProps> = ({
  isOpen,
  onClose,
  initialData,
  onSaveSuccess,
}) => {
  const { success, error: toastError } = useToast();

  const [form, setForm] = useState<OutdoorModalCustomerData>({ ...initialData });
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isUploadingFile, setIsUploadingFile] = useState<boolean>(false);
  const [viewProofUrl, setViewProofUrl] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleUploadFile = async (field: 'photo_url' | 'google_review_screenshot' | 'customer_feedback_proof', file: File) => {
    try {
      setIsUploadingFile(true);
      const fd = new FormData();
      fd.append('file', file);
      const endpoint = field === 'photo_url'
        ? '/api/v1/employee/outdoor/upload-photo'
        : '/api/v1/employee/outdoor/upload-proof';

      const res = await api.post(endpoint, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const url = res.data.url || res.data.photo_url || res.data.proof_url;
      setForm((prev) => ({ ...prev, [field]: url }));
      success('File uploaded successfully!');
    } catch (err: any) {
      toastError(err.response?.data?.detail || 'Failed to upload proof document.');
    } finally {
      setIsUploadingFile(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.customer_name.trim()) {
      toastError('Please enter customer full name.');
      return;
    }

    const interests: string[] = [];
    if (form.interested_gold) interests.push('Gold');
    if (form.interested_diamond) interests.push('Diamond');
    if (form.interested_silver) interests.push('Silver');

    try {
      setIsSubmitting(true);
      const payload = {
        id: form.id,
        date: form.date,
        area_name: form.area_name.trim() || undefined,
        customer_name: form.customer_name.trim(),
        phone: form.phone.trim() || undefined,
        dob: form.dob || undefined,
        anniversary_date: form.anniversary_date || undefined,
        follow_up_date: form.follow_up_date || undefined,
        scheme_name: form.scheme_name.trim() || undefined,
        scheme_amount: form.scheme_amount ? Number(form.scheme_amount) : undefined,
        scheme_notes: form.scheme_notes?.trim() || undefined,
        scheme_reminder_date: form.scheme_reminder_date || undefined,
        interested_in: interests.join(', '),
        is_converted: form.is_converted,
        has_google_review: form.has_google_review,
        google_review_rating: form.has_google_review ? form.google_review_rating : 5,
        google_review_text: form.has_google_review ? form.google_review_text.trim() : undefined,
        google_review_screenshot: form.google_review_screenshot || undefined,
        has_customer_feedback: form.has_customer_feedback,
        feedback_rating: form.has_customer_feedback ? form.feedback_rating : 5,
        feedback_text: form.has_customer_feedback ? form.feedback_text.trim() : undefined,
        customer_feedback_proof: form.customer_feedback_proof || undefined,
        photo_url: form.photo_url || undefined,
        status: form.status || (form.is_converted ? 'Converted' : 'Outdoor Marketing'),
        notes: form.notes?.trim() || undefined,
        note_notification_date: form.note_notification_date || undefined,
      };

      await api.post('/api/v1/employee/outdoor/customer', payload);
      success(form.id ? 'Outdoor customer updated and sent for manager review!' : 'Outdoor customer saved and sent for manager review!');
      onClose();
      onSaveSuccess();
    } catch (err: any) {
      toastError(err.response?.data?.detail || 'Failed to save outdoor customer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-white border border-[#C5E3D5] rounded-3xl w-full max-w-2xl p-5 sm:p-7 shadow-2xl relative my-8 text-[#1D1D1B] max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#EBE6DC] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#E8F4EE] border border-[#C5E3D5] text-[#21845F] flex items-center justify-center shadow-xs">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-[#1D1D1B] flex items-center gap-2">
                <span>{form.id ? 'Edit Outdoor Customer Lead' : 'Add Outdoor Customer Lead'}</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#E8F4EE] text-[#21845F] border border-[#C5E3D5]">
                  Field Marketing
                </span>
              </h3>
              <p className="text-xs text-[#8A8479]">
                Log outdoor customer interaction with schemes, proof photos, and follow-up calendar reminder.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#8A8479] hover:text-[#1D1D1B] p-1.5 rounded-xl hover:bg-[#FAF8F5] transition-colors cursor-pointer shrink-0"
          >
            ✕
          </button>
        </div>

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 space-y-4 py-4 pr-1 text-xs">
          {/* Row 1: Target Date & Area Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#5E5A52] uppercase mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-[#21845F]" />
                <span>Duty Date *</span>
              </label>
              <input
                type="date"
                required
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full bg-[#FAF8F5] border border-[#CBD5E1] rounded-xl px-3 py-2 text-xs text-[#1D1D1B] font-bold focus:border-[#21845F] focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#5E5A52] uppercase mb-1 flex items-center gap-1">
                <Compass className="w-3.5 h-3.5 text-[#21845F]" />
                <span>Area / Location *</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Yelahanka Old Town Market"
                value={form.area_name}
                onChange={(e) => setForm({ ...form, area_name: e.target.value })}
                className="w-full bg-[#FAF8F5] border border-[#CBD5E1] rounded-xl px-3 py-2 text-xs text-[#1D1D1B] font-medium focus:border-[#21845F] focus:outline-hidden"
              />
            </div>
          </div>

          {/* Row 2: Customer Name & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#5E5A52] uppercase mb-1 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-[#21845F]" />
                <span>Customer Full Name *</span>
              </label>
              <input
                type="text"
                required
                placeholder="Full name of customer"
                value={form.customer_name}
                onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
                className="w-full bg-[#FAF8F5] border border-[#CBD5E1] rounded-xl px-3 py-2 text-xs text-[#1D1D1B] font-bold focus:border-[#21845F] focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#5E5A52] uppercase mb-1 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-[#21845F]" />
                <span>Mobile Phone (10 digits)</span>
              </label>
              <input
                type="tel"
                placeholder="e.g. 9876543210"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full bg-[#FAF8F5] border border-[#CBD5E1] rounded-xl px-3 py-2 text-xs text-[#1D1D1B] font-mono focus:border-[#21845F] focus:outline-hidden"
              />
            </div>
          </div>

          {/* Row 3: DOB, Anniversary, Follow-up */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#5E5A52] uppercase mb-1">Date of Birth</label>
              <input
                type="date"
                value={form.dob || ''}
                onChange={(e) => setForm({ ...form, dob: e.target.value })}
                className="w-full bg-[#FAF8F5] border border-[#CBD5E1] rounded-xl px-3 py-2 text-xs text-[#1D1D1B] focus:border-[#21845F] focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#5E5A52] uppercase mb-1">Anniversary</label>
              <input
                type="date"
                value={form.anniversary_date || ''}
                onChange={(e) => setForm({ ...form, anniversary_date: e.target.value })}
                className="w-full bg-[#FAF8F5] border border-[#CBD5E1] rounded-xl px-3 py-2 text-xs text-[#1D1D1B] focus:border-[#21845F] focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#5E5A52] uppercase mb-1">Follow-up Date</label>
              <input
                type="date"
                value={form.follow_up_date || ''}
                onChange={(e) => setForm({ ...form, follow_up_date: e.target.value })}
                className="w-full bg-[#FAF8F5] border border-[#CBD5E1] rounded-xl px-3 py-2 text-xs text-[#1D1D1B] focus:border-[#21845F] focus:outline-hidden"
              />
            </div>
          </div>

          {/* Row 4: Jewelry Interests & Sale Conversion */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#5E5A52] uppercase flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#D97706]" />
              <span>Customer Interests & Conversion</span>
            </label>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setForm((prev) => ({ ...prev, interested_gold: !prev.interested_gold }))}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                  form.interested_gold
                    ? 'bg-[#FEF3C7] text-[#92400E] border-[#D97706] shadow-2xs font-black'
                    : 'bg-white text-[#5E5A52] border-[#CBD5E1] hover:bg-[#FAF8F5]'
                }`}
              >
                <span>🪙 Gold</span>
                {form.interested_gold && <Check className="w-3 h-3 text-[#92400E]" />}
              </button>

              <button
                type="button"
                onClick={() => setForm((prev) => ({ ...prev, interested_diamond: !prev.interested_diamond }))}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                  form.interested_diamond
                    ? 'bg-[#EFF6FF] text-[#1E40AF] border-[#3B82F6] shadow-2xs font-black'
                    : 'bg-white text-[#5E5A52] border-[#CBD5E1] hover:bg-[#FAF8F5]'
                }`}
              >
                <span>💎 Diamond</span>
                {form.interested_diamond && <Check className="w-3 h-3 text-[#1E40AF]" />}
              </button>

              <button
                type="button"
                onClick={() => setForm((prev) => ({ ...prev, interested_silver: !prev.interested_silver }))}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                  form.interested_silver
                    ? 'bg-[#F1F5F9] text-[#334155] border-[#64748B] shadow-2xs font-black'
                    : 'bg-white text-[#5E5A52] border-[#CBD5E1] hover:bg-[#FAF8F5]'
                }`}
              >
                <span>🥈 Silver</span>
                {form.interested_silver && <Check className="w-3 h-3 text-[#334155]" />}
              </button>

              <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-[#CBD5E1] hover:border-[#21845F] text-xs font-bold text-[#1D1D1B] cursor-pointer shadow-2xs transition-all">
                <input
                  type="checkbox"
                  checked={form.is_converted}
                  onChange={(e) => setForm((prev) => ({ ...prev, is_converted: e.target.checked }))}
                  className="w-4 h-4 text-[#21845F] rounded border-[#CBD5E1] focus:ring-[#21845F]"
                />
                <span className={form.is_converted ? 'text-[#21845F] font-black' : 'text-[#5E5A52]'}>
                  Converted to Sale
                </span>
              </label>
            </div>
          </div>

          {/* Row 5: JEWELLERY SAVINGS SCHEMES (MATCHING CUSTOMER LOG) */}
          <div className="p-3.5 rounded-2xl bg-[#FAF8F3] border border-[#E8E4D9] space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#1D1D1B] flex items-center gap-1.5">
                <Award className="w-4 h-4 text-[#D97706]" />
                <span>Jewellery Savings Scheme (Promoted)</span>
              </label>
              {form.scheme_name && (
                <button
                  type="button"
                  onClick={() =>
                    setForm((prev) => ({
                      ...prev,
                      scheme_name: '',
                      scheme_amount: '',
                      scheme_notes: '',
                      scheme_reminder_date: '',
                    }))
                  }
                  className="text-[11px] font-bold text-[#DC2626] hover:underline cursor-pointer"
                >
                  ✕ Deselect Scheme
                </button>
              )}
            </div>

            {/* Quick Scheme Pills */}
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() =>
                  setForm((prev) => ({
                    ...prev,
                    scheme_name: '',
                    scheme_amount: '',
                    scheme_notes: '',
                    scheme_reminder_date: '',
                  }))
                }
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  !form.scheme_name
                    ? 'bg-[#1D1D1B] text-white shadow-xs'
                    : 'bg-white border border-[#E4DFD4] text-[#5E5A52] hover:bg-[#F5F2EB]'
                }`}
              >
                None
              </button>
              {SCHEMES.map((sch) => {
                const isSelected = form.scheme_name === sch;
                return (
                  <button
                    key={sch}
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, scheme_name: sch }))}
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

            {/* When scheme is selected, show Monthly Amount, Notes & Reminder Date */}
            {form.scheme_name && (
              <div className="pt-2.5 space-y-3 border-t border-[#E8E4D9]">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="text-[11px] font-bold text-[#536B8A] mb-1 block">
                      Monthly Contribution (₹)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={form.scheme_amount || ''}
                      onChange={(e) => setForm({ ...form, scheme_amount: e.target.value })}
                      placeholder="e.g. 5000"
                      className="w-full text-xs bg-white border border-[#CBD5E1] rounded-xl px-2.5 py-2 font-mono text-[#1D1D1B] focus:border-[#D97706]"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-[#536B8A] mb-1 block">
                      Price Notes (Optional)
                    </label>
                    <input
                      type="text"
                      value={form.scheme_notes || ''}
                      onChange={(e) => setForm({ ...form, scheme_notes: e.target.value })}
                      placeholder="e.g. Gold lock rate option"
                      className="w-full text-xs bg-white border border-[#CBD5E1] rounded-xl px-2.5 py-2 text-[#1D1D1B] focus:border-[#D97706]"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-[#7E22CE] mb-1 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-[#7E22CE]" />
                      <span>Calendar Reminder Date</span>
                    </label>
                    <input
                      type="date"
                      value={form.scheme_reminder_date || ''}
                      onChange={(e) => setForm({ ...form, scheme_reminder_date: e.target.value })}
                      className="w-full text-xs bg-white border border-[#CBD5E1] rounded-xl px-2.5 py-2 font-medium text-[#1D1D1B] focus:border-[#7E22CE] cursor-pointer"
                    />
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-[#FFFBEB] border border-[#FDE68A] flex items-center gap-2 text-[11px] text-[#92400E]">
                  <Award className="w-4 h-4 text-[#D97706] shrink-0" />
                  <span>
                    {form.scheme_name.toUpperCase().includes('NIDHI')
                      ? 'Nidhi Scheme Auto-Alert: 10 monthly payment reminders will be auto-scheduled for manager notifications.'
                      : 'Gold Scheme Auto-Alert: Monthly payment reminders (11 installments) will be auto-scheduled for manager notifications.'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Row 6: Field Photo Proof */}
          <div>
            <label className="block text-xs font-bold text-[#5E5A52] uppercase mb-1 flex items-center gap-1">
              <Camera className="w-3.5 h-3.5 text-[#21845F]" />
              <span>Field Photo Proof (1)</span>
            </label>
            {form.photo_url ? (
              <div className="flex items-center gap-2 bg-[#FAF8F5] border border-[#C5E3D5] rounded-xl p-2 shadow-2xs">
                <img
                  src={getMediaUrl(form.photo_url)}
                  alt="Field Proof Preview"
                  className="w-12 h-12 object-cover rounded-lg border border-[#E6E1D6] shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-[#21845F] truncate">Field Photo Attached</p>
                  <p className="text-[10px] text-[#8A8479]">Ready to submit</p>
                </div>
                <div className="flex items-center gap-1 shrink-0 pr-1">
                  <button
                    type="button"
                    onClick={() => setViewProofUrl(getMediaUrl(form.photo_url))}
                    className="p-1.5 rounded-lg bg-[#E8F4EE] hover:bg-[#D1FAE5] text-[#21845F] transition-all cursor-pointer"
                    title="View Photo"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, photo_url: '' })}
                    className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition-all cursor-pointer"
                    title="Remove Photo"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <label className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl border border-dashed border-[#CBD5E1] hover:border-[#21845F] bg-[#FAF8F5] hover:bg-[#E8F4EE] text-xs font-bold text-[#21845F] cursor-pointer transition-all shadow-2xs">
                {isUploadingFile ? (
                  <Loader2 className="w-4 h-4 animate-spin text-[#21845F]" />
                ) : (
                  <Camera className="w-4 h-4 text-[#21845F]" />
                )}
                <span>{isUploadingFile ? 'Uploading photo...' : '+ Upload Field Photo (1)'}</span>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={(e) => {
                    if (e.target.files?.[0]) handleUploadFile('photo_url', e.target.files[0]);
                  }}
                  disabled={isUploadingFile}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* Row 7: Google Review Box */}
          <div className={`p-3.5 rounded-2xl border transition-all ${
            form.has_google_review ? 'bg-[#FEFCE8] border-[#CA8A04]' : 'bg-[#FAF8F5] border-[#E6E1D6]'
          }`}>
            <label className="inline-flex items-center gap-2 text-xs font-bold text-[#1D1D1B] cursor-pointer mb-2">
              <input
                type="checkbox"
                checked={form.has_google_review}
                onChange={(e) => setForm({ ...form, has_google_review: e.target.checked })}
                className="w-4 h-4 text-[#CA8A04] rounded border-[#CBD5E1] focus:ring-[#CA8A04]"
              />
              <span className="flex items-center gap-1 text-[#854D0E] font-black">
                <Star className="w-4 h-4 fill-[#CA8A04] text-[#CA8A04]" />
                <span>Google 5-Star Review Given</span>
              </span>
            </label>

            {form.has_google_review && (
              <div className="space-y-2 mt-2 pt-2 border-t border-[#FDE047]">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-[#854D0E]">Rating:</span>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setForm({ ...form, google_review_rating: star })}
                      className="p-0.5 cursor-pointer"
                    >
                      <Star
                        className={`w-4 h-4 ${
                          star <= (form.google_review_rating || 5)
                            ? 'fill-[#F59E0B] text-[#F59E0B]'
                            : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  placeholder="Review summary or text..."
                  value={form.google_review_text}
                  onChange={(e) => setForm({ ...form, google_review_text: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-[#CBD5E1] rounded-xl text-xs text-[#1D1D1B] focus:border-[#CA8A04] focus:outline-hidden"
                />

                {form.google_review_screenshot ? (
                  <div className="flex items-center gap-2 bg-white border border-[#FDE68A] rounded-xl p-2 shadow-2xs">
                    <img
                      src={getMediaUrl(form.google_review_screenshot)}
                      alt="Review Proof"
                      className="w-10 h-10 object-cover rounded-lg border border-[#E6E1D6] shrink-0"
                    />
                    <p className="text-xs font-bold text-[#854D0E] flex-1 truncate">Screenshot Attached</p>
                    <button
                      type="button"
                      onClick={() => setViewProofUrl(getMediaUrl(form.google_review_screenshot))}
                      className="p-1.5 text-[#854D0E] hover:bg-[#FEF3C7] rounded-lg cursor-pointer"
                      title="View"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, google_review_screenshot: '' })}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
                      title="Remove"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex items-center justify-center gap-1.5 w-full py-2 px-3 rounded-xl border border-dashed border-[#CA8A04]/50 bg-white hover:bg-[#FEFCE8] text-xs font-bold text-[#854D0E] cursor-pointer transition-all">
                    <Camera className="w-4 h-4" />
                    <span>+ Upload Review Screenshot</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files?.[0]) handleUploadFile('google_review_screenshot', e.target.files[0]);
                      }}
                    />
                  </label>
                )}
              </div>
            )}
          </div>

          {/* Row 8: Customer Feedback Box */}
          <div className={`p-3.5 rounded-2xl border transition-all ${
            form.has_customer_feedback ? 'bg-[#FAF5FF] border-[#A855F7]' : 'bg-[#FAF8F5] border-[#E6E1D6]'
          }`}>
            <label className="inline-flex items-center gap-2 text-xs font-bold text-[#1D1D1B] cursor-pointer mb-2">
              <input
                type="checkbox"
                checked={form.has_customer_feedback}
                onChange={(e) => setForm({ ...form, has_customer_feedback: e.target.checked })}
                className="w-4 h-4 text-[#7E22CE] rounded border-[#CBD5E1] focus:ring-[#7E22CE]"
              />
              <span className="flex items-center gap-1 text-[#7E22CE] font-black">
                <MessageSquareHeart className="w-4 h-4 text-[#7E22CE]" />
                <span>Customer Feedback Recorded</span>
              </span>
            </label>

            {form.has_customer_feedback && (
              <div className="space-y-2 mt-2 pt-2 border-t border-[#E9D5FF]">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-[#7E22CE]">Rating:</span>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setForm({ ...form, feedback_rating: star })}
                      className="p-0.5 cursor-pointer"
                    >
                      <Star
                        className={`w-4 h-4 ${
                          star <= (form.feedback_rating || 5)
                            ? 'fill-[#7E22CE] text-[#7E22CE]'
                            : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  placeholder="Customer feedback notes, collection impressions..."
                  value={form.feedback_text}
                  onChange={(e) => setForm({ ...form, feedback_text: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-[#CBD5E1] rounded-xl text-xs text-[#1D1D1B] focus:border-[#7E22CE] focus:outline-hidden"
                />

                {form.customer_feedback_proof ? (
                  <div className="flex items-center gap-2 bg-white border border-[#E9D5FF] rounded-xl p-2 shadow-2xs">
                    <div className="w-10 h-10 rounded-lg bg-[#FAF5FF] border border-[#D8B4FE] flex items-center justify-center shrink-0 text-sm">
                      {form.customer_feedback_proof.match(/\.(mp4|webm|mov|avi)$/i) ? '🎬' : '🖼️'}
                    </div>
                    <p className="text-xs font-bold text-[#7E22CE] flex-1 truncate">Feedback Proof Attached</p>
                    <button
                      type="button"
                      onClick={() => setViewProofUrl(getMediaUrl(form.customer_feedback_proof))}
                      className="p-1.5 text-[#7E22CE] hover:bg-[#FAF5FF] rounded-lg cursor-pointer"
                      title="View"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, customer_feedback_proof: '' })}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
                      title="Remove"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex items-center justify-center gap-1.5 w-full py-2 px-3 rounded-xl border border-dashed border-[#A855F7]/50 bg-white hover:bg-[#FAF5FF] text-xs font-bold text-[#7E22CE] cursor-pointer transition-all">
                    <Camera className="w-4 h-4" />
                    <span>+ Upload Feedback Proof (Photo/Video)</span>
                    <input
                      type="file"
                      accept="image/*,video/*"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files?.[0]) handleUploadFile('customer_feedback_proof', e.target.files[0]);
                      }}
                    />
                  </label>
                )}
              </div>
            )}
          </div>

          {/* Row 9: DISCUSSION NOTES + CALENDAR REMINDER DATE */}
          <div className="space-y-2 p-3.5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0]">
            <div>
              <label className="block text-xs font-bold text-[#1E293B] uppercase mb-1 flex items-center gap-1">
                <Edit2 className="w-3.5 h-3.5 text-[#21845F]" />
                <span>Discussion / Duty Field Notes</span>
              </label>
              <textarea
                rows={2}
                placeholder="Key conversation points, designs requested, customer budget, preferences..."
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="w-full bg-white border border-[#CBD5E1] rounded-xl p-3 text-xs text-[#1D1D1B] placeholder-[#8A8479] focus:outline-hidden focus:border-[#21845F] focus:ring-2 focus:ring-[#21845F]/15 shadow-inner resize-none font-medium"
              />
            </div>

            {/* Note Calendar Reminder Date */}
            <div className="pt-2 border-t border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#2563EB]">
                <BellRing className="w-4 h-4 text-[#2563EB] shrink-0" />
                <span>Note Calendar Reminder / Notify Date:</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={form.note_notification_date || ''}
                  onChange={(e) => setForm({ ...form, note_notification_date: e.target.value })}
                  className="bg-white border border-[#93C5FD] rounded-xl px-3 py-1.5 text-xs text-[#1D1D1B] font-bold focus:border-[#2563EB] focus:outline-hidden cursor-pointer"
                  title="Select reminder date for this note"
                />
                {form.note_notification_date && (
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, note_notification_date: '' })}
                    className="text-[11px] text-red-600 hover:underline font-bold"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
            <p className="text-[10px] text-[#64748B]">
              📅 When a date is selected, a live reminder alert is scheduled for you and your branch manager on that date.
            </p>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#EBE6DC] shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl border border-[#CBD5E1] bg-white hover:bg-[#FAF8F5] text-[#1D1D1B] text-xs font-bold cursor-pointer transition-all shadow-2xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isUploadingFile}
              className="px-6 py-2.5 rounded-xl bg-[#21845F] hover:bg-[#1A6B4C] text-white text-xs font-extrabold cursor-pointer transition-all shadow-sm flex items-center gap-2 hover:scale-[1.01] active:scale-98 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Compass className="w-4 h-4" />
                  <span>{form.id ? 'Update & Submit Lead' : 'Save & Submit Lead'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Lightbox for Proof Previews */}
      {viewProofUrl && (
        <div
          className="fixed inset-0 z-60 bg-black/80 flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setViewProofUrl(null)}
        >
          <div
            className="bg-white rounded-3xl p-4 max-w-2xl w-full shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#E6E1D6] mb-3">
              <span className="text-xs font-bold text-[#1D1D1B]">Proof Document Preview</span>
              <button
                type="button"
                onClick={() => setViewProofUrl(null)}
                className="text-xs font-bold text-[#8A8479] hover:text-[#1D1D1B] p-1 cursor-pointer"
              >
                ✕ Close
              </button>
            </div>
            <div className="max-h-[70vh] flex items-center justify-center overflow-auto rounded-xl bg-black/5 p-2">
              {viewProofUrl.match(/\.(mp4|webm|mov|avi)$/i) ? (
                <video src={viewProofUrl} controls className="max-h-[65vh] rounded-lg" autoPlay />
              ) : (
                <img src={viewProofUrl} alt="Proof" className="max-h-[65vh] object-contain rounded-lg shadow-sm" />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

