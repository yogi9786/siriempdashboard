import re
import json
from typing import List, Optional, Dict, Any
from datetime import date, datetime, timezone
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_
from backend.app.core.database import get_db
from backend.app.models.branch import User
from backend.app.models.employee import Employee
from backend.app.models.activity import CustomerActivity, SchemeRecord, GoogleReview, VideoReview
from backend.app.models.feedback import CustomerFeedback
from backend.app.schemas.activity import (
    CustomerActivityCreate,
    CustomerActivityUpdate,
    CustomerActivityResponse,
    CustomerApprovalAction,
)
from backend.app.services.aisensy_service import AiSensyService
from backend.app.dependencies.auth import get_current_manager


class SendWhatsAppRequest(BaseModel):
    customer_index: Optional[int] = None



router = APIRouter(prefix="/api/v1/customers", tags=["Customer Activity"])


@router.get("", response_model=List[CustomerActivityResponse], summary="List customer activity logs for current manager's branch")
def list_customer_activities(
    employee_id: Optional[int] = Query(None, description="Filter by employee ID"),
    status: Optional[str] = Query(None, description="Filter by status: Attended, Closed, Follow-up, Lost"),
    approval_status: Optional[str] = Query(None, description="Filter by approval status: PENDING, APPROVED, REJECTED, all"),
    search: Optional[str] = Query(None, description="Search by customer name or phone"),
    from_date: Optional[date] = Query(None, description="Filter activities from date (YYYY-MM-DD)"),
    to_date: Optional[date] = Query(None, description="Filter activities to date (YYYY-MM-DD)"),
    date_filter: Optional[str] = Query(None, description="Filter by preset: today, yesterday, this_week, this_month"),
    current_user: User = Depends(get_current_manager),
    db: Session = Depends(get_db),
):
    from datetime import timedelta

    query = (
        db.query(CustomerActivity)
        .join(Employee, CustomerActivity.employee_id == Employee.id)
        .filter(
            CustomerActivity.branch_id == current_user.branch_id,
        )
    )

    if employee_id:
        query = query.filter(CustomerActivity.employee_id == employee_id)

    if status and status.lower() != "all":
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

    if approval_status and approval_status != "all":
        query = query.filter(CustomerActivity.approval_status == approval_status.upper())

    # Date filter presets
    today_dt = date.today()
    if date_filter == "today":
        query = query.filter(CustomerActivity.activity_date == today_dt)
    elif date_filter == "yesterday":
        query = query.filter(CustomerActivity.activity_date == today_dt - timedelta(days=1))
    elif date_filter == "this_week":
        query = query.filter(CustomerActivity.activity_date >= today_dt - timedelta(days=7))
    elif date_filter == "this_month":
        query = query.filter(CustomerActivity.activity_date >= today_dt.replace(day=1))

    # Explicit custom date range
    if from_date:
        query = query.filter(CustomerActivity.activity_date >= from_date)
    if to_date:
        query = query.filter(CustomerActivity.activity_date <= to_date)

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
    return [_build_activity_response(r, mgr_map) for r in records]


class PendingCountsResponse(BaseModel):
    pending: int
    approved: int
    rejected: int
    total: int


@router.get("/pending-counts", response_model=PendingCountsResponse, summary="Get summary counts of customer activities by approval status")
def get_pending_counts(
    employee_id: Optional[int] = Query(None, description="Filter by employee ID"),
    current_user: User = Depends(get_current_manager),
    db: Session = Depends(get_db),
):
    base_query = (
        db.query(CustomerActivity)
        .join(Employee, CustomerActivity.employee_id == Employee.id)
        .filter(CustomerActivity.branch_id == current_user.branch_id)
    )
    if employee_id:
        base_query = base_query.filter(CustomerActivity.employee_id == employee_id)

    pending_c = base_query.filter(CustomerActivity.approval_status == "PENDING").count()
    approved_c = base_query.filter(CustomerActivity.approval_status == "APPROVED").count()
    rejected_c = base_query.filter(CustomerActivity.approval_status == "REJECTED").count()
    total_c = pending_c + approved_c + rejected_c

    return PendingCountsResponse(
        pending=pending_c,
        approved=approved_c,
        rejected=rejected_c,
        total=total_c,
    )


