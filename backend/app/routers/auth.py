from typing import List
from fastapi import APIRouter, Depends, Request, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.models.branch import User, Branch
from backend.app.models.audit import AuditLog
from backend.app.schemas.auth import (
    LoginRequest,
    TokenResponse,
    ManagerProfile,
    MessageResponse,
    BranchPublicResponse,
    ManagerPublicOption,
)
from backend.app.services.auth_service import AuthService, sync_managers_from_env
from backend.app.dependencies.auth import get_current_manager

router = APIRouter(prefix="/api/v1/auth", tags=["Authentication"])


@router.get("/branches", response_model=List[BranchPublicResponse], summary="List all showroom branches with their manager names")
def get_branches(db: Session = Depends(get_db)):
    # Synchronize latest managers from .env dynamically
    try:
        sync_managers_from_env(db)
    except Exception:
        db.rollback()

    branches = db.query(Branch).filter(Branch.is_active == True).order_by(Branch.id.asc()).all()
    results = []
    for b in branches:
        managers = (
            db.query(User)
            .filter(User.branch_id == b.id, User.role == "MANAGER", User.is_active == True)
            .order_by(User.id.asc())
            .all()
        )
        mgr_options = [
            ManagerPublicOption(
                id=m.id,
                full_name=m.full_name,
                username=m.username,
                email=m.email,
                branch_id=b.id,
                branch_code=b.code,
            )
            for m in managers
        ]
        results.append(
            BranchPublicResponse(
                id=b.id,
                code=b.code,
                name=b.name,
                city=b.city,
                address=b.address,
                phone=b.phone,
                description=b.description,
                is_active=b.is_active,
                managers=mgr_options,
            )
        )
    return results


@router.get("/branches/{branch_code}/managers", response_model=List[ManagerPublicOption], summary="List managers for a specific branch")
def get_branch_managers(branch_code: str, db: Session = Depends(get_db)):
    try:
        sync_managers_from_env(db)
    except Exception as e:
        pass

    branch = db.query(Branch).filter(Branch.code == branch_code.upper()).first()
    if not branch:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Branch not found.")

    managers = (
        db.query(User)
        .filter(User.branch_id == branch.id, User.role == "MANAGER", User.is_active == True)
        .order_by(User.id.asc())
        .all()
    )
    return [
        ManagerPublicOption(
            id=m.id,
            full_name=m.full_name,
            username=m.username,
            email=m.email,
            branch_id=branch.id,
            branch_code=branch.code,
        )
        for m in managers
    ]


@router.post("/login", response_model=TokenResponse, summary="Authenticate manager via email/username and password")
def login(login_data: LoginRequest, request: Request, db: Session = Depends(get_db)):
    auth_service = AuthService(db)
    client_ip = request.client.host if request.client else None
    return auth_service.authenticate_manager(login_data, ip_address=client_ip)


@router.get("/me", response_model=ManagerProfile, summary="Get current logged in manager profile")
def get_me(current_user: User = Depends(get_current_manager), db: Session = Depends(get_db)):
    auth_service = AuthService(db)
    return auth_service.get_manager_profile(current_user.id, current_user.branch_id)


@router.post("/logout", response_model=MessageResponse, summary="Logout current manager session")
def logout(
    request: Request,
    current_user: User = Depends(get_current_manager),
    db: Session = Depends(get_db),
):
    client_ip = request.client.host if request.client else None
    audit = AuditLog(
        branch_id=current_user.branch_id,
        admin_id=current_user.id,
        admin_username=current_user.username,
        action="Manager Logout",
        entity="Auth",
        ip_address=client_ip,
        details=f"Manager {current_user.full_name} logged out.",
    )
    db.add(audit)
    db.commit()
    return MessageResponse(message="Successfully logged out.")
