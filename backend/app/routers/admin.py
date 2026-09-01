import csv
import io
from typing import List, Optional, Any, Dict
from datetime import datetime, date, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, Request, Response, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import func, or_, desc, asc

from backend.app.core.database import get_db, engine
from backend.app.core.security import get_password_hash
from backend.app.core.config import settings
from backend.app.models.branch import Branch, User
from backend.app.models.employee import Employee
from backend.app.models.activity import (
    CustomerActivity,
    SchemeRecord,
    EmployeeFormMedia,
    GoogleReview,
    AttireRecord,
)
from backend.app.models.outdoor_marketing import (
    OutdoorMarketingArea,
    OutdoorMarketingDuty,
    OutdoorMarketingCustomer,
    OutdoorMarketingScheme,
    OutdoorMarketingActivity,
)
from backend.app.models.audit import AuditLog
from backend.app.schemas.auth import LoginRequest, TokenResponse, ManagerProfile, MessageResponse
from backend.app.schemas.admin import (
    AdminDashboardOverview,
    AdminBranchMetric,
    AdminActivityFeedItem,
    SparklineDay,
    AdminBranchSummary,
    AdminBranchDetail,
    AdminBranchUpdate,
    BranchManagerInfo,
    AdminManagerResponse,
    AdminManagerCreate,
    AdminManagerUpdate,
    AdminResetPasswordRequest,
    AdminEmployeeResponse,
    AdminEmployeeCreate,
    AdminEmployeeUpdate,
    AdminEmployeeReassignBranch,
    AdminEmployeePerformance,
    AdminCustomerSummary,
    AdminSchemeAnalytics,
    AdminGoogleReviewSummary,
    AdminAttireSummary,
    AdminReportResponse,
    AdminAuditLogItem,
    AdminAuditLogResponse,
    AdminSettingsResponse,
    AdminEmployeeDetailResponse,
)
from pydantic import BaseModel
from backend.app.services.auth_service import AuthService
from backend.app.dependencies.auth import get_current_super_admin, SuperAdminIdentity

router = APIRouter(prefix="/api/v1/admin", tags=["Super Admin"])


def utcnow():
    return datetime.now(timezone.utc)


def _format_clean_breakdown(breakdown_str: Optional[str], default_status: str = "Attended") -> str:
    """Safely format breakdown string into human-readable text, preventing raw JSON display."""
    if not breakdown_str or not breakdown_str.strip():
        return default_status
    text = breakdown_str.strip()
    if text.startswith("[") or text.startswith("{"):
        try:
            import json
            parsed = json.loads(text)
            if isinstance(parsed, list):
                names = []
                for item in parsed:
                    if isinstance(item, dict):
                        n = item.get("name") or item.get("customer_name")
                        st = item.get("status") or default_status
                        if n and n.strip():
                            names.append(f"{n.strip()} ({st})")
                        else:
                            names.append(st)
                if names:
                    return ", ".join(names[:3])
            elif isinstance(parsed, dict):
                n = parsed.get("name") or parsed.get("customer_name")
                st = parsed.get("status") or default_status
                return f"{n.strip()} ({st})" if n and n.strip() else st
        except Exception:
            return default_status
    if "{" in text or "[" in text:
        return default_status
    return text


class RefreshTokenRequest(BaseModel):
    refresh_token: str


# =========================================================================
# 1. Super Admin Authentication (ENV-Based Zero-DB Identity)
# =========================================================================
@router.post("/auth/login", response_model=TokenResponse, summary="Super Admin Login")
def admin_login(login_data: LoginRequest, request: Request, db: Session = Depends(get_db)):
    auth_service = AuthService(db)
    client_ip = request.client.host if request.client else None
    return auth_service.authenticate_super_admin(login_data, ip_address=client_ip)


@router.post("/auth/refresh", response_model=TokenResponse, summary="Rotate and Refresh Super Admin Token")
def admin_refresh_token(data: RefreshTokenRequest, request: Request, db: Session = Depends(get_db)):
    auth_service = AuthService(db)
    client_ip = request.client.host if request.client else None
    return auth_service.refresh_super_admin_token(data.refresh_token, ip_address=client_ip)


@router.get("/auth/me", response_model=ManagerProfile, summary="Get current Super Admin profile")
def get_admin_me(current_admin: SuperAdminIdentity = Depends(get_current_super_admin), db: Session = Depends(get_db)):
    auth_service = AuthService(db)
    return auth_service.get_super_admin_profile()


@router.post("/auth/logout", response_model=MessageResponse, summary="Super Admin Logout")
def admin_logout(
    request: Request,
    current_admin: SuperAdminIdentity = Depends(get_current_super_admin),
    db: Session = Depends(get_db),
):
    client_ip = request.client.host if request.client else None
    try:
        audit = AuditLog(
            branch_id=None,
            admin_id=None,
            admin_username=current_admin.email,
            action="Admin Logout",
            entity="Auth",
            ip_address=client_ip,
            details=f"Super Admin ({current_admin.email}) logged out.",
        )
        db.add(audit)
        db.commit()
    except Exception:
        db.rollback()

    return MessageResponse(message="Super Admin successfully logged out.")


# =========================================================================
# 1.1 Showroom Managers Directory (Read-Only Overview)
# =========================================================================
@router.get("/managers", summary="List all showroom branch managers")
def get_admin_managers(
    search: Optional[str] = None,
    branch_id: Optional[int] = None,
    is_active: Optional[bool] = None,
    current_admin: SuperAdminIdentity = Depends(get_current_super_admin),
    db: Session = Depends(get_db),
):
    query = db.query(User).filter(User.role == "MANAGER")
    if branch_id:
        query = query.filter(User.branch_id == branch_id)
    if is_active is not None:
        query = query.filter(User.is_active == is_active)
    if search:
        s = f"%{search.strip().lower()}%"
        query = query.filter(
            (func.lower(User.full_name).like(s))
            | (func.lower(User.username).like(s))
            | (func.lower(User.email).like(s))
        )

    users = query.order_by(User.branch_id, User.id).all()
    results = []
    for u in users:
        branch = db.query(Branch).filter(Branch.id == u.branch_id).first()
        results.append({
            "id": u.id,
            "branch_id": u.branch_id,
            "branch_code": branch.code if branch else "MAIN",
            "branch_name": branch.name if branch else "Showroom",
            "full_name": u.full_name,
            "username": u.username,
            "manager_code": getattr(u, "manager_code", None),
            "email": u.email,
            "role": u.role,
            "is_active": u.is_active,
            "last_login": u.last_login.isoformat() if u.last_login else None,
            "created_at": u.created_at.isoformat() if u.created_at else utcnow().isoformat(),
        })
    return results


# =========================================================================
# 2. Executive Dashboard Overview (Organization-Wide / Branch-Filtered)
# =========================================================================
def _get_cust_closed_count(c: CustomerActivity) -> int:
    if c.breakdown:
        parts = c.breakdown.split('|')
        closed_parts = [p for p in parts if ": closed" in p.lower() or p.strip().lower() == "closed"]
        if closed_parts:
            return len(closed_parts)
    return (c.customers_count or 1) if c.status == "Closed" else 0


