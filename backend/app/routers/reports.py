from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.models.branch import Admin
from backend.app.schemas.report import ReportFilterRequest, ReportResponse
from backend.app.services.report_service import ReportService
from backend.app.dependencies.auth import get_current_admin

router = APIRouter(prefix="/api/v1/reports", tags=["Reports"])


@router.post("/generate", response_model=ReportResponse, summary="Generate detailed branch report with table rows and summaries")
def generate_report(
    filter_req: ReportFilterRequest,
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    report_service = ReportService(db)
    return report_service.generate_report(filter_req, current_admin.branch_id)
