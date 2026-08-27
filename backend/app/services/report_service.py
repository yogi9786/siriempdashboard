from datetime import date, datetime, timezone
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from backend.app.schemas.report import ReportFilterRequest, ReportResponse, ReportSummaryMetric
from backend.app.repositories.branch_repo import BranchRepository
from backend.app.repositories.employee_repo import EmployeeRepository
from backend.app.repositories.customer_repo import CustomerRepository
from backend.app.repositories.sale_repo import SaleRepository
from backend.app.repositories.performance_repo import PerformanceRepository
from backend.app.repositories.followup_repo import FollowUpRepository
from backend.app.services.performance_service import PerformanceScoringService


class ReportService:
    def __init__(self, db: Session):
        self.db = db
        self.branch_repo = BranchRepository(db)
        self.emp_repo = EmployeeRepository(db)
        self.cust_repo = CustomerRepository(db)
        self.sale_repo = SaleRepository(db)
        self.perf_repo = PerformanceRepository(db)
        self.followup_repo = FollowUpRepository(db)

    def generate_report(self, filter_req: ReportFilterRequest, branch_id: int) -> ReportResponse:
        branch = self.branch_repo.get_by_id(branch_id)
        if not branch:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Branch not found.")

        report_type = filter_req.report_type.lower()

        if report_type == "employee_performance":
            return self._generate_employee_performance_report(filter_req, branch)
        elif report_type in ["daily_sales", "monthly_sales"]:
            return self._generate_sales_report(filter_req, branch)
        elif report_type == "customer_conversion":
            return self._generate_customer_conversion_report(filter_req, branch)
        elif report_type == "branch_performance":
            return self._generate_branch_performance_report(filter_req, branch)
        elif report_type == "employee_targets":
            return self._generate_employee_targets_report(filter_req, branch)
        elif report_type == "follow_up_summary":
            return self._generate_followup_report(filter_req, branch)
        else:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Unsupported report type: {filter_req.report_type}")

    def _generate_employee_performance_report(self, filter_req: ReportFilterRequest, branch: Any) -> ReportResponse:
        leaderboard = PerformanceScoringService.get_leaderboard(
            self.db, branch.id, filter_req.start_date, filter_req.end_date
        )

        columns = [
            "Rank",
            "Employee Code",
            "Employee Name",
            "Designation",
            "Department",
            "Approached",
            "Conversions",
            "Conversion %",
            "Total Sales (₹)",
            "Period Target (₹)",
            "Target %",
            "Score",
        ]
        column_keys = [
            "rank",
            "employee_code",
            "employee_name",
            "designation",
            "department",
            "customers_approached",
            "conversions",
            "conversion_rate",
            "total_sales",
            "target_amount",
            "target_achievement_rate",
            "performance_score",
        ]

        rows = []
        total_sales_all = 0.0
        total_approaches_all = 0
        total_conversions_all = 0

        for item in leaderboard:
            if filter_req.department and item["department"] != filter_req.department:
                continue
            if filter_req.employee_id and item["employee_id"] != filter_req.employee_id:
                continue

            total_sales_all += item["total_sales"]
            total_approaches_all += item["customers_approached"]
            total_conversions_all += item["conversions"]

            rows.append({
                "rank": item["rank"],
                "employee_code": item["employee_code"],
                "employee_name": item["employee_name"],
                "designation": item["designation"],
                "department": item["department"],
                "customers_approached": item["customers_approached"],
                "conversions": item["conversions"],
                "conversion_rate": f"{item['conversion_rate']}%",
                "total_sales": f"₹{item['total_sales']:,.2f}",
                "target_amount": f"₹{item['target_amount']:,.2f}",
                "target_achievement_rate": f"{item['target_achievement_rate']}%",
                "performance_score": f"{item['performance_score']}/100",
            })

        overall_conv_rate = (total_conversions_all / total_approaches_all * 100.0) if total_approaches_all > 0 else 0.0
        metrics = [
            ReportSummaryMetric(label="Total Employees", value=str(len(rows))),
            ReportSummaryMetric(label="Total Sales", value=f"₹{total_sales_all:,.2f}"),
            ReportSummaryMetric(label="Total Approached", value=str(total_approaches_all)),
            ReportSummaryMetric(label="Overall Conversion Rate", value=f"{overall_conv_rate:.1f}%"),
        ]

        return ReportResponse(
            report_type="employee_performance",
            title=f"Employee Performance Report ({filter_req.start_date} to {filter_req.end_date})",
            branch_name=branch.name,
            start_date=filter_req.start_date,
            end_date=filter_req.end_date,
            generated_at=datetime.now(timezone.utc),
            columns=columns,
            column_keys=column_keys,
            rows=rows,
            summary_metrics=metrics,
            total_records=len(rows),
        )

    def _generate_sales_report(self, filter_req: ReportFilterRequest, branch: Any) -> ReportResponse:
        sales, total, total_val = self.sale_repo.list_sales(
            branch_id=branch.id,
            employee_id=filter_req.employee_id,
            start_date=filter_req.start_date,
            end_date=filter_req.end_date,
            page=1,
            page_size=1000,
        )

        columns = [
            "Invoice #",
            "Date",
            "Customer",
            "Employee",
            "Payment Method",
            "Gross Wt (g)",
            "Net Wt (g)",
            "Discount (₹)",
            "GST (₹)",
            "Final Amount (₹)",
        ]
        column_keys = [
            "invoice_number",
            "purchase_date",
            "customer_name",
            "employee_name",
            "payment_method",
            "total_gross_weight",
            "total_net_weight",
            "total_discount",
            "total_gst",
            "final_sale_value",
        ]

        rows = []
        for s in sales:
            rows.append({
                "invoice_number": s.invoice_number,
                "purchase_date": str(s.purchase_date),
                "customer_name": s.customer.full_name if s.customer else "Walk-in Customer",
                "employee_name": s.employee.full_name,
                "payment_method": s.payment_method,
                "total_gross_weight": f"{s.total_gross_weight:.2f}g",
                "total_net_weight": f"{s.total_net_weight:.2f}g",
                "total_discount": f"₹{s.total_discount:,.2f}",
                "total_gst": f"₹{s.total_gst:,.2f}",
                "final_sale_value": f"₹{s.final_sale_value:,.2f}",
            })

        metrics = [
            ReportSummaryMetric(label="Total Invoices", value=str(total)),
            ReportSummaryMetric(label="Total Sales Value", value=f"₹{total_val:,.2f}"),
            ReportSummaryMetric(label="Avg Ticket Size", value=f"₹{(total_val / total if total > 0 else 0):,.2f}"),
        ]

        return ReportResponse(
            report_type="sales_report",
            title=f"Detailed Sales Report ({filter_req.start_date} to {filter_req.end_date})",
            branch_name=branch.name,
            start_date=filter_req.start_date,
            end_date=filter_req.end_date,
            generated_at=datetime.now(timezone.utc),
            columns=columns,
            column_keys=column_keys,
            rows=rows,
            summary_metrics=metrics,
            total_records=len(rows),
        )

    def _generate_customer_conversion_report(self, filter_req: ReportFilterRequest, branch: Any) -> ReportResponse:
        customers, total = self.cust_repo.list_customers(
            branch_id=branch.id,
            status=filter_req.customer_status,
            assigned_employee_id=filter_req.employee_id,
            page=1,
            page_size=1000,
        )

        columns = [
            "Customer Code",
            "Name",
            "Phone",
            "Assigned Employee",
            "Lead Source",
            "Interested Category",
            "Status",
            "First Contact",
            "Last Contact",
            "Next Follow-up",
        ]
        column_keys = [
            "customer_code",
            "full_name",
            "phone",
            "assigned_employee_name",
            "lead_source",
            "interested_category",
            "status",
            "first_contact_date",
            "last_contact_date",
            "next_followup_date",
        ]

        rows = []
        converted_count = 0
        for c in customers:
            if c.status == "Converted":
                converted_count += 1
            rows.append({
                "customer_code": c.customer_code,
                "full_name": c.full_name,
                "phone": c.phone,
                "assigned_employee_name": c.assigned_employee.full_name if c.assigned_employee else "Unassigned",
                "lead_source": c.lead_source,
                "interested_category": c.interested_category,
                "status": c.status,
                "first_contact_date": str(c.first_contact_date),
                "last_contact_date": str(c.last_contact_date),
                "next_followup_date": str(c.next_followup_date) if c.next_followup_date else "None",
            })

        metrics = [
            ReportSummaryMetric(label="Total Leads", value=str(total)),
            ReportSummaryMetric(label="Converted Leads", value=str(converted_count)),
            ReportSummaryMetric(label="Conversion Rate", value=f"{(converted_count / total * 100 if total > 0 else 0):.1f}%"),
        ]

        return ReportResponse(
            report_type="customer_conversion",
            title=f"Customer Conversion Report ({filter_req.start_date} to {filter_req.end_date})",
            branch_name=branch.name,
            start_date=filter_req.start_date,
            end_date=filter_req.end_date,
            generated_at=datetime.now(timezone.utc),
            columns=columns,
            column_keys=column_keys,
            rows=rows,
            summary_metrics=metrics,
            total_records=len(rows),
        )

    def _generate_branch_performance_report(self, filter_req: ReportFilterRequest, branch: Any) -> ReportResponse:
        performances = self.perf_repo.list_performances(
            branch_id=branch.id,
            start_date=filter_req.start_date,
            end_date=filter_req.end_date,
        )

        columns = [
            "Date",
            "Employee",
            "Approached",
            "Visited",
            "Follow-ups Done",
            "Conversions",
            "Sales Count",
            "Gold Sales (₹)",
            "Diamond Sales (₹)",
            "Silver Sales (₹)",
            "Total Sales (₹)",
            "Score",
        ]
        column_keys = [
            "date",
            "employee_name",
            "customers_approached",
            "customers_visited",
            "completed_followups",
            "customers_converted",
            "sales_count",
            "gold_sales_value",
            "diamond_sales_value",
            "silver_sales_value",
            "total_sales_value",
            "performance_score",
        ]

        rows = []
        total_sales_val = 0.0
        for p in performances:
            total_sales_val += p.total_sales_value
            rows.append({
                "date": str(p.date),
                "employee_name": p.employee.full_name if p.employee else "N/A",
                "customers_approached": p.customers_approached,
                "customers_visited": p.customers_visited,
                "completed_followups": p.completed_followups,
                "customers_converted": p.customers_converted,
                "sales_count": p.sales_count,
                "gold_sales_value": f"₹{p.gold_sales_value:,.2f}",
                "diamond_sales_value": f"₹{p.diamond_sales_value:,.2f}",
                "silver_sales_value": f"₹{p.silver_sales_value:,.2f}",
                "total_sales_value": f"₹{p.total_sales_value:,.2f}",
                "performance_score": f"{p.performance_score:.1f}/100",
            })

        metrics = [
            ReportSummaryMetric(label="Entries Logged", value=str(len(rows))),
            ReportSummaryMetric(label="Total Sales Value", value=f"₹{total_sales_val:,.2f}"),
        ]

        return ReportResponse(
            report_type="branch_performance",
            title=f"Branch Daily Performance Report ({filter_req.start_date} to {filter_req.end_date})",
            branch_name=branch.name,
            start_date=filter_req.start_date,
            end_date=filter_req.end_date,
            generated_at=datetime.now(timezone.utc),
            columns=columns,
            column_keys=column_keys,
            rows=rows,
            summary_metrics=metrics,
            total_records=len(rows),
        )

    def _generate_employee_targets_report(self, filter_req: ReportFilterRequest, branch: Any) -> ReportResponse:
        leaderboard = PerformanceScoringService.get_leaderboard(
            self.db, branch.id, filter_req.start_date, filter_req.end_date
        )

        columns = [
            "Employee Code",
            "Employee Name",
            "Department",
            "Monthly Target (₹)",
            "Period Target (₹)",
            "Actual Sales (₹)",
            "Target Achieved %",
            "Variance (₹)",
        ]
        column_keys = [
            "employee_code",
            "employee_name",
            "department",
            "monthly_target",
            "target_amount",
            "total_sales",
            "target_achievement_rate",
            "variance",
        ]

        rows = []
        for item in leaderboard:
            variance = item["total_sales"] - item["target_amount"]
            rows.append({
                "employee_code": item["employee_code"],
                "employee_name": item["employee_name"],
                "department": item["department"],
                "monthly_target": f"₹{item['target_amount'] * 1.0:,.2f}",
                "target_amount": f"₹{item['target_amount']:,.2f}",
                "total_sales": f"₹{item['total_sales']:,.2f}",
                "target_achievement_rate": f"{item['target_achievement_rate']}%",
                "variance": f"{'+' if variance >= 0 else ''}₹{variance:,.2f}",
            })

        return ReportResponse(
            report_type="employee_targets",
            title=f"Employee Targets & Achievement Report ({filter_req.start_date} to {filter_req.end_date})",
            branch_name=branch.name,
            start_date=filter_req.start_date,
            end_date=filter_req.end_date,
            generated_at=datetime.now(timezone.utc),
            columns=columns,
            column_keys=column_keys,
            rows=rows,
            summary_metrics=[],
            total_records=len(rows),
        )

    def _generate_followup_report(self, filter_req: ReportFilterRequest, branch: Any) -> ReportResponse:
        followups = self.followup_repo.list_followups(branch_id=branch.id)

        columns = [
            "Customer",
            "Phone",
            "Assigned Employee",
            "Scheduled Date",
            "Priority",
            "Status",
            "Notes",
        ]
        column_keys = [
            "customer_name",
            "customer_phone",
            "employee_name",
            "scheduled_date",
            "priority",
            "status",
            "notes",
        ]

        rows = []
        for f in followups:
            rows.append({
                "customer_name": f.customer.full_name if f.customer else "N/A",
                "customer_phone": f.customer.phone if f.customer else "N/A",
                "employee_name": f.employee.full_name if f.employee else "N/A",
                "scheduled_date": str(f.scheduled_date),
                "priority": f.priority,
                "status": f.status,
                "notes": f.notes or "None",
            })

        return ReportResponse(
            report_type="follow_up_summary",
            title=f"Customer Follow-up Summary Report ({filter_req.start_date} to {filter_req.end_date})",
            branch_name=branch.name,
            start_date=filter_req.start_date,
            end_date=filter_req.end_date,
            generated_at=datetime.now(timezone.utc),
            columns=columns,
            column_keys=column_keys,
            rows=rows,
            summary_metrics=[],
            total_records=len(rows),
        )
