"""Unified media & upload file serving router with fallback across upload directories."""

import mimetypes
from fastapi import APIRouter, HTTPException, Response
from fastapi.responses import FileResponse
from backend.app.utils.media_storage import resolve_media_file_path

media_router = APIRouter(tags=["Media"])


def _serve_resolved_media(file_path: str, response: Response) -> FileResponse:
    resolved = resolve_media_file_path(file_path)
    if not resolved:
        raise HTTPException(status_code=404, detail="Media file not found")
    media_type, _ = mimetypes.guess_type(resolved)
    response.headers["X-Frame-Options"] = "SAMEORIGIN"
    response.headers["Cache-Control"] = "public, max-age=3600"
    return FileResponse(
        resolved,
        media_type=media_type or "application/octet-stream",
        headers={
            "X-Frame-Options": "SAMEORIGIN",
            "Cache-Control": "public, max-age=3600",
        },
    )


@media_router.get("/uploads/{file_path:path}", include_in_schema=False)
def get_uploads_file(file_path: str, response: Response):
    return _serve_resolved_media(file_path, response)


@media_router.get("/media/{file_path:path}", include_in_schema=False)
def get_media_file(file_path: str, response: Response):
    return _serve_resolved_media(file_path, response)


@media_router.get("/api/v1/uploads/{file_path:path}", include_in_schema=False)
def get_api_uploads_file(file_path: str, response: Response):
    return _serve_resolved_media(file_path, response)


@media_router.get("/api/v1/media/{file_path:path}", include_in_schema=False)
def get_api_media_file(file_path: str, response: Response):
    return _serve_resolved_media(file_path, response)
