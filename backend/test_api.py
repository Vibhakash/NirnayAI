"""
NirnayAI Backend — Comprehensive API Test Suite
Tests all endpoints including new features added in Phase 2.

Run with:  .\\venv\\Scripts\\python.exe test_api.py
Assumes the server is already running on http://localhost:8000
"""
import json
import sys
import io
import time
import requests

# Force UTF-8 output on Windows
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

BASE = "http://localhost:8000"
PASS = "[PASS]"
FAIL = "[FAIL]"
WARN = "[SKIP]"

results = {"passed": 0, "failed": 0, "skipped": 0}


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def req(method: str, path: str, **kwargs):
    url = f"{BASE}{path}"
    resp = getattr(requests, method.lower())(url, timeout=15, **kwargs)
    try:
        body = resp.json()
    except Exception:
        body = resp.text
    return resp.status_code, body


def check(label: str, condition: bool, detail: str = ""):
    if condition:
        print(f"  {PASS} {label}")
        results["passed"] += 1
    else:
        print(f"  {FAIL} {label}" + (f" | {detail}" if detail else ""))
        results["failed"] += 1


def skip(label: str, reason: str = ""):
    print(f"  {WARN} SKIP {label}" + (f" — {reason}" if reason else ""))
    results["skipped"] += 1


def section(title: str):
    print(f"\n{'='*60}")
    print(f"  {title}")
    print(f"{'='*60}")


# ---------------------------------------------------------------------------
# 1. Health checks
# ---------------------------------------------------------------------------

section("1. Health Checks")

s, b = req("GET", "/")
check("Root endpoint returns 200", s == 200)
check("Root has service field", isinstance(b, dict) and "service" in b)

s, b = req("GET", "/health")
check("Health endpoint returns 200", s == 200)
check("Health shows database status", isinstance(b, dict) and "database" in b,
      str(b))


# ---------------------------------------------------------------------------
# 2. Authentication
# ---------------------------------------------------------------------------

section("2. Authentication")

# Try the seed-admin endpoint first (works only if DB has no users)
s_seed, b_seed = req("POST", "/auth/seed-admin")
if s_seed == 201:
    print("  [INFO] Seeded initial admin via /auth/seed-admin")
    ADMIN_USER, ADMIN_PASS = "admin", "Admin@123"
elif s_seed == 400:
    # Users already exist — try known credentials in order
    ADMIN_USER, ADMIN_PASS = None, None
    for user, pwd in [
        ("admin", "Admin@123"),
        ("test_admin", "Admin@123456"),
        ("admin", "Admin@123456"),
    ]:
        ts, tb = req("POST", "/auth/login",
                     data={"username": user, "password": pwd},
                     headers={"Content-Type": "application/x-www-form-urlencoded"})
        if ts == 200 and isinstance(tb, dict) and "access_token" in tb:
            ADMIN_USER, ADMIN_PASS = user, pwd
            break
    if not ADMIN_USER:
        print("  [FAIL] Could not find working admin credentials — aborting")
        sys.exit(1)
else:
    print(f"  [FAIL] seed-admin returned unexpected {s_seed}: {b_seed}")
    sys.exit(1)

check("Seed or discover admin account", True)

# Login
s, b = req("POST", "/auth/login",
           data={"username": ADMIN_USER, "password": ADMIN_PASS},
           headers={"Content-Type": "application/x-www-form-urlencoded"})
check("Admin login returns 200", s == 200, str(b)[:200])
check("Login returns access_token", isinstance(b, dict) and "access_token" in b,
      str(b)[:200])

if not isinstance(b, dict) or "access_token" not in b:
    print("  [FAIL] FATAL: Cannot get token — aborting remaining tests")
    sys.exit(1)

TOKEN = b["access_token"]
auth = {"Authorization": f"Bearer {TOKEN}"}

# Token me
s, b = req("GET", "/auth/me", headers=auth)
check("GET /auth/me returns current user", s == 200)
check("User has correct role", isinstance(b, dict) and b.get("role") == "admin")


# ---------------------------------------------------------------------------
# 3. Tender management
# ---------------------------------------------------------------------------

section("3. Tender Management")

# List tenders (may be empty)
s, b = req("GET", "/tenders", headers=auth)
check("List tenders returns 200", s == 200)
check("Tenders response has 'total' field", isinstance(b, dict) and "total" in b)

