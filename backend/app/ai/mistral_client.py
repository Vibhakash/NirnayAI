"""
Mistral API client wrapper with retry logic and structured JSON output.
"""
import json
import logging
import asyncio
from typing import List, Dict, Any, Optional
from mistralai import Mistral
from app.config import get_settings

settings = get_settings()
logger = logging.getLogger(__name__)

_client: Optional[Mistral] = None


def get_mistral_client() -> Mistral:
    global _client
    if _client is None:
        _client = Mistral(api_key=settings.mistral_api_key)
    return _client


async def chat_json(
    messages: List[Dict[str, str]],
    model: Optional[str] = None,
    max_retries: int = 3,
    temperature: float = 0.1,
) -> Dict[str, Any]:
    """
    Call Mistral with JSON mode enabled.
    Returns parsed dict. Raises on repeated failure.
    temperature=0.1 for deterministic, consistent evaluation outputs.
    """
    client = get_mistral_client()
    model = model or settings.mistral_model_large
    last_error = None

    for attempt in range(1, max_retries + 1):
        try:
            response = await client.chat.complete_async(
                model=model,
                messages=messages,
                temperature=temperature,
                response_format={"type": "json_object"},
            )
            content = response.choices[0].message.content
            return json.loads(content)
        except json.JSONDecodeError as e:
            logger.warning(f"Attempt {attempt}: JSON decode error: {e}")
            last_error = e
        except Exception as e:
            err_msg = str(e).lower()
            if "429" in err_msg or "rate limit" in err_msg:
                logger.warning(f"Attempt {attempt}: Rate limit hit. Retrying...")
            else:
                logger.warning(f"Attempt {attempt}: Mistral API error: {e}")
            last_error = e
            if attempt < max_retries:
                # Increased backoff for rate limits
                sleep_time = (2 ** attempt) + (5 if "429" in err_msg or "rate limit" in err_msg else 0)
                await asyncio.sleep(sleep_time)

    if "429" in str(last_error) or "rate limit" in str(last_error).lower():
        raise RuntimeError("The AI service is currently experiencing high traffic (Rate Limit). Please try again in a few moments or review manually.")
    raise RuntimeError(f"Mistral API failed after {max_retries} attempts: {last_error}")


async def chat_text(
    messages: List[Dict[str, str]],
    model: Optional[str] = None,
    max_retries: int = 2,
    temperature: float = 0.2,
) -> str:
    """Call Mistral and return plain text response."""
    client = get_mistral_client()
    model = model or settings.mistral_model_small
    last_error = None

    for attempt in range(1, max_retries + 1):
        try:
            response = await client.chat.complete_async(
                model=model,
                messages=messages,
                temperature=temperature,
            )
            return response.choices[0].message.content
        except Exception as e:
            logger.warning(f"Attempt {attempt}: {e}")
            last_error = e
            if attempt < max_retries:
                await asyncio.sleep(2 ** attempt)

    raise RuntimeError(f"Mistral API failed: {last_error}")
