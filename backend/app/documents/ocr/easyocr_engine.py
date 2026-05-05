"""
EasyOCR engine — singleton pattern to avoid re-loading models on every call.
Models download automatically (~500MB) on first initialization.
"""
import logging
from typing import List, Tuple, Optional
from PIL import Image

logger = logging.getLogger(__name__)

_reader = None


def get_ocr_reader(languages: List[str], use_gpu: bool = False):
    """Return singleton EasyOCR reader. Initializes on first call."""
    global _reader
    if _reader is None:
        try:
            import easyocr
            logger.info(f"Initializing EasyOCR with languages: {languages}")
            _reader = easyocr.Reader(languages, gpu=use_gpu)
            logger.info("EasyOCR initialized successfully")
        except Exception as e:
            logger.error(f"EasyOCR initialization failed: {e}")
            raise RuntimeError(f"OCR engine could not start: {e}")
    return _reader


def run_ocr(
    image: Image.Image,
    languages: List[str],
    use_gpu: bool = False,
) -> Tuple[str, float]:
    """
    Run OCR on a PIL Image.
    Returns (extracted_text, confidence_score) where confidence is 0.0–1.0.
    """
    import numpy as np

    reader = get_ocr_reader(languages, use_gpu)
    img_array = np.array(image)

    results = reader.readtext(img_array, detail=1, paragraph=False)
    # results: list of (bbox, text, confidence)

    if not results:
        return "", 0.0

    texts = []
    confidences = []
    for (_bbox, text, conf) in results:
        if text.strip():
            texts.append(text.strip())
            confidences.append(conf)

    full_text = " ".join(texts)
    avg_confidence = sum(confidences) / len(confidences) if confidences else 0.0

    return full_text, round(avg_confidence, 4)


def run_ocr_on_file(
    file_path: str,
    languages: List[str],
    use_gpu: bool = False,
) -> Tuple[str, float]:
    """Convenience: run OCR directly on an image file path."""
    from app.documents.parsers.image_parser import load_image_for_ocr
    img = load_image_for_ocr(file_path)
    return run_ocr(img, languages, use_gpu)


def run_ocr_on_bytes(
    image_bytes: bytes,
    languages: List[str],
    use_gpu: bool = False,
) -> Tuple[str, float]:
    """Run OCR on raw image bytes (e.g., extracted from a scanned PDF page)."""
    import io
    img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    return run_ocr(img, languages, use_gpu)
