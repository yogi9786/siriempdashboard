from datetime import date as dt_date, datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict


class CustomerBase(BaseModel):
    customer_code: Optional[str] = None
    full_name: str = Field(..., min_length=2, max_length=150)
    phone: str = Field(..., min_length=8, max_length=20)
    email: Optional[str] = None
    location: Optional[str] = None
    customer_type: str = Field(default="New")
    lead_source: str = Field(default="Walk-in")
    interested_category: str = Field(default="Gold")
    budget_range: Optional[str] = None
    status: str = Field(default="New")
    assigned_employee_id: Optional[int] = None
    first_contact_date: dt_date = Field(default_factory=dt_date.today)
    last_contact_date: dt_date = Field(default_factory=dt_date.today)
    next_followup_date: Optional[dt_date] = None
    notes: Optional[str] = None


class CustomerCreate(CustomerBase):
    pass


class CustomerUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    location: Optional[str] = None
    customer_type: Optional[str] = None
    lead_source: Optional[str] = None
    interested_category: Optional[str] = None
    budget_range: Optional[str] = None
    status: Optional[str] = None
    assigned_employee_id: Optional[int] = None
    last_contact_date: Optional[dt_date] = None
    next_followup_date: Optional[dt_date] = None
    notes: Optional[str] = None


class CustomerResponse(CustomerBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    branch_id: int
    customer_code: str
    assigned_employee_name: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class CustomerListResponse(BaseModel):
    items: List[CustomerResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class CustomerInteractionCreate(BaseModel):
    customer_id: int
    employee_id: int
    interaction_type: str
    notes: str
    outcome: Optional[str] = None


class CustomerInteractionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    customer_id: int
    employee_id: int
    employee_name: Optional[str] = None
    branch_id: int
    interaction_type: str
    notes: str
    outcome: Optional[str] = None
    created_at: datetime


class CustomerDetailResponse(BaseModel):
    customer: CustomerResponse
    assigned_employee: Optional[dict] = None
    interactions: List[CustomerInteractionResponse] = []
    follow_ups: List[dict] = []
    purchase_history: List[dict] = []
