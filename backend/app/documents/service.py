"""
Document processing service.
Determines file type, routes to correct parser/OCR, stores results in MongoDB.
"""
import logging
from datetime import datetime
from pathlib import Path
from typing import Dict, Optional

from app.config import get_settings
from app.database import get_db
from app.documents.parsers.pdf_parser import (
    extract_text_from_pdf,
    extract_images_from_pdf,
    is_scanned_pdf,
)
from app.documents.parsers.docx_parser import extract_text_from_docx
from app.documents.parsers.image_parser import load_image_for_ocr
from app.documents.ocr.easyocr_engine import run_ocr, run_ocr_on_bytes
from bson import ObjectId

settings = get_settings()
logger = logging.getLogger(__name__)


async def process_document(
    file_path: str,
    original_filename: str,
    tender_id: Optional[str] = None,
    bidder_id: Optional[str] = None,
    doc_type: str = "general",
) -> Dict:
    """
    Main entry point: detect format, extract text (+ OCR if needed),
    compute confidence, store in DB, return document dict.
    """
    db = get_db()
    ext = Path(file_path).suffix.lower()
    extracted_text = ""
    pages = []
    ocr_confidence = None
    needs_ocr = False
    processing_method = "direct_text"

    try:
        if ext == ".pdf":
            if is_scanned_pdf(file_path):
                # Scanned PDF — OCR each embedded image
                needs_ocr = True
                processing_method = "pdf_ocr"
                images = extract_images_from_pdf(file_path)
                if images:
                    all_texts, all_conf = [], []
                    for img_data in images:
                        text, conf = run_ocr_on_bytes(
                            img_data["image_bytes"],
                            settings.ocr_language_list,
                            settings.ocr_use_gpu,
                        )
                        all_texts.append(text)
                        all_conf.append(conf)
                    extracted_text = "\n".join(all_texts)
                    ocr_confidence = round(sum(all_conf) / len(all_conf), 4) if all_conf else 0.0
                else:
                    # Fallback: run OCR on page renders
                    extracted_text, pages = extract_text_from_pdf(file_path)
            else:
                extracted_text, pages = extract_text_from_pdf(file_path)
                processing_method = "pdf_direct"

        elif ext in (".docx", ".doc"):
            extracted_text, pages = extract_text_from_docx(file_path)
            processing_method = "docx_direct"

        elif ext in (".jpg", ".jpeg", ".png", ".tiff", ".tif", ".bmp"):
            needs_ocr = True
            processing_method = "image_ocr"
            img = load_image_for_ocr(file_path)
            extracted_text, ocr_confidence = run_ocr(
                img, settings.ocr_language_list, settings.ocr_use_gpu
            )

        else:
            extracted_text = ""
            processing_method = "unsupported"

    except Exception as e:
        logger.error(f"Document processing error for {original_filename}: {e}")
        extracted_text = ""
        processing_method = "error"

    # Auto-flag if OCR confidence is below threshold
    flagged_for_review = False
    flag_reason = None
    if needs_ocr and ocr_confidence is not None:
        cfg = await db.system_config.find_one({"key": "global"}) or {}
        threshold = cfg.get("ocr_confidence_threshold", settings.ocr_confidence_threshold)
        if ocr_confidence < threshold:
            flagged_for_review = True
            flag_reason = (
                f"OCR confidence {ocr_confidence:.0%} is below threshold {threshold:.0%}. "
                "Document may be unreadable — manual review required."
            )

    doc = {
        "tender_id": tender_id,
        "bidder_id": bidder_id,
        "original_filename": original_filename,
        "file_path": file_path,
        "doc_type": doc_type,
        "processing_method": processing_method,
        "extracted_text": extracted_text,
        "pages": pages,
        "ocr_confidence": ocr_confidence,
        "flagged_for_review": flagged_for_review,
        "flag_reason": flag_reason,
        "word_count": len(extracted_text.split()),
        "created_at": datetime.utcnow(),
    }
    result = await db.documents.insert_one(doc)
    doc["id"] = str(result.inserted_id)
    doc.pop("_id", None)
    return doc


async def get_document(document_id: str) -> Optional[Dict]:
    db = get_db()
    doc = await db.documents.find_one({"_id": ObjectId(document_id)})
    if doc:
        doc["id"] = str(doc.pop("_id"))
    return doc
