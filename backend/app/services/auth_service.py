from datetime import datetime, timezone, timedelta
from typing import Optional, List
import os
from sqlalchemy.orm import Session
from sqlalchemy import func
from fastapi import HTTPException, status
from backend.app.core.security import verify_password, create_access_token, get_password_hash
from backend.app.core.config import Settings
from backend.app.models.branch import Branch, User
from backend.app.models.audit import AuditLog
from backend.app.schemas.auth import LoginRequest, TokenResponse, ManagerProfile


def get_live_env_settings() -> Settings:
    """Read latest configuration directly from .env file to ensure zero stale credentials."""
    return Settings()


def sync_managers_from_env(db: Session):
    """
    Dynamically synchronize all managers from .env into the database.
    Ensures that any credential changes in .env take effect immediately.
    """
    settings = get_live_env_settings()

    branches_config = [
        {
            "code": "YELAHANKA",
            "name": "Yelahanka",
            "city": "Bangalore",
            "managers": [
                (settings.MANAGER_1_NAME, settings.MANAGER_1_USERNAME, settings.MANAGER_1_PASSWORD),
                (settings.MANAGER_2_NAME, settings.MANAGER_2_USERNAME, settings.MANAGER_2_PASSWORD),
                (settings.MANAGER_3_NAME, settings.MANAGER_3_USERNAME, settings.MANAGER_3_PASSWORD),
                (settings.MANAGER_4_NAME, settings.MANAGER_4_USERNAME, settings.MANAGER_4_PASSWORD),
                (settings.MANAGER_5_NAME, settings.MANAGER_5_USERNAME, settings.MANAGER_5_PASSWORD),
            ],
        },
        {
            "code": "KOLAR",
            "name": "Kolar",
            "city": "Kolar",
            "managers": [
                (settings.KOLAR_MANAGER_1_NAME, settings.KOLAR_MANAGER_1_USERNAME, settings.KOLAR_MANAGER_1_PASSWORD),
                (settings.KOLAR_MANAGER_2_NAME, settings.KOLAR_MANAGER_2_USERNAME, settings.KOLAR_MANAGER_2_PASSWORD),
                (settings.KOLAR_MANAGER_3_NAME, settings.KOLAR_MANAGER_3_USERNAME, settings.KOLAR_MANAGER_3_PASSWORD),
            ],
        },
        {
            "code": "UDUPI",
            "name": "Udupi",
            "city": "Udupi",
            "managers": [
                (settings.UDUPI_MANAGER_1_NAME, settings.UDUPI_MANAGER_1_USERNAME, settings.UDUPI_MANAGER_1_PASSWORD),
                (settings.UDUPI_MANAGER_2_NAME, settings.UDUPI_MANAGER_2_USERNAME, settings.UDUPI_MANAGER_2_PASSWORD),
            ],
        },
    ]

    for b_conf in branches_config:
        branch = db.query(Branch).filter(Branch.code == b_conf["code"]).first()
        if not branch:
            branch = Branch(
                code=b_conf["code"],
                name=b_conf["name"],
                city=b_conf["city"],
                is_active=True,
            )
            db.add(branch)
            db.commit()
            db.refresh(branch)

        for name, username, pwd in b_conf["managers"]:
            if not username or not pwd:
                continue

            username_clean = username.strip()
            fallback_email = f"{username_clean.lower()}@sirisamruddhigold.com"

            try:
                user = (
                    db.query(User)
                    .filter(func.lower(User.username) == username_clean.lower())
                    .first()
                )

                hashed = get_password_hash(pwd)

                if not user:
                    user = User(
                        branch_id=branch.id,
                        full_name=name.strip(),
                        username=username_clean,
                        email=fallback_email,
                        hashed_password=hashed,
                        role="MANAGER",
                        is_active=True,
                    )
                    db.add(user)
                    db.commit()
                else:
                    user.branch_id = branch.id
                    user.full_name = name.strip()
                    user.username = username_clean
                    user.hashed_password = hashed
                    if not user.email:
                        user.email = fallback_email
                    user.role = "MANAGER"
                    user.is_active = True
                    db.commit()
            except Exception:
                db.rollback()


