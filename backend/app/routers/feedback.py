from typing import List, Optional
from datetime import date, datetime
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, func

from backend.app.core.database import get_db
from backend.app.models.branch import User, Branch
from backend.app.models.employee import Employee
from backend.app.models.feedback import CustomerFeedback
from backend.app.schemas.feedback import (
    FeedbackCreate,
    FeedbackUpdate,
    FeedbackResponse,
    AdminFeedbackOverviewResponse,
)
from backend.app.dependencies.auth import get_current_manager, get_current_super_admin, SuperAdminIdentity

router = APIRouter(prefix="/api/v1/feedback", tags=["Customer Feedback"])


@router.get("", response_model=List[FeedbackResponse], summary="List customer review & feedback logs for current showroom")
def list_manager_feedbacks(
    employee_id: Optional[int] = Query(None),
    rating: Optional[int] = Query(None),
    category: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    from_date: Optional[date] = Query(None),
    to_date: Optional[date] = Query(None),
    current_user: User = Depends(get_current_manager),
    db: Session = Depends(get_db),
):
    branch = db.query(Branch).filter(Branch.id == current_user.branch_id).first()
    q = db.query(CustomerFeedback).filter(CustomerFeedback.branch_id == current_user.branch_id)

    if employee_id:
        q = q.filter(CustomerFeedback.employee_id == employee_id)
    if rating:
        q = q.filter(CustomerFeedback.rating == rating)
    if category and category != "all":
        q = q.filter(CustomerFeedback.category == category)
    if from_date:
        q = q.filter(CustomerFeedback.feedback_date >= from_date)
    if to_date:
        q = q.filter(CustomerFeedback.feedback_date <= to_date)
    if search:
        s = f"%{search.strip().lower()}%"
        q = q.filter(
            or_(
                func.lower(CustomerFeedback.customer_name).like(s),
                func.lower(CustomerFeedback.customer_phone).like(s),
                func.lower(CustomerFeedback.feedback_text).like(s),
                func.lower(CustomerFeedback.notes).like(s),
            )
        )

    records = q.order_by(CustomerFeedback.feedback_date.desc(), CustomerFeedback.id.desc()).all()

    results: List[FeedbackResponse] = []
    for r in records:
        emp = db.query(Employee).filter(Employee.id == r.employee_id).first()
        results.append(
            FeedbackResponse(
                id=r.id,
                branch_id=r.branch_id,
                branch_name=branch.name if branch else "Showroom",
                branch_code=branch.code if branch else "BRANCH",
                employee_id=r.employee_id,
                employee_name=emp.full_name if emp else "Staff",
                employee_code=emp.employee_code if emp else "",
                customer_name=r.customer_name,
                customer_phone=r.customer_phone or "",
                feedback_date=r.feedback_date,
                rating=r.rating,
                category=r.category,
                feedback_text=r.feedback_text,
                notes=r.notes,
                status=r.status,
                created_at=r.created_at,
                updated_at=r.updated_at,
            )
        )

    return results


@router.post("", response_model=FeedbackResponse, status_code=status.HTTP_201_CREATED, summary="Manager record customer feedback for an employee")
def create_customer_feedback(
    payload: FeedbackCreate,
    current_user: User = Depends(get_current_manager),
    db: Session = Depends(get_db),
):
    emp = db.query(Employee).filter(
        Employee.id == payload.employee_id,
        Employee.branch_id == current_user.branch_id,
    ).first()
    if not emp:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found in your showroom.")

    branch = db.query(Branch).filter(Branch.id == current_user.branch_id).first()

    rec = CustomerFeedback(
        branch_id=current_user.branch_id,
        employee_id=emp.id,
        customer_name=payload.customer_name.strip(),
        customer_phone=(payload.customer_phone or "").strip(),
        feedback_date=payload.feedback_date or date.today(),
        rating=max(1, min(5, payload.rating)),
        category=payload.category,
        feedback_text=payload.feedback_text.strip(),
        notes=(payload.notes or "").strip() if payload.notes else None,
        status=payload.status or "Verified",
    )
    db.add(rec)
    db.commit()
    db.refresh(rec)

    return FeedbackResponse(
        id=rec.id,
        branch_id=rec.branch_id,
        branch_name=branch.name if branch else "Showroom",
        branch_code=branch.code if branch else "BRANCH",
        employee_id=emp.id,
        employee_name=emp.full_name,
        employee_code=emp.employee_code,
        customer_name=rec.customer_name,
        customer_phone=rec.customer_phone,
        feedback_date=rec.feedback_date,
        rating=rec.rating,
        category=rec.category,
        feedback_text=rec.feedback_text,
        notes=rec.notes,
        status=rec.status,
        created_at=rec.created_at,
        updated_at=rec.updated_at,
    )


