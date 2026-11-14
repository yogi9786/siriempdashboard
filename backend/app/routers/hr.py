import os
import uuid
import json
from datetime import datetime, date, timezone, timedelta
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

    # Branch employee & revenue distribution
    branches = db.query(Branch).all()
    branch_stats = []
    total_rev = 0.0
    for b in branches:
        emp_count = db.query(Employee).filter(Employee.branch_id == b.id, Employee.status == "active").count()
        b_rev = db.query(func.coalesce(func.sum(CustomerActivity.product_value), 0.0))\
            .filter(CustomerActivity.branch_id == b.id, CustomerActivity.status.in_(["Sold", "Exchange"]))\
            .scalar()
        b_rev_float = round(float(b_rev), 2)
        total_rev += b_rev_float
        branch_stats.append({
            "branch_id": b.id,
            "branch_code": b.code,
            "branch_name": b.name,
            "employee_count": emp_count,
            "revenue": b_rev_float,
        })

    return {
        "total_employees": total_employees,
        "total_branches": total_branches,
        "total_revenue": round(total_rev, 2),
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


@router.get("/me", summary="Get current logged in HR profile")
def get_hr_me(
    db: Session = Depends(get_db),
    current_hr: User = Depends(get_current_hr),
):
    branch = db.query(Branch).filter(Branch.id == current_hr.branch_id).first() if current_hr.branch_id else None
    return {
        "id": current_hr.id,
        "username": current_hr.username,
        "full_name": current_hr.full_name,
        "email": current_hr.email or f"{current_hr.username.lower()}@sirisamruddhigold.com",
        "role": "HR",
        "branch_id": current_hr.branch_id or 1,
        "branch_code": branch.code if branch else "ALL",
        "branch_name": branch.name if branch else "All Showrooms",
        "is_active": True,
    }


@router.get("/employees/{employee_id}", summary="Get employee detailed profile & overview for HR")
def get_hr_employee_overview(
    employee_id: int,
    db: Session = Depends(get_db),
    current_hr: User = Depends(get_current_hr),
):
    emp = db.query(Employee).filter(Employee.id == employee_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found.")

    branch = db.query(Branch).filter(Branch.id == emp.branch_id).first()

    # Calculate statistics
    activities = db.query(CustomerActivity).filter(CustomerActivity.employee_id == emp.id).all()
    total_customers_attended = len(activities)
    sold_activities = [a for a in activities if a.status in ["Sold", "Exchange"] or (a.product_value or 0) > 0]
    total_sold_count = len(sold_activities)
    total_sales_value = sum(float(a.product_value or 0) for a in sold_activities)

    # Count schemes enrolled
    schemes_count = 0
    schemes_amount = 0.0
    for a in activities:
        if a.breakdown:
            try:
                items = json.loads(a.breakdown)
                if isinstance(items, list):
                    for it in items:
                        if isinstance(it, dict) and (it.get("has_scheme") or it.get("scheme_name")):
                            schemes_count += 1
                            schemes_amount += float(it.get("scheme_amount") or 0.0)
            except Exception:
                pass

    # Review Points
    g_pts = sum(max(1, r.customers_count or 1) for r in (emp.google_reviews or []) if (r.status or "").upper() in ["APPROVED", "VERIFIED", "PUBLISHED"])
    v_pts = sum(max(1, v.videos_count or 1) * 5 for v in (emp.video_reviews or []) if (v.status or "").upper() in ["APPROVED", "VERIFIED", "PUBLISHED"])

    # Payslips issued count
    payslips_count = db.query(EmployeePaySlip).filter(EmployeePaySlip.employee_id == emp.id).count()

    # Leaves count
    leaves = db.query(EmployeeLeaveRequest).filter(EmployeeLeaveRequest.employee_id == emp.id).all()
    approved_leaves = len([l for l in leaves if l.status == "APPROVED"])
    pending_leaves = len([l for l in leaves if l.status == "PENDING"])

    # Recent 5 activities
    recent_acts = []
    for a in sorted(activities, key=lambda x: (x.activity_date, x.id), reverse=True)[:5]:
        recent_acts.append({
            "id": a.id,
            "date": a.activity_date.isoformat() if a.activity_date else "",
            "customer_name": a.customer_name or "Walk-in Customer",
            "phone_number": a.phone_number or "",
            "status": a.status or "Walkin",
            "product_value": a.product_value or 0.0,
            "approval_status": a.approval_status or "PENDING",
        })

    return {
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
        "metrics": {
            "total_customers_attended": total_customers_attended,
            "total_sold_count": total_sold_count,
            "total_sales_value": round(total_sales_value, 2),
            "schemes_count": schemes_count,
            "schemes_amount": round(schemes_amount, 2),
            "google_review_points": g_pts,
            "video_review_points": v_pts,
            "total_points": g_pts + v_pts,
            "payslips_issued": payslips_count,
            "approved_leaves": approved_leaves,
            "pending_leaves": pending_leaves,
        },
        "recent_activities": recent_acts,
    }


@router.put("/employees/{employee_id}", summary="Edit / Update employee details via HR")
def update_hr_employee(
    employee_id: int,
    payload: dict = Body(...),
    db: Session = Depends(get_db),
    current_hr: User = Depends(get_current_hr),
):
    emp = db.query(Employee).filter(Employee.id == employee_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found.")

    if "full_name" in payload and payload["full_name"]:
        emp.full_name = str(payload["full_name"]).strip()

    if "employee_code" in payload and payload["employee_code"]:
        new_code = str(payload["employee_code"]).strip().upper()
        if new_code != emp.employee_code:
            existing = db.query(Employee).filter(
                Employee.branch_id == emp.branch_id,
                Employee.employee_code == new_code,
                Employee.id != emp.id,
            ).first()
            if existing:
                raise HTTPException(status_code=400, detail=f"Employee code '{new_code}' already exists.")
            emp.employee_code = new_code

    if "phone" in payload:
        emp.phone = str(payload["phone"] or "").strip()

    if "email" in payload:
        emp.email = str(payload["email"] or "").strip() or None

    if "designation" in payload and payload["designation"]:
        emp.designation = str(payload["designation"]).strip()

    if "department" in payload and payload["department"]:
        emp.department = str(payload["department"]).strip()

    if "status" in payload and payload["status"]:
        emp.status = str(payload["status"]).strip().lower()

    if "notes" in payload:
        emp.notes = str(payload["notes"] or "").strip()

    if "date_of_joining" in payload and payload["date_of_joining"]:
        try:
            emp.date_of_joining = datetime.strptime(str(payload["date_of_joining"])[:10], "%Y-%m-%d").date()
        except Exception:
            pass

    if "branch_id" in payload and payload["branch_id"]:
        new_b_id = int(payload["branch_id"])
        b_exists = db.query(Branch).filter(Branch.id == new_b_id).first()
        if b_exists:
            emp.branch_id = new_b_id
    elif "branch_code" in payload and payload["branch_code"]:
        b_exists = db.query(Branch).filter(func.upper(Branch.code) == str(payload["branch_code"]).strip().upper()).first()
        if b_exists:
            emp.branch_id = b_exists.id

    db.commit()
    db.refresh(emp)

    return {
        "id": emp.id,
        "employee_code": emp.employee_code,
        "full_name": emp.full_name,
        "branch_id": emp.branch_id,
        "designation": emp.designation,
        "status": emp.status,
        "message": f"Employee {emp.full_name} updated successfully.",
    }


@router.delete("/employees/{employee_id}", summary="Delete employee record via HR")
def delete_hr_employee(
    employee_id: int,
    db: Session = Depends(get_db),
    current_hr: User = Depends(get_current_hr),
):
    emp = db.query(Employee).filter(Employee.id == employee_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found.")

    emp_name = emp.full_name
    emp_code = emp.employee_code

    # Detach or clean up foreign keys so delete succeeds safely
    db.query(CustomerActivity).filter(CustomerActivity.employee_id == employee_id).update({"employee_id": None})
    db.query(EmployeePaySlip).filter(EmployeePaySlip.employee_id == employee_id).delete()
    db.query(EmployeeLeaveRequest).filter(EmployeeLeaveRequest.employee_id == employee_id).delete()

    db.delete(emp)
    db.commit()

    return {
        "message": f"Employee {emp_name} ({emp_code}) deleted successfully.",
        "id": employee_id,
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
    limit: int = Query(500, ge=1, le=5000),
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
# Revenue & Sales Intelligence Across Branches (HR)
# -------------------------------------------------------------------------
@router.get("/revenue", summary="Get consolidated and branch-segregated revenue for HR")
def get_hr_revenue(
    branch_id: Optional[int] = None,
    branch_code: Optional[str] = None,
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
    date_filter: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = Query(2500, ge=1, le=10000),
    db: Session = Depends(get_db),
    current_hr: User = Depends(get_current_hr),
):
    """
    Returns segregated and consolidated revenue metrics, customer purchase transactions,
    and savings scheme records across all 3 showroom branches (Yelahanka, Kolar, Udupi).
    """
    query = db.query(CustomerActivity).outerjoin(Employee, CustomerActivity.employee_id == Employee.id)

    if branch_id:
        query = query.filter(CustomerActivity.branch_id == branch_id)
    elif branch_code and branch_code.strip().upper() != "ALL":
        branch = db.query(Branch).filter(func.upper(Branch.code) == branch_code.strip().upper()).first()
        if branch:
            query = query.filter(CustomerActivity.branch_id == branch.id)

    # Date filter presets
    today = date.today()
    parsed_from = None
    parsed_to = None

    if date_filter:
        df = date_filter.lower().strip()
        if df == "today":
            parsed_from = today
            parsed_to = today
        elif df == "yesterday":
            parsed_from = today - timedelta(days=1)
            parsed_to = today - timedelta(days=1)
        elif df == "this_week":
            parsed_from = today - timedelta(days=7)
            parsed_to = today
        elif df == "this_month":
            parsed_from = date(today.year, today.month, 1)
            parsed_to = today
        elif df == "last_month":
            first_this_month = date(today.year, today.month, 1)
            last_prev_month = first_this_month - timedelta(days=1)
            first_prev_month = date(last_prev_month.year, last_prev_month.month, 1)
            parsed_from = first_prev_month
            parsed_to = last_prev_month

    if from_date:
        try:
            parsed_from = datetime.strptime(from_date.strip()[:10], "%Y-%m-%d").date()
        except ValueError:
            pass

    if to_date:
        try:
            parsed_to = datetime.strptime(to_date.strip()[:10], "%Y-%m-%d").date()
        except ValueError:
            pass

    if parsed_from:
        query = query.filter(CustomerActivity.activity_date >= parsed_from)
    if parsed_to:
        query = query.filter(CustomerActivity.activity_date <= parsed_to)

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

    total_gross_revenue = 0.0
    total_sold_count = 0
    total_schemes_volume = 0.0
    total_schemes_count = 0

    branch_breakdown = {}
    for b_id, b_obj in branches_map.items():
        branch_breakdown[b_obj.code] = {
            "branch_id": b_id,
            "branch_code": b_obj.code,
            "branch_name": b_obj.name,
            "city": b_obj.city or "",
            "revenue": 0.0,
            "sold_count": 0,
            "schemes_volume": 0.0,
            "schemes_count": 0,
        }

    formatted_activities = []
    for act in activities:
        b = branches_map.get(act.branch_id)
        emp = employees_map.get(act.employee_id)
        rev = managers_map.get(act.reviewed_by_id) if act.reviewed_by_id else None

        val = float(act.product_value or 0.0)
        status_norm = (act.status or "").strip()
        is_sold_or_exchange = status_norm in ["Sold", "Exchange"] or val > 0

        if is_sold_or_exchange:
            total_gross_revenue += val
            if status_norm == "Sold":
                total_sold_count += 1
            if b and b.code in branch_breakdown:
                branch_breakdown[b.code]["revenue"] += val
                if status_norm == "Sold":
                    branch_breakdown[b.code]["sold_count"] += 1

        # Check breakdown for savings schemes
        if act.breakdown:
            try:
                items = json.loads(act.breakdown)
                if isinstance(items, list):
                    for it in items:
                        if isinstance(it, dict) and (it.get("has_scheme") or it.get("scheme_name")):
                            amt = float(it.get("scheme_amount") or 0.0)
                            total_schemes_volume += amt
                            total_schemes_count += 1
                            if b and b.code in branch_breakdown:
                                branch_breakdown[b.code]["schemes_volume"] += amt
                                branch_breakdown[b.code]["schemes_count"] += 1
            except Exception:
                pass

        formatted_activities.append({
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
            "product_value": val,
            "product_id": "",
            "approval_status": act.approval_status or "PENDING",
            "approved_by_name": rev.full_name if rev else "",
            "notes": act.notes or "",
            "breakdown": act.breakdown,
            "customers_count": act.customers_count or 1,
            "created_at": act.created_at.isoformat() if act.created_at else "",
        })

    return {
        "summary": {
            "total_gross_revenue": round(total_gross_revenue, 2),
            "total_sold_count": total_sold_count,
            "total_schemes_volume": round(total_schemes_volume, 2),
            "total_schemes_count": total_schemes_count,
            "total_records": len(formatted_activities),
        },
        "branch_breakdown": list(branch_breakdown.values()),
        "activities": formatted_activities,
    }


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


@router.put("/payslips/{slip_id}", summary="Edit / Update an issued pay slip")
def update_hr_payslip(
    slip_id: int,
    payload: dict = Body(...),
    db: Session = Depends(get_db),
    current_hr: User = Depends(get_current_hr),
):
    slip = db.query(EmployeePaySlip).filter(EmployeePaySlip.id == slip_id).first()
    if not slip:
        raise HTTPException(status_code=404, detail="Pay slip record not found.")

    if "employee_id" in payload and payload["employee_id"]:
        new_emp = db.query(Employee).filter(Employee.id == int(payload["employee_id"])).first()
        if new_emp:
            slip.employee_id = new_emp.id
            slip.branch_id = new_emp.branch_id

    if "month" in payload and payload["month"]:
        slip.month = str(payload["month"]).strip()
    if "year" in payload and payload["year"]:
        slip.year = int(payload["year"])
    if "amount" in payload and payload["amount"] is not None:
        try:
            slip.amount = float(payload["amount"])
        except (ValueError, TypeError):
            pass
    if "notes" in payload:
        slip.notes = str(payload["notes"] or "").strip()
    if "file_url" in payload and payload["file_url"]:
        slip.file_url = str(payload["file_url"]).strip()

    # Recompute pay_period if month or year updated
    if "pay_period" in payload and payload["pay_period"]:
        slip.pay_period = str(payload["pay_period"]).strip()
    else:
        slip.pay_period = f"{slip.month} {slip.year}"

    db.commit()
    db.refresh(slip)

    emp = db.query(Employee).filter(Employee.id == slip.employee_id).first()
    return {
        "id": slip.id,
        "employee_id": slip.employee_id,
        "employee_name": emp.full_name if emp else "",
        "pay_period": slip.pay_period,
        "month": slip.month,
        "year": slip.year,
        "amount": slip.amount,
        "notes": slip.notes,
        "file_url": slip.file_url,
        "message": "Pay slip record updated successfully.",
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

