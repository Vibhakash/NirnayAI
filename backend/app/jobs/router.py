from fastapi import APIRouter, HTTPException
from app.jobs.service import get_job
from app.jobs.sse import router as sse_router

router = APIRouter(prefix="/jobs", tags=["Jobs"])

# Mount SSE streaming routes
router.include_router(sse_router)


@router.get("/{job_id}")
async def get_job_status(job_id: str):
    """Poll this endpoint to track background task progress. Also see GET /jobs/{job_id}/stream for SSE."""
    job = await get_job(job_id)
    if not job:
        raise HTTPException(404, "Job not found")
    return job
