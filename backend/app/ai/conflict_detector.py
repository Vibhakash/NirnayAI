"""
Criteria conflict detector.
Scans the extracted criteria list for:
  1. Near-duplicate descriptions (same concept, possibly different thresholds).
  2. Contradictory thresholds on the same concept (e.g. ≥5 crore AND ≤3 crore).
  3. Same criterion_type + certification_name appearing more than once.

Returns a list of conflict dicts that callers can attach to the API response
and store on the tender document for officer review.
"""
import re
from typing import Dict, List, Optional


def _normalise(text: str) -> str:
    """Lower-case, strip punctuation, collapse whitespace."""
    text = text.lower()
    text = re.sub(r"[^\w\s]", " ", text)
    return re.sub(r"\s+", " ", text).strip()


def _jaccard(a: set, b: set) -> float:
    """Simple Jaccard similarity on word-sets."""
    if not a or not b:
        return 0.0
    return len(a & b) / len(a | b)


def detect_conflicts(criteria: List[Dict]) -> List[Dict]:
    """
    Analyse criteria list and return a list of conflict descriptors.

    Each conflict dict:
    {
        "conflict_type": "duplicate_description" | "contradictory_threshold" | "duplicate_certification",
        "criterion_ids": [id1, id2],
        "description": "Human-readable explanation of the conflict",
        "severity": "warning" | "error"
    }
    """
    conflicts: List[Dict] = []

    # Build word-sets for similarity checks
    word_sets = {
        c["criterion_id"]: set(_normalise(c.get("description", "")).split())
        for c in criteria
    }

    n = len(criteria)
    for i in range(n):
        ci = criteria[i]
        for j in range(i + 1, n):
            cj = criteria[j]

            ws_i = word_sets.get(ci["criterion_id"], set())
            ws_j = word_sets.get(cj["criterion_id"], set())
            similarity = _jaccard(ws_i, ws_j)

            # --- 1. Near-duplicate descriptions ---
            if similarity >= 0.75:
                # Check if thresholds differ — that makes it contradictory
                tv_i = ci.get("threshold_value")
                tv_j = cj.get("threshold_value")
                op_i = ci.get("comparison_operator", "")
                op_j = cj.get("comparison_operator", "")

                if (
                    tv_i is not None
                    and tv_j is not None
                    and tv_i != tv_j
                    and op_i == op_j
                ):
                    conflicts.append({
                        "conflict_type": "contradictory_threshold",
                        "criterion_ids": [ci["criterion_id"], cj["criterion_id"]],
                        "description": (
                            f"Criteria '{ci['description'][:60]}' and "
                            f"'{cj['description'][:60]}' appear to describe the same "
                            f"requirement but have different thresholds "
                            f"({ci.get('threshold_raw', tv_i)} vs {cj.get('threshold_raw', tv_j)}). "
                            "Please confirm which applies."
                        ),
                        "severity": "error",
                    })
                elif tv_i == tv_j or (tv_i is None and tv_j is None):
                    conflicts.append({
                        "conflict_type": "duplicate_description",
                        "criterion_ids": [ci["criterion_id"], cj["criterion_id"]],
                        "description": (
                            f"Criteria '{ci['description'][:60]}' and "
                            f"'{cj['description'][:60]}' appear to be duplicates "
                            f"(similarity {similarity:.0%}). Consider removing one."
                        ),
                        "severity": "warning",
                    })

            # --- 2. Same certification appearing twice ---
            cert_i: Optional[str] = ci.get("certification_name")
            cert_j: Optional[str] = cj.get("certification_name")
            if (
                cert_i
                and cert_j
                and cert_i.strip().upper() == cert_j.strip().upper()
                and ci["criterion_id"] != cj["criterion_id"]
            ):
                conflicts.append({
                    "conflict_type": "duplicate_certification",
                    "criterion_ids": [ci["criterion_id"], cj["criterion_id"]],
                    "description": (
                        f"Certification '{cert_i}' is listed in two separate criteria. "
                        "Please merge them or remove the duplicate."
                    ),
                    "severity": "warning",
                })

    return conflicts