TENDER_ID = None
JOB_ID = None

# Upload tender — we use NirnayAI.docx if available, else skip
import os
docx_path = os.path.join(os.path.dirname(__file__), "..", "NirnayAI.docx")

if os.path.exists(docx_path):
    with open(docx_path, "rb") as fh:
        s, b = req("POST", "/tenders/upload",
                   headers=auth,
                   params={
                       "title": "Test Construction Tender",
                       "department": "PWD Test",
                       "reference_number": "TEST/2025/001",
                   },
                   files={"file": ("NirnayAI.docx", fh,
                                   "application/vnd.openxmlformats-officedocument.wordprocessingml.document")})
    check("Upload tender returns 201", s == 201, str(b)[:200])
    if isinstance(b, dict):
        TENDER_ID = b.get("tender", {}).get("id")
        JOB_ID = b.get("job_id")
        check("Tender ID returned", bool(TENDER_ID))
        check("Job ID returned", bool(JOB_ID))
else:
    skip("Upload tender", "NirnayAI.docx not found at project root")


# ---------------------------------------------------------------------------
# 4. Demo seeding (instant scenario, no file upload needed)
# ---------------------------------------------------------------------------

section("4. Demo Seeding")

s, b = req("POST", "/demo/seed", headers=auth)
check("POST /demo/seed returns 201", s == 201, str(b)[:300])
if isinstance(b, dict):
    check("Demo returns tender_id", bool(b.get("tender_id")))
    check("Demo creates 10 bidders", b.get("bidders_created") == 10)
    check("Demo creates 4 criteria", b.get("criteria_count") == 4)

    DEMO_TENDER_ID = b.get("tender_id")
    summary = b.get("summary", {})
    print(f"    Demo summary: {summary}")
    check("Demo has ELIGIBLE bidders", summary.get("ELIGIBLE", 0) > 0)
    check("Demo has INELIGIBLE bidders", summary.get("INELIGIBLE", 0) > 0)
    check("Demo has NEEDS_REVIEW bidder", summary.get("NEEDS_REVIEW", 0) > 0)
else:
    DEMO_TENDER_ID = None
    skip("Demo validation", "Seed returned unexpected response")


# ---------------------------------------------------------------------------
# 5. Criteria confirmation (advisory)
# ---------------------------------------------------------------------------

section("5. Criteria Confirmation")

if DEMO_TENDER_ID:
    s, b = req("POST", f"/tenders/{DEMO_TENDER_ID}/criteria/confirm", headers=auth)
    check("POST /criteria/confirm returns 200", s == 200, str(b)[:200])
    if isinstance(b, dict):
        check("Response has confirmed_by", bool(b.get("confirmed_by")))
        check("Response has criteria_count", b.get("criteria_count", 0) > 0)
        check("Warnings is a list", isinstance(b.get("warnings"), list))
else:
    skip("Criteria confirmation", "No demo tender ID")


# ---------------------------------------------------------------------------
# 6. Evaluation summary and results (demo data)
# ---------------------------------------------------------------------------

section("6. Evaluation Results (Demo Data)")

if DEMO_TENDER_ID:
    s, b = req("GET", f"/tenders/{DEMO_TENDER_ID}/summary", headers=auth)
    check("GET /summary returns 200", s == 200, str(b)[:200])
    if isinstance(b, dict):
        check("Summary has eligible_count", "eligible_count" in b)
        check("Summary has ineligible_count", "ineligible_count" in b)
        check("Summary has needs_review_count", "needs_review_count" in b)
        print(f"    Bidder summary: E={b.get('eligible_count')} I={b.get('ineligible_count')} NR={b.get('needs_review_count')}")

    s, b = req("GET", f"/tenders/{DEMO_TENDER_ID}/results", headers=auth)
    check("GET /results returns 200", s == 200, str(b)[:200])
    if isinstance(b, dict):
        check("Results has total_verdicts > 0", b.get("total_verdicts", 0) > 0)
        check("Results has bidders list", isinstance(b.get("bidders"), list))

        # Check confidence bands present
        if b.get("bidders"):
            first_v = b["bidders"][0].get("verdicts", [{}])[0]
            check("Verdict has confidence_band", "confidence_band" in first_v,
                  str(first_v.keys()))
            check("Verdict has source_document_filename", "source_document_filename" in first_v)
            check("Verdict has is_mandatory field", "is_mandatory" in first_v)
