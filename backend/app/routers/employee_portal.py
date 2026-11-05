import os
import uuid
from typing import List, Optional
from datetime import date, datetime, timezone
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, status
from sqlalchemy.orm import Session
import json
from sqlalchemy import or_, func, case
from backend.app.models.outdoor_marketing import OutdoorMarketingDuty, OutdoorMarketingCustomer
from backend.app.schemas.outdoor_marketing import OutdoorDutyResponse, OutdoorDutyUpdate
from backend.app.routers.outdoor_marketing import format_duty_response


from backend.app.core.config import settings
from backend.app.core.database import get_db
from backend.app.models.branch import Branch, User
from backend.app.models.employee import Employee
from backend.app.models.activity import CustomerActivity, EmployeeCallLog, GoogleReview, VideoReview, SchemeRecord, AttireRecord
from backend.app.models.feedback import CustomerFeedback
from backend.app.schemas.activity import (
    CustomerActivityCreate,
    CustomerActivityResponse,
    GoogleReviewCreate,
    GoogleReviewResponse,
    VideoReviewCreate,
    VideoReviewResponse,
    EmployeePointsSummary,
    AttireRecordResponse,
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
    total_outdoor_duties: int = 0
    total_outdoor_customers: int = 0
    pending_outdoor_duties: int = 0


class EmployeeNotificationItem(BaseModel):
    id: str
    category: str  # attire, google_review, video_review, customer_activity
    title: str
    status: str
    message: str
    date: str
    created_at: Optional[str] = None
    badge_color: str  # green, amber, red, blue


class EmployeeNotificationResponse(BaseModel):
    unread_count: int
    notifications: List[EmployeeNotificationItem]


def _build_emp_activity_response(
    record: CustomerActivity,
    emp: Employee,
    mgr_map: Optional[dict] = None,
) -> CustomerActivityResponse:
    b_name = emp.branch.name if emp.branch else None
    b_code = emp.branch.code if emp.branch else None

    reviewed_name = None
    rev_id = getattr(record, "reviewed_by_id", None)
    if rev_id and mgr_map and rev_id in mgr_map:
        reviewed_name = mgr_map[rev_id]
    elif rev_id:
        reviewed_name = "Showroom Manager"
    elif getattr(record, "approval_status", "") in ["APPROVED", "REJECTED"]:
        c_role = getattr(record, "created_by_role", "")
        c_id = getattr(record, "created_by_id", None)
        if c_role == "MANAGER" and c_id and mgr_map and c_id in mgr_map:
            reviewed_name = mgr_map[c_id]
        else:
            reviewed_name = "Showroom Manager"

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
        reviewed_by_name=reviewed_name,
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

    # Fast Single-Pass Aggregation for Customer Activities
    act_counts = db.query(
        func.count(CustomerActivity.id).label("total"),
        func.count(case((CustomerActivity.approval_status == "PENDING", 1))).label("pending"),
        func.count(case((CustomerActivity.approval_status == "APPROVED", 1))).label("approved"),
        func.count(case((CustomerActivity.approval_status == "REJECTED", 1))).label("rejected"),
    ).filter(CustomerActivity.employee_id == current_emp.id).first()

    total_act = (act_counts.total or 0) if act_counts else 0
    pending_act = (act_counts.pending or 0) if act_counts else 0
    approved_act = (act_counts.approved or 0) if act_counts else 0
    rejected_act = (act_counts.rejected or 0) if act_counts else 0

    # Fast Single-Pass Aggregation for Call Logs
    call_counts = db.query(
        func.count(EmployeeCallLog.id).label("total"),
        func.count(case((EmployeeCallLog.call_status == "Done", 1))).label("done"),
        func.count(case((EmployeeCallLog.call_status == "Pending", 1))).label("pending"),
    ).filter(EmployeeCallLog.employee_id == current_emp.id).first()

    total_calls = (call_counts.total or 0) if call_counts else 0
    done_calls = (call_counts.done or 0) if call_counts else 0
    pending_calls = (call_counts.pending or 0) if call_counts else 0

    # Fast Single-Pass Aggregation for Outdoor Marketing Duties
    outdoor_counts = db.query(
        func.count(OutdoorMarketingDuty.id).label("total_duties"),
        func.coalesce(func.sum(OutdoorMarketingDuty.customers_attended_count), 0).label("total_customers"),
        func.count(case((OutdoorMarketingDuty.status.in_(["Pending Review", "PENDING", "In Progress", "Assigned"]), 1))).label("pending_duties"),
    ).filter(OutdoorMarketingDuty.employee_id == current_emp.id).first()

    total_outdoor_duties = (outdoor_counts.total_duties or 0) if outdoor_counts else 0
    total_outdoor_cust = int(outdoor_counts.total_customers or 0) if outdoor_counts else 0
    pending_outdoor_duties = (outdoor_counts.pending_duties or 0) if outdoor_counts else 0

    # Review Points & Approvals
    approved_g_reviews = db.query(GoogleReview).filter(
        GoogleReview.employee_id == current_emp.id,
        func.upper(GoogleReview.status).in_(["APPROVED", "VERIFIED", "PUBLISHED"]),
    ).all()
    google_points = sum(max(1, r.customers_count or 1) for r in approved_g_reviews)

    approved_v_reviews = db.query(VideoReview).filter(
        VideoReview.employee_id == current_emp.id,
        func.upper(VideoReview.status).in_(["APPROVED", "VERIFIED", "PUBLISHED"]),
    ).all()
    video_points = sum(max(1, v.videos_count or 1) * 5 for v in approved_v_reviews)

    # Robust aggregation: also account for approved CustomerActivity records with review breakdown
    approved_acts = (
        db.query(CustomerActivity)
        .filter(
            CustomerActivity.employee_id == current_emp.id,
            CustomerActivity.approval_status == "APPROVED",
            CustomerActivity.breakdown.isnot(None),
        )
        .all()
    )

    g_act_notes = {r.notes for r in approved_g_reviews if r.notes}
    v_act_notes = {v.notes for v in approved_v_reviews if v.notes}

    extra_g_pts = 0
    extra_v_pts = 0

    for act in approved_acts:
        tag = f"Activity #{act.id}"
        has_g = any(tag in n for n in g_act_notes)
        has_v = any(tag in n for n in v_act_notes)
        try:
            items = json.loads(act.breakdown)
            if isinstance(items, list):
                for item in items:
                    if not has_g and (item.get("has_google_review") or item.get("google_review_text")):
                        extra_g_pts += 1
                    if not has_v and (item.get("has_video_review") or item.get("video_title") or item.get("video_screenshot")):
                        v_cnt = max(1, int(item.get("videos_count") or 1))
                        extra_v_pts += v_cnt * 5
        except Exception:
            pass

    google_points += extra_g_pts
    video_points += extra_v_pts
    total_points = google_points + video_points

    # Pending review counts
    review_counts = db.query(
        func.count(case((func.upper(GoogleReview.status) == "PENDING", 1))).label("pending_g"),
    ).filter(GoogleReview.employee_id == current_emp.id).first()
    pending_g_count = (review_counts.pending_g or 0) if review_counts else 0

    video_counts = db.query(
        func.count(case((func.upper(VideoReview.status) == "PENDING", 1))).label("pending_v"),
    ).filter(VideoReview.employee_id == current_emp.id).first()
    pending_v_count = (video_counts.pending_v or 0) if video_counts else 0

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
        total_outdoor_duties=total_outdoor_duties,
        total_outdoor_customers=total_outdoor_cust,
        pending_outdoor_duties=pending_outdoor_duties,
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
        elif st_clean == "exchange":
            query = query.filter(CustomerActivity.status.ilike("%exchange%"))
        elif st_clean in ["in hold", "in hold / follow up", "hold", "follow up", "follow-up"]:
            query = query.filter(or_(CustomerActivity.status.ilike("%hold%"), CustomerActivity.status.ilike("%follow%")))
        elif st_clean == "interested":
            query = query.filter(CustomerActivity.status.ilike("%interested%"))
        elif st_clean == "lost":
            query = query.filter(CustomerActivity.status.ilike("%lost%"))
        else:
            query = query.filter(CustomerActivity.status.ilike(f"%{st_clean}%"))

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
    mgr_ids = {r.reviewed_by_id for r in records if r.reviewed_by_id} | {
        r.created_by_id for r in records if r.created_by_id and getattr(r, "created_by_role", "") == "MANAGER"
    }
    mgr_map = {u.id: u.full_name for u in db.query(User).filter(User.id.in_(mgr_ids)).all()} if mgr_ids else {}
    return [_build_emp_activity_response(r, current_emp, mgr_map) for r in records]


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

    # Any customer log update resets status to PENDING so manager reviews and approves
    record.approval_status = "PENDING"
    record.reviewed_by_id = None
    record.reviewed_at = None
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
    mgr_ids = {r.reviewed_by_id for r in records if r.reviewed_by_id}
    mgr_map = {u.id: u.full_name for u in db.query(User).filter(User.id.in_(mgr_ids)).all()} if mgr_ids else {}
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
            reviewed_by_name=mgr_map.get(r.reviewed_by_id) or ("Showroom Manager" if r.status in ["APPROVED", "REJECTED"] else None),
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
    mgr_ids = {r.reviewed_by_id for r in records if r.reviewed_by_id}
    mgr_map = {u.id: u.full_name for u in db.query(User).filter(User.id.in_(mgr_ids)).all()} if mgr_ids else {}
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
            reviewed_by_name=mgr_map.get(r.reviewed_by_id) or ("Showroom Manager" if r.status in ["APPROVED", "REJECTED"] else None),
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


@router.get("/notifications", response_model=EmployeeNotificationResponse, summary="Get employee notifications for attire checks & review approvals")
def get_employee_notifications(
    current_emp: Employee = Depends(get_current_employee),
    db: Session = Depends(get_db),
):
    notifications: List[EmployeeNotificationItem] = []

    # Map manager id to manager full name
    managers = (
        db.query(User)
        .filter(User.role == "MANAGER")
        .all()
    )
    mgr_map = {m.id: m.full_name.strip() for m in managers if m.full_name}
    branch_mgr = next((m.full_name.strip() for m in managers if m.branch_id == current_emp.branch_id), "Showroom Manager")

    # 1. Attire Checks logged by manager for this employee
    attire_records = (
        db.query(AttireRecord)
        .filter(AttireRecord.employee_id == current_emp.id)
        .order_by(AttireRecord.check_date.desc(), AttireRecord.id.desc())
        .limit(20)
        .all()
    )
    for a in attire_records:
        st = a.status or "Proper"
        st_lower = st.lower()
        color = "green" if st_lower == "proper" else ("amber" if "attention" in st_lower else "red")
        notes_str = f" • Manager Remarks: {a.notes}" if a.notes and a.notes.strip() else ""
        date_str = a.check_date.strftime("%d %b %Y") if hasattr(a.check_date, "strftime") else str(a.check_date)
        mgr_name = branch_mgr
        notifications.append(
            EmployeeNotificationItem(
                id=f"attire_{a.id}",
                category="attire",
                title=f"Attire Check: {st}",
                status=st,
                message=f"Grooming & attire inspection completed by Manager {mgr_name} for {date_str}: {st}.{notes_str}",
                date=date_str,
                created_at=a.created_at.isoformat() if a.created_at else str(a.check_date),
                badge_color=color,
            )
        )

    # 2. Google Reviews submitted by this employee
    google_reviews = (
        db.query(GoogleReview)
        .filter(GoogleReview.employee_id == current_emp.id)
        .order_by(GoogleReview.created_at.desc(), GoogleReview.id.desc())
        .limit(20)
        .all()
    )
    for g in google_reviews:
        st_raw = (g.status or "PENDING").upper()
        mgr_name = mgr_map.get(g.reviewed_by_id) or branch_mgr
        if st_raw in ["APPROVED", "VERIFIED", "PUBLISHED"]:
            st = "APPROVED"
            color = "green"
            msg = f"Google review for {g.customer_name or 'Customer'} was APPROVED by Manager {mgr_name} (+{g.customers_count or 1} point credited)."
        elif st_raw == "REJECTED":
            st = "REJECTED"
            color = "red"
            rej = (g.rejection_reason or g.notes or "").strip()
            reason = f" (Reason: {rej})" if rej else ""
            msg = f"Google review for {g.customer_name or 'Customer'} was REJECTED by Manager {mgr_name}{reason}."
        else:
            st = "PENDING"
            color = "amber"
            msg = f"Google review for {g.customer_name or 'Customer'} is pending manager verification."

        rev_date = g.review_date.strftime("%d %b %Y") if g.review_date and hasattr(g.review_date, "strftime") else (g.created_at.strftime("%d %b %Y") if g.created_at else "")
        notifications.append(
            EmployeeNotificationItem(
                id=f"google_{g.id}",
                category="google_review",
                title=f"Google Review: {st.title()}",
                status=st,
                message=msg,
                date=rev_date,
                created_at=g.created_at.isoformat() if g.created_at else None,
                badge_color=color,
            )
        )

    # 3. Video Reviews submitted by this employee
    video_reviews = (
        db.query(VideoReview)
        .filter(VideoReview.employee_id == current_emp.id)
        .order_by(VideoReview.created_at.desc(), VideoReview.id.desc())
        .limit(20)
        .all()
    )
    for v in video_reviews:
        st_raw = (v.status or "PENDING").upper()
        mgr_name = mgr_map.get(v.reviewed_by_id) or branch_mgr
        v_pts = (v.videos_count or 1) * 5
        if st_raw in ["APPROVED", "VERIFIED", "PUBLISHED"]:
            st = "APPROVED"
            color = "green"
            msg = f"Video review for {v.customer_name or 'Customer'} was APPROVED by Manager {mgr_name} (+{v_pts} points credited)."
        elif st_raw == "REJECTED":
            st = "REJECTED"
            color = "red"
            rej = (v.rejection_reason or v.notes or "").strip()
            reason = f" (Reason: {rej})" if rej else ""
            msg = f"Video review for {v.customer_name or 'Customer'} was REJECTED by Manager {mgr_name}{reason}."
        else:
            st = "PENDING"
            color = "amber"
            msg = f"Video review for {v.customer_name or 'Customer'} is pending manager verification."

        v_date = v.review_date.strftime("%d %b %Y") if v.review_date and hasattr(v.review_date, "strftime") else (v.created_at.strftime("%d %b %Y") if v.created_at else "")
        notifications.append(
            EmployeeNotificationItem(
                id=f"video_{v.id}",
                category="video_review",
                title=f"Video Review: {st.title()}",
                status=st,
                message=msg,
                date=v_date,
                created_at=v.created_at.isoformat() if v.created_at else None,
                badge_color=color,
            )
        )

    # 4. Customer Activity Approval Updates
    recent_activities = (
        db.query(CustomerActivity)
        .filter(CustomerActivity.employee_id == current_emp.id)
        .order_by(CustomerActivity.created_at.desc(), CustomerActivity.id.desc())
        .limit(20)
        .all()
    )
    for act in recent_activities:
        st = (act.approval_status or "PENDING").upper()
        mgr_name = mgr_map.get(act.reviewed_by_id) or branch_mgr
        color = "green" if st == "APPROVED" else ("red" if st == "REJECTED" else "amber")
        reason = f" (Reason: {act.rejection_reason})" if act.rejection_reason and act.rejection_reason.strip() else ""
        if st == "APPROVED":
            msg = f"Customer log for {act.customer_name or 'Customer'} was APPROVED by Manager {mgr_name}."
        elif st == "REJECTED":
            msg = f"Customer log for {act.customer_name or 'Customer'} was REJECTED by Manager {mgr_name}{reason}."
        else:
            msg = f"Customer log for {act.customer_name or 'Customer'} is pending manager approval."

        notifications.append(
            EmployeeNotificationItem(
                id=f"activity_{act.id}",
                category="customer_activity",
                title=f"Customer Log: {st.title()}",
                status=st,
                message=msg,
                date=act.activity_date.strftime("%d %b %Y") if act.activity_date and hasattr(act.activity_date, "strftime") else str(act.activity_date),
                created_at=act.created_at.isoformat() if act.created_at else None,
                badge_color=color,
            )
        )

    # 5. Outdoor Customer Follow-up Notifications
    today_val = date.today()
    outdoor_custs = (
        db.query(OutdoorMarketingCustomer)
        .filter(
            OutdoorMarketingCustomer.marketing_employee_id == current_emp.id,
            OutdoorMarketingCustomer.follow_up_date.isnot(None),
        )
        .order_by(OutdoorMarketingCustomer.follow_up_date.asc())
        .limit(20)
        .all()
    )
    for oc in outdoor_custs:
        f_date = oc.follow_up_date
        f_str = f_date.strftime("%d %b %Y") if hasattr(f_date, "strftime") else str(f_date)
        is_today = f_date == today_val
        is_past = f_date < today_val
        st_label = "Due Today" if is_today else ("Overdue" if is_past else "Upcoming")
        b_color = "red" if is_past else ("amber" if is_today else "blue")
        notifications.append(
            EmployeeNotificationItem(
                id=f"outdoor_followup_{oc.id}",
                category="outdoor_followup",
                title=f"Outdoor Follow-up: {oc.customer_name}",
                status=st_label,
                message=f"Follow-up scheduled for {oc.customer_name} ({oc.phone or 'No phone'}) in {oc.area_name or 'Field area'}. Remarks: {oc.notes or 'No remarks'}",
                date=f_str,
                created_at=oc.created_at.isoformat() if hasattr(oc.created_at, "isoformat") else str(oc.created_at),
                badge_color=b_color,
            )
        )

    # Sort notifications by created_at descending
    notifications.sort(key=lambda x: x.created_at or x.date or "", reverse=True)

    return EmployeeNotificationResponse(
        unread_count=len(notifications),
        notifications=notifications,
    )


@router.get("/attire", response_model=List[AttireRecordResponse], summary="List attire compliance records for logged in employee")
def list_employee_attire(
    current_emp: Employee = Depends(get_current_employee),
    db: Session = Depends(get_db),
):
    records = (
        db.query(AttireRecord)
        .filter(AttireRecord.employee_id == current_emp.id)
        .order_by(AttireRecord.check_date.desc(), AttireRecord.id.desc())
        .all()
    )
    return [
        AttireRecordResponse(
            id=r.id,
            branch_id=r.branch_id,
            employee_id=r.employee_id,
            employee_name=current_emp.full_name,
            check_date=r.check_date,
            status=r.status,
            notes=r.notes,
            image_url=r.image_url,
            created_at=r.created_at,
        )
        for r in records
    ]


# ---------------------------------------------------------------------------
# Employee Outdoor Marketing Routes (Fast, Non-Generalized, Zero WhatsApp)
# ---------------------------------------------------------------------------
@router.get("/outdoor/duty", response_model=Optional[OutdoorDutyResponse], summary="Get employee's outdoor duty for a specific date")
def get_employee_outdoor_duty(
    date_filter: Optional[date] = Query(None, description="Duty date (defaults to today)"),
    current_emp: Employee = Depends(get_current_employee),
    db: Session = Depends(get_db),
):
    target_date = date_filter or date.today()
    duty = (
        db.query(OutdoorMarketingDuty)
        .filter(
            OutdoorMarketingDuty.employee_id == current_emp.id,
            OutdoorMarketingDuty.date == target_date,
        )
        .first()
    )
    if not duty:
        return None
    return format_duty_response(duty)


@router.post("/outdoor/duty", response_model=OutdoorDutyResponse, summary="Save or update employee's outdoor customer log (Sends to Pending Review, NO WhatsApp)")
def save_employee_outdoor_duty(
    payload: OutdoorDutyUpdate,
    duty_date: Optional[date] = Query(None, description="Duty date (defaults to today)"),
    current_emp: Employee = Depends(get_current_employee),
    db: Session = Depends(get_db),
):
    target_date = duty_date or date.today()
    duty = (
        db.query(OutdoorMarketingDuty)
        .filter(
            OutdoorMarketingDuty.employee_id == current_emp.id,
            OutdoorMarketingDuty.date == target_date,
        )
        .first()
    )

    if not duty:
        duty = OutdoorMarketingDuty(
            branch_id=current_emp.branch_id,
            employee_id=current_emp.id,
            date=target_date,
            status="Pending Review",
        )
        db.add(duty)
        db.flush()

    if payload.area is not None and payload.area.strip():
        duty.area = payload.area.strip()
    elif payload.customers and any(c.area_name for c in payload.customers if c.area_name):
        first_area = next((c.area_name for c in payload.customers if c.area_name and c.area_name.strip()), None)
        if first_area:
            duty.area = first_area.strip()
    elif not duty.area:
        duty.area = "Field Marketing"

    if payload.customers_attended_count is not None:
        duty.customers_attended_count = payload.customers_attended_count
    if payload.converted_customers_count is not None:
        duty.converted_customers_count = payload.converted_customers_count
    if payload.google_ratings_count is not None:
        duty.google_ratings_count = payload.google_ratings_count
    if payload.photo_urls is not None and payload.photo_urls:
        duty.photo_urls = json.dumps(payload.photo_urls)
        if not duty.photo_url:
            duty.photo_url = payload.photo_urls[0]
    elif payload.photo_url is not None:
        duty.photo_url = payload.photo_url
    if payload.notes is not None:
        duty.notes = payload.notes.strip() if payload.notes else None

    # CRITICAL: Always set status to 'Pending Review' upon employee save/update
    duty.status = "Pending Review"

    # Save customer entries if provided
    if payload.customers is not None:
        db.query(OutdoorMarketingCustomer).filter(
            OutdoorMarketingCustomer.duty_id == duty.id,
            OutdoorMarketingCustomer.marketing_employee_id == current_emp.id,
        ).delete(synchronize_session=False)

        cust_photos = []
        for c in payload.customers:
            if not c.customer_name or not c.customer_name.strip():
                continue
            if c.photo_url:
                cust_photos.append(c.photo_url)
            new_cust = OutdoorMarketingCustomer(
                branch_id=current_emp.branch_id,
                marketing_employee_id=current_emp.id,
                duty_id=duty.id,
                customer_name=c.customer_name.strip(),
                phone=c.phone.strip() if c.phone else None,
                dob=c.dob,
                anniversary_date=c.anniversary_date,
                follow_up_date=c.follow_up_date,
                photo_url=c.photo_url,
                area_name=c.area_name or duty.area or "Field Marketing",
                date=duty.date,
                is_converted=c.is_converted,
                has_google_review=c.has_google_review,
                google_review_rating=c.google_review_rating or 5,
                google_review_text=c.google_review_text,
                google_review_screenshot=getattr(c, "google_review_screenshot", None),
                has_video_review=getattr(c, "has_video_review", False) or False,
                video_review_title=getattr(c, "video_review_title", None),
                video_review_url=getattr(c, "video_review_url", None),
                video_review_proof=getattr(c, "video_review_proof", None),
                has_customer_feedback=getattr(c, "has_customer_feedback", False) or False,
                feedback_rating=getattr(c, "feedback_rating", 5) or 5,
                feedback_text=getattr(c, "feedback_text", None),
                customer_feedback_proof=getattr(c, "customer_feedback_proof", None),
                status="Converted" if c.is_converted else "Contacted",
                interested_in=c.interested_in,
                notes=c.notes,
                note_notification_date=getattr(c, "note_notification_date", None),
                updated_by_manager=getattr(c, "updated_by_manager", False) or False,
            )
            db.add(new_cust)

        if cust_photos and not duty.photo_url:
            duty.photo_url = cust_photos[0]
            duty.photo_urls = json.dumps(cust_photos)

    # Strictly NO WhatsApp sending here!
    try:
        db.commit()
        db.refresh(duty)
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save outdoor customer log: {str(e)}",
        )

    return format_duty_response(duty)


