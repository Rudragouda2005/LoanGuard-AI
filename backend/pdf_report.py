import io
from typing import Any, Dict

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle


def generate_risk_report_pdf(app_data: Dict[str, Any]) -> bytes:
    """Generate a professional underwriter PDF risk report for an application."""
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=0.65 * inch,
        leftMargin=0.65 * inch,
        topMargin=0.6 * inch,
        bottomMargin=0.6 * inch,
    )

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        "LGTitle",
        parent=styles["Heading1"],
        fontSize=20,
        textColor=colors.HexColor("#0B1220"),
        spaceAfter=4,
    )
    subtitle_style = ParagraphStyle(
        "LGSub",
        parent=styles["Normal"],
        fontSize=10,
        textColor=colors.HexColor("#475569"),
        spaceAfter=14,
    )
    section_style = ParagraphStyle(
        "LGSection",
        parent=styles["Heading2"],
        fontSize=12,
        textColor=colors.HexColor("#0F172A"),
        spaceBefore=12,
        spaceAfter=6,
    )
    body_style = ParagraphStyle(
        "LGBody",
        parent=styles["Normal"],
        fontSize=9.5,
        leading=13,
        textColor=colors.HexColor("#1E293B"),
    )

    risk_level = app_data.get("risk_level", "MEDIUM")
    risk_color = {
        "LOW": "#16A34A",
        "MEDIUM": "#EA580C",
        "HIGH": "#DC2626",
    }.get(risk_level, "#334155")

    elements = []
    elements.append(Paragraph("LOANGUARD AI — UNDERWRITER RISK REPORT", title_style))
    elements.append(
        Paragraph(
            f"Detect Fraud. Protect Finance. Build Trust. | Application ID: <b>{app_data['application_id']}</b> | Date: {app_data['application_date']}",
            subtitle_style,
        )
    )

    # Summary Banner
    summary_table = Table(
        [
            [
                f"Fraud Risk Score: {app_data['fraud_score']}/100",
                f"Risk Classification: {risk_level}",
                f"Status: {app_data.get('investigation_status', 'Pending Review')}",
            ]
        ],
        colWidths=[2.3 * inch, 2.3 * inch, 2.5 * inch],
    )
    summary_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#0B1220")),
                ("TEXTCOLOR", (0, 0), (-1, -1), colors.white),
                ("TEXTCOLOR", (1, 0), (1, 0), colors.HexColor(risk_color)),
                ("FONTNAME", (0, 0), (-1, -1), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 10),
                ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                ("PADDING", (0, 0), (-1, -1), 10),
            ]
        )
    )
    elements.append(summary_table)
    elements.append(Spacer(1, 10))

    # Applicant & Financial Information
    elements.append(Paragraph("1. Applicant & Financial Information", section_style))
    info_data = [
        ["Applicant Name", str(app_data.get("applicant_name", "")), "Age", str(app_data.get("applicant_age", ""))],
        ["Employment Type", str(app_data.get("employment_type", "")), "Employer", str(app_data.get("employer_name", "N/A"))],
        ["Years Employed", str(app_data.get("years_of_employment", "N/A")), "Monthly Income", f"${float(app_data.get('monthly_income', 0)):,.2f}"],
        ["Declared Annual Income", f"${float(app_data.get('declared_annual_income') or 0):,.2f}", "Existing Debt", f"${float(app_data.get('existing_debt') or 0):,.2f}"],
        ["Loan Amount", f"${float(app_data.get('loan_amount', 0)):,.2f}", "Loan Purpose", str(app_data.get("loan_purpose", ""))],
        ["Loan Term", f"{app_data.get('loan_term', 36)} months", "Model Prediction", str(app_data.get("prediction", ""))],
    ]
    info_table = Table(info_data, colWidths=[1.6 * inch, 1.9 * inch, 1.6 * inch, 2.0 * inch])
    info_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#F1F5F9")),
                ("BACKGROUND", (2, 0), (2, -1), colors.HexColor("#F1F5F9")),
                ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
                ("FONTNAME", (2, 0), (2, -1), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 9),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
                ("PADDING", (0, 0), (-1, -1), 6),
            ]
        )
    )
    elements.append(info_table)

    # Consistency Checks
    elements.append(Paragraph("2. Consistency Verification Results", section_style))
    chk_rows = [["Check Name", "Status", "Finding"]]
    for chk in app_data.get("consistency_checks", []):
        chk_rows.append(
            [
                Paragraph(str(chk["check_name"]), body_style),
                str(chk["check_status"]),
                Paragraph(str(chk["check_reason"]), body_style),
            ]
        )
    chk_table = Table(chk_rows, colWidths=[1.9 * inch, 0.9 * inch, 4.3 * inch])
    chk_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1E293B")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 8.5),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("PADDING", (0, 0), (-1, -1), 6),
            ]
        )
    )
    elements.append(chk_table)

    # SHAP Explanations
    elements.append(Paragraph("3. AI Explainability (Top SHAP Risk Drivers)", section_style))
    shap_rows = [["Feature", "SHAP Impact", "Explanation"]]
    for exp in app_data.get("explanations", [])[:7]:
        shap_rows.append(
            [
                Paragraph(str(exp["feature_name"]), body_style),
                f"{float(exp['shap_value']):+.4f}",
                Paragraph(str(exp["explanation"]), body_style),
            ]
        )
    shap_table = Table(shap_rows, colWidths=[1.8 * inch, 1.0 * inch, 4.3 * inch])
    shap_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1E293B")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 8.5),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("PADDING", (0, 0), (-1, -1), 6),
            ]
        )
    )
    elements.append(shap_table)

    # Recommended Next Steps & Disclaimer
    elements.append(Paragraph("4. Recommended Underwriter Next Steps", section_style))
    if risk_level == "HIGH":
        next_steps = (
            "1. Place application on hold pending manual underwriter review.<br/>"
            "2. Request certified tax returns, recent bank statements, and direct employer verification.<br/>"
            "3. Escalate to senior fraud analyst before any adverse or approval action."
        )
    elif risk_level == "MEDIUM":
        next_steps = (
            "1. Verify pending employment or income documentation.<br/>"
            "2. Confirm existing debt obligations via credit bureau refresh."
        )
    else:
        next_steps = (
            "1. Application exhibits consistent financial and employment declarations.<br/>"
            "2. Proceed with standard automated underwriting workflow."
        )
    elements.append(Paragraph(next_steps, body_style))

    elements.append(Paragraph("5. Regulatory & Decision Disclaimer", section_style))
    elements.append(
        Paragraph(
            "A high-risk score generated by LoanGuard AI indicates a need for further investigation, "
            "not confirmed fraud. Protected demographic attributes are excluded from model predictions. "
            "Final lending decisions must be made by authorized human underwriters.",
            body_style,
        )
    )

    doc.build(elements)
    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes
