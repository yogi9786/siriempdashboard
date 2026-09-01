from datetime import datetime, date, timezone
from sqlalchemy import Column, Integer, String, Boolean, Float, Date, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from backend.app.core.database import Base


def utcnow():
    return datetime.now(timezone.utc)


class OutdoorMarketingArea(Base):
    """Manages areas targeted for outdoor marketing campaigns."""
    __tablename__ = "outdoor_marketing_areas"

    id = Column(Integer, primary_key=True, index=True)
    branch_id = Column(Integer, ForeignKey("branches.id"), index=True, nullable=False)
    area_name = Column(String(150), index=True, nullable=False)
    location = Column(String(255), nullable=False)
    assigned_employee_id = Column(Integer, ForeignKey("employees.id"), index=True, nullable=True)
    activity_date = Column(Date, default=date.today, index=True, nullable=False)
    status = Column(String(50), default="Planned", nullable=False)  # Planned, Active, Completed
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utcnow, nullable=False)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow, nullable=False)

    # Relationships
    branch = relationship("Branch", back_populates="outdoor_areas")
    assigned_employee = relationship("Employee")


class OutdoorMarketingDuty(Base):
    """Tracks daily outdoor marketing assignments and field performance per employee."""
    __tablename__ = "outdoor_marketing_duties"

    id = Column(Integer, primary_key=True, index=True)
    branch_id = Column(Integer, ForeignKey("branches.id"), index=True, nullable=False)
    employee_id = Column(Integer, ForeignKey("employees.id"), index=True, nullable=False)
    date = Column(Date, default=date.today, index=True, nullable=False)
    area = Column(String(150), nullable=True)
    scheme_name = Column(String(150), nullable=True)
    customers_attended_count = Column(Integer, default=0, nullable=False)
    converted_customers_count = Column(Integer, default=0, nullable=False)
    google_ratings_count = Column(Integer, default=0, nullable=False)
    photo_url = Column(String(500), nullable=True)
    photo_urls = Column(Text, nullable=True)  # JSON or comma-separated list of multiple photos
    notes = Column(Text, nullable=True)
    status = Column(String(50), default="Assigned", nullable=False)  # Assigned, In Progress, Completed
    created_at = Column(DateTime, default=utcnow, nullable=False)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow, nullable=False)

    # Relationships
    branch = relationship("Branch", back_populates="outdoor_duties")
    employee = relationship("Employee", back_populates="outdoor_duties")
    customers = relationship("OutdoorMarketingCustomer", back_populates="duty", cascade="all, delete-orphan")


class OutdoorMarketingCustomer(Base):
    """Tracks customer leads generated during outdoor marketing activities."""
    __tablename__ = "outdoor_marketing_customers"

    id = Column(Integer, primary_key=True, index=True)
    branch_id = Column(Integer, ForeignKey("branches.id"), index=True, nullable=False)
    marketing_employee_id = Column(Integer, ForeignKey("employees.id"), index=True, nullable=False)
    duty_id = Column(Integer, ForeignKey("outdoor_marketing_duties.id"), index=True, nullable=True)
    customer_name = Column(String(150), nullable=False)
    phone = Column(String(20), nullable=True)
    dob = Column(Date, nullable=True)
    anniversary_date = Column(Date, nullable=True)
    area_name = Column(String(150), nullable=True)
    scheme_name = Column(String(150), nullable=True)
    date = Column(Date, default=date.today, index=True, nullable=False)
    is_converted = Column(Boolean, default=False, nullable=False)
    has_google_review = Column(Boolean, default=False, nullable=False)
    google_review_rating = Column(Integer, default=5, nullable=True)
    google_review_text = Column(Text, nullable=True)
    status = Column(String(50), default="Lead", nullable=False)  # Lead, Contacted, Interested, Converted, Closed, Lost
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utcnow, nullable=False)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow, nullable=False)

    # Relationships
    branch = relationship("Branch", back_populates="outdoor_customers")
    marketing_employee = relationship("Employee")
    duty = relationship("OutdoorMarketingDuty", back_populates="customers")




class OutdoorMarketingScheme(Base):
    """Tracks schemes promoted during outdoor marketing campaigns."""
    __tablename__ = "outdoor_marketing_schemes"

    id = Column(Integer, primary_key=True, index=True)
    branch_id = Column(Integer, ForeignKey("branches.id"), index=True, nullable=False)
    employee_id = Column(Integer, ForeignKey("employees.id"), index=True, nullable=False)
    date = Column(Date, default=date.today, index=True, nullable=False)
    scheme_name = Column(String(150), nullable=False)
    description = Column(Text, nullable=True)
    area = Column(String(150), nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utcnow, nullable=False)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow, nullable=False)

    # Relationships
    branch = relationship("Branch", back_populates="outdoor_schemes")
    employee = relationship("Employee", back_populates="outdoor_schemes")


class OutdoorMarketingActivity(Base):
    """Tracks summary logs of outdoor marketing events."""
    __tablename__ = "outdoor_marketing_activities"

    id = Column(Integer, primary_key=True, index=True)
    branch_id = Column(Integer, ForeignKey("branches.id"), index=True, nullable=False)
    employee_id = Column(Integer, ForeignKey("employees.id"), index=True, nullable=True)
    participating_employee_ids = Column(String(255), nullable=True)
    employee_names = Column(String(500), nullable=True)
    date = Column(Date, default=date.today, index=True, nullable=False)
    area = Column(String(150), nullable=False)
    scheme_name = Column(String(150), nullable=True)
    schemes_promoted = Column(Integer, default=0, nullable=False)
    customers_generated = Column(Integer, default=0, nullable=False)
    customers_attended = Column(Integer, default=0, nullable=False)
    customers_closed = Column(Integer, default=0, nullable=False)
    converted_customers = Column(Integer, default=0, nullable=False)
    google_ratings_count = Column(Integer, default=0, nullable=False)
    notes = Column(Text, nullable=True)
    image_url = Column(String(255), nullable=True)
    photo_url = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=utcnow, nullable=False)

    # Relationships
    branch = relationship("Branch", back_populates="outdoor_activities")
    employee = relationship("Employee", back_populates="outdoor_activities")

