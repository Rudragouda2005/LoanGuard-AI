import React from 'react';

export default function RiskGauge({ score = 0, riskLevel = 'LOW' }) {
  const clamped = Math.max(0, Math.min(100, Number(score) || 0));
  const radius = 84;
  const circumference = Math.PI * radius;
  const strokeDashoffset = circumference - (clamped / 100) * circumference;

  const colorMap = {
    LOW: '#16A34A',
    MEDIUM: '#EA580C',
    HIGH: '#DC2626',
  };
  const strokeColor = colorMap[riskLevel] || '#2563EB';

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative w-56 h-32 flex items-end justify-center">
        <svg viewBox="0 0 200 115" className="w-full h-full overflow-visible">
          <path
            d="M 16 100 A 84 84 0 0 1 184 100"
            fill="none"
            stroke="#E2E8F0"
            strokeWidth="16"
            strokeLinecap="round"
          />
          <path
            d="M 16 100 A 84 84 0 0 1 184 100"
            fill="none"
            stroke={strokeColor}
            strokeWidth="16"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-700 ease-out"
          />
        </svg>
        <div className="absolute bottom-1 text-center">
          <div className="text-4xl font-extrabold text-slate-900 leading-none">
            {clamped.toFixed(0)}
            <span className="text-lg font-semibold text-slate-400">/100</span>
          </div>
          <div
            className="mt-1 text-xs font-bold tracking-wider uppercase"
            style={{ color: strokeColor }}
          >
            {riskLevel} RISK
          </div>
        </div>
      </div>
      <div className="w-56 flex justify-between text-[11px] font-medium text-slate-400 mt-1 px-1">
        <span>0 (Safe)</span>
        <span>30</span>
        <span>60</span>
        <span>100 (High)</span>
      </div>
    </div>
  );
}
