from datetime import datetime, date, timezone
from sqlalchemy import Column, Integer, String, Date, DateTime, Text, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from backend.app.core.database import Base


def utcnow():
    return datetime.now(timezone.utc)


class EmployeeAttendance(Base):
    """Tracks daily employee showroom attendance and work hours."""
    __tablename__ = "employee_attendance"

    id = Column(Integer, primary_key=True, index=True)
    branch_id = Column(Integer, ForeignKey("branches.id"), index=True, nullable=False)
    employee_id = Column(Integer, ForeignKey("employees.id"), index=True, nullable=False)
    date = Column(Date, default=date.today, index=True, nullable=False)
    status = Column(String(50), default="Present", nullable=False)  # Present, Absent, Half Day, On Leave, Late
    check_in = Column(String(20), nullable=True)  # e.g., "09:30 AM"
    check_out = Column(String(20), nullable=True)  # e.g., "08:00 PM"
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utcnow, nullable=False)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow, nullable=False)

    __table_args__ = (
        UniqueConstraint("employee_id", "date", name="uix_employee_attendance_date"),
    )

    # Relationships
    branch = relationship("Branch")
    employee = relationship("Employee")
