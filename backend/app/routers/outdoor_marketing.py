import os
import csv
import io
import json
import uuid
from typing import List, Optional
from datetime import date, datetime
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, status, Response
from sqlalchemy.orm import Session
from sqlalchemy import or_, func
from backend.app.core.config import settings
from backend.app.core.database import get_db
from backend.app.models.branch import User
from backend.app.models.employee import Employee
from backend.app.models.outdoor_marketing import (
    OutdoorMarketingArea,
    OutdoorMarketingDuty,
    OutdoorMarketingCustomer,
    OutdoorMarketingScheme,
    OutdoorMarketingActivity,
)
from backend.app.schemas.outdoor_marketing import (
    OutdoorAreaCreate,
    OutdoorAreaUpdate,
    OutdoorAreaResponse,
    OutdoorCustomerDetail,
    OutdoorCustomerCreate,
    OutdoorCustomerUpdate,
    OutdoorCustomerResponse,
    OutdoorDutyAssignRequest,
    OutdoorDutyUpdate,
    OutdoorDutyResponse,
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

ALLOWED_PHOTO_MIME_TYPES = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/jpg": ".jpg",
}


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
        Employee.status == "active",
    ).count()

    areas_covered = db.query(OutdoorMarketingArea).filter(
        OutdoorMarketingArea.branch_id == current_user.branch_id,
    ).count()

    customers_generated = (
        db.query(OutdoorMarketingCustomer)
        .filter(
            OutdoorMarketingCustomer.branch_id == current_user.branch_id,
        )
        .count()
    )

    customers_closed = (
        db.query(OutdoorMarketingCustomer)
        .filter(
            OutdoorMarketingCustomer.branch_id == current_user.branch_id,
            OutdoorMarketingCustomer.status == "Closed",
        )
        .count()
    )

    schemes_promoted = (
        db.query(OutdoorMarketingScheme)
        .filter(
            OutdoorMarketingScheme.branch_id == current_user.branch_id,
        )
        .count()
    )

    # Activity sums
    all_acts = db.query(OutdoorMarketingActivity).filter(
        OutdoorMarketingActivity.branch_id == current_user.branch_id,
    ).all()

    total_customers_attended = sum(a.customers_attended for a in all_acts)
    total_converted_customers = sum((a.converted_customers or a.customers_closed or 0) for a in all_acts)
    total_google_ratings = sum(a.google_ratings_count for a in all_acts)
    total_activities_count = len(all_acts)

    recent_acts = (
        db.query(OutdoorMarketingActivity)
        .outerjoin(Employee, OutdoorMarketingActivity.employee_id == Employee.id)
        .filter(
            OutdoorMarketingActivity.branch_id == current_user.branch_id,
        )
        .order_by(OutdoorMarketingActivity.date.desc(), OutdoorMarketingActivity.id.desc())
        .limit(25)
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
                participating_employee_ids=a.participating_employee_ids,
                employee_names=a.employee_names,
                date=a.date,
                area=a.area,
                scheme_name=a.scheme_name,
                schemes_promoted=a.schemes_promoted,
                customers_generated=a.customers_generated,
                customers_attended=a.customers_attended,
                customers_closed=a.customers_closed,
                converted_customers=a.converted_customers,
                google_ratings_count=a.google_ratings_count,
                notes=a.notes,
                image_url=a.image_url,
                photo_url=a.photo_url or a.image_url,
                created_at=a.created_at,
            )
        )

    return OutdoorMarketingOverview(
        total_outdoor_employees=total_outdoor_employees,
        areas_covered=areas_covered,
        customers_generated=customers_generated,
        customers_closed=customers_closed,
        schemes_promoted=schemes_promoted,
        total_customers_attended=total_customers_attended,
        total_converted_customers=total_converted_customers,
        total_google_ratings=total_google_ratings,
        total_activities_count=total_activities_count,
        recent_activities=formatted_acts,
    )


