import { useState } from 'react'
import { api } from '../api'

export default function Auth({ onAuthed }) {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      const { user } =
        mode === 'login'
          ? await api.login(email, password)
          : await api.signup(email, username, password)
      onAuthed(user)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  function switchMode() {
    setMode(mode === 'login' ? 'signup' : 'login')
    setError(null)
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon">🌱</div>
          <span className="auth-logo-text">HabitFlow</span>
        </div>

        <h1 className="auth-heading">
          {mode === 'login' ? 'Welcome back' : 'Begin your streak'}
        </h1>
        <p className="auth-subheading">
          {mode === 'login'
            ? 'Log in and pick up where you left off.'
            : 'Build powerful habits, one day at a time.'}
        </p>

        <form className="auth-fields" onSubmit={submit} id="auth-form">
          <div className="field-group">
            <label className="field-label" htmlFor="auth-email">
              {mode === 'login' ? 'Email or username' : 'Email'}
            </label>
            <input
              id="auth-email"
              type={mode === 'login' ? 'text' : 'email'}
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus
              required
            />
          </div>

          {mode === 'signup' && (
            <div className="field-group">
              <label className="field-label" htmlFor="auth-username">Username</label>
              <input
                id="auth-username"
                placeholder="cooluser_42"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                pattern="[a-zA-Z0-9_]{3,30}"
                title="3–30 characters: letters, numbers, underscores"
                required
              />
            </div>
          )}

          <div className="field-group">
            <label className="field-label" htmlFor="auth-password">Password</label>
            <input
              id="auth-password"
              type="password"
              placeholder={mode === 'signup' ? 'At least 8 characters' : '••••••••'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={mode === 'signup' ? 8 : undefined}
              required
            />
          </div>

          {error && (
            <div className="error-msg" role="alert">
              <span>⚠️</span> {error}
            </div>
          )}

          <button
            id="auth-submit"
            className="btn-primary"
            type="submit"
            disabled={busy}
            style={{ marginTop: '0.5rem' }}
          >
            {busy ? <span className="spinner" /> : null}
            {mode === 'login' ? 'Log in' : 'Create account'}
          </button>
        </form>

        <div className="auth-switch">
          {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}
          <button id="auth-switch-btn" type="button" onClick={switchMode}>
            {mode === 'login' ? ' Sign up' : ' Log in'}
          </button>
        </div>
      </div>
    </div>
  )
}
