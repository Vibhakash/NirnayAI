"""
Demo seeding endpoint.
Only active in development mode.

POST /demo/seed   → Inserts a full representative scenario:
  - 1 construction services tender with 4 criteria
  - 10 mock bidders with pre-computed verdicts
    (6 ELIGIBLE, 3 INELIGIBLE, 1 NEEDS_REVIEW)

Designed so hackathon judges can see a complete populated system
without uploading any real documents.
"""
import uuid
from datetime import datetime, timedelta
from typing import List, Dict

from fastapi import APIRouter, HTTPException, Depends
from app.auth.dependencies import get_current_user
from app.models import UserRole, TenderStatus, VerdictType, AuditActionType, JobType, JobStatus
from app.database import get_db
from app.audit.service import log_event
from bson import ObjectId

router = APIRouter(prefix="/demo", tags=["Demo"])

# ---------------------------------------------------------------------------
# Demo data constants
# ---------------------------------------------------------------------------

TENDER_TITLE = "Construction Services for Municipal Road Widening Project"
DEPARTMENT = "Public Works Department, Government of Maharashtra"
REFERENCE = "PWD/MH/2025/CR-007"

CRITERIA = [
    {
        "criterion_id": "crit_demo_01",
        "description": "Minimum annual turnover of ₹5 crore in any of the last 3 financial years",
        "criterion_type": "numerical",
        "threshold_value": 50_000_000.0,
        "threshold_raw": "₹5 crore",
        "threshold_unit": "INR",
        "comparison_operator": "gte",
        "time_window_years": 3,
        "certification_name": None,
        "is_mandatory": True,
        "source_text": "The bidder must have achieved a minimum annual turnover of ₹5 crore in at least one of the last three financial years.",
        "source_page": 4,
        "is_confirmed": True,
        "edited": False,
    },
    {
        "criterion_id": "crit_demo_02",
        "description": "At least 3 similar construction projects completed in the last 5 years",
        "criterion_type": "count_based",
        "threshold_value": 3,
        "threshold_raw": "3 similar projects",
        "threshold_unit": "projects",
        "comparison_operator": "gte",
        "time_window_years": 5,
        "certification_name": None,
        "is_mandatory": True,
        "source_text": "The bidder must have successfully completed at least 3 similar projects of road construction or civil works in the last 5 years.",
        "source_page": 4,
        "is_confirmed": True,
        "edited": False,
    },
    {
        "criterion_id": "crit_demo_03",
        "description": "Valid GST Registration Certificate",
        "criterion_type": "certification",
        "threshold_value": None,
        "threshold_raw": "GST registration",
        "threshold_unit": "certification",
        "comparison_operator": "exists",
        "time_window_years": None,
        "certification_name": "GST",
        "is_mandatory": True,
        "source_text": "The bidder must possess a valid GST Registration Certificate at the time of submission.",
        "source_page": 5,
        "is_confirmed": True,
        "edited": False,
    },
    {
        "criterion_id": "crit_demo_04",
        "description": "ISO 9001:2015 Certification for Quality Management Systems",
        "criterion_type": "certification",
        "threshold_value": None,
        "threshold_raw": "ISO 9001 certification",
        "threshold_unit": "certification",
        "comparison_operator": "exists",
        "time_window_years": None,
        "certification_name": "ISO 9001",
        "is_mandatory": False,
        "source_text": "Preference shall be given to bidders holding a valid ISO 9001:2015 Quality Management certification.",
        "source_page": 5,
        "is_confirmed": True,
        "edited": False,
    },
]

