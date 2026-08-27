from typing import List, Optional
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_
from backend.app.core.database import get_db
from backend.app.models.branch import User
from backend.app.models.employee import Employee
from backend.app.models.outdoor_marketing import (
    OutdoorMarketingArea,
    OutdoorMarketingCustomer,
    OutdoorMarketingScheme,
    OutdoorMarketingActivity,
)
from backend.app.schemas.outdoor_marketing import (
    OutdoorAreaCreate,
    OutdoorAreaUpdate,
    OutdoorAreaResponse,
    OutdoorCustomerCreate,
    OutdoorCustomerUpdate,
    OutdoorCustomerResponse,
    OutdoorSchemeCreate,
    OutdoorSchemeUpdate,
    OutdoorSchemeResponse,
    OutdoorActivityCreate,
    OutdoorActivityResponse,
    OutdoorMarketingOverview,
)
from backend.app.schemas.employee import EmployeeResponse
from backend.app.dependencies.auth import get_current_manager

router = APIRouter(prefix="/api/v1/outdoor-marketing", tags=["Outdoor Marketing"])


# ----------------------------------------------------
# 1. Overview Statistics
# ----------------------------------------------------
@router.get("/overview", response_model=OutdoorMarketingOverview, summary="Get outdoor marketing summary metrics for current manager's branch")
def get_outdoor_overview(
    current_user: User = Depends(get_current_manager),
    db: Session = Depends(get_db),
):
    total_outdoor_employees = db.query(Employee).filter(
        Employee.branch_id == current_user.branch_id,
        Employee.is_outdoor_marketing_employee == True,
    ).count()

    areas_covered = db.query(OutdoorMarketingArea).filter(
        OutdoorMarketingArea.branch_id == current_user.branch_id,
    ).count()

    customers_generated = (
        db.query(OutdoorMarketingCustomer)
        .join(Employee, OutdoorMarketingCustomer.marketing_employee_id == Employee.id)
        .filter(
            OutdoorMarketingCustomer.branch_id == current_user.branch_id,
        )
        .count()
    )

    customers_closed = (
        db.query(OutdoorMarketingCustomer)
        .join(Employee, OutdoorMarketingCustomer.marketing_employee_id == Employee.id)
        .filter(
            OutdoorMarketingCustomer.branch_id == current_user.branch_id,
            OutdoorMarketingCustomer.status == "Closed",
        )
        .count()
    )

    schemes_promoted = (
        db.query(OutdoorMarketingScheme)
        .join(Employee, OutdoorMarketingScheme.employee_id == Employee.id)
        .filter(
            OutdoorMarketingScheme.branch_id == current_user.branch_id,
        )
        .count()
    )

    recent_acts = (
        db.query(OutdoorMarketingActivity)
        .join(Employee, OutdoorMarketingActivity.employee_id == Employee.id)
        .filter(
            OutdoorMarketingActivity.branch_id == current_user.branch_id,
        )
        .order_by(OutdoorMarketingActivity.date.desc(), OutdoorMarketingActivity.id.desc())
        .limit(10)
        .all()
    )

    formatted_acts = []
    for a in recent_acts:
        emp_name = a.employee.full_name if a.employee else None
        formatted_acts.append(
            OutdoorActivityResponse(
                id=a.id,
                branch_id=a.branch_id,
                employee_id=a.employee_id,
                employee_name=emp_name,
                date=a.date,
                area=a.area,
                schemes_promoted=a.schemes_promoted,
                customers_generated=a.customers_generated,
                customers_attended=a.customers_attended,
                customers_closed=a.customers_closed,
                notes=a.notes,
                image_url=a.image_url,
                created_at=a.created_at,
            )
        )

    return OutdoorMarketingOverview(
        total_outdoor_employees=total_outdoor_employees,
        areas_covered=areas_covered,
        customers_generated=customers_generated,
        customers_closed=customers_closed,
        schemes_promoted=schemes_promoted,
        recent_activities=formatted_acts,
    )


