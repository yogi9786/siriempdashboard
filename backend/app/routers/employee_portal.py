import os
import uuid
from typing import List, Optional
from datetime import date, datetime, timezone
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, func

from backend.app.core.config import settings
from backend.app.core.database import get_db
from backend.app.models.branch import Branch
from backend.app.models.employee import Employee
from backend.app.models.activity import CustomerActivity, EmployeeCallLog, GoogleReview, VideoReview, SchemeRecord
from backend.app.models.feedback import CustomerFeedback
from backend.app.schemas.activity import (
    CustomerActivityCreate,
    CustomerActivityResponse,
    GoogleReviewCreate,
    GoogleReviewResponse,
    VideoReviewCreate,
    VideoReviewResponse,
    EmployeePointsSummary,
)
from backend.app.schemas.employee import (
    EmployeeCallLogCreate,
    EmployeeCallLogResponse,
)
from backend.app.dependencies.auth import get_current_employee
from backend.app.routers.customers import _sync_activity_subrecords, SendWhatsAppRequest
from backend.app.services.aisensy_service import AiSensyService

router = APIRouter(prefix="/api/v1/employee", tags=["Employee Portal"])

ALLOWED_IMAGE_MIMES = {
    "image/jpeg": ".jpg",
    "image/jpg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
}


class EmployeeDashboardSummary(BaseModel):
    employee_id: int
    employee_code: str
    employee_name: str
    designation: str
    department: str
    branch_id: int
    branch_name: str
    branch_code: str
    total_customer_activities: int
    pending_customer_activities: int
    approved_customer_activities: int
    rejected_customer_activities: int
    total_calls: int
    completed_calls: int
    pending_calls: int
    total_points: int = 0
    google_review_points: int = 0
    video_review_points: int = 0
    approved_google_reviews: int = 0
    approved_video_reviews: int = 0
    pending_reviews_count: int = 0
    pending_google_reviews: int = 0
    pending_video_reviews: int = 0


def _build_emp_activity_response(record: CustomerActivity, emp: Employee) -> CustomerActivityResponse:
    b_name = emp.branch.name if emp.branch else None
    b_code = emp.branch.code if emp.branch else None
    return CustomerActivityResponse(
        id=record.id,
        branch_id=record.branch_id,
        branch_code=b_code,
        branch_name=b_name,
        employee_id=record.employee_id,
        employee_name=emp.full_name,
        employee_code=emp.employee_code,
        customers_count=getattr(record, "customers_count", 1) or 1,
        breakdown=getattr(record, "breakdown", None),
        customer_name=record.customer_name or "Customer Interaction",
        phone_number=record.phone_number or "",
        dob=getattr(record, "dob", None),
        anniversary=getattr(record, "anniversary", None),
        product_value=getattr(record, "product_value", 0.0) or 0.0,
        activity_date=record.activity_date,
        status=record.status,
        approval_status=getattr(record, "approval_status", "PENDING") or "PENDING",
        created_by_role=getattr(record, "created_by_role", "EMPLOYEE") or "EMPLOYEE",
        created_by_id=getattr(record, "created_by_id", emp.id),
        rejection_reason=getattr(record, "rejection_reason", None),
        reviewed_by_id=getattr(record, "reviewed_by_id", None),
        reviewed_at=getattr(record, "reviewed_at", None),
        notes=record.notes,
        created_at=record.created_at,
        updated_at=record.updated_at,
    )


