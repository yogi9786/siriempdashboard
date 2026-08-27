export interface User {
  id: number;
  branch_id: number;
  branch_code: string;
  branch_name: string;
  username: string;
  full_name: string;
  email?: string;
  role: string; // "MANAGER"
  is_active: boolean;
}

export type AdminProfile = User;

export interface ManagerPublicOption {
  id: number;
  full_name: string;
  username: string;
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

export interface CustomerActivity {
  id: number;
  branch_id: number;
  employee_id: number;
  employee_name?: string;
  customer_name: string;
  phone_number: string;
  activity_date: string;
  status: 'Attended' | 'Closed' | 'Follow-up' | 'Lost';
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface SchemeRecord {
  id: number;
  branch_id: number;
  employee_id: number;
  employee_name?: string;
  customer_name: string;
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
  employee_id?: number;
  employee_name?: string;
  customer_name: string;
  review_date: string;
  rating: number; // 1-5
  review_text: string;
  notes?: string;
  screenshot_url?: string;
  status: 'Published' | 'Pending' | 'Verified';
  created_at?: string;
}

export interface AttireRecord {
  id: number;
  branch_id: number;
  employee_id: number;
  employee_name?: string;
  check_date: string;
  status: 'Proper' | 'Not Proper' | 'Needs Attention';
  notes?: string;
  image_url?: string;
  created_at?: string;
}

export interface OutdoorMarketingArea {
  id: number;
  branch_id: number;
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
  marketing_employee_id: number;
  marketing_employee_name?: string;
  customer_name: string;
  phone: string;
  area_name: string;
  scheme_name?: string;
  date: string;
  status: 'Lead' | 'Contacted' | 'Interested' | 'Closed' | 'Lost';
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

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
  employee_id: number;
  employee_name?: string;
  date: string;
  area: string;
  schemes_promoted: number;
  customers_generated: number;
  customers_attended: number;
  customers_closed: number;
  notes?: string;
  image_url?: string;
  created_at?: string;
}

export interface OutdoorMarketingOverview {
  total_outdoor_employees: number;
  areas_covered: number;
  customers_generated: number;
  customers_closed: number;
  schemes_promoted: number;
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