# ----------------------------------------------------
# 2. Outdoor Employees
# ----------------------------------------------------
@router.get("/employees", response_model=List[EmployeeResponse], summary="List outdoor marketing employees for current manager's branch")
def get_outdoor_employees(
    current_user: User = Depends(get_current_manager),
    db: Session = Depends(get_db),
):
    return (
        db.query(Employee)
        .filter(
            Employee.branch_id == current_user.branch_id,
            Employee.is_outdoor_marketing_employee == True,
        )
        .order_by(Employee.full_name.asc())
        .all()
    )


@router.post("/employees/{employee_id}/toggle", response_model=EmployeeResponse, summary="Toggle employee outdoor marketing status")
def toggle_outdoor_employee(
    employee_id: int,
    current_user: User = Depends(get_current_manager),
    db: Session = Depends(get_db),
):
    employee = db.query(Employee).filter(
        Employee.id == employee_id,
        Employee.branch_id == current_user.branch_id,
    ).first()

    if not employee:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found in your showroom branch.")

    employee.is_outdoor_marketing_employee = not employee.is_outdoor_marketing_employee
    db.commit()
    db.refresh(employee)
    return employee


# ----------------------------------------------------
# 3. Outdoor Customers (Leads)
# ----------------------------------------------------
@router.get("/customers", response_model=List[OutdoorCustomerResponse], summary="List outdoor customer leads")
def list_outdoor_customers(
    employee_id: Optional[int] = Query(None, description="Filter by marketing employee"),
    status: Optional[str] = Query(None, description="Filter by status: Lead, Contacted, Interested, Closed, Lost"),
    search: Optional[str] = Query(None, description="Search customer name, area, or phone"),
    current_user: User = Depends(get_current_manager),
    db: Session = Depends(get_db),
):
    query = (
        db.query(OutdoorMarketingCustomer)
        .join(Employee, OutdoorMarketingCustomer.marketing_employee_id == Employee.id)
        .filter(
            OutdoorMarketingCustomer.branch_id == current_user.branch_id,
        )
    )

    if employee_id:
        query = query.filter(OutdoorMarketingCustomer.marketing_employee_id == employee_id)

    if status:
        query = query.filter(OutdoorMarketingCustomer.status == status)

    if search:
        term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                OutdoorMarketingCustomer.customer_name.ilike(term),
                OutdoorMarketingCustomer.phone.ilike(term),
                OutdoorMarketingCustomer.area_name.ilike(term),
                OutdoorMarketingCustomer.scheme_name.ilike(term),
            )
        )

    records = query.order_by(OutdoorMarketingCustomer.date.desc(), OutdoorMarketingCustomer.id.desc()).all()

    result = []
    for r in records:
        emp_name = r.marketing_employee.full_name if r.marketing_employee else None
        res_item = OutdoorCustomerResponse(
            id=r.id,
            branch_id=r.branch_id,
            marketing_employee_id=r.marketing_employee_id,
            marketing_employee_name=emp_name,
            customer_name=r.customer_name,
            phone=r.phone,
            area_name=r.area_name,
            scheme_name=r.scheme_name,
            date=r.date,
            status=r.status,
            notes=r.notes,
            created_at=r.created_at,
            updated_at=r.updated_at,
        )
        result.append(res_item)

    return result


