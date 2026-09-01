from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional, Union, Set
import time
import bcrypt
from jose import jwt, JWTError
from backend.app.core.config import settings

# In-memory Token Revocation / Blacklist Registry (for revoked JWTs & logged out sessions)
_REVOKED_TOKENS: Set[str] = set()

# In-memory Rate Limiting Registry for brute-force protection
# Format: { "key": { "attempts": int, "blocked_until": float, "last_attempt": float } }
_LOGIN_ATTEMPTS: Dict[str, Dict[str, Any]] = {}


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain text password against a bcrypt hashed password string or direct string match."""
    try:
        if not plain_password or not hashed_password:
            return False
        if plain_password == hashed_password:
            return True
        password_bytes = plain_password.encode("utf-8")[:72]
        hash_bytes = hashed_password.encode("utf-8")
        return bcrypt.checkpw(password_bytes, hash_bytes)
    except Exception:
        return False


def get_password_hash(password: str) -> str:
    """Hash a password securely using bcrypt (12 rounds)."""
    password_bytes = password.encode("utf-8")[:72]
    salt = bcrypt.gensalt(rounds=12)
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed.decode("utf-8")


def create_access_token(
    subject: Union[str, Any],
    branch_id: Optional[int] = None,
    branch_code: str = "ALL",
    role: str = "SUPER_ADMIN",
    user_type: str = "env_admin",
    expires_delta: Optional[timedelta] = None,
    extra_claims: Optional[Dict[str, Any]] = None,
) -> str:
    """Generate a short-lived signed JWT access token."""
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode = {
        "sub": str(subject),
        "branch_id": branch_id,
        "branch_code": branch_code,
        "role": role,
        "user_type": user_type,
        "token_type": "access",
        "exp": expire,
        "iat": datetime.now(timezone.utc),
    }

    if extra_claims:
        to_encode.update(extra_claims)

    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    return encoded_jwt


def create_refresh_token(
    subject: Union[str, Any],
    role: str = "SUPER_ADMIN",
    user_type: str = "env_admin",
    expires_delta: Optional[timedelta] = None,
    extra_claims: Optional[Dict[str, Any]] = None,
) -> str:
    """Generate a long-lived signed JWT refresh token."""
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)

    to_encode = {
        "sub": str(subject),
        "role": role,
        "user_type": user_type,
        "token_type": "refresh",
        "exp": expire,
        "iat": datetime.now(timezone.utc),
    }

    if extra_claims:
        to_encode.update(extra_claims)

    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    return encoded_jwt


def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    """Decode, validate signature & expiration, and verify token is not revoked."""
    if not token or is_token_revoked(token):
        return None
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        return payload
    except JWTError:
        return None


def revoke_token(token: str) -> None:
    """Revoke a token by adding to the in-memory blacklist."""
    if token:
        _REVOKED_TOKENS.add(token.strip())


def is_token_revoked(token: str) -> bool:
    """Check if token is in revocation list."""
    return token.strip() in _REVOKED_TOKENS if token else False


# =========================================================================
# Rate Limiting / Brute-Force Defense
# =========================================================================
def check_login_rate_limit(identifier: str, max_attempts: int = 5, cooldown_seconds: int = 300) -> tuple[bool, int]:
    """
    Check if the identifier (e.g. IP or email) is currently blocked due to repeated failures.
    Returns: (is_allowed: bool, remaining_cooldown_seconds: int)
    """
    now = time.time()
    record = _LOGIN_ATTEMPTS.get(identifier)

    if not record:
        return True, 0

    blocked_until = record.get("blocked_until", 0)
    if now < blocked_until:
        return False, int(blocked_until - now)

    # If cooldown expired, reset attempts
    if blocked_until and now >= blocked_until:
        _LOGIN_ATTEMPTS.pop(identifier, None)
        return True, 0

    return True, 0


def record_failed_login(identifier: str, max_attempts: int = 5, cooldown_seconds: int = 300) -> int:
    """
    Record a failed login attempt. If attempts exceed max_attempts, activates cooldown block.
    Returns current failure count.
    """
    now = time.time()
    record = _LOGIN_ATTEMPTS.setdefault(identifier, {"attempts": 0, "blocked_until": 0, "last_attempt": now})
    record["attempts"] += 1
    record["last_attempt"] = now

    if record["attempts"] >= max_attempts:
        record["blocked_until"] = now + cooldown_seconds

    return record["attempts"]


def reset_failed_login(identifier: str) -> None:
    """Clear failed login counter upon successful authentication across all permutations."""
    if not identifier:
        return
    clean = identifier.strip().lower()
    keys_to_remove = [
        identifier,
        clean,
        f"mgr_{clean}",
        f"user_{clean}",
    ]
    for k in keys_to_remove:
        _LOGIN_ATTEMPTS.pop(k, None)
    # Also pop any keys containing the clean username
    for existing_key in list(_LOGIN_ATTEMPTS.keys()):
        if clean in existing_key.lower():
            _LOGIN_ATTEMPTS.pop(existing_key, None)