@router.get("/dashboard/overview", response_model=AdminDashboardOverview, summary="Enterprise Command Center Overview")
def get_admin_dashboard_overview(
    branch_id: Optional[int] = Query(None, description="Optional branch ID to filter organization metrics"),
    date_range: Optional[str] = Query("all", description="Date range: today, yesterday, 7days, 30days, this_month, this_year, all"),
    current_admin: SuperAdminIdentity = Depends(get_current_super_admin),
    db: Session = Depends(get_db),
):
    # Total Branches
    branches = db.query(Branch).filter(Branch.is_active == True).order_by(Branch.id.asc()).all()
    total_branches = len(branches)

    # Managers count
    mgr_q = db.query(User).filter(User.role == "MANAGER", User.is_active == True)
    if branch_id:
        mgr_q = mgr_q.filter(User.branch_id == branch_id)
    total_managers = mgr_q.count()

    # Employees count
    emp_q = db.query(Employee)
    if branch_id:
        emp_q = emp_q.filter(Employee.branch_id == branch_id)
    total_employees = emp_q.count()
    active_employees = emp_q.filter(Employee.status == "active").count()
    outdoor_staff_count = emp_q.filter(Employee.is_outdoor_marketing_employee == True).count()

    # Customer Footfall & Activities (aggregate real customer counts)
    cust_q = db.query(CustomerActivity)
    if branch_id:
        cust_q = cust_q.filter(CustomerActivity.branch_id == branch_id)
    
    all_cust = cust_q.all()
    total_footfall = sum(c.customers_count or 1 for c in all_cust)
    total_customers_closed = sum(_get_cust_closed_count(c) for c in all_cust)
    total_activities = total_footfall
    conversion_pct = round((total_customers_closed / total_footfall * 100)) if total_footfall > 0 else 100

    # Gold Schemes (aggregate customer counts and amounts)
    sch_q = db.query(SchemeRecord)
    if branch_id:
        sch_q = sch_q.filter(SchemeRecord.branch_id == branch_id)
    all_schemes = sch_q.all()
    total_schemes = sum(s.customers_count or 1 for s in all_schemes)
    total_schemes_value = sum(s.amount for s in all_schemes)

    # Google Reviews (aggregate customer review counts)
    rev_q = db.query(GoogleReview)
    if branch_id:
        rev_q = rev_q.filter(GoogleReview.branch_id == branch_id)
    all_reviews = rev_q.all()
    total_reviews = sum(r.customers_count or 1 for r in all_reviews)
    avg_rating = round(sum(r.rating for r in all_reviews) / len(all_reviews), 1) if len(all_reviews) > 0 else 5.0

    # Outdoor Leads
    out_q = db.query(OutdoorMarketingCustomer)
    if branch_id:
        out_q = out_q.filter(OutdoorMarketingCustomer.branch_id == branch_id)
    outdoor_leads = out_q.count()
    outdoor_leads_converted = out_q.filter(OutdoorMarketingCustomer.status.in_(["Closed", "Interested"])).count()

    # Attire Compliance
    att_q = db.query(AttireRecord)
    if branch_id:
        att_q = att_q.filter(AttireRecord.branch_id == branch_id)
    all_attire = att_q.all()
    proper_attire = sum(1 for a in all_attire if a.status == "Proper")
    attire_compliance_pct = round((proper_attire / len(all_attire) * 100), 1) if all_attire else 100.0

    # Daily Forms
    form_q = db.query(EmployeeFormMedia)
    if branch_id:
        form_q = form_q.filter(EmployeeFormMedia.branch_id == branch_id)
    daily_forms_count = form_q.count()

    # Today's Live Operational Metrics (Synced across Showrooms)
    today = date.today()
    today_cust_q = db.query(CustomerActivity).filter(CustomerActivity.activity_date == today)
    today_sch_q = db.query(SchemeRecord).filter(SchemeRecord.record_date == today)
    today_rev_q = db.query(GoogleReview).filter(GoogleReview.review_date == today)
    today_out_q = db.query(OutdoorMarketingCustomer).filter(func.date(OutdoorMarketingCustomer.created_at) == today)

    if branch_id:
        today_cust_q = today_cust_q.filter(CustomerActivity.branch_id == branch_id)
        today_sch_q = today_sch_q.filter(SchemeRecord.branch_id == branch_id)
        today_rev_q = today_rev_q.filter(GoogleReview.branch_id == branch_id)
        today_out_q = today_out_q.filter(OutdoorMarketingCustomer.branch_id == branch_id)

    today_cust_all = today_cust_q.all()
    today_footfall = sum(c.customers_count or 1 for c in today_cust_all)
    today_customers_closed = sum(_get_cust_closed_count(c) for c in today_cust_all)

    today_sch_all = today_sch_q.all()
    today_schemes_count = sum(s.customers_count or 1 for s in today_sch_all)
    today_schemes_value = sum(s.amount for s in today_sch_all)

    today_outdoor_leads = today_out_q.count()
    today_reviews_count = sum(r.customers_count or 1 for r in today_rev_q.all())

    # 7-Day Sparkline Generation
    sparkline_days: List[SparklineDay] = []
    for i in range(6, -1, -1):
        d = today - timedelta(days=i)
        d_str = d.strftime("%Y-%m-%d")
        d_name = d.strftime("%a")

        # Counts for this date
        d_footfall = db.query(CustomerActivity).filter(CustomerActivity.activity_date == d)
        d_schemes = db.query(SchemeRecord).filter(SchemeRecord.record_date == d)
        d_reviews = db.query(GoogleReview).filter(GoogleReview.review_date == d)
        if branch_id:
            d_footfall = d_footfall.filter(CustomerActivity.branch_id == branch_id)
            d_schemes = d_schemes.filter(SchemeRecord.branch_id == branch_id)
            d_reviews = d_reviews.filter(GoogleReview.branch_id == branch_id)

        d_footfall_all = d_footfall.all()
        d_schemes_all = d_schemes.all()
        d_reviews_all = d_reviews.all()

        sparkline_days.append(
            SparklineDay(
                day=d_name,
                date=d_str,
                footfall=sum(c.customers_count or 1 for c in d_footfall_all),
                schemes_value=sum(s.amount for s in d_schemes_all),
                reviews=sum(r.customers_count or 1 for r in d_reviews_all),
            )
        )

    # Branch Comparison Metrics for all branches
    branch_comparison: List[AdminBranchMetric] = []
    for b in branches:
        b_mgrs = db.query(User).filter(User.branch_id == b.id, User.role == "MANAGER", User.is_active == True).count()
        b_emps = db.query(Employee).filter(Employee.branch_id == b.id).count()
        b_active_emps = db.query(Employee).filter(Employee.branch_id == b.id, Employee.status == "active").count()
        
        b_cust = db.query(CustomerActivity).filter(CustomerActivity.branch_id == b.id).all()
        b_footfall = sum(c.customers_count or 1 for c in b_cust)
        b_closed = sum(_get_cust_closed_count(c) for c in b_cust)
        b_conv = round((b_closed / b_footfall * 100), 1) if b_footfall > 0 else 100.0

        b_sch = db.query(SchemeRecord).filter(SchemeRecord.branch_id == b.id).all()
        b_sch_count = sum(s.customers_count or 1 for s in b_sch)
        b_sch_val = sum(s.amount for s in b_sch)

        b_revs = db.query(GoogleReview).filter(GoogleReview.branch_id == b.id).all()
        b_rev_count = sum(r.customers_count or 1 for r in b_revs)
        b_avg_rat = round(sum(r.rating for r in b_revs) / len(b_revs), 1) if len(b_revs) > 0 else 5.0

        b_out_cust = db.query(OutdoorMarketingCustomer).filter(OutdoorMarketingCustomer.branch_id == b.id)
        b_out_leads = b_out_cust.count()
        b_out_conv = b_out_cust.filter(OutdoorMarketingCustomer.status.in_(["Closed", "Interested"])).count()

        b_att = db.query(AttireRecord).filter(AttireRecord.branch_id == b.id).all()
        b_att_proper = sum(1 for a in b_att if a.status == "Proper")
        b_att_pct = round((b_att_proper / len(b_att) * 100), 1) if b_att else 100.0

        b_forms = db.query(EmployeeFormMedia).filter(EmployeeFormMedia.branch_id == b.id).count()

        branch_comparison.append(
            AdminBranchMetric(
                branch_id=b.id,
                branch_code=b.code,
                branch_name=b.name,
                city=b.city,
                manager_count=b_mgrs,
                employee_count=b_emps,
                active_employee_count=b_active_emps,
                customer_footfall=b_footfall,
                customer_closed=b_closed,
                conversion_rate=b_conv,
                schemes_count=b_sch_count,
                schemes_value=b_sch_val,
                reviews_count=b_rev_count,
                average_rating=b_avg_rat,
                outdoor_leads=b_out_leads,
                outdoor_converted=b_out_conv,
                attire_compliance_pct=b_att_pct,
                daily_forms_count=b_forms,
            )
        )

    # Recent Activity Feed with raw datetime for strict chronological sorting across all categories
    raw_activities = []

    # 1. Customer interactions
    c_acts = cust_q.order_by(CustomerActivity.created_at.desc(), CustomerActivity.id.desc()).limit(12).all()
    for c in c_acts:
        b_name = db.query(Branch.name).filter(Branch.id == c.branch_id).scalar() or "Showroom"
        emp_name = db.query(Employee.full_name).filter(Employee.id == c.employee_id).scalar() if c.employee_id else None
        c_count = c.customers_count or 1
        title_txt = f"Customer Activity: {c_count} Customer{'s' if c_count > 1 else ''} Attended"
        clean_bd = _format_clean_breakdown(c.breakdown, c.status)
        desc_txt = f"{clean_bd} at {b_name} showroom"
        if emp_name:
            desc_txt = f"Attended by {emp_name} ({desc_txt})"
        raw_activities.append((
            c.created_at or datetime.now(timezone.utc),
            AdminActivityFeedItem(
                id=f"cust-{c.id}",
                event_type="customer",
                title=title_txt,
                description=desc_txt,
                branch_id=c.branch_id,
                branch_name=b_name,
                employee_name=emp_name,
                timestamp=(c.created_at or datetime.now(timezone.utc)).strftime("%I:%M %p, %d %b"),
                status_tag=f"{c_count} Cust • {c.status}",
            )
        ))

    # 2. Gold scheme enrollments
    s_acts = sch_q.order_by(SchemeRecord.created_at.desc(), SchemeRecord.id.desc()).limit(10).all()
    for s in s_acts:
        b_name = db.query(Branch.name).filter(Branch.id == s.branch_id).scalar() or "Showroom"
        emp_name = db.query(Employee.full_name).filter(Employee.id == s.employee_id).scalar() if s.employee_id else None
        s_count = s.customers_count or 1
        raw_activities.append((
            s.created_at or datetime.now(timezone.utc),
            AdminActivityFeedItem(
                id=f"sch-{s.id}",
                event_type="scheme",
                title=f"Gold Scheme: {s.scheme_name} ({s_count} Enrolled)",
                description=f"Total: ₹{s.amount:,.0f} by {emp_name or 'Staff'} at {b_name}",
                branch_id=s.branch_id,
                branch_name=b_name,
                employee_name=emp_name,
                timestamp=(s.created_at or datetime.now(timezone.utc)).strftime("%I:%M %p, %d %b"),
                status_tag=f"₹{s.amount:,.0f}",
            )
        ))

    # 3. Google reviews
    r_acts = rev_q.order_by(GoogleReview.created_at.desc(), GoogleReview.id.desc()).limit(10).all()
    for r in r_acts:
        b_name = db.query(Branch.name).filter(Branch.id == r.branch_id).scalar() or "Showroom"
        r_count = r.customers_count or 1
        raw_activities.append((
            r.created_at or datetime.now(timezone.utc),
            AdminActivityFeedItem(
                id=f"rev-{r.id}",
                event_type="review",
                title=f"Google Review ({r_count} Cust): {r.rating}★ Verified",
                description=f'"{r.review_text[:50]}..." at {b_name}',
                branch_id=r.branch_id,
                branch_name=b_name,
                employee_name=None,
                timestamp=(r.created_at or datetime.now(timezone.utc)).strftime("%I:%M %p, %d %b"),
                status_tag=f"{r.rating}★",
            )
        ))

    # 4. Daily Forms
    f_acts = form_q.order_by(EmployeeFormMedia.created_at.desc(), EmployeeFormMedia.id.desc()).limit(6).all()
    for f in f_acts:
        b_name = db.query(Branch.name).filter(Branch.id == f.branch_id).scalar() or "Showroom"
        emp_name = db.query(Employee.full_name).filter(Employee.id == f.employee_id).scalar() if f.employee_id else None
        raw_activities.append((
            f.created_at or datetime.now(timezone.utc),
            AdminActivityFeedItem(
                id=f"form-{f.id}",
                event_type="form",
                title=f"Daily Closing Form Uploaded",
                description=f"{f.form_type} snapshot by {emp_name or 'Manager'} at {b_name}",
                branch_id=f.branch_id,
                branch_name=b_name,
                employee_name=emp_name,
                timestamp=(f.created_at or datetime.now(timezone.utc)).strftime("%I:%M %p, %d %b"),
                status_tag="Closing Form",
            )
        ))

    # Sort all activities chronologically by actual datetime descending
    raw_activities.sort(key=lambda x: x[0], reverse=True)
    recent_activity: List[AdminActivityFeedItem] = [item for _, item in raw_activities[:15]]

    return AdminDashboardOverview(
        total_branches=total_branches,
        total_managers=total_managers,
        total_employees=total_employees,
        active_employees=active_employees,
        total_footfall=total_footfall,
        total_customers_closed=total_customers_closed,
        conversion_percentage=conversion_pct,
        footfall_growth_pct=12.5,
        total_activities=total_activities,
        total_schemes=total_schemes,
        total_schemes_value=total_schemes_value,
        total_reviews=total_reviews,
        average_rating=avg_rating,
        outdoor_leads=outdoor_leads,
        outdoor_leads_converted=outdoor_leads_converted,
        outdoor_staff_count=outdoor_staff_count,
        attire_compliance_pct=attire_compliance_pct,
        daily_forms_count=daily_forms_count,
        today_footfall=today_footfall,
        today_customers_closed=today_customers_closed,
        today_schemes_count=today_schemes_count,
        today_schemes_value=today_schemes_value,
        today_outdoor_leads=today_outdoor_leads,
        today_reviews_count=today_reviews_count,
        sparkline_days=sparkline_days,
        branch_comparison=branch_comparison,
        recent_activity=recent_activity,
    )


# =========================================================================
# 3. Branch Management APIs
# =========================================================================
@router.get("/branches", response_model=List[AdminBranchSummary], summary="List all branches with metrics")
def get_admin_branches(
    current_admin: SuperAdminIdentity = Depends(get_current_super_admin),
    db: Session = Depends(get_db),
):
    branches = db.query(Branch).order_by(Branch.id.asc()).all()
    results: List[AdminBranchSummary] = []

    for b in branches:
        managers = (
            db.query(User)
            .filter(User.branch_id == b.id, User.role == "MANAGER")
            .order_by(User.id.asc())
            .all()
        )
        mgr_info = [
            BranchManagerInfo(
                id=m.id,
                full_name=m.full_name,
                username=m.username,
                email=m.email,
                is_active=m.is_active,
                last_login=m.last_login,
            )
            for m in managers
        ]

        emps = db.query(Employee).filter(Employee.branch_id == b.id)
        emp_count = emps.count()
        active_emp_count = emps.filter(Employee.status == "active").count()
        outdoor_emp_count = emps.filter(Employee.is_outdoor_marketing_employee == True).count()

        cust_all = db.query(CustomerActivity).filter(CustomerActivity.branch_id == b.id).all()
        footfall = sum(c.customers_count or 1 for c in cust_all)
        closed = sum(_get_cust_closed_count(c) for c in cust_all)
        conv_rate = round((closed / footfall * 100), 1) if footfall > 0 else 100.0

        sch = db.query(SchemeRecord).filter(SchemeRecord.branch_id == b.id).all()
        sch_count = sum(s.customers_count or 1 for s in sch)
        sch_val = sum(s.amount for s in sch)

        revs = db.query(GoogleReview).filter(GoogleReview.branch_id == b.id).all()
        rev_count = sum(r.customers_count or 1 for r in revs)
        avg_rat = round(sum(r.rating for r in revs) / len(revs), 1) if len(revs) > 0 else 5.0

        out_leads = db.query(OutdoorMarketingCustomer).filter(OutdoorMarketingCustomer.branch_id == b.id).count()

        att = db.query(AttireRecord).filter(AttireRecord.branch_id == b.id).all()
        proper = sum(1 for a in att if a.status == "Proper")
        att_pct = round((proper / len(att) * 100), 1) if att else 100.0

        forms_cnt = db.query(EmployeeFormMedia).filter(EmployeeFormMedia.branch_id == b.id).count()

        results.append(
            AdminBranchSummary(
                id=b.id,
                code=b.code,
                name=b.name,
                city=b.city,
                address=b.address,
                phone=b.phone,
                email=b.email,
                description=b.description,
                is_active=b.is_active,
                managers=mgr_info,
                employee_count=emp_count,
                active_employee_count=active_emp_count,
                outdoor_employee_count=outdoor_emp_count,
                customer_footfall=footfall,
                schemes_count=sch_count,
                schemes_value=sch_val,
                reviews_count=rev_count,
                average_rating=avg_rat,
                outdoor_leads=out_leads,
                conversion_rate=conv_rate,
                attire_compliance_pct=att_pct,
                daily_forms_count=forms_cnt,
            )
        )

    return results


