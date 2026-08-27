from datetime import date, datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict


class EmployeeBase(BaseModel):
    employee_code: Optional[str] = Field(default="", description="Unique employee badge/code (e.g. EMP-YEL-001)")
    full_name: str = Field(..., min_length=1, max_length=150)
    phone: Optional[str] = Field(default="", max_length=25)
    email: Optional[str] = None
    designation: Optional[str] = Field(default="Sales Executive", max_length=100)
    department: Optional[str] = Field(default="Sales & Showroom Operations", max_length=100)
    date_of_joining: Optional[date] = None
    status: Optional[str] = Field(default="active", pattern="^(active|inactive)$")
    is_outdoor_marketing_employee: Optional[bool] = False
    profile_photo_url: Optional[str] = None
    notes: Optional[str] = None


class EmployeeCreate(BaseModel):
    employee_code: Optional[str] = None
    full_name: str = Field(..., min_length=1, max_length=150)
    phone: Optional[str] = ""
    email: Optional[str] = None
    designation: Optional[str] = "Sales Executive"
    department: Optional[str] = "Sales & Showroom Operations"
    date_of_joining: Optional[date] = None
    status: Optional[str] = "active"
    is_outdoor_marketing_employee: Optional[bool] = False
    profile_photo_url: Optional[str] = None
    notes: Optional[str] = None


class EmployeeUpdate(BaseModel):
    employee_code: Optional[str] = None
    full_name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    designation: Optional[str] = None
    department: Optional[str] = None
    date_of_joining: Optional[date] = None
    status: Optional[str] = Field(default=None, pattern="^(active|inactive)$")
    is_outdoor_marketing_employee: Optional[bool] = None
    profile_photo_url: Optional[str] = None
    notes: Optional[str] = None


class EmployeeResponse(BaseModel):
    id: int
    branch_id: int
    manager_id: Optional[int] = None
    employee_code: str
    full_name: str
    phone: Optional[str] = ""
    email: Optional[str] = None
    designation: Optional[str] = "Sales Executive"
    department: Optional[str] = "Sales & Showroom Operations"
    date_of_joining: Optional[date] = None
    status: str = "active"
    is_outdoor_marketing_employee: bool = False
    profile_photo_url: Optional[str] = None
    notes: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class EmployeeDetailResponse(EmployeeResponse):
    customers_attended_count: int = 0
    customers_closed_count: int = 0
    schemes_closed_count: int = 0
    form_media_count: int = 0
    attire_records_count: int = 0
    google_reviews_count: int = 0
    average_rating: float = 0.0

    model_config = ConfigDict(from_attributes=True)

