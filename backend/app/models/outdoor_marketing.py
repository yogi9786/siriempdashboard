from datetime import datetime, date, timezone
from sqlalchemy import Column, Integer, String, Float, Date, DateTime, Text, ForeignKey
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


class OutdoorMarketingCustomer(Base):
    """Tracks customer leads generated during outdoor marketing activities."""
    __tablename__ = "outdoor_marketing_customers"

    id = Column(Integer, primary_key=True, index=True)
    branch_id = Column(Integer, ForeignKey("branches.id"), index=True, nullable=False)
    marketing_employee_id = Column(Integer, ForeignKey("employees.id"), index=True, nullable=False)
    customer_name = Column(String(150), nullable=False)
    phone = Column(String(20), nullable=False)
    area_name = Column(String(150), nullable=False)
    scheme_name = Column(String(150), nullable=True)
    date = Column(Date, default=date.today, index=True, nullable=False)
    status = Column(String(50), default="Lead", nullable=False)  # Lead, Contacted, Interested, Closed, Lost
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utcnow, nullable=False)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow, nullable=False)

    # Relationships
    branch = relationship("Branch", back_populates="outdoor_customers")
    marketing_employee = relationship("Employee")


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
    employee_id = Column(Integer, ForeignKey("employees.id"), index=True, nullable=False)
    date = Column(Date, default=date.today, index=True, nullable=False)
    area = Column(String(150), nullable=False)
    schemes_promoted = Column(Integer, default=0, nullable=False)
    customers_generated = Column(Integer, default=0, nullable=False)
    customers_attended = Column(Integer, default=0, nullable=False)
    customers_closed = Column(Integer, default=0, nullable=False)
    notes = Column(Text, nullable=True)
    image_url = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=utcnow, nullable=False)

    # Relationships
    branch = relationship("Branch", back_populates="outdoor_activities")
    employee = relationship("Employee", back_populates="outdoor_activities")
