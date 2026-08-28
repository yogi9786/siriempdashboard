import hmac
from datetime import datetime, timezone, timedelta
from typing import Optional, List
import os
from sqlalchemy.orm import Session
from sqlalchemy import func
from fastapi import HTTPException, status
from backend.app.core.security import (
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_access_token,
    revoke_token,
    get_password_hash,
    check_login_rate_limit,
    record_failed_login,
    reset_failed_login,
)
from backend.app.core.config import Settings
from backend.app.models.branch import Branch, User
from backend.app.models.audit import AuditLog
from backend.app.schemas.auth import LoginRequest, TokenResponse, ManagerProfile


def get_live_env_settings() -> Settings:
    """Read latest configuration directly from .env file to ensure zero stale credentials."""
    return Settings()


def get_env_manager_by_username(username: str) -> Optional[dict]:
    """
    Look up manager configuration directly from server-side .env in sub-millisecond time.
    """
    settings = get_live_env_settings()
    cleaned = username.strip().lower()

    # Directory of all managers from .env
    managers_map = [
        # Yelahanka
        {"id": 1, "branch_id": 1, "branch_code": "YELAHANKA", "branch_name": "Yelahanka", "username": settings.MANAGER_1_USERNAME, "password": settings.MANAGER_1_PASSWORD, "full_name": settings.MANAGER_1_NAME},
        {"id": 2, "branch_id": 1, "branch_code": "YELAHANKA", "branch_name": "Yelahanka", "username": settings.MANAGER_2_USERNAME, "password": settings.MANAGER_2_PASSWORD, "full_name": settings.MANAGER_2_NAME},
        {"id": 3, "branch_id": 1, "branch_code": "YELAHANKA", "branch_name": "Yelahanka", "username": settings.MANAGER_3_USERNAME, "password": settings.MANAGER_3_PASSWORD, "full_name": settings.MANAGER_3_NAME},
        {"id": 4, "branch_id": 1, "branch_code": "YELAHANKA", "branch_name": "Yelahanka", "username": settings.MANAGER_4_USERNAME, "password": settings.MANAGER_4_PASSWORD, "full_name": settings.MANAGER_4_NAME},
        {"id": 5, "branch_id": 1, "branch_code": "YELAHANKA", "branch_name": "Yelahanka", "username": settings.MANAGER_5_USERNAME, "password": settings.MANAGER_5_PASSWORD, "full_name": settings.MANAGER_5_NAME},
        # Kolar
        {"id": 6, "branch_id": 2, "branch_code": "KOLAR", "branch_name": "Kolar", "username": settings.KOLAR_MANAGER_1_USERNAME, "password": settings.KOLAR_MANAGER_1_PASSWORD, "full_name": settings.KOLAR_MANAGER_1_NAME},
        {"id": 7, "branch_id": 2, "branch_code": "KOLAR", "branch_name": "Kolar", "username": settings.KOLAR_MANAGER_2_USERNAME, "password": settings.KOLAR_MANAGER_2_PASSWORD, "full_name": settings.KOLAR_MANAGER_2_NAME},
        {"id": 8, "branch_id": 2, "branch_code": "KOLAR", "branch_name": "Kolar", "username": settings.KOLAR_MANAGER_3_USERNAME, "password": settings.KOLAR_MANAGER_3_PASSWORD, "full_name": settings.KOLAR_MANAGER_3_NAME},
        # Udupi
        {"id": 9, "branch_id": 3, "branch_code": "UDUPI", "branch_name": "Udupi", "username": settings.UDUPI_MANAGER_1_USERNAME, "password": settings.UDUPI_MANAGER_1_PASSWORD, "full_name": settings.UDUPI_MANAGER_1_NAME},
        {"id": 10, "branch_id": 3, "branch_code": "UDUPI", "branch_name": "Udupi", "username": settings.UDUPI_MANAGER_2_USERNAME, "password": settings.UDUPI_MANAGER_2_PASSWORD, "full_name": settings.UDUPI_MANAGER_2_NAME},
    ]

    for m in managers_map:
        if m["username"] and m["username"].strip().lower() == cleaned:
            return m
        email_cand = f"{m['username'].strip().lower()}@sirisamruddhigold.com"
        if email_cand == cleaned:
            return m

    return None


