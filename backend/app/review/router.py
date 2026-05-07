from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from bson import ObjectId
from app.auth.dependencies import get_current_user
from app.models import UserRole, VerdictType, AuditActionType, doc_to_dict
from app.database import get_db
from app.audit.service import log_event

router = APIRouter(tags=["Review Queue"])


class ReviewDecision(BaseModel):
    decision: VerdictType
    reasoning: str
    notes: Optional[str] = None


@router.get("/tenders/{tender_id}/review-queue")
async def get_review_queue(
    tender_id: str,
    current_user=Depends(get_current_user),
):
    """All NEEDS_REVIEW bidders pending officer decision, enriched with combined criterion details."""
    db = get_db()
    cursor = db.verdicts.find({
        "tender_id": tender_id,
        "verdict": VerdictType.NEEDS_REVIEW.value,
        "is_human_reviewed": False,
    }).sort("created_at", 1)
    
    verdicts = [doc_to_dict(d) async for d in cursor]
    
    # Group by bidder_id
    bidders_map = {}
    for v in verdicts:
        bidder_id = v["bidder_id"]
        if bidder_id not in bidders_map:
            bidders_map[bidder_id] = {
                "id": bidder_id,  # Bidder ID acts as item ID for the frontend
                "bidder_id": bidder_id,
                "bidder_name": v.get("bidder_name", "Unknown"),
                "verdicts": []
            }
        bidders_map[bidder_id]["verdicts"].append(v)
    
    # Generate the combined reasoning for each bidder
    items = []
    for bidder_id, data in bidders_map.items():
        combined_reason = "Criterion Assessment Results:\n"
        for v in data["verdicts"]:
            desc = v.get("criterion_description", "Unknown Criterion")
            # Use actual effective_verdict; fall back to verdict field
            eff = v.get("effective_verdict") or v.get("verdict", "")
            if eff == "ELIGIBLE":
                symbol = "✓ Pass"
            elif eff == "INELIGIBLE":
                symbol = "✗ Fail"
            else:
                symbol = "⚠ Needs Review"
            combined_reason += f"• {desc}: {symbol}\n"
        
        data["needs_review_reason"] = combined_reason.strip()
        data["reasoning"] = combined_reason.strip()
        data["criterion_description"] = "Bidder Overall Assessment"
        items.append(data)

    return {"tender_id": tender_id, "pending_review_count": len(items), "items": items}


@router.post("/tenders/{tender_id}/review/{bidder_or_verdict_id}")
async def submit_review_decision(
    tender_id: str,
    bidder_or_verdict_id: str,
    body: ReviewDecision,
    current_user=Depends(get_current_user),
):
    """Officer submits ELIGIBLE or INELIGIBLE decision for all NEEDS_REVIEW cases of a bidder."""
    db = get_db()
    now = datetime.utcnow()
    
    # Check if this ID is a bidder
    bidder = await db.bidders.find_one({"_id": ObjectId(bidder_or_verdict_id), "tender_id": tender_id})
    
    if bidder:
        update = {
            "human_verdict": body.decision.value,
            "human_reasoning": body.reasoning,
            "human_notes": body.notes,
            "is_human_reviewed": True,
            "reviewed_by": current_user.get("username"),
            "reviewed_by_id": current_user["id"],
            "reviewed_at": now,
            "effective_verdict": body.decision.value,
        }
        await db.verdicts.update_many(
            {
                "bidder_id": str(bidder["_id"]),
                "tender_id": tender_id,
                "verdict": VerdictType.NEEDS_REVIEW.value,
                "is_human_reviewed": False
            },
            {"$set": update}
        )
        await _recompute_bidder_verdict(tender_id, str(bidder["_id"]), db)
        return {"message": "Review decision recorded for all pending criteria", "effective_verdict": body.decision.value}
    else:
        # Fallback to single verdict review
        verdict = await db.verdicts.find_one({"_id": ObjectId(bidder_or_verdict_id), "tender_id": tender_id})
        if not verdict:
            raise HTTPException(404, "Verdict or Bidder not found")
        if verdict.get("verdict") != VerdictType.NEEDS_REVIEW.value:
            raise HTTPException(400, "Only NEEDS_REVIEW verdicts can be reviewed")
        
        old_state = doc_to_dict(verdict)
        verdict_id = str(verdict["_id"])
            
        update = {
            "human_verdict": body.decision.value,
            "human_reasoning": body.reasoning,
            "human_notes": body.notes,
            "is_human_reviewed": True,
            "reviewed_by": current_user.get("username"),
            "reviewed_by_id": current_user["id"],
            "reviewed_at": now,
            "effective_verdict": body.decision.value,
        }
        await db.verdicts.update_one({"_id": ObjectId(bidder_or_verdict_id)}, {"$set": update})
        await _recompute_bidder_verdict(tender_id, str(verdict["bidder_id"]), db)

        await log_event(
            AuditActionType.HUMAN_OVERRIDE, "verdict", verdict_id,
            user_id=current_user["id"], user_name=current_user.get("username"),
            user_role=current_user.get("role"),
            description=(f"Officer overrode NEEDS_REVIEW → {body.decision.value} "
                         f"for bidder '{verdict.get('bidder_name')}' / criterion '{verdict.get('criterion_description', '')[:60]}'"),
            before_state=old_state,
            after_state=update,
        )
        return {"message": "Review decision recorded", "effective_verdict": body.decision.value}


async def _recompute_bidder_verdict(tender_id: str, bidder_id: str, db) -> None:
    """After a human review, recompute the bidder's overall verdict."""
    cursor = db.verdicts.find({"tender_id": tender_id, "bidder_id": bidder_id})
    verdicts = [d async for d in cursor]
    summary = {"eligible": 0, "ineligible": 0, "needs_review": 0, "total": len(verdicts)}
    for v in verdicts:
        eff = v.get("effective_verdict") or v.get("verdict")
        if eff == VerdictType.ELIGIBLE.value:
            summary["eligible"] += 1
        elif eff == VerdictType.INELIGIBLE.value:
            summary["ineligible"] += 1
        else:
            summary["needs_review"] += 1

    if summary["needs_review"] > 0:
        overall = VerdictType.NEEDS_REVIEW.value
    elif summary["ineligible"] > 0:
        overall = VerdictType.INELIGIBLE.value
    else:
        overall = VerdictType.ELIGIBLE.value

    await db.bidders.update_one(
        {"_id": ObjectId(bidder_id)},
        {"$set": {"overall_verdict": overall, "verdict_summary": summary}},
    )
