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
from backend.app.models.activity import VideoReview
from backend.app.schemas.activity import (
    VideoReviewCreate,
    VideoReviewUpdate,
    VideoReviewResponse,
    ReviewStatusUpdate,
)
from backend.app.dependencies.auth import get_current_manager

router = APIRouter(prefix="/api/v1/video-reviews", tags=["Video Reviews"])

ALLOWED_IMAGE_MIMES = {
    "image/jpeg": ".jpg",
    "image/jpg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
}


def _build_video_review_response(r: VideoReview) -> VideoReviewResponse:
    emp_name = r.employee.full_name if r.employee else None
    return VideoReviewResponse(
        id=r.id,
        branch_id=r.branch_id,
        employee_id=r.employee_id,
        employee_name=emp_name,
        customer_name=r.customer_name or "Video Customer",
        videos_count=getattr(r, "videos_count", 1) or 1,
        video_title=r.video_title,
        video_url=r.video_url,
        review_date=r.review_date,
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
# Upload Video Proof Screenshot
# ---------------------------------------------------------------------------
@router.post("/upload-screenshot", status_code=status.HTTP_201_CREATED, summary="Upload Video review screenshot proof")
@router.post("/upload-proof", status_code=status.HTTP_201_CREATED, summary="Upload Video review screenshot proof")
async def upload_video_screenshot(
    file: UploadFile = File(...),
):
    """Uploads video proof image/screenshot. Accepts JPEG, PNG, or WebP up to 10MB."""
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
    filename = f"video_proof_{uuid.uuid4().hex[:16]}{ext}"
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
# List Video Reviews
# ---------------------------------------------------------------------------
@router.get("", response_model=List[VideoReviewResponse], summary="List Video reviews for manager's showroom")
def list_video_reviews(
    employee_id: Optional[int] = Query(None, description="Filter by employee ID"),
    status: Optional[str] = Query(None, description="Filter: APPROVED, PENDING, REJECTED, all"),
    search: Optional[str] = Query(None, description="Search by customer name, video title, or notes"),
    current_user: User = Depends(get_current_manager),
    db: Session = Depends(get_db),
):
    query = db.query(VideoReview).filter(VideoReview.branch_id == current_user.branch_id)

    if employee_id:
        query = query.filter(VideoReview.employee_id == employee_id)

    if status and status.lower() != "all":
        st_clean = status.strip()
        if st_clean.upper() in ["APPROVED", "VERIFIED", "PUBLISHED"]:
            query = query.filter(func.upper(VideoReview.status).in_(["APPROVED", "VERIFIED", "PUBLISHED"]))
        elif st_clean.upper() == "PENDING":
            query = query.filter(func.upper(VideoReview.status) == "PENDING")
        elif st_clean.upper() == "REJECTED":
            query = query.filter(func.upper(VideoReview.status) == "REJECTED")
        else:
            query = query.filter(VideoReview.status == st_clean)

    if search:
        term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                VideoReview.customer_name.ilike(term),
                VideoReview.video_title.ilike(term),
                VideoReview.notes.ilike(term),
            )
        )

    records = query.order_by(VideoReview.review_date.desc(), VideoReview.id.desc()).all()
    return [_build_video_review_response(r) for r in records]


# ---------------------------------------------------------------------------
# Create Video Review (Manager Direct Entry or Verification)
# ---------------------------------------------------------------------------
@router.post("", response_model=VideoReviewResponse, status_code=status.HTTP_201_CREATED, summary="Record a Video Review")
def create_video_review(
    review_data: VideoReviewCreate,
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
    record = VideoReview(
        branch_id=current_user.branch_id,
        employee_id=review_data.employee_id,
        customer_name=(review_data.customer_name or "Video Customer").strip(),
        videos_count=max(1, review_data.videos_count or 1),  # 1 video = 1 point, 2 videos = 2 points
        video_title=(review_data.video_title or "Customer Review Video").strip(),
        video_url=review_data.video_url,
        review_date=review_data.review_date or date.today(),
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
            detail=f"Failed to record video review: {str(e)}",
        )

    return _build_video_review_response(record)


# ---------------------------------------------------------------------------
# Manager Approval / Verification Endpoint for Video Review
# ---------------------------------------------------------------------------
@router.patch("/{record_id}/status", response_model=VideoReviewResponse, summary="Manager verify, approve, or reject Video review")
def update_video_review_verification_status(
    record_id: int,
    status_update: ReviewStatusUpdate,
    current_user: User = Depends(get_current_manager),
    db: Session = Depends(get_db),
):
    record = db.query(VideoReview).filter(
        VideoReview.id == record_id,
        VideoReview.branch_id == current_user.branch_id,
    ).first()
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Video review not found.")

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
        record.rejection_reason = status_update.rejection_reason or "Video review rejected by Showroom Manager."
    else:
        record.rejection_reason = None

    try:
        db.commit()
        db.refresh(record)
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update video review verification status: {str(e)}",
        )

    return _build_video_review_response(record)


# ---------------------------------------------------------------------------
# Update / Delete Video Review
# ---------------------------------------------------------------------------
@router.put("/{record_id}", response_model=VideoReviewResponse, summary="Update Video review")
@router.patch("/{record_id}", response_model=VideoReviewResponse, summary="Patch Video review")
def update_video_review(
    record_id: int,
    update_data: VideoReviewUpdate,
    current_user: User = Depends(get_current_manager),
    db: Session = Depends(get_db),
):
    record = db.query(VideoReview).filter(
        VideoReview.id == record_id,
        VideoReview.branch_id == current_user.branch_id,
    ).first()
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Video review not found.")

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

    if update_data.videos_count is not None:
        record.videos_count = max(1, update_data.videos_count)
    if update_data.customer_name is not None:
        record.customer_name = update_data.customer_name.strip()
    if update_data.video_title is not None:
        record.video_title = update_data.video_title.strip()
    if update_data.video_url is not None:
        record.video_url = update_data.video_url
    if update_data.review_date is not None:
        record.review_date = update_data.review_date
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
            detail=f"Failed to update video review: {str(e)}",
        )

    return _build_video_review_response(record)


@router.delete("/{record_id}", status_code=status.HTTP_200_OK, summary="Delete Video review")
def delete_video_review(
    record_id: int,
    current_user: User = Depends(get_current_manager),
    db: Session = Depends(get_db),
):
    record = db.query(VideoReview).filter(
        VideoReview.id == record_id,
        VideoReview.branch_id == current_user.branch_id,
    ).first()
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Video review not found.")

    try:
        db.delete(record)
        db.commit()
        return {"message": "Video review deleted successfully."}
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete video review: {str(e)}",
        )

