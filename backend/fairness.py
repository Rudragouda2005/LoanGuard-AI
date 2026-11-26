import os
from functools import lru_cache
from typing import Any, Dict, List

import numpy as np
import pandas as pd

from backend.ml_pipeline import MODEL_DIR, train_and_save_models


def _group_metrics(df: pd.DataFrame, group_col: str) -> List[Dict[str, Any]]:
    rows: List[Dict[str, Any]] = []
    for group_val, grp in df.groupby(group_col):
        y_true = grp["y_true"].values
        y_pred = grp["y_pred"].values
        neg_mask = y_true == 0
        pos_mask = y_true == 1

        fp = int(((y_pred == 1) & neg_mask).sum())
        tn = int(((y_pred == 0) & neg_mask).sum())
        tp = int(((y_pred == 1) & pos_mask).sum())
        fn = int(((y_pred == 0) & pos_mask).sum())

        fpr = round(fp / max(fp + tn, 1), 4)
        tpr = round(tp / max(tp + fn, 1), 4)
        flagged_rate = round(float((y_pred == 1).mean()), 4)

        rows.append(
            {
                "group": str(group_val),
                "sample_count": int(len(grp)),
                "false_positive_rate": fpr,
                "true_positive_rate": tpr,
                "flagged_rate": flagged_rate,
            }
        )
    return rows


@lru_cache(maxsize=1)
def compute_fairness_report() -> Dict[str, Any]:
    """Evaluate false-positive rates and parity across demographic groups on validation data."""
    eval_path = os.path.join(MODEL_DIR, "fairness_eval.csv")
    if not os.path.exists(eval_path):
        train_and_save_models(force_retrain=False)

    df = pd.read_csv(eval_path)
    df["age_group"] = pd.cut(
        df["age"],
        bins=[17, 30, 45, 100],
        labels=["18-30", "31-45", "46+"],
    ).astype(str)

    gender_metrics = _group_metrics(df, "gender")
    age_metrics = _group_metrics(df, "age_group")

    fprs = [m["false_positive_rate"] for m in gender_metrics if m["sample_count"] >= 10]
    fpr_gap = round(max(fprs) - min(fprs), 4) if len(fprs) >= 2 else 0.0

    return {
        "protected_attributes_excluded": ["gender", "marital_status"],
        "demographic_parity_note": (
            "Protected attributes are strictly excluded from model training and inference. "
            "Validation false-positive rates are audited across authorized demographic groups."
        ),
        "gender_fpr_gap": fpr_gap,
        "gender_metrics": gender_metrics,
        "age_group_metrics": age_metrics,
        "model_limitations": [
            "Synthetic fraud patterns may not capture every emerging real-world fraud scheme.",
            "Thin-file or newly self-employed applicants can exhibit higher variance in income ratios.",
            "High-risk scores indicate a need for human underwriter verification, never automatic rejection.",
        ],
    }
