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
} from 'recharts';
import { Scale, ShieldCheck, AlertCircle } from 'lucide-react';
import { api } from '../api';

export default function FairnessPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getFairness()
      .then((res) => setData(res))
      .finally(() => setLoading(false));
  }, []);

  if (loading || !data) {
    return <div className="card-surface p-8 text-sm text-slate-500">Loading fairness audit...</div>;
  }

  const genderChart = data.gender_metrics.map((g) => ({
    group: g.group,
    'False Positive Rate (%)': Number((g.false_positive_rate * 100).toFixed(2)),
    'True Positive Rate (%)': Number((g.true_positive_rate * 100).toFixed(2)),
  }));

  const ageChart = data.age_group_metrics.map((a) => ({
    group: a.group,
    'False Positive Rate (%)': Number((a.false_positive_rate * 100).toFixed(2)),
    'Flagged Rate (%)': Number((a.flagged_rate * 100).toFixed(2)),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Fairness &amp; Bias Auditing</h1>
        <p className="text-sm text-slate-500 mt-1">
          Monitoring demographic parity, false-positive rate equality, and responsible AI safeguards.
        </p>
      </div>

      {/* Policy Banner */}
      <div className="card-surface p-5 bg-emerald-50/70 border-emerald-200 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
        <div className="text-sm text-emerald-950">
          <div className="font-bold">Protected Attributes Excluded from Inference</div>
          <p className="text-xs text-emerald-800 mt-1 leading-relaxed">
            {data.demographic_parity_note} Excluded fields:{' '}
            <strong>{data.protected_attributes_excluded.join(', ')}</strong>. Validation FPR gap across gender groups:{' '}
            <strong>{(data.gender_fpr_gap * 100).toFixed(2)}%</strong>.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="card-surface p-5">
          <h3 className="text-sm font-bold text-slate-900">
            False-Positive &amp; True-Positive Rates by Gender (Validation Audit)
          </h3>
          <p className="text-xs text-slate-500 mb-3">
            Audited on held-out records without using gender in model features
          </p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={genderChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="group" tick={{ fontSize: 12 }} />
                <YAxis unit="%" tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="False Positive Rate (%)" fill="#EA580C" radius={[6, 6, 0, 0]} />
                <Bar dataKey="True Positive Rate (%)" fill="#2563EB" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card-surface p-5">
          <h3 className="text-sm font-bold text-slate-900">
            False-Positive &amp; Flagged Rates by Age Group
          </h3>
          <p className="text-xs text-slate-500 mb-3">
            Ensuring consistent error rates across applicant age brackets
          </p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ageChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="group" tick={{ fontSize: 12 }} />
                <YAxis unit="%" tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="False Positive Rate (%)" fill="#DC2626" radius={[6, 6, 0, 0]} />
                <Bar dataKey="Flagged Rate (%)" fill="#8B5CF6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Model Limitations & Human-in-the-loop */}
      <div className="card-surface p-6">
        <div className="flex items-center gap-2 mb-3">
          <Scale className="w-5 h-5 text-purple-600" />
          <h3 className="text-base font-bold text-slate-900">
            Model Limitations &amp; Human-in-the-Loop Governance
          </h3>
        </div>
        <ul className="space-y-2.5">
          {data.model_limitations.map((lim) => (
            <li
              key={lim}
              className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-2.5 text-sm text-slate-700"
            >
              <AlertCircle className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
              <span>{lim}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
