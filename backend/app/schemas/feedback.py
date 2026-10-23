from typing import Optional, List
from datetime import date, datetime
from pydantic import BaseModel, ConfigDict


class FeedbackBase(BaseModel):
    customer_name: str
    customer_phone: Optional[str] = ""
    feedback_date: Optional[date] = None
    rating: int = 5
    category: str = "Customer Service"
    feedback_text: str
    notes: Optional[str] = None
    status: str = "Verified"


class FeedbackCreate(FeedbackBase):
    employee_id: int


class FeedbackUpdate(BaseModel):
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    feedback_date: Optional[date] = None
    rating: Optional[int] = None
    category: Optional[str] = None
    feedback_text: Optional[str] = None
    notes: Optional[str] = None
    status: Optional[str] = None


class FeedbackResponse(FeedbackBase):
    id: int
    branch_id: int
    branch_name: Optional[str] = None
    branch_code: Optional[str] = None
    employee_id: int
    employee_name: Optional[str] = None
    employee_code: Optional[str] = None
    feedback_date: date
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AdminFeedbackOverviewResponse(BaseModel):
    total_feedbacks: int
    average_rating: float
    records: List[FeedbackResponse]
