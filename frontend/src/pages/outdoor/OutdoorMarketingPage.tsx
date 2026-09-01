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
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { useToast } from '../../context/ToastContext';
import {
  Employee,
  OutdoorDuty,
  OutdoorMarketingCustomer,
  OutdoorCustomerDetail,
} from '../../types';
import api from '../../api/client';

// Standard Jewellery Schemes for Quick Selection
const STANDARD_SCHEMES = [
  'Siri Samruddhi Gold Monthly Scheme',
  'Swarna Nidhi 11-Month Gold Plan',
  'Diamond Digi Savings Scheme',
  'Bridal Gold Advance Booking Plan',
  'Dhanavruddhi Gold Coin Scheme',
  'Festival Gold Exchange Offer',
  'General Showroom Walk-in Promotion',
];

// ----------------------------------------------------
// Data Interfaces
// ----------------------------------------------------
interface CustomerEntryState {
  id?: number;
  name: string;
  phone: string;
  dob: string;
  anniversary_date: string;
  has_google_review: boolean;
  google_review_rating: number;
  google_review_text: string;
  scheme_name: string;
  notes: string;
}

interface DutyFormState {
  area: string;
  scheme_name: string;
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

      // Pre-select employee IDs that are already assigned for this date
      const assignedIds = dutyRes.data.map((d) => d.employee_id);
      setSelectedEmployeeIds(assignedIds);