@router.get("/pending", response_model=List[CustomerActivityResponse], summary="List employee-submitted customer activities for manager review")
def list_pending_customer_activities(
    status_filter: Optional[str] = Query("PENDING", description="Filter: PENDING, APPROVED, REJECTED, all"),
    employee_id: Optional[int] = Query(None, description="Filter by employee ID"),
    current_user: User = Depends(get_current_manager),
    db: Session = Depends(get_db),
):
    query = (
        db.query(CustomerActivity)
        .join(Employee, CustomerActivity.employee_id == Employee.id)
        .filter(CustomerActivity.branch_id == current_user.branch_id)
    )

    if status_filter and status_filter.upper() != "ALL":
        query = query.filter(CustomerActivity.approval_status == status_filter.upper())

    if employee_id:
        query = query.filter(CustomerActivity.employee_id == employee_id)

    records = query.order_by(CustomerActivity.id.desc()).all()
    mgr_ids = {r.reviewed_by_id for r in records if r.reviewed_by_id} | {
        r.created_by_id for r in records if r.created_by_id and getattr(r, "created_by_role", "") == "MANAGER"
    }
    mgr_map = {u.id: u.full_name for u in db.query(User).filter(User.id.in_(mgr_ids)).all()} if mgr_ids else {}
    return [_build_activity_response(r, mgr_map) for r in records]


@router.post("/{record_id:int}/review", response_model=CustomerActivityResponse, summary="Approve or Reject an employee-submitted customer activity")
def review_customer_activity(
    record_id: int,
    action_data: CustomerApprovalAction,
    current_user: User = Depends(get_current_manager),
    db: Session = Depends(get_db),
):
    record = (
        db.query(CustomerActivity)
        .join(Employee, CustomerActivity.employee_id == Employee.id)
        .filter(
            CustomerActivity.id == record_id,
            CustomerActivity.branch_id == current_user.branch_id,
        )
        .first()
    )
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer activity not found.")

    act = action_data.action.strip().upper()
    if act not in ["APPROVE", "REJECT"]:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Action must be APPROVE or REJECT.")

    if act == "APPROVE":
        record.approval_status = "APPROVED"
        record.rejection_reason = None
        record.reviewed_by_id = current_user.id
        record.reviewed_at = datetime.now(timezone.utc)
        if action_data.notes:
            existing_notes = record.notes or ""
            record.notes = f"{existing_notes}\n[Manager Approval Note]: {action_data.notes}".strip()
        db.commit()
        db.refresh(record)
        _sync_activity_subrecords(record, db)

        # Check if customer activity has valid phone numbers to dispatch WhatsApp upon manager approval
        should_send_wa = False

        # 1. Direct record phone
        if record.phone_number and len(re.sub(r"\D", "", str(record.phone_number))) >= 10:
            should_send_wa = True

        # 2. Breakdown items with phone or explicit queue flag
        if not should_send_wa and record.breakdown:
            try:
                bd_items = json.loads(record.breakdown)
                if isinstance(bd_items, list):
                    for item in bd_items:
                        if isinstance(item, dict):
                            ph = item.get("phone") or item.get("phone_number")
                            if ph and len(re.sub(r"\D", "", str(ph))) >= 10:
                                should_send_wa = True
                                break
                            if item.get("send_whatsapp_on_approval") or item.get("queued_whatsapp"):
                                should_send_wa = True
                                break
            except Exception:
                pass

        # 3. Queued flag in notes
        if not should_send_wa and record.notes and "[WhatsApp Dispatch Queued on Manager Approval]" in record.notes:
            should_send_wa = True

        if should_send_wa:
            try:
                wa_results = AiSensyService.send_activity_whatsapp_notifications(record)
                sent_count = sum(1 for r in wa_results if r.get("success"))
                error_msgs = [r.get("error") for r in wa_results if not r.get("success") and r.get("error")]

                clean_notes = (record.notes or "").replace("[WhatsApp Dispatch Queued on Manager Approval]", "").strip()
                if sent_count > 0:
                    record.notes = f"{clean_notes}\n[WhatsApp System]: {sent_count} message(s) sent successfully upon Manager Approval.".strip()
                elif error_msgs:
                    record.notes = f"{clean_notes}\n[WhatsApp System]: Delivery warning: {'; '.join(error_msgs[:2])}".strip()
                else:
                    record.notes = f"{clean_notes}\n[WhatsApp System]: No messages dispatched (no valid phone numbers).".strip()
                db.commit()
                db.refresh(record)
            except Exception as wa_err:
                import logging
                logging.getLogger("aisensy_service").error(f"Failed to auto-send WhatsApp on approval for activity #{record.id}: {wa_err}")
                clean_notes = (record.notes or "").replace("[WhatsApp Dispatch Queued on Manager Approval]", "").strip()
                record.notes = f"{clean_notes}\n[WhatsApp System Error]: {str(wa_err)}".strip()
                try:
                    db.commit()
                    db.refresh(record)
                except Exception:
                    pass
    else:
        record.approval_status = "REJECTED"
        record.rejection_reason = action_data.rejection_reason or "Rejected by Showroom Manager."
        record.reviewed_by_id = current_user.id
        record.reviewed_at = datetime.now(timezone.utc)
        if action_data.notes:
            existing_notes = record.notes or ""
            record.notes = f"{existing_notes}\n[Manager Rejection Note]: {action_data.notes}".strip()
        db.commit()
        db.refresh(record)
        _sync_activity_subrecords(record, db)

    mgr_map = {current_user.id: current_user.full_name}
    return _build_activity_response(record, mgr_map)



