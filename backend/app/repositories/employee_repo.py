from datetime import date
from typing import Optional, List, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, func
from backend.app.models.employee import Employee, EmployeeTarget
from backend.app.models.performance import DailyPerformance
from backend.app.models.sale import Sale
from backend.app.models.customer import Customer
from backend.app.repositories.base import BaseRepository


class EmployeeRepository(BaseRepository[Employee]):
    def __init__(self, db: Session):
        super().__init__(Employee, db)

    def get_by_id_and_branch(self, id: int, branch_id: int) -> Optional[Employee]:
        return self.db.query(Employee).filter(Employee.id == id, Employee.branch_id == branch_id).first()

    def get_by_code_and_branch(self, employee_code: str, branch_id: int) -> Optional[Employee]:
        return (
            self.db.query(Employee)
            .filter(Employee.employee_code == employee_code, Employee.branch_id == branch_id)
            .first()
        )

    def list_employees(
        self,
        branch_id: int,
        search: Optional[str] = None,
        department: Optional[str] = None,
        status: Optional[str] = None,
        page: int = 1,
        page_size: int = 20,
    ) -> Tuple[List[Employee], int]:
        query = self.db.query(Employee).filter(Employee.branch_id == branch_id)

        if search:
            search_filter = f"%{search}%"
            query = query.filter(
                or_(
                    Employee.full_name.ilike(search_filter),
                    Employee.employee_code.ilike(search_filter),
                    Employee.phone.ilike(search_filter),
                    Employee.designation.ilike(search_filter),
                )
            )

        if department and department != "All":
            query = query.filter(Employee.department == department)

        if status and status != "All":
            query = query.filter(Employee.status == status)

        total = query.count()
        items = query.order_by(Employee.status == "active", Employee.full_name).offset((page - 1) * page_size).limit(page_size).all()
        return items, total

    def count_active(self, branch_id: int) -> int:
        return self.db.query(Employee).filter(Employee.branch_id == branch_id, Employee.status == "active").count()

    def get_all_active_by_branch(self, branch_id: int) -> List[Employee]:
        return (
            self.db.query(Employee)
            .filter(Employee.branch_id == branch_id, Employee.status == "active")
            .order_by(Employee.full_name)
            .all()
        )