@router.get("/dashboard", response_model=EmployeeDashboardSummary, summary="Get summary statistics for the logged in employee")
def get_employee_dashboard(
    current_emp: Employee = Depends(get_current_employee),
    db: Session = Depends(get_db),
):
    branch = db.query(Branch).filter(Branch.id == current_emp.branch_id).first()
    b_name = branch.name if branch else "Showroom"
    b_code = branch.code if branch else "SHOWROOM"

    # Customer Activities counts
    total_act = db.query(CustomerActivity).filter(CustomerActivity.employee_id == current_emp.id).count()
    pending_act = db.query(CustomerActivity).filter(
        CustomerActivity.employee_id == current_emp.id,
        CustomerActivity.approval_status == "PENDING",
    ).count()
    approved_act = db.query(CustomerActivity).filter(
        CustomerActivity.employee_id == current_emp.id,
        CustomerActivity.approval_status == "APPROVED",
    ).count()
    rejected_act = db.query(CustomerActivity).filter(
        CustomerActivity.employee_id == current_emp.id,
        CustomerActivity.approval_status == "REJECTED",
    ).count()

    # Call logs counts
    total_calls = db.query(EmployeeCallLog).filter(EmployeeCallLog.employee_id == current_emp.id).count()
    done_calls = db.query(EmployeeCallLog).filter(
        EmployeeCallLog.employee_id == current_emp.id,
        EmployeeCallLog.call_status == "Done",
    ).count()
    pending_calls = db.query(EmployeeCallLog).filter(
        EmployeeCallLog.employee_id == current_emp.id,
        EmployeeCallLog.call_status == "Pending",
    ).count()

    # Review Points & Approvals
    # 1. Approved Google Reviews: 1 customer = 1 point
    approved_g_reviews = db.query(GoogleReview).filter(
        GoogleReview.employee_id == current_emp.id,
        func.upper(GoogleReview.status).in_(["APPROVED", "VERIFIED", "PUBLISHED"]),
    ).all()
    google_points = sum(max(1, r.customers_count or 1) for r in approved_g_reviews)

    # 2. Approved Video Reviews: 1 video = 1 point, 2 videos = 2 points
    approved_v_reviews = db.query(VideoReview).filter(
        VideoReview.employee_id == current_emp.id,
        func.upper(VideoReview.status).in_(["APPROVED", "VERIFIED", "PUBLISHED"]),
    ).all()
    video_points = sum(max(1, v.videos_count or 1) * 5 for v in approved_v_reviews)

    total_points = google_points + video_points

    # Pending review counts
    pending_g_count = db.query(GoogleReview).filter(
        GoogleReview.employee_id == current_emp.id,
        func.upper(GoogleReview.status) == "PENDING",
    ).count()
    pending_v_count = db.query(VideoReview).filter(
        VideoReview.employee_id == current_emp.id,
        func.upper(VideoReview.status) == "PENDING",
    ).count()

    return EmployeeDashboardSummary(
        employee_id=current_emp.id,
        employee_code=current_emp.employee_code,
        employee_name=current_emp.full_name,
        designation=current_emp.designation or "Sales Executive",
        department=current_emp.department or "Sales & Showroom Operations",
        branch_id=current_emp.branch_id,
        branch_name=b_name,
        branch_code=b_code,
        total_customer_activities=total_act,
        pending_customer_activities=pending_act,
        approved_customer_activities=approved_act,
        rejected_customer_activities=rejected_act,
        total_calls=total_calls,
        completed_calls=done_calls,
        pending_calls=pending_calls,
        total_points=total_points,
        google_review_points=google_points,
        video_review_points=video_points,
        approved_google_reviews=len(approved_g_reviews),
        approved_video_reviews=len(approved_v_reviews),
        pending_reviews_count=pending_g_count + pending_v_count,
        pending_google_reviews=pending_g_count,
        pending_video_reviews=pending_v_count,
    )


# ---------------------------------------------------------------------------
# Employee Customer Activity Routes
# ---------------------------------------------------------------------------
@router.get("/customers", response_model=List[CustomerActivityResponse], summary="List customer activities submitted by this employee")
def list_employee_customer_activities(
    approval_status: Optional[str] = Query(None, description="Filter: PENDING, APPROVED, REJECTED, all"),
    status: Optional[str] = Query(None, description="Outcome status: Sold, Exchange, Walkin, etc."),
    search: Optional[str] = Query(None, description="Search by customer name or phone"),
    current_emp: Employee = Depends(get_current_employee),
    db: Session = Depends(get_db),
):
    query = db.query(CustomerActivity).filter(CustomerActivity.employee_id == current_emp.id)

    if approval_status and approval_status.upper() != "ALL":
        query = query.filter(CustomerActivity.approval_status == approval_status.upper())

    if status and status.upper() != "ALL":
        st_clean = status.strip().lower()
        if st_clean == "sold":
            query = query.filter(or_(CustomerActivity.status.ilike("%sold%"), CustomerActivity.status.ilike("%closed%")))
        elif st_clean == "interested":
            query = query.filter(or_(CustomerActivity.status.ilike("%interested%"), CustomerActivity.status.ilike("%hold%"), CustomerActivity.status.ilike("%follow%"), CustomerActivity.status.ilike("%exchange%")))
        elif st_clean == "lost":
            query = query.filter(CustomerActivity.status.ilike("%lost%"))
        else:
            query = query.filter(CustomerActivity.status == status)

    if search:
        term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                CustomerActivity.customer_name.ilike(term),
                CustomerActivity.phone_number.ilike(term),
                CustomerActivity.notes.ilike(term),
            )
        )

    records = query.order_by(CustomerActivity.activity_date.desc(), CustomerActivity.id.desc()).all()
    return [_build_emp_activity_response(r, current_emp) for r in records]


