from typing import List, Optional
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_
from backend.app.core.database import get_db
from backend.app.models.branch import User
from backend.app.models.employee import Employee
from backend.app.models.activity import CustomerActivity
from backend.app.schemas.activity import (
    CustomerActivityCreate,
    CustomerActivityUpdate,
    CustomerActivityResponse,
)
from backend.app.dependencies.auth import get_current_manager

router = APIRouter(prefix="/api/v1/customers", tags=["Customer Activity"])


@router.get("", response_model=List[CustomerActivityResponse], summary="List customer activity logs for current manager's branch")
def list_customer_activities(
    employee_id: Optional[int] = Query(None, description="Filter by employee ID"),
    status: Optional[str] = Query(None, description="Filter by status: Attended, Closed, Follow-up, Lost"),
    search: Optional[str] = Query(None, description="Search by customer name or phone"),
    current_user: User = Depends(get_current_manager),
    db: Session = Depends(get_db),
):
    query = (
        db.query(CustomerActivity)
        .join(Employee, CustomerActivity.employee_id == Employee.id)
        .filter(
            CustomerActivity.branch_id == current_user.branch_id,
        )
    )

    if employee_id:
        query = query.filter(CustomerActivity.employee_id == employee_id)

    if status:
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

    result = []
    for r in records:
        emp_name = r.employee.full_name if r.employee else None
        emp_code = r.employee.employee_code if r.employee else None
        b_name = r.branch.name if r.branch else None
        b_code = r.branch.code if r.branch else None
        res_item = CustomerActivityResponse(
            id=r.id,
            branch_id=r.branch_id,
            branch_code=b_code,
            branch_name=b_name,
            employee_id=r.employee_id,
            employee_name=emp_name,
            employee_code=emp_code,
            customers_count=getattr(r, 'customers_count', 1) or 1,
            breakdown=getattr(r, 'breakdown', None),
            customer_name=r.customer_name or "Customer Interaction",
            phone_number=r.phone_number or "",
            dob=getattr(r, 'dob', None),
            anniversary=getattr(r, 'anniversary', None),
            product_value=getattr(r, 'product_value', 0.0) or 0.0,
            activity_date=r.activity_date,
            status=r.status,
            notes=r.notes,
            created_at=r.created_at,
            updated_at=r.updated_at,
        )
        result.append(res_item)

    return result


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
    )
    try:
        db.add(record)
        db.commit()
        db.refresh(record)
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to record customer activity: {str(e)}",
        )

    b_name = record.branch.name if record.branch else None
    b_code = record.branch.code if record.branch else None

    return CustomerActivityResponse(
        id=record.id,
        branch_id=record.branch_id,
        branch_code=b_code,
        branch_name=b_name,
        employee_id=record.employee_id,
        employee_name=employee.full_name,
        employee_code=employee.employee_code,
        customers_count=record.customers_count,
        breakdown=record.breakdown,
        customer_name=record.customer_name,
        phone_number=record.phone_number,
        dob=record.dob,
        anniversary=record.anniversary,
        product_value=record.product_value or 0.0,
        activity_date=record.activity_date,
        status=record.status,
        notes=record.notes,
        created_at=record.created_at,
        updated_at=record.updated_at,
    )


@router.put("/{record_id}", response_model=CustomerActivityResponse, summary="Update a customer activity record")
@router.patch("/{record_id}", response_model=CustomerActivityResponse, summary="Patch a customer activity record")
def update_customer_activity(
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

    try:
        db.commit()
        db.refresh(record)
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update customer activity: {str(e)}",
        )

    emp_name = record.employee.full_name if record.employee else None
    emp_code = record.employee.employee_code if record.employee else None
    b_name = record.branch.name if record.branch else None
    b_code = record.branch.code if record.branch else None

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
        notes=record.notes,
        created_at=record.created_at,
        updated_at=record.updated_at,
    )


@router.delete("/{record_id}", status_code=status.HTTP_200_OK, summary="Delete a customer activity record")
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
