export interface User {
  id: number;
  branch_id: number;
  branch_code: string;
  branch_name: string;
  username: string;
  full_name: string;
  manager_code?: string;
  employee_code?: string;
  email?: string;
  role: string; // "MANAGER" | "SUPER_ADMIN" | "EMPLOYEE"
  is_active: boolean;
}

export type AdminProfile = User;

export interface ManagerPublicOption {
  id: number;
  full_name: string;
  username: string;
  manager_code?: string;
  email?: string;
  branch_id: number;
  branch_code: string;
}

export interface EmployeePublicOption {
  id: number;
  full_name: string;
  employee_code: string;
  username?: string;
  designation?: string;
  department?: string;
  branch_id: number;
  branch_code: string;
}


export interface Branch {
  id: number;
  code: string;
  name: string;
  city: string;
  address?: string;
  phone?: string;
  email?: string;
  description?: string;
  is_active: boolean;
  managers?: ManagerPublicOption[];
  employees?: EmployeePublicOption[];
}

export interface Employee {
  id: number;
  branch_id: number;
  employee_code: string;
  full_name: string;
  phone: string;
  email?: string;
  designation: string;
  department: string;
  date_of_joining: string;
  status: 'active' | 'inactive';
  is_outdoor_marketing_employee: boolean;
  profile_photo_url?: string;
  notes?: string;
  google_review_points?: number;
  video_review_points?: number;
  total_points?: number;
  created_at?: string;
  updated_at?: string;
}

export interface EmployeeDetail extends Employee {
  customers_attended_count: number;
  customers_closed_count: number;
  schemes_closed_count: number;
  form_media_count: number;
  attire_records_count: number;
  google_reviews_count?: number;
  average_rating?: number;
  customer_feedbacks_count?: number;
  customer_feedbacks_avg_rating?: number;
  calls_count?: number;
  calls_done_count?: number;
  calls_pending_count?: number;
}

