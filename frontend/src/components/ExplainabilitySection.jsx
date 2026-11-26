import React, { useEffect, useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  ReferenceLine,
} from 'recharts';
import { BrainCircuit, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { api } from '../api';
import { RiskBadge } from './StatusBadge';

export default function ExplainabilitySection({ selectedAppId }) {
  const [apps, setApps] = useState([]);
  const [activeId, setActiveId] = useState(selectedAppId || '');
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getApplications().then((list) => {
      setApps(list);
      if (!activeId && list.length > 0) {
        setActiveId(list[0].application_id);
      }
    });
  }, []);

  useEffect(() => {
    if (selectedAppId) {
      setActiveId(selectedAppId);
    }
  }, [selectedAppId]);

  useEffect(() => {
    if (!activeId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    api
      .getApplicationDetail(activeId)
      .then((res) => setDetail(res))
      .finally(() => setLoading(false));
  }, [activeId]);

  const explanations = detail?.explanations || [];
  const top5 = explanations.slice(0, 5);
  const barData = explanations.slice(0, 10).map((e) => ({
    feature: e.feature_name,
    shap: Number(e.shap_value),
  }));

  let running = 0;
  const waterfallData = explanations.slice(0, 8).map((e) => {
    const val = Number(e.shap_value);
    const prev = running;
    running += val;
    const low = Math.min(prev, running);
    const high = Math.max(prev, running);
    return {
      feature: e.feature_name,
      offset: Number(low.toFixed(4)),
      delta: Number((high - low).toFixed(4)),
      rawImpact: Number(val.toFixed(4)),
      cumulative: Number(running.toFixed(4)),
    };
  });

  return (
    <section id="ai-explainability-section" className="space-y-6 pt-6 border-t border-slate-200">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">AI Explainability (SHAP)</h2>
          <p className="text-sm text-slate-500 mt-1">
            Understand exactly which features increased or decreased the model&apos;s fraud risk score.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-600">Application:</label>
          <select
            value={activeId}
            onChange={(e) => setActiveId(e.target.value)}
            className="px-3.5 py-2 rounded-xl border border-slate-300 text-sm bg-white font-medium text-slate-800"
          >
            {apps.map((a) => (
              <option key={a.application_id} value={a.application_id}>
                {a.application_id} — {a.applicant_name} ({a.fraud_score}/100)
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading || !detail ? (
        <div className="card-surface p-8 text-sm text-slate-500">Loading SHAP explanations...</div>
      ) : (
        <>
          {/* Summary Banner */}
          <div className="card-surface p-5 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <BrainCircuit className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-900">
                  {detail.application_id} · {detail.applicant_name}
                </div>
                <div className="text-xs text-slate-500">
                  Prediction: {detail.prediction} · Risk Score: {detail.fraud_score}/100
                </div>
              </div>
            </div>
            <RiskBadge level={detail.risk_level} />
          </div>

          {/* Top 5 Risk-Contributing Features */}
          <div className="card-surface p-6">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Top 5 Risk-Contributing Features (Plain-English Summary)
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Positive SHAP values push the risk score higher; negative values reduce predicted risk.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {top5.map((item) => {
                const isPositive = item.shap_value > 0;
                return (
                  <div
                    key={item.feature_name}
                    className={`p-4 rounded-xl border ${
                      isPositive
                        ? 'bg-red-50/60 border-red-200'
                        : 'bg-emerald-50/60 border-emerald-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-slate-900">{item.feature_name}</span>
                      <span
                        className={`inline-flex items-center gap-1 text-xs font-bold ${
                          isPositive ? 'text-red-600' : 'text-emerald-700'
                        }`}
                      >
                        {isPositive ? (
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        ) : (
                          <ArrowDownRight className="w-3.5 h-3.5" />
                        )}
                        {item.shap_value > 0 ? '+' : ''}
                        {item.shap_value.toFixed(4)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 mt-1.5 leading-relaxed">
                      {item.explanation}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Charts: Feature Impact Bar Chart + SHAP Waterfall Plot */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="card-surface p-5">
              <h3 className="text-sm font-bold text-slate-900">SHAP Feature Impact Bar Chart</h3>
              <p className="text-xs text-slate-500 mb-3">
                Direction and magnitude of each feature&apos;s contribution
              </p>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData} layout="vertical" margin={{ left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="feature" width={145} tick={{ fontSize: 11 }} />
                    <ReferenceLine x={0} stroke="#64748B" />
                    <Tooltip />
                    <Bar dataKey="shap" name="SHAP Value" radius={[0, 4, 4, 0]}>
                      {barData.map((entry) => (
                        <Cell
                          key={entry.feature}
                          fill={entry.shap >= 0 ? '#EF4444' : '#16A34A'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="card-surface p-5">
              <h3 className="text-sm font-bold text-slate-900">SHAP Waterfall Plot</h3>
              <p className="text-xs text-slate-500 mb-3">
                Step-by-step positive (red) and negative (green) shifts across top features
              </p>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={waterfallData} layout="vertical" margin={{ left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="feature" width={145} tick={{ fontSize: 11 }} />
                    <ReferenceLine x={0} stroke="#64748B" />
                    <Tooltip
                      formatter={(value, name, props) => {
                        if (name === 'offset') return [null, null];
                        const p = props?.payload;
                        return [
                          `${p.rawImpact >= 0 ? '+' : ''}${p.rawImpact} (Cumulative: ${p.cumulative >= 0 ? '+' : ''}${p.cumulative})`,
                          'SHAP Shift',
                        ];
                      }}
                    />
                    <Bar dataKey="offset" stackId="wf" fill="transparent" />
                    <Bar dataKey="delta" stackId="wf" name="SHAP Shift" radius={[4, 4, 4, 4]}>
                      {waterfallData.map((entry) => (
                        <Cell
                          key={entry.feature}
                          fill={entry.rawImpact >= 0 ? '#EF4444' : '#16A34A'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
