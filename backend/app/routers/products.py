import logging
from typing import Optional, List
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc, func

from backend.app.core.database import get_db
from backend.app.models.product import StockProduct
from backend.app.models.branch import Branch
from backend.app.services.stock_service import StockService

logger = logging.getLogger("products_router")

router = APIRouter(prefix="/api/v1", tags=["Products & Stock Inventory"])


# -------------------------------------------------------------------------
# Pydantic Schemas
# -------------------------------------------------------------------------
class ProductLookupItem(BaseModel):
    id: int
    tag_no: str
    item_name: str
    item_type: Optional[str] = None
    gross_weight: Optional[float] = 0.0
    net_weight: Optional[float] = 0.0
    pcs: Optional[int] = 1
    making_charges: Optional[float] = 0.0
    counter: Optional[str] = None
    is_sold: bool = False

    class Config:
        from_attributes = True


class ProductDetailResponse(BaseModel):
    id: int
    tag_no: str
    item_id: Optional[str] = None
    item_name: str
    sub_item: Optional[str] = None
    item_type: Optional[str] = None
    pcs: Optional[int] = 1
    gross_weight: Optional[float] = 0.0
    net_weight: Optional[float] = 0.0
    wastage_percent: Optional[float] = 0.0
    wastage: Optional[float] = 0.0
    mc_per_gram: Optional[float] = 0.0
    making_charges: Optional[float] = 0.0
    counter: Optional[str] = None
    size: Optional[str] = None
    rec_date: Optional[str] = None
    is_sold: bool = False
    sold_date: Optional[str] = None
    sold_customer_name: Optional[str] = None
    sold_phone: Optional[str] = None
    sold_value: Optional[float] = None
    sold_branch_code: Optional[str] = None
    sold_employee_name: Optional[str] = None

    class Config:
        from_attributes = True


class PublicProductStatusResponse(BaseModel):
    found: bool
    tag_no: str
    product_name: Optional[str] = None
    item_type: Optional[str] = None
    gross_weight: Optional[float] = None
    net_weight: Optional[float] = None
    is_sold: bool = False
    status: str  # "SOLD", "AVAILABLE", or "NOT_FOUND"
    sold_date: Optional[str] = None
    sold_value: Optional[float] = None
    branch: Optional[str] = None


class BatchCheckRequest(BaseModel):
    tag_nos: List[str]


# -------------------------------------------------------------------------
# Internal Endpoints (Employee, Manager, HR)
# -------------------------------------------------------------------------
@router.get(
    "/products/lookup",
    response_model=List[ProductLookupItem],
    summary="Search / Lookup stock products by tag number or item name",
)
def lookup_stock_products(
    q: str = Query(..., min_length=1, description="Tag number or product name to search"),
    limit: int = Query(15, ge=1, le=50),
    db: Session = Depends(get_db),
):
    """
    Used while adding attended customer log. When an employee starts typing
    a tag number (product ID), matches are fetched with product name and details.
    """
    clean_q = q.strip()
    if not clean_q:
        return []

    results = StockService.search_products(db, clean_q, limit=limit)
    return results


@router.get(
    "/products/{tag_no}",
    response_model=ProductDetailResponse,
    summary="Get detailed product specs by tag number",
)
def get_product_by_tag(
    tag_no: str,
    db: Session = Depends(get_db),
):
    prod = StockService.lookup_product(db, tag_no)
    if not prod:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with Tag No '{tag_no}' not found in stock inventory.",
        )
    return prod