@router.post("", response_model=CustomerActivityResponse, status_code=status.HTTP_201_CREATED, summary="Record a customer attended by an employee")
def create_customer_activity(
    activity_data: CustomerActivityCreate,
    current_user: User = Depends(get_current_manager),
    db: Session = Depends(get_db),
):
    # Verify employee belongs to manager's showroom branch
    employee = db.query(Employee).filter(
        Employee.id == activity_data.employee_id,
        Employee.branch_id == current_user.branch_id,
    ).first()
    if not employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assigned employee not found in your showroom branch.",
        )

    record = CustomerActivity(
        branch_id=current_user.branch_id,
        employee_id=employee.id,
        customers_count=activity_data.customers_count if activity_data.customers_count is not None else 1,
        breakdown=activity_data.breakdown,
        customer_name=(activity_data.customer_name or "Customer Interaction").strip(),
        phone_number=(activity_data.phone_number or "").strip(),
        dob=activity_data.dob,
        anniversary=activity_data.anniversary,
        product_value=activity_data.product_value or 0.0,
        activity_date=activity_data.activity_date or date.today(),
        status=activity_data.status or "Walkin",
        notes=activity_data.notes,
        approval_status="PENDING",
        created_by_role="MANAGER",
        created_by_id=current_user.id,
        reviewed_by_id=None,
        reviewed_at=None,
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
            detail=f"Failed to record customer activity: {str(e)}",
        )

    return _build_activity_response(record)


