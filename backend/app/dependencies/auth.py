from typing import Optional
from pydantic import BaseModel
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from sqlalchemy import func
from backend.app.core.security import decode_access_token
from backend.app.core.config import settings
from backend.app.core.database import get_db
from backend.app.models.branch import User, Branch
from backend.app.models.employee import Employee

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)


class SuperAdminIdentity(BaseModel):
    """Stateless in-memory Super Admin identity constructed solely from validated JWT claims."""
    id: int = 0
    username: str = "superadmin"
    email: str = "admin@sirisamruddhigold.com"
    full_name: str = "Super Administrator"
    role: str = "SUPER_ADMIN"
    user_type: str = "env_admin"
    branch_id: Optional[int] = None
    is_active: bool = True


def get_current_manager(
    token: Optional[str] = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    """
    Authenticate request via JWT and enforce Manager role & Branch isolation.
    Returns the authenticated User (Manager) database entity.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials or session has expired.",
        headers={"WWW-Authenticate": "Bearer"},
    )

    if not token:
        raise credentials_exception

    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception

    user_type = payload.get("user_type")
    if user_type == "env_admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Super Administrator must access through the /admin portal.",
        )

    user_id_raw: Optional[str] = payload.get("sub")
    token_branch_id: Optional[int] = payload.get("branch_id")
    token_branch_code: Optional[str] = payload.get("branch_code")
    token_username: Optional[str] = payload.get("username")

    if not user_id_raw and not token_username:
        raise credentials_exception

    user: Optional[User] = None

    if user_id_raw:
        try:
            user_id_int = int(user_id_raw)
            user = db.query(User).filter(User.id == user_id_int).first()
        except (ValueError, TypeError):
            user = None

    if user is None and token_username:
        user = db.query(User).filter(
            func.lower(User.username) == token_username.strip().lower()
        ).first()

    if user is None and token_username:
        from backend.app.services.auth_service import get_env_manager_by_username
        from backend.app.core.security import get_password_hash

        env_mgr = get_env_manager_by_username(token_username)
        if env_mgr:
            branch = db.query(Branch).filter(Branch.code == env_mgr["branch_code"].upper()).first()
            if not branch:
                branch = Branch(
                    name=env_mgr["branch_name"],
                    code=env_mgr["branch_code"].upper(),
                    city=env_mgr["branch_name"],
                    is_active=True,
                )
                db.add(branch)
                db.commit()
                db.refresh(branch)

            user = User(
                branch_id=branch.id,
                full_name=env_mgr["full_name"],
                username=env_mgr["username"].strip(),
                email=f"{env_mgr['username'].strip().lower()}@sirisamruddhigold.com",
                hashed_password=get_password_hash(env_mgr["password"]),
                role="MANAGER",
                is_active=True,
            )
            db.add(user)
            db.commit()
            db.refresh(user)

    if user is None or not user.is_active:
        raise credentials_exception

    # Enforce Manager role
    if user.role != "MANAGER":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Only Managers can access this portal.",
        )

    # Branch Boundary Check: Validate that user's branch matches the requested branch
    if token_branch_id is not None and user.branch_id != token_branch_id:
        branch = db.query(Branch).filter(Branch.id == user.branch_id).first()
        if branch and token_branch_code and branch.code.upper() == token_branch_code.upper():
            # Same branch by code despite ID variation
            pass
        else:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Security violation: User branch mismatch.",
            )

    return user


def get_current_super_admin(
    token: Optional[str] = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> SuperAdminIdentity:
    """
    Authenticate request via JWT and enforce SUPER_ADMIN role with organization-wide access.
    Constructs and returns SuperAdminIdentity directly from verified JWT claims.
    ZERO database lookup is performed for the Super Admin.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate administrator credentials or session has expired.",
        headers={"WWW-Authenticate": "Bearer"},
    )

    if not token:
        raise credentials_exception

    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception

    role: Optional[str] = payload.get("role")
    user_type: Optional[str] = payload.get("user_type")

    # Enforce Super Admin role & ENV identity claim
    if role not in ["SUPER_ADMIN", "super_admin"] or user_type != "env_admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Super Administrator privileges required.",
        )

    email = payload.get("email") or settings.ADMIN_EMAIL
    full_name = payload.get("full_name") or settings.ADMIN_NAME
    username = payload.get("username") or "superadmin"

    return SuperAdminIdentity(
        id=0,
        username=username,
        email=email,
        full_name=full_name,
        role="SUPER_ADMIN",
        user_type="env_admin",
        branch_id=None,
        is_active=True,
    )


