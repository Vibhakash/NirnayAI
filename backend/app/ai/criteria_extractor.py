"""
Criteria extraction pipeline.
Reads tender document text → calls Mistral → returns structured criteria list.
"""
import logging
import uuid
from pathlib import Path
from typing import List, Dict, Any

from app.ai.mistral_client import chat_json
from app.ai.number_normalizer import normalize_indian_number
from app.config import get_settings
from app.models import CriterionType

settings = get_settings()
logger = logging.getLogger(__name__)

PROMPT_PATH = Path(__file__).parent / "prompts" / "criteria_extraction.txt"

# Max characters of tender text sent to LLM (avoid token limits)
MAX_TEXT_LENGTH = 40_000


def _load_prompt(tender_text: str) -> str:
    template = PROMPT_PATH.read_text(encoding="utf-8")
    truncated = tender_text[:MAX_TEXT_LENGTH]
    if len(tender_text) > MAX_TEXT_LENGTH:
        truncated += "\n\n[Document truncated for processing. Remaining pages not shown.]"
    return template.replace("{tender_text}", truncated)


def _enrich_criterion(raw: Dict[str, Any]) -> Dict[str, Any]:
    """Post-process LLM output: normalize numbers, assign IDs, validate types."""
    raw["criterion_id"] = f"crit_{uuid.uuid4().hex[:8]}"

    # Validate criterion_type
    valid_types = {t.value for t in CriterionType}
    if raw.get("criterion_type") not in valid_types:
        raw["criterion_type"] = CriterionType.GENERAL.value

    # Normalize threshold_value for numerical types
    if raw.get("criterion_type") == CriterionType.NUMERICAL.value:
        if raw.get("threshold_raw") and not raw.get("threshold_value"):
            normalized = normalize_indian_number(raw["threshold_raw"])
            raw["threshold_value"] = normalized

    # Ensure required fields have defaults
    raw.setdefault("is_mandatory", True)
    raw.setdefault("comparison_operator", "gte")
    raw.setdefault("time_window_years", None)
    raw.setdefault("certification_name", None)
    raw.setdefault("source_text", "")
    raw.setdefault("source_page", None)
    raw.setdefault("edited", False)

    return raw


async def extract_criteria_from_text(tender_text: str) -> List[Dict[str, Any]]:
    """
    Main function: extract criteria from tender text.
    Returns list of enriched criterion dicts.
    """
    prompt = _load_prompt(tender_text)
    messages = [
        {
            "role": "system",
            "content": "You are an expert in Indian government procurement. Always respond with valid JSON only.",
        },
        {"role": "user", "content": prompt},
    ]

    result = await chat_json(messages, model=settings.mistral_model_large)

    raw_criteria = result.get("criteria", [])
    if not isinstance(raw_criteria, list):
        logger.error(f"Unexpected LLM response structure: {result}")
        return []

    enriched = [_enrich_criterion(c) for c in raw_criteria if isinstance(c, dict)]
    logger.info(f"Extracted {len(enriched)} criteria from tender document")
    return enriched
