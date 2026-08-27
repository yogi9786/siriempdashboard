from datetime import date
from typing import Optional, List
from fastapi import APIRouter, Depends, Query, Request, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.models.branch import Admin
from backend.app.models.performance import DailyPerformance
from backend.app.models.employee import Employee
from backend.app.schemas.performance import (
    DailyPerformanceCreate,
    DailyPerformanceResponse,
    LeaderboardResponse,
    LeaderboardItem,
)
from backend.app.repositories.performance_repo import PerformanceRepository
from backend.app.repositories.employee_repo import EmployeeRepository
from backend.app.repositories.audit_repo import AuditRepository
from backend.app.services.performance_service import PerformanceScoringService
from backend.app.services.dashboard_service import parse_date_period
from backend.app.dependencies.auth import get_current_admin

router = APIRouter(prefix="/api/v1/performance", tags=["Performance"])


@router.post("/daily", response_model=DailyPerformanceResponse, summary="Record or update employee daily performance entry")
def record_daily_performance(
    perf_data: DailyPerformanceCreate,
    request: Request,
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    emp_repo = EmployeeRepository(db)
    perf_repo = PerformanceRepository(db)
    audit_repo = AuditRepository(db)

    # 1. Verify employee in current admin's branch
    emp = emp_repo.get_by_id_and_branch(perf_data.employee_id, current_admin.branch_id)
    if not emp:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Employee not found in your branch.")

    # 2. Calculate totals
    calculated_total_sales = (
        perf_data.gold_sales_value
        + perf_data.diamond_sales_value
        + perf_data.silver_sales_value
        + perf_data.other_sales_value
    )

    # 3. Calculate Performance Score using centralized scoring engine
    calculated_score = PerformanceScoringService.calculate_daily_score(
        approached=perf_data.customers_approached,
        visited=perf_data.customers_visited,
        conversions=perf_data.customers_converted,
        completed_followups=perf_data.completed_followups,
        pending_followups=perf_data.pending_followups,
        total_sales=calculated_total_sales,
        daily_target=emp.daily_target,
    )

    # 4. Check if entry for date already exists (update vs create)
    existing = perf_repo.get_by_employee_and_date(emp.id, perf_data.date)
    if existing:
        existing.customers_approached = perf_data.customers_approached
        existing.customers_visited = perf_data.customers_visited
        existing.new_enquiries = perf_data.new_enquiries
        existing.followups = perf_data.followups
        existing.product_demos = perf_data.product_demos
        existing.quotations_given = perf_data.quotations_given
        existing.customers_converted = perf_data.customers_converted
        existing.sales_count = perf_data.sales_count
        existing.gold_sales_value = perf_data.gold_sales_value
        existing.diamond_sales_value = perf_data.diamond_sales_value
        existing.silver_sales_value = perf_data.silver_sales_value
        existing.other_sales_value = perf_data.other_sales_value
        existing.total_sales_value = calculated_total_sales
        existing.completed_followups = perf_data.completed_followups
        existing.pending_followups = perf_data.pending_followups
        existing.lost_customers = perf_data.lost_customers
        existing.lost_reason = perf_data.lost_reason
        existing.notes = perf_data.notes
        existing.performance_score = calculated_score
        saved_entry = perf_repo.update(existing)
        action_name = "Daily Performance Updated"
    else:
        new_entry = DailyPerformance(
            branch_id=current_admin.branch_id,
            employee_id=emp.id,
            date=perf_data.date,
            customers_approached=perf_data.customers_approached,
            customers_visited=perf_data.customers_visited,
            new_enquiries=perf_data.new_enquiries,
            followups=perf_data.followups,
            product_demos=perf_data.product_demos,
            quotations_given=perf_data.quotations_given,
            customers_converted=perf_data.customers_converted,
            sales_count=perf_data.sales_count,
            gold_sales_value=perf_data.gold_sales_value,
            diamond_sales_value=perf_data.diamond_sales_value,
            silver_sales_value=perf_data.silver_sales_value,
            other_sales_value=perf_data.other_sales_value,
            total_sales_value=calculated_total_sales,
            completed_followups=perf_data.completed_followups,
            pending_followups=perf_data.pending_followups,
            lost_customers=perf_data.lost_customers,
            lost_reason=perf_data.lost_reason,
            notes=perf_data.notes,
            performance_score=calculated_score,
        )
        saved_entry = perf_repo.create(new_entry)
        action_name = "Daily Performance Added"

    client_ip = request.client.host if request.client else None
    audit_repo.log(
        action=action_name,
        entity="DailyPerformance",
        branch_id=current_admin.branch_id,
        admin_id=current_admin.id,
        admin_username=current_admin.username,
        entity_id=str(saved_entry.id),
        ip_address=client_ip,
        details=f"{action_name} for employee {emp.full_name} on {saved_entry.date} (Score: {calculated_score})",
    )

    conv_rate = (saved_entry.customers_converted / saved_entry.customers_approached * 100.0) if saved_entry.customers_approached > 0 else 0.0
    avg_sale = (saved_entry.total_sales_value / saved_entry.sales_count) if saved_entry.sales_count > 0 else 0.0
    target_achieve = (saved_entry.total_sales_value / emp.daily_target * 100.0) if emp.daily_target > 0 else 0.0

    return DailyPerformanceResponse(
        id=saved_entry.id,
        branch_id=saved_entry.branch_id,
        employee_id=saved_entry.employee_id,
        employee_name=emp.full_name,
        employee_code=emp.employee_code,
        department=emp.department,
        date=saved_entry.date,
        customers_approached=saved_entry.customers_approached,
        customers_visited=saved_entry.customers_visited,
        new_enquiries=saved_entry.new_enquiries,
        followups=saved_entry.followups,
        product_demos=saved_entry.product_demos,
        quotations_given=saved_entry.quotations_given,
        customers_converted=saved_entry.customers_converted,
        sales_count=saved_entry.sales_count,
        gold_sales_value=saved_entry.gold_sales_value,
        diamond_sales_value=saved_entry.diamond_sales_value,
        silver_sales_value=saved_entry.silver_sales_value,
        other_sales_value=saved_entry.other_sales_value,
        total_sales_value=saved_entry.total_sales_value,
        completed_followups=saved_entry.completed_followups,
        pending_followups=saved_entry.pending_followups,
        lost_customers=saved_entry.lost_customers,
        lost_reason=saved_entry.lost_reason,
        notes=saved_entry.notes,
        conversion_rate=round(conv_rate, 1),
        average_sale_value=round(avg_sale, 2),
        target_achievement_rate=round(target_achieve, 1),
        performance_score=saved_entry.performance_score,
        created_at=saved_entry.created_at,
        updated_at=saved_entry.updated_at,
    )


@router.get("/leaderboard", response_model=LeaderboardResponse, summary="Get employee leaderboard ranked by score")
def get_leaderboard(
    period: str = Query("this_month", description="today, yesterday, this_week, this_month, last_month, custom"),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    start, end = parse_date_period(period, start_date, end_date)
    leaderboard = PerformanceScoringService.get_leaderboard(db, current_admin.branch_id, start, end)
    top_performer = leaderboard[0] if leaderboard else None

    return LeaderboardResponse(
        items=[LeaderboardItem(**item) for item in leaderboard],
        period=period,
        start_date=start,
        end_date=end,
        top_performer=LeaderboardItem(**top_performer) if top_performer else None,
    )