else:
    skip("Evaluation results", "No demo tender ID")


# ---------------------------------------------------------------------------
# 7. Pre-evaluation completeness check
# ---------------------------------------------------------------------------

section("7. Completeness Check")

if DEMO_TENDER_ID:
    s, b = req("GET", f"/tenders/{DEMO_TENDER_ID}/completeness", headers=auth)
    # Demo bidders have no documents, so completeness will be low — that's expected
    check("GET /completeness returns 200 or 400", s in (200, 400), str(b)[:200])
    if s == 200 and isinstance(b, dict):
        check("Has total_bidders", "total_bidders" in b)
        check("Has bidder_reports list", isinstance(b.get("bidder_reports"), list))
else:
    skip("Completeness check", "No demo tender ID")


# ---------------------------------------------------------------------------
# 8. Per-bidder re-evaluation
# ---------------------------------------------------------------------------

section("8. Per-Bidder Re-Evaluation")

if DEMO_TENDER_ID:
    # Get one bidder from the demo tender
    s, b = req("GET", f"/tenders/{DEMO_TENDER_ID}/bidders", headers=auth)
    if s == 200 and isinstance(b, list) and len(b) > 0:
        demo_bidder_id = b[0]["id"]
        s2, b2 = req("POST",
                     f"/tenders/{DEMO_TENDER_ID}/bidders/{demo_bidder_id}/evaluate",
                     headers=auth)
        check("POST /bidders/{id}/evaluate returns 202", s2 == 202, str(b2)[:200])
        if isinstance(b2, dict):
            check("Re-eval returns job_id", bool(b2.get("job_id")))
            check("Re-eval returns bidder_name", bool(b2.get("bidder_name")))
    else:
        skip("Per-bidder re-eval", "Could not fetch demo bidders")
else:
    skip("Per-bidder re-evaluation", "No demo tender ID")


# ---------------------------------------------------------------------------
# 9. Review queue
# ---------------------------------------------------------------------------

section("9. Review Queue")

if DEMO_TENDER_ID:
    s, b = req("GET", f"/tenders/{DEMO_TENDER_ID}/review-queue", headers=auth)
    check("GET /review-queue returns 200", s == 200, str(b)[:200])
    if isinstance(b, dict):
        check("Review queue has pending_review_count", "pending_review_count" in b)
        check("Review queue has items list", isinstance(b.get("items"), list))
        nr_count = b.get("pending_review_count", 0)
        print(f"    {nr_count} item(s) pending manual review")

        # Submit a review if there are items
        items = b.get("items", [])
        if items:
            verdict_id = items[0].get("id")
            s2, b2 = req("POST",
                         f"/tenders/{DEMO_TENDER_ID}/review/{verdict_id}",
                         headers=auth,
                         json={
                             "decision": "ELIGIBLE",
                             "reasoning": "Manual review: document verified by officer",
                             "notes": "Automated test override",
                         })
            check("POST /review/{verdict_id} returns 200", s2 == 200, str(b2)[:200])
            if isinstance(b2, dict):
                check("Review records effective_verdict", bool(b2.get("effective_verdict")))
        else:
            skip("Review submission", "No NEEDS_REVIEW items in queue")
else:
    skip("Review queue", "No demo tender ID")


# ---------------------------------------------------------------------------
# 10. Reports
# ---------------------------------------------------------------------------

section("10. Reports")

if DEMO_TENDER_ID:
    # JSON report
    s, b = req("GET", f"/tenders/{DEMO_TENDER_ID}/report/json", headers=auth)
    check("GET /report/json returns 200", s == 200, str(b)[:200] if not isinstance(b, dict) else "OK")
    if isinstance(b, dict):
        check("JSON report has report_metadata", "report_metadata" in b)
        check("JSON report has tender section", "tender" in b)
        check("JSON report has criteria_registry", "criteria_registry" in b)
        check("JSON report has summary", "summary" in b)
        check("JSON report has bidder_evaluations", "bidder_evaluations" in b)
        check("Bidder evaluations non-empty", len(b.get("bidder_evaluations", [])) > 0)
        # Check traceability fields
        if b.get("bidder_evaluations"):
            ev = b["bidder_evaluations"][0]
            check("Evaluation has overall_verdict", "overall_verdict" in ev)
            verdicts_list = ev.get("criteria_verdicts", [])
            if verdicts_list:
                v = verdicts_list[0]
                check("Criterion verdict has confidence_band", "confidence_band" in v)
                check("Criterion verdict has source_document_filename", "source_document_filename" in v)
                check("Criterion verdict has is_mandatory", "is_mandatory" in v)

    # PDF report
    s, b = req("GET", f"/tenders/{DEMO_TENDER_ID}/report/pdf", headers=auth)
    check("GET /report/pdf returns 200", s == 200, str(b)[:100] if not isinstance(b, bytes) else "bytes OK")

    # Excel report
    s, b = req("GET", f"/tenders/{DEMO_TENDER_ID}/report/excel", headers=auth)
    check("GET /report/excel returns 200", s == 200, str(b)[:100] if not isinstance(b, bytes) else "bytes OK")
