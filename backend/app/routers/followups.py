from datetime import datetime, timezone, date
from typing import Optional
from fastapi import APIRouter, Depends, Query, Request, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.models.branch import Admin
from backend.app.models.customer import FollowUp, Customer
from backend.app.schemas.followup import (
    FollowUpCreate,
    FollowUpActionRequest,
    FollowUpResponse,
    FollowUpListResponse,
)
from backend.app.repositories.followup_repo import FollowUpRepository
from backend.app.repositories.customer_repo import CustomerRepository
from backend.app.repositories.employee_repo import EmployeeRepository
from backend.app.repositories.audit_repo import AuditRepository
from backend.app.dependencies.auth import get_current_admin

router = APIRouter(prefix="/api/v1/followups", tags=["Follow-ups"])


@router.get("", response_model=FollowUpListResponse, summary="List branch follow-ups with categorization")
def list_followups(
    filter_type: str = Query("all", description="all, today, overdue, upcoming, pending, completed"),
    employee_id: Optional[int] = Query(None),
    priority: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    fu_repo = FollowUpRepository(db)
    followups = fu_repo.list_followups(
        branch_id=current_admin.branch_id,
        filter_type=filter_type,
        employee_id=employee_id,
        priority=priority,
        search=search,
    )
    counts = fu_repo.get_counts(current_admin.branch_id)

    items = [
        FollowUpResponse(
            id=f.id,
            branch_id=f.branch_id,
            customer_id=f.customer_id,
            customer_name=f.customer.full_name if f.customer else "N/A",
            customer_phone=f.customer.phone if f.customer else "N/A",
            customer_code=f.customer.customer_code if f.customer else "N/A",
            customer_type=f.customer.customer_type if f.customer else "New",
            customer_status=f.customer.status if f.customer else "New",
            interested_category=f.customer.interested_category if f.customer else "Gold",
            employee_id=f.employee_id,
            employee_name=f.employee.full_name if f.employee else "N/A",
            employee_code=f.employee.employee_code if f.employee else "N/A",
            scheduled_date=f.scheduled_date,
            status=f.status,
            priority=f.priority,
            notes=f.notes,
            completed_at=f.completed_at,
            created_at=f.created_at,
            updated_at=f.updated_at,
        )
        for f in followups
    ]

    return FollowUpListResponse(
        items=items,
        total=len(items),
        pending_count=counts["pending_count"],
        overdue_count=counts["overdue_count"],
        today_count=counts["today_count"],
        upcoming_count=counts["upcoming_count"],
    )


@router.post("/{followup_id}/action", response_model=FollowUpResponse, summary="Perform action on follow-up (complete, reschedule, reassign)")
def perform_followup_action(
    followup_id: int,
    action_data: FollowUpActionRequest,
    request: Request,
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    fu_repo = FollowUpRepository(db)
    cust_repo = CustomerRepository(db)
    emp_repo = EmployeeRepository(db)
    audit_repo = AuditRepository(db)

    fu = fu_repo.get_by_id_and_branch(followup_id, current_admin.branch_id)
    if not fu:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Follow-up not found in your branch.")

    client_ip = request.client.host if request.client else None
    action = action_data.action.lower()

    if action == "complete":
        fu.status = "Completed"
        fu.completed_at = datetime.now(timezone.utc)
        if action_data.notes:
            fu.notes = (fu.notes or "") + f" | Completed Note: {action_data.notes}"
        if action_data.new_customer_status and fu.customer:
            fu.customer.status = action_data.new_customer_status
            fu.customer.last_contact_date = date.today()
            cust_repo.update(fu.customer)

        audit_repo.log(
            action="Follow-up Completed",
            entity="FollowUp",
            branch_id=current_admin.branch_id,
            admin_id=current_admin.id,
            admin_username=current_admin.username,
            entity_id=str(fu.id),
            ip_address=client_ip,
            details=f"Follow-up completed for customer {fu.customer.full_name if fu.customer else 'N/A'}",
        )

    elif action == "reschedule":
        if not action_data.rescheduled_date:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Rescheduled date is required.")
        old_date = fu.scheduled_date
        fu.scheduled_date = action_data.rescheduled_date
        fu.status = "Pending"
        if action_data.notes:
            fu.notes = (fu.notes or "") + f" | Rescheduled from {old_date}: {action_data.notes}"
        if fu.customer:
            fu.customer.next_followup_date = action_data.rescheduled_date
            cust_repo.update(fu.customer)

        audit_repo.log(
            action="Follow-up Rescheduled",
            entity="FollowUp",
            branch_id=current_admin.branch_id,
            admin_id=current_admin.id,
            admin_username=current_admin.username,
            entity_id=str(fu.id),
            ip_address=client_ip,
            details=f"Follow-up rescheduled to {action_data.rescheduled_date}",
        )

    elif action == "reassign":
        if not action_data.new_employee_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="New employee ID is required.")
        new_emp = emp_repo.get_by_id_and_branch(action_data.new_employee_id, current_admin.branch_id)
        if not new_emp:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="New assigned employee not found in your branch.")
        fu.employee_id = new_emp.id
        if fu.customer:
            fu.customer.assigned_employee_id = new_emp.id
            cust_repo.update(fu.customer)

        audit_repo.log(
            action="Follow-up Reassigned",
            entity="FollowUp",
            branch_id=current_admin.branch_id,
            admin_id=current_admin.id,
            admin_username=current_admin.username,
            entity_id=str(fu.id),
            ip_address=client_ip,
            details=f"Follow-up reassigned to employee {new_emp.full_name}",
        )

    elif action == "cancel":
        fu.status = "Cancelled"
        audit_repo.log(
            action="Follow-up Cancelled",
            entity="FollowUp",
            branch_id=current_admin.branch_id,
            admin_id=current_admin.id,
            admin_username=current_admin.username,
            entity_id=str(fu.id),
            ip_address=client_ip,
            details=f"Follow-up cancelled for customer {fu.customer.full_name if fu.customer else 'N/A'}",
        )

    updated = fu_repo.update(fu)

    return FollowUpResponse(
        id=updated.id,
        branch_id=updated.branch_id,
        customer_id=updated.customer_id,
        customer_name=updated.customer.full_name if updated.customer else "N/A",
        customer_phone=updated.customer.phone if updated.customer else "N/A",
        customer_code=updated.customer.customer_code if updated.customer else "N/A",
        customer_type=updated.customer.customer_type if updated.customer else "New",
        customer_status=updated.customer.status if updated.customer else "New",
        interested_category=updated.customer.interested_category if updated.customer else "Gold",
        employee_id=updated.employee_id,
        employee_name=updated.employee.full_name if updated.employee else "N/A",
        employee_code=updated.employee.employee_code if updated.employee else "N/A",
        scheduled_date=updated.scheduled_date,
        status=updated.status,
        priority=updated.priority,
        notes=updated.notes,
        completed_at=updated.completed_at,
        created_at=updated.created_at,
        updated_at=updated.updated_at,
    )
