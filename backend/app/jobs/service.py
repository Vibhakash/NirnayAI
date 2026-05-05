from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel
from app.models import JobStatus, JobType
from app.database import get_db
from bson import ObjectId


async def create_job(
    tender_id: str,
    job_type: JobType,
    metadata: Optional[Dict[str, Any]] = None,
) -> str:
    db = get_db()
    doc = {
        "tender_id": tender_id,
        "job_type": job_type.value,
        "status": JobStatus.PENDING.value,
        "progress_pct": 0,
        "progress_message": "Queued",
        "error_message": None,
        "metadata": metadata or {},
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "completed_at": None,
    }
    result = await db.jobs.insert_one(doc)
    return str(result.inserted_id)


async def update_job(
    job_id: str,
    status: Optional[JobStatus] = None,
    progress_pct: Optional[int] = None,
    progress_message: Optional[str] = None,
    error_message: Optional[str] = None,
) -> None:
    db = get_db()
    update: Dict[str, Any] = {"updated_at": datetime.utcnow()}
    if status:
        update["status"] = status.value
        if status == JobStatus.COMPLETED:
            update["completed_at"] = datetime.utcnow()
            update["progress_pct"] = 100
    if progress_pct is not None:
        update["progress_pct"] = progress_pct
    if progress_message:
        update["progress_message"] = progress_message
    if error_message:
        update["error_message"] = error_message
    await db.jobs.update_one({"_id": ObjectId(job_id)}, {"$set": update})


async def get_job(job_id: str) -> Optional[Dict]:
    db = get_db()
    doc = await db.jobs.find_one({"_id": ObjectId(job_id)})
    if doc:
        doc["id"] = str(doc.pop("_id"))
    return doc
