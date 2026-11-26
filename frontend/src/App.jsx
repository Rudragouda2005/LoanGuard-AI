import React, { Suspense, lazy, useState } from 'react';
import { Menu, ShieldCheck } from 'lucide-react';
import Sidebar from './components/Sidebar';
import LandingPage from './pages/LandingPage';
import { api } from './api';

const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const AnalyzePage = lazy(() => import('./pages/AnalyzePage'));
const ResultsPage = lazy(() => import('./pages/ResultsPage'));
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage'));
const ApplicationsPage = lazy(() => import('./pages/ApplicationsPage'));
const ReportsPage = lazy(() => import('./pages/ReportsPage'));
const ModelPerformancePage = lazy(() => import('./pages/ModelPerformancePage'));
const FairnessPage = lazy(() => import('./pages/FairnessPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));

export default function App() {
  const [activePage, setActivePage] = useState('landing');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [explainAppId, setExplainAppId] = useState('');
  const [scrollToExplain, setScrollToExplain] = useState(false);
  const [reviewerToken, setReviewerToken] = useState('');
  const [reviewerAuthorized, setReviewerAuthorized] = useState(false);

  const handleSelectApplication = async (applicationId) => {
    try {
      const detail = await api.getApplicationDetail(applicationId);
      setSelectedApplication(detail);
      setExplainAppId(applicationId);
      setActivePage('results');
    } catch {
      setActivePage('applications');
    }
  };

  const handleAnalysisComplete = (result) => {
    setSelectedApplication(result);
    setExplainAppId(result.application_id);
    setActivePage('results');
  };

  const handleViewExplainability = (applicationId) => {
    setExplainAppId(applicationId);
    setScrollToExplain(true);
    setActivePage('analyze');
  };

  if (activePage === 'landing') {
    return <LandingPage onNavigate={setActivePage} />;
  }

  return (
    <div className="min-h-screen bg-[#0B1220] flex">
      <Sidebar
        activePage={activePage}
        onNavigate={setActivePage}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        reviewerAuthorized={reviewerAuthorized}
      />

      <div className="flex-1 flex flex-col min-w-0 bg-slate-100">
        {/* Mobile Header */}
        <header className="lg:hidden h-14 px-4 bg-[#0B1220] text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-cyan-400" />
            <span className="font-bold text-sm">LoanGuard AI</span>
          </div>
          <button onClick={() => setMobileOpen(true)} className="p-2 text-slate-300">
            <Menu className="w-5 h-5" />
          </button>
        </header>

        <main className="flex-1 p-5 sm:p-7 lg:p-8 overflow-y-auto">
          <Suspense
            fallback={
              <div className="card-surface p-8 text-sm text-slate-500">Loading view...</div>
            }
          >
            {activePage === 'dashboard' && (
              <DashboardPage
                onNavigate={setActivePage}
                onSelectApplication={handleSelectApplication}
              />
            )}
            {activePage === 'analyze' && (
              <AnalyzePage
                onAnalysisComplete={handleAnalysisComplete}
                selectedAppId={explainAppId}
                scrollToExplain={scrollToExplain}
                onScrolledToExplain={() => setScrollToExplain(false)}
              />
            )}
            {activePage === 'results' && (
              <ResultsPage
                application={selectedApplication}
                onNavigate={setActivePage}
                onViewExplainability={handleViewExplainability}
              />
            )}
            {activePage === 'analytics' && <AnalyticsPage />}
            {activePage === 'applications' && (
              <ApplicationsPage
                onSelectApplication={handleSelectApplication}
                reviewerToken={reviewerToken}
                reviewerAuthorized={reviewerAuthorized}
                onNavigate={setActivePage}
              />
            )}
            {activePage === 'reports' && (
              <ReportsPage onSelectApplication={handleSelectApplication} />
            )}
            {activePage === 'performance' && <ModelPerformancePage />}
            {activePage === 'fairness' && <FairnessPage />}
            {activePage === 'settings' && (
              <SettingsPage
                reviewerToken={reviewerToken}
                setReviewerToken={setReviewerToken}
                reviewerAuthorized={reviewerAuthorized}
                setReviewerAuthorized={setReviewerAuthorized}
              />
            )}
          </Suspense>
        </main>
      </div>
    </div>
  );
}
