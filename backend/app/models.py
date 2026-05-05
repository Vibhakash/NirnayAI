from enum import Enum
from typing import Optional, Any, Dict
from datetime import datetime
from pydantic import BaseModel, Field
from bson import ObjectId


class PyObjectId(str):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(str(v)):
            raise ValueError("Invalid ObjectId")
        return str(v)


class VerdictType(str, Enum):
    ELIGIBLE = "ELIGIBLE"
    INELIGIBLE = "INELIGIBLE"
    NEEDS_REVIEW = "NEEDS_REVIEW"


class CriterionType(str, Enum):
    NUMERICAL = "numerical"
    COUNT_BASED = "count_based"
    DATE_BASED = "date_based"
    CERTIFICATION = "certification"
    GENERAL = "general"


class UserRole(str, Enum):
    PROCUREMENT_OFFICER = "procurement_officer"


class TenderStatus(str, Enum):
    UPLOADED = "uploaded"
    EXTRACTING_CRITERIA = "extracting_criteria"
    CRITERIA_READY = "criteria_ready"
    EVALUATING = "evaluating"
    COMPLETED = "completed"
    SIGNED_OFF = "signed_off"


class JobStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"


class JobType(str, Enum):
    CRITERIA_EXTRACTION = "criteria_extraction"
    EVALUATION = "evaluation"
    DOCUMENT_PROCESSING = "document_processing"


class AuditActionType(str, Enum):
    USER_REGISTERED = "USER_REGISTERED"
    USER_LOGIN = "USER_LOGIN"
    TENDER_CREATED = "TENDER_CREATED"
    TENDER_UPDATED = "TENDER_UPDATED"
    CRITERIA_EXTRACTED = "CRITERIA_EXTRACTED"
    CRITERIA_CONFIRMED = "CRITERIA_CONFIRMED"
    CRITERION_ADDED = "CRITERION_ADDED"
    CRITERION_EDITED = "CRITERION_EDITED"
    CRITERION_DELETED = "CRITERION_DELETED"
    BIDDER_CREATED = "BIDDER_CREATED"
    DOCUMENT_UPLOADED = "DOCUMENT_UPLOADED"
    EVALUATION_STARTED = "EVALUATION_STARTED"
    VERDICT_CREATED = "VERDICT_CREATED"
    HUMAN_OVERRIDE = "HUMAN_OVERRIDE"
    REPORT_GENERATED = "REPORT_GENERATED"
    REPORT_SIGNED_OFF = "REPORT_SIGNED_OFF"
    SYSTEM_CONFIG_UPDATED = "SYSTEM_CONFIG_UPDATED"


def doc_to_dict(doc: Dict) -> Dict:
    """Convert MongoDB document _id to string id."""
    if doc and "_id" in doc:
        doc["id"] = str(doc.pop("_id"))
    return doc


class BaseResponse(BaseModel):
    id: Optional[str] = None
    created_at: Optional[datetime] = None

    model_config = {"populate_by_name": True, "arbitrary_types_allowed": True}