# ----------------------------------------------------
# 1.1 Photo Upload for Outdoor Activities
# ----------------------------------------------------
@router.post("/activities/upload-photo", status_code=status.HTTP_201_CREATED, summary="Upload outdoor activity field photo")
async def upload_activity_photo(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_manager),
):
    content_type = file.content_type.lower() if file.content_type else ""
    if content_type not in ALLOWED_PHOTO_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid image format. Please upload a JPEG, PNG, or WebP image."
        )

    os.makedirs(settings.MEDIA_DIR, exist_ok=True)
    contents = await file.read()
    file_size = len(contents)
    max_bytes = int(4.0 * 1024 * 1024)  # 4.0 MB
    if file_size > max_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="Image size exceeds 4 MB limit."
        )
    if file_size == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty."
        )

    ext = ALLOWED_PHOTO_MIME_TYPES.get(content_type, ".jpg")
    filename = f"outdoor_{uuid.uuid4().hex[:16]}{ext}"
    file_path = os.path.join(settings.MEDIA_DIR, filename)
    with open(file_path, "wb") as f:
        f.write(contents)

    photo_url = f"/media/{filename}"
    return {"photo_url": photo_url, "filename": filename, "file_size": file_size}


# ----------------------------------------------------
# 1.2 Outdoor Duties (Daily Rotation & Entry per Employee)
# ----------------------------------------------------
def format_duty_response(d: OutdoorMarketingDuty) -> OutdoorDutyResponse:
    emp = d.employee
    cust_responses = []
    for c in d.customers:
        cust_responses.append(
            OutdoorCustomerResponse(
                id=c.id,
                branch_id=c.branch_id,
                marketing_employee_id=c.marketing_employee_id,
                marketing_employee_name=emp.full_name if emp else None,
                duty_id=c.duty_id,
                customer_name=c.customer_name,
                phone=c.phone,
                dob=c.dob,
                anniversary_date=c.anniversary_date,
                area_name=c.area_name,
                scheme_name=c.scheme_name,
                date=c.date,
                is_converted=c.is_converted,
                has_google_review=c.has_google_review or False,
                google_review_rating=c.google_review_rating or 5,
                google_review_text=c.google_review_text,
                status=c.status,
                notes=c.notes,
                created_at=c.created_at,
                updated_at=c.updated_at,
            )
        )

    # Parse photo_urls
    p_urls = []
    if d.photo_urls:
        try:
            parsed = json.loads(d.photo_urls)
            if isinstance(parsed, list):
                p_urls = [str(x) for x in parsed if x]
        except Exception:
            p_urls = [p.strip() for p in d.photo_urls.split(",") if p.strip()]

    if not p_urls and d.photo_url:
        p_urls = [d.photo_url]

    return OutdoorDutyResponse(
        id=d.id,
        branch_id=d.branch_id,
        employee_id=d.employee_id,
        employee_name=emp.full_name if emp else None,
        employee_code=emp.employee_code if emp else None,
        designation=emp.designation if emp else None,
        department=emp.department if emp else None,
        date=d.date,
        area=d.area,
        scheme_name=d.scheme_name,
        customers_attended_count=d.customers_attended_count,
        converted_customers_count=d.converted_customers_count,
        google_ratings_count=d.google_ratings_count,
        photo_url=d.photo_url or (p_urls[0] if p_urls else None),
        photo_urls=p_urls,
        notes=d.notes,
        status=d.status,
        customers=cust_responses,
        created_at=d.created_at,
        updated_at=d.updated_at,
    )



@router.post("/duties/assign", response_model=List[OutdoorDutyResponse], status_code=status.HTTP_201_CREATED, summary="Assign employees to outdoor marketing for a specific date")
def assign_outdoor_duties(
    payload: OutdoorDutyAssignRequest,
    current_user: User = Depends(get_current_manager),
    db: Session = Depends(get_db),
):
    for emp_id in payload.employee_ids:
        emp = db.query(Employee).filter(
            Employee.id == emp_id,
            Employee.branch_id == current_user.branch_id,
        ).first()
        if not emp:
            continue

        existing_duty = db.query(OutdoorMarketingDuty).filter(
            OutdoorMarketingDuty.branch_id == current_user.branch_id,
            OutdoorMarketingDuty.employee_id == emp.id,
            OutdoorMarketingDuty.date == payload.date,
        ).first()

        if not existing_duty:
            new_duty = OutdoorMarketingDuty(
                branch_id=current_user.branch_id,
                employee_id=emp.id,
                date=payload.date,
                status="Assigned",
            )
            db.add(new_duty)

    try:
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to assign duties: {str(e)}"
        )

    duties = (
        db.query(OutdoorMarketingDuty)
        .join(Employee, OutdoorMarketingDuty.employee_id == Employee.id)
        .filter(
            OutdoorMarketingDuty.branch_id == current_user.branch_id,
            OutdoorMarketingDuty.date == payload.date,
        )
        .order_by(Employee.full_name.asc())
        .all()
    )
    return [format_duty_response(d) for d in duties]


