from datetime import datetime, date, timezone
from sqlalchemy import Column, Integer, String, Float, Date, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from backend.app.core.database import Base


def utcnow():
    return datetime.now(timezone.utc)


class EmployeePaySlip(Base):
    __tablename__ = "employee_payslips"

    id = Column(Integer, primary_key=True, index=True)
    branch_id = Column(Integer, ForeignKey("branches.id"), index=True, nullable=False)
    employee_id = Column(Integer, ForeignKey("employees.id"), index=True, nullable=False)
    month = Column(String(50), nullable=False)  # e.g., "October"
    year = Column(Integer, nullable=False)       # e.g., 2026
    pay_period = Column(String(100), nullable=True)  # e.g., "October 2026"
    amount = Column(Float, nullable=True, default=0.0)  # Net Pay in INR
    notes = Column(Text, nullable=True)
    file_url = Column(String(500), nullable=False)  # Image or PDF URL
    issued_date = Column(Date, default=date.today, nullable=False)
    created_at = Column(DateTime, default=utcnow, nullable=False)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow, nullable=False)

    # Relationships
    branch = relationship("Branch")
    employee = relationship("Employee")


class EmployeeLeaveRequest(Base):
    __tablename__ = "employee_leave_requests"

    id = Column(Integer, primary_key=True, index=True)
    branch_id = Column(Integer, ForeignKey("branches.id"), index=True, nullable=False)
    employee_id = Column(Integer, ForeignKey("employees.id"), index=True, nullable=False)
    leave_type = Column(String(50), default="Casual Leave", nullable=False)  # Casual Leave, Sick Leave, Emergency Leave, Annual Leave
    subject = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    from_date = Column(Date, nullable=False)
    to_date = Column(Date, nullable=False)
    days_count = Column(Integer, default=1, nullable=False)
    status = Column(String(50), default="PENDING", nullable=False)  # PENDING, APPROVED, REJECTED
    reviewed_by_id = Column(Integer, nullable=True)
    reviewed_by_name = Column(String(100), nullable=True)
    rejection_reason = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utcnow, nullable=False)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow, nullable=False)

    # Relationships
    branch = relationship("Branch")
    employee = relationship("Employee")

