from typing import Optional, List
from datetime import date, datetime
from pydantic import BaseModel, ConfigDict


class AttendanceBase(BaseModel):
    status: str = "Present"  # Present, Absent, Half Day, On Leave, Late
    check_in: Optional[str] = None
    check_out: Optional[str] = None
    notes: Optional[str] = None


class AttendanceCreate(AttendanceBase):
    employee_id: int
    date: Optional[date] = None


class AttendanceUpdate(BaseModel):
    status: Optional[str] = None
    check_in: Optional[str] = None
    check_out: Optional[str] = None
    notes: Optional[str] = None


class BulkAttendanceItem(BaseModel):
    employee_id: int
    status: str = "Present"
    check_in: Optional[str] = None
    check_out: Optional[str] = None
    notes: Optional[str] = None


class BulkAttendanceCreate(BaseModel):
    date: date
    branch_id: Optional[int] = None
    items: List[BulkAttendanceItem]


class AttendanceResponse(AttendanceBase):
    id: int
    branch_id: int
    branch_name: Optional[str] = None
    branch_code: Optional[str] = None
    employee_id: int
    employee_name: Optional[str] = None
    employee_code: Optional[str] = None
    designation: Optional[str] = None
    department: Optional[str] = None
    date: date
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AttendanceSummary(BaseModel):
    total_roster: int = 0
    total_present: int = 0
    total_absent: int = 0
    total_half_day: int = 0
    total_leave: int = 0
    total_late: int = 0
    attendance_rate: float = 100.0
    total_employees: int = 0
    present_count: int = 0
    absent_count: int = 0
    half_day_count: int = 0
    leave_count: int = 0
    late_count: int = 0
    attendance_rate_pct: float = 100.0


class BranchAttendanceMetric(BaseModel):
    branch_id: int
    branch_name: str
    branch_code: str
    total_roster: int
    total_present: int
    present_count: int
    absent_count: int
    attendance_rate: float
    rate: float


class AdminAttendanceOverviewResponse(BaseModel):
    summary: AttendanceSummary
    records: List[AttendanceResponse]
    branch_metrics: Optional[List[BranchAttendanceMetric]] = None
    sync_timestamp: datetime
