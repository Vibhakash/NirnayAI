import uuid
from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, BackgroundTasks, Request
from typing import Optional
from app.auth.dependencies import get_current_user
from app.models import UserRole, TenderStatus, AuditActionType
from app.tenders.models import TenderCreate, CriterionIn
from app.tenders import service as tender_svc
from app.documents.storage import save_upload
from app.documents.service import process_document
from app.jobs.service import create_job, update_job, get_job
from app.audit.service import log_event
from app.models import JobType, JobStatus
from app.ai.criteria_extractor import extract_criteria_from_text
from app.ai.conflict_detector import detect_conflicts

router = APIRouter(prefix="/tenders", tags=["Tenders"])


async def _run_criteria_extraction(tender_id: str, document_id: str, file_path: str,
                                    original_filename: str, job_id: str, user: dict):
    """Background task: extract document text → extract criteria → detect conflicts → update tender."""
    from app.documents.service import process_document, get_document
    from app.database import get_db
    try:
        await update_job(job_id, JobStatus.RUNNING, 10, "Processing document...")
        await tender_svc.update_tender_status(tender_id, TenderStatus.EXTRACTING_CRITERIA)

        doc = await process_document(file_path, original_filename, tender_id=tender_id)
        await tender_svc.set_tender_document(tender_id, doc["id"])
        await update_job(job_id, progress_pct=40, progress_message="Extracting criteria with AI...")

        criteria = await extract_criteria_from_text(doc["extracted_text"])

        # Run conflict detector and attach results to each criterion / tender
        conflicts = detect_conflicts(criteria)
        db = get_db()
        await db.tenders.update_one(
            {"_id": ObjectId(tender_id)},
            {"$set": {"criteria_conflicts": conflicts}},
        )

        await tender_svc.set_tender_criteria(tender_id, criteria)
        await tender_svc.update_tender_status(tender_id, TenderStatus.CRITERIA_READY)
        await update_job(
            job_id, JobStatus.COMPLETED, 100,
            f"Extracted {len(criteria)} criteria"
            + (f" ({len(conflicts)} conflict(s) detected)" if conflicts else ""),
        )

        await log_event(
            AuditActionType.CRITERIA_EXTRACTED, "tender", tender_id,
            entity_id=tender_id, user_id=user["id"], user_name=user.get("username"),
            user_role=user.get("role"),
            description=f"Auto-extracted {len(criteria)} criteria from tender document",
            after_state={"criteria_count": len(criteria), "conflicts": len(conflicts)},
        )
    except Exception as e:
        await update_job(job_id, JobStatus.FAILED, error_message=str(e))
        await tender_svc.update_tender_status(tender_id, TenderStatus.UPLOADED)


@router.get("")
async def list_tenders(page: int = 1, page_size: int = 20,
                        current_user=Depends(get_current_user)):
    return await tender_svc.list_tenders(page=page, page_size=page_size)


@router.post("/upload", status_code=201)
async def upload_tender(
    background_tasks: BackgroundTasks,
    title: str,
    file: UploadFile = File(...),
    department: Optional[str] = None,
    reference_number: Optional[str] = None,
    description: Optional[str] = None,
    current_user=Depends(get_current_user),
):
    """Upload tender document → auto-extract criteria in background."""
    tender = await tender_svc.create_tender(
        title=title, user_id=current_user["id"],
        department=department, reference_number=reference_number, description=description,
    )
    saved = await save_upload(file, subfolder="tenders")
    job_id = await create_job(tender["id"], JobType.CRITERIA_EXTRACTION)

    background_tasks.add_task(
        _run_criteria_extraction,
        tender["id"], None, saved["file_path"],
        saved["original_filename"], job_id, current_user,
    )
    await log_event(
        AuditActionType.TENDER_CREATED, "tender", tender["id"],
        user_id=current_user["id"], user_name=current_user.get("username"),
        user_role=current_user.get("role"),
        description=f"Tender '{title}' uploaded by {current_user.get('username')}",
        after_state={"title": title, "filename": saved["original_filename"]},
    )
    return {"tender": tender, "job_id": job_id, "message": "Processing started. Poll /jobs/{job_id} for progress."}


@router.get("/{tender_id}")
async def get_tender(tender_id: str, current_user=Depends(get_current_user)):
    tender = await tender_svc.get_tender(tender_id)
    if not tender:
        raise HTTPException(404, "Tender not found")
    return tender


