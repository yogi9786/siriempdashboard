from datetime import date, timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Body
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.models.branch import User, Branch
from backend.app.models.employee import Employee
from backend.app.models.activity import CustomerActivity, SchemePaymentReminder
from backend.app.models.outdoor_marketing import OutdoorMarketingCustomer
from backend.app.models.hr import EmployeeLeaveRequest
from backend.app.schemas.dashboard import DashboardOverviewResponse
from backend.app.dependencies.auth import get_current_manager

router = APIRouter(prefix="/api/v1/dashboard", tags=["Dashboard"])


@router.get("/overview", response_model=DashboardOverviewResponse, summary="Get manager dashboard overview with branch-isolated employee counts")
def get_dashboard_overview(
    current_user: User = Depends(get_current_manager),
    db: Session = Depends(get_db),
):
    branch = db.query(Branch).filter(Branch.id == current_user.branch_id).first()
    branch_name = branch.name if branch else "Showroom"
    branch_code = branch.code if branch else "SHOWROOM"

    # Query real employee counts strictly isolated to the showroom branch
    total_employees = db.query(Employee).filter(
        Employee.branch_id == current_user.branch_id,
    ).count()

    active_employees = db.query(Employee).filter(
        Employee.branch_id == current_user.branch_id,
        Employee.status == "active",
    ).count()

    outdoor_employees = db.query(Employee).filter(
        Employee.branch_id == current_user.branch_id,
        Employee.is_outdoor_marketing_employee == True,
    ).count()

    return DashboardOverviewResponse(
        manager_name=current_user.full_name,
        branch_name=branch_name,
        branch_code=branch_code,
        total_employees=total_employees,
        active_employees=active_employees,
        outdoor_marketing_employees=outdoor_employees,
    )


@router.get("/notifications", summary="Get manager header notifications for pending customer activities, outdoor notes, and gold scheme payment reminders")
def get_manager_notifications(
    current_user: User = Depends(get_current_manager),
    db: Session = Depends(get_db),
):
    today = date.today()

    # 1. Pending Customer Activities awaiting manager review/approval
    pending_act_query = (
        db.query(CustomerActivity)
        .join(Employee, CustomerActivity.employee_id == Employee.id)
        .filter(
            CustomerActivity.branch_id == current_user.branch_id,
            CustomerActivity.approval_status == "PENDING",
        )
    )
    pending_count = pending_act_query.count()
    pending_records = pending_act_query.order_by(CustomerActivity.created_at.desc()).limit(15).all()

    pending_items = [
        {
            "id": a.id,
            "customer_name": (a.customer_name or "").strip() or "Window Shopping Customer",
            "phone_number": a.phone_number or "",
            "employee_id": a.employee_id,
            "employee_name": a.employee.full_name if a.employee else "Assigned Staff",
            "status": "Window Shopping" if (a.status or "").lower() == "walkin" else (a.status or "Window Shopping"),
            "activity_date": a.activity_date.strftime("%d %b %Y") if hasattr(a.activity_date, "strftime") else str(a.activity_date),
            "notes": a.notes or "",
            "created_at": a.created_at.isoformat() if a.created_at else "",
        }
        for a in pending_records
    ]

    # 2. Outdoor Customer Note Reminders due on or before today
    notes_query = (
        db.query(OutdoorMarketingCustomer)
        .join(Employee, OutdoorMarketingCustomer.marketing_employee_id == Employee.id)
        .filter(
            OutdoorMarketingCustomer.branch_id == current_user.branch_id,
            OutdoorMarketingCustomer.note_notification_date.isnot(None),
            OutdoorMarketingCustomer.note_notification_date <= today,
        )
    )
    notes_count = notes_query.count()
    notes_records = notes_query.order_by(OutdoorMarketingCustomer.note_notification_date.desc(), OutdoorMarketingCustomer.id.desc()).limit(15).all()

    note_items = [
        {
            "id": c.id,
            "customer_name": c.customer_name or "Outdoor Customer",
            "phone": c.phone or "",
            "marketing_employee_id": c.marketing_employee_id,
            "employee_name": c.marketing_employee.full_name if c.marketing_employee else "Field Staff",
            "area_name": c.area_name or "",
            "note_notification_date": c.note_notification_date.strftime("%d %b %Y") if hasattr(c.note_notification_date, "strftime") else str(c.note_notification_date),
            "notes": c.notes or "",
            "status": c.status or "Lead",
            "updated_by_manager": getattr(c, "updated_by_manager", False) or False,
        }
        for c in notes_records
    ]

    # 3. Gold Scheme Payment Reminders (due on or before today, or upcoming within next 5 days)
    scheme_query = (
        db.query(SchemePaymentReminder)
        .join(Employee, SchemePaymentReminder.employee_id == Employee.id, isouter=True)
        .filter(
            SchemePaymentReminder.branch_id == current_user.branch_id,
            SchemePaymentReminder.status == "Pending",
            SchemePaymentReminder.due_date <= today + timedelta(days=5),
        )
    )
    scheme_count = scheme_query.count()
    scheme_records = scheme_query.order_by(SchemePaymentReminder.due_date.asc(), SchemePaymentReminder.id.asc()).limit(20).all()

    scheme_items = [
        {
            "id": r.id,
            "customer_name": r.customer_name or "Scheme Customer",
            "phone": r.phone or "",
            "scheme_name": r.scheme_name,
            "installment_no": r.installment_no,
            "total_installments": r.total_installments,
            "amount": r.amount or 0.0,
            "due_date": r.due_date.strftime("%d %b %Y") if hasattr(r.due_date, "strftime") else str(r.due_date),
            "due_date_raw": str(r.due_date),
            "is_due_today": r.due_date <= today,
            "price_notes": r.price_notes or "",
            "status": r.status,
            "employee_name": r.employee.full_name if r.employee else "Showroom Staff",
        }
        for r in scheme_records
    ]

    # 4. Pending Employee Leave Requests
    leaves_query = (
        db.query(EmployeeLeaveRequest)
        .filter(
            EmployeeLeaveRequest.branch_id == current_user.branch_id,
            EmployeeLeaveRequest.status == "PENDING",
        )
    )
    pending_leaves_count = leaves_query.count()

    total_count = pending_count + notes_count + scheme_count + pending_leaves_count

    return {
        "total_count": total_count,
        "pending_activities_count": pending_count,
        "note_reminders_count": notes_count,
        "scheme_reminders_count": scheme_count,
        "pending_leaves_count": pending_leaves_count,
        "pending_activities": pending_items,
        "note_reminders": note_items,
        "scheme_reminders": scheme_items,
    }


@router.post("/notifications/scheme-reminder/{reminder_id}/status", summary="Update gold scheme payment reminder status (e.g. Paid, Dismissed)")
def update_scheme_reminder_status(
    reminder_id: int,
    payload: dict = Body(...),
    current_user: User = Depends(get_current_manager),
    db: Session = Depends(get_db),
):
    r = db.query(SchemePaymentReminder).filter(
        SchemePaymentReminder.id == reminder_id,
        SchemePaymentReminder.branch_id == current_user.branch_id,
    ).first()
    if not r:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Scheme payment reminder not found.")

    new_status = payload.get("status", "Paid")
    r.status = new_status
    db.commit()
    return {"success": True, "message": f"Scheme payment reminder marked as {new_status}."}
