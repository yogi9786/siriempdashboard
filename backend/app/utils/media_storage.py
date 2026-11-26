"""Shared media directory resolution and safe file lookup helpers."""

import os
from typing import List, Optional
from backend.app.core.config import settings

# Canonical directories: backend/uploads and project-root/uploads alongside configured MEDIA_DIR
_UTILS_DIR = os.path.dirname(os.path.abspath(__file__))
_BACKEND_DIR = os.path.abspath(os.path.join(_UTILS_DIR, "..", ".."))
_ROOT_DIR = os.path.abspath(os.path.join(_BACKEND_DIR, ".."))


def get_canonical_media_dir() -> str:
    """Return the canonical absolute media directory (defaulting relative paths under backend/)."""
    raw = (settings.MEDIA_DIR or "uploads").strip() or "uploads"
    if os.path.isabs(raw):
        return os.path.abspath(raw)
    return os.path.abspath(os.path.join(_BACKEND_DIR, raw))


def get_media_search_dirs() -> List[str]:
    """Return ordered unique existing or configured directories where uploaded media may reside."""
    candidates = [
        get_canonical_media_dir(),
        os.path.abspath(settings.MEDIA_DIR or "uploads"),
        os.path.join(_BACKEND_DIR, "uploads"),
        os.path.join(_ROOT_DIR, "uploads"),
        os.path.join(_BACKEND_DIR, "media"),
    ]
    unique_dirs: List[str] = []
    seen = set()
    for path in candidates:
        norm = os.path.normcase(os.path.abspath(path))
        if norm not in seen:
            seen.add(norm)
            unique_dirs.append(os.path.abspath(path))
    return unique_dirs


def normalize_relative_media_path(file_url: str) -> Optional[str]:
    """Strip URL prefixes (/api/v1/uploads/, /uploads/, /media/, etc.) and reject path traversal."""
    if not file_url:
        return None
    cleaned = file_url.split("?")[0].split("#")[0].strip().replace("\\", "/")
    for prefix in ("/api/v1/uploads/", "api/v1/uploads/", "/api/v1/media/", "api/v1/media/",
                   "/api/uploads/", "api/uploads/", "/api/media/", "api/media/",
                   "/uploads/", "uploads/", "/media/", "media/"):
        if cleaned.startswith(prefix):
            cleaned = cleaned[len(prefix):]
            break
    cleaned = cleaned.lstrip("/")
    if not cleaned or ".." in cleaned.split("/"):
        return None
    return cleaned


def resolve_media_file_path(file_url: str) -> Optional[str]:
    """Safely resolve a stored file_url or relative path to an existing file on disk across upload roots."""
    rel_path = normalize_relative_media_path(file_url)
    if not rel_path:
        return None

    rel_parts = [part for part in rel_path.split("/") if part]
    if not rel_parts:
        return None

    search_dirs = get_media_search_dirs()
    for base_dir in search_dirs:
        candidate = os.path.abspath(os.path.join(base_dir, *rel_parts))
        # Ensure resolved path remains strictly inside base_dir
        try:
            common = os.path.commonpath([base_dir, candidate])
        except ValueError:
            continue
        if common != base_dir:
            continue
        if os.path.isfile(candidate):
            return candidate

    # Fallback by basename across upload roots (handles legacy nested vs flat payslip/photo saves)
    basename = rel_parts[-1]
    if basename and len(rel_parts) == 1:
        for base_dir in search_dirs:
            for sub in ("payslips", "outdoor/photos", "outdoor"):
                candidate = os.path.abspath(os.path.join(base_dir, sub, basename))
                try:
                    if os.path.commonpath([base_dir, candidate]) == base_dir and os.path.isfile(candidate):
                        return candidate
                except ValueError:
                    continue
    elif basename:
        for base_dir in search_dirs:
            candidate = os.path.abspath(os.path.join(base_dir, basename))
            try:
                if os.path.commonpath([base_dir, candidate]) == base_dir and os.path.isfile(candidate):
                    return candidate
            except ValueError:
                continue

    return None
