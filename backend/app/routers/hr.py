import os
import uuid
from datetime import datetime, date, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Form, status, Body
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, or_

from backend.app.core.database import get_db
from backend.app.core.config import settings
from backend.app.models.branch import Branch, User
from backend.app.models.employee import Employee
from backend.app.models.activity import CustomerActivity
from backend.app.models.hr import EmployeePaySlip, EmployeeLeaveRequest
from backend.app.dependencies.auth import get_current_hr

router = APIRouter(prefix="/api/v1/hr", tags=["HR Portal"])


# -------------------------------------------------------------------------
# HR File Upload (Payslip images / PDFs)
# -------------------------------------------------------------------------
@router.post("/upload-payslip", status_code=status.HTTP_201_CREATED, summary="Upload payslip image or PDF")
async def upload_payslip_file(
    file: UploadFile = File(...),
    current_hr: User = Depends(get_current_hr),
):
    """
    Upload payslip image or PDF document. Accepts JPEG, PNG, WEBP, and PDF up to 10MB.
    """
    content_type = file.content_type.lower() if file.content_type else ""
    allowed_mimes = {
        "image/jpeg": ".jpg",
        "image/jpg": ".jpg",
        "image/png": ".png",
        "image/webp": ".webp",
        "application/pdf": ".pdf",
    }

    if content_type not in allowed_mimes:
        filename_lower = (file.filename or "").lower()
        if filename_lower.endswith(".pdf"):
            ext = ".pdf"
        elif filename_lower.endswith(".png"):
            ext = ".png"
        elif filename_lower.endswith(".webp"):
            ext = ".webp"
        elif filename_lower.endswith(".jpg") or filename_lower.endswith(".jpeg"):
            ext = ".jpg"
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid file format. Please upload JPEG, PNG, WebP image or PDF document.",
            )
    else:
        ext = allowed_mimes[content_type]

    os.makedirs(settings.MEDIA_DIR, exist_ok=True)
    contents = await file.read()
    if len(contents) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File size exceeds 10MB limit.")

    filename = f"payslip_{uuid.uuid4().hex[:12]}{ext}"
    file_path = os.path.join(settings.MEDIA_DIR, filename)
    with open(file_path, "wb") as f:
        f.write(contents)

    rel_url = f"/uploads/{filename}"
    return {
        "url": rel_url,
        "file_url": rel_url,
        "filename": filename,
        "message": "Payslip uploaded successfully",
    }


# -------------------------------------------------------------------------
# Branches & Statistics
# -------------------------------------------------------------------------
@router.get("/stats", summary="Get overall HR stats across branches")
def get_hr_stats(
    db: Session = Depends(get_db),
    current_hr: User = Depends(get_current_hr),
):
    total_employees = db.query(Employee).filter(Employee.status == "active").count()
    total_branches = db.query(Branch).count()
    pending_leaves = db.query(EmployeeLeaveRequest).filter(EmployeeLeaveRequest.status == "PENDING").count()
    total_payslips = db.query(EmployeePaySlip).count()
    total_customers = db.query(CustomerActivity).count()

    # Branch employee distribution
    branches = db.query(Branch).all()
    branch_stats = []
    for b in branches:
        emp_count = db.query(Employee).filter(Employee.branch_id == b.id, Employee.status == "active").count()
        branch_stats.append({
            "branch_id": b.id,
            "branch_code": b.code,
            "branch_name": b.name,
            "employee_count": emp_count,
        })

    return {
        "total_employees": total_employees,
        "total_branches": total_branches,
        "pending_leaves": pending_leaves,
        "total_payslips": total_payslips,
        "total_customers": total_customers,
        "branch_distribution": branch_stats,
    }