@router.post("/customers", response_model=CustomerActivityResponse, status_code=status.HTTP_201_CREATED, summary="Submit a customer interaction log by employee (Pending Manager Approval)")
def create_employee_customer_activity(
    activity_data: CustomerActivityCreate,
    current_emp: Employee = Depends(get_current_employee),
    db: Session = Depends(get_db),
):
    record = CustomerActivity(
        branch_id=current_emp.branch_id,
        employee_id=current_emp.id,
        customers_count=activity_data.customers_count if activity_data.customers_count is not None else 1,
        breakdown=activity_data.breakdown,
        customer_name=(activity_data.customer_name or "Customer Interaction").strip(),
        phone_number=(activity_data.phone_number or "").strip(),
        dob=activity_data.dob,
        anniversary=activity_data.anniversary,
        product_value=activity_data.product_value or 0.0,
        activity_date=activity_data.activity_date or date.today(),
        status=activity_data.status or "Walkin",
        approval_status="PENDING",  # Employee additions start in PENDING approval status
        created_by_role="EMPLOYEE",
        created_by_id=current_emp.id,
        notes=activity_data.notes,
    )
    try:
        db.add(record)
        db.commit()
        db.refresh(record)
        _sync_activity_subrecords(record, db)
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to submit customer activity: {str(e)}",
        )

    return _build_emp_activity_response(record, current_emp)


@router.put("/customers/{activity_id}", response_model=CustomerActivityResponse, summary="Update own customer interaction log by employee")
def update_employee_customer_activity(
    activity_id: int,
    activity_data: CustomerActivityCreate,
    current_emp: Employee = Depends(get_current_employee),
    db: Session = Depends(get_db),
):
    record = db.query(CustomerActivity).filter(
        CustomerActivity.id == activity_id,
        CustomerActivity.employee_id == current_emp.id,
    ).first()
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer activity not found.")

    record.customer_name = (activity_data.customer_name or "Walk-in Customer").strip()
    record.phone_number = (activity_data.phone_number or "").strip()
    if activity_data.customers_count is not None:
        record.customers_count = activity_data.customers_count
    if activity_data.activity_date is not None:
        record.activity_date = activity_data.activity_date
    record.status = activity_data.status or record.status or "Walkin"
    record.product_value = activity_data.product_value or 0.0
    record.dob = activity_data.dob
    record.anniversary = activity_data.anniversary
    record.notes = activity_data.notes
    if activity_data.breakdown is not None:
        record.breakdown = activity_data.breakdown

    # If it was rejected previously, reset to PENDING so manager can re-review
    if getattr(record, "approval_status", "") == "REJECTED":
        record.approval_status = "PENDING"
        record.rejection_reason = None

    try:
        db.commit()
        db.refresh(record)
        _sync_activity_subrecords(record, db)
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update customer activity: {str(e)}",
        )

    return _build_emp_activity_response(record, current_emp)


@router.post("/customers/{record_id}/send-whatsapp", summary="Send WhatsApp notification for customer activity")
def send_employee_customer_activity_whatsapp(
    record_id: int,
    req: SendWhatsAppRequest = SendWhatsAppRequest(),
    current_emp: Employee = Depends(get_current_employee),
    db: Session = Depends(get_db),
):
    record = (
        db.query(CustomerActivity)
        .filter(
            CustomerActivity.id == record_id,
            CustomerActivity.employee_id == current_emp.id,
        )
        .first()
    )
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer activity record not found.",
        )

    results = AiSensyService.send_activity_whatsapp_notifications(
        record,
        specific_customer_index=req.customer_index,
    )

    if not results:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No valid phone numbers found for the selected customer(s) to send WhatsApp messages.",
        )

    success_count = sum(1 for r in results if r.get("success"))
    return {
        "success": success_count > 0,
        "record_id": record.id,
        "total_attempted": len(results),
        "total_sent": success_count,
        "results": results,
    }