@router.get("/branches/{branch_id}", response_model=AdminBranchDetail, summary="Get single branch detail & analytics")
def get_admin_branch_detail(
    branch_id: int,
    current_admin: SuperAdminIdentity = Depends(get_current_super_admin),
    db: Session = Depends(get_db),
):
    b = db.query(Branch).filter(Branch.id == branch_id).first()
    if not b:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Branch not found.")

    managers = (
        db.query(User)
        .filter(User.branch_id == b.id, User.role == "MANAGER")
        .order_by(User.id.asc())
        .all()
    )
    mgr_info = [
        BranchManagerInfo(
            id=m.id,
            full_name=m.full_name,
            username=m.username,
            email=m.email,
            is_active=m.is_active,
            last_login=m.last_login,
        )
        for m in managers
    ]

    emps = db.query(Employee).filter(Employee.branch_id == b.id)
    emp_count = emps.count()
    active_emp_count = emps.filter(Employee.status == "active").count()
    outdoor_emp_count = emps.filter(Employee.is_outdoor_marketing_employee == True).count()

    cust_all = db.query(CustomerActivity).filter(CustomerActivity.branch_id == b.id).all()
    footfall = sum(c.customers_count or 1 for c in cust_all)
    closed = sum(_get_cust_closed_count(c) for c in cust_all)
    conv_rate = round((closed / footfall * 100), 1) if footfall > 0 else 100.0

    sch = db.query(SchemeRecord).filter(SchemeRecord.branch_id == b.id).all()
    sch_count = sum(s.customers_count or 1 for s in sch)
    sch_val = sum(s.amount for s in sch)

    revs = db.query(GoogleReview).filter(GoogleReview.branch_id == b.id).all()
    rev_count = sum(r.customers_count or 1 for r in revs)
    avg_rat = round(sum(r.rating for r in revs) / len(revs), 1) if len(revs) > 0 else 5.0

    out_leads = db.query(OutdoorMarketingCustomer).filter(OutdoorMarketingCustomer.branch_id == b.id).count()
    out_conv = db.query(OutdoorMarketingCustomer).filter(OutdoorMarketingCustomer.branch_id == b.id, OutdoorMarketingCustomer.status.in_(["Closed", "Interested"])).count()

    att = db.query(AttireRecord).filter(AttireRecord.branch_id == b.id).all()
    proper = sum(1 for a in att if a.status == "Proper")
    att_pct = round((proper / len(att) * 100), 1) if att else 100.0

    forms_cnt = db.query(EmployeeFormMedia).filter(EmployeeFormMedia.branch_id == b.id).count()

    summary = AdminBranchSummary(
        id=b.id,
        code=b.code,
        name=b.name,
        city=b.city,
        address=b.address,
        phone=b.phone,
        email=b.email,
        description=b.description,
        is_active=b.is_active,
        managers=mgr_info,
        employee_count=emp_count,
        active_employee_count=active_emp_count,
        outdoor_employee_count=outdoor_emp_count,
        customer_footfall=footfall,
        schemes_count=sch_count,
        schemes_value=sch_val,
        reviews_count=rev_count,
        average_rating=avg_rat,
        outdoor_leads=out_leads,
        conversion_rate=conv_rate,
        attire_compliance_pct=att_pct,
        daily_forms_count=forms_cnt,
    )

    perf = AdminBranchMetric(
        branch_id=b.id,
        branch_code=b.code,
        branch_name=b.name,
        city=b.city,
        manager_count=len(mgr_info),
        employee_count=emp_count,
        active_employee_count=active_emp_count,
        customer_footfall=footfall,
        customer_closed=closed,
        conversion_rate=conv_rate,
        schemes_count=sch_count,
        schemes_value=sch_val,
        reviews_count=rev_count,
        average_rating=avg_rat,
        outdoor_leads=out_leads,
        outdoor_converted=out_conv,
        attire_compliance_pct=att_pct,
        daily_forms_count=forms_cnt,
    )

    raw_b_acts = []
    c_recent = db.query(CustomerActivity).filter(CustomerActivity.branch_id == b.id).order_by(CustomerActivity.created_at.desc(), CustomerActivity.id.desc()).limit(8).all()
    for c in c_recent:
        emp_name = db.query(Employee.full_name).filter(Employee.id == c.employee_id).scalar() if c.employee_id else None
        c_count = c.customers_count or 1
        raw_b_acts.append((
            c.created_at or datetime.now(timezone.utc),
            AdminActivityFeedItem(
                id=f"b-cust-{c.id}",
                event_type="customer",
                title=f"Customer Activity: {c_count} Customer{'s' if c_count > 1 else ''} Attended",
                description=f"{c.breakdown or c.status}" + (f" by {emp_name}" if emp_name else ""),
                branch_id=b.id,
                branch_name=b.name,
                employee_name=emp_name,
                timestamp=(c.created_at or datetime.now(timezone.utc)).strftime("%I:%M %p, %d %b"),
                status_tag=f"{c_count} Cust • {c.status}",
            )
        ))
    for s in db.query(SchemeRecord).filter(SchemeRecord.branch_id == b.id).order_by(SchemeRecord.created_at.desc(), SchemeRecord.id.desc()).limit(5).all():
        emp_name = db.query(Employee.full_name).filter(Employee.id == s.employee_id).scalar() if s.employee_id else None
        s_count = s.customers_count or 1
        raw_b_acts.append((
            s.created_at or datetime.now(timezone.utc),
            AdminActivityFeedItem(
                id=f"b-sch-{s.id}",
                event_type="scheme",
                title=f"Gold Scheme: {s.scheme_name} ({s_count} Enrolled)",
                description=f"Amount: ₹{s.amount:,.0f} by {emp_name or 'Staff'}",
                branch_id=b.id,
                branch_name=b.name,
                employee_name=emp_name,
                timestamp=(s.created_at or datetime.now(timezone.utc)).strftime("%I:%M %p, %d %b"),
                status_tag=f"₹{s.amount:,.0f}",
            )
        ))

    raw_b_acts.sort(key=lambda x: x[0], reverse=True)
    recent_acts: List[AdminActivityFeedItem] = [item for _, item in raw_b_acts[:10]]

    return AdminBranchDetail(
        branch=summary,
        managers=mgr_info,
        performance=perf,
        recent_activities=recent_acts,
    )


@router.put("/branches/{branch_id}", response_model=AdminBranchSummary, summary="Update branch details")
def update_admin_branch(
    branch_id: int,
    data: AdminBranchUpdate,
    request: Request,
    current_admin: SuperAdminIdentity = Depends(get_current_super_admin),
    db: Session = Depends(get_db),
):
    b = db.query(Branch).filter(Branch.id == branch_id).first()
    if not b:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Branch not found.")

    if data.name is not None:
        b.name = data.name.strip()
    if data.city is not None:
        b.city = data.city.strip()
    if data.address is not None:
        b.address = data.address.strip()
    if data.phone is not None:
        b.phone = data.phone.strip()
    if data.email is not None:
        b.email = data.email.strip()
    if data.description is not None:
        b.description = data.description.strip()
    if data.is_active is not None:
        b.is_active = data.is_active

    db.commit()
    db.refresh(b)

    client_ip = request.client.host if request.client else None
    audit = AuditLog(
        branch_id=b.id,
        admin_id=None,
        admin_username=current_admin.email,
        action="Update Branch",
        entity="Branch",
        entity_id=str(b.id),
        ip_address=client_ip,
        details=f"Admin updated branch {b.name} ({b.code})",
    )
    db.add(audit)
    db.commit()

    return get_admin_branch_detail(b.id, current_admin, db).branch


# =========================================================================
# 4. Manager Management APIs
# =========================================================================
@router.get("/managers", response_model=List[AdminManagerResponse], summary="List all managers across branches")
def list_admin_managers(
    branch_id: Optional[int] = Query(None),
    is_active: Optional[bool] = Query(None),
    search: Optional[str] = Query(None),
    current_admin: SuperAdminIdentity = Depends(get_current_super_admin),
    db: Session = Depends(get_db),
):
    q = db.query(User).filter(User.role == "MANAGER")
    if branch_id:
        q = q.filter(User.branch_id == branch_id)
    if is_active is not None:
        q = q.filter(User.is_active == is_active)
    if search:
        s = f"%{search.strip().lower()}%"
        q = q.filter(or_(func.lower(User.full_name).like(s), func.lower(User.username).like(s), func.lower(User.email).like(s)))

    managers = q.order_by(User.branch_id.asc(), User.id.asc()).all()
    results = []
    for m in managers:
        b = db.query(Branch).filter(Branch.id == m.branch_id).first() if m.branch_id else None
        results.append(
            AdminManagerResponse(
                id=m.id,
                branch_id=m.branch_id,
                branch_code=b.code if b else "N/A",
                branch_name=b.name if b else "Unassigned",
                full_name=m.full_name,
                username=m.username,
                email=m.email,
                role=m.role,
                is_active=m.is_active,
                last_login=m.last_login,
                created_at=m.created_at,
            )
        )
    return results


@router.post("/managers", response_model=AdminManagerResponse, status_code=status.HTTP_201_CREATED, summary="Create a new showroom manager")
def create_admin_manager(
    data: AdminManagerCreate,
    request: Request,
    current_admin: SuperAdminIdentity = Depends(get_current_super_admin),
    db: Session = Depends(get_db),
):
    # Check duplicate username
    existing = db.query(User).filter(func.lower(User.username) == data.username.strip().lower()).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Username is already in use.")

    branch = db.query(Branch).filter(Branch.id == data.branch_id).first()
    if not branch:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assigned branch not found.")

    hashed = get_password_hash(data.password)
    fallback_email = data.email.strip() if data.email else f"{data.username.strip().lower()}@sirisamruddhigold.com"

    new_mgr = User(
        branch_id=branch.id,
        full_name=data.full_name.strip(),
        username=data.username.strip(),
        email=fallback_email,
        hashed_password=hashed,
        role="MANAGER",
        is_active=data.is_active,
    )
    db.add(new_mgr)
    db.commit()
    db.refresh(new_mgr)

    client_ip = request.client.host if request.client else None
    audit = AuditLog(
        branch_id=branch.id,
        admin_id=None,
        admin_username=current_admin.email,
        action="Create Manager",
        entity="User",
        entity_id=str(new_mgr.id),
        ip_address=client_ip,
        details=f"Admin created Manager {new_mgr.full_name} (@{new_mgr.username}) for {branch.name}",
    )
    db.add(audit)
    db.commit()

    return AdminManagerResponse(
        id=new_mgr.id,
        branch_id=branch.id,
        branch_code=branch.code,
        branch_name=branch.name,
        full_name=new_mgr.full_name,
        username=new_mgr.username,
        email=new_mgr.email,
        role=new_mgr.role,
        is_active=new_mgr.is_active,
        last_login=new_mgr.last_login,
        created_at=new_mgr.created_at,
    )


@router.put("/managers/{manager_id}", response_model=AdminManagerResponse, summary="Update manager details")
def update_admin_manager(
    manager_id: int,
    data: AdminManagerUpdate,
    request: Request,
    current_admin: SuperAdminIdentity = Depends(get_current_super_admin),
    db: Session = Depends(get_db),
):
    mgr = db.query(User).filter(User.id == manager_id, User.role == "MANAGER").first()
    if not mgr:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Manager not found.")

    if data.full_name is not None:
        mgr.full_name = data.full_name.strip()
    if data.username is not None:
        mgr.username = data.username.strip()
    if data.email is not None:
        mgr.email = data.email.strip()
    if data.branch_id is not None:
        branch = db.query(Branch).filter(Branch.id == data.branch_id).first()
        if not branch:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Branch not found.")
        mgr.branch_id = branch.id
    if data.is_active is not None:
        mgr.is_active = data.is_active

    db.commit()
    db.refresh(mgr)

    b = db.query(Branch).filter(Branch.id == mgr.branch_id).first() if mgr.branch_id else None

    client_ip = request.client.host if request.client else None
    audit = AuditLog(
        branch_id=mgr.branch_id,
        admin_id=None,
        admin_username=current_admin.email,
        action="Update Manager",
        entity="User",
        entity_id=str(mgr.id),
        ip_address=client_ip,
        details=f"Admin updated manager {mgr.full_name}",
    )
    db.add(audit)
    db.commit()

    return AdminManagerResponse(
        id=mgr.id,
        branch_id=mgr.branch_id,
        branch_code=b.code if b else "N/A",
        branch_name=b.name if b else "Unassigned",
        full_name=mgr.full_name,
        username=mgr.username,
        email=mgr.email,
        role=mgr.role,
        is_active=mgr.is_active,
        last_login=mgr.last_login,
        created_at=mgr.created_at,
    )


@router.post("/managers/{manager_id}/reset-password", response_model=MessageResponse, summary="Reset manager password")
def reset_manager_password(
    manager_id: int,
    data: AdminResetPasswordRequest,
    request: Request,
    current_admin: SuperAdminIdentity = Depends(get_current_super_admin),
    db: Session = Depends(get_db),
):
    mgr = db.query(User).filter(User.id == manager_id, User.role == "MANAGER").first()
    if not mgr:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Manager not found.")

    if len(data.new_password.strip()) < 6:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Password must be at least 6 characters.")

    mgr.hashed_password = get_password_hash(data.new_password.strip())
    db.commit()

    client_ip = request.client.host if request.client else None
    audit = AuditLog(
        branch_id=mgr.branch_id,
        admin_id=None,
        admin_username=current_admin.email,
        action="Reset Password",
        entity="User",
        entity_id=str(mgr.id),
        ip_address=client_ip,
        details=f"Admin reset password for manager {mgr.full_name} (@{mgr.username})",
    )
    db.add(audit)
    db.commit()

    return MessageResponse(message=f"Password for manager {mgr.full_name} successfully reset.")


@router.delete("/managers/{manager_id}", response_model=MessageResponse, summary="Deactivate/Delete manager")
def delete_admin_manager(
    manager_id: int,
    request: Request,
    current_admin: SuperAdminIdentity = Depends(get_current_super_admin),
    db: Session = Depends(get_db),
):
    mgr = db.query(User).filter(User.id == manager_id, User.role == "MANAGER").first()
    if not mgr:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Manager not found.")

    mgr.is_active = False
    db.commit()

    client_ip = request.client.host if request.client else None
    audit = AuditLog(
        branch_id=mgr.branch_id,
        admin_id=None,
        admin_username=current_admin.email,
        action="Deactivate Manager",
        entity="User",
        entity_id=str(mgr.id),
        ip_address=client_ip,
        details=f"Admin deactivated manager {mgr.full_name}",
    )
    db.add(audit)
    db.commit()

    return MessageResponse(message=f"Manager {mgr.full_name} deactivated successfully.")


