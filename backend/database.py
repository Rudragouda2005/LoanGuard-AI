import os
import sqlite3
from contextlib import contextmanager
from typing import Any, Dict, List, Optional

DB_PATH = os.getenv(
    "LOANGUARD_DB_PATH",
    os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "loanguard.db"),
)


def init_db() -> None:
    """Initialize SQLite database tables if they do not exist."""
    db_dir = os.path.dirname(os.path.abspath(DB_PATH))
    if db_dir:
        os.makedirs(db_dir, exist_ok=True)
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute("PRAGMA journal_mode = WAL;")
        conn.execute("PRAGMA synchronous = NORMAL;")
        conn.execute("PRAGMA foreign_keys = ON;")
        conn.executescript(
            """
            CREATE TABLE IF NOT EXISTS Applicants (
                applicant_id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                age INTEGER NOT NULL,
                employment_type TEXT NOT NULL,
                monthly_income REAL NOT NULL,
                marital_status TEXT,
                education TEXT,
                dependents INTEGER DEFAULT 0
            );

            CREATE TABLE IF NOT EXISTS Applications (
                application_id TEXT PRIMARY KEY,
                applicant_id TEXT NOT NULL,
                loan_amount REAL NOT NULL,
                loan_purpose TEXT NOT NULL,
                loan_term INTEGER NOT NULL,
                fraud_score REAL NOT NULL,
                risk_level TEXT NOT NULL,
                prediction TEXT NOT NULL,
                application_date TEXT NOT NULL,
                investigation_status TEXT NOT NULL DEFAULT 'Pending Review',
                employer_name TEXT,
                years_of_employment REAL,
                employment_verification TEXT,
                existing_debt REAL DEFAULT 0,
                credit_history INTEGER DEFAULT 1,
                declared_annual_income REAL,
                bank_verification TEXT,
                previous_loan_history TEXT,
                document_verification TEXT,
                declared_employment_info TEXT,
                notes TEXT,
                is_demo INTEGER DEFAULT 0,
                FOREIGN KEY (applicant_id) REFERENCES Applicants(applicant_id)
            );

            CREATE TABLE IF NOT EXISTS Risk_Explanations (
                explanation_id INTEGER PRIMARY KEY AUTOINCREMENT,
                application_id TEXT NOT NULL,
                feature_name TEXT NOT NULL,
                shap_value REAL NOT NULL,
                explanation TEXT NOT NULL,
                FOREIGN KEY (application_id) REFERENCES Applications(application_id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS Consistency_Checks (
                check_id INTEGER PRIMARY KEY AUTOINCREMENT,
                application_id TEXT NOT NULL,
                check_name TEXT NOT NULL,
                check_status TEXT NOT NULL,
                check_reason TEXT NOT NULL,
                FOREIGN KEY (application_id) REFERENCES Applications(application_id) ON DELETE CASCADE
            );

            CREATE INDEX IF NOT EXISTS idx_app_date ON Applications(application_date);
            CREATE INDEX IF NOT EXISTS idx_app_risk ON Applications(risk_level);
            CREATE INDEX IF NOT EXISTS idx_exp_appid ON Risk_Explanations(application_id);
            CREATE INDEX IF NOT EXISTS idx_chk_appid ON Consistency_Checks(application_id);
            """
        )
        conn.commit()


@contextmanager
def get_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    try:
        yield conn
    finally:
        conn.close()


def save_application_record(
    applicant: Dict[str, Any],
    application: Dict[str, Any],
    explanations: List[Dict[str, Any]],
    checks: List[Dict[str, Any]],
) -> None:
    """Persist applicant, application, SHAP explanations, and consistency checks."""
    with get_conn() as conn:
        conn.execute(
            """
            INSERT OR REPLACE INTO Applicants (
                applicant_id, name, age, employment_type, monthly_income,
                marital_status, education, dependents
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                applicant["applicant_id"],
                applicant["name"],
                applicant["age"],
                applicant["employment_type"],
                applicant["monthly_income"],
                applicant.get("marital_status"),
                applicant.get("education"),
                applicant.get("dependents", 0),
            ),
        )

        conn.execute(
            """
            INSERT OR REPLACE INTO Applications (
                application_id, applicant_id, loan_amount, loan_purpose, loan_term,
                fraud_score, risk_level, prediction, application_date, investigation_status,
                employer_name, years_of_employment, employment_verification,
                existing_debt, credit_history, declared_annual_income,
                bank_verification, previous_loan_history, document_verification,
                declared_employment_info, notes, is_demo
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                application["application_id"],
                application["applicant_id"],
                application["loan_amount"],
                application["loan_purpose"],
                application["loan_term"],
                application["fraud_score"],
                application["risk_level"],
                application["prediction"],
                application["application_date"],
                application.get("investigation_status", "Pending Review"),
                application.get("employer_name"),
                application.get("years_of_employment"),
                application.get("employment_verification"),
                application.get("existing_debt", 0.0),
                application.get("credit_history", 1),
                application.get("declared_annual_income"),
                application.get("bank_verification"),
                application.get("previous_loan_history"),
                application.get("document_verification"),
                application.get("declared_employment_info"),
                application.get("notes"),
                1 if application.get("is_demo") else 0,
            ),
        )

        conn.execute(
            "DELETE FROM Risk_Explanations WHERE application_id = ?",
            (application["application_id"],),
        )
        for exp in explanations:
            conn.execute(
                """
                INSERT INTO Risk_Explanations (application_id, feature_name, shap_value, explanation)
                VALUES (?, ?, ?, ?)
                """,
                (
                    application["application_id"],
                    exp["feature_name"],
                    exp["shap_value"],
                    exp["explanation"],
                ),
            )

        conn.execute(
            "DELETE FROM Consistency_Checks WHERE application_id = ?",
            (application["application_id"],),
        )
        for chk in checks:
            conn.execute(
                """
                INSERT INTO Consistency_Checks (application_id, check_name, check_status, check_reason)
                VALUES (?, ?, ?, ?)
                """,
                (
                    application["application_id"],
                    chk["check_name"],
                    chk["check_status"],
                    chk["check_reason"],
                ),
            )
        conn.commit()


