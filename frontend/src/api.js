async function request(path, { token, ...options } = {}) {
  let response;
  try { response = await fetch(path, { ...options, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, signal: AbortSignal.timeout(25000) }); }
  catch { throw new Error('Unable to reach the service. Please try again.'); }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.error?.message || 'The request failed. Please try again.');
    error.status = response.status;
    throw error;
  }
  return data;
}
export const api = {
  register: body => request('/api/register', { method: 'POST', body: JSON.stringify(body) }),
  login: body => request('/api/login', { method: 'POST', body: JSON.stringify(body) }),
  profile: (id, token) => request(`/api/users/${id}`, { token }),
  suggest: interests => request('/api/suggest-username', { method: 'POST', body: JSON.stringify({ interests }) }),
};
