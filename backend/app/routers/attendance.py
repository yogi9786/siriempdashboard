from typing import List, Optional
from datetime import date, datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, func

from backend.app.core.database import get_db
from backend.app.models.branch import User, Branch
from backend.app.models.employee import Employee
from backend.app.models.attendance import EmployeeAttendance
from backend.app.schemas.attendance import (
    AttendanceCreate,
    AttendanceUpdate,
    AttendanceResponse,
    BulkAttendanceCreate,
    AttendanceSummary,
    BranchAttendanceMetric,
    AdminAttendanceOverviewResponse,
)
from backend.app.dependencies.auth import get_current_manager, get_current_super_admin, SuperAdminIdentity

router = APIRouter(prefix="/api/v1/attendance", tags=["Employee Attendance"])


@router.get("", response_model=List[AttendanceResponse], summary="List employee attendance for manager showroom")
def get_manager_attendance(
    attendance_date: Optional[date] = Query(None, alias="date", description="Date of attendance"),
    current_user: User = Depends(get_current_manager),
    db: Session = Depends(get_db),
):
    target_date = attendance_date or date.today()
    branch = db.query(Branch).filter(Branch.id == current_user.branch_id).first()
    employees = (
        db.query(Employee)
        .filter(Employee.branch_id == current_user.branch_id, Employee.status == "active")
        .order_by(Employee.employee_code.asc())
        .all()
    )

    existing_map = {
        att.employee_id: att
        for att in db.query(EmployeeAttendance)
        .filter(
            EmployeeAttendance.branch_id == current_user.branch_id,
            EmployeeAttendance.date == target_date,
        )
        .all()
    }

    results: List[AttendanceResponse] = []
    now_dt = datetime.now(timezone.utc)

    for emp in employees:
        att = existing_map.get(emp.id)
        if att:
            results.append(
                AttendanceResponse(
                    id=att.id,
                    branch_id=current_user.branch_id,
                    branch_name=branch.name if branch else "Showroom",
                    branch_code=branch.code if branch else "BRANCH",
                    employee_id=emp.id,
                    employee_name=emp.full_name,
                    employee_code=emp.employee_code,
                    designation=emp.designation,
                    department=emp.department,
                    date=att.date,
                    status=att.status,
                    check_in=att.check_in,
                    check_out=att.check_out,
                    notes=att.notes,
                    created_at=att.created_at,
                    updated_at=att.updated_at,
                )
            )
        else:
            # Default unrecorded/present entry ready for manager
            results.append(
                AttendanceResponse(
                    id=0,
                    branch_id=current_user.branch_id,
                    branch_name=branch.name if branch else "Showroom",
                    branch_code=branch.code if branch else "BRANCH",
                    employee_id=emp.id,
                    employee_name=emp.full_name,
                    employee_code=emp.employee_code,
                    designation=emp.designation,
                    department=emp.department,
                    date=target_date,
                    status="Present",
                    check_in="09:30 AM",
                    check_out=None,
                    notes=None,
                    created_at=now_dt,
                    updated_at=now_dt,
                )
            )

    return results


@router.post("", response_model=AttendanceResponse, status_code=status.HTTP_201_CREATED, summary="Mark or update single employee attendance")
def record_employee_attendance(
    payload: AttendanceCreate,
    current_user: User = Depends(get_current_manager),
    db: Session = Depends(get_db),
):
    target_date = payload.date or date.today()
    emp = db.query(Employee).filter(
        Employee.id == payload.employee_id,
        Employee.branch_id == current_user.branch_id,
    ).first()
    if not emp:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found in your branch.")

    branch = db.query(Branch).filter(Branch.id == current_user.branch_id).first()

    att = db.query(EmployeeAttendance).filter(
        EmployeeAttendance.branch_id == current_user.branch_id,
        EmployeeAttendance.employee_id == emp.id,
        EmployeeAttendance.date == target_date,
    ).first()

    if att:
        att.status = payload.status
        att.check_in = payload.check_in
        att.check_out = payload.check_out
        att.notes = payload.notes
    else:
        att = EmployeeAttendance(
            branch_id=current_user.branch_id,
            employee_id=emp.id,
            date=target_date,
            status=payload.status,
            check_in=payload.check_in,
            check_out=payload.check_out,
            notes=payload.notes,
        )
        db.add(att)

    db.commit()
    db.refresh(att)

    return AttendanceResponse(
        id=att.id,
        branch_id=att.branch_id,
        branch_name=branch.name if branch else "Showroom",
        branch_code=branch.code if branch else "BRANCH",
        employee_id=emp.id,
        employee_name=emp.full_name,
        employee_code=emp.employee_code,
        designation=emp.designation,
        department=emp.department,
        date=att.date,
        status=att.status,
        check_in=att.check_in,
        check_out=att.check_out,
        notes=att.notes,
        created_at=att.created_at,
        updated_at=att.updated_at,
    )


