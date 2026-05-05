from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from app.config import get_settings

settings = get_settings()


class _Database:
    client: AsyncIOMotorClient = None
    db: AsyncIOMotorDatabase = None


_db = _Database()


async def connect_db() -> None:
    _db.client = AsyncIOMotorClient(settings.mongodb_url)
    _db.db = _db.client[settings.db_name]
    await _create_indexes()
    await _init_system_config()


async def disconnect_db() -> None:
    if _db.client:
        _db.client.close()


def get_db() -> AsyncIOMotorDatabase:
    return _db.db


async def _create_indexes() -> None:
    db = _db.db
    # audit_log — append-only, queried by timestamp, entity, user
    await db.audit_log.create_index([("timestamp", -1)])
    await db.audit_log.create_index([("entity_id", 1)])
    await db.audit_log.create_index([("user_id", 1)])
    await db.audit_log.create_index([("action_type", 1)])

    # tenders
    await db.tenders.create_index([("created_by", 1)])
    await db.tenders.create_index([("status", 1)])
    await db.tenders.create_index([("created_at", -1)])

    # bidders
    await db.bidders.create_index([("tender_id", 1)])
    await db.bidders.create_index([("tender_id", 1), ("overall_verdict", 1)])

    # verdicts — core query: all verdicts for a tender, per bidder+criterion
    await db.verdicts.create_index([("tender_id", 1), ("bidder_id", 1)])
    await db.verdicts.create_index([("tender_id", 1), ("verdict", 1)])
    await db.verdicts.create_index([("criterion_id", 1)])
    await db.verdicts.create_index([("verdict", 1)])

    # jobs
    await db.jobs.create_index([("tender_id", 1)])
    await db.jobs.create_index([("status", 1)])
    await db.jobs.create_index([("created_at", -1)])

    # users
    await db.users.create_index([("email", 1)], unique=True)
    await db.users.create_index([("username", 1)], unique=True)

    # documents
    await db.documents.create_index([("bidder_id", 1)])
    await db.documents.create_index([("tender_id", 1)])


async def _init_system_config() -> None:
    """Insert default system config if not present."""
    db = _db.db
    existing = await db.system_config.find_one({"key": "global"})
    if not existing:
        await db.system_config.insert_one({
            "key": "global",
            "ocr_confidence_threshold": settings.ocr_confidence_threshold,
            "llm_confidence_threshold": settings.llm_confidence_threshold,
            "ocr_languages": settings.ocr_language_list,
            "max_file_size_mb": settings.max_file_size_mb,
            "auto_flag_low_ocr": True,
            "auto_flag_low_llm": True,
        })
