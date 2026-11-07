import React, { useEffect, useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Compass,
  Users,
  Calendar,
  MapPin,
  Award,
  Star,
  Camera,
  Image as ImageIcon,
  Plus,
  Trash2,
  Phone,
  Cake,
  Heart,
  Save,
  RotateCcw,
  Search,
  Filter,
  CheckSquare,
  Square,
  Eye,
  X,
  ArrowRight,
  UserCheck,
  FileText,
  Clock,
  ExternalLink,
  Download,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  Sparkles,
  MessageSquareHeart,
  User,
  Bell,
  Edit2,
  Loader2,
  Check,
} from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { useToast } from '../../context/ToastContext';
import { SCHEMES } from '../../constants/schemes';
import {
  Employee,
  OutdoorDuty,
  OutdoorMarketingCustomer,
  OutdoorCustomerDetail,
} from '../../types';
import api from '../../api/client';

// ----------------------------------------------------
// Data Interfaces
// ----------------------------------------------------
interface CustomerEntryState {
  id?: number;
  name: string;
  phone: string;
  dob: string;
  anniversary_date: string;
  follow_up_date: string;
  area_name: string;
  photo_url: string;
  is_converted: boolean;
  has_google_review: boolean;
  google_review_rating: number;
  google_review_text: string;
  has_customer_feedback: boolean;
  feedback_rating: number;
  feedback_text: string;
  interested_gold: boolean;
  interested_diamond: boolean;
  interested_silver: boolean;
  scheme_name?: string;
  notes: string;
}

interface DutyFormState {
  area: string;
  scheme_name?: string;
  customers_attended_count: number;
  converted_customers_count: number;
  google_ratings_count: number;
  photo_url: string;
  photo_urls: string[];
  notes: string;
  status: string;
  isUploadingPhotos: boolean;
  isSaving: boolean;
  attendedList: CustomerEntryState[];
  convertedList: CustomerEntryState[];
}

interface LightboxState {
  photos: string[];
  currentIndex: number;
  title: string;
  subtitle: string;
  date?: string;
}

// ----------------------------------------------------
// Sub-Component: Compact Photo Strip (Small in front, Expandable on click)
// ----------------------------------------------------
interface CompactPhotoStripProps {
  photos: string[];
  employeeName: string;
  area: string;
  date: string;
  isUploading: boolean;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDelete?: (url: string) => void;
  onExpand: (photos: string[], index: number, title: string, subtitle: string) => void;
  allowUpload?: boolean;
}

