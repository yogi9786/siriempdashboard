from datetime import date, datetime
from typing import Optional, List
from pydantic import BaseModel, Field


# ----------------------------------------------------
# Outdoor Marketing Area Schemas
# ----------------------------------------------------
class OutdoorAreaCreate(BaseModel):
    area_name: str = Field(..., min_length=2, max_length=150)
    location: str = Field(..., min_length=2, max_length=255)
    assigned_employee_id: Optional[int] = None
    activity_date: Optional[date] = None
    status: str = Field(default="Planned", pattern="^(Planned|Active|Completed)$")
    notes: Optional[str] = None


class OutdoorAreaUpdate(BaseModel):
    area_name: Optional[str] = None
    location: Optional[str] = None
    assigned_employee_id: Optional[int] = None
    activity_date: Optional[date] = None
    status: Optional[str] = Field(default=None, pattern="^(Planned|Active|Completed)$")
    notes: Optional[str] = None


class OutdoorAreaResponse(BaseModel):
    id: int
    branch_id: int
    area_name: str
    location: str
    assigned_employee_id: Optional[int] = None
    assigned_employee_name: Optional[str] = None
    activity_date: date
    status: str
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ----------------------------------------------------
# Outdoor Marketing Customer Schemas
# ----------------------------------------------------
class OutdoorCustomerDetail(BaseModel):
    id: Optional[int] = None
    customer_name: str
    phone: Optional[str] = None
    dob: Optional[date] = None
    anniversary_date: Optional[date] = None
    is_converted: bool = False
    has_google_review: bool = False
    google_review_rating: Optional[int] = 5
    google_review_text: Optional[str] = None
    scheme_name: Optional[str] = None
    area_name: Optional[str] = None
    notes: Optional[str] = None


class OutdoorCustomerCreate(BaseModel):
    marketing_employee_id: int
    duty_id: Optional[int] = None
    customer_name: str = Field(..., min_length=2, max_length=150)
    phone: Optional[str] = None
    dob: Optional[date] = None
    anniversary_date: Optional[date] = None
    area_name: Optional[str] = None
    scheme_name: Optional[str] = None
    date: Optional[date] = None
    is_converted: bool = False
    has_google_review: bool = False
    google_review_rating: Optional[int] = 5
    google_review_text: Optional[str] = None
    status: str = Field(default="Lead")
    notes: Optional[str] = None


class OutdoorCustomerUpdate(BaseModel):
    marketing_employee_id: Optional[int] = None
    duty_id: Optional[int] = None
    customer_name: Optional[str] = None
    phone: Optional[str] = None
    dob: Optional[date] = None
    anniversary_date: Optional[date] = None
    area_name: Optional[str] = None
    scheme_name: Optional[str] = None
    date: Optional[date] = None
    is_converted: Optional[bool] = None
    has_google_review: Optional[bool] = None
    google_review_rating: Optional[int] = None
    google_review_text: Optional[str] = None
    status: Optional[str] = None
    notes: Optional[str] = None


class OutdoorCustomerResponse(BaseModel):
    id: int
    branch_id: int
    marketing_employee_id: int
    marketing_employee_name: Optional[str] = None
    duty_id: Optional[int] = None
    customer_name: str
    phone: Optional[str] = None
    dob: Optional[date] = None
    anniversary_date: Optional[date] = None
    area_name: Optional[str] = None
    scheme_name: Optional[str] = None
    date: date
    is_converted: bool = False
    has_google_review: bool = False
    google_review_rating: Optional[int] = 5
    google_review_text: Optional[str] = None
    status: str
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ----------------------------------------------------
# Outdoor Marketing Duty Schemas (Daily Rotation & Entry)
# ----------------------------------------------------
class OutdoorDutyAssignRequest(BaseModel):
    date: date
    employee_ids: List[int]


