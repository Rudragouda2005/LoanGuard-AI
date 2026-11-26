import React, { useEffect, useState } from 'react';
import { Sparkles, RotateCcw, ShieldAlert, PlayCircle, AlertCircle } from 'lucide-react';
import { api } from '../api';
import ExplainabilitySection from '../components/ExplainabilitySection';

const INITIAL_FORM = {
  application_id: '',
  applicant_name: '',
  age: 32,
  gender: 'Prefer not to say',
  marital_status: 'Single',
  education: 'Graduate',
  dependents: 0,
  employment_type: 'Salaried',
  employer_name: '',
  years_of_employment: 3.5,
  monthly_income: 6000,
  employment_verification: 'Verified',
  loan_amount: 30000,
  loan_purpose: 'Home Improvement',
  loan_term: 36,
  existing_debt: 5000,
  credit_history: 1,
  declared_annual_income: 72000,
  bank_verification: 'Verified',
  previous_loan_history: 'Good Standing',
  document_verification: 'Verified',
  declared_employment_info: '',
  notes: '',
  is_demo: false,
};

export default function AnalyzePage({ onAnalysisComplete, selectedAppId, scrollToExplain, onScrolledToExplain }) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [demos, setDemos] = useState([]);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState('');

  useEffect(() => {
    api
      .getDemoPresets()
      .then((list) => setDemos(list))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (scrollToExplain) {
      const el = document.getElementById('ai-explainability-section');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      if (onScrolledToExplain) onScrolledToExplain();
    }
  }, [scrollToExplain, onScrolledToExplain]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const loadDemo = (preset) => {
    setForm({
      ...INITIAL_FORM,
      ...preset.data,
      application_id: `${preset.data.application_id}-${Math.floor(100 + Math.random() * 899)}`,
    });
    setErrors({});
    setApiError('');
  };

  const loadSample = () => {
    if (demos.length > 0) {
      loadDemo(demos[0]);
    }
  };

  const validate = () => {
    const errs = {};
    if (!form.applicant_name.trim() || form.applicant_name.trim().length < 2) {
      errs.applicant_name = 'Please enter the applicant full name (at least 2 characters).';
    }
    if (Number(form.age) < 18 || Number(form.age) > 100) {
      errs.age = 'Age must be between 18 and 100.';
    }
    if (Number(form.monthly_income) <= 0) {
      errs.monthly_income = 'Monthly income must be greater than 0.';
    }
    if (Number(form.declared_annual_income) <= 0) {
      errs.declared_annual_income = 'Declared annual income must be greater than 0.';
    }
    if (Number(form.loan_amount) <= 0) {
      errs.loan_amount = 'Loan amount must be greater than 0.';
    }
    if (Number(form.years_of_employment) < 0) {
      errs.years_of_employment = 'Years of employment cannot be negative.';
    }
    if (Number(form.existing_debt) < 0) {
      errs.existing_debt = 'Existing debt cannot be negative.';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');
    if (!validate()) return;

    setSubmitting(true);
    try {
      const payload = {
        ...form,
        age: Number(form.age),
        dependents: Number(form.dependents),
        years_of_employment: Number(form.years_of_employment),
        monthly_income: Number(form.monthly_income),
        loan_amount: Number(form.loan_amount),
        loan_term: Number(form.loan_term),
        existing_debt: Number(form.existing_debt),
        credit_history: Number(form.credit_history),
        declared_annual_income: Number(form.declared_annual_income),
      };
      const result = await api.analyzeApplication(payload);
      onAnalysisComplete(result);
    } catch (err) {
      setApiError(err.message || 'Analysis failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    'w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 bg-white';

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Analyze Loan Application</h1>
          <p className="text-sm text-slate-500 mt-1">
            Submit applicant details for real-time ML fraud scoring, SHAP attribution, and consistency auditing.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={loadSample}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Sample Application</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setForm(INITIAL_FORM);
              setErrors({});
              setApiError('');
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Live Demonstration Mode */}
      {demos.length > 0 && (
        <div className="card-surface p-4 bg-gradient-to-r from-slate-900 to-slate-800 text-white border-slate-700">
          <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
            <div className="flex items-center gap-2">
              <PlayCircle className="w-4 h-4 text-cyan-400" />
              <span className="text-sm font-bold">Live Demonstration Mode (Synthetic Demo Profiles)</span>
            </div>
            <span className="text-[11px] text-slate-300">
              Predictions are computed live by the trained ML model &amp; consistency engine
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {demos.map((d) => (
              <button
                key={d.preset_id}
                type="button"
                onClick={() => loadDemo(d)}
                className="text-left p-3 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700 transition-all"
              >
                <div className="text-xs font-bold text-cyan-300">{d.label}</div>
                <div className="text-[11px] text-slate-300 mt-1">{d.description}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {apiError && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{apiError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* SECTION 1: PERSONAL DETAILS */}
        <div className="card-surface p-6">
          <h2 className="text-base font-bold text-slate-900 mb-1">Section 1: Personal Details</h2>
          <p className="text-xs text-slate-500 mb-4">
            Protected attributes such as gender and marital status are never used as ML prediction features.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Applicant Name *</label>
              <input
                type="text"
                className={inputClass}
                value={form.applicant_name}
                onChange={(e) => handleChange('applicant_name', e.target.value)}
                placeholder="e.g., Elena Rostova"
              />
              {errors.applicant_name && (
                <p className="text-xs text-red-600 mt-1">{errors.applicant_name}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Age *</label>
              <input
                type="number"
                className={inputClass}
                value={form.age}
                onChange={(e) => handleChange('age', e.target.value)}
              />
              {errors.age && <p className="text-xs text-red-600 mt-1">{errors.age}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Gender (Optional — Never Used in ML)
              </label>
              <select
                className={inputClass}
                value={form.gender}
                onChange={(e) => handleChange('gender', e.target.value)}
              >
                <option value="Prefer not to say">Prefer not to say</option>
                <option value="Female">Female</option>
                <option value="Male">Male</option>
                <option value="Non-Binary">Non-Binary</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Marital Status</label>
              <select
                className={inputClass}
                value={form.marital_status}
                onChange={(e) => handleChange('marital_status', e.target.value)}
              >
                <option value="Single">Single</option>
                <option value="Married">Married</option>
                <option value="Divorced">Divorced</option>
                <option value="Widowed">Widowed</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Education</label>
              <select
                className={inputClass}
                value={form.education}
                onChange={(e) => handleChange('education', e.target.value)}
              >
                <option value="High School">High School</option>
                <option value="Undergraduate">Undergraduate</option>
                <option value="Graduate">Graduate</option>
                <option value="Postgraduate">Postgraduate</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Number of Dependents</label>
              <input
                type="number"
                min={0}
                className={inputClass}
                value={form.dependents}
                onChange={(e) => handleChange('dependents', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* SECTION 2: EMPLOYMENT DETAILS */}
        <div className="card-surface p-6">
          <h2 className="text-base font-bold text-slate-900 mb-1">Section 2: Employment Details</h2>
          <p className="text-xs text-slate-500 mb-4">
            Cross-checked against applicant age, income declarations, and employer verification.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Employment Type</label>
              <select
                className={inputClass}
                value={form.employment_type}
                onChange={(e) => handleChange('employment_type', e.target.value)}
              >
                <option value="Salaried">Salaried</option>
                <option value="Self-Employed">Self-Employed</option>
                <option value="Business Owner">Business Owner</option>
                <option value="Contract">Contract</option>
                <option value="Unemployed">Unemployed</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Employer Name</label>
              <input
                type="text"
                className={inputClass}
                value={form.employer_name}
                onChange={(e) => handleChange('employer_name', e.target.value)}
                placeholder="e.g., Northstar FinTech Corp"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Years of Employment *</label>
              <input
                type="number"
                step="0.5"
                className={inputClass}
                value={form.years_of_employment}
                onChange={(e) => handleChange('years_of_employment', e.target.value)}
              />
              {errors.years_of_employment && (
                <p className="text-xs text-red-600 mt-1">{errors.years_of_employment}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Monthly Income (USD) *</label>
              <input
                type="number"
                className={inputClass}
                value={form.monthly_income}
                onChange={(e) => handleChange('monthly_income', e.target.value)}
              />
              {errors.monthly_income && (
                <p className="text-xs text-red-600 mt-1">{errors.monthly_income}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Employment Verification Status
              </label>
              <select
                className={inputClass}
                value={form.employment_verification}
                onChange={(e) => handleChange('employment_verification', e.target.value)}
              >
                <option value="Verified">Verified</option>
                <option value="Pending">Pending</option>
                <option value="Failed">Failed</option>
              </select>
            </div>
          </div>
        </div>

        {/* SECTION 3: FINANCIAL DETAILS */}
        <div className="card-surface p-6">
          <h2 className="text-base font-bold text-slate-900 mb-1">Section 3: Financial Details</h2>
          <p className="text-xs text-slate-500 mb-4">
            Used to evaluate loan-to-income ratio, debt burden, and declared income consistency.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Loan Amount (USD) *</label>
              <input
                type="number"
                className={inputClass}
                value={form.loan_amount}
                onChange={(e) => handleChange('loan_amount', e.target.value)}
              />
              {errors.loan_amount && (
                <p className="text-xs text-red-600 mt-1">{errors.loan_amount}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Loan Purpose</label>
              <select
                className={inputClass}
                value={form.loan_purpose}
                onChange={(e) => handleChange('loan_purpose', e.target.value)}
              >
                <option value="Home Improvement">Home Improvement</option>
                <option value="Debt Consolidation">Debt Consolidation</option>
                <option value="Business Expansion">Business Expansion</option>
                <option value="Education">Education</option>
                <option value="Auto">Auto</option>
                <option value="Personal">Personal</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Loan Term (Months)</label>
              <select
                className={inputClass}
                value={form.loan_term}
                onChange={(e) => handleChange('loan_term', e.target.value)}
              >
                <option value={12}>12 Months</option>
                <option value={24}>24 Months</option>
                <option value={36}>36 Months</option>
                <option value={48}>48 Months</option>
                <option value={60}>60 Months</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Existing Debt (USD)</label>
              <input
                type="number"
                className={inputClass}
                value={form.existing_debt}
                onChange={(e) => handleChange('existing_debt', e.target.value)}
              />
              {errors.existing_debt && (
                <p className="text-xs text-red-600 mt-1">{errors.existing_debt}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Credit History</label>
              <select
                className={inputClass}
                value={form.credit_history}
                onChange={(e) => handleChange('credit_history', e.target.value)}
              >
                <option value={1}>Meets Credit Guidelines (1)</option>
                <option value={0}>Adverse / Thin Credit File (0)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Declared Annual Income (USD) *
              </label>
              <input
                type="number"
                className={inputClass}
                value={form.declared_annual_income}
                onChange={(e) => handleChange('declared_annual_income', e.target.value)}
              />
              {errors.declared_annual_income && (
                <p className="text-xs text-red-600 mt-1">{errors.declared_annual_income}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Bank Account Verification Status
              </label>
              <select
                className={inputClass}
                value={form.bank_verification}
                onChange={(e) => handleChange('bank_verification', e.target.value)}
              >
                <option value="Verified">Verified</option>
                <option value="Pending">Pending</option>
                <option value="Failed">Failed</option>
              </select>
            </div>
          </div>
        </div>

        {/* SECTION 4: APPLICATION DETAILS */}
        <div className="card-surface p-6">
          <h2 className="text-base font-bold text-slate-900 mb-1">Section 4: Application Details</h2>
          <p className="text-xs text-slate-500 mb-4">
            Document verification status and underwriter notes. Leave Application ID blank to auto-generate.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Application ID</label>
              <input
                type="text"
                className={inputClass}
                value={form.application_id}
                onChange={(e) => handleChange('application_id', e.target.value)}
                placeholder="Auto-generated if blank"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Previous Loan History</label>
              <select
                className={inputClass}
                value={form.previous_loan_history}
                onChange={(e) => handleChange('previous_loan_history', e.target.value)}
              >
                <option value="Good Standing">Good Standing</option>
                <option value="None">None</option>
                <option value="Delayed">Delayed</option>
                <option value="Defaulted">Defaulted</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Document Verification Status
              </label>
              <select
                className={inputClass}
                value={form.document_verification}
                onChange={(e) => handleChange('document_verification', e.target.value)}
              >
                <option value="Verified">Verified</option>
                <option value="Pending">Pending</option>
                <option value="Failed">Failed</option>
              </select>
            </div>

            <div className="md:col-span-3">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Declared Employment Information
              </label>
              <input
                type="text"
                className={inputClass}
                value={form.declared_employment_info}
                onChange={(e) => handleChange('declared_employment_info', e.target.value)}
                placeholder="Role, tenure summary, and supporting employment context"
              />
            </div>

            <div className="md:col-span-3">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Additional Notes</label>
              <textarea
                rows={2}
                className={inputClass}
                value={form.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                placeholder="Optional underwriter observations"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white shadow-lg shadow-blue-600/20 disabled:opacity-60 transition-all"
          >
            <ShieldAlert className="w-4 h-4" />
            <span>{submitting ? 'Running ML & SHAP Analysis...' : 'Analyze Application'}</span>
          </button>
        </div>
      </form>

      <ExplainabilitySection selectedAppId={selectedAppId} />
    </div>
  );
}
