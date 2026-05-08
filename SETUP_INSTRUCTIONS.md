# NirnayAI - Complete Setup Instructions

This guide provides detailed step-by-step instructions for setting up NirnayAI from scratch.

## 📋 Table of Contents

1. [System Requirements](#system-requirements)
2. [Prerequisites Installation](#prerequisites-installation)
3. [Project Setup](#project-setup)
4. [Backend Configuration](#backend-configuration)
5. [Frontend Configuration](#frontend-configuration)
6. [Database Setup](#database-setup)
7. [Running the Application](#running-the-application)
8. [Verification](#verification)
9. [Common Issues](#common-issues)
10. [Production Deployment](#production-deployment)

---

## 1. System Requirements

### Minimum Requirements
- **OS**: Windows 10/11, macOS 10.14+, or Linux (Ubuntu 20.04+)
- **RAM**: 8GB (16GB recommended for OCR processing)
- **Storage**: 5GB free space (for dependencies and OCR models)
- **Internet**: Stable connection required for API calls and model downloads

### Required Software Versions
- Python 3.9, 3.10, or 3.11
- Node.js 18.x or higher
- npm 9.x or higher
- Git 2.x or higher

---

## 2. Prerequisites Installation

### A. Python Installation

#### Windows
1. Download Python from [python.org/downloads](https://www.python.org/downloads/)
2. Run installer and **check "Add Python to PATH"**
3. Verify installation:
```bash
python --version
```

#### macOS
```bash
# Using Homebrew (recommended)
brew install python@3.11

# Verify
python3 --version
```

#### Linux (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install python3.11 python3.11-venv python3-pip

# Verify
python3 --version
```

### B. Node.js Installation

#### Windows & macOS
1. Download from [nodejs.org](https://nodejs.org/)
2. Run installer with default options
3. Verify:
```bash
node --version
npm --version
```

#### Linux (Ubuntu/Debian)
```bash
# Using NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify
node --version
npm --version
```

### C. MongoDB Atlas Setup

1. **Create Account**
   - Go to [mongodb.com/atlas](https://www.mongodb.com/cloud/atlas/register)
   - Sign up for free account

2. **Create Cluster**
   - Choose FREE M0 cluster
   - Select cloud provider and region (choose closest to you)
   - Cluster name: `nirnayai-cluster` (or any name)
   - Click **Create Cluster**

3. **Configure Database Access**
   - Go to **Database Access** in left sidebar
   - Click **Add New Database User**
   - Choose **Password** authentication
   - Username: `nirnayai_user` (or any username)
   - Password: Generate secure password (save this!)
   - Database User Privileges: **Read and write to any database**
   - Click **Add User**

4. **Configure Network Access**
   - Go to **Network Access** in left sidebar
   - Click **Add IP Address**
   - For development: Click **Allow Access from Anywhere** (0.0.0.0/0)
   - For production: Add your specific IP addresses
   - Click **Confirm**

5. **Get Connection String**
   - Go to **Database** → **Connect**
   - Choose **Connect your application**
   - Driver: **Python** / Version: **3.12 or later**
   - Copy connection string (looks like):
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
   - **Important**: Replace `<username>` and `<password>` with your actual credentials

### D. Mistral AI API Key

1. **Create Account**
   - Go to [console.mistral.ai](https://console.mistral.ai)
   - Sign up for account

2. **Generate API Key**
   - Navigate to **API Keys** section
   - Click **Create new key**
   - Name it: `NirnayAI Development`
   - Copy the API key (starts with `xxx...`)
   - **Save this key securely** - it won't be shown again!

3. **Check Credits**
   - Free tier includes some credits
   - For production, add payment method in Billing section

---

## 3. Project Setup

### A. Clone Repository

```bash
# Clone the repository
git clone https://github.com/yourusername/NirnayAI.git

# Navigate to project directory
cd NirnayAI

# Verify structure
ls -la
# You should see: backend/, frontend/, mock-data/, .env.example
```

### B. Create Environment File

```bash
# Copy the example environment file
cp .env.example .env

# Open .env in your text editor
# Windows: notepad .env
# macOS: open -a TextEdit .env
# Linux: nano .env
```

---

## 4. Backend Configuration

### A. Create Virtual Environment

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
# Windows:
python -m venv venv

# macOS/Linux:
python3 -m venv venv
```

### B. Activate Virtual Environment

```bash
# Windows (Command Prompt):
venv\Scripts\activate

# Windows (PowerShell):
venv\Scripts\Activate.ps1

# macOS/Linux:
source venv/bin/activate

# You should see (venv) prefix in your terminal
```

### C. Install Dependencies

```bash
# Upgrade pip first
pip install --upgrade pip

# Install all requirements
pip install -r requirements.txt

# This may take 5-10 minutes
# Progress will be shown for each package
```

**Note**: If you encounter errors:
- On Windows, install Visual C++ Build Tools if needed
- On Linux, install: `sudo apt install python3-dev build-essential`
- For specific package errors, try: `pip install <package-name> --no-cache-dir`

### D. Configure Environment Variables

Open `.env` file in backend directory and configure:

```bash
# ============================================================
# MISTRAL AI - REQUIRED
# ============================================================
MISTRAL_API_KEY=your_actual_mistral_api_key_here
MISTRAL_MODEL_LARGE=mistral-large-latest
MISTRAL_MODEL_SMALL=mistral-small-latest

# ============================================================
# MONGODB - REQUIRED
# ============================================================
# Replace with your actual connection string from MongoDB Atlas
MONGODB_URL=mongodb+srv://nirnayai_user:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
DB_NAME=nirnayai

# ============================================================
# SECURITY - REQUIRED
# ============================================================
# Generate this by running:
# python -c "import secrets; print(secrets.token_hex(32))"
SECRET_KEY=paste_generated_64_char_hex_here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=480

# ============================================================
# OCR - OPTIONAL BUT RECOMMENDED
# ============================================================
OCR_LANGUAGES=en,hi
OCR_CONFIDENCE_THRESHOLD=0.70
OCR_USE_GPU=false

# ============================================================
# AI THRESHOLDS - OPTIONAL
# ============================================================
LLM_CONFIDENCE_THRESHOLD=0.75

# ============================================================
# FILE UPLOAD - OPTIONAL
# ============================================================
UPLOAD_DIR=./uploads
MAX_FILE_SIZE_MB=50

# ============================================================
# APPLICATION - REQUIRED
# ============================================================
APP_ENV=development
CORS_ORIGINS=http://localhost:5173
APP_HOST=0.0.0.0
APP_PORT=8000
```

### E. Generate SECRET_KEY

```bash
# Run this command to generate a secure secret key
python -c "import secrets; print(secrets.token_hex(32))"

# Copy the output (64-character hex string)
# Paste it as the value for SECRET_KEY in .env
```

### F. Create Uploads Directory

```bash
# Still in backend directory
mkdir uploads

# Verify
ls -la
# You should see uploads/ directory
```

---

## 5. Frontend Configuration

### A. Navigate to Frontend

```bash
# From backend directory, go back and into frontend
cd ../frontend
```

### B. Install Dependencies

```bash
# Install all npm packages
npm install

# This may take 3-5 minutes
# You'll see progress bar for each package
```

**Note**: If you encounter errors:
- Clear npm cache: `npm cache clean --force`
- Delete `node_modules` and `package-lock.json`, then run `npm install` again
- On Windows, run terminal as Administrator if permission errors occur

### C. Verify Configuration

The frontend configuration is in `vite.config.ts` and `src/services/api.ts`. Default settings should work with backend on port 8000.

If you need to change the backend URL:
```typescript
// src/services/api.ts
const API_BASE_URL = 'http://localhost:8000'; // Change if needed
```

---

## 6. Database Setup

### A. Seed Demo Data

```bash
# Navigate to mock-data directory
cd ../mock-data

# Make sure backend virtual environment is activated
# If not, activate it:
# source ../backend/venv/bin/activate  (macOS/Linux)
# ..\backend\venv\Scripts\activate     (Windows)

# Run the seed script
python seed_database.py
```

**Expected Output:**
```
🌱 Seeding NirnayAI database...
✅ Dropped existing collections
✅ Created demo user: officer / Officer@123
✅ Created sample tender: Smart City Infrastructure
✅ Created 2 sample bidders
✅ Database seeding complete!
```

This creates:
- **Demo User**: Username `officer`, Password `Officer@123`
- **Sample Tender**: Smart City Infrastructure tender
- **Sample Bidders**: TechNova Solutions and UrbanBuild Corp

### B. Verify Database

1. Go to MongoDB Atlas dashboard
2. Click **Database** → **Browse Collections**
3. You should see `nirnayai` database with collections:
   - users
   - tenders
   - bidders
   - audit_logs

---

## 7. Running the Application

### A. Start Backend Server

```bash
# Navigate to backend directory
cd ../backend

# Activate virtual environment if not already active
# Windows: venv\Scripts\activate
# macOS/Linux: source venv/bin/activate

# Start the server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Expected Output:**
```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Started reloader process
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

**Keep this terminal running!**

### B. Start Frontend Server

Open a **NEW terminal window/tab**:

```bash
# Navigate to frontend directory
cd frontend

# Start development server
npm run dev
```

**Expected Output:**
```
  VITE v5.0.8  ready in 1234 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h to show help
```

**Keep this terminal running too!**

---

## 8. Verification

### A. Check Backend

1. Open browser and go to: [http://localhost:8000/docs](http://localhost:8000/docs)
2. You should see **FastAPI** interactive API documentation
3. Try the `/health` endpoint:
   - Click on **GET /health**
   - Click **Try it out**
   - Click **Execute**
   - You should see: `{"status":"healthy"}`

### B. Check Frontend

1. Open browser and go to: [http://localhost:5173](http://localhost:5173)
2. You should see the NirnayAI landing page
3. Click **Get Started** or **Login**

### C. Test Login

1. On login page, enter:
   - **Username**: `officer`
   - **Password**: `Officer@123`
2. Click **Sign In**
3. You should be redirected to the Dashboard
4. You should see:
   - Welcome message with username
   - Navigation sidebar
   - Dashboard statistics
   - Sample tender in the list

### D. Test Basic Functionality

1. **View Tender**:
   - Click on "Smart City Infrastructure" tender
   - You should see tender details

2. **Upload Test** (Optional):
   - Click **Upload New Tender**
   - Fill in details
   - Upload a document from `sample-files/` directory

3. **Check Audit Log**:
   - Click **Activity Log** in sidebar
   - You should see login event logged

---

## 9. Common Issues

### Issue: "Cannot connect to MongoDB"

**Solution:**
1. Verify MongoDB connection string in `.env`
2. Check username/password are correct
3. Ensure IP is whitelisted in MongoDB Atlas
4. Test connection string:
```bash
# In backend directory with venv activated
python -c "from motor.motor_asyncio import AsyncIOMotorClient; import asyncio; asyncio.run(AsyncIOMotorClient('YOUR_MONGODB_URL').admin.command('ping')); print('✅ Connected!')"
```

### Issue: "Mistral API authentication failed"

**Solution:**
1. Verify API key in `.env` is correct
2. Check you have available credits in Mistral console
3. Test API key:
```bash
# In backend directory with venv activated
python -c "from mistralai import Mistral; client = Mistral(api_key='YOUR_KEY'); print('✅ API Key valid!')"
```

### Issue: "Port 8000 already in use"

**Solution:**
```bash
# Find and kill process using port 8000
# Windows:
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# macOS/Linux:
lsof -ti:8000 | xargs kill -9

# Or run backend on different port:
uvicorn app.main:app --reload --port 8001
# Then update frontend API_BASE_URL to http://localhost:8001
```

### Issue: "Port 5173 already in use"

**Solution:**
```bash
# Kill process or change Vite port
# In frontend/vite.config.ts, add:
server: {
  port: 5174
}
```

### Issue: "CORS errors in browser"

**Solution:**
1. Verify `CORS_ORIGINS` in backend `.env` includes frontend URL
2. Ensure both servers are running
3. Clear browser cache and reload

### Issue: "EasyOCR models not downloading"

**Solution:**
1. Ensure stable internet connection
2. Models download on first OCR use (~500MB)
3. Check `~/.EasyOCR/model/` directory exists and has write permissions
4. Manually download models if needed from [EasyOCR GitHub](https://github.com/JaidedAI/EasyOCR)

### Issue: "Module not found" errors

**Solution:**
```bash
# Backend
cd backend
pip install -r requirements.txt --upgrade

# Frontend
cd frontend
rm -rf node_modules package-lock.json
npm install
```

---

## 10. Production Deployment

### A. Backend Deployment (Example: Railway/Render)

1. **Prepare for Production**:
```bash
# Update .env for production
APP_ENV=production
CORS_ORIGINS=https://your-frontend-domain.com
```

2. **Security Checklist**:
- [ ] Change `SECRET_KEY` to a new random value
- [ ] Use strong database passwords
- [ ] Restrict MongoDB Network Access to specific IPs
- [ ] Enable HTTPS
- [ ] Set `OCR_USE_GPU=true` if GPU available
- [ ] Configure proper logging

3. **Deploy**:
- Use services like Railway, Render, or AWS EC2
- Set environment variables in platform dashboard
- Deploy from GitHub repository
- Set start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

### B. Frontend Deployment (Example: Vercel/Netlify)

1. **Build Frontend**:
```bash
cd frontend
npm run build
# Creates dist/ directory
```

2. **Deploy**:
- Use Vercel, Netlify, or CloudFlare Pages
- Connect GitHub repository
- Build command: `npm run build`
- Output directory: `dist`
- Set environment variable for API URL

3. **Update API Base URL**:
```typescript
// src/services/api.ts
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://your-backend-domain.com';
```

### C. Database Backup

```bash
# Set up automated backups in MongoDB Atlas
# Settings → Backup → Configure
# Recommended: Daily backups with 7-day retention
```

---

## 🎉 Setup Complete!

You now have NirnayAI running successfully. Next steps:

1. **Read Documentation**: Check [README.md](README.md) for feature overview
2. **Follow Tutorial**: Use [MANUAL_TESTING_GUIDE.md](MANUAL_TESTING_GUIDE.md) to test all features
3. **Customize**: Adjust AI thresholds and settings in `.env`
4. **Explore API**: Visit [http://localhost:8000/docs](http://localhost:8000/docs)

## 📞 Need Help?

- **Issues**: Create an issue on GitHub
- **Documentation**: Check README.md and API docs
- **Backend Logs**: Check terminal where backend is running
- **Frontend Console**: Press F12 in browser → Console tab

---

**Happy Evaluating! 🏛️**
