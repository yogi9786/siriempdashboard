from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, Date, DateTime, Boolean, Index
from backend.app.core.database import Base


def utcnow():
    return datetime.now(timezone.utc)


class StockProduct(Base):
    """
    Catalog of company jewelry inventory loaded from stock full.xlsx.
    Tracks tag number, item description, weights, purity, making charges,
    and whether the product is Sold or Available.
    """
    __tablename__ = "stock_products"

    id = Column(Integer, primary_key=True, index=True)
    tag_no = Column(String(50), unique=True, index=True, nullable=False)
    item_id = Column(String(50), nullable=True)
    item_name = Column(String(150), index=True, nullable=False)
    sub_item = Column(String(100), nullable=True)
    item_type = Column(String(50), nullable=True)  # e.g., 916, 22KT
    pcs = Column(Integer, default=1, nullable=True)
    gross_weight = Column(Float, default=0.0, nullable=True)
    net_weight = Column(Float, default=0.0, nullable=True)
    wastage_percent = Column(Float, default=0.0, nullable=True)
    wastage = Column(Float, default=0.0, nullable=True)
    mc_per_gram = Column(Float, default=0.0, nullable=True)
    making_charges = Column(Float, default=0.0, nullable=True)
    dia_pcs = Column(Integer, nullable=True)
    dia_weight = Column(Float, nullable=True)
    dia_amount = Column(Float, nullable=True)
    stn_pcs = Column(Integer, nullable=True)
    stn_weight = Column(Float, nullable=True)
    stn_amount = Column(Float, nullable=True)
    rec_date = Column(String(50), nullable=True)
    counter = Column(String(100), nullable=True)
    size = Column(String(50), nullable=True)
    extra_weight = Column(Float, nullable=True)

    # Sold Tracking
    is_sold = Column(Boolean, default=False, index=True, nullable=False)
    sold_date = Column(Date, nullable=True)
    sold_customer_name = Column(String(150), nullable=True)
    sold_phone = Column(String(50), nullable=True)
    sold_value = Column(Float, nullable=True)
    sold_branch_code = Column(String(50), nullable=True)
    sold_employee_name = Column(String(150), nullable=True)
    sold_activity_id = Column(Integer, nullable=True)

    created_at = Column(DateTime, default=utcnow, nullable=False)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow, nullable=False)

    __table_args__ = (
        Index("idx_stock_tag_sold", "tag_no", "is_sold"),
        Index("idx_stock_name_sold", "item_name", "is_sold"),
    )
