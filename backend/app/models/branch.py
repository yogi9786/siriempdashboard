from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from backend.app.core.database import Base


def utcnow():
    return datetime.now(timezone.utc)


class Branch(Base):
    __tablename__ = "branches"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, index=True, nullable=False)  # e.g. YELAHANKA
    name = Column(String(100), nullable=False)
    city = Column(String(100), nullable=False)
    address = Column(String(255), nullable=True)
    phone = Column(String(20), nullable=True)
    email = Column(String(100), nullable=True)
    description = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=utcnow, nullable=False)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow, nullable=False)

    # Relationships
    users = relationship("User", back_populates="branch", cascade="all, delete-orphan")
    employees = relationship("Employee", back_populates="branch", cascade="all, delete-orphan")
    customer_activities = relationship("CustomerActivity", back_populates="branch", cascade="all, delete-orphan")
    schemes = relationship("SchemeRecord", back_populates="branch", cascade="all, delete-orphan")
    form_media = relationship("EmployeeFormMedia", back_populates="branch", cascade="all, delete-orphan")
    google_reviews = relationship("GoogleReview", back_populates="branch", cascade="all, delete-orphan")
    attire_records = relationship("AttireRecord", back_populates="branch", cascade="all, delete-orphan")
    outdoor_areas = relationship("OutdoorMarketingArea", back_populates="branch", cascade="all, delete-orphan")
    outdoor_customers = relationship("OutdoorMarketingCustomer", back_populates="branch", cascade="all, delete-orphan")
    outdoor_schemes = relationship("OutdoorMarketingScheme", back_populates="branch", cascade="all, delete-orphan")
    outdoor_activities = relationship("OutdoorMarketingActivity", back_populates="branch", cascade="all, delete-orphan")


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    branch_id = Column(Integer, ForeignKey("branches.id"), index=True, nullable=True)  # Nullable for SUPER_ADMIN
    email = Column(String(100), unique=True, index=True, nullable=True)
    username = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(100), nullable=False)
    role = Column(String(50), default="MANAGER", nullable=False)  # SUPER_ADMIN, MANAGER
    is_active = Column(Boolean, default=True, nullable=False)
    last_login = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=utcnow, nullable=False)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow, nullable=False)

    # Relationships
    branch = relationship("Branch", back_populates="users")


# Backward compatibility alias
Admin = User