# 10 mock bidders: 6 ELIGIBLE, 3 INELIGIBLE, 1 NEEDS_REVIEW
BIDDER_SCENARIOS = [
    {
        "name": "Sharma Infrastructure Pvt. Ltd.",
        "contact_email": "bid@sharma-infra.com",
        "verdicts": ["ELIGIBLE", "ELIGIBLE", "ELIGIBLE", "ELIGIBLE"],
        "evidence": [
            "Annual Turnover FY2023-24: ₹8.2 crore (Audited Balance Sheet)",
            "3 projects completed: NH-48 widening (2021), Pune ring road (2022), Nashik bypass (2023)",
            "GST No: 27AABCS1234A1ZK — Valid",
            "ISO 9001:2015 Cert No: IN/2022/QMS/00891 — Valid till 2025",
        ],
        "confidence": [0.96, 0.93, 0.98, 0.94],
    },
    {
        "name": "Builders Alliance Co-operative",
        "contact_email": "tender@buildersalliance.in",
        "verdicts": ["ELIGIBLE", "ELIGIBLE", "ELIGIBLE", "ELIGIBLE"],
        "evidence": [
            "Turnover FY2022-23: ₹6.75 crore (CA Certificate attached)",
            "5 similar projects in last 5 years — list enclosed",
            "GSTIN: 27AAACB1234B1ZP",
            "ISO 9001:2015 — Certificate No. QMS-2023-0456",
        ],
        "confidence": [0.91, 0.88, 0.97, 0.90],
    },
    {
        "name": "Maharashtra Road Works Ltd.",
        "contact_email": "procurement@mrwl.co.in",
        "verdicts": ["ELIGIBLE", "ELIGIBLE", "ELIGIBLE", "ELIGIBLE"],
        "evidence": [
            "Turnover: ₹12.3 crore (FY2023-24)",
            "6 projects in 5 years — Schedule A attached",
            "GST: 27AABCM5678C1ZQ — Verified",
            "ISO 9001:2015 Cert — QMS-IN-2022-0789",
        ],
        "confidence": [0.97, 0.95, 0.99, 0.92],
    },
    {
        "name": "SunBuild Construction LLP",
        "contact_email": "bids@sunbuild.com",
        "verdicts": ["ELIGIBLE", "ELIGIBLE", "ELIGIBLE", "INELIGIBLE"],
        "evidence": [
            "Annual Turnover FY2023: ₹7.1 crore",
            "4 road projects completed 2019-2024",
            "GSTIN: 27AADCS5432D1ZM",
            "ISO 9001 not present in submission",
        ],
        "confidence": [0.93, 0.89, 0.96, 0.91],
        # ISO is optional — INELIGIBLE on optional → should be NEEDS_REVIEW
    },
    {
        "name": "Prime Constructions Pvt. Ltd.",
        "contact_email": "info@primeconstructions.in",
        "verdicts": ["ELIGIBLE", "ELIGIBLE", "ELIGIBLE", "ELIGIBLE"],
        "evidence": [
            "Turnover: ₹9.8 crore FY2023-24",
            "3 completed projects — completion certificates enclosed",
            "GST No: 27AABCP4567E1ZR",
            "ISO 9001:2015 — Valid till March 2026",
        ],
        "confidence": [0.94, 0.91, 0.97, 0.88],
    },
    {
        "name": "GreenLine Civil Works",
        "contact_email": "tenders@greenlinecivilworks.com",
        "verdicts": ["ELIGIBLE", "ELIGIBLE", "ELIGIBLE", "ELIGIBLE"],
        "evidence": [
            "Annual Turnover: ₹5.5 crore (FY2022-23 — CA attested)",
            "3 projects: flyover work 2020, drainage 2022, road repair 2023",
            "GSTIN: 27AADCG2345F1ZS",
            "ISO 9001:2015 Cert — Issue 2023",
        ],
        "confidence": [0.86, 0.84, 0.95, 0.87],
    },
    {
        "name": "Apex Roads & Bridges",
        "contact_email": "apex.tender@gmail.com",
        "verdicts": ["INELIGIBLE", "ELIGIBLE", "ELIGIBLE", "INELIGIBLE"],
        "evidence": [
            "Turnover FY2023: ₹3.2 crore — below ₹5 crore threshold",
            "4 projects in last 5 years",
            "GST Certificate enclosed",
            "No ISO 9001 certification submitted",
        ],
        "confidence": [0.95, 0.88, 0.96, 0.90],
    },
    {
        "name": "Swift Contractors India",
        "contact_email": "bids@swiftcontractors.in",
        "verdicts": ["INELIGIBLE", "INELIGIBLE", "ELIGIBLE", "INELIGIBLE"],
        "evidence": [
            "Turnover: ₹2.1 crore — does not meet threshold",
            "Only 1 similar project found in last 5 years",
            "GST No: 27AADCS9876G1ZT — Valid",
            "ISO 9001 not held",
        ],
        "confidence": [0.92, 0.87, 0.98, 0.93],
    },
    {
        "name": "Durga Construction Co.",
        "contact_email": "durga.const@yahoo.com",
        "verdicts": ["INELIGIBLE", "ELIGIBLE", "INELIGIBLE", "INELIGIBLE"],
        "evidence": [
            "Turnover: ₹1.8 crore — significantly below threshold",
            "3 projects completed — certificates attached",
            "GST Registration not submitted with bid",
            "ISO certification not submitted",
        ],
        "confidence": [0.93, 0.85, 0.94, 0.91],
    },
    {
        "name": "Horizon Buildtech LLP",
        "contact_email": "hr@horizonbuildtech.co.in",
        "verdicts": ["NEEDS_REVIEW", "ELIGIBLE", "ELIGIBLE", "INELIGIBLE"],
        "evidence": [
            "Turnover figure unclear — scanned certificate, digit '5' could be '3' or '5' crore",
            "4 projects in 5 years",
            "GST Certificate attached — GSTIN readable",
            "ISO 9001 not present",
        ],
        "confidence": [0.52, 0.87, 0.95, 0.89],
        "needs_review_reasons": [
            "Scanned turnover document has low OCR confidence (52%). "
            "The reported figure may be ₹3 crore or ₹5 crore — human verification required.",
            None, None, None,
        ],
    },
]