@router.get("/duties", response_model=List[OutdoorDutyResponse], summary="List assigned outdoor marketing duties for a specific date")
def get_outdoor_duties(
    date_filter: Optional[date] = Query(None, description="Date to fetch duties for (defaults to today)"),
    current_user: User = Depends(get_current_manager),
    db: Session = Depends(get_db),
):
    target_date = date_filter or date.today()
    duties = (
        db.query(OutdoorMarketingDuty)
        .join(Employee, OutdoorMarketingDuty.employee_id == Employee.id)
        .filter(
            OutdoorMarketingDuty.branch_id == current_user.branch_id,
            OutdoorMarketingDuty.date == target_date,
        )
        .order_by(Employee.full_name.asc())
        .all()
    )
    return [format_duty_response(d) for d in duties]


@router.put("/duties/{duty_id}", response_model=OutdoorDutyResponse, summary="Save/Update employee outdoor duty details, customers attended & converted")
def update_outdoor_duty(
    duty_id: int,
    payload: OutdoorDutyUpdate,
    current_user: User = Depends(get_current_manager),
    db: Session = Depends(get_db),
):
    duty = db.query(OutdoorMarketingDuty).filter(
        OutdoorMarketingDuty.id == duty_id,
        OutdoorMarketingDuty.branch_id == current_user.branch_id,
    ).first()

    if not duty:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Outdoor duty record not found.")

    if payload.area is not None:
        duty.area = payload.area.strip()
    if payload.scheme_name is not None:
        duty.scheme_name = payload.scheme_name.strip()
    if payload.customers_attended_count is not None:
        duty.customers_attended_count = payload.customers_attended_count
    if payload.converted_customers_count is not None:
        duty.converted_customers_count = payload.converted_customers_count
    if payload.google_ratings_count is not None:
        duty.google_ratings_count = payload.google_ratings_count
    if payload.photo_url is not None:
        duty.photo_url = payload.photo_url
    if payload.photo_urls is not None:
        duty.photo_urls = json.dumps(payload.photo_urls)
        if payload.photo_urls and not duty.photo_url:
            duty.photo_url = payload.photo_urls[0]
    if payload.notes is not None:
        duty.notes = payload.notes.strip() if payload.notes else None
    if payload.status is not None:
        duty.status = payload.status

    # Save customer entries if provided
    if payload.customers is not None:
        db.query(OutdoorMarketingCustomer).filter(
            OutdoorMarketingCustomer.duty_id == duty.id,
            OutdoorMarketingCustomer.branch_id == current_user.branch_id,
        ).delete(synchronize_session=False)

        for c in payload.customers:
            if not c.customer_name or not c.customer_name.strip():
                continue
            new_cust = OutdoorMarketingCustomer(
                branch_id=current_user.branch_id,
                marketing_employee_id=duty.employee_id,
                duty_id=duty.id,
                customer_name=c.customer_name.strip(),
                phone=c.phone.strip() if c.phone else None,
                dob=c.dob,
                anniversary_date=c.anniversary_date,
                area_name=c.area_name or duty.area,
                scheme_name=c.scheme_name or duty.scheme_name,
                date=duty.date,
                is_converted=c.is_converted,
                has_google_review=c.has_google_review,
                google_review_rating=c.google_review_rating or 5,
                google_review_text=c.google_review_text,
                status="Converted" if c.is_converted else "Contacted",
                notes=c.notes,
            )
            db.add(new_cust)


    try:
        db.commit()
        db.refresh(duty)
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update outdoor duty: {str(e)}"
        )

    return format_duty_response(duty)


@router.delete("/duties/{duty_id}", status_code=status.HTTP_200_OK, summary="Remove employee outdoor duty assignment")
def delete_outdoor_duty(
    duty_id: int,
    current_user: User = Depends(get_current_manager),
    db: Session = Depends(get_db),
):
    duty = db.query(OutdoorMarketingDuty).filter(
        OutdoorMarketingDuty.id == duty_id,
        OutdoorMarketingDuty.branch_id == current_user.branch_id,
    ).first()

    if not duty:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Outdoor duty record not found.")

    try:
        db.delete(duty)
        db.commit()
        return {"message": "Outdoor duty assignment removed."}
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to remove duty assignment: {str(e)}"
        )

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
    try:
        db.commit()
        db.refresh(employee)
        return employee
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to toggle outdoor status: {str(e)}"
        )


