"""
Pre-evaluation completeness checker.

For each bidder × criterion pair, determines whether the bidder has submitted
any document that contains text plausibly relevant to that criterion.
This gives procurement officers a readiness report *before* the AI evaluation
runs, so they can request missing documents early.
"""
import re
from typing import Dict, List


def _criterion_keywords(criterion: Dict) -> List[str]:
    """
    Extract key search terms from a criterion for heuristic matching.
    Uses description words + certification name + threshold_raw.
    """
    words: List[str] = []

    desc = criterion.get("description", "")
    # Take significant words (≥4 chars) from description
    words += [w.lower() for w in re.findall(r"\b\w{4,}\b", desc)]

    cert = criterion.get("certification_name")
    if cert:
        words.append(cert.lower())

    raw = criterion.get("threshold_raw", "")
    if raw:
        words += [w.lower() for w in re.findall(r"\b\w{3,}\b", raw)]

    return list(set(words))


def _doc_covers_criterion(doc_text: str, keywords: List[str]) -> bool:
    """
    Heuristic: a document 'covers' a criterion if at least 2 of its keywords
    appear in the document text.
    """
    if not doc_text or not keywords:
        return False
    text_lower = doc_text.lower()
    hits = sum(1 for kw in keywords if kw in text_lower)
    return hits >= max(2, len(keywords) // 3)


def check_completeness(
    bidder: Dict,
    criteria: List[Dict],
    documents: List[Dict],
) -> Dict:
    """
    Returns a completeness report for one bidder:
    {
        "bidder_id": str,
        "bidder_name": str,
        "total_criteria": int,
        "covered_criteria": int,
        "missing_criteria": int,
        "readiness_pct": float,          # 0-100
        "criteria_coverage": [           # per-criterion breakdown
            {
                "criterion_id": str,
                "description": str,
                "is_mandatory": bool,
                "covered": bool,         # at least one doc plausibly covers it
                "covering_documents": [str],   # filenames that cover it
            }
        ]
    }
    """
    coverage_items = []
    covered_count = 0

    for crit in criteria:
        keywords = _criterion_keywords(crit)
        covering_docs = []
        for doc in documents:
            text = doc.get("extracted_text", "")
            if _doc_covers_criterion(text, keywords):
                covering_docs.append(doc.get("original_filename", doc.get("id", "unknown")))

        is_covered = len(covering_docs) > 0
        if is_covered:
            covered_count += 1

        coverage_items.append({
            "criterion_id": crit.get("criterion_id"),
            "description": crit.get("description", ""),
            "is_mandatory": crit.get("is_mandatory", True),
            "covered": is_covered,
            "covering_documents": covering_docs,
        })

    total = len(criteria)
    readiness_pct = round((covered_count / total * 100) if total > 0 else 0.0, 1)

    return {
        "bidder_id": bidder.get("id"),
        "bidder_name": bidder.get("name"),
        "total_criteria": total,
        "covered_criteria": covered_count,
        "missing_criteria": total - covered_count,
        "readiness_pct": readiness_pct,
        "criteria_coverage": coverage_items,
    }
