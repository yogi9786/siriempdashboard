from datetime import date, datetime
from typing import Optional, Any
from pydantic import BaseModel, Field, field_validator


# ----------------------------------------------------
# Customer Activity Schemas
# ----------------------------------------------------
class CustomerDetailItem(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    dob: Optional[date] = None
    anniversary: Optional[date] = None
    status: Optional[str] = "Walkin"  # Sold, Exchange, Lost, Walkin, In Hold / Follow Up
    product_value: Optional[float] = 0.0
    notes: Optional[str] = None

    @field_validator("dob", "anniversary", mode="before")
    @classmethod
    def parse_optional_date(cls, v: Any) -> Optional[date]:
        if v is None or v == "" or (isinstance(v, str) and not v.strip()):
            return None
        if isinstance(v, str):
            try:
                clean = v.strip().split("T")[0]
                return date.fromisoformat(clean)
            except Exception:
                return None
        return v

    @field_validator("product_value", mode="before")
    @classmethod
    def parse_product_value(cls, v: Any) -> float:
        if v is None or v == "" or (isinstance(v, str) and not str(v).strip()):
            return 0.0
        try:
            return float(str(v).replace(",", "").strip())
        except Exception:
            return 0.0


class CustomerActivityCreate(BaseModel):
    employee_id: int
    customers_count: int = Field(default=1, ge=0)
    customer_name: Optional[str] = "Customer Interaction"
    phone_number: Optional[str] = ""
    dob: Optional[date] = None
    anniversary: Optional[date] = None
    product_value: Optional[float] = 0.0
    activity_date: Optional[date] = None
    status: str = Field(default="Walkin")  # Sold, Exchange, Lost, Walkin, In Hold / Follow Up
    breakdown: Optional[str] = None
    notes: Optional[str] = None

    @field_validator("dob", "anniversary", mode="before")
    @classmethod
    def parse_optional_date(cls, v: Any) -> Optional[date]:
        if v is None or v == "" or (isinstance(v, str) and not v.strip()):
            return None
        if isinstance(v, str):
            try:
                clean = v.strip().split("T")[0]
                return date.fromisoformat(clean)
            except Exception:
                return None
        return v

    @field_validator("activity_date", mode="before")
    @classmethod
    def parse_activity_date(cls, v: Any) -> date:
        if v is None or v == "" or (isinstance(v, str) and not v.strip()):
            return date.today()
        if isinstance(v, str):
            try:
                clean = v.strip().split("T")[0]
                return date.fromisoformat(clean)
            except Exception:
                return date.today()
        return v

    @field_validator("product_value", mode="before")
    @classmethod
    def parse_product_value(cls, v: Any) -> float:
        if v is None or v == "" or (isinstance(v, str) and not str(v).strip()):
            return 0.0
        try:
            return float(str(v).replace(",", "").strip())
        except Exception:
            return 0.0

    @field_validator("employee_id", mode="before")
    @classmethod
    def parse_employee_id(cls, v: Any) -> int:
        if v is None or v == "":
            raise ValueError("Employee ID is required")
        try:
            return int(v)
        except Exception:
            raise ValueError(f"Invalid Employee ID: {v}")

    @field_validator("customers_count", mode="before")
    @classmethod
    def parse_customers_count(cls, v: Any) -> int:
        if v is None or v == "":
            return 1
        try:
            val = int(v)
            return max(0, val)
        except Exception:
            return 1

    @field_validator("customer_name", mode="before")
    @classmethod
    def parse_customer_name(cls, v: Any) -> str:
        if v is None:
            return "Customer Interaction"
        val = str(v).strip()
        return val if val else "Customer Interaction"

    @field_validator("phone_number", mode="before")
    @classmethod
    def parse_phone_number(cls, v: Any) -> str:
        if v is None:
            return ""
        return str(v).strip()

    @field_validator("status", mode="before")
    @classmethod
    def parse_status(cls, v: Any) -> str:
        if v is None or not str(v).strip():
            return "Walkin"
        return str(v).strip()


class CustomerActivityUpdate(BaseModel):
    customers_count: Optional[int] = Field(default=None, ge=0)
    customer_name: Optional[str] = None
    phone_number: Optional[str] = None
    dob: Optional[date] = None
    anniversary: Optional[date] = None
    product_value: Optional[float] = None
    activity_date: Optional[date] = None
    status: Optional[str] = None
    breakdown: Optional[str] = None
    notes: Optional[str] = None

    @field_validator("dob", "anniversary", mode="before")
    @classmethod
    def parse_optional_date(cls, v: Any) -> Optional[date]:
        if v is None or v == "" or (isinstance(v, str) and not v.strip()):
            return None
        if isinstance(v, str):
            try:
                clean = v.strip().split("T")[0]
                return date.fromisoformat(clean)
            except Exception:
                return None
        return v

    @field_validator("activity_date", mode="before")
    @classmethod
    def parse_activity_date(cls, v: Any) -> Optional[date]:
        if v is None or v == "" or (isinstance(v, str) and not v.strip()):
            return None
        if isinstance(v, str):
            try:
                clean = v.strip().split("T")[0]
                return date.fromisoformat(clean)
            except Exception:
                return None
        return v

    @field_validator("product_value", mode="before")
    @classmethod
    def parse_product_value(cls, v: Any) -> Optional[float]:
        if v is None or v == "" or (isinstance(v, str) and not str(v).strip()):
            return None
        try:
            return float(str(v).replace(",", "").strip())
        except Exception:
            return None


class CustomerActivityResponse(BaseModel):
    id: int
    branch_id: int
    branch_code: Optional[str] = None
    branch_name: Optional[str] = None
    employee_id: int
    employee_name: Optional[str] = None
    employee_code: Optional[str] = None
    customers_count: int = 1
    breakdown: Optional[str] = None
    customer_name: Optional[str] = "Customer Interaction"
    phone_number: Optional[str] = ""
    dob: Optional[date] = None
    anniversary: Optional[date] = None
    product_value: Optional[float] = 0.0
    activity_date: date
    status: str
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ----------------------------------------------------
# Scheme Record Schemas
# ----------------------------------------------------
class SchemeRecordCreate(BaseModel):
    employee_id: int
    scheme_name: str = Field(..., min_length=2, max_length=150)
    customers_count: int = Field(default=1, ge=1)
    customer_name: Optional[str] = "Customer"
    amount: float = Field(default=0.0, ge=0)
    record_date: Optional[date] = None
    notes: Optional[str] = None


class SchemeRecordUpdate(BaseModel):
    scheme_name: Optional[str] = None
    customers_count: Optional[int] = Field(default=None, ge=1)
    customer_name: Optional[str] = None
    amount: Optional[float] = Field(default=None, ge=0)
    record_date: Optional[date] = None
    notes: Optional[str] = None


class SchemeRecordResponse(BaseModel):
    id: int
    branch_id: int
    employee_id: int
    employee_name: Optional[str] = None
    customers_count: int = 1
    customer_name: Optional[str] = "Customer"
    scheme_name: str
    amount: float
    record_date: date
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ----------------------------------------------------
# Employee Form Media Schemas
# ----------------------------------------------------
class FormMediaUpdate(BaseModel):
    form_type: Optional[str] = None
    notes: Optional[str] = None


class FormMediaResponse(BaseModel):
    id: int
    branch_id: int
    employee_id: int
    employee_name: Optional[str] = None
    form_type: str
    file_path: str
    file_url: str
    mime_type: str
    file_size: int
    notes: Optional[str] = None
    upload_date: datetime
    created_at: datetime

    class Config:
        from_attributes = True


# ----------------------------------------------------
# Google Review Schemas
# ----------------------------------------------------
class GoogleReviewCreate(BaseModel):
    employee_id: Optional[int] = None
    customers_count: int = Field(default=1, ge=1)
    customer_name: Optional[str] = "Google Customer"
    review_date: Optional[date] = None
    rating: int = Field(default=5, ge=1, le=5)
    review_text: str = Field(..., min_length=1)
    notes: Optional[str] = None
    screenshot_url: Optional[str] = None
    status: str = Field(default="Published")


class GoogleReviewUpdate(BaseModel):
    employee_id: Optional[int] = None
    customers_count: Optional[int] = Field(default=None, ge=1)
    customer_name: Optional[str] = None
    review_date: Optional[date] = None
    rating: Optional[int] = Field(default=None, ge=1, le=5)
    review_text: Optional[str] = None
    notes: Optional[str] = None
    screenshot_url: Optional[str] = None
    status: Optional[str] = None


class GoogleReviewResponse(BaseModel):
    id: int
    branch_id: int
    employee_id: Optional[int] = None
    employee_name: Optional[str] = None
    customers_count: int = 1
    customer_name: Optional[str] = "Google Customer"
    review_date: date
    rating: int
    review_text: str
    notes: Optional[str] = None
    screenshot_url: Optional[str] = None
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


# ----------------------------------------------------
# Attire Record Schemas
# ----------------------------------------------------
class AttireRecordCreate(BaseModel):
    employee_id: int
    check_date: Optional[date] = None
    status: str = Field(default="Proper", pattern="^(Proper|Not Proper|Needs Attention)$")
    notes: Optional[str] = None
    image_url: Optional[str] = None


class AttireRecordUpdate(BaseModel):
    check_date: Optional[date] = None
    status: Optional[str] = Field(default=None, pattern="^(Proper|Not Proper|Needs Attention)$")
    notes: Optional[str] = None
    image_url: Optional[str] = None


class AttireRecordResponse(BaseModel):
    id: int
    branch_id: int
    employee_id: int
    employee_name: Optional[str] = None
    check_date: date
    status: str
    notes: Optional[str] = None
    image_url: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