@router.get("/branches", summary="List branches with employee breakdown for HR")
def get_hr_branches(
    db: Session = Depends(get_db),
    current_hr: User = Depends(get_current_hr),
):
    branches = db.query(Branch).order_by(Branch.id).all()
    results = []
    for b in branches:
        emp_count = db.query(Employee).filter(Employee.branch_id == b.id, Employee.status == "active").count()
        managers = db.query(User).filter(User.branch_id == b.id, User.role == "MANAGER").all()
        results.append({
            "id": b.id,
            "code": b.code,
            "name": b.name,
            "city": b.city,
            "address": b.address,
            "phone": b.phone,
            "is_active": b.is_active,
            "employee_count": emp_count,
            "managers": [
                {"id": m.id, "full_name": m.full_name, "username": m.username, "manager_code": m.manager_code}
                for m in managers
            ],
        })
    return results


# -------------------------------------------------------------------------
# Employees Management (All Branches)
# -------------------------------------------------------------------------
@router.get("/employees", summary="List all employees across all branches with filters")
def get_hr_employees(
    branch_id: Optional[int] = None,
    branch_code: Optional[str] = None,
    search: Optional[str] = None,
    status_filter: Optional[str] = None,
    db: Session = Depends(get_db),
    current_hr: User = Depends(get_current_hr),
):
    query = db.query(Employee)

    if branch_id:
        query = query.filter(Employee.branch_id == branch_id)
    elif branch_code:
        branch = db.query(Branch).filter(func.upper(Branch.code) == branch_code.strip().upper()).first()
        if branch:
            query = query.filter(Employee.branch_id == branch.id)

    if status_filter and status_filter.lower() != "all":
        query = query.filter(Employee.status == status_filter.lower())

    if search:
        s = f"%{search.strip().lower()}%"
        query = query.filter(
            or_(
                func.lower(Employee.full_name).like(s),
                func.lower(Employee.employee_code).like(s),
                func.lower(Employee.designation).like(s),
                func.lower(Employee.phone).like(s),
            )
        )

    employees = query.order_by(Employee.branch_id, Employee.full_name).all()

    # Enrich with branch info
    branches_map = {b.id: b for b in db.query(Branch).all()}
    results = []
    for emp in employees:
        branch = branches_map.get(emp.branch_id)
        results.append({
            "id": emp.id,
            "branch_id": emp.branch_id,
            "branch_code": branch.code if branch else "UNKNOWN",
            "branch_name": branch.name if branch else "Unknown Branch",
            "employee_code": emp.employee_code,
            "full_name": emp.full_name,
            "phone": emp.phone or "",
            "email": emp.email or "",
            "designation": emp.designation or "Sales Executive",
            "department": emp.department or "Sales & Showroom Operations",
            "date_of_joining": emp.date_of_joining.isoformat() if emp.date_of_joining else None,
            "status": emp.status,
            "notes": emp.notes or "",
            "created_at": emp.created_at.isoformat() if emp.created_at else None,
        })
    return results


