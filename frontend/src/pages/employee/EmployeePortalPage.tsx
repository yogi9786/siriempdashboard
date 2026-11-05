import React, { useEffect, useState } from 'react';
import {
  Compass,
  MapPin,
  Save,
  Users,
  User,
  Phone,
  Calendar,
  IndianRupee,
  Plus,
  Clock,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  Sparkles,
  LogOut,
  PhoneCall,
  Check,
  Trash2,
  Gift,
  Star,
  Award,
  MessageSquareHeart,
  ChevronLeft,
  ChevronRight,
  Shield,
  RefreshCw,
  Info,
  Loader2,
  Edit2,
  Heart,
  Building2,
  Video,
  Play,
  UploadCloud,
  Eye,
  AlertCircle,
  ExternalLink,
  FileImage,
  Camera,
  Trophy,
  Bell,
} from 'lucide-react';
import api from '../../api/client';
import { CustomerActivity, EmployeeCallLog, EmployeeDashboardSummary, GoogleReview, VideoReview, OutdoorDuty, OutdoorCustomerDetail } from '../../types';
import { getMediaUrl } from '../../utils/media';
import { Button } from '../../components/ui/Button';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { SCHEMES, DEFAULT_SCHEME, SchemeName } from '../../constants/schemes';
import { CustomerActivityModal } from '../../components/customers/CustomerActivityModal';
import logoImg from '../../assets/siri samruddhi logo.png';

const WhatsAppIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.664-.698c.97.53 1.83.812 2.796.813 3.179 0 5.767-2.587 5.768-5.766.001-3.181-2.587-5.766-5.768-5.766zm3.376 8.212c-.144.405-.837.774-1.17.824-.312.045-.717.067-1.168-.08-.288-.094-.658-.236-1.144-.45-2.072-.913-3.414-3.033-3.518-3.173-.104-.14-1.01-1.344-1.01-2.564 0-1.22.637-1.82.863-2.066.226-.246.495-.308.66-.308.165 0 .33.003.475.01.153.008.358-.058.56.427.207.497.708 1.724.77 1.849.062.125.104.271.021.437-.083.165-.124.27-.247.416-.124.145-.262.325-.374.436-.125.124-.255.26-.11.51.145.249.645 1.062 1.385 1.722.953.849 1.756 1.112 2.004 1.237.248.125.394.104.539-.063.145-.166.621-.726.786-.975.166-.249.331-.208.558-.125.228.083 1.446.682 1.694.807.248.124.414.186.475.29.063.104.063.602-.081 1.007zM12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.98-1.306A9.957 9.957 0 0 0 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2z" />
  </svg>
);

export interface DetailedReviewItem {
  id: string | number;
  activityId: number;
  activityDate: string;
  customerName: string;
  phoneNumber?: string;
  productId?: string;
  productValue?: number | string;
  customerStatus: string;
  reviewType: 'GOOGLE' | 'VIDEO';
  rating?: number;
  reviewText?: string;
  videosCount?: number;
  videoTitle?: string;
  photoProofUrl?: string;
  approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  reviewedByName?: string;
  rejectionReason?: string;
  pointsEarned: number;
  notes?: string;
  rawActivity: CustomerActivity;
}

const getSubrecordDetails = (breakdownStr?: string | null) => {
  let hasScheme = false;
  let schemePlan = '';
  let schemeMonthly: string | number = '';
  let hasReview = false;
  let reviewRating = 5;
  let reviewText = '';
  let reviewScreenshot = '';
  let hasFeedback = false;
  let feedbackRating = 5;
  let feedbackText = '';
  let hasVideoReview = false;
  let videosCount = 1;
  let videoTitle = '';
  let videoScreenshot = '';
  let productId = '';

  if (breakdownStr) {
    try {
      const parsed = JSON.parse(breakdownStr);
      if (Array.isArray(parsed) && parsed.length > 0) {
        for (const item of parsed) {
          if (!productId && item.product_id) {
            productId = item.product_id;
          }
          if (!hasScheme && (item.has_scheme || item.scheme_name)) {
            hasScheme = true;
            schemePlan = item.scheme_name || '';
            schemeMonthly = item.scheme_amount || '';
          }
          if (!hasReview && (item.has_google_review || item.google_review_text || item.google_review_screenshot)) {
            hasReview = true;
            reviewRating = item.google_review_rating || 5;
            reviewText = item.google_review_text || '';
            reviewScreenshot = item.google_review_screenshot || item.screenshot_url || '';
          }
          if (!hasFeedback && (item.has_customer_feedback || item.feedback_text)) {
            hasFeedback = true;
            feedbackRating = item.feedback_rating || 5;
            feedbackText = item.feedback_text || '';
          }
          if (!hasVideoReview && (item.has_video_review || item.video_title || item.video_screenshot)) {
            hasVideoReview = true;
            videosCount = item.videos_count ? Number(item.videos_count) : 1;
            videoTitle = item.video_title || '';
            videoScreenshot = item.video_screenshot || item.screenshot_url || '';
          }
        }
      } else if (typeof parsed === 'object') {
        productId = parsed.product_id || '';
        hasScheme = Boolean(parsed.goldScheme?.enrolled);
        schemePlan = parsed.goldScheme?.planName || '';
        schemeMonthly = parsed.goldScheme?.monthlyAmount || '';
        hasReview = Boolean(parsed.googleReview?.submitted);
        reviewRating = parsed.googleReview?.rating || 5;
        reviewText = parsed.googleReview?.reviewText || '';
        reviewScreenshot = parsed.googleReview?.screenshot_url || '';
        hasFeedback = Boolean(parsed.feedback?.rating);
        feedbackRating = parsed.feedback?.rating || 5;
        feedbackText = parsed.feedback?.comments || '';
      }
    } catch {}
  }
  return {
    hasScheme,
    schemePlan,
    schemeMonthly,
    hasReview,
    reviewRating,
    reviewText,
    reviewScreenshot,
    hasFeedback,
    feedbackRating,
    feedbackText,
    hasVideoReview,
    videosCount,
    videoTitle,
    videoScreenshot,
    productId,
  };
};

export interface CustomerEntryState {
  id?: number;
  name: string;
  phone: string;
  dob: string;
  anniversary_date: string;
  follow_up_date: string;
  area_name: string;
  photo_url: string;
  has_google_review: boolean;
  google_review_rating: number;
  google_review_text: string;
  has_customer_feedback: boolean;
  feedback_rating: number;
  feedback_text: string;
  interested_gold: boolean;
  interested_diamond: boolean;
  interested_silver: boolean;
  is_converted?: boolean;
  notes: string;
}

