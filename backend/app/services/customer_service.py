from datetime import date, datetime, timezone
from typing import Optional, List, Tuple
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from backend.app.models.customer import Customer, CustomerInteraction, FollowUp
from backend.app.models.branch import Admin
from backend.app.schemas.customer import (
    CustomerCreate,
    CustomerUpdate,
    CustomerResponse,
    CustomerListResponse,
    CustomerInteractionCreate,
    CustomerInteractionResponse,
    CustomerDetailResponse,
)
from backend.app.repositories.customer_repo import CustomerRepository
from backend.app.repositories.employee_repo import EmployeeRepository
from backend.app.repositories.followup_repo import FollowUpRepository
from backend.app.repositories.sale_repo import SaleRepository
from backend.app.repositories.audit_repo import AuditRepository


class CustomerService:
    def __init__(self, db: Session):
        self.db = db
        self.cust_repo = CustomerRepository(db)
        self.emp_repo = EmployeeRepository(db)
        self.followup_repo = FollowUpRepository(db)
        self.sale_repo = SaleRepository(db)
        self.audit_repo = AuditRepository(db)

    def create_customer(
        self,
        cust_data: CustomerCreate,
        branch_id: int,
        branch_code: str,
        admin: Admin,
        ip_address: Optional[str] = None,
    ) -> Customer:
        # Validate assigned employee belongs to this branch if provided
        if cust_data.assigned_employee_id:
            emp = self.emp_repo.get_by_id_and_branch(cust_data.assigned_employee_id, branch_id)
            if not emp:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Assigned employee not found in your branch.",
                )

        # Generate unique customer code if not supplied
        if not cust_data.customer_code:
            total_in_branch = self.cust_repo.db.query(Customer).filter(Customer.branch_id == branch_id).count() + 1
            code = f"CUST-{branch_code[:3].upper()}-{total_in_branch:04d}"
        else:
            code = cust_data.customer_code.upper().strip()
            existing = self.cust_repo.get_by_code_and_branch(code, branch_id)
            if existing:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Customer code '{code}' already exists in your branch.")

        new_cust = Customer(
            branch_id=branch_id,
            assigned_employee_id=cust_data.assigned_employee_id,
            customer_code=code,
            full_name=cust_data.full_name.strip(),
            phone=cust_data.phone.strip(),
            email=cust_data.email.strip() if cust_data.email else None,
            location=cust_data.location.strip() if cust_data.location else None,
            customer_type=cust_data.customer_type,
            lead_source=cust_data.lead_source,
            interested_category=cust_data.interested_category,
            budget_range=cust_data.budget_range,
            status=cust_data.status,
            first_contact_date=cust_data.first_contact_date,
            last_contact_date=cust_data.last_contact_date,
            next_followup_date=cust_data.next_followup_date,
            notes=cust_data.notes,
        )
        created = self.cust_repo.create(new_cust)

        # If next followup date is set and employee is assigned, create a follow-up task
        if created.next_followup_date and created.assigned_employee_id:
            followup = FollowUp(
                customer_id=created.id,
                employee_id=created.assigned_employee_id,
                branch_id=branch_id,
                scheduled_date=created.next_followup_date,
                status="Pending",
                priority="High" if created.customer_type == "VIP" else "Medium",
                notes=f"Initial follow-up scheduled for interested category: {created.interested_category}",
            )
            self.followup_repo.create(followup)

        # Log initial interaction
        if created.assigned_employee_id:
            interaction = CustomerInteraction(
                customer_id=created.id,
                employee_id=created.assigned_employee_id,
                branch_id=branch_id,
                interaction_type="First Contact (" + created.lead_source + ")",
                notes=f"Customer registered. Interested in {created.interested_category}. Notes: {created.notes or 'None'}",
                outcome=created.status,
            )
            self.cust_repo.add_interaction(interaction)

        self.audit_repo.log(
            action="Customer Created",
            entity="Customer",
            branch_id=branch_id,
            admin_id=admin.id,
            admin_username=admin.username,
            entity_id=str(created.id),
            ip_address=ip_address,
            details=f"Created customer {created.full_name} ({created.customer_code})",
        )

        assigned_name = None
        if created.assigned_employee_id:
            emp = self.emp_repo.get_by_id_and_branch(created.assigned_employee_id, branch_id)
            assigned_name = emp.full_name if emp else None

        return CustomerResponse(
            id=created.id,
            branch_id=created.branch_id,
            customer_code=created.customer_code,
            full_name=created.full_name,
            phone=created.phone,
            email=created.email,
            location=created.location,
            customer_type=created.customer_type,
            lead_source=created.lead_source,
            interested_category=created.interested_category,
            budget_range=created.budget_range,
            status=created.status,
            assigned_employee_id=created.assigned_employee_id,
            assigned_employee_name=assigned_name,
            first_contact_date=created.first_contact_date,
            last_contact_date=created.last_contact_date,
            next_followup_date=created.next_followup_date,
            notes=created.notes,
            created_at=created.created_at,
            updated_at=created.updated_at,
        )

    def update_customer(
        self,
        customer_id: int,
        cust_data: CustomerUpdate,
        branch_id: int,
        admin: Admin,
        ip_address: Optional[str] = None,
    ) -> CustomerResponse:
        cust = self.cust_repo.get_by_id_and_branch(customer_id, branch_id)
        if not cust:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found in your branch.")

        if cust_data.assigned_employee_id:
            emp = self.emp_repo.get_by_id_and_branch(cust_data.assigned_employee_id, branch_id)
            if not emp:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Assigned employee not found in your branch.")

        old_status = cust.status
        update_dict = cust_data.model_dump(exclude_unset=True)
        for key, val in update_dict.items():
            if val is not None:
                setattr(cust, key, val)

        # If next followup date changed, create or update pending followup
        if cust_data.next_followup_date and cust.assigned_employee_id:
            followup = FollowUp(
                customer_id=cust.id,
                employee_id=cust.assigned_employee_id,
                branch_id=branch_id,
                scheduled_date=cust_data.next_followup_date,
                status="Pending",
                priority="High" if cust.customer_type == "VIP" else "Medium",
                notes=f"Follow-up scheduled after status change to: {cust.status}",
            )
            self.followup_repo.create(followup)

        updated = self.cust_repo.update(cust)

        self.audit_repo.log(
            action="Customer Updated",
            entity="Customer",
            branch_id=branch_id,
            admin_id=admin.id,
            admin_username=admin.username,
            entity_id=str(updated.id),
            ip_address=ip_address,
            details=f"Updated customer {updated.full_name} (Status: {old_status} -> {updated.status})",
        )

        assigned_name = None
        if updated.assigned_employee_id:
            emp = self.emp_repo.get_by_id_and_branch(updated.assigned_employee_id, branch_id)
            assigned_name = emp.full_name if emp else None

        return CustomerResponse(
            id=updated.id,
            branch_id=updated.branch_id,
            customer_code=updated.customer_code,
            full_name=updated.full_name,
            phone=updated.phone,
            email=updated.email,
            location=updated.location,
            customer_type=updated.customer_type,
            lead_source=updated.lead_source,
            interested_category=updated.interested_category,
            budget_range=updated.budget_range,
            status=updated.status,
            assigned_employee_id=updated.assigned_employee_id,
            assigned_employee_name=assigned_name,
            first_contact_date=updated.first_contact_date,
            last_contact_date=updated.last_contact_date,
            next_followup_date=updated.next_followup_date,
            notes=updated.notes,
            created_at=updated.created_at,
            updated_at=updated.updated_at,
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
    ) -> CustomerListResponse:
        customers, total = self.cust_repo.list_customers(
            branch_id=branch_id,
            search=search,
            status=status,
            lead_source=lead_source,
            assigned_employee_id=assigned_employee_id,
            category=category,
            page=page,
            page_size=page_size,
        )

        items = [
            CustomerResponse(
                id=c.id,
                branch_id=c.branch_id,
                customer_code=c.customer_code,
                full_name=c.full_name,
                phone=c.phone,
                email=c.email,
                location=c.location,
                customer_type=c.customer_type,
                lead_source=c.lead_source,
                interested_category=c.interested_category,
                budget_range=c.budget_range,
                status=c.status,
                assigned_employee_id=c.assigned_employee_id,
                assigned_employee_name=c.assigned_employee.full_name if c.assigned_employee else None,
                first_contact_date=c.first_contact_date,
                last_contact_date=c.last_contact_date,
                next_followup_date=c.next_followup_date,
                notes=c.notes,
                created_at=c.created_at,
                updated_at=c.updated_at,
            )
            for c in customers
        ]

        total_pages = (total + page_size - 1) // page_size if total > 0 else 1
        return CustomerListResponse(items=items, total=total, page=page, page_size=page_size, total_pages=total_pages)

    def get_customer_detail(self, customer_id: int, branch_id: int) -> CustomerDetailResponse:
        cust = self.cust_repo.get_by_id_and_branch(customer_id, branch_id)
        if not cust:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found in your branch.")

        interactions = self.cust_repo.get_interactions(customer_id, branch_id)
        interaction_responses = [
            CustomerInteractionResponse(
                id=i.id,
                customer_id=i.customer_id,
                employee_id=i.employee_id,
                employee_name=i.employee.full_name if i.employee else None,
                branch_id=i.branch_id,
                interaction_type=i.interaction_type,
                notes=i.notes,
                outcome=i.outcome,
                created_at=i.created_at,
            )
            for i in interactions
        ]

        # Follow-ups for this customer
        followups = (
            self.db.query(FollowUp)
            .filter(FollowUp.customer_id == customer_id, FollowUp.branch_id == branch_id)
            .order_by(FollowUp.scheduled_date.desc())
            .all()
        )
        fu_list = [
            {
                "id": f.id,
                "scheduled_date": str(f.scheduled_date),
                "status": f.status,
                "priority": f.priority,
                "notes": f.notes,
                "employee_name": f.employee.full_name if f.employee else None,
            }
            for f in followups
        ]

        # Purchases for this customer
        sales, _, _ = self.sale_repo.list_sales(branch_id=branch_id, customer_id=customer_id, page=1, page_size=20)
        purchase_history = [
            {
                "id": s.id,
                "invoice_number": s.invoice_number,
                "purchase_date": str(s.purchase_date),
                "employee_name": s.employee.full_name if s.employee else "N/A",
                "final_sale_value": s.final_sale_value,
                "payment_method": s.payment_method,
            }
            for s in sales
        ]

        assigned_emp_info = None
        if cust.assigned_employee:
            assigned_emp_info = {
                "id": cust.assigned_employee.id,
                "full_name": cust.assigned_employee.full_name,
                "employee_code": cust.assigned_employee.employee_code,
                "designation": cust.assigned_employee.designation,
                "phone": cust.assigned_employee.phone,
            }

        return CustomerDetailResponse(
            customer=CustomerResponse(
                id=cust.id,
                branch_id=cust.branch_id,
                customer_code=cust.customer_code,
                full_name=cust.full_name,
                phone=cust.phone,
                email=cust.email,
                location=cust.location,
                customer_type=cust.customer_type,
                lead_source=cust.lead_source,
                interested_category=cust.interested_category,
                budget_range=cust.budget_range,
                status=cust.status,
                assigned_employee_id=cust.assigned_employee_id,
                assigned_employee_name=cust.assigned_employee.full_name if cust.assigned_employee else None,
                first_contact_date=cust.first_contact_date,
                last_contact_date=cust.last_contact_date,
                next_followup_date=cust.next_followup_date,
                notes=cust.notes,
                created_at=cust.created_at,
                updated_at=cust.updated_at,
            ),
            assigned_employee=assigned_emp_info,
            interactions=interaction_responses,
            follow_ups=fu_list,
            purchase_history=purchase_history,
        )

    def record_interaction(
        self,
        interaction_data: CustomerInteractionCreate,
        branch_id: int,
        admin: Admin,
        ip_address: Optional[str] = None,
    ) -> CustomerInteractionResponse:
        cust = self.cust_repo.get_by_id_and_branch(interaction_data.customer_id, branch_id)
        if not cust:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found in your branch.")

        emp = self.emp_repo.get_by_id_and_branch(interaction_data.employee_id, branch_id)
        if not emp:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Employee not found in your branch.")

        interaction = CustomerInteraction(
            customer_id=cust.id,
            employee_id=emp.id,
            branch_id=branch_id,
            interaction_type=interaction_data.interaction_type,
            notes=interaction_data.notes,
            outcome=interaction_data.outcome,
        )
        created = self.cust_repo.add_interaction(interaction)

        # Update customer last contact date
        cust.last_contact_date = date.today()
        if interaction_data.outcome:
            cust.status = interaction_data.outcome
        self.cust_repo.update(cust)

        return CustomerInteractionResponse(
            id=created.id,
            customer_id=created.customer_id,
            employee_id=created.employee_id,
            employee_name=emp.full_name,
            branch_id=created.branch_id,
            interaction_type=created.interaction_type,
            notes=created.notes,
            outcome=created.outcome,
            created_at=created.created_at,
        )
