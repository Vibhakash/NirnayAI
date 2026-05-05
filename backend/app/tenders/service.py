from datetime import datetime
from typing import Optional, List, Dict, Any
from bson import ObjectId
from app.database import get_db
from app.models import TenderStatus, doc_to_dict


async def create_tender(title: str, user_id: str, department: str = None,
                         reference_number: str = None, description: str = None) -> Dict:
    db = get_db()
    doc = {
        "title": title,
        "department": department,
        "reference_number": reference_number,
        "description": description,
        "status": TenderStatus.UPLOADED.value,
        "document_id": None,
        "criteria": [],
        "created_by": user_id,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "signed_off_by": None,
        "signed_off_at": None,
    }
    result = await db.tenders.insert_one(doc)
    doc["id"] = str(result.inserted_id)
    doc.pop("_id", None)
    return doc


async def get_tender(tender_id: str) -> Optional[Dict]:
    db = get_db()
    doc = await db.tenders.find_one({"_id": ObjectId(tender_id)})
    return doc_to_dict(doc) if doc else None


async def list_tenders(user_id: str = None, page: int = 1, page_size: int = 20) -> Dict:
    db = get_db()
    query = {}
    skip = (page - 1) * page_size
    total = await db.tenders.count_documents(query)
    cursor = db.tenders.find(query).sort("created_at", -1).skip(skip).limit(page_size)
    items = [doc_to_dict(d) async for d in cursor]
    return {"total": total, "page": page, "page_size": page_size, "items": items}


async def update_tender_status(tender_id: str, status: TenderStatus) -> None:
    db = get_db()
    await db.tenders.update_one(
        {"_id": ObjectId(tender_id)},
        {"$set": {"status": status.value, "updated_at": datetime.utcnow()}},
    )


async def set_tender_document(tender_id: str, document_id: str) -> None:
    db = get_db()
    await db.tenders.update_one(
        {"_id": ObjectId(tender_id)},
        {"$set": {"document_id": document_id, "updated_at": datetime.utcnow()}},
    )


async def set_tender_criteria(tender_id: str, criteria: List[Dict]) -> None:
    db = get_db()
    await db.tenders.update_one(
        {"_id": ObjectId(tender_id)},
        {"$set": {"criteria": criteria, "updated_at": datetime.utcnow()}},
    )


async def add_criterion(tender_id: str, criterion: Dict) -> Dict:
    db = get_db()
    await db.tenders.update_one(
        {"_id": ObjectId(tender_id)},
        {"$push": {"criteria": criterion}, "$set": {"updated_at": datetime.utcnow()}},
    )
    return criterion


async def update_criterion(tender_id: str, criterion_id: str, updates: Dict,
                            editor_user: str) -> Optional[Dict]:
    db = get_db()
    tender = await get_tender(tender_id)
    if not tender:
        return None
    criteria = tender.get("criteria", [])
    updated = None
    for i, c in enumerate(criteria):
        if c.get("criterion_id") == criterion_id:
            criteria[i].update(updates)
            criteria[i]["edited"] = True
            criteria[i]["edited_by"] = editor_user
            criteria[i]["edited_at"] = datetime.utcnow().isoformat()
            updated = criteria[i]
            break
    if updated:
        await db.tenders.update_one(
            {"_id": ObjectId(tender_id)},
            {"$set": {"criteria": criteria, "updated_at": datetime.utcnow()}},
        )
    return updated


async def delete_criterion(tender_id: str, criterion_id: str) -> bool:
    db = get_db()
    result = await db.tenders.update_one(
        {"_id": ObjectId(tender_id)},
        {
            "$pull": {"criteria": {"criterion_id": criterion_id}},
            "$set": {"updated_at": datetime.utcnow()},
        },
    )
    return result.modified_count > 0


async def sign_off_tender(tender_id: str, officer_id: str, officer_name: str) -> None:
    db = get_db()
    await db.tenders.update_one(
        {"_id": ObjectId(tender_id)},
        {"$set": {
            "status": TenderStatus.SIGNED_OFF.value,
            "signed_off_by": officer_name,
            "signed_off_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
        }},
    )


async def confirm_criteria(tender_id: str, officer_id: str, officer_name: str) -> Optional[Dict]:
    """
    Officer confirms the AI-extracted criteria list is correct before evaluation.
    Sets confirmed_by / confirmed_at on the tender doc.
    Returns the updated tender, or None if not found.
    """
    db = get_db()
    now = datetime.utcnow()
    result = await db.tenders.update_one(
        {"_id": ObjectId(tender_id)},
        {"$set": {
            "confirmed_by": officer_name,
            "confirmed_at": now,
            "updated_at": now,
        }},
    )
    if result.matched_count == 0:
        return None
    return await get_tender(tender_id)

