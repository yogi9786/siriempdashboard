from datetime import datetime, date, timezone
from sqlalchemy import Column, Integer, String, Float, Date, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from backend.app.core.database import Base


def utcnow():
    return datetime.now(timezone.utc)


class CustomerActivity(Base):
    """Tracks customer activity attended by showroom employees."""
    __tablename__ = "customer_activities"

    id = Column(Integer, primary_key=True, index=True)
    branch_id = Column(Integer, ForeignKey("branches.id"), index=True, nullable=False)
    employee_id = Column(Integer, ForeignKey("employees.id"), index=True, nullable=False)
    customer_name = Column(String(150), nullable=False)
    phone_number = Column(String(20), nullable=False)
    activity_date = Column(Date, default=date.today, index=True, nullable=False)
    status = Column(String(50), default="Attended", nullable=False)  # Attended, Closed, Follow-up, Lost
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utcnow, nullable=False)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow, nullable=False)

    # Relationships
    branch = relationship("Branch", back_populates="customer_activities")
    employee = relationship("Employee", back_populates="customer_activities")


# Aliases for backward compatibility if needed
Customer = CustomerActivity


class SchemeRecord(Base):
    """Tracks schemes closed by showroom employees."""
    __tablename__ = "scheme_records"

    id = Column(Integer, primary_key=True, index=True)
    branch_id = Column(Integer, ForeignKey("branches.id"), index=True, nullable=False)
    employee_id = Column(Integer, ForeignKey("employees.id"), index=True, nullable=False)
    customer_name = Column(String(150), nullable=False)
    scheme_name = Column(String(150), nullable=False)
    amount = Column(Float, default=0.0, nullable=False)
    record_date = Column(Date, default=date.today, index=True, nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utcnow, nullable=False)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow, nullable=False)

    # Relationships
    branch = relationship("Branch", back_populates="schemes")
    employee = relationship("Employee", back_populates="schemes")


class EmployeeFormMedia(Base):
    """Stores metadata and file path for employee form images/uploads."""
    __tablename__ = "employee_form_media"

    id = Column(Integer, primary_key=True, index=True)
    branch_id = Column(Integer, ForeignKey("branches.id"), index=True, nullable=False)
    employee_id = Column(Integer, ForeignKey("employees.id"), index=True, nullable=False)
    form_type = Column(String(100), nullable=False)  # e.g., Daily Closing Form, Customer Order Form, Inspection Form
    file_path = Column(String(255), nullable=False)
    file_url = Column(String(255), nullable=False)
    mime_type = Column(String(50), nullable=False)
    file_size = Column(Integer, nullable=False)  # in bytes
    notes = Column(Text, nullable=True)
    upload_date = Column(DateTime, default=utcnow, index=True, nullable=False)
    created_at = Column(DateTime, default=utcnow, nullable=False)

    # Relationships
    branch = relationship("Branch", back_populates="form_media")
    employee = relationship("Employee", back_populates="form_media")


class GoogleReview(Base):
    """Tracks Google reviews manually entered by managers with rating and screenshots."""
    __tablename__ = "google_reviews"

    id = Column(Integer, primary_key=True, index=True)
    branch_id = Column(Integer, ForeignKey("branches.id"), index=True, nullable=False)
    employee_id = Column(Integer, ForeignKey("employees.id"), index=True, nullable=True)
    customer_name = Column(String(150), nullable=False)
    review_date = Column(Date, default=date.today, index=True, nullable=False)
    rating = Column(Integer, default=5, nullable=False)  # 1 to 5
    review_text = Column(Text, nullable=False)
    notes = Column(Text, nullable=True)
    screenshot_url = Column(String(255), nullable=True)
    status = Column(String(50), default="Published", nullable=False)  # Published, Pending, Verified
    created_at = Column(DateTime, default=utcnow, nullable=False)

    # Relationships
    branch = relationship("Branch", back_populates="google_reviews")
    employee = relationship("Employee")


class AttireRecord(Base):
    """Tracks employee attire and uniform compliance logs."""
    __tablename__ = "attire_records"

    id = Column(Integer, primary_key=True, index=True)
    branch_id = Column(Integer, ForeignKey("branches.id"), index=True, nullable=False)
    employee_id = Column(Integer, ForeignKey("employees.id"), index=True, nullable=False)
    check_date = Column(Date, default=date.today, index=True, nullable=False)
    status = Column(String(50), default="Proper", nullable=False)  # Proper, Not Proper, Needs Attention
    notes = Column(Text, nullable=True)
    image_url = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=utcnow, nullable=False)

    # Relationships
    branch = relationship("Branch", back_populates="attire_records")
    employee = relationship("Employee", back_populates="attire_records")