@router.put("/{feedback_id}", response_model=FeedbackResponse, summary="Update customer feedback")
def update_customer_feedback(
    feedback_id: int,
    payload: FeedbackUpdate,
    current_user: User = Depends(get_current_manager),
    db: Session = Depends(get_db),
):
    rec = db.query(CustomerFeedback).filter(
        CustomerFeedback.id == feedback_id,
        CustomerFeedback.branch_id == current_user.branch_id,
    ).first()
    if not rec:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Feedback record not found.")

    if payload.customer_name is not None:
        rec.customer_name = payload.customer_name.strip()
    if payload.customer_phone is not None:
        rec.customer_phone = payload.customer_phone.strip()
    if payload.feedback_date is not None:
        rec.feedback_date = payload.feedback_date
    if payload.rating is not None:
        rec.rating = max(1, min(5, payload.rating))
    if payload.category is not None:
        rec.category = payload.category
    if payload.feedback_text is not None:
        rec.feedback_text = payload.feedback_text.strip()
    if payload.notes is not None:
        rec.notes = payload.notes.strip() if payload.notes else None
    if payload.status is not None:
        rec.status = payload.status

    db.commit()
    db.refresh(rec)

    branch = db.query(Branch).filter(Branch.id == rec.branch_id).first()
    emp = db.query(Employee).filter(Employee.id == rec.employee_id).first()

    return FeedbackResponse(
        id=rec.id,
        branch_id=rec.branch_id,
        branch_name=branch.name if branch else "Showroom",
        branch_code=branch.code if branch else "BRANCH",
        employee_id=emp.id if emp else 0,
        employee_name=emp.full_name if emp else "Staff",
        employee_code=emp.employee_code if emp else "",
        customer_name=rec.customer_name,
        customer_phone=rec.customer_phone,
        feedback_date=rec.feedback_date,
        rating=rec.rating,
        category=rec.category,
        feedback_text=rec.feedback_text,
        notes=rec.notes,
        status=rec.status,
        created_at=rec.created_at,
        updated_at=rec.updated_at,
    )


@router.delete("/{feedback_id}", status_code=status.HTTP_200_OK, summary="Delete customer feedback")
def delete_customer_feedback(
    feedback_id: int,
    current_user: User = Depends(get_current_manager),
    db: Session = Depends(get_db),
):
    rec = db.query(CustomerFeedback).filter(
        CustomerFeedback.id == feedback_id,
        CustomerFeedback.branch_id == current_user.branch_id,
    ).first()
    if not rec:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Feedback record not found.")

    db.delete(rec)
    db.commit()
    return {"message": "Customer feedback deleted successfully."}


# =========================================================================
# Admin Multi-Branch Feedback APIs
# =========================================================================
@router.get("/admin/all", response_model=AdminFeedbackOverviewResponse, summary="Admin multi-branch customer review & feedback overview")
def get_admin_feedback_overview(
    branch_id: Optional[int] = Query(None),
    employee_id: Optional[int] = Query(None),
    rating: Optional[int] = Query(None),
    search: Optional[str] = Query(None),
    current_admin: SuperAdminIdentity = Depends(get_current_super_admin),
    db: Session = Depends(get_db),
):
    q = db.query(CustomerFeedback)
    if branch_id:
        q = q.filter(CustomerFeedback.branch_id == branch_id)
    if employee_id:
        q = q.filter(CustomerFeedback.employee_id == employee_id)
    if rating:
        q = q.filter(CustomerFeedback.rating == rating)
    if search:
        s = f"%{search.strip().lower()}%"
        q = q.filter(
            or_(
                func.lower(CustomerFeedback.customer_name).like(s),
                func.lower(CustomerFeedback.customer_phone).like(s),
                func.lower(CustomerFeedback.feedback_text).like(s),
                func.lower(CustomerFeedback.notes).like(s),
            )
        )

    records = q.order_by(CustomerFeedback.feedback_date.desc(), CustomerFeedback.id.desc()).all()

    branches_map = {b.id: b for b in db.query(Branch).all()}
    employees_map = {e.id: e for e in db.query(Employee).all()}

    res_list: List[FeedbackResponse] = []
    total_rating = 0

    for r in records:
        b = branches_map.get(r.branch_id)
        emp = employees_map.get(r.employee_id)
        total_rating += r.rating

        res_list.append(
            FeedbackResponse(
                id=r.id,
                branch_id=r.branch_id,
                branch_name=b.name if b else "Showroom",
                branch_code=b.code if b else "BRANCH",
                employee_id=r.employee_id,
                employee_name=emp.full_name if emp else "Staff",
                employee_code=emp.employee_code if emp else "",
                customer_name=r.customer_name,
                customer_phone=r.customer_phone or "",
                feedback_date=r.feedback_date,
                rating=r.rating,
                category=r.category,
                feedback_text=r.feedback_text,
                notes=r.notes,
                status=r.status,
                created_at=r.created_at,
                updated_at=r.updated_at,
            )
        )

    avg_rating = round(total_rating / len(records), 1) if records else 5.0

    return AdminFeedbackOverviewResponse(
        total_feedbacks=len(records),
        average_rating=avg_rating,
        records=res_list,
    )
