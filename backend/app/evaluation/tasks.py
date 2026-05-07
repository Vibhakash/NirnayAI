"""
Evaluation background task — the core engine of NirnayAI.
For each bidder × criterion pair: fetch docs, call LLM, store verdict, audit log.

Key rule: mandatory-aware verdict rollup.
  - A MANDATORY criterion failure → INELIGIBLE.
  - An OPTIONAL criterion failure → NEEDS_REVIEW (never silent disqualification).
"""
import logging
from datetime import datetime
from typing import Dict, List
from bson import ObjectId

from app.database import get_db
from app.models import VerdictType, JobStatus, TenderStatus, AuditActionType
from app.jobs.service import update_job
from app.tenders.service import update_tender_status, get_tender
from app.bidders.service import list_bidders, update_bidder_verdict, get_bidder, update_bidder_status
from app.documents.service import get_document
from app.ai.evidence_evaluator import evaluate_criterion
from app.audit.service import log_event

logger = logging.getLogger(__name__)


def _compute_overall_verdict(verdicts: List[Dict]) -> tuple:
    """
    Mandatory-aware overall verdict rollup.

    Rule:
      - INELIGIBLE only when a *mandatory* criterion has INELIGIBLE effective verdict.
      - Optional criterion that is INELIGIBLE stays as NEEDS_REVIEW in the rollup.
      - Any NEEDS_REVIEW → overall NEEDS_REVIEW.
      - All ELIGIBLE → ELIGIBLE.
    """
    summary = {"eligible": 0, "ineligible": 0, "needs_review": 0, "total": len(verdicts)}
    has_mandatory_ineligible = False

    for v in verdicts:
        eff = v.get("effective_verdict") or v.get("verdict")
        if eff == VerdictType.ELIGIBLE.value:
            summary["eligible"] += 1
        elif eff == VerdictType.INELIGIBLE.value:
            summary["ineligible"] += 1
            if v.get("is_mandatory", True):
                has_mandatory_ineligible = True
        elif eff == VerdictType.NEEDS_REVIEW.value:
            summary["needs_review"] += 1

    if summary["needs_review"] > 0:
        return VerdictType.NEEDS_REVIEW.value, summary
    if has_mandatory_ineligible:
        return VerdictType.INELIGIBLE.value, summary
    if summary["ineligible"] > 0:
        # Optional-only failures → review, not disqualify
        return VerdictType.NEEDS_REVIEW.value, summary
    return VerdictType.ELIGIBLE.value, summary


async def run_evaluation(tender_id: str, job_id: str, user: dict) -> None:
    """Full evaluation pipeline for a tender — evaluates all bidders × all criteria."""
    db = get_db()
    try:
        await update_job(job_id, JobStatus.RUNNING, 5, "Loading tender and bidders...")
        await update_tender_status(tender_id, TenderStatus.EVALUATING)

        tender = await get_tender(tender_id)
        if not tender:
            raise ValueError("Tender not found")

        criteria = tender.get("criteria", [])
        if not criteria:
            raise ValueError("No criteria found. Extract criteria before evaluation.")

        bidders = await list_bidders(tender_id)
        if not bidders:
            raise ValueError("No bidders found for this tender.")

        # Advisory warning if criteria not yet confirmed
        if not tender.get("confirmed_by"):
            logger.warning(f"Tender {tender_id} criteria not confirmed by officer — proceeding anyway.")

        await log_event(
            AuditActionType.EVALUATION_STARTED, "tender", tender_id,
            user_id=user["id"], user_name=user.get("username"),
            description=(
                f"Evaluation started: {len(bidders)} bidders × {len(criteria)} criteria "
                f"= {len(bidders)*len(criteria)} evaluations"
                + (" [UNCONFIRMED CRITERIA]" if not tender.get("confirmed_by") else "")
            ),
        )

        total_pairs = len(bidders) * len(criteria)
        completed_pairs = 0

        for b_idx, bidder in enumerate(bidders):
            bidder_id = bidder["id"]
            await update_bidder_status(bidder_id, "processing")

            # Fetch all processed documents for this bidder
            doc_ids = [d["document_id"] for d in bidder.get("documents", [])]
            docs = []
            for doc_id in doc_ids:
                doc = await get_document(doc_id)
                if doc:
                    docs.append(doc)

            bidder_verdicts = []
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
                            f"Verdict for {bidder['name']} / {criterion['description'][:60]}: "
                            f"{verdict_val} [{result.get('confidence_band','?')}] "
                            f"(confidence: {result.get('confidence_score', 0):.0%})"
                        ),
                        after_state=verdict_doc,
                    )
                except Exception as e:
                    logger.error(
                        f"Eval failed for bidder {bidder_id} criterion {criterion['criterion_id']}: {e}",
                        exc_info=True
                    )
                    # Never silently skip — log as NEEDS_REVIEW
                    fallback = {
                        "tender_id": tender_id, "bidder_id": bidder_id,
                        "bidder_name": bidder["name"],
                        "criterion_id": criterion["criterion_id"],
                        "criterion_description": criterion["description"],
                        "is_mandatory": criterion.get("is_mandatory", True),
                        "verdict": VerdictType.NEEDS_REVIEW.value,
                        "effective_verdict": VerdictType.NEEDS_REVIEW.value,
                        "reasoning": f"Evaluation error: {str(e)}",
                        "needs_review_reason": f"System error during evaluation: {str(e)}",
                        "confidence_score": 0.0,
                        "confidence_band": "UNKNOWN",
                        "is_human_reviewed": False,
                        "created_at": datetime.utcnow(),
                    }
                    ins = await db.verdicts.insert_one(fallback)
                    fallback["id"] = str(ins.inserted_id)
                    bidder_verdicts.append(fallback)

                completed_pairs += 1
                pct = 5 + int((completed_pairs / total_pairs) * 90)
                await update_job(
                    job_id, progress_pct=pct,
                    progress_message=f"Evaluated {completed_pairs}/{total_pairs} pairs",
                )

            overall, summary = _compute_overall_verdict(bidder_verdicts)
            await update_bidder_verdict(bidder_id, overall, summary)

        await update_tender_status(tender_id, TenderStatus.COMPLETED)
        await update_job(job_id, JobStatus.COMPLETED, 100, "Evaluation complete")

    except Exception as e:
        logger.error(f"Evaluation pipeline failed for tender {tender_id}: {e}")
        await update_job(job_id, JobStatus.FAILED, error_message=str(e))
        await update_tender_status(tender_id, TenderStatus.CRITERIA_READY)
