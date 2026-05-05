"""
Mock data seed script — creates the exact sample scenario from hackathon organizers:
Construction tender with 4 criteria, 10 bidders (6 eligible, 3 ineligible, 1 flagged).

Run from backend/ directory:
    python -m mock-data.seed_database
or:
    cd backend && python ../mock-data/seed_database.py
"""
import asyncio
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timedelta
from passlib.context import CryptContext
import uuid

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

MONGODB_URL = os.environ["MONGODB_URL"]
DB_NAME = os.environ.get("DB_NAME", "nirnayai")

CRITERIA = [
    {
        "criterion_id": "crit_001",
        "description": "Minimum annual turnover of ₹5 crore in any of the last 3 financial years",
        "criterion_type": "numerical",
        "threshold_value": 50000000,
        "threshold_raw": "₹5 crore",
        "threshold_unit": "INR",
        "comparison_operator": "gte",
        "time_window_years": 3,
        "certification_name": None,
        "is_mandatory": True,
        "source_text": "The bidder shall have minimum annual turnover of ₹5 crore in any of the last 3 financial years.",
        "source_page": 4,
        "edited": False,
    },
    {
        "criterion_id": "crit_002",
        "description": "At least 3 similar construction projects completed in the last 5 years",
        "criterion_type": "count_based",
        "threshold_value": 3,
        "threshold_raw": "3 projects",
        "threshold_unit": "projects",
        "comparison_operator": "gte",
        "time_window_years": 5,
        "certification_name": None,
        "is_mandatory": True,
        "source_text": "The bidder must have successfully completed at least 3 similar construction projects in the last 5 years.",
        "source_page": 4,
        "edited": False,
    },
    {
        "criterion_id": "crit_003",
        "description": "Valid GST registration",
        "criterion_type": "certification",
        "threshold_value": None,
        "threshold_raw": "GST registration",
        "threshold_unit": "certification",
        "comparison_operator": "exists",
        "time_window_years": None,
        "certification_name": "GST",
        "is_mandatory": True,
        "source_text": "The bidder must possess a valid Goods and Services Tax (GST) registration certificate.",
        "source_page": 5,
        "edited": False,
    },
    {
        "criterion_id": "crit_004",
        "description": "Valid ISO 9001 quality management certification",
        "criterion_type": "certification",
        "threshold_value": None,
        "threshold_raw": "ISO 9001 certification",
        "threshold_unit": "certification",
        "comparison_operator": "exists",
        "time_window_years": None,
        "certification_name": "ISO 9001",
        "is_mandatory": True,
        "source_text": "Bidder shall hold a valid ISO 9001:2015 Quality Management System certification.",
        "source_page": 5,
        "edited": False,
    },
]

