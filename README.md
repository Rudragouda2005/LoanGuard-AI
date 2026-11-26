# LoanGuard AI — Loan Application Fraud Detection Platform

**Detect Fraud. Protect Finance. Build Trust.**

Built for **AVISHKAR'26 – 24-Hour Hackathon**, LoanGuard AI is a full-stack, AI-powered loan application fraud detection platform combining machine learning, SHAP explainability, an intelligent rule-based consistency engine, fairness auditing, SQLite persistence, and underwriter PDF report generation.

## Architecture & Technology Stack

- **Backend**: Python, FastAPI, Pandas, NumPy, ReportLab
- **Machine Learning**: Scikit-learn (Logistic Regression, Random Forest), XGBoost, SHAP
- **Frontend**: React.js, Vite, Tailwind CSS, Recharts, Lucide React
- **Database**: SQLite (`data/loanguard.db`)

## Quick Start

### 1. Backend Setup

```bash
python -m venv .venv
# Windows
.\.venv\Scripts\activate
pip install -r requirements.txt

# Train ML models & generate validation metrics
python -m backend.ml_pipeline

# Start FastAPI server (http://127.0.0.1:8000)
uvicorn backend.main:app --reload --port 8000
```

Interactive API documentation is automatically available at `http://127.0.0.1:8000/docs`.

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

## Key Features

1. **Real-Time Fraud Risk Scoring**: Evaluates applications using the best-validated ML model (prioritizing fraud recall, ROC-AUC, and low false-positive rate).
2. **Intelligent Consistency Checking Engine**: Independent rule-based checks (`PASS`, `WARNING`, `FLAG`) for income discrepancies, loan-to-income ratio, employment duration plausibility, debt-to-income, and document verification.
3. **SHAP Explainability**: Plain-English feature attributions, top 5 risk drivers, feature impact bar chart, and waterfall progression.
4. **Fairness & Bias Auditing**: Excludes protected attributes (`gender`, `marital_status`) from model inference and monitors false-positive rate parity across demographic groups.
5. **Underwriter Workflow & PDF Reports**: Searchable application history, role-gated `Confirmed Fraud` status updates (`underwriter-demo-token` in Settings), CSV export, and downloadable PDF risk reports.
6. **Live Demonstration Mode**: 3 synthetic demo presets (Low, Medium, and High Risk) scored live by the ML & consistency engines.
