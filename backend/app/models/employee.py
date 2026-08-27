from datetime import datetime, date, timezone
from sqlalchemy import Column, Integer, String, Boolean, Date, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from backend.app.core.database import Base


def utcnow():
    return datetime.now(timezone.utc)


class Employee(Base):
    __tablename__ = "employees"

    id = Column(Integer, primary_key=True, index=True)
    branch_id = Column(Integer, ForeignKey("branches.id"), index=True, nullable=False)
    manager_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=True)  # Manager isolation
    employee_code = Column(String(50), index=True, nullable=False)  # e.g., EMP-YEL-001
    full_name = Column(String(150), nullable=False)
    phone = Column(String(20), nullable=True, default="")
    email = Column(String(100), nullable=True)
    designation = Column(String(100), nullable=True, default="Sales Executive")
    department = Column(String(100), nullable=True, default="Sales & Showroom Operations")
    date_of_joining = Column(Date, default=date.today, nullable=True)
    status = Column(String(20), default="active", nullable=False)  # active, inactive
    profile_photo_url = Column(String(255), nullable=True)
    notes = Column(Text, nullable=True)
    is_outdoor_marketing_employee = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=utcnow, nullable=False)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow, nullable=False)

    # Relationships
    branch = relationship("Branch", back_populates="employees")
    manager = relationship("User", foreign_keys=[manager_id])
    customer_activities = relationship("CustomerActivity", back_populates="employee", cascade="all, delete-orphan")
    schemes = relationship("SchemeRecord", back_populates="employee", cascade="all, delete-orphan")
    form_media = relationship("EmployeeFormMedia", back_populates="employee", cascade="all, delete-orphan")
    attire_records = relationship("AttireRecord", back_populates="employee", cascade="all, delete-orphan")
    outdoor_activities = relationship("OutdoorMarketingActivity", back_populates="employee", cascade="all, delete-orphan")
    outdoor_schemes = relationship("OutdoorMarketingScheme", back_populates="employee", cascade="all, delete-orphan")
