from fastapi import APIRouter, Depends, Query
from typing import Optional, List
from datetime import datetime
from app.database import get_db
from app.auth.dependencies import get_current_user
from app.models import UserRole, doc_to_dict

router = APIRouter(prefix="/audit-log", tags=["Audit Log"])


@router.get("")
async def get_audit_log(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    action_type: Optional[str] = None,
    entity_type: Optional[str] = None,
    entity_id: Optional[str] = None,
    user_id: Optional[str] = None,
    from_date: Optional[datetime] = None,
    to_date: Optional[datetime] = None,
    db=Depends(get_db),
    current_user=Depends(get_current_user),):
    """Paginated, filterable audit log. Auditors and reviewing officers only."""
    query: dict = {}
    if action_type:
        query["action_type"] = action_type
    if entity_type:
        query["entity_type"] = entity_type
    if entity_id:
        query["entity_id"] = entity_id
    if user_id:
        query["user_id"] = user_id
    if from_date or to_date:
        query["timestamp"] = {}
        if from_date:
            query["timestamp"]["$gte"] = from_date
        if to_date:
            query["timestamp"]["$lte"] = to_date

    skip = (page - 1) * page_size
    total = await db.audit_log.count_documents(query)
    cursor = db.audit_log.find(query).sort("timestamp", -1).skip(skip).limit(page_size)
    entries = [doc_to_dict(doc) async for doc in cursor]

    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "entries": entries,
    }


@router.get("/export")
async def export_audit_log(
    entity_id: Optional[str] = None,
    db=Depends(get_db),
    current_user=Depends(get_current_user),):
    """Export full audit log as list (auditors only). For CSV export from frontend."""
    query = {}
    if entity_id:
        query["entity_id"] = entity_id
    cursor = db.audit_log.find(query).sort("timestamp", -1)
    entries = [doc_to_dict(doc) async for doc in cursor]
    return {"entries": entries, "count": len(entries)}
