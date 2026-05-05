# NirnayAI Frontend Implementation Guide

Based on the existing backend API, routers, and database models, here is a comprehensive breakdown of the features present, how they will look in the frontend, and how they will function.

---

## 1. Authentication
**Backend Feature:** JWT-based authentication using a single unified role (`PROCUREMENT_OFFICER`).

### How it will look
- **Login Screen:** A sleek, centered login form requiring email/username and password.
- **Navigation/Sidebar:** A static sidebar providing access to all features (Upload Tender, Evaluation Dashboard, System Logs, etc.) since the user has full permissions.
- **Dashboard Widgets:** Summary cards showing key metrics (e.g., "Active Tenders", "Evaluations Pending", "Tenders needing review").

### How it will work
- **Flow:** User logs in -> Frontend receives a JWT token -> Token is stored securely -> Frontend uses the token for all API requests. No complex route protection based on roles is needed.

---

## 2. Tender Management & Document Ingestion
**Backend Feature:** Uploading tender documents (PDF, DOCX, Images) with statuses like `UPLOADED`, `EXTRACTING_CRITERIA`, and `CRITERIA_READY`.

### How it will look
- **Tender Creation Page:** A multi-step form or modal to input Tender Name, ID, and Deadline.
- **Drag-and-Drop Dropzone:** A large, interactive area for uploading the core tender document.
- **Tender Listing:** A data table showing all active and past tenders, with visual status badges (e.g., a spinning loader icon for `EXTRACTING_CRITERIA`, a green check for `COMPLETED`).

### How it will work
- **Flow:** User drops a file -> Frontend shows a progress bar while calling the `POST /tenders` endpoint via `FormData` -> Frontend polls the backend or uses WebSockets to update the status from `EXTRACTING_CRITERIA` to `CRITERIA_READY`.

---

## 3. AI Criteria Extraction & Management
**Backend Feature:** Background jobs that use AI to read the tender document and extract criteria (Numerical, Count-based, Date-based, Certification, General).

### How it will look
- **Criteria Review Interface:** A structured table or card layout appearing after the AI finishes extraction.
- **Interactive Rows:** Each row shows the criterion description, its type, and the source text.
- **Action Buttons:** Edit (pencil icon), Delete (trash icon), and Add New (plus button) options for human refinement.

### How it will work
- **Flow:** Once extraction is complete, the user navigates to the "Review Criteria" page -> The frontend fetches criteria via `GET /tenders/{id}/criteria` -> The user can modify these -> Clicking "Confirm Criteria" hits a backend endpoint to lock them in and move the tender to the evaluation phase.

---

## 4. Bidder Submission Management
**Backend Feature:** Managing bidders associated with a tender and uploading their submission documents.

### How it will look
- **Bidder List Page:** Inside a specific tender's view, a dedicated tab for "Bidders".
- **Bidder Profile/Upload Modal:** A clean interface to add a Bidder's Name and upload their zip file or multiple PDF/DOCX files containing their proposal.

### How it will work
- **Flow:** User clicks "Add Bidder" -> Fills in details and uploads files -> Frontend hits `POST /bidders` -> Shows a success toast -> Bidder appears in the list with a status indicating their documents are ready for evaluation.

---

## 5. AI-Powered Evaluation Engine
**Backend Feature:** AI evaluation of each bidder against the confirmed criteria, resulting in verdicts (`ELIGIBLE`, `INELIGIBLE`, `NEEDS_REVIEW`).

### How it will look
- **Evaluation Dashboard:** A master view comparing bidders.
- **Criterion-by-Criterion Breakdown:** Clicking on a bidder opens a split-screen or accordion view. Left side: The criterion and the AI's verdict. Right side: The AI's reasoning, exact quoted evidence, and a link/snippet to the uploaded document page where the evidence was found.
- **Color Coding:** Green for `ELIGIBLE`, Red for `INELIGIBLE`, Yellow/Orange for `NEEDS_REVIEW`.

### How it will work
- **Flow:** User clicks "Start Evaluation" -> Frontend calls the background job endpoint -> Shows a loading state -> Once finished, fetches the verdicts via `GET /evaluation/{bidder_id}`.

---

## 6. Human Review & Override System
**Backend Feature:** Allowing the Procurement Officer to look at AI decisions, especially `NEEDS_REVIEW`, and override them with human justifications.

### How it will look
- **Review Queue:** A specific inbox-style view showing only the criteria that require human attention.
- **Override Modal:** When clicking on a verdict, a modal pops up offering "Accept AI Decision" or "Override". If Override is selected, a required text area appears for the human justification.

### How it will work
- **Flow:** Officer selects "Override" -> Enters reasoning -> Frontend calls a `PUT` or `PATCH /review/override` endpoint -> The verdict visually updates in real-time, tagging it with a "Human Overridden" badge.

---

## 7. Multilingual Translation (i18n)
**Backend Feature:** An AI-powered `/i18n/translate` endpoint supporting English, Hindi, and Kannada for evaluating reasoning and UI text.

### How it will look
- **Language Switcher:** A dropdown in the top right corner of the navbar with flags or language names (EN, HI, KN).
- **Dynamic Content Updates:** When the language changes, AI reasoning paragraphs dynamically update to the new language without refreshing the page.

### How it will work
- **Flow:** User selects "Hindi" -> Frontend updates its internal localization state for UI elements (using something like `i18next`) -> For dynamic backend data like AI reasoning, the frontend intercepts the data and calls `POST /i18n/translate` to fetch the translated strings before rendering them.

---

## 8. Final Reporting & Sign-off
**Backend Feature:** Generating JSON/PDF procurement reports and marking a tender as `SIGNED_OFF`.

### How it will look
- **Report Generation View:** A clean summary page showing the final tally of eligible vs. ineligible bidders.
- **Download Buttons:** Large, prominent buttons for "Export JSON" and "Export PDF Report".
- **Sign-off Button:** A final "Sign Off & Close Tender" button requiring a confirmation modal (with digital signature or simply a password confirmation).

### How it will work
- **Flow:** Evaluator/Admin reviews the summary -> Clicks "Download PDF" -> Frontend hits `GET /reports/{tender_id}/pdf` and triggers a browser download -> User clicks "Sign Off" -> Hits `POST /tenders/{id}/signoff` -> Tender becomes read-only.

---

## 9. Auditing & Logging
**Backend Feature:** Tracking every single action (e.g., `USER_LOGIN`, `CRITERION_EDITED`, `HUMAN_OVERRIDE`).

### How it will look
- **Audit Log Table:** A dense, data-rich table tracking all system events.
- **Columns:** Timestamp, User, Action Type, Entity (Tender/Bidder ID), and a "Details" button to view the JSON payload of the action.
- **Filters:** Date pickers, Action Type dropdowns, and User search.

### How it will work
- **Flow:** Auditor navigates to `/audit` -> Frontend fetches paginated logs from `GET /audit` -> Displays them. Real-time updates could be added via polling if required.

---

## 10. Background Job Tracking
**Backend Feature:** Polling/managing async jobs for heavy AI tasks (`PENDING`, `RUNNING`, `COMPLETED`, `FAILED`).

### How it will look
- **Global Task Manager:** A small widget in the bottom right corner of the screen or a drawer that slides out, showing ongoing backend tasks (e.g., "Extracting Criteria for Tender A... 50%").

### How it will work
- **Flow:** When a long-running task starts, frontend receives a `job_id` -> Frontend polls `GET /jobs/{job_id}` every 3-5 seconds -> Updates the progress bar -> Shows a success toast when the status hits `COMPLETED`.