@router.delete("/customers/{activity_id}", status_code=status.HTTP_200_OK, summary="Delete own pending customer activity")
def delete_employee_customer_activity(
    activity_id: int,
    current_emp: Employee = Depends(get_current_employee),
    db: Session = Depends(get_db),
):
    record = db.query(CustomerActivity).filter(
        CustomerActivity.id == activity_id,
        CustomerActivity.employee_id == current_emp.id,
    ).first()
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer activity not found.")

    # Allow employee to delete their own customer log (cleaned up below)
    if False and getattr(record, "approval_status", "") == "APPROVED":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete an approved customer activity. Please contact your Showroom Manager.",
        )

    # Clean up linked subrecords created from this activity
    tag = f"Activity #{record.id}"
    try:
        db.query(SchemeRecord).filter(
            SchemeRecord.branch_id == record.branch_id,
            SchemeRecord.employee_id == record.employee_id,
            SchemeRecord.notes.like(f"%{tag}%")
        ).delete(synchronize_session=False)

        db.query(GoogleReview).filter(
            GoogleReview.branch_id == record.branch_id,
            GoogleReview.employee_id == record.employee_id,
            GoogleReview.notes.like(f"%{tag}%")
        ).delete(synchronize_session=False)

        db.query(VideoReview).filter(
            VideoReview.branch_id == record.branch_id,
            VideoReview.employee_id == record.employee_id,
            VideoReview.notes.like(f"%{tag}%")
        ).delete(synchronize_session=False)

        db.query(CustomerFeedback).filter(
            CustomerFeedback.branch_id == record.branch_id,
            CustomerFeedback.employee_id == record.employee_id,
            CustomerFeedback.notes.like(f"%{tag}%")
        ).delete(synchronize_session=False)
    except Exception as cleanup_err:
        print(f"Warning cleaning subrecords for activity #{record.id}: {cleanup_err}")

    db.delete(record)
    db.commit()
    return {"message": "Customer activity deleted successfully."}


# ---------------------------------------------------------------------------
# Employee Call Log Routes
# ---------------------------------------------------------------------------
@router.get("/calls", response_model=List[EmployeeCallLogResponse], summary="List customer calls logged by this employee")
def list_employee_calls(
    call_status: Optional[str] = Query(None, description="Done, Pending, or all"),
    search: Optional[str] = Query(None, description="Search by customer name or phone"),
    current_emp: Employee = Depends(get_current_employee),
    db: Session = Depends(get_db),
):
    query = db.query(EmployeeCallLog).filter(
        EmployeeCallLog.employee_id == current_emp.id,
        EmployeeCallLog.branch_id == current_emp.branch_id,
    )

    if call_status and call_status.lower() != "all":
        st = "Done" if call_status.strip().lower() in ["done", "completed"] else "Pending"
        query = query.filter(EmployeeCallLog.call_status == st)

    if search:
        term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                EmployeeCallLog.customer_name.ilike(term),
                EmployeeCallLog.phone_number.ilike(term),
                EmployeeCallLog.purpose.ilike(term),
            )
        )

    logs = query.order_by(EmployeeCallLog.call_date.desc(), EmployeeCallLog.id.desc()).all()
    return [
        EmployeeCallLogResponse(
            id=log.id,
            branch_id=log.branch_id,
            employee_id=log.employee_id,
            employee_name=current_emp.full_name,
            customer_name=log.customer_name,
            phone_number=log.phone_number,
            customers_count=log.customers_count or 1,
            call_status=log.call_status,
            call_date=log.call_date,
            call_time=log.call_time,
            purpose=log.purpose,
            notes=log.notes,
            created_at=log.created_at,
            updated_at=log.updated_at,
        )
        for log in logs
    ]