def _sync_activity_subrecords(record: CustomerActivity, db: Session) -> None:
    """Sync individual customer scheme records, google reviews, and direct feedbacks from breakdown."""
    if not record.breakdown:
        return
    try:
        items = json.loads(record.breakdown)
        if not isinstance(items, list):
            return

        tag = f"Activity #{record.id}"

        # Collect existing review statuses to preserve manual approvals if already verified
        existing_gr_statuses = {
            r.customer_name: (r.status or "").upper()
            for r in db.query(GoogleReview).filter(
                GoogleReview.branch_id == record.branch_id,
                GoogleReview.employee_id == record.employee_id,
                GoogleReview.notes.like(f"%{tag}%")
            ).all()
        }
        existing_vr_statuses = {
            r.customer_name: (r.status or "").upper()
            for r in db.query(VideoReview).filter(
                VideoReview.branch_id == record.branch_id,
                VideoReview.employee_id == record.employee_id,
                VideoReview.notes.like(f"%{tag}%")
            ).all()
        }

        # Remove previous subrecords generated by this customer activity (regardless of previous employee_id)
        db.query(SchemeRecord).filter(
            SchemeRecord.branch_id == record.branch_id,
            SchemeRecord.notes.like(f"%{tag}%")
        ).delete(synchronize_session=False)

        db.query(GoogleReview).filter(
            GoogleReview.branch_id == record.branch_id,
            GoogleReview.notes.like(f"%{tag}%")
        ).delete(synchronize_session=False)

        db.query(CustomerFeedback).filter(
            CustomerFeedback.branch_id == record.branch_id,
            CustomerFeedback.notes.like(f"%{tag}%")
        ).delete(synchronize_session=False)

        db.query(VideoReview).filter(
            VideoReview.branch_id == record.branch_id,
            VideoReview.notes.like(f"%{tag}%")
        ).delete(synchronize_session=False)

        for item in items:
            c_name = (item.get("name") or record.customer_name or "Customer").strip()
            c_phone = (item.get("phone") or record.phone_number or "").strip()

            act_date = record.activity_date
            if isinstance(act_date, str):
                try:
                    act_date = date.fromisoformat(act_date)
                except Exception:
                    act_date = date.today()

            # 1. Schemes Closed (only created when activity is approved)
            if is_act_approved and (item.get("has_scheme") or item.get("scheme_name")):
                s_name = (item.get("scheme_name") or "SIRISAMRUDDHI GOLDEN DREAMS").strip()
                try:
                    s_amt = float(item.get("scheme_amount") or 0.0)
                except (ValueError, TypeError):
                    s_amt = 0.0

                sr = SchemeRecord(
                    branch_id=record.branch_id,
                    employee_id=record.employee_id,
                    customer_name=c_name,
                    customers_count=1,
                    scheme_name=s_name,
                    amount=s_amt,
                    record_date=act_date,
                    notes=f"Enrolled in {s_name} with Customer #{item.get('id', 1)}. Linked to {tag}",
                )
                db.add(sr)

            # 2. Google Review
            if item.get("has_google_review") or item.get("google_review_text"):
                try:
                    gr_rating = int(item.get("google_review_rating") or 5)
                except (ValueError, TypeError):
                    gr_rating = 5
                gr_text = (item.get("google_review_text") or "Customer left a 5-star Google Review!").strip()
                proof_url = (item.get("google_review_screenshot") or item.get("screenshot_url") or "").strip() or None

                is_act_approved = (record.approval_status or "").upper() == "APPROVED"
                is_act_rejected = (record.approval_status or "").upper() == "REJECTED"

                if is_act_approved:
                    gr_status = "APPROVED"
                elif is_act_rejected:
                    gr_status = "REJECTED"
                else:
                    gr_status = "PENDING"

                gr = GoogleReview(
                    branch_id=record.branch_id,
                    employee_id=record.employee_id,
                    customer_name=c_name,
                    customers_count=1,
                    review_date=act_date,
                    rating=gr_rating,
                    review_text=gr_text,
                    screenshot_url=proof_url,
                    notes=f"Google review from customer interaction. Linked to {tag}",
                    status=gr_status,
                    submitted_by_role=record.created_by_role or "EMPLOYEE",
                    reviewed_by_id=record.reviewed_by_id if gr_status == "APPROVED" else None,
                    reviewed_at=record.reviewed_at if gr_status == "APPROVED" else None,
                )
                db.add(gr)

            # 3. Direct Customer Feedback
            if item.get("has_customer_feedback") or item.get("feedback_text"):
                try:
                    fb_rating = int(item.get("feedback_rating") or 5)
                except (ValueError, TypeError):
                    fb_rating = 5
                fb_text = item.get("feedback_text") or "Showroom direct customer feedback"

                cf = CustomerFeedback(
                    branch_id=record.branch_id,
                    employee_id=record.employee_id,
                    customer_name=c_name,
                    customer_phone=c_phone,
                    feedback_date=act_date,
                    rating=fb_rating,
                    category="Customer Service",
                    feedback_text=fb_text,
                    notes=f"Customer direct feedback from interaction. Linked to {tag}",
                    status="Verified" if is_act_approved else "Pending",
                )
                db.add(cf)

            # 4. Video Review (5 points per video)
            if item.get("has_video_review") or item.get("video_title") or item.get("video_screenshot"):
                try:
                    v_count = max(1, int(item.get("videos_count") or 1))
                except (ValueError, TypeError):
                    v_count = 1
                v_title = (item.get("video_title") or f"Customer Review Video - {c_name}").strip()
                v_url = (item.get("video_url") or "").strip() or None
                v_proof = (item.get("video_screenshot") or item.get("video_proof_url") or item.get("screenshot_url") or "").strip() or None

                is_act_approved = (record.approval_status or "").upper() == "APPROVED"
                is_act_rejected = (record.approval_status or "").upper() == "REJECTED"

                if is_act_approved:
                    vr_status = "APPROVED"
                elif is_act_rejected:
                    vr_status = "REJECTED"
                else:
                    vr_status = "PENDING"

                vr = VideoReview(
                    branch_id=record.branch_id,
                    employee_id=record.employee_id,
                    customer_name=c_name,
                    videos_count=v_count,
                    video_title=v_title,
                    video_url=v_url,
                    review_date=act_date,
                    screenshot_url=v_proof,
                    notes=f"Video review from customer interaction. Linked to {tag}",
                    status=vr_status,
                    submitted_by_role=record.created_by_role or "EMPLOYEE",
                    reviewed_by_id=record.reviewed_by_id if vr_status == "APPROVED" else None,
                    reviewed_at=record.reviewed_at if vr_status == "APPROVED" else None,
                )
                db.add(vr)

        db.commit()
    except Exception as err:
        print(f"Warning: Failed to sync activity subrecords: {err}")


