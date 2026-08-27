from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.models.branch import Admin
from backend.app.schemas.audit import AuditLogListResponse, AuditLogResponse
from backend.app.repositories.audit_repo import AuditRepository
from backend.app.dependencies.auth import get_current_admin

router = APIRouter(prefix="/api/v1/audit", tags=["Audit Logs"])


@router.get("", response_model=AuditLogListResponse, summary="List branch administrative audit log events")
def list_audit_logs(
    search: Optional[str] = Query(None),
    entity: Optional[str] = Query(None),
    action: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    audit_repo = AuditRepository(db)
    items, total = audit_repo.list_logs(
        branch_id=current_admin.branch_id,
        search=search,
        entity=entity,
        action=action,
        page=page,
        page_size=page_size,
    )
    total_pages = (total + page_size - 1) // page_size if total > 0 else 1

    return AuditLogListResponse(
        items=[AuditLogResponse.model_validate(i) for i in items],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )
