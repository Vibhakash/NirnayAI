from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel
from app.models import TenderStatus, CriterionType


class CriterionIn(BaseModel):
    description: str
    criterion_type: CriterionType = CriterionType.GENERAL
    threshold_value: Optional[float] = None
    threshold_raw: Optional[str] = None
    threshold_unit: Optional[str] = None
    comparison_operator: Optional[str] = "gte"
    time_window_years: Optional[int] = None
    certification_name: Optional[str] = None
    is_mandatory: bool = True
    source_text: Optional[str] = None
    source_page: Optional[int] = None


class TenderCreate(BaseModel):
    title: str
    department: Optional[str] = None
    reference_number: Optional[str] = None
    description: Optional[str] = None


class TenderResponse(BaseModel):
    id: str
    title: str
    department: Optional[str]
    reference_number: Optional[str]
    description: Optional[str]
    status: str
    document_id: Optional[str]
    criteria: List[Dict[str, Any]] = []
    created_by: str
    created_at: datetime
    signed_off_by: Optional[str] = None
    signed_off_at: Optional[datetime] = None

    model_config = {"arbitrary_types_allowed": True}
