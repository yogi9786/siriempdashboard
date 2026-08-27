from datetime import date
from typing import Optional, List, Tuple, Dict, Any
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, or_, and_, desc
from backend.app.models.sale import Sale, SaleItem
from backend.app.models.customer import Customer
from backend.app.models.employee import Employee
from backend.app.repositories.base import BaseRepository


class SaleRepository(BaseRepository[Sale]):
    def __init__(self, db: Session):
        super().__init__(Sale, db)

    def get_by_id_and_branch(self, id: int, branch_id: int) -> Optional[Sale]:
        return (
            self.db.query(Sale)
            .options(
                joinedload(Sale.items),
                joinedload(Sale.customer),
                joinedload(Sale.employee),
            )
            .filter(Sale.id == id, Sale.branch_id == branch_id)
            .first()
        )

    def get_by_invoice_number(self, invoice_number: str) -> Optional[Sale]:
        return self.db.query(Sale).filter(Sale.invoice_number == invoice_number).first()

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
    ) -> Tuple[List[Sale], int, float]:
        query = (
            self.db.query(Sale)
            .options(
                joinedload(Sale.items),
                joinedload(Sale.customer),
                joinedload(Sale.employee),
            )
            .filter(Sale.branch_id == branch_id)
        )

        if search:
            search_filter = f"%{search}%"
            query = query.outerjoin(Sale.customer).join(Sale.employee).filter(
                or_(
                    Sale.invoice_number.ilike(search_filter),
                    Customer.full_name.ilike(search_filter),
                    Customer.phone.ilike(search_filter),
                    Employee.full_name.ilike(search_filter),
                    Employee.employee_code.ilike(search_filter),
                )
            )

        if employee_id:
            query = query.filter(Sale.employee_id == employee_id)

        if customer_id:
            query = query.filter(Sale.customer_id == customer_id)

        if start_date:
            query = query.filter(Sale.purchase_date >= start_date)

        if end_date:
            query = query.filter(Sale.purchase_date <= end_date)

        if payment_method and payment_method != "All":
            query = query.filter(Sale.payment_method == payment_method)

        total_count = query.count()
        total_val = self.db.query(func.coalesce(func.sum(Sale.final_sale_value), 0.0)).filter(
            Sale.branch_id == branch_id,
            *( [Sale.purchase_date >= start_date] if start_date else [] ),
            *( [Sale.purchase_date <= end_date] if end_date else [] ),
            *( [Sale.employee_id == employee_id] if employee_id else [] ),
        ).scalar() or 0.0

        items = (
            query.order_by(Sale.purchase_date.desc(), Sale.id.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
            .all()
        )
        return items, total_count, float(total_val)

    def get_sales_analytics(self, branch_id: int, start_date: date, end_date: date) -> Dict[str, Any]:
        sales_query = self.db.query(Sale).filter(
            Sale.branch_id == branch_id,
            Sale.purchase_date >= start_date,
            Sale.purchase_date <= end_date,
        )

        total_sales_value = self.db.query(func.coalesce(func.sum(Sale.final_sale_value), 0.0)).filter(
            Sale.branch_id == branch_id,
            Sale.purchase_date >= start_date,
            Sale.purchase_date <= end_date,
        ).scalar() or 0.0

        total_transactions = sales_query.count()
        avg_transaction_val = (total_sales_value / total_transactions) if total_transactions > 0 else 0.0
        highest_sale = self.db.query(func.coalesce(func.max(Sale.final_sale_value), 0.0)).filter(
            Sale.branch_id == branch_id,
            Sale.purchase_date >= start_date,
            Sale.purchase_date <= end_date,
        ).scalar() or 0.0

        # Category Breakdown from SaleItems
        category_rows = (
            self.db.query(
                SaleItem.product_category,
                func.count(SaleItem.id).label("count"),
                func.coalesce(func.sum(SaleItem.final_amount), 0.0).label("value"),
            )
            .join(Sale, SaleItem.sale_id == Sale.id)
            .filter(
                Sale.branch_id == branch_id,
                Sale.purchase_date >= start_date,
                Sale.purchase_date <= end_date,
            )
            .group_by(SaleItem.product_category)
            .order_by(desc("value"))
            .all()
        )

        category_breakdown = []
        gold_val = 0.0
        diamond_val = 0.0
        silver_val = 0.0
        bridal_val = 0.0
        other_val = 0.0

        for r in category_rows:
            cat_name = r.product_category
            val = float(r.value)
            pct = (val / total_sales_value * 100) if total_sales_value > 0 else 0.0
            category_breakdown.append({
                "category": cat_name,
                "sales_count": int(r.count),
                "total_value": val,
                "percentage": round(pct, 1),
            })
            cat_lower = cat_name.lower()
            if "gold" in cat_lower and "coin" not in cat_lower:
                gold_val += val
            elif "diamond" in cat_lower:
                diamond_val += val
            elif "silver" in cat_lower:
                silver_val += val
            elif "bridal" in cat_lower:
                bridal_val += val
            else:
                other_val += val

        # Daily Trend
        trend_rows = (
            self.db.query(
                Sale.purchase_date,
                func.coalesce(func.sum(Sale.final_sale_value), 0.0).label("value"),
                func.count(Sale.id).label("count"),
            )
            .filter(
                Sale.branch_id == branch_id,
                Sale.purchase_date >= start_date,
                Sale.purchase_date <= end_date,
            )
            .group_by(Sale.purchase_date)
            .order_by(Sale.purchase_date.asc())
            .all()
        )
        daily_trend = [
            {
                "date": str(r.purchase_date),
                "sales_value": float(r.value),
                "transactions_count": int(r.count),
            }
            for r in trend_rows
        ]

        # Employee Contributions
        emp_rows = (
            self.db.query(
                Employee.id,
                Employee.full_name,
                Employee.employee_code,
                func.coalesce(func.sum(Sale.final_sale_value), 0.0).label("value"),
                func.count(Sale.id).label("count"),
            )
            .join(Employee, Sale.employee_id == Employee.id)
            .filter(
                Sale.branch_id == branch_id,
                Sale.purchase_date >= start_date,
                Sale.purchase_date <= end_date,
            )
            .group_by(Employee.id, Employee.full_name, Employee.employee_code)
            .order_by(desc("value"))
            .all()
        )
        employee_contributions = [
            {
                "employee_id": r.id,
                "employee_name": r.full_name,
                "employee_code": r.employee_code,
                "sales_value": float(r.value),
                "sales_count": int(r.count),
                "percentage": round((float(r.value) / total_sales_value * 100) if total_sales_value > 0 else 0.0, 1),
            }
            for r in emp_rows
        ]

        # Payment Methods Breakdown
        pay_rows = (
            self.db.query(
                Sale.payment_method,
                func.coalesce(func.sum(Sale.final_sale_value), 0.0).label("value"),
                func.count(Sale.id).label("count"),
            )
            .filter(
                Sale.branch_id == branch_id,
                Sale.purchase_date >= start_date,
                Sale.purchase_date <= end_date,
            )
            .group_by(Sale.payment_method)
            .order_by(desc("value"))
            .all()
        )
        payment_methods = [
            {
                "method": r.payment_method,
                "total_value": float(r.value),
                "transactions_count": int(r.count),
                "percentage": round((float(r.value) / total_sales_value * 100) if total_sales_value > 0 else 0.0, 1),
            }
            for r in pay_rows
        ]

        return {
            "total_sales_value": float(total_sales_value),
            "total_transactions": total_transactions,
            "average_transaction_value": round(avg_transaction_val, 2),
            "highest_sale_value": float(highest_sale),
            "gold_sales_value": float(gold_val),
            "diamond_sales_value": float(diamond_val),
            "silver_sales_value": float(silver_val),
            "bridal_sales_value": float(bridal_val),
            "other_sales_value": float(other_val),
            "category_breakdown": category_breakdown,
            "daily_trend": daily_trend,
            "employee_contributions": employee_contributions,
            "payment_methods_breakdown": payment_methods,
        }
