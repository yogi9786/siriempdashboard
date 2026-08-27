from datetime import date as dt_date, datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


class ReportFilterRequest(BaseModel):
    report_type: str = Field(..., description="employee_performance, daily_sales, monthly_sales, customer_conversion, branch_performance, employee_targets, follow_up_summary")
    start_date: dt_date
    end_date: dt_date
    employee_id: Optional[int] = None
    department: Optional[str] = None
    product_category: Optional[str] = None
    customer_status: Optional[str] = None


class ReportSummaryMetric(BaseModel):
    label: str
    value: str


class ReportResponse(BaseModel):
    report_type: str
    title: str
    branch_name: str
    start_date: dt_date
    end_date: dt_date
    generated_at: datetime
    columns: List[str]
    column_keys: List[str]
    rows: List[Dict[str, Any]]
    summary_metrics: List[ReportSummaryMetric] = []
    total_records: int