@router.post("/{tender_id}/criteria", status_code=201)
async def add_criterion(tender_id: str, body: CriterionIn, request: Request,
                         current_user=Depends(get_current_user)):
    tender = await tender_svc.get_tender(tender_id)
    if not tender:
        raise HTTPException(404, "Tender not found")
    import uuid as _uuid
    crit = body.model_dump()
    crit["criterion_id"] = f"crit_{_uuid.uuid4().hex[:8]}"
    crit["edited"] = True
    crit["edited_by"] = current_user.get("username")
    result = await tender_svc.add_criterion(tender_id, crit)
    await log_event(AuditActionType.CRITERION_ADDED, "tender", tender_id,
                    user_id=current_user["id"], user_name=current_user.get("username"),
                    description=f"Criterion manually added: {body.description}",
                    after_state=crit)
    return result


@router.put("/{tender_id}/criteria/{criterion_id}")
async def edit_criterion(tender_id: str, criterion_id: str, body: CriterionIn,
                          current_user=Depends(get_current_user)):
    old = await tender_svc.get_tender(tender_id)
    if not old:
        raise HTTPException(404, "Tender not found")
    old_crit = next((c for c in old.get("criteria", []) if c.get("criterion_id") == criterion_id), None)
    updated = await tender_svc.update_criterion(tender_id, criterion_id, body.model_dump(), current_user.get("username"))
    if not updated:
        raise HTTPException(404, "Criterion not found")
    await log_event(AuditActionType.CRITERION_EDITED, "tender", tender_id,
                    user_id=current_user["id"], user_name=current_user.get("username"),
                    description=f"Criterion '{criterion_id}' edited",
                    before_state=old_crit, after_state=updated)
    return updated


@router.delete("/{tender_id}/criteria/{criterion_id}", status_code=204)
async def delete_criterion(tender_id: str, criterion_id: str,
                            current_user=Depends(get_current_user)):
    tender = await tender_svc.get_tender(tender_id)
    old_crit = next((c for c in tender.get("criteria", []) if c.get("criterion_id") == criterion_id), None)
    deleted = await tender_svc.delete_criterion(tender_id, criterion_id)
    if not deleted:
        raise HTTPException(404, "Criterion not found")
    await log_event(AuditActionType.CRITERION_DELETED, "tender", tender_id,
                    user_id=current_user["id"], user_name=current_user.get("username"),
                    description=f"Criterion '{criterion_id}' deleted", before_state=old_crit)


@router.post("/{tender_id}/criteria/confirm")
async def confirm_criteria(
    tender_id: str,
    current_user=Depends(get_current_user),
):
    """
    Officer confirms the AI-extracted criteria list.
    Advisory step — evaluation can still proceed without it, but a warning is shown.
    Sets confirmed_by / confirmed_at on the tender. Records full audit entry.
    """
    tender = await tender_svc.get_tender(tender_id)
    if not tender:
        raise HTTPException(404, "Tender not found")
    if not tender.get("criteria"):
        raise HTTPException(400, "No criteria to confirm. Extract criteria first.")

    officer_name = current_user.get("full_name") or current_user.get("username")
    updated = await tender_svc.confirm_criteria(
        tender_id, current_user["id"], officer_name
    )

    await log_event(
        AuditActionType.CRITERIA_CONFIRMED, "tender", tender_id,
        user_id=current_user["id"], user_name=current_user.get("username"),
        user_role=current_user.get("role"),
        description=(
            f"Criteria confirmed by {officer_name}. "
            f"{len(tender.get('criteria', []))} criteria approved for evaluation."
        ),
        after_state={"confirmed_by": officer_name, "criteria_count": len(tender.get("criteria", []))},
    )

    # Also surface any existing conflicts as warnings
    conflicts = tender.get("criteria_conflicts", [])
    return {
        "message": "Criteria confirmed successfully",
        "confirmed_by": officer_name,
        "criteria_count": len(tender.get("criteria", [])),
        "warnings": (
            [f"⚠ {c['description']}" for c in conflicts] if conflicts else []
        ),
    }


@router.post("/{tender_id}/sign-off")
async def sign_off(tender_id: str,
                    current_user=Depends(get_current_user)):
    tender = await tender_svc.get_tender(tender_id)
    if not tender:
        raise HTTPException(404, "Tender not found")
    if tender["status"] not in (TenderStatus.COMPLETED.value, TenderStatus.SIGNED_OFF.value):
        raise HTTPException(400, "Tender must be fully evaluated before sign-off")
    await tender_svc.sign_off_tender(tender_id, current_user["id"], current_user.get("full_name", current_user.get("username")))
    await log_event(AuditActionType.REPORT_SIGNED_OFF, "tender", tender_id,
                    user_id=current_user["id"], user_name=current_user.get("username"),
                    description=f"Tender evaluation signed off by {current_user.get('full_name')}")
    return {"message": "Signed off successfully"}