# =========================================================================
# 5. Organization-Wide Employee Management APIs
# =========================================================================
@router.get("/employees", response_model=List[AdminEmployeeResponse], summary="Organization-wide employee directory")
def list_admin_employees(
    branch_id: Optional[int] = Query(None),
    department: Optional[str] = Query(None),
    designation: Optional[str] = Query(None),
    status_val: Optional[str] = Query(None, alias="status"),
    is_outdoor: Optional[bool] = Query(None),
    search: Optional[str] = Query(None),
    current_admin: SuperAdminIdentity = Depends(get_current_super_admin),
    db: Session = Depends(get_db),
):
    q = db.query(Employee)
    if branch_id:
        q = q.filter(Employee.branch_id == branch_id)
    if department and department != "all":
        q = q.filter(Employee.department == department)
    if designation and designation != "all":
        q = q.filter(Employee.designation == designation)
    if status_val and status_val != "all":
        q = q.filter(Employee.status == status_val)
    if is_outdoor is not None:
        q = q.filter(Employee.is_outdoor_marketing_employee == is_outdoor)
    if search:
        s = f"%{search.strip().lower()}%"
        q = q.filter(
            or_(
                func.lower(Employee.full_name).like(s),
                func.lower(Employee.employee_code).like(s),
                func.lower(Employee.designation).like(s),
                func.lower(Employee.phone).like(s),
            )
        )

    employees = q.order_by(Employee.branch_id.asc(), Employee.id.asc()).all()
    results: List[AdminEmployeeResponse] = []

    for emp in employees:
        branch = db.query(Branch).filter(Branch.id == emp.branch_id).first()
        manager = db.query(User).filter(User.id == emp.manager_id).first() if emp.manager_id else None

        # Aggregated stats
        cust_acts = db.query(CustomerActivity).filter(CustomerActivity.employee_id == emp.id)
        cust_attended = cust_acts.count()
        cust_closed = cust_acts.filter(CustomerActivity.status == "Closed").count()

        schemes = db.query(SchemeRecord).filter(SchemeRecord.employee_id == emp.id).all()
        schemes_count = len(schemes)
        schemes_amt = sum(s.amount for s in schemes)

        reviews = db.query(GoogleReview).filter(GoogleReview.employee_id == emp.id).all()
        rev_count = len(reviews)
        avg_rat = round(sum(r.rating for r in reviews) / rev_count, 1) if rev_count > 0 else 5.0

        attire = db.query(AttireRecord).filter(AttireRecord.employee_id == emp.id).all()
        proper_att = sum(1 for a in attire if a.status == "Proper")
        att_pct = round((proper_att / len(attire) * 100), 1) if attire else 100.0

        results.append(
            AdminEmployeeResponse(
                id=emp.id,
                branch_id=emp.branch_id,
                branch_code=branch.code if branch else "N/A",
                branch_name=branch.name if branch else "Showroom",
                manager_id=emp.manager_id,
                manager_name=manager.full_name if manager else None,
                employee_code=emp.employee_code,
                full_name=emp.full_name,
                phone=emp.phone,
                email=emp.email,
                designation=emp.designation or "Sales Executive",
                department=emp.department or "Sales Department",
                date_of_joining=emp.date_of_joining,
                status=emp.status,
                is_outdoor_marketing_employee=emp.is_outdoor_marketing_employee,
                profile_photo_url=emp.profile_photo_url,
                notes=emp.notes,
                customers_attended_count=cust_attended,
                customers_closed_count=cust_closed,
                schemes_closed_count=schemes_count,
                schemes_total_amount=schemes_amt,
                reviews_count=rev_count,
                average_rating=avg_rat,
                attire_compliance_pct=att_pct,
                created_at=emp.created_at,
            )
        )

    return results


@router.post("/employees", response_model=AdminEmployeeResponse, status_code=status.HTTP_201_CREATED, summary="Create an employee in any branch")
def create_admin_employee(
    data: AdminEmployeeCreate,
    request: Request,
    current_admin: SuperAdminIdentity = Depends(get_current_super_admin),
    db: Session = Depends(get_db),
):
    branch = db.query(Branch).filter(Branch.id == data.branch_id).first()
    if not branch:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Target branch not found.")

    first_mgr = db.query(User).filter(User.branch_id == branch.id, User.role == "MANAGER", User.is_active == True).first()

    code = data.employee_code
    if not code:
        count = db.query(Employee).filter(Employee.branch_id == branch.id).count() + 1
        prefix = f"EMP-{branch.code[:3]}-"
        code = f"{prefix}{count:03d}"

    emp = Employee(
        branch_id=branch.id,
        manager_id=first_mgr.id if first_mgr else None,
        employee_code=code.strip(),
        full_name=data.full_name.strip(),
        phone=data.phone.strip() if data.phone else "",
        email=data.email.strip() if data.email else None,
        designation=data.designation.strip() if data.designation else "Sales Executive",
        department=data.department.strip() if data.department else "Sales & Showroom Operations",
        date_of_joining=data.date_of_joining or date.today(),
        status=data.status or "active",
        is_outdoor_marketing_employee=data.is_outdoor_marketing_employee or False,
        notes=data.notes,
    )
    db.add(emp)
    db.commit()
    db.refresh(emp)

    client_ip = request.client.host if request.client else None
    audit = AuditLog(
        branch_id=branch.id,
        admin_id=None,
        admin_username=current_admin.email,
        action="Create Employee",
        entity="Employee",
        entity_id=str(emp.id),
        ip_address=client_ip,
        details=f"Admin created employee {emp.full_name} [{emp.employee_code}] in {branch.name}",
    )
    db.add(audit)
    db.commit()

    return list_admin_employees(branch_id=branch.id, search=emp.employee_code, current_admin=current_admin, db=db)[0]


@router.put("/employees/{employee_id}", response_model=AdminEmployeeResponse, summary="Update employee")
def update_admin_employee(
    employee_id: int,
    data: AdminEmployeeUpdate,
    request: Request,
    current_admin: SuperAdminIdentity = Depends(get_current_super_admin),
    db: Session = Depends(get_db),
):
    emp = db.query(Employee).filter(Employee.id == employee_id).first()
    if not emp:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found.")

    if data.full_name is not None:
        emp.full_name = data.full_name.strip()
    if data.employee_code is not None:
        emp.employee_code = data.employee_code.strip()
    if data.phone is not None:
        emp.phone = data.phone.strip()
    if data.email is not None:
        emp.email = data.email.strip()
    if data.designation is not None:
        emp.designation = data.designation.strip()
    if data.department is not None:
        emp.department = data.department.strip()
    if data.date_of_joining is not None:
        emp.date_of_joining = data.date_of_joining
    if data.status is not None:
        emp.status = data.status
    if data.is_outdoor_marketing_employee is not None:
        emp.is_outdoor_marketing_employee = data.is_outdoor_marketing_employee
    if data.notes is not None:
        emp.notes = data.notes

    db.commit()
    db.refresh(emp)

    client_ip = request.client.host if request.client else None
    audit = AuditLog(
        branch_id=emp.branch_id,
        admin_id=None,
        admin_username=current_admin.email,
        action="Update Employee",
        entity="Employee",
        entity_id=str(emp.id),
        ip_address=client_ip,
        details=f"Admin updated employee {emp.full_name}",
    )
    db.add(audit)
    db.commit()

    return list_admin_employees(branch_id=emp.branch_id, search=emp.employee_code, current_admin=current_admin, db=db)[0]


@router.put("/employees/{employee_id}/reassign-branch", response_model=AdminEmployeeResponse, summary="Reassign employee to another branch")
def reassign_employee_branch(
    employee_id: int,
    data: AdminEmployeeReassignBranch,
    request: Request,
    current_admin: SuperAdminIdentity = Depends(get_current_super_admin),
    db: Session = Depends(get_db),
):
    emp = db.query(Employee).filter(Employee.id == employee_id).first()
    if not emp:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found.")

    new_branch = db.query(Branch).filter(Branch.id == data.new_branch_id).first()
    if not new_branch:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Target branch not found.")

    old_branch_name = db.query(Branch.name).filter(Branch.id == emp.branch_id).scalar() or "Previous Branch"
    emp.branch_id = new_branch.id
    if data.new_manager_id:
        emp.manager_id = data.new_manager_id
    else:
        first_mgr = db.query(User).filter(User.branch_id == new_branch.id, User.role == "MANAGER", User.is_active == True).first()
        emp.manager_id = first_mgr.id if first_mgr else None

    db.commit()
    db.refresh(emp)

    client_ip = request.client.host if request.client else None
    audit = AuditLog(
        branch_id=new_branch.id,
        admin_id=None,
        admin_username=current_admin.email,
        action="Reassign Employee Branch",
        entity="Employee",
        entity_id=str(emp.id),
        ip_address=client_ip,
        details=f"Admin transferred employee {emp.full_name} from {old_branch_name} to {new_branch.name}",
    )
    db.add(audit)
    db.commit()

    return list_admin_employees(branch_id=new_branch.id, search=emp.employee_code, current_admin=current_admin, db=db)[0]


@router.get("/employees/{employee_id}", response_model=AdminEmployeeDetailResponse, summary="Get 360 employee details and activity history for admin")
def get_admin_employee_detail(
    employee_id: int,
    current_admin: SuperAdminIdentity = Depends(get_current_super_admin),
    db: Session = Depends(get_db),
):
    emp = db.query(Employee).filter(Employee.id == employee_id).first()
    if not emp:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found.")

    branch = db.query(Branch).filter(Branch.id == emp.branch_id).first()
    manager = db.query(User).filter(User.id == emp.manager_id).first() if emp.manager_id else None

    # Aggregated stats
    cust_acts = db.query(CustomerActivity).filter(CustomerActivity.employee_id == emp.id).order_by(CustomerActivity.activity_date.desc(), CustomerActivity.id.desc()).all()
    cust_attended = sum(c.customers_count or 1 for c in cust_acts)
    cust_closed = sum(_get_cust_closed_count(c) for c in cust_acts)

    schemes = db.query(SchemeRecord).filter(SchemeRecord.employee_id == emp.id).order_by(SchemeRecord.record_date.desc(), SchemeRecord.id.desc()).all()
    schemes_count = sum(s.customers_count or 1 for s in schemes)
    schemes_amt = sum(s.amount for s in schemes)

    reviews = db.query(GoogleReview).filter(GoogleReview.employee_id == emp.id).order_by(GoogleReview.review_date.desc(), GoogleReview.id.desc()).all()
    rev_count = sum(r.customers_count or 1 for r in reviews)
    avg_rat = round(sum(r.rating for r in reviews) / len(reviews), 1) if len(reviews) > 0 else 5.0

    attire = db.query(AttireRecord).filter(AttireRecord.employee_id == emp.id).order_by(AttireRecord.check_date.desc(), AttireRecord.id.desc()).all()
    proper_att = sum(1 for a in attire if a.status == "Proper")
    att_pct = round((proper_att / len(attire) * 100), 1) if attire else 100.0

    form_media = db.query(EmployeeFormMedia).filter(EmployeeFormMedia.employee_id == emp.id).order_by(EmployeeFormMedia.created_at.desc(), EmployeeFormMedia.id.desc()).all()

    outdoor_areas = db.query(OutdoorMarketingArea).filter(OutdoorMarketingArea.assigned_employee_id == emp.id).order_by(OutdoorMarketingArea.created_at.desc()).all()
    outdoor_cust = db.query(OutdoorMarketingCustomer).filter(OutdoorMarketingCustomer.marketing_employee_id == emp.id).order_by(OutdoorMarketingCustomer.created_at.desc()).all()
    outdoor_sch = db.query(OutdoorMarketingScheme).filter(OutdoorMarketingScheme.employee_id == emp.id).order_by(OutdoorMarketingScheme.created_at.desc()).all()

    emp_resp = AdminEmployeeResponse(
        id=emp.id,
        branch_id=emp.branch_id,
        branch_code=branch.code if branch else "N/A",
        branch_name=branch.name if branch else "Showroom",
        manager_id=emp.manager_id,
        manager_name=manager.full_name if manager else None,
        employee_code=emp.employee_code,
        full_name=emp.full_name,
        phone=emp.phone or "",
        email=emp.email,
        designation=emp.designation or "Sales Executive",
        department=emp.department or "Sales Department",
        date_of_joining=emp.date_of_joining,
        status=emp.status,
        is_outdoor_marketing_employee=emp.is_outdoor_marketing_employee,
        profile_photo_url=emp.profile_photo_url,
        notes=emp.notes,
        customers_attended_count=cust_attended,
        customers_closed_count=cust_closed,
        schemes_closed_count=schemes_count,
        schemes_total_amount=schemes_amt,
        reviews_count=rev_count,
        average_rating=avg_rat,
        attire_compliance_pct=att_pct,
        created_at=emp.created_at,
    )

    cust_list = [
        {
            "id": c.id,
            "activity_date": c.activity_date.strftime("%Y-%m-%d"),
            "customer_name": c.customer_name,
            "phone_number": c.phone_number,
            "status": c.status,
            "customers_count": c.customers_count or 1,
            "breakdown": _format_clean_breakdown(c.breakdown, c.status),
            "notes": _format_clean_breakdown(c.notes, "") if c.notes and ("{" in c.notes or "[" in c.notes) else c.notes,
            "created_at": c.created_at.isoformat() if c.created_at else None,
        }
        for c in cust_acts
    ]

    sch_list = [
        {
            "id": s.id,
            "record_date": s.record_date.strftime("%Y-%m-%d"),
            "customer_name": s.customer_name,
            "scheme_name": s.scheme_name,
            "amount": s.amount,
            "customers_count": s.customers_count or 1,
            "notes": s.notes,
            "created_at": s.created_at.isoformat() if s.created_at else None,
        }
        for s in schemes
    ]

    rev_list = [
        {
            "id": r.id,
            "review_date": r.review_date.strftime("%Y-%m-%d"),
            "customer_name": r.customer_name,
            "rating": r.rating,
            "review_text": r.review_text,
            "screenshot_url": r.screenshot_url,
            "customers_count": r.customers_count or 1,
            "notes": r.notes,
        }
        for r in reviews
    ]

    att_list = [
        {
            "id": a.id,
            "record_date": a.check_date.strftime("%Y-%m-%d"),
            "status": a.status,
            "notes": a.notes,
            "photo_url": a.image_url,
        }
        for a in attire
    ]

    media_list = [
        {
            "id": m.id,
            "form_type": m.form_type,
            "file_url": m.file_url,
            "notes": m.notes,
            "created_at": m.created_at.isoformat() if m.created_at else None,
        }
        for m in form_media
    ]

    out_areas_list = [
        {
            "id": oa.id,
            "area_name": oa.area_name,
            "landmark": oa.location,
            "city": "",
            "status": oa.status,
            "notes": oa.notes,
            "created_at": oa.created_at.isoformat() if oa.created_at else None,
        }
        for oa in outdoor_areas
    ]

    out_cust_list = [
        {
            "id": oc.id,
            "customer_name": oc.customer_name,
            "phone_number": oc.phone,
            "area_name": oc.area_name,
            "status": oc.status,
            "notes": oc.notes,
            "created_at": oc.created_at.isoformat() if oc.created_at else None,
        }
        for oc in outdoor_cust
    ]

    out_sch_list = [
        {
            "id": os.id,
            "customer_name": os.customer_name,
            "scheme_name": os.scheme_name,
            "amount": os.amount,
            "notes": os.notes,
            "created_at": os.created_at.isoformat() if os.created_at else None,
        }
        for os in outdoor_sch
    ]

    return AdminEmployeeDetailResponse(
        employee=emp_resp,
        customer_activities=cust_list,
        schemes=sch_list,
        google_reviews=rev_list,
        attire_records=att_list,
        gallery_media=media_list,
        outdoor_areas=out_areas_list,
        outdoor_customers=out_cust_list,
        outdoor_schemes=out_sch_list,
    )


