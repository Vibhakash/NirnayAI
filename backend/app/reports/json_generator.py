"""
JSON report generator.
Produces a structured, machine-readable report of the tender evaluation.
Intended for frontend rendering and for integration with external systems.
"""
from datetime import datetime, timezone
from typing import Any, Dict, List


def generate_json_report(
    tender: Dict,
    bidders: List[Dict],
    verdicts: List[Dict],
    generated_by: str,
) -> Dict[str, Any]:
    """
    Build and return a fully-structured JSON evaluation report.

    Top-level shape:
    {
        "report_metadata": { ... },
        "tender": { ... },
        "criteria_registry": [ ... ],
        "summary": { ... },
        "bidder_evaluations": [
            {
                "bidder": { ... },
                "overall_verdict": str,
                "verdict_summary": { ... },
                "criteria_verdicts": [ ... ]
            }
        ]
    }
    """
    # Build a verdict lookup: bidder_id → list of verdict dicts
    verdict_map: Dict[str, List[Dict]] = {}
    for v in verdicts:
        bid = v.get("bidder_id", "")
        verdict_map.setdefault(bid, []).append(v)

    # Summary counters
    eligible_count = sum(
        1 for b in bidders if b.get("overall_verdict") == "ELIGIBLE"
    )
    ineligible_count = sum(
        1 for b in bidders if b.get("overall_verdict") == "INELIGIBLE"
    )
    review_count = sum(
        1 for b in bidders if b.get("overall_verdict") == "NEEDS_REVIEW"
    )

    # Per-bidder evaluations
    bidder_evaluations = []
    for bidder in bidders:
        bid_id = bidder.get("id", "")
        b_verdicts = verdict_map.get(bid_id, [])

        criteria_verdicts = []
        for v in b_verdicts:
            criteria_verdicts.append({
                "criterion_id": v.get("criterion_id"),
                "criterion_description": v.get("criterion_description"),
                "criterion_type": v.get("criterion_type"),
                "is_mandatory": v.get("is_mandatory"),
                "verdict": v.get("verdict"),
                "effective_verdict": v.get("effective_verdict") or v.get("verdict"),
                "extracted_value": v.get("extracted_value"),
                "extracted_value_normalized": v.get("extracted_value_normalized"),
                "source_text_span": v.get("source_text_span"),
                "source_document_filename": v.get("source_document_filename"),
                "source_document_id": v.get("source_document_id"),
                "reasoning": v.get("reasoning"),
                "confidence_score": v.get("confidence_score"),
                "confidence_band": v.get("confidence_band"),
                "needs_review_reason": v.get("needs_review_reason"),
                "ocr_confidence": v.get("ocr_confidence"),
                "is_human_reviewed": v.get("is_human_reviewed", False),
                "human_verdict": v.get("human_verdict"),
                "human_reasoning": v.get("human_reasoning"),
                "reviewed_by": v.get("reviewed_by"),
                "reviewed_at": (
                    v["reviewed_at"].isoformat()
                    if v.get("reviewed_at") and hasattr(v["reviewed_at"], "isoformat")
                    else v.get("reviewed_at")
                ),
            })

        bidder_evaluations.append({
            "bidder": {
                "id": bid_id,
                "name": bidder.get("name"),
                "contact_email": bidder.get("contact_email"),
                "contact_person": bidder.get("contact_person"),
            },
            "overall_verdict": bidder.get("overall_verdict", "PENDING"),
            "verdict_summary": bidder.get("verdict_summary", {}),
            "criteria_verdicts": criteria_verdicts,
        })

    return {
        "report_metadata": {
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "generated_by": generated_by,
            "report_version": "1.0",
            "system": "NirnayAI",
        },
        "tender": {
            "id": tender.get("id"),
            "title": tender.get("title"),
            "department": tender.get("department"),
            "reference_number": tender.get("reference_number"),
            "description": tender.get("description"),
            "status": tender.get("status"),
            "signed_off_by": tender.get("signed_off_by"),
            "signed_off_at": (
                tender["signed_off_at"].isoformat()
                if tender.get("signed_off_at") and hasattr(tender["signed_off_at"], "isoformat")
                else tender.get("signed_off_at")
            ),
        },
        "criteria_registry": [
            {
                "criterion_id": c.get("criterion_id"),
                "description": c.get("description"),
                "criterion_type": c.get("criterion_type"),
                "threshold_raw": c.get("threshold_raw"),
                "threshold_value": c.get("threshold_value"),
                "threshold_unit": c.get("threshold_unit"),
                "comparison_operator": c.get("comparison_operator"),
                "time_window_years": c.get("time_window_years"),
                "certification_name": c.get("certification_name"),
                "is_mandatory": c.get("is_mandatory", True),
                "is_confirmed": c.get("is_confirmed", False),
                "source_text": c.get("source_text"),
            }
            for c in tender.get("criteria", [])
        ],
        "summary": {
            "total_bidders": len(bidders),
            "eligible_count": eligible_count,
            "ineligible_count": ineligible_count,
            "needs_review_count": review_count,
            "pending_count": len(bidders) - eligible_count - ineligible_count - review_count,
        },
        "bidder_evaluations": bidder_evaluations,
    }
