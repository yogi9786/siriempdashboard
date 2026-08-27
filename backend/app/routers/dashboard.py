from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.models.branch import User, Branch
from backend.app.models.employee import Employee
from backend.app.schemas.dashboard import DashboardOverviewResponse
from backend.app.dependencies.auth import get_current_manager

router = APIRouter(prefix="/api/v1/dashboard", tags=["Dashboard"])


@router.get("/overview", response_model=DashboardOverviewResponse, summary="Get manager dashboard overview with branch-isolated employee counts")
def get_dashboard_overview(
    current_user: User = Depends(get_current_manager),
    db: Session = Depends(get_db),
):
    branch = db.query(Branch).filter(Branch.id == current_user.branch_id).first()
    branch_name = branch.name if branch else "Showroom"
    branch_code = branch.code if branch else "SHOWROOM"

    # Query real employee counts strictly isolated to the showroom branch
    total_employees = db.query(Employee).filter(
        Employee.branch_id == current_user.branch_id,
    ).count()

    active_employees = db.query(Employee).filter(
        Employee.branch_id == current_user.branch_id,
        Employee.status == "active",
    ).count()

    outdoor_employees = db.query(Employee).filter(
        Employee.branch_id == current_user.branch_id,
        Employee.is_outdoor_marketing_employee == True,
    ).count()

    return DashboardOverviewResponse(
        manager_name=current_user.full_name,
        branch_name=branch_name,
        branch_code=branch_code,
        total_employees=total_employees,
        active_employees=active_employees,
        outdoor_marketing_employees=outdoor_employees,
    )