def _apply_activity_update(record: CustomerActivity, update_data: CustomerActivityUpdate, current_user_id: Optional[int] = None) -> None:
    """Apply fields from update_data onto the CustomerActivity ORM record."""
    if getattr(update_data, "employee_id", None) is not None:
        record.employee_id = update_data.employee_id
    if update_data.customers_count is not None:
        record.customers_count = update_data.customers_count
    if update_data.breakdown is not None:
        record.breakdown = update_data.breakdown
    if update_data.customer_name is not None:
        record.customer_name = update_data.customer_name.strip()
    if update_data.phone_number is not None:
        record.phone_number = update_data.phone_number.strip()
    if update_data.dob is not None:
        record.dob = update_data.dob
    if update_data.anniversary is not None:
        record.anniversary = update_data.anniversary
    if update_data.product_value is not None:
        record.product_value = update_data.product_value
    if update_data.activity_date is not None:
        record.activity_date = update_data.activity_date
    if update_data.status is not None:
        record.status = update_data.status
    if update_data.notes is not None:
        record.notes = update_data.notes

    # Updating customer log sets status to PENDING so manager reviews and approves the updated record
    record.approval_status = "PENDING"
    record.reviewed_by_id = None
    record.reviewed_at = None
    record.rejection_reason = None


def _commit_activity_update(record: CustomerActivity, db: Session) -> None:
    """Commit update and refresh, rolling back on error."""
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


def _build_activity_response(record: CustomerActivity, mgr_map: Optional[dict] = None) -> CustomerActivityResponse:
    """Build a CustomerActivityResponse from an ORM record."""
    emp_name = record.employee.full_name if record.employee else None
    emp_code = record.employee.employee_code if record.employee else None
    b_name = record.branch.name if record.branch else None
    b_code = record.branch.code if record.branch else None

    reviewed_name = None
    rev_id = getattr(record, 'reviewed_by_id', None)
    if rev_id and mgr_map and rev_id in mgr_map:
        reviewed_name = mgr_map[rev_id]
    elif rev_id:
        reviewed_name = "Showroom Manager"
    elif getattr(record, 'approval_status', '') in ['APPROVED', 'REJECTED']:
        c_role = getattr(record, 'created_by_role', '')
        c_id = getattr(record, 'created_by_id', None)
        if c_role == 'MANAGER' and c_id and mgr_map and c_id in mgr_map:
            reviewed_name = mgr_map[c_id]
        else:
            reviewed_name = "Showroom Manager"

    return CustomerActivityResponse(
        id=record.id,
        branch_id=record.branch_id,
        branch_code=b_code,
        branch_name=b_name,
        employee_id=record.employee_id,
        employee_name=emp_name,
        employee_code=emp_code,
        customers_count=getattr(record, 'customers_count', 1) or 1,
        breakdown=getattr(record, 'breakdown', None),
        customer_name=record.customer_name,
        phone_number=record.phone_number,
        dob=getattr(record, 'dob', None),
        anniversary=getattr(record, 'anniversary', None),
        product_value=getattr(record, 'product_value', 0.0) or 0.0,
        activity_date=record.activity_date,
        status=record.status,
        approval_status=getattr(record, 'approval_status', 'PENDING') or 'PENDING',
        created_by_role=getattr(record, 'created_by_role', 'MANAGER') or 'MANAGER',
        created_by_id=getattr(record, 'created_by_id', None),
        rejection_reason=getattr(record, 'rejection_reason', None),
        reviewed_by_id=getattr(record, 'reviewed_by_id', None),
        reviewed_at=getattr(record, 'reviewed_at', None),
        reviewed_by_name=reviewed_name,
        notes=record.notes,
        created_at=record.created_at,
        updated_at=record.updated_at,
    )