BIDDERS_DATA = [
    # 6 Eligible bidders
    {"name": "Sharma Construction Pvt Ltd", "verdict": "ELIGIBLE",
     "verdicts": ["ELIGIBLE", "ELIGIBLE", "ELIGIBLE", "ELIGIBLE"],
     "values": ["₹8.5 crore", "5 projects", "GST: 27AABCS1429B1Z6", "ISO 9001:2015 certified"]},
    {"name": "BuildRight Infrastructure Ltd", "verdict": "ELIGIBLE",
     "verdicts": ["ELIGIBLE", "ELIGIBLE", "ELIGIBLE", "ELIGIBLE"],
     "values": ["₹12 crore", "7 projects", "GST: 29AAFCB2594R1ZP", "ISO 9001 valid till 2026"]},
    {"name": "National Builders Co.", "verdict": "ELIGIBLE",
     "verdicts": ["ELIGIBLE", "ELIGIBLE", "ELIGIBLE", "ELIGIBLE"],
     "values": ["₹6.2 crore", "4 projects", "GST: 07AAACN3456M1Z3", "ISO 9001:2015"]},
    {"name": "Apex Projects Pvt Ltd", "verdict": "ELIGIBLE",
     "verdicts": ["ELIGIBLE", "ELIGIBLE", "ELIGIBLE", "ELIGIBLE"],
     "values": ["₹9.8 crore", "6 projects", "GST: 33AABCA8879Q1ZK", "ISO 9001 certified"]},
    {"name": "Prime Construction Works", "verdict": "ELIGIBLE",
     "verdicts": ["ELIGIBLE", "ELIGIBLE", "ELIGIBLE", "ELIGIBLE"],
     "values": ["₹5.1 crore", "3 projects", "GST: 24AAECS6789P1Z1", "ISO 9001:2015 valid"]},
    {"name": "Metro Infrastructure Pvt Ltd", "verdict": "ELIGIBLE",
     "verdicts": ["ELIGIBLE", "ELIGIBLE", "ELIGIBLE", "ELIGIBLE"],
     "values": ["₹15 crore", "9 projects", "GST: 27AADCM4321K1Z8", "ISO 9001:2015"]},
    # 3 Ineligible bidders
    {"name": "Startup Builds Ltd", "verdict": "INELIGIBLE",
     "verdicts": ["INELIGIBLE", "ELIGIBLE", "ELIGIBLE", "ELIGIBLE"],
     "values": ["₹1.2 crore (below ₹5 crore threshold)", "4 projects", "GST: 19AABCS9876P1Z2", "ISO 9001 certified"],
     "reasons": ["Annual turnover ₹1.2 crore is below the required ₹5 crore minimum", None, None, None]},
    {"name": "New Projects Co.", "verdict": "INELIGIBLE",
     "verdicts": ["ELIGIBLE", "INELIGIBLE", "ELIGIBLE", "ELIGIBLE"],
     "values": ["₹7 crore", "1 project (below 3)", "GST: 06AABCN3456P1Z5", "ISO 9001:2015"],
     "reasons": [None, "Only 1 qualifying project found in last 5 years, need minimum 3", None, None]},
    {"name": "Informal Constructions", "verdict": "INELIGIBLE",
     "verdicts": ["ELIGIBLE", "ELIGIBLE", "INELIGIBLE", "ELIGIBLE"],
     "values": ["₹6.5 crore", "5 projects", "No GST registration found", "ISO 9001 certified"],
     "reasons": [None, None, "No GST registration certificate found in submitted documents", None]},
    # 1 NEEDS_REVIEW bidder (scanned unreadable turnover doc)
    {"name": "Regional Builders Pvt Ltd", "verdict": "NEEDS_REVIEW",
     "verdicts": ["NEEDS_REVIEW", "ELIGIBLE", "ELIGIBLE", "ELIGIBLE"],
     "values": [None, "4 projects", "GST: 22AABCR5678M1Z4", "ISO 9001:2015 certified"],
     "reasons": ["Turnover document is a scanned photograph with figures that could not be read with confidence. OCR confidence: 48%. Manual review required.", None, None, None]},
]


