from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, BackgroundTasks, Form
from typing import List, Optional
from pydantic import BaseModel
from app.auth.dependencies import get_current_user
from app.models import UserRole, AuditActionType
from app.bidders import service as bidder_svc
from app.tenders import service as tender_svc
from app.documents.storage import save_upload
from app.documents.service import process_document
from app.audit.service import log_event

router = APIRouter(prefix="/tenders/{tender_id}/bidders", tags=["Bidders"])


class BidderCreate(BaseModel):
    name: str
    contact_email: Optional[str] = None
    contact_person: Optional[str] = None


@router.get("")
async def list_bidders(tender_id: str, current_user=Depends(get_current_user)):
    return await bidder_svc.list_bidders(tender_id)


@router.post("", status_code=201)
async def create_bidder(
    tender_id: str,
    background_tasks: BackgroundTasks,
    name: str = Form(...),
    contact_email: Optional[str] = Form(None),
    contact_person: Optional[str] = Form(None),
    files: List[UploadFile] = File(...),
    current_user=Depends(get_current_user),
):
    """Create a bidder and upload all their supporting documents at once."""
    tender = await tender_svc.get_tender(tender_id)
    if not tender:
        raise HTTPException(404, "Tender not found")

    bidder = await bidder_svc.create_bidder(
        tender_id=tender_id, name=name, user_id=current_user["id"],
        contact_email=contact_email, contact_person=contact_person,
    )
    await log_event(AuditActionType.BIDDER_CREATED, "bidder", bidder["id"],
                    user_id=current_user["id"], user_name=current_user.get("username"),
                    description=f"Bidder '{name}' created for tender {tender_id}")

    # Process each uploaded document in background
    for f in files:
        saved = await save_upload(f, subfolder=f"bidders/{bidder['id']}")
        background_tasks.add_task(
            _process_bidder_doc, bidder["id"], tender_id,
            saved["file_path"], saved["original_filename"], current_user,
        )

    return {"bidder": bidder, "files_queued": len(files),
            "message": f"{len(files)} document(s) queued for processing"}


async def _process_bidder_doc(bidder_id: str, tender_id: str, file_path: str,
                               original_filename: str, user: dict):
    try:
        doc = await process_document(file_path, original_filename,
                                      tender_id=tender_id, bidder_id=bidder_id)
        doc_meta = {
            "document_id": doc["id"],
            "original_filename": original_filename,
            "ocr_confidence": doc.get("ocr_confidence"),
            "flagged_for_review": doc.get("flagged_for_review", False),
            "flag_reason": doc.get("flag_reason"),
            "processing_method": doc.get("processing_method"),
        }
        await bidder_svc.add_document_to_bidder(bidder_id, doc_meta)
        await log_event(AuditActionType.DOCUMENT_UPLOADED, "document", doc["id"],
                        user_id=user["id"], user_name=user.get("username"),
                        description=f"Document '{original_filename}' processed for bidder {bidder_id}",
                        metadata={"ocr_confidence": doc.get("ocr_confidence"),
                                  "flagged": doc.get("flagged_for_review")})
    except Exception as e:
        import logging
        logging.getLogger(__name__).error(f"Doc processing failed for {original_filename}: {e}")


@router.get("/{bidder_id}")
async def get_bidder(tender_id: str, bidder_id: str, current_user=Depends(get_current_user)):
    bidder = await bidder_svc.get_bidder(bidder_id)
    if not bidder or bidder.get("tender_id") != tender_id:
        raise HTTPException(404, "Bidder not found")
    return bidder


@router.delete("/{bidder_id}", status_code=204)
async def delete_bidder(tender_id: str, bidder_id: str, current_user=Depends(get_current_user)):
    bidder = await bidder_svc.get_bidder(bidder_id)
    if not bidder or bidder.get("tender_id") != tender_id:
        raise HTTPException(404, "Bidder not found")
        
    deleted = await bidder_svc.delete_bidder(bidder_id)
    if not deleted:
        raise HTTPException(404, "Bidder could not be deleted")
        
    await log_event(AuditActionType.BIDDER_DELETED, "bidder", bidder_id,
                    user_id=current_user["id"], user_name=current_user.get("username"),
                    description=f"Bidder '{bidder.get('name')}' deleted from tender {tender_id}")
