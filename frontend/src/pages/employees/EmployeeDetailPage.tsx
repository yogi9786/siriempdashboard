import React, { useEffect, useState, useMemo } from 'react';
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
  MapPin,
  Award,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Gift,
  Heart,
  IndianRupee,
  ArrowUpDown,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Filter,
  Search,
  X,
  RotateCcw,
  MessageSquare,
  MessageSquareHeart,
  MessageSquarePlus,
  Sparkles,
  PhoneCall,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { EmptyState } from '../../components/ui/EmptyState';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { useToast } from '../../context/ToastContext';
import { EmployeeFormModal } from './EmployeeFormModal';
import { CustomerActivityModal } from '../../components/customers/CustomerActivityModal';
import { parseCustomerBreakdown } from '../../utils/customerUtils';
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
  CustomerFeedback,
  EmployeeCallLog,
} from '../../types';
import api from '../../api/client';
import { getMediaUrl } from '../../utils/media';
import { SCHEMES, DEFAULT_SCHEME } from '../../constants/schemes';

export const EmployeeDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();

  const [employee, setEmployee] = useState<EmployeeDetail | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>('customers');
  const [showEditModal, setShowEditModal] = useState<boolean>(false);

  // 1. Customer Activity State & Modal Handlers
  const [customerActivities, setCustomerActivities] = useState<CustomerActivity[]>([]);
  const [showCustomerModal, setShowCustomerModal] = useState<boolean>(false);
  const [editingCustomerActivity, setEditingCustomerActivity] = useState<CustomerActivity | null>(null);

  // Filter States for Customer Activity & Lists
  const [datePreset, setDatePreset] = useState<string>('all');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchFilter, setSearchFilter] = useState<string>('');

  // Customer Feedback State & Modals
  const [customerFeedbacks, setCustomerFeedbacks] = useState<CustomerFeedback[]>([]);
  const [showFeedbackModal, setShowFeedbackModal] = useState<boolean>(false);
  const [editingFeedback, setEditingFeedback] = useState<CustomerFeedback | null>(null);
  const [feedbackForm, setFeedbackForm] = useState({
    customer_name: '',
    customer_phone: '',
    feedback_date: new Date().toISOString().split('T')[0],
    rating: 5,
    category: 'Customer Service',
    feedback_text: '',
    notes: '',
    status: 'Verified',
  });

  const openAddCustomerModal = () => {
    setEditingCustomerActivity(null);
    setShowCustomerModal(true);
  };

  const openEditCustomerModal = (act: CustomerActivity) => {
    setEditingCustomerActivity(act);
    setShowCustomerModal(true);
  };

  // 2. Schemes List & Modal State
  const [schemes, setSchemes] = useState<SchemeRecord[]>([]);
  const [showAddSchemeModal, setShowAddSchemeModal] = useState<boolean>(false);
  const [schemeName, setSchemeName] = useState<string>(DEFAULT_SCHEME);
  const [schemeCustomersCount, setSchemeCustomersCount] = useState<number>(1);
  const [schemeAmount, setSchemeAmount] = useState<string>('');
  const [schemeDate, setSchemeDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [schemeNotes, setSchemeNotes] = useState<string>('');

  const [editingScheme, setEditingScheme] = useState<SchemeRecord | null>(null);
  const [showEditSchemeModal, setShowEditSchemeModal] = useState<boolean>(false);

  const openEditSchemeModal = (sch: SchemeRecord) => {
    setEditingScheme(sch);
    setSchemeName(sch.scheme_name);
    setSchemeCustomersCount(sch.customers_count || 1);
    setSchemeAmount(sch.amount ? sch.amount.toString() : '');
    setSchemeDate(sch.record_date);
    setSchemeNotes(sch.notes || '');
    setShowEditSchemeModal(true);
  };

  // 3. Google Reviews List & Modal State
  const [googleReviews, setGoogleReviews] = useState<GoogleReview[]>([]);
  const [showAddReviewModal, setShowAddReviewModal] = useState<boolean>(false);
  const [newReviewForm, setNewReviewForm] = useState({
    customers_count: 1,
    rating: 5,
    review_date: new Date().toISOString().split('T')[0],
    review_text: '',
    notes: '',
  });

  const [editingReview, setEditingReview] = useState<GoogleReview | null>(null);
  const [showEditReviewModal, setShowEditReviewModal] = useState<boolean>(false);

  const openEditReviewModal = (rev: GoogleReview) => {
    setEditingReview(rev);
    setNewReviewForm({
      customers_count: rev.customers_count || 1,
      rating: rev.rating,
      review_date: rev.review_date,
      review_text: rev.review_text,
      notes: rev.notes || '',
    });
    setShowEditReviewModal(true);
  };

  // 4. Form Media List & Modal State
  const [formMediaList, setFormMediaList] = useState<FormMedia[]>([]);
  const [showUploadFormModal, setShowUploadFormModal] = useState<boolean>(false);
  const [uploadFormType, setUploadFormType] = useState<string>('Daily Submission Form');
  const [uploadNotes, setUploadNotes] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [viewImageModalUrl, setViewImageModalUrl] = useState<string | null>(null);

  const [editingFormMedia, setEditingFormMedia] = useState<FormMedia | null>(null);
  const [showEditFormMediaModal, setShowEditFormMediaModal] = useState<boolean>(false);

  const openEditFormMediaModal = (m: FormMedia) => {
    setEditingFormMedia(m);
    setUploadFormType(m.form_type);
    setUploadNotes(m.notes || '');
    setShowEditFormMediaModal(true);
  };

  // Delete Dialog State
  const [deleteTarget, setDeleteTarget] = useState<{
    type: 'customer' | 'scheme' | 'review' | 'form' | 'attire' | 'feedback' | 'call';
    id: number;
    title: string;
  } | null>(null);
  const [isDeletingTarget, setIsDeletingTarget] = useState<boolean>(false);

  // Attire List & Modal State
  const [attireList, setAttireList] = useState<AttireRecord[]>([]);
  const [showAddAttireModal, setShowAddAttireModal] = useState<boolean>(false);
  const [attireStatus, setAttireStatus] = useState<string>('Proper');
  const [attireDate, setAttireDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [attireNotes, setAttireNotes] = useState<string>('');

  // Customer Calls (Calls Done & Pending) State & Modals
  const [callsList, setCallsList] = useState<EmployeeCallLog[]>([]);
  const [showCallModal, setShowCallModal] = useState<boolean>(false);
  const [editingCall, setEditingCall] = useState<EmployeeCallLog | null>(null);
  const [callForm, setCallForm] = useState<{
    customer_name: string;
    phone_number: string;
    customers_count: number;
    call_status: 'Done' | 'Pending';
    call_date: string;
    call_time: string;
    purpose: string;
    notes: string;
  }>({
    customer_name: '',
    phone_number: '',
    customers_count: 1,
    call_status: 'Done',
    call_date: new Date().toISOString().split('T')[0],
    call_time: '',
    purpose: 'Gold Scheme Follow-up',
    notes: '',
  });

  const [callSearchTerm, setCallSearchTerm] = useState<string>('');
  const [callStatusFilter, setCallStatusFilter] = useState<string>('all');
  const [callDatePreset, setCallDatePreset] = useState<string>('all');

  const fetchCalls = async () => {
    if (!id) return;
    try {
      const res = await api.get<EmployeeCallLog[]>(`/api/v1/employees/${id}/calls`);
      setCallsList(res.data);
    } catch (err) {
      console.error('Failed to load employee calls:', err);
    }
  };

  const openAddCallModal = () => {
    setEditingCall(null);
    setCallForm({
      customer_name: '',
      phone_number: '',
      customers_count: 1,
      call_status: 'Done',
      call_date: new Date().toISOString().split('T')[0],
      call_time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      purpose: 'Gold Scheme Follow-up',
      notes: '',
    });
    setShowCallModal(true);
  };

  const openEditCallModal = (call: EmployeeCallLog) => {
    setEditingCall(call);
    setCallForm({
      customer_name: call.customer_name,
      phone_number: call.phone_number,
      customers_count: call.customers_count || 1,
      call_status: (call.call_status as 'Done' | 'Pending') || 'Done',
      call_date: call.call_date || new Date().toISOString().split('T')[0],
      call_time: call.call_time || '',
      purpose: call.purpose || 'Gold Scheme Follow-up',
      notes: call.notes || '',
    });
    setShowCallModal(true);
  };

  const handleSaveCall = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    if (!callForm.customer_name.trim()) {
      toastError('Please enter the customer name.');
      return;
    }
    if (!callForm.phone_number.trim()) {
      toastError('Please enter the customer phone number.');
      return;
    }

    try {
      setSubmittingAction(true);
      if (editingCall) {
        await api.put(`/api/v1/employees/${id}/calls/${editingCall.id}`, callForm);
        success('Customer call record updated.');
      } else {
        await api.post(`/api/v1/employees/${id}/calls`, callForm);
        success(`Customer call logged for ${callForm.customer_name}.`);
      }
      setShowCallModal(false);
      setEditingCall(null);
      fetchCalls();
      fetchEmployeeData();
    } catch (err: any) {
      console.error('Save call failed:', err);
      toastError(err.response?.data?.detail || 'Failed to save customer call.');
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleToggleCallStatus = async (call: EmployeeCallLog) => {
    if (!id) return;
    try {
      const newStatus = call.call_status === 'Done' ? 'Pending' : 'Done';
      setCallsList((prev) =>
        prev.map((c) => (c.id === call.id ? { ...c, call_status: newStatus } : c))
      );
      await api.patch(`/api/v1/employees/${id}/calls/${call.id}/toggle`);
      success(`Call marked as ${newStatus}.`);
      fetchEmployeeData();
    } catch (err: any) {
      toastError(err.response?.data?.detail || 'Failed to toggle call status.');
      fetchCalls();
    }
  };

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
  const [newOutdoorSchemeForm, setNewOutdoorSchemeForm] = useState<{
    scheme_name: string;
    area: string;
    description: string;
    date: string;
    notes: string;
  }>({
    scheme_name: DEFAULT_SCHEME,
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
      fetchCalls();
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
      } else if (activeTab === 'calls') {
        fetchCalls();
      } else if (activeTab === 'schemes') {
        const res = await api.get<SchemeRecord[]>('/api/v1/schemes', { params: { employee_id: id } });
        setSchemes(res.data);
      } else if (activeTab === 'reviews') {
        const res = await api.get<GoogleReview[]>('/api/v1/google-reviews', { params: { employee_id: id } });
        setGoogleReviews(res.data);
      } else if (activeTab === 'customer_feedback') {
        const res = await api.get<CustomerFeedback[]>('/api/v1/feedback', { params: { employee_id: id } });
        setCustomerFeedbacks(res.data);
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
      console.error('Failed to load sub-tab data:', err);
    }
  };

  const fetchEmployeeFeedbacks = async () => {
    if (!id) return;
    try {
      const res = await api.get<CustomerFeedback[]>('/api/v1/feedback', { params: { employee_id: id } });
      setCustomerFeedbacks(res.data);
    } catch (err) {
      console.error('Failed to load employee direct feedback:', err);
    }
  };

  useEffect(() => {
    fetchEmployeeData();
    fetchEmployeeFeedbacks();
    fetchCalls();
  }, [id]);

  useEffect(() => {
    fetchTabContent();
  }, [id, activeTab]);

  // Date Filter Preset Handler
  const handleDatePreset = (preset: string) => {
    setDatePreset(preset);
    const today = new Date();
    const formatYMD = (d: Date) => d.toISOString().split('T')[0];

    if (preset === 'all') {
      setFromDate('');
      setToDate('');
    } else if (preset === 'today') {
      const todayStr = formatYMD(today);
      setFromDate(todayStr);
      setToDate(todayStr);
    } else if (preset === 'yesterday') {
      const yest = new Date(today);
      yest.setDate(yest.getDate() - 1);
      const yestStr = formatYMD(yest);
      setFromDate(yestStr);
      setToDate(yestStr);
    } else if (preset === 'this_week') {
      const d = new Date(today);
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(d.setDate(diff));
      setFromDate(formatYMD(monday));
      setToDate(formatYMD(today));
    } else if (preset === 'this_month') {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      setFromDate(formatYMD(firstDay));
      setToDate(formatYMD(today));
    }
  };

  const clearAllFilters = () => {
    setDatePreset('all');
    setFromDate('');
    setToDate('');
    setStatusFilter('all');
    setSearchFilter('');
  };

  // Filtered Customer Activities (reactive with search, date presets, and status filter)
  const filteredCustomerActivities = useMemo(() => {
    return customerActivities.filter((act) => {
      // 1. Status Filter
      if (statusFilter !== 'all') {
        const actStatus = (act.status || '').toLowerCase();
        const target = statusFilter.toLowerCase();
        if (target === 'in hold / follow up') {
          if (!actStatus.includes('hold') && !actStatus.includes('follow')) return false;
        } else if (actStatus !== target) {
          return false;
        }
      }

      // 2. Date Range Filter
      if (fromDate && act.activity_date < fromDate) return false;
      if (toDate && act.activity_date > toDate) return false;

      // 3. Search Query Filter
      if (searchFilter.trim()) {
        const q = searchFilter.toLowerCase().trim();
        const matchName = (act.customer_name || '').toLowerCase().includes(q);
        const matchPhone = (act.phone_number || '').includes(q);
        const matchNotes = (act.notes || '').toLowerCase().includes(q);
        const matchStatus = (act.status || '').toLowerCase().includes(q);
        if (!matchName && !matchPhone && !matchNotes && !matchStatus) return false;
      }

      return true;
    });
  }, [customerActivities, statusFilter, fromDate, toDate, searchFilter]);

  // Aggregated Schemes Closed Count (from customer activity breakdowns, scheme records & employee stat)
  const totalSchemesClosedCount = useMemo(() => {
    let count = 0;
    customerActivities.forEach((act) => {
      const items = parseCustomerBreakdown(act.breakdown, act.customers_count || 1);
      items.forEach((item) => {
        if (item.has_scheme || item.scheme_name) count++;
      });
    });
    return Math.max(count, employee?.schemes_closed_count || 0, schemes.length);
  }, [customerActivities, employee?.schemes_closed_count, schemes.length]);

  // Aggregated Google Reviews Count
  const totalGoogleReviewsCount = useMemo(() => {
    let count = 0;
    customerActivities.forEach((act) => {
      const items = parseCustomerBreakdown(act.breakdown, act.customers_count || 1);
      items.forEach((item) => {
        if (item.has_google_review || item.google_review_text) count++;
      });
    });
    return Math.max(count, employee?.google_reviews_count || 0, googleReviews.length);
  }, [customerActivities, employee?.google_reviews_count, googleReviews.length]);

  // Aggregated Customer Feedback Count
  const totalCustomerFeedbackCount = useMemo(() => {
    let count = 0;
    customerActivities.forEach((act) => {
      const items = parseCustomerBreakdown(act.breakdown, act.customers_count || 1);
      items.forEach((item) => {
        if (item.has_customer_feedback || item.feedback_text) count++;
      });
    });
    return Math.max(count, employee?.customer_feedbacks_count || 0, customerFeedbacks.length);
  }, [customerActivities, employee?.customer_feedbacks_count, customerFeedbacks.length]);

  // Average Direct Feedback Rating
  const feedbackAvgRating = useMemo(() => {
    if (customerFeedbacks.length === 0) return 5.0;
    const total = customerFeedbacks.reduce((sum, f) => sum + f.rating, 0);
    return Math.round((total / customerFeedbacks.length) * 10) / 10;
  }, [customerFeedbacks]);

  // Customer Calls (Calls Done & Pending) Computed Filters & Stats
  const filteredCalls = useMemo(() => {
    return callsList.filter((call) => {
      const matchesSearch =
        callSearchTerm.trim() === '' ||
        call.customer_name.toLowerCase().includes(callSearchTerm.toLowerCase()) ||
        call.phone_number.includes(callSearchTerm) ||
        (call.notes && call.notes.toLowerCase().includes(callSearchTerm.toLowerCase())) ||
        (call.purpose && call.purpose.toLowerCase().includes(callSearchTerm.toLowerCase()));

      const matchesStatus =
        callStatusFilter === 'all' ||
        call.call_status.toLowerCase() === callStatusFilter.toLowerCase();

      let matchesDate = true;
      if (callDatePreset !== 'all' && call.call_date) {
        const todayStr = new Date().toISOString().split('T')[0];
        const callD = new Date(call.call_date);
        const todayD = new Date();

        if (callDatePreset === 'today') {
          matchesDate = call.call_date === todayStr;
        } else if (callDatePreset === 'yesterday') {
          const yest = new Date();
          yest.setDate(yest.getDate() - 1);
          matchesDate = call.call_date === yest.toISOString().split('T')[0];
        } else if (callDatePreset === 'this_week') {
          const diffDays = (todayD.getTime() - callD.getTime()) / (1000 * 3600 * 24);
          matchesDate = diffDays >= 0 && diffDays <= 7;
        } else if (callDatePreset === 'this_month') {
          matchesDate =
            callD.getMonth() === todayD.getMonth() &&
            callD.getFullYear() === todayD.getFullYear();
        }
      }

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [callsList, callSearchTerm, callStatusFilter, callDatePreset]);

  const callsDoneCount = useMemo(() => callsList.filter((c) => c.call_status === 'Done').length, [callsList]);
  const callsPendingCount = useMemo(() => callsList.filter((c) => c.call_status === 'Pending').length, [callsList]);
  const totalCallsCount = callsList.length;
  const totalCustomersCalled = useMemo(() => callsList.reduce((acc, c) => acc + (c.customers_count || 1), 0), [callsList]);
  const callCompletionRate = totalCallsCount > 0 ? Math.round((callsDoneCount / totalCallsCount) * 100) : 0;


  // Customer Feedback Modal Handlers
  const openAddFeedbackForCustomer = (act: CustomerActivity) => {
    setEditingFeedback(null);
    setFeedbackForm({
      customer_name: act.customer_name || '',
      customer_phone: act.phone_number || '',
      feedback_date: act.activity_date || new Date().toISOString().split('T')[0],
      rating: 5,
      category: 'Customer Service',
      feedback_text: '',
      notes: act.notes ? `Interaction Notes: ${act.notes}` : '',
      status: 'Verified',
    });
    setShowFeedbackModal(true);
  };

  const openAddFeedbackModal = () => {
    setEditingFeedback(null);
    setFeedbackForm({
      customer_name: '',
      customer_phone: '',
      feedback_date: new Date().toISOString().split('T')[0],
      rating: 5,
      category: 'Customer Service',
      feedback_text: '',
      notes: '',
      status: 'Verified',
    });
    setShowFeedbackModal(true);
  };

  const openEditFeedbackModal = (fb: CustomerFeedback) => {
    setEditingFeedback(fb);
    setFeedbackForm({
      customer_name: fb.customer_name,
      customer_phone: fb.customer_phone || '',
      feedback_date: fb.feedback_date,
      rating: fb.rating,
      category: fb.category,
      feedback_text: fb.feedback_text,
      notes: fb.notes || '',
      status: fb.status || 'Verified',
    });
    setShowFeedbackModal(true);
  };

  const handleSaveFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !feedbackForm.customer_name.trim() || !feedbackForm.feedback_text.trim()) {
      toastError('Please provide Customer Name and Feedback statement.');
      return;
    }

    setSubmittingAction(true);
    try {
      if (editingFeedback) {
        await api.put(`/api/v1/feedback/${editingFeedback.id}`, {
          customer_name: feedbackForm.customer_name.trim(),
          customer_phone: feedbackForm.customer_phone.trim() || undefined,
          feedback_date: feedbackForm.feedback_date,
          rating: feedbackForm.rating,
          category: feedbackForm.category,
          feedback_text: feedbackForm.feedback_text.trim(),
          notes: feedbackForm.notes.trim() || undefined,
          status: feedbackForm.status,
        });
        success('Customer feedback updated successfully!');
      } else {
        await api.post('/api/v1/feedback', {
          employee_id: parseInt(id),
          customer_name: feedbackForm.customer_name.trim(),
          customer_phone: feedbackForm.customer_phone.trim() || undefined,
          feedback_date: feedbackForm.feedback_date,
          rating: feedbackForm.rating,
          category: feedbackForm.category,
          feedback_text: feedbackForm.feedback_text.trim(),
          notes: feedbackForm.notes.trim() || undefined,
          status: feedbackForm.status,
        });
        success(`Customer review & feedback recorded for ${feedbackForm.customer_name}!`);
      }
      setShowFeedbackModal(false);
      setEditingFeedback(null);
      fetchEmployeeFeedbacks();
      fetchEmployeeData();
      fetchTabContent();
    } catch (err: any) {
      toastError(err.response?.data?.detail || 'Failed to save customer feedback.');
    } finally {
      setSubmittingAction(false);
    }
  };

  // Handler: Add Scheme Record
  const handleAddScheme = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !schemeName.trim()) {
      toastError('Please specify the scheme plan name.');
      return;
    }

    setSubmittingAction(true);
    try {
      await api.post('/api/v1/schemes', {
        employee_id: parseInt(id),
        scheme_name: schemeName.trim(),
        customers_count: schemeCustomersCount,
        customer_name: `Scheme Enrollment (${schemeCustomersCount})`,
        amount: parseFloat(schemeAmount) || 0,
        record_date: schemeDate,
        notes: schemeNotes.trim() || null,
      });

      success('Scheme enrollment record saved.');
      setShowAddSchemeModal(false);
      setSchemeName('Siri Samruddhi Gold Monthly Scheme');
      setSchemeCustomersCount(1);
      setSchemeAmount('');
      setSchemeNotes('');
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
    if (!id || !newReviewForm.review_text.trim()) {
      toastError('Please enter the customer review details.');
      return;
    }

    setSubmittingAction(true);
    try {
      const count = newReviewForm.customers_count || 1;
      await api.post('/api/v1/google-reviews', {
        employee_id: parseInt(id),
        customers_count: count,
        customer_name: `Google Review (${count} Customer${count > 1 ? 's' : ''})`,
        rating: newReviewForm.rating,
        review_date: newReviewForm.review_date,
        review_text: newReviewForm.review_text.trim(),
        status: 'Published',
        notes: newReviewForm.notes.trim() || null,
      });

      success('Google review recorded for employee.');
      setShowAddReviewModal(false);
      setNewReviewForm({
        customers_count: 1,
        rating: 5,
        review_date: new Date().toISOString().split('T')[0],
        review_text: '',
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

  // Handler: Upload Form Media Photo (1 image, max 2.5 MB)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const maxBytes = 2.5 * 1024 * 1024; // 2.5 MB
      if (file.size > maxBytes) {
        toastError('Image size exceeds 2.5 MB limit. Please select or capture a photo under 2.5 MB.');
        e.target.value = '';
        setSelectedFile(null);
        setPreviewUrl(null);
        return;
      }
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

    const maxBytes = 2.5 * 1024 * 1024;
    if (selectedFile.size > maxBytes) {
      toastError('File size exceeds 2.5 MB limit. Please choose a smaller photo.');
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
        scheme_name: DEFAULT_SCHEME,
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

  // Handler: Update Scheme Record (PATCH / PUT)
  const handleUpdateScheme = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingScheme || !schemeName.trim()) return;
    setSubmittingAction(true);
    try {
      await api.patch(`/api/v1/schemes/${editingScheme.id}`, {
        scheme_name: schemeName.trim(),
        customers_count: schemeCustomersCount,
        customer_name: `Scheme Enrollment (${schemeCustomersCount})`,
        amount: parseFloat(schemeAmount) || 0,
        record_date: schemeDate,
        notes: schemeNotes.trim() || null,
      });

      success('Scheme enrollment updated successfully.');
      setShowEditSchemeModal(false);
      setEditingScheme(null);
      fetchEmployeeData();
      fetchTabContent();
    } catch (err: any) {
      toastError(err.response?.data?.detail || 'Failed to update scheme record.');
    } finally {
      setSubmittingAction(false);
    }
  };

  // Handler: Update Google Review (PATCH / PUT)
  const handleUpdateGoogleReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReview || !newReviewForm.review_text.trim()) return;
    setSubmittingAction(true);
    try {
      const count = newReviewForm.customers_count || 1;
      await api.patch(`/api/v1/google-reviews/${editingReview.id}`, {
        customers_count: count,
        customer_name: `Google Review (${count} Customer${count > 1 ? 's' : ''})`,
        rating: newReviewForm.rating,
        review_date: newReviewForm.review_date,
        review_text: newReviewForm.review_text.trim(),
        notes: newReviewForm.notes.trim() || null,
      });

      success('Google review updated successfully.');
      setShowEditReviewModal(false);
      setEditingReview(null);
      fetchEmployeeData();
      fetchTabContent();
    } catch (err: any) {
      toastError(err.response?.data?.detail || 'Failed to update Google review.');
    } finally {
      setSubmittingAction(false);
    }
  };

  // Handler: Update Form Media Details (PATCH / PUT)
  const handleUpdateFormMedia = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFormMedia) return;
    setIsUploading(true);
    try {
      await api.patch(`/api/v1/gallery/${editingFormMedia.id}`, {
        form_type: uploadFormType,
        notes: uploadNotes.trim() || null,
      });

      success('Closing form details updated successfully.');
      setShowEditFormMediaModal(false);
      setEditingFormMedia(null);
      fetchEmployeeData();
      fetchTabContent();
    } catch (err: any) {
      toastError(err.response?.data?.detail || 'Failed to update form.');
    } finally {
      setIsUploading(false);
    }
  };

  // Handler: Delete Record (DELETE API)
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeletingTarget(true);
    try {
      if (deleteTarget.type === 'customer') {
        await api.delete(`/api/v1/customers/${deleteTarget.id}`);
        success('Customer activity record deleted.');
      } else if (deleteTarget.type === 'scheme') {
        await api.delete(`/api/v1/schemes/${deleteTarget.id}`);
        success('Scheme record deleted.');
      } else if (deleteTarget.type === 'review') {
        await api.delete(`/api/v1/google-reviews/${deleteTarget.id}`);
        success('Google review deleted.');
      } else if (deleteTarget.type === 'form') {
        await api.delete(`/api/v1/gallery/${deleteTarget.id}`);
        success('Form photo document deleted.');
      } else if (deleteTarget.type === 'feedback') {
        await api.delete(`/api/v1/feedback/${deleteTarget.id}`);
        success('Customer feedback record deleted.');
        fetchEmployeeFeedbacks();
      } else if (deleteTarget.type === 'call') {
        await api.delete(`/api/v1/employees/${id}/calls/${deleteTarget.id}`);
        success('Customer call record deleted.');
        fetchCalls();
      }
      setDeleteTarget(null);
      fetchEmployeeData();
      fetchTabContent();
    } catch (err: any) {
      toastError(err.response?.data?.detail || 'Failed to delete record.');
    } finally {
      setIsDeletingTarget(false);
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
      <div className="bg-linear-to-br from-[#FAF8F3] via-white to-[#F0F4F8] border border-[#C5D5E6] rounded-3xl p-6 sm:p-7 shadow-sm text-[#1D1D1B] flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        {/* Subtle Ambient Shimmer */}
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-linear-to-r from-transparent via-[#536B8A] to-transparent opacity-60 animate-pulse" />

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
              <span className="font-mono text-[10px] sm:text-xs px-2 sm:px-2.5 py-0.5 rounded-md bg-[#EDF2F7] text-[#536B8A] font-bold border border-[#C5D5E6] shadow-2xs whitespace-nowrap inline-flex items-center shrink-0">
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
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
              {totalSchemesClosedCount}
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
              {totalGoogleReviewsCount}
            </div>
            <p className="text-xs text-[#737373] mt-2 font-medium">Positive customer reviews</p>
          </div>

          <div className="bg-white border border-[#C5E3D5] rounded-2xl p-5 shadow-2xs">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-semibold text-[#23815F] uppercase tracking-wider">
                Customer Feedback
              </span>
              <div className="flex items-center gap-0.5 text-amber-500">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                <span className="text-xs font-bold text-[#171717] ml-0.5">
                  {feedbackAvgRating.toFixed(1)}
                </span>
              </div>
            </div>
            <div className="text-2xl font-bold text-[#23815F]">
              {totalCustomerFeedbackCount}
            </div>
            <p className="text-xs text-[#737373] mt-2 font-medium">Showroom direct reviews</p>
          </div>
        </div>
      )}

      {/* =========================================================
          CONTENT RENDERERS FOR EACH SECTION
      ========================================================= */}
      {(() => {
        // Helper: status badge
        const getCustomerStatusBadge = (status: string) => {
          switch (status) {
            case 'Sold':
              return (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#E8F4EE] text-[#21845F] border border-[#C5E3D5]">
                  <CheckCircle2 className="w-3 h-3 text-[#21845F]" />
                  <span>Sold</span>
                </span>
              );
            case 'Exchange':
              return (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]">
                  <ArrowUpDown className="w-3 h-3 text-[#2563EB]" />
                  <span>Exchange</span>
                </span>
              );
            case 'In Hold / Follow Up':
            case 'In Hold':
            case 'Follow Up':
              return (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#FEF3C7] text-[#D97706] border border-[#FDE68A]">
                  <Clock className="w-3 h-3 text-[#D97706]" />
                  <span>In Hold / Follow Up</span>
                </span>
              );
            case 'Lost':
              return (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#FEE2E2] text-[#DC2626] border border-[#FECACA]">
                  <XCircle className="w-3 h-3 text-[#DC2626]" />
                  <span>Lost</span>
                </span>
              );
            case 'Walkin':
            default:
              return (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#F4F4F5] text-[#52525B] border border-[#E4E4E7]">
                  <UserCheck className="w-3 h-3 text-[#71717A]" />
                  <span>Walkin</span>
                </span>
              );
          }
        };

        // Content Renderer: Customer Activity
        const renderCustomersContent = () => (
          <div className="space-y-4">
            {/* Date Filters & All Filter Toolbar */}
            <div className="bg-white border border-[#E8E6E1] rounded-2xl p-4 shadow-2xs space-y-3">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                {/* Quick Date Presets */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs font-bold text-[#737373] mr-1 flex items-center gap-1">
                    <Filter className="w-3.5 h-3.5" />
                    <span>Presets:</span>
                  </span>
                  {[
                    { id: 'all', label: 'All Dates' },
                    { id: 'today', label: 'Today' },
                    { id: 'yesterday', label: 'Yesterday' },
                    { id: 'this_week', label: 'This Week' },
                    { id: 'this_month', label: 'This Month' },
                  ].map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleDatePreset(preset.id)}
                      className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                        datePreset === preset.id
                          ? 'bg-[#536B8A] text-white shadow-2xs'
                          : 'bg-[#F5F4F0] text-[#5E5A52] hover:bg-[#EAE8E1]'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                {/* Search & Actions */}
                <div className="flex items-center gap-2">
                  <div className="relative flex-1 sm:w-64">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#8A8479]" />
                    <input
                      type="text"
                      value={searchFilter}
                      onChange={(e) => setSearchFilter(e.target.value)}
                      placeholder="Search customer, phone, notes..."
                      className="w-full pl-8 pr-3 py-1.5 input-luxury-beige rounded-xl text-xs font-medium"
                    />
                    {searchFilter && (
                      <button
                        type="button"
                        onClick={() => setSearchFilter('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8A8479] hover:text-[#1D1D1B]"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  {(datePreset !== 'all' || fromDate || toDate || statusFilter !== 'all' || searchFilter) && (
                    <button
                      type="button"
                      onClick={clearAllFilters}
                      className="px-2.5 py-1.5 text-xs font-bold text-[#C24141] bg-[#FDECEC] hover:bg-[#FCD8D8] rounded-xl flex items-center gap-1 cursor-pointer transition-colors"
                      title="Reset all filters"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Reset</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Status Filter & Custom Date Range Pickers */}
              <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-[#F0EFEA] text-xs">
                {/* Status All-Filter Option */}
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-[#737373]">Status:</span>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-2.5 py-1 select-luxury-slate rounded-lg text-xs font-bold cursor-pointer"
                  >
                    <option value="all">All Statuses (Show All)</option>
                    <option value="Walkin">Walkin</option>
                    <option value="Sold">Sold</option>
                    <option value="Exchange">Exchange</option>
                    <option value="In Hold / Follow Up">In Hold / Follow Up</option>
                    <option value="Lost">Lost</option>
                  </select>
                </div>

                {/* From Date */}
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-[#737373]">From:</span>
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => {
                      setFromDate(e.target.value);
                      setDatePreset('custom');
                    }}
                    className="px-2.5 py-1 input-luxury-beige rounded-lg text-xs font-medium cursor-pointer"
                  />
                </div>

                {/* To Date */}
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-[#737373]">To:</span>
                  <input
                    type="date"
                    value={toDate}
                    onChange={(e) => {
                      setToDate(e.target.value);
                      setDatePreset('custom');
                    }}
                    className="px-2.5 py-1 input-luxury-beige rounded-lg text-xs font-medium cursor-pointer"
                  />
                </div>

                {/* Live Count */}
                <div className="ml-auto text-[11px] text-[#737373] font-medium">
                  Showing <strong className="text-[#1D1D1B]">{filteredCustomerActivities.length}</strong> of{' '}
                  {customerActivities.length} interactions
                </div>
              </div>
            </div>

            {customerActivities.length === 0 ? (
              <EmptyState
                title="No customer interactions logged."
                description={`Record showroom customer walk-ins, sales, and inquiries attended by ${employee.full_name}.`}
                icon={UserCheck}
                actionText="Log Customer Activity"
                onAction={openAddCustomerModal}
              />
            ) : filteredCustomerActivities.length === 0 ? (
              <div className="p-8 text-center bg-white border border-[#E8E6E1] rounded-2xl space-y-2">
                <Filter className="w-8 h-8 text-[#A3A3A3] mx-auto opacity-50" />
                <h4 className="text-sm font-bold text-[#1D1D1B]">No matching customer activities found</h4>
                <p className="text-xs text-[#737373]">
                  No records match your selected date or status filters.
                </p>
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#EDF2F7] text-[#536B8A] hover:bg-[#E2E8F0] cursor-pointer mt-2"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Clear All Filters</span>
                </button>
              </div>
            ) : (
              <div className="bg-white border border-[#E8E6E1] rounded-2xl overflow-hidden shadow-2xs">
                {/* Mobile Card List */}
                <div className="sm:hidden divide-y divide-[#F0EFEA]">
                  {filteredCustomerActivities.map((act) => {
                    const count = act.customers_count || 1;
                    const customerItems = parseCustomerBreakdown(
                      act.breakdown,
                      count,
                      act.status,
                      act.customer_name,
                      act.phone_number,
                      act.dob,
                      act.anniversary,
                      act.product_value
                    );

                    const existingFb = customerFeedbacks.find(
                      (fb) =>
                        (fb.customer_phone && act.phone_number && fb.customer_phone === act.phone_number) ||
                        (fb.customer_name && act.customer_name && fb.customer_name.toLowerCase() === act.customer_name.toLowerCase())
                    );

                    return (
                      <div key={act.id} className="p-3.5 space-y-2.5 bg-white">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-[#171717] flex items-center gap-1.5">
                            <span>{act.customer_name || 'Walk-in Customer'}</span>
                            {count > 1 && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-[#FAF5FF] text-[#7E22CE] border border-[#D8B4FE] font-bold">
                                {count} Cust
                              </span>
                            )}
                          </span>
                          <div className="flex items-center gap-1">
                            {getCustomerStatusBadge(act.status)}
                            <button
                              type="button"
                              onClick={() => openEditCustomerModal(act)}
                              className="p-1 text-[#737373] hover:text-[#536B8A] hover:bg-[#F0F4F8] rounded-md transition-colors"
                              title="Edit Activity"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteTarget({ type: 'customer', id: act.id, title: `${act.activity_date} (${count} Customers)` })}
                              className="p-1 text-[#A3A3A3] hover:text-[#C24141] hover:bg-[#FDECEC] rounded-md transition-colors"
                              title="Delete Activity"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {act.phone_number && (
                          <p className="text-[11px] text-[#737373] font-mono flex items-center gap-1">
                            <Phone className="w-3 h-3 text-[#8A8479]" />
                            <span>{act.phone_number}</span>
                          </p>
                        )}

                        <div className="flex items-center gap-3 text-[11px] text-[#737373] flex-wrap">
                          {act.dob && (
                            <span className="text-[#D97706] flex items-center gap-1">
                              <Gift className="w-3 h-3" /> DOB: {act.dob}
                            </span>
                          )}
                          {act.anniversary && (
                            <span className="text-[#E11D48] flex items-center gap-1">
                              <Heart className="w-3 h-3" /> Anniv: {act.anniversary}
                            </span>
                          )}
                          {act.product_value && act.product_value > 0 ? (
                            <span className="text-[#21845F] font-bold font-mono">
                              ₹{act.product_value.toLocaleString('en-IN')}
                            </span>
                          ) : null}
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-[#737373]">
                          <span>Date: {act.activity_date}</span>
                        </div>

                        {act.notes && (
                          <p className="text-[11px] text-[#525252] bg-[#FAF9F6] p-2 rounded-lg">
                            <strong className="text-[#171717]">Notes:</strong> {act.notes}
                          </p>
                        )}

                        {/* Scheme Closed on Mobile Card */}
                        {customerItems.some((i) => i.has_scheme || i.scheme_name) && (
                          <div className="flex items-center gap-1.5 flex-wrap pt-1">
                            <span className="text-[10px] font-bold uppercase text-[#8A8479]">Schemes:</span>
                            {customerItems
                              .filter((i) => i.has_scheme || i.scheme_name)
                              .map((s, idx) => (
                                <span
                                  key={idx}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]"
                                >
                                  <Award className="w-3 h-3 text-[#D97706]" />
                                  <span>
                                    {s.scheme_name || 'Scheme Closed'}
                                    {s.scheme_amount ? ` (₹${Number(s.scheme_amount).toLocaleString('en-IN')})` : ''}
                                  </span>
                                </span>
                              ))}
                          </div>
                        )}

                        {/* Google Reviews on Mobile Card */}
                        {customerItems.some((i) => i.has_google_review || i.google_review_text) && (
                          <div className="flex items-center gap-1.5 flex-wrap pt-1">
                            <span className="text-[10px] font-bold uppercase text-[#8A8479]">Google Reviews:</span>
                            {customerItems
                              .filter((i) => i.has_google_review || i.google_review_text)
                              .map((r, idx) => (
                                <span
                                  key={idx}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#EFF6FF] text-[#1E40AF] border border-[#BFDBFE]"
                                  title={r.google_review_text || undefined}
                                >
                                  <Star className="w-3 h-3 fill-[#F59E0B] text-[#F59E0B]" />
                                  <span>{r.google_review_rating || 5}★ Review</span>
                                </span>
                              ))}
                          </div>
                        )}

                        {/* Customer Feedback Action on Mobile Card */}
                        <div className="flex items-center justify-between pt-2 border-t border-[#F0EFEA]">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#8A8479]">
                            Customer Feedback:
                          </span>
                          {customerItems.some((i) => i.has_customer_feedback || i.feedback_text) ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-[#DCFCE7] text-[#166534] border border-[#86EFAC]">
                              <MessageSquareHeart className="w-3.5 h-3.5 text-[#166534]" />
                              <span>
                                {customerItems.find((i) => i.has_customer_feedback || i.feedback_text)?.feedback_rating || 5}★ Feedback
                              </span>
                            </span>
                          ) : existingFb ? (
                            <button
                              type="button"
                              onClick={() => openEditFeedbackModal(existingFb)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 cursor-pointer shadow-2xs transition-colors"
                              title={`Feedback logged (${existingFb.rating}★). Click to view / edit.`}
                            >
                              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                              <span>{existingFb.rating}★ Feedback</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => openAddFeedbackForCustomer(act)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-[#E8F4EE] hover:bg-[#D4EBDD] text-[#23815F] border border-[#C5E3D5] cursor-pointer shadow-2xs transition-colors"
                              title={`Log direct customer feedback for ${act.customer_name || 'this customer'}`}
                            >
                              <MessageSquarePlus className="w-3.5 h-3.5 text-[#23815F]" />
                              <span>+ Feedback</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Desktop / Tablet Table */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-[#FAF9F6] border-b border-[#E8E6E1] text-[#737373] font-bold uppercase tracking-wider text-[11px]">
                      <tr>
                        <th className="px-5 py-3.5">Date</th>
                        <th className="px-5 py-3.5">Customer Details</th>
                        <th className="px-5 py-3.5">DOB & Anniversary</th>
                        <th className="px-5 py-3.5">Outcome Status</th>
                        <th className="px-5 py-3.5">Product Value (₹)</th>
                        <th className="px-5 py-3.5">Schemes Closed</th>
                        <th className="px-5 py-3.5">Google Reviews</th>
                        <th className="px-5 py-3.5 text-center">Customer Feedback</th>
                        <th className="px-5 py-3.5">Inquiries / Notes</th>
                        <th className="px-5 py-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F0EFEA] font-medium">
                      {filteredCustomerActivities.map((act) => {
                        const count = act.customers_count || 1;
                        const customerItems = parseCustomerBreakdown(
                          act.breakdown,
                          count,
                          act.status,
                          act.customer_name,
                          act.phone_number,
                          act.dob,
                          act.anniversary,
                          act.product_value
                        );

                        const existingFb = customerFeedbacks.find(
                          (fb) =>
                            (fb.customer_phone && act.phone_number && fb.customer_phone === act.phone_number) ||
                            (fb.customer_name && act.customer_name && fb.customer_name.toLowerCase() === act.customer_name.toLowerCase())
                        );

                        return (
                          <tr key={act.id} className="hover:bg-[#FAF9F6] transition-colors">
                            <td className="px-5 py-3.5 font-semibold text-[#171717] whitespace-nowrap">
                              {act.activity_date}
                            </td>
                            <td className="px-5 py-3.5">
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-[#1D1D1B]">
                                    {act.customer_name || 'Walk-in Customer'}
                                  </span>
                                  {count > 1 && (
                                    <span className="px-1.5 py-0.2 rounded-md bg-[#FAF5FF] text-[#7E22CE] border border-[#D8B4FE] text-[10px] font-bold">
                                      {count} Cust
                                    </span>
                                  )}
                                </div>
                                {act.phone_number ? (
                                  <p className="text-[11px] text-[#737373] font-mono flex items-center gap-1">
                                    <Phone className="w-3 h-3 text-[#8A8479]" />
                                    <span>{act.phone_number}</span>
                                  </p>
                                ) : null}
                              </div>
                            </td>
                            <td className="px-5 py-3.5">
                              <div className="space-y-0.5 text-[11px]">
                                {act.dob && (
                                  <span className="text-[#D97706] flex items-center gap-1 font-semibold">
                                    <Gift className="w-3 h-3" /> {act.dob}
                                  </span>
                                )}
                                {act.anniversary && (
                                  <span className="text-[#E11D48] flex items-center gap-1 font-semibold">
                                    <Heart className="w-3 h-3" /> {act.anniversary}
                                  </span>
                                )}
                                {!act.dob && !act.anniversary && (
                                  <span className="text-[#A1A1AA]">—</span>
                                )}
                              </div>
                            </td>
                            <td className="px-5 py-3.5 space-y-1">
                              <div>{getCustomerStatusBadge(act.status)}</div>
                              {customerItems.length > 1 && (
                                <div className="flex items-center gap-1 flex-wrap pt-0.5">
                                  {customerItems.map((item, i) => (
                                    <span
                                      key={i}
                                      className="text-[9px] font-bold px-1.5 py-0.2 rounded-sm bg-[#FAF8F3] border border-[#E4DFD4] text-[#5E5A52]"
                                      title={`${item.name || `Cust #${i + 1}`}: ${item.status}`}
                                    >
                                      #{i + 1}: {item.status}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </td>
                            <td className="px-5 py-3.5 font-mono font-bold text-[#1D1D1B]">
                              {act.product_value && act.product_value > 0 ? (
                                <span className="text-[#21845F]">
                                  ₹{act.product_value.toLocaleString('en-IN')}
                                </span>
                              ) : (
                                <span className="text-[#A1A1AA] font-normal">—</span>
                              )}
                            </td>

                            {/* Schemes Closed Column */}
                            <td className="px-5 py-3.5">
                              {customerItems.some((i) => i.has_scheme || i.scheme_name) ? (
                                <div className="space-y-1">
                                  {customerItems
                                    .filter((i) => i.has_scheme || i.scheme_name)
                                    .map((s, idx) => (
                                      <span
                                        key={idx}
                                        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A] whitespace-nowrap"
                                      >
                                        <Award className="w-3.5 h-3.5 text-[#D97706]" />
                                        <span>
                                          {s.scheme_name || 'Scheme Closed'}
                                          {s.scheme_amount ? ` (₹${Number(s.scheme_amount).toLocaleString('en-IN')})` : ''}
                                        </span>
                                      </span>
                                    ))}
                                </div>
                              ) : (
                                <span className="text-[#A1A1AA]">—</span>
                              )}
                            </td>

                            {/* Google Reviews Column */}
                            <td className="px-5 py-3.5">
                              {customerItems.some((i) => i.has_google_review || i.google_review_text) ? (
                                <div className="space-y-1">
                                  {customerItems
                                    .filter((i) => i.has_google_review || i.google_review_text)
                                    .map((r, idx) => (
                                      <div
                                        key={idx}
                                        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#EFF6FF] text-[#1E40AF] border border-[#BFDBFE] whitespace-nowrap"
                                        title={r.google_review_text || undefined}
                                      >
                                        <Star className="w-3.5 h-3.5 fill-[#F59E0B] text-[#F59E0B]" />
                                        <span>{r.google_review_rating || 5}★ Google Review</span>
                                      </div>
                                    ))}
                                </div>
                              ) : (
                                <span className="text-[#A1A1AA]">—</span>
                              )}
                            </td>

                            {/* Customer Feedback Column */}
                            <td className="px-5 py-3.5 text-center">
                              {customerItems.some((i) => i.has_customer_feedback || i.feedback_text) ? (
                                <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-[#DCFCE7] text-[#166534] border border-[#86EFAC] whitespace-nowrap">
                                  <MessageSquareHeart className="w-3.5 h-3.5 text-[#166534]" />
                                  <span>
                                    {customerItems.find((i) => i.has_customer_feedback || i.feedback_text)?.feedback_rating || 5}★ Feedback
                                  </span>
                                </div>
                              ) : existingFb ? (
                                <button
                                  type="button"
                                  onClick={() => openEditFeedbackModal(existingFb)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 cursor-pointer shadow-2xs transition-colors whitespace-nowrap"
                                  title={`Feedback logged (${existingFb.rating}★). Click to view / edit.`}
                                >
                                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                                  <span>{existingFb.rating}★ Feedback</span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => openAddFeedbackForCustomer(act)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-[#E8F4EE] hover:bg-[#D4EBDD] text-[#23815F] border border-[#C5E3D5] cursor-pointer shadow-2xs transition-colors whitespace-nowrap"
                                  title={`Log direct customer feedback for ${act.customer_name || 'this customer'}`}
                                >
                                  <MessageSquarePlus className="w-3.5 h-3.5 text-[#23815F]" />
                                  <span>+ Feedback</span>
                                </button>
                              )}
                            </td>

                            <td className="px-5 py-3.5 text-[#525252] max-w-xs truncate">
                              {act.notes || '—'}
                            </td>
                            <td className="px-5 py-3.5 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => openEditCustomerModal(act)}
                                  className="p-1 text-[#737373] hover:text-[#536B8A] hover:bg-[#F0F4F8] rounded-md transition-colors cursor-pointer"
                                  title="Edit Activity"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setDeleteTarget({ type: 'customer', id: act.id, title: `${act.activity_date} (${count} Customers)` })}
                                  className="p-1 text-[#A3A3A3] hover:text-[#C24141] hover:bg-[#FDECEC] rounded-md transition-colors cursor-pointer"
                                  title="Delete Activity"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        );

        // Content Renderer: Schemes Closed
        const renderSchemesContent = () => (
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
                {/* Mobile Card List */}
                <div className="sm:hidden divide-y divide-[#F0EFEA]">
                  {schemes.map((sch) => (
                    <div key={sch.id} className="p-3.5 space-y-2 bg-white">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-[#171717]">{sch.scheme_name}</span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-xs text-[#C9A227]">
                            ₹{sch.amount.toLocaleString('en-IN')}
                          </span>
                          <button
                            onClick={() => openEditSchemeModal(sch)}
                            className="p-1 text-[#737373] hover:text-[#536B8A] hover:bg-[#F0F4F8] rounded-md transition-colors"
                            title="Edit Scheme"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget({ type: 'scheme', id: sch.id, title: `${sch.scheme_name} - ₹${sch.amount}` })}
                            className="p-1 text-[#A3A3A3] hover:text-[#C24141] hover:bg-[#FDECEC] rounded-md transition-colors"
                            title="Delete Scheme"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-[#737373]">
                        <span className="font-semibold text-[#536B8A]">
                          {sch.customers_count || 1} Customer{(sch.customers_count || 1) > 1 ? 's' : ''} Enrolled
                        </span>
                        <span>{sch.record_date}</span>
                      </div>
                      {sch.notes && <p className="text-[11px] text-[#525252] bg-[#FAF9F6] p-2 rounded-lg">{sch.notes}</p>}
                    </div>
                  ))}
                </div>

                {/* Desktop / Tablet Table */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-[#FAF9F6] border-b border-[#E8E6E1] text-[#737373] font-bold uppercase tracking-wider text-[11px]">
                      <tr>
                        <th className="px-5 py-3.5">Scheme Plan</th>
                        <th className="px-5 py-3.5">Customers Count</th>
                        <th className="px-5 py-3.5">Amount (₹)</th>
                        <th className="px-5 py-3.5">Date</th>
                        <th className="px-5 py-3.5">Notes</th>
                        <th className="px-5 py-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F0EFEA] font-medium">
                      {schemes.map((sch) => (
                        <tr key={sch.id} className="hover:bg-[#FAF9F6] transition-colors">
                          <td className="px-5 py-3.5 font-bold text-[#171717]">{sch.scheme_name}</td>
                          <td className="px-5 py-3.5">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-[#EDF2F7] text-[#536B8A]">
                              {sch.customers_count || 1} Customer{(sch.customers_count || 1) > 1 ? 's' : ''}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 font-mono font-bold text-[#171717]">
                            ₹{sch.amount.toLocaleString('en-IN')}
                          </td>
                          <td className="px-5 py-3.5 text-[#737373]">{sch.record_date}</td>
                          <td className="px-5 py-3.5 text-[#737373] max-w-xs truncate">{sch.notes || '—'}</td>
                          <td className="px-5 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => openEditSchemeModal(sch)}
                                className="p-1 text-[#737373] hover:text-[#536B8A] hover:bg-[#F0F4F8] rounded-md transition-colors"
                                title="Edit Scheme"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setDeleteTarget({ type: 'scheme', id: sch.id, title: `${sch.scheme_name} - ₹${sch.amount}` })}
                                className="p-1 text-[#A3A3A3] hover:text-[#C24141] hover:bg-[#FDECEC] rounded-md transition-colors"
                                title="Delete Scheme"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        );

        // Content Renderer: Google Reviews
        const renderReviewsContent = () => (
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
                  <div key={rev.id} className="bg-white border border-[#E8E6E1] rounded-2xl p-4 sm:p-5 shadow-2xs space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-[#C9A227]">
                        {[...Array(rev.rating)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-[#C9A227]" />
                        ))}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] text-[#A3A3A3] font-medium">{rev.review_date}</span>
                        <button
                          onClick={() => openEditReviewModal(rev)}
                          className="p-1 text-[#737373] hover:text-[#536B8A] hover:bg-[#F0F4F8] rounded-md transition-colors"
                          title="Edit Review"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget({ type: 'review', id: rev.id, title: `Google Review (${rev.rating}★)` })}
                          className="p-1 text-[#A3A3A3] hover:text-[#C24141] hover:bg-[#FDECEC] rounded-md transition-colors"
                          title="Delete Review"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-[#171717] font-medium italic">"{rev.review_text}"</p>
                    <div className="flex items-center justify-between text-[11px] text-[#737373]">
                      <span className="font-semibold text-[#536B8A] bg-[#F0F4F8] px-2 py-0.5 rounded-full">
                        {rev.customers_count || 1} Customer{(rev.customers_count || 1) > 1 ? 's' : ''} Review
                      </span>
                      {rev.notes && <span className="truncate max-w-40">Note: {rev.notes}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

        // Content Renderer: Customer Feedback (Showroom Direct Reviews)
        const renderFeedbackContent = () => (
          <div className="space-y-4">
            {/* Header / Summary Card */}
            <div className="bg-gradient-to-r from-[#F0FDF4] to-[#FAF9F6] border border-[#DCFCE7] rounded-2xl p-4 sm:p-5 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-[#23815F]/10 flex items-center justify-center text-[#23815F] shrink-0">
                  <MessageSquareHeart className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-semibold text-[#171717]">Showroom Customer Feedback</h3>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#23815F] text-white">
                      ⭐ {feedbackAvgRating.toFixed(1)} / 5.0
                    </span>
                  </div>
                  <p className="text-xs text-[#737373] mt-0.5">
                    Direct feedback and satisfaction ratings logged for {employee.full_name} ({customerFeedbacks.length} total review{customerFeedbacks.length === 1 ? '' : 's'})
                  </p>
                </div>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={openAddFeedbackModal}
                leftIcon={<Plus className="w-3.5 h-3.5" />}
                className="text-xs shadow-2xs w-full sm:w-auto bg-[#23815F] hover:bg-[#1C694D]"
              >
                + Log Customer Feedback
              </Button>
            </div>

            {customerFeedbacks.length === 0 ? (
              <EmptyState
                title="No customer feedback recorded yet."
                description={`Record direct showroom customer satisfaction ratings, feedback quotes, and service impressions for ${employee.full_name}.`}
                icon={MessageSquareHeart}
                actionText="+ Log Customer Feedback"
                onAction={openAddFeedbackModal}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {customerFeedbacks.map((fb) => (
                  <div
                    key={fb.id}
                    className="bg-white border border-[#E8E6E1] hover:border-[#23815F]/40 transition-all rounded-2xl p-4 sm:p-5 shadow-2xs space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-semibold text-sm text-[#171717]">{fb.customer_name}</span>
                          {fb.customer_phone && (
                            <span className="text-xs text-[#737373] font-mono flex items-center gap-1">
                              <Phone className="w-3 h-3 text-[#A3A3A3]" /> {fb.customer_phone}
                            </span>
                          )}
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-[#F4F4F5] text-[#52525B]">
                            {fb.category || 'Customer Service'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 mt-1 text-[#23815F]">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3.5 h-3.5 ${
                                i < fb.rating
                                  ? 'fill-[#23815F] text-[#23815F]'
                                  : 'text-[#E4E4E7]'
                              }`}
                            />
                          ))}
                          <span className="text-xs font-bold ml-1 text-[#23815F]">{fb.rating}.0</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-[11px] text-[#A3A3A3] font-medium">{fb.feedback_date}</span>
                        <button
                          onClick={() => openEditFeedbackModal(fb)}
                          className="p-1 text-[#737373] hover:text-[#23815F] hover:bg-[#EBF7EE] rounded-md transition-colors"
                          title="Edit Customer Feedback"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() =>
                            setDeleteTarget({
                              type: 'feedback',
                              id: fb.id,
                              title: `Customer Feedback from ${fb.customer_name} (${fb.rating}★)`,
                            })
                          }
                          className="p-1 text-[#A3A3A3] hover:text-[#C24141] hover:bg-[#FDECEC] rounded-md transition-colors"
                          title="Delete Customer Feedback"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="p-3 bg-[#FAF9F6] rounded-xl border border-[#F0EFEA]">
                      <p className="text-xs text-[#171717] font-medium italic leading-relaxed">
                        "{fb.feedback_text}"
                      </p>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-[#737373] pt-1">
                      <span className="inline-flex items-center gap-1 text-[#23815F] font-medium bg-[#DCFCE7] px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3 h-3" /> {fb.status || 'Verified'}
                      </span>
                      {fb.notes && (
                        <span className="truncate max-w-[220px] text-[#737373]" title={fb.notes}>
                          Note: {fb.notes}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

        // Content Renderer: Daily Forms & Media
        const renderFormsContent = () => (
          <div className="space-y-4">
            {formMediaList.length === 0 ? (
              <EmptyState
                title="No form images uploaded."
                description={`Upload daily closing sheets, order forms, and appraisal photos (under 2.5 MB) for ${employee.full_name}.`}
                icon={Camera}
                actionText="Upload Form Photo"
                onAction={() => setShowUploadFormModal(true)}
              />
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                {formMediaList.map((m) => (
                  <div
                    key={m.id}
                    className="bg-white border border-[#E8E6E1] rounded-2xl overflow-hidden shadow-2xs group hover:border-[#171717] transition-all"
                  >
                    <div
                      onClick={() => setViewImageModalUrl(m.file_url)}
                      className="aspect-4/3 bg-[#FAF9F6] overflow-hidden relative cursor-pointer"
                    >
                      <img
                        src={getMediaUrl(m.file_url)}
                        alt={m.form_type}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold">
                        View Full Size
                      </div>
                    </div>
                    <div className="p-2.5 sm:p-3 space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-[#171717] truncate">{m.form_type}</p>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => openEditFormMediaModal(m)}
                            className="p-1 text-[#737373] hover:text-[#536B8A] hover:bg-[#F0F4F8] rounded-md transition-colors"
                            title="Edit Details"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget({ type: 'form', id: m.id, title: m.form_type })}
                            className="p-1 text-[#A3A3A3] hover:text-[#C24141] hover:bg-[#FDECEC] rounded-md transition-colors"
                            title="Delete Form"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                      <p className="text-[10px] text-[#A3A3A3]">{m.upload_date}</p>
                      {m.notes && <p className="text-[10px] text-[#525252] truncate">{m.notes}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

        // Content Renderer: Attire Checks
        const renderAttireContent = () => (
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
                {/* Mobile Card List */}
                <div className="sm:hidden divide-y divide-[#F0EFEA]">
                  {attireList.map((att) => (
                    <div key={att.id} className="p-3.5 space-y-1.5 bg-white">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-xs text-[#525252]">{att.check_date}</span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            att.status === 'Proper'
                              ? 'bg-[#EAF7F1] text-[#16845B] border border-[#C1ECD9]'
                              : 'bg-[#FDECEC] text-[#C24141] border border-[#F9C3C3]'
                          }`}
                        >
                          {att.status}
                        </span>
                      </div>
                      {att.notes && <p className="text-[11px] text-[#737373]">{att.notes}</p>}
                    </div>
                  ))}
                </div>

                {/* Desktop Table */}
                <div className="hidden sm:block overflow-x-auto">
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
                              className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                                att.status === 'Proper'
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
              </div>
            )}
          </div>
        );

        // Content Renderer: Customer Calls (Calls Done & Pending)
        const renderCallsContent = () => (
          <div className="space-y-4">
            {/* Top 4 KPI Metrics Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* Total Calls */}
              <div className="bg-white border border-[#E8E6E1] rounded-2xl p-3.5 shadow-2xs">
                <span className="text-[10px] font-bold text-[#8A8479] uppercase tracking-wider block">
                  Total Calls
                </span>
                <div className="flex items-baseline gap-1.5 mt-1">
                  <span className="text-xl font-bold text-[#1D1D1B]">{callsList.length}</span>
                  <span className="text-[11px] text-[#737373]">({totalCustomersCalled} Cust)</span>
                </div>
                <span className="text-[10px] text-[#737373]">Logged for {employee.full_name}</span>
              </div>

              {/* Calls Done */}
              <div className="bg-white border border-[#C1ECD9] rounded-2xl p-3.5 shadow-2xs">
                <span className="text-[10px] font-bold text-[#16845B] uppercase tracking-wider block">
                  Calls Done
                </span>
                <div className="text-xl font-bold text-[#16845B] mt-1 flex items-center gap-1.5">
                  <CheckCircle2 className="w-5 h-5 text-[#16845B]" />
                  <span>{callsDoneCount}</span>
                </div>
                <span className="text-[10px] text-[#16845B] font-semibold">
                  {callCompletionRate}% Completed
                </span>
              </div>

              {/* Calls Pending */}
              <div className="bg-white border border-[#FDE68A] rounded-2xl p-3.5 shadow-2xs">
                <span className="text-[10px] font-bold text-[#B45309] uppercase tracking-wider block">
                  Calls Pending
                </span>
                <div className="text-xl font-bold text-[#B45309] mt-1 flex items-center gap-1.5">
                  <Clock className="w-5 h-5 text-[#B45309]" />
                  <span>{callsPendingCount}</span>
                </div>
                <span className="text-[10px] text-[#B45309] font-medium">To be completed</span>
              </div>

              {/* Completion Rate */}
              <div className="bg-white border border-[#C5D5E6] rounded-2xl p-3.5 shadow-2xs">
                <span className="text-[10px] font-bold text-[#536B8A] uppercase tracking-wider block">
                  Completion Rate
                </span>
                <div className="text-xl font-bold text-[#536B8A] mt-1">{callCompletionRate}%</div>
                <div className="w-full bg-[#EDF2F7] h-1.5 rounded-full mt-1.5 overflow-hidden">
                  <div
                    className="bg-[#536B8A] h-full rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, callCompletionRate)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Filter Toolbar */}
            <div className="bg-white border border-[#E8E6E1] rounded-2xl p-3 shadow-2xs space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                {/* Search Input */}
                <div className="relative flex-1 max-w-sm">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#8A8479]" />
                  <input
                    type="text"
                    value={callSearchTerm}
                    onChange={(e) => setCallSearchTerm(e.target.value)}
                    placeholder="Search by customer name, phone, purpose..."
                    className="w-full pl-9 pr-7 py-1.5 text-xs bg-[#FAF9F6] border border-[#E8E6E1] rounded-xl focus:bg-white focus:outline-hidden focus:border-[#536B8A] transition-all"
                  />
                  {callSearchTerm && (
                    <button
                      onClick={() => setCallSearchTerm('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-[#8A8479] hover:text-[#171717]"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* Status Toggle Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
                  <button
                    type="button"
                    onClick={() => setCallStatusFilter('all')}
                    className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                      callStatusFilter === 'all'
                        ? 'bg-[#1D1D1B] text-white shadow-2xs'
                        : 'bg-[#FAF9F6] text-[#737373] hover:text-[#171717] hover:bg-[#F0EFEA]'
                    }`}
                  >
                    All ({callsList.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setCallStatusFilter('Done')}
                    className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                      callStatusFilter === 'Done'
                        ? 'bg-[#16845B] text-white shadow-2xs'
                        : 'bg-[#EAF7F1] text-[#16845B] border border-[#C1ECD9] hover:bg-[#D5F2E4]'
                    }`}
                  >
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Done ({callsDoneCount})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCallStatusFilter('Pending')}
                    className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                      callStatusFilter === 'Pending'
                        ? 'bg-[#B45309] text-white shadow-2xs'
                        : 'bg-[#FEF3C7] text-[#92400E] border border-[#FCD34D] hover:bg-[#FDE68A]'
                    }`}
                  >
                    <Clock className="w-3 h-3" />
                    <span>Pending ({callsPendingCount})</span>
                  </button>
                </div>

                {/* Date Filter & Log Button */}
                <div className="flex items-center gap-2 shrink-0">
                  <select
                    value={callDatePreset}
                    onChange={(e) => setCallDatePreset(e.target.value)}
                    className="text-xs bg-[#FAF9F6] border border-[#E8E6E1] rounded-xl px-2.5 py-1.5 font-medium text-[#525252] cursor-pointer"
                  >
                    <option value="all">All Dates</option>
                    <option value="today">Today</option>
                    <option value="yesterday">Yesterday</option>
                    <option value="this_week">This Week</option>
                    <option value="this_month">This Month</option>
                  </select>

                  <Button
                    variant="primary"
                    size="sm"
                    onClick={openAddCallModal}
                    leftIcon={<PhoneCall className="w-3.5 h-3.5" />}
                    className="text-xs shadow-2xs whitespace-nowrap"
                  >
                    + Log Customer Call
                  </Button>
                </div>
              </div>
            </div>

            {/* Calls Table or Empty State */}
            {filteredCalls.length === 0 ? (
              <EmptyState
                title={callSearchTerm || callStatusFilter !== 'all' ? 'No matching customer calls found' : 'No customer calls logged yet'}
                description={
                  callSearchTerm || callStatusFilter !== 'all'
                    ? 'Try adjusting your search query or status filter.'
                    : `Log customer phone outreach, follow-ups, and calls done/pending for ${employee.full_name}.`
                }
                icon={PhoneCall}
                actionText="+ Log Customer Call"
                onAction={openAddCallModal}
              />
            ) : (
              <div className="bg-white border border-[#E8E6E1] rounded-2xl overflow-hidden shadow-2xs overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-[#FAF9F6] border-b border-[#E8E6E1] text-[#737373] font-bold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="px-5 py-3.5">Customer & Phone Number</th>
                      <th className="px-5 py-3.5 text-center">Customers Count</th>
                      <th className="px-5 py-3.5 text-center">Call Status</th>
                      <th className="px-5 py-3.5">Call Date & Time</th>
                      <th className="px-5 py-3.5">Purpose / Topic</th>
                      <th className="px-5 py-3.5">Notes & Feedback</th>
                      <th className="px-5 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F0EFEA] font-medium">
                    {filteredCalls.map((call) => {
                      const isDone = call.call_status === 'Done';
                      return (
                        <tr key={call.id} className="hover:bg-[#FAF9F6] transition-colors group">
                          {/* Customer & Phone */}
                          <td className="px-5 py-3.5">
                            <div className="font-bold text-[#171717] flex items-center gap-2">
                              <span className="w-7 h-7 rounded-lg bg-[#FAF5FF] text-[#7E22CE] border border-[#D8B4FE] flex items-center justify-center font-bold text-xs shrink-0">
                                {call.customer_name.charAt(0).toUpperCase()}
                              </span>
                              <div>
                                <p className="font-bold text-xs text-[#1D1D1B]">{call.customer_name}</p>
                                <a
                                  href={`tel:${call.phone_number}`}
                                  className="text-[11px] font-mono text-[#536B8A] hover:underline flex items-center gap-1 mt-0.5"
                                  title="Click to dial"
                                >
                                  <Phone className="w-3 h-3 text-[#536B8A]" />
                                  <span>{call.phone_number}</span>
                                </a>
                              </div>
                            </div>
                          </td>

                          {/* Customers Count */}
                          <td className="px-5 py-3.5 text-center">
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#EDF2F7] text-[#536B8A] border border-[#C5D5E6]">
                              {call.customers_count || 1} Cust
                            </span>
                          </td>

                          {/* Status with Toggle Badge */}
                          <td className="px-5 py-3.5 text-center">
                            <button
                              type="button"
                              onClick={() => handleToggleCallStatus(call)}
                              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer shadow-2xs hover:scale-105 ${
                                isDone
                                  ? 'bg-[#E8F4EE] text-[#1B694C] border border-[#A7E3C9] hover:bg-[#D4EFE2]'
                                  : 'bg-[#FEF3C7] text-[#92400E] border border-[#FCD34D] hover:bg-[#FDE68A]'
                              }`}
                              title={`Click to mark as ${isDone ? 'Pending' : 'Done'}`}
                            >
                              {isDone ? (
                                <>
                                  <CheckCircle2 className="w-3.5 h-3.5 text-[#1B694C]" />
                                  <span>Calls Done</span>
                                </>
                              ) : (
                                <>
                                  <Clock className="w-3.5 h-3.5 text-[#92400E]" />
                                  <span>Calls Pending</span>
                                </>
                              )}
                            </button>
                          </td>

                          {/* Call Date & Time */}
                          <td className="px-5 py-3.5 text-[#525252] whitespace-nowrap">
                            <div className="flex items-center gap-1 font-semibold text-[#1D1D1B]">
                              <Calendar className="w-3.5 h-3.5 text-[#8A8479]" />
                              <span>{call.call_date}</span>
                            </div>
                            {call.call_time && (
                              <span className="text-[10px] text-[#737373] flex items-center gap-1 mt-0.5">
                                <Clock className="w-3 h-3" />
                                {call.call_time}
                              </span>
                            )}
                          </td>

                          {/* Purpose */}
                          <td className="px-5 py-3.5">
                            <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[#FAF5FF] text-[#7E22CE] border border-[#D8B4FE]">
                              {call.purpose || 'Follow-up Call'}
                            </span>
                          </td>

                          {/* Notes */}
                          <td className="px-5 py-3.5 text-[#737373] max-w-xs">
                            <p className="line-clamp-2 text-xs text-[#525252]">{call.notes || '—'}</p>
                          </td>

                          {/* Actions */}
                          <td className="px-5 py-3.5 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleToggleCallStatus(call)}
                                className="p-1.5 rounded-lg text-[#536B8A] hover:bg-[#EDF2F7] transition-colors cursor-pointer"
                                title={isDone ? 'Mark as Pending' : 'Mark as Done'}
                              >
                                {isDone ? <Clock className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                              </button>

                              <button
                                type="button"
                                onClick={() => openEditCallModal(call)}
                                className="p-1.5 rounded-lg text-[#525252] hover:text-[#171717] hover:bg-[#F0EFEA] transition-colors cursor-pointer"
                                title="Edit call log"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  setDeleteTarget({
                                    type: 'call',
                                    id: call.id,
                                    title: `Call to ${call.customer_name} (${call.phone_number})`,
                                  })
                                }
                                className="p-1.5 rounded-lg text-[#DC2626] hover:bg-[#FEE2E2] transition-colors cursor-pointer"
                                title="Delete call log"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );

        // Content Renderer: Target Areas (Outdoor)
        const renderTargetAreasContent = () => (
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
              <div className="bg-white border border-[#E8E6E1] rounded-2xl overflow-hidden shadow-2xs overflow-x-auto">
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
                            className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                              area.status === 'Completed'
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
        );

        // Content Renderer: Outdoor Leads
        const renderOutdoorLeadsContent = () => (
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
              <div className="bg-white border border-[#E8E6E1] rounded-2xl overflow-hidden shadow-2xs overflow-x-auto">
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
                            className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                              cust.status === 'Closed'
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
        );

        // Content Renderer: Promoted Schemes (Outdoor)
        const renderPromotedSchemesContent = () => (
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
              <div className="bg-white border border-[#E8E6E1] rounded-2xl overflow-hidden shadow-2xs overflow-x-auto">
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
        );

        // Section Configs for Mobile Vertical Accordion
        const standardSections = [
          {
            key: 'customers',
            label: 'Customer Activity',
            count: employee.customers_attended_count,
            subtitle: 'Visitor walk-ins & inquiries',
            icon: UserCheck,
            actionButton: (
              <Button
                variant="primary"
                size="sm"
                onClick={openAddCustomerModal}
                leftIcon={<Plus className="w-3.5 h-3.5" />}
                className="text-xs shadow-2xs w-full sm:w-auto"
              >
                + Log Customer Activity
              </Button>
            ),
            content: renderCustomersContent(),
          },
          {
            key: 'calls',
            label: 'Calls Done',
            count: callsDoneCount,
            subtitle: `${callsDoneCount} Calls Done • ${callsPendingCount} Pending`,
            icon: PhoneCall,
            actionButton: (
              <Button
                variant="primary"
                size="sm"
                onClick={openAddCallModal}
                leftIcon={<PhoneCall className="w-3.5 h-3.5" />}
                className="text-xs shadow-2xs w-full sm:w-auto"
              >
                + Log Customer Call
              </Button>
            ),
            content: renderCallsContent(),
          },
          {
            key: 'forms',
            label: 'Daily Forms',
            count: formMediaList.length,
            subtitle: 'Closing sheets & photo uploads (Max 2.5MB)',
            icon: Camera,
            actionButton: (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowUploadFormModal(true)}
                leftIcon={<Camera className="w-3.5 h-3.5" />}
                className="text-xs shadow-2xs w-full sm:w-auto"
              >
                + Upload Form Photo
              </Button>
            ),
            content: renderFormsContent(),
          },
          {
            key: 'attire',
            label: 'Attire Checks',
            count: attireList.length,
            subtitle: 'Grooming & dress code logs',
            icon: Shirt,
            actionButton: (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowAddAttireModal(true)}
                leftIcon={<Shirt className="w-3.5 h-3.5" />}
                className="text-xs shadow-2xs w-full sm:w-auto"
              >
                + Log Attire Check
              </Button>
            ),
            content: renderAttireContent(),
          },
        ];

        const outdoorSections = [
          {
            key: 'target_areas',
            label: 'Target Areas',
            count: outdoorAreas.length,
            subtitle: 'Assigned locations & campaign zones',
            icon: MapPin,
            actionButton: (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowAddAreaModal(true)}
                leftIcon={<MapPin className="w-3.5 h-3.5" />}
                className="text-xs shadow-2xs w-full sm:w-auto"
              >
                + Assign Target Area
              </Button>
            ),
            content: renderTargetAreasContent(),
          },
          {
            key: 'outdoor_leads',
            label: 'Customer Leads',
            count: outdoorCustomers.length,
            subtitle: 'Field prospects & inquiries',
            icon: UserCheck,
            actionButton: (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowAddOutdoorCustModal(true)}
                leftIcon={<Plus className="w-3.5 h-3.5" />}
                className="text-xs shadow-2xs w-full sm:w-auto"
              >
                + Record Customer Lead
              </Button>
            ),
            content: renderOutdoorLeadsContent(),
          },
          {
            key: 'promoted_schemes',
            label: 'Promoted Schemes',
            count: outdoorSchemes.length,
            subtitle: 'Gold & savings campaigns in field',
            icon: Award,
            actionButton: (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowAddOutdoorSchemeModal(true)}
                leftIcon={<Plus className="w-3.5 h-3.5" />}
                className="text-xs shadow-2xs w-full sm:w-auto"
              >
                + Log Promoted Scheme
              </Button>
            ),
            content: renderPromotedSchemesContent(),
          },
          {
            key: 'calls',
            label: 'Calls Done',
            count: callsDoneCount,
            subtitle: `${callsDoneCount} Calls Done • ${callsPendingCount} Pending`,
            icon: PhoneCall,
            actionButton: (
              <Button
                variant="primary"
                size="sm"
                onClick={openAddCallModal}
                leftIcon={<PhoneCall className="w-3.5 h-3.5" />}
                className="text-xs shadow-2xs w-full sm:w-auto"
              >
                + Log Customer Call
              </Button>
            ),
            content: renderCallsContent(),
          },
          {
            key: 'forms',
            label: 'Daily Forms',
            count: formMediaList.length,
            subtitle: 'Closing sheets & photo uploads (Max 2.5MB)',
            icon: Camera,
            actionButton: (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowUploadFormModal(true)}
                leftIcon={<Camera className="w-3.5 h-3.5" />}
                className="text-xs shadow-2xs w-full sm:w-auto"
              >
                + Upload Form Photo
              </Button>
            ),
            content: renderFormsContent(),
          },
          {
            key: 'attire',
            label: 'Attire Checks',
            count: attireList.length,
            subtitle: 'Grooming & dress code logs',
            icon: Shirt,
            actionButton: (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowAddAttireModal(true)}
                leftIcon={<Shirt className="w-3.5 h-3.5" />}
                className="text-xs shadow-2xs w-full sm:w-auto"
              >
                + Log Attire Check
              </Button>
            ),
            content: renderAttireContent(),
          },
        ];

        const activeSections = isOutdoor ? outdoorSections : standardSections;

        return (
          <>
            {/* -------------------------------------------------------------
                MOBILE VIEW (md:hidden): VERTICAL STACKED ACCORDION SECTIONS
            ------------------------------------------------------------- */}
            <div className="md:hidden space-y-3">
              <div className="px-1 py-0.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#8A8479]">
                  Employee Activity Sections
                </span>
              </div>

              {activeSections.map((sec) => {
                const isExpanded = activeTab === sec.key;
                const IconComponent = sec.icon;

                return (
                  <div
                    key={sec.key}
                    className={`bg-white border rounded-2xl overflow-hidden transition-all duration-200 shadow-2xs ${
                      isExpanded
                        ? 'border-[#536B8A] ring-2 ring-[#536B8A]/10 shadow-sm'
                        : 'border-[#E8E6E1] hover:border-[#C5D5E6]'
                    }`}
                  >
                    {/* Mobile Section Header Card */}
                    <button
                      type="button"
                      onClick={() => setActiveTab(isExpanded ? '' : sec.key)}
                      className={`w-full flex items-center justify-between p-3.5 sm:p-4 text-left transition-colors cursor-pointer ${
                        isExpanded ? 'bg-[#EDF2F7]/60' : 'bg-white hover:bg-[#FAF9F6]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 border ${
                            isExpanded
                              ? 'bg-[#536B8A] text-white border-[#3E526B]'
                              : 'bg-[#F0F4F8] text-[#536B8A] border-[#C5D5E6]'
                          }`}
                        >
                          <IconComponent className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs sm:text-sm text-[#1D1D1B]">{sec.label}</span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[11px] font-extrabold ${
                                isExpanded
                                  ? 'bg-[#536B8A] text-white'
                                  : 'bg-[#EDF2F7] text-[#536B8A] border border-[#C5D5E6]'
                              }`}
                            >
                              {sec.count}
                            </span>
                          </div>
                          <p className="text-[10px] sm:text-[11px] text-[#737373] mt-0.5">{sec.subtitle}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 text-[#536B8A]">
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-[#536B8A]" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-[#8A8479]" />
                        )}
                      </div>
                    </button>

                    {/* Mobile Expanded Content */}
                    {isExpanded && (
                      <div className="p-3.5 sm:p-4 border-t border-[#E8E6E1] bg-[#FAF9F6]/50 space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
                        {/* Quick Action Button for Mobile Section */}
                        <div className="flex justify-end pt-1">{sec.actionButton}</div>

                        {/* Section Content */}
                        <div>{sec.content}</div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* -------------------------------------------------------------
                DESKTOP VIEW (hidden md:block): HORIZONTAL TABS & FULL TABLES
            ------------------------------------------------------------- */}
            <div className="hidden md:block space-y-6">
              {/* Desktop Sub-Navigation Tab Bar */}
              <div className="border-b border-[#E8E6E1] flex items-center justify-between gap-3">
                <div className="flex items-center gap-1 overflow-x-auto pb-1">
                  {activeSections.map((sec) => (
                    <button
                      key={sec.key}
                      onClick={() => setActiveTab(sec.key)}
                      className={`px-3.5 py-2.5 text-xs font-semibold rounded-t-xl transition-all border-b-2 whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                        activeTab === sec.key
                          ? 'border-[#536B8A] text-[#536B8A] font-bold bg-[#EDF2F7]/50'
                          : 'border-transparent text-[#8A8479] hover:text-[#1D1D1B]'
                      }`}
                    >
                      <span>{sec.label}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#EDF2F7] text-[#536B8A] font-bold">
                        {sec.count}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Desktop Tab Action Button */}
                <div className="flex items-center gap-2">
                  {activeSections.find((s) => s.key === activeTab)?.actionButton}
                </div>
              </div>

              {/* Desktop Active Tab Content */}
              <div>{activeSections.find((s) => s.key === activeTab)?.content}</div>
            </div>
          </>
        );
      })()}

      {/* =========================================================
          MODALS
      ========================================================= */}

      {/* Modal: Customer Activity (Add / Edit) */}
      {showCustomerModal && (
        <CustomerActivityModal
          isOpen={showCustomerModal}
          onClose={() => {
            setShowCustomerModal(false);
            setEditingCustomerActivity(null);
          }}
          onSaved={() => {
            fetchEmployeeData();
            fetchTabContent();
          }}
          employeeId={parseInt(id || '0')}
          employeeName={employee.full_name}
          initialData={editingCustomerActivity}
        />
      )}

      {/* Modal: Customer Call (Calls Done / Pending) */}
      <Modal
        isOpen={showCallModal}
        onClose={() => {
          setShowCallModal(false);
          setEditingCall(null);
        }}
        title={editingCall ? 'Edit Customer Call Log' : 'Log Customer Call (Calls Done / Pending)'}
        subtitle={`Record customer calling details, numbers reached, and call status for ${employee.full_name}`}
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setShowCallModal(false);
                setEditingCall(null);
              }}
            >
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleSaveCall} isLoading={submittingAction}>
              {editingCall ? 'Update Call Log' : 'Save Call'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSaveCall} className="space-y-4">
          {/* Quick select from recent customer activity if available */}
          {!editingCall && (customerActivities?.length ?? 0) > 0 && (
            <div className="p-2.5 bg-[#FAF7F2] rounded-xl border border-[#D4AF37]/20">
              <p className="text-[11px] font-semibold text-[#8C7A5B] uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" /> Quick Pick from Recent Customer Activity:
              </p>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                {customerActivities.slice(0, 8).map((act) => (
                  <button
                    key={act.id}
                    type="button"
                    onClick={() => {
                      setCallForm((prev) => ({
                        ...prev,
                        customer_name: act.customer_name || prev.customer_name,
                        phone_number: act.phone_number || prev.phone_number,
                        purpose: act.notes || prev.purpose,
                      }));
                    }}
                    className="text-xs px-2.5 py-1 bg-white hover:bg-[#D4AF37]/15 rounded-lg border border-[#D4AF37]/30 text-[#1D1D1B] font-medium transition-colors flex items-center gap-1.5 shadow-xs"
                  >
                    <span>{act.customer_name}</span>
                    {act.phone_number && <span className="text-[#8C7A5B] font-mono text-[10px]">({act.phone_number})</span>}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Customer Name & Phone Number */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#1D1D1B] mb-1.5">Customer Name *</label>
              <div className="relative">
                <User className="w-4 h-4 text-[#8C7A5B] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Kumar"
                  value={callForm.customer_name}
                  onChange={(e) => setCallForm((prev) => ({ ...prev, customer_name: e.target.value }))}
                  className="w-full text-xs font-semibold select-luxury-beige rounded-xl pl-9 pr-3 py-2.5"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1D1D1B] mb-1.5">Customer Phone Number *</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-[#8C7A5B] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="tel"
                  required
                  placeholder="e.g. 9876543210"
                  value={callForm.phone_number}
                  onChange={(e) => setCallForm((prev) => ({ ...prev, phone_number: e.target.value }))}
                  className="w-full text-xs font-semibold select-luxury-beige rounded-xl pl-9 pr-3 py-2.5 font-mono"
                />
              </div>
            </div>
          </div>

          {/* How Many Customers & Call Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#1D1D1B] mb-1.5">
                How Many Customers? (Call Headcount) *
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max="500"
                  required
                  value={callForm.customers_count}
                  onChange={(e) =>
                    setCallForm((prev) => ({
                      ...prev,
                      customers_count: Math.max(1, parseInt(e.target.value) || 1),
                    }))
                  }
                  className="w-24 text-xs font-bold text-center select-luxury-beige rounded-xl py-2.5"
                />
                <div className="flex flex-wrap gap-1">
                  {[1, 2, 3, 5, 10].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setCallForm((prev) => ({ ...prev, customers_count: num }))}
                      className={`text-xs px-2.5 py-1.5 rounded-lg font-bold border transition-all ${
                        callForm.customers_count === num
                          ? 'bg-[#1D1D1B] text-[#D4AF37] border-[#1D1D1B]'
                          : 'bg-white text-[#555] border-gray-200 hover:border-[#D4AF37]'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>
              <p className="text-[11px] text-[#8C7A5B] mt-1">Number of persons or group contacts represented in this call</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1D1D1B] mb-1.5">Call Status *</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setCallForm((prev) => ({ ...prev, call_status: 'Done' }))}
                  className={`p-2.5 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition-all ${
                    callForm.call_status === 'Done'
                      ? 'bg-emerald-500 text-white border-emerald-600 shadow-sm'
                      : 'bg-white text-emerald-800 border-emerald-200 hover:bg-emerald-50'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Calls Done
                </button>
                <button
                  type="button"
                  onClick={() => setCallForm((prev) => ({ ...prev, call_status: 'Pending' }))}
                  className={`p-2.5 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition-all ${
                    callForm.call_status === 'Pending'
                      ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                      : 'bg-white text-amber-800 border-amber-200 hover:bg-amber-50'
                  }`}
                >
                  <Clock className="w-4 h-4" />
                  Calls Pending
                </button>
              </div>
            </div>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#1D1D1B] mb-1.5">Call Date *</label>
              <input
                type="date"
                required
                value={callForm.call_date}
                onChange={(e) => setCallForm((prev) => ({ ...prev, call_date: e.target.value }))}
                className="w-full text-xs font-semibold select-luxury-beige rounded-xl p-2.5"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1D1D1B] mb-1.5">Call Time</label>
              <input
                type="time"
                value={callForm.call_time}
                onChange={(e) => setCallForm((prev) => ({ ...prev, call_time: e.target.value }))}
                className="w-full text-xs font-semibold select-luxury-beige rounded-xl p-2.5"
              />
            </div>
          </div>

          {/* Purpose of Call */}
          <div>
            <label className="block text-xs font-semibold text-[#1D1D1B] mb-1.5">Purpose / Subject of Call</label>
            <select
              value={callForm.purpose}
              onChange={(e) => setCallForm((prev) => ({ ...prev, purpose: e.target.value }))}
              className="w-full text-xs font-semibold select-luxury-beige rounded-xl p-2.5 cursor-pointer"
            >
              <option value="Gold Scheme Follow-up">Gold Scheme Follow-up (Nidhi / Dreams / Ambari)</option>
              <option value="Scheme EMI Reminder">Scheme Monthly EMI Reminder</option>
              <option value="Product Enquiry & Consultation">Product Enquiry & Consultation</option>
              <option value="Custom Jewellery Order">Custom Jewellery / Bridal Order</option>
              <option value="Old Gold Exchange Inquiry">Old Gold Exchange Valuation</option>
              <option value="New Launch & Festive Offer">New Collection / Festive Offer Promo</option>
              <option value="Post-Purchase Feedback">Post-Purchase Feedback</option>
              <option value="General Follow-up">General Customer Follow-up</option>
              <option value="Other">Other Purpose</option>
            </select>
          </div>

          {/* Discussion Notes */}
          <div>
            <label className="block text-xs font-semibold text-[#1D1D1B] mb-1.5">Discussion Notes / Remarks</label>
            <textarea
              rows={2}
              placeholder="e.g. Discussed Golden Nidhi 11-month plan, customer requested callback on weekend..."
              value={callForm.notes}
              onChange={(e) => setCallForm((prev) => ({ ...prev, notes: e.target.value }))}
              className="w-full text-xs font-semibold select-luxury-beige rounded-xl p-2.5 resize-none"
            />
          </div>
        </form>
      </Modal>

      {/* Modal: Add Scheme Record */}
      <Modal
        isOpen={showAddSchemeModal}
        onClose={() => setShowAddSchemeModal(false)}
        title="Record Gold Scheme Subscription"
        subtitle={`Log monthly savings schemes closed by ${employee.full_name}`}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Scheme Plan Name */}
            <div>
              <label className="block text-xs font-semibold text-[#1D1D1B] mb-1.5">Scheme Plan Name *</label>
              <select
                value={schemeName}
                onChange={(e) => setSchemeName(e.target.value)}
                className="w-full text-xs font-semibold select-luxury-beige rounded-xl p-2.5 cursor-pointer"
              >
                {SCHEMES.map((sch) => (
                  <option key={sch} value={sch}>
                    {sch}
                  </option>
                ))}
              </select>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {SCHEMES.map((sch) => (
                  <button
                    key={sch}
                    type="button"
                    onClick={() => setSchemeName(sch)}
                    className={`px-2 py-1 text-[10px] font-bold rounded-lg border transition-all text-left ${
                      schemeName === sch
                        ? 'bg-[#FEF3C7] border-[#D97706] text-[#92400E] shadow-2xs font-extrabold'
                        : 'bg-white border-[#E4DFD4] text-[#5E5A52] hover:bg-[#FAF8F3]'
                    }`}
                  >
                    {schemeName === sch ? '✓ ' : ''}{sch}
                  </button>
                ))}
              </div>
            </div>

            {/* Customers Count Dropdown */}
            <Select
              label="Number of Customers Enrolled *"
              value={schemeCustomersCount.toString()}
              onChange={(e) => setSchemeCustomersCount(parseInt(e.target.value))}
              options={Array.from({ length: 15 }, (_, i) => ({
                value: (i + 1).toString(),
                label: `${i + 1} Customer${i > 0 ? 's' : ''}`,
              }))}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Total Subscription Amount (₹) *"
              type="number"
              value={schemeAmount}
              onChange={(e) => setSchemeAmount(e.target.value)}
              placeholder="e.g. 5000"
              required
            />
            <Input
              label="Registration Date"
              type="date"
              value={schemeDate}
              onChange={(e) => setSchemeDate(e.target.value)}
            />
          </div>

          <Input
            label="Remarks / Passbook / Customer Details"
            value={schemeNotes}
            onChange={(e) => setSchemeNotes(e.target.value)}
            placeholder="e.g. Passbook #SSG-8821, Customer Mrs. Lakshmi"
          />
        </form>
      </Modal>

      {/* Modal: Add Google Review */}
      <Modal
        isOpen={showAddReviewModal}
        onClose={() => setShowAddReviewModal(false)}
        title="Record Google Review"
        subtitle={`Log customer reviews mentioning ${employee.full_name}`}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Number of Customers */}
            <Select
              label="Number of Customers *"
              value={(newReviewForm.customers_count || 1).toString()}
              onChange={(e) => setNewReviewForm({ ...newReviewForm, customers_count: parseInt(e.target.value) })}
              options={Array.from({ length: 10 }, (_, i) => ({
                value: (i + 1).toString(),
                label: `${i + 1} Customer${i > 0 ? 's' : ''}`,
              }))}
            />

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
          </div>

          <Input
            label="Review Date"
            type="date"
            value={newReviewForm.review_date}
            onChange={(e) => setNewReviewForm({ ...newReviewForm, review_date: e.target.value })}
          />

          <Input
            label="Review Text / Feedback *"
            value={newReviewForm.review_text}
            onChange={(e) => setNewReviewForm({ ...newReviewForm, review_text: e.target.value })}
            placeholder="e.g. Wonderful service by staff, great gold collection!"
            required
          />

          <Input
            label="Customer Name / Details (Optional)"
            value={newReviewForm.notes}
            onChange={(e) => setNewReviewForm({ ...newReviewForm, notes: e.target.value })}
            placeholder="e.g. Ananya Sharma from Yelahanka"
          />
        </form>
      </Modal>

      {/* Modal: Upload Daily Form Media */}
      <Modal
        isOpen={showUploadFormModal}
        onClose={() => setShowUploadFormModal(false)}
        title="Upload Daily Closing Form / Sheet"
        subtitle={`Upload single camera snapshot or document for ${employee.full_name} (Max 2.5 MB)`}
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
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-[#262626]">Capture / Choose 1 Image *</label>
              <span className="text-[10px] font-bold text-[#C9A227] bg-[#FAF6EB] px-2 py-0.5 rounded-md border border-[#EEDFA8]">
                Below 2.5 MB only
              </span>
            </div>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileChange}
              className="w-full text-xs file-input-upload rounded-xl p-2"
              required
            />
          </div>

          {previewUrl && (
            <div className="rounded-xl border border-[#E8E6E1] overflow-hidden aspect-video max-h-48 bg-[#FAF9F6] flex items-center justify-center">
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

      {/* Modal: Edit Scheme Record */}
      <Modal
        isOpen={showEditSchemeModal}
        onClose={() => {
          setShowEditSchemeModal(false);
          setEditingScheme(null);
        }}
        title="Edit Gold Scheme Subscription"
        subtitle={`Update savings scheme closed by ${employee.full_name}`}
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setShowEditSchemeModal(false);
                setEditingScheme(null);
              }}
            >
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleUpdateScheme} isLoading={submittingAction}>
              Save Changes
            </Button>
          </>
        }
      >
        <form onSubmit={handleUpdateScheme} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Scheme Plan Name */}
            <div>
              <label className="block text-xs font-semibold text-[#1D1D1B] mb-1.5">Scheme Plan Name *</label>
              <select
                value={schemeName}
                onChange={(e) => setSchemeName(e.target.value)}
                className="w-full text-xs font-semibold select-luxury-beige rounded-xl p-2.5 cursor-pointer"
              >
                {SCHEMES.map((sch) => (
                  <option key={sch} value={sch}>
                    {sch}
                  </option>
                ))}
              </select>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {SCHEMES.map((sch) => (
                  <button
                    key={sch}
                    type="button"
                    onClick={() => setSchemeName(sch)}
                    className={`px-2 py-1 text-[10px] font-bold rounded-lg border transition-all text-left ${
                      schemeName === sch
                        ? 'bg-[#FEF3C7] border-[#D97706] text-[#92400E] shadow-2xs font-extrabold'
                        : 'bg-white border-[#E4DFD4] text-[#5E5A52] hover:bg-[#FAF8F3]'
                    }`}
                  >
                    {schemeName === sch ? '✓ ' : ''}{sch}
                  </button>
                ))}
              </div>
            </div>

            {/* Customers Count Dropdown */}
            <Select
              label="Number of Customers Enrolled *"
              value={schemeCustomersCount.toString()}
              onChange={(e) => setSchemeCustomersCount(parseInt(e.target.value))}
              options={Array.from({ length: 15 }, (_, i) => ({
                value: (i + 1).toString(),
                label: `${i + 1} Customer${i > 0 ? 's' : ''}`,
              }))}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Total Subscription Amount (₹) *"
              type="number"
              value={schemeAmount}
              onChange={(e) => setSchemeAmount(e.target.value)}
              placeholder="e.g. 5000"
              required
            />
            <Input
              label="Registration Date"
              type="date"
              value={schemeDate}
              onChange={(e) => setSchemeDate(e.target.value)}
            />
          </div>

          <Input
            label="Remarks / Passbook / Customer Details"
            value={schemeNotes}
            onChange={(e) => setSchemeNotes(e.target.value)}
            placeholder="e.g. Passbook #SSG-8821, Customer Mrs. Lakshmi"
          />
        </form>
      </Modal>

      {/* Modal: Edit Google Review */}
      <Modal
        isOpen={showEditReviewModal}
        onClose={() => {
          setShowEditReviewModal(false);
          setEditingReview(null);
        }}
        title="Edit Google Review"
        subtitle={`Update customer review mentioning ${employee.full_name}`}
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setShowEditReviewModal(false);
                setEditingReview(null);
              }}
            >
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleUpdateGoogleReview} isLoading={submittingAction}>
              Save Changes
            </Button>
          </>
        }
      >
        <form onSubmit={handleUpdateGoogleReview} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Number of Customers */}
            <Select
              label="Number of Customers *"
              value={(newReviewForm.customers_count || 1).toString()}
              onChange={(e) => setNewReviewForm({ ...newReviewForm, customers_count: parseInt(e.target.value) })}
              options={Array.from({ length: 10 }, (_, i) => ({
                value: (i + 1).toString(),
                label: `${i + 1} Customer${i > 0 ? 's' : ''}`,
              }))}
            />

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
          </div>

          <Input
            label="Review Date"
            type="date"
            value={newReviewForm.review_date}
            onChange={(e) => setNewReviewForm({ ...newReviewForm, review_date: e.target.value })}
          />

          <Input
            label="Review Text / Feedback *"
            value={newReviewForm.review_text}
            onChange={(e) => setNewReviewForm({ ...newReviewForm, review_text: e.target.value })}
            placeholder="e.g. Wonderful service by staff, great gold collection!"
            required
          />

          <Input
            label="Customer Name / Details (Optional)"
            value={newReviewForm.notes}
            onChange={(e) => setNewReviewForm({ ...newReviewForm, notes: e.target.value })}
            placeholder="e.g. Ananya Sharma from Yelahanka"
          />
        </form>
      </Modal>

      {/* Modal: Add / Edit Customer Feedback */}
      <Modal
        isOpen={showFeedbackModal}
        onClose={() => {
          setShowFeedbackModal(false);
          setEditingFeedback(null);
        }}
        title={editingFeedback ? "Edit Customer Feedback" : "Record Customer Feedback"}
        subtitle={
          editingFeedback
            ? `Update showroom feedback record for ${employee.full_name}`
            : `Log direct customer review & satisfaction score for ${employee.full_name}`
        }
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setShowFeedbackModal(false);
                setEditingFeedback(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSaveFeedback}
              isLoading={submittingAction}
              className="bg-[#23815F] hover:bg-[#1C694D]"
            >
              {editingFeedback ? 'Save Changes' : 'Record Feedback'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSaveFeedback} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Customer Name *"
              value={feedbackForm.customer_name}
              onChange={(e) => setFeedbackForm({ ...feedbackForm, customer_name: e.target.value })}
              placeholder="e.g. Ramesh Kumar"
              required
              autoFocus
            />

            <Input
              label="Customer Phone (Optional)"
              value={feedbackForm.customer_phone}
              onChange={(e) => setFeedbackForm({ ...feedbackForm, customer_phone: e.target.value })}
              placeholder="e.g. 9876543210"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#171717] mb-1.5">
                Rating Score *
              </label>
              <div className="flex items-center gap-1.5 p-2 bg-[#FAF9F6] border border-[#E8E6E1] rounded-xl">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setFeedbackForm({ ...feedbackForm, rating: star })}
                    className="p-1 hover:scale-110 transition-transform"
                    title={`${star} Star${star > 1 ? 's' : ''}`}
                  >
                    <Star
                      className={`w-6 h-6 ${
                        star <= feedbackForm.rating
                          ? 'fill-[#23815F] text-[#23815F]'
                          : 'text-[#D4D4D8] hover:text-[#A1A1AA]'
                      }`}
                    />
                  </button>
                ))}
                <span className="text-xs font-bold text-[#23815F] ml-auto pr-1">
                  {feedbackForm.rating}.0 / 5
                </span>
              </div>
            </div>

            <Select
              label="Feedback Category *"
              value={feedbackForm.category}
              onChange={(e) => setFeedbackForm({ ...feedbackForm, category: e.target.value })}
              options={[
                { value: 'Customer Service', label: 'Customer Service & Politeness' },
                { value: 'Product Knowledge', label: 'Product Knowledge & Guidance' },
                { value: 'Billing & Transparency', label: 'Billing & Transparency' },
                { value: 'Showroom Ambience', label: 'Showroom Ambience' },
                { value: 'Gold Scheme Explanation', label: 'Gold Scheme Explanation' },
                { value: 'General Experience', label: 'General Experience' },
              ]}
            />

            <Input
              label="Feedback Date *"
              type="date"
              value={feedbackForm.feedback_date}
              onChange={(e) => setFeedbackForm({ ...feedbackForm, feedback_date: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#171717] mb-1.5">
              Customer Feedback / Review Statement *
            </label>
            <textarea
              className="w-full px-3.5 py-2.5 text-xs bg-white border border-[#E8E6E1] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#23815F] focus:border-transparent transition-all placeholder:text-[#A3A3A3]"
              rows={3}
              value={feedbackForm.feedback_text}
              onChange={(e) => setFeedbackForm({ ...feedbackForm, feedback_text: e.target.value })}
              placeholder="e.g. Excellent attention and polite behavior by the executive. Explained the gold rate calculation very clearly!"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Verification Status"
              value={feedbackForm.status}
              onChange={(e) => setFeedbackForm({ ...feedbackForm, status: e.target.value })}
              options={[
                { value: 'Verified', label: 'Verified Direct Feedback' },
                { value: 'Follow-up Required', label: 'Follow-up Required' },
                { value: 'Resolved', label: 'Resolved Customer Note' },
              ]}
            />

            <Input
              label="Manager / Internal Note (Optional)"
              value={feedbackForm.notes}
              onChange={(e) => setFeedbackForm({ ...feedbackForm, notes: e.target.value })}
              placeholder="e.g. Attended counter 2, purchased 8g chain"
            />
          </div>
        </form>
      </Modal>

      {/* Modal: Edit Form Media Details */}
      <Modal
        isOpen={showEditFormMediaModal}
        onClose={() => {
          setShowEditFormMediaModal(false);
          setEditingFormMedia(null);
        }}
        title="Edit Closing Form Details"
        subtitle={`Update form category and remarks for ${employee.full_name}`}
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setShowEditFormMediaModal(false);
                setEditingFormMedia(null);
              }}
            >
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleUpdateFormMedia} isLoading={isUploading}>
              Save Changes
            </Button>
          </>
        }
      >
        <form onSubmit={handleUpdateFormMedia} className="space-y-4">
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

          <Input
            label="Remarks / Notes (Optional)"
            value={uploadNotes}
            onChange={(e) => setUploadNotes(e.target.value)}
            placeholder="e.g. End of day counter reconciliation"
          />
        </form>
      </Modal>

      {/* Confirm Deletion Dialog */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        title={`Delete ${
          deleteTarget?.type === 'customer'
            ? 'Customer Activity'
            : deleteTarget?.type === 'scheme'
            ? 'Scheme Record'
            : deleteTarget?.type === 'review'
            ? 'Google Review'
            : deleteTarget?.type === 'feedback'
            ? 'Customer Feedback'
            : 'Form Document'
        }`}
        message={`Are you sure you want to delete "${deleteTarget?.title}"? This record will be permanently removed.`}
        confirmText="Delete Record"
        cancelText="Cancel"
        variant="danger"
        isLoading={isDeletingTarget}
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteTarget(null)}
      />

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
            <div>
              <label className="block text-xs font-semibold text-[#1D1D1B] mb-1.5">Interested Scheme</label>
              <select
                value={newOutdoorCustForm.scheme_name}
                onChange={(e) => setNewOutdoorCustForm({ ...newOutdoorCustForm, scheme_name: e.target.value })}
                className="w-full text-xs font-semibold select-luxury-beige rounded-xl p-2.5 cursor-pointer"
              >
                <option value="">None / General Inquiry</option>
                {SCHEMES.map((sch) => (
                  <option key={sch} value={sch}>
                    {sch}
                  </option>
                ))}
              </select>
              <div className="flex flex-wrap gap-1 mt-1.5">
                {SCHEMES.map((sch) => (
                  <button
                    key={sch}
                    type="button"
                    onClick={() => setNewOutdoorCustForm({ ...newOutdoorCustForm, scheme_name: sch })}
                    className={`px-2 py-0.5 text-[9px] font-bold rounded-lg border transition-all ${
                      newOutdoorCustForm.scheme_name === sch
                        ? 'bg-[#FEF3C7] border-[#D97706] text-[#92400E]'
                        : 'bg-white border-[#E4DFD4] text-[#5E5A52]'
                    }`}
                  >
                    {newOutdoorCustForm.scheme_name === sch ? '✓ ' : ''}{sch}
                  </button>
                ))}
              </div>
            </div>
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
          <div>
            <label className="block text-xs font-semibold text-[#1D1D1B] mb-1.5">Scheme Plan Name *</label>
            <select
              value={newOutdoorSchemeForm.scheme_name}
              onChange={(e) => setNewOutdoorSchemeForm({ ...newOutdoorSchemeForm, scheme_name: e.target.value })}
              className="w-full text-xs font-semibold select-luxury-beige rounded-xl p-2.5 cursor-pointer"
              required
            >
              {SCHEMES.map((sch) => (
                <option key={sch} value={sch}>
                  {sch}
                </option>
              ))}
            </select>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {SCHEMES.map((sch) => (
                <button
                  key={sch}
                  type="button"
                  onClick={() => setNewOutdoorSchemeForm({ ...newOutdoorSchemeForm, scheme_name: sch })}
                  className={`px-2 py-1 text-[10px] font-bold rounded-lg border transition-all ${
                    newOutdoorSchemeForm.scheme_name === sch
                      ? 'bg-[#FEF3C7] border-[#D97706] text-[#92400E] shadow-2xs font-extrabold'
                      : 'bg-white border-[#E4DFD4] text-[#5E5A52]'
                  }`}
                >
                  {newOutdoorSchemeForm.scheme_name === sch ? '✓ ' : ''}{sch}
                </button>
              ))}
            </div>
          </div>
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
            <img src={getMediaUrl(viewImageModalUrl)} alt="Full size" className="max-h-[80vh] w-auto mx-auto object-contain rounded-xl" />
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
