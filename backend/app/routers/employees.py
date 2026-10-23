from typing import List, Optional
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_
from backend.app.core.database import get_db
from backend.app.models.branch import User, Branch
from backend.app.models.employee import Employee
from backend.app.models.activity import CustomerActivity, SchemeRecord, EmployeeFormMedia, AttireRecord, GoogleReview, EmployeeCallLog
from backend.app.models.feedback import CustomerFeedback
from backend.app.schemas.employee import (
    EmployeeCreate,
    EmployeeUpdate,
    EmployeeResponse,
    EmployeeDetailResponse,
    EmployeeCallLogCreate,
    EmployeeCallLogUpdate,
    EmployeeCallLogResponse,
)
from backend.app.dependencies.auth import get_current_manager

router = APIRouter(prefix="/api/v1/employees", tags=["Employees"])


@router.get("", response_model=List[EmployeeResponse], summary="List all employees for current manager's branch")
def list_employees(
    search: Optional[str] = Query(None, description="Search by name, ID, phone, designation"),
    status: Optional[str] = Query(None, description="Filter by status: active, inactive"),
    outdoor_only: Optional[bool] = Query(None, description="Filter only outdoor marketing employees"),
    current_user: User = Depends(get_current_manager),
    db: Session = Depends(get_db),
):
    # Strictly isolated to current manager's showroom branch
    query = db.query(Employee).filter(
        Employee.branch_id == current_user.branch_id,
    )

    if status:
        query = query.filter(Employee.status == status.lower())

    if outdoor_only is not None:
        query = query.filter(Employee.is_outdoor_marketing_employee == outdoor_only)

    if search:
        term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Employee.full_name.ilike(term),
                Employee.employee_code.ilike(term),
                Employee.phone.ilike(term),
                Employee.designation.ilike(term),
                Employee.department.ilike(term),
            )
        )

    return query.order_by(Employee.id.asc()).all()


@router.post("", response_model=EmployeeResponse, status_code=status.HTTP_201_CREATED, summary="Create a new employee in current manager's branch")
def create_employee(
    emp_data: EmployeeCreate,
    current_user: User = Depends(get_current_manager),
    db: Session = Depends(get_db),
):
    branch = db.query(Branch).filter(Branch.id == current_user.branch_id).first()
    code_prefix = f"EMP-{branch.code[:3]}-" if branch else "EMP-"
    
    emp_code = (emp_data.employee_code or "").strip()
    if not emp_code:
        # Auto-generate next employee code for this branch
        count = db.query(Employee).filter(Employee.branch_id == current_user.branch_id).count()
        emp_code = f"{code_prefix}{count + 1:03d}"
        # Ensure uniqueness
        while db.query(Employee).filter(Employee.branch_id == current_user.branch_id, Employee.employee_code == emp_code).first():
            count += 1
            emp_code = f"{code_prefix}{count + 1:03d}"
    else:
        # Enforce unique employee_code within the showroom branch
        existing = db.query(Employee).filter(
            Employee.branch_id == current_user.branch_id,
            Employee.employee_code == emp_code,
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Employee code '{emp_code}' already exists in your showroom.",
            )

    is_outdoor = bool(
        emp_data.is_outdoor_marketing_employee or 
        (emp_data.department and emp_data.department.strip() == "Outdoor Marketing")
    )
    dept = (emp_data.department or "Sales Department").strip()

    employee = Employee(
        branch_id=current_user.branch_id,  # Strictly server-enforced
        manager_id=current_user.id,        # Manager who created/assigned
        employee_code=emp_code,
        full_name=emp_data.full_name.strip(),
        phone=(emp_data.phone or "").strip(),
        email=emp_data.email.strip() if emp_data.email else None,
        designation=(emp_data.designation or "Sales Executive").strip(),
        department=dept,
        date_of_joining=emp_data.date_of_joining or date.today(),
        status=emp_data.status or "active",
        is_outdoor_marketing_employee=is_outdoor,
        profile_photo_url=emp_data.profile_photo_url,
        notes=emp_data.notes,
    )
    try:
        db.add(employee)
        db.commit()
        db.refresh(employee)
        return employee
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create employee: {str(e)}",
        )