@router.post("/employees", status_code=status.HTTP_201_CREATED, summary="Add new employee via HR")
def create_hr_employee(
    payload: dict = Body(...),
    db: Session = Depends(get_db),
    current_hr: User = Depends(get_current_hr),
):
    branch_id = payload.get("branch_id")
    if not branch_id:
        branch_code = payload.get("branch_code")
        if branch_code:
            branch = db.query(Branch).filter(func.upper(Branch.code) == branch_code.strip().upper()).first()
            if branch:
                branch_id = branch.id
    if not branch_id:
        default_b = db.query(Branch).first()
        branch_id = default_b.id if default_b else 1

    emp_code = (payload.get("employee_code") or "").strip().upper()
    full_name = (payload.get("full_name") or "").strip()

    if not full_name:
        raise HTTPException(status_code=400, detail="Employee full name is required.")

    if not emp_code:
        # Generate code based on branch
        branch = db.query(Branch).filter(Branch.id == branch_id).first()
        prefix = (branch.code[:3] if branch else "YEL").upper()
        count = db.query(Employee).filter(Employee.branch_id == branch_id).count() + 1
        emp_code = f"EMP-{prefix}-{count:03d}"

    # Check duplicate
    existing = db.query(Employee).filter(
        Employee.branch_id == branch_id,
        func.upper(Employee.employee_code) == emp_code,
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Employee code '{emp_code}' already exists in this branch.")

    doj_str = payload.get("date_of_joining")
    doj = date.today()
    if doj_str:
        try:
            doj = datetime.strptime(doj_str[:10], "%Y-%m-%d").date()
        except Exception:
            pass

    new_emp = Employee(
        branch_id=branch_id,
        employee_code=emp_code,
        full_name=full_name,
        phone=(payload.get("phone") or "").strip(),
        email=(payload.get("email") or "").strip() or None,
        designation=(payload.get("designation") or "Sales Executive").strip(),
        department=(payload.get("department") or "Sales & Showroom Operations").strip(),
        date_of_joining=doj,
        status="active",
        notes=payload.get("notes") or "",
    )
    db.add(new_emp)
    db.commit()
    db.refresh(new_emp)

    return {
        "id": new_emp.id,
        "branch_id": new_emp.branch_id,
        "employee_code": new_emp.employee_code,
        "full_name": new_emp.full_name,
        "message": f"Employee {new_emp.full_name} ({new_emp.employee_code}) added successfully.",
    }


# -------------------------------------------------------------------------
# Customer Records Across All Branches
# -------------------------------------------------------------------------
@router.get("/customers", summary="List customer activities across all branches for HR")
def get_hr_customers(
    branch_id: Optional[int] = None,
    branch_code: Optional[str] = None,
    search: Optional[str] = None,
    status_filter: Optional[str] = None,
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
    current_hr: User = Depends(get_current_hr),
):
    query = db.query(CustomerActivity).outerjoin(Employee, CustomerActivity.employee_id == Employee.id)

    if branch_id:
        query = query.filter(CustomerActivity.branch_id == branch_id)
    elif branch_code:
        branch = db.query(Branch).filter(func.upper(Branch.code) == branch_code.strip().upper()).first()
        if branch:
            query = query.filter(CustomerActivity.branch_id == branch.id)

    if status_filter and status_filter.lower() != "all":
        query = query.filter(CustomerActivity.status == status_filter)

    if search:
        s = f"%{search.strip().lower()}%"
        query = query.filter(
            or_(
                func.lower(CustomerActivity.customer_name).like(s),
                func.lower(CustomerActivity.phone_number).like(s),
                func.lower(Employee.full_name).like(s),
                func.lower(Employee.employee_code).like(s),
                func.lower(CustomerActivity.notes).like(s),
            )
        )

    activities = query.order_by(desc(CustomerActivity.activity_date), desc(CustomerActivity.id)).limit(limit).all()

    branches_map = {b.id: b for b in db.query(Branch).all()}
    employees_map = {e.id: e for e in db.query(Employee).all()}
    managers_map = {u.id: u for u in db.query(User).all()}
    results = []
    for act in activities:
        b = branches_map.get(act.branch_id)
        emp = employees_map.get(act.employee_id)
        rev = managers_map.get(act.reviewed_by_id) if act.reviewed_by_id else None
        results.append({
            "id": act.id,
            "branch_id": act.branch_id,
            "branch_name": b.name if b else "Showroom",
            "branch_code": b.code if b else "SHOWROOM",
            "employee_id": act.employee_id,
            "employee_name": emp.full_name if emp else "",
            "employee_code": emp.employee_code if emp else "",
            "customer_name": act.customer_name or "Walk-in Customer",
            "phone_number": act.phone_number or "",
            "activity_date": act.activity_date.isoformat() if act.activity_date else "",
            "status": act.status or "Walkin",
            "product_value": act.product_value or 0.0,
            "product_id": "",
            "approval_status": act.approval_status or "PENDING",
            "approved_by_name": rev.full_name if rev else "",
            "notes": act.notes or "",
            "breakdown": act.breakdown,
            "customers_count": act.customers_count or 1,
            "created_at": act.created_at.isoformat() if act.created_at else "",
        })
    return results


# -------------------------------------------------------------------------
# Pay Slips Management
# -------------------------------------------------------------------------
@router.get("/payslips", summary="List all issued employee pay slips")
def get_hr_payslips(
    branch_id: Optional[int] = None,
    employee_id: Optional[int] = None,
    month: Optional[str] = None,
    year: Optional[int] = None,
    db: Session = Depends(get_db),
    current_hr: User = Depends(get_current_hr),
):
    query = db.query(EmployeePaySlip)

    if branch_id:
        query = query.filter(EmployeePaySlip.branch_id == branch_id)
    if employee_id:
        query = query.filter(EmployeePaySlip.employee_id == employee_id)
    if month:
        query = query.filter(func.lower(EmployeePaySlip.month) == month.strip().lower())
    if year:
        query = query.filter(EmployeePaySlip.year == year)

    records = query.order_by(desc(EmployeePaySlip.year), desc(EmployeePaySlip.id)).all()

    branches_map = {b.id: b for b in db.query(Branch).all()}
    employees_map = {e.id: e for e in db.query(Employee).all()}

    results = []
    for slip in records:
        branch = branches_map.get(slip.branch_id)
        emp = employees_map.get(slip.employee_id)
        results.append({
            "id": slip.id,
            "branch_id": slip.branch_id,
            "branch_name": branch.name if branch else "Showroom",
            "branch_code": branch.code if branch else "SHOWROOM",
            "employee_id": slip.employee_id,
            "employee_name": emp.full_name if emp else "Employee",
            "employee_code": emp.employee_code if emp else "",
            "employee_designation": emp.designation if emp else "Staff",
            "month": slip.month,
            "year": slip.year,
            "pay_period": slip.pay_period or f"{slip.month} {slip.year}",
            "amount": slip.amount or 0.0,
            "notes": slip.notes or "",
            "file_url": slip.file_url,
            "issued_date": slip.issued_date.isoformat() if slip.issued_date else "",
            "created_at": slip.created_at.isoformat() if slip.created_at else "",
        })
    return results


@router.post("/payslips", status_code=status.HTTP_201_CREATED, summary="Create and issue pay slip")
def create_hr_payslip(
    payload: dict = Body(...),
    db: Session = Depends(get_db),
    current_hr: User = Depends(get_current_hr),
):
    employee_id = payload.get("employee_id")
    file_url = (payload.get("file_url") or "").strip()
    month = (payload.get("month") or "").strip()
    year = payload.get("year") or datetime.now().year

    if not employee_id:
        raise HTTPException(status_code=400, detail="Employee selection is required.")
    if not file_url:
        raise HTTPException(status_code=400, detail="Pay slip document/image file is required.")
    if not month:
        raise HTTPException(status_code=400, detail="Pay period month is required.")

    emp = db.query(Employee).filter(Employee.id == employee_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found.")

    amount = float(payload.get("amount") or 0.0)
    notes = (payload.get("notes") or "").strip()
    pay_period = (payload.get("pay_period") or f"{month} {year}").strip()

    payslip = EmployeePaySlip(
        branch_id=emp.branch_id,
        employee_id=emp.id,
        month=month,
        year=int(year),
        pay_period=pay_period,
        amount=amount,
        notes=notes,
        file_url=file_url,
        issued_date=date.today(),
    )
    db.add(payslip)
    db.commit()
    db.refresh(payslip)

    return {
        "id": payslip.id,
        "employee_id": payslip.employee_id,
        "employee_name": emp.full_name,
        "pay_period": payslip.pay_period,
        "message": f"Pay slip for {emp.full_name} ({payslip.pay_period}) issued successfully.",
    }


@router.delete("/payslips/{slip_id}", summary="Delete an issued pay slip")
def delete_hr_payslip(
    slip_id: int,
    db: Session = Depends(get_db),
    current_hr: User = Depends(get_current_hr),
):
    slip = db.query(EmployeePaySlip).filter(EmployeePaySlip.id == slip_id).first()
    if not slip:
        raise HTTPException(status_code=404, detail="Pay slip record not found.")

    db.delete(slip)
    db.commit()
    return {"message": "Pay slip deleted successfully.", "id": slip_id}


# -------------------------------------------------------------------------
# Leave Requests Queue & Approvals (HR)
# -------------------------------------------------------------------------
@router.get("/leaves", summary="List leave requests across all branches for HR")
def get_hr_leaves(
    branch_id: Optional[int] = None,
    status_filter: Optional[str] = None,
    db: Session = Depends(get_db),
    current_hr: User = Depends(get_current_hr),
):
    query = db.query(EmployeeLeaveRequest)

    if branch_id:
        query = query.filter(EmployeeLeaveRequest.branch_id == branch_id)
    if status_filter and status_filter.lower() != "all":
        query = query.filter(EmployeeLeaveRequest.status == status_filter.upper())

    records = query.order_by(
        desc(EmployeeLeaveRequest.status == "PENDING"),
        desc(EmployeeLeaveRequest.created_at),
    ).all()

    branches_map = {b.id: b for b in db.query(Branch).all()}
    employees_map = {e.id: e for e in db.query(Employee).all()}

    results = []
    for req in records:
        branch = branches_map.get(req.branch_id)
        emp = employees_map.get(req.employee_id)
        results.append({
            "id": req.id,
            "branch_id": req.branch_id,
            "branch_name": branch.name if branch else "Showroom",
            "branch_code": branch.code if branch else "SHOWROOM",
            "employee_id": req.employee_id,
            "employee_name": emp.full_name if emp else "Staff Member",
            "employee_code": emp.employee_code if emp else "",
            "employee_designation": emp.designation if emp else "Sales Executive",
            "leave_type": req.leave_type,
            "subject": req.subject,
            "message": req.message,
            "from_date": req.from_date.isoformat() if req.from_date else "",
            "to_date": req.to_date.isoformat() if req.to_date else "",
            "days_count": req.days_count,
            "status": req.status,
            "reviewed_by_id": req.reviewed_by_id,
            "reviewed_by_name": req.reviewed_by_name,
            "rejection_reason": req.rejection_reason,
            "created_at": req.created_at.isoformat() if req.created_at else "",
            "updated_at": req.updated_at.isoformat() if req.updated_at else "",
        })
    return results


@router.post("/leaves/{leave_id}/review", summary="Approve or reject leave request by HR")
def review_hr_leave(
    leave_id: int,
    payload: dict = Body(...),
    db: Session = Depends(get_db),
    current_hr: User = Depends(get_current_hr),
):
    req = db.query(EmployeeLeaveRequest).filter(EmployeeLeaveRequest.id == leave_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Leave request not found.")

    decision = (payload.get("status") or "").strip().upper()
    if decision not in ["APPROVED", "REJECTED"]:
        raise HTTPException(status_code=400, detail="Status must be either 'APPROVED' or 'REJECTED'.")

    reason = payload.get("rejection_reason") or payload.get("notes") or ""

    req.status = decision
    req.reviewed_by_id = current_hr.id
    req.reviewed_by_name = f"HR ({current_hr.full_name})"
    if decision == "REJECTED":
        req.rejection_reason = reason
    else:
        req.rejection_reason = None
    req.updated_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(req)

    return {
        "id": req.id,
        "status": req.status,
        "reviewed_by_name": req.reviewed_by_name,
        "rejection_reason": req.rejection_reason,
        "message": f"Leave request #{req.id} marked as {decision}.",
    }

