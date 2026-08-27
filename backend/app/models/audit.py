from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey
from backend.app.core.database import Base


def utcnow():
    return datetime.now(timezone.utc)


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    branch_id = Column(Integer, ForeignKey("branches.id"), index=True, nullable=True)
    admin_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=True)
    admin_username = Column(String(100), nullable=True)
    action = Column(String(100), index=True, nullable=False)
    entity = Column(String(100), index=True, nullable=False)
    entity_id = Column(String(50), nullable=True)
    ip_address = Column(String(50), nullable=True)
    details = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=utcnow, index=True, nullable=False)

    @property
    def user_id(self):
        return self.admin_id

    @user_id.setter
    def user_id(self, val):
        self.admin_id = val

    @property
    def username(self):
        return self.admin_username

    @username.setter
    def username(self, val):
        self.admin_username = val
