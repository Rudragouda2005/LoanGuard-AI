import React from 'react';
import {
  LayoutDashboard,
  FileSearch,
  FolderKanban,
  BarChart3,
  FileText,
  Gauge,
  Scale,
  Settings,
  ShieldCheck,
  Home,
  Menu,
  X,
} from 'lucide-react';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'analyze', label: 'Analyze Application', icon: FileSearch },
  { id: 'applications', label: 'Applications', icon: FolderKanban },
  { id: 'analytics', label: 'Fraud Analytics', icon: BarChart3 },
  { id: 'reports', label: 'Risk Reports', icon: FileText },
  { id: 'performance', label: 'Model Performance', icon: Gauge },
  { id: 'fairness', label: 'Fairness & Bias', icon: Scale },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export default function Sidebar({ activePage, onNavigate, mobileOpen, setMobileOpen, reviewerAuthorized }) {
  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-[#0B1220] border-r border-slate-800/80 text-slate-200 flex flex-col transition-transform duration-200 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="h-16 px-5 flex items-center justify-between border-b border-slate-800/80">
          <button
            onClick={() => {
              onNavigate('landing');
              setMobileOpen(false);
            }}
            className="flex items-center gap-2.5 text-left group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 via-cyan-400 to-purple-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-sm font-bold text-white tracking-tight group-hover:text-cyan-300 transition-colors">
                LoanGuard AI
              </div>
              <div className="text-[11px] text-slate-400">Fraud Intelligence</div>
            </div>
          </button>
          <button
            className="lg:hidden text-slate-400 hover:text-white"
            onClick={() => setMobileOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onNavigate(item.id);
                  setMobileOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-600/90 to-cyan-600/80 text-white shadow-md shadow-blue-900/30'
                    : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-200' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800/80 space-y-3">
          <div className="px-3 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800">
            <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
              Reviewer Access
            </div>
            <div className="mt-1 flex items-center gap-2 text-xs font-medium">
              <span
                className={`w-2 h-2 rounded-full ${
                  reviewerAuthorized ? 'bg-emerald-400' : 'bg-amber-400'
                }`}
              />
              <span className={reviewerAuthorized ? 'text-emerald-300' : 'text-amber-300'}>
                {reviewerAuthorized ? 'Authorized Underwriter' : 'Standard Analyst'}
              </span>
            </div>
          </div>

          <button
            onClick={() => {
              onNavigate('landing');
              setMobileOpen(false);
            }}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-slate-300 bg-slate-800/60 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Back to Home</span>
          </button>
        </div>
      </aside>
    </>
  );
}