def list_applications(
    search: Optional[str] = None,
    risk_level: Optional[str] = None,
    employment_type: Optional[str] = None,
    sort_by: str = "application_date",
    sort_order: str = "DESC",
) -> List[Dict[str, Any]]:
    """Return joined application + applicant rows with optional filters."""
    allowed_sort = {
        "application_date": "app.application_date",
        "fraud_score": "app.fraud_score",
        "loan_amount": "app.loan_amount",
        "monthly_income": "ap.monthly_income",
    }
    order_col = allowed_sort.get(sort_by, "app.application_date")
    order_dir = "ASC" if str(sort_order).upper() == "ASC" else "DESC"

    query = """
        SELECT
            app.*,
            ap.name AS applicant_name,
            ap.age AS applicant_age,
            ap.employment_type,
            ap.monthly_income,
            ap.marital_status,
            ap.education,
            ap.dependents
        FROM Applications app
        JOIN Applicants ap ON app.applicant_id = ap.applicant_id
        WHERE 1=1
    """
    params: List[Any] = []
    if search:
        query += " AND (app.application_id LIKE ? OR ap.name LIKE ?)"
        like_term = f"%{search.strip()}%"
        params.extend([like_term, like_term])
    if risk_level and risk_level != "ALL":
        query += " AND app.risk_level = ?"
        params.append(risk_level)
    if employment_type and employment_type != "ALL":
        query += " AND ap.employment_type = ?"
        params.append(employment_type)

    query += f" ORDER BY {order_col} {order_dir}, app.application_id DESC"

    with get_conn() as conn:
        rows = conn.execute(query, params).fetchall()
        return [dict(r) for r in rows]


def get_application_detail(application_id: str) -> Optional[Dict[str, Any]]:
    """Fetch full application record, SHAP explanations, and consistency checks."""
    with get_conn() as conn:
        row = conn.execute(
            """
            SELECT
                app.*,
                ap.name AS applicant_name,
                ap.age AS applicant_age,
                ap.employment_type,
                ap.monthly_income,
                ap.marital_status,
                ap.education,
                ap.dependents
            FROM Applications app
            JOIN Applicants ap ON app.applicant_id = ap.applicant_id
            WHERE app.application_id = ?
            """,
            (application_id,),
        ).fetchone()
        if not row:
            return None

        explanations = conn.execute(
            """
            SELECT explanation_id, feature_name, shap_value, explanation
            FROM Risk_Explanations
            WHERE application_id = ?
            ORDER BY ABS(shap_value) DESC
            """,
            (application_id,),
        ).fetchall()

        checks = conn.execute(
            """
            SELECT check_id, check_name, check_status, check_reason
            FROM Consistency_Checks
            WHERE application_id = ?
            ORDER BY check_id ASC
            """,
            (application_id,),
        ).fetchall()

        data = dict(row)
        data["explanations"] = [dict(e) for e in explanations]
        data["consistency_checks"] = [dict(c) for c in checks]
        return data


def update_investigation_status(application_id: str, status: str) -> bool:
    """Update investigation status for an application."""
    with get_conn() as conn:
        cur = conn.execute(
            "UPDATE Applications SET investigation_status = ? WHERE application_id = ?",
            (status, application_id),
        )
        conn.commit()
        return cur.rowcount > 0


def get_application_count() -> int:
    with get_conn() as conn:
        row = conn.execute("SELECT COUNT(*) AS cnt FROM Applications").fetchone()
        return int(row["cnt"]) if row else 0
