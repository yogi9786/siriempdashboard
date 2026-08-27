from datetime import date, timedelta
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from backend.app.core.config import settings
from backend.app.models.employee import Employee
from backend.app.models.performance import DailyPerformance
from backend.app.repositories.performance_repo import PerformanceRepository
from backend.app.repositories.employee_repo import EmployeeRepository
from backend.app.repositories.followup_repo import FollowUpRepository


class PerformanceScoringService:
    """
    Centralized, configurable performance scoring calculation engine.
    Calculates weighted multi-factor performance scores (0 - 100).
    """

    @classmethod
    def calculate_daily_score(
        cls,
        approached: int,
        visited: int,
        conversions: int,
        completed_followups: int,
        pending_followups: int,
        total_sales: float,
        daily_target: float = 20000.0,
    ) -> float:
        # Safe default target handling
        daily_target = max(daily_target, 1.0)
        expected_daily_approaches = 5  # Standard showroom benchmark

        # 1. Customer Approach Score (0 - 100)
        approach_score = min(100.0, (approached / expected_daily_approaches) * 100.0)

        # 2. Conversion Score (0 - 100)
        conversion_rate = (conversions / approached * 100.0) if approached > 0 else 0.0
        conversion_score = min(100.0, conversion_rate * 2.5)  # 40% conversion = 100 pts

        # 3. Follow-up Completion Score (0 - 100)
        total_followups = completed_followups + pending_followups
        if total_followups > 0:
            followup_score = (completed_followups / total_followups) * 100.0
        else:
            followup_score = 80.0  # neutral benchmark if no follow-ups scheduled

        # 4. Sales Score (0 - 100)
        sales_score = min(100.0, (total_sales / daily_target) * 100.0)

        # 5. Target Achievement Factor (0 - 100)
        target_achievement = min(100.0, (total_sales / daily_target) * 100.0)

        # Weighted calculation using configurable weights
        final_score = (
            (settings.SCORE_WEIGHT_APPROACH * approach_score)
            + (settings.SCORE_WEIGHT_CONVERSION * conversion_score)
            + (settings.SCORE_WEIGHT_FOLLOWUP * followup_score)
            + (settings.SCORE_WEIGHT_SALES * sales_score)
            + (settings.SCORE_WEIGHT_TARGET * target_achievement)
        )

        return round(max(0.0, min(100.0, final_score)), 1)

    @classmethod
    def get_leaderboard(
        cls,
        db: Session,
        branch_id: int,
        start_date: date,
        end_date: date,
    ) -> List[Dict[str, Any]]:
        emp_repo = EmployeeRepository(db)
        perf_repo = PerformanceRepository(db)
        followup_repo = FollowUpRepository(db)

        employees = emp_repo.get_all_active_by_branch(branch_id)
        days_in_period = max(1, (end_date - start_date).days + 1)

        leaderboard_data = []

        for emp in employees:
            agg = perf_repo.aggregate_for_employee(emp.id, branch_id, start_date, end_date)
            period_target = (emp.monthly_target / 30.0) * days_in_period

            approached = agg["customers_approached"]
            conversions = agg["conversions_count"]
            sales_val = agg["sales_value"]
            completed_fu = agg["follow_ups_count"]

            conversion_rate = (conversions / approached * 100.0) if approached > 0 else 0.0
            target_achieve = (sales_val / period_target * 100.0) if period_target > 0 else 0.0

            # Compute period-wide aggregate performance score
            expected_approaches = max(1, days_in_period * 4)
            approach_score = min(100.0, (approached / expected_approaches) * 100.0)
            conversion_score = min(100.0, conversion_rate * 2.5)
            followup_score = min(100.0, (completed_fu / max(1, completed_fu + 2)) * 100.0)
            sales_score = min(100.0, target_achieve)
            target_score = min(100.0, target_achieve)

            period_score = (
                (settings.SCORE_WEIGHT_APPROACH * approach_score)
                + (settings.SCORE_WEIGHT_CONVERSION * conversion_score)
                + (settings.SCORE_WEIGHT_FOLLOWUP * followup_score)
                + (settings.SCORE_WEIGHT_SALES * sales_score)
                + (settings.SCORE_WEIGHT_TARGET * target_score)
            )
            final_score = round(max(0.0, min(100.0, period_score)), 1)

            leaderboard_data.append({
                "employee_id": emp.id,
                "employee_code": emp.employee_code,
                "employee_name": emp.full_name,
                "department": emp.department,
                "designation": emp.designation,
                "customers_approached": approached,
                "conversions": conversions,
                "conversion_rate": round(conversion_rate, 1),
                "total_sales": round(sales_val, 2),
                "target_amount": round(period_target, 2),
                "target_achievement_rate": round(target_achieve, 1),
                "completed_followups": completed_fu,
                "performance_score": final_score,
            })

        # Sort descending by performance score, then total sales
        leaderboard_data.sort(key=lambda x: (x["performance_score"], x["total_sales"]), reverse=True)

        # Assign ranks
        for idx, item in enumerate(leaderboard_data, 1):
            item["rank"] = idx

        return leaderboard_data
