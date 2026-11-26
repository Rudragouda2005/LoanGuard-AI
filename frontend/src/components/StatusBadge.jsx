import React from 'react';

export function RiskBadge({ level }) {
  const styles = {
    LOW: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    MEDIUM: 'bg-orange-50 text-orange-700 border-orange-200',
    HIGH: 'bg-red-50 text-red-700 border-red-200',
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
        styles[level] || 'bg-slate-100 text-slate-700 border-slate-200'
      }`}
    >
      {level} RISK
    </span>
  );
}

export function InvestigationBadge({ status }) {
  const styles = {
    'Pending Review': 'bg-slate-100 text-slate-700 border-slate-200',
    'Under Investigation': 'bg-amber-50 text-amber-700 border-amber-200',
    'Verified Legitimate': 'bg-emerald-50 text-emerald-700 border-emerald-200',
    'Confirmed Fraud': 'bg-red-50 text-red-700 border-red-200',
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
        styles[status] || 'bg-slate-100 text-slate-700 border-slate-200'
      }`}
    >
      {status}
    </span>
  );
}

export function CheckStatusBadge({ status }) {
  const styles = {
    PASS: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    WARNING: 'bg-orange-50 text-orange-700 border-orange-200',
    FLAG: 'bg-red-50 text-red-700 border-red-200',
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold border ${
        styles[status] || 'bg-slate-100 text-slate-700 border-slate-200'
      }`}
    >
      {status}
    </span>
  );
}
