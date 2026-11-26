import React from 'react';
import {
  ShieldCheck,
  ArrowRight,
  BrainCircuit,
  FileCheck2,
  Scale,
  Activity,
  Lock,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';

export default function LandingPage({ onNavigate }) {
  const features = [
    {
      icon: BrainCircuit,
      title: 'ML Fraud Scoring Engine',
      desc: 'Compares Logistic Regression, Random Forest, and XGBoost on engineered income, debt, and verification signals.',
      accent: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    },
    {
      icon: FileCheck2,
      title: 'Intelligent Consistency Engine',
      desc: 'Independently audits monthly vs. declared annual income, loan-to-income ratios, employment plausibility, and document status.',
      accent: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
    },
    {
      icon: Sparkles,
      title: 'SHAP Underwriter Explainability',
      desc: 'Translates mathematical SHAP feature contributions into plain-English explanations for every flagged application.',
      accent: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
    },
    {
      icon: Scale,
      title: 'Fairness & Bias Auditing',
      desc: 'Excludes protected attributes from model inference and monitors false-positive rate parity across demographic groups.',
      accent: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    },
  ];

  return (
    <div className="min-h-screen bg-[#0B1220] text-white">
      {/* Top Navbar */}
      <header className="border-b border-slate-800/80 bg-[#0B1220]/90 backdrop-blur sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 via-cyan-400 to-purple-500 flex items-center justify-center shadow-lg shadow-blue-500/25">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight">LoanGuard AI</span>
              <span className="hidden sm:inline-block ml-2.5 text-xs px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                AVISHKAR&apos;26
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate('dashboard')}
              className="px-4 py-2 rounded-xl text-sm font-medium text-slate-200 hover:text-white hover:bg-slate-800/80 transition-colors"
            >
              Explore Dashboard
            </button>
            <button
              onClick={() => onNavigate('analyze')}
              className="px-4 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white shadow-lg shadow-blue-600/25 transition-all"
            >
              Get Started
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-600/20 via-purple-600/10 to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto px-6 py-16 lg:py-24 grid lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-800/80 border border-slate-700 text-xs font-medium text-cyan-300">
              <Lock className="w-3.5 h-3.5" />
              <span>Explainable AI for Financial Risk &amp; Fraud Prevention</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1]">
              Detect Fraud.{' '}
              <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                Protect Finance.
              </span>{' '}
              Build Trust.
            </h1>

            <p className="text-lg text-slate-300 max-w-2xl leading-relaxed">
              LoanGuard AI empowers bank underwriters and risk teams to detect fabricated income,
              inconsistent employment declarations, and high-risk loan patterns in real time—complete
              with SHAP explanations, consistency audits, and downloadable PDF risk reports.
            </p>

            <div className="flex flex-wrap gap-4 pt-2">
              <button
                onClick={() => onNavigate('analyze')}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-semibold bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white shadow-xl shadow-blue-600/25 transition-all"
              >
                <span>Get Started</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => onNavigate('dashboard')}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-semibold bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-slate-100 transition-all"
              >
                <Activity className="w-4 h-4 text-cyan-400" />
                <span>Explore Dashboard</span>
              </button>
            </div>

            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-800/80">
              <div>
                <div className="text-2xl font-bold text-white">&lt; 150ms</div>
                <div className="text-xs text-slate-400 mt-0.5">Real-time Risk Scoring</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-cyan-400">100%</div>
                <div className="text-xs text-slate-400 mt-0.5">SHAP Explainable Decisions</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-400">Zero</div>
                <div className="text-xs text-slate-400 mt-0.5">Protected Attributes Used</div>
              </div>
            </div>
          </div>

          {/* Cybersecurity Illustration Card */}
          <div className="lg:col-span-5">
            <div className="relative rounded-3xl bg-gradient-to-b from-slate-800/90 to-slate-900/95 border border-slate-700/80 p-6 shadow-2xl">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-amber-400" />
                  <div className="w-3 h-3 rounded-full bg-emerald-400" />
                </div>
                <span className="text-xs font-medium text-cyan-300 bg-cyan-500/10 px-2.5 py-1 rounded-full border border-cyan-500/20">
                  Live Threat Telemetry
                </span>
              </div>

              <div className="mt-5 space-y-4">
                <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="text-xs text-slate-400">Sample Verification Check</div>
                    <div className="text-sm font-semibold text-white mt-0.5">
                      Income &amp; Employment Cross-Audit
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    ACTIVE
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
                    <div className="text-xs text-slate-400">Risk Thresholds</div>
                    <div className="mt-2 space-y-1.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-emerald-400 font-medium">0–30</span>
                        <span className="text-slate-300">Low Risk</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-orange-400 font-medium">31–60</span>
                        <span className="text-slate-300">Medium Risk</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-red-400 font-medium">61–100</span>
                        <span className="text-slate-300">High Risk</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-col justify-between">
                    <div className="text-xs text-slate-400">Explainability</div>
                    <div className="mt-2 space-y-1.5">
                      <div className="flex items-center gap-1.5 text-xs text-slate-200">
                        <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                        <span>SHAP Attribution</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-200">
                        <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Rule Consistency</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-200">
                        <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                        <span>PDF Audit Report</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-600/20 via-cyan-500/15 to-purple-600/20 border border-blue-500/30">
                  <div className="text-xs font-semibold text-cyan-300">Underwriter Assurance</div>
                  <div className="text-xs text-slate-300 mt-1 leading-relaxed">
                    High-risk flags guide human investigation rather than automatic rejection, ensuring fair and transparent lending decisions.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="max-w-7xl mx-auto px-6 pb-20">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all"
              >
                <div className={`w-11 h-11 rounded-xl border flex items-center justify-center ${f.accent}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="mt-4 font-semibold text-white">{f.title}</h3>
                <p className="mt-2 text-sm text-slate-400 leading-relaxed">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
