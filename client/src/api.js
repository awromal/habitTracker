// Thin fetch wrapper. The Vite proxy makes /api same-origin, so the
// HTTP-only auth cookie travels automatically.
async function request(path, options = {}) {
  const res = await fetch(`/api${path}`, {
    headers: options.body ? { 'Content-Type': 'application/json' } : undefined,
    credentials: 'include',
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err = new Error(data.error || `Request failed (${res.status})`)
    err.status = res.status
    throw err
  }
  return data
}

export const api = {
  signup: (email, username, password) =>
    request('/auth/signup', { method: 'POST', body: { email, username, password } }),
  login: (identifier, password) =>
    request('/auth/login', { method: 'POST', body: { identifier, password } }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  me: () => request('/auth/me'),

  habits: () => request('/habits'),
  createHabit: (data) => request('/habits', { method: 'POST', body: data }),
  updateHabit: (id, data) => request(`/habits/${id}`, { method: 'PUT', body: data }),
  deleteHabit: (id) => request(`/habits/${id}`, { method: 'DELETE' }),

  toggleLog: (habitId, date, status) =>
    request('/logs', { method: 'POST', body: { habitId, date, status } }),

  analytics: () => request('/analytics'),
}

// Local calendar date as YYYY-MM-DD (not UTC — the user logs "their" today).
export function isoDate(d = new Date()) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function lastNDays(n) {
  const days = []
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    days.push(isoDate(d))
  }
  return days
}
