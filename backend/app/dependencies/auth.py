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

    # Strategy 1: Lookup by database User ID
    if user_id_raw:
        try:
            user_id_int = int(user_id_raw)
            user = db.query(User).filter(User.id == user_id_int).first()
        except (ValueError, TypeError):
            user = None

    # Strategy 2: Fallback lookup by username if ID shifted or reseeded
    if user is None and token_username:
        user = db.query(User).filter(
            func.lower(User.username) == token_username.strip().lower()
        ).first()

    # Strategy 3: Auto-heal/sync if manager is defined in live environment
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