def sync_managers_from_env(db: Session):
    """
    Synchronize Showroom Branch Managers from .env into the database.
    SUPER ADMIN is strictly ENV-based and is NEVER saved to the database.
    Any legacy super admin database record is automatically purged.
    """
    settings = get_live_env_settings()

    # 1. PURGE any legacy Super Admin database accounts (Enforce Zero-DB Admin Rule)
    try:
        legacy_admins = db.query(User).filter(User.role == "SUPER_ADMIN").all()
        if legacy_admins:
            for la in legacy_admins:
                db.delete(la)
            db.commit()
    except Exception:
        db.rollback()

    # 2. Sync Showroom Branch Managers
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

    for b_cfg in branches_config:
        branch = db.query(Branch).filter(Branch.code == b_cfg["code"]).first()
        if not branch:
            branch = Branch(
                name=b_cfg["name"],
                code=b_cfg["code"],
                city=b_cfg["city"],
                is_active=True,
            )
            db.add(branch)
            db.commit()
            db.refresh(branch)

        for mgr_name, mgr_user, mgr_pwd in b_cfg["managers"]:
            if not mgr_user or not mgr_pwd:
                continue

            mgr_user_clean = mgr_user.strip()
            mgr_name_clean = mgr_name.strip() if mgr_name else mgr_user_clean
            email_val = f"{mgr_user_clean.lower()}@sirisamruddhigold.com"

            existing_mgr = (
                db.query(User)
                .filter(
                    (func.lower(User.username) == mgr_user_clean.lower())
                    | (func.lower(User.email) == email_val.lower())
                )
                .first()
            )

            hashed_pwd = get_password_hash(mgr_pwd)

            if not existing_mgr:
                new_mgr = User(
                    branch_id=branch.id,
                    full_name=mgr_name_clean,
                    username=mgr_user_clean,
                    email=email_val,
                    hashed_password=hashed_pwd,
                    role="MANAGER",
                    is_active=True,
                )
                db.add(new_mgr)
                db.commit()
            else:
                existing_mgr.branch_id = branch.id
                existing_mgr.full_name = mgr_name_clean
                existing_mgr.username = mgr_user_clean
                existing_mgr.email = email_val
                existing_mgr.hashed_password = hashed_pwd
                existing_mgr.role = "MANAGER"
                existing_mgr.is_active = True
                db.commit()


