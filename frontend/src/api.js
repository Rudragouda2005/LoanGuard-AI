const API_BASE = '/api';

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const err = await res.json();
      message = err.detail || message;
    } catch {
      // ignore parse errors
    }
    throw new Error(message);
  }
  return res.json();
}

export const api = {
  getHealth: () => request('/health'),
  getDashboard: () => request('/dashboard'),
  getDemoPresets: () => request('/demo-presets'),
  analyzeApplication: (payload) =>
    request('/analyze', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getApplications: (params = {}) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') qs.append(k, v);
    });
    const query = qs.toString();
    return request(`/applications${query ? `?${query}` : ''}`);
  },
  getApplicationDetail: (id) => request(`/applications/${encodeURIComponent(id)}`),
  updateApplicationStatus: (id, status, reviewerToken) =>
    request(`/applications/${encodeURIComponent(id)}/status`, {
      method: 'PATCH',
      headers: reviewerToken ? { 'X-Reviewer-Token': reviewerToken } : {},
      body: JSON.stringify({
        investigation_status: status,
        reviewer_token: reviewerToken || undefined,
      }),
    }),
  getAnalytics: (params = {}) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') qs.append(k, v);
    });
    const query = qs.toString();
    return request(`/analytics${query ? `?${query}` : ''}`);
  },
  getModelPerformance: () => request('/model-performance'),
  getFairness: () => request('/fairness'),
  verifyReviewerToken: (token) =>
    request('/auth/verify', {
      method: 'POST',
      body: JSON.stringify({ token }),
    }),
  getPdfUrl: (id) => `${API_BASE}/applications/${encodeURIComponent(id)}/report.pdf`,
  getCsvExportUrl: (params = {}) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') qs.append(k, v);
    });
    const query = qs.toString();
    return `${API_BASE}/applications/export/csv${query ? `?${query}` : ''}`;
  },
};
