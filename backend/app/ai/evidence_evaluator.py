"""
Evidence evaluator — routes each criterion to the correct handler,
calls Mistral, returns structured verdict with full document traceability
and confidence band labels.
"""
import logging
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, Any, List

from app.ai.mistral_client import chat_json
from app.ai.number_normalizer import normalize_indian_number
from app.ai.confidence_bands import get_confidence_band
from app.config import get_settings
from app.models import CriterionType, VerdictType

settings = get_settings()
logger = logging.getLogger(__name__)

PROMPTS_DIR = Path(__file__).parent / "prompts"
MAX_DOC_TEXT = 30_000  # chars per document sent to LLM


def _load_prompt(filename: str) -> str:
    return (PROMPTS_DIR / filename).read_text(encoding="utf-8")


def _build_numerical_prompt(criterion: Dict, doc_text: str) -> str:
    return _load_prompt("evidence_numerical.txt").format(
        description=criterion["description"],
        threshold_raw=criterion.get("threshold_raw", ""),
        threshold_value=criterion.get("threshold_value", ""),
        comparison_operator=criterion.get("comparison_operator", "gte"),
        document_text=doc_text[:MAX_DOC_TEXT],
    )


def _build_count_prompt(criterion: Dict, doc_text: str) -> str:
    tw = criterion.get("time_window_years")
    time_ctx = f"Time window: last {tw} years" if tw else "No specific time window."
    return _load_prompt("evidence_count.txt").format(
        description=criterion["description"],
        threshold_raw=criterion.get("threshold_raw", ""),
        threshold_value=criterion.get("threshold_value", ""),
        threshold_unit=criterion.get("threshold_unit", "items"),
        time_window_context=time_ctx,
        document_text=doc_text[:MAX_DOC_TEXT],
    )


def _build_date_prompt(criterion: Dict, doc_text: str) -> str:
    tw = criterion.get("time_window_years", 5)
    now = datetime.utcnow()
    window_start = now - timedelta(days=365 * tw)
    return _load_prompt("evidence_date.txt").format(
        description=criterion["description"],
        time_window_years=tw,
        current_date=now.strftime("%d %B %Y"),
        window_start=window_start.strftime("%d %B %Y"),
        document_text=doc_text[:MAX_DOC_TEXT],
    )


def _build_certification_prompt(criterion: Dict, doc_text: str) -> str:
    return _load_prompt("evidence_certification.txt").format(
        description=criterion["description"],
        certification_name=criterion.get("certification_name", criterion["description"]),
        document_text=doc_text[:MAX_DOC_TEXT],
    )


def _build_general_prompt(criterion: Dict, doc_text: str) -> str:
    return _load_prompt("evidence_general.txt").format(
        description=criterion["description"],
        document_text=doc_text[:MAX_DOC_TEXT],
    )


def _get_prompt_for_criterion(criterion: Dict, doc_text: str) -> str:
    c_type = criterion.get("criterion_type", CriterionType.GENERAL.value)
    builders = {
        CriterionType.NUMERICAL.value: _build_numerical_prompt,
        CriterionType.COUNT_BASED.value: _build_count_prompt,
        CriterionType.DATE_BASED.value: _build_date_prompt,
        CriterionType.CERTIFICATION.value: _build_certification_prompt,
        CriterionType.GENERAL.value: _build_general_prompt,
    }
    builder = builders.get(c_type, _build_general_prompt)
    return builder(criterion, doc_text)


def _post_process_verdict(raw: Dict, criterion: Dict, doc: Dict) -> Dict:
    """Validate and enrich raw LLM verdict with confidence bands and traceability."""
    valid_verdicts = {v.value for v in VerdictType}
    if raw.get("verdict") not in valid_verdicts:
        raw["verdict"] = VerdictType.NEEDS_REVIEW.value
        raw["needs_review_reason"] = "LLM returned invalid verdict — defaulting to manual review"

    # Auto-downgrade to NEEDS_REVIEW if LLM confidence is low
    conf = raw.get("confidence_score", 1.0)
    cfg_threshold = settings.llm_confidence_threshold
    if conf < cfg_threshold and raw["verdict"] != VerdictType.NEEDS_REVIEW.value:
        raw["verdict"] = VerdictType.NEEDS_REVIEW.value
        raw["needs_review_reason"] = (
            f"LLM confidence {conf:.0%} below threshold {cfg_threshold:.0%}. "
            "Verdict requires human confirmation."
        )

    # Confidence band label
    raw["confidence_band"] = get_confidence_band(raw.get("confidence_score"))

    # Normalize extracted number values
    if criterion.get("criterion_type") == CriterionType.NUMERICAL.value:
        if raw.get("extracted_value") and raw.get("extracted_value_normalized") is None:
            raw["extracted_value_normalized"] = normalize_indian_number(raw["extracted_value"])

    # Document traceability
    raw["ocr_confidence"] = doc.get("ocr_confidence")
    raw["source_document_id"] = doc.get("id")
    raw["source_document_filename"] = doc.get("original_filename")
    raw["llm_model"] = settings.mistral_model_large
    return raw


async def evaluate_criterion(
    criterion: Dict[str, Any],
    documents: List[Dict[str, Any]],
) -> Dict[str, Any]:
    """
    Evaluate ONE criterion against ALL bidder documents.
    Combines all document texts and calls Mistral once.
    Returns verdict dict with full traceability (source_document_id, source_document_filename).
    """
    # Concatenate all document texts with source labels
    combined_parts = []
    for doc in documents:
        label = f"[Document: {doc.get('original_filename', 'unknown')}]"
        text = doc.get("extracted_text", "")
        if text:
            combined_parts.append(f"{label}\n{text}")

    combined_text = "\n\n---\n\n".join(combined_parts)

    if not combined_text.strip():
        return {
            "verdict": VerdictType.NEEDS_REVIEW.value,
            "extracted_value": None,
            "extracted_value_normalized": None,
            "source_text_span": None,
            "source_document_id": documents[0].get("id") if documents else None,
            "source_document_filename": documents[0].get("original_filename") if documents else None,
            "reasoning": "No readable text found in any submitted document.",
            "confidence_score": 0.0,
            "confidence_band": "UNKNOWN",
            "needs_review_reason": "All documents are empty or unreadable — manual review required.",
            "ocr_confidence": None,
            "llm_model": settings.mistral_model_large,
        }

    prompt = _get_prompt_for_criterion(criterion, combined_text)
    messages = [
        {
            "role": "system",
            "content": "You are an expert government procurement evaluator. Respond only with valid JSON.",
        },
        {"role": "user", "content": prompt},
    ]

    raw = await chat_json(messages, model=settings.mistral_model_large)
    # Use the first document as the primary source for traceability
    primary_doc = documents[0] if documents else {}
    return _post_process_verdict(raw, criterion, primary_doc)
