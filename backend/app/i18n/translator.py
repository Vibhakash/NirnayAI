from typing import List
from app.ai.mistral_client import chat_json, chat_text
from app.config import get_settings

settings = get_settings()

LANGUAGE_MAP = {
    "hi": "Hindi",
    "kn": "Kannada",
    "en": "English"
}

async def translate_text_blocks(texts: List[str], target_lang_code: str) -> List[str]:
    """
    Translates a list of text blocks into the target language using Mistral.
    Returns the translated strings in the same order.
    If the target language is English ('en') or invalid, returns the original texts.
    """
    if target_lang_code not in ["hi", "kn"] or not texts:
        return texts

    target_language = LANGUAGE_MAP[target_lang_code]
    
    system_prompt = (
        f"You are a professional translator. "
        f"Translate the following JSON array of strings into {target_language}. "
        f"Preserve formatting, numbers, technical terms (where appropriate), and line breaks. "
        f"Respond ONLY with a JSON array of strings in the exact same order and length."
    )
    
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": str(texts)}
    ]
    
    try:
        # We expect a JSON array like ["string 1", "string 2"]
        result = await chat_json(messages, model=settings.mistral_model_small)
        
        # Verify it's a list and matches the length
        if isinstance(result, list) and len(result) == len(texts):
            return result
        
        # Fallback to single translations if array fails
        return await _fallback_translate_individual(texts, target_language)
    except Exception as e:
        print(f"Translation array error: {e}")
        return await _fallback_translate_individual(texts, target_language)


async def _fallback_translate_individual(texts: List[str], target_language: str) -> List[str]:
    translated = []
    for text in texts:
        if not text.strip():
            translated.append(text)
            continue
            
        messages = [
            {"role": "system", "content": f"You are a professional translator. Translate the following text into {target_language}. Output ONLY the translated text."},
            {"role": "user", "content": text}
        ]
        try:
            res = await chat_text(messages, model=settings.mistral_model_small)
            translated.append(res.strip())
        except Exception:
            translated.append(text) # Fallback to original on failure
    return translated
