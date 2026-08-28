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
  ChevronDown,
  ChevronUp,
  ChevronRight,
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
import { getMediaUrl } from '../../utils/media';

export const EmployeeDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();

  const [employee, setEmployee] = useState<EmployeeDetail | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>('customers');
  const [showEditModal, setShowEditModal] = useState<boolean>(false);

  // Helper: parse breakdown string into array of statuses
  const parseBreakdown = (breakdownStr?: string | null, count: number = 1): string[] => {
    if (!breakdownStr) {
      return Array.from({ length: count }, () => 'Attended');
    }
    const parts = breakdownStr.split('|').map((s) => s.trim());
    const statuses = parts.map((part) => {
      const colonIdx = part.indexOf(':');
      if (colonIdx !== -1) {
        return part.substring(colonIdx + 1).trim();
      }
      return part;
    });
    while (statuses.length < count) {
      statuses.push('Attended');
    }
    return statuses.slice(0, count);
  };

  // 1. Customer Activity State
  const [customerActivities, setCustomerActivities] = useState<CustomerActivity[]>([]);
  const [showAddCustomerModal, setShowAddCustomerModal] = useState<boolean>(false);
  const [customerCount, setCustomerCount] = useState<number>(1);
  const [customerStatuses, setCustomerStatuses] = useState<string[]>(['Attended']);
  const [customerActivityDate, setCustomerActivityDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [customerActivityNotes, setCustomerActivityNotes] = useState<string>('');

  const [editingCustomerActivity, setEditingCustomerActivity] = useState<CustomerActivity | null>(null);
  const [showEditCustomerModal, setShowEditCustomerModal] = useState<boolean>(false);

  const handleCustomerCountChange = (count: number) => {
    setCustomerCount(count);
    setCustomerStatuses((prev) => {
      const updated = [...prev];
      while (updated.length < count) {
        updated.push('Attended');
      }
      return updated.slice(0, count);
    });
  };

  const handleCustomerStatusItemChange = (index: number, newStatus: string) => {
    setCustomerStatuses((prev) => {
      const updated = [...prev];
      updated[index] = newStatus;
      return updated;
    });
  };

  const openEditCustomerModal = (act: CustomerActivity) => {
    setEditingCustomerActivity(act);
    const count = act.customers_count || 1;
    setCustomerCount(count);
    setCustomerStatuses(parseBreakdown(act.breakdown, count));
    setCustomerActivityDate(act.activity_date);
    setCustomerActivityNotes(act.notes || '');
    setShowEditCustomerModal(true);
  };

  // 2. Schemes List & Modal State
  const [schemes, setSchemes] = useState<SchemeRecord[]>([]);
  const [showAddSchemeModal, setShowAddSchemeModal] = useState<boolean>(false);
  const [schemeName, setSchemeName] = useState<string>('Siri Samruddhi Gold Monthly Scheme');
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
    type: 'customer' | 'scheme' | 'review' | 'form' | 'attire';
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
      console.error('Failed to load sub-tab data:', err);
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
    if (!id) return;

    setSubmittingAction(true);
    try {
      const breakdownSummary = customerStatuses
        .map((st, idx) => `Customer #${idx + 1}: ${st}`)
        .join(' | ');
      const counts = customerStatuses.reduce((acc: Record<string, number>, curr) => {
        acc[curr] = (acc[curr] || 0) + 1;
        return acc;
      }, {});
      const primaryStatus = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Attended';

      await api.post('/api/v1/customers', {
        employee_id: parseInt(id),
        customers_count: customerCount,
        status: primaryStatus,
        breakdown: breakdownSummary,
        customer_name: `Customer Interactions (${customerCount})`,
        phone_number: '',
        activity_date: customerActivityDate,
        notes: customerActivityNotes.trim() || null,
      });

      success(`Recorded activity for ${customerCount} customer${customerCount > 1 ? 's' : ''}.`);
      setShowAddCustomerModal(false);
      setCustomerCount(1);
      setCustomerStatuses(['Attended']);
      setCustomerActivityNotes('');
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

  // Handler: Update Customer Activity (PATCH / PUT)
  const handleUpdateCustomerActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomerActivity) return;
    setSubmittingAction(true);
    try {
      const breakdownSummary = customerStatuses
        .map((st, idx) => `Customer #${idx + 1}: ${st}`)
        .join(' | ');
      const counts = customerStatuses.reduce((acc: Record<string, number>, curr) => {
        acc[curr] = (acc[curr] || 0) + 1;
        return acc;
      }, {});
      const primaryStatus = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Attended';

      await api.patch(`/api/v1/customers/${editingCustomerActivity.id}`, {
        customers_count: customerCount,
        status: primaryStatus,
        breakdown: breakdownSummary,
        customer_name: `Customer Interactions (${customerCount})`,
        activity_date: customerActivityDate,
        notes: customerActivityNotes.trim() || null,
      });

      success('Customer activity updated successfully.');
      setShowEditCustomerModal(false);
      setEditingCustomerActivity(null);
      fetchEmployeeData();
      fetchTabContent();
    } catch (err: any) {
      toastError(err.response?.data?.detail || 'Failed to update customer activity.');
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

      {/* =========================================================
          CONTENT RENDERERS FOR EACH SECTION
      ========================================================= */}
      {(() => {
        // Content Renderer: Customer Activity
        const renderCustomersContent = () => (
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
                {/* Mobile Card List */}
                <div className="sm:hidden divide-y divide-[#F0EFEA]">
                  {customerActivities.map((act) => {
                    const count = act.customers_count || 1;
                    return (
                      <div key={act.id} className="p-3.5 space-y-2 bg-white">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-[#171717] flex items-center gap-1.5">
                            <span>{count} Customer{count > 1 ? 's' : ''} Attended</span>
                          </span>
                          <div className="flex items-center gap-1">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                act.status === 'Closed'
                                  ? 'bg-[#EAF7F1] text-[#16845B] border border-[#C1ECD9]'
                                  : act.status === 'In Hold Jewellery'
                                  ? 'bg-[#EEF2FF] text-[#4338CA] border border-[#C7D2FE]'
                                  : act.status === 'Follow Up Needed'
                                  ? 'bg-[#FFF1F2] text-[#BE123C] border border-[#FECDD3]'
                                  : 'bg-[#FAF6EB] text-[#8B6D1B] border border-[#EEDFA8]'
                              }`}
                            >
                              {act.status}
                            </span>
                            <button
                              onClick={() => openEditCustomerModal(act)}
                              className="p-1 text-[#737373] hover:text-[#536B8A] hover:bg-[#F0F4F8] rounded-md transition-colors"
                              title="Edit Activity"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeleteTarget({ type: 'customer', id: act.id, title: `${act.activity_date} (${count} Customers)` })}
                              className="p-1 text-[#A3A3A3] hover:text-[#C24141] hover:bg-[#FDECEC] rounded-md transition-colors"
                              title="Delete Activity"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {act.breakdown && (
                          <p className="text-[10px] text-[#536B8A] bg-[#F0F4F8] px-2.5 py-1 rounded-lg font-mono">
                            {act.breakdown}
                          </p>
                        )}

                        <div className="flex items-center justify-between text-[11px] text-[#737373]">
                          <span>Date: {act.activity_date}</span>
                        </div>

                        {act.notes && (
                          <p className="text-[11px] text-[#525252] bg-[#FAF9F6] p-2 rounded-lg">
                            <strong className="text-[#171717]">Notes:</strong> {act.notes}
                          </p>
                        )}
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
                        <th className="px-5 py-3.5">Customers Attended</th>
                        <th className="px-5 py-3.5">Interaction Status / Breakdown</th>
                        <th className="px-5 py-3.5">Customer Details & Notes</th>
                        <th className="px-5 py-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F0EFEA] font-medium">
                      {customerActivities.map((act) => {
                        const count = act.customers_count || 1;
                        return (
                          <tr key={act.id} className="hover:bg-[#FAF9F6] transition-colors">
                            <td className="px-5 py-3.5 font-semibold text-[#171717]">{act.activity_date}</td>
                            <td className="px-5 py-3.5">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-[#EDF2F7] text-[#536B8A] border border-[#C5D5E6]">
                                <UserCheck className="w-3.5 h-3.5 text-[#536B8A]" />
                                <span>{count} Customer{count > 1 ? 's' : ''}</span>
                              </span>
                            </td>
                            <td className="px-5 py-3.5 space-y-1">
                              <div>
                                <span
                                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                                    act.status === 'Closed'
                                      ? 'bg-[#EAF7F1] text-[#16845B] border border-[#C1ECD9]'
                                      : act.status === 'In Hold Jewellery'
                                      ? 'bg-[#EEF2FF] text-[#4338CA] border border-[#C7D2FE]'
                                      : act.status === 'Follow Up Needed'
                                      ? 'bg-[#FFF1F2] text-[#BE123C] border border-[#FECDD3]'
                                      : 'bg-[#FAF6EB] text-[#8B6D1B] border border-[#EEDFA8]'
                                  }`}
                                >
                                  {act.status}
                                </span>
                              </div>
                              {act.breakdown && (
                                <p className="text-[11px] text-[#737373] font-mono">{act.breakdown}</p>
                              )}
                            </td>
                            <td className="px-5 py-3.5 text-[#525252] max-w-xs">{act.notes || '—'}</td>
                            <td className="px-5 py-3.5 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => openEditCustomerModal(act)}
                                  className="p-1 text-[#737373] hover:text-[#536B8A] hover:bg-[#F0F4F8] rounded-md transition-colors"
                                  title="Edit Activity"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => setDeleteTarget({ type: 'customer', id: act.id, title: `${act.activity_date} (${count} Customers)` })}
                                  className="p-1 text-[#A3A3A3] hover:text-[#C24141] hover:bg-[#FDECEC] rounded-md transition-colors"
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
                      {rev.notes && <span className="truncate max-w-[160px]">Note: {rev.notes}</span>}
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
                onClick={() => setShowAddCustomerModal(true)}
                leftIcon={<Plus className="w-3.5 h-3.5" />}
                className="text-xs shadow-2xs w-full sm:w-auto"
              >
                + Log Customer Activity
              </Button>
            ),
            content: renderCustomersContent(),
          },
          {
            key: 'schemes',
            label: 'Schemes Closed',
            count: employee.schemes_closed_count,
            subtitle: 'Gold & savings plan enrollments',
            icon: Award,
            actionButton: (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowAddSchemeModal(true)}
                leftIcon={<Plus className="w-3.5 h-3.5" />}
                className="text-xs shadow-2xs w-full sm:w-auto"
              >
                + Add Scheme Record
              </Button>
            ),
            content: renderSchemesContent(),
          },
          {
            key: 'reviews',
            label: 'Google Reviews',
            count: employee.google_reviews_count || googleReviews.length,
            subtitle: '5-star customer feedback',
            icon: Star,
            actionButton: (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowAddReviewModal(true)}
                leftIcon={<Star className="w-3.5 h-3.5" />}
                className="text-xs shadow-2xs w-full sm:w-auto"
              >
                + Add Google Review
              </Button>
            ),
            content: renderReviewsContent(),
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

      {/* Modal: Add Customer Activity */}
      <Modal
        isOpen={showAddCustomerModal}
        onClose={() => setShowAddCustomerModal(false)}
        title="Log Customer Activity"
        subtitle={`Record customer walk-ins & inquiry interactions attended by ${employee.full_name}`}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Numbers Dropdown: How many customers attended */}
            <Select
              label="How many customers attended? *"
              value={customerCount.toString()}
              onChange={(e) => handleCustomerCountChange(parseInt(e.target.value))}
              options={Array.from({ length: 15 }, (_, i) => ({
                value: (i + 1).toString(),
                label: `${i + 1} Customer${i > 0 ? 's' : ''}`,
              }))}
            />

            {/* Interaction Date */}
            <Input
              label="Interaction Date *"
              type="date"
              value={customerActivityDate}
              onChange={(e) => setCustomerActivityDate(e.target.value)}
              required
            />
          </div>

          {/* Dynamic Status Dropdowns for Each Number of Customer */}
          <div className="space-y-2.5 bg-[#FAF9F6] p-3.5 rounded-2xl border border-[#E8E6E1]">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#1D1D1B]">
                Status for Each Customer ({customerCount})
              </label>
              <span className="text-[11px] text-[#737373]">Select individual result</span>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {customerStatuses.map((statusVal, idx) => (
                <div key={idx} className="flex items-center justify-between gap-3 bg-white p-2.5 rounded-xl border border-[#E8E6E1]">
                  <span className="text-xs font-bold text-[#536B8A] shrink-0 w-24">
                    Customer #{idx + 1}:
                  </span>
                  <select
                    value={statusVal}
                    onChange={(e) => handleCustomerStatusItemChange(idx, e.target.value)}
                    className="flex-1 text-xs font-semibold bg-[#FAF9F6] border border-[#E8E6E1] rounded-lg px-2.5 py-1.5 text-[#1D1D1B] focus:outline-none focus:border-[#536B8A]"
                  >
                    <option value="Attended">Attended (Inquiry / Walk-in)</option>
                    <option value="Closed">Closed (Purchased / Sold)</option>
                    <option value="In Hold Jewellery">In Hold Jewellery (Item on Hold)</option>
                    <option value="Follow Up Needed">Follow Up Needed</option>
                  </select>
                </div>
              ))}
            </div>
          </div>

          {/* Notes: Customer Details and Inquiries */}
          <div>
            <label className="block text-xs font-semibold text-[#1D1D1B] mb-1.5">
              Customer Details & Remarks (Optional)
            </label>
            <textarea
              rows={3}
              value={customerActivityNotes}
              onChange={(e) => setCustomerActivityNotes(e.target.value)}
              placeholder="e.g. Customer #1: Ramesh looked at gold bangles; Customer #2: Geetha booked 22kt bridal set on hold"
              className="w-full text-xs bg-white border border-[#E8E6E1] rounded-xl p-2.5 text-[#1D1D1B] placeholder:text-[#8A8479] focus:outline-none focus:border-[#536B8A] focus:ring-2 focus:ring-[#536B8A]/10 font-medium"
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
                className="w-full text-xs font-semibold bg-[#FAF9F6] border border-[#E8E6E1] rounded-xl p-2.5 text-[#1D1D1B] focus:outline-none focus:border-[#536B8A]"
              >
                <option value="Siri Samruddhi Gold Monthly Scheme">Siri Samruddhi Gold Monthly Scheme</option>
                <option value="Swarna Nidhi 11-Month Gold Plan">Swarna Nidhi 11-Month Gold Plan</option>
                <option value="Diamond Digi Savings Scheme">Diamond Digi Savings Scheme</option>
                <option value="Bridal Gold Advance Booking Plan">Bridal Gold Advance Booking Plan</option>
                <option value="Dhanavruddhi Gold Coin Scheme">Dhanavruddhi Gold Coin Scheme</option>
              </select>
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

      {/* Modal: Edit Customer Activity */}
      <Modal
        isOpen={showEditCustomerModal}
        onClose={() => {
          setShowEditCustomerModal(false);
          setEditingCustomerActivity(null);
        }}
        title="Edit Customer Activity"
        subtitle={`Update customer count, status breakdown, date or remarks for ${employee.full_name}`}
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setShowEditCustomerModal(false);
                setEditingCustomerActivity(null);
              }}
            >
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleUpdateCustomerActivity} isLoading={submittingAction}>
              Save Changes
            </Button>
          </>
        }
      >
        <form onSubmit={handleUpdateCustomerActivity} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Numbers Dropdown: How many customers attended */}
            <Select
              label="How many customers attended? *"
              value={customerCount.toString()}
              onChange={(e) => handleCustomerCountChange(parseInt(e.target.value))}
              options={Array.from({ length: 15 }, (_, i) => ({
                value: (i + 1).toString(),
                label: `${i + 1} Customer${i > 0 ? 's' : ''}`,
              }))}
            />

            {/* Interaction Date */}
            <Input
              label="Interaction Date *"
              type="date"
              value={customerActivityDate}
              onChange={(e) => setCustomerActivityDate(e.target.value)}
              required
            />
          </div>

          {/* Dynamic Status Dropdowns for Each Number of Customer */}
          <div className="space-y-2.5 bg-[#FAF9F6] p-3.5 rounded-2xl border border-[#E8E6E1]">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#1D1D1B]">
                Status for Each Customer ({customerCount})
              </label>
              <span className="text-[11px] text-[#737373]">Select individual result</span>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {customerStatuses.map((statusVal, idx) => (
                <div key={idx} className="flex items-center justify-between gap-3 bg-white p-2.5 rounded-xl border border-[#E8E6E1]">
                  <span className="text-xs font-bold text-[#536B8A] shrink-0 w-24">
                    Customer #{idx + 1}:
                  </span>
                  <select
                    value={statusVal}
                    onChange={(e) => handleCustomerStatusItemChange(idx, e.target.value)}
                    className="flex-1 text-xs font-semibold bg-[#FAF9F6] border border-[#E8E6E1] rounded-lg px-2.5 py-1.5 text-[#1D1D1B] focus:outline-none focus:border-[#536B8A]"
                  >
                    <option value="Attended">Attended (Inquiry / Walk-in)</option>
                    <option value="Closed">Closed (Purchased / Sold)</option>
                    <option value="In Hold Jewellery">In Hold Jewellery (Item on Hold)</option>
                    <option value="Follow Up Needed">Follow Up Needed</option>
                  </select>
                </div>
              ))}
            </div>
          </div>

          {/* Notes: Customer Details and Inquiries */}
          <div>
            <label className="block text-xs font-semibold text-[#1D1D1B] mb-1.5">
              Customer Details & Remarks (Optional)
            </label>
            <textarea
              rows={3}
              value={customerActivityNotes}
              onChange={(e) => setCustomerActivityNotes(e.target.value)}
              placeholder="e.g. Customer #1: Ramesh looked at gold bangles; Customer #2: Geetha booked 22kt bridal set on hold"
              className="w-full text-xs bg-white border border-[#E8E6E1] rounded-xl p-2.5 text-[#1D1D1B] placeholder:text-[#8A8479] focus:outline-none focus:border-[#536B8A] focus:ring-2 focus:ring-[#536B8A]/10 font-medium"
            />
          </div>
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
                className="w-full text-xs font-semibold bg-[#FAF9F6] border border-[#E8E6E1] rounded-xl p-2.5 text-[#1D1D1B] focus:outline-none focus:border-[#536B8A]"
              >
                <option value="Siri Samruddhi Gold Monthly Scheme">Siri Samruddhi Gold Monthly Scheme</option>
                <option value="Swarna Nidhi 11-Month Gold Plan">Swarna Nidhi 11-Month Gold Plan</option>
                <option value="Diamond Digi Savings Scheme">Diamond Digi Savings Scheme</option>
                <option value="Bridal Gold Advance Booking Plan">Bridal Gold Advance Booking Plan</option>
                <option value="Dhanavruddhi Gold Coin Scheme">Dhanavruddhi Gold Coin Scheme</option>
              </select>
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
