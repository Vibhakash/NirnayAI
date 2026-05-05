from typing import List, Dict, Tuple
import fitz  # PyMuPDF


def extract_text_from_pdf(file_path: str) -> Tuple[str, List[Dict]]:
    """
    Extract text from a digital PDF with page-level metadata.
    Returns (full_text, pages) where pages is a list of
    {"page_num": int, "text": str, "char_offset_start": int, "char_offset_end": int}.
    """
    doc = fitz.open(file_path)
    pages = []
    full_text_parts = []
    offset = 0

    for page_num, page in enumerate(doc, start=1):
        text = page.get_text("text")
        pages.append({
            "page_num": page_num,
            "text": text,
            "char_offset_start": offset,
            "char_offset_end": offset + len(text),
        })
        full_text_parts.append(text)
        offset += len(text)

    doc.close()
    return "\n".join(full_text_parts), pages


def extract_images_from_pdf(file_path: str) -> List[Dict]:
    """Extract embedded images from PDF pages (for scanned PDFs)."""
    doc = fitz.open(file_path)
    images = []
    for page_num, page in enumerate(doc, start=1):
        img_list = page.get_images(full=True)
        for img_idx, img in enumerate(img_list):
            xref = img[0]
            base_image = doc.extract_image(xref)
            images.append({
                "page_num": page_num,
                "img_index": img_idx,
                "image_bytes": base_image["image"],
                "ext": base_image["ext"],
            })
    doc.close()
    return images


def is_scanned_pdf(file_path: str, text_threshold: int = 50) -> bool:
    """Heuristic: PDF is scanned if it has very little extractable text."""
    full_text, _ = extract_text_from_pdf(file_path)
    return len(full_text.strip()) < text_threshold
