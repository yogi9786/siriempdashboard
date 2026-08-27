from datetime import datetime, date, timezone
from sqlalchemy import Column, Integer, String, Float, Date, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from backend.app.core.database import Base


def utcnow():
    return datetime.now(timezone.utc)


class Sale(Base):
    __tablename__ = "sales"

    id = Column(Integer, primary_key=True, index=True)
    branch_id = Column(Integer, ForeignKey("branches.id"), index=True, nullable=False)
    customer_id = Column(Integer, ForeignKey("customers.id"), index=True, nullable=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), index=True, nullable=False)
    invoice_number = Column(String(100), unique=True, index=True, nullable=False)
    purchase_date = Column(Date, default=date.today, index=True, nullable=False)

    # Weights in Grams
    total_gross_weight = Column(Float, default=0.0, nullable=False)
    total_net_weight = Column(Float, default=0.0, nullable=False)

    # Financial Breakdowns in INR
    total_making_charges = Column(Float, default=0.0, nullable=False)
    total_discount = Column(Float, default=0.0, nullable=False)
    total_gst = Column(Float, default=0.0, nullable=False)
    final_sale_value = Column(Float, default=0.0, nullable=False)

    payment_method = Column(String(50), default="UPI", nullable=False)  # Cash, Credit Card, Debit Card, UPI, Bank Transfer, Gold Exchange, Split
    notes = Column(Text, nullable=True)

    created_at = Column(DateTime, default=utcnow, nullable=False)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow, nullable=False)

    # Relationships
    branch = relationship("Branch", back_populates="sales")
    customer = relationship("Customer", back_populates="sales")
    employee = relationship("Employee", back_populates="sales")
    items = relationship("SaleItem", back_populates="sale", cascade="all, delete-orphan")


class SaleItem(Base):
    __tablename__ = "sale_items"

    id = Column(Integer, primary_key=True, index=True)
    sale_id = Column(Integer, ForeignKey("sales.id"), index=True, nullable=False)
    product_category = Column(String(100), nullable=False)  # Gold, Diamond, Silver, Bridal Jewellery, Necklace, Ring, Bangle, Earrings, Chain, Mangalsutra, Pendant, Gold Coin, Saree, Other
    metal_purity = Column(String(50), default="22K (916)", nullable=False)  # 22K (916), 18K (750), 24K (999), 92.5 Sterling, Other
    item_name = Column(String(150), nullable=False)
    gross_weight = Column(Float, default=0.0, nullable=False)  # in grams
    net_weight = Column(Float, default=0.0, nullable=False)    # in grams
    quantity = Column(Integer, default=1, nullable=False)
    unit_rate = Column(Float, default=0.0, nullable=False)     # per gram or per unit
    making_charges = Column(Float, default=0.0, nullable=False)
    discount = Column(Float, default=0.0, nullable=False)
    gst_amount = Column(Float, default=0.0, nullable=False)
    final_amount = Column(Float, default=0.0, nullable=False)
    created_at = Column(DateTime, default=utcnow, nullable=False)

    # Relationships
    sale = relationship("Sale", back_populates="items")