export const EmployeePortalPage: React.FC = () => {
  const { user, selectedBranch, logout } = useAuth();
  const { success, error: toastError } = useToast();

  const [activeTab, setActiveTab] = useState<'CUSTOMERS' | 'CALLS' | 'REVIEWS' | 'OUTDOOR'>('CUSTOMERS');
  const [dashboardSummary, setDashboardSummary] = useState<EmployeeDashboardSummary | null>(null);

  // Reviews state & Submissions
  const [employeeGoogleReviews, setEmployeeGoogleReviews] = useState<GoogleReview[]>([]);
  const [employeeVideoReviews, setEmployeeVideoReviews] = useState<VideoReview[]>([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState<boolean>(false);
  const [reviewSearch, setReviewSearch] = useState<string>('');
  const [reviewTypeFilter, setReviewTypeFilter] = useState<'ALL' | 'GOOGLE' | 'VIDEO'>('ALL');
  const [reviewStatusFilter, setReviewStatusFilter] = useState<'ALL' | 'APPROVED' | 'PENDING' | 'REJECTED'>('ALL');

  // Modals & Proof Preview
  const [showVideoModal, setShowVideoModal] = useState<boolean>(false);
  const [viewProofUrl, setViewProofUrl] = useState<string | null>(null);
  const [isSubmittingReview, setIsSubmittingReview] = useState<boolean>(false);

  // Video Review Form
  const [videoForm, setVideoForm] = useState({
    customer_name: '',
    videos_count: 1 as 1 | 2,
    video_title: '',
    video_url: '',
    review_date: new Date().toISOString().split('T')[0],
    notes: '',
    screenshot_url: '',
    selectedFile: null as File | null,
    previewUrl: null as string | null,
  });


  // Outdoor Marketing Duty State
  const [selectedOutdoorDate, setSelectedOutdoorDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [outdoorDuty, setOutdoorDuty] = useState<OutdoorDuty | null>(null);
  const [outdoorForm, setOutdoorForm] = useState<{
    area: string;
    notes: string;
    photo_urls: string[];
    customers: CustomerEntryState[];
  }>({
    area: '',
    notes: '',
    photo_urls: [],
    customers: [],
  });
  const [isLoadingOutdoor, setIsLoadingOutdoor] = useState<boolean>(false);
  const [isSavingOutdoor, setIsSavingOutdoor] = useState<boolean>(false);
  const [isUploadingOutdoorPhoto, setIsUploadingOutdoorPhoto] = useState<boolean>(false);
  const [outdoorHistory, setOutdoorHistory] = useState<OutdoorDuty[]>([]);
  const [loadedTabs, setLoadedTabs] = useState<Record<string, boolean>>({ CUSTOMERS: true });

  // Customer activities state
  const [customerActivities, setCustomerActivities] = useState<CustomerActivity[]>([]);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState<boolean>(true);
  const [customerSearch, setCustomerSearch] = useState<string>('');
  const [customerApprovalFilter, setCustomerApprovalFilter] = useState<string>('ALL');
  const [customerStatusFilter, setCustomerStatusFilter] = useState<'ALL' | 'Sold' | 'Exchange' | 'In Hold' | 'Interested' | 'Lost'>('ALL');
  const [showCustomerModal, setShowCustomerModal] = useState<boolean>(false);

  // Notification states (Attire checks & Review approvals)
  const [showNotificationsModal, setShowNotificationsModal] = useState<boolean>(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState<boolean>(false);
  const [notificationTab, setNotificationTab] = useState<'all' | 'attire' | 'reviews'>('all');
  const [editingActivity, setEditingActivity] = useState<CustomerActivity | null>(null);

  // Call logs state
  const [callLogs, setCallLogs] = useState<EmployeeCallLog[]>([]);
  const [isLoadingCalls, setIsLoadingCalls] = useState<boolean>(true);
  const [callSearch, setCallSearch] = useState<string>('');
  const [callStatusFilter, setCallStatusFilter] = useState<string>('ALL');
  const [showAddCallModal, setShowAddCallModal] = useState<boolean>(false);
  const [isSubmittingCall, setIsSubmittingCall] = useState<boolean>(false);

  // Logout confirm modal state
  const [showLogoutModal, setShowLogoutModal] = useState<boolean>(false);

  // Call Form State
  const [callForm, setCallForm] = useState({
    customer_name: '',
    phone_number: '',
    call_status: 'Done' as 'Done' | 'Pending',
    call_date: new Date().toISOString().split('T')[0],
    call_time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
    purpose: 'Follow-up Call',
    notes: '',
  });

  // Fetch Summary
  const fetchSummary = async () => {
    try {
      const res = await api.get<EmployeeDashboardSummary>('/api/v1/employee/dashboard');
      setDashboardSummary(res.data);
    } catch (err) {
      console.error('Failed to load employee summary:', err);
    }
  };

  // Fetch Notifications (Attire checks & Review approvals)
  const fetchNotifications = async () => {
    try {
      setIsLoadingNotifications(true);
      const res = await api.get('/api/v1/employee/notifications');
      if (res.data) {
        const notifs = res.data.notifications || [];
        setNotifications(notifs);
        const lastSeen = localStorage.getItem(`emp_notif_seen_${user?.id}`);
        if (!lastSeen) {
          setUnreadCount(notifs.length);
        } else {
          const unseen = notifs.filter(
            (n: any) => new Date(n.created_at || n.date).getTime() > Number(lastSeen)
          );
          setUnreadCount(unseen.length);
        }
      }
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setIsLoadingNotifications(false);
    }
  };

  const handleOpenNotifications = () => {
    setShowNotificationsModal(true);
    localStorage.setItem(`emp_notif_seen_${user?.id}`, Date.now().toString());
    setUnreadCount(0);
    fetchNotifications();
  };

  // Fetch Customer Activities
  const fetchCustomerActivities = async () => {
    try {
      setIsLoadingCustomers(true);
      const params: Record<string, any> = {};
      if (customerApprovalFilter !== 'ALL') {
        params.approval_status = customerApprovalFilter;
      }
      if (customerStatusFilter !== 'ALL') {
        params.status = customerStatusFilter;
      }
      if (customerSearch.trim()) {
        params.search = customerSearch.trim();
      }
      const res = await api.get<CustomerActivity[]>('/api/v1/employee/customers', { params });
      setCustomerActivities(res.data);
    } catch (err) {
      console.error('Failed to load employee customer activities:', err);
      toastError('Failed to load your customer activities.');
    } finally {
      setIsLoadingCustomers(false);
    }
  };

  // Fetch Call Logs
  const fetchCallLogs = async () => {
    try {
      setIsLoadingCalls(true);
      const params: Record<string, any> = {};
      if (callStatusFilter !== 'ALL') {
        params.call_status = callStatusFilter;
      }
      if (callSearch.trim()) {
        params.search = callSearch.trim();
      }
      const res = await api.get<EmployeeCallLog[]>('/api/v1/employee/calls', { params });
      setCallLogs(res.data);
    } catch (err) {
      console.error('Failed to load employee calls:', err);
      toastError('Failed to load your call logs.');
    } finally {
      setIsLoadingCalls(false);
    }
  };

  // Fetch Employee Review Submissions & Points
  const fetchReviews = async () => {
    try {
      setIsLoadingReviews(true);
      const [gRes, vRes] = await Promise.all([
        api.get<GoogleReview[]>('/api/v1/employee/reviews/google'),
        api.get<VideoReview[]>('/api/v1/employee/reviews/video'),
      ]);
      setEmployeeGoogleReviews(gRes.data || []);
      setEmployeeVideoReviews(vRes.data || []);
    } catch (err) {
      console.error('Failed to load employee reviews:', err);
      toastError('Failed to load your review submissions.');
    } finally {
      setIsLoadingReviews(false);
    }
  };

  // Upload proof image helper
  const uploadProofFile = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post<{ url: string; screenshot_url?: string }>('/api/v1/employee/reviews/upload-proof', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.url || res.data.screenshot_url || '';
  };



  // Submit Video Review
  const handleCreateVideoReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoForm.customer_name.trim()) {
      toastError('Please enter the customer name.');
      return;
    }
    if (!videoForm.selectedFile && !videoForm.screenshot_url.trim()) {
      toastError('Please upload photo proof of the video review.');
      return;
    }

    try {
      setIsSubmittingReview(true);
      let proofUrl = videoForm.screenshot_url.trim();
      if (videoForm.selectedFile) {
        proofUrl = await uploadProofFile(videoForm.selectedFile);
      }

      await api.post('/api/v1/employee/reviews/video', {
        customer_name: videoForm.customer_name.trim(),
        videos_count: Number(videoForm.videos_count), // 1 video = 1 pt, 2 videos = 2 pts!
        video_title: videoForm.video_title.trim() || `${videoForm.customer_name} Video Review`,
        video_url: videoForm.video_url.trim() || null,
        review_date: videoForm.review_date,
        screenshot_url: proofUrl,
        notes: videoForm.notes.trim() || null,
      });

      success(`Video review (${videoForm.videos_count} video${videoForm.videos_count > 1 ? 's' : ''}) submitted! ${videoForm.videos_count} point${videoForm.videos_count > 1 ? 's' : ''} will be credited upon manager approval.`);
      setShowVideoModal(false);
      setVideoForm({
        customer_name: '',
        videos_count: 1,
        video_title: '',
        video_url: '',
        review_date: new Date().toISOString().split('T')[0],
        notes: '',
        screenshot_url: '',
        selectedFile: null,
        previewUrl: null,
      });
      fetchReviews();
      fetchSummary();
    } catch (err: any) {
      toastError(err.response?.data?.detail || 'Failed to submit video review.');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Delete Review Submissions
  const handleDeleteGoogleReview = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this Google review submission?')) return;
    try {
      await api.delete(`/api/v1/employee/reviews/google/${id}`);
      success('Google review deleted.');
      fetchReviews();
      fetchSummary();
    } catch (err: any) {
      toastError(err.response?.data?.detail || 'Failed to delete review.');
    }
  };

  const handleDeleteVideoReview = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this video review submission?')) return;
    try {
      await api.delete(`/api/v1/employee/reviews/video/${id}`);
      success('Video review deleted.');
      fetchReviews();
      fetchSummary();
    } catch (err: any) {
      toastError(err.response?.data?.detail || 'Failed to delete video review.');
    }
  };

  // Fast Concurrent Initial Data Load
  useEffect(() => {
    Promise.all([
      fetchSummary(),
      fetchNotifications(),
      fetchCustomerActivities(),
    ]).catch(() => {});
  }, []);

  // Instant Tab Switching (Zero-Latency Rendering)
  useEffect(() => {
    if (activeTab === 'CUSTOMERS' && !loadedTabs.CUSTOMERS) {
      fetchCustomerActivities().then(() => setLoadedTabs((prev) => ({ ...prev, CUSTOMERS: true })));
    } else if (activeTab === 'CALLS' && !loadedTabs.CALLS) {
      fetchCallLogs().then(() => setLoadedTabs((prev) => ({ ...prev, CALLS: true })));
    } else if (activeTab === 'REVIEWS' && !loadedTabs.REVIEWS) {
      fetchReviews().then(() => setLoadedTabs((prev) => ({ ...prev, REVIEWS: true })));
    } else if (activeTab === 'OUTDOOR') {
      fetchOutdoorDuty(selectedOutdoorDate);
      fetchOutdoorHistory();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'CUSTOMERS') {
      fetchCustomerActivities();
    }
  }, [customerApprovalFilter, customerStatusFilter]);

  useEffect(() => {
    if (activeTab === 'CALLS') {
      fetchCallLogs();
    }
  }, [callStatusFilter]);

  useEffect(() => {
    if (activeTab === 'OUTDOOR') {
      fetchOutdoorDuty(selectedOutdoorDate);
    }
  }, [selectedOutdoorDate]);

  // Open Add Customer Modal
  const handleOpenAddCustomer = () => {
    setEditingActivity(null);
    setShowCustomerModal(true);
  };

  // Open Edit Customer Modal
  const handleOpenEditCustomer = (act: CustomerActivity) => {
    setEditingActivity(act);
    setShowCustomerModal(true);
  };

  // Delete Customer Activity
  const handleDeleteCustomerActivity = async (activityId: number) => {
    if (!window.confirm('Are you sure you want to delete this customer log?')) return;
    try {
      await api.delete(`/api/v1/employee/customers/${activityId}`);
      success('Customer log deleted.');
      fetchCustomerActivities();
      fetchSummary();
    } catch (err: any) {
      toastError(err.response?.data?.detail || 'Failed to delete customer activity.');
    }
  };

  // Handle Submit Call Log
  const handleCreateCallLog = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsSubmittingCall(true);
      const payload = {
        customer_name: callForm.customer_name.trim() || 'Customer Call',
        phone_number: callForm.phone_number.trim() || '',
        customers_count: 1,
        call_status: callForm.call_status,
        call_date: callForm.call_date,
        call_time: callForm.call_time,
        purpose: callForm.purpose,
        notes: callForm.notes.trim() || null,
      };

      await api.post('/api/v1/employee/calls', payload);
      success('Customer call logged successfully!');

      setCallForm({
        customer_name: '',
        phone_number: '',
        call_status: 'Done',
        call_date: new Date().toISOString().split('T')[0],
        call_time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
        purpose: 'Follow-up Call',
        notes: '',
      });
      setShowAddCallModal(false);
      fetchCallLogs();
      fetchSummary();
    } catch (err: any) {
      console.error('Submit call log failed:', err);
      toastError(err.response?.data?.detail || 'Failed to log customer call.');
    } finally {
      setIsSubmittingCall(false);
    }
  };

  // Fetch Outdoor Duty for Date
  const fetchOutdoorDuty = async (dateVal: string) => {
    setIsLoadingOutdoor(true);
    try {
      const res = await api.get<OutdoorDuty | null>(`/api/v1/employee/outdoor/duty?date_filter=${dateVal}`);
      const duty = res.data;
      setOutdoorDuty(duty);
      if (duty) {
        const custs: CustomerEntryState[] = (duty.customers || []).map((c) => {
          const intStr = ((c as any).interested_in || '').toLowerCase();
          return {
            id: c.id,
            name: c.customer_name || '',
            phone: c.phone || '',
            dob: c.dob ? String(c.dob) : '',
            anniversary_date: c.anniversary_date ? String(c.anniversary_date) : '',
            follow_up_date: (c as any).follow_up_date ? String((c as any).follow_up_date) : '',
            area_name: (c as any).area_name || duty.area || '',
            photo_url: (c as any).photo_url || '',
            has_google_review: Boolean(c.has_google_review),
            google_review_rating: c.google_review_rating || 5,
            google_review_text: c.google_review_text || '',
            has_customer_feedback: Boolean((c as any).has_customer_feedback),
            feedback_rating: (c as any).feedback_rating || 5,
            feedback_text: (c as any).feedback_text || '',
            interested_gold: intStr.includes('gold'),
            interested_diamond: intStr.includes('diamond'),
            interested_silver: intStr.includes('silver'),
            is_converted: Boolean(c.is_converted),
            notes: c.notes || '',
          };
        });

        let photos: string[] = [];
        if (Array.isArray(duty.photo_urls)) {
          photos = duty.photo_urls;
        } else if (duty.photo_url) {
          photos = [duty.photo_url];
        }

        if (custs.length === 0) {
          custs.push({
            name: '',
            phone: '',
            dob: '',
            anniversary_date: '',
            follow_up_date: '',
            area_name: duty.area || '',
            photo_url: '',
            has_google_review: false,
            google_review_rating: 5,
            google_review_text: '',
            has_customer_feedback: false,
            feedback_rating: 5,
            feedback_text: '',
            interested_gold: false,
            interested_diamond: false,
            interested_silver: false,
            is_converted: false,
            notes: '',
          });
        }

        setOutdoorForm({
          area: duty.area || '',
          notes: duty.notes || '',
          photo_urls: photos,
          customers: custs,
        });
      } else {
        setOutdoorForm({
          area: '',
          notes: '',
          photo_urls: [],
          customers: [
            {
              name: '',
              phone: '',
              dob: '',
              anniversary_date: '',
              follow_up_date: '',
              area_name: '',
              photo_url: '',
              has_google_review: false,
              google_review_rating: 5,
              google_review_text: '',
              has_customer_feedback: false,
              feedback_rating: 5,
              feedback_text: '',
              interested_gold: false,
              interested_diamond: false,
              interested_silver: false,
              is_converted: false,
              notes: '',
            },
          ],
        });
      }
    } catch (err) {
      console.error('Failed to load outdoor duty:', err);
    } finally {
      setIsLoadingOutdoor(false);
    }
  };

  const fetchOutdoorHistory = async () => {
    try {
      const res = await api.get<OutdoorDuty[]>('/api/v1/employee/outdoor/history');
      setOutdoorHistory(res.data || []);
    } catch (err) {
      console.error('Failed to load outdoor history:', err);
    }
  };

  const [uploadingCustomerPhotoIdx, setUploadingCustomerPhotoIdx] = useState<number | null>(null);

  // Add Customer Row in Outdoor Entry
  const handleAddOutdoorCustomer = () => {
    setOutdoorForm((prev) => ({
      ...prev,
      customers: [
        ...prev.customers,
        {
          name: '',
          phone: '',
          dob: '',
          anniversary_date: '',
          follow_up_date: '',
          area_name: prev.area || '',
          photo_url: '',
          has_google_review: false,
          google_review_rating: 5,
          google_review_text: '',
          has_customer_feedback: false,
          feedback_rating: 5,
          feedback_text: '',
          interested_gold: false,
          interested_diamond: false,
          interested_silver: false,
          is_converted: false,
          notes: '',
        },
      ],
    }));
  };

  // Upload Photo for Specific Customer Row in Outdoor Entry
  const handleUploadCustomerPhoto = async (cIdx: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingCustomerPhotoIdx(cIdx);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post<{ url: string }>('/api/v1/employee/outdoor/upload-photo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const photoUrl = res.data.url;
      handleUpdateOutdoorCustomer(cIdx, 'photo_url', photoUrl);
      success('Customer field photo uploaded successfully!');
    } catch (err: any) {
      toastError(err.response?.data?.detail || 'Failed to upload photo.');
    } finally {
      setUploadingCustomerPhotoIdx(null);
      e.target.value = '';
    }
  };

  // Update Customer Field in Outdoor Entry
  const handleUpdateOutdoorCustomer = (index: number, field: keyof CustomerEntryState, value: any) => {
    setOutdoorForm((prev) => {
      const updated = [...prev.customers];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, customers: updated };
    });
  };

  // Remove Customer Row in Outdoor Entry
  const handleRemoveOutdoorCustomer = (index: number) => {
    setOutdoorForm((prev) => ({
      ...prev,
      customers: prev.customers.filter((_, idx) => idx !== index),
    }));
  };

  // Upload Outdoor Photo
  const handleUploadOutdoorPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingOutdoorPhoto(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post<{ url: string }>('/api/v1/employee/outdoor/upload-photo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const photoUrl = res.data.url;
      setOutdoorForm((prev) => ({
        ...prev,
        photo_urls: [...prev.photo_urls, photoUrl],
      }));
      success('Field photo uploaded successfully!');
    } catch (err: any) {
      toastError(err.response?.data?.detail || 'Failed to upload photo.');
    } finally {
      setIsUploadingOutdoorPhoto(false);
      e.target.value = '';
    }
  };

  // Remove Photo
  const handleRemoveOutdoorPhoto = (idx: number) => {
    setOutdoorForm((prev) => ({
      ...prev,
      photo_urls: prev.photo_urls.filter((_, i) => i !== idx),
    }));
  };

  // Save Outdoor Duty Log (Sends to Pending Review, ZERO WhatsApp)
  const handleSaveOutdoorDuty = async () => {
    const validCustomers = outdoorForm.customers.filter((c) => c.name.trim() !== '');
    const firstArea =
      validCustomers.find((c) => c.area_name?.trim())?.area_name?.trim() ||
      outdoorForm.area.trim() ||
      'Field Marketing';

    setIsSavingOutdoor(true);
    try {
      const customersPayload = validCustomers.map((c) => {
        const interests: string[] = [];
        if (c.interested_gold) interests.push('Gold');
        if (c.interested_diamond) interests.push('Diamond');
        if (c.interested_silver) interests.push('Silver');

        return {
          id: c.id,
          customer_name: c.name.trim(),
          phone: c.phone.trim() || undefined,
          dob: c.dob || undefined,
          anniversary_date: c.anniversary_date || undefined,
          follow_up_date: c.follow_up_date || undefined,
          area_name: c.area_name?.trim() || firstArea,
          photo_url: c.photo_url?.trim() || undefined,
          is_converted: Boolean(c.is_converted),
          has_google_review: Boolean(c.has_google_review),
          google_review_rating: c.has_google_review ? Number(c.google_review_rating) : 5,
          google_review_text: c.has_google_review ? (c.google_review_text?.trim() || undefined) : undefined,
          has_customer_feedback: Boolean(c.has_customer_feedback),
          feedback_rating: c.has_customer_feedback ? Number(c.feedback_rating) : 5,
          feedback_text: c.has_customer_feedback ? (c.feedback_text?.trim() || undefined) : undefined,
          interested_in: interests.join(', '),
          notes: c.notes?.trim() || undefined,
          date: selectedOutdoorDate,
        };
      });

      const convertedCount = customersPayload.filter((c) => c.is_converted).length;
      const googleReviewsCount = customersPayload.filter((c) => c.has_google_review).length;

      const customerPhotos = validCustomers
        .map((c) => c.photo_url?.trim())
        .filter((p): p is string => Boolean(p));
      const mergedPhotos = Array.from(new Set([...customerPhotos, ...outdoorForm.photo_urls]));

      const payload = {
        area: firstArea,
        customers_attended_count: customersPayload.length,
        converted_customers_count: convertedCount,
        google_ratings_count: googleReviewsCount,
        photo_url: mergedPhotos[0] || null,
        photo_urls: mergedPhotos,
        notes: outdoorForm.notes.trim() || null,
        status: 'Pending Review',
        customers: customersPayload,
      };

      const res = await api.post<OutdoorDuty>(`/api/v1/employee/outdoor/duty?duty_date=${selectedOutdoorDate}`, payload);
      setOutdoorDuty(res.data);
      success('Outdoor customer log saved and sent to Showroom Manager for review!');
      fetchSummary();
      fetchOutdoorHistory();
    } catch (err: any) {
      console.error('Failed to save outdoor duty:', err);
      toastError(err.response?.data?.detail || 'Failed to save outdoor customer log.');
    } finally {
      setIsSavingOutdoor(false);
    }
  };

  // Date Shift helper
  const handleOutdoorDateShift = (days: number) => {
    const curr = new Date(selectedOutdoorDate);
    curr.setDate(curr.getDate() + days);
    const newDateStr = curr.toISOString().split('T')[0];
    setSelectedOutdoorDate(newDateStr);
  };

  // Toggle Call Status
  const handleToggleCall = async (callId: number) => {
    try {
      await api.patch(`/api/v1/employee/calls/${callId}/toggle`);
      success('Call status updated.');
      fetchCallLogs();
      fetchSummary();
    } catch (err) {
      toastError('Failed to update call status.');
    }
  };

  // Delete Call
  const handleDeleteCall = async (callId: number) => {
    if (!window.confirm('Are you sure you want to delete this call log?')) return;
    try {
      await api.delete(`/api/v1/employee/calls/${callId}`);
      success('Call log deleted.');
      fetchCallLogs();
      fetchSummary();
    } catch (err) {
      toastError('Failed to delete call log.');
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F3EC] text-[#1D1D1B] flex flex-col font-sans selection:bg-[#7E22CE]/20 selection:text-[#7E22CE]">
      {/* Top Navbar - Black Background with Light Content */}
      <header className="sticky top-0 z-40 bg-[#0B0F17] border-b border-[#1E293B] px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3 shadow-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
          {/* Brand Logo & Title */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-[#131B2E] border border-[#2A3756] p-1 flex items-center justify-center shrink-0 shadow-2xs">
              <img
                src={logoImg}
                alt="Siri Samruddhi Gold Palace"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h1 className="text-xs sm:text-base font-black uppercase tracking-wider text-white truncate">
                  Siri Samruddhi
                </h1>
                <span className="hidden md:inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#1E293B] text-[#93C5FD] border border-[#334155] uppercase tracking-wide shrink-0">
                  Employee Dashboard
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] font-semibold text-[#94A3B8] tracking-wide truncate">
                Showroom: <span className="text-[#FBBF24] font-bold">{selectedBranch?.name || user?.branch_name || 'Showroom'}</span>
              </p>
            </div>
          </div>

          {/* Employee User Card & Logout */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {/* Notifications Button (Attire checks & Review Approvals) */}
            <button
              type="button"
              onClick={handleOpenNotifications}
              className="relative flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl sm:rounded-2xl bg-[#131B2E] hover:bg-[#1E293B] border border-[#2A3756] text-white transition-all cursor-pointer shadow-2xs group shrink-0"
              title="Notifications: Manager attire checks & review approvals"
            >
              <div className="relative flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-lg sm:rounded-xl bg-[#1E293B] text-[#A78BFA] group-hover:bg-[#2E1065] transition-colors shrink-0">
                <Bell className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#A78BFA] group-hover:scale-110 transition-transform" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 sm:w-2.5 sm:h-2.5 bg-[#EF4444] rounded-full ring-2 ring-[#0B0F17] animate-pulse" />
                )}
              </div>
              <div className="text-left hidden sm:block">
                <span className="text-[8px] sm:text-[9px] font-extrabold uppercase tracking-wider text-[#94A3B8] block leading-none">
                  Updates
                </span>
                <span className="text-xs font-bold text-white leading-tight flex items-center gap-1">
                  Alerts
                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-[#EF4444] text-white">
                      {unreadCount}
                    </span>
                  )}
                </span>
              </div>
            </button>

            {/* Total Points Indicator in Header */}
            <button
              type="button"
              onClick={() => setActiveTab('REVIEWS')}
              className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl sm:rounded-2xl bg-[#131B2E] hover:bg-[#1E293B] border border-[#2A3756] shadow-2xs cursor-pointer transition-all group shrink-0"
              title="Click to view Review & Video Points Ledger"
            >
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg sm:rounded-xl bg-[#1E293B] border border-[#334155] text-[#FBBF24] flex items-center justify-center font-black text-xs shadow-2xs group-hover:scale-105 transition-transform shrink-0">
                <Star className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-[#FBBF24] text-[#FBBF24]" />
              </div>
              <div className="text-left">
                <span className="text-[8px] sm:text-[9px] font-extrabold uppercase tracking-wider text-[#94A3B8] block leading-none">
                  Points
                </span>
                <span className="text-xs sm:text-sm font-black text-[#FBBF24] font-mono leading-tight">
                  {dashboardSummary?.total_points ?? 0} <span className="text-[9px] sm:text-[10px] font-bold text-[#94A3B8]">pts</span>
                </span>
              </div>
            </button>

            {/* Employee Profile Tag */}
            <div className="hidden sm:flex items-center gap-2 sm:gap-2.5 px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-xl sm:rounded-2xl bg-[#131B2E] border border-[#2A3756]">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-[#7E22CE] text-white font-black text-xs flex items-center justify-center shrink-0 shadow-2xs">
                {user?.full_name?.charAt(0) || 'E'}
              </div>
              <div className="text-left">
                <div className="text-xs font-bold text-white truncate max-w-[100px] md:max-w-[150px]">
                  {user?.full_name || 'Showroom Staff'}
                </div>
                <div className="text-[10px] text-[#A78BFA] font-mono font-bold">
                  {user?.employee_code || 'STAFF'}
                </div>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowLogoutModal(true)}
              className="bg-[#131B2E] hover:bg-red-950/60 text-red-400 hover:text-red-300 border-[#334155] hover:border-red-500 text-xs flex items-center gap-1.5 rounded-xl transition-all cursor-pointer shadow-2xs p-2 sm:px-3 sm:py-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Sign Out</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Workspace Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Welcome Clean Hero Banner */}
        <div className="relative bg-white border border-[#E4DFD4] rounded-3xl p-6 sm:p-8 shadow-xs overflow-hidden text-[#1D1D1B]">
          {/* Hero Content */}
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3">
              {/* Showroom Branch Badge & Desk Tag */}
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="text-xs font-bold text-[#1D1D1B] px-3.5 py-1.5 rounded-full bg-white border border-[#D8B4FE] flex items-center gap-2 shadow-2xs">
                  <span className="w-2 h-2 rounded-full bg-[#7E22CE] animate-pulse" />
                  <span>{selectedBranch?.name || user?.branch_name || 'Showroom'}</span>
                </span>

                <span className="text-xs font-bold text-[#7E22CE] px-3 py-1.5 rounded-full bg-[#F3E8FF] border border-[#D8B4FE] flex items-center gap-1.5 shadow-2xs">
                  <Sparkles className="w-3.5 h-3.5 text-[#7E22CE]" />
                  <span>Employee Dashboard</span>
                </span>
              </div>

              {/* Welcome Title */}
              <div>
                <h2 className="text-2xl sm:text-3xl font-black text-[#1D1D1B] tracking-tight">
                  Welcome back, <span className="text-[#7E22CE] font-extrabold">{user?.full_name || 'Team Member'}</span>!
                </h2>
                <p className="text-xs sm:text-sm text-[#5E5A52] font-medium mt-1 leading-relaxed">
                  Log customer interactions, gold savings schemes, customer calls, and review point submissions.
                </p>
              </div>
            </div>

            {/* Hero Quick Actions */}
            <div className="flex items-center gap-2.5 self-start md:self-auto shrink-0 flex-wrap">
              <button
                onClick={() => {
                  fetchSummary();
                  if (activeTab === 'CUSTOMERS') fetchCustomerActivities();
                  else if (activeTab === 'CALLS') fetchCallLogs();
                  else if (activeTab === 'REVIEWS') fetchReviews();
                }}
                className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white hover:bg-[#FAF5FF] text-[#3B0764] text-xs font-bold border border-[#D8B4FE] shadow-2xs transition-all cursor-pointer hover:scale-102"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-[#7E22CE] ${isLoadingCustomers ? 'animate-spin' : ''}`} />
                <span>Refresh Data</span>
              </button>
            </div>
          </div>

          {/* 6 Distinct Solid Colored Metric Blocks (Exact Manager Dashboard Palette) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 mt-6 pt-6 border-t border-[#EBE6DC]">
            {/* Block 1: Total Points Earned (Warm Terracotta #FAF1EC & #B97855 - matching Manager Rating card) */}
            <div
              onClick={() => setActiveTab('REVIEWS')}
              className="bg-[#FAF1EC] border border-[#ECCFC0] hover:border-[#B97855] rounded-2xl p-4 sm:p-5 shadow-[0_4px_18px_rgba(40,35,25,0.045)] hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-[#B97855] uppercase tracking-wider block mb-1">
                      Points Earned
                    </span>
                    <div className="text-3xl font-bold text-[#1D1D1B] font-mono tracking-tight">
                      {dashboardSummary?.total_points ?? 0}
                    </div>
                    <span className="text-xs text-[#8A8479] font-medium mt-0.5 block">Review Rewards</span>
                  </div>
                  <div className="w-11 h-11 rounded-2xl bg-white border border-[#ECCFC0] text-[#B97855] flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                    <Award className="w-5 h-5 text-[#B97855]" />
                  </div>
                </div>

                <div className="mt-3.5 pt-2.5 border-t border-[#ECCFC0] flex items-center justify-between text-[10px] font-bold text-[#B97855]">
                  <span>{dashboardSummary?.google_review_points ?? 0} Google (1 pt)</span>
                  <span>•</span>
                  <span>{dashboardSummary?.video_review_points ?? 0} Video (5 pts)</span>
                </div>
              </div>
            </div>

            {/* Block 2: Total Customer Logs (Purple #F3E8FF & #7E22CE - matching Manager Staff card) */}
            <div
              onClick={() => setActiveTab('CUSTOMERS')}
              className="bg-[#F3E8FF] border border-[#D8B4FE] hover:border-[#7E22CE] rounded-2xl p-4 sm:p-5 shadow-[0_4px_18px_rgba(40,35,25,0.045)] hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-[#7E22CE] uppercase tracking-wider block mb-1">
                      Customer Logs
                    </span>
                    <div className="text-3xl font-bold text-[#1D1D1B] font-mono tracking-tight">
                      {dashboardSummary?.total_customer_activities ?? customerActivities.length}
                    </div>
                    <span className="text-xs text-[#8A8479] font-medium mt-0.5 block">Walk-ins Logged</span>
                  </div>
                  <div className="w-11 h-11 rounded-2xl bg-white border border-[#D8B4FE] text-[#7E22CE] flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                    <Users className="w-5 h-5 text-[#7E22CE]" />
                  </div>
                </div>

                <div className="mt-3.5 pt-2.5 border-t border-[#D8B4FE] flex items-center justify-between text-[10px] font-bold text-[#7E22CE]">
                  <span>Showroom Logs</span>
                  <span className="font-mono">Active</span>
                </div>
              </div>
            </div>

            {/* Block 3: Outdoor Entries (Emerald Green #E8F4EE & #21845F - matching Outdoor Marketing theme) */}
            <div
              onClick={() => setActiveTab('OUTDOOR')}
              className="bg-[#E8F4EE] border border-[#C5E3D5] hover:border-[#21845F] rounded-2xl p-4 sm:p-5 shadow-[0_4px_18px_rgba(40,35,25,0.045)] hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-[#21845F] uppercase tracking-wider block mb-1">
                      Outdoor Entry
                    </span>
                    <div className="text-3xl font-bold text-[#1D1D1B] font-mono tracking-tight">
                      {dashboardSummary?.total_outdoor_customers ?? outdoorDuty?.customers?.length ?? 0}
                    </div>
                    <span className="text-xs text-[#8A8479] font-medium mt-0.5 block">Field Leads</span>
                  </div>
                  <div className="w-11 h-11 rounded-2xl bg-white border border-[#C5E3D5] text-[#21845F] flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                    <Compass className="w-5 h-5 text-[#21845F]" />
                  </div>
                </div>

                <div className="mt-3.5 pt-2.5 border-t border-[#C5E3D5] flex items-center justify-between text-[10px] font-bold text-[#21845F]">
                  <span>Field Interactions</span>
                  <span className="font-mono">{outdoorDuty?.status || 'Active'}</span>
                </div>
              </div>
            </div>

            {/* Block 4: Call Activities (Slate Blue #EDF2F8 & #526F91 - matching Manager Footfall card) */}
            <div
              onClick={() => setActiveTab('CALLS')}
              className="bg-[#EDF2F8] border border-[#C6D4E3] hover:border-[#526F91] rounded-2xl p-4 sm:p-5 shadow-[0_4px_18px_rgba(40,35,25,0.045)] hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-[#526F91] uppercase tracking-wider block mb-1">
                      Call Activities
                    </span>
                    <div className="text-3xl font-bold text-[#1D1D1B] font-mono tracking-tight">
                      {dashboardSummary?.total_calls ?? callLogs.length}
                    </div>
                    <span className="text-xs text-[#8A8479] font-medium mt-0.5 block">Client Outreach</span>
                  </div>
                  <div className="w-11 h-11 rounded-2xl bg-white border border-[#C6D4E3] text-[#526F91] flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                    <PhoneCall className="w-5 h-5 text-[#526F91]" />
                  </div>
                </div>

                <div className="mt-3.5 pt-2.5 border-t border-[#C6D4E3] flex items-center justify-between text-[10px] font-bold text-[#526F91]">
                  <span>{dashboardSummary?.completed_calls ?? 0} Done</span>
                  <span>•</span>
                  <span>{dashboardSummary?.pending_calls ?? 0} Scheduled</span>
                </div>
              </div>
            </div>

            {/* Block 5: Pending Verification (Yellow #FEFCE8 & #EAB308 - matching Manager Pending card) */}
            <div
              onClick={() => {
                setActiveTab('CUSTOMERS');
                setCustomerApprovalFilter('PENDING');
              }}
              className="bg-[#FEFCE8] border border-[#EAB308] hover:border-[#CA8A04] rounded-2xl p-4 sm:p-5 shadow-[0_4px_18px_rgba(40,35,25,0.045)] hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-[#854D0E] uppercase tracking-wider block mb-1">
                      Pending Review
                    </span>
                    <div className="text-3xl font-bold text-[#854D0E] font-mono tracking-tight">
                      {dashboardSummary?.pending_customer_activities ?? customerActivities.filter(a => a.approval_status === 'PENDING').length}
                    </div>
                    <span className="text-xs text-[#854D0E] font-medium mt-0.5 block">Awaiting Verification</span>
                  </div>
                  <div className="w-11 h-11 rounded-2xl bg-white border border-[#EAB308] text-[#CA8A04] flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                    <Clock className="w-5 h-5 text-[#CA8A04]" />
                  </div>
                </div>

                <div className="mt-3.5 pt-2.5 border-t border-[#EAB308]/40 flex items-center justify-between text-[10px] font-bold text-[#854D0E]">
                  <span>In Manager's Queue</span>
                  <span>Pending</span>
                </div>
              </div>
            </div>

            {/* Block 6: Approved Logs (Sage Green #E8F4EE & #21845F - matching Manager Verified card) */}
            <div
              onClick={() => {
                setActiveTab('CUSTOMERS');
                setCustomerApprovalFilter('APPROVED');
              }}
              className="bg-[#E8F4EE] border border-[#C5E3D5] hover:border-[#21845F] rounded-2xl p-4 sm:p-5 shadow-[0_4px_18px_rgba(40,35,25,0.045)] hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-[#21845F] uppercase tracking-wider block mb-1">
                      Approved Logs
                    </span>
                    <div className="text-3xl font-bold text-[#21845F] font-mono tracking-tight">
                      {dashboardSummary?.approved_customer_activities ?? customerActivities.filter(a => a.approval_status === 'APPROVED').length}
                    </div>
                    <span className="text-xs text-[#21845F] font-medium mt-0.5 block">Manager Approved</span>
                  </div>
                  <div className="w-11 h-11 rounded-2xl bg-white border border-[#C5E3D5] text-[#21845F] flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                    <CheckCircle2 className="w-5 h-5 text-[#21845F]" />
                  </div>
                </div>

                <div className="mt-3.5 pt-2.5 border-t border-[#C5E3D5] flex items-center justify-between text-[10px] font-bold text-[#21845F]">
                  <span>Verified Records</span>
                  <span>Active</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Selection & Main Action Header */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-[#E6E1D6] pb-4">
          <div className="w-full sm:w-auto grid grid-cols-2 sm:grid-cols-4 sm:flex items-center gap-1.5 p-1.5 bg-white border border-[#D8B4FE]/70 rounded-2xl shadow-xs">
            {/* Tab 1: Customer Logs */}
            <button
              onClick={() => setActiveTab('CUSTOMERS')}
              className={`flex items-center justify-center sm:justify-start gap-1 sm:gap-2 px-3 sm:px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'CUSTOMERS'
                  ? 'bg-[#7E22CE] text-white shadow-xs scale-[1.01]'
                  : 'text-[#5E5A52] hover:text-[#1D1D1B] hover:bg-[#FAF5FF]'
              }`}
            >
              <Users className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">Customer Logs</span>
              <span className="sm:hidden text-[11px] truncate">Customers</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black shrink-0 ${
                activeTab === 'CUSTOMERS'
                  ? 'bg-white/20 text-white'
                  : 'bg-[#F3E8FF] text-[#7E22CE]'
              }`}>
                {customerActivities.length}
              </span>
            </button>

            {/* Tab 2: Call Activities */}
            <button
              onClick={() => setActiveTab('CALLS')}
              className={`flex items-center justify-center sm:justify-start gap-1 sm:gap-2 px-3 sm:px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'CALLS'
                  ? 'bg-[#526F91] text-white shadow-xs scale-[1.01]'
                  : 'text-[#5E5A52] hover:text-[#1D1D1B] hover:bg-[#EDF2F8]'
              }`}
            >
              <PhoneCall className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">Call Activities</span>
              <span className="sm:hidden text-[11px] truncate">Calls</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black shrink-0 ${
                activeTab === 'CALLS'
                  ? 'bg-white/20 text-white'
                  : 'bg-[#EDF2F8] text-[#526F91]'
              }`}>
                {callLogs.length}
              </span>
            </button>

            {/* Tab 3: Review Points */}
            <button
              onClick={() => setActiveTab('REVIEWS')}
              className={`flex items-center justify-center sm:justify-start gap-1 sm:gap-2 px-3 sm:px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'REVIEWS'
                  ? 'bg-[#7E22CE] text-white shadow-xs scale-[1.01]'
                  : 'text-[#5E5A52] hover:text-[#1D1D1B] hover:bg-[#FAF5FF]'
              }`}
            >
              <Award className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">Review Points</span>
              <span className="sm:hidden text-[11px] truncate">Points</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black shrink-0 ${
                activeTab === 'REVIEWS'
                  ? 'bg-white/20 text-white'
                  : 'bg-[#F3E8FF] text-[#7E22CE] border border-[#D8B4FE]'
              }`}>
                🏆 {dashboardSummary?.total_points ?? 0}
              </span>
            </button>

            {/* Tab 4: Outdoor Entry */}
            <button
              onClick={() => setActiveTab('OUTDOOR')}
              className={`flex items-center justify-center sm:justify-start gap-1 sm:gap-2 px-3 sm:px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'OUTDOOR'
                  ? 'bg-[#23815F] text-white shadow-xs scale-[1.01]'
                  : 'text-[#5E5A52] hover:text-[#1D1D1B] hover:bg-[#E8F4EE]'
              }`}
            >
              <Compass className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">Outdoor Entry</span>
              <span className="sm:hidden text-[11px] truncate">Outdoor</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black shrink-0 ${
                activeTab === 'OUTDOOR'
                  ? 'bg-white/20 text-white'
                  : 'bg-[#E8F4EE] text-[#23815F] border border-[#C5E3D5]'
              }`}>
                {outdoorDuty?.customers?.length ?? (dashboardSummary?.total_outdoor_customers ?? 0)}
              </span>
            </button>
          </div>

          {/* Primary Action Button */}
          {activeTab === 'CUSTOMERS' && (
            <Button
              onClick={handleOpenAddCustomer}
              className="w-full sm:w-auto bg-[#7E22CE] hover:bg-[#6B21A8] text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-sm rounded-xl px-5 py-2.5 hover:scale-[1.02] active:scale-98 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 text-white" />
              <span>Add Customer Log</span>
            </Button>
          )}
          {activeTab === 'CALLS' && (
            <Button
              onClick={() => setShowAddCallModal(true)}
              className="w-full sm:w-auto bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-sm rounded-xl px-5 py-2.5 hover:scale-[1.02] active:scale-98 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 text-white" />
              <span>Log Customer Call</span>
            </Button>
          )}
          {activeTab === 'OUTDOOR' && (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button
                onClick={handleAddOutdoorCustomer}
                className="w-full sm:w-auto bg-[#23815F] hover:bg-[#1B694C] text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-sm rounded-xl px-5 py-2.5 hover:scale-[1.02] active:scale-98 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4 text-white" />
                <span>+ Add Attended Customer</span>
              </Button>
            </div>
          )}
          {activeTab === 'REVIEWS' && (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button
                onClick={handleOpenAddCustomer}
                className="w-full sm:w-auto bg-[#7E22CE] hover:bg-[#6B21A8] text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-sm rounded-xl px-5 py-2.5 hover:scale-[1.02] active:scale-98 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4 text-white" />
                <span>Add Customer & Review</span>
              </Button>
            </div>
          )}
        </div>

        {/* ------------------------------------------------------------------- */}
        {/* TAB 1: CUSTOMER LOGS                                                */}
        {/* ------------------------------------------------------------------- */}
        {activeTab === 'CUSTOMERS' && (
          <div className="space-y-4">
            {/* Customer Status Quick Filter Bar (Requirement 6: Lost, Interested, Sold) */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-[#E4DFD4] p-3 sm:p-3.5 rounded-2xl shadow-xs">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-black text-[#3B0764] mr-1 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <Filter className="w-3.5 h-3.5 text-[#7E22CE]" />
                  <span>Customer Status:</span>
                </span>
                {[
                  {
                    id: 'ALL',
                    label: 'All Statuses',
                    activeCls: 'bg-[#7E22CE] text-white border-[#7E22CE] shadow-sm shadow-purple-500/20',
                    inactiveCls: 'bg-white text-[#5E5A52] border-[#D8B4FE] hover:bg-[#FAF5FF]',
                  },
                  {
                    id: 'Sold',
                    label: 'Sold',
                    activeCls: 'bg-[#21845F] text-white border-[#21845F] shadow-sm shadow-emerald-500/20',
                    inactiveCls: 'bg-[#E8F4EE] text-[#21845F] border-[#A7F3D0] hover:bg-[#D1FAE5]',
                  },
                  {
                    id: 'Exchange',
                    label: 'Exchange (Gold/Diamond/Silver)',
                    activeCls: 'bg-[#2563EB] text-white border-[#2563EB] shadow-sm shadow-blue-500/20',
                    inactiveCls: 'bg-[#EFF6FF] text-[#1E40AF] border-[#BFDBFE] hover:bg-[#DBEAFE]',
                  },
                  {
                    id: 'In Hold',
                    label: 'In Hold / Follow Up',
                    activeCls: 'bg-[#B97855] text-white border-[#B97855] shadow-xs',
                    inactiveCls: 'bg-[#FAF1EC] text-[#B97855] border-[#ECCFC0] hover:bg-[#F5E5DC]',
                  },
                  {
                    id: 'Interested',
                    label: 'Interested',
                    activeCls: 'bg-[#475569] text-white border-[#475569] shadow-xs',
                    inactiveCls: 'bg-[#F1F5F9] text-[#475569] border-[#CBD5E1] hover:bg-[#E2E8F0]',
                  },
                  {
                    id: 'Lost',
                    label: 'Lost',
                    activeCls: 'bg-[#C24141] text-white border-[#C24141] shadow-sm shadow-red-500/20',
                    inactiveCls: 'bg-[#FEF2F2] text-[#991B1B] border-[#FECACA] hover:bg-[#FEE2E2]',
                  },
                ].map((sTab) => {
                  const isSelected = customerStatusFilter === sTab.id;
                  return (
                    <button
                      key={sTab.id}
                      type="button"
                      onClick={() => setCustomerStatusFilter(sTab.id as any)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                        isSelected
                          ? `${sTab.activeCls} font-black scale-[1.02]`
                          : `${sTab.inactiveCls} font-bold`
                      }`}
                    >
                      <span>{sTab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="bg-white border border-[#E6E1D6] rounded-2xl p-3 sm:p-4 flex flex-col md:flex-row items-center justify-between gap-3 shadow-xs">
              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8A8479]" />
                <input
                  type="text"
                  placeholder="Search customer name, phone, notes..."
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchCustomerActivities()}
                  className="w-full pl-9 pr-4 py-2 bg-[#FAF8F5] border border-[#CBD5E1] rounded-xl text-xs text-[#1D1D1B] placeholder-[#8A8479] focus:outline-hidden focus:border-[#7E22CE] focus:ring-2 focus:ring-[#7E22CE]/15 shadow-inner"
                />
              </div>

              {/* Approval Filter Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto">
                <span className="text-xs font-bold text-[#5E5A52] mr-1 hidden sm:inline uppercase text-[10px]">Approval:</span>
                {[
                  { id: 'ALL', label: 'All', active: 'bg-[#7E22CE] text-white shadow-xs', inactive: 'bg-[#FAF8F5] text-[#5E5A52] border border-[#E6E1D6] hover:bg-white' },
                  { id: 'PENDING', label: 'Pending Review', active: 'bg-[#7E22CE] text-white shadow-xs', inactive: 'bg-[#FEFCE8] text-[#854D0E] border border-[#FEF08A] hover:bg-[#FEF08A]' },
                  { id: 'APPROVED', label: 'Approved', active: 'bg-[#21845F] text-white shadow-xs', inactive: 'bg-[#F0FDF4] text-[#166534] border border-[#BBF7D0] hover:bg-[#DCFCE7]' },
                  { id: 'REJECTED', label: 'Rejected', active: 'bg-[#C24141] text-white shadow-xs', inactive: 'bg-[#FEF2F2] text-[#991B1B] border border-[#FECACA] hover:bg-[#FEE2E2]' },
                ].map((tab) => {
                  const isSel = customerApprovalFilter === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setCustomerApprovalFilter(tab.id as any)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                        isSel ? `${tab.active} font-black` : tab.inactive
                      }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Customer List */}
            {isLoadingCustomers ? (
              <div className="py-20 flex justify-center bg-white rounded-3xl border border-[#E6E1D6]">
                <LoadingSpinner message="Loading your customer activities..." />
              </div>
            ) : customerActivities.length === 0 ? (
              <div className="bg-white rounded-3xl border border-[#E6E1D6] py-16 shadow-xs">
                <EmptyState
                  title="No Customer Logs Recorded"
                  description="You have not logged any customer interactions matching the selected filter. Click '+ Add Customer Log' to submit your first customer entry."
                  icon={Users}
                  actionText="+ Add Customer Log"
                  onAction={handleOpenAddCustomer}
                />
              </div>
            ) : (
              <>
                {/* Mobile Responsive Card List (block sm:hidden) */}
                <div className="block sm:hidden space-y-3">
                  {customerActivities.map((act) => {
                    const subrecords = getSubrecordDetails(act.breakdown);
                    const isPending = act.approval_status === 'PENDING';
                    const isApproved = act.approval_status === 'APPROVED';
                    const isRejected = act.approval_status === 'REJECTED';

                    return (
                      <div
                        key={act.id}
                        className="bg-white border border-[#E6E1D6] rounded-2xl p-4 shadow-xs space-y-3"
                      >
                        {/* Header: Date, ID, Status Badge */}
                        <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-[#F0ECE1]">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-[#1D1D1B]">
                            <Calendar className="w-3.5 h-3.5 text-[#7E22CE]" />
                            <span>{act.activity_date}</span>
                            <span className="text-[10px] text-[#8A8479] font-mono">#{act.id}</span>
                          </div>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              act.status === 'Sold'
                                ? 'bg-[#E8F4EE] text-[#21845F] border border-[#C5E3D5]'
                                : act.status === 'Exchange'
                                  ? 'bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]'
                                  : act.status === 'In Hold / Follow Up'
                                    ? 'bg-[#EFF6FF] text-[#1D4ED8] border border-[#BFDBFE]'
                                    : act.status === 'Walkin'
                                      ? 'bg-[#F4F1EA] text-[#5E5A52] border border-[#E4DFD4]'
                                      : 'bg-[#FEE2E2] text-[#B91C1C] border border-[#FECACA]'
                            }`}
                          >
                            {act.status}
                          </span>
                        </div>

                        {/* Customer & Product Value Details */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <h4 className="font-extrabold text-[#1D1D1B] text-sm flex items-center gap-1.5 flex-wrap">
                              <User className="w-3.5 h-3.5 text-[#B97855] shrink-0" />
                              <span className="truncate">{act.customer_name || 'Walk-in Customer'}</span>
                              {(act.customers_count || 1) > 1 && (
                                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#F3E8FF] text-[#7E22CE] border border-[#D8B4FE] font-bold shrink-0">
                                  {act.customers_count} People
                                </span>
                              )}
                            </h4>
                            {act.phone_number ? (
                              <div className="flex items-center gap-2 text-xs text-[#6B6559] mt-1 font-mono">
                                <Phone className="w-3 h-3 text-[#8A8479]" />
                                <a href={`tel:${act.phone_number}`} className="hover:underline">{act.phone_number}</a>
                              </div>
                            ) : (
                              <span className="text-[11px] text-[#8A8479] italic mt-0.5 block">No phone</span>
                            )}
                            {(act.dob || act.anniversary) && (
                              <div className="text-[10px] text-[#B97855] font-medium mt-1 flex items-center gap-2">
                                {act.dob && <span>DOB: {act.dob}</span>}
                                {act.anniversary && <span>Anniv: {act.anniversary}</span>}
                              </div>
                            )}
                          </div>

                          <div className="text-right shrink-0">
                            <span className="text-[9px] font-bold text-[#8A8479] uppercase block">Product Value</span>
                            <div className="flex items-center justify-end gap-0.5 font-bold text-[#21845F] text-sm font-mono mt-0.5">
                              <IndianRupee className="w-3.5 h-3.5" />
                              <span>{(act.product_value || 0).toLocaleString('en-IN', { minimumFractionDigits: 0 })}</span>
                            </div>
                          </div>
                        </div>

                        {/* Schemes & Reviews badges */}
                        {(subrecords.hasScheme || subrecords.hasReview || subrecords.hasVideoReview || subrecords.hasFeedback) && (
                          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                            {subrecords.hasVideoReview && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#F3E8FF] text-[#7E22CE] border border-[#D8B4FE] text-[10px] font-bold">
                                <Video className="w-3 h-3 text-[#7E22CE]" />
                                <span>{subrecords.videosCount} Video(s) • +{subrecords.videosCount * 5} Pts</span>
                              </span>
                            )}
                            {subrecords.hasScheme && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A] text-[10px] font-bold">
                                <Award className="w-3 h-3 text-[#D97706]" />
                                <span>{subrecords.schemePlan || 'Scheme'}</span>
                                {subrecords.schemeMonthly && <span className="font-mono"> (₹{subrecords.schemeMonthly})</span>}
                              </span>
                            )}
                            {subrecords.hasReview && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#EFF6FF] text-[#1D4ED8] border border-[#BFDBFE] text-[10px] font-bold">
                                <Star className="w-3 h-3 text-[#F59E0B] fill-[#F59E0B]" />
                                <span>{subrecords.reviewRating}★ Google Review</span>
                              </span>
                            )}
                            {subrecords.hasFeedback && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#FDF2F8] text-[#BE185D] border border-[#FBCFE8] text-[10px] font-bold">
                                <MessageSquareHeart className="w-3 h-3 text-[#EC4899]" />
                                <span>Feedback ({subrecords.feedbackRating}★)</span>
                              </span>
                            )}
                          </div>
                        )}

                        {/* Notes if any */}
                        {act.notes && (
                          <p className="text-xs text-[#6B6559] bg-[#FAF8F5] p-2.5 rounded-xl border border-[#EBE6DC] leading-relaxed">
                            {act.notes}
                          </p>
                        )}

                        {/* Footer: Manager Approval & Actions */}
                        <div className="pt-2 border-t border-[#F0ECE1] flex items-center justify-between gap-2">
                          <div>
                            {isPending && (
                              <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#FEFCE8] border border-[#FEF08A] text-[#854D0E] text-[10px] font-bold">
                                <Clock className="w-3 h-3 text-[#EAB308]" />
                                <span>Pending Approval</span>
                              </div>
                            )}
                            {isApproved && (
                              <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#F0FDF4] border border-[#BBF7D0] text-[#166534] text-[10px] font-bold">
                                <CheckCircle2 className="w-3 h-3 text-[#16A34A]" />
                                <span>Approved{act.reviewed_by_name ? ` by ${act.reviewed_by_name}` : ''}</span>
                              </div>
                            )}
                            {isRejected && (
                              <div>
                                <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#FEF2F2] border border-[#FECACA] text-[#991B1B] text-[10px] font-bold">
                                  <XCircle className="w-3 h-3 text-[#EF4444]" />
                                  <span>Rejected{act.reviewed_by_name ? ` by ${act.reviewed_by_name}` : ''}</span>
                                </div>
                                {act.rejection_reason && (
                                  <p className="text-[10px] text-[#DC2626] mt-0.5 max-w-[150px] truncate" title={act.rejection_reason}>
                                    Note: {act.rejection_reason}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenEditCustomer(act)}
                              className="px-3 py-1.5 rounded-xl bg-white border border-[#E6E1D6] hover:bg-[#F3E8FF] hover:border-[#D8B4FE] text-[#7E22CE] text-xs font-bold transition-all cursor-pointer shadow-2xs flex items-center gap-1"
                              title="Update customer log"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                              <span>Update</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteCustomerActivity(act.id)}
                              className="px-3 py-1.5 rounded-xl bg-white border border-red-200 hover:bg-red-50 text-[#C24141] hover:text-red-700 text-xs font-bold transition-all cursor-pointer shadow-2xs flex items-center gap-1"
                              title="Delete customer log"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete</span>
                            </button>

                            {act.phone_number && (
                              <a
                                href={`https://wa.me/91${act.phone_number.replace(/[^0-9]/g, '').slice(-10)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 rounded-xl bg-white border border-[#A6E7B9] text-[#1E7E34] hover:bg-[#E8F8EE] shadow-2xs cursor-pointer"
                                title="WhatsApp customer"
                              >
                                <WhatsAppIcon className="w-3.5 h-3.5" />
                              </a>
                            )}


                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Tablet & Desktop Table View (hidden sm:block) */}
                <div className="hidden sm:block bg-white border border-[#E6E1D6] rounded-3xl overflow-hidden shadow-xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-[#1D1D1B]">
                    <thead className="bg-[#FAF8F3] text-[#5E5A52] uppercase font-bold text-[11px] tracking-wider border-b border-[#EBE6DC]">
                      <tr>
                        <th className="px-4 py-3.5">Visit Date</th>
                        <th className="px-4 py-3.5">Customer & Contact</th>
                        <th className="px-4 py-3.5">Outcome / Status</th>
                        <th className="px-4 py-3.5">Product Value</th>
                        <th className="px-4 py-3.5">Schemes & Engagements</th>
                        <th className="px-4 py-3.5">Manager Approval</th>
                        <th className="px-4 py-3.5">Notes</th>
                        <th className="px-4 py-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F0ECE1]">
                      {customerActivities.map((act) => {
                        const subrecords = getSubrecordDetails(act.breakdown);
                        const isPending = act.approval_status === 'PENDING';
                        const isApproved = act.approval_status === 'APPROVED';
                        const isRejected = act.approval_status === 'REJECTED';

                        return (
                          <tr
                            key={act.id}
                            className="hover:bg-[#FAF9F5] transition-colors"
                          >
                            {/* Date */}
                            <td className="px-4 py-3.5 whitespace-nowrap">
                              <div className="flex items-center gap-1.5 font-bold text-[#1D1D1B]">
                                <Calendar className="w-3.5 h-3.5 text-[#7E22CE]" />
                                <span>{act.activity_date}</span>
                              </div>
                              <span className="text-[10px] text-[#8A8479] ml-5 font-mono">
                                #{act.id}
                              </span>
                            </td>

                            {/* Customer info */}
                            <td className="px-4 py-3.5">
                              <div className="font-bold text-[#1D1D1B] flex items-center gap-1.5 flex-wrap">
                                <User className="w-3.5 h-3.5 text-[#B97855]" />
                                <span>{act.customer_name || 'Walk-in Customer'}</span>
                                {(act.customers_count || 1) > 1 && (
                                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#F3E8FF] text-[#7E22CE] border border-[#D8B4FE] font-bold">
                                    {act.customers_count} People
                                  </span>
                                )}
                              </div>
                              {act.phone_number ? (
                                <div className="flex items-center gap-1.5 text-[11px] text-[#6B6559] mt-1 font-mono">
                                  <Phone className="w-3 h-3 text-[#8A8479]" />
                                  <span>{act.phone_number}</span>
                                </div>
                              ) : (
                                <span className="text-[11px] text-[#8A8479] italic mt-0.5 block">
                                  No phone provided
                                </span>
                              )}
                              {(act.dob || act.anniversary) && (
                                <div className="text-[10px] text-[#B97855] font-medium mt-1 flex items-center gap-2">
                                  {act.dob && <span>DOB: {act.dob}</span>}
                                  {act.anniversary && <span>Anniv: {act.anniversary}</span>}
                                </div>
                              )}
                            </td>

                            {/* Outcome status */}
                            <td className="px-4 py-3.5 whitespace-nowrap">
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                  act.status === 'Sold'
                                    ? 'bg-[#E8F4EE] text-[#21845F] border border-[#C5E3D5]'
                                    : act.status === 'Exchange'
                                      ? 'bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]'
                                      : act.status === 'In Hold / Follow Up'
                                        ? 'bg-[#EFF6FF] text-[#1D4ED8] border border-[#BFDBFE]'
                                        : act.status === 'Walkin'
                                          ? 'bg-[#F4F1EA] text-[#5E5A52] border border-[#E4DFD4]'
                                          : 'bg-[#FEE2E2] text-[#B91C1C] border border-[#FECACA]'
                                }`}
                              >
                                {act.status}
                              </span>
                              <div className="text-[10px] text-[#8A8479] mt-1 font-medium">
                                {act.customers_count || 1} Person{(act.customers_count || 1) > 1 ? 's' : ''} Attended
                              </div>
                            </td>

                            {/* Product value */}
                            <td className="px-4 py-3.5 whitespace-nowrap">
                              <div className="flex items-center gap-1 font-bold text-[#21845F] text-sm font-mono">
                                <IndianRupee className="w-3.5 h-3.5" />
                                <span>
                                  {(act.product_value || 0).toLocaleString('en-IN', {
                                    minimumFractionDigits: 0,
                                  })}
                                </span>
                              </div>
                            </td>

                            {/* Special tags */}
                            <td className="px-4 py-3.5">
                              <div className="flex flex-wrap items-center gap-1.5">
                                {subrecords.hasScheme && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A] text-[10px] font-bold">
                                    <Award className="w-3 h-3 text-[#D97706]" />
                                    <span>{subrecords.schemePlan || 'Scheme'}</span>
                                    {subrecords.schemeMonthly && (
                                      <span className="font-mono"> (₹{subrecords.schemeMonthly})</span>
                                    )}
                                  </span>
                                )}

                                {subrecords.hasReview && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#EFF6FF] text-[#1D4ED8] border border-[#BFDBFE] text-[10px] font-bold">
                                    <Star className="w-3 h-3 text-[#F59E0B] fill-[#F59E0B]" />
                                    <span>{subrecords.reviewRating}★ Review</span>
                                  </span>
                                )}

                                {subrecords.hasFeedback && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#FDF2F8] text-[#BE185D] border border-[#FBCFE8] text-[10px] font-bold">
                                    <MessageSquareHeart className="w-3 h-3 text-[#EC4899]" />
                                    <span>Feedback ({subrecords.feedbackRating}★)</span>
                                  </span>
                                )}

                                {subrecords.hasVideoReview && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#F3E8FF] text-[#7E22CE] border border-[#D8B4FE] text-[10px] font-bold">
                                    <Video className="w-3 h-3 text-[#7E22CE]" />
                                    <span>{subrecords.videosCount} Video(s) • +{subrecords.videosCount * 5} Pts</span>
                                  </span>
                                )}

                                {!subrecords.hasScheme &&
                                  !subrecords.hasReview &&
                                  !subrecords.hasFeedback && (
                                    <span className="text-[11px] text-[#8A8479]">
                                      Standard Walkin
                                    </span>
                                  )}
                              </div>
                            </td>

                            {/* Approval Status */}
                            <td className="px-4 py-3.5 whitespace-nowrap">
                              {isPending && (
                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FEFCE8] border border-[#FEF08A] text-[#854D0E] text-[11px] font-bold shadow-2xs">
                                  <Clock className="w-3.5 h-3.5 text-[#EAB308]" />
                                  <span>Pending Verification</span>
                                </div>
                              )}
                              {isApproved && (
                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#F0FDF4] border border-[#BBF7D0] text-[#166534] text-[11px] font-bold shadow-2xs">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-[#16A34A]" />
                                  <span>Approved{act.reviewed_by_name ? ` by ${act.reviewed_by_name}` : ''}</span>
                                </div>
                              )}
                              {isRejected && (
                                <div>
                                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FEF2F2] border border-[#FECACA] text-[#991B1B] text-[11px] font-bold shadow-2xs">
                                    <XCircle className="w-3.5 h-3.5 text-[#EF4444]" />
                                    <span>Rejected{act.reviewed_by_name ? ` by ${act.reviewed_by_name}` : ''}</span>
                                  </div>
                                  {act.rejection_reason && (
                                    <p className="text-[10px] text-[#DC2626] mt-1 max-w-[150px] truncate" title={act.rejection_reason}>
                                      Note: {act.rejection_reason}
                                    </p>
                                  )}
                                </div>
                              )}
                            </td>

                            {/* Notes */}
                            <td className="px-4 py-3.5 max-w-xs">
                              {act.notes ? (
                                <p className="text-[11px] text-[#6B6559] line-clamp-2" title={act.notes}>
                                  {act.notes}
                                </p>
                              ) : (
                                <span className="text-[11px] text-[#8A8479] italic">—</span>
                              )}
                            </td>

                            {/* Actions Column: Edit / Update, WhatsApp, Delete */}
                            <td className="px-4 py-3.5 text-right whitespace-nowrap">
                              <div className="inline-flex items-center gap-1">
                                {/* Update Button */}
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditCustomer(act)}
                                  title="Edit / Update customer log"
                                  className="p-1.5 rounded-lg bg-white border border-[#E6E1D6] hover:bg-[#F3E8FF] hover:border-[#D8B4FE] text-[#7E22CE] transition-all cursor-pointer shadow-2xs"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>

                                {/* WhatsApp Button if phone is present */}
                                {act.phone_number && (
                                  <a
                                    href={`https://wa.me/${act.phone_number.replace(/\D/g, '')}?text=${encodeURIComponent(
                                      `Namaste ${act.customer_name || 'Customer'}, thank you for visiting Siri Samruddhi Gold Palace ${selectedBranch?.name || ''} showroom! Explore our premier gold saving schemes and royal jewelry collection.`
                                    )}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    title="Send WhatsApp message"
                                    className="p-1.5 rounded-lg bg-white border border-[#E6E1D6] hover:bg-[#E8F4EE] hover:border-[#A7F3D0] text-[#25D366] transition-all cursor-pointer shadow-2xs"
                                  >
                                    <WhatsAppIcon className="w-3.5 h-3.5" />
                                  </a>
                                )}

                                {/* Delete Button */}
                                <button
                                  type="button"
                                  onClick={() => handleDeleteCustomerActivity(act.id)}
                                  title="Delete customer log"
                                  className="p-1.5 rounded-lg bg-white border border-[#E6E1D6] hover:bg-red-50 hover:border-red-200 text-[#C24141] hover:text-red-700 transition-all cursor-pointer shadow-2xs"
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
            </>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------------- */}
        {/* TAB 2: CALL ACTIVITIES                                              */}
        {/* ------------------------------------------------------------------- */}
        {activeTab === 'CALLS' && (
          <div className="space-y-4">
            {/* Filter Bar */}
            <div className="bg-white border border-[#E6E1D6] rounded-2xl p-3 sm:p-4 flex flex-col md:flex-row items-center justify-between gap-3 shadow-xs">
              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8A8479]" />
                <input
                  type="text"
                  placeholder="Search customer calls, notes, purpose..."
                  value={callSearch}
                  onChange={(e) => setCallSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchCallLogs()}
                  className="w-full pl-9 pr-4 py-2 bg-[#FAF8F5] border border-[#CBD5E1] rounded-xl text-xs text-[#1D1D1B] placeholder-[#8A8479] focus:outline-hidden focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/10 shadow-inner"
                />
              </div>

              {/* Status Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto">
                <span className="text-xs font-semibold text-[#6B6559] mr-1 hidden sm:inline">Status:</span>
                {(['ALL', 'Done', 'Pending'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setCallStatusFilter(tab)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                      callStatusFilter === tab
                        ? 'bg-[#2563EB] text-white shadow-xs'
                        : 'bg-[#FAF8F5] text-[#6B6559] border border-[#E6E1D6] hover:bg-white hover:text-[#1D1D1B]'
                    }`}
                  >
                    {tab === 'ALL' ? 'All Calls' : tab === 'Done' ? 'Completed (Done)' : 'Pending Follow-up'}
                  </button>
                ))}
              </div>
            </div>

            {/* Calls List */}
            {isLoadingCalls ? (
              <div className="py-20 flex justify-center bg-white rounded-3xl border border-[#E6E1D6]">
                <LoadingSpinner message="Loading customer calls..." />
              </div>
            ) : callLogs.length === 0 ? (
              <div className="bg-white rounded-3xl border border-[#E6E1D6] py-16 shadow-xs">
                <EmptyState
                  title="No Call Activities Logged"
                  description="You have not recorded any customer call entries. Click '+ Log Customer Call' to record your telephone interaction."
                  icon={PhoneCall}
                  actionText="+ Log Customer Call"
                  onAction={() => setShowAddCallModal(true)}
                />
              </div>
            ) : (
              <>
                {/* Mobile Responsive Cards for Calls (block sm:hidden) */}
                <div className="block sm:hidden space-y-3">
                  {callLogs.map((log) => (
                    <div
                      key={log.id}
                      className="bg-white border border-[#E6E1D6] rounded-2xl p-4 shadow-xs space-y-3"
                    >
                      <div className="flex items-center justify-between gap-2 pb-2 border-b border-[#F0ECE1]">
                        <div className="text-xs font-bold text-[#1D1D1B]">
                          <span>{log.call_date}</span>
                          <span className="text-[10px] text-[#8A8479] font-mono ml-2">{log.call_time}</span>
                        </div>
                        <span className="px-2 py-0.5 rounded-md bg-[#FAF8F5] border border-[#E6E1D6] text-[10px] font-semibold text-[#6B6559]">
                          {log.purpose}
                        </span>
                      </div>

                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-extrabold text-[#1D1D1B] text-sm">
                            {log.customer_name || 'Customer'}
                          </h4>
                          {log.phone_number ? (
                            <div className="text-xs text-[#6B6559] font-mono mt-1 flex items-center gap-1">
                              <Phone className="w-3 h-3 text-[#8A8479]" />
                              <a href={`tel:${log.phone_number}`} className="hover:underline">{log.phone_number}</a>
                            </div>
                          ) : (
                            <span className="text-[10px] text-[#8A8479] italic mt-0.5 block">No phone</span>
                          )}
                        </div>

                        <button
                          onClick={() => handleToggleCall(log.id)}
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold border cursor-pointer transition-transform shrink-0 ${
                            log.call_status === 'Done'
                              ? 'bg-[#E8F4EE] text-[#21845F] border-[#C5E3D5]'
                              : 'bg-[#FEFCE8] text-[#854D0E] border-[#FEF08A]'
                          }`}
                        >
                          {log.call_status === 'Done' ? '✓ Completed' : '⏱ Pending'}
                        </button>
                      </div>

                      {log.notes && (
                        <p className="text-xs text-[#6B6559] bg-[#FAF8F5] p-2.5 rounded-xl border border-[#EBE6DC] leading-relaxed">
                          {log.notes}
                        </p>
                      )}

                      <div className="pt-2 border-t border-[#F0ECE1] flex items-center justify-end gap-2">
                        {log.phone_number && (
                          <a
                            href={`tel:${log.phone_number}`}
                            className="px-3 py-1.5 rounded-xl bg-white border border-[#E6E1D6] text-[#2563EB] hover:bg-[#EFF6FF] text-xs font-bold shadow-2xs flex items-center gap-1"
                          >
                            <Phone className="w-3.5 h-3.5" />
                            <span>Call</span>
                          </a>
                        )}
                        <button
                          onClick={() => handleDeleteCall(log.id)}
                          className="p-1.5 rounded-xl bg-white border border-[#F5C2C2] text-[#C24141] hover:bg-red-50 shadow-2xs cursor-pointer"
                          title="Delete call log"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Tablet & Desktop Table (hidden sm:block) */}
                <div className="hidden sm:block bg-white border border-[#E6E1D6] rounded-3xl overflow-hidden shadow-xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-[#1D1D1B]">
                    <thead className="bg-[#FAF8F3] text-[#5E5A52] uppercase font-bold text-[11px] tracking-wider border-b border-[#EBE6DC]">
                      <tr>
                        <th className="px-4 py-3.5">Call Date & Time</th>
                        <th className="px-4 py-3.5">Customer & Phone</th>
                        <th className="px-4 py-3.5">Purpose</th>
                        <th className="px-4 py-3.5">Call Status</th>
                        <th className="px-4 py-3.5">Discussion Notes</th>
                        <th className="px-4 py-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F0ECE1]">
                      {callLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-[#FAF9F5] transition-colors">
                          <td className="px-4 py-3.5 whitespace-nowrap">
                            <div className="font-bold text-[#1D1D1B]">{log.call_date}</div>
                            <div className="text-[10px] text-[#8A8479] font-mono mt-0.5">{log.call_time}</div>
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="font-bold text-[#1D1D1B]">{log.customer_name || 'Customer'}</div>
                            {log.phone_number ? (
                              <div className="text-[11px] text-[#6B6559] font-mono mt-0.5">{log.phone_number}</div>
                            ) : (
                              <span className="text-[10px] text-[#8A8479] italic">No phone</span>
                            )}
                          </td>
                          <td className="px-4 py-3.5">
                            <span className="px-2 py-0.5 rounded-md bg-[#FAF8F5] border border-[#E6E1D6] text-[11px] font-semibold text-[#6B6559]">
                              {log.purpose}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 whitespace-nowrap">
                            <button
                              onClick={() => handleToggleCall(log.id)}
                              className={`px-2.5 py-1 rounded-full text-[10px] font-bold border cursor-pointer transition-transform hover:scale-105 ${
                                log.call_status === 'Done'
                                  ? 'bg-[#E8F4EE] text-[#21845F] border-[#C5E3D5]'
                                  : 'bg-[#FEFCE8] text-[#854D0E] border-[#FEF08A]'
                              }`}
                            >
                              {log.call_status === 'Done' ? '✓ Completed' : '⏱ Pending Follow-up'}
                            </button>
                          </td>
                          <td className="px-4 py-3.5 max-w-xs">
                            <p className="text-[11px] text-[#6B6559] line-clamp-2" title={log.notes || ''}>
                              {log.notes || '—'}
                            </p>
                          </td>
                          <td className="px-4 py-3.5 text-right whitespace-nowrap">
                            <div className="inline-flex items-center gap-1">
                              {log.phone_number && (
                                <a
                                  href={`tel:${log.phone_number}`}
                                  className="p-1.5 rounded-lg bg-white border border-[#E6E1D6] text-[#2563EB] hover:bg-[#EFF6FF] shadow-2xs"
                                  title="Call customer"
                                >
                                  <Phone className="w-3.5 h-3.5" />
                                </a>
                              )}
                              <button
                                onClick={() => handleDeleteCall(log.id)}
                                className="p-1.5 rounded-lg bg-white border border-[#E6E1D6] text-[#C24141] hover:bg-red-50 shadow-2xs cursor-pointer"
                                title="Delete call log"
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
            </>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* ------------------------------------------------------------------- */}
        {/* TAB 3: REVIEW POINTS & CUSTOMER DETAILS (TRANSPARENT LEDGER)        */}
        {/* ------------------------------------------------------------------- */}
        {activeTab === 'REVIEWS' && (
          <div className="space-y-6">
            {/* Clean Points Breakdown Banner */}
            <div className="relative rounded-3xl bg-white border border-[#E4DFD4] p-5 sm:p-7 shadow-xs">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-[#EBE6DC]">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full text-xs font-black bg-[#F3E8FF] text-[#7E22CE] border border-[#D8B4FE] flex items-center gap-1.5 shadow-2xs">
                      <Trophy className="w-3.5 h-3.5 text-[#7E22CE]" />
                      <span>Employee Recognition & Points</span>
                    </span>
                    <span className="text-xs text-[#7E22CE] font-bold">Showroom Staff Reward Scheme</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-[#1D1D1B] mt-2 tracking-tight">
                    Review Contributions & Point Ledger
                  </h3>
                  <p className="text-xs sm:text-sm text-[#5E5A52] font-medium mt-1">
                    1 Customer Google Review = <strong className="text-[#7E22CE] font-bold">1 Point</strong> • 1 Video Review = <strong className="text-[#7E22CE] font-bold">5 Points</strong> (5 points per video review)
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    size="sm"
                    onClick={handleOpenAddCustomer}
                    className="bg-[#7E22CE] hover:bg-[#6B21A8] text-white text-xs font-bold rounded-xl px-4 py-2.5 cursor-pointer shadow-sm hover:scale-[1.02] transition-all"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    <span>Add Customer Log</span>
                  </Button>
                </div>
              </div>

              {/* 4 Distinct Solid Colored KPI Cards (Matching Manager Dashboard Palette) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mt-5">
                {/* 1. Total Points Earned (Terracotta #FAF1EC & #B97855) */}
                <div className="p-4 rounded-2xl bg-[#FAF1EC] border border-[#ECCFC0] shadow-xs flex flex-col justify-between">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-[#B97855] uppercase tracking-wider block mb-1">
                        Total Points
                      </span>
                      <div className="text-2xl sm:text-3xl font-bold text-[#1D1D1B] font-mono tracking-tight">
                        {dashboardSummary?.total_points ?? 0}
                      </div>
                    </div>
                    <div className="w-8 h-8 rounded-xl bg-white border border-[#ECCFC0] text-[#B97855] flex items-center justify-center shrink-0">
                      <Award className="w-4 h-4 text-[#B97855]" />
                    </div>
                  </div>
                  <div className="mt-3 pt-2 border-t border-[#ECCFC0] text-[10px] text-[#B97855] font-bold">
                    Credited to your profile
                  </div>
                </div>

                {/* 2. Google Review Points (Purple #F3E8FF & #7E22CE) */}
                <div className="p-4 rounded-2xl bg-[#F3E8FF] border border-[#D8B4FE] shadow-xs flex flex-col justify-between">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-[#7E22CE] uppercase tracking-wider block mb-1">
                        Google Points
                      </span>
                      <div className="text-2xl sm:text-3xl font-bold text-[#1D1D1B] font-mono tracking-tight">
                        {dashboardSummary?.google_review_points ?? 0}
                      </div>
                    </div>
                    <div className="w-8 h-8 rounded-xl bg-white border border-[#D8B4FE] text-[#7E22CE] flex items-center justify-center shrink-0">
                      <Star className="w-4 h-4 fill-[#7E22CE] text-[#7E22CE]" />
                    </div>
                  </div>
                  <div className="mt-3 pt-2 border-t border-[#D8B4FE] text-[10px] text-[#7E22CE] font-bold">
                    1 review = 1 point
                  </div>
                </div>

                {/* 3. Video Review Points (Slate Blue #EDF2F8 & #526F91) */}
                <div className="p-4 rounded-2xl bg-[#EDF2F8] border border-[#C6D4E3] shadow-xs flex flex-col justify-between">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-[#526F91] uppercase tracking-wider block mb-1">
                        Video Points
                      </span>
                      <div className="text-2xl sm:text-3xl font-bold text-[#1D1D1B] font-mono tracking-tight">
                        {dashboardSummary?.video_review_points ?? 0}
                      </div>
                    </div>
                    <div className="w-8 h-8 rounded-xl bg-white border border-[#C6D4E3] text-[#526F91] flex items-center justify-center shrink-0">
                      <Video className="w-4 h-4 text-[#526F91]" />
                    </div>
                  </div>
                  <div className="mt-3 pt-2 border-t border-[#C6D4E3] text-[10px] text-[#526F91] font-bold">
                    5 pts per video review
                  </div>
                </div>

                {/* 4. Pending Manager Review (Yellow #FEFCE8 & #EAB308) */}
                <div className="p-4 rounded-2xl bg-[#FEFCE8] border border-[#EAB308] shadow-xs flex flex-col justify-between">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-[#854D0E] uppercase tracking-wider block mb-1">
                        Pending Review
                      </span>
                      <div className="text-2xl sm:text-3xl font-bold text-[#854D0E] font-mono tracking-tight">
                        {(dashboardSummary?.pending_google_reviews ?? 0) + (dashboardSummary?.pending_video_reviews ?? 0)}
                      </div>
                    </div>
                    <div className="w-8 h-8 rounded-xl bg-white border border-[#EAB308] text-[#CA8A04] flex items-center justify-center shrink-0">
                      <Clock className="w-4 h-4 text-[#CA8A04]" />
                    </div>
                  </div>
                  <div className="mt-3 pt-2 border-t border-[#EAB308]/40 text-[10px] text-[#854D0E] font-bold">
                    In Manager's Queue
                  </div>
                </div>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-white border border-[#E6E1D6] rounded-2xl p-3 sm:p-4 flex flex-col md:flex-row items-center justify-between gap-3 shadow-xs">
              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8A8479]" />
                <input
                  type="text"
                  placeholder="Search customer name, phone, product ID, notes..."
                  value={reviewSearch}
                  onChange={(e) => setReviewSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-[#FAF8F5] border border-[#CBD5E1] rounded-xl text-xs text-[#1D1D1B] placeholder-[#8A8479] focus:outline-hidden focus:border-[#7E22CE] focus:ring-2 focus:ring-[#7E22CE]/10 shadow-inner"
                />
              </div>

              <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto">
                {/* Type Filter */}
                <div className="flex items-center gap-1 p-0.5 bg-[#F4EFE6] rounded-xl border border-[#E5DFD4]">
                  {(['ALL', 'GOOGLE', 'VIDEO'] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setReviewTypeFilter(t)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                        reviewTypeFilter === t
                          ? 'bg-white text-[#1D1D1B] shadow-2xs'
                          : 'text-[#6B6559] hover:text-[#1D1D1B]'
                      }`}
                    >
                      {t === 'ALL' ? 'All Points' : t === 'GOOGLE' ? '⭐ Google (1 pt)' : '🎬 Video (5 pts)'}
                    </button>
                  ))}
                </div>

                {/* Status Filter */}
                <div className="flex items-center gap-1 p-0.5 bg-[#F4EFE6] rounded-xl border border-[#E5DFD4]">
                  {(['ALL', 'APPROVED', 'PENDING', 'REJECTED'] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => setReviewStatusFilter(s)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                        reviewStatusFilter === s
                          ? s === 'APPROVED'
                            ? 'bg-[#E8F4EE] text-[#21845F] shadow-2xs font-extrabold'
                            : s === 'PENDING'
                            ? 'bg-[#FEFCE8] text-[#854D0E] shadow-2xs font-extrabold'
                            : s === 'REJECTED'
                            ? 'bg-red-100 text-[#C24141] shadow-2xs font-extrabold'
                            : 'bg-white text-[#1D1D1B] shadow-2xs'
                          : 'text-[#6B6559] hover:text-[#1D1D1B]'
                      }`}
                    >
                      {s === 'ALL' ? 'All Status' : s === 'APPROVED' ? 'Approved' : s === 'PENDING' ? 'Pending' : 'Rejected'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Combined Ledger of Customer Log Reviews */}
            {(() => {
              // Extract review items directly from Customer Activities
              const customerReviewItems: DetailedReviewItem[] = [];

              for (const act of customerActivities) {
                if (!act.breakdown) continue;
                try {
                  const items = JSON.parse(act.breakdown);
                  if (Array.isArray(items)) {
                    items.forEach((item, idx) => {
                      // 1. Google Review
                      if (item.has_google_review || item.google_review_text || item.google_review_screenshot) {
                        customerReviewItems.push({
                          id: `cust-act-${act.id}-g-${idx}`,
                          activityId: act.id,
                          activityDate: act.activity_date,
                          customerName: item.name || act.customer_name || `Customer #${idx + 1}`,
                          phoneNumber: item.phone || act.phone_number,
                          productId: item.product_id,
                          productValue: item.product_value ?? act.product_value,
                          customerStatus: item.status || act.status || 'Walkin',
                          reviewType: 'GOOGLE',
                          rating: item.google_review_rating ? Number(item.google_review_rating) : 5,
                          reviewText: item.google_review_text || '',
                          photoProofUrl: item.google_review_screenshot || item.screenshot_url || '',
                          approvalStatus: (act.approval_status || 'PENDING') as any,
                          reviewedByName: act.reviewed_by_name || undefined,
                          rejectionReason: act.rejection_reason,
                          pointsEarned: 1,
                          notes: item.notes || act.notes,
                          rawActivity: act,
                        });
                      }

                      // 2. Video Review
                      if (item.has_video_review || item.video_title || item.video_screenshot) {
                        const vCount = item.videos_count ? Number(item.videos_count) : 1;
                        customerReviewItems.push({
                          id: `cust-act-${act.id}-v-${idx}`,
                          activityId: act.id,
                          activityDate: act.activity_date,
                          customerName: item.name || act.customer_name || `Customer #${idx + 1}`,
                          phoneNumber: item.phone || act.phone_number,
                          productId: item.product_id,
                          productValue: item.product_value ?? act.product_value,
                          customerStatus: item.status || act.status || 'Walkin',
                          reviewType: 'VIDEO',
                          videosCount: vCount,
                          videoTitle: item.video_title || '',
                          photoProofUrl: item.video_screenshot || item.screenshot_url || '',
                          approvalStatus: (act.approval_status || 'PENDING') as any,
                          reviewedByName: act.reviewed_by_name || undefined,
                          rejectionReason: act.rejection_reason,
                          pointsEarned: vCount * 5, // Exactly 5 points per video!
                          notes: item.notes || act.notes,
                          rawActivity: act,
                        });
                      }
                    });
                  }
                } catch {}
              }

              // Also include any standalone reviews that might have been recorded in the past
              employeeGoogleReviews.forEach((r) => {
                const alreadyInList = customerReviewItems.some(
                  (c) => c.reviewType === 'GOOGLE' && c.activityDate === r.review_date && c.customerName === r.customer_name
                );
                if (!alreadyInList) {
                  const dummyActivity: CustomerActivity = {
                    id: r.id,
                    branch_id: r.branch_id || 0,
                    employee_id: r.employee_id || 0,
                    activity_date: r.review_date,
                    customer_name: r.customer_name || 'Customer',
                    phone_number: '',
                    product_value: 0,
                    status: 'Walkin',
                    approval_status: (r.status || 'PENDING').toUpperCase() as any,
                    rejection_reason: r.rejection_reason,
                    notes: r.notes,
                  };
                  customerReviewItems.push({
                    id: `g-rev-${r.id}`,
                    activityId: r.id,
                    activityDate: r.review_date,
                    customerName: r.customer_name || 'Customer',
                    phoneNumber: '',
                    productId: '',
                    productValue: 0,
                    customerStatus: 'Walkin',
                    reviewType: 'GOOGLE',
                    rating: r.rating || 5,
                    reviewText: r.review_text || '',
                    photoProofUrl: r.screenshot_url || '',
                    approvalStatus: (r.status || 'PENDING').toUpperCase() as any,
                    reviewedByName: r.reviewed_by_name || undefined,
                    rejectionReason: r.rejection_reason,
                    pointsEarned: 1,
                    notes: r.notes,
                    rawActivity: dummyActivity,
                  });
                }
              });

              employeeVideoReviews.forEach((v) => {
                const alreadyInList = customerReviewItems.some(
                  (c) => c.reviewType === 'VIDEO' && c.activityDate === v.review_date && c.customerName === v.customer_name
                );
                if (!alreadyInList) {
                  const dummyActivity: CustomerActivity = {
                    id: v.id,
                    branch_id: v.branch_id || 0,
                    employee_id: v.employee_id || 0,
                    activity_date: v.review_date,
                    customer_name: v.customer_name || 'Customer',
                    phone_number: '',
                    product_value: 0,
                    status: 'Walkin',
                    approval_status: (v.status || 'PENDING').toUpperCase() as any,
                    rejection_reason: v.rejection_reason,
                    notes: v.notes,
                  };
                  const vCount = v.videos_count ? Number(v.videos_count) : 1;
                  customerReviewItems.push({
                    id: `v-rev-${v.id}`,
                    activityId: v.id,
                    activityDate: v.review_date,
                    customerName: v.customer_name || 'Customer',
                    phoneNumber: '',
                    productId: '',
                    productValue: 0,
                    customerStatus: 'Walkin',
                    reviewType: 'VIDEO',
                    videosCount: vCount,
                    videoTitle: v.video_title || '',
                    photoProofUrl: v.screenshot_url || '',
                    approvalStatus: (v.status || 'PENDING').toUpperCase() as any,
                    reviewedByName: v.reviewed_by_name || undefined,
                    rejectionReason: v.rejection_reason,
                    pointsEarned: vCount * 5,
                    notes: v.notes,
                    rawActivity: dummyActivity,
                  });
                }
              });

              // Apply Filters
              let filtered = [...customerReviewItems].sort((a, b) =>
                new Date(b.activityDate).getTime() - new Date(a.activityDate).getTime()
              );

              if (reviewTypeFilter !== 'ALL') {
                filtered = filtered.filter((item) => item.reviewType === reviewTypeFilter);
              }

              if (reviewStatusFilter !== 'ALL') {
                filtered = filtered.filter((item) => {
                  if (reviewStatusFilter === 'APPROVED') {
                    return item.approvalStatus === 'APPROVED' || (item.approvalStatus as string) === 'VERIFIED';
                  }
                  return item.approvalStatus === reviewStatusFilter;
                });
              }

              if (reviewSearch.trim()) {
                const q = reviewSearch.trim().toLowerCase();
                filtered = filtered.filter(
                  (item) =>
                    item.customerName.toLowerCase().includes(q) ||
                    (item.phoneNumber && item.phoneNumber.includes(q)) ||
                    (item.productId && item.productId.toLowerCase().includes(q)) ||
                    (item.reviewText && item.reviewText.toLowerCase().includes(q)) ||
                    (item.videoTitle && item.videoTitle.toLowerCase().includes(q)) ||
                    (item.notes && item.notes.toLowerCase().includes(q))
                );
              }

              if (filtered.length === 0) {
                return (
                  <div className="bg-white rounded-3xl border border-[#E6E1D6] p-8 text-center space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-[#FEF3C7] text-[#D97706] flex items-center justify-center mx-auto">
                      <Award className="w-6 h-6" />
                    </div>
                    <h4 className="text-sm font-bold text-[#1D1D1B]">No Review Points Found</h4>
                    <p className="text-xs text-[#8A8479] max-w-md mx-auto">
                      Enter a customer interaction in the Customer Log with a Google review (+1 pt) or Video review (+5 pts per video) and attach photo proof to earn points.
                    </p>
                    <Button
                      size="sm"
                      onClick={handleOpenAddCustomer}
                      className="bg-[#7E22CE] hover:bg-[#6B21A8] text-white text-xs font-bold rounded-xl px-4 py-2"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      <span>Add Customer Log</span>
                    </Button>
                  </div>
                );
              }

              return (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filtered.map((item) => {
                    const isApproved = item.approvalStatus === 'APPROVED' || (item.approvalStatus as string) === 'VERIFIED';
                    const isPending = item.approvalStatus === 'PENDING';
                    const isRejected = item.approvalStatus === 'REJECTED';

                    return (
                      <div
                        key={item.id}
                        className="bg-white border border-[#E6E1D6] hover:border-[#536B8A] rounded-3xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-3.5"
                      >
                        <div className="space-y-3">
                          {/* Card Header: Type badge & Points Earned */}
                          <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-[#F0ECE1]">
                            {item.reviewType === 'GOOGLE' ? (
                              <span className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A] flex items-center gap-1.5">
                                <Star className="w-3.5 h-3.5 fill-[#D97706] text-[#D97706]" />
                                Google Review
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-[#F3E8FF] text-[#7E22CE] border border-[#D8B4FE] flex items-center gap-1.5">
                                <Video className="w-3.5 h-3.5 text-[#7E22CE]" />
                                Video Review ({item.videosCount} Video{item.videosCount! > 1 ? 's' : ''})
                              </span>
                            )}

                            {/* Points Indicator */}
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[11px] font-black border flex items-center gap-1 ${
                                isApproved
                                  ? 'bg-[#E8F4EE] text-[#21845F] border-[#C5E3D5]'
                                  : isPending
                                  ? 'bg-[#FEFCE8] text-[#854D0E] border-[#FEF08A]'
                                  : 'bg-red-50 text-[#C24141] border-red-200'
                              }`}
                            >
                              <Trophy className="w-3 h-3" />
                              {isApproved
                                ? `+${item.pointsEarned} Pt${item.pointsEarned > 1 ? 's' : ''} Credited`
                                : isPending
                                ? `+${item.pointsEarned} Pt${item.pointsEarned > 1 ? 's' : ''} (Pending)`
                                : '0 Pts (Rejected)'}
                            </span>
                          </div>

                          {/* Customer Details & Date */}
                          <div>
                            <div className="flex items-start justify-between gap-2">
                              <h4 className="text-sm font-black text-[#1D1D1B] truncate flex items-center gap-1">
                                <User className="w-3.5 h-3.5 text-[#B97855] shrink-0" />
                                <span>{item.customerName}</span>
                              </h4>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                  item.customerStatus === 'Sold'
                                    ? 'bg-[#E8F4EE] text-[#21845F] border-[#C5E3D5]'
                                    : item.customerStatus === 'Interested'
                                    ? 'bg-[#FEF3C7] text-[#92400E] border-[#FDE68A]'
                                    : item.customerStatus === 'Lost'
                                    ? 'bg-[#FEF2F2] text-[#991B1B] border-[#FECACA]'
                                    : 'bg-[#FAF8F5] text-[#6B6559] border-[#E6E1D6]'
                                }`}
                              >
                                {item.customerStatus}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 mt-1 text-[11px] text-[#8A8479]">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5 text-[#7E22CE]" />
                                <span>{item.activityDate}</span>
                              </span>
                              <span>•</span>
                              <span className="font-mono">#{item.activityId}</span>
                              {item.phoneNumber && (
                                <>
                                  <span>•</span>
                                  <span className="font-mono">{item.phoneNumber}</span>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Product ID & Value Info (if present) */}
                          {(item.productId || (item.productValue && Number(item.productValue) > 0)) && (
                            <div className="flex items-center justify-between gap-2 px-3 py-2 bg-[#FAF8F5] border border-[#E6E1D6] rounded-xl text-xs">
                              {item.productId ? (
                                <div className="flex items-center gap-1 font-mono font-bold text-[#7E22CE]">
                                  <Sparkles className="w-3 h-3 text-[#D97706]" />
                                  <span>Tag: {item.productId}</span>
                                </div>
                              ) : (
                                <span className="text-[11px] text-[#8A8479]">Product Details</span>
                              )}
                              {item.productValue && Number(item.productValue) > 0 ? (
                                <div className="flex items-center gap-0.5 font-mono font-bold text-[#21845F]">
                                  <IndianRupee className="w-3 h-3" />
                                  <span>{Number(item.productValue).toLocaleString('en-IN')}</span>
                                </div>
                              ) : null}
                            </div>
                          )}

                          {/* Review Details */}
                          {item.reviewType === 'GOOGLE' ? (
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-1">
                                {Array.from({ length: 5 }, (_, i) => (
                                  <Star
                                    key={i}
                                    className={`w-3.5 h-3.5 ${
                                      i < (item.rating || 5)
                                        ? 'fill-[#F59E0B] text-[#F59E0B]'
                                        : 'text-gray-200'
                                    }`}
                                  />
                                ))}
                                <span className="text-[10px] font-bold text-[#8A8479] ml-1">
                                  {item.rating || 5} Stars Google Review
                                </span>
                              </div>
                              {item.reviewText && (
                                <p className="text-xs text-[#5E5A52] italic line-clamp-2 bg-[#FAF8F5] p-2.5 rounded-xl border border-[#F0ECE1]">
                                  "{item.reviewText}"
                                </p>
                              )}
                            </div>
                          ) : (
                            <div className="space-y-1.5 bg-[#FAF8F5] p-2.5 rounded-xl border border-[#F0ECE1]">
                              <div className="text-xs font-bold text-[#1D1D1B] flex items-center gap-1.5">
                                <Play className="w-3.5 h-3.5 text-[#7E22CE] shrink-0" />
                                <span className="truncate">{item.videoTitle || 'Customer Video Review'}</span>
                              </div>
                              <span className="text-[10px] text-[#7E22CE] font-bold block">
                                🎬 {item.videosCount || 1} Video Review(s) • +{(item.videosCount || 1) * 5} Points Earned
                              </span>
                            </div>
                          )}

                          {/* Photo Proof Preview (Click to open lightbox) */}
                          {item.photoProofUrl ? (
                            <div
                              onClick={() => setViewProofUrl(getMediaUrl(item.photoProofUrl))}
                              className="relative rounded-2xl overflow-hidden border border-[#E6E1D6] group cursor-pointer bg-black/5 h-28 flex items-center justify-center transition-all hover:border-[#D97706]"
                            >
                              <img
                                src={getMediaUrl(item.photoProofUrl)}
                                alt="Photo Proof"
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1.5">
                                <Eye className="w-4 h-4" />
                                <span>View Photo Proof</span>
                              </div>
                            </div>
                          ) : (
                            <div className="rounded-xl border border-dashed border-[#CBD5E1] p-2.5 text-center text-[11px] text-[#8A8479] bg-[#FAF8F5]">
                              No photo proof uploaded
                            </div>
                          )}
                        </div>

                        {/* Status Footer & Actions (Requirement 4: Edit & Delete for Employee) */}
                        <div className="pt-3 border-t border-[#F0ECE1] space-y-2.5">
                          <div className="flex items-center justify-between gap-2">
                            {isApproved ? (
                              <span className="text-[11px] font-extrabold text-[#21845F] flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5 text-[#21845F]" />
                                Approved{item.reviewedByName ? ` by ${item.reviewedByName}` : ' by Manager'}
                              </span>
                            ) : isPending ? (
                              <span className="text-[11px] font-bold text-[#854D0E] flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5 text-[#B45309]" />
                                Awaiting Manager Verification
                              </span>
                            ) : (
                              <div className="flex flex-col">
                                <span className="text-[11px] font-extrabold text-[#C24141] flex items-center gap-1">
                                  <XCircle className="w-3.5 h-3.5 text-[#C24141]" />
                                  Rejected{item.reviewedByName ? ` by ${item.reviewedByName}` : ''}
                                </span>
                                {item.rejectionReason && (
                                  <span className="text-[10px] text-[#C24141]/80 line-clamp-1" title={item.rejectionReason}>
                                    Reason: {item.rejectionReason}
                                  </span>
                                )}
                              </div>
                            )}

                            {/* WhatsApp Button */}
                            {item.phoneNumber && (
                              <a
                                href={`https://wa.me/91${item.phoneNumber.replace(/[^0-9]/g, '').slice(-10)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 rounded-lg bg-white border border-[#A6E7B9] text-[#1E7E34] hover:bg-[#E8F8EE] shadow-2xs cursor-pointer"
                                title="WhatsApp customer"
                              >
                                <WhatsAppIcon className="w-3.5 h-3.5" />
                              </a>
                            )}
                          </div>

                          {/* Edit & Delete Action Buttons */}
                          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[#F0ECE1]/60">
                            <button
                              type="button"
                              onClick={() => handleOpenEditCustomer(item.rawActivity)}
                              className="px-2.5 py-1.5 rounded-xl bg-white border border-[#E6E1D6] hover:bg-[#F3E8FF] hover:border-[#D8B4FE] text-[#7E22CE] text-xs font-bold transition-all cursor-pointer shadow-2xs flex items-center justify-center gap-1.5"
                              title="Update customer log details"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                              <span>Update</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteCustomerActivity(item.activityId)}
                              className="px-2.5 py-1.5 rounded-xl bg-white border border-red-200 hover:bg-red-50 text-[#C24141] hover:text-red-700 text-xs font-bold transition-all cursor-pointer shadow-2xs flex items-center justify-center gap-1.5"
                              title="Delete customer log"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        )}

        {/* ------------------------------------------------------------------- */}
        {/* TAB 4: OUTDOOR ENTRY & FIELD CUSTOMER LEADS                         */}
        {/* ------------------------------------------------------------------- */}
        {activeTab === 'OUTDOOR' && (
          <div className="space-y-5">
            {/* Top Bar: Date Selector, Duty Status Badge, and Primary Action Buttons */}
            <div className="bg-white border border-[#C5E3D5] rounded-2xl p-4 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
              {/* Date Navigation */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-black text-[#1B694C] uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-[#23815F]" />
                  <span>Duty Date:</span>
                </span>
                <div className="flex items-center gap-1 bg-[#FAF8F5] border border-[#CBD5E1] rounded-xl p-1 shadow-inner">
                  <button
                    type="button"
                    onClick={() => handleOutdoorDateShift(-1)}
                    className="p-1.5 rounded-lg hover:bg-white text-[#5E5A52] hover:text-[#1D1D1B] transition-all cursor-pointer"
                    title="Previous Day"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <input
                    type="date"
                    value={selectedOutdoorDate}
                    onChange={(e) => setSelectedOutdoorDate(e.target.value)}
                    className="bg-transparent border-0 text-xs font-bold text-[#1D1D1B] focus:outline-hidden px-2 py-1 cursor-pointer"
                  />
                  <button
                    type="button"
                    onClick={() => handleOutdoorDateShift(1)}
                    className="p-1.5 rounded-lg hover:bg-white text-[#5E5A52] hover:text-[#1D1D1B] transition-all cursor-pointer"
                    title="Next Day"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Status & Counts */}
              <div className="flex items-center gap-2.5 flex-wrap">
                {/* Status Badge */}
                {outdoorDuty?.status ? (
                  <span
                    className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 border shadow-2xs ${
                      outdoorDuty.status === 'Approved' || outdoorDuty.status === 'Completed' || outdoorDuty.status === 'Verified'
                        ? 'bg-[#E8F4EE] text-[#21845F] border-[#A7F3D0]'
                        : outdoorDuty.status === 'Pending Review'
                        ? 'bg-[#FEFCE8] text-[#854D0E] border-[#FDE047]'
                        : outdoorDuty.status === 'Rejected'
                        ? 'bg-[#FEF2F2] text-[#991B1B] border-[#FECACA]'
                        : 'bg-[#FAF8F5] text-[#5E5A52] border-[#E6E1D6]'
                    }`}
                  >
                    {outdoorDuty.status === 'Pending Review' && <Clock className="w-3.5 h-3.5 text-[#B45309]" />}
                    {(outdoorDuty.status === 'Approved' || outdoorDuty.status === 'Completed' || outdoorDuty.status === 'Verified') && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#21845F]" />
                    )}
                    {outdoorDuty.status === 'Rejected' && <XCircle className="w-3.5 h-3.5 text-[#C24141]" />}
                    <span>{outdoorDuty.status}</span>
                  </span>
                ) : (
                  <span className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#FAF8F5] text-[#8A8479] border border-[#E6E1D6]">
                    📝 New Field Entry
                  </span>
                )}

                {/* Counter Pills */}
                <span className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-[#E8F4EE] text-[#21845F] border border-[#C5E3D5]">
                  👥 {outdoorForm.customers.length} Attended
                </span>
                <span className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-[#FAF5FF] text-[#7E22CE] border border-[#D8B4FE]">
                  ⭐ {outdoorForm.customers.filter((c) => c.has_google_review).length} Reviews
                </span>

                {/* Primary Save Button */}
                <Button
                  onClick={handleSaveOutdoorDuty}
                  disabled={isSavingOutdoor}
                  className="bg-[#23815F] hover:bg-[#1B694C] text-white font-extrabold text-xs flex items-center gap-1.5 px-4 py-2 rounded-xl shadow-xs cursor-pointer"
                >
                  {isSavingOutdoor ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <Save className="w-4 h-4 text-white" />}
                  <span>{isSavingOutdoor ? 'Saving...' : 'Save & Submit'}</span>
                </Button>
              </div>
            </div>

            {/* Outdoor Customer Leads & Interactions List */}
            <div className="bg-white border border-[#C5E3D5] rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[#EBE6DC] pb-3">
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-[#1D1D1B] flex items-center gap-2">
                    <Users className="w-4 h-4 text-[#23815F]" />
                    <span>Outdoor Attended Customers & Leads ({outdoorForm.customers.length})</span>
                  </h3>
                  <p className="text-xs text-[#5E5A52] mt-0.5">
                    Log name, mobile number, jewelry preferences, reviews, and conversion details.
                  </p>
                </div>

                <Button
                  onClick={handleAddOutdoorCustomer}
                  className="bg-[#23815F] hover:bg-[#1B694C] text-white font-extrabold text-xs flex items-center gap-1.5 px-3.5 py-2 rounded-xl shadow-xs cursor-pointer"
                >
                  <Plus className="w-4 h-4 text-white" />
                  <span>+ Add Customer</span>
                </Button>
              </div>

              {isLoadingOutdoor ? (
                <div className="py-12 flex flex-col items-center justify-center text-[#5E5A52]">
                  <Loader2 className="w-8 h-8 animate-spin text-[#23815F] mb-2" />
                  <p className="text-xs font-bold">Loading outdoor marketing log...</p>
                </div>
              ) : outdoorForm.customers.length === 0 ? (
                <div className="py-10 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#E8F4EE] border border-[#C5E3D5] text-[#23815F] flex items-center justify-center mx-auto shadow-2xs">
                    <Users className="w-6 h-6 text-[#23815F]" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#1D1D1B]">No Outdoor Customers Logged for this Date</h4>
                    <p className="text-xs text-[#8A8479] max-w-sm mx-auto mt-1">
                      Click the button below to start entering customer leads attended during outdoor duty.
                    </p>
                  </div>
                  <Button
                    onClick={handleAddOutdoorCustomer}
                    className="bg-[#23815F] hover:bg-[#1B694C] text-white font-extrabold text-xs inline-flex items-center gap-1.5 px-4 py-2 rounded-xl shadow-xs cursor-pointer"
                  >
                    <Plus className="w-4 h-4 text-white" />
                    <span>+ Add First Customer Entry</span>
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {outdoorForm.customers.map((cust, cIdx) => (
                    <div
                      key={cIdx}
                      className="bg-[#FAF8F5] border border-[#E6E1D6] hover:border-[#23815F] rounded-2xl p-4 sm:p-4.5 space-y-3.5 transition-all shadow-2xs"
                    >
                      {/* Row Header */}
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
                          onClick={() => handleRemoveOutdoorCustomer(cIdx)}
                          className="p-1 text-[#8A8479] hover:text-red-600 rounded-lg transition-colors cursor-pointer"
                          title="Remove this customer row"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Customer Details Form */}
                      <div className="space-y-3.5">
                        {/* Row 1: Name & Phone */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {/* 1. Name */}
                          <div>
                            <label className="block text-[11px] font-bold text-[#5E5A52] uppercase mb-1 flex items-center gap-1">
                              <User className="w-3 h-3 text-[#23815F]" />
                              <span>Customer Name <span className="text-red-500">*</span></span>
                            </label>
                            <input
                              type="text"
                              placeholder="Full name"
                              value={cust.name}
                              onChange={(e) => handleUpdateOutdoorCustomer(cIdx, 'name', e.target.value)}
                              className="w-full px-3 py-2 bg-white border border-[#CBD5E1] rounded-xl text-xs text-[#1D1D1B] focus:border-[#23815F] focus:outline-hidden font-medium"
                            />
                          </div>

                          {/* 2. Phone */}
                          <div>
                            <label className="block text-[11px] font-bold text-[#5E5A52] uppercase mb-1 flex items-center gap-1">
                              <Phone className="w-3 h-3 text-[#23815F]" />
                              <span>Mobile Number</span>
                            </label>
                            <input
                              type="tel"
                              placeholder="10-digit mobile"
                              value={cust.phone}
                              onChange={(e) => handleUpdateOutdoorCustomer(cIdx, 'phone', e.target.value)}
                              className="w-full px-3 py-2 bg-white border border-[#CBD5E1] rounded-xl text-xs text-[#1D1D1B] focus:border-[#23815F] focus:outline-hidden font-mono"
                            />
                          </div>
                        </div>

                        {/* Row 2: Location & Proof Photo (1) */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {/* Field Location */}
                          <div>
                            <label className="block text-[11px] font-bold text-[#5E5A52] uppercase mb-1 flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-[#23815F]" />
                              <span>Field Location / Market Area</span>
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. Market Booth, Yelahanka 4th Cross..."
                              value={cust.area_name}
                              onChange={(e) => handleUpdateOutdoorCustomer(cIdx, 'area_name', e.target.value)}
                              className="w-full px-3 py-2 bg-white border border-[#CBD5E1] rounded-xl text-xs text-[#1D1D1B] focus:border-[#23815F] focus:outline-hidden font-medium"
                            />
                          </div>

                          {/* Field Photo (1) */}
                          <div>
                            <label className="block text-[11px] font-bold text-[#5E5A52] uppercase mb-1 flex items-center gap-1">
                              <Camera className="w-3 h-3 text-[#23815F]" />
                              <span>Field Photo (1) Proof</span>
                            </label>

                            {cust.photo_url ? (
                              <div className="flex items-center gap-2 bg-white border border-[#C5E3D5] rounded-xl p-1.5 shadow-2xs">
                                <img
                                  src={getMediaUrl(cust.photo_url)}
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
                                    onClick={() => setViewProofUrl(getMediaUrl(cust.photo_url))}
                                    className="p-1.5 rounded-lg bg-[#E8F4EE] hover:bg-[#D1FAE5] text-[#21845F] transition-all cursor-pointer"
                                    title="View Photo"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateOutdoorCustomer(cIdx, 'photo_url', '')}
                                    className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition-all cursor-pointer"
                                    title="Remove Photo"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <label className="flex items-center justify-center gap-1.5 w-full py-2 px-3 rounded-xl border border-dashed border-[#CBD5E1] hover:border-[#23815F] bg-white hover:bg-[#E8F4EE] text-xs font-bold text-[#23815F] cursor-pointer transition-all shadow-2xs">
                                {uploadingCustomerPhotoIdx === cIdx ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#23815F]" />
                                ) : (
                                  <Camera className="w-3.5 h-3.5 text-[#23815F]" />
                                )}
                                <span>{uploadingCustomerPhotoIdx === cIdx ? 'Uploading photo...' : '+ Upload Field Photo (1)'}</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  capture="environment"
                                  onChange={(e) => handleUploadCustomerPhoto(cIdx, e)}
                                  disabled={uploadingCustomerPhotoIdx === cIdx}
                                  className="hidden"
                                />
                              </label>
                            )}
                          </div>
                        </div>

                        {/* Row 3: Important Dates (DOB, Anniversary, Follow-up / Notification Date) */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          {/* DOB */}
                          <div>
                            <label className="block text-[11px] font-bold text-[#5E5A52] uppercase mb-1 flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-[#7E22CE]" />
                              <span>Date of Birth</span>
                            </label>
                            <input
                              type="date"
                              value={cust.dob}
                              onChange={(e) => handleUpdateOutdoorCustomer(cIdx, 'dob', e.target.value)}
                              className="w-full px-3 py-2 bg-white border border-[#CBD5E1] rounded-xl text-xs text-[#1D1D1B] focus:border-[#23815F] focus:outline-hidden font-medium cursor-pointer"
                            />
                          </div>

                          {/* Anniversary Date */}
                          <div>
                            <label className="block text-[11px] font-bold text-[#5E5A52] uppercase mb-1 flex items-center gap-1">
                              <Gift className="w-3 h-3 text-[#D97706]" />
                              <span>Anniversary Date</span>
                            </label>
                            <input
                              type="date"
                              value={cust.anniversary_date}
                              onChange={(e) => handleUpdateOutdoorCustomer(cIdx, 'anniversary_date', e.target.value)}
                              className="w-full px-3 py-2 bg-white border border-[#CBD5E1] rounded-xl text-xs text-[#1D1D1B] focus:border-[#23815F] focus:outline-hidden font-medium cursor-pointer"
                            />
                          </div>

                          {/* Follow-up / Notification Date */}
                          <div>
                            <label className="block text-[11px] font-bold text-[#5E5A52] uppercase mb-1 flex items-center gap-1">
                              <Bell className="w-3 h-3 text-[#2563EB]" />
                              <span className="text-[#1E40AF] font-black">Follow-up / Notification Date</span>
                            </label>
                            <input
                              type="date"
                              value={cust.follow_up_date}
                              onChange={(e) => handleUpdateOutdoorCustomer(cIdx, 'follow_up_date', e.target.value)}
                              className="w-full px-3 py-2 bg-[#EFF6FF] border border-[#93C5FD] rounded-xl text-xs text-[#1E3A8A] focus:border-[#2563EB] focus:outline-hidden font-medium cursor-pointer"
                            />
                          </div>
                        </div>

                        {/* Jewelry Interest & Conversion Row */}
                        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#EBE6DC]/80">
                          {/* Interest Toggles */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[11px] font-bold text-[#5E5A52] uppercase mr-1">
                              Interested In:
                            </span>
                            {/* Gold Pill */}
                            <button
                              type="button"
                              onClick={() => handleUpdateOutdoorCustomer(cIdx, 'interested_gold', !cust.interested_gold)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                                cust.interested_gold
                                  ? 'bg-[#FEFCE8] text-[#854D0E] border-[#CA8A04] shadow-2xs font-black'
                                  : 'bg-white text-[#5E5A52] border-[#CBD5E1] hover:bg-[#FAF8F5]'
                              }`}
                            >
                              <span>🪙 Gold</span>
                              {cust.interested_gold && <Check className="w-3 h-3 text-[#854D0E]" />}
                            </button>

                            {/* Diamond Pill */}
                            <button
                              type="button"
                              onClick={() => handleUpdateOutdoorCustomer(cIdx, 'interested_diamond', !cust.interested_diamond)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                                cust.interested_diamond
                                  ? 'bg-[#EFF6FF] text-[#1E40AF] border-[#3B82F6] shadow-2xs font-black'
                                  : 'bg-white text-[#5E5A52] border-[#CBD5E1] hover:bg-[#FAF8F5]'
                              }`}
                            >
                              <span>💎 Diamond</span>
                              {cust.interested_diamond && <Check className="w-3 h-3 text-[#1E40AF]" />}
                            </button>

                            {/* Silver Pill */}
                            <button
                              type="button"
                              onClick={() => handleUpdateOutdoorCustomer(cIdx, 'interested_silver', !cust.interested_silver)}
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

                          {/* Conversion Checkbox */}
                          <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-[#CBD5E1] hover:border-[#23815F] text-xs font-bold text-[#1D1D1B] cursor-pointer shadow-2xs transition-all">
                            <input
                              type="checkbox"
                              checked={Boolean(cust.is_converted)}
                              onChange={(e) => handleUpdateOutdoorCustomer(cIdx, 'is_converted', e.target.checked)}
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
                                onChange={(e) => handleUpdateOutdoorCustomer(cIdx, 'has_google_review', e.target.checked)}
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
                                      onClick={() => handleUpdateOutdoorCustomer(cIdx, 'google_review_rating', star)}
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
                                  placeholder="Review text or customer praise summary..."
                                  value={cust.google_review_text}
                                  onChange={(e) => handleUpdateOutdoorCustomer(cIdx, 'google_review_text', e.target.value)}
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
                                checked={cust.has_customer_feedback}
                                onChange={(e) => handleUpdateOutdoorCustomer(cIdx, 'has_customer_feedback', e.target.checked)}
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
                                      onClick={() => handleUpdateOutdoorCustomer(cIdx, 'feedback_rating', star)}
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
                                  placeholder="Feedback notes, designs inquired, customer impressions..."
                                  value={cust.feedback_text}
                                  onChange={(e) => handleUpdateOutdoorCustomer(cIdx, 'feedback_text', e.target.value)}
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
                            placeholder="Key conversation notes, customer requirements (e.g. looking for 22kt antique choker, budget ₹1.5L), follow-up observations..."
                            value={cust.notes}
                            onChange={(e) => handleUpdateOutdoorCustomer(cIdx, 'notes', e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-[#CBD5E1] rounded-xl text-xs text-[#1D1D1B] focus:border-[#23815F] focus:outline-hidden font-medium resize-none"
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Add Another Customer Button */}
                  <button
                    type="button"
                    onClick={handleAddOutdoorCustomer}
                    className="w-full py-3.5 rounded-2xl border-2 border-dashed border-[#C5E3D5] hover:border-[#23815F] bg-[#FAF8F5] hover:bg-[#E8F4EE] text-[#23815F] font-extrabold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs hover:scale-[1.005]"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ Add Another Customer Lead</span>
                  </button>
                </div>
              )}

              {/* Bottom Save & Submission Bar */}
              <div className="pt-4 border-t border-[#EBE6DC] flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-[11px] text-[#5E5A52] flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-[#23815F] shrink-0" />
                  <span>
                    Submits directly to Showroom Manager for review • Status updates to <strong>Pending Review</strong> • Zero WhatsApp messages sent.
                  </span>
                </div>

                <Button
                  onClick={handleSaveOutdoorDuty}
                  disabled={isSavingOutdoor}
                  className="w-full sm:w-auto bg-[#23815F] hover:bg-[#1B694C] text-white font-extrabold text-xs flex items-center justify-center gap-2 px-6 py-3 rounded-xl shadow-md cursor-pointer hover:scale-102 active:scale-98 transition-all"
                >
                  {isSavingOutdoor ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <Save className="w-4 h-4 text-white" />}
                  <span>{isSavingOutdoor ? 'Submitting to Manager...' : 'Save & Submit Outdoor Entries'}</span>
                </Button>
              </div>
            </div>

            {/* Past Outdoor Duty History Card */}
            {outdoorHistory.length > 0 && (
              <div className="bg-white border border-[#E6E1D6] rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
                <h4 className="text-xs font-black text-[#1D1D1B] uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#526F91]" />
                  <span>Recent Outdoor Duty History</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
                  {outdoorHistory.slice(0, 8).map((hist) => (
                    <div
                      key={hist.id}
                      onClick={() => setSelectedOutdoorDate(hist.date)}
                      className={`p-3 rounded-xl border text-xs cursor-pointer transition-all hover:shadow-sm ${
                        hist.date === selectedOutdoorDate
                          ? 'bg-[#E8F4EE] border-[#23815F] ring-1 ring-[#23815F]'
                          : 'bg-[#FAF8F5] border-[#E6E1D6] hover:bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between font-bold text-[#1D1D1B] mb-1">
                        <span>{hist.date}</span>
                        <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
                          hist.status === 'Approved' || hist.status === 'Completed' || hist.status === 'Verified'
                            ? 'bg-[#E8F4EE] text-[#21845F]'
                            : hist.status === 'Pending Review'
                            ? 'bg-[#FEFCE8] text-[#854D0E]'
                            : 'bg-gray-100 text-[#5E5A52]'
                        }`}>
                          {hist.status || 'Active'}
                        </span>
                      </div>
                      <div className="text-[11px] text-[#5E5A52] truncate">
                        📍 {hist.area || 'Field Area'}
                      </div>
                      <div className="text-[11px] text-[#8A8479] mt-1 flex items-center justify-between">
                        <span>{hist.customers?.length || hist.customers_attended_count || 0} leads</span>
                        <span className="text-[#23815F] font-bold">Open Date &rarr;</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
</main>

      {/* ------------------------------------------------------------------- */}
      {/* MODAL: ADD / EDIT CUSTOMER LOG (WITH ALL MANAGER OPTIONS & SCHEMES)  */}
      {/* ------------------------------------------------------------------- */}
      <CustomerActivityModal
        isOpen={showCustomerModal}
        onClose={() => {
          setShowCustomerModal(false);
          setEditingActivity(null);
        }}
        onSaved={() => {
          fetchCustomerActivities();
          fetchSummary();
        }}
        employeeId={dashboardSummary?.employee_id || user?.id}
        employeeName={dashboardSummary?.employee_name || user?.full_name}
        initialData={editingActivity}
        apiBaseUrl="/api/v1/employee/customers"
        defaultCustomerCount={1}
      />

      {/* ------------------------------------------------------------------- */}
      {/* MODAL: ADD CALL LOG                                                 */}
      {/* ------------------------------------------------------------------- */}
      {showAddCallModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-white border border-[#E4DFD4] rounded-3xl w-full max-w-lg p-6 shadow-2xl relative my-8 text-[#1D1D1B]">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-[#EBE6DC]">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-[#EFF6FF] border border-[#BFDBFE] flex items-center justify-center text-[#2563EB] shadow-2xs">
                  <PhoneCall className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#1D1D1B]">
                    Log Customer Call
                  </h3>
                  <p className="text-xs text-[#6B6559]">
                    Record telephone interaction or follow-up with showroom customer.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAddCallModal(false)}
                className="text-[#8A8479] hover:text-[#1D1D1B] p-1.5 rounded-xl hover:bg-[#FAF8F5] transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateCallLog} className="py-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Customer Name */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-[#5E5A52] mb-1">
                    Customer Name (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Anitha Sharma"
                    value={callForm.customer_name}
                    onChange={(e) => setCallForm({ ...callForm, customer_name: e.target.value })}
                    className="w-full bg-[#FAF8F5] border border-[#CBD5E1] rounded-xl px-3 py-2 text-xs text-[#1D1D1B] placeholder-[#8A8479] focus:outline-hidden focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/10 shadow-inner"
                  />
                </div>

                {/* Customer Phone */}
                <div>
                  <label className="block text-xs font-bold text-[#5E5A52] mb-1">
                    Phone Number (Optional)
                  </label>
                  <input
                    type="tel"
                    placeholder="e.g. 9845012345"
                    value={callForm.phone_number}
                    onChange={(e) => setCallForm({ ...callForm, phone_number: e.target.value })}
                    className="w-full bg-[#FAF8F5] border border-[#CBD5E1] rounded-xl px-3 py-2 text-xs text-[#1D1D1B] placeholder-[#8A8479] focus:outline-hidden focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/10 font-mono shadow-inner"
                  />
                </div>

                {/* Call Status */}
                <div>
                  <label className="block text-xs font-bold text-[#1D1D1B] mb-1">
                    Status
                  </label>
                  <select
                    value={callForm.call_status}
                    onChange={(e) => setCallForm({ ...callForm, call_status: e.target.value as any })}
                    className="w-full bg-[#FAF8F5] border border-[#CBD5E1] rounded-xl px-3 py-2 text-xs font-bold text-[#1D1D1B] focus:outline-hidden focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/10 shadow-inner"
                  >
                    <option value="Done">Completed (Call Finished)</option>
                    <option value="Pending">Pending (Scheduled / Callback needed)</option>
                  </select>
                </div>

                {/* Call Date */}
                <div>
                  <label className="block text-xs font-bold text-[#5E5A52] mb-1">
                    Call Date
                  </label>
                  <input
                    type="date"
                    value={callForm.call_date}
                    onChange={(e) => setCallForm({ ...callForm, call_date: e.target.value })}
                    className="w-full bg-[#FAF8F5] border border-[#CBD5E1] rounded-xl px-3 py-2 text-xs text-[#1D1D1B] focus:outline-hidden focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/10 shadow-inner"
                  />
                </div>

                {/* Call Time */}
                <div>
                  <label className="block text-xs font-bold text-[#5E5A52] mb-1">
                    Call Time
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 11:30 AM"
                    value={callForm.call_time}
                    onChange={(e) => setCallForm({ ...callForm, call_time: e.target.value })}
                    className="w-full bg-[#FAF8F5] border border-[#CBD5E1] rounded-xl px-3 py-2 text-xs text-[#1D1D1B] focus:outline-hidden focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/10 shadow-inner"
                  />
                </div>

                {/* Purpose */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-[#5E5A52] mb-1">
                    Call Purpose
                  </label>
                  <select
                    value={callForm.purpose}
                    onChange={(e) => setCallForm({ ...callForm, purpose: e.target.value })}
                    className="w-full bg-[#FAF8F5] border border-[#CBD5E1] rounded-xl px-3 py-2 text-xs font-bold text-[#1D1D1B] focus:outline-hidden focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/10 shadow-inner"
                  >
                    <option value="Follow-up Call">Follow-up Call (Showroom Visit)</option>
                    <option value="Gold Scheme Installment">Gold Scheme Installment Reminder</option>
                    <option value="Birthday / Anniversary Wish">Birthday / Anniversary Greetings</option>
                    <option value="New Jewellery Collection">New Jewellery Collection Notification</option>
                    <option value="Custom Order Ready">Custom Order Delivery Ready</option>
                    <option value="General Inquiry">General Showroom Inquiry</option>
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-[#5E5A52] mb-1">
                  Discussion Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Customer confirmed visiting showroom on Sunday for bangle purchase..."
                  value={callForm.notes}
                  onChange={(e) => setCallForm({ ...callForm, notes: e.target.value })}
                  className="w-full bg-[#FAF8F5] border border-[#CBD5E1] rounded-xl p-3 text-xs text-[#1D1D1B] placeholder-[#8A8479] focus:outline-hidden focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/10 shadow-inner"
                />
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#EBE6DC]">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddCallModal(false)}
                  disabled={isSubmittingCall}
                  className="bg-white hover:bg-[#FAF8F5] text-[#1D1D1B] border-[#E6E1D6] text-xs rounded-xl shadow-2xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSubmittingCall}
                  className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-extrabold text-xs shadow-sm rounded-xl px-4 py-2"
                >
                  {isSubmittingCall ? (
                    <span className="flex items-center gap-1.5">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Saving...
                    </span>
                  ) : (
                    'Log Call'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* MODAL: IMAGE PROOF LIGHTBOX PREVIEW                                 */}
      {/* ------------------------------------------------------------------- */}
      {viewProofUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative max-w-3xl w-full max-h-[90vh] flex flex-col items-center">
            <div className="w-full flex items-center justify-between pb-3 text-white">
              <span className="text-sm font-bold flex items-center gap-2">
                <FileImage className="w-4 h-4 text-amber-400" />
                Review Verification Photo Proof
              </span>
              <button
                type="button"
                onClick={() => setViewProofUrl(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="w-full rounded-2xl overflow-hidden bg-black flex items-center justify-center border border-white/10 shadow-2xl">
              <img
                src={viewProofUrl}
                alt="Photo Proof Full"
                className="max-h-[80vh] w-auto max-w-full object-contain"
              />
            </div>
          </div>
        </div>
      )}


      {/* ------------------------------------------------------------------- */}
      {/* MODAL: NOTIFICATIONS (Attire checks & Review approvals)            */}
      {/* Simple, clean, clear layout requested by user                      */}
      {/* ------------------------------------------------------------------- */}
      {showNotificationsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-[#E6E1D6] max-w-xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-[#F0ECE1] flex items-center justify-between gap-3 bg-[#FAF8F5]">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-[#F3E8FF] border border-[#D8B4FE] text-[#7E22CE] flex items-center justify-center shrink-0 shadow-2xs">
                  <Bell className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-sm sm:text-base font-black text-[#1D1D1B] truncate">
                    Manager Updates & Notifications
                  </h2>
                  <p className="text-[11px] text-[#8A8479] truncate">
                    Grooming attire checks and review approvals
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={fetchNotifications}
                  disabled={isLoadingNotifications}
                  className="p-2 rounded-xl text-[#8A8479] hover:text-[#7E22CE] hover:bg-white border border-transparent hover:border-[#E6E1D6] transition-all cursor-pointer"
                  title="Refresh Notifications"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoadingNotifications ? 'animate-spin text-[#7E22CE]' : ''}`} />
                </button>
                <button
                  type="button"
                  onClick={() => setShowNotificationsModal(false)}
                  className="p-2 rounded-xl text-[#8A8479] hover:text-[#1D1D1B] hover:bg-white border border-transparent hover:border-[#E6E1D6] transition-all cursor-pointer"
                  title="Close"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Simple Category Tabs */}
            <div className="px-4 sm:px-5 py-2.5 bg-white border-b border-[#F0ECE1] flex items-center gap-1.5 overflow-x-auto">
              {[
                { id: 'all', label: 'All Updates', count: notifications.length },
                {
                  id: 'attire',
                  label: 'Attire Checks',
                  count: notifications.filter((n) => n.category === 'attire').length,
                },
                {
                  id: 'reviews',
                  label: 'Review Approvals',
                  count: notifications.filter(
                    (n) => n.category === 'google_review' || n.category === 'video_review' || n.category === 'customer_activity'
                  ).length,
                },
              ].map((tab) => {
                const isActive = notificationTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setNotificationTab(tab.id as any)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                      isActive
                        ? 'bg-[#7E22CE] text-white shadow-xs'
                        : 'bg-[#FAF8F5] text-[#5E5A52] hover:bg-[#F3E8FF] hover:text-[#7E22CE]'
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                        isActive ? 'bg-white/20 text-white' : 'bg-[#E6E1D6] text-[#5E5A52]'
                      }`}
                    >
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* List of Simple Notifications */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
              {isLoadingNotifications ? (
                <div className="py-12 flex justify-center">
                  <LoadingSpinner message="Loading updates from showroom manager..." />
                </div>
              ) : notifications.length === 0 ? (
                <div className="py-12 text-center text-[#8A8479] space-y-2">
                  <Bell className="w-8 h-8 mx-auto text-[#CBD5E1]" />
                  <p className="text-xs font-bold text-[#1D1D1B]">No notifications recorded yet</p>
                  <p className="text-[11px] max-w-sm mx-auto">
                    When your showroom manager logs your attire check or approves your customer Google / Video reviews, updates will appear right here.
                  </p>
                </div>
              ) : (
                notifications
                  .filter((n) => {
                    if (notificationTab === 'attire') return n.category === 'attire';
                    if (notificationTab === 'reviews')
                      return (
                        n.category === 'google_review' ||
                        n.category === 'video_review' ||
                        n.category === 'customer_activity'
                      );
                    return true;
                  })
                  .map((item) => {
                    const isApproved =
                      item.status === 'Proper' ||
                      item.status === 'APPROVED' ||
                      item.badge_color === 'green';
                    const isRejected =
                      item.status === 'Not Proper' ||
                      item.status === 'REJECTED' ||
                      item.badge_color === 'red';

                    return (
                      <div
                        key={item.id}
                        className={`p-3.5 sm:p-4 rounded-2xl border transition-all ${
                          isApproved
                            ? 'bg-[#F0FDF4] border-[#BBF7D0]'
                            : isRejected
                              ? 'bg-[#FEF2F2] border-[#FECACA]'
                              : 'bg-[#FFFBEB] border-[#FDE68A]'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-bold shadow-2xs ${
                              isApproved
                                ? 'bg-[#21845F] text-white'
                                : isRejected
                                  ? 'bg-[#DC2626] text-white'
                                  : 'bg-[#7E22CE] text-white'
                            }`}
                          >
                            {item.category === 'attire' ? (
                              <Shield className="w-4 h-4" />
                            ) : isApproved ? (
                              <CheckCircle2 className="w-4 h-4" />
                            ) : isRejected ? (
                              <XCircle className="w-4 h-4" />
                            ) : (
                              <Clock className="w-4 h-4" />
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
                              <span className="text-xs font-black text-[#1D1D1B]">
                                {item.title}
                              </span>
                              <span className="text-[10px] text-[#8A8479] font-mono font-medium">
                                {item.date}
                              </span>
                            </div>

                            <p className="text-xs text-[#374151] leading-relaxed mb-2">
                              {item.message}
                            </p>

                            <div className="flex items-center gap-2 flex-wrap">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                  isApproved
                                    ? 'bg-[#DCFCE7] text-[#166534] border border-[#86EFAC]'
                                    : isRejected
                                      ? 'bg-[#FEE2E2] text-[#991B1B] border border-[#FCA5A5]'
                                      : 'bg-[#FEF3C7] text-[#92400E] border border-[#FCD34D]'
                                }`}
                              >
                                {item.status}
                              </span>
                              <span className="text-[10px] text-[#8A8479] uppercase font-bold">
                                {item.category === 'attire'
                                  ? '👔 Grooming & Attire Check'
                                  : item.category === 'google_review'
                                    ? '⭐ Google Review'
                                    : item.category === 'video_review'
                                      ? '🎥 Video Review'
                                      : '📋 Customer Log'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
              )}
            </div>

            {/* Footer */}
            <div className="p-3 sm:p-4 bg-[#FAF8F5] border-t border-[#F0ECE1] flex items-center justify-between">
              <span className="text-[11px] text-[#8A8479] font-medium">
                Live sync from showroom management
              </span>
              <button
                type="button"
                onClick={() => setShowNotificationsModal(false)}
                className="px-4 py-1.5 rounded-xl bg-white hover:bg-gray-50 border border-[#CBD5E1] text-xs font-bold text-[#1D1D1B] cursor-pointer shadow-2xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* MODAL: SIGN OUT CONFIRMATION                                        */}
      {/* ------------------------------------------------------------------- */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white border border-[#E4DFD4] rounded-3xl w-full max-w-sm p-6 shadow-2xl relative text-[#1D1D1B]">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-red-50 border border-red-200 text-[#C24141] flex items-center justify-center shrink-0">
                <LogOut className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#1D1D1B]">Sign Out</h3>
                <p className="text-xs text-[#8A8479]">End your employee portal session</p>
              </div>
            </div>
            <p className="text-xs text-[#6B6559] mb-6 leading-relaxed">
              Are you sure you want to log out from <strong className="text-[#1D1D1B]">{user?.full_name}</strong>'s portal? You will be returned to the login screen.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#EBE6DC]">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowLogoutModal(false)}
                className="bg-white hover:bg-[#FAF8F5] text-[#1D1D1B] border-[#E6E1D6] text-xs rounded-xl shadow-2xs"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  setShowLogoutModal(false);
                  logout();
                }}
                className="bg-[#C24141] hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-sm"
              >
                Confirm Sign Out
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
