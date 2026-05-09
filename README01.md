# NirnayAI 🏛️

**AI-Powered Tender Evaluation System for Government Procurement**

NirnayAI is an intelligent procurement evaluation platform that leverages AI to streamline the tender evaluation process. It automatically extracts criteria from tender documents, evaluates bidder submissions, and provides transparent, auditable decision-making for government procurement officers.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Python](https://img.shields.io/badge/python-3.9+-blue.svg)
![FastAPI](https://img.shields.io/badge/FastAPI-0.111.0-green.svg)
![React](https://img.shields.io/badge/React-18.3.1-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3.3-blue.svg)

## 🌟 Features

### 🤖 AI-Powered Intelligence
- **Automated Criteria Extraction**: AI reads tender documents and automatically identifies evaluation criteria
- **Smart Document Analysis**: Supports PDF, DOCX, and image formats with OCR capabilities
- **Intelligent Evaluation**: AI evaluates bidder submissions against tender requirements
- **Confidence Scoring**: Built-in confidence bands to flag uncertain decisions for human review

### 📋 Procurement Management
- **Tender Management**: Create, track, and manage tenders through their entire lifecycle
- **Bidder Submissions**: Upload and organize bidder documents with version tracking
- **Multi-Criteria Evaluation**: Handle numerical, date-based, certification, and general criteria types
- **Comparative Analysis**: Side-by-side comparison of multiple bidders

### 👥 Human-in-the-Loop
- **Review Queue**: Dedicated interface for reviewing AI decisions that need human verification
- **Override System**: Procurement officers can override AI decisions with justification tracking
- **Audit Trail**: Complete logging of all actions, decisions, and overrides

### 🌐 Multilingual Support
- **3 Languages**: Full support for English, Hindi, and Kannada
- **AI-Powered Translation**: Dynamic translation of AI reasoning and evaluation results
- **Localized Interface**: Complete UI translation for government officials

### 📊 Reporting & Compliance
- **Automated Reports**: Generate PDF and Excel reports for tender evaluations
- **Digital Sign-off**: Formal approval and sign-off workflow
- **Audit Logs**: Complete activity tracking for compliance and transparency
- **Export Capabilities**: JSON, PDF, and Excel export formats

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React + TypeScript)            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Dashboard   │  │  Evaluation  │  │  Reports     │      │
│  │  & Tenders   │  │  Interface   │  │  & Audit     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                  ┌─────────▼─────────┐
                  │   REST API        │
                  │   (FastAPI)       │
                  └─────────┬─────────┘
                            │
         ┌──────────────────┼──────────────────┐
         │                  │                  │
    ┌────▼─────┐    ┌──────▼──────┐    ┌─────▼─────┐
    │ Document │    │  AI Engine  │    │  MongoDB  │
    │ Parsers  │    │  (Mistral)  │    │  Atlas    │
    │  + OCR   │    │             │    │           │
    └──────────┘    └─────────────┘    └───────────┘
```

## 🚀 Quick Start

### Prerequisites

Before you begin, ensure you have the following installed:

- **Python 3.9+** ([Download](https://www.python.org/downloads/))
- **Node.js 18+** and npm ([Download](https://nodejs.org/))
- **MongoDB Atlas Account** (Free tier available at [mongodb.com/atlas](https://www.mongodb.com/atlas))
- **Mistral AI API Key** (Get from [console.mistral.ai](https://console.mistral.ai))

### Installation

#### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/NirnayAI.git
cd NirnayAI
```

#### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy environment template
cp ../.env.example .env

# Edit .env file with your credentials
# Required: MISTRAL_API_KEY, MONGODB_URL, SECRET_KEY
```

**Generate your SECRET_KEY:**
```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

#### 3. Frontend Setup

```bash
# Open a new terminal and navigate to frontend
cd frontend

# Install dependencies
npm install

# The frontend will automatically connect to backend at http://localhost:8000
```

#### 4. Database Setup

```bash
# Navigate to mock-data directory
cd ../mock-data

# Seed the database with demo data
python seed_database.py
```

This creates a demo user:
- **Username**: `officer`
- **Password**: `Officer@123`

#### 5. Start the Application

**Terminal 1 - Backend:**
```bash
cd backend
# Make sure virtual environment is activated
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

#### 6. Access the Application

- **Frontend**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:8000](http://localhost:8000)
- **API Documentation**: [http://localhost:8000/docs](http://localhost:8000/docs)

## 📖 Usage Guide

### 1. Login
Use the demo credentials or create a new account:
- Username: `officer`
- Password: `Officer@123`

### 2. Upload a Tender
1. Navigate to **Tenders** → **Upload New Tender**
2. Fill in tender details (Name, ID, Deadline)
3. Upload tender document (PDF, DOCX, or Image)
4. Wait for AI to extract criteria

### 3. Review Extracted Criteria
1. Review AI-extracted evaluation criteria
2. Edit, delete, or add new criteria as needed
3. Click **Confirm These Requirements**

### 4. Add Bidders
1. Open the tender
2. Click **Add Company**
3. Enter company name and upload their submission documents
4. Repeat for all bidders

### 5. Run Evaluation
1. Navigate to **Evaluate**
2. Click **Start Evaluation**
3. AI will evaluate each bidder against criteria
4. Results show: Eligible, Ineligible, or Needs Review

### 6. Review Decisions
1. Go to **Review Queue** for items needing human verification
2. Review AI reasoning and evidence
3. Accept or override AI decision with justification

### 7. Generate Reports
1. Navigate to **Reports**
2. Download PDF or Excel report
3. Complete formal sign-off when ready

## 🔧 Configuration

### Environment Variables

Key configuration options in `.env`:

```bash
# Mistral AI
MISTRAL_API_KEY=your_api_key_here
MISTRAL_MODEL_LARGE=mistral-large-latest
MISTRAL_MODEL_SMALL=mistral-small-latest

# MongoDB
MONGODB_URL=mongodb+srv://username:password@cluster.mongodb.net/
DB_NAME=nirnayai

# Security
SECRET_KEY=your_64_char_hex_string
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=480

# OCR
OCR_LANGUAGES=en,hi
OCR_CONFIDENCE_THRESHOLD=0.70
OCR_USE_GPU=false

# AI Thresholds
LLM_CONFIDENCE_THRESHOLD=0.75

# File Upload
MAX_FILE_SIZE_MB=50
```

### Adjusting AI Confidence Thresholds

- **OCR_CONFIDENCE_THRESHOLD** (0.0-1.0): Lower values accept more OCR results, higher values flag more for review
- **LLM_CONFIDENCE_THRESHOLD** (0.0-1.0): Controls when AI evaluation results are marked as "Needs Review"

## 🧪 Testing

### Manual Testing

Follow the [MANUAL_TESTING_GUIDE.md](MANUAL_TESTING_GUIDE.md) for comprehensive testing scenarios.

### API Testing

Use the interactive API documentation:
```
http://localhost:8000/docs
```

### Sample Files

The `sample-files/` directory contains:
- `00_Sample_Tender_SmartCity.docx` - Sample tender document
- `01_Bidder_TechNova_Eligible.docx` - Sample eligible bidder
- `02_Bidder_UrbanBuild_UnderReview.docx` - Sample borderline bidder

## 📁 Project Structure

```
NirnayAI/
├── backend/                    # FastAPI backend
│   ├── app/
│   │   ├── ai/                # AI evaluation engine
│   │   ├── auth/              # Authentication & authorization
│   │   ├── bidders/           # Bidder management
│   │   ├── documents/         # Document parsing & OCR
│   │   ├── evaluation/        # Evaluation logic
│   │   ├── reports/           # Report generation
│   │   ├── review/            # Human review system
│   │   ├── tenders/           # Tender management
│   │   ├── audit/             # Audit logging
│   │   ├── i18n/              # Internationalization
│   │   └── main.py            # Application entry point
│   └── requirements.txt
├── frontend/                   # React + TypeScript frontend
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   ├── pages/             # Page components
│   │   ├── services/          # API services
│   │   ├── stores/            # State management (Zustand)
│   │   └── i18n/              # Translations (en, hi, kn)
│   └── package.json
├── mock-data/                  # Database seeding scripts
├── sample-files/               # Sample documents for testing
├── .env.example               # Environment template
└── README.md
```

## 🛠️ Technology Stack

### Backend
- **Framework**: FastAPI 0.111.0
- **Database**: MongoDB with Motor (async driver)
- **AI/ML**: Mistral AI API
- **OCR**: EasyOCR
- **Document Parsing**: PyMuPDF, python-docx
- **Authentication**: JWT (python-jose)
- **Reports**: ReportLab (PDF), OpenPyXL (Excel)

### Frontend
- **Framework**: React 18.3.1 with TypeScript
- **Routing**: React Router v6
- **State Management**: Zustand
- **Styling**: TailwindCSS
- **Animations**: Framer Motion
- **HTTP Client**: Axios
- **Internationalization**: i18next, react-i18next
- **Icons**: Lucide React

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt for secure password storage
- **CORS Protection**: Configurable CORS origins
- **File Upload Validation**: Type and size restrictions
- **Audit Logging**: Complete activity tracking
- **Environment Isolation**: Sensitive data in environment variables

## 🌍 Internationalization

NirnayAI supports three languages:

- **English (en)**: Default language
- **Hindi (hi)**: हिंदी
- **Kannada (kn)**: ಕನ್ನಡ

Translation coverage:
- ✅ Complete UI translation
- ✅ AI-powered dynamic content translation
- ✅ Error messages and notifications
- ✅ Report generation in selected language

## 📊 Database Schema

### Key Collections

- **users**: User accounts and authentication
- **tenders**: Tender documents and metadata
- **criteria**: Extracted evaluation criteria
- **bidders**: Bidder information and submissions
- **evaluations**: AI evaluation results
- **audit_logs**: Complete activity audit trail
- **jobs**: Background job tracking

## 🐛 Troubleshooting

### Backend Issues

**Problem**: `ModuleNotFoundError`
```bash
# Ensure virtual environment is activated and dependencies installed
pip install -r requirements.txt
```

**Problem**: MongoDB connection fails
```bash
# Verify MongoDB Atlas connection string in .env
# Ensure IP whitelist includes your IP (or 0.0.0.0/0 for testing)
# Check username/password are correctly URL-encoded
```

**Problem**: Mistral AI API errors
```bash
# Verify API key is valid
# Check account has available credits
# Ensure model names are correct in .env
```

### Frontend Issues

**Problem**: CORS errors
```bash
# Verify CORS_ORIGINS in backend .env matches frontend URL
CORS_ORIGINS=http://localhost:5173
```

**Problem**: API connection refused
```bash
# Ensure backend is running on port 8000
# Check firewall settings
# Verify api.ts has correct API_BASE_URL
```

### OCR Issues

**Problem**: EasyOCR models not downloading
```bash
# Ensure internet connection
# Models (~500MB) download on first OCR use
# Check ~/.EasyOCR directory has write permissions
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Mistral AI** for providing the AI evaluation engine
- **MongoDB** for the flexible database platform
- **FastAPI** for the high-performance backend framework
- **React Team** for the amazing frontend library
- **EasyOCR** for optical character recognition capabilities

## 📧 Contact & Support

For questions, issues, or suggestions:

- **GitHub Issues**: [Create an issue](https://github.com/yourusername/NirnayAI/issues)
- **Documentation**: See [MANUAL_TESTING_GUIDE.md](MANUAL_TESTING_GUIDE.md)
- **API Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)

## 🗺️ Roadmap

- [ ] Add support for more document formats (Excel, CSV)
- [ ] Implement real-time collaboration features
- [ ] Add email notifications for evaluation events
- [ ] Enhanced analytics and reporting dashboard
- [ ] Mobile app support
- [ ] Integration with government e-procurement portals
- [ ] Advanced AI models for specialized evaluation types
- [ ] Blockchain-based audit trail for immutable records

---

**Built with ❤️ for transparent and efficient government procurement**