# ----------------------------------------------------
# 3. Outdoor Customers (Leads)
# ----------------------------------------------------
@router.get("/customers/export-csv", summary="Export outdoor marketing customers to CSV")
def export_outdoor_customers_csv(
    date_filter: Optional[date] = Query(None, description="Filter by date"),
    employee_id: Optional[int] = Query(None, description="Filter by employee"),
    current_user: User = Depends(get_current_manager),
    db: Session = Depends(get_db),
):
    query = (
        db.query(OutdoorMarketingCustomer)
        .join(Employee, OutdoorMarketingCustomer.marketing_employee_id == Employee.id)
        .filter(OutdoorMarketingCustomer.branch_id == current_user.branch_id)
    )

    if date_filter:
        query = query.filter(OutdoorMarketingCustomer.date == date_filter)

    if employee_id:
        query = query.filter(OutdoorMarketingCustomer.marketing_employee_id == employee_id)

    records = query.order_by(OutdoorMarketingCustomer.date.desc(), OutdoorMarketingCustomer.id.desc()).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Customer Name",
        "Phone Number",
        "Date of Birth (DOB)",
        "Wedding Anniversary",
        "Status",
        "Enrolled / Interested Scheme",
        "Campaign Area",
        "Staff Representative",
        "Staff Code",
        "Google Review Given",
        "Google Rating (Stars)",
        "Google Review Feedback",
        "Date",
        "Notes",
    ])

    for r in records:
        emp = r.marketing_employee
        writer.writerow([
            r.customer_name or "",
            r.phone or "",
            str(r.dob) if r.dob else "",
            str(r.anniversary_date) if r.anniversary_date else "",
            "Converted" if r.is_converted else (r.status or "Attended"),
            r.scheme_name or "",
            r.area_name or "",
            emp.full_name if emp else "",
            emp.employee_code if emp else "",
            "Yes" if r.has_google_review else "No",
            r.google_review_rating if r.has_google_review else "",
            r.google_review_text or "",
            str(r.date) if r.date else "",
            r.notes or "",
        ])

    csv_data = output.getvalue()
    filename = f"outdoor_customers_{date_filter or date.today()}.csv"

    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


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
    try:
        db.add(record)
        db.commit()
        db.refresh(record)
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to record customer lead: {str(e)}"
        )

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

    try:
        db.commit()
        db.refresh(record)
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update customer lead: {str(e)}"
        )

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

    try:
        db.delete(record)
        db.commit()
        return {"message": "Customer lead deleted successfully."}
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete customer lead: {str(e)}"
        )


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
    try:
        db.add(record)
        db.commit()
        db.refresh(record)
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to record outdoor scheme: {str(e)}"
        )

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

    try:
        db.commit()
        db.refresh(record)
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update scheme: {str(e)}"
        )

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

    try:
        db.delete(record)
        db.commit()
        return {"message": "Scheme record deleted successfully."}
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete scheme: {str(e)}"
        )


