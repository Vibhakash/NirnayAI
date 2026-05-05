from typing import Tuple
from PIL import Image
import io


def load_image_for_ocr(file_path: str) -> Image.Image:
    """Load image file, apply preprocessing to improve OCR accuracy."""
    img = Image.open(file_path)

    # Convert to RGB if needed (handles RGBA, palette mode, etc.)
    if img.mode not in ("RGB", "L"):
        img = img.convert("RGB")

    # Upscale small images (improves OCR accuracy)
    min_dim = 1000
    w, h = img.size
    if w < min_dim or h < min_dim:
        scale = max(min_dim / w, min_dim / h)
        img = img.resize((int(w * scale), int(h * scale)), Image.LANCZOS)

    return img


def image_to_bytes(img: Image.Image, fmt: str = "PNG") -> bytes:
    buf = io.BytesIO()
    img.save(buf, format=fmt)
    return buf.getvalue()