# =========================================================================
# 6. Performance Engine & Leaderboard Rankings
# =========================================================================
@router.get("/performance", response_model=List[AdminEmployeePerformance], summary="Calculated employee performance scoring & rankings")
def get_admin_employee_performance(
    branch_id: Optional[int] = Query(None),
    department: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    sort_by: Optional[str] = Query("overall", description="Sort by: overall, customer, schemes, reviews, compliance, outdoor"),
    current_admin: SuperAdminIdentity = Depends(get_current_super_admin),
    db: Session = Depends(get_db),
):
    # Safely sanitize branch_id
    clean_branch_id: Optional[int] = None
    if branch_id is not None and isinstance(branch_id, (int, str)):
        try:
            clean_branch_id = int(branch_id)
        except Exception:
            clean_branch_id = None

    q = db.query(Employee).filter(Employee.status == "active")
    if clean_branch_id:
        q = q.filter(Employee.branch_id == clean_branch_id)
    if department and isinstance(department, str) and department.strip() and department != "all":
        q = q.filter(Employee.department == department.strip())
    if search and isinstance(search, str) and search.strip():
        s = f"%{search.strip().lower()}%"
        q = q.filter(or_(func.lower(Employee.full_name).like(s), func.lower(Employee.employee_code).like(s)))

    clean_sort_by = sort_by if isinstance(sort_by, str) and sort_by.strip() else "overall"

    employees = q.all()
    results: List[AdminEmployeePerformance] = []

    for emp in employees:
        branch = db.query(Branch).filter(Branch.id == emp.branch_id).first()

        # 1. Customer Engagement (30% weight)
        cust_acts = db.query(CustomerActivity).filter(CustomerActivity.employee_id == emp.id).all()
        attended = sum(c.customers_count or 1 for c in cust_acts)
        closed = sum(_get_cust_closed_count(c) for c in cust_acts)
        conv_rate = round((closed / attended * 100), 1) if attended > 0 else 0.0
        # Score based on closures and conversion (max benchmark 5 closures or 80% conversion)
        cust_score = min(100.0, round((closed * 20.0) + (conv_rate * 0.5), 1)) if attended > 0 else 75.0

        # 2. Gold Schemes (30% weight)
        schemes = db.query(SchemeRecord).filter(SchemeRecord.employee_id == emp.id).all()
        schemes_count = sum(s.customers_count or 1 for s in schemes)
        schemes_amount = sum(s.amount for s in schemes)
        # Benchmark: 3 schemes = 100% or amount >= 15000
        scheme_score = min(100.0, round((schemes_count * 30.0) + (schemes_amount / 500.0), 1)) if schemes_count > 0 else 70.0

        # 3. Google Reviews (15% weight)
        reviews = db.query(GoogleReview).filter(GoogleReview.employee_id == emp.id).all()
        rev_count = sum(r.customers_count or 1 for r in reviews)
        avg_rat = round(sum(r.rating for r in reviews) / len(reviews), 1) if len(reviews) > 0 else 5.0
        rev_score = min(100.0, round((rev_count * 35.0) + ((avg_rat / 5.0) * 30.0), 1)) if rev_count > 0 else 85.0

        # 4. Grooming & Compliance (15% weight)
        attire = db.query(AttireRecord).filter(AttireRecord.employee_id == emp.id).all()
        att_proper = sum(1 for a in attire if a.status == "Proper")
        att_total = len(attire)
        compliance_score = round((att_proper / att_total * 100.0), 1) if att_total > 0 else 95.0

        # 5. Outdoor Marketing (10% weight or integrated)
        out_leads = db.query(OutdoorMarketingCustomer).filter(OutdoorMarketingCustomer.marketing_employee_id == emp.id)
        leads_cnt = out_leads.count()
        leads_closed = out_leads.filter(OutdoorMarketingCustomer.status.in_(["Closed", "Interested"])).count()
        outdoor_score = min(100.0, round((leads_cnt * 20.0) + (leads_closed * 30.0), 1)) if leads_cnt > 0 else (90.0 if emp.is_outdoor_marketing_employee else 85.0)

        # Weighted Overall Score
        overall = round(
            (cust_score * 0.30)
            + (scheme_score * 0.30)
            + (rev_score * 0.15)
            + (compliance_score * 0.15)
            + (outdoor_score * 0.10),
            1,
        )

        results.append(
            AdminEmployeePerformance(
                employee_id=emp.id,
                employee_code=emp.employee_code,
                full_name=emp.full_name,
                branch_id=emp.branch_id,
                branch_code=branch.code if branch else "N/A",
                branch_name=branch.name if branch else "Showroom",
                designation=emp.designation or "Sales Executive",
                department=emp.department or "Sales",
                is_outdoor=emp.is_outdoor_marketing_employee,
                rank=0,
                overall_score=overall,
                customer_engagement_score=cust_score,
                gold_schemes_score=scheme_score,
                google_reviews_score=rev_score,
                compliance_score=compliance_score,
                outdoor_marketing_score=outdoor_score,
                customers_attended=attended,
                customers_closed=closed,
                conversion_rate=conv_rate,
                schemes_count=schemes_count,
                schemes_amount=schemes_amount,
                reviews_count=rev_count,
                average_rating=avg_rat,
                attire_proper=att_proper,
                attire_total=att_total,
                outdoor_leads=leads_cnt,
                outdoor_closed=leads_closed,
            )
        )

    # Sort and assign ranks
    sort_key = {
        "overall": lambda x: x.overall_score,
        "customer": lambda x: x.customer_engagement_score,
        "schemes": lambda x: x.gold_schemes_score,
        "reviews": lambda x: x.google_reviews_score,
        "compliance": lambda x: x.compliance_score,
        "outdoor": lambda x: x.outdoor_marketing_score,
    }.get(clean_sort_by, lambda x: x.overall_score)

    results.sort(key=sort_key, reverse=True)
    for idx, item in enumerate(results, start=1):
        item.rank = idx

    return results


@router.get("/performance/leaderboard", response_model=List[AdminEmployeePerformance], summary="Performance Leaderboard Rankings")
def get_admin_employee_performance_leaderboard(
    branch_id: Optional[int] = Query(None),
    department: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    sort_by: Optional[str] = Query("overall", description="Sort by: overall, customer, schemes, reviews, compliance, outdoor"),
    current_admin: SuperAdminIdentity = Depends(get_current_super_admin),
    db: Session = Depends(get_db),
):
    return get_admin_employee_performance(
        branch_id=branch_id,
        department=department,
        search=search,
        sort_by=sort_by,
        current_admin=current_admin,
        db=db,
    )


# =========================================================================
# 7. Customer CRM & Activities APIs
# =========================================================================
@router.get("/customers", summary="Organization-wide customer list")
def list_admin_customers(
    branch_id: Optional[int] = Query(None),
    status_val: Optional[str] = Query(None, alias="status"),
    search: Optional[str] = Query(None),
    current_admin: SuperAdminIdentity = Depends(get_current_super_admin),
    db: Session = Depends(get_db),
):
    q = db.query(CustomerActivity)
    if branch_id:
        q = q.filter(CustomerActivity.branch_id == branch_id)
    if status_val and status_val != "all":
        q = q.filter(CustomerActivity.status == status_val)
    if search:
        s = f"%{search.strip().lower()}%"
        q = q.filter(or_(func.lower(CustomerActivity.customer_name).like(s), func.lower(CustomerActivity.phone_number).like(s)))

    acts = q.order_by(CustomerActivity.activity_date.desc(), CustomerActivity.id.desc()).all()
    results = []
    for a in acts:
        branch = db.query(Branch).filter(Branch.id == a.branch_id).first()
        emp = db.query(Employee).filter(Employee.id == a.employee_id).first()
        
        # Schemes for this customer
        cust_schemes = db.query(SchemeRecord).filter(func.lower(SchemeRecord.customer_name) == func.lower(a.customer_name)).all()
        sch_val = sum(s.amount for s in cust_schemes)

        clean_notes = _format_clean_breakdown(a.notes, "") if a.notes and ("{" in a.notes or "[" in a.notes) else a.notes
        clean_bd = _format_clean_breakdown(a.breakdown, a.status)
        results.append(
            {
                "id": a.id,
                "customer_name": a.customer_name,
                "phone_number": a.phone_number,
                "branch_id": a.branch_id,
                "branch_name": branch.name if branch else "Showroom",
                "employee_id": a.employee_id,
                "employee_name": emp.full_name if emp else "Staff",
                "activity_date": a.activity_date.strftime("%Y-%m-%d"),
                "status": a.status,
                "notes": clean_notes,
                "customers_count": a.customers_count or 1,
                "breakdown": clean_bd,
                "schemes_count": len(cust_schemes),
                "total_scheme_value": sch_val,
            }
        )
    return results


@router.get("/customer-activities", summary="Organization-wide customer activity logs")
def list_admin_customer_activities(
    branch_id: Optional[int] = Query(None),
    employee_id: Optional[int] = Query(None),
    status_val: Optional[str] = Query(None, alias="status"),
    current_admin: SuperAdminIdentity = Depends(get_current_super_admin),
    db: Session = Depends(get_db),
):
    q = db.query(CustomerActivity)
    if branch_id:
        q = q.filter(CustomerActivity.branch_id == branch_id)
    if employee_id:
        q = q.filter(CustomerActivity.employee_id == employee_id)
    if status_val and status_val != "all":
        q = q.filter(CustomerActivity.status == status_val)

    activities = q.order_by(CustomerActivity.activity_date.desc(), CustomerActivity.id.desc()).all()
    results = []
    for act in activities:
        b = db.query(Branch).filter(Branch.id == act.branch_id).first()
        emp = db.query(Employee).filter(Employee.id == act.employee_id).first()
        clean_act_notes = _format_clean_breakdown(act.notes, "") if act.notes and ("{" in act.notes or "[" in act.notes) else act.notes
        clean_act_bd = _format_clean_breakdown(act.breakdown, act.status)
        results.append(
            {
                "id": act.id,
                "branch_id": act.branch_id,
                "branch_code": b.code if b else "",
                "branch_name": b.name if b else "Showroom",
                "employee_id": act.employee_id,
                "employee_name": emp.full_name if emp else "Staff",
                "employee_code": emp.employee_code if emp else "",
                "customer_name": act.customer_name,
                "phone_number": act.phone_number,
                "dob": act.dob.strftime("%Y-%m-%d") if getattr(act, "dob", None) else None,
                "anniversary": act.anniversary.strftime("%Y-%m-%d") if getattr(act, "anniversary", None) else None,
                "product_value": getattr(act, "product_value", 0.0) or 0.0,
                "activity_date": act.activity_date.strftime("%Y-%m-%d"),
                "status": act.status,
                "notes": clean_act_notes,
                "customers_count": act.customers_count or 1,
                "breakdown": clean_act_bd,
            }
        )
    return results


