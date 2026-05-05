from datetime import datetime
from typing import Optional, Any, Dict
from pydantic import BaseModel
from app.models import AuditActionType, doc_to_dict
from app.database import get_db


class AuditEntry(BaseModel):
    timestamp: datetime
    user_id: Optional[str]
    user_name: Optional[str]
    user_role: Optional[str]
    action_type: AuditActionType
    entity_type: str
    entity_id: Optional[str]
    description: str
    before_state: Optional[Dict[str, Any]] = None
    after_state: Optional[Dict[str, Any]] = None
    ip_address: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


async def log_event(
    action_type: AuditActionType,
    entity_type: str,
    entity_id: Optional[str] = None,
    description: str = "",
    user_id: Optional[str] = None,
    user_name: Optional[str] = None,
    user_role: Optional[str] = None,
    before_state: Optional[Dict] = None,
    after_state: Optional[Dict] = None,
    ip_address: Optional[str] = None,
    metadata: Optional[Dict] = None,
) -> str:
    """Append-only audit log insertion. Returns inserted document id."""
    db = get_db()
    entry = {
        "timestamp": datetime.utcnow(),
        "user_id": user_id,
        "user_name": user_name,
        "user_role": user_role,
        "action_type": action_type.value,
        "entity_type": entity_type,
        "entity_id": entity_id,
        "description": description,
        "before_state": before_state,
        "after_state": after_state,
        "ip_address": ip_address,
        "metadata": metadata,
    }
    result = await db.audit_log.insert_one(entry)
    return str(result.inserted_id)
