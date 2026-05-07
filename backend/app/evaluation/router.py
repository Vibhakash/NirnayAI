from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Query
from typing import Optional
from app.auth.dependencies import get_current_user
from app.models import UserRole, doc_to_dict, JobType
from app.database import get_db
from app.tenders.service import get_tender
from app.bidders.service import list_bidders, get_bidder
from app.documents.service import get_document
from app.jobs.service import create_job
from app.evaluation.tasks import run_evaluation
from app.evaluation.single_bidder_task import run_single_bidder_evaluation
from app.evaluation.completeness import check_completeness

router = APIRouter(tags=["Evaluation"])


# ---------------------------------------------------------------------------
# Trigger full evaluation
# ---------------------------------------------------------------------------

@router.post("/tenders/{tender_id}/evaluate", status_code=202)
async def trigger_evaluation(
    tender_id: str,
    background_tasks: BackgroundTasks,
    current_user=Depends(get_current_user),
):
    """
    Trigger full evaluation pipeline for a tender. Returns job_id to poll progress.
    Advisory warning is included in the response if criteria have not been confirmed.
    """
    tender = await get_tender(tender_id)
    if not tender:
        raise HTTPException(404, "Tender not found")
    if not tender.get("criteria"):
        raise HTTPException(400, "No criteria found. Upload and process tender document first.")

    job_id = await create_job(tender_id, JobType.EVALUATION)
    background_tasks.add_task(run_evaluation, tender_id, job_id, current_user)

    warnings = []
    if not tender.get("confirmed_by"):
        warnings.append(
            "⚠ Criteria have not been confirmed by an officer. "
            "Consider calling POST /tenders/{tender_id}/criteria/confirm first."
        )

    return {
        "job_id": job_id,
        "message": "Evaluation started. Poll /jobs/{job_id} for progress or stream /jobs/{job_id}/stream.",
        "warnings": warnings,
    }


# ---------------------------------------------------------------------------
# Per-bidder re-evaluation
# ---------------------------------------------------------------------------

@router.post("/tenders/{tender_id}/bidders/{bidder_id}/evaluate", status_code=202)
async def trigger_single_bidder_evaluation(
    tender_id: str,
    bidder_id: str,
    background_tasks: BackgroundTasks,
    current_user=Depends(get_current_user),
):
    """
    Re-evaluate a single bidder against all tender criteria.
    Deletes and replaces existing verdicts for this bidder only.
    Other bidders are unaffected.
    """
    tender = await get_tender(tender_id)
    if not tender:
        raise HTTPException(404, "Tender not found")
    if not tender.get("criteria"):
        raise HTTPException(400, "No criteria found. Extract criteria first.")

    bidder = await get_bidder(bidder_id)
    if not bidder or bidder.get("tender_id") != tender_id:
        raise HTTPException(404, "Bidder not found for this tender")

    job_id = await create_job(tender_id, JobType.EVALUATION)
    background_tasks.add_task(
        run_single_bidder_evaluation, tender_id, bidder_id, job_id, current_user
    )
    return {
        "job_id": job_id,
        "bidder_id": bidder_id,
        "bidder_name": bidder.get("name"),
        "message": "Re-evaluation started. Poll /jobs/{job_id} for progress.",
    }


# ---------------------------------------------------------------------------
# Pre-evaluation completeness check
# ---------------------------------------------------------------------------

