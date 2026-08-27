from datetime import date, datetime, timezone
from typing import Optional, List, Tuple
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, and_, func
from backend.app.models.customer import FollowUp, Customer
from backend.app.models.employee import Employee
from backend.app.repositories.base import BaseRepository


class FollowUpRepository(BaseRepository[FollowUp]):
    def __init__(self, db: Session):
        super().__init__(FollowUp, db)

    def get_by_id_and_branch(self, id: int, branch_id: int) -> Optional[FollowUp]:
        return (
            self.db.query(FollowUp)
            .options(joinedload(FollowUp.customer), joinedload(FollowUp.employee))
            .filter(FollowUp.id == id, FollowUp.branch_id == branch_id)
            .first()
        )

    def list_followups(
        self,
        branch_id: int,
        filter_type: Optional[str] = "all",  # all, today, overdue, upcoming, pending, completed
        employee_id: Optional[int] = None,
        priority: Optional[str] = None,
        search: Optional[str] = None,
    ) -> List[FollowUp]:
        today = date.today()
        query = (
            self.db.query(FollowUp)
            .join(FollowUp.customer)
            .join(FollowUp.employee)
            .options(joinedload(FollowUp.customer), joinedload(FollowUp.employee))
            .filter(FollowUp.branch_id == branch_id)
        )

        if filter_type == "today":
            query = query.filter(FollowUp.scheduled_date == today, FollowUp.status == "Pending")
        elif filter_type == "overdue":
            query = query.filter(FollowUp.scheduled_date < today, FollowUp.status == "Pending")
        elif filter_type == "upcoming":
            query = query.filter(FollowUp.scheduled_date > today, FollowUp.status == "Pending")
        elif filter_type == "pending":
            query = query.filter(FollowUp.status == "Pending")
        elif filter_type == "completed":
            query = query.filter(FollowUp.status == "Completed")

        if employee_id:
            query = query.filter(FollowUp.employee_id == employee_id)

        if priority and priority != "All":
            query = query.filter(FollowUp.priority == priority)

        if search:
            search_filter = f"%{search}%"
            query = query.filter(
                or_(
                    Customer.full_name.ilike(search_filter),
                    Customer.phone.ilike(search_filter),
                    Employee.full_name.ilike(search_filter),
                )
            )

        return query.order_by(FollowUp.scheduled_date.asc(), FollowUp.priority.desc()).all()

    def get_counts(self, branch_id: int) -> dict:
        today = date.today()
        pending = self.db.query(FollowUp).filter(FollowUp.branch_id == branch_id, FollowUp.status == "Pending").count()
        overdue = (
            self.db.query(FollowUp)
            .filter(FollowUp.branch_id == branch_id, FollowUp.status == "Pending", FollowUp.scheduled_date < today)
            .count()
        )
        today_count = (
            self.db.query(FollowUp)
            .filter(FollowUp.branch_id == branch_id, FollowUp.status == "Pending", FollowUp.scheduled_date == today)
            .count()
        )
        upcoming = (
            self.db.query(FollowUp)
            .filter(FollowUp.branch_id == branch_id, FollowUp.status == "Pending", FollowUp.scheduled_date > today)
            .count()
        )
        return {
            "pending_count": pending,
            "overdue_count": overdue,
            "today_count": today_count,
            "upcoming_count": upcoming,
        }
