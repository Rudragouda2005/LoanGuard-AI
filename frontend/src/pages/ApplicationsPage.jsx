import React, { useEffect, useState } from 'react';
import { Search, Download, ArrowUpDown, Eye, Lock } from 'lucide-react';
import { api } from '../api';
import { RiskBadge, InvestigationBadge } from '../components/StatusBadge';

const STATUS_OPTIONS = [
  'Pending Review',
  'Under Investigation',
  'Verified Legitimate',
  'Confirmed Fraud',
];

export default function ApplicationsPage({
  onSelectApplication,
  reviewerToken,
  reviewerAuthorized,
  onNavigate,
}) {
  const [apps, setApps] = useState([]);
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState('ALL');
  const [sortOrder, setSortOrder] = useState('DESC');
  const [sortBy, setSortBy] = useState('application_date');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');

  const loadApps = () => {
    setLoading(true);
    api
      .getApplications({
        search,
        risk_level: riskFilter,
        sort_by: sortBy,
        sort_order: sortOrder,
      })
      .then((res) => setApps(res))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadApps();
  }, [search, riskFilter, sortBy, sortOrder]);

  const handleStatusChange = async (appId, newStatus) => {
    setToast('');
    try {
      await api.updateApplicationStatus(appId, newStatus, reviewerToken);
      setApps((prev) =>
        prev.map((a) =>
          a.application_id === appId ? { ...a, investigation_status: newStatus } : a
        )
      );
      setToast(`Updated ${appId} to "${newStatus}".`);
    } catch (err) {
      setToast(err.message);
    }
  };

  const toggleFraudSort = () => {
    setSortBy('fraud_score');
    setSortOrder((prev) => (prev === 'DESC' ? 'ASC' : 'DESC'));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Application History</h1>
          <p className="text-sm text-slate-500 mt-1">
            Search, filter, update underwriter investigation status, and export records.
          </p>
        </div>
        <a
          href={api.getCsvExportUrl({ search, risk_level: riskFilter })}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-slate-900 hover:bg-slate-800 text-white transition-colors self-start"
        >
          <Download className="w-4 h-4" />
          <span>Export CSV</span>
        </a>
      </div>

      {!reviewerAuthorized && (
        <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              Only authorized reviewers can mark an application as <strong>Confirmed Fraud</strong>.
            </span>
          </div>
          <button
            onClick={() => onNavigate('settings')}
            className="text-xs font-bold underline text-amber-800 hover:text-amber-950 shrink-0"
          >
            Authorize in Settings
          </button>
        </div>
      )}

      {toast && (
        <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-xs font-medium">
          {toast}
        </div>
      )}

      {/* Search & Filter Controls */}
      <div className="card-surface p-4 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by Application ID or Applicant Name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="px-3.5 py-2 rounded-xl border border-slate-300 text-sm bg-white"
          >
            <option value="ALL">All Risk Levels</option>
            <option value="LOW">Low Risk</option>
            <option value="MEDIUM">Medium Risk</option>
            <option value="HIGH">High Risk</option>
          </select>

          <button
            onClick={toggleFraudSort}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <ArrowUpDown className="w-4 h-4" />
            <span>Sort by Fraud Score ({sortBy === 'fraud_score' ? sortOrder : 'DESC'})</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="card-surface p-5 overflow-hidden">
        {loading ? (
          <div className="py-8 text-center text-sm text-slate-500">Loading applications...</div>
        ) : apps.length === 0 ? (
          <div className="py-8 text-center text-sm text-slate-500">
            No matching applications found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase text-slate-500">
                  <th className="py-2.5 pr-3">Application ID</th>
                  <th className="py-2.5 pr-3">Applicant</th>
                  <th className="py-2.5 pr-3">Date</th>
                  <th className="py-2.5 pr-3">Loan Amount</th>
                  <th className="py-2.5 pr-3">Fraud Score</th>
                  <th className="py-2.5 pr-3">Risk Level</th>
                  <th className="py-2.5 pr-3">Investigation Status</th>
                  <th className="py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {apps.map((a) => (
                  <tr key={a.application_id} className="hover:bg-slate-50/80">
                    <td className="py-3 pr-3 font-semibold text-slate-900">{a.application_id}</td>
                    <td className="py-3 pr-3 text-slate-700">{a.applicant_name}</td>
                    <td className="py-3 pr-3 text-slate-500 text-xs">{a.application_date}</td>
                    <td className="py-3 pr-3 text-slate-700">
                      ${Number(a.loan_amount).toLocaleString()}
                    </td>
                    <td className="py-3 pr-3 font-bold text-slate-900">{a.fraud_score}/100</td>
                    <td className="py-3 pr-3">
                      <RiskBadge level={a.risk_level} />
                    </td>
                    <td className="py-3 pr-3">
                      <select
                        value={a.investigation_status}
                        onChange={(e) => handleStatusChange(a.application_id, e.target.value)}
                        className="px-2.5 py-1 rounded-lg border border-slate-300 text-xs font-medium bg-white"
                      >
                        {STATUS_OPTIONS.map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => onSelectApplication(a.application_id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Open</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
