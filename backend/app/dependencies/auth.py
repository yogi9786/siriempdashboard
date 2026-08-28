from typing import Optional
from pydantic import BaseModel
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
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

    user_id: Optional[str] = payload.get("sub")
    token_branch_id: Optional[int] = payload.get("branch_id")

    if user_id is None or token_branch_id is None:
        raise credentials_exception

    try:
        user_id_int = int(user_id)
    except ValueError:
        raise credentials_exception

    user = db.query(User).filter(User.id == user_id_int).first()
    if user is None or not user.is_active:
        raise credentials_exception

    # Critical Security Check: Ensure user's real database branch matches the token branch
    if user.branch_id != token_branch_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Security violation: User branch mismatch.",
        )

    # Enforce Manager role
    if user.role != "MANAGER":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Only Managers can access this portal.",
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