# PUT
@router.put("/{record_id:int}", response_model=CustomerActivityResponse, summary="Update a customer activity record (full replace)")
def put_customer_activity(
    record_id: int,
    update_data: CustomerActivityUpdate,
    current_user: User = Depends(get_current_manager),
    db: Session = Depends(get_db),
):
    record = (
        db.query(CustomerActivity)
        .join(Employee, CustomerActivity.employee_id == Employee.id)
        .filter(
            CustomerActivity.id == record_id,
            CustomerActivity.branch_id == current_user.branch_id,
        )
        .first()
    )
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer activity record not found.")
    _apply_activity_update(record, update_data, current_user.id)
    _commit_activity_update(record, db)
    # WhatsApp is only sent via explicit button click (/send-whatsapp endpoint).
    return _build_activity_response(record)


@router.patch("/{record_id:int}", response_model=CustomerActivityResponse, summary="Partially update a customer activity record")
def patch_customer_activity(
    record_id: int,
    update_data: CustomerActivityUpdate,
    current_user: User = Depends(get_current_manager),
    db: Session = Depends(get_db),
):
    record = (
        db.query(CustomerActivity)
        .join(Employee, CustomerActivity.employee_id == Employee.id)
        .filter(
            CustomerActivity.id == record_id,
            CustomerActivity.branch_id == current_user.branch_id,
        )
        .first()
    )
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer activity record not found.")
    _apply_activity_update(record, update_data, current_user.id)
    _commit_activity_update(record, db)
    # WhatsApp is only sent via explicit button click (/send-whatsapp endpoint).

    return _build_activity_response(record)


@router.post("/{record_id:int}/send-whatsapp", summary="Manually trigger WhatsApp notification for a customer activity record via AiSensy")
def send_customer_activity_whatsapp(
    record_id: int,
    req: SendWhatsAppRequest = SendWhatsAppRequest(),
    current_user: User = Depends(get_current_manager),
    db: Session = Depends(get_db),
):
    record = (
        db.query(CustomerActivity)
        .join(Employee, CustomerActivity.employee_id == Employee.id)
        .filter(
            CustomerActivity.id == record_id,
            CustomerActivity.branch_id == current_user.branch_id,
        )
        .first()
    )
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer activity record not found in your showroom branch.",
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


@router.delete("/{record_id:int}", status_code=status.HTTP_200_OK, summary="Delete a customer activity record")
def delete_customer_activity(
    record_id: int,
    current_user: User = Depends(get_current_manager),
    db: Session = Depends(get_db),
):
    record = (
        db.query(CustomerActivity)
        .join(Employee, CustomerActivity.employee_id == Employee.id)
        .filter(
            CustomerActivity.id == record_id,
            CustomerActivity.branch_id == current_user.branch_id,
        )
        .first()
    )
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Record not found.")

    # Clean up linked subrecords
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

    try:
        db.delete(record)
        db.commit()
        return {"message": "Customer activity record deleted successfully."}
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete customer activity: {str(e)}",
        )