# =========================================================================
# 8. Gold Schemes Analytics APIs
# =========================================================================
@router.get("/gold-schemes", summary="Organization-wide gold schemes analytics")
def get_admin_gold_schemes(
    branch_id: Optional[int] = Query(None),
    current_admin: SuperAdminIdentity = Depends(get_current_super_admin),
    db: Session = Depends(get_db),
):
    q = db.query(SchemeRecord)
    if branch_id:
        q = q.filter(SchemeRecord.branch_id == branch_id)

    all_schemes = q.order_by(SchemeRecord.record_date.desc(), SchemeRecord.id.desc()).all()
    total_count = sum(s.customers_count or 1 for s in all_schemes)
    total_val = sum(s.amount for s in all_schemes)

    # Branch breakdown
    branches = db.query(Branch).filter(Branch.is_active == True).all()
    branch_breakdown = []
    for b in branches:
        b_sch = db.query(SchemeRecord).filter(SchemeRecord.branch_id == b.id).all()
        branch_breakdown.append(
            {
                "branch_id": b.id,
                "branch_name": b.name,
                "count": sum(s.customers_count or 1 for s in b_sch),
                "total_amount": sum(s.amount for s in b_sch),
            }
        )

    # Top salespeople by scheme value
    emp_totals: Dict[int, Dict[str, Any]] = {}
    for s in all_schemes:
        if s.employee_id not in emp_totals:
            emp = db.query(Employee).filter(Employee.id == s.employee_id).first()
            b = db.query(Branch).filter(Branch.id == s.branch_id).first()
            emp_totals[s.employee_id] = {
                "employee_id": s.employee_id,
                "employee_name": emp.full_name if emp else "Staff",
                "branch_name": b.name if b else "Showroom",
                "count": 0,
                "total_amount": 0.0,
            }
        emp_totals[s.employee_id]["count"] += (s.customers_count or 1)
        emp_totals[s.employee_id]["total_amount"] += s.amount

    top_performers = sorted(emp_totals.values(), key=lambda x: x["total_amount"], reverse=True)[:5]

    # Detailed list items
    schemes_list = []
    for s in all_schemes:
        b = db.query(Branch).filter(Branch.id == s.branch_id).first()
        emp = db.query(Employee).filter(Employee.id == s.employee_id).first()
        schemes_list.append(
            {
                "id": s.id,
                "branch_id": s.branch_id,
                "branch_name": b.name if b else "Showroom",
                "employee_id": s.employee_id,
                "employee_name": emp.full_name if emp else "Staff",
                "customer_name": s.customer_name,
                "scheme_name": s.scheme_name,
                "amount": s.amount,
                "record_date": s.record_date.strftime("%Y-%m-%d"),
                "notes": s.notes,
                "customers_count": s.customers_count or 1,
            }
        )

    return {
        "total_schemes": total_count,
        "total_value": total_val,
        "branch_breakdown": branch_breakdown,
        "top_performers": top_performers,
        "schemes": schemes_list,
    }


# =========================================================================
# 9. Outdoor Marketing APIs
# =========================================================================
@router.get("/outdoor-marketing/overview", summary="Organization-wide outdoor marketing summary")
def get_admin_outdoor_overview(
    branch_id: Optional[int] = Query(None),
    current_admin: SuperAdminIdentity = Depends(get_current_super_admin),
    db: Session = Depends(get_db),
):
    emp_q = db.query(Employee).filter(Employee.is_outdoor_marketing_employee == True)
    area_q = db.query(OutdoorMarketingArea)
    cust_q = db.query(OutdoorMarketingCustomer)
    sch_q = db.query(OutdoorMarketingScheme)

    if branch_id:
        emp_q = emp_q.filter(Employee.branch_id == branch_id)
        area_q = area_q.filter(OutdoorMarketingArea.branch_id == branch_id)
        cust_q = cust_q.filter(OutdoorMarketingCustomer.branch_id == branch_id)
        sch_q = sch_q.filter(OutdoorMarketingScheme.branch_id == branch_id)

    total_staff = emp_q.count()
    areas_covered = area_q.count()
    total_leads = cust_q.count()
    schemes_pitched = sch_q.count()
    converted_leads = cust_q.filter(OutdoorMarketingCustomer.status.in_(["Closed", "Interested"])).count()
    conversion_rate = round((converted_leads / total_leads * 100), 1) if total_leads > 0 else 0.0

    return {
        "total_outdoor_employees": total_staff,
        "areas_covered": areas_covered,
        "customers_generated": total_leads,
        "schemes_promoted": schemes_pitched,
        "converted_leads": converted_leads,
        "conversion_rate": conversion_rate,
    }


@router.get("/outdoor-marketing/areas", summary="All outdoor marketing target areas")
def list_admin_outdoor_areas(
    branch_id: Optional[int] = Query(None),
    current_admin: SuperAdminIdentity = Depends(get_current_super_admin),
    db: Session = Depends(get_db),
):
    q = db.query(OutdoorMarketingArea)
    if branch_id:
        q = q.filter(OutdoorMarketingArea.branch_id == branch_id)
    areas = q.order_by(OutdoorMarketingArea.activity_date.desc()).all()
    results = []
    for a in areas:
        b = db.query(Branch).filter(Branch.id == a.branch_id).first()
        emp = db.query(Employee).filter(Employee.id == a.assigned_employee_id).first() if a.assigned_employee_id else None
        results.append(
            {
                "id": a.id,
                "branch_id": a.branch_id,
                "branch_name": b.name if b else "Showroom",
                "area_name": a.area_name,
                "location": a.location,
                "assigned_employee_id": a.assigned_employee_id,
                "assigned_employee_name": emp.full_name if emp else "Unassigned",
                "activity_date": a.activity_date.strftime("%Y-%m-%d"),
                "status": a.status,
                "notes": a.notes,
            }
        )
    return results


@router.get("/outdoor-marketing/customers", summary="All outdoor marketing customer leads")
def list_admin_outdoor_customers(
    branch_id: Optional[int] = Query(None),
    current_admin: SuperAdminIdentity = Depends(get_current_super_admin),
    db: Session = Depends(get_db),
):
    q = db.query(OutdoorMarketingCustomer)
    if branch_id:
        q = q.filter(OutdoorMarketingCustomer.branch_id == branch_id)
    customers = q.order_by(OutdoorMarketingCustomer.date.desc()).all()
    results = []
    for c in customers:
        b = db.query(Branch).filter(Branch.id == c.branch_id).first()
        emp = db.query(Employee).filter(Employee.id == c.marketing_employee_id).first()
        results.append(
            {
                "id": c.id,
                "branch_id": c.branch_id,
                "branch_name": b.name if b else "Showroom",
                "marketing_employee_id": c.marketing_employee_id,
                "marketing_employee_name": emp.full_name if emp else "Staff",
                "customer_name": c.customer_name,
                "phone": c.phone,
                "area_name": c.area_name,
                "scheme_name": c.scheme_name,
                "date": c.date.strftime("%Y-%m-%d"),
                "status": c.status,
                "notes": c.notes,
            }
        )
    return results


@router.get("/outdoor-marketing/schemes", summary="All outdoor marketing promotional schemes")
def list_admin_outdoor_schemes(
    branch_id: Optional[int] = Query(None),
    current_admin: SuperAdminIdentity = Depends(get_current_super_admin),
    db: Session = Depends(get_db),
):
    q = db.query(OutdoorMarketingScheme)
    if branch_id:
        q = q.filter(OutdoorMarketingScheme.branch_id == branch_id)
    schemes = q.order_by(OutdoorMarketingScheme.date.desc()).all()
    results = []
    for s in schemes:
        b = db.query(Branch).filter(Branch.id == s.branch_id).first()
        emp = db.query(Employee).filter(Employee.id == s.employee_id).first()
        results.append(
            {
                "id": s.id,
                "branch_id": s.branch_id,
                "branch_name": b.name if b else "Showroom",
                "employee_id": s.employee_id,
                "employee_name": emp.full_name if emp else "Staff",
                "date": s.date.strftime("%Y-%m-%d"),
                "scheme_name": s.scheme_name,
                "description": s.description,
                "area": s.area,
                "notes": s.notes,
            }
        )
    return results


# =========================================================================
# 10. Google Reviews Reputation APIs
# =========================================================================
@router.get("/google-reviews", summary="Organization-wide Google reviews & ratings")
def get_admin_google_reviews(
    branch_id: Optional[int] = Query(None),
    rating: Optional[int] = Query(None),
    status_val: Optional[str] = Query(None, alias="status"),
    current_admin: SuperAdminIdentity = Depends(get_current_super_admin),
    db: Session = Depends(get_db),
):
    q = db.query(GoogleReview)
    if branch_id:
        q = q.filter(GoogleReview.branch_id == branch_id)
    if rating:
        q = q.filter(GoogleReview.rating == rating)
    if status_val and status_val != "all":
        q = q.filter(GoogleReview.status == status_val)

    reviews = q.order_by(GoogleReview.review_date.desc(), GoogleReview.id.desc()).all()
    total_revs = sum(r.customers_count or 1 for r in reviews)
    avg_rating = round(sum(r.rating for r in reviews) / len(reviews), 1) if len(reviews) > 0 else 5.0

    # Star distribution
    star_dist = {5: 0, 4: 0, 3: 0, 2: 0, 1: 0}
    for r in reviews:
        if r.rating in star_dist:
            star_dist[r.rating] += (r.customers_count or 1)

    # Branch ratings
    branches = db.query(Branch).filter(Branch.is_active == True).all()
    branch_ratings = []
    for b in branches:
        b_revs = db.query(GoogleReview).filter(GoogleReview.branch_id == b.id).all()
        b_avg = round(sum(r.rating for r in b_revs) / len(b_revs), 1) if len(b_revs) > 0 else 5.0
        branch_ratings.append(
            {
                "branch_id": b.id,
                "branch_name": b.name,
                "count": sum(r.customers_count or 1 for r in b_revs),
                "average_rating": b_avg,
            }
        )

    rev_items = []
    for r in reviews:
        b = db.query(Branch).filter(Branch.id == r.branch_id).first()
        emp = db.query(Employee).filter(Employee.id == r.employee_id).first() if r.employee_id else None
        rev_items.append(
            {
                "id": r.id,
                "branch_id": r.branch_id,
                "branch_name": b.name if b else "Showroom",
                "employee_id": r.employee_id,
                "employee_name": emp.full_name if emp else "Unassigned",
                "customer_name": r.customer_name,
                "review_date": r.review_date.strftime("%Y-%m-%d"),
                "rating": r.rating,
                "review_text": r.review_text,
                "notes": r.notes,
                "screenshot_url": r.screenshot_url,
                "status": r.status,
                "customers_count": r.customers_count or 1,
            }
        )

    return {
        "total_reviews": total_revs,
        "average_rating": avg_rating,
        "star_distribution": star_dist,
        "branch_ratings": branch_ratings,
        "verified_count": sum(r.customers_count or 1 for r in reviews if r.status == "Verified"),
        "pending_count": sum(r.customers_count or 1 for r in reviews if r.status == "Pending"),
        "reviews": rev_items,
    }


@router.post("/google-reviews/{review_id}/verify", response_model=MessageResponse, summary="Verify Google Review")
def verify_admin_google_review(
    review_id: int,
    request: Request,
    current_admin: SuperAdminIdentity = Depends(get_current_super_admin),
    db: Session = Depends(get_db),
):
    rev = db.query(GoogleReview).filter(GoogleReview.id == review_id).first()
    if not rev:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Google review not found.")

    rev.status = "Verified"
    db.commit()

    client_ip = request.client.host if request.client else None
    audit = AuditLog(
        branch_id=rev.branch_id,
        admin_id=None,
        admin_username=current_admin.email,
        action="Verify Google Review",
        entity="GoogleReview",
        entity_id=str(rev.id),
        ip_address=client_ip,
        details=f"Admin verified review by {rev.customer_name}",
    )
    db.add(audit)
    db.commit()

    return MessageResponse(message="Google review marked as verified.")


# =========================================================================
# 11. Attire & Grooming Compliance APIs
# =========================================================================
@router.get("/attire", summary="Organization-wide uniform & attire compliance")
def get_admin_attire_records(
    branch_id: Optional[int] = Query(None),
    status_val: Optional[str] = Query(None, alias="status"),
    current_admin: SuperAdminIdentity = Depends(get_current_super_admin),
    db: Session = Depends(get_db),
):
    q = db.query(AttireRecord)
    if branch_id:
        q = q.filter(AttireRecord.branch_id == branch_id)
    if status_val and status_val != "all":
        q = q.filter(AttireRecord.status == status_val)

    records = q.order_by(AttireRecord.check_date.desc(), AttireRecord.id.desc()).all()
    total_count = len(records)
    proper_count = sum(1 for a in records if a.status == "Proper")
    partial_count = sum(1 for a in records if a.status == "Needs Attention")
    improper_count = sum(1 for a in records if a.status == "Not Proper")
    compliance_pct = round((proper_count / total_count * 100), 1) if total_count > 0 else 100.0

    # Branch compliance
    branches = db.query(Branch).filter(Branch.is_active == True).all()
    branch_compliance = []
    for b in branches:
        b_att = db.query(AttireRecord).filter(AttireRecord.branch_id == b.id).all()
        b_proper = sum(1 for a in b_att if a.status == "Proper")
        b_pct = round((b_proper / len(b_att) * 100), 1) if b_att else 100.0
        branch_compliance.append(
            {
                "branch_id": b.id,
                "branch_name": b.name,
                "total": len(b_att),
                "proper": b_proper,
                "compliance_pct": b_pct,
            }
        )

    rec_items = []
    for a in records:
        b = db.query(Branch).filter(Branch.id == a.branch_id).first()
        emp = db.query(Employee).filter(Employee.id == a.employee_id).first()
        rec_items.append(
            {
                "id": a.id,
                "branch_id": a.branch_id,
                "branch_name": b.name if b else "Showroom",
                "employee_id": a.employee_id,
                "employee_name": emp.full_name if emp else "Staff",
                "check_date": a.check_date.strftime("%Y-%m-%d"),
                "status": a.status,
                "notes": a.notes,
                "image_url": a.image_url,
            }
        )

    return {
        "overall_compliance_pct": compliance_pct,
        "proper_count": proper_count,
        "partial_count": partial_count,
        "improper_count": improper_count,
        "branch_compliance": branch_compliance,
        "records": rec_items,
    }


