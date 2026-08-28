from typing import List, Optional
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_
from backend.app.core.database import get_db
from backend.app.models.branch import User, Branch
from backend.app.models.employee import Employee
from backend.app.models.activity import CustomerActivity, SchemeRecord, EmployeeFormMedia, AttireRecord, GoogleReview
from backend.app.schemas.employee import (
    EmployeeCreate,
    EmployeeUpdate,
    EmployeeResponse,
    EmployeeDetailResponse,
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
    db.add(employee)
    db.commit()
    db.refresh(employee)
    return employee


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

    schemes = db.query(SchemeRecord).filter(
        SchemeRecord.employee_id == employee.id,
        SchemeRecord.branch_id == current_user.branch_id,
    ).all()
    schemes_closed = sum(s.customers_count or 1 for s in schemes)

    form_media_count = db.query(EmployeeFormMedia).filter(
        EmployeeFormMedia.employee_id == employee.id,
        EmployeeFormMedia.branch_id == current_user.branch_id,
    ).count()

    attire_records_count = db.query(AttireRecord).filter(
        AttireRecord.employee_id == employee.id,
        AttireRecord.branch_id == current_user.branch_id,
    ).count()

    reviews = db.query(GoogleReview).filter(
        GoogleReview.employee_id == employee.id,
        GoogleReview.branch_id == current_user.branch_id,
    ).all()
    google_reviews_count = sum(r.customers_count or 1 for r in reviews)
    average_rating = round(sum(r.rating for r in reviews) / len(reviews), 1) if len(reviews) > 0 else 0.0

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

    db.commit()
    db.refresh(employee)
    return employee


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

    db.delete(employee)
    db.commit()
    return {"message": "Employee deleted successfully."}