async def seed():
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[DB_NAME]

    print("Clearing existing seed data...")
    await db.users.delete_many({"email": {"$in": ["admin@nirnayai.gov.in", "officer@nirnayai.gov.in"]}})

    print("Creating users...")
    users = [
        {"username": "admin", "email": "admin@nirnayai.gov.in", "full_name": "System Administrator",
         "password_hash": pwd_context.hash("Admin@123"), "role": "admin", "is_active": True, "created_at": datetime.utcnow()},
        {"username": "priya_officer", "email": "officer@nirnayai.gov.in", "full_name": "Priya Sharma",
         "password_hash": pwd_context.hash("Officer@123"), "role": "reviewing_officer", "is_active": True, "created_at": datetime.utcnow()},
    ]
    result = await db.users.insert_many(users)
    admin_id = str(result.inserted_ids[0])
    print(f"  Created {len(users)} users")

    # Tender
    tender_doc = {
        "title": "Construction Services Tender — Government Buildings Renovation",
        "department": "CRPF Infrastructure Division",
        "reference_number": "CRPF/INFRA/2025/001",
        "description": "Procurement of construction services for renovation of government residential quarters",
        "status": "completed",
        "document_id": None,
        "criteria": CRITERIA,
        "created_by": admin_id,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "signed_off_by": None,
        "signed_off_at": None,
    }
    tender_result = await db.tenders.insert_one(tender_doc)
    tender_id = str(tender_result.inserted_id)
    print(f"  Created tender: {tender_id}")

    # Bidders and verdicts
    for bd in BIDDERS_DATA:
        bidder_doc = {
            "tender_id": tender_id,
            "name": bd["name"],
            "contact_email": f"contact@{bd['name'].lower().replace(' ', '')}.com",
            "contact_person": "Representative",
            "status": "completed",
            "documents": [
                {"document_id": f"mock_{uuid.uuid4().hex[:8]}",
                 "original_filename": f"{bd['name'].replace(' ', '_')}_documents.pdf",
                 "ocr_confidence": 0.48 if bd["verdict"] == "NEEDS_REVIEW" else 0.95,
                 "flagged_for_review": bd["verdict"] == "NEEDS_REVIEW",
                 "processing_method": "pdf_ocr" if bd["verdict"] == "NEEDS_REVIEW" else "pdf_direct"}
            ],
            "overall_verdict": bd["verdict"],
            "verdict_summary": {
                "eligible": bd["verdicts"].count("ELIGIBLE"),
                "ineligible": bd["verdicts"].count("INELIGIBLE"),
                "needs_review": bd["verdicts"].count("NEEDS_REVIEW"),
                "total": len(bd["verdicts"]),
            },
            "created_by": admin_id,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
        }
        bidder_result = await db.bidders.insert_one(bidder_doc)
        bidder_id = str(bidder_result.inserted_id)

        for i, crit in enumerate(CRITERIA):
            v_type = bd["verdicts"][i]
            reasons = bd.get("reasons", [None, None, None, None])
            verdict_doc = {
                "tender_id": tender_id,
                "bidder_id": bidder_id,
                "bidder_name": bd["name"],
                "criterion_id": crit["criterion_id"],
                "criterion_description": crit["description"],
                "criterion_type": crit["criterion_type"],
                "verdict": v_type,
                "effective_verdict": v_type,
                "extracted_value": bd["values"][i],
                "extracted_value_normalized": None,
                "source_text_span": f"Evidence found in submitted documents for {crit['description']}",
                "reasoning": reasons[i] or f"Bidder meets criterion: {crit['description']}",
                "confidence_score": 0.48 if v_type == "NEEDS_REVIEW" else 0.92,
                "needs_review_reason": reasons[i] if v_type == "NEEDS_REVIEW" else None,
                "ocr_confidence": 0.48 if v_type == "NEEDS_REVIEW" else None,
                "llm_model": "mistral-large-latest",
                "is_human_reviewed": False,
                "human_verdict": None,
                "created_at": datetime.utcnow(),
            }
            await db.verdicts.insert_one(verdict_doc)

        print(f"  Bidder '{bd['name']}' -> {bd['verdict']}")

    # Audit log seed
    await db.audit_log.insert_one({
        "timestamp": datetime.utcnow(),
        "user_id": admin_id, "user_name": "admin", "user_role": "admin",
        "action_type": "TENDER_CREATED",
        "entity_type": "tender", "entity_id": tender_id,
        "description": "Seed data: Construction services tender created",
        "before_state": None, "after_state": {"title": tender_doc["title"]},
    })

    print(f"\nSeed complete!")
    print(f"   Tender ID: {tender_id}")
    print(f"   Admin login: admin / Admin@123")
    print(f"   Officer login: priya_officer / Officer@123")
    print(f"   API Docs: http://localhost:8000/docs")
    client.close()


if __name__ == "__main__":
    asyncio.run(seed())
