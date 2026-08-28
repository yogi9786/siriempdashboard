from typing import List, Optional
from fastapi import APIRouter, Depends, Request, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.core.config import Settings
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
from backend.app.services.auth_service import AuthService, sync_managers_from_env, get_live_env_settings
from backend.app.dependencies.auth import get_current_manager

router = APIRouter(prefix="/api/v1/auth", tags=["Authentication"])


def get_env_branches_and_managers() -> List[BranchPublicResponse]:
    """
    Directly construct public branch and manager directory from server-side .env configuration.
    Delivers sub-millisecond response times without database latency.
    """
    settings = get_live_env_settings()

    branches_data = [
        {
            "id": 1,
            "code": "YELAHANKA",
            "name": "Yelahanka",
            "city": "Bangalore",
            "address": "BB Road, Near Police Station, Yelahanka, Bangalore - 560064",
            "phone": "+91 80 2856 1122",
            "description": "Main Showroom Portal, Bangalore North",
            "is_active": True,
            "managers": [
                (1, settings.MANAGER_1_NAME, settings.MANAGER_1_USERNAME),
                (2, settings.MANAGER_2_NAME, settings.MANAGER_2_USERNAME),
                (3, settings.MANAGER_3_NAME, settings.MANAGER_3_USERNAME),
                (4, settings.MANAGER_4_NAME, settings.MANAGER_4_USERNAME),
                (5, settings.MANAGER_5_NAME, settings.MANAGER_5_USERNAME),
            ],
        },
        {
            "id": 2,
            "code": "KOLAR",
            "name": "Kolar",
            "city": "Kolar",
            "address": "Court Road, Near Clock Tower, Kolar - 563101",
            "phone": "+91 81 5222 3344",
            "description": "Showroom Management Portal, Kolar District",
            "is_active": True,
            "managers": [
                (6, settings.KOLAR_MANAGER_1_NAME, settings.KOLAR_MANAGER_1_USERNAME),
                (7, settings.KOLAR_MANAGER_2_NAME, settings.KOLAR_MANAGER_2_USERNAME),
                (8, settings.KOLAR_MANAGER_3_NAME, settings.KOLAR_MANAGER_3_USERNAME),
            ],
        },
        {
            "id": 3,
            "code": "UDUPI",
            "name": "Udupi",
            "city": "Udupi",
            "address": "Car Street, Near Krishna Matha, Udupi - 576101",
            "phone": "+91 82 0252 5566",
            "description": "Showroom Management Portal, Coastal Karnataka",
            "is_active": True,
            "managers": [
                (9, settings.UDUPI_MANAGER_1_NAME, settings.UDUPI_MANAGER_1_USERNAME),
                (10, settings.UDUPI_MANAGER_2_NAME, settings.UDUPI_MANAGER_2_USERNAME),
            ],
        },
    ]

    results = []
    for b in branches_data:
        mgr_options = [
            ManagerPublicOption(
                id=m_id,
                full_name=m_name.strip() if m_name else m_user.strip(),
                username=m_user.strip(),
                email=f"{m_user.strip().lower()}@sirisamruddhigold.com",
                branch_id=b["id"],
                branch_code=b["code"],
            )
            for m_id, m_name, m_user in b["managers"]
            if m_user and m_user.strip()
        ]
        results.append(
            BranchPublicResponse(
                id=b["id"],
                code=b["code"],
                name=b["name"],
                city=b["city"],
                address=b["address"],
                phone=b["phone"],
                description=b["description"],
                is_active=b["is_active"],
                managers=mgr_options,
            )
        )
    return results


@router.get("/branches", response_model=List[BranchPublicResponse], summary="List all showroom branches with their manager names from .env")
def get_branches(db: Session = Depends(get_db)):
    """Fetch all showroom branches and their respective managers directly from live .env."""
    return get_env_branches_and_managers()


@router.get("/branches/{branch_code}/managers", response_model=List[ManagerPublicOption], summary="List managers for a specific branch directly from .env")
def get_branch_managers(branch_code: str, db: Session = Depends(get_db)):
    """Instantly return managers configured in .env for the specified branch code."""
    all_branches = get_env_branches_and_managers()
    target_code = branch_code.strip().upper()
    for b in all_branches:
        if b.code == target_code:
            return b.managers

    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=f"Branch code '{branch_code}' not found in configuration.",
    )


@router.post("/login", response_model=TokenResponse, summary="Authenticate manager via username and password with security protection")
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
