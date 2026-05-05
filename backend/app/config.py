from functools import lru_cache
from typing import List
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Mistral AI
    mistral_api_key: str
    mistral_model_large: str = "mistral-large-latest"
    mistral_model_small: str = "mistral-small-latest"

    # MongoDB
    mongodb_url: str
    db_name: str = "nirnayai"

    # Security
    secret_key: str
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 480

    # OCR
    ocr_languages: str = "en,hi"
    ocr_confidence_threshold: float = 0.70
    ocr_use_gpu: bool = False

    # AI thresholds
    llm_confidence_threshold: float = 0.75

    # File storage
    upload_dir: str = "./uploads"
    max_file_size_mb: int = 50

    # App
    app_env: str = "development"
    cors_origins: str = "http://localhost:5173"
    app_host: str = "0.0.0.0"
    app_port: int = 8000

    @property
    def ocr_language_list(self) -> List[str]:
        return [lang.strip() for lang in self.ocr_languages.split(",")]

    @property
    def cors_origin_list(self) -> List[str]:
        return [o.strip() for o in self.cors_origins.split(",")]

    @property
    def max_file_size_bytes(self) -> int:
        return self.max_file_size_mb * 1024 * 1024

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8", "extra": "ignore"}


@lru_cache()
def get_settings() -> Settings:
    return Settings()