class AuthService:
    def __init__(self, db: Session):
        self.db = db

    def authenticate_manager(self, login_data: LoginRequest, ip_address: Optional[str] = None) -> TokenResponse:
        """
        Authenticate showroom branch manager directly against server-side .env credentials
        with instant sub-millisecond response time and brute-force protection.
        """
        username_cleaned = login_data.username.strip()
        password_cleaned = login_data.password.strip()
        client_key = ip_address or "manager_login"
        user_key = f"mgr_{username_cleaned.lower()}"

        # 1. Rate Limiting Protection (Brute-force shield)
        is_allowed_ip, remaining_ip = check_login_rate_limit(client_key)
        is_allowed_user, remaining_user = check_login_rate_limit(user_key)
        if not is_allowed_ip or not is_allowed_user:
            wait_time = max(remaining_ip, remaining_user)
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Too many failed login attempts. Please wait {wait_time} seconds before trying again.",
            )

        # 2. Reject if attempting super admin via manager login
        live_settings = get_live_env_settings()
        if username_cleaned.lower() == live_settings.ADMIN_EMAIL.lower() or username_cleaned.lower() == "superadmin":
            record_failed_login(client_key)
            record_failed_login(user_key)
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Super Administrator access must be performed at /admin/login.",
            )

        # 3. Direct Fast .env Manager Directory Lookup
        env_mgr = get_env_manager_by_username(username_cleaned)

        is_valid = False
        branch_id = 1
        branch_code = "YELAHANKA"
        branch_name = "Yelahanka"
        full_name = username_cleaned
        email_val = f"{username_cleaned.lower()}@sirisamruddhigold.com"
        user_id = 1

        if env_mgr:
            # Fast constant-time comparison against .env password
            expected_pwd = env_mgr["password"]
            if expected_pwd and hmac.compare_digest(password_cleaned.encode("utf-8"), expected_pwd.encode("utf-8")):
                is_valid = True
                branch_code = env_mgr["branch_code"]
                branch_name = env_mgr["branch_name"]
                branch_id = env_mgr["branch_id"]
                full_name = env_mgr["full_name"]
                user_id = env_mgr["id"]
        else:
            # Fallback to database user if custom manager exists in DB
            user = (
                self.db.query(User)
                .filter(
                    (func.lower(User.username) == func.lower(username_cleaned))
                    | (func.lower(User.email) == func.lower(username_cleaned))
                )
                .first()
            )
            if user and verify_password(password_cleaned, user.hashed_password):
                is_valid = True
                user_id = user.id
                branch_id = user.branch_id
                full_name = user.full_name
                email_val = user.email or email_val
                branch = self.db.query(Branch).filter(Branch.id == user.branch_id).first()
                if branch:
                    branch_code = branch.code
                    branch_name = branch.name

        if not is_valid:
            record_failed_login(client_key)
            record_failed_login(user_key)
            try:
                audit = AuditLog(
                    branch_id=branch_id,
                    admin_username=username_cleaned,
                    action="Manager Login Failed",
                    entity="Auth",
                    ip_address=ip_address,
                    details=f"Invalid login credentials for {username_cleaned}",
                )
                self.db.add(audit)
                self.db.commit()
            except Exception:
                self.db.rollback()

            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid username or password. Please verify credentials.",
                headers={"WWW-Authenticate": "Bearer"},
            )

        # 4. Strict Branch Boundary Check (selected branch must match assigned branch)
        if login_data.branch_code:
            if branch_code.upper() != login_data.branch_code.strip().upper():
                record_failed_login(client_key)
                record_failed_login(user_key)
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Manager {full_name} is assigned to {branch_name} Showroom, not {login_data.branch_code}.",
                )

        # 5. Success - Clear failed attempts
        reset_failed_login(client_key)
        reset_failed_login(user_key)

        expires_delta = (
            timedelta(days=7)
            if login_data.remember_me
            else timedelta(minutes=live_settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        )
        token = create_access_token(
            subject=user_id,
            branch_id=branch_id,
            branch_code=branch_code,
            role="MANAGER",
            user_type="db_user",
            expires_delta=expires_delta,
            extra_claims={
                "branch_name": branch_name,
                "full_name": full_name,
                "username": username_cleaned,
                "email": email_val,
            },
        )

        try:
            audit = AuditLog(
                branch_id=branch_id,
                admin_id=user_id,
                admin_username=username_cleaned,
                action="Manager Login",
                entity="Auth",
                ip_address=ip_address,
                details=f"Manager {full_name} logged into {branch_name}",
            )
            self.db.add(audit)
            self.db.commit()
        except Exception:
            self.db.rollback()

        return TokenResponse(
            access_token=token,
            token_type="bearer",
            expires_in=int(expires_delta.total_seconds()),
            user_id=user_id,
            username=username_cleaned,
            full_name=full_name,
            email=email_val,
            role="MANAGER",
            user_type="db_user",
            branch_id=branch_id,
            branch_code=branch_code,
            branch_name=f"{branch_name} Showroom",
        )

        user.last_login = datetime.now(timezone.utc)
        self.db.commit()

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
            user_type="db_user",
            expires_delta=expires_delta,
            extra_claims={
                "username": user.username,
                "email": user.email,
                "full_name": user.full_name,
            },
        )

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

    def authenticate_super_admin(self, login_data: LoginRequest, ip_address: Optional[str] = None) -> TokenResponse:
        """
        Authenticate Super Admin strictly via server-side .env configuration.
        ZERO Database records are created, queried, or updated for the Super Admin.
        Enforces rate-limiting, generic error messages, and dual access/refresh JWT tokens.
        """
        live_settings = get_live_env_settings()
        email_or_user_clean = login_data.username.strip().lower()
        password_cleaned = login_data.password.strip()
        client_key = ip_address or "super_admin_login"

        # 1. Rate Limiting Check (Brute-force protection)
        is_allowed_ip, remaining_ip = check_login_rate_limit(client_key)
        is_allowed_id, remaining_id = check_login_rate_limit(email_or_user_clean)

        if not is_allowed_ip or not is_allowed_id:
            wait_time = max(remaining_ip, remaining_id)
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Too many failed login attempts. Please wait {wait_time} seconds before trying again.",
            )

        # 2. Strict Credential Verification against .env
        expected_email = live_settings.ADMIN_EMAIL.strip().lower()
        is_email_match = (
            email_or_user_clean == expected_email
            or email_or_user_clean == "superadmin"
            or email_or_user_clean == "admin@sirisamruddhi.com"
        )
        is_password_valid = verify_password(password_cleaned, live_settings.ADMIN_PASSWORD_HASH)

        if not is_email_match or not is_password_valid:
            record_failed_login(client_key)
            record_failed_login(email_or_user_clean)

            # Security Audit Trail (Never logs passwords or hashes)
            try:
                audit = AuditLog(
                    branch_id=None,
                    admin_id=None,
                    admin_username=email_or_user_clean,
                    action="Admin Login Failed",
                    entity="Auth",
                    ip_address=ip_address,
                    details="Invalid super admin credentials supplied.",
                )
                self.db.add(audit)
                self.db.commit()
            except Exception:
                self.db.rollback()

            # Generic 401 message (never reveals if email exists)
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password.",
                headers={"WWW-Authenticate": "Bearer"},
            )

        # 3. Successful Authentication - Clear failed attempts
        reset_failed_login(client_key)
        reset_failed_login(email_or_user_clean)

        # 4. Generate Short-Lived Access JWT (15 Minutes)
        access_delta = timedelta(minutes=live_settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            subject="env-super-admin",
            branch_id=None,
            branch_code="ALL",
            role="SUPER_ADMIN",
            user_type="env_admin",
            expires_delta=access_delta,
            extra_claims={
                "email": live_settings.ADMIN_EMAIL,
                "full_name": live_settings.ADMIN_NAME,
                "username": "superadmin",
                "role": "SUPER_ADMIN",
                "user_type": "env_admin",
            },
        )

        # 5. Generate Long-Lived Refresh JWT (7 Days)
        refresh_delta = timedelta(days=live_settings.REFRESH_TOKEN_EXPIRE_DAYS)
        refresh_token = create_refresh_token(
            subject="env-super-admin",
            role="SUPER_ADMIN",
            user_type="env_admin",
            expires_delta=refresh_delta,
            extra_claims={
                "email": live_settings.ADMIN_EMAIL,
            },
        )

        # 6. Audit Log Event (actor_type = env_admin)
        try:
            audit = AuditLog(
                branch_id=None,
                admin_id=None,
                admin_username=live_settings.ADMIN_EMAIL,
                action="Super Admin Login",
                entity="Auth",
                ip_address=ip_address,
                details=f"Super Admin authenticated via ENV security layer into Enterprise Command Center.",
            )
            self.db.add(audit)
            self.db.commit()
        except Exception:
            self.db.rollback()

        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
            expires_in=int(access_delta.total_seconds()),
            user_id=0,
            username="superadmin",
            full_name=live_settings.ADMIN_NAME,
            email=live_settings.ADMIN_EMAIL,
            role="SUPER_ADMIN",
            branch_id=0,
            branch_code="ALL",
            branch_name="All Branches (Enterprise HQ)",
        )

    def refresh_super_admin_token(self, refresh_token: str, ip_address: Optional[str] = None) -> TokenResponse:
        """
        Validate and rotate a Super Admin refresh token to issue a fresh access token.
        Revokes the previous refresh token to prevent replay attacks.
        """
        payload = decode_access_token(refresh_token)
        if not payload:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired refresh token. Please sign in again.",
            )

        if payload.get("token_type") != "refresh" or payload.get("user_type") != "env_admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Invalid token type for admin refresh.",
            )

        # Revoke the old refresh token (Rotation)
        revoke_token(refresh_token)

        live_settings = get_live_env_settings()

        access_delta = timedelta(minutes=live_settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        new_access_token = create_access_token(
            subject="env-super-admin",
            branch_id=None,
            branch_code="ALL",
            role="SUPER_ADMIN",
            user_type="env_admin",
            expires_delta=access_delta,
            extra_claims={
                "email": live_settings.ADMIN_EMAIL,
                "full_name": live_settings.ADMIN_NAME,
                "username": "superadmin",
                "role": "SUPER_ADMIN",
                "user_type": "env_admin",
            },
        )

        refresh_delta = timedelta(days=live_settings.REFRESH_TOKEN_EXPIRE_DAYS)
        new_refresh_token = create_refresh_token(
            subject="env-super-admin",
            role="SUPER_ADMIN",
            user_type="env_admin",
            expires_delta=refresh_delta,
            extra_claims={
                "email": live_settings.ADMIN_EMAIL,
            },
        )

        return TokenResponse(
            access_token=new_access_token,
            refresh_token=new_refresh_token,
            token_type="bearer",
            expires_in=int(access_delta.total_seconds()),
            user_id=0,
            username="superadmin",
            full_name=live_settings.ADMIN_NAME,
            email=live_settings.ADMIN_EMAIL,
            role="SUPER_ADMIN",
            branch_id=0,
            branch_code="ALL",
            branch_name="All Branches (Enterprise HQ)",
        )

    authenticate_admin = authenticate_super_admin

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

    def get_super_admin_profile(self) -> ManagerProfile:
        """Return Super Admin identity directly from server-side environment configuration."""
        live_settings = get_live_env_settings()
        return ManagerProfile(
            id=0,
            branch_id=0,
            branch_code="ALL",
            branch_name="All Branches (Enterprise HQ)",
            username="superadmin",
            full_name=live_settings.ADMIN_NAME,
            email=live_settings.ADMIN_EMAIL,
            role="SUPER_ADMIN",
            is_active=True,
        )

    get_admin_profile = get_super_admin_profile