# =========================================================================
# 12. Daily Closing Forms & Gallery APIs
# =========================================================================
@router.get("/gallery", summary="Organization-wide daily closing forms and documents archive")
def get_admin_gallery_media(
    branch_id: Optional[int] = Query(None),
    form_type: Optional[str] = Query(None),
    employee_id: Optional[int] = Query(None),
    current_admin: SuperAdminIdentity = Depends(get_current_super_admin),
    db: Session = Depends(get_db),
):
    q = db.query(EmployeeFormMedia)
    if branch_id:
        q = q.filter(EmployeeFormMedia.branch_id == branch_id)
    if form_type and form_type != "all":
        q = q.filter(EmployeeFormMedia.form_type == form_type)
    if employee_id:
        q = q.filter(EmployeeFormMedia.employee_id == employee_id)

    media = q.order_by(EmployeeFormMedia.upload_date.desc(), EmployeeFormMedia.id.desc()).all()
    results = []
    for m in media:
        b = db.query(Branch).filter(Branch.id == m.branch_id).first()
        emp = db.query(Employee).filter(Employee.id == m.employee_id).first()
        results.append(
            {
                "id": m.id,
                "branch_id": m.branch_id,
                "branch_name": b.name if b else "Showroom",
                "employee_id": m.employee_id,
                "employee_name": emp.full_name if emp else "Staff",
                "form_type": m.form_type,
                "file_path": m.file_path,
                "file_url": m.file_url,
                "mime_type": m.mime_type,
                "file_size": m.file_size,
                "notes": m.notes,
                "upload_date": m.upload_date.strftime("%Y-%m-%d %H:%M"),
            }
        )
    return results


# =========================================================================
# 13. Reporting & CSV Export Engine
# =========================================================================
@router.get("/reports", response_model=AdminReportResponse, summary="Executive Report Generator")
def generate_admin_report(
    report_type: str = Query("branch_performance", description="executive_summary, branch_performance, employee_performance, gold_schemes, customer_crm, customer_activity, google_reviews, outdoor_marketing, attire_compliance, daily_forms"),
    branch_id: Optional[int] = Query(None),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    current_admin: SuperAdminIdentity = Depends(get_current_super_admin),
    db: Session = Depends(get_db),
):
    b_id: Optional[int] = None
    if branch_id is not None and isinstance(branch_id, (int, str)):
        try:
            b_id = int(branch_id)
        except Exception:
            b_id = None

    clean_report_type = report_type if isinstance(report_type, str) and report_type.strip() else "branch_performance"
    clean_date_from = date_from if isinstance(date_from, str) and date_from.strip() else None
    clean_date_to = date_to if isinstance(date_to, str) and date_to.strip() else None

    branch_name = "All Branches"
    if b_id:
        b = db.query(Branch).filter(Branch.id == b_id).first()
        branch_name = b.name if b else "Branch"

    headers: List[str] = []
    rows: List[List[Any]] = []
    summary_metrics: Dict[str, Any] = {}
    title = "Executive Report"

    if report_type in ["executive_summary", "branch_performance"]:
        title = "Enterprise Executive Summary & Branch Performance Report"
        headers = ["Branch Code", "Branch Name", "City", "Managers", "Staff", "Footfall", "Schemes Enrolled", "Scheme Total Value (₹)", "Reviews", "Rating", "Attire Compliance"]
        branches = db.query(Branch).filter(Branch.is_active == True).all()
        for b in branches:
            if b_id and b.id != b_id:
                continue
            mgrs = db.query(User).filter(User.branch_id == b.id, User.role == "MANAGER").count()
            emps = db.query(Employee).filter(Employee.branch_id == b.id).count()
            footfall = db.query(CustomerActivity).filter(CustomerActivity.branch_id == b.id).count()
            schemes = db.query(SchemeRecord).filter(SchemeRecord.branch_id == b.id).all()
            sch_val = sum(s.amount for s in schemes)
            revs = db.query(GoogleReview).filter(GoogleReview.branch_id == b.id).all()
            avg_rat = round(sum(r.rating for r in revs) / len(revs), 1) if revs else 5.0
            att = db.query(AttireRecord).filter(AttireRecord.branch_id == b.id).all()
            att_pct = round((sum(1 for a in att if a.status == "Proper") / len(att) * 100), 1) if att else 100.0

            rows.append([b.code, b.name, b.city, mgrs, emps, footfall, len(schemes), f"₹{sch_val:,.0f}", len(revs), f"{avg_rat}★", f"{att_pct}%"])
        summary_metrics = {"total_branches": len(rows), "total_schemes_value": sum(int(r[7].replace("₹", "").replace(",", "")) for r in rows if r[7])}

    elif report_type == "employee_performance":
        title = "Staff Performance & Discipline Report"
        headers = ["Rank", "Code", "Employee Name", "Branch", "Designation", "Customers Attended", "Closed", "Conversion", "Schemes Count", "Scheme Value (₹)", "Reviews", "Attire Score", "Overall Performance"]
        perfs = get_admin_employee_performance(branch_id=b_id, sort_by="overall", current_admin=current_admin, db=db)
        for p in perfs:
            rows.append([
                p.rank,
                p.employee_code,
                p.full_name,
                p.branch_name,
                p.designation,
                p.customers_attended,
                p.customers_closed,
                f"{p.conversion_rate}%",
                p.schemes_count,
                f"₹{p.schemes_amount:,.0f}",
                p.reviews_count,
                f"{p.compliance_score}%",
                f"{p.overall_score}%",
            ])
        summary_metrics = {"total_employees": len(rows), "average_score": round(sum(p.overall_score for p in perfs) / len(perfs), 1) if perfs else 0}

    elif report_type == "gold_schemes":
        title = "Gold Savings Schemes Enrollment Report"
        headers = ["Date", "Customer Name", "Scheme Name", "Amount (₹)", "Employee Name", "Branch", "Notes"]
        q = db.query(SchemeRecord)
        if branch_id:
            q = q.filter(SchemeRecord.branch_id == branch_id)
        schemes = q.order_by(SchemeRecord.record_date.desc()).all()
        for s in schemes:
            b = db.query(Branch).filter(Branch.id == s.branch_id).first()
            emp = db.query(Employee).filter(Employee.id == s.employee_id).first()
            rows.append([
                s.record_date.strftime("%Y-%m-%d"),
                s.customer_name,
                s.scheme_name,
                f"₹{s.amount:,.0f}",
                emp.full_name if emp else "Staff",
                b.name if b else "Showroom",
                s.notes or "",
            ])
        summary_metrics = {"total_schemes": len(rows), "total_amount": sum(s.amount for s in schemes)}

    elif report_type in ["customer_activity", "customer_crm"]:
        title = "Customer Footfall & Interaction Log Report"
        headers = ["Date", "Customer Name", "Phone Number", "Status", "Attending Staff", "Branch", "Notes"]
        q = db.query(CustomerActivity)
        if branch_id:
            q = q.filter(CustomerActivity.branch_id == branch_id)
        acts = q.order_by(CustomerActivity.activity_date.desc()).all()
        for a in acts:
            b = db.query(Branch).filter(Branch.id == a.branch_id).first()
            emp = db.query(Employee).filter(Employee.id == a.employee_id).first()
            rows.append([
                a.activity_date.strftime("%Y-%m-%d"),
                a.customer_name,
                a.phone_number,
                a.status,
                emp.full_name if emp else "Staff",
                b.name if b else "Showroom",
                a.notes or "",
            ])
        summary_metrics = {"total_interactions": len(rows), "closed_sales": sum(1 for a in acts if a.status == "Closed")}

    elif report_type == "google_reviews":
        title = "Customer Feedback & Google Reviews Report"
        headers = ["Date", "Customer Name", "Rating", "Review Snippet", "Attributed Staff", "Branch", "Status"]
        q = db.query(GoogleReview)
        if branch_id:
            q = q.filter(GoogleReview.branch_id == branch_id)
        revs = q.order_by(GoogleReview.review_date.desc()).all()
        for r in revs:
            b = db.query(Branch).filter(Branch.id == r.branch_id).first()
            emp = db.query(Employee).filter(Employee.id == r.employee_id).first() if r.employee_id else None
            rows.append([
                r.review_date.strftime("%Y-%m-%d"),
                r.customer_name,
                f"{r.rating}★",
                r.review_text[:60] + ("..." if len(r.review_text) > 60 else ""),
                emp.full_name if emp else "Unassigned",
                b.name if b else "Showroom",
                r.status,
            ])
        summary_metrics = {"total_reviews": len(rows), "average_rating": round(sum(r.rating for r in revs) / len(revs), 1) if revs else 5.0}

    elif report_type == "attire_compliance":
        title = "Grooming & Attire Compliance Audit Report"
        headers = ["Date", "Staff Name", "Branch", "Designation", "Attire Status", "Remarks"]
        q = db.query(AttireRecord)
        if branch_id:
            q = q.filter(AttireRecord.branch_id == branch_id)
        records = q.order_by(AttireRecord.check_date.desc()).all()
        for rec in records:
            b = db.query(Branch).filter(Branch.id == rec.branch_id).first()
            emp = db.query(Employee).filter(Employee.id == rec.employee_id).first()
            rows.append([
                rec.check_date.strftime("%Y-%m-%d"),
                emp.full_name if emp else "Staff",
                b.name if b else "Showroom",
                emp.designation if emp else "Sales Executive",
                rec.status,
                rec.notes or "",
            ])
        proper_cnt = sum(1 for a in records if a.status == "Proper")
        summary_metrics = {"total_audits": len(rows), "compliance_rate": round(proper_cnt / len(records) * 100, 1) if records else 100.0}

    else:  # daily_forms
        title = "Daily Store Closing Sheets Archive Report"
        headers = ["Upload Date", "Form Type", "Staff Name", "Branch", "File Size (KB)", "Notes"]
        q = db.query(EmployeeFormMedia)
        if branch_id:
            q = q.filter(EmployeeFormMedia.branch_id == branch_id)
        media = q.order_by(EmployeeFormMedia.upload_date.desc()).all()
        for m in media:
            b = db.query(Branch).filter(Branch.id == m.branch_id).first()
            emp = db.query(Employee).filter(Employee.id == m.employee_id).first()
            rows.append([
                m.upload_date.strftime("%Y-%m-%d %H:%M"),
                m.form_type,
                emp.full_name if emp else "Staff",
                b.name if b else "Showroom",
                round(m.file_size / 1024, 1),
                m.notes or "",
            ])
        summary_metrics = {"total_submissions": len(rows)}

    return AdminReportResponse(
        report_type=clean_report_type,
        title=title,
        branch_filter=branch_name,
        date_from=clean_date_from,
        date_to=clean_date_to,
        generated_at=utcnow(),
        total_records=len(rows),
        summary_metrics=summary_metrics,
        headers=headers,
        rows=rows,
    )


@router.get("/reports/generate", response_model=AdminReportResponse, summary="Executive Report Generator Alias")
def generate_admin_report_alias(
    report_type: str = Query("branch_performance", description="executive_summary, branch_performance, employee_performance, gold_schemes, customer_crm, customer_activity, google_reviews, outdoor_marketing, attire_compliance, daily_forms"),
    branch_id: Optional[int] = Query(None),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    current_admin: SuperAdminIdentity = Depends(get_current_super_admin),
    db: Session = Depends(get_db),
):
    return generate_admin_report(
        report_type=report_type,
        branch_id=branch_id,
        date_from=date_from,
        date_to=date_to,
        current_admin=current_admin,
        db=db,
    )


@router.get("/reports/export-csv", summary="Export report directly to CSV")
def export_admin_report_csv(
    report_type: str = Query("branch_performance"),
    branch_id: Optional[int] = Query(None),
    current_admin: SuperAdminIdentity = Depends(get_current_super_admin),
    db: Session = Depends(get_db),
):
    report = generate_admin_report(report_type=report_type, branch_id=branch_id, current_admin=current_admin, db=db)

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([f"Siri Samruddhi Gold Palace - {report.title}"])
    writer.writerow([f"Scope: {report.branch_filter}", f"Generated: {report.generated_at.strftime('%Y-%m-%d %H:%M')} UTC"])
    writer.writerow([])
    writer.writerow(report.headers)
    for r in report.rows:
        writer.writerow(r)

    output.seek(0)
    filename = f"siri_gold_palace_{report_type}_{datetime.now().strftime('%Y%m%d')}.csv"
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


# =========================================================================
# 14. Audit Logs API
# =========================================================================
@router.get("/audit-logs", response_model=AdminAuditLogResponse, summary="Organization-wide audit logs")
@router.get("/audit/logs", response_model=AdminAuditLogResponse, summary="Organization-wide audit logs")
def list_admin_audit_logs(
    branch_id: Optional[int] = Query(None),
    entity: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    current_admin: SuperAdminIdentity = Depends(get_current_super_admin),
    db: Session = Depends(get_db),
):
    q = db.query(AuditLog)
    if branch_id:
        q = q.filter(AuditLog.branch_id == branch_id)
    if entity and entity != "all":
        q = q.filter(AuditLog.entity == entity)
    if search:
        s = f"%{search.strip().lower()}%"
        q = q.filter(or_(func.lower(AuditLog.action).like(s), func.lower(AuditLog.admin_username).like(s), func.lower(AuditLog.details).like(s)))

    total = q.count()
    logs = q.order_by(AuditLog.timestamp.desc()).offset((page - 1) * limit).limit(limit).all()

    items = []
    for l in logs:
        b_name = db.query(Branch.name).filter(Branch.id == l.branch_id).scalar() if l.branch_id else "All Branches"
        items.append(
            AdminAuditLogItem(
                id=l.id,
                branch_id=l.branch_id,
                branch_name=b_name or "All Branches",
                admin_id=l.admin_id,
                username=l.admin_username or "System",
                action=l.action,
                entity=l.entity,
                entity_id=l.entity_id,
                ip_address=l.ip_address,
                details=l.details,
                timestamp=l.timestamp,
            )
        )

    return AdminAuditLogResponse(
        total=total,
        page=page,
        limit=limit,
        logs=items,
    )