# Alias for backward compatibility
require_super_admin = get_current_super_admin
get_current_admin = get_current_super_admin
get_current_user = get_current_manager


def get_current_manager_or_admin(
    token: Optional[str] = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
):
    """
    Authenticates either a Branch Manager (User model) or Super Admin (SuperAdminIdentity).
    Used for endpoints accessible to both roles (e.g. WhatsApp Templates and Logs).
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials or session has expired.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if not token:
        raise credentials_exception

    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception

    user_type = payload.get("user_type")
    role = str(payload.get("role", "")).upper()

    if user_type == "env_admin" or role in ["SUPER_ADMIN", "ADMIN"]:
        email = payload.get("email") or settings.ADMIN_EMAIL
        full_name = payload.get("full_name") or settings.ADMIN_NAME
        username = payload.get("username") or "superadmin"
        return SuperAdminIdentity(
            id=0,
            username=username,
            email=email,
            full_name=full_name,
            role="SUPER_ADMIN",
            user_type="env_admin",
            branch_id=None,
            is_active=True,
        )

    return get_current_manager(token, db)



def get_current_employee(
    token: Optional[str] = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> Employee:
    """
    Authenticate request via JWT and enforce Employee role.
    Returns the authenticated Employee database entity.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate employee credentials or session has expired.",
        headers={"WWW-Authenticate": "Bearer"},
    )

    if not token:
        raise credentials_exception

    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception

    role = payload.get("role")
    if role not in ["EMPLOYEE", "employee"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Only Showroom Employees can access this endpoint.",
        )

    emp_id_raw = payload.get("sub") or payload.get("employee_id")
    token_branch_id = payload.get("branch_id")

    if not emp_id_raw:
        raise credentials_exception

    try:
        emp_id = int(emp_id_raw)
        emp = db.query(Employee).filter(Employee.id == emp_id).first()
    except Exception:
        emp = None

    if not emp or emp.status != "active":
        raise credentials_exception

    if token_branch_id is not None and emp.branch_id != token_branch_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Security violation: Employee branch mismatch.",
        )

    return emp


def get_current_hr(
    token: Optional[str] = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    """
    Authenticate request via JWT and enforce HR role.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate HR credentials or session has expired.",
        headers={"WWW-Authenticate": "Bearer"},
    )

    if not token:
        raise credentials_exception

    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception

    role = (payload.get("role") or "").upper()
    if role not in ["HR", "SUPER_ADMIN"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Human Resources (HR) privileges required.",
        )

    user_id_raw = payload.get("sub")
    token_username = payload.get("username")

    user = None
    if user_id_raw:
        try:
            user = db.query(User).filter(User.id == int(user_id_raw)).first()
        except (ValueError, TypeError):
            user = None

    if user is None and token_username:
        user = db.query(User).filter(func.lower(User.username) == token_username.strip().lower()).first()

    if not user:
        # Create or return virtual HR identity
        default_branch = db.query(Branch).first()
        user = User(
            id=int(user_id_raw) if user_id_raw and str(user_id_raw).isdigit() else 1,
            branch_id=default_branch.id if default_branch else 1,
            full_name=payload.get("full_name") or settings.HR_NAME,
            username=token_username or settings.HR_USERNAME,
            role="HR",
            is_active=True,
        )

    return user


def get_current_manager_or_hr(
    token: Optional[str] = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    """
    Authenticate request for either a Branch Manager, HR, or Super Admin.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials or session has expired.",
        headers={"WWW-Authenticate": "Bearer"},
    )

    if not token:
        raise credentials_exception

    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception

    role = (payload.get("role") or "").upper()
    if role not in ["MANAGER", "HR", "SUPER_ADMIN"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Manager or HR privileges required.",
        )

    user_id_raw = payload.get("sub")
    token_username = payload.get("username")

    user = None
    if user_id_raw:
        try:
            user = db.query(User).filter(User.id == int(user_id_raw)).first()
        except (ValueError, TypeError):
            user = None

    if user is None and token_username:
        user = db.query(User).filter(func.lower(User.username) == token_username.strip().lower()).first()

    if not user:
        raise credentials_exception

    return user


