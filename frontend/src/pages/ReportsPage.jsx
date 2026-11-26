import React, { useEffect, useState } from 'react';
import { FileText, Download, Eye } from 'lucide-react';
import { api } from '../api';
import { RiskBadge, InvestigationBadge } from '../components/StatusBadge';

export default function ReportsPage({ onSelectApplication }) {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getApplications()
      .then((res) => setApps(res))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Underwriter Risk Reports</h1>
        <p className="text-sm text-slate-500 mt-1">
          Generate and download audit-ready PDF risk reports containing SHAP attributions, consistency checks, and next steps.
        </p>
      </div>

      {loading ? (
        <div className="card-surface p-8 text-sm text-slate-500">Loading available reports...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {apps.map((app) => (
            <div key={app.application_id} className="card-surface card-surface-hover p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                      <FileText className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-bold text-slate-900">{app.application_id}</span>
                  </div>
                  <RiskBadge level={app.risk_level} />
                </div>

                <div className="mt-3 text-sm font-semibold text-slate-800">{app.applicant_name}</div>
                <div className="text-xs text-slate-500 mt-0.5">
                  Loan: ${Number(app.loan_amount).toLocaleString()} · Score: {app.fraud_score}/100
                </div>
                <div className="mt-2">
                  <InvestigationBadge status={app.investigation_status} />
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2">
                <a
                  href={api.getPdfUrl(app.application_id)}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download PDF</span>
                </a>
                <button
                  onClick={() => onSelectApplication(app.application_id)}
                  className="inline-flex items-center justify-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>View</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
