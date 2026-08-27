from datetime import date as dt_date, datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict


class DailyPerformanceBase(BaseModel):
    employee_id: int
    date: dt_date = Field(default_factory=dt_date.today)
    customers_approached: int = Field(default=0, ge=0)
    customers_visited: int = Field(default=0, ge=0)
    new_enquiries: int = Field(default=0, ge=0)
    followups: int = Field(default=0, ge=0)
    product_demos: int = Field(default=0, ge=0)
    quotations_given: int = Field(default=0, ge=0)
    customers_converted: int = Field(default=0, ge=0)
    sales_count: int = Field(default=0, ge=0)
    gold_sales_value: float = Field(default=0.0, ge=0)
    diamond_sales_value: float = Field(default=0.0, ge=0)
    silver_sales_value: float = Field(default=0.0, ge=0)
    other_sales_value: float = Field(default=0.0, ge=0)
    completed_followups: int = Field(default=0, ge=0)
    pending_followups: int = Field(default=0, ge=0)
    lost_customers: int = Field(default=0, ge=0)
    lost_reason: Optional[str] = None
    notes: Optional[str] = None


class DailyPerformanceCreate(DailyPerformanceBase):
    pass


class DailyPerformanceUpdate(BaseModel):
    customers_approached: Optional[int] = Field(default=None, ge=0)
    customers_visited: Optional[int] = Field(default=None, ge=0)
    new_enquiries: Optional[int] = Field(default=None, ge=0)
    followups: Optional[int] = Field(default=None, ge=0)
    product_demos: Optional[int] = Field(default=None, ge=0)
    quotations_given: Optional[int] = Field(default=None, ge=0)
    customers_converted: Optional[int] = Field(default=None, ge=0)
    sales_count: Optional[int] = Field(default=None, ge=0)
    gold_sales_value: Optional[float] = Field(default=None, ge=0)
    diamond_sales_value: Optional[float] = Field(default=None, ge=0)
    silver_sales_value: Optional[float] = Field(default=None, ge=0)
    other_sales_value: Optional[float] = Field(default=None, ge=0)
    completed_followups: Optional[int] = Field(default=None, ge=0)
    pending_followups: Optional[int] = Field(default=None, ge=0)
    lost_customers: Optional[int] = Field(default=None, ge=0)
    lost_reason: Optional[str] = None
    notes: Optional[str] = None


class DailyPerformanceResponse(DailyPerformanceBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    branch_id: int
    employee_name: Optional[str] = None
    employee_code: Optional[str] = None
    department: Optional[str] = None
    total_sales_value: float
    conversion_rate: float
    average_sale_value: float
    target_achievement_rate: float
    performance_score: float
    created_at: datetime
    updated_at: datetime


class LeaderboardItem(BaseModel):
    rank: int
    employee_id: int
    employee_code: str
    employee_name: str
    department: str
    designation: str
    customers_approached: int
    conversions: int
    conversion_rate: float
    total_sales: float
    target_amount: float
    target_achievement_rate: float
    completed_followups: int
    performance_score: float


class LeaderboardResponse(BaseModel):
    items: List[LeaderboardItem]
    period: str
    start_date: dt_date
    end_date: dt_date
    top_performer: Optional[LeaderboardItem] = None