@router.post("/outdoor/upload-photo", status_code=status.HTTP_201_CREATED, summary="Upload outdoor activity field photo by employee")
async def upload_employee_outdoor_photo(
    file: UploadFile = File(...),
    current_emp: Employee = Depends(get_current_employee),
):
    if file.content_type not in ALLOWED_IMAGE_MIMES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file format '{file.content_type}'. Please upload JPG, PNG, or WEBP images.",
        )

    upload_dir = os.path.join(settings.MEDIA_DIR, "outdoor", "photos")
    os.makedirs(upload_dir, exist_ok=True)

    file_ext = ALLOWED_IMAGE_MIMES[file.content_type]
    file_id = f"outdoor_emp_{current_emp.id}_{uuid.uuid4().hex[:10]}{file_ext}"
    file_path = os.path.join(upload_dir, file_id)

    contents = await file.read()
    if len(contents) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Photo file size exceeds 10MB limit.")

    with open(file_path, "wb") as f:
        f.write(contents)

    rel_url = f"/uploads/outdoor/photos/{file_id}"
    return {"url": rel_url, "photo_url": rel_url, "message": "Photo uploaded successfully."}


@router.post("/outdoor/upload-proof", status_code=status.HTTP_201_CREATED, summary="Upload outdoor customer review or feedback proof by employee")
async def upload_employee_outdoor_proof(
    file: UploadFile = File(...),
    current_emp: Employee = Depends(get_current_employee),
):
    content_type = file.content_type.lower() if file.content_type else ""
    allowed_proof_exts = {
        "image/jpeg": ".jpg",
        "image/jpg": ".jpg",
        "image/png": ".png",
        "image/webp": ".webp",
        "video/mp4": ".mp4",
        "video/webm": ".webm",
        "video/quicktime": ".mov",
        "video/x-msvideo": ".avi",
    }
    if content_type not in allowed_proof_exts:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file format. Please upload an image (JPEG, PNG, WebP) or video (MP4, WebM, MOV)."
        )

    upload_dir = os.path.join(settings.MEDIA_DIR, "outdoor", "proofs")
    os.makedirs(upload_dir, exist_ok=True)

    file_ext = allowed_proof_exts[content_type]
    file_id = f"proof_emp_{current_emp.id}_{uuid.uuid4().hex[:12]}{file_ext}"
    file_path = os.path.join(upload_dir, file_id)

    contents = await file.read()
    if len(contents) > 50 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File size exceeds 50MB limit.")

    with open(file_path, "wb") as f:
        f.write(contents)

    rel_url = f"/media/outdoor/proofs/{file_id}"
    return {"url": rel_url, "proof_url": rel_url, "message": "Proof uploaded successfully."}


@router.get("/outdoor/history", response_model=List[OutdoorDutyResponse], summary="List employee's past outdoor duties")
def get_employee_outdoor_history(
    current_emp: Employee = Depends(get_current_employee),
    db: Session = Depends(get_db),
):
    duties = (
        db.query(OutdoorMarketingDuty)
        .filter(OutdoorMarketingDuty.employee_id == current_emp.id)
        .order_by(OutdoorMarketingDuty.date.desc())
        .limit(30)
        .all()
    )
    return [format_duty_response(d) for d in duties]