@router.post("/bulk", response_model=List[AttendanceResponse], summary="Bulk save showroom staff daily attendance")
def bulk_save_attendance(
    payload: BulkAttendanceCreate,
    current_user: User = Depends(get_current_manager),
    db: Session = Depends(get_db),
):
    target_date = payload.date
    branch = db.query(Branch).filter(Branch.id == current_user.branch_id).first()

    saved_records: List[AttendanceResponse] = []

    for item in payload.items:
        emp = db.query(Employee).filter(
            Employee.id == item.employee_id,
            Employee.branch_id == current_user.branch_id,
        ).first()
        if not emp:
            continue

        att = db.query(EmployeeAttendance).filter(
            EmployeeAttendance.branch_id == current_user.branch_id,
            EmployeeAttendance.employee_id == emp.id,
            EmployeeAttendance.date == target_date,
        ).first()

        if att:
            att.status = item.status
            att.check_in = item.check_in
            att.check_out = item.check_out
            att.notes = item.notes
        else:
            att = EmployeeAttendance(
                branch_id=current_user.branch_id,
                employee_id=emp.id,
                date=target_date,
                status=item.status,
                check_in=item.check_in,
                check_out=item.check_out,
                notes=item.notes,
            )
            db.add(att)

    db.commit()

    # Re-fetch saved
    updated_records = (
        db.query(EmployeeAttendance)
        .join(Employee, EmployeeAttendance.employee_id == Employee.id)
        .filter(
            EmployeeAttendance.branch_id == current_user.branch_id,
            EmployeeAttendance.date == target_date,
        )
        .order_by(Employee.employee_code.asc())
        .all()
    )

    for r in updated_records:
        emp = r.employee
        saved_records.append(
            AttendanceResponse(
                id=r.id,
                branch_id=r.branch_id,
                branch_name=branch.name if branch else "Showroom",
                branch_code=branch.code if branch else "BRANCH",
                employee_id=emp.id,
                employee_name=emp.full_name,
                employee_code=emp.employee_code,
                designation=emp.designation,
                department=emp.department,
                date=r.date,
                status=r.status,
                check_in=r.check_in,
                check_out=r.check_out,
                notes=r.notes,
                created_at=r.created_at,
                updated_at=r.updated_at,
            )
        )

    return saved_records


