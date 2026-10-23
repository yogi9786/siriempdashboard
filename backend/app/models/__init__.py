from backend.app.core.database import Base
from backend.app.models.branch import Branch, User, Admin
from backend.app.models.employee import Employee
from backend.app.models.activity import (
    CustomerActivity,
    Customer,
    SchemeRecord,
    EmployeeFormMedia,
    GoogleReview,
    AttireRecord,
    EmployeeCallLog,
)
from backend.app.models.outdoor_marketing import (
    OutdoorMarketingArea,
    OutdoorMarketingCustomer,
    OutdoorMarketingScheme,
    OutdoorMarketingActivity,
)
from backend.app.models.audit import AuditLog
from backend.app.models.attendance import EmployeeAttendance
from backend.app.models.feedback import CustomerFeedback

__all__ = [
    "Base",
    "Branch",
    "User",
    "Admin",
    "Employee",
    "CustomerActivity",
    "Customer",
    "SchemeRecord",
    "EmployeeFormMedia",
    "GoogleReview",
    "AttireRecord",
    "EmployeeCallLog",
    "OutdoorMarketingArea",
    "OutdoorMarketingCustomer",
    "OutdoorMarketingScheme",
    "OutdoorMarketingActivity",
    "AuditLog",
    "EmployeeAttendance",
    "CustomerFeedback",
]

