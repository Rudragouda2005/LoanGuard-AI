import React, { useState } from 'react';
import { KeyRound, ShieldCheck, ShieldAlert } from 'lucide-react';
import { api } from '../api';

export default function SettingsPage({
  reviewerToken,
  setReviewerToken,
  reviewerAuthorized,
  setReviewerAuthorized,
}) {
  const [tokenInput, setTokenInput] = useState(reviewerToken || '');
  const [message, setMessage] = useState('');

  const handleVerify = async (e) => {
    e.preventDefault();
    setMessage('');
    try {
      const res = await api.verifyReviewerToken(tokenInput);
      if (res.authorized) {
        setReviewerToken(tokenInput);
        setReviewerAuthorized(true);
        setMessage('Authorized Senior Underwriter access enabled.');
      } else {
        setReviewerToken('');
        setReviewerAuthorized(false);
        setMessage('Invalid token. Access remains Standard Analyst.');
      }
    } catch (err) {
      setMessage(err.message);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Platform Settings &amp; Reviewer Access</h1>
        <p className="text-sm text-slate-500 mt-1">
          Configure underwriter authorization required to mark applications as Confirmed Fraud.
        </p>
      </div>

      <div className="card-surface p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Authorized Reviewer Authentication</h3>
            <p className="text-xs text-slate-500">
              Enter the reviewer access token configured in your server environment variables.
            </p>
          </div>
        </div>

        <form onSubmit={handleVerify} className="flex flex-col sm:flex-row gap-3">
          <input
            type="password"
            value={tokenInput}
            onChange={(e) => setTokenInput(e.target.value)}
            placeholder="Enter reviewer token..."
            className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
          />
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white"
          >
            Verify Access
          </button>
        </form>

        <div className="flex items-center gap-2 text-xs font-medium">
          {reviewerAuthorized ? (
            <>
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span className="text-emerald-700">
                Current Role: Authorized Senior Underwriter (can confirm fraud)
              </span>
            </>
          ) : (
            <>
              <ShieldAlert className="w-4 h-4 text-amber-600" />
              <span className="text-amber-700">
                Current Role: Standard Analyst (cannot mark Confirmed Fraud)
              </span>
            </>
          )}
        </div>

        {message && (
          <div className="p-3 rounded-xl bg-slate-100 text-slate-800 text-xs font-medium">
            {message}
          </div>
        )}
      </div>
    </div>
  );
}
