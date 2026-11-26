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
import { Award, CheckCircle2 } from 'lucide-react';
import { api } from '../api';

export default function ModelPerformancePage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getModelPerformance()
      .then((res) => setData(res))
      .finally(() => setLoading(false));
  }, []);

  if (loading || !data) {
    return <div className="card-surface p-8 text-sm text-slate-500">Loading model metrics...</div>;
  }

  const chartData = data.models.map((m) => ({
    name: m.model_name,
    Accuracy: Number((m.accuracy * 100).toFixed(1)),
    Precision: Number((m.precision * 100).toFixed(1)),
    Recall: Number((m.recall * 100).toFixed(1)),
    'F1 Score': Number((m.f1_score * 100).toFixed(1)),
    'ROC-AUC': Number((m.roc_auc * 100).toFixed(1)),
  }));

  const bestObj = data.models.find((m) => m.model_name === data.best_model) || data.models[0];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Model Performance &amp; Validation</h1>
        <p className="text-sm text-slate-500 mt-1">
          Comparison of Logistic Regression, Random Forest, and XGBoost on held-out validation data—prioritizing fraud recall and low false-positive rates.
        </p>
      </div>

      {/* Selected Best Model Banner */}
      <div className="card-surface p-5 bg-gradient-to-r from-blue-600 to-cyan-600 text-white border-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-white/15 flex items-center justify-center">
            <Award className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider text-cyan-100 font-semibold">
              Production Selected Model
            </div>
            <div className="text-xl font-bold">{data.best_model}</div>
          </div>
        </div>
        <div className="flex flex-wrap gap-6 text-sm">
          <div>
            <div className="text-cyan-100 text-xs">Fraud Recall</div>
            <div className="font-bold text-lg">{(bestObj.recall * 100).toFixed(1)}%</div>
          </div>
          <div>
            <div className="text-cyan-100 text-xs">ROC-AUC</div>
            <div className="font-bold text-lg">{(bestObj.roc_auc * 100).toFixed(1)}%</div>
          </div>
          <div>
            <div className="text-cyan-100 text-xs">False Positive Rate</div>
            <div className="font-bold text-lg">{(bestObj.false_positive_rate * 100).toFixed(1)}%</div>
          </div>
        </div>
      </div>

      {/* Comparison Table */}
      <div className="card-surface p-5 overflow-x-auto">
        <h3 className="text-base font-bold text-slate-900 mb-3">Model Evaluation Benchmark</h3>
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-xs uppercase text-slate-500">
              <th className="py-2.5 pr-4">Model</th>
              <th className="py-2.5 pr-4">Accuracy</th>
              <th className="py-2.5 pr-4">Precision</th>
              <th className="py-2.5 pr-4">Recall</th>
              <th className="py-2.5 pr-4">F1 Score</th>
              <th className="py-2.5 pr-4">ROC-AUC</th>
              <th className="py-2.5 pr-4">FPR</th>
              <th className="py-2.5">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.models.map((m) => (
              <tr key={m.model_name} className="hover:bg-slate-50">
                <td className="py-3 pr-4 font-bold text-slate-900">{m.model_name}</td>
                <td className="py-3 pr-4">{(m.accuracy * 100).toFixed(2)}%</td>
                <td className="py-3 pr-4">{(m.precision * 100).toFixed(2)}%</td>
                <td className="py-3 pr-4 font-semibold text-blue-600">{(m.recall * 100).toFixed(2)}%</td>
                <td className="py-3 pr-4">{(m.f1_score * 100).toFixed(2)}%</td>
                <td className="py-3 pr-4">{(m.roc_auc * 100).toFixed(2)}%</td>
                <td className="py-3 pr-4">{(m.false_positive_rate * 100).toFixed(2)}%</td>
                <td className="py-3">
                  {m.model_name === data.best_model ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Selected
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400">Benchmark</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Bar Chart & Confusion Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-7 card-surface p-5">
          <h3 className="text-sm font-bold text-slate-900">Metric Comparison (%)</h3>
          <p className="text-xs text-slate-500 mb-3">
            Test set ({data.dataset_summary.test_size} applications)
          </p>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="Accuracy" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Recall" fill="#06B6D4" radius={[4, 4, 0, 0]} />
                <Bar dataKey="ROC-AUC" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-5 card-surface p-5">
          <h3 className="text-sm font-bold text-slate-900">
            Confusion Matrix ({data.best_model})
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            True vs. Predicted outcomes on held-out validation split
          </p>
          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
              <div className="text-xs font-semibold text-emerald-700">True Negative (Legit)</div>
              <div className="text-3xl font-extrabold text-emerald-900 mt-1">
                {bestObj.confusion_matrix.tn}
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-orange-50 border border-orange-200">
              <div className="text-xs font-semibold text-orange-700">False Positive</div>
              <div className="text-3xl font-extrabold text-orange-900 mt-1">
                {bestObj.confusion_matrix.fp}
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-red-50 border border-red-200">
              <div className="text-xs font-semibold text-red-700">False Negative</div>
              <div className="text-3xl font-extrabold text-red-900 mt-1">
                {bestObj.confusion_matrix.fn}
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200">
              <div className="text-xs font-semibold text-blue-700">True Positive (Fraud)</div>
              <div className="text-3xl font-extrabold text-blue-900 mt-1">
                {bestObj.confusion_matrix.tp}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
