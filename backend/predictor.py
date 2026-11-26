import json
import os
from functools import lru_cache
from typing import Any, Dict, List, Tuple

import joblib
import numpy as np
import pandas as pd
import shap

from backend.ml_pipeline import (
    ALL_FEATURES,
    MODEL_DIR,
    engineer_features,
    train_and_save_models,
)

HUMAN_FEATURE_LABELS = {
    "age": "Applicant Age",
    "dependents": "Number of Dependents",
    "years_of_employment": "Years of Employment",
    "monthly_income": "Monthly Income",
    "declared_annual_income": "Declared Annual Income",
    "loan_amount": "Requested Loan Amount",
    "loan_term": "Loan Term (Months)",
    "existing_debt": "Existing Debt",
    "credit_history": "Credit History",
    "income_discrepancy_ratio": "Income Consistency Ratio",
    "loan_to_annual_income": "Loan-to-Income Ratio",
    "debt_to_annual_income": "Debt-to-Income Ratio",
    "age_minus_employment": "Age vs. Employment Span",
    "verification_risk_count": "Verification Risk Signals",
    "education": "Education Level",
    "employment_type": "Employment Type",
    "loan_purpose": "Loan Purpose",
    "employment_verification": "Employment Verification Status",
    "bank_verification": "Bank Account Verification Status",
    "document_verification": "Document Verification Status",
    "previous_loan_history": "Previous Loan History",
}


@lru_cache(maxsize=1)
def load_artifacts():
    """Load saved preprocessor, trained model, and SHAP explainer once."""
    best_model_path = os.path.join(MODEL_DIR, "best_model.joblib")
    preprocessor_path = os.path.join(MODEL_DIR, "preprocessor.joblib")
    feature_names_path = os.path.join(MODEL_DIR, "feature_names.joblib")
    metrics_path = os.path.join(MODEL_DIR, "metrics.json")

    if not (os.path.exists(best_model_path) and os.path.exists(preprocessor_path)):
        train_and_save_models(force_retrain=False)

    preprocessor = joblib.load(preprocessor_path)
    model = joblib.load(best_model_path)
    feature_names = joblib.load(feature_names_path)
    with open(metrics_path, "r", encoding="utf-8") as f:
        metrics = json.load(f)

    explainer = shap.TreeExplainer(model) if hasattr(model, "feature_importances_") else None
    return preprocessor, model, feature_names, metrics, explainer


def _map_transformed_to_base_feature(transformed_name: str) -> str:
    clean = transformed_name.replace("num__", "").replace("cat__", "")
    for base in sorted(ALL_FEATURES, key=len, reverse=True):
        if clean == base or clean.startswith(base + "_"):
            return base
    return clean


def _plain_english_explanation(base_feat: str, shap_val: float, payload: Dict[str, Any]) -> str:
    label = HUMAN_FEATURE_LABELS.get(base_feat, base_feat.replace("_", " ").title())
    direction = "increased" if shap_val > 0 else "reduced"

    if base_feat == "income_discrepancy_ratio":
        if shap_val > 0:
            return (
                "Declared annual income has increased the predicted risk because it differs "
                "significantly from the annualized monthly income."
            )
        return "Declared annual income aligns with monthly income, which reduced predicted risk."
    if base_feat == "loan_to_annual_income":
        if shap_val > 0:
            return "The requested loan amount is high relative to stated annual income, increasing fraud risk."
        return "The requested loan-to-income ratio is well-proportioned, lowering risk."
    if base_feat == "verification_risk_count":
        if shap_val > 0:
            return "Pending or failed document, employment, or bank verification statuses increased the risk score."
        return "Completed verification checks helped reduce the predicted fraud risk."
    if base_feat == "debt_to_annual_income":
        if shap_val > 0:
            return "Existing debt relative to income added upward pressure to the fraud-risk score."
        return "Manageable existing debt relative to income lowered the risk score."
    if base_feat == "credit_history":
        ch = int(payload.get("credit_history", 1))
        if shap_val > 0 or ch == 0:
            return "Limited or adverse credit history contributed to a higher risk assessment."
        return "Positive credit history contributed to a lower risk assessment."
    if base_feat in ("document_verification", "employment_verification", "bank_verification"):
        val = payload.get(base_feat, "Pending")
        return f"{label} ({val}) {direction} the predicted fraud risk."

    return f"{label} {direction} the predicted fraud risk (SHAP impact: {shap_val:+.3f})."


