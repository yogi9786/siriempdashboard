from datetime import date
from typing import Optional
from fastapi import APIRouter, Depends, Query, Request, status
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.models.branch import Admin
from backend.app.schemas.sale import (
    SaleCreate,
    SaleResponse,
    SaleDetailResponse,
    SalesListResponse,
    SalesAnalyticsResponse,
)
from backend.app.services.sale_service import SaleService
from backend.app.services.dashboard_service import parse_date_period
from backend.app.dependencies.auth import get_current_admin

router = APIRouter(prefix="/api/v1/sales", tags=["Sales"])


@router.get("", response_model=SalesListResponse, summary="List sales transactions with item count and customer attribution")
def list_sales(
    search: Optional[str] = Query(None, description="Search by invoice number, customer name/phone, employee name/code"),
    employee_id: Optional[int] = Query(None, description="Filter by employee"),
    customer_id: Optional[int] = Query(None, description="Filter by customer"),
    start_date: Optional[date] = Query(None, description="Filter by start date"),
    end_date: Optional[date] = Query(None, description="Filter by end date"),
    payment_method: Optional[str] = Query(None, description="Filter by payment method"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    sale_service = SaleService(db)
    return sale_service.list_sales(
        branch_id=current_admin.branch_id,
        search=search,
        employee_id=employee_id,
        customer_id=customer_id,
        start_date=start_date,
        end_date=end_date,
        payment_method=payment_method,
        page=page,
        page_size=page_size,
    )


@router.post("", response_model=SaleDetailResponse, status_code=status.HTTP_201_CREATED, summary="Record a jewellery sale with items and employee attribution")
def record_sale(
    sale_data: SaleCreate,
    request: Request,
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    sale_service = SaleService(db)
    client_ip = request.client.host if request.client else None
    return sale_service.create_sale(
        sale_data=sale_data,
        branch_id=current_admin.branch_id,
        admin=current_admin,
        ip_address=client_ip,
    )


@router.get("/analytics/overview", response_model=SalesAnalyticsResponse, summary="Get deep sales analytics and category breakdown")
def get_sales_analytics(
    period: str = Query("this_month", description="today, yesterday, this_week, this_month, last_month, custom"),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    start, end = parse_date_period(period, start_date, end_date)
    sale_service = SaleService(db)
    return sale_service.get_analytics(current_admin.branch_id, start, end)


@router.get("/{sale_id}", response_model=SaleDetailResponse, summary="Get detailed sale invoice and line items")
def get_sale_detail(
    sale_id: int,
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    sale_service = SaleService(db)
    return sale_service.get_sale_detail(sale_id, current_admin.branch_id)