@router.post("/customers", response_model=OutdoorCustomerResponse, status_code=status.HTTP_201_CREATED, summary="Create an outdoor marketing customer lead")
def create_outdoor_customer(
    customer_data: OutdoorCustomerCreate,
    current_user: User = Depends(get_current_manager),
    db: Session = Depends(get_db),
):
    employee = db.query(Employee).filter(
        Employee.id == customer_data.marketing_employee_id,
        Employee.branch_id == current_user.branch_id,
    ).first()

    if not employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Marketing employee not found in your showroom branch.",
        )

    record = OutdoorMarketingCustomer(
        branch_id=current_user.branch_id,
        marketing_employee_id=employee.id,
        customer_name=customer_data.customer_name.strip(),
        phone=customer_data.phone.strip(),
        area_name=customer_data.area_name.strip(),
        scheme_name=customer_data.scheme_name.strip() if customer_data.scheme_name else None,
        date=customer_data.date or date.today(),
        status=customer_data.status or "Lead",
        notes=customer_data.notes,
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    return OutdoorCustomerResponse(
        id=record.id,
        branch_id=record.branch_id,
        marketing_employee_id=record.marketing_employee_id,
        marketing_employee_name=employee.full_name,
        customer_name=record.customer_name,
        phone=record.phone,
        area_name=record.area_name,
        scheme_name=record.scheme_name,
        date=record.date,
        status=record.status,
        notes=record.notes,
        created_at=record.created_at,
        updated_at=record.updated_at,
    )


@router.put("/customers/{customer_id}", response_model=OutdoorCustomerResponse, summary="Update outdoor customer lead")
def update_outdoor_customer(
    customer_id: int,
    update_data: OutdoorCustomerUpdate,
    current_user: User = Depends(get_current_manager),
    db: Session = Depends(get_db),
):
    record = (
        db.query(OutdoorMarketingCustomer)
        .join(Employee, OutdoorMarketingCustomer.marketing_employee_id == Employee.id)
        .filter(
            OutdoorMarketingCustomer.id == customer_id,
            OutdoorMarketingCustomer.branch_id == current_user.branch_id,
        )
        .first()
    )

    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer lead not found.")

    if update_data.customer_name is not None:
        record.customer_name = update_data.customer_name.strip()
    if update_data.phone is not None:
        record.phone = update_data.phone.strip()
    if update_data.area_name is not None:
        record.area_name = update_data.area_name.strip()
    if update_data.scheme_name is not None:
        record.scheme_name = update_data.scheme_name.strip() if update_data.scheme_name else None
    if update_data.date is not None:
        record.date = update_data.date
    if update_data.status is not None:
        record.status = update_data.status
    if update_data.notes is not None:
        record.notes = update_data.notes

    db.commit()
    db.refresh(record)

    emp_name = record.marketing_employee.full_name if record.marketing_employee else None
    return OutdoorCustomerResponse(
        id=record.id,
        branch_id=record.branch_id,
        marketing_employee_id=record.marketing_employee_id,
        marketing_employee_name=emp_name,
        customer_name=record.customer_name,
        phone=record.phone,
        area_name=record.area_name,
        scheme_name=record.scheme_name,
        date=record.date,
        status=record.status,
        notes=record.notes,
        created_at=record.created_at,
        updated_at=record.updated_at,
    )


@router.delete("/customers/{customer_id}", status_code=status.HTTP_200_OK, summary="Delete outdoor customer lead")
def delete_outdoor_customer(
    customer_id: int,
    current_user: User = Depends(get_current_manager),
    db: Session = Depends(get_db),
):
    record = (
        db.query(OutdoorMarketingCustomer)
        .join(Employee, OutdoorMarketingCustomer.marketing_employee_id == Employee.id)
        .filter(
            OutdoorMarketingCustomer.id == customer_id,
            OutdoorMarketingCustomer.branch_id == current_user.branch_id,
        )
        .first()
    )

    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer lead not found.")

    db.delete(record)
    db.commit()
    return {"message": "Customer lead deleted successfully."}


# ----------------------------------------------------
# 4. Promoted Schemes
# ----------------------------------------------------
@router.get("/schemes", response_model=List[OutdoorSchemeResponse], summary="List outdoor schemes promoted")
def list_outdoor_schemes(
    employee_id: Optional[int] = Query(None, description="Filter by employee"),
    area: Optional[str] = Query(None, description="Filter by area"),
    search: Optional[str] = Query(None, description="Search scheme name or notes"),
    current_user: User = Depends(get_current_manager),
    db: Session = Depends(get_db),
):
    query = (
        db.query(OutdoorMarketingScheme)
        .join(Employee, OutdoorMarketingScheme.employee_id == Employee.id)
        .filter(
            OutdoorMarketingScheme.branch_id == current_user.branch_id,
        )
    )

    if employee_id:
        query = query.filter(OutdoorMarketingScheme.employee_id == employee_id)

    if area:
        query = query.filter(OutdoorMarketingScheme.area == area)

    if search:
        term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                OutdoorMarketingScheme.scheme_name.ilike(term),
                OutdoorMarketingScheme.description.ilike(term),
                OutdoorMarketingScheme.area.ilike(term),
                OutdoorMarketingScheme.notes.ilike(term),
            )
        )

    records = query.order_by(OutdoorMarketingScheme.date.desc(), OutdoorMarketingScheme.id.desc()).all()

    result = []
    for r in records:
        emp_name = r.employee.full_name if r.employee else None
        res_item = OutdoorSchemeResponse(
            id=r.id,
            branch_id=r.branch_id,
            employee_id=r.employee_id,
            employee_name=emp_name,
            date=r.date,
            scheme_name=r.scheme_name,
            description=r.description,
            area=r.area,
            notes=r.notes,
            created_at=r.created_at,
            updated_at=r.updated_at,
        )
        result.append(res_item)

    return result


