from typing import Any, Dict, List


def run_consistency_checks(payload: Dict[str, Any]) -> List[Dict[str, str]]:
    """
    Rule-based Intelligent Consistency Checking Engine.
    Evaluates application declarations independently from the ML model.
    Returns list of checks with status in {PASS, WARNING, FLAG}.
    """
    checks: List[Dict[str, str]] = []

    monthly_income = float(payload.get("monthly_income", 0) or 0)
    declared_annual = float(payload.get("declared_annual_income", 0) or 0)
    loan_amount = float(payload.get("loan_amount", 0) or 0)
    existing_debt = float(payload.get("existing_debt", 0) or 0)
    years_emp = float(payload.get("years_of_employment", 0) or 0)
    age = int(payload.get("age", 18) or 18)
    emp_type = str(payload.get("employment_type", "")).strip()
    emp_verif = str(payload.get("employment_verification", "Pending")).strip()
    bank_verif = str(payload.get("bank_verification", "Pending")).strip()
    doc_verif = str(payload.get("document_verification", "Pending")).strip()
    employer_name = str(payload.get("employer_name", "")).strip()
    declared_emp_info = str(payload.get("declared_employment_info", "")).strip()

    # 1. Monthly Income vs Declared Annual Income
    expected_annual = monthly_income * 12.0
    if expected_annual <= 0 or declared_annual <= 0:
        checks.append(
            {
                "check_name": "Monthly vs. Declared Annual Income",
                "check_status": "FLAG",
                "check_reason": "Monthly income or declared annual income is missing or non-positive.",
            }
        )
    else:
        diff_ratio = abs(declared_annual - expected_annual) / expected_annual
        if diff_ratio > 0.30:
            checks.append(
                {
                    "check_name": "Monthly vs. Declared Annual Income",
                    "check_status": "FLAG",
                    "check_reason": (
                        f"Declared annual income (${declared_annual:,.0f}) deviates by {diff_ratio * 100:.1f}% "
                        f"from annualized monthly income (${expected_annual:,.0f})."
                    ),
                }
            )
        elif diff_ratio > 0.12:
            checks.append(
                {
                    "check_name": "Monthly vs. Declared Annual Income",
                    "check_status": "WARNING",
                    "check_reason": (
                        f"Declared annual income (${declared_annual:,.0f}) differs by {diff_ratio * 100:.1f}% "
                        f"from annualized monthly income (${expected_annual:,.0f}); bonus or tax adjustment should be verified."
                    ),
                }
            )
        else:
            checks.append(
                {
                    "check_name": "Monthly vs. Declared Annual Income",
                    "check_status": "PASS",
                    "check_reason": "Declared annual income aligns closely with reported monthly income.",
                }
            )

    # 2. Loan Amount vs Annual Income (Loan-to-Income Ratio)
    effective_annual = max(expected_annual, 1.0)
    lti = loan_amount / effective_annual
    if lti > 5.0:
        checks.append(
            {
                "check_name": "Loan-to-Income Ratio",
                "check_status": "FLAG",
                "check_reason": f"Requested loan (${loan_amount:,.0f}) is {lti:.1f}x annualized income, which exceeds standard underwriting thresholds.",
            }
        )
    elif lti > 3.0:
        checks.append(
            {
                "check_name": "Loan-to-Income Ratio",
                "check_status": "WARNING",
                "check_reason": f"Requested loan is {lti:.1f}x annualized income; requires secondary affordability review.",
            }
        )
    else:
        checks.append(
            {
                "check_name": "Loan-to-Income Ratio",
                "check_status": "PASS",
                "check_reason": f"Loan-to-income ratio ({lti:.2f}x) is within standard lending limits.",
            }
        )

    # 3. Employment Duration Consistency (Age vs Years of Employment)
    max_plausible_years = max(0, age - 16)
    if years_emp > max_plausible_years:
        checks.append(
            {
                "check_name": "Employment Duration Plausibility",
                "check_status": "FLAG",
                "check_reason": (
                    f"Declared employment duration ({years_emp:.1f} yrs) exceeds plausible working years "
                    f"for applicant age ({age} yrs)."
                ),
            }
        )
    elif emp_type == "Unemployed" and years_emp > 0.5:
        checks.append(
            {
                "check_name": "Employment Duration Plausibility",
                "check_status": "WARNING",
                "check_reason": "Applicant is marked Unemployed but lists active employment tenure.",
            }
        )
    elif years_emp < 0.5 and loan_amount > 25000:
        checks.append(
            {
                "check_name": "Employment Duration Plausibility",
                "check_status": "WARNING",
                "check_reason": "Short employment tenure (< 6 months) paired with a high loan request.",
            }
        )
    else:
        checks.append(
            {
                "check_name": "Employment Duration Plausibility",
                "check_status": "PASS",
                "check_reason": "Employment duration is consistent with applicant age and employment type.",
            }
        )

    # 4. Existing Debt vs Income (Debt-to-Income)
    dti = existing_debt / effective_annual
    if dti > 0.65:
        checks.append(
            {
                "check_name": "Existing Debt-to-Income",
                "check_status": "FLAG",
                "check_reason": f"Existing debt (${existing_debt:,.0f}) represents {dti * 100:.1f}% of annual income.",
            }
        )
    elif dti > 0.40:
        checks.append(
            {
                "check_name": "Existing Debt-to-Income",
                "check_status": "WARNING",
                "check_reason": f"Moderate-to-high existing debt load ({dti * 100:.1f}% of annual income).",
            }
        )
    else:
        checks.append(
            {
                "check_name": "Existing Debt-to-Income",
                "check_status": "PASS",
                "check_reason": f"Existing debt-to-income ({dti * 100:.1f}%) is manageable.",
            }
        )

    # 5. Contradictory / Missing Employment Information
    if emp_type in ("Salaried", "Self-Employed") and (not employer_name or employer_name.lower() in ("none", "n/a", "unknown")):
        checks.append(
            {
                "check_name": "Declared Employment Details",
                "check_status": "FLAG",
                "check_reason": f"Employment type is '{emp_type}' but employer name is missing or invalid.",
            }
        )
    elif "mismatch" in declared_emp_info.lower() or "unverifiable" in declared_emp_info.lower():
        checks.append(
            {
                "check_name": "Declared Employment Details",
                "check_status": "FLAG",
                "check_reason": "Declared employment information contains mismatch or unverifiable indicators.",
            }
        )
    elif not declared_emp_info:
        checks.append(
            {
                "check_name": "Declared Employment Details",
                "check_status": "WARNING",
                "check_reason": "Declared employment summary was left blank.",
            }
        )
    else:
        checks.append(
            {
                "check_name": "Declared Employment Details",
                "check_status": "PASS",
                "check_reason": "Employer and declared employment details are complete and consistent.",
            }
        )

    # 6. Document & Verification Status
    if doc_verif == "Failed" or emp_verif == "Failed" or bank_verif == "Failed":
        failed_items = [
            name
            for name, val in [
                ("Document", doc_verif),
                ("Employment", emp_verif),
                ("Bank Account", bank_verif),
            ]
            if val == "Failed"
        ]
        checks.append(
            {
                "check_name": "Document & Identity Verification",
                "check_status": "FLAG",
                "check_reason": f"Verification failed for: {', '.join(failed_items)}.",
            }
        )
    elif doc_verif == "Pending" or emp_verif == "Pending" or bank_verif == "Pending":
        pending_items = [
            name
            for name, val in [
                ("Document", doc_verif),
                ("Employment", emp_verif),
                ("Bank Account", bank_verif),
            ]
            if val == "Pending"
        ]
        checks.append(
            {
                "check_name": "Document & Identity Verification",
                "check_status": "WARNING",
                "check_reason": f"Verification still pending for: {', '.join(pending_items)}.",
            }
        )
    else:
        checks.append(
            {
                "check_name": "Document & Identity Verification",
                "check_status": "PASS",
                "check_reason": "Document, employment, and bank account verifications all passed.",
            }
        )

    return checks
