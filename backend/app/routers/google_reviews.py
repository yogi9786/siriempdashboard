import os
import uuid
from typing import List, Optional
from datetime import date, datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, func

from backend.app.core.config import settings
from backend.app.core.database import get_db
from backend.app.models.branch import User
from backend.app.models.employee import Employee
from backend.app.models.activity import GoogleReview
from backend.app.schemas.activity import (
    GoogleReviewCreate,
    GoogleReviewUpdate,
    GoogleReviewResponse,
    ReviewStatusUpdate,
)
from backend.app.dependencies.auth import get_current_manager

router = APIRouter(prefix="/api/v1/google-reviews", tags=["Google Reviews"])

ALLOWED_IMAGE_MIMES = {
    "image/jpeg": ".jpg",
    "image/jpg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
}


def _build_review_response(r: GoogleReview) -> GoogleReviewResponse:
    emp_name = r.employee.full_name if r.employee else None
    return GoogleReviewResponse(
        id=r.id,
        branch_id=r.branch_id,
        employee_id=r.employee_id,
        employee_name=emp_name,
        customers_count=getattr(r, "customers_count", 1) or 1,
        customer_name=r.customer_name or "Google Customer",
        review_date=r.review_date,
        rating=r.rating,
        review_text=r.review_text,
        notes=r.notes,
        screenshot_url=r.screenshot_url,
        status=r.status,
        rejection_reason=getattr(r, "rejection_reason", None),
        reviewed_by_id=getattr(r, "reviewed_by_id", None),
        reviewed_at=getattr(r, "reviewed_at", None),
        submitted_by_role=getattr(r, "submitted_by_role", "EMPLOYEE") or "EMPLOYEE",
        points=r.points,
        created_at=r.created_at,
        updated_at=getattr(r, "updated_at", r.created_at),
    )


# ---------------------------------------------------------------------------
# Upload Screenshot Proof Endpoint
# ---------------------------------------------------------------------------
@router.post("/upload-screenshot", status_code=status.HTTP_201_CREATED, summary="Upload Google review screenshot proof")
@router.post("/upload-proof", status_code=status.HTTP_201_CREATED, summary="Upload Google review screenshot proof")
async def upload_review_screenshot(
    file: UploadFile = File(...),
):
    """Uploads review proof screenshot. Accepts JPEG, PNG, or WebP up to 10MB."""
    content_type = file.content_type.lower() if file.content_type else ""
    if content_type not in ALLOWED_IMAGE_MIMES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid image format. Please upload a JPEG, PNG, or WebP photo proof.",
        )

    os.makedirs(settings.MEDIA_DIR, exist_ok=True)
    contents = await file.read()
    file_size = len(contents)
    max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
    if file_size > max_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Image size exceeds {settings.MAX_UPLOAD_SIZE_MB} MB limit.",
        )
    if file_size == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded photo proof is empty.",
        )

    ext = ALLOWED_IMAGE_MIMES.get(content_type, ".jpg")
    filename = f"review_proof_{uuid.uuid4().hex[:16]}{ext}"
    file_path = os.path.join(settings.MEDIA_DIR, filename)
    with open(file_path, "wb") as f:
        f.write(contents)

    screenshot_url = f"/media/{filename}"
    return {
        "screenshot_url": screenshot_url,
        "photo_url": screenshot_url,
        "filename": filename,
        "file_size": file_size,
    }


# ---------------------------------------------------------------------------
# List & Filter Google Reviews
# ---------------------------------------------------------------------------
@router.get("", response_model=List[GoogleReviewResponse], summary="List Google reviews for manager's showroom")
def list_google_reviews(
    employee_id: Optional[int] = Query(None, description="Filter by employee ID"),
    rating: Optional[int] = Query(None, description="Filter by rating: 1 to 5"),
    status: Optional[str] = Query(None, description="Filter: APPROVED, PENDING, REJECTED, Published, Verified, all"),
    search: Optional[str] = Query(None, description="Search by customer name, review text, or notes"),
    current_user: User = Depends(get_current_manager),
    db: Session = Depends(get_db),
):
    query = db.query(GoogleReview).filter(GoogleReview.branch_id == current_user.branch_id)

    if employee_id:
        query = query.filter(GoogleReview.employee_id == employee_id)

    if rating:
        query = query.filter(GoogleReview.rating == rating)

    if status and status.lower() != "all":
        st_clean = status.strip()
        if st_clean.upper() in ["APPROVED", "VERIFIED", "PUBLISHED"]:
            query = query.filter(func.upper(GoogleReview.status).in_(["APPROVED", "VERIFIED", "PUBLISHED"]))
        elif st_clean.upper() == "PENDING":
            query = query.filter(func.upper(GoogleReview.status) == "PENDING")
        elif st_clean.upper() == "REJECTED":
            query = query.filter(func.upper(GoogleReview.status) == "REJECTED")
        else:
            query = query.filter(GoogleReview.status == st_clean)

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
    return [_build_review_response(r) for r in records]


# ---------------------------------------------------------------------------
# Create Google Review (Manager Direct Entry or Verification)
# ---------------------------------------------------------------------------
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

    initial_status = review_data.status or "APPROVED"
    record = GoogleReview(
        branch_id=current_user.branch_id,
        employee_id=review_data.employee_id,
        customers_count=max(1, review_data.customers_count or 1),
        customer_name=(review_data.customer_name or "Google Customer").strip(),
        review_date=review_data.review_date or date.today(),
        rating=review_data.rating,
        review_text=review_data.review_text.strip(),
        notes=review_data.notes,
        screenshot_url=review_data.screenshot_url,
        status=initial_status,
        submitted_by_role="MANAGER",
        reviewed_by_id=current_user.id if initial_status in ["APPROVED", "Verified", "Published"] else None,
        reviewed_at=datetime.now(timezone.utc) if initial_status in ["APPROVED", "Verified", "Published"] else None,
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

    return _build_review_response(record)


# ---------------------------------------------------------------------------
# Manager Approval / Verification Endpoint (Instantly credits points)
# ---------------------------------------------------------------------------
@router.patch("/{record_id}/status", response_model=GoogleReviewResponse, summary="Manager verify, approve, or reject Google review")
def update_review_verification_status(
    record_id: int,
    status_update: ReviewStatusUpdate,
    current_user: User = Depends(get_current_manager),
    db: Session = Depends(get_db),
):
    record = db.query(GoogleReview).filter(
        GoogleReview.id == record_id,
        GoogleReview.branch_id == current_user.branch_id,
    ).first()
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Google review not found.")

    target_status = status_update.status.strip().upper()
    if target_status not in ["APPROVED", "REJECTED", "PENDING"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Status must be APPROVED, REJECTED, or PENDING.",
        )

    record.status = target_status
    record.reviewed_by_id = current_user.id
    record.reviewed_at = datetime.now(timezone.utc)

    if target_status == "REJECTED":
        record.rejection_reason = status_update.rejection_reason or "Verification rejected by Showroom Manager."
    else:
        record.rejection_reason = None

    try:
        db.commit()
        db.refresh(record)
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update verification status: {str(e)}",
        )

    return _build_review_response(record)


# ---------------------------------------------------------------------------
# Update / Delete Google Review
# ---------------------------------------------------------------------------
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
        record.customers_count = max(1, update_data.customers_count)
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
        record.reviewed_by_id = current_user.id
        record.reviewed_at = datetime.now(timezone.utc)
    if update_data.rejection_reason is not None:
        record.rejection_reason = update_data.rejection_reason

    try:
        db.commit()
        db.refresh(record)
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update Google review: {str(e)}",
        )

    return _build_review_response(record)


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
