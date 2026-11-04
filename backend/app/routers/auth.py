from typing import List, Optional
from fastapi import APIRouter, Depends, Request, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, func
from backend.app.core.database import get_db
from backend.app.core.config import Settings
from backend.app.models.branch import User, Branch
from backend.app.models.employee import Employee
from backend.app.models.audit import AuditLog
from backend.app.schemas.auth import (
    LoginRequest,
    TokenResponse,
    ManagerProfile,
    ChangePasswordRequest,
    UpdateProfileRequest,
    MessageResponse,
    BranchPublicResponse,
    ManagerPublicOption,
    EmployeePublicOption,
)
from backend.app.services.auth_service import AuthService, sync_managers_from_env, get_live_env_settings
from backend.app.dependencies.auth import get_current_manager, get_current_employee

router = APIRouter(prefix="/api/v1/auth", tags=["Authentication"])



def get_env_branches_and_managers(db: Optional[Session] = None) -> List[BranchPublicResponse]:
    """
    Construct public branch and manager directory from server-side .env and database.
    Ensures manager IDs match actual database user records.
    """
    settings = get_live_env_settings()

    branches_data = [
        {
            "code": "YELAHANKA",
            "name": "Yelahanka",
            "city": "Bangalore",
            "address": "",
            "phone": "",
            "description": "Main Showroom Portal, Bangalore North",
            "is_active": True,
            "managers": [
                (settings.MANAGER_1_NAME, settings.MANAGER_1_USERNAME),
                (settings.MANAGER_2_NAME, settings.MANAGER_2_USERNAME),
                (settings.MANAGER_3_NAME, settings.MANAGER_3_USERNAME),
                (settings.MANAGER_4_NAME, settings.MANAGER_4_USERNAME),
                (settings.MANAGER_5_NAME, settings.MANAGER_5_USERNAME),

            ],
        },
        {
            "code": "KOLAR",
            "name": "Kolar",
            "city": "Kolar",
            "address": "",
            "phone": "",
            "description": "Showroom Management Portal, Kolar District",
            "is_active": True,
            "managers": [
                (settings.KOLAR_MANAGER_1_NAME, settings.KOLAR_MANAGER_1_USERNAME),
                (settings.KOLAR_MANAGER_2_NAME, settings.KOLAR_MANAGER_2_USERNAME),
                (settings.KOLAR_MANAGER_3_NAME, settings.KOLAR_MANAGER_3_USERNAME),
            ],
        },
        {
            "code": "UDUPI",
            "name": "Udupi",
            "city": "Udupi",
            "address": "",
            "phone": "",
            "description": "Showroom Management Portal, Coastal Karnataka",
            "is_active": True,
            "managers": [
                (settings.UDUPI_MANAGER_1_NAME, settings.UDUPI_MANAGER_1_USERNAME),
                (settings.UDUPI_MANAGER_2_NAME, settings.UDUPI_MANAGER_2_USERNAME),
            ],
        },
    ]

    # Pre-fetch existing branches and users from DB if session provided
    db_branches = {}
    db_users = {}
    if db:
        try:
            for b in db.query(Branch).all():
                db_branches[b.code.upper()] = b
            for u in db.query(User).all():
                db_users[u.username.strip().lower()] = u
        except Exception:
            pass

    results = []
    default_branch_id = 1
    for b in branches_data:
        b_code = b["code"].upper()
        real_branch = db_branches.get(b_code)
        branch_id = real_branch.id if real_branch else default_branch_id
        default_branch_id += 1

        mgr_options = []
        for idx, (m_name, m_user) in enumerate(b["managers"], start=1):
            if not m_user or not m_user.strip():
                continue
            clean_user = m_user.strip()
            clean_name = m_name.strip() if m_name else clean_user
            db_u = db_users.get(clean_user.lower())
            mgr_id = db_u.id if db_u else idx
            mgr_code = getattr(db_u, "manager_code", None) if db_u else None

            mgr_options.append(
                ManagerPublicOption(
                    id=mgr_id,
                    full_name=clean_name,
                    username=clean_user,
                    manager_code=mgr_code,
                    email=f"{clean_user.lower()}@sirisamruddhigold.com",
                    branch_id=branch_id,
                    branch_code=b_code,
                )
            )

        emp_options = []
        if db and real_branch:
            try:
                mgr_users = {m.username.strip().lower() for m in mgr_options if m.username}
                for m in mgr_options:
                    if getattr(m, "manager_code", None):
                        mgr_users.add(m.manager_code.strip().lower())
                db_emps = (
                    db.query(Employee)
                    .filter(Employee.branch_id == real_branch.id, Employee.status == "active")
                    .order_by(Employee.full_name.asc())
                    .all()
                )
                for e in db_emps:
                    desig = (e.designation or "").lower()
                    code = (e.employee_code or "").strip().lower()
                    if "manager" in desig or code in mgr_users:
                        continue
                    emp_options.append(
                        EmployeePublicOption(
                            id=e.id,
                            full_name=e.full_name,
                            employee_code=e.employee_code,
                            username=e.employee_code,
                            designation=e.designation or "Sales Executive",
                            department=e.department or "Sales & Showroom Operations",
                            branch_id=branch_id,
                            branch_code=b_code,
                        )
                    )
            except Exception:
                pass

        results.append(
            BranchPublicResponse(
                id=branch_id,
                code=b_code,
                name=real_branch.name if real_branch else b["name"],
                city=real_branch.city if real_branch else b["city"],
                address=real_branch.address if real_branch else b["address"],
                phone=real_branch.phone if real_branch else b["phone"],
                description=real_branch.description if real_branch else b["description"],
                is_active=True,
                managers=mgr_options,
                employees=emp_options,
            )
        )
    return results


