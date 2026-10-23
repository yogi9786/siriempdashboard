from datetime import datetime, date, timezone
from sqlalchemy import Column, Integer, String, Date, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from backend.app.core.database import Base


def utcnow():
    return datetime.now(timezone.utc)


class CustomerFeedback(Base):
    """Tracks direct customer review and feedback for showroom employees."""
    __tablename__ = "customer_feedbacks"

    id = Column(Integer, primary_key=True, index=True)
    branch_id = Column(Integer, ForeignKey("branches.id"), index=True, nullable=False)
    employee_id = Column(Integer, ForeignKey("employees.id"), index=True, nullable=False)
    customer_name = Column(String(150), nullable=False)
    customer_phone = Column(String(50), nullable=True, default="")
    feedback_date = Column(Date, default=date.today, index=True, nullable=False)
    rating = Column(Integer, default=5, nullable=False)  # 1 to 5 stars
    category = Column(String(100), default="Customer Service", nullable=False)  # Customer Service, Hospitality, Scheme Guidance, Product Selection, Overall Experience
    feedback_text = Column(Text, nullable=False)
    notes = Column(Text, nullable=True)
    status = Column(String(50), default="Verified", nullable=False)  # Verified, Follow-up Required, Resolved
    created_at = Column(DateTime, default=utcnow, nullable=False)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow, nullable=False)

    # Relationships
    branch = relationship("Branch")
    employee = relationship("Employee")