# =========================================================================
# Admin Multi-Branch Attendance APIs
# =========================================================================
@router.get("/admin/overview", response_model=AdminAttendanceOverviewResponse, summary="Admin multi-branch live attendance with metrics")
def get_admin_attendance_overview(
    branch_id: Optional[int] = Query(None),
    attendance_date: Optional[date] = Query(None, alias="date"),
    status_val: Optional[str] = Query(None, alias="status"),
    search: Optional[str] = Query(None),
    current_admin: SuperAdminIdentity = Depends(get_current_super_admin),
    db: Session = Depends(get_db),
):
    target_date = attendance_date or date.today()

    emp_q = db.query(Employee).filter(Employee.status == "active")
    if branch_id:
        emp_q = emp_q.filter(Employee.branch_id == branch_id)
    if search:
        s = f"%{search.strip().lower()}%"
        emp_q = emp_q.filter(
            or_(
                func.lower(Employee.full_name).like(s),
                func.lower(Employee.employee_code).like(s),
                func.lower(Employee.designation).like(s),
            )
        )

    all_employees = emp_q.order_by(Employee.branch_id.asc(), Employee.employee_code.asc()).all()

    att_q = db.query(EmployeeAttendance).filter(EmployeeAttendance.date == target_date)
    if branch_id:
        att_q = att_q.filter(EmployeeAttendance.branch_id == branch_id)
    existing_attendance = {a.employee_id: a for a in att_q.all()}

    branches_map = {b.id: b for b in db.query(Branch).all()}

    records: List[AttendanceResponse] = []
    now_dt = datetime.now(timezone.utc)

    present_count = 0
    absent_count = 0
    half_day_count = 0
    leave_count = 0
    late_count = 0

    for emp in all_employees:
        b = branches_map.get(emp.branch_id)
        att = existing_attendance.get(emp.id)

        rec_status = att.status if att else "Present"
        rec_check_in = att.check_in if att else "09:30 AM"
        rec_check_out = att.check_out if att else None
        rec_notes = att.notes if att else None
        rec_id = att.id if att else 0
        rec_created = att.created_at if att else now_dt
        rec_updated = att.updated_at if att else now_dt

        # Filter by status if specified
        if status_val and status_val != "all" and rec_status.lower() != status_val.lower():
            continue

        if rec_status == "Present":
            present_count += 1
        elif rec_status == "Absent":
            absent_count += 1
        elif rec_status == "Half Day":
            half_day_count += 1
        elif rec_status == "On Leave":
            leave_count += 1
        elif rec_status == "Late":
            late_count += 1

        records.append(
            AttendanceResponse(
                id=rec_id,
                branch_id=emp.branch_id,
                branch_name=b.name if b else "Showroom",
                branch_code=b.code if b else "BRANCH",
                employee_id=emp.id,
                employee_name=emp.full_name,
                employee_code=emp.employee_code,
                designation=emp.designation,
                department=emp.department,
                date=target_date,
                status=rec_status,
                check_in=rec_check_in,
                check_out=rec_check_out,
                notes=rec_notes,
                created_at=rec_created,
                updated_at=rec_updated,
            )
        )

    total_emps = len(all_employees)
    effective_present = present_count + late_count + (half_day_count * 0.5)
    att_rate = round((effective_present / total_emps * 100), 1) if total_emps > 0 else 100.0

    summary = AttendanceSummary(
        total_roster=total_emps,
        total_present=present_count,
        total_absent=absent_count,
        total_half_day=half_day_count,
        total_leave=leave_count,
        total_late=late_count,
        attendance_rate=att_rate,
        total_employees=total_emps,
        present_count=present_count,
        absent_count=absent_count,
        half_day_count=half_day_count,
        leave_count=leave_count,
        late_count=late_count,
        attendance_rate_pct=att_rate,
    )

    # Calculate branch-wise metrics
    branch_metrics: List[BranchAttendanceMetric] = []
    all_branches = db.query(Branch).order_by(Branch.id.asc()).all()
    for b in all_branches:
        b_emps = [e for e in all_employees if e.branch_id == b.id]
        b_roster = len(b_emps)
        b_present = 0
        b_absent = 0
        b_half_day = 0
        b_late = 0
        for e in b_emps:
            att = existing_attendance.get(e.id)
            st = att.status if att else "Present"
            if st == "Present":
                b_present += 1
            elif st == "Absent":
                b_absent += 1
            elif st == "Half Day":
                b_half_day += 1
            elif st == "Late":
                b_late += 1

        b_eff = b_present + b_late + (b_half_day * 0.5)
        b_rate = round((b_eff / b_roster * 100), 1) if b_roster > 0 else 100.0

        branch_metrics.append(
            BranchAttendanceMetric(
                branch_id=b.id,
                branch_name=b.name,
                branch_code=b.code,
                total_roster=b_roster,
                total_present=b_present,
                present_count=b_present,
                absent_count=b_absent,
                attendance_rate=b_rate,
                rate=b_rate,
            )
        )

    return AdminAttendanceOverviewResponse(
        summary=summary,
        records=records,
        branch_metrics=branch_metrics,
        sync_timestamp=now_dt,
    )


@router.put("/admin/{attendance_id}", response_model=AttendanceResponse, summary="Admin update attendance record")
def admin_update_attendance(
    attendance_id: int,
    payload: AttendanceUpdate,
    current_admin: SuperAdminIdentity = Depends(get_current_super_admin),
    db: Session = Depends(get_db),
):
    att = db.query(EmployeeAttendance).filter(EmployeeAttendance.id == attendance_id).first()
    if not att:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Attendance record not found.")

    if payload.status is not None:
        att.status = payload.status
    if payload.check_in is not None:
        att.check_in = payload.check_in
    if payload.check_out is not None:
        att.check_out = payload.check_out
    if payload.notes is not None:
        att.notes = payload.notes

    db.commit()
    db.refresh(att)

    b = db.query(Branch).filter(Branch.id == att.branch_id).first()
    emp = db.query(Employee).filter(Employee.id == att.employee_id).first()

    return AttendanceResponse(
        id=att.id,
        branch_id=att.branch_id,
        branch_name=b.name if b else "Showroom",
        branch_code=b.code if b else "BRANCH",
        employee_id=emp.id if emp else 0,
        employee_name=emp.full_name if emp else "Staff",
        employee_code=emp.employee_code if emp else "",
        designation=emp.designation if emp else None,
        department=emp.department if emp else None,
        date=att.date,
        status=att.status,
        check_in=att.check_in,
        check_out=att.check_out,
        notes=att.notes,
        created_at=att.created_at,
        updated_at=att.updated_at,
    )
