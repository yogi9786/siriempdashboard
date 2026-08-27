import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Phone,
  Calendar,
  Compass,
  Plus,
  Trash2,
  Edit2,
  Image as ImageIcon,
  Shirt,
  Star,
  Camera,
  UserCheck,
  FileText,
  MessageSquare,
  MapPin,
  Award,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { EmptyState } from '../../components/ui/EmptyState';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { useToast } from '../../context/ToastContext';
import { EmployeeFormModal } from './EmployeeFormModal';
import {
  EmployeeDetail,
  CustomerActivity,
  SchemeRecord,
  FormMedia,
  AttireRecord,
  GoogleReview,
  OutdoorMarketingArea,
  OutdoorMarketingCustomer,
  OutdoorMarketingScheme,
} from '../../types';
import api from '../../api/client';

export const EmployeeDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();

  const [employee, setEmployee] = useState<EmployeeDetail | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>('customers');
  const [showEditModal, setShowEditModal] = useState<boolean>(false);

  // Customer Activity List & Modal State
  const [customerActivities, setCustomerActivities] = useState<CustomerActivity[]>([]);
  const [showAddCustomerModal, setShowAddCustomerModal] = useState<boolean>(false);
  const [newCustomerForm, setNewCustomerForm] = useState({
    customer_name: '',
    phone_number: '',
    activity_date: new Date().toISOString().split('T')[0],
    status: 'Attended',
    notes: '',
  });

  // Schemes List & Modal State
  const [schemes, setSchemes] = useState<SchemeRecord[]>([]);
  const [showAddSchemeModal, setShowAddSchemeModal] = useState<boolean>(false);
  const [newSchemeForm, setNewSchemeForm] = useState({
    customer_name: '',
    scheme_name: '',
    amount: '',
    record_date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  // Google Reviews List & Modal State
  const [googleReviews, setGoogleReviews] = useState<GoogleReview[]>([]);
  const [showAddReviewModal, setShowAddReviewModal] = useState<boolean>(false);
  const [newReviewForm, setNewReviewForm] = useState({
    customer_name: '',
    rating: 5,
    review_date: new Date().toISOString().split('T')[0],
    review_text: '',
    status: 'Published',
    screenshot_url: '',
    notes: '',
  });

  // Form Media List & Modal State
  const [formMediaList, setFormMediaList] = useState<FormMedia[]>([]);
  const [showUploadFormModal, setShowUploadFormModal] = useState<boolean>(false);
  const [uploadFormType, setUploadFormType] = useState<string>('Daily Submission Form');
  const [uploadNotes, setUploadNotes] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [viewImageModalUrl, setViewImageModalUrl] = useState<string | null>(null);

  // Attire List & Modal State
  const [attireList, setAttireList] = useState<AttireRecord[]>([]);
  const [showAddAttireModal, setShowAddAttireModal] = useState<boolean>(false);
  const [attireStatus, setAttireStatus] = useState<string>('Proper');
  const [attireDate, setAttireDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [attireNotes, setAttireNotes] = useState<string>('');

  // Outdoor Marketing Additional Data & Modals (When marked as Outdoor Marketer)
  const [outdoorAreas, setOutdoorAreas] = useState<OutdoorMarketingArea[]>([]);
  const [showAddAreaModal, setShowAddAreaModal] = useState<boolean>(false);
  const [newAreaForm, setNewAreaForm] = useState({
    area_name: '',
    location: '',
    activity_date: new Date().toISOString().split('T')[0],
    status: 'Planned',
    notes: '',
  });

  const [outdoorCustomers, setOutdoorCustomers] = useState<OutdoorMarketingCustomer[]>([]);
  const [showAddOutdoorCustModal, setShowAddOutdoorCustModal] = useState<boolean>(false);
  const [newOutdoorCustForm, setNewOutdoorCustForm] = useState({
    customer_name: '',
    phone: '',
    area_name: '',
    scheme_name: '',
    date: new Date().toISOString().split('T')[0],
    status: 'Lead',
    notes: '',
  });

  const [outdoorSchemes, setOutdoorSchemes] = useState<OutdoorMarketingScheme[]>([]);
  const [showAddOutdoorSchemeModal, setShowAddOutdoorSchemeModal] = useState<boolean>(false);
  const [newOutdoorSchemeForm, setNewOutdoorSchemeForm] = useState({
    scheme_name: '',
    area: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const [submittingAction, setSubmittingAction] = useState<boolean>(false);

  // Fetch Employee Profile & Dynamic Stats
  const fetchEmployeeData = async () => {
    if (!id) return;
    try {
      const res = await api.get<EmployeeDetail>(`/api/v1/employees/${id}`);
      setEmployee(res.data);
      if (res.data.department === 'Outdoor Marketing' || res.data.is_outdoor_marketing_employee) {
        if (activeTab === 'customers') {
          setActiveTab('target_areas');
        }
      }
    } catch (err) {
      console.error('Failed to load employee details:', err);
      toastError('Employee not found in your showroom.');
      navigate('/employees');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch Sub-tab lists
  const fetchTabContent = async () => {
    if (!id) return;
    try {
      if (activeTab === 'customers') {
        const res = await api.get<CustomerActivity[]>('/api/v1/customers', { params: { employee_id: id } });
        setCustomerActivities(res.data);
      } else if (activeTab === 'schemes') {
        const res = await api.get<SchemeRecord[]>('/api/v1/schemes', { params: { employee_id: id } });
        setSchemes(res.data);
      } else if (activeTab === 'reviews') {
        const res = await api.get<GoogleReview[]>('/api/v1/google-reviews', { params: { employee_id: id } });
        setGoogleReviews(res.data);
      } else if (activeTab === 'forms') {
        const res = await api.get<FormMedia[]>('/api/v1/gallery', { params: { employee_id: id } });
        setFormMediaList(res.data);
      } else if (activeTab === 'attire') {
        const res = await api.get<AttireRecord[]>('/api/v1/attire', { params: { employee_id: id } });
        setAttireList(res.data);
      } else if (activeTab === 'target_areas') {
        const res = await api.get<OutdoorMarketingArea[]>('/api/v1/outdoor-marketing/areas', { params: { employee_id: id } });
        setOutdoorAreas(res.data);
      } else if (activeTab === 'outdoor_leads') {
        const res = await api.get<OutdoorMarketingCustomer[]>('/api/v1/outdoor-marketing/customers', { params: { employee_id: id } });
        setOutdoorCustomers(res.data);
      } else if (activeTab === 'promoted_schemes') {
        const res = await api.get<OutdoorMarketingScheme[]>('/api/v1/outdoor-marketing/schemes', { params: { employee_id: id } });
        setOutdoorSchemes(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch tab data:', err);
    }
  };

  useEffect(() => {
    fetchEmployeeData();
  }, [id]);

  useEffect(() => {
    fetchTabContent();
  }, [id, activeTab]);

  // Handler: Add Customer Activity
  const handleAddCustomerActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !newCustomerForm.customer_name.trim() || !newCustomerForm.phone_number.trim()) return;

    setSubmittingAction(true);
    try {
      await api.post('/api/v1/customers', {
        employee_id: parseInt(id),
        customer_name: newCustomerForm.customer_name.trim(),
        phone_number: newCustomerForm.phone_number.trim(),
        activity_date: newCustomerForm.activity_date,
        status: newCustomerForm.status,
        notes: newCustomerForm.notes.trim() || null,
      });

      success('Customer activity recorded.');
      setShowAddCustomerModal(false);
      setNewCustomerForm({
        customer_name: '',
        phone_number: '',
        activity_date: new Date().toISOString().split('T')[0],
        status: 'Attended',
        notes: '',
      });
      fetchEmployeeData();
      fetchTabContent();
    } catch (err: any) {
      toastError(err.response?.data?.detail || 'Failed to record customer activity.');
    } finally {
      setSubmittingAction(false);
    }
  };

  // Handler: Add Scheme Record
  const handleAddScheme = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !newSchemeForm.customer_name.trim() || !newSchemeForm.scheme_name.trim()) return;

    setSubmittingAction(true);
    try {
      await api.post('/api/v1/schemes', {
        employee_id: parseInt(id),
        customer_name: newSchemeForm.customer_name.trim(),
        scheme_name: newSchemeForm.scheme_name.trim(),
        amount: parseFloat(newSchemeForm.amount) || 0,
        record_date: newSchemeForm.record_date,
        notes: newSchemeForm.notes.trim() || null,
      });

      success('Scheme record saved.');
      setShowAddSchemeModal(false);
      setNewSchemeForm({
        customer_name: '',
        scheme_name: '',
        amount: '',
        record_date: new Date().toISOString().split('T')[0],
        notes: '',
      });
      fetchEmployeeData();
      fetchTabContent();
    } catch (err: any) {
      toastError(err.response?.data?.detail || 'Failed to save scheme record.');
    } finally {
      setSubmittingAction(false);
    }
  };

  // Handler: Add Google Review
  const handleAddGoogleReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !newReviewForm.customer_name.trim() || !newReviewForm.review_text.trim()) return;

    setSubmittingAction(true);
    try {
      await api.post('/api/v1/google-reviews', {
        employee_id: parseInt(id),
        customer_name: newReviewForm.customer_name.trim(),
        rating: newReviewForm.rating,
        review_date: newReviewForm.review_date,
        review_text: newReviewForm.review_text.trim(),
        status: newReviewForm.status,
        screenshot_url: newReviewForm.screenshot_url.trim() || null,
        notes: newReviewForm.notes.trim() || null,
      });

      success('Google review recorded for employee.');
      setShowAddReviewModal(false);
      setNewReviewForm({
        customer_name: '',
        rating: 5,
        review_date: new Date().toISOString().split('T')[0],
        review_text: '',
        status: 'Published',
        screenshot_url: '',
        notes: '',
      });
      fetchEmployeeData();
      fetchTabContent();
    } catch (err: any) {
      toastError(err.response?.data?.detail || 'Failed to record Google review.');
    } finally {
      setSubmittingAction(false);
    }
  };

  // Handler: Upload Form Media Photo
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleUploadFormMedia = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !selectedFile) {
      toastError('Please select or capture a form image to upload.');
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('employee_id', id);
      formData.append('form_type', uploadFormType);
      if (uploadNotes.trim()) formData.append('notes', uploadNotes.trim());
      formData.append('file', selectedFile);

      await api.post('/api/v1/forms/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      success('Form photo uploaded successfully.');
      setShowUploadFormModal(false);
      setSelectedFile(null);
      setPreviewUrl(null);
      setUploadNotes('');
      fetchEmployeeData();
      fetchTabContent();
    } catch (err: any) {
      toastError(err.response?.data?.detail || 'Failed to upload form image.');
    } finally {
      setIsUploading(false);
    }
  };

  // Handler: Add Attire Check
  const handleAddAttire = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    setSubmittingAction(true);
    try {
      await api.post('/api/v1/attire', {
        employee_id: parseInt(id),
        check_date: attireDate,
        status: attireStatus,
        notes: attireNotes.trim() || null,
      });

      success('Attire record logged.');
      setShowAddAttireModal(false);
      setAttireNotes('');
      fetchEmployeeData();
      fetchTabContent();
    } catch (err: any) {
      toastError(err.response?.data?.detail || 'Failed to log attire record.');
    } finally {
      setSubmittingAction(false);
    }
  };

  // Outdoor Handler: Add Target Area
  const handleAddTargetArea = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !newAreaForm.area_name.trim()) return;

    setSubmittingAction(true);
    try {
      await api.post('/api/v1/outdoor-marketing/areas', {
        area_name: newAreaForm.area_name.trim(),
        location: newAreaForm.location.trim() || newAreaForm.area_name.trim(),
        assigned_employee_id: parseInt(id),
        activity_date: newAreaForm.activity_date,
        status: newAreaForm.status,
        notes: newAreaForm.notes.trim() || null,
      });

      success('Target area assigned to outdoor marketer.');
      setShowAddAreaModal(false);
      setNewAreaForm({
        area_name: '',
        location: '',
        activity_date: new Date().toISOString().split('T')[0],
        status: 'Planned',
        notes: '',
      });
      fetchTabContent();
    } catch (err: any) {
      toastError(err.response?.data?.detail || 'Failed to assign target area.');
    } finally {
      setSubmittingAction(false);
    }
  };

  // Outdoor Handler: Add Customer Lead
  const handleAddOutdoorCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !newOutdoorCustForm.customer_name.trim()) return;

    setSubmittingAction(true);
    try {
      await api.post('/api/v1/outdoor-marketing/customers', {
        marketing_employee_id: parseInt(id),
        customer_name: newOutdoorCustForm.customer_name.trim(),
        phone: newOutdoorCustForm.phone.trim() || '—',
        area_name: newOutdoorCustForm.area_name.trim() || 'Field Campaign',
        scheme_name: newOutdoorCustForm.scheme_name.trim() || null,
        date: newOutdoorCustForm.date,
        status: newOutdoorCustForm.status,
        notes: newOutdoorCustForm.notes.trim() || null,
      });

      success('Outdoor customer lead recorded.');
      setShowAddOutdoorCustModal(false);
      setNewOutdoorCustForm({
        customer_name: '',
        phone: '',
        area_name: '',
        scheme_name: '',
        date: new Date().toISOString().split('T')[0],
        status: 'Lead',
        notes: '',
      });
      fetchTabContent();
    } catch (err: any) {
      toastError(err.response?.data?.detail || 'Failed to record customer lead.');
    } finally {
      setSubmittingAction(false);
    }
  };

  // Outdoor Handler: Add Promoted Scheme
  const handleAddOutdoorScheme = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !newOutdoorSchemeForm.scheme_name.trim()) return;

    setSubmittingAction(true);
    try {
      await api.post('/api/v1/outdoor-marketing/schemes', {
        employee_id: parseInt(id),
        scheme_name: newOutdoorSchemeForm.scheme_name.trim(),
        area: newOutdoorSchemeForm.area.trim() || 'Showroom Vicinity',
        description: newOutdoorSchemeForm.description.trim() || null,
        date: newOutdoorSchemeForm.date,
        notes: newOutdoorSchemeForm.notes.trim() || null,
      });

      success('Promoted scheme logged for outdoor campaign.');
      setShowAddOutdoorSchemeModal(false);
      setNewOutdoorSchemeForm({
        scheme_name: '',
        area: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        notes: '',
      });
      fetchTabContent();
    } catch (err: any) {
      toastError(err.response?.data?.detail || 'Failed to log promoted scheme.');
    } finally {
      setSubmittingAction(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-20 flex justify-center">
        <LoadingSpinner message="Loading employee profile..." />
      </div>
    );
  }

  if (!employee) return null;

  const isOutdoor = employee.department === 'Outdoor Marketing' || employee.is_outdoor_marketing_employee;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header & Back Button */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/employees')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#737373] hover:text-[#171717] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Employees</span>
        </button>

        <div className="flex items-center gap-2">
          <Badge variant={employee.status === 'active' ? 'success' : 'outline'}>
            {employee.status === 'active' ? 'Active Staff' : 'Inactive'}
          </Badge>
          {isOutdoor && (
            <Badge variant="gold" className="flex items-center gap-1">
              <Compass className="w-3 h-3 text-[#C9A227]" />
              <span>Outdoor Marketer</span>
            </Badge>
          )}
        </div>
      </div>

      {/* Employee Profile Header Card (Light Slate Sapphire Theme) */}
      <div className="bg-gradient-to-br from-[#FAF8F3] via-white to-[#F0F4F8] border border-[#C5D5E6] rounded-3xl p-6 sm:p-7 shadow-sm text-[#1D1D1B] flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        {/* Subtle Ambient Shimmer */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#536B8A] to-transparent opacity-60 animate-pulse" />

        <div className="relative z-10 flex items-start gap-4">
          <div className="w-16 h-16 rounded-2xl bg-[#EDF2F7] border border-[#C5D5E6] text-[#536B8A] flex items-center justify-center font-extrabold text-xl shrink-0 overflow-hidden shadow-2xs">
            {employee.profile_photo_url ? (
              <img
                src={employee.profile_photo_url}
                alt={employee.full_name}
                className="w-full h-full object-cover"
              />
            ) : (
              employee.full_name.charAt(0)
            )}
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold text-[#1D1D1B] tracking-tight">{employee.full_name}</h1>
              <span className="font-mono text-xs px-2.5 py-0.5 rounded-md bg-[#EDF2F7] text-[#536B8A] font-bold border border-[#C5D5E6] shadow-2xs">
                {employee.employee_code}
              </span>
            </div>

            <p className="text-xs font-semibold text-[#536B8A]">
              {employee.designation} • {employee.department || 'Sales Department'}
            </p>

            <div className="flex flex-wrap items-center gap-4 text-xs text-[#536B8A] pt-1">
              <div className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-[#536B8A]" />
                <span className="font-medium">Joined: {employee.date_of_joining}</span>
              </div>
              {employee.phone && (
                <div className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-[#536B8A]" />
                  <span className="font-medium">{employee.phone}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Edit Profile Action in Slate Blue */}
        <div className="relative z-10 flex items-center gap-2 self-start md:self-auto shrink-0">
          <button
            onClick={() => setShowEditModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#536B8A] hover:bg-[#40546D] text-white text-xs font-bold shadow-sm transition-all cursor-pointer hover:scale-[1.02]"
          >
            <Edit2 className="w-3.5 h-3.5 text-white" />
            <span>Edit Profile</span>
          </button>
        </div>
      </div>

      {/* Dynamic Activity Statistics Cards */}
      {isOutdoor ? (
        /* Outdoor Marketer KPI Cards */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-[#E8E6E1] rounded-2xl p-5 shadow-2xs">
            <div className="text-[11px] font-semibold text-[#737373] uppercase tracking-wider mb-1.5">
              Target Areas
            </div>
            <div className="text-2xl font-bold text-[#171717]">
              {outdoorAreas.length}
            </div>
            <p className="text-xs text-[#737373] mt-2 font-medium">Assigned locations</p>
          </div>

          <div className="bg-white border border-[#E8E6E1] rounded-2xl p-5 shadow-2xs">
            <div className="text-[11px] font-semibold text-[#737373] uppercase tracking-wider mb-1.5">
              Customer Leads
            </div>
            <div className="text-2xl font-bold text-[#171717]">
              {outdoorCustomers.length}
            </div>
            <p className="text-xs text-[#737373] mt-2 font-medium">Field prospects recorded</p>
          </div>

          <div className="bg-white border border-[#E8E6E1] rounded-2xl p-5 shadow-2xs">
            <div className="text-[11px] font-semibold text-[#737373] uppercase tracking-wider mb-1.5">
              Promoted Schemes
            </div>
            <div className="text-2xl font-bold text-[#C9A227]">
              {outdoorSchemes.length}
            </div>
            <p className="text-xs text-[#737373] mt-2 font-medium">Gold & savings campaigns</p>
          </div>

          <div className="bg-white border border-[#E8E6E1] rounded-2xl p-5 shadow-2xs">
            <div className="text-[11px] font-semibold text-[#737373] uppercase tracking-wider mb-1.5">
              Daily Forms & Sheets
            </div>
            <div className="text-2xl font-bold text-[#171717]">
              {employee.form_media_count || formMediaList.length}
            </div>
            <p className="text-xs text-[#737373] mt-2 font-medium">Camera uploads logged</p>
          </div>
        </div>
      ) : (
        /* Standard Sales Staff KPI Cards */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-[#E8E6E1] rounded-2xl p-5 shadow-2xs">
            <div className="text-[11px] font-semibold text-[#737373] uppercase tracking-wider mb-1.5">
              Customers Attended
            </div>
            <div className="text-2xl font-bold text-[#171717]">
              {employee.customers_attended_count}
            </div>
            <p className="text-xs text-[#737373] mt-2 font-medium">Visitor interactions logged</p>
          </div>

          <div className="bg-white border border-[#E8E6E1] rounded-2xl p-5 shadow-2xs">
            <div className="text-[11px] font-semibold text-[#737373] uppercase tracking-wider mb-1.5">
              Customers Closed
            </div>
            <div className="text-2xl font-bold text-[#16845B]">
              {employee.customers_closed_count}
            </div>
            <p className="text-xs text-[#737373] mt-2 font-medium">Sales closed successfully</p>
          </div>

          <div className="bg-white border border-[#E8E6E1] rounded-2xl p-5 shadow-2xs">
            <div className="text-[11px] font-semibold text-[#737373] uppercase tracking-wider mb-1.5">
              Schemes Closed
            </div>
            <div className="text-2xl font-bold text-[#C9A227]">
              {employee.schemes_closed_count}
            </div>
            <p className="text-xs text-[#737373] mt-2 font-medium">Gold plans enrolled</p>
          </div>

          <div className="bg-white border border-[#E8E6E1] rounded-2xl p-5 shadow-2xs">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-semibold text-[#737373] uppercase tracking-wider">
                Google Reviews
              </span>
              <div className="flex items-center gap-0.5 text-[#C9A227]">
                <Star className="w-3.5 h-3.5 fill-[#C9A227]" />
                <span className="text-xs font-bold text-[#171717] ml-0.5">
                  {employee.average_rating ? employee.average_rating.toFixed(1) : '5.0'}
                </span>
              </div>
            </div>
            <div className="text-2xl font-bold text-[#171717]">
              {employee.google_reviews_count || googleReviews.length}
            </div>
            <p className="text-xs text-[#737373] mt-2 font-medium">Positive customer reviews</p>
          </div>
        </div>
      )}

      {/* Sub-Navigation Tabs */}
      <div className="border-b border-[#E8E6E1] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1 overflow-x-auto pb-1">
          {isOutdoor ? (
            <>
              {/* Outdoor Tabs */}
              <button
                onClick={() => setActiveTab('target_areas')}
                className={`px-3.5 py-2.5 text-xs font-semibold rounded-t-xl transition-all border-b-2 whitespace-nowrap cursor-pointer ${activeTab === 'target_areas'
                    ? 'border-[#536B8A] text-[#536B8A] font-bold bg-[#EDF2F7]/50'
                    : 'border-transparent text-[#8A8479] hover:text-[#1D1D1B]'
                  }`}
              >
                Target Areas ({outdoorAreas.length})
              </button>

              <button
                onClick={() => setActiveTab('outdoor_leads')}
                className={`px-3.5 py-2.5 text-xs font-semibold rounded-t-xl transition-all border-b-2 whitespace-nowrap cursor-pointer ${activeTab === 'outdoor_leads'
                    ? 'border-[#536B8A] text-[#536B8A] font-bold bg-[#EDF2F7]/50'
                    : 'border-transparent text-[#8A8479] hover:text-[#1D1D1B]'
                  }`}
              >
                Customer Leads ({outdoorCustomers.length})
              </button>

              <button
                onClick={() => setActiveTab('promoted_schemes')}
                className={`px-3.5 py-2.5 text-xs font-semibold rounded-t-xl transition-all border-b-2 whitespace-nowrap cursor-pointer ${activeTab === 'promoted_schemes'
                    ? 'border-[#536B8A] text-[#536B8A] font-bold bg-[#EDF2F7]/50'
                    : 'border-transparent text-[#8A8479] hover:text-[#1D1D1B]'
                  }`}
              >
                Promoted Schemes ({outdoorSchemes.length})
              </button>

              <button
                onClick={() => setActiveTab('forms')}
                className={`px-3.5 py-2.5 text-xs font-semibold rounded-t-xl transition-all border-b-2 whitespace-nowrap cursor-pointer ${activeTab === 'forms'
                    ? 'border-[#536B8A] text-[#536B8A] font-bold bg-[#EDF2F7]/50'
                    : 'border-transparent text-[#8A8479] hover:text-[#1D1D1B]'
                  }`}
              >
                Daily Forms ({formMediaList.length})
              </button>

              <button
                onClick={() => setActiveTab('attire')}
                className={`px-3.5 py-2.5 text-xs font-semibold rounded-t-xl transition-all border-b-2 whitespace-nowrap cursor-pointer ${activeTab === 'attire'
                    ? 'border-[#536B8A] text-[#536B8A] font-bold bg-[#EDF2F7]/50'
                    : 'border-transparent text-[#8A8479] hover:text-[#1D1D1B]'
                  }`}
              >
                Attire Checks ({attireList.length})
              </button>
            </>
          ) : (
            <>
              {/* Sales Staff Tabs */}
              <button
                onClick={() => setActiveTab('customers')}
                className={`px-3.5 py-2.5 text-xs font-semibold rounded-t-xl transition-all border-b-2 whitespace-nowrap cursor-pointer ${activeTab === 'customers'
                    ? 'border-[#536B8A] text-[#536B8A] font-bold bg-[#EDF2F7]/50'
                    : 'border-transparent text-[#8A8479] hover:text-[#1D1D1B]'
                  }`}
              >
                Customer Activity ({employee.customers_attended_count})
              </button>

              <button
                onClick={() => setActiveTab('schemes')}
                className={`px-3.5 py-2.5 text-xs font-semibold rounded-t-xl transition-all border-b-2 whitespace-nowrap cursor-pointer ${activeTab === 'schemes'
                    ? 'border-[#536B8A] text-[#536B8A] font-bold bg-[#EDF2F7]/50'
                    : 'border-transparent text-[#8A8479] hover:text-[#1D1D1B]'
                  }`}
              >
                Schemes Closed ({employee.schemes_closed_count})
              </button>

              <button
                onClick={() => setActiveTab('reviews')}
                className={`px-3.5 py-2.5 text-xs font-semibold rounded-t-xl transition-all border-b-2 whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${activeTab === 'reviews'
                    ? 'border-[#536B8A] text-[#536B8A] font-bold bg-[#EDF2F7]/50'
                    : 'border-transparent text-[#8A8479] hover:text-[#1D1D1B]'
                  }`}
              >
                <Star className="w-3.5 h-3.5 text-[#B8943D] fill-[#B8943D]" />
                <span>Google Reviews ({employee.google_reviews_count || googleReviews.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('forms')}
                className={`px-3.5 py-2.5 text-xs font-semibold rounded-t-xl transition-all border-b-2 whitespace-nowrap cursor-pointer ${activeTab === 'forms'
                    ? 'border-[#536B8A] text-[#536B8A] font-bold bg-[#EDF2F7]/50'
                    : 'border-transparent text-[#8A8479] hover:text-[#1D1D1B]'
                  }`}
              >
                Daily Forms ({formMediaList.length})
              </button>

              <button
                onClick={() => setActiveTab('attire')}
                className={`px-3.5 py-2.5 text-xs font-semibold rounded-t-xl transition-all border-b-2 whitespace-nowrap cursor-pointer ${activeTab === 'attire'
                    ? 'border-[#536B8A] text-[#536B8A] font-bold bg-[#EDF2F7]/50'
                    : 'border-transparent text-[#8A8479] hover:text-[#1D1D1B]'
                  }`}
              >
                Attire Checks ({attireList.length})
              </button>
            </>
          )}
        </div>

        {/* Tab Action Buttons */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          {activeTab === 'customers' && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowAddCustomerModal(true)}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
              className="text-xs shadow-2xs"
            >
              + Log Customer
            </Button>
          )}

          {activeTab === 'schemes' && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowAddSchemeModal(true)}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
              className="text-xs shadow-2xs"
            >
              + Add Scheme
            </Button>
          )}

          {activeTab === 'reviews' && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowAddReviewModal(true)}
              leftIcon={<Star className="w-3.5 h-3.5" />}
              className="text-xs shadow-2xs"
            >
              + Add Review
            </Button>
          )}

          {activeTab === 'forms' && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowUploadFormModal(true)}
              leftIcon={<Camera className="w-3.5 h-3.5" />}
              className="text-xs shadow-2xs"
            >
              + Upload Form
            </Button>
          )}

          {activeTab === 'attire' && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowAddAttireModal(true)}
              leftIcon={<Shirt className="w-3.5 h-3.5" />}
              className="text-xs shadow-2xs"
            >
              + Log Attire Check
            </Button>
          )}

          {activeTab === 'target_areas' && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowAddAreaModal(true)}
              leftIcon={<MapPin className="w-3.5 h-3.5" />}
              className="text-xs shadow-2xs"
            >
              + Assign Target Area
            </Button>
          )}

          {activeTab === 'outdoor_leads' && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowAddOutdoorCustModal(true)}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
              className="text-xs shadow-2xs"
            >
              + Record Customer Lead
            </Button>
          )}

          {activeTab === 'promoted_schemes' && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowAddOutdoorSchemeModal(true)}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
              className="text-xs shadow-2xs"
            >
              + Log Promoted Scheme
            </Button>
          )}
        </div>
      </div>

      {/* Tab 1: Customer Activity List */}
      {activeTab === 'customers' && (
        <div className="space-y-4">
          {customerActivities.length === 0 ? (
            <EmptyState
              title="No customer interactions logged."
              description={`Record showroom customer walk-ins and inquiries attended by ${employee.full_name}.`}
              icon={UserCheck}
              actionText="Log Customer Activity"
              onAction={() => setShowAddCustomerModal(true)}
            />
          ) : (
            <div className="bg-white border border-[#E8E6E1] rounded-2xl overflow-hidden shadow-2xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#FAF9F6] border-b border-[#E8E6E1] text-[#737373] font-bold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="px-5 py-3.5">Customer Name</th>
                    <th className="px-5 py-3.5">Contact</th>
                    <th className="px-5 py-3.5">Date</th>
                    <th className="px-5 py-3.5">Interaction Status</th>
                    <th className="px-5 py-3.5">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0EFEA] font-medium">
                  {customerActivities.map((act) => (
                    <tr key={act.id} className="hover:bg-[#FAF9F6] transition-colors">
                      <td className="px-5 py-3.5 font-bold text-[#171717]">{act.customer_name}</td>
                      <td className="px-5 py-3.5 text-[#525252] font-mono">{act.phone_number}</td>
                      <td className="px-5 py-3.5 text-[#737373]">{act.activity_date}</td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${act.status === 'Closed'
                              ? 'bg-[#EAF7F1] text-[#16845B] border border-[#C1ECD9]'
                              : act.status === 'Attended'
                                ? 'bg-[#FAF6EB] text-[#8B6D1B] border border-[#EEDFA8]'
                                : 'bg-[#F5F4F0] text-[#525252]'
                            }`}
                        >
                          {act.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-[#737373] max-w-xs truncate">{act.notes || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Schemes Closed List */}
      {activeTab === 'schemes' && (
        <div className="space-y-4">
          {schemes.length === 0 ? (
            <EmptyState
              title="No schemes closed yet."
              description={`Track gold and diamond monthly saving plans registered by ${employee.full_name}.`}
              icon={Award}
              actionText="Add Scheme Record"
              onAction={() => setShowAddSchemeModal(true)}
            />
          ) : (
            <div className="bg-white border border-[#E8E6E1] rounded-2xl overflow-hidden shadow-2xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#FAF9F6] border-b border-[#E8E6E1] text-[#737373] font-bold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="px-5 py-3.5">Customer Name</th>
                    <th className="px-5 py-3.5">Scheme Plan</th>
                    <th className="px-5 py-3.5">Amount (₹)</th>
                    <th className="px-5 py-3.5">Date</th>
                    <th className="px-5 py-3.5">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0EFEA] font-medium">
                  {schemes.map((sch) => (
                    <tr key={sch.id} className="hover:bg-[#FAF9F6] transition-colors">
                      <td className="px-5 py-3.5 font-bold text-[#171717]">{sch.customer_name}</td>
                      <td className="px-5 py-3.5 font-semibold text-[#171717]">{sch.scheme_name}</td>
                      <td className="px-5 py-3.5 font-mono font-bold text-[#171717]">₹{sch.amount.toLocaleString('en-IN')}</td>
                      <td className="px-5 py-3.5 text-[#737373]">{sch.record_date}</td>
                      <td className="px-5 py-3.5 text-[#737373] max-w-xs truncate">{sch.notes || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Google Reviews */}
      {activeTab === 'reviews' && (
        <div className="space-y-4">
          {googleReviews.length === 0 ? (
            <EmptyState
              title="No Google reviews logged."
              description={`Log 5-star customer reviews mentioning ${employee.full_name}.`}
              icon={Star}
              actionText="Log Google Review"
              onAction={() => setShowAddReviewModal(true)}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {googleReviews.map((rev) => (
                <div key={rev.id} className="bg-white border border-[#E8E6E1] rounded-2xl p-5 shadow-2xs space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-[#C9A227]">
                      {[...Array(rev.rating)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-[#C9A227]" />
                      ))}
                    </div>
                    <span className="text-[11px] text-[#A3A3A3] font-medium">{rev.review_date}</span>
                  </div>
                  <p className="text-xs text-[#171717] font-medium italic">"{rev.review_text}"</p>
                  <p className="text-[11px] text-[#737373] font-semibold">— Customer: {rev.customer_name}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Daily Forms & Media */}
      {activeTab === 'forms' && (
        <div className="space-y-4">
          {formMediaList.length === 0 ? (
            <EmptyState
              title="No form images uploaded."
              description={`Upload daily closing sheets, order forms, and appraisal photos for ${employee.full_name}.`}
              icon={Camera}
              actionText="Upload Form Photo"
              onAction={() => setShowUploadFormModal(true)}
            />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {formMediaList.map((m) => (
                <div
                  key={m.id}
                  onClick={() => setViewImageModalUrl(m.file_url)}
                  className="bg-white border border-[#E8E6E1] rounded-2xl overflow-hidden shadow-2xs group cursor-pointer hover:border-[#171717] transition-all"
                >
                  <div className="aspect-4/3 bg-[#FAF9F6] overflow-hidden relative">
                    <img
                      src={m.file_url}
                      alt={m.form_type}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold">
                      View Full Size
                    </div>
                  </div>
                  <div className="p-3 space-y-1">
                    <p className="text-xs font-bold text-[#171717] truncate">{m.form_type}</p>
                    <p className="text-[10px] text-[#A3A3A3]">{m.upload_date}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 5: Attire Checks */}
      {activeTab === 'attire' && (
        <div className="space-y-4">
          {attireList.length === 0 ? (
            <EmptyState
              title="No attire records logged."
              description={`Maintain showroom grooming standards for ${employee.full_name}.`}
              icon={Shirt}
              actionText="Log Attire Check"
              onAction={() => setShowAddAttireModal(true)}
            />
          ) : (
            <div className="bg-white border border-[#E8E6E1] rounded-2xl overflow-hidden shadow-2xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#FAF9F6] border-b border-[#E8E6E1] text-[#737373] font-bold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="px-5 py-3.5">Check Date</th>
                    <th className="px-5 py-3.5">Grooming & Attire Status</th>
                    <th className="px-5 py-3.5">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0EFEA] font-medium">
                  {attireList.map((att) => (
                    <tr key={att.id} className="hover:bg-[#FAF9F6] transition-colors">
                      <td className="px-5 py-3.5 text-[#525252] font-semibold">{att.check_date}</td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${att.status === 'Proper'
                              ? 'bg-[#EAF7F1] text-[#16845B] border border-[#C1ECD9]'
                              : 'bg-[#FDECEC] text-[#C24141] border border-[#F9C3C3]'
                            }`}
                        >
                          {att.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-[#737373]">{att.notes || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Outdoor Tab 1: Target Areas */}
      {activeTab === 'target_areas' && (
        <div className="space-y-4">
          {outdoorAreas.length === 0 ? (
            <EmptyState
              title="No target areas assigned."
              description={`Assign field marketing localities, towns, and campaign zones to ${employee.full_name}.`}
              icon={MapPin}
              actionText="Assign Target Area"
              onAction={() => setShowAddAreaModal(true)}
            />
          ) : (
            <div className="bg-white border border-[#E8E6E1] rounded-2xl overflow-hidden shadow-2xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#FAF9F6] border-b border-[#E8E6E1] text-[#737373] font-bold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="px-5 py-3.5">Area / Zone</th>
                    <th className="px-5 py-3.5">Location / Landmark</th>
                    <th className="px-5 py-3.5">Campaign Date</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0EFEA] font-medium">
                  {outdoorAreas.map((area) => (
                    <tr key={area.id} className="hover:bg-[#FAF9F6] transition-colors">
                      <td className="px-5 py-3.5 font-bold text-[#171717]">{area.area_name}</td>
                      <td className="px-5 py-3.5 text-[#525252]">{area.location}</td>
                      <td className="px-5 py-3.5 text-[#737373]">{area.activity_date}</td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${area.status === 'Completed'
                              ? 'bg-[#EAF7F1] text-[#16845B] border border-[#C1ECD9]'
                              : area.status === 'Active'
                                ? 'bg-[#FAF6EB] text-[#8B6D1B] border border-[#EEDFA8]'
                                : 'bg-[#F5F4F0] text-[#525252]'
                            }`}
                        >
                          {area.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-[#737373]">{area.notes || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Outdoor Tab 2: Customer Leads */}
      {activeTab === 'outdoor_leads' && (
        <div className="space-y-4">
          {outdoorCustomers.length === 0 ? (
            <EmptyState
              title="No outdoor customer leads logged."
              description={`Record leads and prospective gold buyers generated in the field by ${employee.full_name}.`}
              icon={UserCheck}
              actionText="Record Customer Lead"
              onAction={() => setShowAddOutdoorCustModal(true)}
            />
          ) : (
            <div className="bg-white border border-[#E8E6E1] rounded-2xl overflow-hidden shadow-2xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#FAF9F6] border-b border-[#E8E6E1] text-[#737373] font-bold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="px-5 py-3.5">Customer Name</th>
                    <th className="px-5 py-3.5">Phone Number</th>
                    <th className="px-5 py-3.5">Area / Location</th>
                    <th className="px-5 py-3.5">Interested Scheme</th>
                    <th className="px-5 py-3.5">Date</th>
                    <th className="px-5 py-3.5">Lead Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0EFEA] font-medium">
                  {outdoorCustomers.map((cust) => (
                    <tr key={cust.id} className="hover:bg-[#FAF9F6] transition-colors">
                      <td className="px-5 py-3.5 font-bold text-[#171717]">{cust.customer_name}</td>
                      <td className="px-5 py-3.5 font-mono text-[#525252]">{cust.phone}</td>
                      <td className="px-5 py-3.5 text-[#525252] font-medium">{cust.area_name}</td>
                      <td className="px-5 py-3.5 font-semibold text-[#171717]">{cust.scheme_name || 'General Inquiry'}</td>
                      <td className="px-5 py-3.5 text-[#737373]">{cust.date}</td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${cust.status === 'Closed'
                              ? 'bg-[#EAF7F1] text-[#16845B] border border-[#C1ECD9]'
                              : cust.status === 'Interested'
                                ? 'bg-[#FAF6EB] text-[#8B6D1B] border border-[#EEDFA8]'
                                : 'bg-[#F5F4F0] text-[#525252]'
                            }`}
                        >
                          {cust.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Outdoor Tab 3: Promoted Schemes */}
      {activeTab === 'promoted_schemes' && (
        <div className="space-y-4">
          {outdoorSchemes.length === 0 ? (
            <EmptyState
              title="No promoted schemes logged."
              description={`Track specific jewelry savings plans and campaign flyers promoted by ${employee.full_name}.`}
              icon={Award}
              actionText="Log Promoted Scheme"
              onAction={() => setShowAddOutdoorSchemeModal(true)}
            />
          ) : (
            <div className="bg-white border border-[#E8E6E1] rounded-2xl overflow-hidden shadow-2xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#FAF9F6] border-b border-[#E8E6E1] text-[#737373] font-bold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="px-5 py-3.5">Scheme Plan Name</th>
                    <th className="px-5 py-3.5">Campaign Area</th>
                    <th className="px-5 py-3.5">Date</th>
                    <th className="px-5 py-3.5">Description / Target</th>
                    <th className="px-5 py-3.5">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0EFEA] font-medium">
                  {outdoorSchemes.map((sch) => (
                    <tr key={sch.id} className="hover:bg-[#FAF9F6] transition-colors">
                      <td className="px-5 py-3.5 font-bold text-[#171717]">{sch.scheme_name}</td>
                      <td className="px-5 py-3.5 font-medium text-[#525252]">{sch.area}</td>
                      <td className="px-5 py-3.5 text-[#737373]">{sch.date}</td>
                      <td className="px-5 py-3.5 text-[#525252]">{sch.description || '—'}</td>
                      <td className="px-5 py-3.5 text-[#737373]">{sch.notes || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* =========================================================
          MODALS
      ========================================================= */}

      {/* Modal: Add Customer Activity */}
      <Modal
        isOpen={showAddCustomerModal}
        onClose={() => setShowAddCustomerModal(false)}
        title="Log Customer Activity"
        subtitle={`Record showroom customer walk-in attended by ${employee.full_name}`}
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setShowAddCustomerModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleAddCustomerActivity} isLoading={submittingAction}>
              Save Activity
            </Button>
          </>
        }
      >
        <form onSubmit={handleAddCustomerActivity} className="space-y-4">
          <Input
            label="Customer Name *"
            value={newCustomerForm.customer_name}
            onChange={(e) => setNewCustomerForm({ ...newCustomerForm, customer_name: e.target.value })}
            placeholder="e.g. Ramesh Gowda"
            required
            autoFocus
          />
          <Input
            label="Customer Phone Number *"
            type="tel"
            value={newCustomerForm.phone_number}
            onChange={(e) => setNewCustomerForm({ ...newCustomerForm, phone_number: e.target.value })}
            placeholder="e.g. 9845012345"
            required
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Interaction Date"
              type="date"
              value={newCustomerForm.activity_date}
              onChange={(e) => setNewCustomerForm({ ...newCustomerForm, activity_date: e.target.value })}
            />
            <Select
              label="Status"
              value={newCustomerForm.status}
              onChange={(e) => setNewCustomerForm({ ...newCustomerForm, status: e.target.value as any })}
              options={[
                { value: 'Attended', label: 'Attended (Inquired)' },
                { value: 'Closed', label: 'Closed (Purchased)' },
                { value: 'Follow-up', label: 'Follow-up Needed' },
                { value: 'Lost', label: 'Lost / No Interest' },
              ]}
            />
          </div>
          <Input
            label="Notes / Interested Items"
            value={newCustomerForm.notes}
            onChange={(e) => setNewCustomerForm({ ...newCustomerForm, notes: e.target.value })}
            placeholder="e.g. Inquired about bridal necklace, 22kt gold"
          />
        </form>
      </Modal>

      {/* Modal: Add Scheme Record */}
      <Modal
        isOpen={showAddSchemeModal}
        onClose={() => setShowAddSchemeModal(false)}
        title="Record Gold Scheme Subscription"
        subtitle={`Log monthly savings scheme closed by ${employee.full_name}`}
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setShowAddSchemeModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleAddScheme} isLoading={submittingAction}>
              Save Scheme
            </Button>
          </>
        }
      >
        <form onSubmit={handleAddScheme} className="space-y-4">
          <Input
            label="Customer Name *"
            value={newSchemeForm.customer_name}
            onChange={(e) => setNewSchemeForm({ ...newSchemeForm, customer_name: e.target.value })}
            placeholder="e.g. Smt. Lakshmi"
            required
            autoFocus
          />
          <Input
            label="Scheme Plan Name *"
            value={newSchemeForm.scheme_name}
            onChange={(e) => setNewSchemeForm({ ...newSchemeForm, scheme_name: e.target.value })}
            placeholder="e.g. Siri Samruddhi Gold 11-Month Plan"
            required
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Subscription Amount (₹) *"
              type="number"
              value={newSchemeForm.amount}
              onChange={(e) => setNewSchemeForm({ ...newSchemeForm, amount: e.target.value })}
              placeholder="e.g. 5000"
              required
            />
            <Input
              label="Registration Date"
              type="date"
              value={newSchemeForm.record_date}
              onChange={(e) => setNewSchemeForm({ ...newSchemeForm, record_date: e.target.value })}
            />
          </div>
          <Input
            label="Remarks / Passbook No."
            value={newSchemeForm.notes}
            onChange={(e) => setNewSchemeForm({ ...newSchemeForm, notes: e.target.value })}
            placeholder="e.g. Passbook #SSG-8821"
          />
        </form>
      </Modal>

      {/* Modal: Add Google Review */}
      <Modal
        isOpen={showAddReviewModal}
        onClose={() => setShowAddReviewModal(false)}
        title="Record Google Review"
        subtitle={`Log 5-star customer review for ${employee.full_name}`}
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setShowAddReviewModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleAddGoogleReview} isLoading={submittingAction}>
              Save Review
            </Button>
          </>
        }
      >
        <form onSubmit={handleAddGoogleReview} className="space-y-4">
          <Input
            label="Customer Name *"
            value={newReviewForm.customer_name}
            onChange={(e) => setNewReviewForm({ ...newReviewForm, customer_name: e.target.value })}
            placeholder="e.g. Ananya Sharma"
            required
            autoFocus
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Rating *"
              value={newReviewForm.rating.toString()}
              onChange={(e) => setNewReviewForm({ ...newReviewForm, rating: parseInt(e.target.value) })}
              options={[
                { value: '5', label: '⭐⭐⭐⭐⭐ 5 Stars (Excellent)' },
                { value: '4', label: '⭐⭐⭐⭐ 4 Stars (Good)' },
                { value: '3', label: '⭐⭐⭐ 3 Stars (Average)' },
              ]}
            />
            <Input
              label="Review Date"
              type="date"
              value={newReviewForm.review_date}
              onChange={(e) => setNewReviewForm({ ...newReviewForm, review_date: e.target.value })}
            />
          </div>
          <Input
            label="Review Text *"
            value={newReviewForm.review_text}
            onChange={(e) => setNewReviewForm({ ...newReviewForm, review_text: e.target.value })}
            placeholder="e.g. Wonderful service by staff, great gold collection!"
            required
          />
        </form>
      </Modal>

      {/* Modal: Upload Daily Form Media */}
      <Modal
        isOpen={showUploadFormModal}
        onClose={() => setShowUploadFormModal(false)}
        title="Upload Daily Closing Form / Sheet"
        subtitle={`Upload camera snapshot or document for ${employee.full_name}`}
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setShowUploadFormModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleUploadFormMedia} isLoading={isUploading}>
              Upload Form Photo
            </Button>
          </>
        }
      >
        <form onSubmit={handleUploadFormMedia} className="space-y-4">
          <Select
            label="Form Type *"
            value={uploadFormType}
            onChange={(e) => setUploadFormType(e.target.value)}
            options={[
              { value: 'Daily Closing Form', label: 'Daily Closing Form' },
              { value: 'Customer Inquiry Form', label: 'Customer Inquiry Form' },
              { value: 'Gold Appraisal Sheet', label: 'Gold Appraisal Sheet' },
              { value: 'Stock Inspection Report', label: 'Stock Inspection Report' },
            ]}
          />

          <div>
            <label className="block text-xs font-semibold text-[#262626] mb-1.5">Capture / Choose Image *</label>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileChange}
              className="w-full text-xs text-[#525252] file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-[#FAF6EB] file:text-[#8B6D1B] hover:file:bg-[#F3E7B3] file:cursor-pointer border border-[#E8E6E1] rounded-xl p-2 bg-[#FAF9F6]"
              required
            />
          </div>

          {previewUrl && (
            <div className="rounded-xl border border-[#E8E6E1] overflow-hidden aspect-16/9 max-h-48 bg-[#FAF9F6] flex items-center justify-center">
              <img src={previewUrl} alt="Preview" className="h-full w-full object-contain" />
            </div>
          )}

          <Input
            label="Remarks / Notes (Optional)"
            value={uploadNotes}
            onChange={(e) => setUploadNotes(e.target.value)}
            placeholder="e.g. End of day counter reconciliation"
          />
        </form>
      </Modal>

      {/* Modal: Add Attire Record */}
      <Modal
        isOpen={showAddAttireModal}
        onClose={() => setShowAddAttireModal(false)}
        title="Log Grooming & Attire Check"
        subtitle={`Verify showroom uniform & grooming for ${employee.full_name}`}
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setShowAddAttireModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleAddAttire} isLoading={submittingAction}>
              Save Attire Record
            </Button>
          </>
        }
      >
        <form onSubmit={handleAddAttire} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Inspection Date"
              type="date"
              value={attireDate}
              onChange={(e) => setAttireDate(e.target.value)}
            />
            <Select
              label="Attire Status *"
              value={attireStatus}
              onChange={(e) => setAttireStatus(e.target.value)}
              options={[
                { value: 'Proper', label: 'Proper (Full Uniform & Badge)' },
                { value: 'Not Proper', label: 'Not Proper (Improper Grooming)' },
                { value: 'Needs Attention', label: 'Needs Attention' },
              ]}
            />
          </div>
          <Input
            label="Manager Feedback / Notes"
            value={attireNotes}
            onChange={(e) => setAttireNotes(e.target.value)}
            placeholder="e.g. Clean badge and uniform verified"
          />
        </form>
      </Modal>

      {/* Outdoor Modal: Add Target Area */}
      <Modal
        isOpen={showAddAreaModal}
        onClose={() => setShowAddAreaModal(false)}
        title="Assign Target Area / Zone"
        subtitle={`Assign field marketing locality to ${employee.full_name}`}
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setShowAddAreaModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleAddTargetArea} isLoading={submittingAction}>
              Assign Area
            </Button>
          </>
        }
      >
        <form onSubmit={handleAddTargetArea} className="space-y-4">
          <Input
            label="Area / Zone Name *"
            value={newAreaForm.area_name}
            onChange={(e) => setNewAreaForm({ ...newAreaForm, area_name: e.target.value })}
            placeholder="e.g. Sahakara Nagar / Main Market"
            required
            autoFocus
          />
          <Input
            label="Specific Location / Landmark"
            value={newAreaForm.location}
            onChange={(e) => setNewAreaForm({ ...newAreaForm, location: e.target.value })}
            placeholder="e.g. Near Bus Stand & Commercial Complex"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Campaign Date"
              type="date"
              value={newAreaForm.activity_date}
              onChange={(e) => setNewAreaForm({ ...newAreaForm, activity_date: e.target.value })}
            />
            <Select
              label="Status"
              value={newAreaForm.status}
              onChange={(e) => setNewAreaForm({ ...newAreaForm, status: e.target.value as any })}
              options={[
                { value: 'Planned', label: 'Planned' },
                { value: 'Active', label: 'Active Campaign' },
                { value: 'Completed', label: 'Completed' },
              ]}
            />
          </div>
          <Input
            label="Campaign Objectives / Notes"
            value={newAreaForm.notes}
            onChange={(e) => setNewAreaForm({ ...newAreaForm, notes: e.target.value })}
            placeholder="e.g. Leaflet distribution and scheme enrollment counter"
          />
        </form>
      </Modal>

      {/* Outdoor Modal: Add Customer Lead */}
      <Modal
        isOpen={showAddOutdoorCustModal}
        onClose={() => setShowAddOutdoorCustModal(false)}
        title="Record Outdoor Customer Lead"
        subtitle={`Record prospective customer contacted by ${employee.full_name}`}
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setShowAddOutdoorCustModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleAddOutdoorCustomer} isLoading={submittingAction}>
              Save Lead
            </Button>
          </>
        }
      >
        <form onSubmit={handleAddOutdoorCustomer} className="space-y-4">
          <Input
            label="Customer Name *"
            value={newOutdoorCustForm.customer_name}
            onChange={(e) => setNewOutdoorCustForm({ ...newOutdoorCustForm, customer_name: e.target.value })}
            placeholder="e.g. Srinivas Rao"
            required
            autoFocus
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Phone Number"
              type="tel"
              value={newOutdoorCustForm.phone}
              onChange={(e) => setNewOutdoorCustForm({ ...newOutdoorCustForm, phone: e.target.value })}
              placeholder="e.g. 9845112233"
            />
            <Input
              label="Campaign Area"
              value={newOutdoorCustForm.area_name}
              onChange={(e) => setNewOutdoorCustForm({ ...newOutdoorCustForm, area_name: e.target.value })}
              placeholder="e.g. Kolar Town Centre"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Interested Scheme"
              value={newOutdoorCustForm.scheme_name}
              onChange={(e) => setNewOutdoorCustForm({ ...newOutdoorCustForm, scheme_name: e.target.value })}
              placeholder="e.g. Gold Scheme Plan A"
            />
            <Select
              label="Lead Status"
              value={newOutdoorCustForm.status}
              onChange={(e) => setNewOutdoorCustForm({ ...newOutdoorCustForm, status: e.target.value as any })}
              options={[
                { value: 'Lead', label: 'New Lead' },
                { value: 'Interested', label: 'Interested / Visit Promised' },
                { value: 'Closed', label: 'Closed / Enrolled' },
                { value: 'Lost', label: 'Lost / Declined' },
              ]}
            />
          </div>
          <Input
            label="Notes / Customer Requirements"
            value={newOutdoorCustForm.notes}
            onChange={(e) => setNewOutdoorCustForm({ ...newOutdoorCustForm, notes: e.target.value })}
            placeholder="e.g. Interested in gold coin scheme for Diwali"
          />
        </form>
      </Modal>

      {/* Outdoor Modal: Add Promoted Scheme */}
      <Modal
        isOpen={showAddOutdoorSchemeModal}
        onClose={() => setShowAddOutdoorSchemeModal(false)}
        title="Log Promoted Scheme Campaign"
        subtitle={`Log jewelry scheme promoted in the field by ${employee.full_name}`}
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setShowAddOutdoorSchemeModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleAddOutdoorScheme} isLoading={submittingAction}>
              Save Promoted Scheme
            </Button>
          </>
        }
      >
        <form onSubmit={handleAddOutdoorScheme} className="space-y-4">
          <Input
            label="Scheme Plan Name *"
            value={newOutdoorSchemeForm.scheme_name}
            onChange={(e) => setNewOutdoorSchemeForm({ ...newOutdoorSchemeForm, scheme_name: e.target.value })}
            placeholder="e.g. Siri Dhanavruddhi 11-Month Gold Scheme"
            required
            autoFocus
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Promotion Area / Location *"
              value={newOutdoorSchemeForm.area}
              onChange={(e) => setNewOutdoorSchemeForm({ ...newOutdoorSchemeForm, area: e.target.value })}
              placeholder="e.g. Yelahanka Old Town"
              required
            />
            <Input
              label="Date"
              type="date"
              value={newOutdoorSchemeForm.date}
              onChange={(e) => setNewOutdoorSchemeForm({ ...newOutdoorSchemeForm, date: e.target.value })}
            />
          </div>
          <Input
            label="Description / Target Benefits"
            value={newOutdoorSchemeForm.description}
            onChange={(e) => setNewOutdoorSchemeForm({ ...newOutdoorSchemeForm, description: e.target.value })}
            placeholder="e.g. Zero making charges on maturity"
          />
          <Input
            label="Campaign Remarks"
            value={newOutdoorSchemeForm.notes}
            onChange={(e) => setNewOutdoorSchemeForm({ ...newOutdoorSchemeForm, notes: e.target.value })}
            placeholder="e.g. Distributed 150 brochures"
          />
        </form>
      </Modal>

      {/* Image Preview Modal */}
      {viewImageModalUrl && (
        <div
          className="fixed inset-0 z-50 bg-[#1C1C1A]/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setViewImageModalUrl(null)}
        >
          <div className="relative max-w-3xl max-h-[90vh] bg-white rounded-2xl overflow-hidden shadow-2xl p-2 border border-[#E6E2D8]" onClick={(e) => e.stopPropagation()}>
            <img src={viewImageModalUrl} alt="Full size" className="max-h-[80vh] w-auto mx-auto object-contain rounded-xl" />
            <div className="p-3 text-right">
              <Button variant="outline" size="sm" onClick={() => setViewImageModalUrl(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {employee && (
        <EmployeeFormModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSuccess={() => {
            fetchEmployeeData();
            fetchTabContent();
          }}
          employeeToEdit={employee}
        />
      )}
    </div>
  );
};
