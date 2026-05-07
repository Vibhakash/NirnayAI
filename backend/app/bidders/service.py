from datetime import datetime
from typing import Optional, List, Dict
from bson import ObjectId
from app.database import get_db
from app.models import doc_to_dict, VerdictType


async def create_bidder(tender_id: str, name: str, user_id: str,
                         contact_email: str = None, contact_person: str = None) -> Dict:
    db = get_db()
    doc = {
        "tender_id": tender_id,
        "name": name,
        "contact_email": contact_email,
        "contact_person": contact_person,
        "status": "pending",
        "documents": [],
        "overall_verdict": None,
        "verdict_summary": {"eligible": 0, "ineligible": 0, "needs_review": 0, "total": 0},
        "created_by": user_id,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }
    result = await db.bidders.insert_one(doc)
    doc["id"] = str(result.inserted_id)
    doc.pop("_id", None)
    return doc


async def get_bidder(bidder_id: str) -> Optional[Dict]:
    db = get_db()
    doc = await db.bidders.find_one({"_id": ObjectId(bidder_id)})
    return doc_to_dict(doc) if doc else None


async def list_bidders(tender_id: str) -> List[Dict]:
    db = get_db()
    cursor = db.bidders.find({"tender_id": tender_id}).sort("name", 1)
    return [doc_to_dict(d) async for d in cursor]


async def add_document_to_bidder(bidder_id: str, doc_meta: Dict) -> None:
    db = get_db()
    await db.bidders.update_one(
        {"_id": ObjectId(bidder_id)},
        {"$push": {"documents": doc_meta}, "$set": {"updated_at": datetime.utcnow()}},
    )


async def update_bidder_status(bidder_id: str, status: str) -> None:
    db = get_db()
    await db.bidders.update_one(
        {"_id": ObjectId(bidder_id)},
        {"$set": {"status": status, "updated_at": datetime.utcnow()}},
    )


async def update_bidder_verdict(bidder_id: str, overall_verdict: str, summary: Dict) -> None:
    db = get_db()
    await db.bidders.update_one(
        {"_id": ObjectId(bidder_id)},
        {"$set": {"overall_verdict": overall_verdict, "verdict_summary": summary,
                  "status": "completed", "updated_at": datetime.utcnow()}},
    )


async def delete_bidder(bidder_id: str) -> bool:
    db = get_db()
    result = await db.bidders.delete_one({"_id": ObjectId(bidder_id)})
    return result.deleted_count > 0
