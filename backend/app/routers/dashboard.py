from datetime import date
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.models.branch import User, Branch
from backend.app.models.employee import Employee
from backend.app.models.activity import CustomerActivity
from backend.app.models.outdoor_marketing import OutdoorMarketingCustomer
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

    # Query real employee counts strictly isolated to the showroom branch (excluding managers)
    total_employees = db.query(Employee).filter(
        Employee.branch_id == current_user.branch_id,
        ~Employee.designation.ilike("%manager%"),
    ).count()

    active_employees = db.query(Employee).filter(
        Employee.branch_id == current_user.branch_id,
        Employee.status == "active",
        ~Employee.designation.ilike("%manager%"),
    ).count()

    outdoor_employees = db.query(Employee).filter(
        Employee.branch_id == current_user.branch_id,
        Employee.is_outdoor_marketing_employee == True,
        ~Employee.designation.ilike("%manager%"),
    ).count()

    return DashboardOverviewResponse(
        manager_name=current_user.full_name,
        branch_name=branch_name,
        branch_code=branch_code,
        total_employees=total_employees,
        active_employees=active_employees,
        outdoor_marketing_employees=outdoor_employees,
    )


@router.get("/notifications", summary="Get manager header notifications for pending customer activities and outdoor customer notes")
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
            "customer_name": a.customer_name or "Walk-in Customer",
            "phone_number": a.phone_number or "",
            "employee_id": a.employee_id,
            "employee_name": a.employee.full_name if a.employee else "Assigned Staff",
            "status": a.status or "Walkin",
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

    total_count = pending_count + notes_count

    return {
        "total_count": total_count,
        "pending_activities_count": pending_count,
        "note_reminders_count": notes_count,
        "pending_activities": pending_items,
        "note_reminders": note_items,
    }
