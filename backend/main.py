from fastapi import UploadFile, File, HTTPException
from backend.document_upload import extract_text_from_pdf
from contextlib import asynccontextmanager
import csv
import hmac
import io
import os
import re
import uuid
from datetime import date
from typing import Any, Dict, List, Optional

from dotenv import load_dotenv
from fastapi import FastAPI, Header, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import FileResponse, Response, StreamingResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field, field_validator

from backend.consistency import run_consistency_checks
from backend.database import (
    get_application_detail,
    init_db,
    list_applications,
    save_application_record,
    update_investigation_status,
)
from backend.fairness import compute_fairness_report
from backend.ml_pipeline import train_and_save_models
from backend.pdf_report import generate_risk_report_pdf
from backend.predictor import load_artifacts, predict_application
from backend.seed_data import DEMO_PRESETS, seed_initial_applications_if_empty

load_dotenv()

REVIEWER_TOKEN = os.getenv("LOANGUARD_REVIEWER_TOKEN", "underwriter-demo-token")
CORS_ORIGINS = [
    origin.strip()
    for origin in os.getenv(
        "LOANGUARD_CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173"
    ).split(",")
    if origin.strip()
]

@asynccontextmanager
async def lifespan(_: FastAPI):
    init_db()
    train_and_save_models(force_retrain=False)
    load_artifacts()
    compute_fairness_report()
    seed_initial_applications_if_empty()
    yield


