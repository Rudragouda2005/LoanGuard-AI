import React, { useEffect, useState } from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
  Legend,
} from 'recharts';
import {
  FilePlus2,
  AlertTriangle,
  ShieldCheck,
  Activity,
  Target,
  FolderCheck,
  Eye,
  BellRing,
} from 'lucide-react';
import { api } from '../api';
import { RiskBadge, InvestigationBadge } from '../components/StatusBadge';

const RISK_COLORS = {
  LOW: '#16A34A',
  MEDIUM: '#EA580C',
  HIGH: '#DC2626',
};

const DIST_COLORS = ['#0EA5E9', '#EF4444'];

export default function DashboardPage({ onNavigate, onSelectApplication }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    api
      .getDashboard()
      .then((res) => {
        if (active) setData(res);
      })
      .catch((err) => {
        if (active) setError(err.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="p-8 text-slate-500 text-sm">Loading real-time fraud intelligence...</div>
    );
  }
  if (error || !data) {
    return (
      <div className="p-8 text-red-600 text-sm">
        Unable to load dashboard data: {error || 'Unknown error'}
      </div>
    );
  }

  const { kpis } = data;
  const todayFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const kpiCards = [
    {
      label: 'Total Applications Analyzed',
      value: kpis.total_applications,
      icon: FolderCheck,
      color: 'text-blue-600 bg-blue-50',
    },
    {
      label: 'High-Risk Applications',
      value: kpis.high_risk_count,
      icon: AlertTriangle,
      color: 'text-red-600 bg-red-50',
    },
    {
      label: 'Medium-Risk Applications',
      value: kpis.medium_risk_count,
      icon: Activity,
      color: 'text-orange-600 bg-orange-50',
    },
    {
      label: 'Low-Risk Applications',
      value: kpis.low_risk_count,
      icon: ShieldCheck,
      color: 'text-emerald-600 bg-emerald-50',
    },
    {
      label: 'Average Fraud Risk Score',
      value: `${kpis.average_fraud_score}/100`,
      icon: Target,
      color: 'text-purple-600 bg-purple-50',
    },
    {
      label: `Model Accuracy (${kpis.best_model})`,
      value: `${kpis.model_accuracy}%`,
      icon: Activity,
      color: 'text-cyan-600 bg-cyan-50',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Underwriter Risk Command Center</h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time loan fraud monitoring, consistency verification, and ML risk telemetry — {todayFormatted}
          </p>
        </div>
        <button
          onClick={() => onNavigate('analyze')}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white shadow-md shadow-blue-600/20 transition-all self-start"
        >
          <FilePlus2 className="w-4 h-4" />
          <span>Analyze New Application</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {kpiCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="card-surface card-surface-hover p-4">
              <div className="flex items-center justify-between">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${card.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 text-2xl font-extrabold text-slate-900">{card.value}</div>
              <div className="text-xs font-medium text-slate-500 mt-0.5">{card.label}</div>
            </div>
          );
        })}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="card-surface p-5">
          <h3 className="text-sm font-bold text-slate-900">Fraud vs. Legitimate Distribution</h3>
          <p className="text-xs text-slate-500 mb-3">Model classification across stored applications</p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.fraud_vs_legitimate}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={48}
                  outerRadius={78}
                  paddingAngle={4}
                >
                  {data.fraud_vs_legitimate.map((entry, idx) => (
                    <Cell key={entry.name} fill={DIST_COLORS[idx % DIST_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card-surface p-5">
          <h3 className="text-sm font-bold text-slate-900">Risk Level Distribution</h3>
          <p className="text-xs text-slate-500 mb-3">Low (0–30), Medium (31–60), High (61–100)</p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.risk_distribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="level" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                  {data.risk_distribution.map((entry) => (
                    <Cell key={entry.level} fill={RISK_COLORS[entry.level] || '#3B82F6'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card-surface p-5">
          <h3 className="text-sm font-bold text-slate-900">Monthly Application Analysis</h3>
          <p className="text-xs text-slate-500 mb-3">Total vs. flagged applications by month</p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.monthly_trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="total" name="Total" fill="#3B82F6" radius={[6, 6, 0, 0]} />
                <Bar dataKey="flagged" name="Flagged" fill="#EF4444" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="card-surface p-5">
          <h3 className="text-sm font-bold text-slate-900">Fraud Detection Trend</h3>
          <p className="text-xs text-slate-500 mb-3">Average monthly fraud risk score</p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.monthly_trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="avg_risk_score"
                  name="Avg Risk Score"
                  stroke="#8B5CF6"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card-surface p-5">
          <h3 className="text-sm font-bold text-slate-900">Fraud Risk by Employment Type</h3>
          <p className="text-xs text-slate-500 mb-3">Mean risk score per employment category</p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.by_employment} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12 }} />
                <YAxis type="category" dataKey="employment_type" width={95} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="avg_risk_score" name="Avg Risk Score" fill="#06B6D4" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card-surface p-5">
          <h3 className="text-sm font-bold text-slate-900">Fraud Risk by Income Group</h3>
          <p className="text-xs text-slate-500 mb-3">Average risk score by monthly income bracket</p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.by_income_group}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="income_group" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="avg_risk_score" name="Avg Risk Score" fill="#6366F1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom Section: Recent Applications Table + Recent Fraud Alerts */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        <div className="xl:col-span-8 card-surface p-5 overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Recent Applications</h3>
              <p className="text-xs text-slate-500">Latest evaluated loan applications from SQLite store</p>
            </div>
            <button
              onClick={() => onNavigate('applications')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700"
            >
              View All →
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase text-slate-500">
                  <th className="py-2.5 pr-3">Application ID</th>
                  <th className="py-2.5 pr-3">Applicant</th>
                  <th className="py-2.5 pr-3">Loan Amount</th>
                  <th className="py-2.5 pr-3">Monthly Income</th>
                  <th className="py-2.5 pr-3">Risk Score</th>
                  <th className="py-2.5 pr-3">Risk Level</th>
                  <th className="py-2.5 pr-3">Status</th>
                  <th className="py-2.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.recent_applications.map((app) => (
                  <tr key={app.application_id} className="hover:bg-slate-50/80">
                    <td className="py-3 pr-3 font-semibold text-slate-800">{app.application_id}</td>
                    <td className="py-3 pr-3 text-slate-700">{app.applicant_name}</td>
                    <td className="py-3 pr-3 text-slate-700">
                      ${Number(app.loan_amount).toLocaleString()}
                    </td>
                    <td className="py-3 pr-3 text-slate-700">
                      ${Number(app.monthly_income).toLocaleString()}
                    </td>
                    <td className="py-3 pr-3 font-bold text-slate-900">{app.fraud_score}/100</td>
                    <td className="py-3 pr-3">
                      <RiskBadge level={app.risk_level} />
                    </td>
                    <td className="py-3 pr-3">
                      <InvestigationBadge status={app.investigation_status} />
                    </td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => onSelectApplication(app.application_id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Details</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="xl:col-span-4 card-surface p-5">
          <div className="flex items-center gap-2 mb-4">
            <BellRing className="w-4 h-4 text-red-500" />
            <h3 className="text-base font-bold text-slate-900">Recent Fraud Alerts</h3>
          </div>
          <div className="space-y-3">
            {data.recent_alerts.length === 0 ? (
              <p className="text-xs text-slate-500">No medium or high risk alerts recorded yet.</p>
            ) : (
              data.recent_alerts.map((alert) => (
                <div
                  key={alert.application_id}
                  className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-800">
                      {alert.application_id} · {alert.applicant_name}
                    </span>
                    <RiskBadge level={alert.risk_level} />
                  </div>
                  <div className="mt-1.5 flex items-center justify-between text-xs text-slate-600">
                    <span>Score: {alert.fraud_score}/100</span>
                    <span>${Number(alert.loan_amount).toLocaleString()}</span>
                  </div>
                  <button
                    onClick={() => onSelectApplication(alert.application_id)}
                    className="mt-2 text-xs font-semibold text-blue-600 hover:text-blue-700"
                  >
                    Investigate Application →
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