@router.post("/calls", response_model=EmployeeCallLogResponse, status_code=status.HTTP_201_CREATED, summary="Log a customer call activity by employee")
def create_employee_call(
    call_in: EmployeeCallLogCreate,
    current_emp: Employee = Depends(get_current_employee),
    db: Session = Depends(get_db),
):
    st = "Done" if (call_in.call_status or "").strip().lower() in ["done", "completed"] else "Pending"
    call_dt = call_in.call_date or date.today()
    if isinstance(call_dt, str):
        try:
            call_dt = date.fromisoformat(call_dt.split("T")[0])
        except Exception:
            call_dt = date.today()

    log = EmployeeCallLog(
        branch_id=current_emp.branch_id,
        employee_id=current_emp.id,
        customer_name=call_in.customer_name.strip(),
        phone_number=call_in.phone_number.strip(),
        customers_count=call_in.customers_count or 1,
        call_status=st,
        call_date=call_dt,
        call_time=call_in.call_time,
        purpose=call_in.purpose or "Follow-up Call",
        notes=call_in.notes,
    )
    db.add(log)
    db.commit()
    db.refresh(log)

    return EmployeeCallLogResponse(
        id=log.id,
        branch_id=log.branch_id,
        employee_id=log.employee_id,
        employee_name=current_emp.full_name,
        customer_name=log.customer_name,
        phone_number=log.phone_number,
        customers_count=log.customers_count,
        call_status=log.call_status,
        call_date=log.call_date,
        call_time=log.call_time,
        purpose=log.purpose,
        notes=log.notes,
        created_at=log.created_at,
        updated_at=log.updated_at,
    )


@router.patch("/calls/{call_id}/toggle", response_model=EmployeeCallLogResponse, summary="Toggle employee call status Done/Pending")
def toggle_employee_call(
    call_id: int,
    current_emp: Employee = Depends(get_current_employee),
    db: Session = Depends(get_db),
):
    log = db.query(EmployeeCallLog).filter(
        EmployeeCallLog.id == call_id,
        EmployeeCallLog.employee_id == current_emp.id,
    ).first()
    if not log:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Call log not found.")

    log.call_status = "Pending" if log.call_status == "Done" else "Done"
    db.commit()
    db.refresh(log)

    return EmployeeCallLogResponse(
        id=log.id,
        branch_id=log.branch_id,
        employee_id=log.employee_id,
        employee_name=current_emp.full_name,
        customer_name=log.customer_name,
        phone_number=log.phone_number,
        customers_count=log.customers_count,
        call_status=log.call_status,
        call_date=log.call_date,
        call_time=log.call_time,
        purpose=log.purpose,
        notes=log.notes,
        created_at=log.created_at,
        updated_at=log.updated_at,
    )


@router.delete("/calls/{call_id}", status_code=status.HTTP_200_OK, summary="Delete own call log")
def delete_employee_call(
    call_id: int,
    current_emp: Employee = Depends(get_current_employee),
    db: Session = Depends(get_db),
):
    log = db.query(EmployeeCallLog).filter(
        EmployeeCallLog.id == call_id,
        EmployeeCallLog.employee_id == current_emp.id,
    ).first()
    if not log:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Call log not found.")

    db.delete(log)
    db.commit()
    return {"message": "Call log deleted successfully."}


# ---------------------------------------------------------------------------
# Employee Review Points & Submissions (Google Review & Video Review)
# ---------------------------------------------------------------------------
@router.post("/reviews/upload-proof", status_code=status.HTTP_201_CREATED, summary="Upload proof screenshot for review or video")
async def upload_employee_review_proof(
    file: UploadFile = File(...),
    current_emp: Employee = Depends(get_current_employee),
):
    """Allows employees to upload proof image/screenshot for Google reviews and video reviews."""
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
    filename = f"emp_proof_{current_emp.id}_{uuid.uuid4().hex[:12]}{ext}"
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


