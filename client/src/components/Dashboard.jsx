import { useCallback, useEffect, useState } from 'react'
import { api, isoDate, lastNDays } from '../api'
import HabitRow from './HabitRow'
import HabitForm from './HabitForm'
import GrowthChart from './GrowthChart'

const DAY_LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

const CHECKIN_MOODS = [
  { id: 'on-fire', label: 'On Fire',  icon: '🔥' },
  { id: 'focused', label: 'Focused',  icon: '🎯' },
  { id: 'glowing', label: 'Glowing',  icon: '✨' },
  { id: 'chill',   label: 'Chill',    icon: '😌' },
  { id: 'tired',   label: 'Tired',    icon: '😴' },
]

const NAV_ITEMS = [
  { id: 'today',   label: 'Today',    icon: '🏠' },
  { id: 'habits',  label: 'Habits',   icon: '📋' },
  { id: 'stats',   label: 'Stats',    icon: '📊' },
  { id: 'streaks', label: 'Streaks',  icon: '🔥' },
]

function SkeletonCard() {
  return (
    <div className="skeleton-card">
      <div className="skeleton-block" style={{ width: 44, height: 44, borderRadius: 12, flexShrink: 0 }} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <div className="skeleton-block" style={{ width: '40%', height: 13 }} />
        <div className="skeleton-block" style={{ width: '25%', height: 10 }} />
      </div>
      <div style={{ display: 'flex', gap: '0.3rem' }}>
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="skeleton-block" style={{ width: 30, height: 30, borderRadius: 8 }} />
        ))}
      </div>
    </div>
  )
}

function globalStreak(habits, today) {
  const allCompleted = new Set()
  for (const h of habits) {
    for (const l of h.logs) {
      if (l.status === 'COMPLETED') allCompleted.add(l.date.slice(0, 10))
    }
  }
  let streak = 0
  const d = new Date(today + 'T12:00:00')
  while (allCompleted.has(isoDate(d))) {
    streak++
    d.setDate(d.getDate() - 1)
  }
  return streak
}