export interface EmployeeCallLog {
  id: number;
  branch_id: number;
  employee_id: number;
  employee_name?: string;
  customer_name: string;
  phone_number: string;
  customers_count: number;
  call_status: 'Done' | 'Pending' | string;
  call_date: string;
  call_time?: string;
  purpose?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Customer {
  id: number;
  branch_id: number;
  branch_name?: string;
  full_name: string;
  phone: string;
  email?: string;
  city?: string;
  address?: string;
  created_at?: string;
}

export interface CustomerDetailItem {
  id?: number | string;
  name?: string;
  phone?: string;
  dob?: string;
  anniversary?: string;
  status: 'Sold' | 'Exchange' | 'Lost' | 'Walkin' | 'Window Shopping' | 'In Hold / Follow Up' | 'In Hold' | 'Follow Up' | string;
  exchange_type?: 'Gold' | 'Diamond' | 'Silver' | 'Cashback' | string;
  sold_image_url?: string;
  product_id?: string;
  product_value?: number | string;
  notes?: string;
  // Schemes Closed
  has_scheme?: boolean;
  scheme_name?: string;
  scheme_amount?: number | string;
  scheme_reminder_date?: string;
  scheme_notes?: string;
  // Google Reviews
  has_google_review?: boolean;
  google_review_rating?: number;
  google_review_text?: string;
  google_review_screenshot?: string;
  // Video Reviews
  has_video_review?: boolean;
  videos_count?: number;
  video_title?: string;
  video_url?: string;
  video_screenshot?: string;
  // Customer Direct Feedback
  has_customer_feedback?: boolean;
  feedback_rating?: number;
  feedback_text?: string;
}

export interface CustomerActivity {
  id: number;
  branch_id: number;
  branch_code?: string;
  branch_name?: string;
  employee_id: number;
  employee_name?: string;
  employee_code?: string;
  customers_count?: number;
  breakdown?: string;
  customer_details?: CustomerDetailItem[];
  customer_name?: string;
  phone_number?: string;
  dob?: string;
  anniversary?: string;
  product_value?: number;
  activity_date: string;
  status: string; // 'Sold' | 'Exchange' | 'Lost' | 'Walkin' | 'In Hold / Follow Up' | 'Attended' | 'Closed'
  approval_status?: 'PENDING' | 'APPROVED' | 'REJECTED' | string;
  created_by_role?: 'EMPLOYEE' | 'MANAGER' | string;
  created_by_id?: number;
  rejection_reason?: string;
  reviewed_by_id?: number;
  reviewed_at?: string;
  reviewed_by_name?: string | null;
  product_id?: string;
  sold_image_url?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface EmployeeDashboardSummary {
  employee_id: number;
  employee_code: string;
  employee_name: string;
  designation: string;
  department: string;
  branch_id: number;
  branch_name: string;
  branch_code: string;
  total_customer_activities: number;
  pending_customer_activities: number;
  approved_customer_activities: number;
  rejected_customer_activities: number;
  total_calls: number;
  completed_calls: number;
  pending_calls: number;
  total_points?: number;
  google_review_points?: number;
  video_review_points?: number;
  approved_google_reviews?: number;
  approved_video_reviews?: number;
  pending_reviews_count?: number;
  pending_google_reviews?: number;
  pending_video_reviews?: number;
  total_outdoor_duties?: number;
  total_outdoor_customers?: number;
  pending_outdoor_duties?: number;
}


export interface SchemeRecord {
  id: number;
  branch_id: number;
  branch_code?: string;
  branch_name?: string;
  employee_id: number;
  employee_name?: string;
  customers_count?: number;
  customer_name?: string;
  scheme_name: string;
  amount: number;
  record_date: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface FormMedia {
  id: number;
  branch_id: number;
  branch_code?: string;
  branch_name?: string;
  employee_id: number;
  employee_name?: string;
  form_type: string;
  file_path: string;
  file_url: string;
  mime_type: string;
  file_size: number;
  notes?: string;
  upload_date: string;
  created_at?: string;
}

export interface EmployeePointsRanking {
  rank: number;
  employee_id: number;
  employee_code: string;
  full_name: string;
  designation: string;
  department: string;
  branch_id: number;
  branch_name: string;
  branch_code: string;
  city: string;
  google_review_points: number;
  video_review_points: number;
  total_points: number;
  pending_points: number;
}

export interface GoogleReview {
  id: number;
  branch_id: number;
  branch_code?: string;
  branch_name?: string;
  employee_id?: number;
  employee_name?: string;
  customers_count?: number;
  customer_name?: string;
  reviewer_name?: string;
  review_date: string;
  rating: number; // 1-5
  review_text: string;
  notes?: string;
  screenshot_url?: string;
  status: 'Published' | 'Pending' | 'Verified' | 'APPROVED' | 'REJECTED' | string;
  rejection_reason?: string | null;
  reviewed_by_id?: number | null;
  reviewed_at?: string | null;
  reviewed_by_name?: string | null;
  submitted_by_role?: string;
  points?: number;
  created_at?: string;
  updated_at?: string;
}

export interface VideoReview {
  id: number;
  branch_id: number;
  branch_code?: string;
  branch_name?: string;
  employee_id?: number;
  employee_name?: string;
  customer_name?: string;
  videos_count: number;
  video_title?: string;
  video_url?: string;
  review_date: string;
  notes?: string;
  screenshot_url?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'Verified' | 'Published' | string;
  rejection_reason?: string | null;
  reviewed_by_id?: number | null;
  reviewed_at?: string | null;
  reviewed_by_name?: string | null;
  submitted_by_role?: string;
  points?: number;
  created_at?: string;
  updated_at?: string;
}

export interface EmployeePointsSummary {
  employee_id: number;
  employee_name: string;
  google_review_points: number;
  video_review_points: number;
  total_points: number;
  approved_google_reviews: number;
  approved_video_reviews: number;
  pending_google_reviews: number;
  pending_video_reviews: number;
}

export interface AttireRecord {
  id: number;
  branch_id: number;
  branch_code?: string;
  branch_name?: string;
  employee_id: number;
  employee_name?: string;
  check_date: string;
  status: 'Proper' | 'Not Proper' | 'Needs Attention' | 'Improper' | 'Incomplete';
  notes?: string;
  image_url?: string;
  created_at?: string;
}

export interface OutdoorMarketingArea {
  id: number;
  branch_id: number;
  branch_name?: string;
  area_name: string;
  location: string;
  assigned_employee_id?: number;
  assigned_employee_name?: string;
  activity_date: string;
  status: 'Planned' | 'Active' | 'Completed';
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface OutdoorMarketingCustomer {
  id: number;
  branch_id: number;
  branch_name?: string;
  marketing_employee_id: number;
  marketing_employee_name?: string;
  marketing_employee_code?: string;
  marketing_employee_designation?: string;
  duty_id?: number;
  customer_name: string;
  phone?: string;
  dob?: string;
  anniversary_date?: string;
  follow_up_date?: string;
  photo_url?: string;
  area_name?: string;
  scheme_name?: string;
  date: string;
  is_converted?: boolean;
  has_google_review?: boolean;
  google_review_rating?: number;
  google_review_text?: string;
  google_review_screenshot?: string;
  has_video_review?: boolean;
  video_review_title?: string;
  video_review_url?: string;
  video_review_proof?: string;
  has_customer_feedback?: boolean;
  feedback_rating?: number;
  feedback_text?: string;
  customer_feedback_proof?: string;
  status: 'Lead' | 'Contacted' | 'Interested' | 'Converted' | 'Closed' | 'Lost' | string;
  interested_in?: string;
  notes?: string;
  note_notification_date?: string;
  updated_by_manager?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface OutdoorCustomerDetail {
  id?: number;
  customer_name: string;
  phone?: string;
  dob?: string;
  anniversary_date?: string;
  follow_up_date?: string;
  photo_url?: string;
  is_converted: boolean;
  has_google_review: boolean;
  google_review_rating?: number;
  google_review_text?: string;
  google_review_screenshot?: string;
  has_video_review?: boolean;
  video_review_title?: string;
  video_review_url?: string;
  video_review_proof?: string;
  has_customer_feedback?: boolean;
  feedback_rating?: number;
  feedback_text?: string;
  customer_feedback_proof?: string;
  scheme_name?: string;
  area_name?: string;
  interested_in?: string;
  notes?: string;
  note_notification_date?: string;
  updated_by_manager?: boolean;
}

export interface ManagerNotificationItemActivity {
  id: number;
  customer_name: string;
  phone_number: string;
  employee_id: number;
  employee_name: string;
  status: string;
  activity_date: string;
  notes: string;
  created_at: string;
}

export interface ManagerNotificationItemNote {
  id: number;
  customer_name: string;
  phone: string;
  marketing_employee_id: number;
  employee_name: string;
  area_name: string;
  note_notification_date: string;
  notes: string;
  status: string;
  updated_by_manager: boolean;
}

export interface SchemeReminderNotificationItem {
  id: number;
  customer_name: string;
  phone: string;
  scheme_name: string;
  installment_no: number;
  total_installments: number;
  amount: number;
  due_date: string;
  due_date_raw?: string;
  is_due_today?: boolean;
  price_notes?: string;
  status: string;
  employee_name?: string;
}

export interface ManagerNotificationsResponse {
  total_count: number;
  pending_activities_count: number;
  note_reminders_count: number;
  scheme_reminders_count?: number;
  pending_activities: ManagerNotificationItemActivity[];
  note_reminders: ManagerNotificationItemNote[];
  scheme_reminders?: SchemeReminderNotificationItem[];
}

export interface OutdoorDuty {
  id: number;
  branch_id: number;
  employee_id: number;
  employee_name?: string;
  employee_code?: string;
  designation?: string;
  department?: string;
  date: string;
  area?: string;
  scheme_name?: string;
  customers_attended_count: number;
  converted_customers_count: number;
  google_ratings_count: number;
  photo_url?: string;
  photo_urls?: string[];
  notes?: string;
  status: 'Assigned' | 'In Progress' | 'Completed' | string;
  customers: OutdoorMarketingCustomer[];
  created_at?: string;
  updated_at?: string;
}

export interface OutdoorDutyAssignRequest {
  date: string;
  employee_ids: number[];
}

export interface OutdoorDutyUpdate {
  area?: string;
  scheme_name?: string;
  customers_attended_count?: number;
  converted_customers_count?: number;
  google_ratings_count?: number;
  photo_url?: string;
  photo_urls?: string[];
  notes?: string;
  status?: string;
  customers?: OutdoorCustomerDetail[];
}


export type OutdoorMarketingLead = OutdoorMarketingCustomer;

export interface OutdoorMarketingScheme {
  id: number;
  branch_id: number;
  employee_id: number;
  employee_name?: string;
  date: string;
  scheme_name: string;
  description?: string;
  area: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface OutdoorMarketingActivity {
  id: number;
  branch_id: number;
  employee_id?: number;
  employee_name?: string;
  participating_employee_ids?: string;
  employee_names?: string;
  date: string;
  area: string;
  scheme_name?: string;
  schemes_promoted?: number;
  customers_generated?: number;
  customers_attended: number;
  customers_closed?: number;
  converted_customers: number;
  google_ratings_count: number;
  notes?: string;
  image_url?: string;
  photo_url?: string;
  created_at?: string;
}

export interface OutdoorMarketingOverview {
  total_outdoor_employees: number;
  areas_covered: number;
  customers_generated: number;
  customers_closed: number;
  schemes_promoted: number;
  total_customers_attended: number;
  total_converted_customers: number;
  total_google_ratings: number;
  total_activities_count: number;
  recent_activities: OutdoorMarketingActivity[];
}

export interface DashboardOverview {
  manager_name: string;
  branch_name: string;
  branch_code: string;
  total_employees: number;
  active_employees: number;
  outdoor_marketing_employees: number;
}

// ---------------------------------------------------------
// Super Admin Enterprise Types
// ---------------------------------------------------------
export interface AdminBranchMetric {
  branch_id: number;
  branch_code: string;
  branch_name: string;
  city: string;
  manager_count: number;
  employee_count: number;
  active_employee_count: number;
  customer_footfall: number;
  customer_closed: number;
  conversion_rate: number;
  schemes_count: number;
  schemes_value: number;
  reviews_count: number;
  average_rating: number;
  outdoor_leads: number;
  outdoor_converted: number;
  attire_compliance_pct: number;
  daily_forms_count: number;
}

export interface AdminActivityFeedItem {
  id: string;
  event_type: string;
  title: string;
  description: string;
  branch_id?: number;
  branch_name?: string;
  employee_name?: string;
  timestamp: string;
  status_tag?: string;
}

export interface SparklineDay {
  day: string;
  date: string;
  footfall: number;
  schemes_value: number;
  reviews: number;
}

export interface AdminDashboardOverview {
  total_branches: number;
  total_managers: number;
  total_employees: number;
  active_employees: number;
  total_footfall: number;
  total_customers_closed: number;
  conversion_percentage: number;
  footfall_growth_pct: number;
  total_activities: number;
  total_schemes: number;
  total_schemes_value: number;
  total_reviews: number;
  average_rating: number;
  outdoor_leads: number;
  outdoor_leads_converted: number;
  outdoor_staff_count: number;
  attire_compliance_pct: number;
  daily_forms_count: number;
  today_footfall?: number;
  today_customers_closed?: number;
  today_schemes_count?: number;
  today_schemes_value?: number;
  today_outdoor_leads?: number;
  today_reviews_count?: number;
  sparkline_days: SparklineDay[];
  branch_comparison: AdminBranchMetric[];
  recent_activity: AdminActivityFeedItem[];
}

export interface BranchManagerInfo {
  id: number;
  full_name: string;
  username: string;
  email?: string;
  is_active: boolean;
  last_login?: string;
}

export interface AdminBranchSummary {
  id: number;
  code: string;
  name: string;
  city: string;
  address?: string;
  phone?: string;
  email?: string;
  description?: string;
  is_active: boolean;
  managers: BranchManagerInfo[];
  employee_count: number;
  active_employee_count: number;
  outdoor_employee_count: number;
  customer_footfall: number;
  schemes_count: number;
  schemes_value: number;
  reviews_count: number;
  average_rating: number;
  outdoor_leads: number;
  conversion_rate: number;
  attire_compliance_pct: number;
  daily_forms_count: number;
}

export interface AdminBranchDetail {
  branch: AdminBranchSummary;
  managers: BranchManagerInfo[];
  performance: AdminBranchMetric;
  recent_activities: AdminActivityFeedItem[];
}

export interface AdminManager {
  id: number;
  branch_id?: number;
  branch_code?: string;
  branch_name?: string;
  full_name: string;
  username: string;
  manager_code?: string;
  email?: string;
  role: string;
  is_active: boolean;
  last_login?: string;
  created_at: string;
}

export interface AdminEmployee {
  id: number;
  branch_id: number;
  branch_code: string;
  branch_name: string;
  manager_id?: number;
  manager_name?: string;
  employee_code: string;
  full_name: string;
  phone?: string;
  email?: string;
  designation: string;
  department: string;
  date_of_joining?: string;
  status: 'active' | 'inactive';
  is_outdoor_marketing_employee: boolean;
  profile_photo_url?: string;
  notes?: string;
  customers_attended_count: number;
  customers_closed_count: number;
  schemes_closed_count: number;
  schemes_total_amount: number;
  reviews_count: number;
  average_rating: number;
  attire_compliance_pct: number;
  created_at: string;
}

export interface AdminEmployeePerformance {
  employee_id: number;
  employee_code: string;
  full_name: string;
  branch_id: number;
  branch_code: string;
  branch_name: string;
  designation: string;
  department: string;
  is_outdoor: boolean;
  rank: number;
  overall_score: number;
  customer_engagement_score: number;
  gold_schemes_score: number;
  google_reviews_score: number;
  compliance_score: number;
  outdoor_marketing_score: number;
  customers_attended: number;
  customers_closed: number;
  conversion_rate: number;
  schemes_count: number;
  schemes_amount: number;
  reviews_count: number;
  average_rating: number;
  attire_proper: number;
  attire_total: number;
  outdoor_leads: number;
  outdoor_closed: number;
}

export interface AdminReportResponse {
  report_type: string;
  title: string;
  branch_filter: string;
  date_from?: string;
  date_to?: string;
  generated_at: string;
  total_records: number;
  summary_metrics: Record<string, any>;
  headers: string[];
  rows: any[][];
}

export interface AdminAuditLogItem {
  id: number;
  branch_id?: number;
  branch_name?: string;
  admin_id?: number;
  username?: string;
  action: string;
  entity: string;
  entity_id?: string;
  ip_address?: string;
  details?: string;
  timestamp: string;
}

export interface AdminAuditLogResponse {
  total: number;
  page: number;
  limit: number;
  logs: AdminAuditLogItem[];
}

export interface AdminSettingsResponse {
  company_name: string;
  app_name: string;
  environment: string;
  version: string;
  database_backend: string;
  database_status: string;
  jwt_algorithm: string;
  session_timeout_minutes: number;
  total_branches: number;
  total_managers: number;
  total_employees: number;
  media_dir: string;
  max_upload_size_mb: number;
  server_time: string;
}

export interface AdminEmployeeDetail {
  employee: AdminEmployee;
  customer_activities: Array<{
    id: number;
    activity_date: string;
    customer_name?: string;
    phone_number?: string;
    status: string;
    customers_count: number;
    breakdown?: string;
    notes?: string;
    created_at?: string;
  }>;
  schemes: Array<{
    id: number;
    record_date: string;
    customer_name?: string;
    scheme_name: string;
    amount: number;
    customers_count: number;
    notes?: string;
    created_at?: string;
  }>;
  google_reviews: Array<{
    id: number;
    review_date: string;
    customer_name?: string;
    rating: number;
    review_text?: string;
    screenshot_url?: string;
    customers_count: number;
    notes?: string;
  }>;
  attire_records: Array<{
    id: number;
    record_date: string;
    status: string;
    notes?: string;
    photo_url?: string;
  }>;
  gallery_media: Array<{
    id: number;
    form_type: string;
    file_url: string;
    notes?: string;
    created_at?: string;
  }>;
  outdoor_areas: Array<{
    id: number;
    area_name: string;
    landmark?: string;
    city?: string;
    status?: string;
    notes?: string;
    created_at?: string;
  }>;
  outdoor_customers: Array<{
    id: number;
    customer_name: string;
    phone_number?: string;
    area_name?: string;
    status: string;
    notes?: string;
    created_at?: string;
  }>;
  outdoor_schemes: Array<{
    id: number;
    customer_name: string;
    scheme_name: string;
    amount: number;
    notes?: string;
    created_at?: string;
  }>;
  customer_feedbacks?: CustomerFeedback[];
  calls?: EmployeeCallLog[];
  calls_done_count?: number;
  calls_pending_count?: number;
  performance?: AdminEmployeePerformance;
}

// ----------------------------------------------------
// Employee Attendance Interfaces
// ----------------------------------------------------
export interface EmployeeAttendance {
  id: number;
  branch_id: number;
  branch_name?: string;
  branch_code?: string;
  employee_id: number;
  employee_name?: string;
  employee_code?: string;
  designation?: string;
  department?: string;
  date: string;
  status: 'Present' | 'Absent' | 'Half Day' | 'On Leave' | 'Late' | string;
  check_in?: string | null;
  check_out?: string | null;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface AttendanceSummary {
  total_roster: number;
  total_present: number;
  total_absent: number;
  total_half_day: number;
  total_leave: number;
  total_late: number;
  attendance_rate: number;
  total_employees?: number;
  present_count?: number;
  absent_count?: number;
  half_day_count?: number;
  leave_count?: number;
  late_count?: number;
  attendance_rate_pct?: number;
}

export interface BranchAttendanceMetric {
  branch_id: number;
  branch_name: string;
  branch_code: string;
  total_roster: number;
  total_present: number;
  present_count: number;
  absent_count: number;
  attendance_rate: number;
  rate: number;
}

export interface AdminAttendanceOverview {
  date?: string;
  branch_id?: number | null;
  summary: AttendanceSummary;
  records: EmployeeAttendance[];
  branch_metrics?: BranchAttendanceMetric[];
  sync_timestamp: string;
}

// ----------------------------------------------------
// Customer Direct Review & Feedback Interfaces
// ----------------------------------------------------
export interface CustomerFeedback {
  id: number;
  branch_id: number;
  branch_name?: string;
  branch_code?: string;
  employee_id: number;
  employee_name?: string;
  employee_code?: string;
  customer_name: string;
  customer_phone?: string;
  feedback_date: string;
  rating: number; // 1 to 5
  category: string;
  feedback_text: string;
  notes?: string | null;
  status: 'Verified' | 'Follow-up Required' | 'Resolved' | string;
  created_at?: string;
  updated_at?: string;
}

export interface AdminFeedbackOverview {
  total_feedbacks: number;
  average_rating: number;
  feedbacks: CustomerFeedback[];
  records?: CustomerFeedback[];
}

export interface EmployeeNotificationItem {
  id: string;
  category: 'attire' | 'google_review' | 'video_review' | 'customer_activity' | string;
  title: string;
  status: string;
  message: string;
  date: string;
  created_at?: string | null;
  badge_color: 'green' | 'amber' | 'red' | 'blue' | string;
}

export interface EmployeeNotificationResponse {
  unread_count: number;
  notifications: EmployeeNotificationItem[];
}

// ----------------------------------------------------
// WhatsApp Campaign & Templates Interfaces
// ----------------------------------------------------
export interface WhatsAppTemplate {
  id: number;
  name: string;
  campaign_name: string;
  template_id: string;
  category: string;
  description?: string | null;
  media_url?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface WhatsAppCustomerRecipient {
  name: string;
  phone: string;
}

export interface SendBulkWhatsAppPayload {
  customers: WhatsAppCustomerRecipient[];
  campaign_name: string;
  template_id?: string;
  template_name?: string;
  category?: string;
  media_url?: string;
  notes?: string;
}

export interface SendBulkWhatsAppResponse {
  success: boolean;
  total_requested: number;
  sent_count: number;
  failed_count: number;
  simulated_count: number;
  deduplicated_count: number;
  details: Array<{
    customer_name: string;
    phone: string;
    status: 'SENT' | 'SIMULATED' | 'FAILED' | 'DEDUPLICATED';
    message?: string;
    error?: string;
  }>;
  message: string;
}

export interface WhatsAppMessageLog {
  id: number;
  branch_id?: number | null;
  manager_id?: number | null;
  manager_name?: string | null;
  customer_name: string;
  phone_number: string;
  campaign_name: string;
  template_id?: string | null;
  category?: string | null;
  status: 'SENT' | 'SIMULATED' | 'FAILED' | 'DEDUPLICATED' | string;
  status_details?: string | null;
  sent_at: string;
}

export interface WhatsAppStats {
  total_sent: number;
  sent_today: number;
  sent_this_month: number;
  total_simulated: number;
  total_failed: number;
  by_campaign: Record<string, number>;
  by_category: Record<string, number>;
}

export interface EmployeePaySlip {
  id: number;
  branch_id: number;
  branch_name?: string;
  branch_code?: string;
  employee_id: number;
  employee_name?: string;
  employee_code?: string;
  employee_designation?: string;
  month: string;
  year: number;
  pay_period: string;
  amount: number;
  notes?: string;
  file_url: string;
  issued_date: string;
  created_at?: string;
}

export interface EmployeeLeaveRequest {
  id: number;
  branch_id: number;
  branch_name?: string;
  branch_code?: string;
  employee_id: number;
  employee_name?: string;
  employee_code?: string;
  employee_designation?: string;
  leave_type: string;
  subject: string;
  message: string;
  from_date: string;
  to_date: string;
  days_count: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reviewed_by_id?: number | null;
  reviewed_by_name?: string | null;
  rejection_reason?: string | null;
  created_at: string;
  updated_at?: string;
}

