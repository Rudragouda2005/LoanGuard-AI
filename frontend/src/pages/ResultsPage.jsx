import React from 'react';
import {
  BrainCircuit,
  Download,
  ArrowLeft,
  AlertTriangle,
  CheckCircle2,
  Info,
} from 'lucide-react';
import RiskGauge from '../components/RiskGauge';
import { RiskBadge, CheckStatusBadge, InvestigationBadge } from '../components/StatusBadge';
import { api } from '../api';

export default function ResultsPage({ application, onNavigate, onViewExplainability }) {
  if (!application) {
    return (
      <div className="card-surface p-8 text-center">
        <p className="text-slate-600 text-sm">No application selected yet.</p>
        <button
          onClick={() => onNavigate('analyze')}
          className="mt-4 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold"
        >
          Analyze New Application
        </button>
      </div>
    );
  }

  const flaggedChecks = (application.consistency_checks || []).filter(
    (c) => c.check_status !== 'PASS'
  );
  const topShapReasons = (application.explanations || [])
    .filter((e) => e.shap_value > 0)
    .slice(0, 3);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-slate-900">
              Fraud Detection Report — {application.application_id}
            </h1>
            <RiskBadge level={application.risk_level} />
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Evaluated on {application.application_date} · Investigation Status:{' '}
            <InvestigationBadge status={application.investigation_status} />
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={() => onViewExplainability(application.application_id)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-purple-600 hover:bg-purple-500 text-white shadow-sm transition-colors"
          >
            <BrainCircuit className="w-4 h-4" />
            <span>View AI Explanation</span>
          </button>
          <a
            href={api.getPdfUrl(application.application_id)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-sm transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Download Risk Report</span>
          </a>
          <button
            onClick={() => onNavigate('dashboard')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Dashboard</span>
          </button>
        </div>
      </div>

      {/* Important Policy Disclaimer */}
      <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="text-xs text-blue-900 leading-relaxed">
          <strong>Underwriter Guidance:</strong> A high-risk score indicates a need for further
          investigation and document verification, <strong>not confirmed fraud</strong>. Final
          credit decisions must be made by an authorized underwriter.
        </div>
      </div>

      {/* Gauge + Key Indicators */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-5 card-surface p-6 flex flex-col items-center justify-center">
          <RiskGauge score={application.fraud_score} riskLevel={application.risk_level} />
          <div className="mt-4 text-center">
            <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
              Model Prediction
            </div>
            <div className="text-base font-bold text-slate-900 mt-0.5">
              {application.prediction}
            </div>
          </div>
        </div>

        <div className="lg:col-span-7 card-surface p-6 space-y-4">
          <h3 className="text-base font-bold text-slate-900">
            Key Risk Drivers &amp; Suspicious Indicators
          </h3>

          {topShapReasons.length === 0 && flaggedChecks.length === 0 ? (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2.5 text-sm text-emerald-800">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>
                No significant fraud risk indicators were detected. Financial and employment
                declarations appear consistent.
              </span>
            </div>
          ) : (
            <ul className="space-y-2.5">
              {topShapReasons.map((exp) => (
                <li
                  key={exp.feature_name}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-2.5 text-sm text-slate-700"
                >
                  <AlertTriangle className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                  <span>{exp.explanation}</span>
                </li>
              ))}
              {flaggedChecks.slice(0, 3).map((chk) => (
                <li
                  key={chk.check_name}
                  className="p-3 rounded-xl bg-red-50/60 border border-red-200/80 flex items-start gap-2.5 text-sm text-slate-800"
                >
                  <CheckStatusBadge status={chk.check_status} />
                  <span>{chk.check_reason}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Applicant Details */}
      <div className="card-surface p-6">
        <h3 className="text-base font-bold text-slate-900 mb-4">Applicant &amp; Loan Summary</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <div>
            <div className="text-xs text-slate-500">Applicant Name</div>
            <div className="font-semibold text-slate-900 mt-0.5">{application.applicant_name}</div>
          </div>
          <div>
            <div className="text-xs text-slate-500">Employment Type</div>
            <div className="font-semibold text-slate-900 mt-0.5">{application.employment_type}</div>
          </div>
          <div>
            <div className="text-xs text-slate-500">Monthly Income</div>
            <div className="font-semibold text-slate-900 mt-0.5">
              ${Number(application.monthly_income).toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-500">Declared Annual Income</div>
            <div className="font-semibold text-slate-900 mt-0.5">
              ${Number(application.declared_annual_income || 0).toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-500">Requested Loan</div>
            <div className="font-semibold text-slate-900 mt-0.5">
              ${Number(application.loan_amount).toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-500">Loan Purpose</div>
            <div className="font-semibold text-slate-900 mt-0.5">{application.loan_purpose}</div>
          </div>
          <div>
            <div className="text-xs text-slate-500">Years Employed</div>
            <div className="font-semibold text-slate-900 mt-0.5">
              {application.years_of_employment} yrs
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-500">Existing Debt</div>
            <div className="font-semibold text-slate-900 mt-0.5">
              ${Number(application.existing_debt || 0).toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* Consistency Check Results */}
      <div className="card-surface p-6">
        <h3 className="text-base font-bold text-slate-900 mb-1">
          Intelligent Consistency Engine Results
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Rule-based cross-validation checks executed independently from the ML model
        </p>
        <div className="space-y-3">
          {(application.consistency_checks || []).map((chk) => (
            <div
              key={chk.check_name}
              className="p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div>
                <div className="text-sm font-bold text-slate-900">{chk.check_name}</div>
                <div className="text-xs text-slate-600 mt-0.5">{chk.check_reason}</div>
              </div>
              <CheckStatusBadge status={chk.check_status} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
