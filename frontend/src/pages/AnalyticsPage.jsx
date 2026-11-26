import React, { useEffect, useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ScatterChart,
  Scatter,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Filter } from 'lucide-react';
import { api } from '../api';

const PIE_COLORS = ['#16A34A', '#EA580C', '#DC2626'];

export default function AnalyticsPage() {
  const [filters, setFilters] = useState({
    start_date: '',
    end_date: '',
    risk_level: 'ALL',
    employment_type: 'ALL',
    min_amount: '',
    max_amount: '',
  });
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = () => {
    setLoading(true);
    api
      .getAnalytics(filters)
      .then((res) => setData(res))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAnalytics();
  }, [filters]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Fraud Analytics</h1>
        <p className="text-sm text-slate-500 mt-1">
          Interactive multi-dimensional fraud pattern analysis across employment, loan size, and income consistency.
        </p>
      </div>

      {/* Filters Bar */}
      <div className="card-surface p-5">
        <div className="flex items-center gap-2 mb-3 text-sm font-bold text-slate-800">
          <Filter className="w-4 h-4 text-blue-600" />
          <span>Interactive Filters</span>
          {data && (
            <span className="ml-auto text-xs font-medium text-slate-500">
              Matched Applications: {data.total_matched}
            </span>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Start Date</label>
            <input
              type="date"
              value={filters.start_date}
              onChange={(e) => setFilters((p) => ({ ...p, start_date: e.target.value }))}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">End Date</label>
            <input
              type="date"
              value={filters.end_date}
              onChange={(e) => setFilters((p) => ({ ...p, end_date: e.target.value }))}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Risk Level</label>
            <select
              value={filters.risk_level}
              onChange={(e) => setFilters((p) => ({ ...p, risk_level: e.target.value }))}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
            >
              <option value="ALL">All Risk Levels</option>
              <option value="LOW">Low Risk</option>
              <option value="MEDIUM">Medium Risk</option>
              <option value="HIGH">High Risk</option>
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Employment Type</label>
            <select
              value={filters.employment_type}
              onChange={(e) => setFilters((p) => ({ ...p, employment_type: e.target.value }))}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
            >
              <option value="ALL">All Employment Types</option>
              <option value="Salaried">Salaried</option>
              <option value="Self-Employed">Self-Employed</option>
              <option value="Business Owner">Business Owner</option>
              <option value="Contract">Contract</option>
              <option value="Unemployed">Unemployed</option>
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Min Loan ($)</label>
            <input
              type="number"
              placeholder="0"
              value={filters.min_amount}
              onChange={(e) => setFilters((p) => ({ ...p, min_amount: e.target.value }))}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Max Loan ($)</label>
            <input
              type="number"
              placeholder="500000"
              value={filters.max_amount}
              onChange={(e) => setFilters((p) => ({ ...p, max_amount: e.target.value }))}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
            />
          </div>
        </div>
      </div>

      {loading || !data ? (
        <div className="card-surface p-8 text-sm text-slate-500">Updating analytics charts...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="card-surface p-5">
            <h3 className="text-sm font-bold text-slate-900">Fraud Patterns by Employment Type</h3>
            <p className="text-xs text-slate-500 mb-3">Average risk score &amp; high-risk count</p>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.by_employment}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="employment_type" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="avg_score" name="Avg Risk Score" fill="#3B82F6" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="high_risk" name="High Risk Count" fill="#EF4444" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card-surface p-5">
            <h3 className="text-sm font-bold text-slate-900">Fraud Patterns by Loan Amount</h3>
            <p className="text-xs text-slate-500 mb-3">Average fraud score across loan size brackets</p>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.by_loan_amount}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="bracket" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="avg_score" name="Avg Risk Score" fill="#06B6D4" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card-surface p-5">
            <h3 className="text-sm font-bold text-slate-900">Income Inconsistency Analysis</h3>
            <p className="text-xs text-slate-500 mb-3">
              Income discrepancy (%) vs. predicted fraud risk score
            </p>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis type="number" dataKey="discrepancy_pct" name="Income Diff %" unit="%" tick={{ fontSize: 11 }} />
                  <YAxis type="number" dataKey="fraud_score" name="Fraud Score" domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                  <Scatter name="Applications" data={data.income_inconsistency} fill="#8B5CF6" />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card-surface p-5">
            <h3 className="text-sm font-bold text-slate-900">Employment Inconsistency Analysis</h3>
            <p className="text-xs text-slate-500 mb-3">Verification &amp; tenure plausibility breakdown</p>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.employment_inconsistency}
                    dataKey="count"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={80}
                    paddingAngle={4}
                  >
                    {data.employment_inconsistency.map((entry, idx) => (
                      <Cell key={entry.category} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card-surface p-5">
            <h3 className="text-sm font-bold text-slate-900">Fraud Distribution by Loan Purpose</h3>
            <p className="text-xs text-slate-500 mb-3">Total vs. high-risk applications by purpose</p>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.by_purpose}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="purpose" tick={{ fontSize: 10 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" name="Total" fill="#6366F1" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="flagged" name="High Risk" fill="#EF4444" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card-surface p-5">
            <h3 className="text-sm font-bold text-slate-900">Monthly Fraud Trends</h3>
            <p className="text-xs text-slate-500 mb-3">Monthly volume of high &amp; medium risk alerts</p>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.monthly_trends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="high_risk" name="High Risk" stroke="#DC2626" strokeWidth={2.5} />
                  <Line type="monotone" dataKey="medium_risk" name="Medium Risk" stroke="#EA580C" strokeWidth={2.5} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
