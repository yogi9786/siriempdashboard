from typing import List, Optional, Any, Dict
from datetime import datetime, date
from pydantic import BaseModel, EmailStr, Field


# ---------------------------------------------------------
# Dashboard Overview Schemas
# ---------------------------------------------------------
class AdminBranchMetric(BaseModel):
    branch_id: int
    branch_code: str
    branch_name: str
    city: str
    manager_count: int
    employee_count: int
    active_employee_count: int
    customer_footfall: int
    customer_closed: int
    conversion_rate: float
    schemes_count: int
    schemes_value: float
    reviews_count: int
    average_rating: float
    outdoor_leads: int
    outdoor_converted: int
    attire_compliance_pct: float
    daily_forms_count: int


class AdminActivityFeedItem(BaseModel):
    id: str
    event_type: str  # "customer", "scheme", "review", "attire", "form", "outdoor", "audit"
    title: str
    description: str
    branch_id: Optional[int] = None
    branch_name: Optional[str] = None
    employee_name: Optional[str] = None
    timestamp: str
    status_tag: Optional[str] = None


class SparklineDay(BaseModel):
    day: str
    date: str
    footfall: int
    schemes_value: float
    reviews: int


class AdminDashboardOverview(BaseModel):
    total_branches: int
    total_managers: int
    total_employees: int
    active_employees: int
    total_footfall: int
    total_customers_closed: int
    conversion_percentage: int
    footfall_growth_pct: float
    total_activities: int
    total_schemes: int
    total_schemes_value: float
    total_reviews: int
    average_rating: float
    outdoor_leads: int
    outdoor_leads_converted: int
    outdoor_staff_count: int
    attire_compliance_pct: float
    daily_forms_count: int
    sparkline_days: List[SparklineDay]
    branch_comparison: List[AdminBranchMetric]
    recent_activity: List[AdminActivityFeedItem]


# ---------------------------------------------------------
# Branch Management Schemas
# ---------------------------------------------------------
class BranchManagerInfo(BaseModel):
    id: int
    full_name: str
    username: str
    email: Optional[str] = None
    is_active: bool
    last_login: Optional[datetime] = None


class AdminBranchSummary(BaseModel):
    id: int
    code: str
    name: str
    city: str
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    description: Optional[str] = None
    is_active: bool
    managers: List[BranchManagerInfo]
    employee_count: int
    active_employee_count: int
    outdoor_employee_count: int
    customer_footfall: int
    schemes_count: int
    schemes_value: float
    reviews_count: int
    average_rating: float
    outdoor_leads: int
    conversion_rate: float
    attire_compliance_pct: float
    daily_forms_count: int


class AdminBranchUpdate(BaseModel):
    name: Optional[str] = None
    city: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None


class AdminBranchDetail(BaseModel):
    branch: AdminBranchSummary
    managers: List[BranchManagerInfo]
    performance: AdminBranchMetric
    recent_activities: List[AdminActivityFeedItem]


# ---------------------------------------------------------
# Manager Management Schemas
# ---------------------------------------------------------
class AdminManagerResponse(BaseModel):
    id: int
    branch_id: Optional[int] = None
    branch_code: Optional[str] = None
    branch_name: Optional[str] = None
    full_name: str
    username: str
    email: Optional[str] = None
    role: str
    is_active: bool
    last_login: Optional[datetime] = None
    created_at: datetime


class AdminManagerCreate(BaseModel):
    branch_id: int
    full_name: str
    username: str
    email: Optional[str] = None
    password: str
    is_active: bool = True


class AdminManagerUpdate(BaseModel):
    branch_id: Optional[int] = None
    full_name: Optional[str] = None
    username: Optional[str] = None
    email: Optional[str] = None
    is_active: Optional[bool] = None


class AdminResetPasswordRequest(BaseModel):
    new_password: str


# ---------------------------------------------------------
# Employee Management & Performance Schemas
# ---------------------------------------------------------
class AdminEmployeeResponse(BaseModel):
    id: int
    branch_id: int
    branch_code: str
    branch_name: str
    manager_id: Optional[int] = None
    manager_name: Optional[str] = None
    employee_code: str
    full_name: str
    phone: Optional[str] = ""
    email: Optional[str] = None
    designation: str
    department: str
    date_of_joining: Optional[date] = None
    status: str
    is_outdoor_marketing_employee: bool
    profile_photo_url: Optional[str] = None
    notes: Optional[str] = None
    customers_attended_count: int = 0
    customers_closed_count: int = 0
    schemes_closed_count: int = 0
    schemes_total_amount: float = 0.0
    reviews_count: int = 0
    average_rating: float = 5.0
    attire_compliance_pct: float = 100.0
    created_at: datetime