# =========================================================================
# 15. Admin Settings & System Health APIs
# =========================================================================
@router.get("/settings", response_model=AdminSettingsResponse, summary="System configuration & status")
def get_admin_settings(
    current_admin: SuperAdminIdentity = Depends(get_current_super_admin),
    db: Session = Depends(get_db),
):
    db_backend = "PostgreSQL" if "postgresql" in str(engine.url) else "SQLite (Local Dual Fallback)"

    total_branches = db.query(Branch).count()
    total_managers = db.query(User).filter(User.role == "MANAGER").count()
    total_employees = db.query(Employee).count()

    return AdminSettingsResponse(
        company_name="Siri Samruddhi Gold Palace Private Limited",
        app_name=settings.APP_NAME,
        environment=settings.ENVIRONMENT,
        version="2.0.0 Enterprise",
        database_backend=db_backend,
        database_status="Active & Operational",
        auth_mode="ENV-Configured Identity (Zero-DB Account)",
        auth_status="Active & Enforced",
        password_hashing="Bcrypt (12 rounds) Active",
        jwt_algorithm=settings.JWT_ALGORITHM,
        session_timeout_minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES,
        refresh_token_lifetime_days=settings.REFRESH_TOKEN_EXPIRE_DAYS,
        rate_limiting_status="Active (Brute-Force Shield Enabled)",
        total_branches=total_branches,
        total_managers=total_managers,
        total_employees=total_employees,
        media_dir=settings.MEDIA_DIR,
        max_upload_size_mb=settings.MAX_UPLOAD_SIZE_MB,
        server_time=utcnow(),
    )


# =========================================================================
# 16. Super Admin Outdoor Marketing & Field Intelligence APIs
# =========================================================================
@router.get("/outdoor/overview", summary="Super Admin Outdoor Marketing Overview & Branch KPI Breakdown")
def get_admin_outdoor_overview(
    branch_id: Optional[int] = Query(None, description="Filter by branch ID"),
    current_admin: SuperAdminIdentity = Depends(get_current_super_admin),
    db: Session = Depends(get_db),
):
    query_duties = db.query(OutdoorMarketingDuty)
    query_cust = db.query(OutdoorMarketingCustomer)

    if branch_id:
        query_duties = query_duties.filter(OutdoorMarketingDuty.branch_id == branch_id)
        query_cust = query_cust.filter(OutdoorMarketingCustomer.branch_id == branch_id)

    all_duties = query_duties.all()
    all_cust = query_cust.all()

    total_duties = len(all_duties)
    total_attended = sum(d.customers_attended_count or 0 for d in all_duties)
    total_converted = sum(d.converted_customers_count or 0 for d in all_duties)
    total_google_ratings = sum(d.google_ratings_count or 0 for d in all_duties)
    
    total_photos = 0
    for d in all_duties:
        if d.photo_urls:
            try:
                import json
                p_list = json.loads(d.photo_urls) if isinstance(d.photo_urls, str) else d.photo_urls
                total_photos += len(p_list)
            except Exception:
                total_photos += 1
        elif d.photo_url:
            total_photos += 1

    conversion_rate = round((total_converted / total_attended * 100), 1) if total_attended > 0 else 0.0

    # Branch-by-branch metrics
    branches = db.query(Branch).filter(Branch.is_active == True).all()
    branch_metrics = []
    for b in branches:
        b_duties = [d for d in all_duties if d.branch_id == b.id]
        b_attended = sum(d.customers_attended_count or 0 for d in b_duties)
        b_converted = sum(d.converted_customers_count or 0 for d in b_duties)
        b_ratings = sum(d.google_ratings_count or 0 for d in b_duties)
        b_conv_rate = round((b_converted / b_attended * 100), 1) if b_attended > 0 else 0.0

        branch_metrics.append({
            "branch_id": b.id,
            "branch_name": b.name,
            "branch_code": b.code,
            "duties_count": len(b_duties),
            "attended_count": b_attended,
            "converted_count": b_converted,
            "google_ratings_count": b_ratings,
            "conversion_rate": b_conv_rate,
        })

    return {
        "total_duties": total_duties,
        "total_attended": total_attended,
        "total_converted": total_converted,
        "total_google_ratings": total_google_ratings,
        "total_photos": total_photos,
        "conversion_rate": conversion_rate,
        "branch_metrics": branch_metrics,
    }


@router.get("/outdoor/duties", summary="Super Admin List Outdoor Duties across branches")
def get_admin_outdoor_duties(
    branch_id: Optional[int] = Query(None, description="Filter by branch ID"),
    date_filter: Optional[date] = Query(None, description="Filter by date YYYY-MM-DD"),
    current_admin: SuperAdminIdentity = Depends(get_current_super_admin),
    db: Session = Depends(get_db),
):
    query = (
        db.query(OutdoorMarketingDuty)
        .join(Branch, OutdoorMarketingDuty.branch_id == Branch.id)
        .join(Employee, OutdoorMarketingDuty.employee_id == Employee.id)
    )

    if branch_id:
        query = query.filter(OutdoorMarketingDuty.branch_id == branch_id)
    if date_filter:
        query = query.filter(OutdoorMarketingDuty.date == date_filter)

    duties = query.order_by(OutdoorMarketingDuty.date.desc(), OutdoorMarketingDuty.id.desc()).all()

    import json
    result = []
    for d in duties:
        p_urls = []
        if d.photo_urls:
            try:
                p_urls = json.loads(d.photo_urls) if isinstance(d.photo_urls, str) else d.photo_urls
            except Exception:
                p_urls = [d.photo_url] if d.photo_url else []
        elif d.photo_url:
            p_urls = [d.photo_url]

        cust_list = []
        for c in d.customers:
            cust_list.append({
                "id": c.id,
                "customer_name": c.customer_name,
                "phone": c.phone,
                "dob": c.dob,
                "anniversary_date": c.anniversary_date,
                "is_converted": c.is_converted,
                "has_google_review": c.has_google_review,
                "google_review_rating": c.google_review_rating,
                "google_review_text": c.google_review_text,
                "scheme_name": c.scheme_name,
                "area_name": c.area_name,
                "notes": c.notes,
                "date": c.date,
            })

        emp = d.employee
        branch = d.branch
        result.append({
            "id": d.id,
            "branch_id": d.branch_id,
            "branch_name": branch.name if branch else "Showroom",
            "branch_code": branch.code if branch else "SR",
            "employee_id": d.employee_id,
            "employee_name": emp.full_name if emp else "Staff",
            "employee_code": emp.employee_code if emp else "EMP",
            "designation": emp.designation if emp else "Executive",
            "department": emp.department if emp else "Sales",
            "date": d.date,
            "area": d.area,
            "scheme_name": d.scheme_name,
            "customers_attended_count": d.customers_attended_count,
            "converted_customers_count": d.converted_customers_count,
            "google_ratings_count": d.google_ratings_count,
            "photo_url": d.photo_url,
            "photo_urls": p_urls,
            "notes": d.notes,
            "status": d.status,
            "customers": cust_list,
            "created_at": d.created_at,
            "updated_at": d.updated_at,
        })

    return result


@router.get("/outdoor/customers", summary="Super Admin List Outdoor Customers Leads across branches")
def get_admin_outdoor_customers(
    branch_id: Optional[int] = Query(None, description="Filter by branch ID"),
    date_filter: Optional[date] = Query(None, description="Filter by date YYYY-MM-DD"),
    status: Optional[str] = Query(None, description="Filter by status: Converted, Attended, Lead, Closed"),
    search: Optional[str] = Query(None, description="Search customer name, phone, or area"),
    current_admin: SuperAdminIdentity = Depends(get_current_super_admin),
    db: Session = Depends(get_db),
):
    query = (
        db.query(OutdoorMarketingCustomer)
        .join(Branch, OutdoorMarketingCustomer.branch_id == Branch.id)
        .join(Employee, OutdoorMarketingCustomer.marketing_employee_id == Employee.id)
    )

    if branch_id:
        query = query.filter(OutdoorMarketingCustomer.branch_id == branch_id)
    if date_filter:
        query = query.filter(OutdoorMarketingCustomer.date == date_filter)
    if status:
        if status.lower() == "converted":
            query = query.filter(OutdoorMarketingCustomer.is_converted == True)
        elif status.lower() == "attended":
            query = query.filter(OutdoorMarketingCustomer.is_converted == False)
        else:
            query = query.filter(OutdoorMarketingCustomer.status == status)

    if search:
        term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                OutdoorMarketingCustomer.customer_name.ilike(term),
                OutdoorMarketingCustomer.phone.ilike(term),
                OutdoorMarketingCustomer.area_name.ilike(term),
                OutdoorMarketingCustomer.scheme_name.ilike(term),
            )
        )

    records = query.order_by(OutdoorMarketingCustomer.date.desc(), OutdoorMarketingCustomer.id.desc()).all()

    result = []
    for r in records:
        branch = r.branch
        emp = r.marketing_employee
        result.append({
            "id": r.id,
            "branch_id": r.branch_id,
            "branch_name": branch.name if branch else "Showroom",
            "branch_code": branch.code if branch else "SR",
            "marketing_employee_id": r.marketing_employee_id,
            "marketing_employee_name": emp.full_name if emp else "Staff",
            "marketing_employee_code": emp.employee_code if emp else "EMP",
            "customer_name": r.customer_name,
            "phone": r.phone,
            "dob": r.dob,
            "anniversary_date": r.anniversary_date,
            "is_converted": r.is_converted,
            "has_google_review": r.has_google_review,
            "google_review_rating": r.google_review_rating,
            "google_review_text": r.google_review_text,
            "area_name": r.area_name,
            "scheme_name": r.scheme_name,
            "date": r.date,
            "status": "Converted" if r.is_converted else (r.status or "Attended"),
            "notes": r.notes,
            "created_at": r.created_at,
            "updated_at": r.updated_at,
        })

    return result


@router.get("/outdoor/customers/export-csv", summary="Super Admin Export Outdoor Customers Leads to CSV")
def export_admin_outdoor_customers_csv(
    branch_id: Optional[int] = Query(None, description="Filter by branch ID"),
    date_filter: Optional[date] = Query(None, description="Filter by date YYYY-MM-DD"),
    current_admin: SuperAdminIdentity = Depends(get_current_super_admin),
    db: Session = Depends(get_db),
):
    query = (
        db.query(OutdoorMarketingCustomer)
        .join(Branch, OutdoorMarketingCustomer.branch_id == Branch.id)
        .join(Employee, OutdoorMarketingCustomer.marketing_employee_id == Employee.id)
    )

    if branch_id:
        query = query.filter(OutdoorMarketingCustomer.branch_id == branch_id)
    if date_filter:
        query = query.filter(OutdoorMarketingCustomer.date == date_filter)

    records = query.order_by(OutdoorMarketingCustomer.date.desc(), OutdoorMarketingCustomer.id.desc()).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Branch",
        "Branch Code",
        "Customer Name",
        "Phone Number",
        "Date of Birth (DOB)",
        "Wedding Anniversary",
        "Status",
        "Enrolled / Interested Scheme",
        "Campaign Area",
        "Staff Representative",
        "Staff Code",
        "Google Review Given",
        "Google Rating (Stars)",
        "Google Review Feedback",
        "Date",
        "Notes",
    ])

    for r in records:
        branch = r.branch
        emp = r.marketing_employee
        writer.writerow([
            branch.name if branch else "",
            branch.code if branch else "",
            r.customer_name or "",
            r.phone or "",
            str(r.dob) if r.dob else "",
            str(r.anniversary_date) if r.anniversary_date else "",
            "Converted" if r.is_converted else (r.status or "Attended"),
            r.scheme_name or "",
            r.area_name or "",
            emp.full_name if emp else "",
            emp.employee_code if emp else "",
            "Yes" if r.has_google_review else "No",
            r.google_review_rating if r.has_google_review else "",
            r.google_review_text or "",
            str(r.date) if r.date else "",
            r.notes or "",
        ])

    csv_data = output.getvalue()
    filename = f"admin_outdoor_customers_{date_filter or date.today()}.csv"

    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


# Legacy Aliases
@router.get("/outdoor/activities", summary="Legacy alias for outdoor duties")
def get_admin_outdoor_activities_alias(
    branch_id: Optional[int] = Query(None),
    current_admin: SuperAdminIdentity = Depends(get_current_super_admin),
    db: Session = Depends(get_db),
):
    return get_admin_outdoor_duties(branch_id=branch_id, date_filter=None, current_admin=current_admin, db=db)


@router.get("/outdoor/leads", summary="Legacy alias for outdoor leads")
def get_admin_outdoor_leads_alias(
    branch_id: Optional[int] = Query(None),
    current_admin: SuperAdminIdentity = Depends(get_current_super_admin),
    db: Session = Depends(get_db),
):
    return get_admin_outdoor_customers(branch_id=branch_id, date_filter=None, status=None, search=None, current_admin=current_admin, db=db)

