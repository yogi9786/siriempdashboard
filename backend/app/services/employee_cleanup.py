"""Shared safe employee deletion helper to satisfy all foreign-key constraints."""

from sqlalchemy.orm import Session
from backend.app.models.employee import Employee
from backend.app.models.activity import SchemePaymentReminder
from backend.app.models.attendance import EmployeeAttendance
from backend.app.models.feedback import CustomerFeedback
from backend.app.models.hr import EmployeePaySlip, EmployeeLeaveRequest
from backend.app.models.outdoor_marketing import OutdoorMarketingArea, OutdoorMarketingCustomer


def delete_employee_with_dependencies(db: Session, emp: Employee) -> None:
    """Safely detach nullable references and delete dependent records before removing an Employee."""
    emp_id = emp.id

    # Detach nullable references so shared records are preserved
    db.query(OutdoorMarketingArea).filter(OutdoorMarketingArea.assigned_employee_id == emp_id).update(
        {OutdoorMarketingArea.assigned_employee_id: None}, synchronize_session=False
    )
    db.query(SchemePaymentReminder).filter(SchemePaymentReminder.employee_id == emp_id).update(
        {SchemePaymentReminder.employee_id: None}, synchronize_session=False
    )

    # Delete dependent records lacking delete-orphan cascades on Employee
    for model_cls, fk_col in (
        (OutdoorMarketingCustomer, OutdoorMarketingCustomer.marketing_employee_id),
        (EmployeeAttendance, EmployeeAttendance.employee_id),
        (CustomerFeedback, CustomerFeedback.employee_id),
        (EmployeePaySlip, EmployeePaySlip.employee_id),
        (EmployeeLeaveRequest, EmployeeLeaveRequest.employee_id),
    ):
        db.query(model_cls).filter(fk_col == emp_id).delete(synchronize_session=False)

    db.flush()
    db.delete(emp)
    db.commit()