      // Initialize form states for each assigned duty
      const formMap: Record<number, DutyFormState> = {};
      dutyRes.data.forEach((duty) => {
        const attendedCusts = duty.customers.filter((c) => !c.is_converted);
        const convertedCusts = duty.customers.filter((c) => c.is_converted);

        const attendedCount = Math.max(duty.customers_attended_count, attendedCusts.length);
        const convertedCount = Math.max(duty.converted_customers_count, convertedCusts.length);

        // Build attended array matching count
        const attendedList: CustomerEntryState[] = [];
        for (let i = 0; i < attendedCount; i++) {
          const existing = attendedCusts[i];
          attendedList.push({
            id: existing?.id,
            name: existing?.customer_name || '',
            phone: existing?.phone || '',
            dob: existing?.dob ? String(existing.dob) : '',
            anniversary_date: existing?.anniversary_date ? String(existing.anniversary_date) : '',
            has_google_review: existing?.has_google_review || false,
            google_review_rating: existing?.google_review_rating || 5,
            google_review_text: existing?.google_review_text || '',
            scheme_name: existing?.scheme_name || duty.scheme_name || '',
            notes: existing?.notes || '',
          });
        }

        // Build converted array matching count
        const convertedList: CustomerEntryState[] = [];
        for (let i = 0; i < convertedCount; i++) {
          const existing = convertedCusts[i];
          attendedList.push({
            id: existing?.id,
            name: existing?.customer_name || '',
            phone: existing?.phone || '',
            dob: existing?.dob ? String(existing.dob) : '',
            anniversary_date: existing?.anniversary_date ? String(existing.anniversary_date) : '',
            has_google_review: existing?.has_google_review || false,
            google_review_rating: existing?.google_review_rating || 5,
            google_review_text: existing?.google_review_text || '',
            scheme_name: existing?.scheme_name || duty.scheme_name || STANDARD_SCHEMES[0],
            notes: existing?.notes || '',
          });
        }

        const existingPhotos = duty.photo_urls && duty.photo_urls.length > 0
          ? duty.photo_urls
          : (duty.photo_url ? [duty.photo_url] : []);

        formMap[duty.id] = {
          area: duty.area || '',
          scheme_name: duty.scheme_name || STANDARD_SCHEMES[0],
          customers_attended_count: attendedCount,
          converted_customers_count: convertedCount,
          google_ratings_count: duty.google_ratings_count || 0,
          photo_url: duty.photo_url || (existingPhotos[0] || ''),
          photo_urls: existingPhotos,
          notes: duty.notes || '',
          status: duty.status || 'Assigned',
          isUploadingPhotos: false,
          isSaving: false,
          attendedList,
          convertedList,
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
            has_google_review: false,
            google_review_rating: 5,
            google_review_text: '',
            scheme_name: form.scheme_name || '',
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
            has_google_review: false,
            google_review_rating: 5,
            google_review_text: '',
            scheme_name: form.scheme_name || STANDARD_SCHEMES[0],
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

    if (!form.area.trim()) {
      toastError('Please enter the targeted area / location for this employee.');
      return;
    }

    // Validate Converted Customers Compulsory Name & Phone
    for (let i = 0; i < form.convertedList.length; i++) {
      const c = form.convertedList[i];
      if (!c.name.trim()) {
        toastError(`Converted Customer #${i + 1}: Customer Name is compulsory.`);
        return;
      }
      if (!c.phone.trim()) {
        toastError(`Converted Customer #${i + 1}: Phone number is compulsory.`);
        return;
      }
    }

    updateDutyFormField(dutyId, 'isSaving', true);

    try {
      const customersPayload: OutdoorCustomerDetail[] = [];

      // Attended Customers (Optional fields)
      form.attendedList.forEach((c) => {
        if (c.name.trim() || c.phone.trim() || c.has_google_review) {
          customersPayload.push({
            id: c.id,
            customer_name: c.name.trim() || 'Attended Visitor',
            phone: c.phone.trim() || undefined,
            dob: c.dob || undefined,
            anniversary_date: c.anniversary_date || undefined,
            is_converted: false,
            has_google_review: c.has_google_review,
            google_review_rating: c.google_review_rating || 5,
            google_review_text: c.google_review_text.trim() || undefined,
            scheme_name: form.scheme_name,
            area_name: form.area,
            notes: c.notes.trim() || undefined,
          });
        }
      });

      // Converted Customers (Compulsory fields)
      form.convertedList.forEach((c) => {
        customersPayload.push({
          id: c.id,
          customer_name: c.name.trim(),
          phone: c.phone.trim(),
          dob: c.dob || undefined,
          anniversary_date: c.anniversary_date || undefined,
          is_converted: true,
          has_google_review: c.has_google_review,
          google_review_rating: c.google_review_rating || 5,
          google_review_text: c.google_review_text.trim() || undefined,
          scheme_name: c.scheme_name || form.scheme_name,
          area_name: form.area,
          notes: c.notes.trim() || undefined,
        });
      });

      const customerReviewsCount = customersPayload.filter((c) => c.has_google_review).length;
      const totalGoogleRatings = Math.max(form.google_ratings_count, customerReviewsCount);

      await api.put(`/api/v1/outdoor-marketing/duties/${dutyId}`, {
        area: form.area.trim(),
        scheme_name: form.scheme_name.trim(),
        customers_attended_count: form.customers_attended_count,
        converted_customers_count: form.converted_customers_count,
        google_ratings_count: totalGoogleRatings,
        photo_url: form.photo_urls[0] || form.photo_url || null,
        photo_urls: form.photo_urls,
        notes: form.notes.trim() || null,
        status: 'Completed',
        customers: customersPayload,
      });

      success('Employee outdoor marketing activity saved successfully!');
      await loadData(selectedDate);
    } catch (err: any) {
      console.error('Error saving outdoor duty:', err);
      toastError(err.response?.data?.detail || 'Failed to save employee outdoor duty.');
    } finally {
      updateDutyFormField(dutyId, 'isSaving', false);
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
    const customers = assignedDuties.flatMap((d) =>
      d.customers.map((c) => ({
        ...c,
        duty_employee_name: d.employee_name,
        duty_employee_code: d.employee_code,
        duty_area: d.area,
        duty_scheme: d.scheme_name,
      }))
    );

    if (customers.length === 0) {
      toastError('No customer records available to export for this date.');
      return;
    }

    const headers = [
      'Customer Name',
      'Phone Number',
      'Date of Birth (DOB)',
      'Wedding Anniversary',
      'Status',
      'Enrolled / Interested Scheme',
      'Campaign Area',
      'Staff Representative',
      'Staff Code',
      'Google Review Given',
      'Google Rating (Stars)',
      'Google Review Feedback',
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
      escapeCsv(c.scheme_name || c.duty_scheme || ''),
      escapeCsv(c.area_name || c.duty_area || ''),
      escapeCsv(c.duty_employee_name || ''),
      escapeCsv(c.duty_employee_code || ''),
      escapeCsv(c.has_google_review ? 'Yes' : 'No'),
      escapeCsv(c.has_google_review ? (c.google_review_rating || 5) : ''),
      escapeCsv(c.google_review_text || ''),
      escapeCsv(c.date || selectedDate),
      escapeCsv(c.notes || ''),
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `outdoor_customers_${selectedDate}.csv`);
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
  const filteredCustomers = allDutiesCustomers.filter((c) => {
    if (!customerSearch.trim()) return true;
    const q = customerSearch.toLowerCase();
    return (
      c.customer_name?.toLowerCase().includes(q) ||
      c.phone?.includes(q) ||
      c.scheme_name?.toLowerCase().includes(q) ||
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
          <div className="flex items-center gap-3 self-start md:self-auto shrink-0 flex-wrap bg-white/80 backdrop-blur-xs p-3 rounded-2xl border border-[#C5E3D5] shadow-xs">
            <div className="flex flex-col">
              <label className="text-[10px] font-bold text-[#8A8479] uppercase tracking-wider mb-1 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-[#23815F]" />
                <span>Selected Field Date</span>
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => handleDateChange(e.target.value)}
                className="px-3 py-1.5 input-luxury-beige rounded-xl text-xs font-bold text-[#1D1D1B] cursor-pointer"
              />
            </div>

            <div className="h-9 w-px bg-[#C5E3D5] hidden sm:block" />

            <button
              onClick={() => loadData(selectedDate)}
              title="Refresh date data"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-[#F0F7F4] text-[#23815F] text-xs font-bold border border-[#C5E3D5] shadow-2xs transition-all cursor-pointer mt-auto"
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
      <div className="flex items-center gap-2 border-b border-[#C5E3D5] pb-2 overflow-x-auto">
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

        {/* TAB 5: All Customers & Google Reviews (With CSV Export) */}
        <button
          onClick={() => setActiveTab('leads')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === 'leads'
              ? 'bg-[#23815F] text-white shadow-xs'
              : 'bg-white text-[#5E5A52] hover:bg-[#F0F7F4] hover:text-[#1D1D1B] border border-[#C5E3D5]'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>5. All Customers & Reviews ({allDutiesCustomers.length})</span>
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
                  scheme_name: STANDARD_SCHEMES[0],
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
                                  : 'bg-[#FAF8F3] text-[#8A8479] border border-[#E4DFD4]'
                              }`}
                            >
                              {form.status}
                            </span>
                          </div>
                          <p className="text-xs text-[#5E5A52] font-medium mt-0.5">
                            {duty.designation} • {duty.department}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 self-end sm:self-auto">
                        <button
                          onClick={() => handleSaveDuty(duty.id)}
                          disabled={form.isSaving}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-linear-to-r from-[#23815F] to-[#1B694C] hover:from-[#1B694C] hover:to-[#14533C] text-white text-xs font-extrabold shadow-sm transition-all cursor-pointer hover:scale-[1.02] disabled:opacity-50"
                        >
                          <Save className="w-3.5 h-3.5" />
                          <span>{form.isSaving ? 'Saving...' : 'Save Employee Log'}</span>
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

                    {/* Area & Scheme Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-extrabold text-[#1D1D1B] mb-1.5 flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-[#23815F]" />
                          <span>Targeted Location / Area <strong className="text-[#C24141]">*</strong></span>
                        </label>
                        <input
                          type="text"
                          value={form.area}
                          onChange={(e) => updateDutyFormField(duty.id, 'area', e.target.value)}
                          placeholder="e.g. Yelahanka Old Town Market"
                          className="w-full px-3.5 py-2.5 input-luxury-beige rounded-xl text-xs font-semibold"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-extrabold text-[#1D1D1B] mb-1.5 flex items-center gap-1.5">
                          <Award className="w-3.5 h-3.5 text-[#9A782F]" />
                          <span>Promoted Jewellery Scheme</span>
                        </label>
                        <select
                          value={form.scheme_name}
                          onChange={(e) => updateDutyFormField(duty.id, 'scheme_name', e.target.value)}
                          className="w-full px-3.5 py-2.5 select-luxury-slate rounded-xl text-xs font-semibold cursor-pointer"
                        >
                          {STANDARD_SCHEMES.map((sch) => (
                            <option key={sch} value={sch}>
                              {sch}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Compact Field Photos Strip (Small in front, Expandable on click) */}
                    <CompactPhotoStrip
                      photos={form.photo_urls || []}
                      employeeName={duty.employee_name}
                      area={form.area || duty.area}
                      date={selectedDate}
                      isUploading={form.isUploadingPhotos}
                      onUpload={(e) => handleMultiplePhotoUpload(duty.id, e)}
                      onDelete={(url) => handleRemovePhoto(duty.id, url)}
                      onExpand={handleOpenLightbox}
                    />

                    {/* Attended Customers Section */}
                    <div className="space-y-3 bg-[#FAF8F3] border border-[#E4DFD4] rounded-2xl p-4 sm:p-5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <label className="text-xs font-extrabold text-[#1D1D1B] flex items-center gap-1.5">
                            <Users className="w-4 h-4 text-[#23815F]" />
                            <span>Customers Attended in Field</span>
                          </label>
                          <p className="text-[11px] text-[#5E5A52] mt-0.5">
                            Select number of attended visitors. Fill in details and Google review status (optional).
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-[#5E5A52]">Attended Count:</span>
                          <select
                            value={form.customers_attended_count}
                            onChange={(e) => handleAttendedCountChange(duty.id, parseInt(e.target.value) || 0)}
                            className="select-luxury-slate rounded-xl px-3 py-1.5 text-xs font-bold cursor-pointer"
                          >
                            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 20, 25, 30, 40, 50].map((num) => (
                              <option key={num} value={num}>
                                {num} {num === 1 ? 'Customer' : 'Customers'}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {form.customers_attended_count > 0 && (
                        <div className="space-y-3 pt-2">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {form.attendedList.map((cust, cIdx) => (
                              <div
                                key={cIdx}
                                className="bg-white border border-[#C5E3D5] rounded-2xl p-4 space-y-3 shadow-2xs"
                              >
                                <div className="text-xs font-bold text-[#23815F] flex items-center justify-between">
                                  <span>👤 Attended Customer #{cIdx + 1}</span>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <label className="text-[10px] font-bold text-[#8A8479] block mb-1">
                                      Customer Name
                                    </label>
                                    <input
                                      type="text"
                                      value={cust.name}
                                      onChange={(e) => updateAttendedCustomer(duty.id, cIdx, 'name', e.target.value)}
                                      placeholder="e.g. Anand Kumar"
                                      className="w-full px-2.5 py-1.5 input-luxury-beige rounded-lg text-xs font-medium"
                                    />
                                  </div>

                                  <div>
                                    <label className="text-[10px] font-bold text-[#8A8479] block mb-1">
                                      Phone Number
                                    </label>
                                    <input
                                      type="tel"
                                      value={cust.phone}
                                      onChange={(e) => updateAttendedCustomer(duty.id, cIdx, 'phone', e.target.value)}
                                      placeholder="e.g. 9845012345"
                                      className="w-full px-2.5 py-1.5 input-luxury-beige rounded-lg text-xs font-medium font-mono"
                                    />
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <label className="text-[10px] font-bold text-[#8A8479] mb-1 flex items-center gap-1">
                                      <Cake className="w-3 h-3 text-[#9A782F]" />
                                      <span>DOB</span>
                                    </label>
                                    <input
                                      type="date"
                                      value={cust.dob}
                                      onChange={(e) => updateAttendedCustomer(duty.id, cIdx, 'dob', e.target.value)}
                                      className="w-full px-2.5 py-1.5 input-luxury-beige rounded-lg text-xs font-medium cursor-pointer"
                                    />
                                  </div>

                                  <div>
                                    <label className="text-[10px] font-bold text-[#8A8479] mb-1 flex items-center gap-1">
                                      <Heart className="w-3 h-3 text-[#C24141]" />
                                      <span>Anniversary</span>
                                    </label>
                                    <input
                                      type="date"
                                      value={cust.anniversary_date}
                                      onChange={(e) => updateAttendedCustomer(duty.id, cIdx, 'anniversary_date', e.target.value)}
                                      className="w-full px-2.5 py-1.5 input-luxury-beige rounded-lg text-xs font-medium cursor-pointer"
                                    />
                                  </div>
                                </div>

                                {/* Customer Google Review Toggle */}
                                <div className="p-2.5 rounded-xl bg-[#FAFDFB] border border-[#C5E3D5] space-y-2">
                                  <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-bold text-[#1D1D1B]">
                                    <input
                                      type="checkbox"
                                      checked={cust.has_google_review}
                                      onChange={(e) => updateAttendedCustomer(duty.id, cIdx, 'has_google_review', e.target.checked)}
                                      className="rounded text-[#23815F] focus:ring-[#23815F]"
                                    />
                                    <span className="flex items-center gap-1 text-amber-600">
                                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                                      <span>Customer Gave Google Review?</span>
                                    </span>
                                  </label>

                                  {cust.has_google_review && (
                                    <div className="grid grid-cols-3 gap-2 pt-1">
                                      <div>
                                        <select
                                          value={cust.google_review_rating}
                                          onChange={(e) => updateAttendedCustomer(duty.id, cIdx, 'google_review_rating', parseInt(e.target.value) || 5)}
                                          className="w-full px-2 py-1 select-luxury-slate rounded-lg text-xs font-bold"
                                        >
                                          <option value="5">⭐⭐⭐⭐⭐ (5 Star)</option>
                                          <option value="4">⭐⭐⭐⭐ (4 Star)</option>
                                          <option value="3">⭐⭐⭐ (3 Star)</option>
                                        </select>
                                      </div>
                                      <div className="col-span-2">
                                        <input
                                          type="text"
                                          value={cust.google_review_text}
                                          onChange={(e) => updateAttendedCustomer(duty.id, cIdx, 'google_review_text', e.target.value)}
                                          placeholder="Review remark / feedback snippet..."
                                          className="w-full px-2.5 py-1 input-luxury-beige rounded-lg text-xs"
                                        />
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Converted Customers Section */}
                    <div className="space-y-3 bg-[#FAF6EB] border border-[#C6A45C]/30 rounded-2xl p-4 sm:p-5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <label className="text-xs font-extrabold text-[#9A782F] flex items-center gap-1.5">
                            <Award className="w-4 h-4 text-[#9A782F]" />
                            <span>Converted Customers / Scheme Enrolments</span>
                          </label>
                          <p className="text-[11px] text-[#5E5A52] mt-0.5">
                            For converted customers, full contact details below are <strong className="text-[#C24141]">compulsory</strong>.
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-[#5E5A52]">Converted Count:</span>
                          <select
                            value={form.converted_customers_count}
                            onChange={(e) => handleConvertedCountChange(duty.id, parseInt(e.target.value) || 0)}
                            className="select-luxury-slate rounded-xl px-3 py-1.5 text-xs font-bold cursor-pointer"
                          >
                            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 20].map((num) => (
                              <option key={num} value={num}>
                                {num} {num === 1 ? 'Converted Customer' : 'Converted Customers'}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {form.converted_customers_count > 0 && (
                        <div className="space-y-3 pt-2">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {form.convertedList.map((cust, cIdx) => (
                              <div
                                key={cIdx}
                                className="bg-white border-2 border-[#C6A45C]/40 rounded-2xl p-4 space-y-3 shadow-2xs"
                              >
                                <div className="text-xs font-extrabold text-[#9A782F] flex items-center justify-between">
                                  <span>🏆 Converted Customer #{cIdx + 1}</span>
                                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#FAF6EB] text-[#9A782F] font-bold border border-[#C6A45C]/30">
                                    Enrolled
                                  </span>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <label className="text-[10px] font-extrabold text-[#1D1D1B] block mb-1">
                                      Customer Name <span className="text-[#C24141]">*</span>
                                    </label>
                                    <input
                                      type="text"
                                      value={cust.name}
                                      onChange={(e) => updateConvertedCustomer(duty.id, cIdx, 'name', e.target.value)}
                                      placeholder="e.g. Sunita Devi"
                                      className="w-full px-2.5 py-1.5 input-luxury-beige rounded-lg text-xs font-bold"
                                      required
                                    />
                                  </div>

                                  <div>
                                    <label className="text-[10px] font-extrabold text-[#1D1D1B] block mb-1">
                                      Phone Number <span className="text-[#C24141]">*</span>
                                    </label>
                                    <input
                                      type="tel"
                                      value={cust.phone}
                                      onChange={(e) => updateConvertedCustomer(duty.id, cIdx, 'phone', e.target.value)}
                                      placeholder="e.g. 9845098765"
                                      className="w-full px-2.5 py-1.5 input-luxury-beige rounded-lg text-xs font-bold font-mono"
                                      required
                                    />
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <label className="text-[10px] font-bold text-[#5E5A52] mb-1 flex items-center gap-1">
                                      <Cake className="w-3 h-3 text-[#9A782F]" />
                                      <span>DOB</span>
                                    </label>
                                    <input
                                      type="date"
                                      value={cust.dob}
                                      onChange={(e) => updateConvertedCustomer(duty.id, cIdx, 'dob', e.target.value)}
                                      className="w-full px-2.5 py-1.5 input-luxury-beige rounded-lg text-xs font-medium cursor-pointer"
                                    />
                                  </div>

                                  <div>
                                    <label className="text-[10px] font-bold text-[#5E5A52] mb-1 flex items-center gap-1">
                                      <Heart className="w-3 h-3 text-[#C24141]" />
                                      <span>Anniversary</span>
                                    </label>
                                    <input
                                      type="date"
                                      value={cust.anniversary_date}
                                      onChange={(e) => updateConvertedCustomer(duty.id, cIdx, 'anniversary_date', e.target.value)}
                                      className="w-full px-2.5 py-1.5 input-luxury-beige rounded-lg text-xs font-medium cursor-pointer"
                                    />
                                  </div>
                                </div>

                                <div>
                                  <label className="text-[10px] font-bold text-[#5E5A52] block mb-1">
                                    Enrolled Scheme
                                  </label>
                                  <input
                                    type="text"
                                    value={cust.scheme_name}
                                    onChange={(e) => updateConvertedCustomer(duty.id, cIdx, 'scheme_name', e.target.value)}
                                    placeholder={form.scheme_name || 'Scheme Name'}
                                    className="w-full px-2.5 py-1.5 input-luxury-beige rounded-lg text-xs font-medium"
                                  />
                                </div>

                                {/* Converted Customer Google Review Toggle */}
                                <div className="p-2.5 rounded-xl bg-[#FAFDFB] border border-[#C5E3D5] space-y-2">
                                  <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-bold text-[#1D1D1B]">
                                    <input
                                      type="checkbox"
                                      checked={cust.has_google_review}
                                      onChange={(e) => updateConvertedCustomer(duty.id, cIdx, 'has_google_review', e.target.checked)}
                                      className="rounded text-[#23815F] focus:ring-[#23815F]"
                                    />
                                    <span className="flex items-center gap-1 text-amber-600">
                                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                                      <span>Customer Gave Google Review?</span>
                                    </span>
                                  </label>

                                  {cust.has_google_review && (
                                    <div className="grid grid-cols-3 gap-2 pt-1">
                                      <div>
                                        <select
                                          value={cust.google_review_rating}
                                          onChange={(e) => updateConvertedCustomer(duty.id, cIdx, 'google_review_rating', parseInt(e.target.value) || 5)}
                                          className="w-full px-2 py-1 select-luxury-slate rounded-lg text-xs font-bold"
                                        >
                                          <option value="5">⭐⭐⭐⭐⭐ (5 Star)</option>
                                          <option value="4">⭐⭐⭐⭐ (4 Star)</option>
                                          <option value="3">⭐⭐⭐ (3 Star)</option>
                                        </select>
                                      </div>
                                      <div className="col-span-2">
                                        <input
                                          type="text"
                                          value={cust.google_review_text}
                                          onChange={(e) => updateConvertedCustomer(duty.id, cIdx, 'google_review_text', e.target.value)}
                                          placeholder="Review remark / feedback snippet..."
                                          className="w-full px-2.5 py-1 input-luxury-beige rounded-lg text-xs"
                                        />
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Observations / Notes */}
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
                              : 'bg-[#FAF6EB] text-[#9A782F] border border-[#C6A45C]/30'
                          }`}
                        >
                          {duty.status}
                        </span>
                      </div>

                      {/* Targeted Area & Scheme */}
                      <div className="space-y-1.5 bg-[#FAF8F3] border border-[#E4DFD4] rounded-2xl p-3">
                        <div className="flex items-center gap-1.5 text-xs font-extrabold text-[#1D1D1B] truncate">
                          <MapPin className="w-3.5 h-3.5 text-[#23815F]" />
                          <span>{duty.area || 'Area Pending Entry'}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-[#5E5A52] truncate">
                          <Award className="w-3.5 h-3.5 text-[#9A782F]" />
                          <span>{duty.scheme_name || 'Scheme Not Selected'}</span>
                        </div>
                      </div>

                      {/* Performance Metric Badges */}
                      <div className="grid grid-cols-3 gap-2 text-center pt-1">
                        <div className="p-2 rounded-xl bg-[#E8F4EE]/60 border border-[#C5E3D5]/60">
                          <span className="text-[10px] font-bold text-[#5E5A52] uppercase block">Attended</span>
                          <span className="text-sm font-extrabold text-[#23815F]">
                            {duty.customers_attended_count || duty.customers.filter((c) => !c.is_converted).length}
                          </span>
                        </div>

                        <div className="p-2 rounded-xl bg-[#FAF6EB]/60 border border-[#C6A45C]/20">
                          <span className="text-[10px] font-bold text-[#5E5A52] uppercase block">Converted</span>
                          <span className="text-sm font-extrabold text-[#9A782F]">
                            {duty.converted_customers_count || duty.customers.filter((c) => c.is_converted).length}
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
                              `Area: ${duty.area || 'Field Area'} • Date: ${duty.date} • Scheme: ${duty.scheme_name || 'N/A'}`
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
          TAB 5: ALL CUSTOMERS & REVIEWS (WITH CSV EXPORT)
      ---------------------------------------------------- */}
      {activeTab === 'leads' && (
        <div className="space-y-4">
          <div className="p-4 sm:p-5 bg-white border border-[#C5E3D5] rounded-3xl shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-sm font-extrabold text-[#1D1D1B] flex items-center gap-2">
                <Users className="w-4 h-4 text-[#23815F]" />
                <span>Customer Leads & Google Reviews on {selectedDate} ({allDutiesCustomers.length})</span>
              </h3>
              <p className="text-xs text-[#5E5A52]">
                Detailed contact breakdown, birthday & anniversary dates, scheme selections, and Google 5-star ratings.
              </p>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-[#8A8479] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  placeholder="Search customer name, phone, area..."
                  className="w-full pl-8 pr-3 py-1.5 input-luxury-beige rounded-xl text-xs"
                />
              </div>

              <button
                onClick={handleExportCSV}
                className="inline-flex items-center gap-2 px-4 py-2 bg-linear-to-r from-[#23815F] to-[#1B694C] hover:from-[#1B694C] hover:to-[#14533C] text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer hover:scale-[1.02]"
              >
                <Download className="w-4 h-4" />
                <span>Export to CSV</span>
              </button>
            </div>
          </div>

          <div className="bg-white border border-[#C5E3D5] rounded-3xl overflow-hidden shadow-xs text-[#1D1D1B]">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#FAF8F3]/60 border-b border-[#C5E3D5] text-[#5E5A52] uppercase tracking-wider font-bold text-[11px]">
                  <tr>
                    <th className="px-5 py-3.5">Customer Name</th>
                    <th className="px-5 py-3.5">Phone Number</th>
                    <th className="px-5 py-3.5">DOB & Anniversary</th>
                    <th className="px-5 py-3.5">Google Review</th>
                    <th className="px-5 py-3.5">Staff Rep</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5">Scheme</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EBF3EE] font-medium">
                  {filteredCustomers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-5 py-8 text-center text-[#8A8479]">
                        No customer details recorded for {selectedDate} matching search.
                      </td>
                    </tr>
                  ) : (
                    filteredCustomers.map((cust) => (
                      <tr key={cust.id} className="hover:bg-[#F0F7F4] transition-colors">
                        <td className="px-5 py-3.5 font-bold text-[#1D1D1B]">{cust.customer_name}</td>
                        <td className="px-5 py-3.5 font-mono text-[#5E5A52]">
                          {cust.phone ? (
                            <span className="flex items-center gap-1.5">
                              <Phone className="w-3 h-3 text-[#23815F]" />
                              {cust.phone}
                            </span>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-[#5E5A52]">
                          <div className="space-y-0.5">
                            {cust.dob && <div>🎂 {cust.dob}</div>}
                            {cust.anniversary_date && <div>💍 {cust.anniversary_date}</div>}
                            {!cust.dob && !cust.anniversary_date && <span>—</span>}
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          {cust.has_google_review ? (
                            <div className="space-y-0.5">
                              <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-amber-600">
                                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                                {cust.google_review_rating || 5} Stars
                              </span>
                              {cust.google_review_text && (
                                <p className="text-[10px] text-[#5E5A52] italic max-w-xs truncate">
                                  "{cust.google_review_text}"
                                </p>
                              )}
                            </div>
                          ) : (
                            <span className="text-[#8A8479] text-[11px]">No review</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-[#5E5A52]">{cust.marketing_employee_name || 'Staff'}</td>
                        <td className="px-5 py-3.5">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              cust.is_converted
                                ? 'bg-[#FAF6EB] text-[#9A782F] border border-[#C6A45C]/30'
                                : 'bg-[#E8F4EE] text-[#23815F] border border-[#C5E3D5]'
                            }`}
                          >
                            {cust.is_converted ? '🏆 Converted' : '👥 Attended'}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 font-semibold text-[#9A782F]">{cust.scheme_name || '—'}</td>
                      </tr>
                    ))
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
                    {viewDetailDuty.customers_attended_count || viewDetailDuty.customers.length} Attended • {viewDetailDuty.converted_customers_count} Converted
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
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              cust.is_converted
                                ? 'bg-amber-100 text-[#9A782F] border border-[#C6A45C]/30'
                                : 'bg-[#E8F4EE] text-[#23815F] border border-[#C5E3D5]'
                            }`}
                          >
                            {cust.is_converted ? '🏆 Converted' : '👥 Attended'}
                          </span>
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
