from typing import List, Optional
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_
from backend.app.core.database import get_db
from backend.app.models.branch import User
from backend.app.models.employee import Employee
from backend.app.models.activity import SchemeRecord
from backend.app.schemas.activity import (
    SchemeRecordCreate,
    SchemeRecordUpdate,
    SchemeRecordResponse,
)
from backend.app.dependencies.auth import get_current_manager

router = APIRouter(prefix="/api/v1/schemes", tags=["Schemes Closed"])


@router.get("", response_model=List[SchemeRecordResponse], summary="List schemes closed for current manager's branch")
def list_schemes(
    employee_id: Optional[int] = Query(None, description="Filter by employee ID"),
    search: Optional[str] = Query(None, description="Search by customer, scheme name, or notes"),
    current_user: User = Depends(get_current_manager),
    db: Session = Depends(get_db),
):
    query = (
        db.query(SchemeRecord)
        .join(Employee, SchemeRecord.employee_id == Employee.id)
        .filter(
            SchemeRecord.branch_id == current_user.branch_id,
        )
    )

    if employee_id:
        query = query.filter(SchemeRecord.employee_id == employee_id)

    if search:
        term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                SchemeRecord.customer_name.ilike(term),
                SchemeRecord.scheme_name.ilike(term),
                SchemeRecord.notes.ilike(term),
            )
        )

    records = query.order_by(SchemeRecord.record_date.desc(), SchemeRecord.id.desc()).all()

    result = []
    for r in records:
        emp_name = r.employee.full_name if r.employee else None
        res_item = SchemeRecordResponse(
            id=r.id,
            branch_id=r.branch_id,
            employee_id=r.employee_id,
            employee_name=emp_name,
            customers_count=getattr(r, 'customers_count', 1) or 1,
            customer_name=r.customer_name or "Customer",
            scheme_name=r.scheme_name,
            amount=r.amount,
            record_date=r.record_date,
            notes=r.notes,
            created_at=r.created_at,
            updated_at=r.updated_at,
        )
        result.append(res_item)

    return result


@router.post("", response_model=SchemeRecordResponse, status_code=status.HTTP_201_CREATED, summary="Record a scheme closed by an employee")
def create_scheme(
    scheme_data: SchemeRecordCreate,
    current_user: User = Depends(get_current_manager),
    db: Session = Depends(get_db),
):
    employee = db.query(Employee).filter(
        Employee.id == scheme_data.employee_id,
        Employee.branch_id == current_user.branch_id,
    ).first()
    if not employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assigned employee not found in your showroom branch.",
        )

    record = SchemeRecord(
        branch_id=current_user.branch_id,
        employee_id=employee.id,
        customers_count=scheme_data.customers_count or 1,
        customer_name=(scheme_data.customer_name or "Customer").strip(),
        scheme_name=scheme_data.scheme_name.strip(),
        amount=scheme_data.amount or 0.0,
        record_date=scheme_data.record_date or date.today(),
        notes=scheme_data.notes,
    )
    try:
        db.add(record)
        db.commit()
        db.refresh(record)
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create scheme record: {str(e)}"
        )

    return SchemeRecordResponse(
        id=record.id,
        branch_id=record.branch_id,
        employee_id=record.employee_id,
        employee_name=employee.full_name,
        customers_count=record.customers_count,
        customer_name=record.customer_name,
        scheme_name=record.scheme_name,
        amount=record.amount,
        record_date=record.record_date,
        notes=record.notes,
        created_at=record.created_at,
        updated_at=record.updated_at,
    )


@router.put("/{record_id}", response_model=SchemeRecordResponse, summary="Update a scheme record")
@router.patch("/{record_id}", response_model=SchemeRecordResponse, summary="Patch a scheme record")
def update_scheme(
    record_id: int,
    update_data: SchemeRecordUpdate,
    current_user: User = Depends(get_current_manager),
    db: Session = Depends(get_db),
):
    record = (
        db.query(SchemeRecord)
        .join(Employee, SchemeRecord.employee_id == Employee.id)
        .filter(
            SchemeRecord.id == record_id,
            SchemeRecord.branch_id == current_user.branch_id,
        )
        .first()
    )
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Scheme record not found.")

    if update_data.customers_count is not None:
        record.customers_count = update_data.customers_count
    if update_data.customer_name is not None:
        record.customer_name = update_data.customer_name.strip()
    if update_data.scheme_name is not None:
        record.scheme_name = update_data.scheme_name.strip()
    if update_data.amount is not None:
        record.amount = update_data.amount
    if update_data.record_date is not None:
        record.record_date = update_data.record_date
    if update_data.notes is not None:
        record.notes = update_data.notes

    try:
        db.commit()
        db.refresh(record)
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update scheme record: {str(e)}"
        )

    emp_name = record.employee.full_name if record.employee else None
    return SchemeRecordResponse(
        id=record.id,
        branch_id=record.branch_id,
        employee_id=record.employee_id,
        employee_name=emp_name,
        customers_count=getattr(record, 'customers_count', 1) or 1,
        customer_name=record.customer_name,
        scheme_name=record.scheme_name,
        amount=record.amount,
        record_date=record.record_date,
        notes=record.notes,
        created_at=record.created_at,
        updated_at=record.updated_at,
    )


@router.delete("/{record_id}", status_code=status.HTTP_200_OK, summary="Delete a scheme record")
def delete_scheme(
    record_id: int,
    current_user: User = Depends(get_current_manager),
    db: Session = Depends(get_db),
):
    record = (
        db.query(SchemeRecord)
        .join(Employee, SchemeRecord.employee_id == Employee.id)
        .filter(
            SchemeRecord.id == record_id,
            SchemeRecord.branch_id == current_user.branch_id,
        )
        .first()
    )
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Record not found.")

    try:
        db.delete(record)
        db.commit()
        return {"message": "Scheme record deleted successfully."}
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete scheme record: {str(e)}"
        )
