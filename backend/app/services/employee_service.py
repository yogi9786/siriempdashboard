from datetime import date, timedelta
from typing import Optional, Tuple, List, Dict, Any
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from backend.app.models.employee import Employee
from backend.app.models.branch import Admin
from backend.app.schemas.employee import (
    EmployeeCreate,
    EmployeeUpdate,
    EmployeeResponse,
    EmployeePerformanceSummary,
    EmployeeListResponse,
    EmployeeDetailResponse,
)
from backend.app.repositories.employee_repo import EmployeeRepository
from backend.app.repositories.performance_repo import PerformanceRepository
from backend.app.repositories.sale_repo import SaleRepository
from backend.app.repositories.customer_repo import CustomerRepository
from backend.app.repositories.audit_repo import AuditRepository


class EmployeeService:
    def __init__(self, db: Session):
        self.db = db
        self.emp_repo = EmployeeRepository(db)
        self.perf_repo = PerformanceRepository(db)
        self.sale_repo = SaleRepository(db)
        self.cust_repo = CustomerRepository(db)
        self.audit_repo = AuditRepository(db)

    def create_employee(
        self,
        emp_data: EmployeeCreate,
        branch_id: int,
        admin: Admin,
        ip_address: Optional[str] = None,
    ) -> Employee:
        # Check uniqueness of employee code in branch
        existing = self.emp_repo.get_by_code_and_branch(emp_data.employee_code, branch_id)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Employee code '{emp_data.employee_code}' already exists in this branch.",
            )

        new_emp = Employee(
            branch_id=branch_id,
            employee_code=emp_data.employee_code.upper().strip(),
            full_name=emp_data.full_name.strip(),
            phone=emp_data.phone.strip(),
            email=emp_data.email.strip() if emp_data.email else None,
            gender=emp_data.gender,
            date_of_joining=emp_data.date_of_joining,
            designation=emp_data.designation.strip(),
            department=emp_data.department.strip(),
            status=emp_data.status,
            monthly_target=emp_data.monthly_target,
            daily_target=emp_data.daily_target,
            notes=emp_data.notes,
        )
        created = self.emp_repo.create(new_emp)

        self.audit_repo.log(
            action="Employee Created",
            entity="Employee",
            branch_id=branch_id,
            admin_id=admin.id,
            admin_username=admin.username,
            entity_id=str(created.id),
            ip_address=ip_address,
            details=f"Created employee {created.full_name} ({created.employee_code})",
        )

        return created

    def update_employee(
        self,
        employee_id: int,
        emp_data: EmployeeUpdate,
        branch_id: int,
        admin: Admin,
        ip_address: Optional[str] = None,
    ) -> Employee:
        emp = self.emp_repo.get_by_id_and_branch(employee_id, branch_id)
        if not emp:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found in your branch.")

        update_dict = emp_data.model_dump(exclude_unset=True)
        for key, val in update_dict.items():
            if val is not None:
                setattr(emp, key, val)

        updated = self.emp_repo.update(emp)

        self.audit_repo.log(
            action="Employee Updated",
            entity="Employee",
            branch_id=branch_id,
            admin_id=admin.id,
            admin_username=admin.username,
            entity_id=str(updated.id),
            ip_address=ip_address,
            details=f"Updated details for employee {updated.full_name}",
        )
        return updated

    def toggle_status(
        self,
        employee_id: int,
        branch_id: int,
        admin: Admin,
        ip_address: Optional[str] = None,
    ) -> Employee:
        emp = self.emp_repo.get_by_id_and_branch(employee_id, branch_id)
        if not emp:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found in your branch.")

        emp.status = "inactive" if emp.status == "active" else "active"
        updated = self.emp_repo.update(emp)

        self.audit_repo.log(
            action=f"Employee {'Deactivated' if updated.status == 'inactive' else 'Activated'}",
            entity="Employee",
            branch_id=branch_id,
            admin_id=admin.id,
            admin_username=admin.username,
            entity_id=str(updated.id),
            ip_address=ip_address,
            details=f"Status changed to {updated.status} for employee {updated.full_name}",
        )
        return updated

    def list_employees_with_performance(
        self,
        branch_id: int,
        search: Optional[str] = None,
        department: Optional[str] = None,
        status_filter: Optional[str] = None,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        page: int = 1,
        page_size: int = 20,
    ) -> EmployeeListResponse:
        employees, total = self.emp_repo.list_employees(
            branch_id=branch_id,
            search=search,
            department=department,
            status=status_filter,
            page=page,
            page_size=page_size,
        )

        today = date.today()
        if not start_date:
            start_date = today.replace(day=1)
        if not end_date:
            end_date = today

        days_in_period = max(1, (end_date - start_date).days + 1)

        items: List[EmployeePerformanceSummary] = []
        for emp in employees:
            agg = self.perf_repo.aggregate_for_employee(emp.id, branch_id, start_date, end_date)
            period_target = (emp.monthly_target / 30.0) * days_in_period
            target_achieve = (agg["sales_value"] / period_target * 100.0) if period_target > 0 else 0.0

            summary = EmployeePerformanceSummary(
                employee_id=emp.id,
                employee_code=emp.employee_code,
                full_name=emp.full_name,
                designation=emp.designation,
                department=emp.department,
                status=emp.status,
                monthly_target=emp.monthly_target,
                daily_target=emp.daily_target,
                customers_approached=agg["customers_approached"],
                customers_visited=agg["customers_visited"],
                follow_ups_count=agg["follow_ups_count"],
                conversions_count=agg["conversions_count"],
                sales_count=agg["sales_count"],
                sales_value=agg["sales_value"],
                average_sale_value=agg["average_sale_value"],
                conversion_rate=agg["conversion_rate"],
                target_achievement_rate=round(target_achieve, 1),
                performance_score=agg["performance_score"],
                last_activity_date=agg["last_activity_date"],
            )
            items.append(summary)

        total_pages = (total + page_size - 1) // page_size if total > 0 else 1

        return EmployeeListResponse(
            items=items,
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
        )

    def get_employee_detail(
        self,
        employee_id: int,
        branch_id: int,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
    ) -> EmployeeDetailResponse:
        emp = self.emp_repo.get_by_id_and_branch(employee_id, branch_id)
        if not emp:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found in your branch.")

        today = date.today()
        if not start_date:
            start_date = today.replace(day=1)
        if not end_date:
            end_date = today

        days_in_period = max(1, (end_date - start_date).days + 1)
        agg = self.perf_repo.aggregate_for_employee(emp.id, branch_id, start_date, end_date)
        period_target = (emp.monthly_target / 30.0) * days_in_period
        target_achieve = (agg["sales_value"] / period_target * 100.0) if period_target > 0 else 0.0

        summary = EmployeePerformanceSummary(
            employee_id=emp.id,
            employee_code=emp.employee_code,
            full_name=emp.full_name,
            designation=emp.designation,
            department=emp.department,
            status=emp.status,
            monthly_target=emp.monthly_target,
            daily_target=emp.daily_target,
            customers_approached=agg["customers_approached"],
            customers_visited=agg["customers_visited"],
            follow_ups_count=agg["follow_ups_count"],
            conversions_count=agg["conversions_count"],
            sales_count=agg["sales_count"],
            sales_value=agg["sales_value"],
            average_sale_value=agg["average_sale_value"],
            conversion_rate=agg["conversion_rate"],
            target_achievement_rate=round(target_achieve, 1),
            performance_score=agg["performance_score"],
            last_activity_date=agg["last_activity_date"],
        )

        # Recent sales by this employee
        sales, _, _ = self.sale_repo.list_sales(branch_id=branch_id, employee_id=employee_id, page=1, page_size=10)
        recent_sales = [
            {
                "id": s.id,
                "invoice_number": s.invoice_number,
                "purchase_date": str(s.purchase_date),
                "customer_name": s.customer.full_name if s.customer else "Walk-in Customer",
                "final_sale_value": s.final_sale_value,
                "payment_method": s.payment_method,
            }
            for s in sales
        ]

        # Recent customers assigned to this employee
        customers, _ = self.cust_repo.list_customers(branch_id=branch_id, assigned_employee_id=employee_id, page=1, page_size=10)
        recent_customers = [
            {
                "id": c.id,
                "customer_code": c.customer_code,
                "full_name": c.full_name,
                "phone": c.phone,
                "status": c.status,
                "interested_category": c.interested_category,
                "next_followup_date": str(c.next_followup_date) if c.next_followup_date else None,
            }
            for c in customers
        ]

        # Daily performance history (last 30 entries)
        performances = self.perf_repo.list_performances(branch_id=branch_id, employee_id=employee_id)
        daily_history = [
            {
                "id": p.id,
                "date": str(p.date),
                "customers_approached": p.customers_approached,
                "customers_visited": p.customers_visited,
                "conversions": p.customers_converted,
                "sales_count": p.sales_count,
                "total_sales_value": p.total_sales_value,
                "performance_score": p.performance_score,
            }
            for p in performances[:30]
        ]

        return EmployeeDetailResponse(
            employee=EmployeeResponse.model_validate(emp),
            performance_summary=summary,
            recent_sales=recent_sales,
            recent_customers=recent_customers,
            daily_history=daily_history,
        )
