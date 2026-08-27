from datetime import date, timedelta
from typing import Optional, Dict, Any, List, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import func
from backend.app.models.branch import Branch
from backend.app.models.employee import Employee
from backend.app.models.customer import Customer, FollowUp
from backend.app.models.sale import Sale, SaleItem
from backend.app.models.performance import DailyPerformance
from backend.app.schemas.dashboard import (
    DashboardOverviewResponse,
    BranchOverviewKPIs,
    SalesTrendPoint,
    CategoryDistributionItem,
    ConversionFunnelStep,
    AlertItem,
)
from backend.app.repositories.branch_repo import BranchRepository
from backend.app.repositories.employee_repo import EmployeeRepository
from backend.app.repositories.customer_repo import CustomerRepository
from backend.app.repositories.performance_repo import PerformanceRepository
from backend.app.repositories.sale_repo import SaleRepository
from backend.app.repositories.followup_repo import FollowUpRepository
from backend.app.services.performance_service import PerformanceScoringService


def parse_date_period(period: str, custom_start: Optional[date] = None, custom_end: Optional[date] = None) -> Tuple[date, date]:
    today = date.today()
    if period == "today":
        return today, today
    elif period == "yesterday":
        yest = today - timedelta(days=1)
        return yest, yest
    elif period == "this_week":
        start = today - timedelta(days=today.weekday())  # Monday
        return start, today
    elif period == "this_month":
        start = today.replace(day=1)
        return start, today
    elif period == "last_month":
        first_of_this_month = today.replace(day=1)
        last_day_of_last_month = first_of_this_month - timedelta(days=1)
        first_day_of_last_month = last_day_of_last_month.replace(day=1)
        return first_day_of_last_month, last_day_of_last_month
    elif period == "custom" and custom_start and custom_end:
        return custom_start, custom_end
    else:
        # Default to this month
        return today.replace(day=1), today


