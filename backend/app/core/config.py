import os
import sys
from typing import List, Union, Optional
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    APP_NAME: str = "Siri Samruddhi Gold Palace Management Dashboard"
    ENVIRONMENT: str = "development"
    LOG_LEVEL: str = "INFO"

    # Database
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/siridashboard"
    SQLITE_FALLBACK_URL: str = f"sqlite:///{os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))), 'database.db').replace('\\', '/')}"

    # JWT Authentication & Token Security
    JWT_SECRET_KEY: str = "siri_samruddhi_super_secret_jwt_key_gold_palace_2026_change_in_prod"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 2880  # Token valid for at least 2 days (48 hours = 2880 mins)
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7     # Long-lived refresh token (7 days)

    # CORS Configuration
    CORS_ORIGINS: Union[str, List[str]] = (
        "http://localhost:5173,http://localhost:5174,http://localhost:5175,http://localhost:3000,"
        "http://127.0.0.1:5173,http://127.0.0.1:5174,http://127.0.0.1:5175,http://127.0.0.1:3000"
    )

    @field_validator("CORS_ORIGINS", mode="after")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            return [i.strip() for i in v.split(",") if i.strip()]
        return v

    @field_validator("SQLITE_FALLBACK_URL", mode="after")
    @classmethod
    def assemble_sqlite_url(cls, v: str) -> str:
        if v.startswith("sqlite:///./") or v == "sqlite:///database.db":
            root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
            rel = v.replace("sqlite:///./", "").replace("sqlite:///", "")
            return f"sqlite:///{os.path.join(root, rel).replace('\\', '/')}"
        return v

    # Media / File Uploads
    MEDIA_DIR: str = "uploads"
    MAX_UPLOAD_SIZE_MB: int = 10

    # =========================================================================
    # Super Admin Authentication (ENV-Configured Identity — ZERO Database Storage)
    # =========================================================================
    ADMIN_EMAIL: str = "admin@sirisamruddhigold.com"
    ADMIN_PASSWORD_HASH: str = "$2b$12$27XfFp20Muke1gaOhT3Cnu2VaImTwDGQOev9zVdR8PcjlhdnwB9Sm"
    ADMIN_NAME: str = "Super Administrator"

    # Yelahanka Manager Accounts (Unique Names & Strong Passwords)
    MANAGER_1_NAME: str = "ADARSHA"
    MANAGER_1_USERNAME: str = "ADARSHA1234"
    MANAGER_1_PASSWORD: str = "ADARSHA@siri1234"

    MANAGER_2_NAME: str = "DILEEP H E"
    MANAGER_2_USERNAME: str = "DILEEP4321"
    MANAGER_2_PASSWORD: str = "DILEEP@siri4321"

    MANAGER_3_NAME: str = "BASAVARAJ BARADDI"
    MANAGER_3_USERNAME: str = "BASAVARAJ1234"
    MANAGER_3_PASSWORD: str = "BASAVARAJ@siri4567"

    MANAGER_4_NAME: str = "MANJUNATH P S"
    MANAGER_4_USERNAME: str = "MANJUNATH7654"
    MANAGER_4_PASSWORD: str = "MANJUNATH@siri4567"

    MANAGER_5_NAME: str = "VIJAY SARATHY"
    MANAGER_5_USERNAME: str = "VIJAY0987"
    MANAGER_5_PASSWORD: str = "VIJAY@siri7890"

    # Kolar Manager Accounts (Unique Names & Strong Passwords)
    KOLAR_MANAGER_1_NAME: str = "PRADEEP KUMAR B N"
    KOLAR_MANAGER_1_USERNAME: str = "PRADEEP1234"
    KOLAR_MANAGER_1_PASSWORD: str = "PRADEEP@siri1234"

    KOLAR_MANAGER_2_NAME: str = "ASLAM PASHA A"
    KOLAR_MANAGER_2_USERNAME: str = "ASLAM1234"
    KOLAR_MANAGER_2_PASSWORD: str = "ASLAM@siri1234"

    KOLAR_MANAGER_3_NAME: str = "SIVA R"
    KOLAR_MANAGER_3_USERNAME: str = "SIVA1234"
    KOLAR_MANAGER_3_PASSWORD: str = "SIVA@siri1234"

    # Udupi Manager Accounts (Unique Names & Strong Passwords)
    UDUPI_MANAGER_1_NAME: str = "SANDEEPA"
    UDUPI_MANAGER_1_USERNAME: str = "SANDEEPA1234"
    UDUPI_MANAGER_1_PASSWORD: str = "SANDEEPA@siri1234"

    UDUPI_MANAGER_2_NAME: str = "PRITHVIRAJ"
    UDUPI_MANAGER_2_USERNAME: str = "PRITHVIRAJ1234"
    UDUPI_MANAGER_2_PASSWORD: str = "PRITHVIRAJ@siri1234"


def validate_security_configuration(s: Settings) -> None:
    """
    Validate that critical security environment variables exist and are properly configured.
    Never outputs or leaks the raw values.
    """
    errors = []
    if not s.ADMIN_EMAIL or not s.ADMIN_EMAIL.strip():
        errors.append("ADMIN_EMAIL is missing or empty in .env.")
    if not s.ADMIN_PASSWORD_HASH or not s.ADMIN_PASSWORD_HASH.strip():
        errors.append("ADMIN_PASSWORD_HASH is missing or empty in .env.")
    if not s.JWT_SECRET_KEY or len(s.JWT_SECRET_KEY.strip()) < 16:
        errors.append("JWT_SECRET_KEY is missing or too short in .env.")

    if errors:
        sys.stderr.write("\n=======================================================\n")
        sys.stderr.write(" [FATAL CONFIGURATION ERROR] Security Startup Failed:\n")
        for err in errors:
            sys.stderr.write(f"  - {err}\n")
        sys.stderr.write("=======================================================\n\n")
        raise RuntimeError("Security configuration validation failed. Check server-side .env.")


settings = Settings()
validate_security_configuration(settings)
