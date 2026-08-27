from datetime import datetime, date, timezone
from sqlalchemy import Column, Integer, String, Float, Date, DateTime, Text, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from backend.app.core.database import Base


def utcnow():
    return datetime.now(timezone.utc)


class DailyPerformance(Base):
    __tablename__ = "daily_performances"

    id = Column(Integer, primary_key=True, index=True)
    branch_id = Column(Integer, ForeignKey("branches.id"), index=True, nullable=False)
    employee_id = Column(Integer, ForeignKey("employees.id"), index=True, nullable=False)
    date = Column(Date, default=date.today, index=True, nullable=False)

    # Activity Metrics
    customers_approached = Column(Integer, default=0, nullable=False)
    customers_visited = Column(Integer, default=0, nullable=False)
    new_enquiries = Column(Integer, default=0, nullable=False)
    followups = Column(Integer, default=0, nullable=False)
    product_demos = Column(Integer, default=0, nullable=False)
    quotations_given = Column(Integer, default=0, nullable=False)
    customers_converted = Column(Integer, default=0, nullable=False)
    sales_count = Column(Integer, default=0, nullable=False)

    # Sales Value Breakdown (INR)
    gold_sales_value = Column(Float, default=0.0, nullable=False)
    diamond_sales_value = Column(Float, default=0.0, nullable=False)
    silver_sales_value = Column(Float, default=0.0, nullable=False)
    other_sales_value = Column(Float, default=0.0, nullable=False)
    total_sales_value = Column(Float, default=0.0, nullable=False)

    # Additional Follow-up & Retention Tracking
    completed_followups = Column(Integer, default=0, nullable=False)
    pending_followups = Column(Integer, default=0, nullable=False)
    lost_customers = Column(Integer, default=0, nullable=False)
    lost_reason = Column(String(255), nullable=True)

    notes = Column(Text, nullable=True)
    performance_score = Column(Float, default=0.0, nullable=False)  # 0 to 100

    created_at = Column(DateTime, default=utcnow, nullable=False)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow, nullable=False)

    __table_args__ = (
        UniqueConstraint("employee_id", "date", name="uq_employee_daily_performance"),
    )

    # Relationships
    branch = relationship("Branch", back_populates="daily_performances")
    employee = relationship("Employee", back_populates="daily_performances")