const CompactPhotoStrip: React.FC<CompactPhotoStripProps> = ({
  photos,
  employeeName,
  area,
  date,
  isUploading,
  onUpload,
  onDelete,
  onExpand,
  allowUpload = true,
}) => {
  return (
    <div className="bg-[#FAFDFB] border border-dashed border-[#C5E3D5] rounded-2xl p-3 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <Camera className="w-3.5 h-3.5 text-[#23815F]" />
          <span className="text-xs font-extrabold text-[#1D1D1B]">
            Field Photos ({photos.length})
          </span>
          <span className="text-[10px] text-[#8A8479] hidden sm:inline">
            (Click to expand)
          </span>
        </div>

        {allowUpload && (
          <label className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#23815F] hover:bg-[#1B694C] text-white text-[11px] font-bold rounded-lg shadow-2xs cursor-pointer transition-all shrink-0">
            <Plus className="w-3 h-3" />
            <span>{isUploading ? 'Uploading...' : '+ Add Photo'}</span>
            <input
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp"
              capture="environment"
              onChange={onUpload}
              className="hidden"
              disabled={isUploading}
            />
          </label>
        )}
      </div>

      {photos && photos.length > 0 ? (
        <div className="flex items-center gap-2 overflow-x-auto py-1">
          {photos.map((photoUrl, pIdx) => (
            <div
              key={pIdx}
              onClick={() =>
                onExpand(
                  photos,
                  pIdx,
                  `${employeeName} — Photo #${pIdx + 1}`,
                  `Area: ${area || 'Field Area'} • Date: ${date}`
                )
              }
              className="relative group shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden border border-[#C5E3D5] bg-white shadow-2xs hover:shadow-md transition-all cursor-pointer"
            >
              <img
                src={photoUrl}
                alt={`Proof #${pIdx + 1}`}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-200"
              />

              {/* Hover overlay with Enlarge & Delete */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1 p-1">
                <span className="p-1 bg-white/90 hover:bg-white text-[#1D1D1B] rounded-md transition-colors shadow-xs">
                  <ZoomIn className="w-3 h-3" />
                </span>
                {onDelete && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(photoUrl);
                    }}
                    className="p-1 bg-red-600 hover:bg-red-700 text-white rounded-md cursor-pointer transition-colors shadow-xs"
                    title="Delete Photo"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Index Badge */}
              <span className="absolute bottom-0.5 left-0.5 px-1 py-0.2 bg-black/60 text-white text-[8px] font-bold rounded">
                #{pIdx + 1}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-[11px] text-[#8A8479] italic py-0.5">
          No field photos added yet. Click "+ Add Photo" to attach camera or gallery proofs.
        </p>
      )}
    </div>
  );
};

// ----------------------------------------------------
// Sub-Component: Enhanced Full-Screen Photo Lightbox Modal
// ----------------------------------------------------
interface PhotoLightboxModalProps {
  lightbox: LightboxState | null;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}

const PhotoLightboxModal: React.FC<PhotoLightboxModalProps> = ({
  lightbox,
  onClose,
  onPrev,
  onNext,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!lightbox) return;
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') onPrev();
      if (e.key === 'ArrowRight') onNext();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightbox, onClose, onPrev, onNext]);

  if (!lightbox) return null;

  const currentPhoto = lightbox.photos[lightbox.currentIndex];
  const hasMultiple = lightbox.photos.length > 1;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="relative bg-white rounded-3xl overflow-hidden max-w-4xl w-full shadow-2xl border border-[#C5E3D5] flex flex-col max-h-[92vh]">
        {/* Lightbox Header */}
        <div className="p-4 sm:p-5 border-b border-[#E8E6E1] flex items-center justify-between bg-[#FAF8F3]">
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm sm:text-base font-extrabold text-[#1D1D1B]">
                {lightbox.title}
              </h4>
              {hasMultiple && (
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#E8F4EE] text-[#23815F] border border-[#C5E3D5]">
                  {lightbox.currentIndex + 1} / {lightbox.photos.length}
                </span>
              )}
            </div>
            <p className="text-xs text-[#5E5A52] mt-0.5 font-medium">
              {lightbox.subtitle}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={currentPhoto}
              target="_blank"
              rel="noreferrer"
              download
              className="p-2 rounded-xl bg-white hover:bg-[#F0F7F4] text-[#23815F] border border-[#C5E3D5] text-xs font-bold flex items-center gap-1 shadow-2xs transition-colors"
              title="Open full size / Download"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Save</span>
            </a>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-[#E8E6E1] text-[#1D1D1B] transition-colors cursor-pointer"
              title="Close (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Lightbox Center Image & Navigation */}
        <div className="relative flex-1 bg-[#121212] flex items-center justify-center p-3 sm:p-6 overflow-hidden min-h-88 sm:min-h-120">
          <img
            src={currentPhoto}
            alt="Field Proof Full View"
            className="max-h-[68vh] max-w-full object-contain rounded-xl shadow-2xl transition-all select-none"
          />

          {hasMultiple && (
            <>
              <button
                onClick={onPrev}
                className="absolute left-3 top-1/2 -translate-y-1/2 p-2.5 sm:p-3 rounded-full bg-black/60 hover:bg-black/80 text-white transition-all cursor-pointer shadow-lg hover:scale-105"
                title="Previous Photo (←)"
              >
                <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>

              <button
                onClick={onNext}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 sm:p-3 rounded-full bg-black/60 hover:bg-black/80 text-white transition-all cursor-pointer shadow-lg hover:scale-105"
                title="Next Photo (→)"
              >
                <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </>
          )}
        </div>

        {/* Lightbox Footer Thumbnails Strip */}
        {hasMultiple && (
          <div className="p-3 bg-[#FAF8F3] border-t border-[#E8E6E1] flex items-center justify-center gap-2 overflow-x-auto">
            {lightbox.photos.map((url, idx) => (
              <button
                key={idx}
                onClick={() => {
                  lightbox.currentIndex = idx;
                }}
                className={`relative w-12 h-12 rounded-lg overflow-hidden border-2 transition-all cursor-pointer shrink-0 ${
                  lightbox.currentIndex === idx
                    ? 'border-[#23815F] scale-105 shadow-xs'
                    : 'border-transparent opacity-60 hover:opacity-100'
                }`}
              >
                <img src={url} alt={`Thumb ${idx + 1}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ====================================================
// Main Page Component
// ====================================================
export const OutdoorMarketingPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { success, error: toastError } = useToast();

  // Date State (Defaults to Today YYYY-MM-DD)
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('date') || new Date().toISOString().split('T')[0];
  });

  // Tab Navigation: 'assign' (FIRST by default) | 'entries' | 'status' | 'photos' | 'leads'
  const [activeTab, setActiveTab] = useState<'assign' | 'entries' | 'status' | 'photos' | 'leads'>('assign');

  // Core Data States
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [allEmployees, setAllEmployees] = useState<Employee[]>([]);
  const [assignedDuties, setAssignedDuties] = useState<OutdoorDuty[]>([]);
  const [dutyForms, setDutyForms] = useState<Record<number, DutyFormState>>({});

  // Staff Selection State for Date Assignment
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<number[]>([]);
  const [isAssigning, setIsAssigning] = useState<boolean>(false);

  // Search & Filters
  const [searchStaff, setSearchStaff] = useState<string>('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [photoStaffFilter, setPhotoStaffFilter] = useState<string>('all');
  const [customerSearch, setCustomerSearch] = useState<string>('');

  // Full Work Detail Modal State (When clicking a staff duty card in Status tab)
  const [viewDetailDuty, setViewDetailDuty] = useState<OutdoorDuty | null>(null);

  // Expanded Photo Lightbox State
  const [lightbox, setLightbox] = useState<LightboxState | null>(null);

  // Delete Assignment Confirm
  const [deleteDutyId, setDeleteDutyId] = useState<number | null>(null);

  // Tab 5: Outdoor Customer Leads & Approvals
  const [allOutdoorLeads, setAllOutdoorLeads] = useState<OutdoorMarketingCustomer[]>([]);
  const [leadStatusFilter, setLeadStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');
  const [leadDateScope, setLeadDateScope] = useState<'all' | 'selected'>('all');
  const [selectedCustView, setSelectedCustView] = useState<OutdoorMarketingCustomer | null>(null);
  const [showAddLeadModal, setShowAddLeadModal] = useState<boolean>(false);
  const [isSubmittingLead, setIsSubmittingLead] = useState<boolean>(false);
  const [newLeadForm, setNewLeadForm] = useState({
    customer_name: '',
    phone: '',
    dob: '',
    anniversary_date: '',
    marketing_employee_id: '',
    area_name: '',
    scheme_name: '',
    status: 'Lead',
    interested_gold: false,
    interested_diamond: false,
    interested_silver: false,
    has_google_review: false,
    google_review_rating: 5,
    google_review_text: '',
    has_customer_feedback: false,
    feedback_rating: 5,
    feedback_text: '',
    notes: '',
    date: new Date().toISOString().split('T')[0],
  });

  const fetchOutdoorLeads = async () => {
    try {
      const res = await api.get<OutdoorMarketingCustomer[]>('/api/v1/outdoor-marketing/customers');
      setAllOutdoorLeads(res.data || []);
    } catch (err) {
      console.error('Failed to load outdoor customer leads:', err);
    }
  };

  // ----------------------------------------------------
  // 1. Fetch Showroom Employees & Duties for Selected Date
  // ----------------------------------------------------
  const loadData = async (dateVal: string) => {
    setIsLoading(true);
    try {
      const [empRes, dutyRes] = await Promise.all([
        api.get<Employee[]>('/api/v1/employees'),
        api.get<OutdoorDuty[]>(`/api/v1/outdoor-marketing/duties?date_filter=${dateVal}`),
      ]);

      setAllEmployees(empRes.data);
      setAssignedDuties(dutyRes.data);
      fetchOutdoorLeads();

      // Pre-select employee IDs that are already assigned for this date
      const assignedIds = dutyRes.data.map((d) => d.employee_id);
      setSelectedEmployeeIds(assignedIds);

      // Initialize form states for each assigned duty
      const formMap: Record<number, DutyFormState> = {};
      dutyRes.data.forEach((duty) => {
        const allCusts = duty.customers || [];
        const attendedCount = Math.max(duty.customers_attended_count, allCusts.length);

        // Build attended array matching count with interested categories
        const attendedList: CustomerEntryState[] = [];
        for (let i = 0; i < attendedCount; i++) {
          const existing = allCusts[i];
          const intStr = ((existing as any)?.interested_in || '').toLowerCase();
          attendedList.push({
            id: existing?.id,
            name: existing?.customer_name || '',
            phone: existing?.phone || '',
            dob: existing?.dob ? String(existing.dob) : '',
            anniversary_date: existing?.anniversary_date ? String(existing.anniversary_date) : '',
            follow_up_date: (existing as any)?.follow_up_date ? String((existing as any).follow_up_date) : '',
            area_name: (existing as any)?.area_name || duty.area || '',
            photo_url: (existing as any)?.photo_url || '',
            is_converted: Boolean(existing?.is_converted),
            has_google_review: existing?.has_google_review || false,
            google_review_rating: existing?.google_review_rating || 5,
            google_review_text: existing?.google_review_text || '',
            has_customer_feedback: existing?.has_customer_feedback || false,
            feedback_rating: existing?.feedback_rating || 5,
            feedback_text: existing?.feedback_text || '',
            interested_gold: intStr.includes('gold'),
            interested_diamond: intStr.includes('diamond'),
            interested_silver: intStr.includes('silver'),
            scheme_name: existing?.scheme_name || duty.scheme_name || '',
            notes: existing?.notes || '',
          });
        }

        const existingPhotos = duty.photo_urls && duty.photo_urls.length > 0
          ? duty.photo_urls
          : (duty.photo_url ? [duty.photo_url] : []);

        formMap[duty.id] = {
          area: duty.area || '',
          customers_attended_count: attendedCount,
          converted_customers_count: 0,
          google_ratings_count: duty.google_ratings_count || 0,
          photo_url: duty.photo_url || (existingPhotos[0] || ''),
          photo_urls: existingPhotos,
          notes: duty.notes || '',
          status: duty.status || 'Assigned',
          isUploadingPhotos: false,
          isSaving: false,
          attendedList,
          convertedList: [],
        };
      });

      setDutyForms(formMap);

      if (viewDetailDuty) {
        const refreshedDuty = dutyRes.data.find((d) => d.id === viewDetailDuty.id);
        if (refreshedDuty) {
          setViewDetailDuty(refreshedDuty);
        }
      }
    } catch (err) {
      console.error('Failed to load outdoor marketing duties:', err);
      toastError('Could not load outdoor marketing data.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData(selectedDate);
  }, [selectedDate]);

  // Handle Date Change
  const handleDateChange = (newDate: string) => {
    setSelectedDate(newDate);
    const params = new URLSearchParams(window.location.search);
    params.set('date', newDate);
    navigate({ search: params.toString() }, { replace: true });
  };

  // ----------------------------------------------------
  // 2. Staff Selection for Duty Assignment
  // ----------------------------------------------------
  const toggleEmployeeSelect = (empId: number) => {
    setSelectedEmployeeIds((prev) =>
      prev.includes(empId) ? prev.filter((id) => id !== empId) : [...prev, empId]
    );
  };

  const handleSelectAllStaff = () => {
    const activeStaff = allEmployees.filter((e) => e.status === 'active').map((e) => e.id);
    setSelectedEmployeeIds(activeStaff);
  };

  const handleClearStaffSelection = () => {
    setSelectedEmployeeIds([]);
  };

  // Save Assignment & Switch to Entry Page
  const handleSaveAssignments = async () => {
    if (selectedEmployeeIds.length === 0) {
      toastError('Please select at least one employee for outdoor duty on this date.');
      return;
    }

    setIsAssigning(true);
    try {
      await api.post('/api/v1/outdoor-marketing/duties/assign', {
        date: selectedDate,
        employee_ids: selectedEmployeeIds,
      });

      success(`Assigned ${selectedEmployeeIds.length} staff members for ${selectedDate}!`);
      await loadData(selectedDate);
      setActiveTab('entries');
    } catch (err: any) {
      toastError(err.response?.data?.detail || 'Failed to save outdoor duty assignments.');
    } finally {
      setIsAssigning(false);
    }
  };

  // ----------------------------------------------------
  // 3. Update Duty Form Fields (Area, Scheme, Counts)
  // ----------------------------------------------------
  const updateDutyFormField = (dutyId: number, field: keyof DutyFormState, value: any) => {
    setDutyForms((prev) => ({
      ...prev,
      [dutyId]: {
        ...prev[dutyId],
        [field]: value,
      },
    }));
  };

  // Handle Attended Count Change
  const handleAttendedCountChange = (dutyId: number, newCount: number) => {
    setDutyForms((prev) => {
      const form = prev[dutyId];
      if (!form) return prev;

      const currentList = [...form.attendedList];
      if (newCount > currentList.length) {
        for (let i = currentList.length; i < newCount; i++) {
          currentList.push({
            name: '',
            phone: '',
            dob: '',
            anniversary_date: '',
            follow_up_date: '',
            area_name: form.area || '',
            photo_url: '',
            is_converted: false,
            has_google_review: false,
            google_review_rating: 5,
            google_review_text: '',
            has_customer_feedback: false,
            feedback_rating: 5,
            feedback_text: '',
            interested_gold: false,
            interested_diamond: false,
            interested_silver: false,
            notes: '',
          });
        }
      } else if (newCount < currentList.length) {
        currentList.splice(newCount);
      }

      return {
        ...prev,
        [dutyId]: {
          ...form,
          customers_attended_count: newCount,
          attendedList: currentList,
        },
      };
    });
  };

  // Handle Converted Count Change
  const handleConvertedCountChange = (dutyId: number, newCount: number) => {
    setDutyForms((prev) => {
      const form = prev[dutyId];
      if (!form) return prev;

      const currentList = [...form.convertedList];
      if (newCount > currentList.length) {
        for (let i = currentList.length; i < newCount; i++) {
          currentList.push({
            name: '',
            phone: '',
            dob: '',
            anniversary_date: '',
            follow_up_date: '',
            area_name: form.area || '',
            photo_url: '',
            is_converted: true,
            has_google_review: false,
            google_review_rating: 5,
            google_review_text: '',
            has_customer_feedback: false,
            feedback_rating: 5,
            feedback_text: '',
            interested_gold: false,
            interested_diamond: false,
            interested_silver: false,
            notes: '',
          });
        }
      } else if (newCount < currentList.length) {
        currentList.splice(newCount);
      }

      return {
        ...prev,
        [dutyId]: {
          ...form,
          converted_customers_count: newCount,
          convertedList: currentList,
        },
      };
    });
  };

  // Add Attended Customer Item
  const addAttendedCustomer = (dutyId: number) => {
    setDutyForms((prev) => {
      const form = prev[dutyId];
      if (!form) return prev;
      const newList: CustomerEntryState[] = [
        ...form.attendedList,
        {
          name: '',
          phone: '',
          dob: '',
          anniversary_date: '',
          follow_up_date: '',
          area_name: form.area || '',
          photo_url: '',
          is_converted: false,
          has_google_review: false,
          google_review_rating: 5,
          google_review_text: '',
          has_customer_feedback: false,
          feedback_rating: 5,
          feedback_text: '',
          interested_gold: false,
          interested_diamond: false,
          interested_silver: false,
          scheme_name: form.scheme_name || '',
          notes: '',
        },
      ];
      return {
        ...prev,
        [dutyId]: {
          ...form,
          customers_attended_count: newList.length,
          attendedList: newList,
        },
      };
    });
  };

  // Remove Attended Customer Item
  const removeAttendedCustomer = (dutyId: number, index: number) => {
    setDutyForms((prev) => {
      const form = prev[dutyId];
      if (!form) return prev;
      const newList = form.attendedList.filter((_, idx) => idx !== index);
      return {
        ...prev,
        [dutyId]: {
          ...form,
          customers_attended_count: newList.length,
          attendedList: newList,
        },
      };
    });
  };

  const [uploadingCustomerPhotoKey, setUploadingCustomerPhotoKey] = useState<string | null>(null);

  // Upload Photo for Specific Customer Row in Manager Dashboard
  const handleCustomerPhotoUpload = async (dutyId: number, cIdx: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingCustomerPhotoKey(`${dutyId}-${cIdx}`);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post<{ url: string }>('/api/v1/outdoor-marketing/activities/upload-photo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const photoUrl = res.data.url;
      updateAttendedCustomer(dutyId, cIdx, 'photo_url', photoUrl);
      success('Customer field photo uploaded successfully!');
    } catch (err: any) {
      toastError(err.response?.data?.detail || 'Failed to upload photo.');
    } finally {
      setUploadingCustomerPhotoKey(null);
      e.target.value = '';
    }
  };

  // Update Attended Customer Item
  const updateAttendedCustomer = (
    dutyId: number,
    index: number,
    field: keyof CustomerEntryState,
    value: any
  ) => {
    setDutyForms((prev) => {
      const form = prev[dutyId];
      if (!form) return prev;
      const updated = [...form.attendedList];
      updated[index] = { ...updated[index], [field]: value };
      return {
        ...prev,
        [dutyId]: {
          ...form,
          attendedList: updated,
        },
      };
    });
  };

  // Update Converted Customer Item
  const updateConvertedCustomer = (
    dutyId: number,
    index: number,
    field: keyof CustomerEntryState,
    value: any
  ) => {
    setDutyForms((prev) => {
      const form = prev[dutyId];
      if (!form) return prev;
      const updated = [...form.convertedList];
      updated[index] = { ...updated[index], [field]: value };
      return {
        ...prev,
        [dutyId]: {
          ...form,
          convertedList: updated,
        },
      };
    });
  };

  // ----------------------------------------------------
  // 4. Multi-Photo Upload Handler per Duty
  // ----------------------------------------------------
  const handleMultiplePhotoUpload = async (dutyId: number, e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const files = Array.from(e.target.files);
    updateDutyFormField(dutyId, 'isUploadingPhotos', true);

    try {
      const uploadedUrls: string[] = [];
      for (const file of files) {
        if (file.size > 4 * 1024 * 1024) {
          toastError(`File "${file.name}" exceeds 4 MB limit and was skipped.`);
          continue;
        }
        const formData = new FormData();
        formData.append('file', file);
        const res = await api.post<{ photo_url: string }>(
          '/api/v1/outdoor-marketing/activities/upload-photo',
          formData,
          { headers: { 'Content-Type': 'multipart/form-data' } }
        );
        if (res.data.photo_url) {
          uploadedUrls.push(res.data.photo_url);
        }
      }

      if (uploadedUrls.length > 0) {
        setDutyForms((prev) => {
          const form = prev[dutyId];
          const updatedPhotos = [...(form.photo_urls || []), ...uploadedUrls];
          return {
            ...prev,
            [dutyId]: {
              ...form,
              photo_urls: updatedPhotos,
              photo_url: form.photo_url || updatedPhotos[0],
            },
          };
        });
        success(`Uploaded ${uploadedUrls.length} new field photo(s)!`);
      }
    } catch (err: any) {
      toastError(err.response?.data?.detail || 'Failed to upload photo(s).');
    } finally {
      updateDutyFormField(dutyId, 'isUploadingPhotos', false);
      e.target.value = '';
    }
  };

  const handleRemovePhoto = (dutyId: number, photoUrlToRemove: string) => {
    setDutyForms((prev) => {
      const form = prev[dutyId];
      const updatedPhotos = (form.photo_urls || []).filter((u) => u !== photoUrlToRemove);
      return {
        ...prev,
        [dutyId]: {
          ...form,
          photo_urls: updatedPhotos,
          photo_url: updatedPhotos[0] || '',
        },
      };
    });
  };

  // Lightbox Navigation Handlers
  const handleOpenLightbox = useCallback((photos: string[], index: number, title: string, subtitle: string) => {
    setLightbox({
      photos,
      currentIndex: index,
      title,
      subtitle,
      date: selectedDate,
    });
  }, [selectedDate]);

  const handlePrevLightbox = () => {
    if (!lightbox) return;
    setLightbox((prev) => {
      if (!prev) return null;
      const nextIdx = (prev.currentIndex - 1 + prev.photos.length) % prev.photos.length;
      return { ...prev, currentIndex: nextIdx };
    });
  };

  const handleNextLightbox = () => {
    if (!lightbox) return;
    setLightbox((prev) => {
      if (!prev) return null;
      const nextIdx = (prev.currentIndex + 1) % prev.photos.length;
      return { ...prev, currentIndex: nextIdx };
    });
  };

  // ----------------------------------------------------
  // 5. Save Single Employee Outdoor Duty
  // ----------------------------------------------------
  const handleSaveDuty = async (dutyId: number) => {
    const form = dutyForms[dutyId];
    if (!form) return;

    updateDutyFormField(dutyId, 'isSaving', true);

    try {
      const customersPayload: OutdoorCustomerDetail[] = [];

      form.attendedList.forEach((c) => {
        if (
          c.name.trim() ||
          c.phone.trim() ||
          c.area_name.trim() ||
          c.photo_url.trim() ||
          c.follow_up_date.trim() ||
          c.has_google_review ||
          c.has_customer_feedback ||
          c.interested_gold ||
          c.interested_diamond ||
          c.interested_silver ||
          c.is_converted ||
          c.notes.trim()
        ) {
          const interestedArr: string[] = [];
          if (c.interested_gold) interestedArr.push('Gold');
          if (c.interested_diamond) interestedArr.push('Diamond');
          if (c.interested_silver) interestedArr.push('Silver');

          customersPayload.push({
            id: c.id,
            customer_name: c.name.trim() || 'Field Visitor',
            phone: c.phone.trim() || undefined,
            dob: c.dob || undefined,
            anniversary_date: c.anniversary_date || undefined,
            follow_up_date: c.follow_up_date || undefined,
            area_name: c.area_name.trim() || form.area.trim() || 'Field Marketing',
            photo_url: c.photo_url.trim() || undefined,
            is_converted: Boolean(c.is_converted),
            has_google_review: c.has_google_review,
            google_review_rating: c.has_google_review ? (c.google_review_rating || 5) : 5,
            google_review_text: c.has_google_review ? (c.google_review_text.trim() || undefined) : undefined,
            has_customer_feedback: c.has_customer_feedback,
            feedback_rating: c.has_customer_feedback ? (c.feedback_rating || 5) : 5,
            feedback_text: c.has_customer_feedback && c.feedback_text.trim() ? c.feedback_text.trim() : undefined,
            interested_in: interestedArr.length > 0 ? interestedArr.join(', ') : undefined,
            scheme_name: c.scheme_name?.trim() || form.scheme_name?.trim() || undefined,
            notes: c.notes.trim() || undefined,
          });
        }
      });

      const firstArea =
        customersPayload.find((c) => c.area_name?.trim())?.area_name?.trim() ||
        form.area.trim() ||
        'Field Marketing';

      const customerPhotos = customersPayload
        .map((c) => c.photo_url?.trim())
        .filter((p): p is string => Boolean(p));
      const allPhotos = Array.from(new Set([...customerPhotos, ...form.photo_urls]));

      const convertedCount = customersPayload.filter((c) => c.is_converted).length;
      const customerReviewsCount = customersPayload.filter((c) => c.has_google_review).length;
      const totalGoogleRatings = Math.max(form.google_ratings_count, customerReviewsCount);

      await api.put(`/api/v1/outdoor-marketing/duties/${dutyId}`, {
        area: firstArea,
        customers_attended_count: customersPayload.length,
        converted_customers_count: convertedCount,
        google_ratings_count: totalGoogleRatings,
        photo_url: allPhotos[0] || null,
        photo_urls: allPhotos,
        notes: form.notes.trim() || null,
        status: 'Completed',
        customers: customersPayload,
      });

      success('Employee outdoor marketing activity saved successfully!');
      await loadData(selectedDate);
      fetchOutdoorLeads();
    } catch (err: any) {
      console.error('Error saving outdoor duty:', err);
      toastError(err.response?.data?.detail || 'Failed to save employee outdoor duty.');
    } finally {
      updateDutyFormField(dutyId, 'isSaving', false);
    }
  };

  // ----------------------------------------------------
  // Review Duty & Customer Actions
  // ----------------------------------------------------
  const handleReviewDuty = async (dutyId: number, action: 'APPROVE' | 'REJECT') => {
    try {
      await api.post(`/api/v1/outdoor-marketing/duties/${dutyId}/review`, { action });
      success(`Duty successfully ${action === 'APPROVE' ? 'Approved' : 'Rejected'}!`);
      await loadData(selectedDate);
      fetchOutdoorLeads();
    } catch (err: any) {
      toastError(err.response?.data?.detail || 'Failed to review outdoor duty.');
    }
  };

  const handleReviewCustomer = async (customerId: number, action: 'APPROVE' | 'REJECT') => {
    try {
      await api.post(`/api/v1/outdoor-marketing/customers/${customerId}/review`, { action });
      success(`Customer lead ${action === 'APPROVE' ? 'Approved' : 'Rejected'}!`);
      await loadData(selectedDate);
      fetchOutdoorLeads();
      if (selectedCustView && selectedCustView.id === customerId) {
        setSelectedCustView((prev) => prev ? { ...prev, status: action === 'APPROVE' ? 'Approved' : 'Rejected' } : null);
      }
    } catch (err: any) {
      toastError(err.response?.data?.detail || 'Failed to review customer lead.');
    }
  };

  const handleCreateCustomerLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLeadForm.customer_name.trim()) {
      toastError('Please enter customer full name.');
      return;
    }
    const empId = newLeadForm.marketing_employee_id || (allEmployees[0]?.id?.toString() || '');
    if (!empId) {
      toastError('Please select an assisting staff member.');
      return;
    }

    const interests: string[] = [];
    if (newLeadForm.interested_gold) interests.push('Gold');
    if (newLeadForm.interested_diamond) interests.push('Diamond');
    if (newLeadForm.interested_silver) interests.push('Silver');

    setIsSubmittingLead(true);
    try {
      const payload = {
        marketing_employee_id: parseInt(empId),
        customer_name: newLeadForm.customer_name.trim(),
        phone: newLeadForm.phone.trim() || undefined,
        dob: newLeadForm.dob || undefined,
        anniversary_date: newLeadForm.anniversary_date || undefined,
        area_name: newLeadForm.area_name.trim() || undefined,
        scheme_name: newLeadForm.scheme_name.trim() || undefined,
        date: newLeadForm.date || selectedDate,
        interested_in: interests.join(', ') || undefined,
        has_google_review: newLeadForm.has_google_review,
        google_review_rating: newLeadForm.has_google_review ? newLeadForm.google_review_rating : 5,
        google_review_text: newLeadForm.has_google_review ? newLeadForm.google_review_text : undefined,
        has_customer_feedback: newLeadForm.has_customer_feedback,
        feedback_rating: newLeadForm.has_customer_feedback ? newLeadForm.feedback_rating : 5,
        feedback_text: newLeadForm.has_customer_feedback ? newLeadForm.feedback_text : undefined,
        notes: newLeadForm.notes.trim() || undefined,
        status: 'Lead',
      };

      await api.post('/api/v1/outdoor-marketing/customers', payload);
      success('Outdoor customer lead created and added to Pending list for review & approval!');
      setShowAddLeadModal(false);
      setNewLeadForm({
        customer_name: '',
        phone: '',
        dob: '',
        anniversary_date: '',
        marketing_employee_id: '',
        area_name: '',
        scheme_name: '',
        status: 'Lead',
        interested_gold: false,
        interested_diamond: false,
        interested_silver: false,
        has_google_review: false,
        google_review_rating: 5,
        google_review_text: '',
        has_customer_feedback: false,
        feedback_rating: 5,
        feedback_text: '',
        notes: '',
        date: selectedDate,
      });
      fetchOutdoorLeads();
      loadData(selectedDate);
    } catch (err: any) {
      toastError(err.response?.data?.detail || 'Failed to create customer lead.');
    } finally {
      setIsSubmittingLead(false);
    }
  };

  // Delete Duty
  const handleDeleteDuty = async () => {
    if (!deleteDutyId) return;
    try {
      await api.delete(`/api/v1/outdoor-marketing/duties/${deleteDutyId}`);
      success('Staff outdoor assignment removed.');
      setDeleteDutyId(null);
      await loadData(selectedDate);
    } catch (err: any) {
      toastError(err.response?.data?.detail || 'Failed to remove duty assignment.');
    }
  };

  // ----------------------------------------------------
  // 6. CSV Export Function
  // ----------------------------------------------------
  const handleExportCSV = () => {
    const customers = displayedLeads.length > 0 ? displayedLeads : scopedLeads;

    if (customers.length === 0) {
      toastError('No customer records available to export.');
      return;
    }

    const headers = [
      'Customer Name',
      'Phone Number',
      'Date of Birth (DOB)',
      'Wedding Anniversary',
      'Status',
      'Promoted Scheme',
      'Campaign Area',
      'Staff Representative',
      'Google Review Given',
      'Google Rating (Stars)',
      'Google Review Feedback',
      'Customer Feedback Given',
      'Customer Rating (Stars)',
      'Customer Feedback Remarks',
      'Date',
      'Notes',
    ];

    const escapeCsv = (val: any) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = customers.map((c) => [
      escapeCsv(c.customer_name),
      escapeCsv(c.phone || ''),
      escapeCsv(c.dob || ''),
      escapeCsv(c.anniversary_date || ''),
      escapeCsv(c.is_converted ? 'Converted' : (c.status || 'Attended')),
      escapeCsv(c.scheme_name || ''),
      escapeCsv(c.area_name || ''),
      escapeCsv(c.marketing_employee_name || ''),
      escapeCsv(c.has_google_review ? 'Yes' : 'No'),
      escapeCsv(c.has_google_review ? (c.google_review_rating || 5) : ''),
      escapeCsv(c.google_review_text || ''),
      escapeCsv(c.has_customer_feedback ? 'Yes' : 'No'),
      escapeCsv(c.has_customer_feedback ? (c.feedback_rating || 5) : ''),
      escapeCsv(c.feedback_text || ''),
      escapeCsv(c.date || selectedDate),
      escapeCsv(c.notes || ''),
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `outdoor_customers_${leadDateScope === 'selected' ? selectedDate : 'all'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    success('Customer leads exported to CSV successfully!');
  };

  // Filter Staff for Assignment List
  const filteredStaff = allEmployees.filter((emp) => {
    if (searchStaff.trim()) {
      const q = searchStaff.toLowerCase();
      const matchName = emp.full_name.toLowerCase().includes(q);
      const matchCode = emp.employee_code.toLowerCase().includes(q);
      const matchDesig = emp.designation?.toLowerCase().includes(q);
      if (!matchName && !matchCode && !matchDesig) return false;
    }
    if (departmentFilter !== 'all') {
      if (emp.department !== departmentFilter) return false;
    }
    return true;
  });

  const departments = Array.from(new Set(allEmployees.map((e) => e.department).filter(Boolean)));

  // Aggregate Lists
  const allDutiesCustomers = assignedDuties.flatMap((d) => d.customers);
  const baseLeadsList = allOutdoorLeads.length > 0 ? allOutdoorLeads : allDutiesCustomers;

  const scopedLeads = leadDateScope === 'selected'
    ? baseLeadsList.filter((l) => l.date === selectedDate)
    : baseLeadsList;

  const countAllLeads = scopedLeads.length;
  const countPendingLeads = scopedLeads.filter((l) => {
    const s = (l.status || '').toLowerCase();
    return s.includes('pending') || s === 'lead' || s === 'contacted' || s === 'interested';
  }).length;
  const countApprovedLeads = scopedLeads.filter((l) => {
    const s = (l.status || '').toLowerCase();
    return s.includes('approved') || s === 'converted';
  }).length;
  const countRejectedLeads = scopedLeads.filter((l) => {
    const s = (l.status || '').toLowerCase();
    return s.includes('rejected');
  }).length;

  const displayedLeads = scopedLeads.filter((cust) => {
    // 1. Status Filter
    const s = (cust.status || '').toLowerCase();
    if (leadStatusFilter === 'PENDING') {
      const isPend = s.includes('pending') || s === 'lead' || s === 'contacted' || s === 'interested';
      if (!isPend) return false;
    } else if (leadStatusFilter === 'APPROVED') {
      const isApp = s.includes('approved') || s === 'converted';
      if (!isApp) return false;
    } else if (leadStatusFilter === 'REJECTED') {
      const isRej = s.includes('rejected');
      if (!isRej) return false;
    }

    // 2. Search Query
    if (customerSearch.trim()) {
      const q = customerSearch.toLowerCase();
      const matchName = cust.customer_name?.toLowerCase().includes(q);
      const matchPhone = cust.phone?.includes(q);
      const matchArea = cust.area_name?.toLowerCase().includes(q);
      const matchStaff = cust.marketing_employee_name?.toLowerCase().includes(q);
      const matchScheme = cust.scheme_name?.toLowerCase().includes(q);
      const matchNotes = cust.notes?.toLowerCase().includes(q);
      if (!matchName && !matchPhone && !matchArea && !matchStaff && !matchScheme && !matchNotes) {
        return false;
      }
    }

    return true;
  });

  const filteredCustomers = allDutiesCustomers.filter((c) => {
    if (!customerSearch.trim()) return true;
    const q = customerSearch.toLowerCase();
    return (
      c.customer_name?.toLowerCase().includes(q) ||
      c.phone?.includes(q) ||
      c.area_name?.toLowerCase().includes(q) ||
      c.notes?.toLowerCase().includes(q)
    );
  });

  // Filtered Duties for Photos Tab
  const photoDuties = assignedDuties.filter((d) => {
    if (photoStaffFilter !== 'all' && d.employee_id !== parseInt(photoStaffFilter)) {
      return false;
    }
    const photos = d.photo_urls && d.photo_urls.length > 0 ? d.photo_urls : (d.photo_url ? [d.photo_url] : []);
    return photos.length > 0;
  });

  const totalPhotosCount = assignedDuties.reduce((acc, d) => {
    const urls = d.photo_urls && d.photo_urls.length > 0 ? d.photo_urls : (d.photo_url ? [d.photo_url] : []);
    return acc + urls.length;
  }, 0);

  if (isLoading) {
    return (
      <div className="py-24 flex justify-center bg-white border border-[#E8E6E1] rounded-3xl shadow-xs">
        <LoadingSpinner message="Loading outdoor marketing field operations..." />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      {/* ----------------------------------------------------
          1. TOP LUXURY HERO & DATE FILTER BAR
      ---------------------------------------------------- */}
      <div className="relative bg-linear-to-br from-[#FAF8F3] via-white to-[#F0F7F4] border border-[#C5E3D5] rounded-3xl p-6 sm:p-7 shadow-xs text-[#1D1D1B] overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#23815F]/7 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-60 h-60 bg-[#9A782F]/5 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-[#E8F4EE] text-[#23815F] border border-[#C5E3D5] flex items-center gap-2 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-[#23815F] animate-pulse" />
                <span>Outdoor Marketing & Canvassing Operations</span>
              </span>

              <span className="text-xs font-bold px-3 py-1 rounded-full bg-white text-[#9A782F] border border-[#C6A45C]/30 shadow-2xs">
                {assignedDuties.length} Staff Assigned on {selectedDate}
              </span>
            </div>

            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1D1D1B] tracking-tight flex items-center gap-2.5">
                <Compass className="w-6 h-6 text-[#23815F]" />
                <span>Outdoor Marketing & Daily Field Operations</span>
              </h1>
              <p className="text-xs sm:text-sm text-[#5E5A52] font-medium mt-1 max-w-2xl">
                Assign showroom staff, track targeted locations, jewellery scheme promotions, customer contact records with DOB & anniversaries, Google reviews, and multi-photo proof galleries.
              </p>
            </div>
          </div>

          {/* Date Picker Filter & Quick Actions */}
          <div className="flex items-center gap-3 w-full md:w-auto shrink-0 flex-wrap sm:flex-nowrap bg-white/80 backdrop-blur-xs p-3 rounded-2xl border border-[#C5E3D5] shadow-xs">
            <div className="flex flex-col flex-1 sm:flex-initial">
              <label className="text-[10px] font-bold text-[#8A8479] uppercase tracking-wider mb-1 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-[#23815F]" />
                <span>Selected Field Date</span>
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => handleDateChange(e.target.value)}
                className="w-full sm:w-auto px-3 py-1.5 input-luxury-beige rounded-xl text-xs font-bold text-[#1D1D1B] cursor-pointer"
              />
            </div>

            <div className="h-9 w-px bg-[#C5E3D5] hidden sm:block" />

            <button
              onClick={() => loadData(selectedDate)}
              title="Refresh date data"
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-[#F0F7F4] text-[#23815F] text-xs font-bold border border-[#C5E3D5] shadow-2xs transition-all cursor-pointer sm:mt-auto shrink-0"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* ----------------------------------------------------
          2. FIVE TAB NAVIGATION (SELECT & ASSIGN STAFF IS FIRST)
      ---------------------------------------------------- */}
      <div className="flex items-center gap-2 border-b border-[#C5E3D5] pb-2 overflow-x-auto no-scrollbar">
        {/* TAB 1: Select & Assign Staff (FIRST by Default) */}
        <button
          onClick={() => setActiveTab('assign')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === 'assign'
              ? 'bg-[#23815F] text-white shadow-xs'
              : 'bg-white text-[#5E5A52] hover:bg-[#F0F7F4] hover:text-[#1D1D1B] border border-[#C5E3D5]'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>1. Select & Assign Staff ({allEmployees.length} Total)</span>
        </button>

        {/* TAB 2: Log & Edit Daily Field Entries */}
        <button
          onClick={() => setActiveTab('entries')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === 'entries'
              ? 'bg-[#23815F] text-white shadow-xs'
              : 'bg-white text-[#5E5A52] hover:bg-[#F0F7F4] hover:text-[#1D1D1B] border border-[#C5E3D5]'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>2. Log & Edit Field Entries ({assignedDuties.length})</span>
        </button>

        {/* TAB 3: Daily Staff Status & Work Done */}
        <button
          onClick={() => setActiveTab('status')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === 'status'
              ? 'bg-[#23815F] text-white shadow-xs'
              : 'bg-white text-[#5E5A52] hover:bg-[#F0F7F4] hover:text-[#1D1D1B] border border-[#C5E3D5]'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>3. Daily Staff Status & Work Done ({assignedDuties.length})</span>
        </button>

        {/* TAB 4: Field Photos Gallery (Structured by Employee) */}
        <button
          onClick={() => setActiveTab('photos')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === 'photos'
              ? 'bg-[#23815F] text-white shadow-xs'
              : 'bg-white text-[#5E5A52] hover:bg-[#F0F7F4] hover:text-[#1D1D1B] border border-[#C5E3D5]'
          }`}
        >
          <ImageIcon className="w-4 h-4" />
          <span>4. Field Photos ({totalPhotosCount})</span>
        </button>

        {/* TAB 5: Customer Directory & Leads (With CSV Export) */}
        <button
          onClick={() => setActiveTab('leads')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === 'leads'
              ? 'bg-[#23815F] text-white shadow-xs'
              : 'bg-white text-[#5E5A52] hover:bg-[#F0F7F4] hover:text-[#1D1D1B] border border-[#C5E3D5]'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>5. Customer Leads & Directory ({countAllLeads})</span>
        </button>
      </div>

      {/* ----------------------------------------------------
          TAB 1: SELECT & ASSIGN ALL EMPLOYEES (FIRST TAB)
      ---------------------------------------------------- */}
      {activeTab === 'assign' && (
        <div className="space-y-4">
          <div className="p-5 bg-white border border-[#C5E3D5] rounded-3xl shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-sm font-extrabold text-[#1D1D1B] flex items-center gap-2">
                <Users className="w-4 h-4 text-[#23815F]" />
                <span>Select & Assign Showroom Staff for {selectedDate} ({allEmployees.length} Total)</span>
              </h3>
              <p className="text-xs text-[#5E5A52]">
                Mark the checkboxes for all showroom employees who are assigned to outdoor marketing on this date.
              </p>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <div className="text-xs font-bold text-[#5E5A52] px-3 py-1.5 rounded-xl bg-[#FAF8F3] border border-[#E4DFD4]">
                Selected: <strong className="text-[#23815F] text-sm">{selectedEmployeeIds.length}</strong> / {allEmployees.length} Staff
              </div>

              <button
                onClick={handleSelectAllStaff}
                className="text-xs font-bold text-[#23815F] hover:underline cursor-pointer px-2 py-1"
              >
                Select All
              </button>
              <span className="text-[#8A8479] text-xs">•</span>
              <button
                onClick={handleClearStaffSelection}
                className="text-xs font-bold text-[#8A8479] hover:text-[#C24141] cursor-pointer px-2 py-1"
              >
                Clear
              </button>

              <button
                onClick={handleSaveAssignments}
                disabled={isAssigning}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-linear-to-r from-[#23815F] to-[#1B694C] hover:from-[#1B694C] hover:to-[#14533C] text-white text-xs font-extrabold shadow-sm transition-all cursor-pointer hover:scale-[1.02] disabled:opacity-50"
              >
                {isAssigning ? (
                  <span>Saving Assignments...</span>
                ) : (
                  <>
                    <span>Assign & Go to Daily Field Entries</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Search & Filter */}
          <div className="p-4 bg-white border border-[#C5E3D5] rounded-2xl shadow-xs flex flex-col sm:flex-row items-center gap-3 justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-[#8A8479] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchStaff}
                onChange={(e) => setSearchStaff(e.target.value)}
                placeholder="Search staff name, code, or role..."
                className="w-full pl-9 pr-3.5 py-2 input-luxury-beige rounded-xl text-xs font-medium"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <Filter className="w-3.5 h-3.5 text-[#23815F]" />
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="select-luxury-slate rounded-xl px-3 py-2 text-xs font-semibold cursor-pointer"
              >
                <option value="all">All Departments</option>
                {departments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
            {filteredStaff.map((emp) => {
              const isSelected = selectedEmployeeIds.includes(emp.id);
              return (
                <div
                  key={emp.id}
                  onClick={() => toggleEmployeeSelect(emp.id)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 select-none ${
                    isSelected
                      ? 'bg-[#E8F4EE] border-[#23815F] shadow-xs'
                      : 'bg-white border-[#C5E3D5] hover:border-[#23815F]/50 hover:bg-[#FAFDFB]'
                  }`}
                >
                  <div className="mt-0.5">
                    {isSelected ? (
                      <CheckSquare className="w-5 h-5 text-[#23815F]" />
                    ) : (
                      <Square className="w-5 h-5 text-[#8A8479]" />
                    )}
                  </div>

                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <h4 className="text-xs font-extrabold text-[#1D1D1B] truncate">{emp.full_name}</h4>
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-white text-[#23815F] border border-[#C5E3D5] shrink-0">
                        {emp.employee_code}
                      </span>
                    </div>

                    <p className="text-[11px] text-[#5E5A52] truncate">{emp.designation}</p>
                    <p className="text-[10px] text-[#8A8479] truncate">{emp.department}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ----------------------------------------------------
          TAB 2: LOG & EDIT DAILY FIELD ENTRIES
      ---------------------------------------------------- */}
      {activeTab === 'entries' && (
        <div className="space-y-6">
          <div className="p-4 sm:p-5 bg-white border border-[#C5E3D5] rounded-3xl shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-extrabold text-[#1D1D1B] flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#23815F]" />
                <span>Field Marketing Entry Sheet for {selectedDate}</span>
              </h3>
              <p className="text-xs text-[#5E5A52] mt-0.5">
                Add targeted area, promoted scheme, attended customers, converted customers (with DOB, anniversary & Google reviews), and compact field photo gallery.
              </p>
            </div>

            <button
              onClick={() => setActiveTab('assign')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#FAF8F3] hover:bg-[#F0F7F4] text-[#23815F] text-xs font-bold border border-[#C5E3D5] shadow-2xs transition-all cursor-pointer shrink-0"
            >
              <Users className="w-3.5 h-3.5" />
              <span>+ Add / Change Assigned Staff</span>
            </button>
          </div>

          {assignedDuties.length === 0 ? (
            <div className="p-12 text-center bg-white border border-[#C5E3D5] rounded-3xl space-y-4">
              <Compass className="w-12 h-12 text-[#23815F] mx-auto opacity-50" />
              <div className="space-y-1">
                <h3 className="text-base font-extrabold text-[#1D1D1B]">No Staff Assigned for {selectedDate}</h3>
                <p className="text-xs text-[#5E5A52] max-w-md mx-auto">
                  Select which showroom employees are going for outdoor marketing on this date to start logging entries.
                </p>
              </div>
              <button
                onClick={() => setActiveTab('assign')}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#23815F] hover:bg-[#1B694C] text-white text-xs font-extrabold shadow-sm transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Assign Staff for {selectedDate}</span>
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {assignedDuties.map((duty) => {
                const form = dutyForms[duty.id] || {
                  area: '',
                  customers_attended_count: 0,
                  converted_customers_count: 0,
                  google_ratings_count: 0,
                  photo_url: '',
                  photo_urls: [],
                  notes: '',
                  status: 'Assigned',
                  isUploadingPhotos: false,
                  isSaving: false,
                  attendedList: [],
                  convertedList: [],
                };

                return (
                  <div
                    key={duty.id}
                    className="bg-white border-2 border-[#C5E3D5] hover:border-[#23815F] rounded-3xl p-5 sm:p-7 shadow-xs space-y-5 transition-all"
                  >
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#C5E3D5]">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-[#E8F4EE] text-[#23815F] border border-[#C5E3D5] flex items-center justify-center font-extrabold text-base shadow-2xs">
                          {duty.employee_name?.charAt(0) || 'E'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-sm sm:text-base font-extrabold text-[#1D1D1B]">
                              {duty.employee_name}
                            </h4>
                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#E8F4EE] text-[#23815F] border border-[#C5E3D5]">
                              {duty.employee_code}
                            </span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                form.status === 'Completed'
                                  ? 'bg-[#E8F4EE] text-[#23815F] border border-[#C5E3D5]'
                                  : form.status === 'Pending Review'
                                  ? 'bg-[#FEFCE8] text-[#854D0E] border border-[#EAB308] animate-pulse'
                                  : 'bg-[#FAF8F3] text-[#8A8479] border border-[#E4DFD4]'
                              }`}
                            >
                              {form.status === 'Pending Review' ? '⏳ Pending Review' : form.status}
                            </span>
                          </div>
                          <p className="text-xs text-[#5E5A52] font-medium mt-0.5">
                            {duty.designation} • {duty.department}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-2.5 w-full sm:w-auto flex-wrap">
                        {form.status === 'Pending Review' && (
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleReviewDuty(duty.id, 'APPROVE')}
                              className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs cursor-pointer transition-all"
                              title="Approve this staff outdoor duty"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Approve Duty</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleReviewDuty(duty.id, 'REJECT')}
                              className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs cursor-pointer transition-all"
                              title="Reject this staff outdoor duty"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>Reject Duty</span>
                            </button>
                          </div>
                        )}

                        <button
                          onClick={() => handleSaveDuty(duty.id)}
                          disabled={form.isSaving}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-linear-to-r from-[#23815F] to-[#1B694C] hover:from-[#1B694C] hover:to-[#14533C] text-white text-xs font-extrabold shadow-sm transition-all cursor-pointer hover:scale-[1.02] disabled:opacity-50"
                        >
                          <Save className="w-3.5 h-3.5" />
                          <span>{form.isSaving ? 'Saving...' : form.status === 'Pending Review' ? '✓ Save Changes' : 'Save Employee Log'}</span>
                        </button>

                        <button
                          onClick={() => setDeleteDutyId(duty.id)}
                          title="Remove assignment"
                          className="p-2 text-[#8A8479] hover:text-[#C24141] hover:bg-[#FDECEC] rounded-xl transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Outdoor Attended Customers & Leads Section */}
                    <div className="space-y-4 bg-[#FAF8F3] border border-[#E4DFD4] rounded-2xl p-4 sm:p-5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#EBE6DC] pb-3">
                        <div>
                          <label className="text-xs sm:text-sm font-extrabold text-[#1D1D1B] flex items-center gap-1.5">
                            <Users className="w-4 h-4 text-[#23815F]" />
                            <span>Outdoor Attended Customers & Leads ({form.attendedList.length})</span>
                          </label>
                          <p className="text-[11px] text-[#5E5A52] mt-0.5">
                            Enter individual location, proof photo (1), follow-up date, jewelry interest, and notes per customer.
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => addAttendedCustomer(duty.id)}
                          className="bg-[#23815F] hover:bg-[#1B694C] text-white font-extrabold text-xs inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl shadow-xs cursor-pointer w-full sm:w-auto"
                        >
                          <Plus className="w-3.5 h-3.5 text-white" />
                          <span>+ Add Customer Lead</span>
                        </button>
                      </div>

                      {form.attendedList.length === 0 ? (
                        <div className="py-8 text-center space-y-2">
                          <p className="text-xs text-[#8A8479]">No customer leads added yet for this employee.</p>
                          <button
                            type="button"
                            onClick={() => addAttendedCustomer(duty.id)}
                            className="bg-[#23815F] hover:bg-[#1B694C] text-white font-extrabold text-xs inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl shadow-xs cursor-pointer w-full sm:w-auto"
                          >
                            <Plus className="w-4 h-4 text-white" />
                            <span>+ Add First Customer Lead</span>
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-4 pt-1">
                          {form.attendedList.map((cust, cIdx) => (
                            <div
                              key={cIdx}
                              className="bg-white border border-[#C5E3D5] rounded-2xl p-4 sm:p-4.5 space-y-3.5 shadow-2xs hover:border-[#23815F] transition-all"
                            >
                              {/* Customer Header */}
                              <div className="flex items-center justify-between border-b border-[#EBE6DC] pb-2.5">
                                <div className="flex items-center gap-2">
                                  <span className="px-2.5 py-0.5 rounded-lg bg-[#23815F] text-white text-[11px] font-black">
                                    #{cIdx + 1}
                                  </span>
                                  <span className="text-xs font-bold text-[#1D1D1B]">
                                    {cust.name.trim() || `Customer Lead #${cIdx + 1}`}
                                  </span>
                                  {cust.is_converted && (
                                    <span className="px-2 py-0.5 rounded-md bg-[#E8F4EE] text-[#21845F] border border-[#A7F3D0] text-[10px] font-black">
                                      ✓ Converted to Sale
                                    </span>
                                  )}
                                </div>

                                <button
                                  type="button"
                                  onClick={() => removeAttendedCustomer(duty.id, cIdx)}
                                  className="p-1 text-[#8A8479] hover:text-red-600 rounded-lg transition-colors cursor-pointer"
                                  title="Remove this customer lead"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>

                              {/* Form Fields Container */}
                              <div className="space-y-3.5">
                                {/* Row 1: Name & Phone */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  <div>
                                    <label className="block text-[11px] font-bold text-[#5E5A52] uppercase mb-1 flex items-center gap-1">
                                      <User className="w-3 h-3 text-[#23815F]" />
                                      <span>Customer Name <span className="text-red-500">*</span></span>
                                    </label>
                                    <input
                                      type="text"
                                      value={cust.name}
                                      onChange={(e) => updateAttendedCustomer(duty.id, cIdx, 'name', e.target.value)}
                                      placeholder="Full name"
                                      className="w-full px-3 py-2 bg-white border border-[#CBD5E1] rounded-xl text-xs text-[#1D1D1B] focus:border-[#23815F] focus:outline-hidden font-medium"
                                    />
                                  </div>

                                  <div>
                                    <label className="block text-[11px] font-bold text-[#5E5A52] uppercase mb-1 flex items-center gap-1">
                                      <Phone className="w-3 h-3 text-[#23815F]" />
                                      <span>Mobile Number</span>
                                    </label>
                                    <input
                                      type="tel"
                                      value={cust.phone}
                                      onChange={(e) => updateAttendedCustomer(duty.id, cIdx, 'phone', e.target.value)}
                                      placeholder="10-digit mobile"
                                      className="w-full px-3 py-2 bg-white border border-[#CBD5E1] rounded-xl text-xs text-[#1D1D1B] focus:border-[#23815F] focus:outline-hidden font-mono"
                                    />
                                  </div>
                                </div>

                                {/* Row 2: Location & Proof Photo (1) */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  <div>
                                    <label className="block text-[11px] font-bold text-[#5E5A52] uppercase mb-1 flex items-center gap-1">
                                      <MapPin className="w-3 h-3 text-[#23815F]" />
                                      <span>Field Location / Market Area</span>
                                    </label>
                                    <input
                                      type="text"
                                      value={cust.area_name}
                                      onChange={(e) => updateAttendedCustomer(duty.id, cIdx, 'area_name', e.target.value)}
                                      placeholder="e.g. Market Booth, Yelahanka 4th Cross..."
                                      className="w-full px-3 py-2 bg-white border border-[#CBD5E1] rounded-xl text-xs text-[#1D1D1B] focus:border-[#23815F] focus:outline-hidden font-medium"
                                    />
                                  </div>

                                  <div>
                                    <label className="block text-[11px] font-bold text-[#5E5A52] uppercase mb-1 flex items-center gap-1">
                                      <Camera className="w-3 h-3 text-[#23815F]" />
                                      <span>Field Photo (1) Proof</span>
                                    </label>

                                    {cust.photo_url ? (
                                      <div className="flex items-center gap-2 bg-white border border-[#C5E3D5] rounded-xl p-1.5 shadow-2xs">
                                        <img
                                          src={cust.photo_url.startsWith('http') ? cust.photo_url : `/api/media/${cust.photo_url.replace(/^uploads\//, '')}`}
                                          alt="Customer Photo Proof"
                                          className="w-10 h-10 object-cover rounded-lg border border-[#E6E1D6] shrink-0"
                                        />
                                        <div className="flex-1 min-w-0">
                                          <p className="text-[11px] font-bold text-[#23815F] truncate">Photo Attached</p>
                                          <p className="text-[10px] text-[#8A8479]">1 proof uploaded</p>
                                        </div>
                                        <div className="flex items-center gap-1 shrink-0 pr-1">
                                          <button
                                            type="button"
                                            onClick={() =>
                                              handleOpenLightbox(
                                                [cust.photo_url],
                                                0,
                                                duty.employee_name,
                                                `${cust.area_name || duty.area} (${selectedDate})`
                                              )
                                            }
                                            className="p-1.5 rounded-lg bg-[#E8F4EE] hover:bg-[#D1FAE5] text-[#21845F] transition-all cursor-pointer"
                                            title="View Photo"
                                          >
                                            <Eye className="w-3.5 h-3.5" />
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => updateAttendedCustomer(duty.id, cIdx, 'photo_url', '')}
                                            className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition-all cursor-pointer"
                                            title="Remove Photo"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      </div>
                                    ) : (
                                      <label className="flex items-center justify-center gap-1.5 w-full py-2 px-3 rounded-xl border border-dashed border-[#CBD5E1] hover:border-[#23815F] bg-white hover:bg-[#E8F4EE] text-xs font-bold text-[#23815F] cursor-pointer transition-all shadow-2xs">
                                        {uploadingCustomerPhotoKey === `${duty.id}-${cIdx}` ? (
                                          <Loader2 className="w-3.5 h-3.5 animate-spin text-[#23815F]" />
                                        ) : (
                                          <Camera className="w-3.5 h-3.5 text-[#23815F]" />
                                        )}
                                        <span>
                                          {uploadingCustomerPhotoKey === `${duty.id}-${cIdx}`
                                            ? 'Uploading photo...'
                                            : '+ Upload Field Photo (1)'}
                                        </span>
                                        <input
                                          type="file"
                                          accept="image/*"
                                          capture="environment"
                                          onChange={(e) => handleCustomerPhotoUpload(duty.id, cIdx, e)}
                                          disabled={uploadingCustomerPhotoKey === `${duty.id}-${cIdx}`}
                                          className="hidden"
                                        />
                                      </label>
                                    )}
                                  </div>
                                </div>

                                {/* Row 3: Important Dates (DOB, Anniversary, Follow-up / Notification Date) */}
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                  <div>
                                    <label className="block text-[11px] font-bold text-[#5E5A52] uppercase mb-1 flex items-center gap-1">
                                      <Cake className="w-3 h-3 text-[#7E22CE]" />
                                      <span>Date of Birth</span>
                                    </label>
                                    <input
                                      type="date"
                                      value={cust.dob}
                                      onChange={(e) => updateAttendedCustomer(duty.id, cIdx, 'dob', e.target.value)}
                                      className="w-full px-3 py-2 bg-white border border-[#CBD5E1] rounded-xl text-xs text-[#1D1D1B] focus:border-[#23815F] focus:outline-hidden font-medium cursor-pointer"
                                    />
                                  </div>

                                  <div>
                                    <label className="block text-[11px] font-bold text-[#5E5A52] uppercase mb-1 flex items-center gap-1">
                                      <Heart className="w-3 h-3 text-[#D97706]" />
                                      <span>Anniversary Date</span>
                                    </label>
                                    <input
                                      type="date"
                                      value={cust.anniversary_date}
                                      onChange={(e) => updateAttendedCustomer(duty.id, cIdx, 'anniversary_date', e.target.value)}
                                      className="w-full px-3 py-2 bg-white border border-[#CBD5E1] rounded-xl text-xs text-[#1D1D1B] focus:border-[#23815F] focus:outline-hidden font-medium cursor-pointer"
                                    />
                                  </div>

                                  <div>
                                    <label className="block text-[11px] font-bold text-[#5E5A52] uppercase mb-1 flex items-center gap-1">
                                      <Bell className="w-3 h-3 text-[#2563EB]" />
                                      <span className="text-[#1E40AF] font-black">Follow-up / Notification Date</span>
                                    </label>
                                    <input
                                      type="date"
                                      value={cust.follow_up_date}
                                      onChange={(e) => updateAttendedCustomer(duty.id, cIdx, 'follow_up_date', e.target.value)}
                                      className="w-full px-3 py-2 bg-[#EFF6FF] border border-[#93C5FD] rounded-xl text-xs text-[#1E3A8A] focus:border-[#2563EB] focus:outline-hidden font-medium cursor-pointer"
                                    />
                                  </div>
                                </div>

                                {/* Promoted Gold Scheme */}
                                <div className="space-y-1 pt-2 border-t border-[#EBE6DC]/80">
                                  <label className="block text-[11px] font-bold text-[#5E5A52] uppercase flex items-center gap-1">
                                    <Award className="w-3 h-3 text-[#B45309]" />
                                    <span>Promoted Gold Scheme / Savings Plan</span>
                                  </label>
                                  <div className="flex flex-wrap gap-1.5">
                                    {SCHEMES.map((scheme) => {
                                      const isSelected = cust.scheme_name === scheme;
                                      return (
                                        <button
                                          key={scheme}
                                          type="button"
                                          onClick={() =>
                                            updateAttendedCustomer(
                                              duty.id,
                                              cIdx,
                                              'scheme_name',
                                              isSelected ? '' : scheme
                                            )
                                          }
                                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                                            isSelected
                                              ? 'bg-[#FEF9C3] text-[#854D0E] border-[#CA8A04] shadow-xs ring-1 ring-[#CA8A04]'
                                              : 'bg-white text-[#5E5A52] border-[#CBD5E1] hover:bg-[#FAF8F5]'
                                          }`}
                                        >
                                          {scheme}
                                        </button>
                                      );
                                    })}
                                    {cust.scheme_name && (
                                      <button
                                        type="button"
                                        onClick={() => updateAttendedCustomer(duty.id, cIdx, 'scheme_name', '')}
                                        className="px-2 py-1 rounded-lg text-[10px] font-bold text-rose-600 hover:bg-rose-50 border border-rose-200 cursor-pointer"
                                      >
                                        Clear Scheme
                                      </button>
                                    )}
                                  </div>
                                </div>

                                {/* Jewelry Interest & Conversion Row */}
                                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#EBE6DC]/80">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-[11px] font-bold text-[#5E5A52] uppercase mr-1">
                                      Interested In:
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => updateAttendedCustomer(duty.id, cIdx, 'interested_gold', !cust.interested_gold)}
                                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                                        cust.interested_gold
                                          ? 'bg-[#FEFCE8] text-[#854D0E] border-[#CA8A04] shadow-2xs font-black'
                                          : 'bg-white text-[#5E5A52] border-[#CBD5E1] hover:bg-[#FAF8F5]'
                                      }`}
                                    >
                                      <span>🪙 Gold</span>
                                      {cust.interested_gold && <Check className="w-3 h-3 text-[#854D0E]" />}
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => updateAttendedCustomer(duty.id, cIdx, 'interested_diamond', !cust.interested_diamond)}
                                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                                        cust.interested_diamond
                                          ? 'bg-[#EFF6FF] text-[#1E40AF] border-[#3B82F6] shadow-2xs font-black'
                                          : 'bg-white text-[#5E5A52] border-[#CBD5E1] hover:bg-[#FAF8F5]'
                                      }`}
                                    >
                                      <span>💎 Diamond</span>
                                      {cust.interested_diamond && <Check className="w-3 h-3 text-[#1E40AF]" />}
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => updateAttendedCustomer(duty.id, cIdx, 'interested_silver', !cust.interested_silver)}
                                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                                        cust.interested_silver
                                          ? 'bg-[#F1F5F9] text-[#334155] border-[#64748B] shadow-2xs font-black'
                                          : 'bg-white text-[#5E5A52] border-[#CBD5E1] hover:bg-[#FAF8F5]'
                                      }`}
                                    >
                                      <span>🥈 Silver</span>
                                      {cust.interested_silver && <Check className="w-3 h-3 text-[#334155]" />}
                                    </button>
                                  </div>

                                  <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-[#CBD5E1] hover:border-[#23815F] text-xs font-bold text-[#1D1D1B] cursor-pointer shadow-2xs transition-all">
                                    <input
                                      type="checkbox"
                                      checked={Boolean(cust.is_converted)}
                                      onChange={(e) => updateAttendedCustomer(duty.id, cIdx, 'is_converted', e.target.checked)}
                                      className="w-4 h-4 text-[#23815F] rounded border-[#CBD5E1] focus:ring-[#23815F]"
                                    />
                                    <span className={cust.is_converted ? 'text-[#21845F] font-black' : 'text-[#5E5A52]'}>
                                      Converted to Sale / Order
                                    </span>
                                  </label>
                                </div>

                                {/* Reviews & Feedback Row */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-[#EBE6DC]/80">
                                  {/* Google Review Box */}
                                  <div className={`p-3 rounded-xl border transition-all ${
                                    cust.has_google_review ? 'bg-[#FEFCE8] border-[#CA8A04]' : 'bg-white border-[#E6E1D6]'
                                  }`}>
                                    <label className="inline-flex items-center gap-2 text-xs font-bold text-[#1D1D1B] cursor-pointer mb-2">
                                      <input
                                        type="checkbox"
                                        checked={cust.has_google_review}
                                        onChange={(e) => updateAttendedCustomer(duty.id, cIdx, 'has_google_review', e.target.checked)}
                                        className="w-4 h-4 text-[#CA8A04] rounded border-[#CBD5E1] focus:ring-[#CA8A04]"
                                      />
                                      <span className="flex items-center gap-1 text-[#854D0E] font-black">
                                        <Star className="w-3.5 h-3.5 fill-[#CA8A04] text-[#CA8A04]" />
                                        <span>Google 5-Star Review Given</span>
                                      </span>
                                    </label>

                                    {cust.has_google_review && (
                                      <div className="space-y-2 mt-2 pt-2 border-t border-[#FDE047]">
                                        <div className="flex items-center gap-1.5">
                                          <span className="text-[11px] font-bold text-[#854D0E]">Rating:</span>
                                          {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                              key={star}
                                              type="button"
                                              onClick={() => updateAttendedCustomer(duty.id, cIdx, 'google_review_rating', star)}
                                              className="p-0.5 cursor-pointer"
                                            >
                                              <Star
                                                className={`w-4 h-4 ${
                                                  star <= (cust.google_review_rating || 5)
                                                    ? 'fill-[#F59E0B] text-[#F59E0B]'
                                                    : 'text-gray-300'
                                                }`}
                                              />
                                            </button>
                                          ))}
                                        </div>
                                        <input
                                          type="text"
                                          placeholder="Review remark / snippet..."
                                          value={cust.google_review_text}
                                          onChange={(e) => updateAttendedCustomer(duty.id, cIdx, 'google_review_text', e.target.value)}
                                          className="w-full px-2.5 py-1.5 bg-white border border-[#CBD5E1] rounded-lg text-xs text-[#1D1D1B] focus:border-[#CA8A04] focus:outline-hidden"
                                        />
                                      </div>
                                    )}
                                  </div>

                                  {/* Customer Feedback Box */}
                                  <div className={`p-3 rounded-xl border transition-all ${
                                    cust.has_customer_feedback ? 'bg-[#FAF5FF] border-[#A855F7]' : 'bg-white border-[#E6E1D6]'
                                  }`}>
                                    <label className="inline-flex items-center gap-2 text-xs font-bold text-[#1D1D1B] cursor-pointer mb-2">
                                      <input
                                        type="checkbox"
                                        checked={cust.has_customer_feedback || false}
                                        onChange={(e) => updateAttendedCustomer(duty.id, cIdx, 'has_customer_feedback', e.target.checked)}
                                        className="w-4 h-4 text-[#7E22CE] rounded border-[#CBD5E1] focus:ring-[#7E22CE]"
                                      />
                                      <span className="flex items-center gap-1 text-[#7E22CE] font-black">
                                        <MessageSquareHeart className="w-3.5 h-3.5 text-[#7E22CE]" />
                                        <span>Customer Feedback Recorded</span>
                                      </span>
                                    </label>

                                    {cust.has_customer_feedback && (
                                      <div className="space-y-2 mt-2 pt-2 border-t border-[#E9D5FF]">
                                        <div className="flex items-center gap-1.5">
                                          <span className="text-[11px] font-bold text-[#7E22CE]">Rating:</span>
                                          {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                              key={star}
                                              type="button"
                                              onClick={() => updateAttendedCustomer(duty.id, cIdx, 'feedback_rating', star)}
                                              className="p-0.5 cursor-pointer"
                                            >
                                              <Star
                                                className={`w-4 h-4 ${
                                                  star <= (cust.feedback_rating || 5)
                                                    ? 'fill-[#7E22CE] text-[#7E22CE]'
                                                    : 'text-gray-300'
                                                }`}
                                              />
                                            </button>
                                          ))}
                                        </div>
                                        <input
                                          type="text"
                                          placeholder="Customer feedback notes, designs inquired..."
                                          value={cust.feedback_text || ''}
                                          onChange={(e) => updateAttendedCustomer(duty.id, cIdx, 'feedback_text', e.target.value)}
                                          className="w-full px-2.5 py-1.5 bg-white border border-[#CBD5E1] rounded-lg text-xs text-[#1D1D1B] focus:border-[#7E22CE] focus:outline-hidden"
                                        />
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Row 6: Duty Field Notes / Team Observations for this Customer */}
                                <div>
                                  <label className="block text-[11px] font-bold text-[#5E5A52] uppercase mb-1 flex items-center gap-1">
                                    <Edit2 className="w-3 h-3 text-[#7E22CE]" />
                                    <span>Duty Field Notes / Team Observations</span>
                                  </label>
                                  <textarea
                                    rows={2}
                                    placeholder="Conversation notes, customer inquiries, designs requested, follow-up notes..."
                                    value={cust.notes}
                                    onChange={(e) => updateAttendedCustomer(duty.id, cIdx, 'notes', e.target.value)}
                                    className="w-full px-3 py-2 bg-white border border-[#CBD5E1] rounded-xl text-xs text-[#1D1D1B] focus:border-[#23815F] focus:outline-hidden font-medium resize-none"
                                  />
                                </div>
                              </div>
                            </div>
                          ))}

                          <button
                            type="button"
                            onClick={() => addAttendedCustomer(duty.id)}
                            className="w-full py-3.5 rounded-2xl border-2 border-dashed border-[#C5E3D5] hover:border-[#23815F] bg-[#FAF8F5] hover:bg-[#E8F4EE] text-[#23815F] font-extrabold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs"
                          >
                            <Plus className="w-4 h-4" />
                            <span>+ Add Another Customer Lead for {duty.employee_name}</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Staff Field Observations / Notes */}
                    <div>
                      <label className="text-xs font-extrabold text-[#1D1D1B] block mb-1">
                        Staff Field Observations / Notes
                      </label>
                      <textarea
                        rows={2}
                        value={form.notes}
                        onChange={(e) => updateDutyFormField(duty.id, 'notes', e.target.value)}
                        placeholder="e.g. High response for Swarna Nidhi scheme. Customer inquiries on bridal advance."
                        className="w-full px-3.5 py-2 input-luxury-beige rounded-xl text-xs font-medium resize-none"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ----------------------------------------------------
          TAB 3: DAILY STAFF STATUS & WORK DONE
      ---------------------------------------------------- */}
      {activeTab === 'status' && (
        <div className="space-y-4">
          <div className="p-4 sm:p-5 bg-white border border-[#C5E3D5] rounded-3xl shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-extrabold text-[#1D1D1B] flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#23815F]" />
                <span>All Staff Attended Today ({selectedDate}) — Outdoor Work Summary</span>
              </h3>
              <p className="text-xs text-[#5E5A52] mt-0.5">
                Click on any staff card below to open full details of their work, visited area, scheme, all customer records with DOB & anniversaries, Google reviews, and photos.
              </p>
            </div>

            <button
              onClick={() => setActiveTab('assign')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#23815F] hover:bg-[#1B694C] text-white text-xs font-bold shadow-xs transition-all cursor-pointer shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Assign Staff For Today</span>
            </button>
          </div>

          {assignedDuties.length === 0 ? (
            <div className="p-12 text-center bg-white border border-[#C5E3D5] rounded-3xl space-y-4">
              <Compass className="w-12 h-12 text-[#23815F] mx-auto opacity-50" />
              <div className="space-y-1">
                <h3 className="text-base font-extrabold text-[#1D1D1B]">No Outdoor Staff Assigned for {selectedDate}</h3>
                <p className="text-xs text-[#5E5A52] max-w-md mx-auto">
                  Select and assign showroom staff members to view their daily outdoor status and work progress.
                </p>
              </div>
              <button
                onClick={() => setActiveTab('assign')}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#23815F] hover:bg-[#1B694C] text-white text-xs font-extrabold shadow-sm transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Assign Staff for {selectedDate}</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {assignedDuties.map((duty) => {
                const photos = duty.photo_urls && duty.photo_urls.length > 0
                  ? duty.photo_urls
                  : (duty.photo_url ? [duty.photo_url] : []);
                const googleReviewsCount = duty.customers.filter((c) => c.has_google_review).length || duty.google_ratings_count;

                return (
                  <div
                    key={duty.id}
                    onClick={() => setViewDetailDuty(duty)}
                    className="bg-white border-2 border-[#C5E3D5] hover:border-[#23815F] rounded-3xl p-5 shadow-xs hover:shadow-md transition-all cursor-pointer space-y-4 flex flex-col justify-between group"
                  >
                    <div className="space-y-3">
                      {/* Card Header: Avatar, Name, Code, Status */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-2xl bg-[#E8F4EE] text-[#23815F] border border-[#C5E3D5] flex items-center justify-center font-extrabold text-sm shadow-2xs group-hover:scale-105 transition-transform">
                            {duty.employee_name?.charAt(0) || 'E'}
                          </div>
                          <div>
                            <h4 className="text-sm font-extrabold text-[#1D1D1B] group-hover:text-[#23815F] transition-colors">
                              {duty.employee_name}
                            </h4>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#E8F4EE] text-[#23815F] border border-[#C5E3D5]">
                                {duty.employee_code}
                              </span>
                              <span className="text-[11px] text-[#5E5A52] truncate">
                                {duty.designation}
                              </span>
                            </div>
                          </div>
                        </div>

                        <span
                          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full shrink-0 ${
                            duty.status === 'Completed'
                              ? 'bg-[#E8F4EE] text-[#23815F] border border-[#C5E3D5]'
                              : duty.status === 'Pending Review'
                              ? 'bg-[#FEFCE8] text-[#854D0E] border border-[#EAB308]'
                              : 'bg-[#FAF6EB] text-[#9A782F] border border-[#C6A45C]/30'
                          }`}
                        >
                          {duty.status === 'Pending Review' ? '⏳ Pending Review' : duty.status}
                        </span>
                      </div>

                      {/* Targeted Area & Scheme */}
                      <div className="space-y-1.5 bg-[#FAF8F3] border border-[#E4DFD4] rounded-2xl p-3">
                        <div className="flex items-center gap-1.5 text-xs font-extrabold text-[#1D1D1B] truncate">
                          <MapPin className="w-3.5 h-3.5 text-[#23815F]" />
                          <span>{duty.area || 'Area Pending Entry'}</span>
                        </div>

                      </div>

                      {/* Performance Metric Badges */}
                      <div className="grid grid-cols-3 gap-2 text-center pt-1">
                        <div className="p-2 rounded-xl bg-[#E8F4EE]/60 border border-[#C5E3D5]/60">
                          <span className="text-[10px] font-bold text-[#5E5A52] uppercase block">Attended</span>
                          <span className="text-sm font-extrabold text-[#23815F]">
                            {duty.customers_attended_count || duty.customers.length}
                          </span>
                        </div>

                        <div className="p-2 rounded-xl bg-[#FAF6EB]/60 border border-[#C6A45C]/20">
                          <span className="text-[10px] font-bold text-[#5E5A52] uppercase block">Interested</span>
                          <span className="text-sm font-extrabold text-[#9A782F]">
                            {duty.customers.filter((c) => c.interested_in && c.interested_in.trim() !== '').length}
                          </span>
                        </div>

                        <div className="p-2 rounded-xl bg-amber-50/60 border border-amber-200/60">
                          <span className="text-[10px] font-bold text-[#5E5A52] uppercase block">Google ⭐</span>
                          <span className="text-sm font-extrabold text-amber-600">
                            {googleReviewsCount}
                          </span>
                        </div>
                      </div>

                      {/* Compact Photos Preview Strip */}
                      {photos.length > 0 && (
                        <div className="flex items-center gap-2 pt-1 overflow-x-auto">
                          {photos.slice(0, 4).map((photoUrl, pIdx) => (
                            <img
                              key={pIdx}
                              src={photoUrl}
                              alt="Proof"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenLightbox(
                                  photos,
                                  pIdx,
                                  `${duty.employee_name} — Photo #${pIdx + 1}`,
                                  `Area: ${duty.area} • Date: ${duty.date}`
                                );
                              }}
                              className="w-11 h-11 rounded-xl object-cover border border-[#C5E3D5] shrink-0 hover:scale-105 transition-transform"
                            />
                          ))}
                          {photos.length > 4 && (
                            <span className="text-[10px] font-bold text-[#23815F] px-2 py-1 bg-[#E8F4EE] rounded-xl border border-[#C5E3D5]">
                              +{photos.length - 4}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Bottom Action */}
                    <div className="pt-3 border-t border-[#E8E6E1] flex items-center justify-between text-xs font-bold text-[#23815F] group-hover:underline">
                      <span>View Full Work & Customer Details →</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ----------------------------------------------------
          TAB 4: FIELD PHOTOS GALLERY (SLIM & COMPACT BY EMPLOYEE)
      ---------------------------------------------------- */}
      {activeTab === 'photos' && (
        <div className="space-y-4">
          <div className="p-4 sm:p-5 bg-white border border-[#C5E3D5] rounded-3xl shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-extrabold text-[#1D1D1B] flex items-center gap-2">
                <Camera className="w-4 h-4 text-[#23815F]" />
                <span>Field Photo Gallery for {selectedDate} ({totalPhotosCount} Photos)</span>
              </h3>
              <p className="text-xs text-[#5E5A52] mt-0.5">
                Compact proofs per employee. Click any thumbnail to expand full-screen view.
              </p>
            </div>

            {/* Employee Filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#5E5A52]">Filter Staff:</span>
              <select
                value={photoStaffFilter}
                onChange={(e) => setPhotoStaffFilter(e.target.value)}
                className="select-luxury-slate rounded-xl px-3 py-1.5 text-xs font-bold cursor-pointer"
              >
                <option value="all">All Staff ({assignedDuties.length})</option>
                {assignedDuties.map((d) => (
                  <option key={d.employee_id} value={d.employee_id.toString()}>
                    {d.employee_name} ({d.employee_code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {photoDuties.length === 0 ? (
            <div className="p-12 text-center bg-white border border-[#C5E3D5] rounded-3xl space-y-3">
              <ImageIcon className="w-12 h-12 text-[#23815F] mx-auto opacity-50" />
              <h3 className="text-base font-extrabold text-[#1D1D1B]">No Field Photos for {selectedDate}</h3>
              <p className="text-xs text-[#5E5A52] max-w-md mx-auto">
                Upload photos under the "Log & Edit Field Entries" tab for any assigned employee.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {photoDuties.map((duty) => {
                const photos = duty.photo_urls && duty.photo_urls.length > 0
                  ? duty.photo_urls
                  : (duty.photo_url ? [duty.photo_url] : []);

                return (
                  <div
                    key={duty.id}
                    className="bg-white border border-[#C5E3D5] hover:border-[#23815F] rounded-2xl p-4 space-y-3 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between"
                  >
                    {/* Compact Employee Header */}
                    <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-[#E8E6E1]">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-[#E8F4EE] text-[#23815F] border border-[#C5E3D5] flex items-center justify-center font-extrabold text-xs shrink-0 shadow-2xs">
                          {duty.employee_name?.charAt(0) || 'E'}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <h4 className="text-xs font-extrabold text-[#1D1D1B] truncate">
                              {duty.employee_name}
                            </h4>
                            <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-[#E8F4EE] text-[#23815F] border border-[#C5E3D5] shrink-0">
                              {duty.employee_code}
                            </span>
                          </div>
                          <p className="text-[11px] text-[#5E5A52] truncate flex items-center gap-1.5 mt-0.5">
                            <span>📍 {duty.area || 'Field Area'}</span>
                            <span>•</span>
                            <span className="truncate">🏆 {duty.scheme_name || 'Scheme'}</span>
                          </p>
                        </div>
                      </div>

                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-[#FAF8F3] text-[#23815F] border border-[#C5E3D5] shrink-0">
                        📸 {photos.length}
                      </span>
                    </div>

                    {/* Compact Horizontal Photo Thumbnails */}
                    <div className="flex items-center gap-2 overflow-x-auto py-1">
                      {photos.map((photoUrl, pIdx) => (
                        <div
                          key={pIdx}
                          onClick={() =>
                            handleOpenLightbox(
                              photos,
                              pIdx,
                              `${duty.employee_name} — Photo #${pIdx + 1}`,
                              `Area: ${duty.area || 'Field Area'} • Date: ${duty.date}`
                            )
                          }
                          className="relative group shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border border-[#C5E3D5] bg-black/5 hover:border-[#23815F] shadow-2xs hover:shadow-md transition-all cursor-pointer"
                        >
                          <img
                            src={photoUrl}
                            alt={`Proof #${pIdx + 1}`}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-200"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <ZoomIn className="w-4 h-4 text-white drop-shadow" />
                          </div>
                          <span className="absolute bottom-1 left-1 px-1 py-0.2 bg-black/60 text-white text-[9px] font-bold rounded">
                            #{pIdx + 1}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="pt-2 border-t border-[#F0F7F4] flex items-center justify-between text-[11px] text-[#5E5A52]">
                      <span className="italic">Click image to expand full size</span>
                      <span className="font-semibold text-[#23815F]">Field Date: {duty.date}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ----------------------------------------------------
          TAB 5: CUSTOMER DIRECTORY & LEADS (WITH APPROVE/REJECT, VIEW MODAL & FILTERS)
      ---------------------------------------------------- */}
      {activeTab === 'leads' && (
        <div className="space-y-5">
          {/* Top Control Bar */}
          <div className="p-4 sm:p-5 bg-white border border-[#C5E3D5] rounded-3xl shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <h3 className="text-sm sm:text-base font-extrabold text-[#1D1D1B] flex items-center gap-2">
                  <Compass className="w-5 h-5 text-[#23815F]" />
                  <span>Outdoor Customer Leads & Field Directory</span>
                </h3>
                <p className="text-xs text-[#5E5A52]">
                  Ledger of outdoor prospects, contact details, jewelry schemes promoted, reviews collected, and approval status.
                </p>
              </div>

              <div className="flex items-center gap-2.5 flex-wrap">
                {/* Date Scope Toggle */}
                <div className="inline-flex items-center bg-[#FAF8F3] border border-[#C5E3D5] rounded-xl p-0.5">
                  <button
                    type="button"
                    onClick={() => setLeadDateScope('all')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      leadDateScope === 'all'
                        ? 'bg-[#23815F] text-white shadow-2xs'
                        : 'text-[#5E5A52] hover:text-[#1D1D1B]'
                    }`}
                  >
                    All Dates
                  </button>
                  <button
                    type="button"
                    onClick={() => setLeadDateScope('selected')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      leadDateScope === 'selected'
                        ? 'bg-[#23815F] text-white shadow-2xs'
                        : 'text-[#5E5A52] hover:text-[#1D1D1B]'
                    }`}
                  >
                    {selectedDate} Only
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setShowAddLeadModal(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#23815F] hover:bg-[#1B694C] text-white text-xs font-extrabold shadow-sm transition-all cursor-pointer hover:scale-[1.02]"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Add Customer Lead</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-[#F0F7F4] text-[#23815F] border border-[#C5E3D5] text-xs font-bold rounded-xl shadow-2xs transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Export CSV</span>
                </button>
              </div>
            </div>

            {/* Filter Pills & Search */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-[#E8E6E1]">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] font-bold text-[#8A8479] uppercase mr-1">Filter:</span>
                <button
                  type="button"
                  onClick={() => setLeadStatusFilter('ALL')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    leadStatusFilter === 'ALL'
                      ? 'bg-[#1D1D1B] text-white shadow-xs'
                      : 'bg-[#FAF8F3] text-[#5E5A52] hover:bg-[#E8E6E1]'
                  }`}
                >
                  <span>All Leads</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${leadStatusFilter === 'ALL' ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-700'}`}>
                    {countAllLeads}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setLeadStatusFilter('PENDING')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    leadStatusFilter === 'PENDING'
                      ? 'bg-[#CA8A04] text-white shadow-xs'
                      : 'bg-[#FEFCE8] text-[#854D0E] border border-[#CA8A04]/40 hover:bg-[#FEF08A]'
                  }`}
                >
                  <span>⏳ Pending Review</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${leadStatusFilter === 'PENDING' ? 'bg-white/20 text-white' : 'bg-[#FEF08A] text-[#854D0E]'}`}>
                    {countPendingLeads}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setLeadStatusFilter('APPROVED')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    leadStatusFilter === 'APPROVED'
                      ? 'bg-[#23815F] text-white shadow-xs'
                      : 'bg-[#E8F4EE] text-[#21845F] border border-[#A7F3D0] hover:bg-[#D1FAE5]'
                  }`}
                >
                  <span>✓ Approved</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${leadStatusFilter === 'APPROVED' ? 'bg-white/20 text-white' : 'bg-[#D1FAE5] text-[#21845F]'}`}>
                    {countApprovedLeads}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setLeadStatusFilter('REJECTED')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    leadStatusFilter === 'REJECTED'
                      ? 'bg-[#C24141] text-white shadow-xs'
                      : 'bg-[#FDECEC] text-[#C24141] border border-[#FCA5A5] hover:bg-[#FEE2E2]'
                  }`}
                >
                  <span>✕ Rejected</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${leadStatusFilter === 'REJECTED' ? 'bg-white/20 text-white' : 'bg-[#FEE2E2] text-[#C24141]'}`}>
                    {countRejectedLeads}
                  </span>
                </button>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-[#8A8479] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  placeholder="Search customer, phone, area..."
                  className="w-full pl-8 pr-3 py-1.5 input-luxury-beige rounded-xl text-xs"
                />
              </div>
            </div>
          </div>

          {/* Leads Table */}
          <div className="bg-white border border-[#C5E3D5] rounded-3xl overflow-hidden shadow-xs text-[#1D1D1B]">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#FAF8F3]/70 border-b border-[#C5E3D5] text-[#5E5A52] uppercase tracking-wider font-bold text-[11px]">
                  <tr>
                    <th className="px-5 py-3.5">Customer Name & Phone</th>
                    <th className="px-5 py-3.5">Area & Date</th>
                    <th className="px-5 py-3.5">Assisting Staff</th>
                    <th className="px-5 py-3.5">Promoted Scheme</th>
                    <th className="px-5 py-3.5">Reviews & Feedback</th>
                    <th className="px-5 py-3.5 text-center">Status</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EBF3EE] font-medium">
                  {displayedLeads.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-5 py-12 text-center text-[#8A8479]">
                        <Compass className="w-10 h-10 text-[#23815F] mx-auto opacity-40 mb-2" />
                        <p className="font-bold text-sm text-[#1D1D1B]">No outdoor customer leads found</p>
                        <p className="text-xs text-[#8A8479] mt-0.5">Try clearing filters or change the date scope.</p>
                      </td>
                    </tr>
                  ) : (
                    displayedLeads.map((cust) => {
                      const st = (cust.status || '').toLowerCase();
                      const isPending = st.includes('pending') || st === 'lead' || st === 'contacted' || st === 'interested';
                      const isApproved = st.includes('approved') || st === 'converted';
                      const isRejected = st.includes('rejected');

                      return (
                        <tr key={cust.id} className="hover:bg-[#F0F7F4] transition-colors">
                          <td className="px-5 py-3.5">
                            <div className="font-extrabold text-[#1D1D1B] text-xs">
                              {cust.customer_name}
                            </div>
                            {cust.phone ? (
                              <a
                                href={`tel:${cust.phone}`}
                                className="inline-flex items-center gap-1 text-[11px] font-mono text-[#23815F] hover:underline mt-0.5"
                              >
                                <Phone className="w-3 h-3 text-[#23815F]" />
                                <span>{cust.phone}</span>
                              </a>
                            ) : (
                              <span className="text-[10px] text-[#8A8479]">No phone</span>
                            )}
                          </td>

                          <td className="px-5 py-3.5 text-[#5E5A52]">
                            <div className="text-xs font-semibold text-[#1D1D1B] flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-[#23815F]" />
                              <span>{cust.area_name || 'Field Area'}</span>
                            </div>
                            <div className="text-[10px] text-[#8A8479] mt-0.5">
                              📅 {cust.date || selectedDate}
                            </div>
                          </td>

                          <td className="px-5 py-3.5 text-[#5E5A52]">
                            <div className="flex items-center gap-1.5">
                              <User className="w-3.5 h-3.5 text-[#23815F]" />
                              <span className="font-semibold text-xs text-[#1D1D1B]">
                                {cust.marketing_employee_name || 'Staff'}
                              </span>
                            </div>
                          </td>

                          <td className="px-5 py-3.5">
                            {cust.scheme_name ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-[#FEF9C3] text-[#854D0E] border border-[#CA8A04]/40 shadow-2xs">
                                <Award className="w-3 h-3 text-[#B45309]" />
                                <span>{cust.scheme_name}</span>
                              </span>
                            ) : (
                              <span className="text-[11px] text-[#8A8479]">—</span>
                            )}
                          </td>

                          <td className="px-5 py-3.5">
                            {cust.has_google_review ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                                <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
                                <span>{cust.google_review_rating || 5}★ Review</span>
                              </span>
                            ) : cust.has_customer_feedback ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                                <MessageSquareHeart className="w-3 h-3 text-emerald-600" />
                                <span>{cust.feedback_rating || 5}★ Feedback</span>
                              </span>
                            ) : (
                              <span className="text-[11px] text-[#8A8479]">No review</span>
                            )}
                          </td>

                          <td className="px-5 py-3.5 text-center">
                            {isApproved ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-[#E8F4EE] text-[#21845F] border border-[#A7F3D0]">
                                <Check className="w-3 h-3 text-[#21845F]" />
                                <span>Approved</span>
                              </span>
                            ) : isRejected ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-[#FDECEC] text-[#C24141] border border-[#FCA5A5]">
                                <X className="w-3 h-3 text-[#C24141]" />
                                <span>Rejected</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-[#FEFCE8] text-[#854D0E] border border-[#EAB308]">
                                <Clock className="w-3 h-3 text-[#854D0E]" />
                                <span>Pending</span>
                              </span>
                            )}
                          </td>

                          <td className="px-5 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5 flex-wrap">
                              <button
                                type="button"
                                onClick={() => setSelectedCustView(cust)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white hover:bg-[#F0F7F4] text-[#23815F] font-bold text-xs border border-[#C5E3D5] hover:border-[#23815F] shadow-2xs transition-all cursor-pointer"
                                title="View customer details"
                              >
                                <Eye className="w-3.5 h-3.5 text-[#23815F]" />
                                <span>View</span>
                              </button>

                              {isPending && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleReviewCustomer(cust.id, 'APPROVE')}
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#23815F] hover:bg-[#1B694C] text-white font-bold text-xs shadow-2xs transition-all cursor-pointer"
                                    title="Approve lead"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                    <span>Approve</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleReviewCustomer(cust.id, 'REJECT')}
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-2xs transition-all cursor-pointer"
                                    title="Reject lead"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                    <span>Reject</span>
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------
          FULL WORK DETAILS & CUSTOMER BREAKDOWN MODAL (ON CLICK)
      ---------------------------------------------------- */}
      {viewDetailDuty && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative bg-white rounded-3xl overflow-hidden max-w-4xl w-full shadow-2xl border border-[#C5E3D5] flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-5 border-b border-[#E8E6E1] flex items-center justify-between bg-[#FAF8F3]">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#E8F4EE] text-[#23815F] border border-[#C5E3D5] flex items-center justify-center font-extrabold text-lg shadow-2xs">
                  {viewDetailDuty.employee_name?.charAt(0) || 'E'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-extrabold text-[#1D1D1B]">
                      {viewDetailDuty.employee_name}
                    </h3>
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-white text-[#23815F] border border-[#C5E3D5]">
                      {viewDetailDuty.employee_code}
                    </span>
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#E8F4EE] text-[#23815F] border border-[#C5E3D5]">
                      {viewDetailDuty.status}
                    </span>
                  </div>
                  <p className="text-xs text-[#5E5A52] mt-0.5">
                    {viewDetailDuty.designation} • {viewDetailDuty.department} • 📅 Field Date: {viewDetailDuty.date}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setViewDetailDuty(null)}
                className="p-2 rounded-full hover:bg-[#E8E6E1] text-[#1D1D1B] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6 overflow-y-auto max-h-[75vh]">
              {/* Overview Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-2xl bg-[#FAF8F3] border border-[#E4DFD4]">
                  <span className="text-[10px] font-bold text-[#8A8479] uppercase block">Targeted Area</span>
                  <span className="text-xs font-extrabold text-[#1D1D1B] mt-1 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-[#23815F]" />
                    {viewDetailDuty.area || 'N/A'}
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#FAF8F3] border border-[#E4DFD4]">
                  <span className="text-[10px] font-bold text-[#8A8479] uppercase block">Promoted Scheme</span>
                  <span className="text-xs font-extrabold text-[#9A782F] mt-1 flex items-center gap-1 truncate">
                    <Award className="w-3.5 h-3.5 text-[#9A782F]" />
                    {viewDetailDuty.scheme_name || 'N/A'}
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#E8F4EE] border border-[#C5E3D5]">
                  <span className="text-[10px] font-bold text-[#5E5A52] uppercase block">Customers Reached</span>
                  <span className="text-base font-extrabold text-[#23815F] mt-0.5 block">
                    {viewDetailDuty.customers_attended_count || viewDetailDuty.customers.length} Attended • {viewDetailDuty.customers.filter((c) => c.interested_in && c.interested_in.trim() !== '').length} Interested Leads
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200">
                  <span className="text-[10px] font-bold text-amber-800 uppercase block">Google ⭐ Ratings</span>
                  <span className="text-base font-extrabold text-amber-600 mt-0.5 block">
                    {viewDetailDuty.customers.filter((c) => c.has_google_review).length || viewDetailDuty.google_ratings_count} Reviews Collected
                  </span>
                </div>
              </div>

              {/* Complete Customers Breakdown */}
              <div className="space-y-3">
                <h4 className="text-xs font-extrabold text-[#1D1D1B] uppercase tracking-wider flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#23815F]" />
                  <span>All Customers Met / Interacted on Field ({viewDetailDuty.customers.length})</span>
                </h4>

                {viewDetailDuty.customers.length === 0 ? (
                  <p className="text-xs text-[#8A8479] italic p-4 bg-[#FAF8F3] rounded-2xl border border-[#E4DFD4]">
                    No individual customer contact details were recorded for this day.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {viewDetailDuty.customers.map((cust) => (
                      <div
                        key={cust.id}
                        className={`p-4 rounded-2xl border space-y-2 ${
                          cust.is_converted
                            ? 'bg-[#FAF6EB] border-[#C6A45C]/40'
                            : 'bg-white border-[#C5E3D5]'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-extrabold text-[#1D1D1B]">
                            {cust.customer_name}
                          </span>
                          {cust.interested_in ? (
                            <div className="flex flex-wrap gap-1">
                              {cust.interested_in.split(',').map((item, idx) => (
                                <span
                                  key={idx}
                                  className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-[#9A782F] border border-[#C6A45C]/30"
                                >
                                  {item.trim() === 'Gold' ? '🟡 Gold' : item.trim() === 'Diamond' ? '💎 Diamond' : item.trim() === 'Silver' ? '⚪ Silver' : item.trim()}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#E8F4EE] text-[#23815F] border border-[#C5E3D5]">
                              Attended
                            </span>
                          )}
                        </div>

                        <div className="text-xs text-[#5E5A52] font-mono flex items-center gap-1.5">
                          <Phone className="w-3 h-3 text-[#23815F]" />
                          <span>{cust.phone || 'Phone not provided'}</span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-[11px] text-[#5E5A52] pt-1 border-t border-[#E8E6E1]">
                          <div>
                            <strong>DOB:</strong> {cust.dob ? `🎂 ${cust.dob}` : '—'}
                          </div>
                          <div>
                            <strong>Anniversary:</strong> {cust.anniversary_date ? `💍 ${cust.anniversary_date}` : '—'}
                          </div>
                        </div>

                        {cust.has_google_review && (
                          <div className="p-2 bg-white rounded-xl border border-amber-200 text-xs text-amber-700 flex items-start gap-1.5">
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500 mt-0.5 shrink-0" />
                            <div>
                              <strong>Google Review: {cust.google_review_rating || 5} Stars</strong>
                              {cust.google_review_text && (
                                <p className="text-[10px] text-[#5E5A52] italic mt-0.5">
                                  "{cust.google_review_text}"
                                </p>
                              )}
                            </div>
                          </div>
                        )}

                        {cust.has_customer_feedback && (
                          <div className="p-2 bg-white rounded-xl border border-emerald-200 text-xs text-emerald-800 flex items-start gap-1.5">
                            <MessageSquareHeart className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                            <div>
                              <strong>Customer Feedback: {cust.feedback_rating || 5} Stars</strong>
                              {cust.feedback_text && (
                                <p className="text-[10px] text-[#5E5A52] italic mt-0.5">
                                  "{cust.feedback_text}"
                                </p>
                              )}
                            </div>
                          </div>
                        )}

                        {cust.notes && (
                          <p className="text-[11px] text-[#5E5A52] italic bg-white/70 p-2 rounded-lg">
                            Notes: "{cust.notes}"
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Photos Gallery for this Staff (Compact in Modal with Lightbox Expand) */}
              <div className="space-y-3">
                <h4 className="text-xs font-extrabold text-[#1D1D1B] uppercase tracking-wider flex items-center gap-2">
                  <Camera className="w-4 h-4 text-[#23815F]" />
                  <span>Field Photos Uploaded</span>
                </h4>

                {viewDetailDuty.photo_urls && viewDetailDuty.photo_urls.length > 0 ? (
                  <div className="flex items-center gap-2.5 overflow-x-auto py-1">
                    {viewDetailDuty.photo_urls.map((photoUrl, pIdx) => (
                      <div
                        key={pIdx}
                        onClick={() =>
                          handleOpenLightbox(
                            viewDetailDuty.photo_urls || [],
                            pIdx,
                            `${viewDetailDuty.employee_name} — Photo #${pIdx + 1}`,
                            `Area: ${viewDetailDuty.area} • Date: ${viewDetailDuty.date}`
                          )
                        }
                        className="relative w-18 h-18 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border border-[#C5E3D5] bg-black/5 cursor-pointer group shadow-2xs shrink-0"
                      >
                        <img
                          src={photoUrl}
                          alt="Proof"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <ZoomIn className="w-4 h-4 text-white drop-shadow" />
                        </div>
                        <span className="absolute bottom-1 left-1 px-1 py-0.2 bg-black/60 text-white text-[8px] font-bold rounded">
                          #{pIdx + 1}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : viewDetailDuty.photo_url ? (
                  <div
                    onClick={() =>
                      handleOpenLightbox(
                        [viewDetailDuty.photo_url!],
                        0,
                        `${viewDetailDuty.employee_name} — Photo`,
                        `Area: ${viewDetailDuty.area} • Date: ${viewDetailDuty.date}`
                      )
                    }
                    className="relative w-18 h-18 rounded-2xl overflow-hidden border border-[#C5E3D5] bg-black/5 cursor-pointer group shadow-2xs"
                  >
                    <img
                      src={viewDetailDuty.photo_url}
                      alt="Proof"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <ZoomIn className="w-4 h-4 text-white drop-shadow" />
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-[#8A8479] italic p-4 bg-[#FAF8F3] rounded-2xl border border-[#E4DFD4]">
                    No photos uploaded for this staff duty.
                  </p>
                )}
              </div>

              {/* Staff Observations & Notes */}
              {viewDetailDuty.notes && (
                <div className="p-4 bg-[#FAF8F3] border border-[#E4DFD4] rounded-2xl space-y-1">
                  <span className="text-[10px] font-bold text-[#8A8479] uppercase">
                    Staff Field Remarks & Feedback
                  </span>
                  <p className="text-xs text-[#1D1D1B] font-medium italic">
                    "{viewDetailDuty.notes}"
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-[#E8E6E1] bg-[#FAF8F3] flex items-center justify-between">
              <button
                onClick={() => {
                  setViewDetailDuty(null);
                  setActiveTab('entries');
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#23815F] hover:bg-[#1B694C] text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Edit This Staff Entry</span>
              </button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewDetailDuty(null)}
              >
                Close Full Details
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------
          CUSTOMER FULL VIEW MODAL (ACCESSIBLE ANYTIME / AFTER APPROVAL)
      ---------------------------------------------------- */}
      {selectedCustView && (
        <Modal
          isOpen={!!selectedCustView}
          onClose={() => setSelectedCustView(null)}
          title={`Outdoor Customer Details: ${selectedCustView.customer_name}`}
        >
          <div className="space-y-5 text-[#1D1D1B]">
            {/* Header / Overview */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-[#FAF8F3] border border-[#E8E6E1]">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-[#E8F4EE] text-[#23815F] border border-[#C5E3D5] flex items-center justify-center font-black text-base shadow-2xs">
                  {selectedCustView.customer_name.charAt(0)}
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-[#1D1D1B]">
                    {selectedCustView.customer_name}
                  </h4>
                  {selectedCustView.phone ? (
                    <a
                      href={`tel:${selectedCustView.phone}`}
                      className="inline-flex items-center gap-1 text-xs font-mono text-[#23815F] hover:underline"
                    >
                      <Phone className="w-3 h-3 text-[#23815F]" />
                      <span>{selectedCustView.phone}</span>
                    </a>
                  ) : (
                    <span className="text-xs text-[#8A8479]">No phone provided</span>
                  )}
                </div>
              </div>

              <div>
                {(() => {
                  const s = (selectedCustView.status || '').toLowerCase();
                  if (s.includes('approved') || s === 'converted') {
                    return (
                      <span className="px-3 py-1 rounded-full text-xs font-black bg-[#E8F4EE] text-[#21845F] border border-[#A7F3D0]">
                        ✓ Approved
                      </span>
                    );
                  }
                  if (s.includes('rejected')) {
                    return (
                      <span className="px-3 py-1 rounded-full text-xs font-black bg-[#FDECEC] text-[#C24141] border border-[#FCA5A5]">
                        ✕ Rejected
                      </span>
                    );
                  }
                  return (
                    <span className="px-3 py-1 rounded-full text-xs font-black bg-[#FEFCE8] text-[#854D0E] border border-[#EAB308]">
                      ⏳ Pending Review
                    </span>
                  );
                })()}
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-white border border-[#E8E6E1]">
                <span className="text-[10px] font-bold text-[#8A8479] uppercase block mb-1">Assisting Staff Rep</span>
                <span className="font-bold text-[#1D1D1B] flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-[#23815F]" />
                  {selectedCustView.marketing_employee_name || 'Showroom Staff'}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-white border border-[#E8E6E1]">
                <span className="text-[10px] font-bold text-[#8A8479] uppercase block mb-1">Campaign Location / Area</span>
                <span className="font-bold text-[#1D1D1B] flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#23815F]" />
                  {selectedCustView.area_name || 'Market Area'}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-white border border-[#E8E6E1]">
                <span className="text-[10px] font-bold text-[#8A8479] uppercase block mb-1">Promoted Gold Scheme</span>
                {selectedCustView.scheme_name ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-extrabold bg-[#FEF9C3] text-[#854D0E] border border-[#CA8A04]/40">
                    <Award className="w-3.5 h-3.5 text-[#B45309]" />
                    {selectedCustView.scheme_name}
                  </span>
                ) : (
                  <span className="text-[#8A8479]">No scheme assigned</span>
                )}
              </div>

              <div className="p-3 rounded-xl bg-white border border-[#E8E6E1]">
                <span className="text-[10px] font-bold text-[#8A8479] uppercase block mb-1">Date Logged</span>
                <span className="font-bold text-[#1D1D1B]">
                  📅 {selectedCustView.date || 'Today'}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-white border border-[#E8E6E1]">
                <span className="text-[10px] font-bold text-[#8A8479] uppercase block mb-1">Date of Birth (DOB)</span>
                <span className="font-semibold text-[#1D1D1B]">
                  {selectedCustView.dob ? `🎂 ${selectedCustView.dob}` : 'Not provided'}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-white border border-[#E8E6E1]">
                <span className="text-[10px] font-bold text-[#8A8479] uppercase block mb-1">Wedding Anniversary</span>
                <span className="font-semibold text-[#1D1D1B]">
                  {selectedCustView.anniversary_date ? `💍 ${selectedCustView.anniversary_date}` : 'Not provided'}
                </span>
              </div>
            </div>

            {/* Jewelry Interests */}
            {selectedCustView.interested_in && (
              <div className="p-3 rounded-xl bg-[#FAF8F3] border border-[#E8E6E1] text-xs">
                <span className="text-[10px] font-bold text-[#8A8479] uppercase block mb-1.5">Jewelry Interests</span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedCustView.interested_in.split(',').map((it, idx) => (
                    <span key={idx} className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#FEF9C3] text-[#854D0E] border border-[#CA8A04]/30">
                      {it.trim()}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Reviews Section */}
            {(selectedCustView.has_google_review || selectedCustView.has_customer_feedback) && (
              <div className="space-y-2 text-xs">
                {selectedCustView.has_google_review && (
                  <div className="p-3 rounded-xl bg-[#FEFCE8] border border-[#CA8A04] space-y-1">
                    <div className="flex items-center gap-1 font-extrabold text-[#854D0E]">
                      <Star className="w-4 h-4 fill-[#F59E0B] text-[#F59E0B]" />
                      <span>Google 5-Star Review: {selectedCustView.google_review_rating || 5} Stars</span>
                    </div>
                    {selectedCustView.google_review_text && (
                      <p className="text-xs text-[#5E5A52] italic pl-5">
                        "{selectedCustView.google_review_text}"
                      </p>
                    )}
                  </div>
                )}

                {selectedCustView.has_customer_feedback && (
                  <div className="p-3 rounded-xl bg-[#FAF5FF] border border-[#A855F7] space-y-1">
                    <div className="flex items-center gap-1 font-extrabold text-[#7E22CE]">
                      <MessageSquareHeart className="w-4 h-4 text-[#7E22CE]" />
                      <span>Customer Feedback: {selectedCustView.feedback_rating || 5} Stars</span>
                    </div>
                    {selectedCustView.feedback_text && (
                      <p className="text-xs text-[#5E5A52] italic pl-5">
                        "{selectedCustView.feedback_text}"
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Photo Proof */}
            {selectedCustView.photo_url && (
              <div className="p-3 rounded-xl bg-white border border-[#E8E6E1] space-y-2">
                <span className="text-[10px] font-bold text-[#8A8479] uppercase block">Field Photo Proof</span>
                <div
                  onClick={() =>
                    handleOpenLightbox(
                      [selectedCustView.photo_url!],
                      0,
                      selectedCustView.customer_name,
                      `Area: ${selectedCustView.area_name || ''} • Date: ${selectedCustView.date || ''}`
                    )
                  }
                  className="relative w-28 h-28 rounded-xl overflow-hidden border border-[#C5E3D5] cursor-pointer group shadow-2xs"
                >
                  <img
                    src={selectedCustView.photo_url.startsWith('http') ? selectedCustView.photo_url : `/api/media/${selectedCustView.photo_url.replace(/^uploads\//, '')}`}
                    alt="Proof"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <ZoomIn className="w-5 h-5 text-white" />
                  </div>
                </div>
              </div>
            )}

            {/* Notes */}
            {selectedCustView.notes && (
              <div className="p-3 rounded-xl bg-[#FAF8F3] border border-[#E8E6E1] text-xs space-y-1">
                <span className="text-[10px] font-bold text-[#8A8479] uppercase block">Field Observations / Notes</span>
                <p className="text-xs text-[#1D1D1B] italic">"{selectedCustView.notes}"</p>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-[#E8E6E1] gap-2 flex-wrap">
              {(() => {
                const s = (selectedCustView.status || '').toLowerCase();
                const isPending = s.includes('pending') || s === 'lead' || s === 'contacted' || s === 'interested';
                if (!isPending) return <div />;
                return (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleReviewCustomer(selectedCustView.id, 'APPROVE')}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#23815F] hover:bg-[#1B694C] text-white font-bold text-xs shadow-xs cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      <span>Approve Lead</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleReviewCustomer(selectedCustView.id, 'REJECT')}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                      <span>Reject Lead</span>
                    </button>
                  </div>
                );
              })()}

              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedCustView(null)}
              >
                Close View
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ----------------------------------------------------
          ADD CUSTOMER LEAD MODAL
      ---------------------------------------------------- */}
      {showAddLeadModal && (
        <Modal
          isOpen={showAddLeadModal}
          onClose={() => setShowAddLeadModal(false)}
          title="Add Outdoor Customer Lead"
        >
          <form onSubmit={handleCreateCustomerLead} className="space-y-4 text-xs text-[#1D1D1B]">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-[#5E5A52] uppercase mb-1">
                  Customer Full Name <span className="text-red-500">*</span>
                </label>
                <Input
                  value={newLeadForm.customer_name}
                  onChange={(e) => setNewLeadForm((prev) => ({ ...prev, customer_name: e.target.value }))}
                  placeholder="e.g. Ramesh Kumar"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#5E5A52] uppercase mb-1">
                  Phone Number
                </label>
                <Input
                  value={newLeadForm.phone}
                  onChange={(e) => setNewLeadForm((prev) => ({ ...prev, phone: e.target.value }))}
                  placeholder="e.g. 9876543210"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-[#5E5A52] uppercase mb-1">
                  Assisting Field Marketer (Staff) <span className="text-red-500">*</span>
                </label>
                <Select
                  value={newLeadForm.marketing_employee_id}
                  onChange={(e) => setNewLeadForm((prev) => ({ ...prev, marketing_employee_id: e.target.value }))}
                  options={[
                    { value: '', label: 'Select Employee' },
                    ...allEmployees.map((e) => ({
                      value: e.id.toString(),
                      label: `${e.full_name} (${e.employee_code})`,
                    })),
                  ]}
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#5E5A52] uppercase mb-1">
                  Campaign Area / Location
                </label>
                <Input
                  value={newLeadForm.area_name}
                  onChange={(e) => setNewLeadForm((prev) => ({ ...prev, area_name: e.target.value }))}
                  placeholder="e.g. Market Booth, Yelahanka 4th Cross"
                />
              </div>
            </div>

            {/* Scheme Selection */}
            <div>
              <label className="block text-[11px] font-bold text-[#5E5A52] uppercase mb-1.5 flex items-center gap-1">
                <Award className="w-3.5 h-3.5 text-[#B45309]" />
                <span>Promoted Gold Scheme</span>
              </label>
              <div className="flex flex-wrap gap-1.5">
                {SCHEMES.map((scheme) => {
                  const isSelected = newLeadForm.scheme_name === scheme;
                  return (
                    <button
                      key={scheme}
                      type="button"
                      onClick={() =>
                        setNewLeadForm((prev) => ({
                          ...prev,
                          scheme_name: isSelected ? '' : scheme,
                        }))
                      }
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#FEF9C3] text-[#854D0E] border-[#CA8A04] shadow-xs ring-1 ring-[#CA8A04]'
                          : 'bg-white text-[#5E5A52] border-[#CBD5E1] hover:bg-[#FAF8F5]'
                      }`}
                    >
                      {scheme}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-[#5E5A52] uppercase mb-1">
                  Date of Birth (DOB)
                </label>
                <input
                  type="date"
                  value={newLeadForm.dob}
                  onChange={(e) => setNewLeadForm((prev) => ({ ...prev, dob: e.target.value }))}
                  className="w-full px-3 py-2 bg-white border border-[#CBD5E1] rounded-xl text-xs cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#5E5A52] uppercase mb-1">
                  Anniversary Date
                </label>
                <input
                  type="date"
                  value={newLeadForm.anniversary_date}
                  onChange={(e) => setNewLeadForm((prev) => ({ ...prev, anniversary_date: e.target.value }))}
                  className="w-full px-3 py-2 bg-white border border-[#CBD5E1] rounded-xl text-xs cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#5E5A52] uppercase mb-1">
                  Field Date
                </label>
                <input
                  type="date"
                  value={newLeadForm.date}
                  onChange={(e) => setNewLeadForm((prev) => ({ ...prev, date: e.target.value }))}
                  className="w-full px-3 py-2 bg-white border border-[#CBD5E1] rounded-xl text-xs cursor-pointer"
                />
              </div>
            </div>

            {/* Interests Checkboxes */}
            <div>
              <label className="block text-[11px] font-bold text-[#5E5A52] uppercase mb-1.5">
                Customer Interested In
              </label>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newLeadForm.interested_gold}
                    onChange={(e) => setNewLeadForm((prev) => ({ ...prev, interested_gold: e.target.checked }))}
                    className="w-4 h-4 text-[#23815F] rounded"
                  />
                  <span className="text-xs font-semibold">🪙 Gold</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newLeadForm.interested_diamond}
                    onChange={(e) => setNewLeadForm((prev) => ({ ...prev, interested_diamond: e.target.checked }))}
                    className="w-4 h-4 text-[#23815F] rounded"
                  />
                  <span className="text-xs font-semibold">💎 Diamond</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newLeadForm.interested_silver}
                    onChange={(e) => setNewLeadForm((prev) => ({ ...prev, interested_silver: e.target.checked }))}
                    className="w-4 h-4 text-[#23815F] rounded"
                  />
                  <span className="text-xs font-semibold">🥈 Silver</span>
                </label>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-[11px] font-bold text-[#5E5A52] uppercase mb-1">
                Notes / Requirements
              </label>
              <textarea
                rows={2}
                value={newLeadForm.notes}
                onChange={(e) => setNewLeadForm((prev) => ({ ...prev, notes: e.target.value }))}
                placeholder="Customer preferences, discussion summary..."
                className="w-full px-3 py-2 bg-white border border-[#CBD5E1] rounded-xl text-xs resize-none font-medium"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E8E6E1]">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowAddLeadModal(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={isSubmittingLead}
              >
                {isSubmittingLead ? 'Saving...' : 'Save Customer Lead'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ----------------------------------------------------
          FULL-SCREEN PHOTO LIGHTBOX MODAL (NEXT / PREV / EXPAND)
      ---------------------------------------------------- */}
      <PhotoLightboxModal
        lightbox={lightbox}
        onClose={() => setLightbox(null)}
        onPrev={handlePrevLightbox}
        onNext={handleNextLightbox}
      />

      {/* Delete Assignment Confirm Dialog */}
      <ConfirmDialog
        isOpen={deleteDutyId !== null}
        title="Remove Staff Assignment"
        message="Are you sure you want to remove this employee from outdoor duty for this date?"
        confirmText="Remove Staff"
        cancelText="Cancel"
        variant="danger"
        onConfirm={handleDeleteDuty}
        onCancel={() => setDeleteDutyId(null)}
      />
    </div>
  );
};