app = FastAPI(
    title="LoanGuard AI API",
    description="AI-Powered Loan Application Fraud Detection & Explainability Platform",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(GZipMiddleware, minimum_size=500)
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _sanitize_text(val: Optional[str]) -> str:
    if not val:
        return ""
    cleaned = re.sub(r"[<>`]", "", val).strip()
    return cleaned[:500]


class LoanApplicationInput(BaseModel):
    application_id: Optional[str] = None
    applicant_name: str = Field(..., min_length=2, max_length=120)
    age: int = Field(..., ge=18, le=100)
    gender: Optional[str] = "Prefer not to say"
    marital_status: Optional[str] = "Single"
    education: str = "Graduate"
    dependents: int = Field(0, ge=0, le=15)

    employment_type: str
    employer_name: Optional[str] = ""
    years_of_employment: float = Field(..., ge=0, le=70)
    monthly_income: float = Field(..., gt=0)
    employment_verification: str = "Pending"

    loan_amount: float = Field(..., gt=0)
    loan_purpose: str
    loan_term: int = Field(..., ge=6, le=360)
    existing_debt: float = Field(0, ge=0)
    credit_history: int = Field(1, ge=0, le=1)
    declared_annual_income: float = Field(..., gt=0)
    bank_verification: str = "Pending"

    previous_loan_history: str = "None"
    document_verification: str = "Pending"
    declared_employment_info: Optional[str] = ""
    notes: Optional[str] = ""
    is_demo: bool = False

    @field_validator(
        "applicant_name",
        "employer_name",
        "declared_employment_info",
        "notes",
        mode="before",
    )
    @classmethod
    def sanitize_strings(cls, v):
        return _sanitize_text(v)


class StatusUpdateInput(BaseModel):
    investigation_status: str
    reviewer_token: Optional[str] = None


class ReviewerVerifyInput(BaseModel):
    token: str


@app.get("/api/health")
def health_check() -> Dict[str, str]:
    return {"status": "ok", "service": "LoanGuard AI"}


@app.get("/api/demo-presets")
def get_demo_presets() -> List[Dict[str, Any]]:
    return DEMO_PRESETS


@app.post("/api/auth/verify")
def verify_reviewer(payload: ReviewerVerifyInput) -> Dict[str, Any]:
    authorized = bool(REVIEWER_TOKEN) and hmac.compare_digest(
        payload.token.strip(), REVIEWER_TOKEN
    )
    return {
        "authorized": authorized,
        "role": "Senior Underwriter" if authorized else "Analyst (Read-Only Fraud Confirmation)",
    }


@app.post("/api/analyze")
def analyze_application(payload: LoanApplicationInput) -> Dict[str, Any]:
    data = payload.model_dump()
    app_id = data.get("application_id") or f"LG-{date.today().year}-{uuid.uuid4().hex[:6].upper()}"
    data["application_id"] = _sanitize_text(app_id)

    ml_res = predict_application(data)
    checks = run_consistency_checks(data)

    applicant_id = f"APP-{uuid.uuid4().hex[:8].upper()}"
    today_str = date.today().isoformat()

    applicant_record = {
        "applicant_id": applicant_id,
        "name": data["applicant_name"],
        "age": data["age"],
        "employment_type": data["employment_type"],
        "monthly_income": data["monthly_income"],
        "marital_status": data.get("marital_status"),
        "education": data.get("education"),
        "dependents": data.get("dependents", 0),
    }

    application_record = {
        "application_id": data["application_id"],
        "applicant_id": applicant_id,
        "loan_amount": data["loan_amount"],
        "loan_purpose": data["loan_purpose"],
        "loan_term": data["loan_term"],
        "fraud_score": ml_res["fraud_score"],
        "risk_level": ml_res["risk_level"],
        "prediction": ml_res["prediction"],
        "application_date": today_str,
        "investigation_status": "Pending Review",
        "employer_name": data.get("employer_name"),
        "years_of_employment": data["years_of_employment"],
        "employment_verification": data["employment_verification"],
        "existing_debt": data["existing_debt"],
        "credit_history": data["credit_history"],
        "declared_annual_income": data["declared_annual_income"],
        "bank_verification": data["bank_verification"],
        "previous_loan_history": data["previous_loan_history"],
        "document_verification": data["document_verification"],
        "declared_employment_info": data.get("declared_employment_info"),
        "notes": data.get("notes"),
        "is_demo": data.get("is_demo", False),
    }

    save_application_record(
        applicant=applicant_record,
        application=application_record,
        explanations=ml_res["explanations"],
        checks=checks,
    )

    detail = get_application_detail(data["application_id"])
    if detail:
        detail["base_value"] = ml_res["base_value"]
        detail["model_used"] = ml_res["model_used"]
    return detail or application_record


@app.get("/api/dashboard")
def get_dashboard_summary() -> Dict[str, Any]:
    apps = list_applications()
    _, _, _, metrics, _ = load_artifacts()

    best_name = metrics.get("best_model", "XGBoost")
    best_model_metrics = next(
        (m for m in metrics.get("models", []) if m["model_name"] == best_name),
        metrics.get("models", [{}])[0],
    )
    model_accuracy = round(float(best_model_metrics.get("accuracy", 0.0)) * 100.0, 1)

    total = len(apps)
    high = sum(1 for a in apps if a["risk_level"] == "HIGH")
    medium = sum(1 for a in apps if a["risk_level"] == "MEDIUM")
    low = sum(1 for a in apps if a["risk_level"] == "LOW")
    avg_score = round(sum(float(a["fraud_score"]) for a in apps) / max(total, 1), 1)

    flagged_count = sum(1 for a in apps if a["prediction"] == "Flagged for Review")
    legit_count = total - flagged_count

    # Monthly Application Analysis & Fraud Detection Trend
    monthly_map: Dict[str, Dict[str, Any]] = {}
    for a in apps:
        month_key = str(a["application_date"])[:7]
        if month_key not in monthly_map:
            monthly_map[month_key] = {"month": month_key, "total": 0, "flagged": 0, "avg_score_sum": 0.0}
        monthly_map[month_key]["total"] += 1
        if a["risk_level"] == "HIGH" or a["prediction"] == "Flagged for Review":
            monthly_map[month_key]["flagged"] += 1
        monthly_map[month_key]["avg_score_sum"] += float(a["fraud_score"])

    monthly_trend = []
    for k in sorted(monthly_map.keys()):
        item = monthly_map[k]
        monthly_trend.append(
            {
                "month": item["month"],
                "total": item["total"],
                "flagged": item["flagged"],
                "avg_risk_score": round(item["avg_score_sum"] / max(item["total"], 1), 1),
            }
        )

    # Fraud Risk by Employment Type
    emp_map: Dict[str, List[float]] = {}
    for a in apps:
        et = a["employment_type"]
        emp_map.setdefault(et, []).append(float(a["fraud_score"]))
    by_employment = [
        {"employment_type": k, "avg_risk_score": round(sum(v) / len(v), 1), "count": len(v)}
        for k, v in emp_map.items()
    ]

    # Fraud Risk by Income Group
    income_buckets = {"<$3.5k": [], "$3.5k-$6.5k": [], "$6.5k-$9k": [], ">$9k": []}
    for a in apps:
        inc = float(a["monthly_income"])
        if inc < 3500:
            income_buckets["<$3.5k"].append(float(a["fraud_score"]))
        elif inc < 6500:
            income_buckets["$3.5k-$6.5k"].append(float(a["fraud_score"]))
        elif inc <= 9000:
            income_buckets["$6.5k-$9k"].append(float(a["fraud_score"]))
        else:
            income_buckets[">$9k"].append(float(a["fraud_score"]))

    by_income_group = [
        {
            "income_group": k,
            "avg_risk_score": round(sum(v) / len(v), 1) if v else 0.0,
            "count": len(v),
        }
        for k, v in income_buckets.items()
    ]

    recent_alerts = [a for a in apps if a["risk_level"] in ("HIGH", "MEDIUM")][:5]

    return {
        "kpis": {
            "total_applications": total,
            "high_risk_count": high,
            "medium_risk_count": medium,
            "low_risk_count": low,
            "average_fraud_score": avg_score,
            "model_accuracy": model_accuracy,
            "best_model": best_name,
        },
        "fraud_vs_legitimate": [
            {"name": "Legitimate", "value": legit_count},
            {"name": "Flagged Fraud Risk", "value": flagged_count},
        ],
        "risk_distribution": [
            {"level": "LOW", "count": low},
            {"level": "MEDIUM", "count": medium},
            {"level": "HIGH", "count": high},
        ],
        "monthly_trend": monthly_trend,
        "by_employment": by_employment,
        "by_income_group": by_income_group,
        "recent_applications": apps[:8],
        "recent_alerts": recent_alerts,
    }


@app.get("/api/analytics")
def get_filtered_analytics(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    risk_level: Optional[str] = Query("ALL"),
    employment_type: Optional[str] = Query("ALL"),
    min_amount: Optional[float] = Query(None),
    max_amount: Optional[float] = Query(None),
) -> Dict[str, Any]:
    apps = list_applications(risk_level=risk_level, employment_type=employment_type)

    filtered = []
    for a in apps:
        d = a["application_date"]
        amt = float(a["loan_amount"])
        if start_date and d < start_date:
            continue
        if end_date and d > end_date:
            continue
        if min_amount is not None and amt < min_amount:
            continue
        if max_amount is not None and amt > max_amount:
            continue
        filtered.append(a)

    # Fraud patterns by employment type
    emp_groups: Dict[str, Dict[str, Any]] = {}
    for a in filtered:
        et = a["employment_type"]
        g = emp_groups.setdefault(et, {"employment_type": et, "total": 0, "high_risk": 0, "score_sum": 0.0})
        g["total"] += 1
        if a["risk_level"] == "HIGH":
            g["high_risk"] += 1
        g["score_sum"] += float(a["fraud_score"])
    by_employment = [
        {
            "employment_type": g["employment_type"],
            "total": g["total"],
            "high_risk": g["high_risk"],
            "avg_score": round(g["score_sum"] / max(g["total"], 1), 1),
        }
        for g in emp_groups.values()
    ]

    # Fraud patterns by loan amount brackets
    amt_brackets = {"<$25k": [], "$25k-$75k": [], "$75k-$150k": [], ">$150k": []}
    for a in filtered:
        amt = float(a["loan_amount"])
        sc = float(a["fraud_score"])
        if amt < 25000:
            amt_brackets["<$25k"].append(sc)
        elif amt < 75000:
            amt_brackets["$25k-$75k"].append(sc)
        elif amt <= 150000:
            amt_brackets["$75k-$150k"].append(sc)
        else:
            amt_brackets[">$150k"].append(sc)
    by_loan_amount = [
        {
            "bracket": k,
            "count": len(v),
            "avg_score": round(sum(v) / len(v), 1) if v else 0.0,
        }
        for k, v in amt_brackets.items()
    ]

    # Income & employment inconsistency analysis
    income_inconsistency = []
    employment_inconsistency = {"Consistent": 0, "Needs Verification": 0, "Flagged Mismatch": 0}
    purpose_map: Dict[str, Dict[str, Any]] = {}
    monthly_map: Dict[str, Dict[str, Any]] = {}

    for a in filtered:
        annualized = max(float(a["monthly_income"]) * 12.0, 1.0)
        declared = float(a.get("declared_annual_income") or annualized)
        diff_pct = round(abs(declared - annualized) / annualized * 100.0, 1)
        income_inconsistency.append(
            {
                "application_id": a["application_id"],
                "discrepancy_pct": diff_pct,
                "fraud_score": float(a["fraud_score"]),
                "risk_level": a["risk_level"],
            }
        )

        # Employment inconsistency bucket
        age = int(a.get("applicant_age") or 30)
        yrs = float(a.get("years_of_employment") or 0)
        ev = a.get("employment_verification", "Pending")
        if ev == "Failed" or yrs > max(0, age - 16):
            employment_inconsistency["Flagged Mismatch"] += 1
        elif ev == "Pending":
            employment_inconsistency["Needs Verification"] += 1
        else:
            employment_inconsistency["Consistent"] += 1

        # Purpose distribution
        p = a["loan_purpose"]
        pm = purpose_map.setdefault(p, {"purpose": p, "count": 0, "flagged": 0})
        pm["count"] += 1
        if a["risk_level"] == "HIGH":
            pm["flagged"] += 1

        # Monthly trend
        mk = str(a["application_date"])[:7]
        mm = monthly_map.setdefault(mk, {"month": mk, "total": 0, "high_risk": 0, "medium_risk": 0})
        mm["total"] += 1
        if a["risk_level"] == "HIGH":
            mm["high_risk"] += 1
        elif a["risk_level"] == "MEDIUM":
            mm["medium_risk"] += 1

    return {
        "total_matched": len(filtered),
        "by_employment": by_employment,
        "by_loan_amount": by_loan_amount,
        "income_inconsistency": income_inconsistency[:25],
        "employment_inconsistency": [
            {"category": k, "count": v} for k, v in employment_inconsistency.items()
        ],
        "by_purpose": list(purpose_map.values()),
        "monthly_trends": [monthly_map[k] for k in sorted(monthly_map.keys())],
    }


@app.get("/api/applications")
def get_applications(
    search: Optional[str] = Query(None),
    risk_level: Optional[str] = Query("ALL"),
    employment_type: Optional[str] = Query("ALL"),
    sort_by: str = Query("application_date"),
    sort_order: str = Query("DESC"),
) -> List[Dict[str, Any]]:
    return list_applications(
        search=search,
        risk_level=risk_level,
        employment_type=employment_type,
        sort_by=sort_by,
        sort_order=sort_order,
    )


@app.get("/api/applications/export/csv")
def export_applications_csv(
    search: Optional[str] = Query(None),
    risk_level: Optional[str] = Query("ALL"),
) -> StreamingResponse:
    rows = list_applications(search=search, risk_level=risk_level)
    output = io.StringIO()
    fieldnames = [
        "application_id",
        "applicant_name",
        "employment_type",
        "monthly_income",
        "loan_amount",
        "loan_purpose",
        "fraud_score",
        "risk_level",
        "prediction",
        "investigation_status",
        "application_date",
    ]
    writer = csv.DictWriter(output, fieldnames=fieldnames)
    writer.writeheader()
    for r in rows:
        writer.writerow({k: r.get(k, "") for k in fieldnames})

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=loanguard_applications.csv"},
    )