@router.get("/{employee_id}", response_model=EmployeeDetailResponse, summary="Get employee details and calculated activity metrics")
def get_employee(
    employee_id: int,
    current_user: User = Depends(get_current_manager),
    db: Session = Depends(get_db),
):
    employee = db.query(Employee).filter(
        Employee.id == employee_id,
        Employee.branch_id == current_user.branch_id,
    ).first()

    if not employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee not found in your showroom branch.",
        )

    # Calculate real statistics from database records
    all_cust = db.query(CustomerActivity).filter(
        CustomerActivity.employee_id == employee.id,
        CustomerActivity.branch_id == current_user.branch_id,
    ).all()
    customers_attended = sum(c.customers_count or 1 for c in all_cust)

    def get_closed_count(c: CustomerActivity) -> int:
        if c.breakdown:
            parts = c.breakdown.split('|')
            closed_parts = [p for p in parts if ": closed" in p.lower() or p.strip().lower() == "closed"]
            if closed_parts:
                return len(closed_parts)
        return c.customers_count or 1 if c.status == "Closed" else 0

    customers_closed = sum(get_closed_count(c) for c in all_cust)

    # Count schemes from SchemeRecord and CustomerActivity breakdown
    schemes = db.query(SchemeRecord).filter(
        SchemeRecord.employee_id == employee.id,
        SchemeRecord.branch_id == current_user.branch_id,
    ).all()
    schemes_count_records = sum(s.customers_count or 1 for s in schemes)

    reviews = db.query(GoogleReview).filter(
        GoogleReview.employee_id == employee.id,
        GoogleReview.branch_id == current_user.branch_id,
    ).all()
    reviews_count_records = sum(r.customers_count or 1 for r in reviews)

    direct_feedbacks = db.query(CustomerFeedback).filter(
        CustomerFeedback.employee_id == employee.id,
        CustomerFeedback.branch_id == current_user.branch_id,
    ).all()
    feedbacks_count_records = len(direct_feedbacks)

    # Also inspect customer activity breakdowns directly
    import json
    schemes_from_breakdown = 0
    reviews_from_breakdown = 0
    feedbacks_from_breakdown = 0
    for c in all_cust:
        if c.breakdown:
            try:
                c_items = json.loads(c.breakdown)
                if isinstance(c_items, list):
                    for item in c_items:
                        if item.get("has_scheme") or item.get("scheme_name"):
                            schemes_from_breakdown += 1
                        if item.get("has_google_review") or item.get("google_review_text"):
                            reviews_from_breakdown += 1
                        if item.get("has_customer_feedback") or item.get("feedback_text"):
                            feedbacks_from_breakdown += 1
            except Exception:
                pass

    schemes_closed = max(schemes_count_records, schemes_from_breakdown)

    form_media_count = db.query(EmployeeFormMedia).filter(
        EmployeeFormMedia.employee_id == employee.id,
        EmployeeFormMedia.branch_id == current_user.branch_id,
    ).count()

    attire_records_count = db.query(AttireRecord).filter(
        AttireRecord.employee_id == employee.id,
        AttireRecord.branch_id == current_user.branch_id,
    ).count()

    google_reviews_count = max(reviews_count_records, reviews_from_breakdown)
    average_rating = round(sum(r.rating for r in reviews) / len(reviews), 1) if len(reviews) > 0 else 5.0

    customer_feedbacks_count = max(feedbacks_count_records, feedbacks_from_breakdown)
    customer_feedbacks_avg_rating = (
        round(sum(f.rating for f in direct_feedbacks) / len(direct_feedbacks), 1)
        if direct_feedbacks
        else 5.0
    )

    calls = db.query(EmployeeCallLog).filter(
        EmployeeCallLog.employee_id == employee.id,
        EmployeeCallLog.branch_id == current_user.branch_id,
    ).all()
    calls_count = len(calls)
    calls_done_count = sum(1 for c in calls if c.call_status == "Done")
    calls_pending_count = sum(1 for c in calls if c.call_status == "Pending")

    return EmployeeDetailResponse(
        id=employee.id,
        branch_id=employee.branch_id,
        manager_id=employee.manager_id,
        employee_code=employee.employee_code,
        full_name=employee.full_name,
        phone=employee.phone,
        email=employee.email,
        designation=employee.designation,
        department=employee.department,
        date_of_joining=employee.date_of_joining,
        status=employee.status,
        is_outdoor_marketing_employee=employee.is_outdoor_marketing_employee,
        profile_photo_url=employee.profile_photo_url,
        notes=employee.notes,
        created_at=employee.created_at,
        updated_at=employee.updated_at,
        customers_attended_count=customers_attended,
        customers_closed_count=customers_closed,
        schemes_closed_count=schemes_closed,
        form_media_count=form_media_count,
        attire_records_count=attire_records_count,
        google_reviews_count=google_reviews_count,
        average_rating=average_rating,
        customer_feedbacks_count=customer_feedbacks_count,
        customer_feedbacks_avg_rating=customer_feedbacks_avg_rating,
        calls_count=calls_count,
        calls_done_count=calls_done_count,
        calls_pending_count=calls_pending_count,
    )