def _overall_verdict_mandatory_aware(
    verdicts: List[str],
    is_mandatory_list: List[bool],
) -> str:
    """Mandatory-aware rollup for demo data."""
    has_review = any(v == "NEEDS_REVIEW" for v in verdicts)
    has_mandatory_fail = any(
        v == "INELIGIBLE" and is_mandatory_list[i]
        for i, v in enumerate(verdicts)
    )
    if has_review or (any(v == "INELIGIBLE" for v in verdicts) and not has_mandatory_fail):
        return "NEEDS_REVIEW"
    if has_mandatory_fail:
        return "INELIGIBLE"
    return "ELIGIBLE"


async def _insert_demo_data(user: dict) -> dict:
    db = get_db()
    now = datetime.utcnow()

    # Create tender
    tender_doc = {
        "title": TENDER_TITLE,
        "department": DEPARTMENT,
        "reference_number": REFERENCE,
        "description": "Widening and strengthening of Municipal Road from 2-lane to 4-lane, total stretch 12.4 km.",
        "status": TenderStatus.COMPLETED.value,
        "document_id": None,
        "criteria": CRITERIA,
        "created_by": user["id"],
        "created_at": now - timedelta(days=10),
        "updated_at": now - timedelta(days=2),
        "confirmed_by": user.get("full_name", user.get("username")),
        "confirmed_at": now - timedelta(days=8),
        "signed_off_by": None,
        "signed_off_at": None,
        "demo": True,
    }
    t_result = await db.tenders.insert_one(tender_doc)
    tender_id = str(t_result.inserted_id)

    is_mandatory = [c["is_mandatory"] for c in CRITERIA]
    bidder_count = {"ELIGIBLE": 0, "INELIGIBLE": 0, "NEEDS_REVIEW": 0}

    for scenario in BIDDER_SCENARIOS:
        bidder_doc = {
            "tender_id": tender_id,
            "name": scenario["name"],
            "contact_email": scenario.get("contact_email"),
            "contact_person": None,
            "created_by": user["id"],
            "created_at": now - timedelta(days=5),
            "documents": [],
            "status": "evaluated",
            "overall_verdict": None,
            "verdict_summary": None,
            "demo": True,
        }
        b_result = await db.bidders.insert_one(bidder_doc)
        bidder_id = str(b_result.inserted_id)

        verdict_docs = []
        for i, crit in enumerate(CRITERIA):
            v_type = scenario["verdicts"][i]
            conf = scenario["confidence"][i]
            band = "HIGH" if conf >= 0.85 else ("MEDIUM" if conf >= 0.65 else "LOW")
            nr_reason = (scenario.get("needs_review_reasons", [None] * 4)[i]
                         if v_type == "NEEDS_REVIEW" else None)

            v_doc = {
                "tender_id": tender_id,
                "bidder_id": bidder_id,
                "bidder_name": scenario["name"],
                "criterion_id": crit["criterion_id"],
                "criterion_description": crit["description"],
                "criterion_type": crit["criterion_type"],
                "is_mandatory": crit["is_mandatory"],
                "verdict": v_type,
                "effective_verdict": v_type,
                "extracted_value": scenario["evidence"][i],
                "extracted_value_normalized": None,
                "source_text_span": scenario["evidence"][i],
                "source_document_id": None,
                "source_document_filename": f"bid_doc_{i+1}.pdf",
                "reasoning": scenario["evidence"][i],
                "confidence_score": conf,
                "confidence_band": band,
                "needs_review_reason": nr_reason,
                "ocr_confidence": 0.52 if v_type == "NEEDS_REVIEW" else None,
                "llm_model": "demo-seed",
                "is_human_reviewed": False,
                "human_verdict": None,
                "human_reasoning": None,
                "created_at": now - timedelta(days=2),
            }
            verdict_docs.append(v_doc)

        if verdict_docs:
            await db.verdicts.insert_many(verdict_docs)

        # Compute verdicts list for rollup
        verdict_vals = [v["verdict"] for v in verdict_docs]
        overall = _overall_verdict_mandatory_aware(verdict_vals, is_mandatory)
        eligible = verdict_vals.count("ELIGIBLE")
        ineligible = verdict_vals.count("INELIGIBLE")
        review = verdict_vals.count("NEEDS_REVIEW")

        await db.bidders.update_one(
            {"_id": ObjectId(bidder_id)},
            {"$set": {
                "overall_verdict": overall,
                "verdict_summary": {
                    "eligible": eligible,
                    "ineligible": ineligible,
                    "needs_review": review,
                    "total": len(verdict_docs),
                },
            }},
        )
        bidder_count[overall] = bidder_count.get(overall, 0) + 1

    await log_event(
        AuditActionType.TENDER_CREATED, "tender", tender_id,
        user_id=user["id"], user_name=user.get("username"),
        description=f"Demo data seeded: tender '{TENDER_TITLE}' with {len(BIDDER_SCENARIOS)} bidders",
        after_state={"demo": True, "bidder_count": bidder_count},
    )

    return {
        "tender_id": tender_id,
        "bidders_created": len(BIDDER_SCENARIOS),
        "criteria_count": len(CRITERIA),
        "summary": bidder_count,
        "message": (
            "Demo scenario seeded successfully. "
            f"Open /tenders/{tender_id} to explore."
        ),
    }


@router.post("/seed", status_code=201)
async def seed_demo(
    current_user=Depends(get_current_user),):
    """
    Seed a complete demo scenario for hackathon judges.
    Creates 1 tender + 4 criteria + 10 mock bidders with realistic verdicts.

    Only callable by ADMIN users.
    """
    result = await _insert_demo_data(current_user)
    return result


@router.delete("/seed", status_code=200)
async def clear_demo(
    current_user=Depends(get_current_user),):
    """Remove ALL demo-seeded data (tenders, bidders, verdicts with demo=True)."""
    db = get_db()

    # Find demo tender IDs first
    demo_tenders = [
        str(t["_id"]) async for t in db.tenders.find({"demo": True}, {"_id": 1})
    ]

    t_del = await db.tenders.delete_many({"demo": True})
    b_del = await db.bidders.delete_many({"demo": True})
    v_del = await db.verdicts.delete_many({"tender_id": {"$in": demo_tenders}})

    return {
        "tenders_deleted": t_del.deleted_count,
        "bidders_deleted": b_del.deleted_count,
        "verdicts_deleted": v_del.deleted_count,
    }