@router.post("/schemes", response_model=OutdoorSchemeResponse, status_code=status.HTTP_201_CREATED, summary="Create an outdoor scheme record")
def create_outdoor_scheme(
    scheme_data: OutdoorSchemeCreate,
    current_user: User = Depends(get_current_manager),
    db: Session = Depends(get_db),
):
    employee = db.query(Employee).filter(
        Employee.id == scheme_data.employee_id,
        Employee.branch_id == current_user.branch_id,
    ).first()

    if not employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee not found in your showroom branch.",
        )

    record = OutdoorMarketingScheme(
        branch_id=current_user.branch_id,
        employee_id=employee.id,
        date=scheme_data.date or date.today(),
        scheme_name=scheme_data.scheme_name.strip(),
        description=scheme_data.description.strip() if scheme_data.description else None,
        area=scheme_data.area.strip(),
        notes=scheme_data.notes,
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    return OutdoorSchemeResponse(
        id=record.id,
        branch_id=record.branch_id,
        employee_id=record.employee_id,
        employee_name=employee.full_name,
        date=record.date,
        scheme_name=record.scheme_name,
        description=record.description,
        area=record.area,
        notes=record.notes,
        created_at=record.created_at,
        updated_at=record.updated_at,
    )


@router.put("/schemes/{scheme_id}", response_model=OutdoorSchemeResponse, summary="Update outdoor scheme record")
def update_outdoor_scheme(
    scheme_id: int,
    update_data: OutdoorSchemeUpdate,
    current_user: User = Depends(get_current_manager),
    db: Session = Depends(get_db),
):
    record = (
        db.query(OutdoorMarketingScheme)
        .join(Employee, OutdoorMarketingScheme.employee_id == Employee.id)
        .filter(
            OutdoorMarketingScheme.id == scheme_id,
            OutdoorMarketingScheme.branch_id == current_user.branch_id,
        )
        .first()
    )

    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Scheme record not found.")

    if update_data.date is not None:
        record.date = update_data.date
    if update_data.scheme_name is not None:
        record.scheme_name = update_data.scheme_name.strip()
    if update_data.description is not None:
        record.description = update_data.description.strip() if update_data.description else None
    if update_data.area is not None:
        record.area = update_data.area.strip()
    if update_data.notes is not None:
        record.notes = update_data.notes

    db.commit()
    db.refresh(record)

    emp_name = record.employee.full_name if record.employee else None
    return OutdoorSchemeResponse(
        id=record.id,
        branch_id=record.branch_id,
        employee_id=record.employee_id,
        employee_name=emp_name,
        date=record.date,
        scheme_name=record.scheme_name,
        description=record.description,
        area=record.area,
        notes=record.notes,
        created_at=record.created_at,
        updated_at=record.updated_at,
    )


@router.delete("/schemes/{scheme_id}", status_code=status.HTTP_200_OK, summary="Delete outdoor scheme record")
def delete_outdoor_scheme(
    scheme_id: int,
    current_user: User = Depends(get_current_manager),
    db: Session = Depends(get_db),
):
    record = (
        db.query(OutdoorMarketingScheme)
        .join(Employee, OutdoorMarketingScheme.employee_id == Employee.id)
        .filter(
            OutdoorMarketingScheme.id == scheme_id,
            OutdoorMarketingScheme.branch_id == current_user.branch_id,
        )
        .first()
    )

    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Scheme record not found.")

    db.delete(record)
    db.commit()
    return {"message": "Scheme record deleted successfully."}


# ----------------------------------------------------
# 5. Outdoor Activities
# ----------------------------------------------------
@router.get("/activities", response_model=List[OutdoorActivityResponse], summary="List outdoor marketing activities")
def list_outdoor_activities(
    employee_id: Optional[int] = Query(None, description="Filter by employee"),
    area: Optional[str] = Query(None, description="Filter by area"),
    current_user: User = Depends(get_current_manager),
    db: Session = Depends(get_db),
):
    query = (
        db.query(OutdoorMarketingActivity)
        .join(Employee, OutdoorMarketingActivity.employee_id == Employee.id)
        .filter(
            OutdoorMarketingActivity.branch_id == current_user.branch_id,
        )
    )

    if employee_id:
        query = query.filter(OutdoorMarketingActivity.employee_id == employee_id)

    if area:
        query = query.filter(OutdoorMarketingActivity.area == area)

    records = query.order_by(OutdoorMarketingActivity.date.desc(), OutdoorMarketingActivity.id.desc()).all()

    result = []
    for r in records:
        emp_name = r.employee.full_name if r.employee else None
        res_item = OutdoorActivityResponse(
            id=r.id,
            branch_id=r.branch_id,
            employee_id=r.employee_id,
            employee_name=emp_name,
            date=r.date,
            area=r.area,
            schemes_promoted=r.schemes_promoted,
            customers_generated=r.customers_generated,
            customers_attended=r.customers_attended,
            customers_closed=r.customers_closed,
            notes=r.notes,
            image_url=r.image_url,
            created_at=r.created_at,
        )
        result.append(res_item)

    return result


@router.post("/activities", response_model=OutdoorActivityResponse, status_code=status.HTTP_201_CREATED, summary="Create outdoor activity log")
def create_outdoor_activity(
    act_data: OutdoorActivityCreate,
    current_user: User = Depends(get_current_manager),
    db: Session = Depends(get_db),
):
    employee = db.query(Employee).filter(
        Employee.id == act_data.employee_id,
        Employee.branch_id == current_user.branch_id,
    ).first()

    if not employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee not found in your showroom branch.",
        )

    record = OutdoorMarketingActivity(
        branch_id=current_user.branch_id,
        employee_id=employee.id,
        date=act_data.date or date.today(),
        area=act_data.area.strip(),
        schemes_promoted=act_data.schemes_promoted,
        customers_generated=act_data.customers_generated,
        customers_attended=act_data.customers_attended,
        customers_closed=act_data.customers_closed,
        notes=act_data.notes,
        image_url=act_data.image_url,
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    return OutdoorActivityResponse(
        id=record.id,
        branch_id=record.branch_id,
        employee_id=record.employee_id,
        employee_name=employee.full_name,
        date=record.date,
        area=record.area,
        schemes_promoted=record.schemes_promoted,
        customers_generated=record.customers_generated,
        customers_attended=record.customers_attended,
        customers_closed=record.customers_closed,
        notes=record.notes,
        image_url=record.image_url,
        created_at=record.created_at,
    )


# ----------------------------------------------------
# 6. Outdoor Areas
# ----------------------------------------------------
@router.get("/areas", response_model=List[OutdoorAreaResponse], summary="List outdoor marketing areas")
def list_outdoor_areas(
    status: Optional[str] = Query(None, description="Filter by status: Planned, Active, Completed"),
    search: Optional[str] = Query(None, description="Search area name or location"),
    current_user: User = Depends(get_current_manager),
    db: Session = Depends(get_db),
):
    query = db.query(OutdoorMarketingArea).filter(OutdoorMarketingArea.branch_id == current_user.branch_id)

    if status:
        query = query.filter(OutdoorMarketingArea.status == status)

    if search:
        term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                OutdoorMarketingArea.area_name.ilike(term),
                OutdoorMarketingArea.location.ilike(term),
                OutdoorMarketingArea.notes.ilike(term),
            )
        )

    records = query.order_by(OutdoorMarketingArea.activity_date.desc(), OutdoorMarketingArea.id.desc()).all()

    result = []
    for r in records:
        emp_name = r.assigned_employee.full_name if r.assigned_employee else None
        res_item = OutdoorAreaResponse(
            id=r.id,
            branch_id=r.branch_id,
            area_name=r.area_name,
            location=r.location,
            assigned_employee_id=r.assigned_employee_id,
            assigned_employee_name=emp_name,
            activity_date=r.activity_date,
            status=r.status,
            notes=r.notes,
            created_at=r.created_at,
            updated_at=r.updated_at,
        )
        result.append(res_item)

    return result


