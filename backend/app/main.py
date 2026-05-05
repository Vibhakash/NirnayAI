import os
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import get_settings
from app.database import connect_db, disconnect_db

# Routers
from app.auth.router import router as auth_router
from app.tenders.router import router as tenders_router
from app.bidders.router import router as bidders_router
from app.evaluation.router import router as evaluation_router
from app.review.router import router as review_router
from app.reports.router import router as reports_router
from app.audit.router import router as audit_router
from app.jobs.router import router as jobs_router
from app.demo.router import router as demo_router
from app.i18n.router import router as i18n_router

settings = get_settings()
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s — %(message)s")
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Connecting to MongoDB Atlas...")
    await connect_db()
    logger.info("MongoDB connected. Indexes ensured.")

    # Ensure upload directory exists
    os.makedirs(settings.upload_dir, exist_ok=True)
    logger.info(f"Upload directory ready: {settings.upload_dir}")

    yield

    # Shutdown
    logger.info("Disconnecting from MongoDB...")
    await disconnect_db()
    logger.info("Shutdown complete.")


app = FastAPI(
    title="NirnayAI — AI-Powered Tender Evaluation",
    description=(
        "End-to-end AI system for government procurement eligibility evaluation. "
        "Extracts criteria from tender documents, evaluates bidder submissions criterion-by-criterion, "
        "surfaces ambiguous cases for human review, and produces auditable procurement reports."
    ),
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Global exception handler — never return unintelligible errors
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception on {request.url}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal error occurred. The event has been logged.", "error": str(exc)},
    )


# Register all routers
app.include_router(auth_router)
app.include_router(jobs_router)
app.include_router(audit_router)
app.include_router(tenders_router)
app.include_router(bidders_router)
app.include_router(evaluation_router)
app.include_router(review_router)
app.include_router(reports_router)
app.include_router(i18n_router)

# Demo seeding — only in development
if settings.app_env == "development":
    app.include_router(demo_router)
    logger.info("Demo router registered (development mode).")


@app.get("/", tags=["Health"])
async def root():
    return {
        "service": "NirnayAI Backend",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs",
    }


@app.get("/health", tags=["Health"])
async def health():
    from app.database import get_db
    try:
        db = get_db()
        await db.command("ping")
        db_status = "connected"
    except Exception as e:
        db_status = f"error: {e}"
    return {"status": "ok", "database": db_status}


@app.get("/config", tags=["Health"])
async def get_config():
    """Returns non-sensitive runtime configuration (for admin verification)."""
    from app.database import get_db
    db = get_db()
    config = await db.system_config.find_one({"key": "global"})
    if config:
        config.pop("_id", None)
    return config or {}
