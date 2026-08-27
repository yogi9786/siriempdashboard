from datetime import date
from typing import Optional, List, Tuple
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, and_, func
from backend.app.models.customer import Customer, CustomerInteraction
from backend.app.repositories.base import BaseRepository


class CustomerRepository(BaseRepository[Customer]):
    def __init__(self, db: Session):
        super().__init__(Customer, db)

    def get_by_id_and_branch(self, id: int, branch_id: int) -> Optional[Customer]:
        return (
            self.db.query(Customer)
            .options(joinedload(Customer.assigned_employee))
            .filter(Customer.id == id, Customer.branch_id == branch_id)
            .first()
        )

    def get_by_code_and_branch(self, customer_code: str, branch_id: int) -> Optional[Customer]:
        return (
            self.db.query(Customer)
            .filter(Customer.customer_code == customer_code, Customer.branch_id == branch_id)
            .first()
        )

    def list_customers(
        self,
        branch_id: int,
        search: Optional[str] = None,
        status: Optional[str] = None,
        lead_source: Optional[str] = None,
        assigned_employee_id: Optional[int] = None,
        category: Optional[str] = None,
        page: int = 1,
        page_size: int = 20,
    ) -> Tuple[List[Customer], int]:
        query = (
            self.db.query(Customer)
            .options(joinedload(Customer.assigned_employee))
            .filter(Customer.branch_id == branch_id)
        )

        if search:
            search_filter = f"%{search}%"
            query = query.filter(
                or_(
                    Customer.full_name.ilike(search_filter),
                    Customer.phone.ilike(search_filter),
                    Customer.customer_code.ilike(search_filter),
                    Customer.location.ilike(search_filter),
                )
            )

        if status and status != "All":
            query = query.filter(Customer.status == status)

        if lead_source and lead_source != "All":
            query = query.filter(Customer.lead_source == lead_source)

        if assigned_employee_id:
            query = query.filter(Customer.assigned_employee_id == assigned_employee_id)

        if category and category != "All":
            query = query.filter(Customer.interested_category == category)

        total = query.count()
        items = (
            query.order_by(Customer.created_at.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
            .all()
        )
        return items, total

    def count_by_status(self, branch_id: int, status: str) -> int:
        return self.db.query(Customer).filter(Customer.branch_id == branch_id, Customer.status == status).count()

    def add_interaction(self, interaction: CustomerInteraction) -> CustomerInteraction:
        self.db.add(interaction)
        self.db.commit()
        self.db.refresh(interaction)
        return interaction

    def get_interactions(self, customer_id: int, branch_id: int) -> List[CustomerInteraction]:
        return (
            self.db.query(CustomerInteraction)
            .filter(CustomerInteraction.customer_id == customer_id, CustomerInteraction.branch_id == branch_id)
            .order_by(CustomerInteraction.created_at.desc())
            .all()
        )
