from typing import List, Optional
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_
from backend.app.core.database import get_db
from backend.app.models.branch import User
from backend.app.models.employee import Employee
from backend.app.models.activity import GoogleReview
from backend.app.schemas.activity import (
    GoogleReviewCreate,
    GoogleReviewUpdate,
    GoogleReviewResponse,
)
from backend.app.dependencies.auth import get_current_manager

router = APIRouter(prefix="/api/v1/google-reviews", tags=["Google Reviews"])


@router.get("", response_model=List[GoogleReviewResponse], summary="List Google reviews for manager's showroom")
def list_google_reviews(
    employee_id: Optional[int] = Query(None, description="Filter by employee ID"),
    rating: Optional[int] = Query(None, description="Filter by rating: 1 to 5"),
    status: Optional[str] = Query(None, description="Filter by status: Published, Pending, Verified"),
    search: Optional[str] = Query(None, description="Search by customer name, review text, or notes"),
    current_user: User = Depends(get_current_manager),
    db: Session = Depends(get_db),
):
    query = db.query(GoogleReview).filter(GoogleReview.branch_id == current_user.branch_id)

    if employee_id:
        query = query.filter(GoogleReview.employee_id == employee_id)

    if rating:
        query = query.filter(GoogleReview.rating == rating)

    if status:
        query = query.filter(GoogleReview.status == status)

    if search:
        term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                GoogleReview.customer_name.ilike(term),
                GoogleReview.review_text.ilike(term),
                GoogleReview.notes.ilike(term),
            )
        )

    records = query.order_by(GoogleReview.review_date.desc(), GoogleReview.id.desc()).all()

    result = []
    for r in records:
        emp_name = r.employee.full_name if r.employee else None
        res_item = GoogleReviewResponse(
            id=r.id,
            branch_id=r.branch_id,
            employee_id=r.employee_id,
            employee_name=emp_name,
            customers_count=getattr(r, 'customers_count', 1) or 1,
            customer_name=r.customer_name or "Google Customer",
            review_date=r.review_date,
            rating=r.rating,
            review_text=r.review_text,
            notes=r.notes,
            screenshot_url=r.screenshot_url,
            status=r.status,
            created_at=r.created_at,
        )
        result.append(res_item)

    return result


@router.post("", response_model=GoogleReviewResponse, status_code=status.HTTP_201_CREATED, summary="Record a Google Review")
def create_google_review(
    review_data: GoogleReviewCreate,
    current_user: User = Depends(get_current_manager),
    db: Session = Depends(get_db),
):
    emp_name = None
    if review_data.employee_id:
        employee = db.query(Employee).filter(
            Employee.id == review_data.employee_id,
            Employee.branch_id == current_user.branch_id,
        ).first()
        if not employee:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Associated employee not found in your showroom branch.",
            )
        emp_name = employee.full_name

    record = GoogleReview(
        branch_id=current_user.branch_id,
        employee_id=review_data.employee_id,
        customers_count=review_data.customers_count or 1,
        customer_name=(review_data.customer_name or "Google Customer").strip(),
        review_date=review_data.review_date or date.today(),
        rating=review_data.rating,
        review_text=review_data.review_text.strip(),
        notes=review_data.notes,
        screenshot_url=review_data.screenshot_url,
        status=review_data.status or "Published",
    )
    try:
        db.add(record)
        db.commit()
        db.refresh(record)
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to record Google review: {str(e)}",
        )

    return GoogleReviewResponse(
        id=record.id,
        branch_id=record.branch_id,
        employee_id=record.employee_id,
        employee_name=emp_name,
        customers_count=record.customers_count,
        customer_name=record.customer_name,
        review_date=record.review_date,
        rating=record.rating,
        review_text=record.review_text,
        notes=record.notes,
        screenshot_url=record.screenshot_url,
        status=record.status,
        created_at=record.created_at,
    )


@router.put("/{record_id}", response_model=GoogleReviewResponse, summary="Update Google review")
@router.patch("/{record_id}", response_model=GoogleReviewResponse, summary="Patch Google review")
def update_google_review(
    record_id: int,
    update_data: GoogleReviewUpdate,
    current_user: User = Depends(get_current_manager),
    db: Session = Depends(get_db),
):
    record = db.query(GoogleReview).filter(
        GoogleReview.id == record_id,
        GoogleReview.branch_id == current_user.branch_id,
    ).first()
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Google review not found.")

    if update_data.employee_id is not None:
        if update_data.employee_id > 0:
            employee = db.query(Employee).filter(
                Employee.id == update_data.employee_id,
                Employee.branch_id == current_user.branch_id,
            ).first()
            if not employee:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Employee not found in your branch.",
                )
            record.employee_id = update_data.employee_id
        else:
            record.employee_id = None

    if update_data.customers_count is not None:
        record.customers_count = update_data.customers_count
    if update_data.customer_name is not None:
        record.customer_name = update_data.customer_name.strip()
    if update_data.review_date is not None:
        record.review_date = update_data.review_date
    if update_data.rating is not None:
        record.rating = update_data.rating
    if update_data.review_text is not None:
        record.review_text = update_data.review_text.strip()
    if update_data.notes is not None:
        record.notes = update_data.notes
    if update_data.screenshot_url is not None:
        record.screenshot_url = update_data.screenshot_url
    if update_data.status is not None:
        record.status = update_data.status

    try:
        db.commit()
        db.refresh(record)
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update Google review: {str(e)}",
        )

    emp_name = record.employee.full_name if record.employee else None
    return GoogleReviewResponse(
        id=record.id,
        branch_id=record.branch_id,
        employee_id=record.employee_id,
        employee_name=emp_name,
        customers_count=getattr(record, 'customers_count', 1) or 1,
        customer_name=record.customer_name,
        review_date=record.review_date,
        rating=record.rating,
        review_text=record.review_text,
        notes=record.notes,
        screenshot_url=record.screenshot_url,
        status=record.status,
        created_at=record.created_at,
    )


@router.delete("/{record_id}", status_code=status.HTTP_200_OK, summary="Delete Google review")
def delete_google_review(
    record_id: int,
    current_user: User = Depends(get_current_manager),
    db: Session = Depends(get_db),
):
    record = db.query(GoogleReview).filter(
        GoogleReview.id == record_id,
        GoogleReview.branch_id == current_user.branch_id,
    ).first()
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Google review not found.")

    try:
        db.delete(record)
        db.commit()
        return {"message": "Google review deleted successfully."}
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete Google review: {str(e)}",
        )
