from typing import Optional, List, Tuple
from sqlalchemy.orm import Session
from backend.app.models.audit import AuditLog
from backend.app.repositories.base import BaseRepository


class AuditRepository(BaseRepository[AuditLog]):
    def __init__(self, db: Session):
        super().__init__(AuditLog, db)

    def log(
        self,
        action: str,
        entity: str,
        branch_id: Optional[int] = None,
        admin_id: Optional[int] = None,
        admin_username: Optional[str] = None,
        entity_id: Optional[str] = None,
        ip_address: Optional[str] = None,
        details: Optional[str] = None,
    ) -> AuditLog:
        audit_entry = AuditLog(
            branch_id=branch_id,
            admin_id=admin_id,
            admin_username=admin_username,
            action=action,
            entity=entity,
            entity_id=str(entity_id) if entity_id else None,
            ip_address=ip_address,
            details=details,
        )
        self.db.add(audit_entry)
        self.db.commit()
        self.db.refresh(audit_entry)
        return audit_entry

    def list_logs(
        self,
        branch_id: int,
        search: Optional[str] = None,
        entity: Optional[str] = None,
        action: Optional[str] = None,
        page: int = 1,
        page_size: int = 25,
    ) -> Tuple[List[AuditLog], int]:
        query = self.db.query(AuditLog).filter(AuditLog.branch_id == branch_id)

        if search:
            search_filter = f"%{search}%"
            query = query.filter(
                AuditLog.admin_username.ilike(search_filter)
                | AuditLog.action.ilike(search_filter)
                | AuditLog.entity.ilike(search_filter)
                | AuditLog.details.ilike(search_filter)
            )

        if entity and entity != "All":
            query = query.filter(AuditLog.entity == entity)

        if action and action != "All":
            query = query.filter(AuditLog.action == action)

        total = query.count()
        items = (
            query.order_by(AuditLog.timestamp.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
            .all()
        )
        return items, total