else:
    skip("Reports", "No demo tender ID")


# ---------------------------------------------------------------------------
# 11. Sign-off
# ---------------------------------------------------------------------------

section("11. Sign-Off")

if DEMO_TENDER_ID:
    s, b = req("POST", f"/tenders/{DEMO_TENDER_ID}/sign-off", headers=auth)
    check("POST /sign-off returns 200", s == 200, str(b)[:200])
    if isinstance(b, dict):
        check("Sign-off returns success message", "message" in b)
else:
    skip("Sign-off", "No demo tender ID")


# ---------------------------------------------------------------------------
# 12. Audit log
# ---------------------------------------------------------------------------

section("12. Audit Trail")

s, b = req("GET", "/audit-log", headers=auth)
check("GET /audit-log returns 200", s == 200, str(b)[:200])
if isinstance(b, dict):
    check("Audit log has total field", "total" in b)
    check("Audit log has entries list", isinstance(b.get("entries"), list))
    print(f"    Total audit events: {b.get('total', 0)}")


# ---------------------------------------------------------------------------
# 13. Jobs endpoint
# ---------------------------------------------------------------------------

section("13. Jobs")

if JOB_ID:
    s, b = req("GET", f"/jobs/{JOB_ID}", headers=auth)
    check("GET /jobs/{job_id} returns 200", s == 200, str(b)[:200])
    if isinstance(b, dict):
        check("Job has status field", "status" in b)
        check("Job has progress_pct", "progress_pct" in b)
else:
    skip("Job poll", "No job_id from tender upload")


# ---------------------------------------------------------------------------
# 14. Demo cleanup
# ---------------------------------------------------------------------------

section("14. Demo Cleanup")

if DEMO_TENDER_ID:
    s, b = req("DELETE", "/demo/seed", headers=auth)
    check("DELETE /demo/seed returns 200", s == 200, str(b)[:200])
    if isinstance(b, dict):
        print(f"    Cleaned up: {b}")
else:
    skip("Demo cleanup", "No demo data to clean")


# ---------------------------------------------------------------------------
# 15. Translation & Language Preferences
# ---------------------------------------------------------------------------

section("15. Translation & Language Preferences")

# 15.1 Update Language Preference
s, b = req("PUT", "/auth/me/language", headers=auth, json={"language": "hi"})
check("PUT /auth/me/language returns 200", s == 200, str(b)[:200])
if isinstance(b, dict):
    check("Language updated to hi", b.get("preferred_language") == "hi")

# 15.2 AI Translation Endpoint
s, b = req("POST", "/translate", headers=auth, json={
    "texts": ["Hello", "Minimum annual turnover of ₹5 crore"],
    "target_language": "hi"
})
check("POST /translate returns 200", s == 200, str(b)[:200])
if isinstance(b, dict):
    check("Translation response has translations array", isinstance(b.get("translations"), list))
    check("Translation array length matches input", len(b.get("translations", [])) == 2)


# ---------------------------------------------------------------------------
# Final results
# ---------------------------------------------------------------------------

section("RESULTS")
total = results["passed"] + results["failed"] + results["skipped"]
print(f"  Passed:  {results['passed']}/{total}")
print(f"  Failed:  {results['failed']}/{total}")
print(f"  Skipped: {results['skipped']}/{total}")
print()

if results["failed"] > 0:
    print("  \033[91mSome tests FAILED — see details above.\033[0m")
    sys.exit(1)
else:
    print("  \033[92mAll executed tests PASSED.\033[0m")
    sys.exit(0)