@router.post("/areas", response_model=OutdoorAreaResponse, status_code=status.HTTP_201_CREATED, summary="Create an outdoor marketing area")
def create_outdoor_area(
    area_data: OutdoorAreaCreate,
    current_user: User = Depends(get_current_manager),
    db: Session = Depends(get_db),
):
    emp_name = None
    if area_data.assigned_employee_id:
        employee = db.query(Employee).filter(
            Employee.id == area_data.assigned_employee_id,
            Employee.branch_id == current_user.branch_id,
        ).first()
        if not employee:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Assigned employee not found in your showroom branch.",
            )
        emp_name = employee.full_name

    record = OutdoorMarketingArea(
        branch_id=current_user.branch_id,
        area_name=area_data.area_name.strip(),
        location=area_data.location.strip(),
        assigned_employee_id=area_data.assigned_employee_id,
        activity_date=area_data.activity_date or date.today(),
        status=area_data.status or "Planned",
        notes=area_data.notes,
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    return OutdoorAreaResponse(
        id=record.id,
        branch_id=record.branch_id,
        area_name=record.area_name,
        location=record.location,
        assigned_employee_id=record.assigned_employee_id,
        assigned_employee_name=emp_name,
        activity_date=record.activity_date,
        status=record.status,
        notes=record.notes,
        created_at=record.created_at,
        updated_at=record.updated_at,
    )


@router.put("/areas/{area_id}", response_model=OutdoorAreaResponse, summary="Update outdoor area")
def update_outdoor_area(
    area_id: int,
    update_data: OutdoorAreaUpdate,
    current_user: User = Depends(get_current_manager),
    db: Session = Depends(get_db),
):
    record = db.query(OutdoorMarketingArea).filter(
        OutdoorMarketingArea.id == area_id,
        OutdoorMarketingArea.branch_id == current_user.branch_id,
    ).first()

    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Area not found.")

    if update_data.area_name is not None:
        record.area_name = update_data.area_name.strip()
    if update_data.location is not None:
        record.location = update_data.location.strip()
    if update_data.assigned_employee_id is not None:
        if update_data.assigned_employee_id > 0:
            employee = db.query(Employee).filter(
                Employee.id == update_data.assigned_employee_id,
                Employee.branch_id == current_user.branch_id,
            ).first()
            if not employee:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found in your showroom branch.")
            record.assigned_employee_id = employee.id
        else:
            record.assigned_employee_id = None
    if update_data.activity_date is not None:
        record.activity_date = update_data.activity_date
    if update_data.status is not None:
        record.status = update_data.status
    if update_data.notes is not None:
        record.notes = update_data.notes

    db.commit()
    db.refresh(record)

    emp_name = record.assigned_employee.full_name if record.assigned_employee else None
    return OutdoorAreaResponse(
        id=record.id,
        branch_id=record.branch_id,
        area_name=record.area_name,
        location=record.location,
        assigned_employee_id=record.assigned_employee_id,
        assigned_employee_name=emp_name,
        activity_date=record.activity_date,
        status=record.status,
        notes=record.notes,
        created_at=record.created_at,
        updated_at=record.updated_at,
    )


@router.delete("/areas/{area_id}", status_code=status.HTTP_200_OK, summary="Delete outdoor area")
def delete_outdoor_area(
    area_id: int,
    current_user: User = Depends(get_current_manager),
    db: Session = Depends(get_db),
):
    record = db.query(OutdoorMarketingArea).filter(
        OutdoorMarketingArea.id == area_id,
        OutdoorMarketingArea.branch_id == current_user.branch_id,
    ).first()

    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Area not found.")

    db.delete(record)
    db.commit()
    return {"message": "Area deleted successfully."}