class AdminEmployeeCreate(BaseModel):
    branch_id: int
    full_name: str
    employee_code: Optional[str] = None
    phone: Optional[str] = ""
    email: Optional[str] = None
    designation: Optional[str] = "Sales Executive"
    department: Optional[str] = "Sales & Showroom Operations"
    date_of_joining: Optional[date] = None
    status: Optional[str] = "active"
    is_outdoor_marketing_employee: Optional[bool] = False
    notes: Optional[str] = None


class AdminEmployeeUpdate(BaseModel):
    branch_id: Optional[int] = None
    full_name: Optional[str] = None
    employee_code: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    designation: Optional[str] = None
    department: Optional[str] = None
    date_of_joining: Optional[date] = None
    status: Optional[str] = None
    is_outdoor_marketing_employee: Optional[bool] = None
    notes: Optional[str] = None


class AdminEmployeeReassignBranch(BaseModel):
    new_branch_id: int
    new_manager_id: Optional[int] = None


class AdminEmployeePerformance(BaseModel):
    employee_id: int
    employee_code: str
    full_name: str
    branch_id: int
    branch_code: str
    branch_name: str
    designation: str
    department: str
    is_outdoor: bool
    rank: int
    overall_score: float  # 0 to 100%
    customer_engagement_score: float  # 0 to 100%
    gold_schemes_score: float  # 0 to 100%
    google_reviews_score: float  # 0 to 100%
    compliance_score: float  # 0 to 100%
    outdoor_marketing_score: float  # 0 to 100%
    customers_attended: int
    customers_closed: int
    conversion_rate: float
    schemes_count: int
    schemes_amount: float
    reviews_count: int
    average_rating: float
    attire_proper: int
    attire_total: int
    outdoor_leads: int
    outdoor_closed: int


# ---------------------------------------------------------
# Customer CRM & Activity Schemas
# ---------------------------------------------------------
class AdminCustomerSummary(BaseModel):
    id: int
    branch_id: int
    branch_name: str
    employee_id: int
    employee_name: str
    customer_name: str
    phone_number: str
    activity_date: date
    status: str
    notes: Optional[str] = None
    schemes_enrolled_count: int = 0
    total_scheme_value: float = 0.0
    reviews_submitted: int = 0


# ---------------------------------------------------------
# Gold Scheme Analytics Schemas
# ---------------------------------------------------------
class AdminSchemeAnalytics(BaseModel):
    total_schemes: int
    total_value: float
    branch_breakdown: List[Dict[str, Any]]
    top_performers: List[Dict[str, Any]]
    monthly_trend: List[Dict[str, Any]]


# ---------------------------------------------------------
# Google Reviews Reputation Schemas
# ---------------------------------------------------------
class AdminGoogleReviewSummary(BaseModel):
    total_reviews: int
    average_rating: float
    star_distribution: Dict[int, int]  # 5: count, 4: count, etc.
    branch_ratings: List[Dict[str, Any]]
    verified_count: int
    pending_count: int
    reviews: List[Dict[str, Any]]


# ---------------------------------------------------------
# Attire & Compliance Schemas
# ---------------------------------------------------------
class AdminAttireSummary(BaseModel):
    overall_compliance_pct: float
    proper_count: int
    partial_count: int
    improper_count: int
    branch_compliance: List[Dict[str, Any]]
    department_compliance: List[Dict[str, Any]]
    records: List[Dict[str, Any]]


# ---------------------------------------------------------
# Reports & Audit Schemas
# ---------------------------------------------------------
class AdminReportResponse(BaseModel):
    report_type: str
    title: str
    branch_filter: str
    date_from: Optional[str] = None
    date_to: Optional[str] = None
    generated_at: datetime
    total_records: int
    summary_metrics: Dict[str, Any]
    headers: List[str]
    rows: List[List[Any]]


class AdminAuditLogItem(BaseModel):
    id: int
    branch_id: Optional[int] = None
    branch_name: Optional[str] = "All Branches"
    admin_id: Optional[int] = None
    username: Optional[str] = None
    action: str
    entity: str
    entity_id: Optional[str] = None
    ip_address: Optional[str] = None
    details: Optional[str] = None
    timestamp: datetime


class AdminAuditLogResponse(BaseModel):
    total: int
    page: int
    limit: int
    logs: List[AdminAuditLogItem]


# ---------------------------------------------------------
# Admin Settings Schemas
# ---------------------------------------------------------
class AdminSettingsResponse(BaseModel):
    company_name: str
    app_name: str
    environment: str
    version: str
    database_backend: str  # PostgreSQL or SQLite
    database_status: str  # Connected
    auth_mode: str = "ENV-Configured Identity (Zero-DB Account)"
    auth_status: str = "Active & Enforced"
    password_hashing: str = "Bcrypt / Argon2 Configured"
    jwt_algorithm: str
    session_timeout_minutes: int
    refresh_token_lifetime_days: int = 7
    rate_limiting_status: str = "Active (Brute-Force Defense Enabled)"
    total_branches: int
    total_managers: int
    total_employees: int
    media_dir: str
    max_upload_size_mb: int
    server_time: datetime