@router.put("/{employee_id}", response_model=EmployeeResponse, summary="Update employee information")
def update_employee(
    employee_id: int,
    update_data: EmployeeUpdate,
    current_user: User = Depends(get_current_manager),
    db: Session = Depends(get_db),
):
    employee = db.query(Employee).filter(
        Employee.id == employee_id,
        Employee.branch_id == current_user.branch_id,
    ).first()

    if not employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee not found in your showroom branch.",
        )

    # If code changed, ensure uniqueness within branch
    if update_data.employee_code and update_data.employee_code.strip() != employee.employee_code:
        existing = db.query(Employee).filter(
            Employee.branch_id == current_user.branch_id,
            Employee.employee_code == update_data.employee_code.strip(),
            Employee.id != employee_id,
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Employee code '{update_data.employee_code}' is already taken in your showroom.",
            )
        employee.employee_code = update_data.employee_code.strip()

    if update_data.full_name is not None:
        employee.full_name = update_data.full_name.strip()
    if update_data.phone is not None:
        employee.phone = update_data.phone.strip()
    if update_data.email is not None:
        employee.email = update_data.email.strip() if update_data.email else None
    if update_data.designation is not None:
        employee.designation = update_data.designation.strip()
    if update_data.department is not None:
        dept = update_data.department.strip()
        employee.department = dept
        if dept == "Outdoor Marketing":
            employee.is_outdoor_marketing_employee = True
        elif dept in ["Sales Department", "Marketing"] and update_data.is_outdoor_marketing_employee is None:
            employee.is_outdoor_marketing_employee = False
    if update_data.date_of_joining is not None:
        employee.date_of_joining = update_data.date_of_joining
    if update_data.status is not None:
        employee.status = update_data.status
    if update_data.is_outdoor_marketing_employee is not None:
        employee.is_outdoor_marketing_employee = update_data.is_outdoor_marketing_employee
    if update_data.profile_photo_url is not None:
        employee.profile_photo_url = update_data.profile_photo_url
    if update_data.notes is not None:
        employee.notes = update_data.notes

    try:
        db.commit()
        db.refresh(employee)
        return employee
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update employee: {str(e)}",
        )


@router.delete("/{employee_id}", status_code=status.HTTP_200_OK, summary="Delete employee")
def delete_employee(
    employee_id: int,
    current_user: User = Depends(get_current_manager),
    db: Session = Depends(get_db),
):
    employee = db.query(Employee).filter(
        Employee.id == employee_id,
        Employee.branch_id == current_user.branch_id,
    ).first()

    if not employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee not found in your showroom branch.",
        )

    try:
        db.delete(employee)
        db.commit()
        return {"message": "Employee deleted successfully."}
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete employee: {str(e)}",
        )


# =========================================================================
# Employee Customer Call Logs (Calls Done & Pending)
# =========================================================================
@router.get("/{employee_id}/calls", response_model=List[EmployeeCallLogResponse], summary="Get employee customer call logs")
def list_employee_calls(
    employee_id: int,
    status: Optional[str] = Query(None, description="Filter: all, Done, Pending"),
    search: Optional[str] = Query(None, description="Search by customer name or phone"),
    current_user: User = Depends(get_current_manager),
    db: Session = Depends(get_db),
):
    emp = db.query(Employee).filter(
        Employee.id == employee_id,
        Employee.branch_id == current_user.branch_id,
    ).first()
    if not emp:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found.")

    query = db.query(EmployeeCallLog).filter(
        EmployeeCallLog.employee_id == employee_id,
        EmployeeCallLog.branch_id == current_user.branch_id,
    )

    if status and status.lower() != "all":
        query = query.filter(EmployeeCallLog.call_status.ilike(status.strip()))

    if search and search.strip():
        s = f"%{search.strip().lower()}%"
        query = query.filter(
            or_(
                EmployeeCallLog.customer_name.ilike(s),
                EmployeeCallLog.phone_number.ilike(s),
                EmployeeCallLog.notes.ilike(s),
                EmployeeCallLog.purpose.ilike(s),
            )
        )

    records = query.order_by(EmployeeCallLog.call_date.desc(), EmployeeCallLog.id.desc()).all()
    return [
        EmployeeCallLogResponse(
            id=r.id,
            branch_id=r.branch_id,
            employee_id=r.employee_id,
            employee_name=emp.full_name,
            customer_name=r.customer_name,
            phone_number=r.phone_number,
            customers_count=r.customers_count or 1,
            call_status=r.call_status,
            call_date=r.call_date,
            call_time=r.call_time,
            purpose=r.purpose,
            notes=r.notes,
            created_at=r.created_at,
            updated_at=r.updated_at,
        )
        for r in records
    ]


