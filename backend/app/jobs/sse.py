"""
Server-Sent Events (SSE) endpoint for real-time job progress streaming.

Clients open GET /jobs/{job_id}/stream?token=<jwt> and receive a stream of
progress events until the job completes, fails, or the connection is dropped.

Token is accepted as a query parameter because the browser's native
EventSource API cannot set custom headers.
"""
import asyncio
import json
import logging
from typing import AsyncGenerator

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse

from app.auth.dependencies import decode_token
from app.database import get_db
from app.jobs.service import get_job
from app.models import JobStatus

logger = logging.getLogger(__name__)
router = APIRouter(tags=["Jobs"])

POLL_INTERVAL = 1.5   # seconds between DB polls
TERMINAL_STATUSES = {JobStatus.COMPLETED.value, JobStatus.FAILED.value}


async def _event_stream(job_id: str) -> AsyncGenerator[str, None]:
    """
    Poll the job document and yield SSE-formatted events.
    Terminates when the job reaches a terminal state.
    """
    db = get_db()
    last_pct = -1
    last_msg = ""

    try:
        while True:
            job = await get_job(job_id)
            if not job:
                yield _sse_event({"error": "Job not found"}, event="error")
                return

            pct = job.get("progress_pct", 0)
            msg = job.get("progress_message", "")
            status = job.get("status", "")

            # Only emit if something changed (avoids flooding)
            if pct != last_pct or msg != last_msg:
                payload = {
                    "job_id": job_id,
                    "status": status,
                    "progress_pct": pct,
                    "progress_message": msg,
                    "error_message": job.get("error_message"),
                }
                yield _sse_event(payload, event="progress")
                last_pct = pct
                last_msg = msg

            if status in TERMINAL_STATUSES:
                # Send a final event so the client knows to close
                yield _sse_event(
                    {"job_id": job_id, "status": status, "final": True},
                    event="done",
                )
                return

            await asyncio.sleep(POLL_INTERVAL)

    except asyncio.CancelledError:
        logger.info(f"SSE stream cancelled for job {job_id}")
    except Exception as e:
        logger.error(f"SSE stream error for job {job_id}: {e}")
        yield _sse_event({"error": str(e)}, event="error")


def _sse_event(data: dict, event: str = "message") -> str:
    """Format a dict as an SSE message string."""
    return f"event: {event}\ndata: {json.dumps(data)}\n\n"


@router.get("/{job_id}/stream")
async def stream_job_progress(
    job_id: str,
    token: str = Query(..., description="JWT access token (required for EventSource)"),
):
    """
    Stream real-time job progress via Server-Sent Events.
    Connect using: `new EventSource('/jobs/{job_id}/stream?token=<jwt>')`

    Events emitted:
    - `progress` — periodic progress update
    - `done`     — terminal state reached (COMPLETED or FAILED)
    - `error`    — unexpected error
    """
    # Validate token manually (can't use Depends here with SSE + query param)
    user = decode_token(token)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    # Verify job exists
    job = await get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    return StreamingResponse(
        _event_stream(job_id),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",   # Disable nginx buffering
            "Connection": "keep-alive",
        },
    )