@router.get("/tenders/{tender_id}/completeness")
async def get_completeness(
    tender_id: str,
    current_user=Depends(get_current_user),
):
    """
    Pre-evaluation readiness report.
    For each bidder × criterion: checks whether at least one submitted document
    contains text relevant to that criterion.
    Use this to identify missing documents before triggering evaluation.
    """
    tender = await get_tender(tender_id)
    if not tender:
        raise HTTPException(404, "Tender not found")

    criteria = tender.get("criteria", [])
    if not criteria:
        raise HTTPException(400, "No criteria extracted yet.")

    db = get_db()
    bidders = await list_bidders(tender_id)
    results = []

    for bidder in bidders:
        doc_ids = [d["document_id"] for d in bidder.get("documents", [])]
        docs = []
        for doc_id in doc_ids:
            doc = await get_document(doc_id)
            if doc:
                docs.append(doc)
        report = check_completeness(bidder, criteria, docs)
        results.append(report)

    # Aggregate summary
    total_bidders = len(results)
    ready_bidders = sum(1 for r in results if r["readiness_pct"] >= 80)

    return {
        "tender_id": tender_id,
        "total_bidders": total_bidders,
        "ready_bidders": ready_bidders,
        "not_ready_bidders": total_bidders - ready_bidders,
        "readiness_threshold_pct": 80,
        "bidder_reports": results,
    }


# ---------------------------------------------------------------------------
# Results queries
# ---------------------------------------------------------------------------

@router.get("/tenders/{tender_id}/results")
async def get_results(
    tender_id: str,
    verdict_filter: Optional[str] = Query(None, description="ELIGIBLE | INELIGIBLE | NEEDS_REVIEW"),
    current_user=Depends(get_current_user),
):
    """Full criterion × bidder results matrix for a tender."""
    db = get_db()
    query = {"tender_id": tender_id}
    if verdict_filter:
        query["verdict"] = verdict_filter

    cursor = db.verdicts.find(query).sort([("bidder_name", 1), ("criterion_id", 1)])
    verdicts = [doc_to_dict(d) async for d in cursor]

    # Group by bidder for matrix view
    bidder_map = {}
    for v in verdicts:
        bid = v["bidder_id"]
        if bid not in bidder_map:
            bidder_map[bid] = {"bidder_id": bid, "bidder_name": v.get("bidder_name"), "verdicts": []}
        bidder_map[bid]["verdicts"].append(v)

    return {
        "tender_id": tender_id,
        "total_verdicts": len(verdicts),
        "bidders": list(bidder_map.values()),
    }


@router.get("/tenders/{tender_id}/results/{bidder_id}")
async def get_bidder_results(tender_id: str, bidder_id: str,
                              current_user=Depends(get_current_user)):
    """Criterion-by-criterion results for a single bidder."""
    db = get_db()
    cursor = db.verdicts.find(
        {"tender_id": tender_id, "bidder_id": bidder_id}
    ).sort("criterion_id", 1)
    verdicts = [doc_to_dict(d) async for d in cursor]
    if not verdicts:
        raise HTTPException(404, "No results found for this bidder")
    return {"bidder_id": bidder_id, "verdicts": verdicts}


@router.get("/tenders/{tender_id}/summary")
async def get_summary(tender_id: str, current_user=Depends(get_current_user)):
    """High-level summary: counts of ELIGIBLE / INELIGIBLE / NEEDS_REVIEW bidders."""
    from app.tenders.service import get_tender
    db = get_db()
    tender = await get_tender(tender_id)
    if not tender:
        raise HTTPException(404, "Tender not found")
        
    bidders = await list_bidders(tender_id)
    summary = {"ELIGIBLE": [], "INELIGIBLE": [], "NEEDS_REVIEW": [], "pending": []}
    for b in bidders:
        verdict = b.get("overall_verdict") or "pending"
        summary.get(verdict, summary["pending"]).append(
            {"id": b["id"], "name": b["name"], "verdict_summary": b.get("verdict_summary")}
        )
    return {
        "tender_id": tender_id,
        "total_bidders": len(bidders),
        "eligible_count": len(summary["ELIGIBLE"]),
        "ineligible_count": len(summary["INELIGIBLE"]),
        "needs_review_count": len(summary["NEEDS_REVIEW"]),
        "pending_count": len(summary["pending"]),
        "eligible": summary["ELIGIBLE"],
        "ineligible": summary["INELIGIBLE"],
        "needs_review": summary["NEEDS_REVIEW"],
        "signed_off": tender.get("status") == "SIGNED_OFF"
    }