export default function Dashboard({ user, onLogout }) {
  const [habits, setHabits] = useState(null)
  const [analytics, setAnalytics] = useState(null)
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [error, setError] = useState(null)
  const [mood, setMood] = useState(null)
  const [activeNav, setActiveNav] = useState('today')

  const refresh = useCallback(async () => {
    try {
      const [h, a] = await Promise.all([api.habits(), api.analytics()])
      setHabits(h.habits)
      setAnalytics(a)
      setError(null)
    } catch (err) {
      setError(err.message)
    }
  }, [])

  useEffect(() => { refresh() }, [refresh])

  async function toggle(habitId, date) {
    setHabits((hs) =>
      hs.map((h) => {
        if (h.id !== habitId) return h
        const key = `${date}T00:00:00.000Z`
        const existing = h.logs.find(
          (l) => l.date.slice(0, 10) === date && l.status === 'COMPLETED'
        )
        return {
          ...h,
          logs: existing
            ? h.logs.filter((l) => l !== existing)
            : [...h.logs, { id: `tmp-${date}`, date: key, status: 'COMPLETED' }],
        }
      })
    )
    try { await api.toggleLog(habitId, date) } catch (err) { setError(err.message) }
    refresh()
  }

  async function saveNew(form) {
    await api.createHabit(form)
    setAdding(false)
    refresh()
  }

  async function saveEdit(id, form) {
    await api.updateHabit(id, form)
    setEditingId(null)
    refresh()
  }

  async function remove(id) {
    if (!confirm('Delete this habit and all its history?')) return
    await api.deleteHabit(id)
    setEditingId(null)
    refresh()
  }

  async function logout() {
    await api.logout().catch(() => {})
    onLogout()
  }

  // Derived stats
  const today = isoDate()
  const streak = habits ? globalStreak(habits, today) : 0
  const completedToday = habits
    ? habits.filter((h) =>
        h.logs.some((l) => l.date.slice(0, 10) === today && l.status === 'COMPLETED')
      ).length
    : 0
  const totalHabits = habits?.length ?? 0
  const todayRate = totalHabits > 0 ? Math.round((completedToday / totalHabits) * 100) : 0

  // 14-day calendar
  const calDays = lastNDays(14)
  const allCompletedDates = new Set(
    (habits ?? []).flatMap((h) =>
      h.logs.filter((l) => l.status === 'COMPLETED').map((l) => l.date.slice(0, 10))
    )
  )

  const initials = user.username.slice(0, 2).toUpperCase()
  const todayLabel = new Date().toLocaleDateString(undefined, {
    weekday: 'long', month: 'long', day: 'numeric',
  })

  return (
    <>
      {/* Animated background blobs */}
      <div className="blob blob-1" />
      <div className="blob blob-2" />
      <div className="blob blob-3" />

      <div className="app-shell">
        {/* ── Sidebar ── */}
        <aside className="sidebar" id="sidebar">
          <div className="sidebar-logo">
            <div className="sidebar-logo-icon">🌱</div>
            <span className="sidebar-logo-text">HabitFlow</span>
          </div>

          <nav className="sidebar-nav">
            {NAV_ITEMS.map((item) => (
              <div
                key={item.id}
                className={`nav-item${activeNav === item.id ? ' active' : ''}`}
                onClick={() => setActiveNav(item.id)}
                id={`nav-${item.id}`}
              >
                <span className="nav-icon">{item.icon}</span>
                <span>{item.label}</span>
              </div>
            ))}
          </nav>

          <div className="sidebar-bottom">
            <div className="user-card" title={user.username}>
              <div className="user-avatar">{initials}</div>
              <div className="user-info">
                <div className="user-name">{user.username}</div>
                <div className="user-sub">Day {streak > 0 ? streak : 1} streak</div>
              </div>
            </div>
            <div className="logout-btn" id="logout-btn" onClick={logout} title="Log out">
              <span className="nav-icon">🚪</span>
              <span>Log out</span>
            </div>
          </div>
        </aside>

        {/* ── Main Content ── */}
        <main className="main-content">

          {/* Top bar */}
          <header className="topbar" id="main-header">
            <div>
              <div className="day-title">Day {streak > 0 ? streak : 1}</div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-dim)', marginTop: '0.2rem' }}>
                {todayLabel}
              </div>
            </div>
            <div className="topbar-right">
              <div className="icon-btn" title="Notifications">🔔</div>
              <div className="icon-btn" title={user.username} style={{ background: 'var(--grad-warm)', fontSize: '0.72rem', fontWeight: 700, color: '#fff', border: 'none', boxShadow: 'var(--shadow-warm)' }}>
                {initials}
              </div>
            </div>
          </header>

          {/* Check-in */}
          <div className="checkin-section">
            <div className="checkin-label">Check in</div>
            <div className="checkin-pills">
              {CHECKIN_MOODS.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  className={`checkin-pill${mood === m.id ? ' active' : ''}`}
                  onClick={() => setMood(mood === m.id ? null : m.id)}
                >
                  {m.icon} {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Phase tabs */}
          <div className="phase-tabs">
            {['Today', 'Habits', 'Stats'].map((t) => (
              <button
                key={t}
                type="button"
                className={`phase-tab${activeNav === t.toLowerCase() ? ' active' : (t === 'Today' && activeNav === 'today') ? ' active' : ''}`}
                onClick={() => setActiveNav(t.toLowerCase())}
              >
                {t}
              </button>
            ))}
          </div>

          {/* ── Page body ── */}
          <div className="page-body">

            {/* 14-day Calendar Strip */}
            <div className="calendar-section">
              <div className="calendar-strip-wrap">
                <div className="calendar-strip">
                  <div className="cal-dots">
                    {calDays.map((d) => {
                      const isDone = allCompletedDates.has(d)
                      const isToday = d === today
                      const dayIdx = new Date(`${d}T12:00:00`).getDay()
                      return (
                        <div
                          key={d}
                          className={`cal-dot${isDone ? ' done' : ''}${isToday ? ' today' : ''}`}
                          title={d}
                        >
                          {!isDone && <span style={{ fontSize: '0.6rem' }}>{DAY_LETTERS[dayIdx]}</span>}
                          {isDone && '✓'}
                        </div>
                      )
                    })}
                  </div>
                  <div className="cal-dates">
                    {calDays.map((d) => (
                      <div key={d} className={`cal-date${d === today ? ' today-num' : ''}`}>
                        {parseInt(d.slice(8), 10)}
                      </div>
                    ))}
                  </div>
                  <div className="cal-days">
                    {calDays.map((d) => (
                      <div key={d} className="cal-day-letter">
                        {DAY_LETTERS[new Date(`${d}T12:00:00`).getDay()]}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Stats strip */}
            <div className="stats-strip">
              <div className="stat-chip">
                <div className="stat-chip-icon">🔥</div>
                <div className="stat-chip-value warm">{streak}</div>
                <div className="stat-chip-label">Day streak</div>
              </div>
              <div className="stat-chip">
                <div className="stat-chip-icon">✅</div>
                <div className="stat-chip-value">{completedToday}/{totalHabits}</div>
                <div className="stat-chip-label">Done today</div>
              </div>
              <div className="stat-chip">
                <div className="stat-chip-icon">📈</div>
                <div className="stat-chip-value warm">{todayRate}%</div>
                <div className="stat-chip-label">Today rate</div>
              </div>
              <div className="stat-chip">
                <div className="stat-chip-icon">🏆</div>
                <div className="stat-chip-value">{analytics?.summary?.averageRate ?? 0}%</div>
                <div className="stat-chip-label">30-day avg</div>
              </div>
            </div>

            {error && (
              <div className="error-msg error-global" role="alert">
                <span>⚠️</span> {error}
              </div>
            )}

            {/* 2-column grid: habits + chart */}
            <div className="content-grid">

              {/* Left — habit list */}
              <div id="habits-section">
                <div className="section-label">📋 Your habits</div>
                <div className="habit-list">
                  {habits === null ? (
                    <><SkeletonCard /><SkeletonCard /><SkeletonCard /></>
                  ) : habits.length === 0 && !adding ? (
                    <div className="empty-state">
                      <div className="empty-icon">🌟</div>
                      <div className="empty-title">No habits yet</div>
                      <div className="empty-desc">Add your first habit below to start your streak!</div>
                    </div>
                  ) : (
                    habits.map((h) =>
                      editingId === h.id ? (
                        <HabitForm
                          key={h.id}
                          habit={h}
                          onSave={(form) => saveEdit(h.id, form)}
                          onCancel={() => setEditingId(null)}
                          onDelete={() => remove(h.id)}
                        />
                      ) : (
                        <HabitRow
                          key={h.id}
                          habit={h}
                          onToggle={toggle}
                          onEdit={() => setEditingId(h.id)}
                        />
                      )
                    )
                  )}

                  {adding ? (
                    <HabitForm onSave={saveNew} onCancel={() => setAdding(false)} />
                  ) : (
                    <button
                      type="button"
                      id="add-habit-btn"
                      className="btn-add"
                      onClick={() => setAdding(true)}
                    >
                      <span style={{ fontSize: '1.1rem' }}>＋</span>
                      Add new habit
                    </button>
                  )}
                </div>
              </div>

              {/* Right — chart panel */}
              <div className="right-panel" id="growth-section">
                <GrowthChart analytics={analytics} />
              </div>
            </div>
          </div>

          {/* Mobile bottom tab bar */}
          <nav className="mobile-tab-bar">
            {NAV_ITEMS.slice(0, 2).map((item) => (
              <div
                key={item.id}
                className={`tab-item${activeNav === item.id ? ' active' : ''}`}
                onClick={() => setActiveNav(item.id)}
              >
                <span className="tab-icon">{item.icon}</span>
                <span>{item.label}</span>
              </div>
            ))}
            <div className="tab-center" onClick={() => setAdding(true)}>＋</div>
            {NAV_ITEMS.slice(2).map((item) => (
              <div
                key={item.id}
                className={`tab-item${activeNav === item.id ? ' active' : ''}`}
                onClick={() => setActiveNav(item.id)}
              >
                <span className="tab-icon">{item.icon}</span>
                <span>{item.label}</span>
              </div>
            ))}
          </nav>
        </main>
      </div>
    </>
  )
}
