from datetime import date as dt_date, datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict


class SaleItemBase(BaseModel):
    product_category: str = Field(..., description="Gold, Diamond, Silver, Bridal Jewellery, Necklace, etc.")
    metal_purity: str = Field(default="22K (916)")
    item_name: str = Field(..., min_length=2)
    gross_weight: float = Field(default=0.0, ge=0)
    net_weight: float = Field(default=0.0, ge=0)
    quantity: int = Field(default=1, ge=1)
    unit_rate: float = Field(default=0.0, ge=0)
    making_charges: float = Field(default=0.0, ge=0)
    discount: float = Field(default=0.0, ge=0)
    gst_amount: float = Field(default=0.0, ge=0)
    final_amount: float = Field(..., ge=0)


class SaleItemCreate(SaleItemBase):
    pass


class SaleItemResponse(SaleItemBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    sale_id: int
    created_at: datetime


class SaleCreate(BaseModel):
    customer_id: Optional[int] = None
    employee_id: int = Field(..., description="Employee who approached & closed the sale")
    invoice_number: str = Field(..., min_length=3, description="Unique store invoice number")
    purchase_date: dt_date = Field(default_factory=dt_date.today)
    payment_method: str = Field(default="UPI")
    notes: Optional[str] = None
    items: List[SaleItemCreate] = Field(..., min_length=1, description="List of purchased jewellery items")


class SaleResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    branch_id: int
    customer_id: Optional[int] = None
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    employee_id: int
    employee_name: str
    employee_code: str
    invoice_number: str
    purchase_date: dt_date
    total_gross_weight: float
    total_net_weight: float
    total_making_charges: float
    total_discount: float
    total_gst: float
    final_sale_value: float
    payment_method: str
    notes: Optional[str] = None
    item_count: int = 0
    created_at: datetime


class SaleDetailResponse(SaleResponse):
    items: List[SaleItemResponse] = []


class SalesListResponse(BaseModel):
    items: List[SaleResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
    total_sales_value: float = 0.0


class CategorySalesBreakdown(BaseModel):
    category: str
    sales_count: int
    total_value: float
    percentage: float


class SalesAnalyticsResponse(BaseModel):
    total_sales_value: float
    total_transactions: int
    average_transaction_value: float
    highest_sale_value: float
    gold_sales_value: float
    diamond_sales_value: float
    silver_sales_value: float
    bridal_sales_value: float
    other_sales_value: float
    category_breakdown: List[CategorySalesBreakdown]
    daily_trend: List[dict]
    employee_contributions: List[dict]
    payment_methods_breakdown: List[dict]
