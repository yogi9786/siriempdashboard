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
    customer_name = Column(String(150), default="Customer Walk-in", nullable=True)
    phone_number = Column(String(50), default="", nullable=True)
    dob = Column(Date, nullable=True)
    anniversary = Column(Date, nullable=True)
    product_value = Column(Float, default=0.0, nullable=True)
    customers_count = Column(Integer, default=1, nullable=False)
    breakdown = Column(Text, nullable=True)  # JSON or text of per-customer status/details
    activity_date = Column(Date, default=date.today, index=True, nullable=False)
    status = Column(String(100), default="Walkin", nullable=False)  # Sold, Exchange, Lost, Walkin, In Hold / Follow Up
    approval_status = Column(String(50), default="APPROVED", nullable=False)  # PENDING, APPROVED, REJECTED
    created_by_role = Column(String(50), default="MANAGER", nullable=True)  # EMPLOYEE, MANAGER
    created_by_id = Column(Integer, nullable=True)
    rejection_reason = Column(Text, nullable=True)
    reviewed_by_id = Column(Integer, nullable=True)
    reviewed_at = Column(DateTime, nullable=True)
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
    customer_name = Column(String(150), default="Customer", nullable=True)
    customers_count = Column(Integer, default=1, nullable=False)
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
    """Tracks Google reviews entered by employees or managers with rating, image proof, and points."""
    __tablename__ = "google_reviews"

    id = Column(Integer, primary_key=True, index=True)
    branch_id = Column(Integer, ForeignKey("branches.id"), index=True, nullable=False)
    employee_id = Column(Integer, ForeignKey("employees.id"), index=True, nullable=True)
    customer_name = Column(String(150), default="Google Customer", nullable=True)
    customers_count = Column(Integer, default=1, nullable=False)  # 1 customer review = 1 point
    review_date = Column(Date, default=date.today, index=True, nullable=False)
    rating = Column(Integer, default=5, nullable=False)  # 1 to 5
    review_text = Column(Text, nullable=False)
    notes = Column(Text, nullable=True)
    screenshot_url = Column(String(255), nullable=True)  # Proof image screenshot
    status = Column(String(50), default="PENDING", nullable=False)  # PENDING, APPROVED, REJECTED, Published, Verified
    rejection_reason = Column(String(255), nullable=True)
    reviewed_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    reviewed_at = Column(DateTime, nullable=True)
    submitted_by_role = Column(String(50), default="EMPLOYEE", nullable=False)  # EMPLOYEE, MANAGER, ADMIN
    created_at = Column(DateTime, default=utcnow, nullable=False)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow, nullable=False)

    # Relationships
    branch = relationship("Branch", back_populates="google_reviews")
    employee = relationship("Employee", back_populates="google_reviews")
    reviewer = relationship("User", foreign_keys=[reviewed_by_id])

    @property
    def points(self) -> int:
        st = (self.status or "").upper()
        if st in ["APPROVED", "VERIFIED", "PUBLISHED"]:
            return max(1, self.customers_count or 1)
        return 0


class VideoReview(Base):
    """Tracks customer video reviews created by/for employees with image proof and points."""
    __tablename__ = "video_reviews"

    id = Column(Integer, primary_key=True, index=True)
    branch_id = Column(Integer, ForeignKey("branches.id"), index=True, nullable=False)
    employee_id = Column(Integer, ForeignKey("employees.id"), index=True, nullable=True)
    customer_name = Column(String(150), default="Video Customer", nullable=True)
    videos_count = Column(Integer, default=1, nullable=False)  # 1 video = 1 point, 2 videos = 2 points
    video_title = Column(String(200), nullable=True)
    video_url = Column(String(500), nullable=True)
    review_date = Column(Date, default=date.today, index=True, nullable=False)
    notes = Column(Text, nullable=True)
    screenshot_url = Column(String(255), nullable=True)  # Image proof / thumbnail
    status = Column(String(50), default="PENDING", nullable=False)  # PENDING, APPROVED, REJECTED
    rejection_reason = Column(String(255), nullable=True)
    reviewed_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    reviewed_at = Column(DateTime, nullable=True)
    submitted_by_role = Column(String(50), default="EMPLOYEE", nullable=False)  # EMPLOYEE, MANAGER, ADMIN
    created_at = Column(DateTime, default=utcnow, nullable=False)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow, nullable=False)

    # Relationships
    branch = relationship("Branch", back_populates="video_reviews")
    employee = relationship("Employee", back_populates="video_reviews")
    reviewer = relationship("User", foreign_keys=[reviewed_by_id])

    @property
    def points(self) -> int:
        st = (self.status or "").upper()
        if st in ["APPROVED", "VERIFIED", "PUBLISHED"]:
            return max(1, self.videos_count or 1) * 5
        return 0


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


class EmployeeCallLog(Base):
    """Tracks customer calls made by employees (calls done vs pending)."""
    __tablename__ = "employee_call_logs"

    id = Column(Integer, primary_key=True, index=True)
    branch_id = Column(Integer, ForeignKey("branches.id"), index=True, nullable=False)
    employee_id = Column(Integer, ForeignKey("employees.id"), index=True, nullable=False)
    customer_name = Column(String(150), nullable=False)
    phone_number = Column(String(50), nullable=False, default="")
    customers_count = Column(Integer, default=1, nullable=False)  # select how many customers
    call_status = Column(String(50), default="Done", nullable=False)  # Done, Pending
    call_date = Column(Date, default=date.today, index=True, nullable=False)
    call_time = Column(String(50), nullable=True)  # e.g., "11:30 AM"
    purpose = Column(String(100), default="Follow-up Call", nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utcnow, nullable=False)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow, nullable=False)

    # Relationships
    branch = relationship("Branch")
    employee = relationship("Employee", back_populates="call_logs")

    def to_dict(self):
        return {
            "id": self.id,
            "branch_id": self.branch_id,
            "employee_id": self.employee_id,
            "customer_name": self.customer_name,
            "phone_number": self.phone_number,
            "customers_count": self.customers_count or 1,
            "call_status": self.call_status,
            "call_date": self.call_date.strftime("%Y-%m-%d") if self.call_date else None,
            "call_time": self.call_time,
            "purpose": self.purpose,
            "notes": self.notes,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