class AuthService:
    def __init__(self, db: Session):
        self.db = db

    def authenticate_manager(self, login_data: LoginRequest, ip_address: Optional[str] = None) -> TokenResponse:
        # Sync latest .env credentials before authenticating
        try:
            sync_managers_from_env(self.db)
        except Exception:
            self.db.rollback()

        username_cleaned = login_data.username.strip()
        password_cleaned = login_data.password.strip()

        # Lookup user by username (case-insensitive)
        query = self.db.query(User).filter(
            (func.lower(User.username) == func.lower(username_cleaned))
            | (func.lower(User.email) == func.lower(username_cleaned))
        )

        # If branch code provided, try filtering by branch first
        if login_data.branch_code:
            branch = (
                self.db.query(Branch)
                .filter(func.lower(Branch.code) == func.lower(login_data.branch_code.strip()))
                .first()
            )
            if branch:
                user = query.filter(User.branch_id == branch.id).first()
            else:
                user = query.first()
        else:
            user = query.first()

        # Fallback to general lookup if not matched with branch filter
        if not user:
            user = query.first()

        if not user or not verify_password(password_cleaned, user.hashed_password):
            # Check against fresh .env in case it was changed milliseconds ago
            live_settings = get_live_env_settings()
            all_env_managers = [
                (live_settings.MANAGER_1_USERNAME, live_settings.MANAGER_1_PASSWORD),
                (live_settings.MANAGER_2_USERNAME, live_settings.MANAGER_2_PASSWORD),
                (live_settings.MANAGER_3_USERNAME, live_settings.MANAGER_3_PASSWORD),
                (live_settings.MANAGER_4_USERNAME, live_settings.MANAGER_4_PASSWORD),
                (live_settings.MANAGER_5_USERNAME, live_settings.MANAGER_5_PASSWORD),
                (live_settings.KOLAR_MANAGER_1_USERNAME, live_settings.KOLAR_MANAGER_1_PASSWORD),
                (live_settings.KOLAR_MANAGER_2_USERNAME, live_settings.KOLAR_MANAGER_2_PASSWORD),
                (live_settings.KOLAR_MANAGER_3_USERNAME, live_settings.KOLAR_MANAGER_3_PASSWORD),
                (live_settings.UDUPI_MANAGER_1_USERNAME, live_settings.UDUPI_MANAGER_1_PASSWORD),
                (live_settings.UDUPI_MANAGER_2_USERNAME, live_settings.UDUPI_MANAGER_2_PASSWORD),
            ]

            env_match = False
            for u_name, u_pwd in all_env_managers:
                if u_name.lower() == username_cleaned.lower() and u_pwd == password_cleaned:
                    env_match = True
                    break

            if not env_match:
                # Log failed attempt
                audit = AuditLog(
                    branch_id=user.branch_id if user else None,
                    admin_username=username_cleaned,
                    action="Manager Login Failed",
                    entity="Auth",
                    ip_address=ip_address,
                    details=f"Invalid login credentials for {username_cleaned}",
                )
                self.db.add(audit)
                self.db.commit()
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid username or password. Please verify credentials.",
                    headers={"WWW-Authenticate": "Bearer"},
                )

        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="This manager account is inactive. Please contact system administrator.",
            )

        if user.role != "MANAGER":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied. Only Manager accounts are authorized.",
            )

        # Get branch
        branch = self.db.query(Branch).filter(Branch.id == user.branch_id).first()
        if not branch:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Associated branch not found.",
            )

        # Update last login
        user.last_login = datetime.now(timezone.utc)
        self.db.commit()

        # Create JWT Access Token
        live_settings = get_live_env_settings()
        expires_delta = (
            timedelta(days=7)
            if login_data.remember_me
            else timedelta(minutes=live_settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        )
        token = create_access_token(
            subject=user.id,
            branch_id=branch.id,
            branch_code=branch.code,
            role=user.role,
            expires_delta=expires_delta,
            extra_claims={
                "username": user.username,
                "email": user.email,
                "full_name": user.full_name,
            },
        )

        # Log successful login
        audit = AuditLog(
            branch_id=branch.id,
            admin_id=user.id,
            admin_username=user.username,
            action="Manager Login",
            entity="Auth",
            ip_address=ip_address,
            details=f"Manager {user.full_name} logged into {branch.name}",
        )
        self.db.add(audit)
        self.db.commit()

        return TokenResponse(
            access_token=token,
            token_type="bearer",
            expires_in=int(expires_delta.total_seconds()),
            user_id=user.id,
            username=user.username,
            full_name=user.full_name,
            email=user.email,
            role=user.role,
            branch_id=branch.id,
            branch_code=branch.code,
            branch_name=branch.name,
        )

    authenticate_admin = authenticate_manager

    def get_manager_profile(self, user_id: int, branch_id: int) -> ManagerProfile:
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user or user.branch_id != branch_id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Manager not found.")

        branch = self.db.query(Branch).filter(Branch.id == branch_id).first()
        return ManagerProfile(
            id=user.id,
            branch_id=branch.id,
            branch_code=branch.code,
            branch_name=branch.name,
            username=user.username,
            full_name=user.full_name,
            email=user.email,
            role=user.role,
            is_active=user.is_active,
        )

    get_admin_profile = get_manager_profile
