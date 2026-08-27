from datetime import date
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, and_, or_
from backend.app.models.performance import DailyPerformance
from backend.app.models.employee import Employee
from backend.app.repositories.base import BaseRepository


class PerformanceRepository(BaseRepository[DailyPerformance]):
    def __init__(self, db: Session):
        super().__init__(DailyPerformance, db)

    def get_by_employee_and_date(self, employee_id: int, target_date: date) -> Optional[DailyPerformance]:
        return (
            self.db.query(DailyPerformance)
            .filter(DailyPerformance.employee_id == employee_id, DailyPerformance.date == target_date)
            .first()
        )

    def get_by_id_and_branch(self, id: int, branch_id: int) -> Optional[DailyPerformance]:
        return (
            self.db.query(DailyPerformance)
            .options(joinedload(DailyPerformance.employee))
            .filter(DailyPerformance.id == id, DailyPerformance.branch_id == branch_id)
            .first()
        )

    def list_performances(
        self,
        branch_id: int,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        employee_id: Optional[int] = None,
    ) -> List[DailyPerformance]:
        query = (
            self.db.query(DailyPerformance)
            .options(joinedload(DailyPerformance.employee))
            .filter(DailyPerformance.branch_id == branch_id)
        )

        if start_date:
            query = query.filter(DailyPerformance.date >= start_date)
        if end_date:
            query = query.filter(DailyPerformance.date <= end_date)
        if employee_id:
            query = query.filter(DailyPerformance.employee_id == employee_id)

        return query.order_by(DailyPerformance.date.desc()).all()

    def aggregate_for_employee(self, employee_id: int, branch_id: int, start_date: date, end_date: date) -> Dict[str, Any]:
        """Aggregate total performance metrics for an employee across a given date range."""
        result = (
            self.db.query(
                func.coalesce(func.sum(DailyPerformance.customers_approached), 0).label("approached"),
                func.coalesce(func.sum(DailyPerformance.customers_visited), 0).label("visited"),
                func.coalesce(func.sum(DailyPerformance.followups), 0).label("followups"),
                func.coalesce(func.sum(DailyPerformance.customers_converted), 0).label("conversions"),
                func.coalesce(func.sum(DailyPerformance.sales_count), 0).label("sales_count"),
                func.coalesce(func.sum(DailyPerformance.total_sales_value), 0.0).label("sales_value"),
                func.coalesce(func.avg(DailyPerformance.performance_score), 0.0).label("avg_score"),
                func.max(DailyPerformance.date).label("last_activity"),
            )
            .filter(
                DailyPerformance.employee_id == employee_id,
                DailyPerformance.branch_id == branch_id,
                DailyPerformance.date >= start_date,
                DailyPerformance.date <= end_date,
            )
            .first()
        )

        approached = int(result.approached) if result else 0
        conversions = int(result.conversions) if result else 0
        sales_value = float(result.sales_value) if result else 0.0
        sales_count = int(result.sales_count) if result else 0

        conversion_rate = (conversions / approached * 100) if approached > 0 else 0.0
        avg_sale_val = (sales_value / sales_count) if sales_count > 0 else 0.0

        return {
            "customers_approached": approached,
            "customers_visited": int(result.visited) if result else 0,
            "follow_ups_count": int(result.followups) if result else 0,
            "conversions_count": conversions,
            "sales_count": sales_count,
            "sales_value": sales_value,
            "average_sale_value": avg_sale_val,
            "conversion_rate": round(conversion_rate, 2),
            "performance_score": round(float(result.avg_score) if result else 0.0, 1),
            "last_activity_date": result.last_activity if result else None,
        }

    def aggregate_branch_period(self, branch_id: int, start_date: date, end_date: date) -> Dict[str, Any]:
        """Aggregate total branch activity metrics across a given date range."""
        result = (
            self.db.query(
                func.coalesce(func.sum(DailyPerformance.customers_approached), 0).label("approached"),
                func.coalesce(func.sum(DailyPerformance.customers_visited), 0).label("visited"),
                func.coalesce(func.sum(DailyPerformance.followups), 0).label("followups"),
                func.coalesce(func.sum(DailyPerformance.customers_converted), 0).label("conversions"),
                func.coalesce(func.sum(DailyPerformance.sales_count), 0).label("sales_count"),
                func.coalesce(func.sum(DailyPerformance.total_sales_value), 0.0).label("sales_value"),
            )
            .filter(
                DailyPerformance.branch_id == branch_id,
                DailyPerformance.date >= start_date,
                DailyPerformance.date <= end_date,
            )
            .first()
        )
        return {
            "approached": int(result.approached) if result else 0,
            "visited": int(result.visited) if result else 0,
            "followups": int(result.followups) if result else 0,
            "conversions": int(result.conversions) if result else 0,
            "sales_count": int(result.sales_count) if result else 0,
            "sales_value": float(result.sales_value) if result else 0.0,
        }
