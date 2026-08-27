from datetime import datetime, date, timezone
from sqlalchemy import Column, Integer, String, Date, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from backend.app.core.database import Base


def utcnow():
    return datetime.now(timezone.utc)


class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    branch_id = Column(Integer, ForeignKey("branches.id"), index=True, nullable=False)
    assigned_employee_id = Column(Integer, ForeignKey("employees.id"), index=True, nullable=True)
    customer_code = Column(String(50), index=True, nullable=False)  # e.g., CUST-YEL-001
    full_name = Column(String(150), nullable=False)
    phone = Column(String(20), nullable=False, index=True)
    email = Column(String(100), nullable=True)
    location = Column(String(150), nullable=True)
    customer_type = Column(String(50), default="New", nullable=False)  # New, Regular, VIP, Occasional
    lead_source = Column(String(50), default="Walk-in", nullable=False)  # Walk-in, Phone, WhatsApp, Instagram, Facebook, Website, Referral, Existing Customer, Other
    interested_category = Column(String(100), default="Gold", nullable=False)  # Gold, Diamond, Silver, Bridal Jewellery, Necklace, Ring, Bangle, Earrings, Chain, Mangalsutra, Pendant, Gold Coin, Saree, Other
    budget_range = Column(String(50), nullable=True)  # e.g. "₹50k - ₹1L", "₹1L - ₹3L"
    status = Column(String(50), default="New", nullable=False)  # New, Contacted, Interested, Follow-up, Visited, Quotation Given, Converted, Lost, Not Interested
    first_contact_date = Column(Date, default=date.today, nullable=False)
    last_contact_date = Column(Date, default=date.today, nullable=False)
    next_followup_date = Column(Date, nullable=True, index=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utcnow, nullable=False)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow, nullable=False)

    # Relationships
    branch = relationship("Branch", back_populates="customers")
    assigned_employee = relationship("Employee", back_populates="customers")
    interactions = relationship("CustomerInteraction", back_populates="customer", cascade="all, delete-orphan")
    follow_ups = relationship("FollowUp", back_populates="customer", cascade="all, delete-orphan")
    sales = relationship("Sale", back_populates="customer")


class CustomerInteraction(Base):
    __tablename__ = "customer_interactions"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), index=True, nullable=False)
    employee_id = Column(Integer, ForeignKey("employees.id"), index=True, nullable=False)
    branch_id = Column(Integer, ForeignKey("branches.id"), index=True, nullable=False)
    interaction_type = Column(String(50), nullable=False)  # In-Store Visit, Phone Call, WhatsApp, Quotation Given, Product Demo, Follow-up
    notes = Column(Text, nullable=False)
    outcome = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=utcnow, nullable=False)

    # Relationships
    customer = relationship("Customer", back_populates="interactions")
    employee = relationship("Employee")
    branch = relationship("Branch")


class FollowUp(Base):
    __tablename__ = "follow_ups"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), index=True, nullable=False)
    employee_id = Column(Integer, ForeignKey("employees.id"), index=True, nullable=False)
    branch_id = Column(Integer, ForeignKey("branches.id"), index=True, nullable=False)
    scheduled_date = Column(Date, index=True, nullable=False)
    status = Column(String(30), default="Pending", index=True, nullable=False)  # Pending, Completed, Rescheduled, Cancelled
    priority = Column(String(20), default="Medium", nullable=False)  # High, Medium, Low
    notes = Column(Text, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=utcnow, nullable=False)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow, nullable=False)

    # Relationships
    customer = relationship("Customer", back_populates="follow_ups")
    employee = relationship("Employee", back_populates="follow_ups")
    branch = relationship("Branch", back_populates="follow_ups")