def predict_application(payload: Dict[str, Any]) -> Dict[str, Any]:
    """Run ML prediction and SHAP explainability for a single loan application."""
    preprocessor, model, feature_names, metrics, explainer = load_artifacts()

    row_df = pd.DataFrame(
        [
            {
                "age": int(payload["age"]),
                "education": payload.get("education", "Graduate"),
                "dependents": int(payload.get("dependents", 0)),
                "employment_type": payload["employment_type"],
                "years_of_employment": float(payload["years_of_employment"]),
                "monthly_income": float(payload["monthly_income"]),
                "declared_annual_income": float(payload["declared_annual_income"]),
                "loan_amount": float(payload["loan_amount"]),
                "loan_term": int(payload["loan_term"]),
                "existing_debt": float(payload.get("existing_debt", 0)),
                "credit_history": int(payload.get("credit_history", 1)),
                "loan_purpose": payload["loan_purpose"],
                "employment_verification": payload.get("employment_verification", "Pending"),
                "bank_verification": payload.get("bank_verification", "Pending"),
                "document_verification": payload.get("document_verification", "Pending"),
                "previous_loan_history": payload.get("previous_loan_history", "None"),
            }
        ]
    )

    feat_df = engineer_features(row_df)
    X_proc = preprocessor.transform(feat_df[ALL_FEATURES])

    prob = float(model.predict_proba(X_proc)[0, 1])
    fraud_score = round(prob * 100.0, 1)

    if fraud_score <= 30.0:
        risk_level = "LOW"
    elif fraud_score <= 60.0:
        risk_level = "MEDIUM"
    else:
        risk_level = "HIGH"

    prediction_label = "Flagged for Review" if prob >= 0.50 else "Likely Legitimate"

    # Compute SHAP values
    if explainer is not None:
        raw_shap = explainer.shap_values(X_proc)
        if isinstance(raw_shap, list):
            shap_arr = np.array(raw_shap[1])[0]
            base_value = float(np.atleast_1d(explainer.expected_value)[-1])
        elif np.ndim(raw_shap) == 3:
            shap_arr = np.array(raw_shap)[0, :, 1]
            base_value = float(np.atleast_1d(explainer.expected_value)[-1])
        else:
            shap_arr = np.array(raw_shap)[0]
            base_value = float(np.atleast_1d(explainer.expected_value)[0])
    else:
        # Linear fallback for Logistic Regression
        coefs = model.coef_[0]
        shap_arr = X_proc[0] * coefs
        base_value = float(model.intercept_[0])

    # Aggregate one-hot SHAP values back to human-readable base features
    grouped: Dict[str, float] = {}
    for fname, sval in zip(feature_names, shap_arr):
        base = _map_transformed_to_base_feature(fname)
        grouped[base] = grouped.get(base, 0.0) + float(sval)

    explanations: List[Dict[str, Any]] = []
    for base_feat, sval in sorted(grouped.items(), key=lambda x: abs(x[1]), reverse=True):
        explanations.append(
            {
                "feature_name": HUMAN_FEATURE_LABELS.get(base_feat, base_feat),
                "raw_feature": base_feat,
                "shap_value": round(sval, 4),
                "explanation": _plain_english_explanation(base_feat, sval, payload),
            }
        )

    return {
        "fraud_score": fraud_score,
        "fraud_probability": round(prob, 4),
        "risk_level": risk_level,
        "prediction": prediction_label,
        "base_value": round(base_value, 4),
        "model_used": metrics.get("best_model", "XGBoost"),
        "explanations": explanations,
    }
