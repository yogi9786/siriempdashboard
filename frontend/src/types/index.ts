export interface User {
  id: number;
  branch_id: number;
  branch_code: string;
  branch_name: string;
  username: string;
  full_name: string;
  manager_code?: string;
  email?: string;
  role: string; // "MANAGER"
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
  status: 'Sold' | 'Exchange' | 'Lost' | 'Walkin' | 'In Hold / Follow Up' | 'In Hold' | 'Follow Up' | string;
  product_value?: number | string;
  notes?: string;
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
  notes?: string;
  created_at?: string;
  updated_at?: string;
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
  status: 'Published' | 'Pending' | 'Verified' | string;
  created_at?: string;
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
  duty_id?: number;
  customer_name: string;
  phone?: string;
  dob?: string;
  anniversary_date?: string;
  area_name?: string;
  scheme_name?: string;
  date: string;
  is_converted?: boolean;
  has_google_review?: boolean;
  google_review_rating?: number;
  google_review_text?: string;
  status: 'Lead' | 'Contacted' | 'Interested' | 'Converted' | 'Closed' | 'Lost' | string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface OutdoorCustomerDetail {
  id?: number;
  customer_name: string;
  phone?: string;
  dob?: string;
  anniversary_date?: string;
  is_converted: boolean;
  has_google_review: boolean;
  google_review_rating?: number;
  google_review_text?: string;
  scheme_name?: string;
  area_name?: string;
  notes?: string;
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
  performance?: AdminEmployeePerformance;
}


