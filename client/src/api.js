const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function request(path, { method = 'GET', body, token } = {}) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(
      'Cannot reach the API. Make sure the backend is running on port 5000.',
      0
    );
  }

  const text = await response.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }
  }

  if (!response.ok) {
    throw new ApiError(
      data?.error || `Request failed with status ${response.status}`,
      response.status
    );
  }

  return data;
}

export const api = {
  login: (email, password) =>
    request('/api/auth/login', { method: 'POST', body: { email, password } }),
  today: (token) => request('/api/quizzes/today', { token }),
  history: (token) => request('/api/quizzes?limit=100', { token }),
  generate: (token) =>
    request('/api/quizzes/generate', { method: 'POST', token }),
  update: (token, id, fields) =>
    request(`/api/quizzes/${id}`, {
      method: 'PATCH',
      body: fields,
      token,
    }),
  setStatus: (token, id, status) =>
    request(`/api/quizzes/${id}/status`, {
      method: 'PATCH',
      body: { status },
      token,
    }),
};
