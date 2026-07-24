import { lastNDays, isoDate } from '../api'

const DAY_ABBREVS = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA']

function getHabitEmoji(name) {
  const n = name.toLowerCase()
  if (/run|jog|walk|step/.test(n)) return '🏃'
  if (/gym|lift|workout|exercise|fitness/.test(n)) return '💪'
  if (/read|book/.test(n)) return '📚'
  if (/meditat|breath|mindful/.test(n)) return '🧘'
  if (/water|drink|hydrat/.test(n)) return '💧'
  if (/sleep|bed|rest/.test(n)) return '😴'
  if (/journal|write|diary/.test(n)) return '✍️'
  if (/cook|eat|diet|food|meal/.test(n)) return '🥗'
  if (/code|program|dev/.test(n)) return '💻'
  if (/music|guitar|piano|sing/.test(n)) return '🎵'
  if (/yoga|stretch/.test(n)) return '🤸'
  if (/vitamin|medicine|pill/.test(n)) return '💊'
  return '⭐'
}

function currentStreak(logs, today) {
  const completed = new Set(
    logs.filter((l) => l.status === 'COMPLETED').map((l) => l.date.slice(0, 10))
  )
  let streak = 0
  const d = new Date(today + 'T12:00:00')
  while (true) {
    const key = isoDate(d)
    if (!completed.has(key)) break
    streak++
    d.setDate(d.getDate() - 1)
  }
  return streak
}

export default function HabitRow({ habit, onToggle, onEdit }) {
  const days = lastNDays(7)
  const today = isoDate()
  const emoji = getHabitEmoji(habit.name)

  const completed = new Set(
    habit.logs.filter((l) => l.status === 'COMPLETED').map((l) => l.date.slice(0, 10))
  )

  const streak = currentStreak(habit.logs, today)

  return (
    <div className="habit-card">
      <div className="habit-emoji">{emoji}</div>

      <div className="habit-info">
        <div className="habit-name">{habit.name}</div>
        <div className="habit-meta">
          <span className={`habit-badge ${habit.frequency === 'WEEKLY' ? 'weekly' : 'daily'}`}>
            {habit.frequency === 'WEEKLY' ? '📅 Weekly' : '🔁 Daily'}
          </span>
          {streak > 0 && (
            <span className="habit-badge streak">
              🔥 {streak}d
            </span>
          )}
        </div>
      </div>

      {/* Mini 7-day grid */}
      <div className="mini-days">
        {days.map((d) => {
          const isDone = completed.has(d)
          const isToday = d === today
          const dayIdx = new Date(`${d}T12:00:00`).getDay()
          return (
            <button
              key={d}
              type="button"
              id={`habit-${habit.id}-day-${d}`}
              className={`mini-day${isDone ? ' done' : ''}${isToday ? ' today' : ''}`}
              title={`${d}${isDone ? ' · ✓' : ''}`}
              onClick={() => onToggle(habit.id, d)}
              aria-label={`${d} ${isDone ? 'completed' : 'not completed'}`}
            >
              {!isDone && DAY_ABBREVS[dayIdx][0]}
            </button>
          )
        })}
      </div>

      <button
        type="button"
        id={`habit-${habit.id}-edit`}
        className="habit-edit-btn"
        onClick={onEdit}
        title="Edit"
        aria-label={`Edit ${habit.name}`}
      >
        ✏️
      </button>
    </div>
  )
}