@router.get("/branches", response_model=List[BranchPublicResponse], summary="List all showroom branches with their manager names from .env")
def get_branches(db: Session = Depends(get_db)):
    """Fetch all showroom branches and their respective managers directly from live .env & DB."""
    return get_env_branches_and_managers(db)


@router.get("/branches/{branch_code}/managers", response_model=List[ManagerPublicOption], summary="List managers for a specific branch directly from .env")
def get_branch_managers(branch_code: str, db: Session = Depends(get_db)):
    """Instantly return managers configured for the specified branch code."""
    all_branches = get_env_branches_and_managers(db)
    target_code = branch_code.strip().upper()
    for b in all_branches:
        if b.code == target_code:
            return b.managers

    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=f"Branch code '{branch_code}' not found in configuration.",
    )


@router.get("/branches/{branch_code}/employees", response_model=List[EmployeePublicOption], summary="List active showroom employees for a specific branch")
def get_branch_employees(branch_code: str, db: Session = Depends(get_db)):
    """Instantly return active showroom employees for the specified branch, strictly excluding Showroom Managers."""
    clean_code = branch_code.strip().upper()
    branch = (
        db.query(Branch)
        .filter(
            or_(
                func.upper(Branch.code) == clean_code,
                func.upper(Branch.name) == clean_code,
            )
        )
        .first()
    )
    if not branch:
        branch_id_map = {"YELAHANKA": 1, "KOLAR": 2, "UDUPI": 3}
        if clean_code in branch_id_map:
            branch = db.query(Branch).filter(Branch.id == branch_id_map[clean_code]).first()

    if not branch:
        branch = db.query(Branch).first()

    if not branch:
        return []

    # Gather manager usernames and manager codes to strictly filter them out
    manager_codes = set()
    for m in db.query(User).filter(User.branch_id == branch.id, User.role == "MANAGER").all():
        if m.username:
            manager_codes.add(m.username.strip().lower())
        if getattr(m, "manager_code", None):
            manager_codes.add(m.manager_code.strip().lower())

    all_branches = get_env_branches_and_managers(db)
    for b in all_branches:
        if b.code == clean_code:
            for m in b.managers:
                if m.username:
                    manager_codes.add(m.username.strip().lower())
                if getattr(m, "manager_code", None):
                    manager_codes.add(m.manager_code.strip().lower())

    employees = (
        db.query(Employee)
        .filter(Employee.branch_id == branch.id, Employee.status == "active")
        .order_by(Employee.full_name.asc())
        .all()
    )

    non_manager_employees = []
    for e in employees:
        desig = (e.designation or "").lower()
        code = (e.employee_code or "").strip().lower()
        # Strictly exclude anyone with Manager designation or matching manager codes
        if "manager" in desig or code in manager_codes:
            continue
        non_manager_employees.append(e)

    return [
        EmployeePublicOption(
            id=e.id,
            full_name=e.full_name,
            employee_code=e.employee_code,
            username=e.employee_code,
            designation=e.designation or "Sales Executive",
            department=e.department or "Sales & Showroom Operations",
            branch_id=branch.id,
            branch_code=branch.code,
        )
        for e in non_manager_employees
    ]


@router.post("/employee/login", response_model=TokenResponse, summary="Authenticate showroom employee via credentials configured in .env")
def employee_login(login_data: LoginRequest, request: Request, db: Session = Depends(get_db)):
    auth_service = AuthService(db)
    client_ip = request.client.host if request.client else None
    return auth_service.authenticate_employee(login_data, ip_address=client_ip)


@router.get("/employee/me", response_model=EmployeePublicOption, summary="Get current logged in employee profile")
def get_employee_me(current_employee: Employee = Depends(get_current_employee), db: Session = Depends(get_db)):
    branch = db.query(Branch).filter(Branch.id == current_employee.branch_id).first()
    return EmployeePublicOption(
        id=current_employee.id,
        full_name=current_employee.full_name,
        employee_code=current_employee.employee_code,
        username=current_employee.employee_code,
        designation=current_employee.designation or "Sales Executive",
        department=current_employee.department or "Sales & Showroom Operations",
        branch_id=current_employee.branch_id,
        branch_code=branch.code if branch else "SHOWROOM",
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


@router.post("/change-password", response_model=MessageResponse, summary="Manager self-service change password")
def change_password(
    pwd_data: ChangePasswordRequest,
    request: Request,
    current_user: User = Depends(get_current_manager),
    db: Session = Depends(get_db),
):
    """
    Allow logged in showroom managers to change their password themselves.
    """
    auth_service = AuthService(db)
    client_ip = request.client.host if request.client else None
    res = auth_service.change_manager_password(
        user_id=current_user.id,
        current_password=pwd_data.current_password,
        new_password=pwd_data.new_password,
        ip_address=client_ip,
    )
    return MessageResponse(message=res["message"], success=True)


@router.put("/profile", response_model=ManagerProfile, summary="Update manager profile info")
def update_profile(
    profile_data: UpdateProfileRequest,
    current_user: User = Depends(get_current_manager),
    db: Session = Depends(get_db),
):
    """
    Update logged-in manager's name or contact email.
    """
    auth_service = AuthService(db)
    return auth_service.update_manager_profile(
        user_id=current_user.id,
        full_name=profile_data.full_name,
        email=profile_data.email,
    )


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
