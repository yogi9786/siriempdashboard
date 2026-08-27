import os
import uuid
from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Form, status
from sqlalchemy.orm import Session
from sqlalchemy import or_
from backend.app.core.config import settings
from backend.app.core.database import get_db
from backend.app.models.branch import User
from backend.app.models.employee import Employee
from backend.app.models.activity import EmployeeFormMedia
from backend.app.schemas.activity import FormMediaResponse
from backend.app.dependencies.auth import get_current_manager

router = APIRouter(prefix="/api/v1", tags=["Forms & Gallery"])

ALLOWED_MIME_TYPES = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/jpg": ".jpg",
}


def ensure_media_dir():
    os.makedirs(settings.MEDIA_DIR, exist_ok=True)


@router.post("/forms/upload", response_model=FormMediaResponse, status_code=status.HTTP_201_CREATED, summary="Upload an employee form or media image")
async def upload_form_media(
    employee_id: int = Form(...),
    form_type: str = Form(...),
    notes: Optional[str] = Form(None),
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_manager),
    db: Session = Depends(get_db),
):
    # 1. Validate employee exists in current manager's showroom branch
    employee = db.query(Employee).filter(
        Employee.id == employee_id,
        Employee.branch_id == current_user.branch_id,
    ).first()
    if not employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee not found in your showroom branch.",
        )

    # 2. Validate MIME type
    content_type = file.content_type.lower() if file.content_type else ""
    if content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file type '{file.content_type}'. Only JPEG, PNG, and WebP images are permitted.",
        )

    # 3. Validate file size and read content
    ensure_media_dir()
    contents = await file.read()
    file_size = len(contents)
    max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024

    if file_size > max_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File exceeds maximum allowed size of {settings.MAX_UPLOAD_SIZE_MB}MB.",
        )

    if file_size == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty.",
        )

    # 4. Generate unique safe filename
    ext = ALLOWED_MIME_TYPES.get(content_type, ".jpg")
    safe_filename = f"form_{uuid.uuid4().hex[:16]}{ext}"
    file_path = os.path.join(settings.MEDIA_DIR, safe_filename)

    with open(file_path, "wb") as f:
        f.write(contents)

    file_url = f"/media/{safe_filename}"

    # 5. Save metadata to database
    media_record = EmployeeFormMedia(
        branch_id=current_user.branch_id,
        employee_id=employee.id,
        form_type=form_type.strip(),
        file_path=file_path,
        file_url=file_url,
        mime_type=content_type,
        file_size=file_size,
        notes=notes.strip() if notes else None,
        upload_date=datetime.now(timezone.utc),
    )
    db.add(media_record)
    db.commit()
    db.refresh(media_record)

    return FormMediaResponse(
        id=media_record.id,
        branch_id=media_record.branch_id,
        employee_id=media_record.employee_id,
        employee_name=employee.full_name,
        form_type=media_record.form_type,
        file_path=media_record.file_path,
        file_url=media_record.file_url,
        mime_type=media_record.mime_type,
        file_size=media_record.file_size,
        notes=media_record.notes,
        upload_date=media_record.upload_date,
        created_at=media_record.created_at,
    )


@router.get("/gallery", response_model=List[FormMediaResponse], summary="List forms gallery for current manager's branch")
def get_gallery_media(
    employee_id: Optional[int] = Query(None, description="Filter by employee ID"),
    form_type: Optional[str] = Query(None, description="Filter by form type"),
    search: Optional[str] = Query(None, description="Search notes, form type, or employee"),
    current_user: User = Depends(get_current_manager),
    db: Session = Depends(get_db),
):
    query = (
        db.query(EmployeeFormMedia)
        .join(Employee, EmployeeFormMedia.employee_id == Employee.id)
        .filter(
            EmployeeFormMedia.branch_id == current_user.branch_id,
        )
    )

    if employee_id:
        query = query.filter(EmployeeFormMedia.employee_id == employee_id)

    if form_type:
        query = query.filter(EmployeeFormMedia.form_type == form_type)

    if search:
        term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                EmployeeFormMedia.form_type.ilike(term),
                EmployeeFormMedia.notes.ilike(term),
                Employee.full_name.ilike(term),
                Employee.employee_code.ilike(term),
            )
        )

    records = query.order_by(EmployeeFormMedia.upload_date.desc(), EmployeeFormMedia.id.desc()).all()

    result = []
    for r in records:
        emp_name = r.employee.full_name if r.employee else None
        res_item = FormMediaResponse(
            id=r.id,
            branch_id=r.branch_id,
            employee_id=r.employee_id,
            employee_name=emp_name,
            form_type=r.form_type,
            file_path=r.file_path,
            file_url=r.file_url,
            mime_type=r.mime_type,
            file_size=r.file_size,
            notes=r.notes,
            upload_date=r.upload_date,
            created_at=r.created_at,
        )
        result.append(res_item)

    return result


@router.delete("/gallery/{media_id}", status_code=status.HTTP_200_OK, summary="Delete form media item")
def delete_gallery_media(
    media_id: int,
    current_user: User = Depends(get_current_manager),
    db: Session = Depends(get_db),
):
    media = (
        db.query(EmployeeFormMedia)
        .join(Employee, EmployeeFormMedia.employee_id == Employee.id)
        .filter(
            EmployeeFormMedia.id == media_id,
            EmployeeFormMedia.branch_id == current_user.branch_id,
        )
        .first()
    )

    if not media:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Media item not found.")

    try:
        if os.path.exists(media.file_path):
            os.remove(media.file_path)
    except Exception:
        pass

    db.delete(media)
    db.commit()
    return {"message": "Form media deleted successfully."}
