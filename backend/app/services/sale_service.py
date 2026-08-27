from datetime import date, datetime
from typing import Optional, List, Dict, Any, Tuple
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from backend.app.models.sale import Sale, SaleItem
from backend.app.models.customer import Customer, CustomerInteraction
from backend.app.models.employee import Employee
from backend.app.models.performance import DailyPerformance
from backend.app.models.branch import Admin
from backend.app.schemas.sale import (
    SaleCreate,
    SaleResponse,
    SaleDetailResponse,
    SalesListResponse,
    SaleItemResponse,
    SalesAnalyticsResponse,
)
from backend.app.repositories.sale_repo import SaleRepository
from backend.app.repositories.customer_repo import CustomerRepository
from backend.app.repositories.employee_repo import EmployeeRepository
from backend.app.repositories.performance_repo import PerformanceRepository
from backend.app.repositories.audit_repo import AuditRepository
from backend.app.services.performance_service import PerformanceScoringService


class SaleService:
    def __init__(self, db: Session):
        self.db = db
        self.sale_repo = SaleRepository(db)
        self.cust_repo = CustomerRepository(db)
        self.emp_repo = EmployeeRepository(db)
        self.perf_repo = PerformanceRepository(db)
        self.audit_repo = AuditRepository(db)

    def create_sale(
        self,
        sale_data: SaleCreate,
        branch_id: int,
        admin: Admin,
        ip_address: Optional[str] = None,
    ) -> SaleDetailResponse:
        # 1. Validate employee
        emp = self.emp_repo.get_by_id_and_branch(sale_data.employee_id, branch_id)
        if not emp:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Employee not found in your branch.")

        # 2. Validate customer if provided
        cust = None
        if sale_data.customer_id:
            cust = self.cust_repo.get_by_id_and_branch(sale_data.customer_id, branch_id)
            if not cust:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Customer not found in your branch.")

        # 3. Validate unique invoice number
        existing_invoice = self.sale_repo.get_by_invoice_number(sale_data.invoice_number.strip())
        if existing_invoice:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Invoice number '{sale_data.invoice_number}' already exists.")

        # 4. Calculate item totals and validate
        total_gross_wt = 0.0
        total_net_wt = 0.0
        total_making = 0.0
        total_disc = 0.0
        total_gst = 0.0
        calculated_final_val = 0.0

        sale_items_to_create = []
        for item in sale_data.items:
            # Backend calculation & verification
            item_val = item.final_amount
            total_gross_wt += item.gross_weight
            total_net_wt += item.net_weight
            total_making += item.making_charges
            total_disc += item.discount
            total_gst += item.gst_amount
            calculated_final_val += item_val

            sale_items_to_create.append(
                SaleItem(
                    product_category=item.product_category,
                    metal_purity=item.metal_purity,
                    item_name=item.item_name.strip(),
                    gross_weight=item.gross_weight,
                    net_weight=item.net_weight,
                    quantity=item.quantity,
                    unit_rate=item.unit_rate,
                    making_charges=item.making_charges,
                    discount=item.discount,
                    gst_amount=item.gst_amount,
                    final_amount=item_val,
                )
            )

        # 5. Create Sale
        new_sale = Sale(
            branch_id=branch_id,
            customer_id=cust.id if cust else None,
            employee_id=emp.id,
            invoice_number=sale_data.invoice_number.strip().upper(),
            purchase_date=sale_data.purchase_date,
            total_gross_weight=round(total_gross_wt, 3),
            total_net_weight=round(total_net_wt, 3),
            total_making_charges=round(total_making, 2),
            total_discount=round(total_disc, 2),
            total_gst=round(total_gst, 2),
            final_sale_value=round(calculated_final_val, 2),
            payment_method=sale_data.payment_method,
            notes=sale_data.notes,
            items=sale_items_to_create,
        )
        created_sale = self.sale_repo.create(new_sale)

        # 6. Update Customer Status & add Interaction
        if cust:
            cust.status = "Converted"
            cust.last_contact_date = sale_data.purchase_date
            self.cust_repo.update(cust)

            interaction = CustomerInteraction(
                customer_id=cust.id,
                employee_id=emp.id,
                branch_id=branch_id,
                interaction_type="Jewellery Purchase",
                notes=f"Purchased jewellery. Invoice #{created_sale.invoice_number}, Total: ₹{created_sale.final_sale_value:,.2f}",
                outcome="Converted",
            )
            self.cust_repo.add_interaction(interaction)

        # 7. Update or Create Employee Daily Performance record
        daily_perf = self.perf_repo.get_by_employee_and_date(emp.id, sale_data.purchase_date)
        if not daily_perf:
            daily_perf = DailyPerformance(
                branch_id=branch_id,
                employee_id=emp.id,
                date=sale_data.purchase_date,
                customers_approached=1,
                customers_visited=1,
                customers_converted=1,
                sales_count=1,
                total_sales_value=created_sale.final_sale_value,
            )
            # Categorize sales value
            for item in sale_items_to_create:
                cat_lower = item.product_category.lower()
                if "gold" in cat_lower and "coin" not in cat_lower:
                    daily_perf.gold_sales_value += item.final_amount
                elif "diamond" in cat_lower:
                    daily_perf.diamond_sales_value += item.final_amount
                elif "silver" in cat_lower:
                    daily_perf.silver_sales_value += item.final_amount
                else:
                    daily_perf.other_sales_value += item.final_amount
            daily_perf.performance_score = PerformanceScoringService.calculate_daily_score(
                approached=daily_perf.customers_approached,
                visited=daily_perf.customers_visited,
                conversions=daily_perf.customers_converted,
                completed_followups=0,
                pending_followups=0,
                total_sales=daily_perf.total_sales_value,
                daily_target=emp.daily_target,
            )
            self.perf_repo.create(daily_perf)
        else:
            daily_perf.sales_count += 1
            daily_perf.customers_converted += 1
            daily_perf.total_sales_value += created_sale.final_sale_value
            for item in sale_items_to_create:
                cat_lower = item.product_category.lower()
                if "gold" in cat_lower and "coin" not in cat_lower:
                    daily_perf.gold_sales_value += item.final_amount
                elif "diamond" in cat_lower:
                    daily_perf.diamond_sales_value += item.final_amount
                elif "silver" in cat_lower:
                    daily_perf.silver_sales_value += item.final_amount
                else:
                    daily_perf.other_sales_value += item.final_amount
            daily_perf.performance_score = PerformanceScoringService.calculate_daily_score(
                approached=daily_perf.customers_approached,
                visited=daily_perf.customers_visited,
                conversions=daily_perf.customers_converted,
                completed_followups=daily_perf.completed_followups,
                pending_followups=daily_perf.pending_followups,
                total_sales=daily_perf.total_sales_value,
                daily_target=emp.daily_target,
            )
            self.perf_repo.update(daily_perf)

        # 8. Audit Log
        self.audit_repo.log(
            action="Sale Created",
            entity="Sale",
            branch_id=branch_id,
            admin_id=admin.id,
            admin_username=admin.username,
            entity_id=str(created_sale.id),
            ip_address=ip_address,
            details=f"Recorded sale #{created_sale.invoice_number} (₹{created_sale.final_sale_value:,.2f}) for employee {emp.full_name}",
        )

        return self.get_sale_detail(created_sale.id, branch_id)

    def list_sales(
        self,
        branch_id: int,
        search: Optional[str] = None,
        employee_id: Optional[int] = None,
        customer_id: Optional[int] = None,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        payment_method: Optional[str] = None,
        page: int = 1,
        page_size: int = 20,
    ) -> SalesListResponse:
        sales, total, total_val = self.sale_repo.list_sales(
            branch_id=branch_id,
            search=search,
            employee_id=employee_id,
            customer_id=customer_id,
            start_date=start_date,
            end_date=end_date,
            payment_method=payment_method,
            page=page,
            page_size=page_size,
        )

        items = [
            SaleResponse(
                id=s.id,
                branch_id=s.branch_id,
                customer_id=s.customer_id,
                customer_name=s.customer.full_name if s.customer else "Walk-in Customer",
                customer_phone=s.customer.phone if s.customer else None,
                employee_id=s.employee_id,
                employee_name=s.employee.full_name,
                employee_code=s.employee.employee_code,
                invoice_number=s.invoice_number,
                purchase_date=s.purchase_date,
                total_gross_weight=s.total_gross_weight,
                total_net_weight=s.total_net_weight,
                total_making_charges=s.total_making_charges,
                total_discount=s.total_discount,
                total_gst=s.total_gst,
                final_sale_value=s.final_sale_value,
                payment_method=s.payment_method,
                notes=s.notes,
                item_count=len(s.items) if s.items else 0,
                created_at=s.created_at,
            )
            for s in sales
        ]
        total_pages = (total + page_size - 1) // page_size if total > 0 else 1
        return SalesListResponse(
            items=items,
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
            total_sales_value=total_val,
        )

    def get_sale_detail(self, sale_id: int, branch_id: int) -> SaleDetailResponse:
        sale = self.sale_repo.get_by_id_and_branch(sale_id, branch_id)
        if not sale:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sale not found in your branch.")

        items = [
            SaleItemResponse(
                id=item.id,
                sale_id=item.sale_id,
                product_category=item.product_category,
                metal_purity=item.metal_purity,
                item_name=item.item_name,
                gross_weight=item.gross_weight,
                net_weight=item.net_weight,
                quantity=item.quantity,
                unit_rate=item.unit_rate,
                making_charges=item.making_charges,
                discount=item.discount,
                gst_amount=item.gst_amount,
                final_amount=item.final_amount,
                created_at=item.created_at,
            )
            for item in sale.items
        ]

        return SaleDetailResponse(
            id=sale.id,
            branch_id=sale.branch_id,
            customer_id=sale.customer_id,
            customer_name=sale.customer.full_name if sale.customer else "Walk-in Customer",
            customer_phone=sale.customer.phone if sale.customer else None,
            employee_id=sale.employee_id,
            employee_name=sale.employee.full_name,
            employee_code=sale.employee.employee_code,
            invoice_number=sale.invoice_number,
            purchase_date=sale.purchase_date,
            total_gross_weight=sale.total_gross_weight,
            total_net_weight=sale.total_net_weight,
            total_making_charges=sale.total_making_charges,
            total_discount=sale.total_discount,
            total_gst=sale.total_gst,
            final_sale_value=sale.final_sale_value,
            payment_method=sale.payment_method,
            notes=sale.notes,
            item_count=len(items),
            created_at=sale.created_at,
            items=items,
        )

    def get_analytics(self, branch_id: int, start_date: date, end_date: date) -> SalesAnalyticsResponse:
        analytics = self.sale_repo.get_sales_analytics(branch_id, start_date, end_date)
        return SalesAnalyticsResponse(**analytics)
