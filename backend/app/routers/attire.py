from typing import List, Optional
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_
from backend.app.core.database import get_db
from backend.app.models.branch import User
from backend.app.models.employee import Employee
from backend.app.models.activity import AttireRecord
from backend.app.schemas.activity import (
    AttireRecordCreate,
    AttireRecordUpdate,
    AttireRecordResponse,
)
from backend.app.dependencies.auth import get_current_manager

router = APIRouter(prefix="/api/v1/attire", tags=["Attire Compliance"])


@router.get("", response_model=List[AttireRecordResponse], summary="List attire compliance records for current manager's branch")
def list_attire_records(
    employee_id: Optional[int] = Query(None, description="Filter by employee ID"),
    status: Optional[str] = Query(None, description="Filter by status: Proper, Not Proper, Needs Attention"),
    search: Optional[str] = Query(None, description="Search by employee name or notes"),
    current_user: User = Depends(get_current_manager),
    db: Session = Depends(get_db),
):
    query = (
        db.query(AttireRecord)
        .join(Employee, AttireRecord.employee_id == Employee.id)
        .filter(
            AttireRecord.branch_id == current_user.branch_id,
        )
    )

    if employee_id:
        query = query.filter(AttireRecord.employee_id == employee_id)

    if status:
        query = query.filter(AttireRecord.status == status)

    if search:
        term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                AttireRecord.notes.ilike(term),
                Employee.full_name.ilike(term),
                Employee.employee_code.ilike(term),
            )
        )

    records = query.order_by(AttireRecord.check_date.desc(), AttireRecord.id.desc()).all()

    result = []
    for r in records:
        emp_name = r.employee.full_name if r.employee else None
        res_item = AttireRecordResponse(
            id=r.id,
            branch_id=r.branch_id,
            employee_id=r.employee_id,
            employee_name=emp_name,
            check_date=r.check_date,
            status=r.status,
            notes=r.notes,
            image_url=r.image_url,
            created_at=r.created_at,
        )
        result.append(res_item)

    return result


@router.post("", response_model=AttireRecordResponse, status_code=status.HTTP_201_CREATED, summary="Log employee attire compliance")
def create_attire_record(
    attire_data: AttireRecordCreate,
    current_user: User = Depends(get_current_manager),
    db: Session = Depends(get_db),
):
    employee = db.query(Employee).filter(
        Employee.id == attire_data.employee_id,
        Employee.branch_id == current_user.branch_id,
    ).first()
    if not employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee not found in your showroom branch.",
        )

    record = AttireRecord(
        branch_id=current_user.branch_id,
        employee_id=employee.id,
        check_date=attire_data.check_date or date.today(),
        status=attire_data.status or "Proper",
        notes=attire_data.notes,
        image_url=attire_data.image_url,
    )
    try:
        db.add(record)
        db.commit()
        db.refresh(record)
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create attire record: {str(e)}",
        )

    return AttireRecordResponse(
        id=record.id,
        branch_id=record.branch_id,
        employee_id=record.employee_id,
        employee_name=employee.full_name,
        check_date=record.check_date,
        status=record.status,
        notes=record.notes,
        image_url=record.image_url,
        created_at=record.created_at,
    )


@router.put("/{record_id}", response_model=AttireRecordResponse, summary="Update attire compliance record")
def update_attire_record(
    record_id: int,
    update_data: AttireRecordUpdate,
    current_user: User = Depends(get_current_manager),
    db: Session = Depends(get_db),
):
    record = (
        db.query(AttireRecord)
        .join(Employee, AttireRecord.employee_id == Employee.id)
        .filter(
            AttireRecord.id == record_id,
            AttireRecord.branch_id == current_user.branch_id,
        )
        .first()
    )
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Attire compliance record not found.")

    if update_data.check_date is not None:
        record.check_date = update_data.check_date
    if update_data.status is not None:
        record.status = update_data.status
    if update_data.notes is not None:
        record.notes = update_data.notes
    if update_data.image_url is not None:
        record.image_url = update_data.image_url

    try:
        db.commit()
        db.refresh(record)
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update attire record: {str(e)}",
        )

    emp_name = record.employee.full_name if record.employee else None
    return AttireRecordResponse(
        id=record.id,
        branch_id=record.branch_id,
        employee_id=record.employee_id,
        employee_name=emp_name,
        check_date=record.check_date,
        status=record.status,
        notes=record.notes,
        image_url=record.image_url,
        created_at=record.created_at,
    )


@router.delete("/{record_id}", status_code=status.HTTP_200_OK, summary="Delete attire record")
def delete_attire_record(
    record_id: int,
    current_user: User = Depends(get_current_manager),
    db: Session = Depends(get_db),
):
    record = (
        db.query(AttireRecord)
        .join(Employee, AttireRecord.employee_id == Employee.id)
        .filter(
            AttireRecord.id == record_id,
            AttireRecord.branch_id == current_user.branch_id,
        )
        .first()
    )
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Record not found.")

    try:
        db.delete(record)
        db.commit()
        return {"message": "Attire record deleted successfully."}
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete attire record: {str(e)}",
        )
