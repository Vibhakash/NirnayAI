"""
Confidence band labelling.
Tags every LLM verdict with a human-readable confidence tier
so procurement officers can prioritise their review queue.
"""
from typing import Literal

ConfidenceBand = Literal["HIGH", "MEDIUM", "LOW", "UNKNOWN"]

# Thresholds (inclusive lower bound)
HIGH_THRESHOLD = 0.85
MEDIUM_THRESHOLD = 0.65


def get_confidence_band(score: float | None) -> ConfidenceBand:
    """
    Map a 0-1 confidence score to a labelled band.

    HIGH   ≥ 85%   — verdict can be trusted; no manual review needed
    MEDIUM  65–84%  — proceed but worth a spot-check
    LOW    < 65%   — human review strongly recommended
    UNKNOWN        — no score available (e.g. empty document)
    """
    if score is None:
        return "UNKNOWN"
    if score >= HIGH_THRESHOLD:
        return "HIGH"
    if score >= MEDIUM_THRESHOLD:
        return "MEDIUM"
    return "LOW"
