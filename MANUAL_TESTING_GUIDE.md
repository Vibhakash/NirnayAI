# NirnayAI - Manual Testing Guide

This guide will walk you through testing the entire end-to-end functionality of the NirnayAI project, including the newly added registration and login features.

## 🚀 1. Accessing the Application

Both the backend and frontend servers are currently **running**.

- **Frontend:** Open your browser and go to `http://localhost:5173`
- **Backend API:** Running at `http://localhost:8000`
- **Backend Swagger Docs:** Available at `http://localhost:8000/docs`

---

## 👤 2. Testing Authentication (Register & Login)

### Step 2.1: Create a New Account
1. Go to `http://localhost:5173` and click on **Get Started** or **Login**.
2. On the Login page, click the **"Don't have an account? Create one"** link at the bottom.
3. Fill out the registration form:
   - **Full Name:** Your Name (e.g., Jane Doe)
   - **Username:** A unique username (e.g., `jane_doe`)
   - **Email Address:** Your email (e.g., `jane@example.com`)
   - **Password:** A strong password (e.g., `SecurePass123!`)
   - **Confirm Password:** Retype the password.
4. Click **Create Account**. 
5. **Expected result:** You should see a green success message, and then automatically be redirected to the Dashboard.

### Step 2.2: Test Logout and Login
1. From the Dashboard, click **Sign Out** in the left sidebar.
2. You will be redirected to the Login page.
3. Enter the **Username** and **Password** you just created.
4. Click **Sign In**.
5. **Expected result:** You should be logged in and redirected to the Dashboard.

*(Note: You can also use the demo credentials `officer` / `Officer@123` to log in if needed).*

---

## 📄 3. Testing Tender Upload & Criteria Extraction

1. From the Dashboard, click **Upload New Tender** (or go to the **Tenders** tab).
2. Upload a sample tender document (PDF, DOCX, or Image). If you don't have one, you can use the `NirnayAI.docx` file located in the project root.
3. Wait for the AI to analyze the document.
4. **Expected result:** Once uploaded, you'll be redirected to the **Evaluate** tab or **Criteria Confirmation** screen. 
5. Review the extracted criteria. You can edit, delete, or add new requirements manually.
6. Click **Confirm These Requirements** to save them.

---

## 🏢 4. Testing Bidder Submission

1. Go to the **Tenders** tab and click on your newly created tender.
2. In the tender details, find the option to **Add a Company** (Bidder).
3. Enter the company name and upload their submission documents (PDF/DOCX).
4. Add at least two companies to see the comparison.
5. **Expected result:** The companies should appear in the list with their uploaded documents.

---

## ⚖️ 5. Testing the Evaluation Process

1. Navigate to the **Evaluate** section for your tender.
2. Click **Start Evaluation**.
3. Wait for the AI to evaluate each company's documents against the criteria you confirmed earlier.
4. **Expected result:** You will see a results table showing which companies are "Eligible", "Ineligible", or "Needs Review".

---

## 🔍 6. Testing Human Review & Overrides

1. Go to the **Review Decisions** tab in the sidebar.
2. Any evaluations marked as "Needs Review" (borderline cases) will appear here.
3. Click on a pending review to see the AI's reasoning.
4. Make your final decision (Accept or Reject) and add any optional notes.
5. Click **Submit**.
6. **Expected result:** The verdict is updated, and it is removed from the review queue.

---

## 📊 7. Testing Reports & Sign-Off

1. Go to the **Reports** tab for your tender.
2. You will see a summary of the evaluations.
3. Test the download buttons to generate a PDF or Excel report.
4. Scroll down to the **Official Sign-Off** section.
5. Enter your name and click **Sign Off**.
6. **Expected result:** The tender evaluation process is now complete and marked as signed off.

---

## 📜 8. Testing the Audit Log

1. Go to the **Activity Log** (Audit) tab in the left sidebar.
2. **Expected result:** You should see a chronological list of everything you just did, including:
   - User Registration
   - User Login
   - Tender Upload
   - Criteria Confirmed
   - Bidders Added
   - Evaluation Completed
   - Verdict Overridden (if applicable)
   - Sign-Off Completed

---

## 🌐 9. Testing Multilingual Support

1. On any page, locate the **Language Switcher** (typically in the top right).
2. Change the language from **English** to **Hindi** or **Kannada**.
3. **Expected result:** The interface text should instantly change to the selected language.

---

## Troubleshooting

If you encounter any issues:
- Check the terminal output where the backend is running to see if any errors are logged.
- Open the browser's Developer Tools (F12) -> Console / Network tabs to check for failed API requests.