@router.post("/{employee_id}/calls", response_model=EmployeeCallLogResponse, summary="Create a customer call log for an employee")
def create_employee_call(
    employee_id: int,
    call_in: EmployeeCallLogCreate,
    current_user: User = Depends(get_current_manager),
    db: Session = Depends(get_db),
):
    emp = db.query(Employee).filter(
        Employee.id == employee_id,
        Employee.branch_id == current_user.branch_id,
    ).first()
    if not emp:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found.")

    st = "Done" if call_in.call_status.strip().lower() in ["done", "completed"] else "Pending"
    call_dt = call_in.call_date
    if isinstance(call_dt, str):
        try:
            from datetime import datetime as dt
            call_dt = dt.strptime(call_dt, "%Y-%m-%d").date()
        except Exception:
            call_dt = date.today()
    elif not call_dt:
        call_dt = date.today()

    log = EmployeeCallLog(
        branch_id=current_user.branch_id,
        employee_id=emp.id,
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
        employee_name=emp.full_name,
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


@router.put("/{employee_id}/calls/{call_id}", response_model=EmployeeCallLogResponse, summary="Update a customer call log")
def update_employee_call(
    employee_id: int,
    call_id: int,
    call_in: EmployeeCallLogUpdate,
    current_user: User = Depends(get_current_manager),
    db: Session = Depends(get_db),
):
    log = db.query(EmployeeCallLog).filter(
        EmployeeCallLog.id == call_id,
        EmployeeCallLog.employee_id == employee_id,
        EmployeeCallLog.branch_id == current_user.branch_id,
    ).first()
    if not log:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Call log not found.")

    if call_in.customer_name is not None:
        log.customer_name = call_in.customer_name.strip()
    if call_in.phone_number is not None:
        log.phone_number = call_in.phone_number.strip()
    if call_in.customers_count is not None:
        log.customers_count = max(1, call_in.customers_count)
    if call_in.call_status is not None:
        log.call_status = "Done" if call_in.call_status.strip().lower() in ["done", "completed"] else "Pending"
    if call_in.call_date is not None:
        call_dt = call_in.call_date
        if isinstance(call_dt, str):
            try:
                from datetime import datetime as dt
                call_dt = dt.strptime(call_dt, "%Y-%m-%d").date()
            except Exception:
                call_dt = date.today()
        log.call_date = call_dt
    if call_in.call_time is not None:
        log.call_time = call_in.call_time
    if call_in.purpose is not None:
        log.purpose = call_in.purpose
    if call_in.notes is not None:
        log.notes = call_in.notes

    db.commit()
    db.refresh(log)

    emp = db.query(Employee).filter(Employee.id == employee_id).first()
    return EmployeeCallLogResponse(
        id=log.id,
        branch_id=log.branch_id,
        employee_id=log.employee_id,
        employee_name=emp.full_name if emp else "",
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


@router.patch("/{employee_id}/calls/{call_id}/toggle", response_model=EmployeeCallLogResponse, summary="Toggle call status between Done and Pending")
def toggle_employee_call_status(
    employee_id: int,
    call_id: int,
    current_user: User = Depends(get_current_manager),
    db: Session = Depends(get_db),
):
    log = db.query(EmployeeCallLog).filter(
        EmployeeCallLog.id == call_id,
        EmployeeCallLog.employee_id == employee_id,
        EmployeeCallLog.branch_id == current_user.branch_id,
    ).first()
    if not log:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Call log not found.")

    log.call_status = "Pending" if log.call_status == "Done" else "Done"
    db.commit()
    db.refresh(log)

    emp = db.query(Employee).filter(Employee.id == employee_id).first()
    return EmployeeCallLogResponse(
        id=log.id,
        branch_id=log.branch_id,
        employee_id=log.employee_id,
        employee_name=emp.full_name if emp else "",
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


@router.delete("/{employee_id}/calls/{call_id}", status_code=status.HTTP_200_OK, summary="Delete a customer call log")
def delete_employee_call(
    employee_id: int,
    call_id: int,
    current_user: User = Depends(get_current_manager),
    db: Session = Depends(get_db),
):
    log = db.query(EmployeeCallLog).filter(
        EmployeeCallLog.id == call_id,
        EmployeeCallLog.employee_id == employee_id,
        EmployeeCallLog.branch_id == current_user.branch_id,
    ).first()
    if not log:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Call log not found.")

    db.delete(log)
    db.commit()
    return {"message": "Call log deleted successfully."}

