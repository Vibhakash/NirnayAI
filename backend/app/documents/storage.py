import os
import uuid
import aiofiles
from pathlib import Path
from fastapi import UploadFile, HTTPException
from app.config import get_settings

settings = get_settings()


def _get_upload_path() -> Path:
    path = Path(settings.upload_dir)
    path.mkdir(parents=True, exist_ok=True)
    return path


async def save_upload(file: UploadFile, subfolder: str = "") -> dict:
    """Save uploaded file, return metadata dict with path and filename."""
    if file.size and file.size > settings.max_file_size_bytes:
        raise HTTPException(413, f"File exceeds {settings.max_file_size_mb}MB limit")

    base = _get_upload_path() / subfolder
    base.mkdir(parents=True, exist_ok=True)

    ext = Path(file.filename).suffix.lower()
    allowed = {".pdf", ".docx", ".doc", ".jpg", ".jpeg", ".png", ".tiff", ".tif", ".bmp"}
    if ext not in allowed:
        raise HTTPException(400, f"Unsupported file type: {ext}. Allowed: {allowed}")

    unique_name = f"{uuid.uuid4().hex}{ext}"
    dest = base / unique_name

    async with aiofiles.open(dest, "wb") as f:
        content = await file.read()
        await f.write(content)

    return {
        "original_filename": file.filename,
        "stored_filename": unique_name,
        "file_path": str(dest),
        "file_size_bytes": len(content),
        "content_type": file.content_type,
        "extension": ext,
    }


def get_file_path(stored_filename: str, subfolder: str = "") -> Path:
    return _get_upload_path() / subfolder / stored_filename


def delete_file(file_path: str) -> None:
    try:
        Path(file_path).unlink(missing_ok=True)
    except Exception:
        pass