@app.get("/api/applications/{application_id}")
def get_application(application_id: str) -> Dict[str, Any]:
    detail = get_application_detail(application_id)
    if not detail:
        raise HTTPException(status_code=404, detail="Application not found")
    return detail


@app.patch("/api/applications/{application_id}/status")
def update_status(
    application_id: str,
    payload: StatusUpdateInput,
    x_reviewer_token: Optional[str] = Header(default=None),
) -> Dict[str, Any]:
    allowed = {
        "Pending Review",
        "Under Investigation",
        "Verified Legitimate",
        "Confirmed Fraud",
    }
    if payload.investigation_status not in allowed:
        raise HTTPException(status_code=400, detail="Invalid investigation status")

    if payload.investigation_status == "Confirmed Fraud":
        token = (x_reviewer_token or payload.reviewer_token or "").strip()
        if not REVIEWER_TOKEN or not hmac.compare_digest(token, REVIEWER_TOKEN):
            raise HTTPException(
                status_code=403,
                detail="Only authorized reviewers can mark an application as Confirmed Fraud.",
            )

    updated = update_investigation_status(application_id, payload.investigation_status)
    if not updated:
        raise HTTPException(status_code=404, detail="Application not found")

    return {"application_id": application_id, "investigation_status": payload.investigation_status}