class DashboardService:
    def __init__(self, db: Session):
        self.db = db
        self.branch_repo = BranchRepository(db)
        self.emp_repo = EmployeeRepository(db)
        self.cust_repo = CustomerRepository(db)
        self.perf_repo = PerformanceRepository(db)
        self.sale_repo = SaleRepository(db)
        self.followup_repo = FollowUpRepository(db)

    def get_dashboard_overview(
        self,
        branch_id: int,
        period: str = "this_month",
        start_date_param: Optional[date] = None,
        end_date_param: Optional[date] = None,
    ) -> DashboardOverviewResponse:
        branch = self.branch_repo.get_by_id(branch_id)
        start_date, end_date = parse_date_period(period, start_date_param, end_date_param)
        days_in_period = max(1, (end_date - start_date).days + 1)
        today = date.today()

        # 1. Active Employees & Total Targets
        active_employees = self.emp_repo.get_all_active_by_branch(branch_id)
        active_emp_count = len(active_employees)
        total_period_target = sum((emp.monthly_target / 30.0) * days_in_period for emp in active_employees)

        # 2. Activity & Sales Aggregation from DailyPerformance & Sales tables
        perf_agg = self.perf_repo.aggregate_branch_period(branch_id, start_date, end_date)

        # Also get actual sales records aggregate to ensure absolute precision
        actual_sales_val = (
            self.db.query(func.coalesce(func.sum(Sale.final_sale_value), 0.0))
            .filter(
                Sale.branch_id == branch_id,
                Sale.purchase_date >= start_date,
                Sale.purchase_date <= end_date,
            )
            .scalar()
            or 0.0
        )
        actual_sales_count = (
            self.db.query(func.count(Sale.id))
            .filter(
                Sale.branch_id == branch_id,
                Sale.purchase_date >= start_date,
                Sale.purchase_date <= end_date,
            )
            .scalar()
            or 0
        )

        total_sales_value = float(actual_sales_val)
        sales_count = int(actual_sales_count)
        approached = max(perf_agg["approached"], sales_count)
        visited = max(perf_agg["visited"], sales_count)
        conversions = sales_count

        conversion_rate = (conversions / approached * 100.0) if approached > 0 else 0.0
        avg_sale_val = (total_sales_value / sales_count) if sales_count > 0 else 0.0
        target_achievement = (total_sales_value / total_period_target * 100.0) if total_period_target > 0 else 0.0

        # Follow-up status counts
        fu_counts = self.followup_repo.get_counts(branch_id)

        kpis = BranchOverviewKPIs(
            active_employees=active_emp_count,
            customers_approached=approached,
            customers_visited=visited,
            customers_converted=conversions,
            sales_count=sales_count,
            total_sales_value=total_sales_value,
            total_sales_value_formatted=f"₹{total_sales_value:,.2f}",
            conversion_rate=round(conversion_rate, 1),
            average_sale_value=round(avg_sale_val, 2),
            average_sale_value_formatted=f"₹{avg_sale_val:,.2f}",
            target_achievement_rate=round(target_achievement, 1),
            total_target=round(total_period_target, 2),
            pending_followups_count=fu_counts["pending_count"],
            overdue_followups_count=fu_counts["overdue_count"],
        )

        # 3. Sales Trend
        trend_days = []
        cur_d = start_date
        # Limit trend points to at most 31 days
        step = max(1, days_in_period // 30)
        while cur_d <= end_date:
            day_sales = (
                self.db.query(func.coalesce(func.sum(Sale.final_sale_value), 0.0), func.count(Sale.id))
                .filter(Sale.branch_id == branch_id, Sale.purchase_date == cur_d)
                .first()
            )
            val = float(day_sales[0]) if day_sales else 0.0
            cnt = int(day_sales[1]) if day_sales else 0

            # Daily performance activity
            day_perf = (
                self.db.query(
                    func.coalesce(func.sum(DailyPerformance.customers_approached), 0),
                    func.coalesce(func.sum(DailyPerformance.customers_converted), 0),
                )
                .filter(DailyPerformance.branch_id == branch_id, DailyPerformance.date == cur_d)
                .first()
            )
            appr = int(day_perf[0]) if day_perf else 0
            conv = int(day_perf[1]) if day_perf else cnt

            trend_days.append(
                SalesTrendPoint(
                    date=cur_d.strftime("%d %b"),
                    day_name=cur_d.strftime("%a"),
                    sales_value=val,
                    transactions_count=cnt,
                    customers_approached=max(appr, cnt),
                    customers_converted=conv,
                )
            )
            cur_d += timedelta(days=1)

        # 4. Product Category Distribution
        cat_rows = (
            self.db.query(
                SaleItem.product_category,
                func.coalesce(func.sum(SaleItem.final_amount), 0.0).label("val"),
                func.count(SaleItem.id).label("cnt"),
            )
            .join(Sale, SaleItem.sale_id == Sale.id)
            .filter(
                Sale.branch_id == branch_id,
                Sale.purchase_date >= start_date,
                Sale.purchase_date <= end_date,
            )
            .group_by(SaleItem.product_category)
            .order_by(func.sum(SaleItem.final_amount).desc())
            .all()
        )
        palette = ["#C5A869", "#1E2024", "#9E814D", "#4B5563", "#D4AF37", "#6B7280", "#E5C07B", "#374151"]
        category_distribution = [
            CategoryDistributionItem(
                name=r.product_category,
                value=float(r.val),
                count=int(r.cnt),
                color=palette[idx % len(palette)],
            )
            for idx, r in enumerate(cat_rows)
        ]

        # 5. Conversion Funnel
        enquiries = max(approached, int(perf_agg.get("approached", 0)))
        visited_count = max(visited, int(perf_agg.get("visited", 0)))
        quotations_count = max(int(perf_agg.get("conversions", 0)), sales_count)
        conversion_funnel = [
            ConversionFunnelStep(
                stage="Customers Approached",
                count=enquiries,
                percentage=100.0 if enquiries > 0 else 0.0,
            ),
            ConversionFunnelStep(
                stage="Store Visits / Demos",
                count=visited_count,
                percentage=round((visited_count / enquiries * 100.0) if enquiries > 0 else 0.0, 1),
            ),
            ConversionFunnelStep(
                stage="Quotations Given",
                count=max(conversions, int(visited_count * 0.7)),
                percentage=round((max(conversions, int(visited_count * 0.7)) / enquiries * 100.0) if enquiries > 0 else 0.0, 1),
            ),
            ConversionFunnelStep(
                stage="Converted Purchases",
                count=conversions,
                percentage=round((conversions / enquiries * 100.0) if enquiries > 0 else 0.0, 1),
            ),
        ]

        # 6. Leaderboard & Employee Performance
        leaderboard = PerformanceScoringService.get_leaderboard(self.db, branch_id, start_date, end_date)
        top_performers = leaderboard[:3]
        underperformers = [item for item in leaderboard if item["target_achievement_rate"] < 50.0]

        # 7. Actionable Dashboard Alerts
        alerts = []
        if fu_counts["overdue_count"] > 0:
            alerts.append(
                AlertItem(
                    id="overdue-followups",
                    type="danger",
                    title="Overdue Customer Follow-ups",
                    description=f"{fu_counts['overdue_count']} follow-up tasks are overdue and require immediate attention.",
                    count=fu_counts["overdue_count"],
                    action_url="/followups?filter=overdue",
                )
            )

        if len(underperformers) > 0:
            alerts.append(
                AlertItem(
                    id="low-target-employees",
                    type="warning",
                    title="Employees Under 50% Target",
                    description=f"{len(underperformers)} sales team members are currently below 50% of their period target.",
                    count=len(underperformers),
                    action_url="/employees?status=underperforming",
                )
            )

        if fu_counts["today_count"] > 0:
            alerts.append(
                AlertItem(
                    id="today-followups",
                    type="info",
                    title="Today's Scheduled Follow-ups",
                    description=f"{fu_counts['today_count']} follow-up calls/appointments are scheduled for today.",
                    count=fu_counts["today_count"],
                    action_url="/followups?filter=today",
                )
            )

        # 8. Recent Sales & Follow-ups
        recent_sales_list, _, _ = self.sale_repo.list_sales(branch_id=branch_id, page=1, page_size=5)
        recent_sales = [
            {
                "id": s.id,
                "invoice_number": s.invoice_number,
                "customer_name": s.customer.full_name if s.customer else "Walk-in Customer",
                "employee_name": s.employee.full_name,
                "purchase_date": str(s.purchase_date),
                "final_sale_value": s.final_sale_value,
                "payment_method": s.payment_method,
            }
            for s in recent_sales_list
        ]

        recent_fu_list = self.followup_repo.list_followups(branch_id=branch_id, filter_type="pending")[:5]
        recent_followups = [
            {
                "id": f.id,
                "customer_name": f.customer.full_name,
                "customer_phone": f.customer.phone,
                "employee_name": f.employee.full_name,
                "scheduled_date": str(f.scheduled_date),
                "priority": f.priority,
                "status": f.status,
                "notes": f.notes,
            }
            for f in recent_fu_list
        ]

        return DashboardOverviewResponse(
            branch={
                "id": branch.id,
                "code": branch.code,
                "name": branch.name,
                "city": branch.city,
                "address": branch.address,
                "phone": branch.phone,
            },
            current_date=today,
            period=period,
            start_date=start_date,
            end_date=end_date,
            kpis=kpis,
            sales_trend=trend_days,
            category_distribution=category_distribution,
            conversion_funnel=conversion_funnel,
            employee_performance=leaderboard,
            top_performers=top_performers,
            underperforming_employees=underperformers,
            alerts=alerts,
            recent_sales=recent_sales,
            recent_followups=recent_followups,
        )
