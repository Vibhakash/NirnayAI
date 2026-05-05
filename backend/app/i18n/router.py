from typing import List
from pydantic import BaseModel
from fastapi import APIRouter, Depends
from app.auth.dependencies import get_current_user
from app.i18n.translator import translate_text_blocks

router = APIRouter(prefix="/translate", tags=["Translation"])

class TranslationRequest(BaseModel):
    texts: List[str]
    target_language: str

class TranslationResponse(BaseModel):
    translations: List[str]

@router.post("", response_model=TranslationResponse)
async def translate_text(
    req: TranslationRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Dynamically translate an array of text strings into the target language.
    Supported languages: 'en' (English), 'hi' (Hindi), 'kn' (Kannada).
    Used by the frontend to translate dynamic content like LLM reasoning or tender descriptions.
    """
    valid_langs = ["en", "hi", "kn"]
    target = req.target_language
    if target not in valid_langs:
        # Fallback to English/original if invalid
        target = "en"
        
    if target == "en" or not req.texts:
        return {"translations": req.texts}
        
    translated = await translate_text_blocks(req.texts, target)
    return {"translations": translated}
