from datetime import date as dt_date, datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict


class FollowUpBase(BaseModel):
    customer_id: int
    employee_id: int
    scheduled_date: dt_date = Field(default_factory=dt_date.today)
    status: str = Field(default="Pending")
    priority: str = Field(default="Medium")
    notes: Optional[str] = None


class FollowUpCreate(FollowUpBase):
    pass


class FollowUpUpdate(BaseModel):
    scheduled_date: Optional[dt_date] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    notes: Optional[str] = None
    completed_at: Optional[datetime] = None


class FollowUpActionRequest(BaseModel):
    action: str = Field(..., description="'complete', 'reschedule', 'reassign', 'cancel'")
    rescheduled_date: Optional[dt_date] = None
    new_employee_id: Optional[int] = None
    notes: Optional[str] = None
    new_customer_status: Optional[str] = None


class FollowUpResponse(FollowUpBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    branch_id: int
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    customer_code: Optional[str] = None
    customer_type: Optional[str] = None
    customer_status: Optional[str] = None
    interested_category: Optional[str] = None
    employee_name: Optional[str] = None
    employee_code: Optional[str] = None
    completed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime


class FollowUpListResponse(BaseModel):
    items: List[FollowUpResponse]
    total: int
    pending_count: int
    overdue_count: int
    today_count: int
    upcoming_count: int