@router.get("/reviews/points", response_model=EmployeePointsSummary, summary="Get review points breakdown for logged in employee")
def get_employee_review_points(
    current_emp: Employee = Depends(get_current_employee),
    db: Session = Depends(get_db),
):
    # Approved Google reviews
    approved_g = db.query(GoogleReview).filter(
        GoogleReview.employee_id == current_emp.id,
        func.upper(GoogleReview.status).in_(["APPROVED", "VERIFIED", "PUBLISHED"]),
    ).all()
    google_points = sum(max(1, r.customers_count or 1) for r in approved_g)

    # Approved Video reviews
    approved_v = db.query(VideoReview).filter(
        VideoReview.employee_id == current_emp.id,
        func.upper(VideoReview.status).in_(["APPROVED", "VERIFIED", "PUBLISHED"]),
    ).all()
    video_points = sum(max(1, v.videos_count or 1) * 5 for v in approved_v)

    pending_g = db.query(GoogleReview).filter(
        GoogleReview.employee_id == current_emp.id,
        func.upper(GoogleReview.status) == "PENDING",
    ).count()

    pending_v = db.query(VideoReview).filter(
        VideoReview.employee_id == current_emp.id,
        func.upper(VideoReview.status) == "PENDING",
    ).count()

    return EmployeePointsSummary(
        employee_id=current_emp.id,
        employee_name=current_emp.full_name,
        google_review_points=google_points,
        video_review_points=video_points,
        total_points=google_points + video_points,
        approved_google_reviews=len(approved_g),
        approved_video_reviews=len(approved_v),
        pending_google_reviews=pending_g,
        pending_video_reviews=pending_v,
    )


@router.get("/reviews/google", response_model=List[GoogleReviewResponse], summary="List Google reviews submitted by this employee")
def list_employee_google_reviews(
    status: Optional[str] = Query(None, description="APPROVED, PENDING, REJECTED, or all"),
    current_emp: Employee = Depends(get_current_employee),
    db: Session = Depends(get_db),
):
    query = db.query(GoogleReview).filter(GoogleReview.employee_id == current_emp.id)

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

    records = query.order_by(GoogleReview.review_date.desc(), GoogleReview.id.desc()).all()
    return [
        GoogleReviewResponse(
            id=r.id,
            branch_id=r.branch_id,
            employee_id=r.employee_id,
            employee_name=current_emp.full_name,
            customers_count=getattr(r, "customers_count", 1) or 1,
            customer_name=r.customer_name or "Google Customer",
            review_date=r.review_date,
            rating=r.rating,
            review_text=r.review_text,
            notes=r.notes,
            screenshot_url=r.screenshot_url,
            status=r.status,
            rejection_reason=r.rejection_reason,
            reviewed_by_id=r.reviewed_by_id,
            reviewed_at=r.reviewed_at,
            submitted_by_role=r.submitted_by_role,
            points=r.points,
            created_at=r.created_at,
            updated_at=r.updated_at,
        )
        for r in records
    ]