@app.get("/api/applications/{application_id}/report.pdf")
def download_pdf_report(application_id: str) -> Response:
    detail = get_application_detail(application_id)
    if not detail:
        raise HTTPException(status_code=404, detail="Application not found")

    pdf_bytes = generate_risk_report_pdf(detail)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename=LoanGuard_Report_{application_id}.pdf"
        },
    )


@app.get("/api/model-performance")
def get_model_performance() -> Dict[str, Any]:
    _, _, _, metrics, _ = load_artifacts()
    return metrics


@app.get("/api/fairness")
def get_fairness_metrics() -> Dict[str, Any]:
    return compute_fairness_report()


FRONTEND_DIST = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend", "dist")
if os.path.isdir(FRONTEND_DIST):
    assets_dir = os.path.join(FRONTEND_DIST, "assets")
    if os.path.isdir(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/{full_path:path}")
    def serve_spa(full_path: str):
        if full_path.startswith("api"):
            raise HTTPException(status_code=404, detail="API route not found")
        index_file = os.path.join(FRONTEND_DIST, "index.html")
        if os.path.exists(index_file):
            return FileResponse(index_file)
        raise HTTPException(status_code=404, detail="Frontend not built")
@app.post("/upload-document")
async def upload_document(file: UploadFile = File(...)):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=400,
            detail="Please upload a PDF file."
        )

    file_bytes = await file.read()

    if len(file_bytes) > 10 * 1024 * 1024:
        raise HTTPException(
            status_code=413,
            detail="PDF must be smaller than 10 MB."
        )

    try:
        extracted_text = extract_text_from_pdf(file_bytes)

        return {
            "filename": file.filename,
            "status": "success",
            "message": "Document uploaded successfully.",
            "extracted_text": extracted_text
        }

    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )

if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("PORT", os.getenv("LOANGUARD_API_PORT", "8000")))
    uvicorn.run("backend.main:app", host="0.0.0.0", port=port)