@router.get(
    "/products/sold/catalog",
    summary="Get all sold products with complete stock details for Revenue section",
)
def get_sold_products_catalog(
    branch_code: Optional[str] = Query(None, description="Filter by showroom branch"),
    date_filter: Optional[str] = Query("all"),
    from_date: Optional[date] = Query(None),
    to_date: Optional[date] = Query(None),
    search: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    """
    Populates the dedicated 'Sold Products Inventory' section in Manager and HR revenue dashboards.
    Displays all sold items with full technical specifications from stock full.xlsx.
    """
    query = db.query(StockProduct).filter(StockProduct.is_sold == True)

    if branch_code and branch_code.upper() != "ALL":
        query = query.filter(StockProduct.sold_branch_code.ilike(branch_code.strip()))

    today_dt = date.today()
    if date_filter == "today":
        query = query.filter(StockProduct.sold_date == today_dt)
    elif date_filter == "yesterday":
        from datetime import timedelta
        query = query.filter(StockProduct.sold_date == today_dt - timedelta(days=1))
    elif date_filter == "this_week":
        from datetime import timedelta
        query = query.filter(StockProduct.sold_date >= today_dt - timedelta(days=7))
    elif date_filter == "this_month":
        query = query.filter(StockProduct.sold_date >= today_dt.replace(day=1))
    elif date_filter == "last_month":
        from datetime import timedelta
        first_this = today_dt.replace(day=1)
        last_prev = first_this - timedelta(days=1)
        first_prev = last_prev.replace(day=1)
        query = query.filter(
            StockProduct.sold_date >= first_prev,
            StockProduct.sold_date <= last_prev,
        )

    if from_date:
        query = query.filter(StockProduct.sold_date >= from_date)
    if to_date:
        query = query.filter(StockProduct.sold_date <= to_date)

    if search and search.strip():
        q_term = search.strip()
        query = query.filter(
            or_(
                StockProduct.tag_no.ilike(f"%{q_term}%"),
                StockProduct.item_name.ilike(f"%{q_term}%"),
                StockProduct.sold_customer_name.ilike(f"%{q_term}%"),
                StockProduct.sold_phone.ilike(f"%{q_term}%"),
                StockProduct.sold_employee_name.ilike(f"%{q_term}%"),
            )
        )

    total_count = query.count()
    aggregates = query.with_entities(
        func.coalesce(func.sum(StockProduct.sold_value), 0.0).label("total_val"),
        func.coalesce(func.sum(StockProduct.net_weight), 0.0).label("total_net_wt"),
    ).first()
    total_sold_value = float(aggregates.total_val) if aggregates else 0.0
    total_net_weight = float(aggregates.total_net_wt) if aggregates else 0.0

    records = (
        query.order_by(desc(StockProduct.sold_date), desc(StockProduct.id))
        .offset((page - 1) * limit)
        .limit(limit)
        .all()
    )

    items = []
    for p in records:
        items.append({
            "id": p.id,
            "tag_no": p.tag_no,
            "item_name": p.item_name,
            "sub_item": p.sub_item or "",
            "item_type": p.item_type or "916",
            "pcs": p.pcs or 1,
            "gross_weight": p.gross_weight or 0.0,
            "net_weight": p.net_weight or 0.0,
            "mc_per_gram": p.mc_per_gram or 0.0,
            "making_charges": p.making_charges or 0.0,
            "counter": p.counter or "",
            "size": p.size or "",
            "sold_date": p.sold_date.isoformat() if p.sold_date else "",
            "sold_customer_name": p.sold_customer_name or "Customer",
            "sold_phone": p.sold_phone or "",
            "sold_value": p.sold_value or 0.0,
            "sold_branch_code": p.sold_branch_code or "YELAHANKA",
            "sold_employee_name": p.sold_employee_name or "Staff",
            "sold_activity_id": p.sold_activity_id,
        })

    return {
        "total_count": total_count,
        "total_sold_value": total_sold_value,
        "total_net_weight": round(total_net_weight, 3),
        "page": page,
        "limit": limit,
        "items": items,
    }


@router.post(
    "/products/sync-stock",
    summary="Manually trigger reload/sync of stock full.xlsx inventory",
)
def sync_stock_catalog(
    force: bool = Query(False, description="Set to true to force reload from stock full.xlsx"),
    db: Session = Depends(get_db),
):
    count = StockService.load_stock_excel_if_needed(db, force=force)
    return {
        "status": "success",
        "total_products": count,
        "message": f"Stock inventory synchronized successfully with {count} items.",
    }


# -------------------------------------------------------------------------
# Public Integration Endpoints for sirisamruddhigold.com
# -------------------------------------------------------------------------
@router.get(
    "/public/products/{tag_no}/status",
    response_model=PublicProductStatusResponse,
    summary="Public endpoint for sirisamruddhigold.com: Check if product is sold or available",
)
def check_single_product_status(
    tag_no: str,
    db: Session = Depends(get_db),
):
    """
    Public API consumed by sirisamruddhigold.com to verify purchase/stock status
    of a jewelry item by its Tag Number.
    """
    p = StockService.lookup_product(db, tag_no)
    if not p:
        return PublicProductStatusResponse(
            found=False,
            tag_no=tag_no.strip(),
            status="NOT_FOUND",
            is_sold=False,
        )

    return PublicProductStatusResponse(
        found=True,
        tag_no=p["tag_no"],
        product_name=p["item_name"],
        item_type=p["item_type"],
        gross_weight=p["gross_weight"],
        net_weight=p["net_weight"],
        is_sold=p["is_sold"],
        status="SOLD" if p["is_sold"] else "AVAILABLE",
        sold_date=p["sold_date"],
        sold_value=p["sold_value"],
        branch=p["sold_branch_code"],
    )


@router.get(
    "/public/products/status",
    summary="Public endpoint for sirisamruddhigold.com: Query product status with query param",
)
def check_product_status_query(
    tag_no: str = Query(..., description="Tag number / Product ID to query"),
    db: Session = Depends(get_db),
):
    return check_single_product_status(tag_no=tag_no, db=db)


@router.post(
    "/public/products/check-availability",
    summary="Public endpoint for sirisamruddhigold.com: Batch check availability for multiple tag numbers",
)
def batch_check_availability(
    req: BatchCheckRequest,
    db: Session = Depends(get_db),
):
    """
    Allows sirisamruddhigold.com to pass an array of tag numbers and receive
    their purchase/sold availability in a single efficient call.
    """
    tags = [t.strip() for t in req.tag_nos if t.strip()]
    if not tags:
        return {"results": []}

    records = db.query(StockProduct).filter(StockProduct.tag_no.in_(tags)).all()
    rec_map = {p.tag_no: p for p in records}

    results = []
    for t in tags:
        p = rec_map.get(t)
        if p:
            results.append({
                "found": True,
                "tag_no": p.tag_no,
                "product_name": p.item_name,
                "item_type": p.item_type,
                "gross_weight": p.gross_weight,
                "net_weight": p.net_weight,
                "is_sold": p.is_sold,
                "status": "SOLD" if p.is_sold else "AVAILABLE",
                "sold_date": p.sold_date.isoformat() if p.sold_date else None,
                "branch": p.sold_branch_code,
            })
        else:
            results.append({
                "found": False,
                "tag_no": t,
                "status": "NOT_FOUND",
                "is_sold": False,
            })

    return {"results": results}


@router.get(
    "/public/products/sold-list",
    summary="Public endpoint for sirisamruddhigold.com: Fetch all sold tag numbers and inventory",
)
def list_all_sold_products_public(
    limit: int = Query(500, ge=1, le=5000),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    """
    Enables sirisamruddhigold.com to synchronize out-of-stock items.
    """
    query = db.query(StockProduct).filter(StockProduct.is_sold == True)
    total_sold = query.count()
    records = query.order_by(desc(StockProduct.sold_date)).offset(offset).limit(limit).all()

    items = [
        {
            "tag_no": p.tag_no,
            "product_name": p.item_name,
            "item_type": p.item_type,
            "gross_weight": p.gross_weight,
            "net_weight": p.net_weight,
            "sold_date": p.sold_date.isoformat() if p.sold_date else None,
            "branch": p.sold_branch_code,
        }
        for p in records
    ]

    return {
        "total_sold": total_sold,
        "offset": offset,
        "limit": limit,
        "items": items,
    }
