from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from app.auth.dependencies import get_current_user
from app.models import UserRole, AuditActionType, doc_to_dict
from app.database import get_db
from app.tenders.service import get_tender
from app.bidders.service import list_bidders
from app.audit.service import log_event
from app.reports.pdf_generator import generate_pdf_report
from app.reports.excel_generator import generate_excel_report
from app.reports.json_generator import generate_json_report

router = APIRouter(tags=["Reports"])


async def _fetch_report_data(tender_id: str, db):
    tender = await get_tender(tender_id)
    if not tender:
        raise HTTPException(404, "Tender not found")
    bidders = await list_bidders(tender_id)
    cursor = db.verdicts.find({"tender_id": tender_id}).sort(
        [("bidder_name", 1), ("criterion_id", 1)]
    )
    verdicts = [doc_to_dict(d) async for d in cursor]
    return tender, bidders, verdicts





@router.get("/tenders/{tender_id}/report/pdf")
async def download_pdf_report(
    tender_id: str,
    current_user=Depends(get_current_user),
):
    """Download the full evaluation report as a formatted PDF."""
    db = get_db()
    tender, bidders, verdicts = await _fetch_report_data(tender_id, db)
    pdf_bytes = generate_pdf_report(
        tender, bidders, verdicts,
        current_user.get("full_name", current_user.get("username")),
    )
    await log_event(
        AuditActionType.REPORT_GENERATED, "tender", tender_id,
        user_id=current_user["id"], user_name=current_user.get("username"),
        description=f"PDF report generated for tender '{tender['title']}'",
    )
    filename = f"NirnayAI_{tender.get('reference_number', tender_id)}_report.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/tenders/{tender_id}/report/excel")
async def download_excel_report(
    tender_id: str,
    current_user=Depends(get_current_user),
):
    """Download the criterion × bidder evaluation matrix as an Excel workbook."""
    db = get_db()
    tender, bidders, verdicts = await _fetch_report_data(tender_id, db)
    excel_bytes = generate_excel_report(
        tender, bidders, verdicts,
        current_user.get("full_name", current_user.get("username")),
    )
    await log_event(
        AuditActionType.REPORT_GENERATED, "tender", tender_id,
        user_id=current_user["id"], user_name=current_user.get("username"),
        description=f"Excel report generated for tender '{tender['title']}'",
    )
    filename = f"NirnayAI_{tender.get('reference_number', tender_id)}_matrix.xlsx"
    return Response(
        content=excel_bytes,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/tenders/{tender_id}/report/json")
async def download_json_report(
    tender_id: str,
    current_user=Depends(get_current_user),
):
    """
    Return the full evaluation report as structured JSON.
    Suitable for frontend rendering, API consumers, and external audit systems.
    Includes: tender metadata, criteria registry, per-bidder criterion verdicts,
    confidence bands, document traceability, and human review decisions.
    """
    db = get_db()
    tender, bidders, verdicts = await _fetch_report_data(tender_id, db)
    report = generate_json_report(
        tender, bidders, verdicts,
        current_user.get("full_name", current_user.get("username")),
    )
    await log_event(
        AuditActionType.REPORT_GENERATED, "tender", tender_id,
        user_id=current_user["id"], user_name=current_user.get("username"),
        description=f"JSON report generated for tender '{tender['title']}'",
    )
    return report