@router.post("/reviews/google", response_model=GoogleReviewResponse, status_code=status.HTTP_201_CREATED, summary="Submit a Google review for manager verification")
def create_employee_google_review(
    review_in: GoogleReviewCreate,
    current_emp: Employee = Depends(get_current_employee),
    db: Session = Depends(get_db),
):
    if not review_in.screenshot_url or not review_in.screenshot_url.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Google Review photo proof is required for verification.",
        )

    record = GoogleReview(
        branch_id=current_emp.branch_id,
        employee_id=current_emp.id,
        customers_count=max(1, review_in.customers_count or 1),  # 1 customer = 1 point
        customer_name=(review_in.customer_name or "Google Customer").strip(),
        review_date=review_in.review_date or date.today(),
        rating=review_in.rating,
        review_text=review_in.review_text.strip(),
        notes=review_in.notes,
        screenshot_url=review_in.screenshot_url.strip(),
        status="PENDING",  # Starts in PENDING for manager verification
        submitted_by_role="EMPLOYEE",
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    return GoogleReviewResponse(
        id=record.id,
        branch_id=record.branch_id,
        employee_id=record.employee_id,
        employee_name=current_emp.full_name,
        customers_count=record.customers_count,
        customer_name=record.customer_name,
        review_date=record.review_date,
        rating=record.rating,
        review_text=record.review_text,
        notes=record.notes,
        screenshot_url=record.screenshot_url,
        status=record.status,
        rejection_reason=record.rejection_reason,
        reviewed_by_id=record.reviewed_by_id,
        reviewed_at=record.reviewed_at,
        submitted_by_role=record.submitted_by_role,
        points=record.points,
        created_at=record.created_at,
        updated_at=record.updated_at,
    )


@router.delete("/reviews/google/{record_id}", status_code=status.HTTP_200_OK, summary="Delete own pending Google review")
def delete_employee_google_review(
    record_id: int,
    current_emp: Employee = Depends(get_current_employee),
    db: Session = Depends(get_db),
):
    record = db.query(GoogleReview).filter(
        GoogleReview.id == record_id,
        GoogleReview.employee_id == current_emp.id,
    ).first()
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Google review not found.")

    if (record.status or "").upper() in ["APPROVED", "VERIFIED", "PUBLISHED"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete an approved Google review. Please contact your Showroom Manager.",
        )

    db.delete(record)
    db.commit()
    return {"message": "Google review submission deleted successfully."}


@router.get("/reviews/video", response_model=List[VideoReviewResponse], summary="List Video reviews submitted by this employee")
def list_employee_video_reviews(
    status: Optional[str] = Query(None, description="APPROVED, PENDING, REJECTED, or all"),
    current_emp: Employee = Depends(get_current_employee),
    db: Session = Depends(get_db),
):
    query = db.query(VideoReview).filter(VideoReview.employee_id == current_emp.id)

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

    records = query.order_by(VideoReview.review_date.desc(), VideoReview.id.desc()).all()
    return [
        VideoReviewResponse(
            id=r.id,
            branch_id=r.branch_id,
            employee_id=r.employee_id,
            employee_name=current_emp.full_name,
            customer_name=r.customer_name or "Video Customer",
            videos_count=getattr(r, "videos_count", 1) or 1,
            video_title=r.video_title,
            video_url=r.video_url,
            review_date=r.review_date,
            notes=r.notes,
            screenshot_url=r.screenshot_url,
            status=r.status,
            rejection_reason=r.rejection_reason,
            reviewed_by_id=r.reviewed_by_id,
            reviewed_at=r.reviewed_at,
            submitted_by_role=r.submitted_by_role,
            points=r.points,
            created_at=r.created_at,
            updated_at=r.updated_at,
        )
        for r in records
    ]


@router.post("/reviews/video", response_model=VideoReviewResponse, status_code=status.HTTP_201_CREATED, summary="Submit a Video review for manager verification")
def create_employee_video_review(
    review_in: VideoReviewCreate,
    current_emp: Employee = Depends(get_current_employee),
    db: Session = Depends(get_db),
):
    if not review_in.screenshot_url or not review_in.screenshot_url.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Video Review photo proof is required for verification.",
        )

    count = max(1, review_in.videos_count or 1)  # 1 video = 1 point, 2 videos = 2 points
    record = VideoReview(
        branch_id=current_emp.branch_id,
        employee_id=current_emp.id,
        customer_name=(review_in.customer_name or "Video Customer").strip(),
        videos_count=count,
        video_title=(review_in.video_title or f"Customer Review Video ({count})").strip(),
        video_url=review_in.video_url,
        review_date=review_in.review_date or date.today(),
        notes=review_in.notes,
        screenshot_url=review_in.screenshot_url.strip(),
        status="PENDING",  # Starts in PENDING for manager verification
        submitted_by_role="EMPLOYEE",
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    return VideoReviewResponse(
        id=record.id,
        branch_id=record.branch_id,
        employee_id=record.employee_id,
        employee_name=current_emp.full_name,
        customer_name=record.customer_name,
        videos_count=record.videos_count,
        video_title=record.video_title,
        video_url=record.video_url,
        review_date=record.review_date,
        notes=record.notes,
        screenshot_url=record.screenshot_url,
        status=record.status,
        rejection_reason=record.rejection_reason,
        reviewed_by_id=record.reviewed_by_id,
        reviewed_at=record.reviewed_at,
        submitted_by_role=record.submitted_by_role,
        points=record.points,
        created_at=record.created_at,
        updated_at=record.updated_at,
    )


@router.delete("/reviews/video/{record_id}", status_code=status.HTTP_200_OK, summary="Delete own pending Video review")
def delete_employee_video_review(
    record_id: int,
    current_emp: Employee = Depends(get_current_employee),
    db: Session = Depends(get_db),
):
    record = db.query(VideoReview).filter(
        VideoReview.id == record_id,
        VideoReview.employee_id == current_emp.id,
    ).first()
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Video review not found.")

    if (record.status or "").upper() in ["APPROVED", "VERIFIED", "PUBLISHED"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete an approved Video review. Please contact your Showroom Manager.",
        )

    db.delete(record)
    db.commit()
    return {"message": "Video review submission deleted successfully."}
