from pydantic import BaseModel


class DashboardOverviewResponse(BaseModel):
    manager_name: str
    branch_name: str
    branch_code: str
    total_employees: int = 0
    active_employees: int = 0
    outdoor_marketing_employees: int = 0