# ----------------------------------------------------
# 5. Outdoor Activities
# ----------------------------------------------------
@router.get("/activities", response_model=List[OutdoorActivityResponse], summary="List outdoor marketing activities")
def list_outdoor_activities(
    employee_id: Optional[int] = Query(None, description="Filter by employee"),
    area: Optional[str] = Query(None, description="Filter by area"),
    start_date: Optional[date] = Query(None, description="Filter from start date"),
    end_date: Optional[date] = Query(None, description="Filter to end date"),
    current_user: User = Depends(get_current_manager),
    db: Session = Depends(get_db),
):
    query = (
        db.query(OutdoorMarketingActivity)
        .outerjoin(Employee, OutdoorMarketingActivity.employee_id == Employee.id)
        .filter(
            OutdoorMarketingActivity.branch_id == current_user.branch_id,
        )
    )

    if employee_id:
        query = query.filter(
            or_(
                OutdoorMarketingActivity.employee_id == employee_id,
                OutdoorMarketingActivity.participating_employee_ids.ilike(f"%{employee_id}%"),
            )
        )

    if area:
        query = query.filter(OutdoorMarketingActivity.area.ilike(f"%{area.strip()}%"))

    if start_date:
        query = query.filter(OutdoorMarketingActivity.date >= start_date)

    if end_date:
        query = query.filter(OutdoorMarketingActivity.date <= end_date)

    records = query.order_by(OutdoorMarketingActivity.date.desc(), OutdoorMarketingActivity.id.desc()).all()

    result = []
    for r in records:
        emp_name = r.employee.full_name if r.employee else None
        res_item = OutdoorActivityResponse(
            id=r.id,
            branch_id=r.branch_id,
            employee_id=r.employee_id,
            employee_name=emp_name,
            participating_employee_ids=r.participating_employee_ids,
            employee_names=r.employee_names or emp_name,
            date=r.date,
            area=r.area,
            scheme_name=r.scheme_name,
            schemes_promoted=r.schemes_promoted,
            customers_generated=r.customers_generated,
            customers_attended=r.customers_attended,
            customers_closed=r.customers_closed,
            converted_customers=r.converted_customers or r.customers_closed,
            google_ratings_count=r.google_ratings_count,
            notes=r.notes,
            image_url=r.image_url,
            photo_url=r.photo_url or r.image_url,
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
    primary_emp = None
    if act_data.employee_id:
        primary_emp = db.query(Employee).filter(
            Employee.id == act_data.employee_id,
            Employee.branch_id == current_user.branch_id,
        ).first()

    # Calculate employee names if participating_employee_ids is given
    names_list = []
    if act_data.participating_employee_ids:
        raw_ids = [int(i.strip()) for i in act_data.participating_employee_ids.split(",") if i.strip().isdigit()]
        if raw_ids:
            emps = db.query(Employee).filter(
                Employee.id.in_(raw_ids),
                Employee.branch_id == current_user.branch_id,
            ).all()
            names_list = [e.full_name for e in emps]
            if not primary_emp and emps:
                primary_emp = emps[0]

    emp_names_str = ", ".join(names_list) if names_list else (primary_emp.full_name if primary_emp else act_data.employee_names)
    photo = act_data.photo_url or act_data.image_url

    record = OutdoorMarketingActivity(
        branch_id=current_user.branch_id,
        employee_id=primary_emp.id if primary_emp else None,
        participating_employee_ids=act_data.participating_employee_ids,
        employee_names=emp_names_str,
        date=act_data.date or date.today(),
        area=act_data.area.strip(),
        scheme_name=act_data.scheme_name.strip() if act_data.scheme_name else None,
        schemes_promoted=act_data.schemes_promoted,
        customers_generated=act_data.customers_generated or act_data.converted_customers,
        customers_attended=act_data.customers_attended,
        customers_closed=act_data.customers_closed or act_data.converted_customers,
        converted_customers=act_data.converted_customers or act_data.customers_closed,
        google_ratings_count=act_data.google_ratings_count,
        notes=act_data.notes.strip() if act_data.notes else None,
        image_url=photo,
        photo_url=photo,
    )
    try:
        db.add(record)
        db.commit()
        db.refresh(record)
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to record outdoor activity: {str(e)}"
        )

    return OutdoorActivityResponse(
        id=record.id,
        branch_id=record.branch_id,
        employee_id=record.employee_id,
        employee_name=primary_emp.full_name if primary_emp else None,
        participating_employee_ids=record.participating_employee_ids,
        employee_names=record.employee_names,
        date=record.date,
        area=record.area,
        scheme_name=record.scheme_name,
        schemes_promoted=record.schemes_promoted,
        customers_generated=record.customers_generated,
        customers_attended=record.customers_attended,
        customers_closed=record.customers_closed,
        converted_customers=record.converted_customers,
        google_ratings_count=record.google_ratings_count,
        notes=record.notes,
        image_url=record.image_url,
        photo_url=record.photo_url,
        created_at=record.created_at,
    )


@router.delete("/activities/{activity_id}", status_code=status.HTTP_200_OK, summary="Delete outdoor activity log")
def delete_outdoor_activity(
    activity_id: int,
    current_user: User = Depends(get_current_manager),
    db: Session = Depends(get_db),
):
    record = db.query(OutdoorMarketingActivity).filter(
        OutdoorMarketingActivity.id == activity_id,
        OutdoorMarketingActivity.branch_id == current_user.branch_id,
    ).first()

    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Activity log not found.")

    try:
        db.delete(record)
        db.commit()
        return {"message": "Activity log deleted successfully."}
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete activity log: {str(e)}"
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
    try:
        db.add(record)
        db.commit()
        db.refresh(record)
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create outdoor area: {str(e)}"
        )

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

    try:
        db.commit()
        db.refresh(record)
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update area: {str(e)}"
        )

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

    try:
        db.delete(record)
        db.commit()
        return {"message": "Area deleted successfully."}
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete area: {str(e)}"
        )
