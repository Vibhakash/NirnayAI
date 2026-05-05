"""
Indian number format normalizer.
Handles: ₹5 crore, ₹50 lakh, 1,50,000, 5 crores, etc.
"""
import re
from typing import Optional


CRORE = 10_000_000   # 1 crore = 10 million
LAKH = 100_000       # 1 lakh = 100 thousand


def normalize_indian_number(text: str) -> Optional[float]:
    """
    Extract and normalize an Indian-format number from text.
    Returns float value in base units (rupees), or None if not parseable.

    Examples:
        "₹5 crore"       → 50_000_000.0
        "50 lakhs"        → 5_000_000.0
        "₹1,50,000"       → 150_000.0
        "Rs. 2.5 crore"   → 25_000_000.0
    """
    if not text:
        return None

    text = text.lower().strip()
    # Remove currency symbols and common prefixes
    text = re.sub(r"[₹$€£]|rs\.?|inr\.?", "", text, flags=re.IGNORECASE).strip()

    # Match pattern: number (with optional decimal/comma) + optional unit
    pattern = r"([\d,]+(?:\.\d+)?)\s*(crore|cr\.?|lakh|lac|l\.?|thousand|k)?"
    match = re.search(pattern, text, re.IGNORECASE)
    if not match:
        return None

    num_str = match.group(1).replace(",", "")
    try:
        value = float(num_str)
    except ValueError:
        return None

    unit = (match.group(2) or "").lower().rstrip(".")
    if unit in ("crore", "cr"):
        value *= CRORE
    elif unit in ("lakh", "lac", "l"):
        value *= LAKH
    elif unit in ("thousand", "k"):
        value *= 1000

    return value


def format_indian_number(value: float) -> str:
    """Format a float value back to Indian number string."""
    if value >= CRORE:
        return f"₹{value / CRORE:.2f} crore"
    elif value >= LAKH:
        return f"₹{value / LAKH:.2f} lakh"
    else:
        return f"₹{value:,.0f}"


def extract_numbers_from_text(text: str) -> list:
    """Extract all numbers (with Indian context) from text."""
    pattern = r"([\d,]+(?:\.\d+)?)\s*(crore|cr\.?|lakh|lac|l\.?|thousand|k)?"
    results = []
    for match in re.finditer(pattern, text, re.IGNORECASE):
        raw = match.group(0)
        normalized = normalize_indian_number(raw)
        if normalized is not None:
            results.append({"raw": raw.strip(), "normalized": normalized})
    return results
