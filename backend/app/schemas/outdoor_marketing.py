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
class OutdoorCustomerCreate(BaseModel):
    marketing_employee_id: int
    customer_name: str = Field(..., min_length=2, max_length=150)
    phone: str = Field(..., min_length=7, max_length=20)
    area_name: str = Field(..., min_length=2, max_length=150)
    scheme_name: Optional[str] = None
    date: Optional[date] = None
    status: str = Field(default="Lead", pattern="^(Lead|Contacted|Interested|Closed|Lost)$")
    notes: Optional[str] = None


class OutdoorCustomerUpdate(BaseModel):
    marketing_employee_id: Optional[int] = None
    customer_name: Optional[str] = None
    phone: Optional[str] = None
    area_name: Optional[str] = None
    scheme_name: Optional[str] = None
    date: Optional[date] = None
    status: Optional[str] = Field(default=None, pattern="^(Lead|Contacted|Interested|Closed|Lost)$")
    notes: Optional[str] = None


class OutdoorCustomerResponse(BaseModel):
    id: int
    branch_id: int
    marketing_employee_id: int
    marketing_employee_name: Optional[str] = None
    customer_name: str
    phone: str
    area_name: str
    scheme_name: Optional[str] = None
    date: date
    status: str
    notes: Optional[str] = None
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
    employee_id: int
    date: Optional[date] = None
    area: str = Field(..., min_length=2, max_length=150)
    schemes_promoted: int = Field(default=0, ge=0)
    customers_generated: int = Field(default=0, ge=0)
    customers_attended: int = Field(default=0, ge=0)
    customers_closed: int = Field(default=0, ge=0)
    notes: Optional[str] = None
    image_url: Optional[str] = None


class OutdoorActivityResponse(BaseModel):
    id: int
    branch_id: int
    employee_id: int
    employee_name: Optional[str] = None
    date: date
    area: str
    schemes_promoted: int
    customers_generated: int
    customers_attended: int
    customers_closed: int
    notes: Optional[str] = None
    image_url: Optional[str] = None
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
    recent_activities: List[OutdoorActivityResponse] = []
