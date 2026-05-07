"""
Single-bidder evaluation task.
Re-runs the full criterion × document evaluation for ONE bidder.
Existing verdicts for that bidder are deleted and replaced.
"""
import logging
from datetime import datetime
from typing import Dict, List

from app.database import get_db
from app.models import VerdictType, JobStatus, AuditActionType
from app.jobs.service import update_job
from app.tenders.service import get_tender
from app.bidders.service import get_bidder, update_bidder_verdict, update_bidder_status
from app.documents.service import get_document
from app.ai.evidence_evaluator import evaluate_criterion
from app.audit.service import log_event

logger = logging.getLogger(__name__)


def _compute_overall_verdict(verdicts: List[Dict]) -> tuple:
    """
    Mandatory-aware verdict rollup.
    - INELIGIBLE only when a *mandatory* criterion fails.
    - Optional criterion failure → NEEDS_REVIEW.
    - Any NEEDS_REVIEW → overall NEEDS_REVIEW.
    - All ELIGIBLE → ELIGIBLE.
    """
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
        return VerdictType.NEEDS_REVIEW.value, summary
    if summary["ineligible"] > 0:
        return VerdictType.INELIGIBLE.value, summary
    return VerdictType.ELIGIBLE.value, summary


async def run_single_bidder_evaluation(
    tender_id: str,
    bidder_id: str,
    job_id: str,
    user: dict,
) -> None:
    """Re-evaluate all criteria for a single bidder. Replaces existing verdicts."""
    db = get_db()
    try:
        await update_job(job_id, JobStatus.RUNNING, 5, "Loading tender and bidder...")

        tender = await get_tender(tender_id)
        if not tender:
            raise ValueError("Tender not found")

        criteria = tender.get("criteria", [])
        if not criteria:
            raise ValueError("No criteria found. Extract criteria first.")

        bidder = await get_bidder(bidder_id)
        if not bidder or bidder.get("tender_id") != tender_id:
            raise ValueError("Bidder not found for this tender")

        await update_bidder_status(bidder_id, "processing")

        # Delete existing verdicts for this bidder
        del_result = await db.verdicts.delete_many(
            {"tender_id": tender_id, "bidder_id": bidder_id}
        )
        logger.info(f"Deleted {del_result.deleted_count} existing verdicts for bidder {bidder_id}")

        # Fetch bidder documents
        doc_ids = [d["document_id"] for d in bidder.get("documents", [])]
        docs = []
        for doc_id in doc_ids:
            doc = await get_document(doc_id)
            if doc:
                docs.append(doc)

        bidder_verdicts = []
        total = len(criteria)

        for c_idx, criterion in enumerate(criteria):
            try:
                result = await evaluate_criterion(criterion, docs)

                # Mandatory-aware: optional + INELIGIBLE → NEEDS_REVIEW
                verdict_val = result["verdict"]
                needs_review_reason = result.get("needs_review_reason")
                if (
                    verdict_val == VerdictType.INELIGIBLE.value
                    and not criterion.get("is_mandatory", True)
                ):
                    verdict_val = VerdictType.NEEDS_REVIEW.value
                    needs_review_reason = (
                        "Criterion is optional and evidence is insufficient. "
                        "Flagged for human review instead of automatic disqualification."
                    )

                verdict_doc = {
                    "tender_id": tender_id,
                    "bidder_id": bidder_id,
                    "bidder_name": bidder["name"],
                    "criterion_id": criterion["criterion_id"],
                    "criterion_description": criterion["description"],
                    "criterion_type": criterion.get("criterion_type"),
                    "is_mandatory": criterion.get("is_mandatory", True),
                    "verdict": verdict_val,
                    "effective_verdict": verdict_val,
                    "extracted_value": result.get("extracted_value"),
                    "extracted_value_normalized": result.get("extracted_value_normalized"),
                    "source_text_span": result.get("source_text_span"),
                    "source_document_id": result.get("source_document_id"),
                    "source_document_filename": result.get("source_document_filename"),
                    "reasoning": result.get("reasoning"),
                    "confidence_score": result.get("confidence_score"),
                    "confidence_band": result.get("confidence_band"),
                    "needs_review_reason": needs_review_reason,
                    "ocr_confidence": result.get("ocr_confidence"),
                    "llm_model": result.get("llm_model"),
                    "is_human_reviewed": False,
                    "human_verdict": None,
                    "human_reasoning": None,
                    "created_at": datetime.utcnow(),
                }
                ins = await db.verdicts.insert_one(verdict_doc)
                verdict_doc["id"] = str(ins.inserted_id)
                verdict_doc.pop("_id", None)
                bidder_verdicts.append(verdict_doc)

                await log_event(
                    AuditActionType.VERDICT_CREATED, "verdict", str(ins.inserted_id),
                    user_id=user["id"], user_name=user.get("username"),
                    description=(
                        f"[Re-eval] {bidder['name']} / {criterion['description'][:60]}: "
                        f"{verdict_val} (conf: {result.get('confidence_score', 0):.0%})"
                    ),
                    after_state=verdict_doc,
                )
            except Exception as e:
                logger.error(f"Re-eval error: bidder={bidder_id} crit={criterion['criterion_id']}: {e}")
                
                # Check if it's a rate limit or a more specific AI error
                err_str = str(e)
                if "rate limit" in err_str.lower():
                    reasoning = "The AI evaluation service is currently busy. To maintain accuracy, this criterion has been queued for manual verification."
                    review_reason = "AI service rate limit reached. Manual review required to ensure timely evaluation."
                else:
                    reasoning = f"Automated evaluation encountered a technical discrepancy ({err_str}). Manual check recommended."
                    review_reason = f"System-level evaluation discrepancy: {err_str}. Flagged for manual audit."

                fallback = {
                    "tender_id": tender_id, "bidder_id": bidder_id,
                    "bidder_name": bidder["name"],
                    "criterion_id": criterion["criterion_id"],
                    "criterion_description": criterion["description"],
                    "is_mandatory": criterion.get("is_mandatory", True),
                    "verdict": VerdictType.NEEDS_REVIEW.value,
                    "effective_verdict": VerdictType.NEEDS_REVIEW.value,
                    "reasoning": reasoning,
                    "needs_review_reason": review_reason,
                    "confidence_score": 0.0, "is_human_reviewed": False,
                    "created_at": datetime.utcnow(),
                }
                ins = await db.verdicts.insert_one(fallback)
                fallback["id"] = str(ins.inserted_id)
                bidder_verdicts.append(fallback)

            pct = 10 + int(((c_idx + 1) / total) * 85)
            await update_job(job_id, progress_pct=pct,
                             progress_message=f"Evaluated {c_idx + 1}/{total} criteria")

        overall, summary = _compute_overall_verdict(bidder_verdicts)
        await update_bidder_verdict(bidder_id, overall, summary)
        await update_bidder_status(bidder_id, "evaluated")
        await update_job(job_id, JobStatus.COMPLETED, 100,
                         f"Re-evaluation complete — overall: {overall}")

    except Exception as e:
        logger.error(f"Single-bidder evaluation failed: bidder={bidder_id}: {e}")
        await update_job(job_id, JobStatus.FAILED, error_message=str(e))