class OutdoorDutyUpdate(BaseModel):
    area: Optional[str] = None
    scheme_name: Optional[str] = None
    customers_attended_count: Optional[int] = Field(default=0, ge=0)
    converted_customers_count: Optional[int] = Field(default=0, ge=0)
    google_ratings_count: Optional[int] = Field(default=0, ge=0)
    photo_url: Optional[str] = None
    photo_urls: Optional[List[str]] = []
    notes: Optional[str] = None
    status: Optional[str] = "Completed"
    customers: Optional[List[OutdoorCustomerDetail]] = []


class OutdoorDutyResponse(BaseModel):
    id: int
    branch_id: int
    employee_id: int
    employee_name: Optional[str] = None
    employee_code: Optional[str] = None
    designation: Optional[str] = None
    department: Optional[str] = None
    date: date
    area: Optional[str] = None
    scheme_name: Optional[str] = None
    customers_attended_count: int = 0
    converted_customers_count: int = 0
    google_ratings_count: int = 0
    photo_url: Optional[str] = None
    photo_urls: List[str] = []
    notes: Optional[str] = None
    status: str = "Assigned"
    customers: List[OutdoorCustomerResponse] = []
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True



# ----------------------------------------------------
# Outdoor Marketing Scheme Schemas
# ----------------------------------------------------
class OutdoorSchemeCreate(BaseModel):
    employee_id: int
    date: Optional[date] = None
    scheme_name: str = Field(..., min_length=2, max_length=150)
    description: Optional[str] = None
    area: str = Field(..., min_length=2, max_length=150)
    notes: Optional[str] = None


class OutdoorSchemeUpdate(BaseModel):
    employee_id: Optional[int] = None
    date: Optional[date] = None
    scheme_name: Optional[str] = None
    description: Optional[str] = None
    area: Optional[str] = None
    notes: Optional[str] = None


class OutdoorSchemeResponse(BaseModel):
    id: int
    branch_id: int
    employee_id: int
    employee_name: Optional[str] = None
    date: date
    scheme_name: str
    description: Optional[str] = None
    area: str
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ----------------------------------------------------
# Outdoor Marketing Activity Schemas
# ----------------------------------------------------
class OutdoorActivityCreate(BaseModel):
    employee_id: Optional[int] = None
    participating_employee_ids: Optional[str] = None
    employee_names: Optional[str] = None
    date: Optional[date] = None
    area: str = Field(..., min_length=2, max_length=150)
    scheme_name: Optional[str] = None
    schemes_promoted: int = Field(default=0, ge=0)
    customers_generated: int = Field(default=0, ge=0)
    customers_attended: int = Field(default=0, ge=0)
    customers_closed: int = Field(default=0, ge=0)
    converted_customers: int = Field(default=0, ge=0)
    google_ratings_count: int = Field(default=0, ge=0)
    notes: Optional[str] = None
    image_url: Optional[str] = None
    photo_url: Optional[str] = None


class OutdoorActivityResponse(BaseModel):
    id: int
    branch_id: int
    employee_id: Optional[int] = None
    employee_name: Optional[str] = None
    participating_employee_ids: Optional[str] = None
    employee_names: Optional[str] = None
    date: date
    area: str
    scheme_name: Optional[str] = None
    schemes_promoted: int = 0
    customers_generated: int = 0
    customers_attended: int = 0
    customers_closed: int = 0
    converted_customers: int = 0
    google_ratings_count: int = 0
    notes: Optional[str] = None
    image_url: Optional[str] = None
    photo_url: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ----------------------------------------------------
# Outdoor Marketing Summary / Overview Schema
# ----------------------------------------------------
class OutdoorMarketingOverview(BaseModel):
    total_outdoor_employees: int = 0
    areas_covered: int = 0
    customers_generated: int = 0
    customers_closed: int = 0
    schemes_promoted: int = 0
    total_customers_attended: int = 0
    total_converted_customers: int = 0
    total_google_ratings: int = 0
    total_activities_count: int = 0
    recent_activities: List[OutdoorActivityResponse] = []

